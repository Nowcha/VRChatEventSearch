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

    Write-Host "専用のChromeブラウザウィンドウ(アプリモード)を開きます..." -ForegroundColor Cyan
    Write-Host "この画面の「」ボタンを押して閉じると、裏で動いているサーバーも自動で終了します。" -ForegroundColor Magenta

    # Chromeをアプリモードで起動（以前Chromeで開いていた設定に戻します）
    # Start-Process -Wait はブラウザの仕様で抜けやすいため、Windowタイトルで死活監視します。
    # Viteなどで表示されるページタイトルは "Vite + React + TS" 等になっている可能性があるため、URL等で判断します。
    
    $TempProfile = Join-Path $env:TEMP "VRCEve_ChromeProfile"
    
    # プロファイルを毎度クリーンにする（前回のクラッシュ復元などを防ぐため）
    if (Test-Path $TempProfile) {
        Remove-Item -Path $TempProfile -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    try {
        Start-Process "chrome.exe" -ArgumentList "--app=http://localhost:3000", "--user-data-dir=`"$TempProfile`"", "--disable-restore-session-state"
    }
    catch {
        Write-Host "Chromeが見つかりません。通常のブラウザで開きます..." -ForegroundColor Yellow
        Start-Process "http://localhost:3000"
    }

    # ======== 終了監視ループ ========
    # chrome.exe のうち、今回作成したプロファイルフォルダのパスをコマンドライン引数に持つプロセスを探す
    Write-Host "ブラウザの終了を監視中..." -ForegroundColor DarkGray
    
    Start-Sleep -Seconds 3 # 起動猶予
    
    $WaitLoop = $true
    while ($WaitLoop) {
        Start-Sleep -Seconds 2
        
        # Get-CimInstance を使って、コマンドライン引数に独自プロファイルのパスを含んでいるプロセスを検索
        # Get-Processだと引数が取得できないためWMI(CIM)を使用
        $chromeProcesses = Get-CimInstance Win32_Process -Filter "Name = 'chrome.exe'" | Where-Object { $_.CommandLine -match "VRCEve_ChromeProfile" }
        
        # もし対象のプロセスが1つも見つからなくなったら（＝全て閉じられたら）、ループを抜ける
        if (!$chromeProcesses) {
            Write-Host "専用プロファイルのChromeプロセスが消失しました。" -ForegroundColor Yellow
            $WaitLoop = $false
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
