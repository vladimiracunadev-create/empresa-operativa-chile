# Arranca Empresa Operativa Chile en el navegador, sin instalar nada.
# Si prefieres una aplicación de escritorio de verdad, descarga el instalador de
# Windows desde la sección Releases del repositorio.

$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..\..')

if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host ''
    Write-Host '  Falta Node.js 20 o superior. Descárgalo desde https://nodejs.org' -ForegroundColor Yellow
    Write-Host ''
    exit 1
}

Write-Host ''
Write-Host '  Construyendo la aplicación...' -ForegroundColor Cyan
node scripts/build-all.mjs

Start-Process 'http://127.0.0.1:4180'
node apps/empresa-operativa/server.mjs
