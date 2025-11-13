@echo off
title TinyPaws Frontend - Auto Start
color 0B

echo.
echo ========================================
echo   TINYPAWS FRONTEND AUTO START
echo ========================================
echo.

echo [1] Killing existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo [2] Freeing port 5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do (
    echo Killing PID: %%a
    taskkill /PID %%a /F >nul 2>&1
)

echo [3] Waiting for cleanup...
timeout /t 2 /nobreak >nul

echo [4] Starting frontend...
echo.
npm run dev
