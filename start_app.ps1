[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# VRChat Event Search - Local Launcher
# このスクリプトはバックエンドとフロントエンドを起動し、ブラウザを開きます。

$ErrorActionPreference = "Stop"

Write-Host "=== VRChat Event Search 起動中 ===" -ForegroundColor Cyan

# プロジェクトルートディレクトリ (スクリプトの場所)
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# 1. バックエンドの起動
Write-Host "1. バックエンドサーバーを起動しています..." -ForegroundColor Green
$BackendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; npm start" -PassThru

# 2. フロントエンドの起動
Write-Host "2. フロントエンドサーバーを起動しています..." -ForegroundColor Green
$FrontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\frontend'; npx serve -s dist" -PassThru

# 3. ブラウザを開く
Write-Host "3. サーバーの起動を待機しています (5秒)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "ブラウザを開きます: http://localhost:3000" -ForegroundColor Cyan
Write-Host "※ブラウザ（Edge/Chrome等）を閉じると、サーバーも自動で終了します。" -ForegroundColor Magenta

# ブラウザプロセスを起動し、終了を待機する
# 注意: 既存のブラウザプロセスにタブとして追加される場合、すぐ抜けてしまうため、新しいウィンドウとして起動するか、
# コマンドプロンプト側の終了待機機能を使います。
try {
    # Edgeを明示的に新しいウィンドウで起動し、待機するよう試みる
    Start-Process "msedge.exe" -ArgumentList "--new-window http://localhost:3000" -Wait
}
catch {
    # Edgeがないなどエラー発生時は標準の関連付けで開く（待機できない可能性あり）
    Start-Process "http://localhost:3000"
    Write-Host "ブラウザの待機プロセスを開始できませんでした。手動でウィンドウを閉じてください。" -ForegroundColor Red
    pause
}

# 4. クリーンアップ処理
Write-Host "ブラウザが閉じられました。サーバープロセスを終了しています..." -ForegroundColor Yellow

if ($BackendProcess -and !$BackendProcess.HasExited) {
    Stop-Process -Id $BackendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "バックエンドサーバーを停止しました。" -ForegroundColor Green
}

if ($FrontendProcess -and !$FrontendProcess.HasExited) {
    Stop-Process -Id $FrontendProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "フロントエンドサーバーを停止しました。" -ForegroundColor Green
}

Write-Host "すべての処理が完了しました。アプリケーションを終了します。" -ForegroundColor Cyan
Start-Sleep -Seconds 2
