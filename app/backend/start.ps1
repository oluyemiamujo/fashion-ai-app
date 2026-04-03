# Fashion AI – Backend Startup Script
# Usage: .\start.ps1

$env:PATH = "$env:USERPROFILE\.local\bin;$env:PATH"

$BACKEND_DIR = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $BACKEND_DIR

# Activate virtual environment
$ACTIVATE = Join-Path $BACKEND_DIR ".venv\Scripts\Activate.ps1"
if (Test-Path $ACTIVATE) {
    . $ACTIVATE
} else {
    Write-Error ".venv not found. Run: uv venv .venv --python 3.11 && uv pip install -r requirements.txt"
    exit 1
}

# Verify .env exists
if (-not (Test-Path ".env")) {
    Write-Warning ".env file not found. Copy .env.example to .env and fill in your credentials."
}

Write-Host "Starting Fashion AI backend on http://localhost:8000 ..." -ForegroundColor Cyan
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
