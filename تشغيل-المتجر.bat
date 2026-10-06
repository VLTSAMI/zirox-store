@echo off
chcp 65001 > nul
title Zirox Store Algeria - Local Server
echo ===================================================
echo     ZIROX STORE - تشغيل المتجر ولوحة الإدارة
echo ===================================================
echo.
echo [1] العنوان الرئيسي للمتجر: http://localhost:8000/index.html
echo [2] لوحة التحكم الإدارية:  http://localhost:8000/admin.html
echo.
echo كلمة المرور الافتراضية للوحة الإدارة: zirox-admin-2026
echo.
echo اضغط Ctrl+C في هذه النافذة لإيقاف الخادم عند الانتهاء.
echo ===================================================
echo.

where python >nul 2>nul
if %errorlevel% equ 0 (
    echo [✔] تم اكتشاف Python - جاري تشغيل الخادم المحلي...
    start http://localhost:8000/admin.html
    python -m http.server 8000
    goto :eof
)

where node >nul 2>nul
if %errorlevel% equ 0 (
    echo [✔] تم اكتشاف Node.js - جاري تشغيل الخادم المحلي...
    start http://localhost:8000/admin.html
    node -e "const http=require('http'),fs=require('fs'),path=require('path');const mime={'.html':'text/html','.js':'application/javascript','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json','.ico':'image/x-icon'};http.createServer((req,res)=>{let f='.'+decodeURI(req.url.split('?')[0]);if(f==='./')f='./index.html';const ext=path.extname(f);fs.readFile(f,(err,data)=>{if(err){res.writeHead(404);res.end('Not Found');}else{res.writeHead(200,{'Content-Type':mime[ext]||'text/plain'});res.end(data);}});}).listen(8000,()=>console.log('Node Server listening on http://localhost:8000'));"
    goto :eof
)

echo [❌ خطأ] لم يتم العثور على Python أو Node.js مثبتين في النظام!
echo يُرجى تثبيت أحدهما لتشغيل الخادم المحلي:
echo   - Python: https://www.python.org/downloads/
echo   - Node.js: https://nodejs.org/
echo.
pause
