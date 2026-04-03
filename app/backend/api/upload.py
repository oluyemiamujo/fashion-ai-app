"""
POST /api/upload

Accepts a single image file (multipart/form-data).
All metadata is extracted automatically by the AI vision model —
no manual form fields are required or accepted.

Pipeline:
  1. Validate & persist image to disk
  2. AI vision classification (description + structured attributes)
  3. Validate / normalise AI output
  4. Generate semantic embedding from description
  5. Store garment record in database
  6. Return full garment metadata
"""
import uuid
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
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
    image: UploadFile = File(..., description="Garment image — JPEG, PNG, WEBP, or GIF."),
    db: Session = Depends(get_db),
):
    # ── 1. Validate file type ─────────────────────────────────────────────────
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=415,
            detail=(
                f"Unsupported file type '{image.content_type}'. "
                "Accepted formats: JPEG, PNG, WEBP, GIF."
            ),
        )

    # ── 2. Persist image to disk ──────────────────────────────────────────────
    ext = Path(image.filename or "upload.jpg").suffix or ".jpg"
    filename = f"{uuid.uuid4().hex}{ext}"
    save_path = UPLOAD_DIR / filename
    try:
        contents = await image.read()
        save_path.write_bytes(contents)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Image save failed: {exc}") from exc

    image_url = f"/uploads/{filename}"

    # ── 3. AI Vision classification ───────────────────────────────────────────
    # The model returns a rich natural-language description AND all structured
    # attributes. No user input supplements or overrides this output.
    try:
        raw_ai = classify_image(str(save_path))
    except Exception as exc:
        save_path.unlink(missing_ok=True)
        raise HTTPException(
            status_code=502,
            detail=f"AI classification failed: {exc}",
        ) from exc

    # ── 4. Validate & normalise AI output ─────────────────────────────────────
    metadata = parse_ai_response(raw_ai)

    # ── 5. Generate semantic embedding from description ───────────────────────
    embed_text = metadata.get("description", "")
    try:
        embedding = generate_embedding(embed_text) if embed_text else None
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Embedding generation failed: {exc}",
        ) from exc

    # ── 6. Persist garment record ─────────────────────────────────────────────
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
        designer=None,          # extracted by AI if present on garment/label
        embedding=embedding,
        created_at=now,
    )
    db.add(garment)
    db.commit()
    db.refresh(garment)

    # ── 7. Return full garment metadata ───────────────────────────────────────
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
