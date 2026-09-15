'use client'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { LmsUser, Edition } from '@/types/lms'
import { DEFAULT_EDITIONS, resolveEditions } from '@/types/lms'

/**
 * v2 (2026-08-11): スマホでログイン後にスピナーが回り続ける問題への対策。
 *
 * 旧実装は onAuthStateChanged の中で userIndex → companies の getDoc を
 * await し終えてから loading を false にしていた。getDoc が「エラーも返さず
 * 永久に待つ」状態になると loading が true のままになり、スピナーが止まらない。
 *
 * 対策は2つ。
 *   1) Firestore 読み取りに時間切れを付ける(LMSUSER_TIMEOUT_MS)。
 *      時間切れになっても loading は false になり、画面は先へ進む。
 *   2) 認証状態そのものが返ってこない場合に備えた保険(AUTH_TIMEOUT_MS)。
 *      これで「永久にぐるぐる」だけは起きなくなる。
 */
const LMSUSER_TIMEOUT_MS = 8000
const AUTH_TIMEOUT_MS = 12000

class TimeoutError extends Error {
  constructor(label: string) {
    super(`timeout: ${label}`)
    this.name = 'TimeoutError'
  }
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout>
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new TimeoutError(label)), ms)
  })
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer)) as Promise<T>
}

interface AuthState {
  user: User | null
  lmsUser: LmsUser | null
  /** この会社に見せる編。会社ドキュメントに指定が無ければ既定値 */
  editions: Edition[]
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  lmsUser: null,
  editions: DEFAULT_EDITIONS,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [lmsUser, setLmsUser] = useState<LmsUser | null>(null)
  const [editions, setEditions] = useState<Edition[]>(DEFAULT_EDITIONS)
  const [loading, setLoading] = useState(true)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true

    // 保険: 認証状態が返ってこなくても、必ずスピナーを止める
    const safety = setTimeout(() => {
      if (mounted.current) {
        console.warn('[auth] state did not resolve in time — releasing the loading state')
        setLoading(false)
      }
    }, AUTH_TIMEOUT_MS)

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!mounted.current) return
      setUser(u)

      if (u) {
        try {
          const snap = await withTimeout(
            getDoc(doc(db, 'userIndex', u.uid)),
            LMSUSER_TIMEOUT_MS,
            'userIndex',
          )
          if (snap.exists()) {
            const { companyId } = snap.data() as { companyId: string }
            const userSnap = await withTimeout(
              getDoc(doc(db, 'companies', companyId, 'users', u.uid)),
              LMSUSER_TIMEOUT_MS,
              'companies/users',
            )
            if (userSnap.exists() && mounted.current) {
              setLmsUser({ ...(userSnap.data() as LmsUser), companyId })
            }
            // 会社ごとの「見せる編」。読めなくても既定値のまま先へ進む
            try {
              const companySnap = await withTimeout(
                getDoc(doc(db, 'companies', companyId)),
                LMSUSER_TIMEOUT_MS,
                'companies',
              )
              if (mounted.current) {
                const raw = companySnap.exists()
                  ? (companySnap.data() as { editions?: unknown }).editions
                  : undefined
                setEditions(resolveEditions(raw))
              }
            } catch {
              if (mounted.current) setEditions(DEFAULT_EDITIONS)
            }
          }
        } catch (e) {
          if (e instanceof TimeoutError) {
            console.error('[auth] Firestore read timed out:', e.message)
          } else {
            console.error('Failed to fetch lmsUser:', e)
          }
        }
      } else if (mounted.current) {
        setLmsUser(null)
        setEditions(DEFAULT_EDITIONS)
      }

      if (mounted.current) {
        clearTimeout(safety)
        setLoading(false)
      }
    })

    return () => {
      mounted.current = false
      clearTimeout(safety)
      unsub()
    }
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setLmsUser(null)
    setEditions(DEFAULT_EDITIONS)
  }

  return (
    <AuthContext.Provider value={{ user, lmsUser, editions, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
