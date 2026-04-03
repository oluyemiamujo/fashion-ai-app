"""
POST /api/upload

Accepts a multipart form with an image and optional metadata.
Runs AI classification → parsing → embedding → DB insert.
"""
import os
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from database import get_db
from models import Garment
from services import classify_image, generate_embedding, parse_ai_response

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}


@router.post("/upload")
async def upload_image(
    image: UploadFile = File(...),
    designer: str = Form(default=""),
    continent: str = Form(default=""),
    country: str = Form(default=""),
    city: str = Form(default=""),
    season: str = Form(default=""),
    occasion: str = Form(default=""),
    notes: str = Form(default=""),
    db: Session = Depends(get_db),
):
    # ── 1. Validate file type ─────────────────────────────────────────────────
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=f"Unsupported file type '{image.content_type}'. Allowed: JPEG, PNG, WEBP, GIF.",
        )

    # ── 2. Save file locally ──────────────────────────────────────────────────
    ext = Path(image.filename or "upload.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / filename
    try:
        contents = await image.read()
        save_path.write_bytes(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"File save failed: {exc}") from exc

    image_url = f"/uploads/{filename}"

    # ── 3. AI Classification ──────────────────────────────────────────────────
    try:
        raw_ai = classify_image(str(save_path))
    except Exception as exc:
        save_path.unlink(missing_ok=True)
        raise HTTPException(status_code=502, detail=f"AI classification failed: {exc}") from exc

    # ── 4. Parse & normalise AI output ────────────────────────────────────────
    metadata = parse_ai_response(raw_ai)

    # User-supplied fields override AI inference where provided
    if continent:
        metadata["continent"] = continent
    if country:
        metadata["country"] = country
    if city:
        metadata["city"] = city
    if season:
        metadata["season"] = season
    if occasion:
        metadata["occasion"] = occasion
    if notes:
        metadata["trend_notes"] = notes

    # ── 5. Generate embedding ─────────────────────────────────────────────────
    embed_text = metadata.get("description", "")
    try:
        embedding = generate_embedding(embed_text) if embed_text else None
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Embedding generation failed: {exc}") from exc

    # ── 6. Persist to database ────────────────────────────────────────────────
    now = datetime.utcnow()
    garment = Garment(
        image_url=image_url,
        description=metadata.get("description"),
        garment_type=metadata.get("garment_type"),
        style=metadata.get("style"),
        material=metadata.get("material"),
        color_palette=metadata.get("color_palette"),
        pattern=metadata.get("pattern"),
        season=metadata.get("season"),
        occasion=metadata.get("occasion"),
        consumer_profile=metadata.get("consumer_profile"),
        trend_notes=metadata.get("trend_notes"),
        continent=metadata.get("continent"),
        country=metadata.get("country"),
        city=metadata.get("city"),
        year=now.year,
        month=now.month,
        designer=designer or None,
        embedding=embedding,
        created_at=now,
    )
    db.add(garment)
    db.commit()
    db.refresh(garment)

    return {
        "id": garment.id,
        "image_url": garment.image_url,
        "description": garment.description,
        "garment_type": garment.garment_type,
        "style": garment.style,
        "material": garment.material,
        "color_palette": garment.color_palette,
        "pattern": garment.pattern,
        "season": garment.season,
        "occasion": garment.occasion,
        "consumer_profile": garment.consumer_profile,
        "trend_notes": garment.trend_notes,
        "continent": garment.continent,
        "country": garment.country,
        "city": garment.city,
        "year": garment.year,
        "month": garment.month,
        "designer": garment.designer,
        "created_at": garment.created_at.isoformat(),
    }
