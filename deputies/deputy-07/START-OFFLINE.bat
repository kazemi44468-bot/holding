@echo off
setlocal EnableExtensions
title معاونت ۷ - اجرای محلی مأموریت‌ها
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
set "URL=http://127.0.0.1:8766/deputies/deputy-07/pages/mission-create.html"

echo ==========================================
echo   سامانه مأموریت‌های معاونت ۷ - اجرای محلی
echo ==========================================
echo.

REM If this local server is already running, reuse it.
powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 'http://127.0.0.1:8766/deputies/deputy-07/pages/mission-create.html'; if($r.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }"
if not errorlevel 1 goto openpage

where py >nul 2>nul
if not errorlevel 1 (
  py -3 --version >nul 2>nul
  if not errorlevel 1 (
    start "سرور محلی معاونت ۷" /D "%ROOT%" cmd /k "py -3 -m http.server 8766 --bind 127.0.0.1"
    goto waitserver
  )
)

where python >nul 2>nul
if not errorlevel 1 (
  python --version >nul 2>nul
  if not errorlevel 1 (
    start "سرور محلی معاونت ۷" /D "%ROOT%" cmd /k "python -m http.server 8766 --bind 127.0.0.1"
    goto waitserver
  )
)

echo Python 3 روی اين رايانه پيدا نشد.
echo.
echo فقط يک بار Python 3 را از نشانی رسمی نصب کن:
echo https://www.python.org/downloads/windows/
echo هنگام نصب، گزينه Add Python to PATH را فعال کن.
echo سپس اين فايل را دوباره اجرا کن.
echo.
pause
exit /b 1

:waitserver
echo در حال راه‌اندازی وب‌سرور محلی...
for /L %%N in (1,1,15) do (
  powershell -NoProfile -Command "try { $r=Invoke-WebRequest -UseBasicParsing -TimeoutSec 1 'http://127.0.0.1:8766/deputies/deputy-07/pages/mission-create.html'; if($r.StatusCode -eq 200){exit 0}else{exit 1} } catch { exit 1 }"
  if not errorlevel 1 goto openpage
  timeout /t 1 /nobreak >nul
)
echo.
echo وب‌سرور در زمان مقرر آماده نشد. پنجره سرور را بررسی کن.
pause
exit /b 1

:openpage
echo.
echo سامانه در نشانی زير باز می‌شود:
echo %URL%
echo برای پايان کار، پنجره «سرور محلی معاونت ۷» را ببند.
echo اطلاعات در مرورگر همين رايانه و در IndexedDB ذخيره می‌شود.
echo برای نگهداری نسخه مستقل، از صفحه مديريت داده‌های محلی خروجی بگير.
echo.
start "" "%URL%"
exit /b 0
