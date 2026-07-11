import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');
const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) { let v = m[2].trim(); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1,-1); env[m[1]] = v; }
}
const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');
admin.initializeApp({ credential: admin.credential.cert({
  projectId: env.FIREBASE_ADMIN_PROJECT_ID,
  clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
  privateKey,
}) });
const auth = admin.auth();
const db = admin.firestore();

const EMAIL = 't.okamoto@promanga.jp';
const COMPANY_ID = 'jmc';

async function main() {
  const user = await auth.getUserByEmail(EMAIL);
  const uid = user.uid;
  console.log('UID:', uid);

  // 1. 会社ドキュメント
  await db.collection('companies').doc(COMPANY_ID).set({
    name: '株式会社J-MANGA CREATE',
    adminEmail: EMAIL,
    plan: 'enterprise',
  }, { merge: true });

  // 2. userIndex/{uid} → companyId
  await db.collection('userIndex').doc(uid).set({
    companyId: COMPANY_ID,
    email: EMAIL,
  }, { merge: true });

  // 3. companies/{companyId}/users/{uid} → ユーザー本体
  await db.collection('companies').doc(COMPANY_ID).collection('users').doc(uid).set({
    email: EMAIL,
    displayName: 'Okamoto Tatsuya',
    role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  console.log('OK: userIndex/' + uid + ' と companies/' + COMPANY_ID + '/users/' + uid + ' を作成');
  process.exit(0);
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
