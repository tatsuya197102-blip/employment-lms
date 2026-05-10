'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

const NAV = [
  { href: '/admin',             label: 'ダッシュボード' },
  { href: '/admin/users',       label: '受講者管理' },
  { href: '/admin/completions', label: '修了者リスト' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, lmsUser, loading, signOut } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  const isLoginPage = pathname === '/admin/login'

  useEffect(() => {
    if (loading) return
    if (isLoginPage) return
    if (!user) { router.replace('/admin/login'); return }
    if (lmsUser && lmsUser.role !== 'admin') { router.replace('/learn'); }
  }, [user, lmsUser, loading, isLoginPage, router])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  if (isLoginPage) return <>{children}</>

  if (loading || !user || (lmsUser && lmsUser.role !== 'admin')) return <LoadingSpinner />

  return (
    <div className="min-h-screen bg-[#F4F2EE] flex">
      <aside className="w-56 bg-primary text-white flex flex-col shrink-0">
        <div className="px-5 py-6 border-b border-white/10">
          <p className="font-bold text-sm">外国人雇用LMS</p>
          <p className="text-xs text-white/60 mt-0.5">管理者パネル</p>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(n => (
            <Link key={n.href} href={n.href}
              className={`block px-3 py-2 rounded-lg text-sm transition
                ${pathname === n.href
                  ? 'bg-white/20 font-semibold'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'}`}>
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-xs text-white/50 truncate mb-2">{user.email}</p>
          <button onClick={handleSignOut} className="text-xs text-white/60 hover:text-white">
            ログアウト
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}