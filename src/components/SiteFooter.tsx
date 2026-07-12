import Link from 'next/link'

/**
 * サイト共通フッター
 * LP(src/app/page.tsx)の最下部に <SiteFooter /> を追加してください。
 * 受講者・管理者画面にも表示したい場合は各layout.tsxに追加(ログイン画面は任意)。
 */
export default function SiteFooter() {
  return (
    <footer className="bg-[#1A3E6E] text-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <nav className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
          <Link href="/terms" className="hover:underline underline-offset-4">
            利用規約
          </Link>
          <Link href="/privacy" className="hover:underline underline-offset-4">
            プライバシーポリシー
          </Link>
          <Link href="/tokutei" className="hover:underline underline-offset-4">
            特定商取引法に基づく表記
          </Link>
          <Link href="/company" className="hover:underline underline-offset-4">
            運営会社
          </Link>
        </nav>
        <p className="mt-8 text-xs text-white/60">
          &copy; {new Date().getFullYear()} J-MANGA CREATE Co., Ltd. All rights reserved.
        </p>
      </div>
    </footer>
  )
}
