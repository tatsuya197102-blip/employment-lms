// fix-dattai_v2.mjs — 脱退一時金の直し 2回目（2026-10-14）API費用なし
//   1. クイズの解説「最大96か月(5年)…5年を超えて」→「(8年)…8年を超えて」（クイズのJSONファイル）
//   2. M22 巻末の確認表「最大5年（60月）」→「最大8年（96月）」と再入国許可の扱いを追記
//   3. Firestore に入っているクイズにも同じ直しを入れる（scripts/fbkey.json を使う。読むのは設問を探すためだけ）
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const ROOT = process.cwd();
const readUtf8 = p => { let t = fs.readFileSync(p, 'utf8'); if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1); return t; };
const LOG = [];
const log = (s = '') => { console.log(s); LOG.push(s); };

const QUIZ_FIXES = [
  ['最大96か月(5年)分です。5年を超えて働いた分は脱退一時金に反映されません。',
   '最大96か月(8年)分です(2026年4月に60か月(5年)から引き上げられました)。8年を超えて働いた分は脱退一時金に反映されません。'],
  ['最大60か月(5年)分です。5年を超えて働いた分は脱退一時金に反映されません。',
   '最大96か月(8年)分です(2026年4月に60か月(5年)から引き上げられました)。8年を超えて働いた分は脱退一時金に反映されません。'],
  ['最大60か月', '最大96か月'],
];
const QUIZ_KEY = '脱退一時金の計算の基礎となる期間の上限';

// ---------------------------------------------------------------- 1. クイズのファイル
log('===== 1. クイズのファイル =====');
for (const rel of ['scripts/quiz_m25_m39_v2.json', 'scripts/quiz_m35_m39.json']) {
  const p = path.join(ROOT, rel);
  if (!fs.existsSync(p)) { log(`  ${rel}: なし`); continue; }
  const t = readUtf8(p);
  const i = t.indexOf(QUIZ_KEY);
  if (i < 0) { log(`  ${rel}: 設問なし`); continue; }
  const a = Math.max(0, i - 200), b = Math.min(t.length, i + 800);
  let seg = t.slice(a, b);
  for (const [x, y] of QUIZ_FIXES) seg = seg.split(x).join(y);
  const s = t.slice(0, a) + seg + t.slice(b);
  if (s !== t) fs.writeFileSync(p, s, 'utf8');
  log(`  ${rel}: ${s !== t ? '直した' : '変更なし'}`);
}

// ---------------------------------------------------------------- 2. M22
log('');
log('===== 2. M22 巻末の確認表 =====');
{
  const p = path.join(ROOT, 'public', 'books', 'M22.html');
  const A = '<td>支給額計算の対象となる被保険者期間の上限は最大5年（60月）。請求期限は出国から2年以内。</td>';
  const B = '<td>支給額計算の対象となる被保険者期間の上限は最大8年（96月）（2026年4月に5年から引き上げ）。請求期限は出国から2年以内。再入国許可（みなし再入国許可を含む）を持って出国した場合は、許可の有効期間内は請求できない（2026年4月から）。</td>';
  if (!fs.existsSync(p)) log('  M22.html が見つからない');
  else {
    const t = readUtf8(p);
    if (t.includes(A)) { fs.writeFileSync(p, t.split(A).join(B), 'utf8'); log('  直した'); }
    else log(t.includes('最大8年（96月）') ? '  すでに直っている' : '  ※該当の文が見つからない');
  }
}

// ---------------------------------------------------------------- 3. Firestore
log('');
log('===== 3. Firestore のクイズ =====');
const keyPath = path.join(ROOT, 'scripts', 'fbkey.json');
if (!fs.existsSync(keyPath)) {
  log('  scripts/fbkey.json が無いので飛ばします');
} else {
  let req;
  for (const base of [ROOT, path.join(ROOT, 'functions')]) {
    try { const r = createRequire(path.join(base, 'package.json')); r.resolve('firebase-admin/app'); req = r; break; } catch {}
  }
  if (!req) { log('  firebase-admin が見つからないので飛ばします'); }
  else {
    const { initializeApp, cert } = req('firebase-admin/app');
    const { getFirestore } = req('firebase-admin/firestore');
    initializeApp({ credential: cert(JSON.parse(readUtf8(keyPath))) });
    const db = getFirestore();
    const SKIP = new Set(['companies', 'userIndex', 'inquiries', 'contacts', 'mail', 'agencies', 'users', 'newsletter']);
    const isPlain = v => v && typeof v === 'object' && (Array.isArray(v) || Object.getPrototypeOf(v) === Object.prototype);
    const fixDeep = node => {
      let n = 0;
      for (const k of Object.keys(node)) {
        const v = node[k];
        if (typeof v === 'string') {
          let s = v; for (const [x, y] of QUIZ_FIXES) s = s.split(x).join(y);
          if (s !== v) { node[k] = s; n++; }
        } else if (isPlain(v)) n += fixDeep(v);
      }
      return n;
    };
    let found = 0;
    const scanCol = async (col, depth) => {
      const snap = await col.get();
      for (const d of snap.docs) {
        const data = d.data();
        if (JSON.stringify(data).includes(QUIZ_KEY)) {
          found++;
          const n = fixDeep(data);
          if (n) { await d.ref.set(data); log(`  ${d.ref.path}: ${n}か所を直した`); }
          else log(`  ${d.ref.path}: すでに直っている`);
        }
        if (depth === 0 && /quiz|module|question/i.test(col.id)) {
          for (const sub of await d.ref.listCollections()) await scanCol(sub, 1);
        }
      }
    };
    for (const col of await db.listCollections()) {
      if (SKIP.has(col.id)) continue;
      await scanCol(col, 0);
    }
    if (!found) log('  ※Firestoreに設問が見つからない（画面はファイルから読んでいる可能性）');
  }
}

fs.writeFileSync(path.join(ROOT, 'docs', 'fix_dattai_v2_report_20261014.txt'), LOG.join('\n'), 'utf8');
