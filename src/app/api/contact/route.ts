import { NextResponse } from 'next/server'
import { Resend } from 'resend'

const TO = 'toiawase@promanga.jp'
// promanga.jp をResendでドメイン認証したら 'noreply@promanga.jp' に変更してください
const FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

export async function POST(req: Request) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 })
  }

  let body: Record<string, string>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 })
  }

  const { typeLabel, company, name, email, phone, message } = body
  if (!company || !name || !email) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 })
  }

  const resend = new Resend(apiKey)
  try {
    await resend.emails.send({
      from: `外国人雇用LMS <${FROM}>`,
      to: TO,
      replyTo: email,
      subject: `【外国人雇用LMS】${typeLabel ?? 'お問い合わせ'}: ${company}`,
      text: [
        `種別: ${typeLabel ?? '-'}`,
        `会社名: ${company}`,
        `担当者名: ${name}`,
        `メール: ${email}`,
        `電話: ${phone || '-'}`,
        '',
        '--- 相談内容 ---',
        message || '(記載なし)',
      ].join('\n'),
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('resend error', e)
    return NextResponse.json({ error: 'send failed' }, { status: 500 })
  }
}
