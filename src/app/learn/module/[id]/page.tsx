'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES } from '@/types/lms'
import type { ModuleProgress, QuizQuestion } from '@/types/lms'
import { getModuleProgress, updateBookProgress, markVideoWatched, recordQuizAttempt } from '@/lib/firestore/progress'
import { fetchQuizQuestions } from '@/lib/firestore/quiz'
import { useYouTubeVideos } from '@/hooks/useYouTubeVideos'
import YouTubePlayer from '@/components/youtube/YouTubePlayer'
import BookViewer from '@/components/book-viewer/BookViewer'
import QuizEngine from '@/components/quiz/QuizEngine'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Tab = 'video' | 'book' | 'quiz'

export default function ModulePage() {
  const { id } = useParams<{ id: string }>()
const { user, lmsUser, loading: authLoading } = useAuth()
  const router = useRouter()
  const mod = MODULES.find(m => m.id === id)

  const [progress, setProgress] = useState<ModuleProgress | null>(null)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [tab, setTab] = useState<Tab>('video')
  const [loading, setLoading] = useState(true)
  const [videoIdx, setVideoIdx] = useState(0)

  const { videoIds, loading: ytLoading } = useYouTubeVideos(id)

  useEffect(() => {
    if (!mod) { router.replace('/learn'); return }
if (authLoading) return
    if (!user || !lmsUser) { setLoading(false); return }
    const init = async () => {
      const [p, qs] = await Promise.all([
        getModuleProgress(lmsUser.companyId, user.uid, id),
        fetchQuizQuestions(id),
      ])
      setProgress(p); setQuestions(qs); setLoading(false)
    }
    init()
  }, [id, mod, user, lmsUser, router, authLoading])

  const handleVideoEnded = async () => {
    if (!user || !lmsUser) return
    await markVideoWatched(lmsUser.companyId, user.uid, id)
    setProgress(prev => ({ ...(prev ?? { bookReadPercent: 0, bookCompleted: false, quizAttempts: [], passed: false }), videoWatched: true }))
    if (videoIdx < videoIds.length - 1) setVideoIdx(i => i + 1)
  }

  const handleBookProgress = useCallback(async (pct: number) => {
    if (!user || !lmsUser) return
    await updateBookProgress(lmsUser.companyId, user.uid, id, pct)
  }, [user, lmsUser, id])

  const handleBookCompleted = useCallback(async () => {
    if (!user || !lmsUser) return
    await updateBookProgress(lmsUser.companyId, user.uid, id, 100)
    setProgress(prev => prev ? { ...prev, bookCompleted: true, bookReadPercent: 100 } : null)
  }, [user, lmsUser, id])

  const handleQuizSubmit = async (score: number, passed: boolean) => {
    if (!user || !lmsUser) return
    await recordQuizAttempt(lmsUser.companyId, user.uid, id, { score, passed, questions: questions.map(q => q.id) })
    if (passed) setProgress(prev => prev ? { ...prev, passed: true } : null)
  }

  const handleQuizRetry = async () => setQuestions(await fetchQuizQuestions(id))

  if (loading) return <LoadingSpinner />
  if (!mod) return null

  const modIndex = MODULES.findIndex(m => m.id === id)
  const prevMod = modIndex > 0 ? MODULES[modIndex - 1] : null
  const nextMod = modIndex < MODULES.length - 1 ? MODULES[modIndex + 1] : null
  const tabs: { key: Tab; label: string; done: boolean }[] = [
    { key: 'video', label: '動画',   done: !!progress?.videoWatched },
    { key: 'book',  label: '冊子',   done: !!progress?.bookCompleted },
    { key: 'quiz',  label: 'クイズ', done: !!progress?.passed },
  ]

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/learn" className="text-white/70 hover:text-white text-sm">← 一覧</Link>
          <span className="text-white/30">/</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-white/50">{mod.id}</p>
            <p className="font-semibold text-sm truncate">{mod.title}</p>
          </div>
          {progress?.passed && <span className="text-xs bg-green-400 text-white px-2.5 py-1 rounded-full font-semibold">✓ 合格済み</span>}
        </div>
      </header>

      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 flex">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition flex items-center gap-1
                ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {t.done && <span className="text-green-500 text-xs">✓</span>}
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {tab === 'video' && (
          <div className="space-y-4">
            {ytLoading ? (
              <div className="aspect-video bg-gray-100 rounded-xl flex items-center justify-center">
                <p className="text-gray-400 text-sm">動画を読み込み中...</p>
              </div>
            ) : videoIds.length > 0 ? (
              <>
                <YouTubePlayer videoId={videoIds[videoIdx]} onEnded={handleVideoEnded} />
                {videoIds.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">動画 {videoIdx + 1}/{videoIds.length}</span>
                    {videoIds.map((_, i) => (
                      <button key={i} onClick={() => setVideoIdx(i)}
                        className={`w-7 h-7 rounded-full text-xs font-medium transition
                          ${i === videoIdx ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                        {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="aspect-video bg-primary rounded-xl flex items-center justify-center">
                <div className="text-center px-8">
                  <p className="text-5xl mb-4">📋</p>
                  <p className="text-white text-lg font-bold mb-2">このモジュールは冊子・クイズで学習します</p>
                  <p className="text-white/60 text-sm">動画コンテンツはありません。下の「冊子を読む」ボタンから学習を進めてください。</p>
                </div>
              </div>
            )}
            <div className="flex items-center justify-between">
              <button onClick={handleVideoEnded} className="text-sm text-gray-500 underline">視聴済みにする</button>
              <button onClick={() => setTab('book')} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90">冊子を読む →</button>
            </div>
          </div>
        )}

        {tab === 'book' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden" style={{ height: '70vh' }}>
              <BookViewer moduleId={id} initialPercent={progress?.bookReadPercent ?? 0}
                onProgress={handleBookProgress} onCompleted={handleBookCompleted} />
            </div>
            <div className="flex justify-end">
              <button onClick={() => setTab('quiz')} className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90">クイズへ →</button>
            </div>
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-4">
            {progress?.passed && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                <p className="text-lg font-bold text-green-700">✓ このモジュールは合格済みです</p>
                <p className="text-sm text-green-600 mt-1">再受験も可能です</p>
              </div>
            )}
            {questions.length > 0
              ? <QuizEngine questions={questions} onSubmit={handleQuizSubmit} onRetry={handleQuizRetry} />
              : <p className="text-center text-gray-400 py-8">問題を読み込んでいます...</p>}
          </div>
        )}

        <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
          {prevMod ? <Link href={`/learn/module/${prevMod.id}`} className="text-sm text-gray-500 hover:text-primary">← {prevMod.title}</Link> : <div />}
          {nextMod
            ? <Link href={`/learn/module/${nextMod.id}`} className="bg-primary text-white text-sm px-4 py-2 rounded-lg hover:bg-primary/90">{nextMod.title} →</Link>
            : <Link href="/learn" className="bg-accent text-primary font-bold text-sm px-4 py-2 rounded-lg">一覧に戻る</Link>}
        </div>
      </main>
    </div>
  )
}
