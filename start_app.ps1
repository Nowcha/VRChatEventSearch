[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# VRChat Event Search - Local Launcher
# このスクリプトはバックエンドとフロントエンドを起動し、ブラウザを開きます。

$ErrorActionPreference = "Stop"

Write-Host "=== VRChat Event Search 起動中 ===" -ForegroundColor Cyan

# プロジェクトルートディレクトリ (スクリプトの場所を確実に取得)
$ScriptDir = $PSScriptRoot
if ([string]::IsNullOrEmpty($ScriptDir)) {
    $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
}
Set-Location $ScriptDir

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
# 注意: 既存のブラウザプロセス(Edge等)が既に起動している場合、-Wait を付けても
# プロセスが既存のウィンドウに統合されてすぐに制御が戻ってしまう問題があります。
# そのため、PowerShellウィンドウを開いたまま待機させるための手動終了プロンプトを用意します。

try {
    Write-Host "Edge ブラウザを新しいウィンドウで起動します..." -ForegroundColor Cyan
    Start-Process "msedge.exe" -ArgumentList "--new-window http://localhost:3000"
}
catch {
    Write-Host "Edgeが見つかりません。デフォルトブラウザで開きます..." -ForegroundColor Yellow
    Start-Process "http://localhost:3000"
}

Write-Host ""
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host "  サーバー稼働中: http://localhost:3000" -ForegroundColor Magenta
Write-Host "  終了するには、このウィンドウで何かキーを押すか、" -ForegroundColor Magenta
Write-Host "  ウィンドウ右上の [X] ボタンで閉じてください。" -ForegroundColor Magenta
Write-Host "======================================================" -ForegroundColor Magenta
Write-Host ""

# ここでスクリプトの実行を一時停止させ、ユーザーの入力を待つ（これでウィンドウが勝手に閉じない）
$Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null

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
