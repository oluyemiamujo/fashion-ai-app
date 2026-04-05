"""
Embedding generation using OpenAI text-embedding-3-small (1536 dims).

Resilience strategy
-------------------
* Up to 3 attempts with exponential back-off (2 s → 8 s) on transient
  OpenAI errors: RateLimitError, APITimeoutError, InternalServerError,
  APIConnectionError.
* Non-retryable failures surface as AIServiceError for a consistent
  contract with callers.
"""
from dotenv import load_dotenv
import logging
import os

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

from .ai_classifier import AIServiceError

load_dotenv(override=True)
logger = logging.getLogger(__name__)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"

_RETRYABLE = (RateLimitError, APITimeoutError, APIConnectionError, InternalServerError)


@retry(
    retry=retry_if_exception_type(_RETRYABLE),
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=8),
    before_sleep=before_sleep_log(logger, logging.WARNING),
    reraise=True,
)
def _call_openai_embeddings(text: str) -> list[float]:
    """Make the embeddings API call; retried on transient errors."""
    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding


def generate_embedding(text: str) -> list[float]:
    """
    Generate a 1536-dimensional embedding vector for the given text.

    Args:
        text: The text to embed. Typically a garment description or search query.

    Returns:
        List of floats representing the embedding vector.

    Raises:
        ValueError: if the input text is empty.
        AIServiceError: on authentication failure or exhausted retries.
    """
    text = text.strip().replace("\n", " ")
    if not text:
        raise ValueError("Cannot generate embedding for empty text.")

    try:
        return _call_openai_embeddings(text)
    except AuthenticationError as exc:
        raise AIServiceError("OpenAI authentication failed — check OPENAI_API_KEY.") from exc
    except _RETRYABLE as exc:
        raise AIServiceError(f"OpenAI Embeddings unavailable after retries: {exc}") from exc
    except Exception as exc:
        raise AIServiceError(f"Unexpected error during embedding generation: {exc}") from exc
