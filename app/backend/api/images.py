"""
GET /api/images          – paginated list of latest garments
GET /api/images/filter   – dynamic multi-attribute filter
GET /api/images/{id}     – garment detail + annotations
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from database import get_db
from models import Annotation, Garment

router = APIRouter()


def _garment_dict(g: Garment) -> dict:
    return {
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
    }


# ── GET /api/images ───────────────────────────────────────────────────────────

@router.get("/images")
def list_images(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Return latest garments with pagination."""
    offset = (page - 1) * page_size
    total = db.query(Garment).count()
    garments = (
        db.query(Garment)
        .order_by(Garment.created_at.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )
    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [_garment_dict(g) for g in garments],
    }


# ── GET /api/images/filter ────────────────────────────────────────────────────
# NOTE: must be registered BEFORE /images/{id} to avoid route collision.

@router.get("/images/filter")
def filter_images(
    garment_type: Optional[str] = Query(default=None),
    style: Optional[str] = Query(default=None),
    material: Optional[str] = Query(default=None),
    color_palette: Optional[str] = Query(default=None),
    pattern: Optional[str] = Query(default=None),
    season: Optional[str] = Query(default=None),
    occasion: Optional[str] = Query(default=None),
    continent: Optional[str] = Query(default=None),
    country: Optional[str] = Query(default=None),
    city: Optional[str] = Query(default=None),
    designer: Optional[str] = Query(default=None),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """Dynamically filter garments by one or more attributes."""
    query = db.query(Garment)

    filters = {
        "garment_type": garment_type,
        "style": style,
        "material": material,
        "color_palette": color_palette,
        "pattern": pattern,
        "season": season,
        "occasion": occasion,
        "continent": continent,
        "country": country,
        "city": city,
        "designer": designer,
    }

    for column_name, value in filters.items():
        if value:
            col = getattr(Garment, column_name)
            query = query.filter(col.ilike(f"%{value}%"))

    total = query.count()
    offset = (page - 1) * page_size
    garments = query.order_by(Garment.created_at.desc()).offset(offset).limit(page_size).all()

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "results": [_garment_dict(g) for g in garments],
    }


# ── GET /api/images/{id} ──────────────────────────────────────────────────────

@router.get("/images/{garment_id}")
def get_image(garment_id: int, db: Session = Depends(get_db)):
    """Return full garment detail including annotations."""
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found.")

    annotations = (
        db.query(Annotation)
        .filter(Annotation.garment_id == garment_id)
        .order_by(Annotation.created_at.desc())
        .all()
    )

    result = _garment_dict(garment)
    result["annotations"] = [
        {
            "id": a.id,
            "tag": a.tag,
            "note": a.note,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in annotations
    ]
    return result
