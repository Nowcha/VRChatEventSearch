[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

# VRChat Event Search - Local Launcher
# このスクリプトはバックエンドとフロントエンドを起動し、ブラウザを開きます。

$ErrorActionPreference = "Continue"

try {
    Write-Host "=== VRChat Event Search 起動中 ===" -ForegroundColor Cyan
    
    # プロンプト実行場所にかかわらず確実にスクリプトディレクトリを取得する
    $ScriptDir = $PSScriptRoot
    if ([string]::IsNullOrEmpty($ScriptDir)) {
        $ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    }
    
    # 取得失敗時のセーフガード
    if ([string]::IsNullOrEmpty($ScriptDir) -or !(Test-Path $ScriptDir)) {
        throw "スクリプトのディレクトリを取得できませんでした。: $ScriptDir"
    }

    Set-Location $ScriptDir
    Write-Host "カレントディレクトリ: $($(Get-Location))" -ForegroundColor DarkGray

    # 1. バックエンドの起動
    Write-Host "1. バックエンドサーバーを起動しています..." -ForegroundColor Green
    $BackendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\backend'; npm start" -PassThru

    # 2. フロントエンドの起動
    Write-Host "2. フロントエンドサーバーを起動しています..." -ForegroundColor Green
    $FrontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$ScriptDir\frontend'; npx serve -s dist" -PassThru

    # 3. ブラウザを開く
    Write-Host "3. サーバーの起動を待機しています (5秒)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5

    Write-Host "専用のブラウザウィンドウを開きます..." -ForegroundColor Cyan
    Write-Host "このブラウザ画面を閉じると、裏で動いているサーバーも自動で終了します。" -ForegroundColor Magenta

    # 専用のプロファイルディレクトリを作成して、完全に独立したプロセスとしてブラウザを起動する
    # これにより既存のブラウザが開いていても「終了待機 (-Wait)」が確実に動作します。
    $TempProfile = Join-Path $env:TEMP "VRCEve_Profile"
    
    try {
        # Edgeをアプリモードで起動 (独立プロセス)
        Start-Process "msedge.exe" -ArgumentList "--app=http://localhost:3000", "--user-data-dir=`"$TempProfile`"" -Wait
    }
    catch {
        Write-Host "Edgeでの起動に失敗しました。Chromeで試行します..." -ForegroundColor Yellow
        try {
            Start-Process "chrome.exe" -ArgumentList "--app=http://localhost:3000", "--user-data-dir=`"$TempProfile`"" -Wait
        }
        catch {
            Write-Host "Chromeも見つかりません。通常のブラウザで開きます（この場合自動終了は効きません）" -ForegroundColor Red
            Start-Process "http://localhost:3000"
            Write-Host "終了するにはキーを押してください..." -ForegroundColor Magenta
            $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown") | Out-Null
        }
    }

    # 一時プロファイルフォルダのお掃除
    if (Test-Path $TempProfile) {
        Remove-Item -Path $TempProfile -Recurse -Force -ErrorAction SilentlyContinue
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
}
catch {
    Write-Host ""
    Write-Host "================= 重大なエラーが発生しました ==================" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host $_.InvocationInfo.PositionMessage -ForegroundColor Red
    Write-Host "===============================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "この画面をスクリーンショットなどで撮影し、教えてください。" -ForegroundColor Yellow
    
    # 窓が勝手に閉じないように無限ループで待機
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
