'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { db } from '@/lib/firebase'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'

const TYPES = [
  { id: 'estimate', label: 'お見積り' },
  { id: 'document', label: '資料請求' },
  { id: 'general', label: 'その他のお問い合わせ' },
] as const

function ContactForm() {
  const params = useSearchParams()
  const initialType = TYPES.some((t) => t.id === params.get('type'))
    ? (params.get('type') as string)
    : 'estimate'

  const [type, setType] = useState<string>(initialType)
  const [company, setCompany] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')

  const submit = async () => {
    if (!company || !name || !email) return
    setStatus('sending')

    const payload = {
      type,
      typeLabel: TYPES.find((t) => t.id === type)?.label ?? type,
      company,
      name,
      email,
      phone,
      message,
    }

    let saved = false
    let mailed = false

    // 1. Firestoreに保存
    try {
      await addDoc(collection(db, 'inquiries'), {
        ...payload,
        status: 'new',
        createdAt: serverTimestamp(),
      })
      saved = true
    } catch (e) {
      console.error('firestore save failed', e)
    }

    // 2. メール通知
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      mailed = res.ok
    } catch (e) {
      console.error('mail send failed', e)
    }

    setStatus(saved || mailed ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <div className="bg-white rounded-xl border border-[#1A3E6E]/10 p-10 text-center shadow-sm">
        <p className="text-2xl mb-3">✉️</p>
        <h2 className="font-bold text-[#1A3E6E] text-lg mb-3">送信しました</h2>
        <p className="text-sm text-[#1A2433]/70 leading-relaxed mb-8">
          お問い合わせありがとうございます。
          <br />
          担当者より2営業日以内に {email} 宛にご連絡いたします。
        </p>
        <Link href="/" className="text-sm font-semibold text-[#1A3E6E] underline underline-offset-4">
          トップへ戻る
        </Link>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-lg border border-[#1A3E6E]/20 bg-white px-4 py-3 text-sm outline-none focus:border-[#1A3E6E] transition'

  return (
    <div className="bg-white rounded-xl border border-[#1A3E6E]/10 p-7 md:p-10 shadow-sm">
      {/* 種別 */}
      <label className="block text-sm font-semibold text-[#1A3E6E] mb-2">ご用件</label>
      <div className="flex flex-wrap gap-2 mb-6">
        {TYPES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setType(t.id)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${
              type === t.id
                ? 'bg-[#1A3E6E] text-white border-[#1A3E6E]'
                : 'bg-white text-[#1A3E6E] border-[#1A3E6E]/30 hover:border-[#1A3E6E]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            会社名 <span className="text-red-500">*</span>
          </label>
          <input className={inputCls} value={company} onChange={(e) => setCompany(e.target.value)} placeholder="株式会社〇〇" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            ご担当者名 <span className="text-red-500">*</span>
          </label>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="山田 太郎" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input className={inputCls} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="taro@example.co.jp" />
        </div>
        <div>
          <label className="block text-sm font-semibold text-[#1A3E6E] mb-2">電話番号(任意)</label>
          <input className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03-0000-0000" />
        </div>
      </div>

      <label className="block text-sm font-semibold text-[#1A3E6E] mb-2">
        ご相談内容{type === 'document' ? '(任意)' : ''}
      </label>
      <textarea
        className={`${inputCls} min-h-32 mb-6`}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={
          type === 'document'
            ? 'ご質問などあればご記入ください'
            : '受講予定人数、導入時期、ご質問などをご記入ください'
        }
      />

      {status === 'error' && (
        <p className="text-sm text-red-600 mb-4">
          送信に失敗しました。時間をおいて再度お試しいただくか、toiawase@promanga.jp まで直接ご連絡ください。
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!company || !name || !email || status === 'sending'}
        className="w-full bg-[#1A3E6E] text-white font-bold py-3.5 rounded-lg hover:bg-[#15335C] transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {status === 'sending' ? '送信中…' : '送信する'}
      </button>
      <p className="text-xs text-[#1A2433]/50 mt-4 leading-relaxed">
        ご入力いただいた情報は
        <Link href="/privacy" className="underline underline-offset-2">
          プライバシーポリシー
        </Link>
        に基づき取り扱います。
      </p>
    </div>
  )
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1A2433]">
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
      <main className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1A3E6E] mb-3">
          お見積り・資料請求・お問い合わせ
        </h1>
        <p className="text-sm text-[#1A2433]/70 mb-8">
          2営業日以内に担当者よりご連絡いたします。
        </p>
        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>
      </main>
    </div>
  )
}
