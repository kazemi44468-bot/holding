@echo off
setlocal
cd /d "%~dp0..\.."
set "URL=http://127.0.0.1:8765/deputies/deputy-07/pages/mission-bank.html"
where py >nul 2>nul
if %errorlevel%==0 (
  start "معاونت ۷ - سرور آفلاین" cmd /k "cd /d ""%CD%"" && py -3 -m http.server 8765 --bind 127.0.0.1"
) else (
  where python >nul 2>nul
  if errorlevel 1 (
    echo Python 3 was not found. Install Python 3 or run this folder through another localhost web server.
    pause
    exit /b 1
  )
  start "معاونت ۷ - سرور آفلاین" cmd /k "cd /d ""%CD%"" && python -m http.server 8765 --bind 127.0.0.1"
)
timeout /t 2 /nobreak >nul
start "" "%URL%"
echo.
echo Local server is running at http://127.0.0.1:8765
echo Keep the server window open. For offline use, first open the pages once while online.
echo.
pause
