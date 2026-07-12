import type { Metadata } from 'next'
import LegalPageLayout, { LegalRow } from '@/components/LegalPageLayout'

export const metadata: Metadata = {
  title: '運営会社 | 外国人雇用LMS',
  description: '外国人雇用LMSの運営会社情報です。',
}

export default function CompanyPage() {
  return (
    <LegalPageLayout title="運営会社">
      <dl className="border-t border-gray-200 rounded-sm overflow-hidden bg-white shadow-sm">
        <LegalRow label="会社名">株式会社J-MANGA CREATE</LegalRow>
        <LegalRow label="代表者">代表取締役 岡本 立也</LegalRow>
        <LegalRow label="所在地">〒141-0031 東京都品川区西五反田1-24-4</LegalRow>
        <LegalRow label="設立">2022年1月25日</LegalRow>
        <LegalRow label="資本金">5,520万円</LegalRow>
        <LegalRow label="事業内容">
          アニメーション・漫画の企画・制作
          <br />
          外国人材向け教育プラットフォームの開発・運営
          <br />
          企業向け外国人雇用研修eラーニングの提供
        </LegalRow>
        <LegalRow label="海外拠点">
          中国(大連)/ ベトナム(ホーチミン)/ エジプト(カイロ)
        </LegalRow>
        <LegalRow label="お問い合わせ">
          toiawase@promanga.jp
        </LegalRow>
      </dl>

      <p className="mt-8 text-sm text-gray-600">
        当社は、日本・中国・ベトナム・エジプトの4拠点で制作・教育事業を展開しており、外国人材の受け入れ・育成に関する実務知見をもとに本サービスを開発・運営しています。
      </p>
    </LegalPageLayout>
  )
}
