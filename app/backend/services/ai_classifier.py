"""
AI garment classification using OpenAI Vision (gpt-4o).

Resilience strategy
-------------------
* Up to 3 attempts with exponential back-off (2 s → 8 s) on transient
  OpenAI errors: RateLimitError, APITimeoutError, InternalServerError,
  APIConnectionError.
* Non-retryable errors (AuthenticationError, bad JSON, etc.) surface
  immediately as AIServiceError so callers receive a consistent contract.
* The caller (upload.py) maps AIServiceError → HTTP 502 and never lets
  an unhandled exception bubble to the ASGI layer.
"""
from dotenv import load_dotenv
import base64
import json
import logging
import os
from pathlib import Path

from openai import (
    APIConnectionError,
    APITimeoutError,
    AuthenticationError,
    InternalServerError,
    OpenAI,
    RateLimitError,
)
from tenacity import (
    retry,
    retry_if_exception_type,
    stop_after_attempt,
    wait_exponential,
    before_sleep_log,
)

logger = logging.getLogger(__name__)

load_dotenv(override=True)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

# ── Custom exception ──────────────────────────────────────────────────────────

class AIServiceError(Exception):
    """Raised when the AI classification pipeline fails unrecoverably."""


# ── Transient errors that are safe to retry ───────────────────────────────────

_RETRYABLE = (RateLimitError, APITimeoutError, APIConnectionError, InternalServerError)

SYSTEM_PROMPT = (
    "You are a senior fashion analyst and trend forecaster with deep expertise in global garment "
    "design, textile science, cultural style geography, and runway-to-retail dynamics. "
    "Your task is to examine the provided garment image with precision and return ONLY a valid "
    "JSON object — no markdown fences, no explanatory text, no commentary outside the JSON."
)

USER_PROMPT = """Examine this garment image in full detail and return a single JSON object with exactly these keys.

IMPORTANT RULES:
- "description" must be a rich, editorial-quality paragraph of 3–5 sentences. Cover silhouette, construction details, fabric drape, colour story, cultural or historical references, and how the piece might be worn or styled. Write as a fashion editor would for a magazine feature — not a product listing.
- All other string values must be concise, specific, and lowercase (except proper nouns).
- Never return null or empty strings. If something is genuinely uncertain, make the most informed inference possible and mark it with a trailing " (inferred)".
- "color_palette" should name 1–4 dominant colours in natural descriptive language (e.g. "ivory, dusty rose, charcoal").
- "consumer_profile" should describe the target wearer in one sentence: lifestyle, age range, sensibility.
- "trend_notes" should connect the garment to current or emerging macro trends, cultural movements, or historical revival cycles — 2–3 sentences.
- "continent", "country", "city" refer to the style origin or strongest cultural influence visible in the garment — not necessarily where the photo was taken.

{
  "description": "<rich editorial paragraph>",
  "garment_type": "<specific type: e.g. wrap dress, bomber jacket, wide-leg trousers, blazer, maxi skirt>",
  "style": "<aesthetic category: e.g. minimalist, bohemian, streetwear, haute couture, utility, romantic>",
  "material": "<primary fabric(s): e.g. silk charmeuse, heavyweight denim, boiled wool, technical nylon>",
  "color_palette": "<1–4 named colours>",
  "pattern": "<surface design: e.g. solid, houndstooth, digital floral print, tie-dye, jacquard>",
  "season": "<one of: spring/summer | autumn/winter | resort | all-season>",
  "occasion": "<primary use context: e.g. everyday, workwear, evening, beachwear, activewear, red carpet>",
  "consumer_profile": "<one-sentence wearer portrait>",
  "trend_notes": "<2–3 sentences on trend positioning>",
  "continent": "<style-origin continent>",
  "country": "<style-origin country>",
  "city": "<style-origin city or fashion capital>"
}

Return ONLY the JSON object. No markdown. No preamble."""


def _encode_image(image_path: str) -> str:
    """Base64-encode a local image file."""
    with open(image_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")


def _get_mime_type(image_path: str) -> str:
    suffix = Path(image_path).suffix.lower()
    return {
        ".jpg": "image/jpeg",
        ".jpeg": "image/jpeg",
        ".png": "image/png",
        ".webp": "image/webp",
        ".gif": "image/gif",
    }.get(suffix, "image/jpeg")


# ── Retryable OpenAI call ─────────────────────────────────────────────────────

@retry(
    retry=retry_if_exception_type(_RETRYABLE),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def _call_openai_vision(b64: str, mime: str) -> str:
    """
    Make the OpenAI Vision API call.
    Retried automatically on transient errors (rate-limit, timeout, server error).
    Returns the raw content string from the model.
    """
    response = client.chat.completions.create(
        model="gpt-4o",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}", "detail": "high"},
                    },
                    {"type": "text", "text": USER_PROMPT},
                ],
            },
        ],
        max_tokens=1500,
        temperature=0.3,
    )
    return response.choices[0].message.content.strip()


# ── Public interface ──────────────────────────────────────────────────────────

def classify_image(image_path: str) -> dict:
    """
    Classify a garment image with OpenAI Vision and return structured metadata.

    Raises:
        AIServiceError: on authentication failure, exhausted retries, or
                        non-JSON model response — callers should not let this
                        propagate further than the API route handler.
    """
    b64 = _encode_image(image_path)
    mime = _get_mime_type(image_path)

    try:
        raw = _call_openai_vision(b64, mime)
    except AuthenticationError as exc:
        raise AIServiceError("OpenAI authentication failed — check OPENAI_API_KEY.") from exc
    except _RETRYABLE as exc:
        # All retries exhausted
        raise AIServiceError(f"OpenAI Vision unavailable after retries: {exc}") from exc
    except Exception as exc:
        raise AIServiceError(f"Unexpected error during AI classification: {exc}") from exc

    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise AIServiceError(f"AI returned non-JSON response: {raw[:200]}") from exc
