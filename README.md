# Fashion AI Inspiration Library

## Overview
AI-powered web app for organizing fashion inspiration images.

## Architecture

React + FastAPI + PostgreSQL + pgvector

## Features

- Image upload
- AI garment classification
- Dynamic attribute filters
- Natural language search
- Designer annotations

## Setup Instructions

### 1. Clone the repository

git clone https://github.com/yourname/fashion-ai-app

cd fashion-ai-app

### 2. Install frontend dependencies

cd app/frontend

npm install

### 3. Start the frontend

npm run dev

The UI will start at:

http://localhost:5173






## Model Evaluation

Dataset: 75 Pexels images

Accuracy:
Garment Type: 85%
Style: 70%
Material: 58%

## Limitations

Material classification is difficult due to visual ambiguity.

## Future Work

Fine-tuning fashion-specific vision models.