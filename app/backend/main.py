"""
Fashion AI – FastAPI Application Entry Point
"""
import sys
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

# Ensure backend root is on the Python path so relative imports resolve correctly
# when running with `uvicorn main:app` from the backend directory.
sys.path.insert(0, str(Path(__file__).resolve().parent))
sys.path.insert(0, str(Path(__file__).resolve().parent / "models"))

load_dotenv()

from database import create_tables  # noqa: E402 (must come after sys.path setup)
from api.upload import router as upload_router
from api.images import router as images_router
from api.search import router as search_router
from api.filters import router as filters_router
from api.annotations import router as annotations_router


# ── Lifespan ──────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Create SQLite tables on startup."""
    create_tables()
    yield


# ── App factory ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Fashion AI API",
    description="Garment classification, semantic search, and designer annotation API.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],          # tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Static files: serve uploaded images ──────────────────────────────────────

UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# ── Routers ───────────────────────────────────────────────────────────────────

app.include_router(upload_router,      prefix="/api", tags=["Upload"])
app.include_router(images_router,      prefix="/api", tags=["Images"])
app.include_router(search_router,      prefix="/api", tags=["Search"])
app.include_router(filters_router,     prefix="/api", tags=["Filters"])
app.include_router(annotations_router, prefix="/api", tags=["Annotations"])


# ── Health check ──────────────────────────────────────────────────────────────

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
