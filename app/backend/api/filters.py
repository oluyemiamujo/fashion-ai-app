"""
GET /api/filters

Returns distinct values for every filterable attribute, sourced live from the database.
Used by the frontend to populate filter dropdowns.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database import get_db
from models import Garment

router = APIRouter()

FILTER_COLUMNS = [
    "garment_type",
    "style",
    "material",
    "color_palette",
    "pattern",
    "season",
    "occasion",
    "continent",
    "country",
    "city",
    "designer",
]


@router.get("/filters")
def get_filters(db: Session = Depends(get_db)):
    """Return distinct non-null values for all filterable columns."""
    result: dict[str, list[str]] = {}

    for column_name in FILTER_COLUMNS:
        col = getattr(Garment, column_name)
        rows = (
            db.query(col)
            .filter(col.isnot(None), col != "")
            .distinct()
            .order_by(col)
            .all()
        )
        result[column_name] = [row[0] for row in rows]

    return result
