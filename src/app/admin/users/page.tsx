'use client'
// src/app/admin/users/page.tsx

import { useEffect, useState, FormEvent, useRef } from 'react'
import Link from 'next/link'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import { inviteUser, bulkInviteUsers } from '@/lib/functions'
import { MODULES } from '@/types/lms'
import type { LmsUser, ModuleProgress } from '@/types/lms'

interface UserRow { uid: string; user: LmsUser; passedCount: number }

export default function AdminUsersPage() {
  const { lmsUser } = useAuth()
  const [users, setUsers]     = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'single' | 'csv'>('single')
  const [email, setEmail]     = useState('')
  const [name, setName]       = useState('')
  const [busy, setBusy]       = useState(false)
  const [msg, setMsg]         = useState<{ ok: boolean; text: string } | null>(null)
  const [csvRows, setCsvRows] = useState<{ email: string; displayName: string }[]>([])
  const fileRef = useRef<HTMLInputElement>(null)

  const loadUsers = async () => {
    if (!lmsUser) return
    const snap = await getDocs(collection(db, 'companies', lmsUser.companyId, 'users'))
    const rows = await Promise.all(
      snap.docs
        .filter(d => (d.data() as LmsUser).role === 'learner')
        .map(async d => {
          const ps = await getDocs(collection(db, 'companies', lmsUser.companyId, 'users', d.id, 'progress'))
          return { uid: d.id, user: d.data() as LmsUser, passedCount: ps.docs.filter(p => (p.data() as ModuleProgress).passed).length }
        })
    )
    setUsers(rows); setLoading(false)
  }

  useEffect(() => { loadUsers() }, [lmsUser]) // eslint-disable-line

  const handleSingle = async (e: FormEvent) => {
    e.preventDefault(); if (!lmsUser) return
    setBusy(true); setMsg(null)
    try {
      await inviteUser({ email, displayName: name, companyId: lmsUser.companyId })
      setMsg({ ok: true, text: `✓ ${email} に招待メールを送信しました。` })
      setEmail(''); setName(''); await loadUsers()
    } catch (err: unknown) { setMsg({ ok: false, text: (err as { message?: string }).message ?? 'エラーが発生しました。' }) }
    finally { setBusy(false) }
  }

  const handleCsvFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const rows = (ev.target?.result as string).split('\n').filter(Boolean)
        .map(l => { const [em, dn] = l.split(',').map(s => s.trim().replace(/^"|"$/g, '')); return { email: em, displayName: dn } })
        .filter(r => r.email && r.displayName)
      setCsvRows(rows)
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleBulk = async () => {
    if (!lmsUser || !csvRows.length) return
    setBusy(true); setMsg(null)
    try {
      const res = await bulkInviteUsers({ users: csvRows, companyId: lmsUser.companyId })
      const ok = res.data.results.filter(r => r.success).length
      const ng = res.data.results.filter(r => !r.success).length
      setMsg({ ok: true, text: `✓ ${ok}名を招待しました。${ng > 0 ? `（${ng}名失敗）` : ''}` })
      setCsvRows([]); if (fileRef.current) fileRef.current.value = ''; await loadUsers()
    } catch (err: unknown) { setMsg({ ok: false, text: (err as { message?: string }).message ?? 'エラーが発生しました。' }) }
    finally { setBusy(false) }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-primary mb-6">受講者管理</h1>

      {/* 招待パネル */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-6">
        <div className="flex gap-4 mb-5 border-b border-gray-100 pb-3">
          {(['single', 'csv'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`text-sm font-medium pb-1 border-b-2 transition ${tab === t ? 'border-primary text-primary' : 'border-transparent text-gray-400'}`}>
              {t === 'single' ? '1名を招待' : 'CSVで一括招待'}
            </button>
          ))}
        </div>

        {tab === 'single' && (
          <form onSubmit={handleSingle} className="flex gap-3 flex-wrap">
            <input type="text" required placeholder="氏名" value={name} onChange={e => setName(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-32 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <input type="email" required placeholder="メールアドレス" value={email} onChange={e => setEmail(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm flex-1 min-w-48 focus:outline-none focus:ring-2 focus:ring-primary/30" />
            <button type="submit" disabled={busy}
              className="bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
              {busy ? '送信中...' : '招待する'}
            </button>
          </form>
        )}

        {tab === 'csv' && (
          <div className="space-y-3">
            <p className="text-xs text-gray-500">フォーマット：<code className="bg-gray-100 px-1.5 py-0.5 rounded">メールアドレス,氏名</code>（1行1名・ヘッダー不要）</p>
            <input ref={fileRef} type="file" accept=".csv" onChange={handleCsvFile} className="text-sm" />
            {csvRows.length > 0 && (
              <div>
                <p className="text-sm text-gray-600 mb-2">{csvRows.length}名を読み込みました</p>
                <div className="max-h-28 overflow-y-auto bg-gray-50 rounded p-2 space-y-0.5">
                  {csvRows.map((r, i) => <p key={i} className="text-xs text-gray-500">{r.displayName} &lt;{r.email}&gt;</p>)}
                </div>
                <button onClick={handleBulk} disabled={busy}
                  className="mt-3 bg-primary text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-60">
                  {busy ? '送信中...' : `${csvRows.length}名に一括招待する`}
                </button>
              </div>
            )}
          </div>
        )}

        {msg && <p className={`text-sm mt-3 ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>{msg.text}</p>}
      </div>

      {/* 受講者テーブル */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100">
              <th className="text-left px-5 py-3 font-medium text-gray-600">氏名</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">メールアドレス</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600">進捗</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="text-center text-gray-400 py-8">読み込み中...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="text-center text-gray-400 py-8">受講者がいません</td></tr>
            ) : users.map(({ uid, user, passedCount }) => (
              <tr key={uid} className="border-b border-gray-50 hover:bg-gray-50/50">
                <td className="px-5 py-3 font-medium">{user.displayName}</td>
                <td className="px-5 py-3 text-gray-500">{user.email}</td>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-100 rounded-full h-1.5">
                      <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.round(passedCount / MODULES.length * 100)}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{passedCount}/{MODULES.length}</span>
                  </div>
                </td>
                <td className="px-5 py-3 text-right">
                  <Link href={`/admin/users/${uid}`} className="text-xs text-primary underline">詳細</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
