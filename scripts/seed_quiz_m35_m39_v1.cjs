// seed_quiz_m35_m39_v1.cjs
// M35〜M39 のクイズ75問を Firestore の quizBank に投入する一回きりのスクリプト
//
// 使い方(このファイルと同じ場所に quiz_m35_m39.json とサービスアカウント鍵を置く):
//   node seed_quiz_m35_m39_v1.cjs  <サービスアカウント鍵のファイル名>
//
// 実行後、鍵ファイルだけを削除してください。このスクリプトとJSONはリポジトリに残します。

const fs = require('fs')
const path = require('path')
const admin = require('firebase-admin')

const keyFile = process.argv[2]
if (!keyFile) {
  console.error('エラー: サービスアカウント鍵のファイル名を指定してください。')
  console.error('例: node seed_quiz_m35_m39_v1.cjs employment-lms-key.json')
  process.exit(1)
}

const keyPath = path.resolve(process.cwd(), keyFile)
if (!fs.existsSync(keyPath)) {
  console.error('エラー: 鍵ファイルが見つかりません → ' + keyPath)
  process.exit(1)
}

const jsonPath = path.resolve(__dirname, 'quiz_m35_m39.json')
if (!fs.existsSync(jsonPath)) {
  console.error('エラー: quiz_m35_m39.json が見つかりません → ' + jsonPath)
  process.exit(1)
}

admin.initializeApp({ credential: admin.credential.cert(require(keyPath)) })
const db = admin.firestore()

const banks = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

async function main() {
  const ids = Object.keys(banks)
  console.log('投入対象: ' + ids.join(', '))

  for (const id of ids) {
    const bank = banks[id]

    // 念のための検証
    if (bank.moduleId !== id) throw new Error(id + ': moduleId が一致しません')
    if (!Array.isArray(bank.questions) || bank.questions.length !== 15) {
      throw new Error(id + ': 問題数が15問ではありません')
    }
    for (const q of bank.questions) {
      if (!Array.isArray(q.options) || q.options.length !== 4) {
        throw new Error(id + ' / ' + q.id + ': 選択肢が4つではありません')
      }
      if (typeof q.correctIndex !== 'number' || q.correctIndex < 0 || q.correctIndex > 3) {
        throw new Error(id + ' / ' + q.id + ': correctIndex が不正です')
      }
      if (!q.explanation) throw new Error(id + ' / ' + q.id + ': 解説がありません')
    }

    await db.collection('quizBank').doc(id).set({
      moduleId: bank.moduleId,
      title: bank.title,
      questions: bank.questions,
    })
    console.log('  OK  quizBank/' + id + '  (' + bank.questions.length + '問)  ' + bank.title)
  }

  // 投入後の読み出し確認
  console.log('')
  console.log('--- 確認のため読み直します ---')
  for (const id of ids) {
    const snap = await db.collection('quizBank').doc(id).get()
    if (!snap.exists) {
      console.log('  NG  quizBank/' + id + ' が見つかりません')
    } else {
      const d = snap.data()
      console.log('  OK  quizBank/' + id + '  ' + d.questions.length + '問  ' + d.title)
    }
  }

  console.log('')
  console.log('完了しました。鍵ファイルだけを削除してください。')
  process.exit(0)
}

main().catch(e => {
  console.error('失敗しました: ' + e.message)
  process.exit(1)
})
