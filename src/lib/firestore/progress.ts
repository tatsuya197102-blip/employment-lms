// src/lib/firestore/progress.ts
// 受講進捗の読み書き

import {
  doc, getDoc, setDoc, updateDoc, arrayUnion, serverTimestamp,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ModuleProgress, QuizAttempt } from '@/types/lms'

const progressRef = (companyId: string, userId: string, moduleId: string) =>
  doc(db, 'companies', companyId, 'users', userId, 'progress', moduleId)

/** 単一モジュールの進捗を取得 */
export async function getModuleProgress(
  companyId: string, userId: string, moduleId: string
): Promise<ModuleProgress | null> {
  const snap = await getDoc(progressRef(companyId, userId, moduleId))
  return snap.exists() ? (snap.data() as ModuleProgress) : null
}

/** 冊子の読了率を更新 */
export async function updateBookProgress(
  companyId: string, userId: string, moduleId: string, percent: number
) {
  const ref = progressRef(companyId, userId, moduleId)
  await setDoc(ref, {
    bookReadPercent: percent,
    bookCompleted: percent >= 80,
  }, { merge: true })
}

/** 動画視聴済みフラグを更新 */
export async function markVideoWatched(
  companyId: string, userId: string, moduleId: string
) {
  const ref = progressRef(companyId, userId, moduleId)
  await setDoc(ref, { videoWatched: true }, { merge: true })
}

/** クイズ受験結果を記録 */
export async function recordQuizAttempt(
  companyId: string,
  userId: string,
  moduleId: string,
  attempt: Omit<QuizAttempt, 'answeredAt'>
) {
  const ref = progressRef(companyId, userId, moduleId)
  const full: QuizAttempt = {
    ...attempt,
    answeredAt: new Date(),
  }
  await updateDoc(ref, {
    quizAttempts: arrayUnion(full),
    // passed/passedAt はCloud Functionsが書き込む
  }).catch(async () => {
    // ドキュメントが存在しない場合はsetDocで作成
    await setDoc(ref, {
      videoWatched: false,
      bookReadPercent: 0,
      bookCompleted: false,
      quizAttempts: [full],
      passed: false,
    })
  })
}
