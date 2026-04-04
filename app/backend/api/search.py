"""
GET /api/search?q=...

Converts the query string to an embedding, then scores every garment in the
database using cosine similarity computed in Python.

For simplicity and ease of local setup, embeddings are stored in SQLite and
semantic search is implemented using cosine similarity in Python. In a
production system, a vector database such as PostgreSQL with pgvector would
be used.

Design note: With a small dataset (50–100 garments) loading all embeddings
into memory at query time is acceptable; no SQL vector extension is required.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Garment
from services import generate_embedding, cosine_similarity

router = APIRouter()


@router.get("/search")
def search_images(
    q: str = Query(..., min_length=1, description="Natural-language search query"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Semantic search using cosine similarity.
    Returns garments ordered by descending similarity to the query embedding.
    """
    # 1. Convert query to embedding
    try:
        query_embedding = generate_embedding(q)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Embedding failed: {exc}") from exc

    # 2. Load all garments that have a stored embedding.
    #    For a small dataset (50–100 items) this is perfectly acceptable in memory.
    garments = db.query(Garment).filter(Garment.embedding.isnot(None)).all()

    # 3. Score each garment against the query embedding
    scored = []
    for garment in garments:
        score = cosine_similarity(query_embedding, garment.embedding)
        scored.append((garment, score))

    # 4. Sort by descending similarity and keep the top `limit` results
    scored.sort(key=lambda x: x[1], reverse=True)
    top = scored[:limit]

    # 5. Serialise results
    results = [
        {
            "id": g.id,
            "image_url": g.image_url,
            "description": g.description,
            "garment_type": g.garment_type,
            "style": g.style,
            "material": g.material,
            "color_palette": g.color_palette,
            "pattern": g.pattern,
            "season": g.season,
            "occasion": g.occasion,
            "consumer_profile": g.consumer_profile,
            "trend_notes": g.trend_notes,
            "continent": g.continent,
            "country": g.country,
            "city": g.city,
            "year": g.year,
            "month": g.month,
            "designer": g.designer,
            "created_at": g.created_at.isoformat() if g.created_at else None,
            "similarity_score": round(score, 4),
        }
        for g, score in top
    ]

    return {"query": q, "results": results}
