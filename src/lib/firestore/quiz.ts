// src/lib/firestore/quiz.ts
// クイズ問題バンクの取得

import { doc, getDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { QuizBank, QuizQuestion } from '@/types/lms'

/** 全15問を取得し、ランダムに3問を選んで返す */
export async function fetchQuizQuestions(moduleId: string): Promise<QuizQuestion[]> {
  const snap = await getDoc(doc(db, 'quizBank', moduleId))
  if (!snap.exists()) return []

  const bank = snap.data() as QuizBank
  const questions = [...bank.questions]

  // Fisher-Yatesシャッフル
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions.slice(0, 3)
}
