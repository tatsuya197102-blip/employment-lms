import Link from 'next/link'
import type { ReactNode } from 'react'

/**
 * 法務ページ共通レイアウト
 * /terms /privacy /company /tokutei で共用
 */
export default function LegalPageLayout({
  title,
  updatedAt,
  children,
}: {
  title: string
  updatedAt?: string
  children: ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-[#1A3E6E] text-white">
        <div className="mx-auto max-w-4xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-lg hover:opacity-80">
            外国人雇用LMS
          </Link>
          <Link href="/" className="text-sm underline underline-offset-4 hover:opacity-80">
            トップへ戻る
          </Link>
        </div>
      </header>

      {/* 本文 */}
      <main className="mx-auto max-w-4xl px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A3E6E] border-b-4 border-[#C8A84B] pb-3 mb-8">
          {title}
        </h1>
        <article className="legal-body space-y-6 text-gray-800 leading-relaxed">
          {children}
        </article>
        {updatedAt && (
          <p className="mt-12 text-sm text-gray-500 text-right">サービス開始予定日:{updatedAt}</p>
        )}
      </main>
    </div>
  )
}

/** 条文見出し */
export function LegalH2({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-lg md:text-xl font-bold text-[#1A3E6E] mt-10 mb-3">{children}</h2>
  )
}

/** 定義リスト行(特商法・会社概要の表用) */
export function LegalRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] border-b border-gray-200">
      <dt className="bg-gray-100 px-4 py-3 font-semibold text-sm text-gray-700">{label}</dt>
      <dd className="px-4 py-3 text-sm">{children}</dd>
    </div>
  )
}
