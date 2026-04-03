# Fashion AI App - Frontend Dev Server
Set-Location "$PSScriptRoot\app\frontend"

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "Starting Fashion AI dev server at http://localhost:5173" -ForegroundColor Green
npm run dev
