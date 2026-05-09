'use client'
// src/app/learn/page.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { getModuleProgress } from '@/lib/firestore/progress'
import { MODULES } from '@/types/lms'
import type { ModuleProgress } from '@/types/lms'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type ProgressMap = Record<string, ModuleProgress | null>

export default function LearnDashboard() {
  const { user, lmsUser, signOut } = useAuth()
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!user || !lmsUser) return
    const fetchAll = async () => {
      const entries = await Promise.all(
        MODULES.map(async m => {
          const p = await getModuleProgress(lmsUser.companyId, user.uid, m.id)
          return [m.id, p] as [string, ModuleProgress | null]
        })
      )
      setProgressMap(Object.fromEntries(entries))
      setLoading(false)
    }
    fetchAll()
  }, [user, lmsUser])

  if (loading) return <LoadingSpinner />

  const passedCount = MODULES.filter(m => progressMap[m.id]?.passed).length
  const allPassed   = passedCount === MODULES.length
  const overallPct  = Math.round((passedCount / MODULES.length) * 100)

  const getStatus = (moduleId: string) => {
    const p = progressMap[moduleId]
    if (!p) return 'notStarted'
    if (p.passed) return 'passed'
    if (p.quizAttempts?.length > 0) return 'inProgress'
    if (p.bookReadPercent > 0 || p.videoWatched) return 'inProgress'
    return 'notStarted'
  }

  const statusLabel = {
    notStarted: { label: '未着手',    bg: 'bg-gray-100',   text: 'text-gray-500'  },
    inProgress:  { label: '受講中',   bg: 'bg-blue-50',    text: 'text-blue-600'  },
    passed:      { label: '合格',     bg: 'bg-green-50',   text: 'text-green-700' },
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* ヘッダー */}
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">外国人雇用LMS</h1>
            <p className="text-xs text-white/70 mt-0.5">
              {lmsUser?.displayName ?? user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {allPassed && (
              <Link href="/learn/certificate"
                className="text-xs bg-accent text-primary font-bold px-3 py-1.5 rounded-full">
                修了証を見る
              </Link>
            )}
            <button onClick={signOut} className="text-xs text-white/70 hover:text-white">
              ログアウト
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 全体進捗 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">全体の進捗</p>
              <p className="text-3xl font-bold text-primary mt-1">{overallPct}%</p>
            </div>
            <p className="text-sm text-gray-500">{passedCount} / {MODULES.length} モジュール合格</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {allPassed && (
            <p className="text-center text-green-700 font-semibold mt-4">
              🎉 おめでとうございます！全モジュールを修了しました。
            </p>
          )}
        </div>

        {/* モジュール一覧 */}
        <div className="space-y-3">
          {MODULES.map((mod, idx) => {
            const status = getStatus(mod.id)
            const p = progressMap[mod.id]
            const { label, bg, text } = statusLabel[status]

            return (
              <Link
                key={mod.id}
                href={`/learn/module/${mod.id}`}
                className="block bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition p-4"
              >
                <div className="flex items-center gap-4">
                  {/* 番号 */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${status === 'passed' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {status === 'passed' ? '✓' : idx + 1}
                  </div>

                  {/* タイトル・章 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{mod.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">冊子：{mod.bookChapter}</p>
                    {/* 冊子進捗バー */}
                    {p && p.bookReadPercent > 0 && (
                      <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-accent h-1.5 rounded-full"
                          style={{ width: `${p.bookReadPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* ステータスバッジ */}
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${bg} ${text}`}>
                    {label}
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
