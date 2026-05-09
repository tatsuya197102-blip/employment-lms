'use client'
// src/app/admin/users/[id]/page.tsx

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES } from '@/types/lms'
import type { LmsUser, ModuleProgress, QuizAttempt } from '@/types/lms'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

interface ModuleRow {
  moduleId: string
  title:    string
  chapter:  string
  progress: ModuleProgress | null
}

export default function AdminUserDetailPage() {
  const { id }       = useParams<{ id: string }>()
  const { lmsUser }  = useAuth()
  const [user, setUser]   = useState<LmsUser | null>(null)
  const [rows, setRows]   = useState<ModuleRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lmsUser) return
    const load = async () => {
      const userSnap = await getDoc(doc(db, 'companies', lmsUser.companyId, 'users', id))
      if (!userSnap.exists()) { setLoading(false); return }
      setUser(userSnap.data() as LmsUser)

      const progSnap = await getDocs(
        collection(db, 'companies', lmsUser.companyId, 'users', id, 'progress')
      )
      const progMap = Object.fromEntries(
        progSnap.docs.map(d => [d.id, d.data() as ModuleProgress])
      )
      setRows(MODULES.map(m => ({
        moduleId: m.id,
        title:    m.title,
        chapter:  m.bookChapter,
        progress: progMap[m.id] ?? null,
      })))
      setLoading(false)
    }
    load()
  }, [id, lmsUser])

  if (loading) return <LoadingSpinner />
  if (!user)   return <div className="p-8 text-gray-500">ユーザーが見つかりません。</div>

  const passedCount = rows.filter(r => r.progress?.passed).length
  const pct = Math.round(passedCount / MODULES.length * 100)

  return (
    <div className="p-8">
      {/* パンくず */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
        <Link href="/admin/users" className="hover:text-primary">受講者管理</Link>
        <span>/</span>
        <span className="text-gray-700 font-medium">{user.displayName}</span>
      </div>

      {/* ユーザー概要 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary text-2xl font-bold">
            {user.displayName[0]}
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-800">{user.displayName}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <div className="text-right">
            <p className="text-3xl font-bold text-primary">{pct}%</p>
            <p className="text-sm text-gray-500">{passedCount}/{MODULES.length} 合格</p>
          </div>
        </div>
        <div className="mt-4 w-full bg-gray-100 rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        {user.completedAt && (
          <p className="text-sm text-green-700 font-medium mt-3">
            🎓 修了日：{(user.completedAt as unknown as { toDate: () => Date }).toDate?.().toLocaleDateString('ja-JP') ?? '—'}
          </p>
        )}
      </div>

      {/* モジュール別成績 */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
          <h2 className="font-semibold text-gray-700 text-sm">モジュール別成績</h2>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-50 text-xs text-gray-500">
              <th className="text-left px-5 py-2.5 font-medium">モジュール</th>
              <th className="text-left px-4 py-2.5 font-medium">動画</th>
              <th className="text-left px-4 py-2.5 font-medium">冊子</th>
              <th className="text-left px-4 py-2.5 font-medium">クイズ</th>
              <th className="text-left px-4 py-2.5 font-medium">受験回数</th>
              <th className="text-left px-4 py-2.5 font-medium">合格日</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r => {
              const p = r.progress
              const attempts: QuizAttempt[] = p?.quizAttempts ?? []
              const lastAttempt = attempts[attempts.length - 1]
              return (
                <tr key={r.moduleId} className="border-b border-gray-50 hover:bg-gray-50/40">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-800">{r.moduleId}. {r.title}</p>
                    <p className="text-xs text-gray-400">{r.chapter}</p>
                  </td>
                  <td className="px-4 py-3">
                    {p?.videoWatched ? <span className="text-green-500 text-base">✓</span> : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p ? (
                      <span className={p.bookCompleted ? 'text-green-500' : 'text-gray-500 text-xs'}>
                        {p.bookCompleted ? '✓' : `${p.bookReadPercent ?? 0}%`}
                      </span>
                    ) : <span className="text-gray-200">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    {p?.passed
                      ? <span className="text-xs font-semibold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">合格</span>
                      : lastAttempt
                      ? <span className="text-xs text-red-500">{lastAttempt.score}/3点</span>
                      : <span className="text-gray-200 text-xs">未受験</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{attempts.length > 0 ? `${attempts.length}回` : '—'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {p?.passedAt
                      ? (p.passedAt as unknown as { toDate?: () => Date }).toDate?.().toLocaleDateString('ja-JP') ?? '—'
                      : '—'}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
