'use client'
// src/app/admin/agencies/page.tsx
// 代理店の発行画面（会社ID・会社名を入れて発行すると、管理者とデモ受講者のアカウントが一括で作られる）

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { getFunctions, httpsCallable } from 'firebase/functions'
import app from '@/lib/firebase'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/ui/LoadingSpinner'

type Account = { email: string; password: string }
type IssueResult = {
  success: boolean
  companyId: string
  companyName: string
  admin: Account
  learner: Account
}
type Agency = {
  companyId: string
  companyName: string
  adminEmail: string
  createdAt: string | null
}

const functions = getFunctions(app, 'asia-northeast1')

// 代理店の発行を行えるアカウント（裏側のCloud Functionsと同じ一覧にすること）
const AGENCY_OPERATORS = ['admin@reeben.net']

export default function AgenciesPage() {
  const { user, loading: authLoading } = useAuth()

  const [companyId, setCompanyId] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [issuing, setIssuing] = useState(false)
  const [result, setResult] = useState<IssueResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [agencies, setAgencies] = useState<Agency[]>([])
  const [listLoading, setListLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)
  const [resetting, setResetting] = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<{ label: string; account: Account } | null>(null)

  const loadAgencies = async () => {
    try {
      const call = httpsCallable<unknown, { agencies: Agency[] }>(functions, 'listAgencies')
      const res = await call({})
      setAgencies(res.data.agencies ?? [])
    } catch (e) {
      console.error('listAgencies failed:', e)
    } finally {
      setListLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading || !user) return
    loadAgencies()
  }, [authLoading, user])

  if (authLoading) return <LoadingSpinner />

  const isOperator = AGENCY_OPERATORS.includes((user?.email || '').toLowerCase())

  if (!isOperator) {
    return (
      <div className="min-h-screen bg-[#F4F2EE] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 max-w-md w-full text-center">
          <p className="text-3xl mb-3">🔒</p>
          <h1 className="font-bold text-gray-800 mb-2">管理者専用ページです</h1>
          <p className="text-sm text-gray-500">管理者アカウントでログインしてください。</p>
          <Link href="/admin/login" className="mt-6 inline-block text-sm font-semibold text-primary underline">
            管理者ログインへ
          </Link>
        </div>
      </div>
    )
  }

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopied(key)
    setTimeout(() => setCopied(null), 1800)
  }

  const handleIssue = async () => {
    setError(null)
    setResult(null)
    const id = companyId.trim().toLowerCase()
    if (!/^[a-z0-9-]{2,30}$/.test(id)) {
      setError('会社IDは半角の英小文字・数字・ハイフンで2〜30文字にしてください。（例: reeben）')
      return
    }
    if (!companyName.trim()) {
      setError('会社名を入力してください。')
      return
    }
    setIssuing(true)
    try {
      const call = httpsCallable<{ companyId: string; companyName: string }, IssueResult>(
        functions,
        'createAgency'
      )
      const res = await call({ companyId: id, companyName: companyName.trim() })
      setResult(res.data)
      setCompanyId('')
      setCompanyName('')
      loadAgencies()
    } catch (e) {
      const err = e as { message?: string }
      setError(err.message ?? '発行に失敗しました。')
    } finally {
      setIssuing(false)
    }
  }

  const handleReset = async (agency: Agency, target: 'admin' | 'learner') => {
    const key = `${agency.companyId}:${target}`
    if (!window.confirm(
      `${agency.companyName} の${target === 'admin' ? '管理者' : 'デモ受講者'}のパスワードを再発行します。\n` +
      `いまのパスワードは使えなくなります。よろしいですか?`
    )) return
    setResetting(key)
    setResetResult(null)
    try {
      const call = httpsCallable<
        { companyId: string; target: 'admin' | 'learner' },
        { success: boolean; email: string; password: string }
      >(functions, 'resetAgencyPassword')
      const res = await call({ companyId: agency.companyId, target })
      setResetResult({
        label: `${agency.companyName}／${target === 'admin' ? '管理者' : 'デモ受講者'}`,
        account: { email: res.data.email, password: res.data.password },
      })
    } catch (e) {
      const err = e as { message?: string }
      window.alert(err.message ?? '再発行に失敗しました。')
    } finally {
      setResetting(null)
    }
  }

  /** 代理店にそのまま送れる案内文を作る */
  const buildHandout = (r: IssueResult) =>
    [
      `【外国人雇用LMS ログイン情報】${r.companyName} 様`,
      '',
      `■ 管理者用（受講状況の確認・受講者の登録）`,
      `URL      : https://hr.globalworkforce.jp/admin/login`,
      `ID       : ${r.admin.email}`,
      `パスワード: ${r.admin.password}`,
      '',
      `■ 受講者用（デモ・体験用）`,
      `URL      : https://hr.globalworkforce.jp/learn/login`,
      `ID       : ${r.learner.email}`,
      `パスワード: ${r.learner.password}`,
      '',
      `※パスワードはこの画面でしか確認できません。忘れた場合は再発行となります。`,
    ].join('\n')

  const AccountRow = ({ label, account, k }: { label: string; account: Account; k: string }) => (
    <div className="bg-white rounded-lg border border-gray-100 p-4">
      <p className="text-xs font-semibold text-gray-500 mb-2">{label}</p>
      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-20 shrink-0">ID</span>
          <span className="font-mono text-gray-800 break-all flex-1">{account.email}</span>
          <button
            onClick={() => copy(account.email, `${k}-id`)}
            className="text-xs text-primary underline shrink-0"
          >
            {copied === `${k}-id` ? 'コピー済' : 'コピー'}
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 w-20 shrink-0">パスワード</span>
          <span className="font-mono font-bold text-gray-900 break-all flex-1">{account.password}</span>
          <button
            onClick={() => copy(account.password, `${k}-pw`)}
            className="text-xs text-primary underline shrink-0"
          >
            {copied === `${k}-pw` ? 'コピー済' : 'コピー'}
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#F4F2EE]">
      <header className="bg-primary text-white">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-lg">代理店アカウント発行</h1>
            <p className="text-xs text-white/70 mt-0.5">外国人雇用LMS 管理</p>
          </div>
          <Link href="/admin" className="text-xs text-white/70 hover:text-white">
            管理トップへ
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 発行フォーム */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
          <h2 className="font-bold text-gray-800 mb-1">新しい代理店を発行する</h2>
          <p className="text-xs text-gray-400 mb-5">
            会社IDと会社名を入れて発行すると、管理者とデモ受講者のアカウントが自動で作られます。
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                会社ID <span className="text-xs text-gray-400 font-normal">（半角英小文字・数字・ハイフン／例: reeben）</span>
              </label>
              <input
                value={companyId}
                onChange={e => setCompanyId(e.target.value)}
                placeholder="reeben"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm font-mono"
              />
              {companyId.trim() && (
                <p className="text-xs text-gray-400 mt-1.5">
                  発行されるID: <span className="font-mono">admin@{companyId.trim().toLowerCase()}.demo-gwl.jp</span>
                  {' / '}
                  <span className="font-mono">staff01@{companyId.trim().toLowerCase()}.demo-gwl.jp</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                会社名 <span className="text-xs text-gray-400 font-normal">（画面に表示される名前）</span>
              </label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                placeholder="株式会社リーベン"
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary text-sm"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
            )}

            <button
              onClick={handleIssue}
              disabled={issuing}
              className="w-full bg-primary text-white font-bold py-3 rounded-lg disabled:opacity-50"
            >
              {issuing ? '発行しています…' : 'アカウントを発行する'}
            </button>
          </div>
        </div>

        {/* 発行結果 */}
        {result && (
          <div className="bg-[#FDFAF2] rounded-2xl border border-[#C8A84B]/40 shadow-sm p-6 mb-6">
            <p className="font-bold text-gray-800 mb-1">
              ✅ {result.companyName} のアカウントを発行しました
            </p>
            <p className="text-xs text-[#8A6D1F] mb-5 font-semibold">
              パスワードはこの画面でしか確認できません。必ずコピーして保存してください。
            </p>

            <div className="space-y-3">
              <AccountRow label="管理者用（受講状況の確認・受講者の登録）" account={result.admin} k="admin" />
              <AccountRow label="受講者用（デモ・体験用）" account={result.learner} k="learner" />
            </div>

            <button
              onClick={() => copy(buildHandout(result), 'handout')}
              className="mt-5 w-full bg-accent text-primary font-bold py-3 rounded-lg"
            >
              {copied === 'handout' ? 'コピーしました' : '代理店に送る案内文をまとめてコピー'}
            </button>
          </div>
        )}

        {/* 再発行結果 */}
        {resetResult && (
          <div className="bg-white rounded-2xl border border-[#C8A84B]/40 shadow-sm p-6 mb-6">
            <p className="font-bold text-gray-800 mb-3">
              🔑 {resetResult.label} のパスワードを再発行しました
            </p>
            <AccountRow label="新しいログイン情報" account={resetResult.account} k="reset" />
          </div>
        )}

        {/* 発行済み一覧 */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-800 mb-4">
            発行済みの代理店
            {!listLoading && <span className="text-sm font-normal text-gray-400 ml-2">{agencies.length} 社</span>}
          </h2>

          {listLoading ? (
            <p className="text-sm text-gray-400">読み込んでいます…</p>
          ) : agencies.length === 0 ? (
            <p className="text-sm text-gray-400">まだ発行していません。</p>
          ) : (
            <div className="space-y-3">
              {agencies.map(a => (
                <div
                  key={a.companyId}
                  className="border border-gray-100 rounded-xl p-4 flex flex-wrap items-center gap-3"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-800">{a.companyName}</p>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono break-all">
                      {a.companyId}
                      {a.createdAt && (
                        <span className="ml-2 font-sans">
                          {new Date(a.createdAt).toLocaleDateString('ja-JP')} 発行
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => handleReset(a, 'admin')}
                      disabled={resetting === `${a.companyId}:admin`}
                      className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
                    >
                      {resetting === `${a.companyId}:admin` ? '処理中…' : '管理者PW再発行'}
                    </button>
                    <button
                      onClick={() => handleReset(a, 'learner')}
                      disabled={resetting === `${a.companyId}:learner`}
                      className="text-xs px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 disabled:opacity-50"
                    >
                      {resetting === `${a.companyId}:learner` ? '処理中…' : '受講者PW再発行'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
