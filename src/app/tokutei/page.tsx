import type { Metadata } from 'next'
import LegalPageLayout, { LegalRow } from '@/components/LegalPageLayout'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表記 | 外国人雇用LMS',
  description: '外国人雇用LMSの特定商取引法に基づく表記です。',
}

export default function TokuteiPage() {
  return (
    <LegalPageLayout title="特定商取引法に基づく表記">
      <dl className="border-t border-gray-200 rounded-sm overflow-hidden bg-white shadow-sm">
        <LegalRow label="販売事業者">株式会社J-MANGA CREATE</LegalRow>
        <LegalRow label="運営責任者">代表取締役 岡本 立也</LegalRow>
        <LegalRow label="所在地">〒141-0031 東京都品川区西五反田1-24-4</LegalRow>
        <LegalRow label="電話番号">
          03-6809-2144
          <br />
          <span className="text-gray-500">※お問い合わせは原則メールにて承ります。</span>
        </LegalRow>
        <LegalRow label="メールアドレス">toiawase@promanga.jp</LegalRow>
        <LegalRow label="販売URL">https://employment-lms.vercel.app</LegalRow>
        <LegalRow label="販売価格">
          企業規模・受講人数に応じた個別見積りとなります。お見積りフォームよりお問い合わせください。
        </LegalRow>
        <LegalRow label="商品代金以外の必要料金">
          銀行振込手数料、インターネット接続にかかる通信費用等はお客様のご負担となります。
        </LegalRow>
        <LegalRow label="支払方法">銀行振込(請求書払い)</LegalRow>
        <LegalRow label="支払時期">
          契約書または請求書に定める支払期日までにお支払いください。
        </LegalRow>
        <LegalRow label="サービス提供時期">
          契約成立後、当社が指定するアカウント発行日よりご利用いただけます。
        </LegalRow>
        <LegalRow label="キャンセル・返金">
          サービスの性質上、アカウント発行後のキャンセル・返金には応じかねます。当社の責めに帰すべき事由によりサービスが提供できない場合は、この限りではありません。
        </LegalRow>
        <LegalRow label="動作環境">
          最新版のGoogle Chrome、Microsoft Edge、Safari等のモダンブラウザ。インターネット接続環境が必要です。
        </LegalRow>
      </dl>
    </LegalPageLayout>
  )
}
