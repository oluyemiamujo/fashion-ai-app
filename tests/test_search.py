"""
Unit tests for the cosine similarity search implementation.

These tests exercise services/similarity.py directly, replacing the previous
pgvector SQL query tests.
"""
import math
import sys
from pathlib import Path

import pytest

# Make the backend importable without installing it as a package.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "app" / "backend"))

from services.similarity import cosine_similarity


# ── cosine_similarity ─────────────────────────────────────────────────────────

def test_identical_vectors_return_one():
    vec = [0.1, 0.5, -0.3, 0.8]
    assert math.isclose(cosine_similarity(vec, vec), 1.0, abs_tol=1e-6)


def test_orthogonal_vectors_return_zero():
    a = [1.0, 0.0]
    b = [0.0, 1.0]
    assert math.isclose(cosine_similarity(a, b), 0.0, abs_tol=1e-6)


def test_opposite_vectors_return_minus_one():
    a = [1.0, 2.0, 3.0]
    b = [-1.0, -2.0, -3.0]
    assert math.isclose(cosine_similarity(a, b), -1.0, abs_tol=1e-6)


def test_zero_vector_returns_zero():
    """A zero-norm vector should not cause a division-by-zero error."""
    a = [0.0, 0.0, 0.0]
    b = [1.0, 0.5, 0.2]
    assert cosine_similarity(a, b) == 0.0


def test_similar_vectors_score_higher_than_dissimilar():
    query   = [1.0, 1.0, 0.0]
    similar = [0.9, 1.1, 0.1]   # points in roughly the same direction
    dissimilar = [-1.0, -1.0, 0.0]  # opposite direction
    assert cosine_similarity(query, similar) > cosine_similarity(query, dissimilar)


def test_returns_float():
    result = cosine_similarity([0.3, 0.4], [0.5, 0.6])
    assert isinstance(result, float)


# ── search ranking helper ─────────────────────────────────────────────────────

def rank_by_similarity(query_embedding: list[float], garment_embeddings: list[list[float]]) -> list[int]:
    """Mirrors the ranking logic used in api/search.py."""
    scored = [(i, cosine_similarity(query_embedding, emb)) for i, emb in enumerate(garment_embeddings)]
    scored.sort(key=lambda x: x[1], reverse=True)
    return [i for i, _ in scored]


def test_ranking_puts_best_match_first():
    query    = [1.0, 0.0, 0.0]
    best     = [1.0, 0.0, 0.0]   # identical → score 1.0
    mediocre = [0.5, 0.5, 0.0]
    worst    = [-1.0, 0.0, 0.0]  # opposite → score -1.0

    ranked = rank_by_similarity(query, [worst, mediocre, best])
    # best is at index 2 in the input list
    assert ranked[0] == 2


def test_ranking_top_n():
    query = [1.0, 0.0]
    embeddings = [[1.0, 0.0], [0.0, 1.0], [-1.0, 0.0], [0.5, 0.5]]
    top2 = rank_by_similarity(query, embeddings)[:2]
    # index 0 ([1,0]) and index 3 ([0.5,0.5]) should be the top 2
    assert set(top2) == {0, 3}
