'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '@/lib/firebase'
import type { LmsUser } from '@/types/lms'

interface AuthState {
  user: User | null
  lmsUser: LmsUser | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState>({
  user: null,
  lmsUser: null,
  loading: true,
  signIn: async () => {},
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [lmsUser, setLmsUser] = useState<LmsUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      setUser(u)
      if (u) {
        try {
          const snap = await getDoc(doc(db, 'userIndex', u.uid))
          if (snap.exists()) {
            const { companyId } = snap.data() as { companyId: string }
            const userSnap = await getDoc(doc(db, 'companies', companyId, 'users', u.uid))
            if (userSnap.exists()) {
              setLmsUser({ ...(userSnap.data() as LmsUser), companyId })
            }
          }
        } catch (e) {
          console.error('Failed to fetch lmsUser:', e)
        }
      } else {
        setLmsUser(null)
      }
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const signIn = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const signOut = async () => {
    await firebaseSignOut(auth)
    setLmsUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, lmsUser, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)