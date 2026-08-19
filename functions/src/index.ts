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

// ─────────────────────────────────────────────
// 4. 代理店の一括発行 Callable Function
//    会社ID + 会社名 を渡すと以下をまとめて作成する:
//      - companies/{companyId}                        （会社ドキュメント）
//      - companies/{companyId}/users/{adminUid}       （管理者 role: admin）
//      - companies/{companyId}/users/{learnerUid}     （デモ受講者 role: learner）
//      - userIndex/{adminUid} / userIndex/{learnerUid}（ログイン時の会社特定用）
//    メールアドレスとパスワードは自動生成し、生成結果を呼び出し元へ返す
// ─────────────────────────────────────────────
interface CreateAgencyData {
  companyId: string   // 例: reeben（英小文字・数字・ハイフンのみ）
  companyName: string // 例: 株式会社リーベン
}

const AGENCY_MAIL_DOMAIN = 'demo-gwl.jp'

// 代理店の発行・一覧・パスワード再発行を行えるアカウント（JMC社内の運用担当）
// 追加したい場合はこの配列にメールアドレスを足すだけでよい
const AGENCY_OPERATORS = [
  'admin@reeben.net',
]

/**
 * 呼び出し元が代理店発行の運用担当かを確認する。
 * 権限が無ければ HttpsError を投げる。
 */
async function assertAgencyOperator(
  context: functions.https.CallableContext
): Promise<void> {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'ログインが必要です。')
  }
  const email = (context.auth.token.email || '').toLowerCase()
  if (!AGENCY_OPERATORS.includes(email)) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'この操作を行う権限がありません。'
    )
  }
}

/** 紛らわしい文字（0/O/1/l/I）を除いた読み上げやすいパスワードを作る */
function generatePassword(): string {
  const upper  = 'ABCDEFGHJKMNPQRSTUVWXYZ'
  const lower  = 'abcdefghijkmnpqrstuvwxyz'
  const digits = '23456789'
  const marks  = '#$%&@'
  const all    = upper + lower + digits + marks
  const pick = (chars: string) => chars[Math.floor(Math.random() * chars.length)]
  // 各種を最低1文字ずつ含めたうえで12文字にする
  const base = [pick(upper), pick(lower), pick(digits), pick(marks)]
  while (base.length < 12) base.push(pick(all))
  // 並びをシャッフル
  for (let i = base.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[base[i], base[j]] = [base[j], base[i]]
  }
  return base.join('')
}

