// renumber_modules_v1.cjs
// モジュール番号の振り直しを、まとめて実行するスクリプト。
//
//   実践編の追加分   M35〜M39  →  M25〜M29
//   育成就労編       M25〜M29  →  M30〜M34
//   支援機関編       M30〜M34  →  M35〜M39
//
// やること(この順で実行します)
//   1. public/books/ の冊子HTML 15本の名前を付け替える
//   2. scripts/ のクイズJSON 3本を読み、新しい番号でまとめ直して
//      quiz_m25_m39_v2.json として保存する
//   3. Firestore の quizBank/M25〜M39 を新しい内容で上書きする
//   4. 受講者の進捗のうち、M25〜M39 の分を削除する
//      (中身が入れ替わるため、古い進捗は意味が合わなくなるため)
//
// 使い方(リポジトリの scripts フォルダで実行):
//   node renumber_modules_v1.cjs fbkey.json
//
// 中身を変えずに何が起きるか見るだけのときは、最後に dry を付けてください。
//   node renumber_modules_v1.cjs fbkey.json dry

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

const keyFile = process.argv[2]
const DRY = process.argv[3] === 'dry'

if (!keyFile) {
  console.error('エラー: 鍵ファイル名を指定してください。 例: node renumber_modules_v1.cjs fbkey.json')
  process.exit(1)
}

const SCRIPTS = __dirname
const REPO = path.resolve(SCRIPTS, '..')
const BOOKS = path.join(REPO, 'public', 'books')

// ---- 旧 → 新 の対応表 ----
const MAP = {}
for (let i = 35; i <= 39; i++) MAP['M' + i] = 'M' + (i - 10) // M35-39 -> M25-29
for (let i = 25; i <= 29; i++) MAP['M' + i] = 'M' + (i + 5)  // M25-29 -> M30-34
for (let i = 30; i <= 34; i++) MAP['M' + i] = 'M' + (i + 5)  // M30-34 -> M35-39

// 新しいタイトル(確認表示用)
const NEW_TITLES = {
  M25: '安全衛生と労災防止',
  M26: 'ハラスメントと人権への配慮',
  M27: '住まいと生活基盤の段取り',
  M28: '年末調整・国外扶養親族・脱退一時金',
  M29: '監査・実地検査への備え',
  M30: '育成就労の全体像と経過措置',
  M31: '本人意向転籍のルールと定着設計',
  M32: '育成就労計画の作成と認定申請',
  M33: '監理支援機関の選び方と付き合い方',
  M34: '育成就労から特定技能1号への移行',
  M35: '登録支援機関の支援義務10項目',
  M36: '監理支援機関の許可要件と体制',
  M37: '監査・訪問指導の実務',
  M38: '受け入れ企業への指導と初動',
  M39: '機構への届出・報告と情報公開',
}

function line(t) { console.log(t) }
function head(t) { console.log(''); console.log('=== ' + t + ' ===') }

// ---------- 1. 冊子HTMLの名前を付け替える ----------
function checkBooks() {
  const missing = Object.keys(MAP).filter(old => !fs.existsSync(path.join(BOOKS, old + '.html')))
  if (missing.length) {
    throw new Error('冊子が見つかりません: ' + missing.join(', ') + '  (' + BOOKS + ')')
  }
}

function renameBooks() {
  head('2. 冊子HTMLの名前を付け替える')

  if (DRY) {
    Object.entries(MAP).forEach(([o, n]) => line('  ' + o + '.html -> ' + n + '.html  ' + NEW_TITLES[n]))
    line('  (dry のため実行しません)')
    return
  }

  // いったん一時的な名前に逃がしてから、新しい名前に付け替える
  Object.keys(MAP).forEach(old => {
    fs.renameSync(path.join(BOOKS, old + '.html'), path.join(BOOKS, '__tmp_' + old + '.html'))
  })
  Object.entries(MAP).forEach(([old, neu]) => {
    const dest = path.join(BOOKS, neu + '.html')
    fs.renameSync(path.join(BOOKS, '__tmp_' + old + '.html'), dest)

    // 冊子の中の見出し(<h1>)にも古い番号が入っているので、新しい番号と題名に書き換える
    let html = fs.readFileSync(dest, 'utf-8')
    const before = html
    html = html.replace(/<h1>[\s\S]*?<\/h1>/, '<h1>' + neu + ' ' + NEW_TITLES[neu] + '</h1>')
    if (html === before) {
      throw new Error(neu + '.html の見出し(<h1>)が見つからず、書き換えられませんでした')
    }
    fs.writeFileSync(dest, html, 'utf-8')

    line('  OK  ' + old + '.html -> ' + neu + '.html   見出し: ' + neu + ' ' + NEW_TITLES[neu])
  })

  const left = fs.readdirSync(BOOKS).filter(f => f.startsWith('__tmp_'))
  if (left.length) throw new Error('一時ファイルが残りました: ' + left.join(', '))
}

