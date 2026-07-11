// scripts/create-superadmin-empl.mjs
// employment-lms Firebaseプロジェクトに admin ユーザーを作成/更新する
// Usage:
//   node scripts/create-superadmin-empl.mjs <email> <password> [displayName]
//
// 前提: プロジェクトルート直下で実行。.env.local に FIREBASE_ADMIN_* 3変数が入っていること。

import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const [, , EMAIL, PASSWORD, DISPLAY_NAME_ARG] = process.argv;
if (!EMAIL || !PASSWORD) {
  console.error('Usage: node scripts/create-superadmin-empl.mjs <email> <password> [displayName]');
  process.exit(1);
}
const DISPLAY_NAME = DISPLAY_NAME_ARG || EMAIL.split('@')[0];

// ---- .env.local を手動ロード(dotenv依存なし) ----
try {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      process.env[m[1]] = val;
    }
  }
} catch (e) {
  console.error('ERROR: .env.local を読み込めません。プロジェクトルートで実行してください。');
  process.exit(1);
}

if (!process.env.FIREBASE_ADMIN_PROJECT_ID || !process.env.FIREBASE_ADMIN_CLIENT_EMAIL || !process.env.FIREBASE_ADMIN_PRIVATE_KEY) {
  console.error('ERROR: FIREBASE_ADMIN_PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY のいずれかが .env.local にありません。');
  process.exit(1);
}

// 保険: employment-lms プロジェクトで実行しているか確認(誤操作防止)
if (process.env.FIREBASE_ADMIN_PROJECT_ID !== 'employment-lms') {
  console.error(`WARN: FIREBASE_ADMIN_PROJECT_ID=${process.env.FIREBASE_ADMIN_PROJECT_ID} (期待: employment-lms)`);
  console.error('     プロジェクトを間違えていないか確認してください。続行する場合はこの警告を無視してよいですが、通常は停止します。');
  // 意図的に続行を許可(過去に t.okamoto を employment-lms 以外で登録している場合を想定)
}

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
    clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const auth = admin.auth();
const db = admin.firestore();

async function main() {
  console.log(`[EMPL] Project: ${process.env.FIREBASE_ADMIN_PROJECT_ID}`);
  console.log(`[EMPL] Target : ${EMAIL}`);

  // 1. Auth ユーザー作成 or 取得
  let user;
  try {
    user = await auth.getUserByEmail(EMAIL);
    console.log(`[EMPL] 既存ユーザー検出: ${user.uid}`);
    await auth.updateUser(user.uid, {
      password: PASSWORD,
      displayName: DISPLAY_NAME,
      emailVerified: true,
    });
    console.log('[EMPL] パスワード/表示名を更新');
  } catch (e) {
    if (e.code === 'auth/user-not-found') {
      user = await auth.createUser({
        email: EMAIL,
        password: PASSWORD,
        displayName: DISPLAY_NAME,
        emailVerified: true,
      });
      console.log(`[EMPL] 新規ユーザー作成: ${user.uid}`);
    } else {
      throw e;
    }
  }

  // 2. lmsUser/{uid} ドキュメント(admin ロール)
  await db.collection('lmsUser').doc(user.uid).set(
    {
      email: EMAIL,
      displayName: DISPLAY_NAME,
      role: 'admin',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  console.log(`[EMPL] Firestore lmsUser/${user.uid} を作成/更新`);

  console.log('----- DONE (EMPL) -----');
  console.log(`URL     : https://employment-lms.vercel.app/admin/login`);
  console.log(`Email   : ${EMAIL}`);
  console.log(`Password: ${PASSWORD}`);
  console.log(`UID     : ${user.uid}`);
  console.log(`Role    : admin`);
  process.exit(0);
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
