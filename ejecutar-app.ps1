# Este script ejecuta los comandos en secuencia correctamente en PowerShell

Write-Host "Verificando versión de Railway..." -ForegroundColor Cyan
railway version

Write-Host "`nIniciando la aplicación Python..." -ForegroundColor Green
& "d:\TFG\.venv\Scripts\python.exe" "d:\TFG\Programacion\py\app.py"
