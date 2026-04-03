"""
AI garment classification using OpenAI Vision (gpt-4o).
"""
import base64
import json
import os
from pathlib import Path

from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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


def classify_image(image_path: str) -> dict:
    """
    Send a garment image to OpenAI Vision and return structured metadata as a dict.
    Raises ValueError if the AI response cannot be parsed.
    """
    b64 = _encode_image(image_path)
    mime = _get_mime_type(image_path)

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

    raw = response.choices[0].message.content.strip()

    # Strip accidental markdown fences
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()

    try:
        return json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"AI returned non-JSON response: {raw[:200]}") from exc
