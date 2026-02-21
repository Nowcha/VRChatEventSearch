@echo off
chcp 65001 > nul
echo === VRChat Event Search 起動中 ===
echo PowerShellスクリプトの実行許可をバイパスして起動します...
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0start_app.ps1"
pause
