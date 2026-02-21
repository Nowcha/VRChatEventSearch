# VRChat Event Search ローカル実行ガイド

このアプリをあなたのPC（ローカル環境）で簡単に起動するためのガイドです。

## 一発起動スクリプト

プロジェクトのルートフォルダにある `start_app.ps1` を実行すると、必要なサーバーが自動的に立ち上がり、ブラウザが開きます。

### 使い方

1. `start_app.ps1` を右クリックして「PowerShell で実行」を選択してください。
2. 以下のウィンドウが開きます：
   - **Backend Server**: APIサーバー（ポート3001）
   - **Frontend Server**: Webサイト（ポート3000）
   - **ブラウザ**: `http://localhost:3000`
3. 使い終わったら、新しく開いた2つの黒いウィンドウ（PowerShell）を閉じてください。

## 手動で起動する場合

もしスクリプトが動かない場合は、以下の手順で手動起動してください。

1. **Terminal 1 (Backend)**:
   ```powershell
   cd backend
   npm start
   ```
   
2. **Terminal 2 (Frontend)**:
   ```powershell
   cd frontend
   npx serve -s dist
   ```

3. ブラウザで `http://localhost:3000` にアクセスしてください。

## 注意事項

- **X (Twitter) のスクレイピングについて**:
  バックエンドサーバー（`npm start` のウィンドウ）にログが表示されます。
  Cookieの有効期限が切れるとスクレイピングに失敗することがあります。その場合は `backend/.env` の `TWITTER_AUTH_TOKEN` と `TWITTER_CT0` を更新し、バックエンドを再起動してください。
