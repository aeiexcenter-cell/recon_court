@echo off
echo ==========================================
echo   Recon Court Project - Frontend Starter
echo ==========================================

echo [1/1] Starting Frontend (Vue 3 / Vite)...
start "Frontend Dev" cmd /k "npm run dev"

echo [2/2] Opening Browser...
timeout /t 2 /nobreak >nul
start http://localhost:5173

echo.
echo Frontend is starting in a separate window.
echo Back to work!
timeout /t 3
