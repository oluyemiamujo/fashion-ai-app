# Fashion AI – Full Stack Startup Script
# Usage: .\start.ps1  (from project root)
# Starts the FastAPI backend (port 8000) and Vite frontend (port 5173).

$PROJECT  = Split-Path -Parent $MyInvocation.MyCommand.Definition
$BACKEND  = Join-Path $PROJECT "app\backend"
$FRONTEND = Join-Path $PROJECT "app\frontend"

# ── Kill any stale processes on 8000 / 5173 ──────────────────────────────────
foreach ($port in @(8000, 5173)) {
    $lines = netstat -ano | Select-String ":$port\s"
    $pids  = $lines | ForEach-Object { ($_ -split '\s+')[-1] } | Sort-Object -Unique
    foreach ($p in $pids) {
        if ($p -match '^\d+$' -and $p -ne '0') {
            Write-Host "Stopping stale PID $p on port $port" -ForegroundColor Yellow
            Stop-Process -Id ([int]$p) -Force -ErrorAction SilentlyContinue
        }
    }
}
Start-Sleep -Milliseconds 800

# ── Backend ───────────────────────────────────────────────────────────────────
Write-Host "`nStarting backend  ->  http://localhost:8000" -ForegroundColor Cyan
$uvicorn = Join-Path $BACKEND ".venv\Scripts\uvicorn.exe"
if (-not (Test-Path $uvicorn)) {
    Write-Error "uvicorn not found. Run:  cd app\backend; uv venv; uv pip install -r requirements.txt"
    exit 1
}
$backend = Start-Process -FilePath $uvicorn `
    -ArgumentList "main:app", "--host", "127.0.0.1", "--port", "8000", "--reload" `
    -WorkingDirectory $BACKEND -PassThru -NoNewWindow
Write-Host "Backend PID: $($backend.Id)"

# Wait for backend health check
$ready = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 400
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:8000/health" -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
}
if ($ready) { Write-Host "Backend ready.`n" -ForegroundColor Green }
else         { Write-Warning "Backend did not respond — check terminal output above." }

# ── Frontend ──────────────────────────────────────────────────────────────────
Write-Host "Starting frontend  ->  http://localhost:5173" -ForegroundColor Cyan
if (-not (Test-Path (Join-Path $FRONTEND "node_modules"))) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Gray
    npm --prefix $FRONTEND install
}
$frontend = Start-Process -FilePath "npm" `
    -ArgumentList "run", "dev" `
    -WorkingDirectory $FRONTEND -PassThru -NoNewWindow
Write-Host "Frontend PID: $($frontend.Id)"

Write-Host "`n  Fashion AI running at http://localhost:5173" -ForegroundColor Green
Write-Host "   Press Ctrl+C to stop both servers.`n" -ForegroundColor Gray

# Keep alive; Ctrl+C kills both
try {
    Wait-Process -Id $backend.Id, $frontend.Id -ErrorAction SilentlyContinue
} finally {
    Stop-Process -Id $backend.Id  -Force -ErrorAction SilentlyContinue
    Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Servers stopped." -ForegroundColor Yellow
}
