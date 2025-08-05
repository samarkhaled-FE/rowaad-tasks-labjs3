@echo off
echo ========================================
echo   نظام إدارة الحسابات المصرفية
echo ========================================
echo.
echo بدء تشغيل الخادم المحلي...
echo.
echo يمكنك الآن فتح المتصفح على:
echo http://localhost:8000
echo.
echo للخروج، اضغط Ctrl+C
echo.
python -m http.server 8000
pause 