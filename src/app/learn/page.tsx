'use client'
// src/app/learn/page.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getModuleProgress, getAllModuleProgress } from '@/lib/firestore/progress'
import { MODULES } from '@/types/lms'
import type { ModuleProgress } from '@/types/lms'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type ProgressMap = Record<string, ModuleProgress | null>
type Status = 'notStarted' | 'inProgress' | 'passed'

export default function LearnDashboard() {
  const { user, lmsUser, signOut } = useAuth()
  const visibleModules = MODULES.filter(m => !m.audience || m.audience === 'learner' || lmsUser?.role === 'admin')
  const coreModules = visibleModules.filter(m => !m.audience || m.audience === 'learner')
  const practiceModules = visibleModules.filter(m => m.audience === 'admin')
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const practicePassed = practiceModules.filter(m => progressMap[m.id]?.passed).length
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !lmsUser) return
    const fetchAll = async () => {
      const allProgress = await getAllModuleProgress(lmsUser.companyId, user.uid)
      const entries = visibleModules.map(m => [m.id, allProgress[m.id] ?? null] as [string, ModuleProgress | null])
      setProgressMap(Object.fromEntries(entries))
      setLoading(false)
    }
    fetchAll()
  }, [user, lmsUser])

  if (loading) return <LoadingSpinner />

  const getStatus = (moduleId: string): Status => {
    const p = progressMap[moduleId]
    if (!p) return 'notStarted'
    if (p.passed) return 'passed'
    if (p.quizAttempts?.length > 0) return 'inProgress'
    if (p.bookReadPercent > 0 || p.videoWatched) return 'inProgress'
    return 'notStarted'
  }

  const passedCount = coreModules.filter(m => progressMap[m.id]?.passed).length
  const inProgressCount = coreModules.filter(m => getStatus(m.id) === 'inProgress').length
  const notStartedCount = coreModules.length - passedCount - inProgressCount
  const allPassed = passedCount === coreModules.length
  const overallPct = Math.round((passedCount / coreModules.length) * 100)
  const remaining = coreModules.length - passedCount

  // 学習分析(実データ集計)
  const totalAttempts = visibleModules.reduce(
    (s, m) => s + (progressMap[m.id]?.quizAttempts?.length ?? 0), 0)
  const videosWatched = coreModules.filter(m => progressMap[m.id]?.videoWatched).length
  const avgRead = Math.round(
    coreModules.reduce((s, m) => s + (progressMap[m.id]?.bookReadPercent ?? 0), 0) /
    coreModules.length)
  const practicePct = practiceModules.length > 0
    ? Math.round((practicePassed / practiceModules.length) * 100) : 0

  // 「続きから学習」対象: 受講中の先頭 → なければ未着手の先頭
  const orderedModules = [...coreModules, ...practiceModules]
  const continueModule =
    orderedModules.find(m => getStatus(m.id) === 'inProgress') ??
    orderedModules.find(m => getStatus(m.id) === 'notStarted') ??
    null
  const continueStatus = continueModule ? getStatus(continueModule.id) : null

  const statusLabel: Record<Status, { label: string; bg: string; text: string }> = {
    notStarted: { label: '未着手', bg: 'bg-gray-100', text: 'text-gray-500' },
    inProgress: { label: '受講中', bg: 'bg-blue-50', text: 'text-blue-600' },
    passed: { label: '合格', bg: 'bg-[#C8A84B]/15', text: 'text-[#8A6D1F]' },
  }

  const ModuleCard = ({ mod, displayNo }: { mod: (typeof MODULES)[number]; displayNo: number }) => {
    const status = getStatus(mod.id)
    const p = progressMap[mod.id]
    const { label, bg, text } = statusLabel[status]
    const attempts = p?.quizAttempts?.length ?? 0

    return (
      <Link
        href={`/learn/module/${mod.id}`}
        className={`block rounded-xl border shadow-sm hover:shadow-md transition p-4
          ${status === 'passed'
            ? 'bg-[#FDFAF2] border-[#C8A84B]/40'
            : 'bg-white border-gray-100'}`}
      >
        <div className="flex items-center gap-4">
          {/* 番号 / 合格チェック */}
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
              ${status === 'passed'
                ? 'bg-accent text-primary'
                : status === 'inProgress'
                  ? 'bg-primary/10 text-primary'
                  : 'bg-gray-100 text-gray-500'}`}
          >
            {status === 'passed' ? '✓' : displayNo}
          </div>

          {/* タイトル・章・進捗 */}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-gray-800 truncate">{mod.title}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              冊子:{mod.bookChapter}
              <span className="mx-1.5 text-gray-300">|</span>
              クイズ15問
              {attempts > 0 && status !== 'passed' && (
                <>
                  <span className="mx-1.5 text-gray-300">|</span>
                  <span className="text-blue-600">挑戦 {attempts}回</span>
                </>
              )}
            </p>
            {p && p.bookReadPercent > 0 && status !== 'passed' && (
              <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                <div className="bg-accent h-1.5 rounded-full" style={{ width: `${p.bookReadPercent}%` }} />
              </div>
            )}
          </div>

          {/* ステータスバッジ */}
          <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${bg} ${text}`}>{label}</span>
        </div>
      </Link>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* ヘッダー */}
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">外国人雇用LMS</h1>
            <p className="text-xs text-white/70 mt-0.5">{lmsUser?.displayName ?? user?.email}</p>
          </div>
          <div className="flex items-center gap-4">
            {/* 編別の進捗バー */}
          {practiceModules.length > 0 && (
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">📘 必修編</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${overallPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-primary w-16 text-right">
                  {passedCount}/{coreModules.length} 合格
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">📗 実践編</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${practicePct}%` }} />
                </div>
                <span className="text-xs font-semibold text-[#8A6D1F] w-16 text-right">
                  {practicePassed}/{practiceModules.length} 合格
                </span>
              </div>
            </div>
          )}

          {allPassed && (
              <Link
                href="/learn/certificate"
                className="text-xs bg-accent text-primary font-bold px-3 py-1.5 rounded-full"
              >
                修了証を見る
              </Link>
            )}
            <button
              onClick={async () => {
                await signOut()
                window.location.href = '/'
              }}
              className="text-xs text-white/70 hover:text-white"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 続きから学習 */}
        {continueModule && (
          <Link
            href={`/learn/module/${continueModule.id}`}
            className="block bg-primary text-white rounded-2xl shadow-md hover:shadow-lg transition p-5 mb-6"
          >
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs text-white/60 mb-1">
                  {continueStatus === 'inProgress' ? '▶ 前回の続きから' : '▶ 次はここから'}
                </p>
                <p className="font-bold text-base truncate">{continueModule.title}</p>
                {progressMap[continueModule.id] &&
                  (progressMap[continueModule.id]?.bookReadPercent ?? 0) > 0 && (
                    <div className="mt-2.5 w-full bg-white/20 rounded-full h-1.5 max-w-xs">
                      <div
                        className="bg-accent h-1.5 rounded-full"
                        style={{ width: `${progressMap[continueModule.id]?.bookReadPercent ?? 0}%` }}
                      />
                    </div>
                  )}
              </div>
              <span className="shrink-0 bg-accent text-primary font-bold text-sm px-5 py-2.5 rounded-lg">
                学習する →
              </span>
            </div>
          </Link>
        )}

        {/* 学習サマリー */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { icon: '🏅', n: `${passedCount}`, sub: `/ ${coreModules.length}`, label: '合格モジュール' },
            { icon: '📝', n: `${totalAttempts}`, sub: '回', label: 'クイズ挑戦' },
            { icon: '🎬', n: `${videosWatched}`, sub: '本', label: '動画視聴' },
            { icon: '📖', n: `${avgRead}`, sub: '%', label: '平均読了率' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
              <p className="text-xs text-gray-400">{k.icon} {k.label}</p>
              <p className="mt-1">
                <span className="text-2xl font-bold text-primary">{k.n}</span>
                <span className="text-xs text-gray-400 ml-1">{k.sub}</span>
              </p>
            </div>
          ))}
        </div>

        {/* 全体進捗 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">必修編の進捗</p>
              <p className="text-3xl font-bold text-primary mt-1">{overallPct}%</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">
                {passedCount} / {coreModules.length} モジュール合格
              </p>
              {!allPassed && (
                <p className="text-xs text-[#8A6D1F] font-semibold mt-0.5">
                  🏆 あと{remaining}モジュールで修了証発行
                </p>
              )}
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>

          {/* 内訳 */}
          <div className="flex gap-2 mt-4">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-[#C8A84B]/15 text-[#8A6D1F]">
              合格 {passedCount}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600">
              受講中 {inProgressCount}
            </span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-500">
              未着手 {notStartedCount}
            </span>
          </div>

          {/* 編別の進捗バー */}
          {practiceModules.length > 0 && (
            <div className="mt-4 space-y-2.5">
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">📘 必修編</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: `${overallPct}%` }} />
                </div>
                <span className="text-xs font-semibold text-primary w-16 text-right">
                  {passedCount}/{coreModules.length} 合格
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 shrink-0">📗 実践編</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className="bg-accent h-2 rounded-full" style={{ width: `${practicePct}%` }} />
                </div>
                <span className="text-xs font-semibold text-[#8A6D1F] w-16 text-right">
                  {practicePassed}/{practiceModules.length} 合格
                </span>
              </div>
            </div>
          )}

          {allPassed && (
            <p className="text-center text-green-700 font-semibold mt-4">
              🎉 おめでとうございます!必修編(全14モジュール)を修了しました。
            </p>
          )}
        </div>

        {/* 必修編(M1〜M14) */}
        <h2 className="text-base font-bold text-gray-700 mb-3">📘 必修編</h2>
        <div className="space-y-3">
          {coreModules.map((mod, idx) => (
            <ModuleCard key={mod.id} mod={mod} displayNo={idx + 1} />
          ))}
        </div>

        {practiceModules.length > 0 && (
          <>
            <h2 className="text-base font-bold text-gray-700 mt-8 mb-1">📗 実践編(人事マネジメント)</h2>
            <p className="text-xs text-gray-400 mb-3">
              冊子+クイズで学ぶ実務コース(動画なし・修了証の対象外)| {practicePassed} /{' '}
              {practiceModules.length} 合格
            </p>
            <div className="space-y-3">
              {practiceModules.map((mod, idx) => (
                <ModuleCard key={mod.id} mod={mod} displayNo={idx + 15} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  )
}
