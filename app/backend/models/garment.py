"""
SQLAlchemy ORM models for Garment and Annotation.
Embeddings are stored as JSON arrays (list[float]) in SQLite.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from database import Base


class Garment(Base):
    __tablename__ = "garments"

    id = Column(Integer, primary_key=True, index=True)
    image_url = Column(String, nullable=False)
    description = Column(Text, nullable=True)

    # AI-extracted attributes
    garment_type = Column(String, nullable=True)
    style = Column(String, nullable=True)
    material = Column(String, nullable=True)
    color_palette = Column(String, nullable=True)
    pattern = Column(String, nullable=True)
    season = Column(String, nullable=True)
    occasion = Column(String, nullable=True)
    consumer_profile = Column(String, nullable=True)
    trend_notes = Column(Text, nullable=True)

    # Location
    continent = Column(String, nullable=True)
    country = Column(String, nullable=True)
    city = Column(String, nullable=True)

    # Temporal
    year = Column(Integer, nullable=True)
    month = Column(Integer, nullable=True)

    # Meta
    designer = Column(String, nullable=True)

    # Embedding stored as a JSON array of floats (1536 dims for text-embedding-3-small).
    # Cosine similarity is computed in Python at query time; see services/similarity.py.
    embedding = Column(JSON, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)


class Annotation(Base):
    __tablename__ = "annotations"

    id = Column(Integer, primary_key=True, index=True)
    garment_id = Column(Integer, ForeignKey("garments.id", ondelete="CASCADE"), nullable=False)
    tag = Column(String, nullable=True)
    note = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
