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
    "You are a professional fashion analyst with deep expertise in global garment trends, "
    "materials, and styling. Analyze the provided garment image and return ONLY a valid JSON "
    "object — no markdown, no explanations."
)

USER_PROMPT = """Analyze this garment image and return a JSON object with exactly these keys:

{
  "description": "Detailed natural-language description of the garment",
  "garment_type": "e.g. dress, jacket, trousers, shirt, skirt, coat, suit, accessories",
  "style": "e.g. casual, formal, streetwear, bohemian, minimalist, avant-garde",
  "material": "e.g. cotton, silk, denim, leather, wool, synthetic blend",
  "color_palette": "e.g. monochrome black, earth tones, pastel pink and white",
  "pattern": "e.g. solid, floral, striped, geometric, abstract, plaid",
  "season": "e.g. spring/summer, autumn/winter, all-season",
  "occasion": "e.g. everyday, workwear, evening, sportswear, beachwear",
  "consumer_profile": "e.g. young professional, teen, luxury buyer, athleisure enthusiast",
  "trend_notes": "Brief notes on current trend relevance or cultural influences",
  "continent": "Inferred or likely continent of origin/style influence",
  "country": "Inferred or likely country",
  "city": "Inferred or likely city style influence, e.g. Paris, Tokyo, Milan"
}

Return ONLY the JSON. Do not wrap in markdown code blocks."""


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
        max_tokens=1024,
        temperature=0.2,
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
