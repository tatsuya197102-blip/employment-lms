// company_editions_v1.cjs
// 会社ごとの「見せる編」を一覧表示したり、切り替えたりするためのスクリプト。
// Firebaseの管理画面を触らずに、この1本で完結します。
//
// 【使い方1】いまの状態を一覧で見る
//   node company_editions_v1.cjs fbkey.json list
//
// 【使い方2】ある会社に見せる編を設定する
//   node company_editions_v1.cjs fbkey.json set <会社ID> core,practice,ikusei,agency
//
// 【使い方3】ある会社を既定(必修編・実践編・育成就労編)に戻す
//   node company_editions_v1.cjs fbkey.json reset <会社ID>
//
// 編の名前は4つです。
//   core     … 必修編(M1〜M14)
//   practice … 実践編(M15〜M24)
//   ikusei   … 育成就労編(M25〜M29)
//   agency   … 支援機関編(M30〜M34)

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

const ALLOWED = ['core', 'practice', 'ikusei', 'agency']
const LABELS = {
  core: '必修編',
  practice: '実践編',
  ikusei: '育成就労編',
  agency: '支援機関編',
}
const DEFAULT_EDITIONS = ['core', 'practice', 'ikusei']

const [keyFile, command, companyId, editionsArg] = process.argv.slice(2)

function usage() {
  console.log('')
  console.log('使い方:')
  console.log('  node company_editions_v1.cjs <鍵ファイル> list')
  console.log('  node company_editions_v1.cjs <鍵ファイル> set <会社ID> core,practice,ikusei,agency')
  console.log('  node company_editions_v1.cjs <鍵ファイル> reset <会社ID>')
  console.log('')
  console.log('編の名前: core(必修編) / practice(実践編) / ikusei(育成就労編) / agency(支援機関編)')
  console.log('')
}

if (!keyFile || !command) {
  console.error('エラー: 引数が足りません。')
  usage()
  process.exit(1)
}

const keyPath = path.resolve(process.cwd(), keyFile)
if (!fs.existsSync(keyPath)) {
  console.error('エラー: 鍵ファイルが見つかりません → ' + keyPath)
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) })
const db = admin.firestore()

function show(id, raw) {
  const isDefault = !Array.isArray(raw) || raw.length === 0
  const eds = isDefault ? DEFAULT_EDITIONS : raw.filter(e => ALLOWED.includes(e))
  const names = eds.map(e => LABELS[e] || e).join(' / ')
  const mark = isDefault ? '(未設定 → 既定)' : ''
  console.log('  ' + id.padEnd(24) + names + ' ' + mark)
}

async function list() {
  const snap = await db.collection('companies').get()
  if (snap.empty) {
    console.log('会社が1件もありません。')
    return
  }
  console.log('会社ごとの「見せる編」:')
  console.log('')
  snap.forEach(d => show(d.id, d.data().editions))
  console.log('')
  console.log('支援機関編を見せたい会社があれば、次のように実行してください。')
  console.log('  node company_editions_v1.cjs ' + keyFile + ' set <会社ID> core,practice,ikusei,agency')
}

async function set(id, arg) {
  if (!id) throw new Error('会社IDを指定してください。')
  if (!arg) throw new Error('編をカンマ区切りで指定してください。例: core,practice,ikusei,agency')

  const eds = arg.split(',').map(s => s.trim()).filter(Boolean)
  const bad = eds.filter(e => !ALLOWED.includes(e))
  if (bad.length) throw new Error('知らない編の名前です: ' + bad.join(', ') + '  使えるのは ' + ALLOWED.join(' / '))

  const ref = db.collection('companies').doc(id)
  const snap = await ref.get()
  if (!snap.exists) throw new Error('会社が見つかりません: ' + id + '  (list で会社IDを確認してください)')

  console.log('変更前:')
  show(id, snap.data().editions)

  await ref.set({ editions: eds }, { merge: true })

  const after = await ref.get()
  console.log('変更後:')
  show(id, after.data().editions)
  console.log('')
  console.log('完了しました。該当の会社のアカウントでログインし直すと反映されます。')
}

async function reset(id) {
  if (!id) throw new Error('会社IDを指定してください。')
  const ref = db.collection('companies').doc(id)
  const snap = await ref.get()
  if (!snap.exists) throw new Error('会社が見つかりません: ' + id)

  console.log('変更前:')
  show(id, snap.data().editions)

  await ref.update({ editions: admin.firestore.FieldValue.delete() })

  const after = await ref.get()
  console.log('変更後:')
  show(id, after.data().editions)
  console.log('')
  console.log('既定(必修編 / 実践編 / 育成就労編)に戻しました。')
}

async function main() {
  if (command === 'list') await list()
  else if (command === 'set') await set(companyId, editionsArg)
  else if (command === 'reset') await reset(companyId)
  else {
    console.error('知らないコマンドです: ' + command)
    usage()
    process.exit(1)
  }
  process.exit(0)
}

main().catch(e => {
  console.error('失敗しました: ' + e.message)
  process.exit(1)
})
