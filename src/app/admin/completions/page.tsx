'use client'
// src/app/admin/completions/page.tsx

import { useEffect, useState } from 'react'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES } from '@/types/lms'
import type { LmsUser, ModuleProgress } from '@/types/lms'

interface CompletedUser {
  uid: string
  displayName: string
  email: string
  completedAt: Date | null
}

export default function AdminCompletionsPage() {
  const { lmsUser } = useAuth()
  const [completed, setCompleted] = useState<CompletedUser[]>([])
  const [loading, setLoading]     = useState(true)

  useEffect(() => {
    if (!lmsUser) return
    const load = async () => {
      const usersSnap = await getDocs(
        collection(db, 'companies', lmsUser.companyId, 'users')
      )
      const rows: CompletedUser[] = []
      for (const d of usersSnap.docs) {
        const u = d.data() as LmsUser
        if (u.role !== 'learner') continue
        const progSnap = await getDocs(
          collection(db, 'companies', lmsUser.companyId, 'users', d.id, 'progress')
        )
        const progMap = Object.fromEntries(
          progSnap.docs.map(p => [p.id, p.data() as ModuleProgress])
        )
        const allPassed = MODULES.every(m => progMap[m.id]?.passed)
        if (!allPassed) continue

        // 最後に合格した日時
        const lastPassed = MODULES
          .map(m => progMap[m.id]?.passedAt)
          .filter(Boolean)
          .sort((a, b) => (b as Date).getTime() - (a as Date).getTime())[0]

        rows.push({
          uid: d.id,
          displayName: u.displayName,
          email: u.email,
          completedAt: lastPassed ? (lastPassed as Date) : null,
        })
      }
      setCompleted(rows.sort((a, b) =>
        (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0)
      ))
      setLoading(false)
    }
    load()
  }, [lmsUser])

  const exportCSV = () => {
    const header = '氏名,メールアドレス,修了日'
    const rows = completed.map(u =>
      `"${u.displayName}","${u.email}","${u.completedAt?.toLocaleDateString('ja-JP') ?? '不明'}"`
    )
    const csv = [header, ...rows].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url
    a.download = `修了者リスト_${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-primary">修了者リスト</h1>
          <p className="text-sm text-gray-500 mt-1">全14モジュール合格済みの受講者</p>
        </div>
        {completed.length > 0 && (
          <button onClick={exportCSV}
            className="bg-white border border-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
            CSV でダウンロード
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-600">氏名</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">メールアドレス</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">修了日</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center text-gray-400 py-8">読み込み中...</td></tr>
            ) : completed.length === 0 ? (
              <tr><td colSpan={3} className="text-center text-gray-400 py-8">まだ修了者がいません</td></tr>
            ) : (
              completed.map(u => (
                <tr key={u.uid} className="border-b border-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-800">
                    <span className="inline-flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                      {u.displayName}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-500">{u.email}</td>
                  <td className="px-5 py-3 text-gray-600">
                    {u.completedAt?.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' }) ?? '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