export const createAgency = functions
  .region('asia-northeast1')
  .runWith({ timeoutSeconds: 120 })
  .https
  .onCall(async (data: CreateAgencyData, context) => {
    // 代理店発行の運用担当のみ許可
    await assertAgencyOperator(context)

    const companyId   = (data.companyId ?? '').trim().toLowerCase()
    const companyName = (data.companyName ?? '').trim()

    // 入力チェック
    if (!/^[a-z0-9-]{2,30}$/.test(companyId)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        '会社IDは半角英小文字・数字・ハイフンで2〜30文字にしてください。'
      )
    }
    if (!companyName) {
      throw new functions.https.HttpsError('invalid-argument', '会社名を入力してください。')
    }

    // 会社IDの重複チェック
    const existing = await db.doc(`companies/${companyId}`).get()
    if (existing.exists) {
      throw new functions.https.HttpsError(
        'already-exists',
        `会社ID「${companyId}」はすでに使われています。別のIDにしてください。`
      )
    }

    const adminEmail    = `admin@${companyId}.${AGENCY_MAIL_DOMAIN}`
    const learnerEmail  = `staff01@${companyId}.${AGENCY_MAIL_DOMAIN}`
    const adminPassword   = generatePassword()
    const learnerPassword = generatePassword()

    // 作成済みのものを控えておき、途中で失敗したら巻き戻す
    const createdUids: string[] = []

    try {
      // 1) 会社ドキュメント
      await db.doc(`companies/${companyId}`).set({
        name: companyName,
        adminEmail,
        plan: 'agency',
        isAgency: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      })

      // 2) 管理者アカウント
      const adminRecord = await admin.auth().createUser({
        email: adminEmail,
        displayName: `${companyName} 管理者`,
        password: adminPassword,
        emailVerified: false,
      })
      createdUids.push(adminRecord.uid)
      await db.doc(`companies/${companyId}/users/${adminRecord.uid}`).set({
        email: adminEmail,
        displayName: `${companyName} 管理者`,
        role: 'admin',
        companyId,
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      await db.doc(`userIndex/${adminRecord.uid}`).set({ companyId })

      // 3) デモ受講者アカウント
      const learnerRecord = await admin.auth().createUser({
        email: learnerEmail,
        displayName: `${companyName} デモ受講者`,
        password: learnerPassword,
        emailVerified: false,
      })
      createdUids.push(learnerRecord.uid)
      await db.doc(`companies/${companyId}/users/${learnerRecord.uid}`).set({
        email: learnerEmail,
        displayName: `${companyName} デモ受講者`,
        role: 'learner',
        companyId,
        invitedAt: admin.firestore.FieldValue.serverTimestamp(),
      })
      await db.doc(`userIndex/${learnerRecord.uid}`).set({ companyId })

      functions.logger.info(`Agency created: ${companyId} (${companyName})`)

      return {
        success: true,
        companyId,
        companyName,
        admin:   { email: adminEmail,   password: adminPassword },
        learner: { email: learnerEmail, password: learnerPassword },
      }
    } catch (err: unknown) {
      // 途中で失敗した場合は作りかけを消して、やり直せる状態に戻す
      const error = err as { code?: string; message?: string }
      functions.logger.error('createAgency error:', error)

      for (const uid of createdUids) {
        try {
          await admin.auth().deleteUser(uid)
          await db.doc(`companies/${companyId}/users/${uid}`).delete()
          await db.doc(`userIndex/${uid}`).delete()
        } catch (cleanupErr) {
          functions.logger.error('createAgency cleanup failed:', cleanupErr)
        }
      }
      try {
        await db.doc(`companies/${companyId}`).delete()
      } catch (cleanupErr) {
        functions.logger.error('createAgency cleanup (company) failed:', cleanupErr)
      }

      if (error.code === 'auth/email-already-exists') {
        throw new functions.https.HttpsError(
          'already-exists',
          'このメールアドレスはすでに登録されています。別の会社IDにしてください。'
        )
      }
      throw new functions.https.HttpsError('internal', '代理店の発行に失敗しました。')
    }
  })

// ─────────────────────────────────────────────
// 5. 代理店一覧の取得 Callable Function
// ─────────────────────────────────────────────
export const listAgencies = functions
  .region('asia-northeast1')
  .https
  .onCall(async (_data, context) => {
    await assertAgencyOperator(context)

    const snap = await db.collection('companies').where('isAgency', '==', true).get()
    const agencies = snap.docs.map(d => {
      const v = d.data()
      const created = v.createdAt as admin.firestore.Timestamp | undefined
      return {
        companyId: d.id,
        companyName: v.name ?? '',
        adminEmail: v.adminEmail ?? '',
        createdAt: created ? created.toDate().toISOString() : null,
      }
    })
    agencies.sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
    return { agencies }
  })

// ─────────────────────────────────────────────
// 6. パスワード再発行 Callable Function
//    代理店がパスワードを忘れた場合に、管理画面から作り直す
// ─────────────────────────────────────────────
interface ResetAgencyPasswordData {
  companyId: string
  target: 'admin' | 'learner'
}

export const resetAgencyPassword = functions
  .region('asia-northeast1')
  .https
  .onCall(async (data: ResetAgencyPasswordData, context) => {
    await assertAgencyOperator(context)

    const companyId = (data.companyId ?? '').trim().toLowerCase()
    const prefix = data.target === 'admin' ? 'admin' : 'staff01'
    const email = `${prefix}@${companyId}.${AGENCY_MAIL_DOMAIN}`

    try {
      const userRecord = await admin.auth().getUserByEmail(email)
      const newPassword = generatePassword()
      await admin.auth().updateUser(userRecord.uid, { password: newPassword })
      return { success: true, email, password: newPassword }
    } catch (err: unknown) {
      functions.logger.error('resetAgencyPassword error:', err)
      throw new functions.https.HttpsError('not-found', 'アカウントが見つかりませんでした。')
    }
  })
