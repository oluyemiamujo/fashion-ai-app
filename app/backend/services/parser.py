"""
Parser / validator for AI classifier output.
Ensures all expected keys exist; fills missing ones with sensible defaults.
"""
from typing import Any

EXPECTED_KEYS: dict[str, Any] = {
    "description": "",
    "garment_type": "unknown",
    "style": "unknown",
    "material": "unknown",
    "color_palette": "unknown",
    "pattern": "unknown",
    "season": "all-season",
    "occasion": "everyday",
    "consumer_profile": "general",
    "trend_notes": "",
    "continent": "unknown",
    "country": "unknown",
    "city": "unknown",
}


def parse_ai_response(raw: dict) -> dict:
    """
    Validate and normalise the AI classifier output.

    - All expected keys are guaranteed to be present in the returned dict.
    - Values that are None or empty strings are replaced with the default.
    - Extra keys returned by the AI are preserved.
    """
    result: dict[str, Any] = {}

    for key, default in EXPECTED_KEYS.items():
        value = raw.get(key)
        if value is None or (isinstance(value, str) and value.strip() == ""):
            result[key] = default
        else:
            result[key] = value

    # Preserve any additional keys the AI may have included
    for key, value in raw.items():
        if key not in result:
            result[key] = value

    return result
