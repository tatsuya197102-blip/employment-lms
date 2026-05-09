'use client'
// src/components/quiz/QuizEngine.tsx

import { useState } from 'react'
import type { QuizQuestion } from '@/types/lms'

interface Props {
  questions: QuizQuestion[]      // 3問
  onSubmit: (score: number, passed: boolean) => void
  onRetry: () => void
}

type Phase = 'answering' | 'result'

export default function QuizEngine({ questions, onSubmit, onRetry }: Props) {
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null))
  const [phase, setPhase]     = useState<Phase>('answering')
  const [score, setScore]     = useState(0)

  const allAnswered = answers.every(a => a !== null)

  const handleAnswer = (qIdx: number, optIdx: number) => {
    if (phase === 'result') return
    const next = [...answers]
    next[qIdx] = optIdx
    setAnswers(next)
  }

  const handleSubmit = () => {
    const s = questions.reduce((acc, q, i) => acc + (answers[i] === q.correctIndex ? 1 : 0), 0)
    const passed = s >= 2  // 3問中2問以上で合格（80%）
    setScore(s)
    setPhase('result')
    onSubmit(s, passed)
  }

  const handleRetry = () => {
    setAnswers(Array(questions.length).fill(null))
    setPhase('answering')
    onRetry()
  }

  const passed = score >= 2

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => {
        const answered = phase === 'result'
        const userAns  = answers[qi]
        return (
          <div key={q.id} className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="font-semibold text-sm text-gray-800 mb-4">
              Q{qi + 1}. {q.text}
            </p>
            <div className="space-y-2">
              {q.options.map((opt, oi) => {
                let cls = 'w-full text-left px-4 py-2.5 rounded-lg border text-sm transition '
                if (!answered) {
                  cls += userAns === oi
                    ? 'border-primary bg-primary/5 text-primary font-medium'
                    : 'border-gray-200 hover:border-primary/40 hover:bg-gray-50'
                } else {
                  if (oi === q.correctIndex) {
                    cls += 'border-green-400 bg-green-50 text-green-700 font-medium'
                  } else if (userAns === oi) {
                    cls += 'border-red-300 bg-red-50 text-red-600'
                  } else {
                    cls += 'border-gray-100 text-gray-400'
                  }
                }
                return (
                  <button key={oi} className={cls} onClick={() => handleAnswer(qi, oi)}>
                    {opt}
                  </button>
                )
              })}
            </div>
            {answered && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-700">解説：</span>
                  {q.explanation}
                </p>
              </div>
            )}
          </div>
        )
      })}

      {/* 結果表示 */}
      {phase === 'result' ? (
        <div className={`rounded-xl p-6 text-center ${passed ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={`text-2xl font-bold mb-1 ${passed ? 'text-green-700' : 'text-red-600'}`}>
            {passed ? '🎉 合格！' : '不合格'}
          </p>
          <p className={`text-sm mb-4 ${passed ? 'text-green-600' : 'text-red-500'}`}>
            {score} / {questions.length} 問正解 {passed ? '（合格ライン：2問以上）' : '— もう一度挑戦してください'}
          </p>
          {!passed && (
            <button
              onClick={handleRetry}
              className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg text-sm hover:bg-primary/90 transition"
            >
              再挑戦する
            </button>
          )}
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl text-sm hover:bg-primary/90 transition disabled:opacity-50"
        >
          回答を提出する
        </button>
      )}
    </div>
  )
}
