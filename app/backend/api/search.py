"""
GET /api/search?q=...

Converts the query string to an embedding, then performs
pgvector cosine-distance similarity search against stored garment embeddings.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import get_db
from services import generate_embedding

router = APIRouter()


@router.get("/search")
def search_images(
    q: str = Query(..., min_length=1, description="Natural-language search query"),
    limit: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Semantic vector search.
    Returns garments ordered by cosine similarity to the query embedding.
    """
    # 1. Generate query embedding
    try:
        query_embedding = generate_embedding(q)
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Embedding failed: {exc}") from exc

    # 2. pgvector cosine distance search
    # <=> operator = cosine distance (lower = more similar)
    sql = text("""
        SELECT
            id, image_url, description,
            garment_type, style, material, color_palette, pattern,
            season, occasion, consumer_profile, trend_notes,
            continent, country, city, year, month, designer, created_at,
            embedding <=> CAST(:query_vec AS vector) AS distance
        FROM garments
        WHERE embedding IS NOT NULL
        ORDER BY distance ASC
        LIMIT :limit
    """)

    rows = db.execute(
        sql,
        {
            "query_vec": str(query_embedding),   # pgvector accepts "[f1,f2,...]" string
            "limit": limit,
        },
    ).fetchall()

    results = []
    for row in rows:
        results.append(
            {
                "id": row.id,
                "image_url": row.image_url,
                "description": row.description,
                "garment_type": row.garment_type,
                "style": row.style,
                "material": row.material,
                "color_palette": row.color_palette,
                "pattern": row.pattern,
                "season": row.season,
                "occasion": row.occasion,
                "consumer_profile": row.consumer_profile,
                "trend_notes": row.trend_notes,
                "continent": row.continent,
                "country": row.country,
                "city": row.city,
                "year": row.year,
                "month": row.month,
                "designer": row.designer,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "similarity_score": round(1 - float(row.distance), 4),
            }
        )

    return {"query": q, "results": results}
