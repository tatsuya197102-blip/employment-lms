'use client'
// src/app/learn/layout.tsx

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

export default function LearnLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/learn/login')
    }
  }, [user, loading, router])

  if (loading) return <LoadingSpinner />
  if (!user)   return null

  return <>{children}</>
}
