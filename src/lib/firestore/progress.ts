import {
  doc, getDoc, getDocs, setDoc, updateDoc, arrayUnion, collection,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ModuleProgress, QuizAttempt } from '@/types/lms'

const progressRef = (companyId: string, userId: string, moduleId: string) =>
  doc(db, 'companies', companyId, 'users', userId, 'progress', moduleId)

export async function getModuleProgress(
  companyId: string, userId: string, moduleId: string
): Promise<ModuleProgress | null> {
  const snap = await getDoc(progressRef(companyId, userId, moduleId))
  return snap.exists() ? (snap.data() as ModuleProgress) : null
}

// 全モジュールの進捗を1回のコレクション取得でまとめて取得（スマホ高速化）
export async function getAllModuleProgress(
  companyId: string, userId: string
): Promise<Record<string, ModuleProgress | null>> {
  const colRef = collection(db, 'companies', companyId, 'users', userId, 'progress')
  const snap = await getDocs(colRef)
  const result: Record<string, ModuleProgress | null> = {}
  snap.forEach(d => { result[d.id] = d.data() as ModuleProgress })
  return result
}

export async function updateBookProgress(
  companyId: string, userId: string, moduleId: string, percent: number
) {
  const ref = progressRef(companyId, userId, moduleId)
  await setDoc(ref, {
    bookReadPercent: percent,
    bookCompleted: percent >= 80,
  }, { merge: true })
}

export async function markVideoWatched(
  companyId: string, userId: string, moduleId: string
) {
  const ref = progressRef(companyId, userId, moduleId)
  await setDoc(ref, { videoWatched: true }, { merge: true })
}

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
  try {
    await updateDoc(ref, {
      quizAttempts: arrayUnion(full),
      ...(attempt.passed ? { passed: true } : {}),
    })
  } catch {
    await setDoc(ref, {
      videoWatched: false,
      bookReadPercent: 0,
      bookCompleted: false,
      quizAttempts: [full],
      passed: attempt.passed,
    })
  }
}