// ---------- 2. クイズJSONをまとめ直す ----------
function rebuildQuiz() {
  head('1. クイズJSONを新しい番号でまとめ直す(検証のみ)')

  const sources = ['quiz_m25_m29.json', 'quiz_m30_m34.json', 'quiz_m35_m39.json']
  const oldBanks = {}
  sources.forEach(f => {
    const p = path.join(SCRIPTS, f)
    if (!fs.existsSync(p)) throw new Error('クイズJSONが見つかりません: ' + p)
    Object.assign(oldBanks, JSON.parse(fs.readFileSync(p, 'utf-8')))
  })

  const got = Object.keys(oldBanks).sort()
  if (got.length !== 15) throw new Error('クイズが15件ではありません: ' + got.length + '件 (' + got.join(',') + ')')

  const newBanks = {}
  Object.entries(oldBanks).forEach(([oldId, bank]) => {
    const neu = MAP[oldId]
    if (!neu) throw new Error('対応表にない番号です: ' + oldId)
    // タイトルはモジュール定義側(NEW_TITLES)を正とする
    if (bank.title !== NEW_TITLES[neu]) {
      line('  ※ タイトルを合わせます「' + bank.title + '」→「' + NEW_TITLES[neu] + '」')
    }
    newBanks[neu] = {
      moduleId: neu,
      title: NEW_TITLES[neu],
      questions: bank.questions.map((q, i) => ({ ...q, id: neu + '-' + (i + 1) })),
    }
    line('  ' + oldId + ' -> ' + neu + '  ' + NEW_TITLES[neu] + '  (' + bank.questions.length + '問)')
  })

  // 検証
  Object.entries(newBanks).forEach(([id, b]) => {
    if (b.questions.length !== 15) throw new Error(id + ': 問題数が15ではありません')
    b.questions.forEach(q => {
      if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(id + '/' + q.id + ': 選択肢が4つではありません')
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) throw new Error(id + '/' + q.id + ': correctIndex が不正')
      if (!q.explanation) throw new Error(id + '/' + q.id + ': 解説がありません')
    })
  })
  line('  検証OK(15件 × 15問 = 225問、タイトルの対応も一致)')

  return newBanks
}

function writeQuizFile(newBanks) {
  const out = path.join(SCRIPTS, 'quiz_m25_m39_v2.json')
  if (DRY) { line('  (dry のため quiz_m25_m39_v2.json は保存しません)'); return }
  fs.writeFileSync(out, JSON.stringify(newBanks, null, 2), 'utf-8')
  line('  保存しました: ' + out)
}

// ---------- 3. Firestore の quizBank を上書き ----------
async function seedQuiz(db, banks) {
  head('3. Firestore の quizBank を上書きする')
  for (const id of Object.keys(banks).sort()) {
    if (DRY) { line('  ' + id + '  ' + banks[id].title + '  (dry)'); continue }
    await db.collection('quizBank').doc(id).set(banks[id])
    line('  OK  quizBank/' + id + '  (15問)  ' + banks[id].title)
  }
}

// ---------- 4. 古い進捗を削除 ----------
async function clearProgress(db) {
  head('4. M25〜M39 の進捗を削除する(中身が入れ替わるため)')
  const targets = Object.values(MAP) // M25〜M39
  let deleted = 0

  const companies = await db.collection('companies').get()
  for (const c of companies.docs) {
    const users = await db.collection('companies').doc(c.id).collection('users').get()
    for (const u of users.docs) {
      for (const mid of targets) {
        const ref = db.collection('companies').doc(c.id)
          .collection('users').doc(u.id)
          .collection('progress').doc(mid)
        const snap = await ref.get()
        if (!snap.exists) continue
        if (DRY) { line('  削除対象: ' + c.id + ' / ' + u.id + ' / ' + mid + '  (dry)'); deleted++; continue }
        await ref.delete()
        line('  削除: ' + c.id + ' / ' + u.id + ' / ' + mid)
        deleted++
      }
    }
  }
  line('  削除した進捗: ' + deleted + '件')
}

async function main() {
  const keyPath = path.resolve(process.cwd(), keyFile)
  if (!fs.existsSync(keyPath)) throw new Error('鍵ファイルが見つかりません: ' + keyPath)

  if (DRY) line('*** dry モードです。ファイルもFirestoreも変更しません ***')

  // 先に全部の検証を済ませてから、実際の変更に入る
  checkBooks()
  const banks = rebuildQuiz()
  renameBooks()
  writeQuizFile(banks)

  admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) })
  const db = admin.firestore()

  await seedQuiz(db, banks)
  await clearProgress(db)

  head('完了')
  line('次にやること:')
  line('  1. リポジトリのルートで  npx tsc --noEmit')
  line('  2. git add -A / git commit / git push')
  process.exit(0)
}

main().catch(e => {
  console.error('')
  console.error('失敗しました: ' + e.message)
  console.error('ファイルの付け替えが途中で止まった場合は、public/books の __tmp_ で始まるファイルを確認してください。')
  process.exit(1)
})
