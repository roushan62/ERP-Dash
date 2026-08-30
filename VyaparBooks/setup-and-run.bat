@echo off
REM VyaparBooks developer setup + run script (Windows)
title VyaparBooks - Setup and Run
echo.
echo ==================================================
echo   VyaparBooks - Free Accounting & Finance Software
echo ==================================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js is not installed.
  echo.
  echo Please download and install Node.js LTS from:
  echo   https://nodejs.org/en/download
  echo After installing, close this window and double-click setup-and-run.bat again.
  pause
  exit /b 1
)

echo [1/3] Found Node.js: 
node --version

echo.
echo [2/3] Installing dependencies (first run may take a few minutes)...
call npm install --no-audit --no-fund
if errorlevel 1 (
  echo [ERROR] npm install failed. Check your internet connection and try again.
  pause
  exit /b 1
)

echo.
echo [3/3] Starting VyaparBooks...
call npm start
