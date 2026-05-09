'use client'
// src/app/admin/page.tsx

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { MODULES } from '@/types/lms'
import type { LmsUser, ModuleProgress } from '@/types/lms'

interface UserWithProgress {
  uid: string
  user: LmsUser
  passedCount: number
}

export default function AdminDashboard() {
  const { lmsUser } = useAuth()
  const [users, setUsers] = useState<UserWithProgress[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!lmsUser) return
    const fetch = async () => {
      // 自社の受講者一覧取得
      const usersSnap = await getDocs(
        collection(db, 'companies', lmsUser.companyId, 'users')
      )
      const learners = usersSnap.docs
        .map(d => ({ uid: d.id, user: d.data() as LmsUser }))
        .filter(u => u.user.role === 'learner')

      // 各受講者の進捗取得
      const withProgress = await Promise.all(
        learners.map(async ({ uid, user }) => {
          const progSnap = await getDocs(
            collection(db, 'companies', lmsUser.companyId, 'users', uid, 'progress')
          )
          const passedCount = progSnap.docs.filter(d => (d.data() as ModuleProgress).passed).length
          return { uid, user, passedCount }
        })
      )
      setUsers(withProgress)
      setLoading(false)
    }
    fetch()
  }, [lmsUser])

  const completedUsers = users.filter(u => u.passedCount === MODULES.length)
  const overallRate = users.length > 0
    ? Math.round((completedUsers.length / users.length) * 100)
    : 0

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-primary mb-6">ダッシュボード</h1>

      {/* サマリーカード */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: '受講者数',  value: `${users.length} 名` },
          { label: '修了者数',  value: `${completedUsers.length} 名` },
          { label: '修了率',    value: `${overallRate}%` },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <p className="text-sm text-gray-500 mb-1">{c.label}</p>
            <p className="text-3xl font-bold text-primary">{c.value}</p>
          </div>
        ))}
      </div>

      {/* 受講者一覧（上位10名） */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-700">受講者の進捗</h2>
          <Link href="/admin/users" className="text-sm text-primary underline">全員を見る</Link>
        </div>

        {loading ? (
          <p className="text-gray-400 text-sm py-4 text-center">読み込み中...</p>
        ) : users.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">
            まだ受講者がいません。
            <Link href="/admin/users" className="text-primary underline ml-1">受講者を追加する</Link>
          </p>
        ) : (
          <div className="space-y-3">
            {users.slice(0, 10).map(({ uid, user, passedCount }) => {
              const pct = Math.round((passedCount / MODULES.length) * 100)
              return (
                <Link key={uid} href={`/admin/users/${uid}`}
                  className="flex items-center gap-4 py-2 hover:bg-gray-50 rounded-lg px-2 transition">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                    {user.displayName?.[0] ?? '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{user.displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{user.email}</p>
                  </div>
                  <div className="w-32">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{passedCount}/{MODULES.length}</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
