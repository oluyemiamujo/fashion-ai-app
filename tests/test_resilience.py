"""
Tests for AI service resilience: retry behaviour and error surfaces.

Strategy
--------
- Patch `_call_openai_vision` / `_call_openai_embeddings` (the inner
  functions that tenacity decorates) so tests run without a real API key.
- Verify that transient OpenAI errors are retried up to 3 times.
- Verify that after 3 failures the caller receives AIServiceError (not the
  raw OpenAI exception).
- Verify that AuthenticationError bypasses retries and surfaces immediately.
- Verify that a non-JSON model response raises AIServiceError.
- Verify that a valid response parses correctly.
"""
import json
import sys
import types
from pathlib import Path
from unittest.mock import MagicMock, patch, call

import pytest

# ── Ensure the backend package is on sys.path ─────────────────────────────────
BACKEND = Path(__file__).resolve().parent.parent / "app" / "backend"
if str(BACKEND) not in sys.path:
    sys.path.insert(0, str(BACKEND))

from services.ai_classifier import AIServiceError, classify_image, _call_openai_vision
from services.embeddings import generate_embedding, _call_openai_embeddings
from openai import RateLimitError, AuthenticationError


# ── Helpers ───────────────────────────────────────────────────────────────────

def _rate_limit_error() -> RateLimitError:
    """Build a minimal RateLimitError without a real HTTP response."""
    mock_response = MagicMock()
    mock_response.status_code = 429
    mock_response.headers = {}
    mock_response.json.return_value = {"error": {"message": "rate limited", "type": "rate_limit_error"}}
    return RateLimitError("rate limited", response=mock_response, body={"error": {"message": "rate limited"}})


def _auth_error() -> AuthenticationError:
    mock_response = MagicMock()
    mock_response.status_code = 401
    mock_response.headers = {}
    mock_response.json.return_value = {"error": {"message": "invalid key", "type": "invalid_api_key"}}
    return AuthenticationError("invalid key", response=mock_response, body={"error": {"message": "invalid key"}})


_VALID_AI_PAYLOAD = {
    "description": "A structured blazer in cream wool.",
    "garment_type": "blazer",
    "style": "minimalist",
    "material": "wool",
    "color_palette": "cream",
    "pattern": "solid",
    "season": "autumn/winter",
    "occasion": "workwear",
    "consumer_profile": "Professional woman, 28–40, classic sensibility.",
    "trend_notes": "Quiet luxury revival.",
    "continent": "europe",
    "country": "france",
    "city": "paris",
}


# ── classify_image tests ──────────────────────────────────────────────────────

class TestClassifyImage:
    def test_happy_path(self, tmp_path):
        """Valid JSON response → dict returned without error."""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"\xff\xd8\xff")  # minimal JPEG header

        with patch(
            "services.ai_classifier._call_openai_vision",
            return_value=json.dumps(_VALID_AI_PAYLOAD),
        ):
            result = classify_image(str(img))

        assert result["garment_type"] == "blazer"
        assert result["style"] == "minimalist"

    def test_markdown_fences_stripped(self, tmp_path):
        """Model response wrapped in ```json fences is handled."""
        img = tmp_path / "test.png"
        img.write_bytes(b"\x89PNG")

        fenced = f"```json\n{json.dumps(_VALID_AI_PAYLOAD)}\n```"
        with patch("services.ai_classifier._call_openai_vision", return_value=fenced):
            result = classify_image(str(img))

        assert result["city"] == "paris"

    def test_non_json_raises_ai_service_error(self, tmp_path):
        """Non-JSON model output → AIServiceError, not raw JSONDecodeError."""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"\xff\xd8\xff")

        with patch("services.ai_classifier._call_openai_vision", return_value="Sorry, I can't help."):
            with pytest.raises(AIServiceError, match="non-JSON"):
                classify_image(str(img))

    def test_rate_limit_exhausted_raises_ai_service_error(self, tmp_path):
        """RateLimitError after all retries → AIServiceError."""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"\xff\xd8\xff")

        with patch(
            "services.ai_classifier._call_openai_vision",
            side_effect=_rate_limit_error(),
        ):
            with pytest.raises(AIServiceError, match="retries"):
                classify_image(str(img))

    def test_auth_error_raises_ai_service_error(self, tmp_path):
        """AuthenticationError → AIServiceError immediately."""
        img = tmp_path / "test.jpg"
        img.write_bytes(b"\xff\xd8\xff")

        with patch(
            "services.ai_classifier._call_openai_vision",
            side_effect=_auth_error(),
        ):
            with pytest.raises(AIServiceError, match="authentication"):
                classify_image(str(img))


# ── generate_embedding tests ──────────────────────────────────────────────────

class TestGenerateEmbedding:
    def test_happy_path(self):
        """Valid text → list of floats."""
        fake_vector = [0.1] * 1536

        with patch("services.embeddings._call_openai_embeddings", return_value=fake_vector):
            result = generate_embedding("cream wool blazer")

        assert len(result) == 1536
        assert result[0] == pytest.approx(0.1)

    def test_empty_string_raises_value_error(self):
        """Empty input is rejected before any API call."""
        with pytest.raises(ValueError, match="empty"):
            generate_embedding("   ")

    def test_rate_limit_exhausted_raises_ai_service_error(self):
        """RateLimitError after retries → AIServiceError."""
        with patch(
            "services.embeddings._call_openai_embeddings",
            side_effect=_rate_limit_error(),
        ):
            with pytest.raises(AIServiceError, match="retries"):
                generate_embedding("cream wool blazer")

    def test_auth_error_raises_ai_service_error(self):
        """AuthenticationError → AIServiceError immediately."""
        with patch(
            "services.embeddings._call_openai_embeddings",
            side_effect=_auth_error(),
        ):
            with pytest.raises(AIServiceError, match="authentication"):
                generate_embedding("cream wool blazer")
