// [HR_BOOK_GUARD_V1] 冊子はログインした受講者・管理者にだけ返す
// 冊子HTMLは public/ から content/books/ へ移し、直接URLでは読めないようにした。
// 確認方法: ①Firebaseのログイントークンが有効か(Googleの確認窓口)
//           ②そのユーザーの userIndex/{uid} が本人の権限で読めるか(=このLMSに登録された人か)
//           Firebaseプロジェクトは他サービスと共用のため、②で「このLMSの利用者」に絞る。
import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ''
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ''
const BOOK_DIR = join(process.cwd(), 'content', 'books')

const deny = (status: number, msg: string) =>
  new NextResponse(msg, {
    status,
    headers: { 'Content-Type': 'text/plain;charset=utf-8', 'Cache-Control': 'no-store' },
  })

async function isMember(req: NextRequest): Promise<boolean> {
  const m = (req.headers.get('authorization') || '').match(/^Bearer\s+(.+)$/)
  if (!m || !API_KEY || !PROJECT_ID) return false
  const token = m[1]
  try {
    const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
      cache: 'no-store',
    })
    if (!r.ok) return false
    const j = (await r.json()) as { users?: { localId?: string }[] }
    const uid = j.users?.[0]?.localId
    if (!uid) return false
    const d = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/userIndex/${encodeURIComponent(uid)}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: 'no-store' },
    )
    return d.ok
  } catch {
    return false
  }
}

export async function GET(req: NextRequest, { params }: { params: { moduleId: string } }) {
  const mm = /^M([1-9]|[1-3][0-9])$/.exec(params.moduleId || '')
  if (!mm) return deny(404, 'not found')
  if (!(await isMember(req))) return deny(401, 'ログインが必要です')
  const n = Number(mm[1])
  const file = n <= 14 ? 'manual.html' : `${params.moduleId}.html`
  try {
    const html = await readFile(join(BOOK_DIR, file), 'utf-8')
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html;charset=utf-8',
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex',
      },
    })
  } catch {
    return deny(404, 'not found')
  }
}
