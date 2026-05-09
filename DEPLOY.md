# 外国人雇用LMS — 完全セットアップ・運用マニュアル

## 全体アーキテクチャ

```
tatsuya197102-blip/employment-lms (GitHub)
  │
  ├── src/          ← Next.js 14 フロントエンド
  ├── functions/    ← Firebase Cloud Functions
  ├── firestore.rules
  └── quiz_bank_all.json  ← 210問（M1〜M14）

GitHub push → Vercel 自動デプロイ（フロントエンド）
           → firebase deploy（Cloud Functions・手動）
```

---

## Phase 0: 初回セットアップ（15分）

### 1. GitHubリポジトリ作成・push

```bash
# このZIPを解凍して GitHub に push
cd employment-lms
git init
git remote add origin https://github.com/tatsuya197102-blip/employment-lms.git
git add .
git commit -m "Initial commit: Phase 1-4 complete"
git push -u origin main
```

### 2. .env.local 作成

```bash
cp .env.local.example .env.local
```

TERRAKOYAのFirebase設定値を入力（Firebase Console → プロジェクト設定 → 全般）：

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=terrakoya-xxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=terrakoya-xxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=terrakoya-xxx.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123...

YOUTUBE_API_KEY=AIza...（Google Cloud Console で取得）
YOUTUBE_CHANNEL_ID=UC...（JMCのYouTubeチャンネルID）

FIREBASE_ADMIN_PROJECT_ID=terrakoya-xxx
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxx@terrakoya-xxx.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
```

### 3. Firebaseセキュリティルール・インデックスの適用

```bash
npm install -g firebase-tools
firebase login
firebase use <TERRAKOYAのプロジェクトID>
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. クイズ問題バンクをFirestoreに投入（1回のみ）

```bash
# FIREBASE_ADMIN_* を .env.local に設定してから
npx ts-node -r tsconfig-paths/register scripts/seed-quiz-bank.ts
```

### 5. 冊子HTMLの配置

```bash
# 外国人雇用マニュアル_完全版_2026.html を public/ にコピー
cp /path/to/外国人雇用マニュアル_完全版_2026.html public/manual.html
```

### 6. Vercel デプロイ

1. [vercel.com](https://vercel.com) → New Project → GitHub連携
2. `tatsuya197102-blip/employment-lms` を選択
3. **Environment Variables に `.env.local` の内容を全てコピー**
4. Deploy → 自動デプロイ完了

---

## Phase 1: Cloud Functions のデプロイ

```bash
cd functions
npm install
npm run build

# メール設定（Gmail App Password を使用）
firebase functions:config:set mail.user="your@gmail.com" mail.pass="xxxx xxxx xxxx xxxx"

# デプロイ
firebase deploy --only functions
```

---

## 管理者アカウントの初期設定

Firebase Console → Authentication → ユーザーを追加 でアカウント作成後、
Firestore に以下のドキュメントを手動で作成：

```
companies/{companyId}/users/{uid}
  email: "admin@yourcompany.com"
  displayName: "管理者名"
  role: "admin"
  companyId: "{companyId}"
  invitedAt: <current timestamp>

userIndex/{uid}
  companyId: "{companyId}"
```

---

## YouTube動画の設定

JMCのYouTubeチャンネルで動画タイトルを以下のフォーマットにする：

```
【M1】外国人雇用の基本と心構え（01）
【M1】外国人雇用の基本と心構え（02）
【M2】外国人材受け入れ企業の課題（01）
...
```

`【M1】`〜`【M14】` のタグがタイトルに含まれていれば自動マッピングされる。

---

## URL 構成

| URL | 説明 |
|---|---|
| `/learn/login` | 受講者ログイン |
| `/learn` | 受講者ダッシュボード |
| `/learn/module/M1` 〜 `/learn/module/M14` | 各モジュール（動画・冊子・クイズ） |
| `/learn/certificate` | 修了証（全14モジュール合格後） |
| `/admin/login` | 管理者ログイン |
| `/admin` | 管理者ダッシュボード |
| `/admin/users` | 受講者管理・招待 |
| `/admin/users/{uid}` | 個人成績詳細 |
| `/admin/completions` | 修了者リスト・CSV出力 |

---

## トラブルシューティング

### 冊子が表示されない
→ `public/manual.html` が存在するか確認。なくてもフォールバックテキストが表示される。

### YouTube動画が表示されない
→ `YOUTUBE_API_KEY` と `YOUTUBE_CHANNEL_ID` が正しく設定されているか確認。
→ 動画タイトルに `【M1】` 等のタグが含まれているか確認。

### クイズ問題が表示されない
→ Firestoreの `quizBank/{M1〜M14}` コレクションにデータがあるか確認。
→ `npx ts-node scripts/seed-quiz-bank.ts` を再実行。

### 管理者でログインできるがページが見えない
→ Firestoreの `companies/{companyId}/users/{uid}` の `role` が `"admin"` になっているか確認。

---

## 費用概算（月額）

| サービス | プラン | 費用 |
|---|---|---|
| Vercel | Hobby (無料) | ¥0 |
| Firebase Firestore | Spark (無料枠内) | ¥0〜¥1,000 |
| Firebase Functions | 従量課金 | ¥0〜¥500 |
| YouTube Data API | 無料枠（10,000 units/日） | ¥0 |
| **合計** | | **¥0〜¥1,500/月** |
