@echo off
setlocal
for %%I in ("%~dp0..\..") do set "ROOT=%%~fI"
set "URL=http://127.0.0.1:8765/deputies/deputy-07/pages/mission-create.html"
netstat -ano | findstr /R /C:":8765 .*LISTENING" >nul
if not errorlevel 1 goto openpage
where py >nul 2>nul
if not errorlevel 1 (
  start "معاونت ۷ - اجرای محلی" /D "%ROOT%" py -3 -m http.server 8765 --bind 127.0.0.1
  goto openpage
)
where python >nul 2>nul
if not errorlevel 1 (
  start "معاونت ۷ - اجرای محلی" /D "%ROOT%" python -m http.server 8765 --bind 127.0.0.1
  goto openpage
)
start "معاونت ۷ - اجرای محلی" powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0START-MISSIONS-SERVER.ps1" -Root "%ROOT%" -Port 8765
:openpage
timeout /t 2 /nobreak >nul
start "" "%URL%"
echo.
echo سامانه مأموریت‌ها در نشانی محلی باز شد:
echo %URL%
echo پنجره سرور را تا پایان کار باز نگه دارید.
echo اطلاعات در مرورگر همین رایانه و در IndexedDB ذخیره می‌شود.
echo برای انتقال یا نگهداری نسخه مستقل، از صفحه «مدیریت داده‌های محلی» فایل اطلاعات بگیرید.
echo.
pause
