[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# VRChat Event Search - Local Launcher
# このスクリプトはバックエンドとフロントエンドを起動し、ブラウザを開きます。

$ErrorActionPreference = "Stop"

Write-Host "=== VRChat Event Search 起動中 ===" -ForegroundColor Cyan

# プロジェクトルートディレクトリ (スクリプトの場所)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. バックエンドの起動
Write-Host "1. バックエンドサーバーを起動しています..." -ForegroundColor Green
# 新しいウィンドウで npm start を実行 (backendフォルダへ移動してから)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; npm start"

# 2. フロントエンドの起動
Write-Host "2. フロントエンドサーバーを起動しています..." -ForegroundColor Green
# 新しいウィンドウで npx serve を実行 (frontendフォルダへ移動してから)
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\frontend'; npx serve -s dist"

# 3. ブラウザを開く
Write-Host "3. サーバーの起動を待機しています (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "ブラウザを開きます: http://localhost:3000" -ForegroundColor Cyan
Start-Process "http://localhost:3000"

Write-Host "起動完了！" -ForegroundColor Green
Write-Host "終了するには、開いた2つのPowerShellウィンドウを閉じてください。" -ForegroundColor Gray
