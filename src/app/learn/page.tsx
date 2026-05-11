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

export default function LearnDashboard() {
  const { user, lmsUser, signOut } = useAuth()
  const [progressMap, setProgressMap] = useState<ProgressMap>({})
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    if (!user || !lmsUser) return
    const fetchAll = async () => {
      const allProgress = await getAllModuleProgress(lmsUser.companyId, user.uid)
      // 譛ｪ蜿門ｾ励・繝｢繧ｸ繝･繝ｼ繝ｫ縺ｯnull縺ｧ陬懷ｮ・      const entries = MODULES.map(m => [m.id, allProgress[m.id] ?? null] as [string, ModuleProgress | null])
      setProgressMap(Object.fromEntries(entries))
      setLoading(false)
    }
    fetchAll()
  }, [user, lmsUser, authLoading])

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
    notStarted: { label: '譛ｪ逹謇・,    bg: 'bg-gray-100',   text: 'text-gray-500'  },
    inProgress:  { label: '蜿苓ｬ帑ｸｭ',   bg: 'bg-blue-50',    text: 'text-blue-600'  },
    passed:      { label: '蜷域ｼ',     bg: 'bg-green-50',   text: 'text-green-700' },
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      {/* 繝倥ャ繝繝ｼ */}
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">螟門嵜莠ｺ髮・畑LMS</h1>
            <p className="text-xs text-white/70 mt-0.5">
              {lmsUser?.displayName ?? user?.email}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {allPassed && (
              <Link href="/learn/certificate"
                className="text-xs bg-accent text-primary font-bold px-3 py-1.5 rounded-full">
                菫ｮ莠・ｨｼ繧定ｦ九ｋ
              </Link>
            )}
<button onClick={async () => { await signOut(); window.location.href = '/' }} className="text-xs text-white/70 hover:text-white">
              繝ｭ繧ｰ繧｢繧ｦ繝・            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 蜈ｨ菴馴ｲ謐・*/}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">蜈ｨ菴薙・騾ｲ謐・/p>
              <p className="text-3xl font-bold text-primary mt-1">{overallPct}%</p>
            </div>
            <p className="text-sm text-gray-500">{passedCount} / {MODULES.length} 繝｢繧ｸ繝･繝ｼ繝ｫ蜷域ｼ</p>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="bg-primary h-3 rounded-full transition-all duration-500"
              style={{ width: `${overallPct}%` }}
            />
          </div>
          {allPassed && (
            <p className="text-center text-green-700 font-semibold mt-4">
              脂 縺翫ａ縺ｧ縺ｨ縺・＃縺悶＞縺ｾ縺呻ｼ∝・繝｢繧ｸ繝･繝ｼ繝ｫ繧剃ｿｮ莠・＠縺ｾ縺励◆縲・            </p>
          )}
        </div>

        {/* 繝｢繧ｸ繝･繝ｼ繝ｫ荳隕ｧ */}
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
                  {/* 逡ｪ蜿ｷ */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0
                    ${status === 'passed' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {status === 'passed' ? '笨・ : idx + 1}
                  </div>

                  {/* 繧ｿ繧､繝医Ν繝ｻ遶 */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800 truncate">{mod.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">蜀雁ｭ撰ｼ嘴mod.bookChapter}</p>
                    {/* 蜀雁ｭ宣ｲ謐励ヰ繝ｼ */}
                    {p && p.bookReadPercent > 0 && (
                      <div className="mt-1.5 w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className="bg-accent h-1.5 rounded-full"
                          style={{ width: `${p.bookReadPercent}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* 繧ｹ繝・・繧ｿ繧ｹ繝舌ャ繧ｸ */}
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

