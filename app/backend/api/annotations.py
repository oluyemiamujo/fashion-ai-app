"""
POST /api/annotations   – add a designer annotation to a garment
GET  /api/annotations/{garment_id} – list annotations for a garment
"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from database import get_db
from models import Annotation, Garment

router = APIRouter()


class AnnotationCreate(BaseModel):
    garment_id: int
    tag: str = ""
    note: str = ""


@router.post("/annotations", status_code=201)
def add_annotation(payload: AnnotationCreate, db: Session = Depends(get_db)):
    """Attach a tag / note to an existing garment."""
    garment = db.query(Garment).filter(Garment.id == payload.garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found.")

    annotation = Annotation(
        garment_id=payload.garment_id,
        tag=payload.tag or None,
        note=payload.note or None,
        created_at=datetime.utcnow(),
    )
    db.add(annotation)
    db.commit()
    db.refresh(annotation)

    return {
        "id": annotation.id,
        "garment_id": annotation.garment_id,
        "tag": annotation.tag,
        "note": annotation.note,
        "created_at": annotation.created_at.isoformat(),
    }


@router.get("/annotations/{garment_id}")
def list_annotations(garment_id: int, db: Session = Depends(get_db)):
    """Return all annotations for a garment."""
    garment = db.query(Garment).filter(Garment.id == garment_id).first()
    if not garment:
        raise HTTPException(status_code=404, detail="Garment not found.")

    annotations = (
        db.query(Annotation)
        .filter(Annotation.garment_id == garment_id)
        .order_by(Annotation.created_at.desc())
        .all()
    )

    return [
        {
            "id": a.id,
            "garment_id": a.garment_id,
            "tag": a.tag,
            "note": a.note,
            "created_at": a.created_at.isoformat() if a.created_at else None,
        }
        for a in annotations
    ]
