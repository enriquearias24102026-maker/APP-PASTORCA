@echo off
echo ============================================
echo   PASTORCA - Deploy a Firebase Hosting
echo ============================================
echo.

echo [1/3] Construyendo la aplicacion...
call npm run build
if errorlevel 1 (
  echo ERROR: Fallo la construccion de la app.
  pause
  exit /b 1
)

echo.
echo [2/3] Desplegando a Firebase Hosting...
call firebase deploy --only hosting
if errorlevel 1 (
  echo ERROR: Fallo el deploy a Firebase.
  pause
  exit /b 1
)

echo.
echo ============================================
echo   DEPLOY EXITOSO!
echo   URL: https://app-ventas-compras-3ab35.web.app
echo ============================================
pause
