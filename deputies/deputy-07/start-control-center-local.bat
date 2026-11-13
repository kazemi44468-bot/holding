@echo off
setlocal
cd /d "%~dp0local-data"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required. Install the current LTS version, then run this file again.
  pause
  exit /b 1
)
if not exist node_modules (
  echo Installing local dependencies for the first run...
  call npm install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)
echo Starting Deputy 7 Control Center at http://127.0.0.1:5174/control-center.html
call npm run dev:control-center
pause
