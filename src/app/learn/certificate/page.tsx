'use client'
// src/app/learn/certificate/page.tsx

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES } from '@/types/lms'
import { getModuleProgress } from '@/lib/firestore/progress'
import LoadingSpinner from '@/components/ui/LoadingSpinner'
import Link from 'next/link'

export default function CertificatePage() {
  const { user, lmsUser } = useAuth()
  const [allPassed, setAllPassed] = useState(false)
  const [completedAt, setCompletedAt] = useState<Date | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || !lmsUser) return
    const check = async () => {
      const progresses = await Promise.all(
        MODULES.map(m => getModuleProgress(lmsUser.companyId, user.uid, m.id))
      )
      const passed = progresses.every(p => p?.passed)
      setAllPassed(passed)
      if (passed) {
        const passedDates = progresses
          .map(p => p?.passedAt)
          .filter(Boolean)
          .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())
        setCompletedAt(passedDates[0] as Date ?? new Date())
      }
      setLoading(false)
    }
    check()
  }, [user, lmsUser])

  if (loading) return <LoadingSpinner />

  if (!allPassed) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">まだ全モジュールを修了していません。</p>
          <Link href="/learn" className="text-primary underline text-sm">ダッシュボードに戻る</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center px-4">
      <div className="w-full max-w-2xl">
        {/* 修了証 */}
        <div
          id="certificate"
          className="bg-white border-4 border-primary rounded-3xl p-10 text-center shadow-xl"
        >
          <div className="text-4xl mb-4">🎓</div>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-2">
            修了証明書
          </p>
          <h1 className="text-3xl font-bold text-primary mb-6">Certificate of Completion</h1>
          <div className="w-24 h-px bg-accent mx-auto mb-6" />
          <p className="text-gray-500 text-sm mb-2">以下の者は</p>
          <p className="text-2xl font-bold text-gray-800 mb-6">
            {lmsUser?.displayName ?? user?.email}
          </p>
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            外国人雇用研修 eラーニングプログラム（全14モジュール）を<br />
            所定の成績基準を満たして修了したことを証明します。
          </p>
          <div className="w-24 h-px bg-accent mx-auto mb-6" />
          <p className="text-sm text-gray-500">
            修了日：{completedAt?.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          <p className="text-sm font-bold text-primary mt-2">株式会社 J-MANGA CREATE</p>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button
            onClick={() => window.print()}
            className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-primary/90"
          >
            印刷する
          </button>
          <Link href="/learn"
            className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-200">
            ダッシュボードに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}
