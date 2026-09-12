@echo off
REM Levanta el sitio estatico de /diseno en http://localhost:5173
setlocal
set PUERTO=5173
if not "%1"=="" set PUERTO=%1
cd /d "%~dp0"
start "" http://localhost:%PUERTO%/landing.html
python -m http.server %PUERTO% --directory diseno
