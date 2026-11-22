@echo off
chcp 65001 >nul
title Instalador Lexxo PDF Extract
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0instalar.ps1"
echo.
pause
