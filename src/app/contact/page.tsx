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
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle')
  const [validationMsg, setValidationMsg] = useState('')
  const [sentEmail, setSentEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // 送信時にDOMから実際の値を読む(自動入力・復元にも対応)
    const fd = new FormData(e.currentTarget)
    const company = String(fd.get('company') ?? '').trim()
    const name = String(fd.get('name') ?? '').trim()
    const email = String(fd.get('email') ?? '').trim()
    const phone = String(fd.get('phone') ?? '').trim()
    const message = String(fd.get('message') ?? '').trim()

    const missing: string[] = []
    if (!company) missing.push('会社名')
    if (!name) missing.push('ご担当者名')
    if (!email) missing.push('メールアドレス')
    if (missing.length > 0) {
      setValidationMsg(`${missing.join('・')}を入力してください`)
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationMsg('メールアドレスの形式が正しくありません')
      return
    }

    setValidationMsg('')
    setStatus('sending')
    setSentEmail(email)

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
    } catch (err) {
      console.error('firestore save failed', err)
    }

    // 2. メール通知
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      mailed = res.ok
    } catch (err) {
      console.error('mail send failed', err)
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
          担当者より2営業日以内に {sentEmail} 宛にご連絡いたします。
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
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl border border-[#1A3E6E]/10 p-7 md:p-10 shadow-sm"
      noValidate
    >
      {/* 種別 */}
      <p className="text-sm font-semibold text-[#1A3E6E] mb-2">ご用件</p>
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
          <label htmlFor="company" className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            会社名 <span className="text-red-500">*</span>
          </label>
          <input id="company" name="company" autoComplete="organization" className={inputCls} placeholder="株式会社〇〇" />
        </div>
        <div>
          <label htmlFor="name" className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            ご担当者名 <span className="text-red-500">*</span>
          </label>
          <input id="name" name="name" autoComplete="name" className={inputCls} placeholder="山田 太郎" />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input id="email" name="email" type="email" autoComplete="email" className={inputCls} placeholder="taro@example.co.jp" />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-[#1A3E6E] mb-2">
            電話番号(任意)
          </label>
          <input id="phone" name="phone" type="tel" autoComplete="tel" className={inputCls} placeholder="03-0000-0000" />
        </div>
      </div>

      <label htmlFor="message" className="block text-sm font-semibold text-[#1A3E6E] mb-2">
        ご相談内容{type === 'document' ? '(任意)' : ''}
      </label>
      <textarea
        id="message"
        name="message"
        className={`${inputCls} min-h-32 mb-6`}
        placeholder={
          type === 'document'
            ? 'ご質問などあればご記入ください'
            : '受講予定人数、導入時期、ご質問などをご記入ください'
        }
      />

      {validationMsg && <p className="text-sm text-red-600 mb-4">{validationMsg}</p>}

      {status === 'error' && (
        <p className="text-sm text-red-600 mb-4">
          送信に失敗しました。時間をおいて再度お試しいただくか、toiawase@promanga.jp まで直接ご連絡ください。
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
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
    </form>
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
