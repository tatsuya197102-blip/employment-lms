'use client'
// src/app/admin/login/page.tsx

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

export default function AdminLoginPage() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      router.push('/admin')
    } catch {
      setError('メールアドレスまたはパスワードが正しくありません。')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white">外国人雇用LMS</h1>
          <p className="text-sm text-white/60 mt-1">管理者ログイン</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">メールアドレス</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                placeholder="admin@example.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
                placeholder="••••••••" />
            </div>
            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-2">{error}</p>
            )}
            <button type="submit" disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-60">
              {loading ? 'ログイン中...' : '管理者としてログイン'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
