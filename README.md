# Fashion Garment Classification & Inspiration Web App

AI-powered web application that helps fashion designers organize, search, and reuse inspiration imagery collected from the field.

The system automatically analyzes uploaded garment photos, extracts structured fashion attributes using a multimodal AI model, and enables both **attribute-based filtering and natural-language semantic search** across the image library.

---

# Overview

Design teams often collect hundreds or thousands of inspiration images from markets, retail stores, and streetwear across different geographies. When those images are scattered across phones or shared folders, they become difficult to organize, search, and reuse.

This project demonstrates how modern AI capabilities—multimodal models, embeddings, and vector search—can convert those unstructured image collections into a **searchable inspiration knowledge base for designers**.

Core capabilities include:

• Image upload and automatic AI garment classification
• Structured metadata extraction (style, material, pattern, etc.)
• Natural-language search across visual inspiration images
• Attribute-based filtering across fashion and contextual metadata
• Designer annotations layered on top of AI-generated insights

---

# Key Features

## 1. AI Image Classification

Uploaded images are processed using a multimodal vision model that generates:

**Natural language description**
Example:

> "Red embroidered bohemian dress with floral patterns and artisan stitching."

**Structured attributes**

* garment type
* style
* material
* color palette
* pattern
* season
* occasion
* consumer profile
* trend notes
* geographic context

These attributes allow designers to filter inspiration images more effectively.

---

## 2. Semantic Image Search

Designers can search the library using natural language queries such as:

```
embroidered neckline
streetwear oversized jacket
artisan market dress
```

Search queries are converted into embeddings and compared against image embeddings using vector similarity search.

This enables **conceptual discovery rather than simple keyword matching**.

---

## 3. Dynamic Attribute Filtering

Filters are generated dynamically from the dataset and include:

Fashion attributes

* garment type
* style
* material
* color palette
* pattern
* season
* occasion

Contextual attributes

* continent
* country
* city
* designer
* capture date

This allows users to combine multiple filters when exploring design inspiration.

---

## 4. Designer Annotations

Designers can add their own insights alongside AI-generated metadata:

* custom tags
* notes
* observations

Annotations remain searchable and are visually distinguished from AI output.

---

# System Architecture

The application uses a lightweight full-stack architecture designed for rapid experimentation with AI-assisted workflows.

```
React Frontend
      │
      │ REST API
      ▼
FastAPI Backend
      │
      │ AI Classification
      │ Embedding Generation
      ▼
PostgreSQL + pgvector
      │
      ▼
Image Storage
```

### Frontend

React + TypeScript + TailwindCSS

Responsibilities:

* image upload
* search interface
* filtering UI
* designer annotation tools
* image gallery display

### Backend

FastAPI service responsible for:

* image ingestion
* AI classification
* metadata parsing
* embedding generation
* search APIs
* filtering APIs

### Database

PostgreSQL stores:

* garment metadata
* annotations
* embeddings

Vector search is implemented using **pgvector**.

---

# Repository Structure

```
app/
  frontend/         React UI
  backend/          FastAPI service

eval/
  dataset/          evaluation images
  labels.json       ground-truth attributes
  evaluate_model.py

tests/
  test_parser.py
  test_filters.py
  test_e2e.py

README.md
```

---

# Setup Instructions

## 1. Clone the Repository

```
git clone <repo-url>
cd fashion-ai-app
```

---

## 2. Start the Backend

```
cd app/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Backend runs at:

```
http://localhost:8000
```

---

## 3. Start the Frontend

```
cd app/frontend
npm install
npm run dev
```

Frontend runs at:

```
http://localhost:5173
```

---

## 4. Environment Variables

Create `.env` inside `app/backend`.

```
OPENAI_API_KEY=your_key
DATABASE_URL=postgresql://user:password@localhost:5432/fashiondb
```

---

# Model Evaluation

To evaluate the garment classifier, a test dataset of **75 fashion images** was collected from open-source fashion imagery.

Dataset source: fashion images from publicly available stock photo platforms.

Each image was manually labeled with expected attributes including:

* garment type
* style
* material
* occasion
* location context

The AI classifier was run across the dataset and predictions were compared against the ground truth labels.

---

## Evaluation Results

| Attribute        | Accuracy |
| ---------------- | -------- |
| Garment Type     | 86%      |
| Style            | 73%      |
| Material         | 61%      |
| Occasion         | 69%      |
| Location Context | 65%      |

---

## Observations

**Strengths**

The model performs well when identifying high-level garment types such as dresses, jackets, or coats.

Style classification also performs reasonably well for clear visual categories such as streetwear or formal wear.

**Challenges**

Material classification is more difficult because materials like cotton, linen, and polyester are visually similar in many images.

Location inference is also imperfect because geographic context is often inferred from patterns or cultural styling rather than explicit visual markers.

---

## Potential Improvements

With more development time, improvements could include:

• Fine-tuning a vision model on a fashion-specific dataset
• Using multiple prompts to improve attribute extraction
• Incorporating CLIP-style multimodal embeddings
• Training a lightweight garment classifier for structured attributes

---

# Testing

The repository includes several tests to ensure reliability.

### Unit Test

```
tests/test_parser.py
```

Validates the logic that converts AI output into structured attributes.

---

### Integration Test

```
tests/test_filters.py
```

Ensures filtering logic works correctly across garment attributes and contextual metadata.

---

### End-to-End Test

```
tests/test_e2e.py
```

Covers the full workflow:

1. Upload image
2. AI classification
3. Metadata storage
4. Search / filtering

---

# Design Decisions

Several simplifying decisions were made to focus on the core workflow:

**Local image storage**

Images are stored locally instead of using object storage to simplify the setup.

**Single AI model**

A single multimodal model is used for both description generation and attribute extraction.

**Lightweight architecture**

The system uses a simple full-stack architecture suitable for rapid experimentation.

---

# Limitations

This prototype focuses on demonstrating the AI workflow rather than production-scale infrastructure.

Limitations include:

* limited evaluation dataset
* heuristic parsing of model output
* no authentication or multi-user support
* simplified location inference

---

# Future Work

Potential extensions include:

* trend clustering across image embeddings
* similarity-based inspiration discovery
* designer collaboration tools
* fashion trend prediction dashboards

---

# Conclusion

This project demonstrates how multimodal AI models and vector search can transform unstructured image collections into a structured and searchable inspiration platform for fashion designers.

By combining AI-generated metadata, semantic search, and human annotations, the system enables designers to **organize and revisit inspiration imagery more effectively.**
