import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import admin from 'firebase-admin';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

const env = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
  if (m) {
    let val = m[2].trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    env[m[1]] = val;
  }
}

const projectId = env.FIREBASE_ADMIN_PROJECT_ID;
const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n');

console.log('Project:', projectId);

admin.initializeApp({ credential: admin.credential.cert({ projectId, clientEmail, privateKey }) });
const auth = admin.auth();
const db = admin.firestore();
const TARGET_EMAIL = 't.okamoto@promanga.jp';

async function main() {
  const user = await auth.getUserByEmail(TARGET_EMAIL);
  console.log('UID:', user.uid);
  await db.collection('lmsUser').doc(user.uid).set({
    email: TARGET_EMAIL, displayName: 'Okamoto Tatsuya', role: 'admin',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
  console.log('OK: lmsUser/' + user.uid + ' created');
  process.exit(0);
}
main().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
