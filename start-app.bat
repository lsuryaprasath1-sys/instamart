@echo off
title Swiggy Instamart Rack Audit Management
echo ====================================================================
echo   SWIGGY INSTAMART RACK AUDIT MANAGEMENT SYSTEM
echo   Dark Store Operations - FC-BLR-04
echo ====================================================================
echo.

echo [1/3] Compiling React Vite Frontend...
call npm.cmd --prefix client run build

echo.
echo [2/3] Building Swiggy_Instamart_Rack_Audit.apk Package...
call node build-apk.js
if errorlevel 1 echo APK unavailable until the Android SDK is configured and the native build succeeds.

echo.
echo [3/3] Launching Backend Server on Port 5000...
echo.
echo ====================================================================
echo   Local Web App & Control Center: http://localhost:5000
echo   Admin Mobile Phone:             9876543210 (with SMS OTP)
echo   Picker Test Account:            PKR-101 / picker123
echo ====================================================================
echo.

node server/index.js
pause
