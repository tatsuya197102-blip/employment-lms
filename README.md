# 外国人雇用LMS — employment-lms

株式会社J-MANGA CREATE が運営する外国人雇用研修向けeラーニングシステム。  
TERRAKOYAのFirebaseプロジェクトを共用するマルチテナント型SaaS。

---

## 技術スタック

| レイヤー | 採用技術 |
|---|---|
| フロントエンド | Next.js 14 (App Router) + TypeScript |
| スタイル | Tailwind CSS |
| 認証 | Firebase Authentication (Email/Password) |
| DB | Firestore (NoSQL・マルチテナント) |
| ホスティング | Vercel (GitHub CI/CD) |
| 動画 | YouTube 限定公開 (【M1】〜【M14】タグで自動マッピング) |

---

## ディレクトリ構成（予定）

```
src/
  app/
    learn/                  # 受講者画面
      login/
      (dashboard)/          # モジュール一覧
      module/[id]/          # 動画 + 冊子ビューア + クイズ
      certificate/          # 修了証
    admin/                  # 管理者画面
      login/
      (dashboard)/          # 全社完了率
      users/                # 受講者管理
      completions/          # 修了者リスト
  components/
    quiz/                   # クイズエンジン
    book-viewer/            # 冊子ビューア (IntersectionObserver)
    youtube/                # YouTube埋め込み
  lib/
    firebase.ts             # Firebase初期化
    firestore/              # Firestore操作関数
  types/
    lms.ts                  # 型定義
scripts/
  seed-quiz-bank.ts         # クイズ問題バンクのFirestore投入
quiz_bank_all.json          # 210問 (M1〜M14, 15問×14モジュール)
firestore.rules             # セキュリティルール
```

---

## セットアップ手順 (Phase 0)

### 1. リポジトリ作成
```bash
# GitHub上で tatsuya197102-blip/employment-lms を新規作成してから
git clone https://github.com/tatsuya197102-blip/employment-lms.git
cd employment-lms
```

### 2. 依存関係インストール
```bash
npm install
```

### 3. 環境変数設定
```bash
cp .env.local.example .env.local
# .env.local に TERRAKOYAのFirebaseプロジェクトの値を設定
```

TERRAKOYAのFirebase設定値は Firebase Console > プロジェクト設定 > 全般 から取得。  
既存の `NEXT_PUBLIC_FIREBASE_*` の値をそのまま使用。

### 4. ローカル起動確認
```bash
npm run dev
# http://localhost:3000 で確認
```

### 5. クイズ問題バンクをFirestoreに投入
```bash
# .env.local に FIREBASE_ADMIN_* を設定してから実行
npx ts-node scripts/seed-quiz-bank.ts
```

### 6. Firestoreセキュリティルールの適用
```bash
# Firebase CLI がインストール済みであること
firebase login
firebase use <TERRAKOYAのプロジェクトID>
firebase deploy --only firestore:rules
```

### 7. Vercel連携
1. Vercel にGitHubリポジトリを接続
2. Vercelの環境変数に `.env.local` の内容を設定
3. `main` ブランチへのプッシュで自動デプロイ開始

---

## YouTube動画マッピング仕様

動画タイトルの冒頭に **【M1】〜【M14】** のタグを付与することで、  
YouTube Data API v3 を通じて自動的にモジュールに割り当てられる。  
手動メンテ不要。

### 動画タイトル例
```
【M1】外国人雇用の基本と心構え（01）
【M1】外国人雇用の基本と心構え（02）
【M2】企業が直面する課題の全体像
```

---

## クイズ仕様

| 項目 | 仕様 |
|---|---|
| 形式 | 4択1答 |
| 出題数 | 各モジュール3問（15問プールからランダム） |
| 合格ライン | 80%以上（3問中2問以上正解） |
| 再試験 | 何度でも可（再試験時は別セットの可能性あり） |
| 問題バンク | 15問 × 14モジュール = 計210問 |
| 合格記録 | Cloud FunctionsがpassedAtをサーバーサイドで記録 |

---

## フェーズ計画

| Phase | 期間 | 内容 |
|---|---|---|
| Phase 0 | 〜2週間 | 本READMEのセットアップ完了 |
| Phase 1 | 3〜4週間 | 認証・ダッシュボード・冊子ビューア・YouTube埋め込み |
| Phase 2 | 2〜3週間 | クイズエンジン・進捗トラッキング・Cloud Functions |
| Phase 3 | 2週間 | 管理者ダッシュボード・CSV招待・修了者リスト |
| Phase 4 | 1〜2週間 | 修了証・UI調整・モバイル対応・セキュリティルール確認 |
| リリース準備 | 1週間 | UAT・バグ修正・ドメイン設定 |
