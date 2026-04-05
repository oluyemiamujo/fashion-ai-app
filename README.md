# Fashion AI — Garment Classification & Inspiration Platform

An AI-powered web application that helps fashion designers organise, search, and annotate garment inspiration imagery. Images are automatically analysed by a multimodal vision model on upload, producing rich structured metadata and a semantic embedding that powers natural-language search.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Key Features](#key-features)
3. [Architecture](#architecture)
4. [Project Structure](#project-structure)
5. [Setup & Installation](#setup--installation)
6. [Running the Application](#running-the-application)
7. [Usage Guide](#usage-guide)
8. [Evaluation Pipeline](#evaluation-pipeline)
9. [Evaluation Results](#evaluation-results)
10. [Reproducing Evaluation Results](#reproducing-evaluation-results)
11. [API Reference](#api-reference)
12. [Testing](#testing)
13. [Troubleshooting](#troubleshooting)
14. [Improvements & Future Work](#improvements--future-work)

---

## Project Overview

Design teams routinely accumulate hundreds of inspiration images from field trips, market visits, and street photography. When those images sit in shared folders or camera rolls, they become practically unsearchable — designers cannot find a "red embroidered bohemian dress from Oaxaca" without scrolling through thousands of files.

This project converts that unstructured image collection into a **searchable, annotatable inspiration knowledge base** by combining:

- **GPT-4o vision** for automatic attribute extraction and editorial description generation
- **OpenAI `text-embedding-3-small`** for semantic embedding of each garment description
- **Cosine similarity search in Python** for natural-language retrieval without a vector database
- **SQLite + SQLAlchemy** for lightweight, zero-config local persistence
- **React + TypeScript** frontend with real-time filters, colour palette visualisation, and a full annotation workflow

---

## Key Features

### AI Image Classification
Every uploaded image is processed by GPT-4o, which extracts:

| Field | Example |
|-------|---------|
| `garment_type` | `wide-leg trousers` |
| `style` | `minimalist` |
| `material` | `silk charmeuse` |
| `color_palette` | `ivory, dusty rose, charcoal` |
| `pattern` | `solid` |
| `season` | `spring/summer` |
| `occasion` | `evening` |
| `consumer_profile` | `Women 28–42, minimalist sensibility...` |
| `trend_notes` | `2–3 sentences on macro trend positioning` |
| `continent / country / city` | `Europe / France / Paris` |
| `description` | Rich 3–5 sentence editorial paragraph |

### Colour Palette Visualisation
`color_palette` is stored as a comma-separated string (e.g. `"ivory, dusty rose, charcoal"`). The frontend converts this to `ColorSwatch[]` objects via `resolveColorHex()`, which uses:
1. Exact lookup in a curated 100+ entry colour map
2. Partial word-match fallback
3. Deterministic HSL hash — every unknown name still renders a meaningful, consistent colour

### Semantic Search
Natural-language queries (e.g. `"embroidered neckline"`, `"oversized streetwear jacket"`) are converted to embeddings and ranked against all stored garment embeddings using cosine similarity. Results are scored and returned in descending similarity order.

### Attribute Filtering
Dynamic filter dropdowns are populated live from the database. Filters can be combined with a text search query (AND logic). Filterable attributes: `garment_type`, `style`, `material`, `color_palette`, `pattern`, `season`, `occasion`, `continent`, `country`, `city`, `designer`.

### Designer Annotations
Tags and free-text notes can be added to any garment from the detail page. Annotations persist to the database and are hydrated back on every page load. Multiple annotations per garment are supported.

### Image Upload
Drag-and-drop or click-to-browse. Accepted formats: JPEG, PNG, WEBP, GIF. GPT-4o classification runs automatically on upload — no manual form fields required.

### Image Deletion
Deleting a garment from the detail view removes the database record, all annotations, and the image file from disk atomically.

### Mock Mode
The frontend falls back to built-in mock garments when the backend is unreachable (ECONNREFUSED or HTTP 503). The UI can be developed and previewed without a running backend.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser  (React 18 + TypeScript + Tailwind CSS)            │
│                                                             │
│  Home.tsx ──► ImageGrid ──► ImageCard                       │
│     │         SearchBar      FiltersPanel                   │
│     │         UploadPanel                                   │
│     └──► ImageDetail ──► AnnotationPanel                    │
│                                                             │
│  src/api/api.ts  ←  all HTTP calls + normaliseGarment()     │
└────────────────────┬────────────────────────────────────────┘
                     │  HTTP / Vite proxy  (:5173 → :8000)
┌────────────────────▼────────────────────────────────────────┐
│  FastAPI  (Python 3.11, Uvicorn)                            │
│                                                             │
│  POST /api/upload          ← classify_image (GPT-4o)        │
│  GET  /api/images          ← paginated list                 │
│  GET  /api/images/filter   ← structured attribute filter    │
│  GET  /api/images/{id}     ← garment + annotations          │
│  DELETE /api/images/{id}   ← remove garment + file          │
│  GET  /api/search?q=       ← cosine similarity search       │
│  GET  /api/filters         ← live filter option values      │
│  POST /api/annotations     ← add tag/note                   │
│  GET  /api/annotations/{id}                                 │
│                                                             │
│  services/                                                  │
│    ai_classifier.py  ← GPT-4o vision + retry logic         │
│    embeddings.py     ← text-embedding-3-small              │
│    similarity.py     ← numpy cosine similarity             │
│    parser.py         ← AI output validation + defaults     │
└────────────────────┬────────────────────────────────────────┘
                     │  SQLAlchemy ORM
┌────────────────────▼────────────────────────────────────────┐
│  SQLite  (fashion_ai.db)                                    │
│  Tables: garments, annotations                              │
│  Embeddings stored as JSON arrays (1536 dims)               │
└─────────────────────────────────────────────────────────────┘
```

**Key design decisions:**
- Embeddings are stored in SQLite as JSON arrays and cosine similarity is computed in Python — no vector database required for collections of ~100–500 garments.
- `GET /api/images/filter` is registered before `GET /api/images/{id}` to prevent FastAPI treating `"filter"` as a garment ID.
- The frontend always treats garment `id` as a `string`; `parseInt(id, 10)` is applied before every API call that expects an integer.

---

## Project Structure

```
fashion-ai-app/
├── app/
│   ├── backend/
│   │   ├── api/
│   │   │   ├── annotations.py   # POST /annotations, GET /annotations/{id}
│   │   │   ├── filters.py       # GET /filters
│   │   │   ├── images.py        # GET /images, /images/filter, /images/{id}, DELETE
│   │   │   ├── search.py        # GET /search
│   │   │   └── upload.py        # POST /upload
│   │   ├── models/
│   │   │   └── garment.py       # Garment + Annotation ORM models
│   │   ├── services/
│   │   │   ├── ai_classifier.py # GPT-4o vision wrapper + retry logic
│   │   │   ├── embeddings.py    # text-embedding-3-small wrapper
│   │   │   ├── parser.py        # AI response validation + defaults
│   │   │   └── similarity.py    # cosine_similarity()
│   │   ├── uploads/             # persisted image files (served as /uploads/*)
│   │   ├── database.py          # SQLAlchemy engine + get_db
│   │   ├── main.py              # FastAPI app + router registration
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   └── start.ps1
│   └── frontend/
│       └── src/
│           ├── api/api.ts       # all API calls, types, normaliseGarment()
│           ├── components/
│           │   ├── AnnotationPanel.tsx
│           │   ├── FiltersPanel.tsx
│           │   ├── ImageCard.tsx
│           │   ├── ImageGrid.tsx
│           │   ├── SearchBar.tsx
│           │   └── UploadPanel.tsx
│           └── pages/
│               ├── Home.tsx         # garment grid, search, filters, upload
│               └── ImageDetail.tsx  # detail view, annotations, delete
├── eval/
│   ├── dataset/                 # labelled images organised by attribute/label/
│   │   ├── garment_type/
│   │   │   ├── wide_leg_trousers/
│   │   │   └── wrap_dress/
│   │   ├── style/
│   │   │   ├── minimalist/
│   │   │   └── streetwear/
│   │   ├── material/
│   │   │   ├── heavyweight_denim/
│   │   │   └── silk_charmeuse/
│   │   ├── pattern/
│   │   │   ├── jacquard/
│   │   │   └── tie_dye/
│   │   ├── season/
│   │   │   ├── summer_outfits/
│   │   │   └── winter_fashion/
│   │   └── occasion/
│   │       ├── activewear/
│   │       └── beachwear/
│   ├── ground_truth.csv         # auto-generated by generate_ground_truth.py
│   ├── results.csv              # per-image inference output (last run)
│   ├── generate_ground_truth.py # builds CSV with canonical label aliases
│   ├── evaluate_model.py        # inference + accuracy computation + plots
│   ├── evaluate_semantic.py     # semantic search quality evaluation
│   └── plots/
│       └── accuracy_bar_chart.png
├── tests/
│   ├── test_e2e.py
│   ├── test_filters.py
│   ├── test_parser.py
│   ├── test_resilience.py
│   └── test_search.py
└── start.ps1                    # launches frontend dev server
```

---

## Setup & Installation

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Python | ≥ 3.11 | Backend runtime |
| Node.js | ≥ 18 | Frontend build |
| `uv` | latest | Python package manager |
| Git | any | Version control |

Install `uv` if not already present:

```powershell
Set-ExecutionPolicy RemoteSigned -scope CurrentUser -Force
iwr https://astral.sh/uv/install.ps1 -useb | iex
```

### 1. Clone the repository

```bash
git clone <repository_url>
cd fashion-ai-app
```

### 2. Configure environment variables

```bash
cp app/backend/.env.example app/backend/.env
```

Edit `app/backend/.env`:

```
OPENAI_API_KEY=sk-...
```

The application uses two OpenAI models: `gpt-4o` (image classification) and `text-embedding-3-small` (semantic search). Both require the same key.

### 3. Install backend dependencies

```powershell
cd app/backend
uv venv .venv --python 3.11
.venv\Scripts\Activate.ps1
uv pip install -r requirements.txt
```

### 4. Install frontend dependencies

```bash
cd app/frontend
npm install
```

---

## Running the Application

Two processes run concurrently.

### Backend

```powershell
# from app/backend/
.venv\Scripts\Activate.ps1
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Or use the provided script:

```powershell
.\app\backend\start.ps1
```

API available at `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

### Frontend

```powershell
# from app/frontend/
npm run dev
```

Or from the project root:

```powershell
.\start.ps1
```

UI available at `http://localhost:5173`. Vite proxies `/api` and `/uploads` to port 8000.

---

## Usage Guide

### Upload an image
1. Click the upload zone on the Home page, or drag a JPEG / PNG / WEBP file onto it.
2. The image is classified by GPT-4o (typically 5–15 seconds).
3. The annotated card appears in the grid immediately.

### Search
- Type a natural-language query in the search bar. After a 400 ms debounce the query is embedded and matched using cosine similarity.
- Press Enter to bypass the debounce and search immediately.

### Filter
- Use the filter dropdowns (garment type, style, material, etc.) to narrow results.
- Filters and search compose with AND logic.
- The reset button clears both filters and search.

### View garment detail
- Click any card to open the full detail view showing the editorial description, all attributes, colour swatches, and annotations.

### Annotate a garment
1. On the detail page, enter a **tag** and/or **note** in the annotation panel.
2. Click **Save** — the annotation persists to the database and appears immediately without a page reload.

### Delete a garment
1. On the detail page, click **Delete Image**.
2. Confirm in the inline prompt. The garment, annotations, and image file are removed permanently.
3. You are redirected to the home page with a confirmation toast.

---

## Evaluation Pipeline

The `eval/` directory contains a self-contained pipeline for measuring classifier accuracy on a hand-labelled dataset.

### How the dataset is structured

Images are organised by attribute and label:

```
eval/dataset/<attribute>/<label>/<image.jpg>
```

Each image is labelled for **one** attribute only. This allows each attribute to be evaluated independently using purpose-selected images.

### Ground truth CSV format

`eval/ground_truth.csv` is generated by `generate_ground_truth.py` from the folder structure. Columns:

```
image, garment_type, style, material, pattern, season, occasion
```

A row for an image labelled as `wide_leg_trousers` looks like:

```
pexels-173739006-11055477.jpg, wide-leg trousers, , , , ,
```

Only the column matching the image's label folder is populated. All others are empty.

**Label alias mapping** — `generate_ground_truth.py` maps folder names to canonical classifier vocabulary before writing the CSV:

| Folder name | CSV label |
|-------------|-----------|
| `wide_leg_trousers` | `wide-leg trousers` |
| `wrap_dress` | `wrap dress` |
| `heavyweight_denim` | `heavyweight denim` |
| `silk_charmeuse` | `silk charmeuse` |
| `summer_outfits` | `spring/summer` |
| `winter_fashion` | `autumn/winter` |
| `tie_dye` | `tie-dye` |

Always regenerate the CSV after adding new label folders. Add new aliases to `LABEL_ALIASES` in `generate_ground_truth.py` first.

### Normalisation at evaluation time

`evaluate_model.py` applies `normalize_label()` to both the GT value and the model prediction before comparison:

- Strips `(inferred)` suffix
- Maps underscore/hyphen/space variants to a canonical form
- Expands synonyms (e.g. `"denim"` → `"heavyweight denim"`)
- Uses **substring matching** for `garment_type` because the model returns full outfit descriptions

---

## Evaluation Results

**Dataset:** `eval/dataset/` — 100 hand-labelled images, 6 attributes  
**Evaluated:** April 2026  
**Model:** `gpt-4o` via `app/backend/services/ai_classifier.py`  
**Full results:** `eval/results.csv`  
**Chart:** `eval/plots/accuracy_bar_chart.png`

| Attribute | Accuracy | Correct / Samples |
|-----------|----------|-------------------|
| `garment_type` | **75%** | 12 / 16 |
| `style` | **75%** | 12 / 16 |
| `material` | **94%** | 15 / 16 |
| `pattern` | **53%** | 9 / 17 |
| `season` | **95%** | 18 / 19 |
| `occasion` | **100%** | 16 / 16 |

**Analysis of remaining errors:**

- `garment_type` (4 misses) — wrap dresses described as `"asymmetrical dress"` or `"maxi dress"`. Visually ambiguous silhouettes.
- `style` (4 misses) — minimalist garments returned as `"contemporary"` or `"eclectic romantic"`. Subjective boundary.
- `material` (1 miss) — heavyweight denim returned as `"lightweight denim"` for a lighter-wash image.
- `pattern` (8 misses) — jacquard weaves with floral or geometric motifs returned as `"floral print"` / `"geometric"`. The model focuses on the visual motif rather than the weave structure.

---

## Reproducing Evaluation Results

### Install evaluation dependencies

```powershell
cd app/backend
.venv\Scripts\Activate.ps1
uv pip install pandas matplotlib seaborn scikit-learn
```

### Step 1 — Confirm all 100 images are present

```powershell
(Get-ChildItem -Path eval\dataset -Recurse -File -Include *.jpg,*.jpeg,*.png).Count
# expected: 100
```

### Step 2 — Regenerate ground truth CSV

```powershell
# from project root
app\backend\.venv\Scripts\python.exe eval\generate_ground_truth.py
```

Expected output:
```
CSV generated: eval/ground_truth.csv
Total images: 100
  garment_type: ['wide-leg trousers', 'wrap dress']
  style: ['minimalist', 'streetwear']
  material: ['heavyweight denim', 'silk charmeuse']
  pattern: ['jacquard', 'tie-dye']
  season: ['autumn/winter', 'spring/summer']
  occasion: ['activewear', 'beachwear']
```

### Step 3 — Run full inference

```powershell
# from project root
app\backend\.venv\Scripts\python.exe eval\evaluate_model.py
```

This makes one GPT-4o API call per image. Runtime is approximately 8–12 minutes for 100 images. Output includes:

- Dataset alignment diagnostic (row counts, any missing images)
- First 10 ground-truth rows
- Per-attribute accuracy with sample `gt → pred` comparisons
- Saved `eval/results.csv` and `eval/plots/accuracy_bar_chart.png`

### Step 4 — Inspect results

```powershell
Import-Csv eval\results.csv | Select-Object image, gt_garment_type, pred_garment_type | Select-Object -First 10
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/upload` | Upload image — returns classified garment |
| `GET` | `/api/images` | Paginated list (`page`, `page_size`) |
| `GET` | `/api/images/filter` | Filter by attribute combination |
| `GET` | `/api/images/{id}` | Garment detail + annotations array |
| `DELETE` | `/api/images/{id}` | Delete garment, annotations, and file |
| `GET` | `/api/search?q=` | Semantic search (cosine similarity) |
| `GET` | `/api/filters` | Live filter values from the database |
| `POST` | `/api/annotations` | Add `{ garment_id: int, tag, note }` |
| `GET` | `/api/annotations/{garment_id}` | List annotations for a garment |
| `GET` | `/health` | Health check |

**Paginated list response:**
```json
{ "total": 42, "page": 1, "page_size": 20, "results": [ ...garments ] }
```

**Garment detail response includes:**
```json
{
  "id": 7,
  "image_url": "/uploads/abc123.jpg",
  "garment_type": "wrap dress",
  "color_palette": "ivory, dusty rose",
  "continent": "Europe", "country": "France", "city": "Paris",
  "annotations": [{ "id": 1, "tag": "editorial", "note": "Strong SS25 pick", "created_at": "..." }]
}
```

**Search response:**
```json
{ "query": "silk evening", "results": [ { ...garment, "similarity_score": 0.891 } ] }
```

---

## Testing

```powershell
# from project root, with venv active
python -m pytest tests/ -v
```

| File | Coverage |
|------|----------|
| `test_parser.py` | AI response validation + default injection |
| `test_filters.py` | Attribute filter logic |
| `test_search.py` | Cosine similarity scoring |
| `test_resilience.py` | OpenAI retry and error handling |
| `test_e2e.py` | Upload → classify → store → search → delete |

---

## Troubleshooting

**Backend does not start — `.venv not found`**
```powershell
cd app/backend
uv venv .venv --python 3.11
uv pip install -r requirements.txt
```

**Upload fails — AI classification error**  
Verify `OPENAI_API_KEY` in `app/backend/.env` is valid and has `gpt-4o` access. The backend retries transient errors (rate limit, timeout) up to 3 times with exponential back-off.

**Images not displaying**  
Both the backend (port 8000) and the Vite dev server (port 5173) must be running. Vite proxies `/uploads` to the backend. Confirm `app/backend/uploads/` exists.

**Annotations not loading after page refresh**  
`GET /api/images/{id}` must return an `annotations` array. Verify by visiting `http://localhost:8000/api/images/{id}` directly. The frontend `normaliseGarment()` reads `raw.annotations[]` — not `raw.tags` or `raw.notes`.

**Evaluation accuracy unexpectedly low**  
1. Regenerate the CSV: `python eval/generate_ground_truth.py`  
2. Check the diagnostic block printed at the start of `evaluate_model.py` for missing images  
3. Inspect raw model outputs in `eval/results.csv` — add missing variants to `_NORM_TABLE` in `evaluate_model.py` if the model returns a synonym not yet covered  
4. For new label folders, add the folder-name → canonical alias to `LABEL_ALIASES` in `generate_ground_truth.py`

**Filename case mismatches (Linux / macOS)**  
The filesystem and the CSV `image` column must match exactly (case-sensitive). Always regenerate the CSV with `generate_ground_truth.py` rather than editing it by hand — it reads filenames directly from the filesystem.

---

## Improvements & Future Work

This section outlines prioritised directions for maturing the system — spanning evaluation rigour, production hardening, and AI capability expansion.

---

### 1. Evaluation Improvements

#### Ground-Truth Dataset Expansion
- Grow the labelled dataset beyond the current sample set to achieve statistically significant accuracy measurements (target ≥ 500 images across all garment types and styles).
- Source diverse inputs: editorial photography, street photography, catalogue scans, and runway imagery to reduce distributional bias in the evaluation set.
- Introduce multi-annotator labelling with inter-annotator agreement scores (Cohen's κ) to validate label quality before including samples in the ground-truth CSV.

#### Data Augmentation for Evaluation Robustness
- Apply controlled image perturbations (rotation, brightness shift, JPEG compression artefacts, cropping) to existing ground-truth samples and verify that model predictions remain stable — surfacing brittleness before it reaches production.
- Test with low-quality or partially obscured images to define a reliability boundary for the classification service.

#### Semantic Similarity Checks
- Replace strict string-equality scoring for free-text fields (`trend_notes`, `consumer_profile`, `description`) with embedding-based semantic similarity (e.g., cosine similarity of `text-embedding-3-small` representations), so near-synonym outputs are not penalised as hard misses.
- Extend `_NORM_TABLE` maintenance with a semi-automated synonym discovery step: cluster all observed model outputs per field and surface cluster centroids for manual review.

#### Metrics Tracking & Automated Reporting
- Persist per-run evaluation results to a time-series store (e.g., a lightweight SQLite table or CSV append log) so accuracy trends can be tracked across model version upgrades or prompt changes.
- Generate a structured HTML or Markdown evaluation report as a CI artefact on every evaluation run — including per-field accuracy, overall accuracy, failure examples, and a diff against the previous run.
- Set automated quality gates: block deployments if overall accuracy drops more than 3 percentage points from the baseline.

---

### 2. System & Production Improvements

#### Scalability
- **Database**: Migrate from SQLite to PostgreSQL for concurrent write support, full-text search (`tsvector`), and connection pooling via `pgBouncer`. SQLite is appropriate for single-user local use but becomes a bottleneck under concurrent uploads.
- **Embedding search**: Replace the in-Python cosine similarity loop with a dedicated vector store (e.g., pgvector extension, Pinecone, or Qdrant) to support millisecond-latency semantic search across tens of thousands of garments without loading all embeddings into memory.
- **File storage**: Replace the local `uploads/` directory with object storage (AWS S3 / GCS) and serve images via signed URLs or a CDN — decoupling storage from compute and enabling horizontal scaling of the backend.
- **Async processing**: Move AI classification and embedding generation off the upload request path using a task queue (Celery + Redis or FastAPI `BackgroundTasks`). Return a `job_id` immediately; poll or receive a webhook when classification is complete. This prevents upload timeouts on slow network or API latency spikes.

#### Reliability
- **Structured error handling**: Introduce a consistent error response envelope `{ error: { code, message, detail } }` across all API endpoints, replacing ad-hoc HTTP exception raises.
- **Retry with circuit breaker**: Wrap all OpenAI API calls in a circuit breaker (e.g., `tenacity` with `circuit_breaker` semantics) so a sustained outage degrades gracefully (e.g., stores the image without metadata and queues it for later re-classification) rather than failing the upload entirely.
- **Database migrations**: Introduce Alembic for schema migration management. The current `Base.metadata.create_all()` approach has no upgrade/downgrade path — a problem as the schema evolves.
- **Backup strategy**: For production SQLite deployments, implement automated daily snapshots via `VACUUM INTO` to a secondary location. For PostgreSQL, use `pg_dump` scheduled via cron or a managed backup service.

#### Performance & Caching
- Cache `GET /api/filters` responses in-process (e.g., with `functools.lru_cache` or a short-lived Redis TTL) — the filter values change only on upload or delete, making them safe to cache for 60 seconds.
- Cache embedding lookups: if the same image hash is uploaded twice, skip re-classification and reuse the stored embedding.
- Add database indexes on high-cardinality filter columns (`garment_type`, `style`, `season`, `occasion`) to keep filtered queries fast as the dataset grows.
- Lazy-load the full embedding matrix only when search is invoked, and invalidate the cache on any upload or delete.

#### Containerisation & CI/CD
- **Docker**: Provide a `Dockerfile` for the backend (Python 3.11, `uv`-based install) and a multi-stage `Dockerfile` for the frontend (Node build stage → Nginx serve stage). Compose both with `docker-compose.yml` for one-command local startup.
- **Kubernetes**: For team or cloud deployments, define Kubernetes manifests (Deployment, Service, HPA) to enable auto-scaling the backend under variable upload load.
- **CI/CD pipeline**: Implement a GitHub Actions workflow that runs `pytest`, the evaluation pipeline, and a Lighthouse accessibility audit on every pull request — blocking merges on regression.

---

### 3. AI & Advanced Features

#### LLM-Enhanced Annotation Suggestions
- Surface GPT-4o-generated annotation suggestions directly in the `AnnotationPanel` UI: when a user opens an image, pre-populate suggested tags and notes derived from the AI description already stored in the database — reducing annotation effort to confirmation rather than free-text entry.
- Allow designers to ask free-form questions about a garment ("What SS26 trends does this align with?") and receive a grounded response generated from the stored metadata, similar to a document Q&A interface.

#### Retrieval-Augmented Generation (RAG) for Semantic Search
- Implement a RAG pipeline where a natural-language query is first used to retrieve the top-K most similar garments (via embedding search), and then a language model synthesises a structured answer from the retrieved metadata — e.g., "Here are the three closest matches to your query and why they align."
- Extend RAG to the annotation workflow: before saving a new annotation, retrieve semantically similar garments and display their existing annotations as context, promoting vocabulary consistency across the collection.
- Store annotations in the vector index alongside garment embeddings so free-text notes become searchable via the same semantic search interface.

#### Multimodal & Cross-Modal Search
- Enable image-to-image search: encode an uploaded or pasted query image with a CLIP-style encoder and retrieve visually similar garments from the collection, complementing the existing text-based semantic search.
- Allow combined queries: "show me something like [image] but in a minimalist style" — fusing visual similarity with text-filter constraints.

#### Active Learning & Continuous Improvement
- Log cases where the model's garment type or style prediction is manually corrected via the annotation panel. Surface these as candidate fine-tuning examples, enabling periodic supervised fine-tuning of the classification prompt or a downstream classifier.
- Implement a confidence score for each classified field (derived from GPT-4o logprob output or a secondary verification pass) and surface low-confidence predictions to users for review rather than treating all classifications as equally reliable.

#### Trend Intelligence Layer
- Aggregate `trend_notes` and `style` fields across the collection and use an LLM to generate periodic trend briefings (e.g., "This week's uploads suggest a strong shift toward relaxed tailoring and earthy tones").
- Export trend summaries as PDF or Markdown reports suitable for stakeholder presentations.

---

*These improvements are ordered roughly by implementation complexity and business impact. Items in §1 (Evaluation) and the reliability sub-section of §2 are recommended as the highest-priority near-term investments, as they directly underpin trustworthiness of the AI pipeline in a production context.*
