"""
Embedding generation using OpenAI text-embedding-3-small (1536 dims).
"""
import os
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

EMBEDDING_MODEL = "text-embedding-3-small"


def generate_embedding(text: str) -> list[float]:
    """
    Generate a 1536-dimensional embedding vector for the given text.

    Args:
        text: The text to embed. Typically a garment description or search query.

    Returns:
        List of floats representing the embedding vector.
    """
    text = text.strip().replace("\n", " ")
    if not text:
        raise ValueError("Cannot generate embedding for empty text.")

    response = client.embeddings.create(
        model=EMBEDDING_MODEL,
        input=text,
    )
    return response.data[0].embedding
