// src/lib/functions.ts
// Cloud Functions の Callable をラップ

import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/lib/firebase'

const functions = getFunctions(app, 'asia-northeast1')

export const inviteUser = httpsCallable<
  { email: string; displayName: string; companyId: string },
  { success: boolean; uid: string }
>(functions, 'inviteUser')

export const bulkInviteUsers = httpsCallable<
  { users: { email: string; displayName: string }[]; companyId: string },
  { results: { email: string; success: boolean; error?: string }[] }
>(functions, 'bulkInviteUsers')
