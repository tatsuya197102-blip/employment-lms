import {
  doc, getDoc, setDoc, updateDoc, arrayUnion,
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