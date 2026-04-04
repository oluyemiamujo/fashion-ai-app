"""
Database connection and session management.

For simplicity and ease of local setup, embeddings are stored in SQLite and
semantic search is implemented using cosine similarity in Python. In a
production system, a vector database such as PostgreSQL with pgvector would
be used.
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DATABASE_URL = "sqlite:///./fashion_ai.db"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Create all SQLite tables on startup."""
    Base.metadata.create_all(bind=engine)
