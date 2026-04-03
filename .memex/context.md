# Fashion AI Inspiration Library — Project Context

## Overview
AI-powered web app for organising fashion inspiration images. Allows designers to upload garment photos, which are automatically classified by AI and stored with rich metadata. Supports natural language search, attribute filtering, and designer annotations.

---

## Architecture

```
React (TypeScript) + FastAPI (Python) + PostgreSQL + pgvector
```

- **Frontend**: `app/frontend/` — Vite + React 18 + TypeScript + Tailwind CSS + React Router v6
- **Backend**: `app/backend/` — FastAPI with service/API/model layering
- **Eval**: `eval/` — model evaluation scripts and labelled dataset (75 Pexels images)
- **Tests**: `tests/` — `test_e2e.py`, `test_filters.py`, `test_parser.py` (currently empty stubs)

---

## Backend Structure (`app/backend/`)

```
main.py            # FastAPI app entry point (currently empty)
database.py        # DB connection / session setup (currently empty)
models/
  garment.py       # Garment ORM/Pydantic model (currently empty)
api/
  upload.py        # POST /upload — image ingestion
  search.py        # GET /search — natural language search via embeddings
  annotations.py   # POST /annotations — designer tag/note persistence
services/
  ai_classifier.py # AI garment attribute classification
  embeddings.py    # pgvector embedding generation/query
  parser.py        # Response parsing utilities
```

> **All backend files are currently empty stubs.** The frontend operates in mock mode (falls back to hardcoded `MOCK_GARMENTS` when the backend returns a network error).

---

## Frontend Structure (`app/frontend/src/`)

```
main.tsx              # React DOM entry
App.tsx               # BrowserRouter with two routes: / and /image/:id
api/
  api.ts              # Axios client + all API calls + TypeScript types + mock data
pages/
  Home.tsx            # Main library view (search + filters + image grid + upload)
  ImageDetail.tsx     # Single garment detail view with annotation panel
components/
  ImageGrid.tsx       # Responsive masonry-like grid; shows SkeletonCard while loading
  ImageCard.tsx       # Single garment card (thumbnail, season badge, color swatches, tags)
  SearchBar.tsx       # Natural language search input with hardcoded suggestions dropdown
  FiltersPanel.tsx    # Collapsible sidebar filter panel (dropdown selects per attribute)
  UploadPanel.tsx     # Drag-and-drop image uploader with metadata form (modal overlay)
  AnnotationPanel.tsx # Tag + note form for designer annotations on a garment
```

---

## Key TypeScript Types (in `src/api/api.ts`)

```typescript
interface Garment {
  id: string
  imageUrl: string
  thumbnail: string
  garment_type: string
  style: string
  material: string
  color_palette: ColorSwatch[]   // [{ hex, name }]
  pattern: string
  season: string
  occasion: string
  consumer_profile: string
  trend_notes: string
  location: Location             // { continent, country, city }
  description: string
  designer?: string
  tags?: string[]
  notes?: string[]
}

interface FilterOptions {
  garment_type, style, material, color_palette, pattern,
  season, occasion, continent, country, city, designer
}

interface SearchParams { /* same keys as FilterOptions, all optional */ }
interface UploadMetadata { designer, continent, country, city, season, occasion, notes }
```

---

## API Endpoints (defined in frontend, to be implemented in backend)

| Method | Path             | Description                              |
|--------|------------------|------------------------------------------|
| GET    | `/api/images`    | List garments with optional filter params |
| GET    | `/api/images/:id`| Single garment detail                    |
| GET    | `/api/search`    | Natural language search (`?q=...`)       |
| GET    | `/api/filters`   | Available filter option values           |
| POST   | `/api/upload`    | Multipart upload with metadata fields    |
| POST   | `/api/annotations` | Add tag/note to a garment (`{id, note, tag}`) |

---

## Design System & Styling Conventions

- **CSS Framework**: Tailwind CSS v3 with custom extensions
- **Primary Font**: Inter (`font-sans`)
- **Brand Colour Palette**: Purple/fuchsia scale (`brand-50` → `brand-900`), based on `#d946ef` (brand-500)
- **Card Shadows**: custom `shadow-card` and `shadow-card-hover` utilities
- **Border Radius**: `rounded-2xl` is the standard card/panel radius; `rounded-xl` for inputs/buttons
- **Interactive states**: `hover:-translate-y-1 transition-all duration-300` on cards
- **Loading states**: Tailwind `animate-pulse` skeleton loaders; `animate-spin` SVG spinners
- **Layout**: sticky header at `z-30`; sidebar + main content flex layout on desktop; `max-w-[1600px]` container

---

## Mock Mode

The frontend has a built-in mock data layer. All API functions in `src/api/api.ts` catch network errors and, when the backend is unreachable (`isMockMode()` helper checks for Axios network/connection errors), fall back to `MOCK_GARMENTS` and `MOCK_FILTERS` constants. This allows full UI development without a running backend.

---

## Garment Attributes (AI-classified)

- `garment_type`, `style`, `material`, `pattern`, `season`, `occasion`
- `consumer_profile` — target demographic description
- `trend_notes` — SS/AW trend context
- `color_palette` — array of `{ hex, name }` swatches
- `location` — `{ continent, country, city }` — geographic origin metadata

---

## Model Evaluation (eval/)

- Dataset: 75 labelled Pexels images (`eval/dataset/`, `eval/labels.json`)
- Evaluation script: `eval/evaluate_model.py` (currently empty)
- Reported accuracy: Garment Type 85% · Style 70% · Material 58%
- Known limitation: material classification is poor due to visual ambiguity

---

## Dev & Startup

- **Frontend dev server**: `start.ps1` → `cd app/frontend && npm run dev` → `http://localhost:5173`
- **Vite proxy**: `/api/*` proxied to `http://localhost:8000` (FastAPI)
- **Backend**: not yet runnable (all files empty); intended to be launched via `docker-compose up`
- **Python venv**: place at `app/backend/.venv` using `uv venv`

---

## Current State

The **frontend is fully built and functional** (in mock mode). The **entire backend is unimplemented** — all Python files (`main.py`, `database.py`, `models/garment.py`, all `api/` and `services/` files) are empty stubs. The primary next step is backend implementation.

---

## Conventions

- React components use default exports, PascalCase filenames
- Props interfaces defined inline in each component file
- All API calls centralised in `src/api/api.ts` — no direct `axios` usage in components
- Garment attribute keys use `snake_case` throughout (matching expected backend schema)
- `useCallback` + `useEffect` dependency pattern used for reactive data fetching in `Home.tsx`
- Filter reset when a new natural language search is submitted (intentional UX behaviour)
- `designer` is the only required upload field beyond the image file itself
