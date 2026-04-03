"""
Cosine similarity utility for in-memory semantic search.

For simplicity and ease of local setup, embeddings are stored in SQLite and
semantic search is implemented using cosine similarity in Python. In a
production system, a vector database such as PostgreSQL with pgvector would
be used.

Design note: With a small dataset (50–100 garments) loading all embeddings
into memory and computing similarity in Python is perfectly acceptable and
avoids the operational overhead of a dedicated vector store.
"""
import numpy as np


def cosine_similarity(a: list[float], b: list[float]) -> float:
    """
    Compute cosine similarity between two embedding vectors.

    Args:
        a: Query embedding as a list of floats.
        b: Stored garment embedding as a list of floats.

    Returns:
        Float in [-1, 1]; higher means more similar.
    """
    vec_a = np.array(a, dtype=np.float32)
    vec_b = np.array(b, dtype=np.float32)
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a == 0 or norm_b == 0:
        return 0.0
    return float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
