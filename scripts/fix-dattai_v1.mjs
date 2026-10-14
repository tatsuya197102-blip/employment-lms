// fix-dattai_v1.mjs — 雇用LMS M28「脱退一時金」を2026年4月の改正に合わせて直す（2026-10-14）APIなし
//   1. 冊子（M28.html）: 上限 60か月(5年) → 96か月(8年)、再入国許可の新ルール、会社がやること・チェックリストに追記
//   2. クイズ: 「上限はどれ」の選択肢「最大60か月」→「最大96か月」（リポジトリ内のクイズのファイル）
//   3. ほかのファイルに「脱退一時金」があれば一覧を出す（直すかどうか判断するため）
//   4. クイズをFirestoreへ入れる仕組みの手がかり（scripts内のファイル名）を出す
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', '.next', '.git', '.firebase']);
const EXT = new Set(['.html', '.json', '.ts', '.tsx', '.js', '.cjs', '.mjs', '.md']);
const readUtf8 = p => { let t = fs.readFileSync(p, 'utf8'); if (t.charCodeAt(0) === 0xFEFF) t = t.slice(1); return t; };
const LOG = [];
const log = (s = '') => { console.log(s); LOG.push(s); };
function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.includes('.bak') || e.name === 'fix-dattai_v1.mjs') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (EXT.has(path.extname(e.name).toLowerCase())) out.push(p);
  }
  return out;
}

// ---------------------------------------------------------------- 1. 冊子
const BOOK_FIXES = [
  [
    '<p><strong>日本に住所を有しなくなった日から2年以内</strong>に請求する必要があります。この期限を過ぎると受け取れません。帰国前に必ず伝えてください。</p>',
    '<p><strong>日本に住所を有しなくなった日から2年以内</strong>に請求する必要があります。この期限を過ぎると受け取れません。帰国前に必ず伝えてください。</p>\n\n'
    + '<p><strong>2026年4月からの変更:</strong>再入国許可(みなし再入国許可を含む)を持って出国した場合、その許可の有効期間内は、転出届を出していても脱退一時金を請求できません。すぐに請求したい人は再入国許可を使わずに出国するか、有効期間が過ぎるのを待つ必要があります。この場合、2年の期限は再入国許可の有効期間が過ぎたときから数えます。</p>',
  ],
  [
    '<p>脱退一時金の計算の基礎となる期間には上限があり、<strong>最大60か月(5年)分</strong>です。これは重要な意味を持ちます。5年を超えて働いた分は、脱退一時金には反映されません。</p>',
    '<p>脱退一時金の計算の基礎となる期間には上限があり、<strong>最大96か月(8年)分</strong>です(2026年4月に60か月(5年)から引き上げられました)。これは重要な意味を持ちます。8年を超えて働いた分は、脱退一時金には反映されません。</p>',
  ],
  [
    '特定技能1号は通算5年、2号は上限がありません。',
    '育成就労(原則3年)と特定技能1号(通算5年)を合わせると最長8年で、新しい上限の8年とそろいます。特定技能2号は在留期間の上限がありません。',
  ],
  [
    '請求書の入手方法、必要書類、2年の期限を説明',
    '請求書の入手方法、必要書類、2年の期限を説明。再入国許可を持って出国すると、許可の有効期間が過ぎるまで請求できないことも伝える',
  ],
  [
    '脱退一時金の請求方法と2年の期限を説明したか',
    '脱退一時金の請求方法と2年の期限、再入国許可を持って出国する場合の扱いを説明したか',
  ],
];
const QUIZ_FIXES = [
  ['最大60か月', '最大96か月'],
  ['60か月(5年)', '96か月(8年)'],
  ['60か月（5年）', '96か月（8年）'],
];

const files = walk(ROOT);
let bookDone = 0;
log('===== 1. 冊子 M28 =====');
for (const f of files) {
  const t = readUtf8(f);
  if (!t.includes('4. 脱退一時金')) continue;
  let s = t; const hits = [];
  BOOK_FIXES.forEach(([a, b], i) => { if (s.includes(a)) { s = s.split(a).join(b); hits.push(i + 1); } });
  if (s !== t) { fs.writeFileSync(f, s, 'utf8'); bookDone++; }
  log(`  ${path.relative(ROOT, f)}: 直した箇所 ${hits.length}/${BOOK_FIXES.length}（${hits.join(',') || 'なし'}）`);
}
if (!bookDone) log('  ※冊子が見つからないか、すでに直っています');

log('');
log('===== 2. クイズ =====');
const QUIZ_KEY = '脱退一時金の計算の基礎となる期間の上限';
let quizFiles = 0;
for (const f of files) {
  const t = readUtf8(f);
  if (!t.includes(QUIZ_KEY)) continue;
  quizFiles++;
  const i = t.indexOf(QUIZ_KEY);
  let s = t;
  // この設問のまわり（前後800字）だけを直す
  const a = Math.max(0, i - 200), b = Math.min(t.length, i + 800);
  let seg = t.slice(a, b);
  for (const [x, y] of QUIZ_FIXES) seg = seg.split(x).join(y);
  s = t.slice(0, a) + seg + t.slice(b);
  if (s !== t) fs.writeFileSync(f, s, 'utf8');
  log(`  ${path.relative(ROOT, f)}: ${s !== t ? '直した' : '変更なし'}`);
  log('  ---- 設問のまわり（確認用） ----');
  log('  ' + s.slice(a, Math.min(s.length, a + 1000)).replace(/\n/g, '\n  '));
}
if (!quizFiles) log('  ※リポジトリ内にクイズの文字が見つかりません（Firestoreだけにある可能性）');

log('');
log('===== 3. 「脱退一時金」が出てくる他のファイル =====');
for (const f of files) {
  const t = readUtf8(f);
  if (!t.includes('脱退一時金') || t.includes('4. 脱退一時金') || t.includes(QUIZ_KEY)) continue;
  const n60 = (t.match(/60か月|６０か月|5年分/g) || []).length;
  const ex = [...t.matchAll(/.{0,30}脱退一時金.{0,40}/g)].slice(0, 3).map(m => m[0].replace(/\s+/g, ' '));
  log(`  ${path.relative(ROOT, f)}  （60か月などの記載 ${n60}件）`);
  ex.forEach(e => log('     ' + e));
}

log('');
log('===== 4. クイズをFirestoreへ入れる仕組みの手がかり =====');
const sd = path.join(ROOT, 'scripts');
if (fs.existsSync(sd)) for (const f of fs.readdirSync(sd)) {
  if (!/\.(c?js|mjs|ts|ps1)$/.test(f)) continue;
  const t = readUtf8(path.join(sd, f));
  if (/quiz/i.test(t) && /firestore|firebase-admin/i.test(t)) log(`  scripts/${f}`);
}
log(`  scripts/fbkey.json: ${fs.existsSync(path.join(sd, 'fbkey.json')) ? 'あり' : 'なし'}`);

fs.mkdirSync(path.join(ROOT, 'docs'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'docs', 'fix_dattai_v1_report_20261014.txt'), LOG.join('\n'), 'utf8');
