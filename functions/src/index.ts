// functions/src/index.ts
// Cloud Functions for employment-lms

import * as functions from 'firebase-functions'
import * as admin from 'firebase-admin'
import * as nodemailer from 'nodemailer'

admin.initializeApp()
const db = admin.firestore()

// ─────────────────────────────────────────────
// 1. クイズ合格時に passedAt を記録（改ざん防止）
//    Firestoreトリガー：progress/{moduleId} の passed が true になったとき
// ─────────────────────────────────────────────
export const onQuizPassed = functions
  .region('asia-northeast1')
  .firestore
  .document('companies/{companyId}/users/{userId}/progress/{moduleId}')
  .onWrite(async (change, context) => {
    const after  = change.after.data()
    const before = change.before.data()
    if (!after) return

    const justPassed =
      after.passed === true &&
      (!before || before.passed !== true) &&
      !after.passedAt  // まだ記録されていない場合のみ

    if (!justPassed) return

    await change.after.ref.update({
      passedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    // 全モジュール合格チェック → 修了フラグを companies/{companyId}/users/{userId} に記録
    const { companyId, userId } = context.params
    const MODULE_COUNT = 14

    const progSnap = await db
      .collection(`companies/${companyId}/users/${userId}/progress`)
      .get()

    const passedCount = progSnap.docs.filter(d => d.data().passed === true).length

    if (passedCount >= MODULE_COUNT) {
      await db.doc(`companies/${companyId}/users/${userId}`).update({
        completedAt: admin.firestore.FieldValue.serverTimestamp(),
        completed: true,
      })
      functions.logger.info(`User ${userId} completed all modules!`)
    }
  })

// ─────────────────────────────────────────────
// 2. 受講者招待 Callable Function
//    管理者がメールアドレス + 氏名を渡すと
//    Firebase Auth ユーザーを作成してメールを送信
// ─────────────────────────────────────────────
interface InviteUserData {
  email: string
  displayName: string
  companyId: string
}

export const inviteUser = functions
  .region('asia-northeast1')
  .https
  .onCall(async (data: InviteUserData, context) => {
    // 認証チェック
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です。')
    }

    // 呼び出し元が管理者か確認
    const callerSnap = await db
      .collection(`companies/${data.companyId}/users`)
      .doc(context.auth.uid)
      .get()

    if (!callerSnap.exists || callerSnap.data()?.role !== 'admin') {
      throw new functions.https.HttpsError('permission-denied', '管理者権限が必要です。')
    }

    const { email, displayName, companyId } = data

    try {
      // Firebase Auth ユーザーを作成（初期パスワードはランダム）
      const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!'
      const userRecord = await admin.auth().createUser({
        email,
        displayName,
        password: tempPassword,
        emailVerified: false,
      })

      // Firestore にユーザードキュメント作成
      await db.doc(`companies/${companyId}/users/${userRecord.uid}`).set({
        email,
        displayName,
        role: 'learner',
        companyId,
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // userIndex に companyId を記録（AuthContextで使用）
      await db.doc(`userIndex/${userRecord.uid}`).set({ companyId })

      // パスワードリセットリンクを生成してメール送信
      const resetLink = await admin.auth().generatePasswordResetLink(email)
      await sendInviteEmail(email, displayName, resetLink)

      return { success: true, uid: userRecord.uid }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string }
      functions.logger.error('inviteUser error:', error)
      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError('already-exists', 'このメールアドレスはすでに登録されています。')
      }
      throw new functions.https.HttpsError('internal', '招待に失敗しました。')
    }
  })

// ─────────────────────────────────────────────
// 3. CSV一括招待 Callable Function
// ─────────────────────────────────────────────
interface BulkInviteData {
  users: { email: string; displayName: string }[]
  companyId: string
}

export const bulkInviteUsers = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 120 })
  .https
  .onCall(async (data: BulkInviteData, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です。')
    }

    const results: { email: string; success: boolean; error?: string }[] = []

    for (const user of data.users) {
      try {
        const tempPassword = Math.random().toString(36).slice(-10) + 'Aa1!'
        const userRecord = await admin.auth().createUser({
          email: user.email,
          displayName: user.displayName,
          password: tempPassword,
        })
        await db.doc(`companies/${data.companyId}/users/${userRecord.uid}`).set({
          email: user.email,
          displayName: user.displayName,
          role: 'learner',
          companyId: data.companyId,
          invitedAt: admin.firestore.FieldValue.serverTimestamp(),
        })
        await db.doc(`userIndex/${userRecord.uid}`).set({ companyId: data.companyId })

        const resetLink = await admin.auth().generatePasswordResetLink(user.email)
        await sendInviteEmail(user.email, user.displayName, resetLink)
        results.push({ email: user.email, success: true })
      } catch (err: unknown) {
        const error = err as { message?: string }
        results.push({ email: user.email, success: false, error: error.message })
      }
    }

    return { results }
  })

// ─────────────────────────────────────────────
// メール送信ヘルパー
// 環境変数: MAIL_USER, MAIL_PASS (Gmail App Password推奨)
// ─────────────────────────────────────────────
async function sendInviteEmail(
  to: string,
  displayName: string,
  resetLink: string
): Promise<void> {
  const mailUser = functions.config().mail?.user
  const mailPass = functions.config().mail?.pass

  if (!mailUser || !mailPass) {
    functions.logger.warn('Mail config not set. Skipping email send.')
    return
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: mailUser, pass: mailPass },
  })

  await transporter.sendMail({
    from: `"J-MANGA CREATE 外国人雇用LMS" <${mailUser}>`,
    to,
    subject: '【外国人雇用LMS】受講のご案内',
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto;">
        <div style="background: #1A3E6E; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">外国人雇用LMS</h1>
        </div>
        <div style="padding: 32px; background: #f9f9f9; border-radius: 0 0 12px 12px;">
          <p style="color: #333;">${displayName} 様</p>
          <p style="color: #555;">外国人雇用研修 eラーニングシステムへご招待します。</p>
          <p style="color: #555;">下記のリンクからパスワードを設定してください。</p>
          <div style="text-align: center; margin: 32px 0;">
            <a href="${resetLink}"
               style="background: #1A3E6E; color: white; padding: 14px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: bold;">
              パスワードを設定してログイン
            </a>
          </div>
          <p style="color: #999; font-size: 12px;">このリンクは24時間有効です。</p>
          <p style="color: #999; font-size: 12px; margin-top: 24px;">
            株式会社J-MANGA CREATE
          </p>
        </div>
      </div>
    `,
  })
}
