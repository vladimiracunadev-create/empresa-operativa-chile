@echo off
REM Arranca Empresa Operativa Chile en el navegador, sin instalar nada.
REM Si prefieres una aplicacion de escritorio de verdad, descarga el instalador
REM de Windows desde la seccion Releases del repositorio.

setlocal
cd /d "%~dp0..\.."

where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo   Falta Node.js 20 o superior. Descargalo desde https://nodejs.org
  echo.
  pause
  exit /b 1
)

echo.
echo   Construyendo la aplicacion...
node scripts\build-all.mjs
if errorlevel 1 (
  echo   El build fallo.
  pause
  exit /b 1
)

start "" http://127.0.0.1:4180
node apps\empresa-operativa\server.mjs

endlocal
