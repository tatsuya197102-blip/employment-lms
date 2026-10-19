// src/app/layout.tsx
import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from '@/contexts/AuthContext'
import Keisoku from '@/components/Keisoku' // [KEISOKU_V1] 計測(Meta / GA4)。TOP・/lp・/contact だけで動く

export const metadata: Metadata = {
  title: 'GWL HR — 人事・採用・現場の担当者が学ぶ、外国人雇用のルールと実務 | J-MANGA CREATE',
  description: 'GWL HR — 人事・採用・現場の担当者が学ぶ、外国人雇用のルールと実務',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50 text-gray-900 antialiased">
        <Keisoku />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}
