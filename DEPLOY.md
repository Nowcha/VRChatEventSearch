# VRChat Event Search デプロイメントガイド (Deployment Guide)

このガイドでは、VRChat Event Search アプリケーション（フロントエンド + バックエンド）のデプロイ（展開）手順を説明します。

## 1. 前提条件 (Prerequisites)

- **Node.js**: v20 以上
- **Docker**: コンテナでバックエンドを動かす場合（任意）
- **VRChat アカウント**: アプリ自体の動作には必須ではありませんが、コンテキスト理解のため
- **X (Twitter) アカウント**: Xのスクレイピング機能を使用する場合、Cookie情報が必要です

## 2. 環境変数 (Environment Variables)

### バックエンド (`backend/.env`)

| 変数名 | 説明 | 必須 | 設定例 |
|--------|------|------|--------|
| `DATABASE_URL` | Prisma (SQLite) 用の接続文字列 | はい | `"file:./dev.db"` |
| `PORT` | APIサーバーのポート | いいえ | `3001` |
| `TWITTER_AUTH_TOKEN` | Xスクレイピング用の認証トークン | はい | `(ブラウザのCookieから取得)` |
| `TWITTER_CT0` | Xスクレイピング用のCT0トークン | はい | `(ブラウザのCookieから取得)` |

### フロントエンド (`frontend/.env`)

| 変数名 | 説明 | 必須 | 設定例 |
|--------|------|------|--------|
| `VITE_API_URL` | バックエンドAPIのURL | はい | `http://localhost:3001` (ローカル) または `https://your-api.com` (本番) |

---

## 3. 手動デプロイ手順（ローカル/VPS）

### バックエンド (Backend)

1. `backend` ディレクトリに移動します:
   ```bash
   cd backend
   ```
2. 依存関係をインストールします:
   ```bash
   npm install
   ```
3. プロジェクトをビルドします:
   ```bash
   npm run build
   ```
   *注意: `src/analyze-structure.ts` などのデバッグ用スクリプトはビルドから除外されます。*
4. データベースを初期化します:
   ```bash
   npx prisma generate
   npx prisma db push
   ```
5. サーバーを起動します:
   ```bash
   npm start
   ```

### フロントエンド (Frontend)

1. `frontend` ディレクトリに移動します:
   ```bash
   cd frontend
   ```
2. 依存関係をインストールします:
   ```bash
   npm install
   ```
3. 本番用にビルドします:
   ```bash
   npm run build
   ```
4. プレビューまたは配信:
   ```bash
   npm run preview
   # または 'serve' などの静的サイトサーバーを使用
   npx serve -s dist
   ```

---

## 4. Docker デプロイ（バックエンド）

バックエンドには Puppeteer (Chrome) が必要なため、Dockerを使用すると環境構築が容易になります。

1. イメージのビルド:
   ```bash
   cd backend
   docker build -t vrceve-backend .
   ```

2. コンテナの実行:
   ```bash
   docker run -d \
     -p 3001:3001 \
     -e DATABASE_URL="file:/app/prisma/dev.db" \
     -e TWITTER_AUTH_TOKEN="your_token" \
     -e TWITTER_CT0="your_ct0" \
     -v $(pwd)/prisma:/app/prisma \
     --name vrceve-backend \
     vrceve-backend
   ```
   *注意: SQLiteのデータを保持するために `prisma` ディレクトリをボリュームマウントしています。*

---

## 5. 推奨されるクラウド構成案

このアプリケーションをインターネット上に公開する場合、以下の構成が推奨されます。

### パターンA: 手軽な構成 (PaaS)
- **フロントエンド**: **Vercel** または **Cloudflare Pages** (無料枠で十分、設定が簡単)
- **バックエンド**: **Render.com** (Docker対応、ディスク永続化が必要なため有料プラン推奨、または定期的にDBリセット許容なら無料も可)
    - *注意*: SQLite (`file:./dev.db`) を使用しているため、Renderの "Disk" 機能（有料）を使うか、PostgreSQL等の外部DBに切り替えることを推奨します。

### パターンB: 自由度の高い構成 (VPS)
- **サーバー**: **KAGOYA**, **ConoHa**, **DigitalOcean** 等のVPS (Linux/Ubuntu)
- **方法**: 上記の「3. 手動デプロイ手順」または「4. Docker デプロイ」をサーバー上で実行。
- **メリット**: Puppeteerの動作が安定しやすく、SQLiteファイルもそのまま管理できます。コストも月額500円〜1000円程度で済みます。

## 6. 注意点

- **X (Twitter) のスクレイピング**: Puppeteerを使用するため、認証情報（Cookie）が必要です。これらは定期的に切れる可能性があるため、環境変数の更新が必要になる場合があります。
- **SQLiteの永続化**: コンテナやPaaS (Render/Heroku) は再起動時にファイルが消えることがあるため、永続化ストレージ（Volume）の設定か、PostgreSQLへの移行を検討してください。
