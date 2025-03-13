@echo off
:: Script para ejecutar la aplicación con Railway

echo Verificando versión de Railway...
powershell -ExecutionPolicy Bypass -Command "railway version"

echo Iniciando aplicación Python...
d:\TFG\.venv\Scripts\python.exe d:\TFG\Programacion\py\app.py
