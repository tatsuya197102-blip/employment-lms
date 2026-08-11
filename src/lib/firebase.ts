// src/lib/firebase.ts
// TERRAKOYAのFirebaseプロジェクトを流用
// 環境変数は .env.local に設定すること
//
// v2 (2026-08-11): スマホでログイン後にローディングが止まらない問題への対策。
//   Firestore は既定で WebChannel(常時接続)を使うが、一部のモバイル回線・
//   プロキシ・企業ネットワークではこの接続が確立できず、getDoc が
//   「エラーも返さないまま永久に待つ」状態になる。
//   experimentalAutoDetectLongPolling を有効にすると、接続できない環境では
//   自動的にロングポーリング方式へ切り替わる。PC・良好な回線では従来どおり。

import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import {
  initializeFirestore,
  getFirestore,
  type Firestore,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
}

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]

// initializeFirestore は「まだ Firestore を初期化していないとき」しか呼べない。
// 2回目以降(HMR・複数回import)は例外になるので、その場合は既存インスタンスを返す。
function createDb(): Firestore {
  try {
    return initializeFirestore(app, {
      // 常時接続が張れない環境を自動検知してロングポーリングに切り替える
      experimentalAutoDetectLongPolling: true,
    })
  } catch {
    return getFirestore(app)
  }
}

export const auth = getAuth(app)
export const db   = createDb()
export default app
