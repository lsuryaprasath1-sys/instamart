@echo off
echo ====================================================================
echo   Building Swiggy Instamart Rack Audit Android APK Package...
echo ====================================================================

node "%~dp0build-apk.js"
if errorlevel 1 goto :build_failed

echo.
echo APK package is ready!
pause
exit /b 0

:build_failed
echo.
echo APK build failed. Configure the Android SDK and try again.
pause
exit /b 1
