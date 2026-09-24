@echo off
title CetakPro POS - Desktop Launcher
cd /d "%~dp0"
echo ==========================================================
echo     CetakPro POS & SPK Percetakan (MySQL Desktop)        
echo ==========================================================
echo.
echo 1. Memulai backend server API & database MySQL...
start /b node server/index.js
echo 2. Memulai aplikasi Desktop...
npm run electron:dev
pause
