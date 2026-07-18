import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

/* ============================================================
   料金(定価公開)
   金額が確定したら price に文字列で記入してください。
   例: price: '120,000'
   null の間は「個別にご案内」表示になります。
   ============================================================ */
const PRICING = {
  planName: '法人プラン',
  price: null as string | null, // ← 確定したら '120,000' のように記入
  unit: '円 / 年(税別)・1社あたり',
  features: [
    '受講者向け 必修編14モジュール',
    '人事・管理者向け 実践編10モジュール(定着支援・法務労務)',
    '確認クイズ360問・修了証発行',
    '管理者ダッシュボード(進捗・修了状況の一括管理)',
    '受講アカウント発行数 無制限',
    '毎年の法改正にあわせた教材アップデート',
  ],
}

const GWL_URL = 'https://globalworkforce-lms.vercel.app'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1A2433]">
      {/* ヘッダー */}
      <header className="px-6 py-4 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#1A3E6E] text-white rounded-lg flex items-center justify-center font-bold text-xs">
            JMC
          </div>
          <span className="font-bold text-sm tracking-wide">外国人雇用LMS</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href="/learn/login"
            className="px-3 py-2 rounded-lg text-[#1A3E6E]/80 hover:text-[#1A3E6E] hover:bg-[#1A3E6E]/5 transition"
          >
            受講者ログイン
          </Link>
          <Link
            href="/admin/login"
            className="px-4 py-2 rounded-lg border border-[#1A3E6E]/30 text-[#1A3E6E] font-semibold hover:bg-[#1A3E6E] hover:text-white transition"
          >
            管理者ログイン
          </Link>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="max-w-6xl mx-auto px-6 pt-16 pb-20 text-center">
        <p className="text-xs font-semibold tracking-[0.25em] text-[#8A6D1F] mb-5">
          外国人雇用の企業内研修プラットフォーム
        </p>
        <h1 className="text-4xl md:text-6xl font-bold leading-tight text-[#1A3E6E] mb-6">
          外国人雇用を、
          <br />
          確実な実務に。
        </h1>
        <p className="text-base md:text-lg text-[#1A2433]/70 max-w-2xl mx-auto leading-relaxed mb-6">
          在留資格・採用・労務管理から育成就労制度・定着支援まで。
          <br className="hidden md:block" />
          動画・冊子・修了試験で、人事担当者と現場管理職の実務知識を体系的に育てます。
        </p>
        <div className="inline-flex items-center gap-2 bg-white border border-[#C8A84B]/60 rounded-full px-4 py-1.5 mb-10 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-[#C8A84B]"></span>
          <span className="text-sm font-semibold text-[#1A3E6E]">
            育成就労制度(2027年4月施行)対応済み
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/contact"
            className="bg-[#1A3E6E] text-white font-bold px-8 py-3.5 rounded-lg hover:bg-[#15335C] transition shadow-lg"
          >
            お見積り・お問い合わせ
          </Link>
          <Link
            href="/contact?type=document"
            className="bg-white text-[#1A3E6E] font-semibold px-8 py-3.5 rounded-lg border border-[#1A3E6E]/30 hover:border-[#1A3E6E] transition"
          >
            資料請求(無料)
          </Link>
        </div>
      </section>

      {/* 3つの立場 */}
      <section className="max-w-6xl mx-auto px-6 pb-20">
        <h2 className="text-center text-2xl font-bold text-[#1A3E6E] mb-2">
          3つの現場、1つのLMS
        </h2>
        <p className="text-center text-sm text-[#1A2433]/60 mb-10">
          外国人雇用に関わる全員が、同じプラットフォームで学びます。
        </p>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              title: '人事・採用担当者',
              desc: '在留資格の確認から雇用契約・社会保険まで、採用実務の全工程を法令ベースで習得。届出漏れ・手続きミスを防ぎます。',
            },
            {
              title: '現場の管理職',
              desc: 'やさしい日本語での指示・評価面談・トラブルの早期発見。外国人スタッフと働く現場のマネジメント力を底上げします。',
            },
            {
              title: '経営・労務責任者',
              desc: '育成就労制度への移行対応、コンプライアンス、監査対応。会社を守るための制度知識を経営目線で整理します。',
            },
          ].map((c) => (
            <div
              key={c.title}
              className="bg-white rounded-xl border border-[#1A3E6E]/10 p-6 shadow-sm"
            >
              <h3 className="font-bold text-[#1A3E6E] mb-3">{c.title}</h3>
              <p className="text-sm leading-relaxed text-[#1A2433]/70">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* モジュール一覧(ダーク帯) */}
      <section className="bg-[#132B4D] text-white">
        <div className="max-w-6xl mx-auto px-6 py-20">
          <h2 className="text-center text-2xl font-bold mb-2">
            全24モジュール<span className="text-[#C8A84B]">(受講者向け14+管理者向け10)</span>
          </h2>
          <p className="text-center text-sm text-white/60 mb-12">
            各モジュールは冊子教材と確認クイズ15問で構成。全360問・修了証発行に対応しています。
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            {/* 必修編 */}
            <div className="bg-white/5 rounded-xl border border-white/10 p-7">
              <div className="flex items-baseline justify-between mb-5">
                <h3 className="font-bold text-lg">📘 必修編(受講者向け)</h3>
                <span className="text-[#C8A84B] font-bold text-2xl">
                  14<span className="text-sm font-normal text-white/60 ml-1">モジュール</span>
                </span>
              </div>
              <ul className="space-y-2.5 text-sm text-white/80">
                <li>・外国人雇用の現状と制度の全体像</li>
                <li>・在留資格の基礎知識と確認実務</li>
                <li>・採用・面接・雇用契約の実務</li>
                <li>・労務管理・社会保険・給与</li>
                <li>・職場コミュニケーションと文化理解</li>
                <li>・トラブル対応・退職時の手続き ほか</li>
              </ul>
            </div>

            {/* 実践編 */}
            <div className="bg-white/5 rounded-xl border border-[#C8A84B]/40 p-7">
              <div className="flex items-baseline justify-between mb-5">
                <h3 className="font-bold text-lg">📗 実践編(人事・管理者向け)</h3>
                <span className="text-[#C8A84B] font-bold text-2xl">
                  10<span className="text-sm font-normal text-white/60 ml-1">モジュール</span>
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2.5 text-sm text-white/80">
                <div>
                  <p className="text-[#C8A84B] font-semibold mb-2 text-xs tracking-wider">
                    定着支援
                  </p>
                  <ul className="space-y-2">
                    <li>・受け入れ準備と初期定着</li>
                    <li>・やさしい日本語の実践</li>
                    <li>・生活支援の実務</li>
                    <li>・キャリアパスと評価・処遇</li>
                    <li>・離職予防と早期発見</li>
                  </ul>
                </div>
                <div>
                  <p className="text-[#C8A84B] font-semibold mb-2 text-xs tracking-wider">
                    法務労務
                  </p>
                  <ul className="space-y-2">
                    <li>・在留資格の更新実務</li>
                    <li>・雇用契約と労働条件</li>
                    <li>・社会保険・税務の実務</li>
                    <li>・育成就労制度への移行対応</li>
                    <li>・コンプライアンス対応</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* 数字 */}
          <div className="grid grid-cols-3 gap-4 mt-10 max-w-2xl mx-auto text-center">
            {[
              { n: '24', l: 'モジュール' },
              { n: '360', l: 'クイズ問題' },
              { n: '100%', l: 'クラウド完結' },
            ].map((s) => (
              <div key={s.l}>
                <p className="text-3xl font-bold text-[#C8A84B]">{s.n}</p>
                <p className="text-xs text-white/60 mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 画面イメージ */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <h2 className="text-center text-2xl font-bold text-[#1A3E6E] mb-2">画面イメージ</h2>
        <p className="text-center text-sm text-[#1A2433]/60 mb-10">
          受講者・管理者それぞれの実際の画面をご覧ください。
        </p>
        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {[
            {
              src: '/screenshots/learn.png',
              alt: '受講者ダッシュボード',
              title: '受講者ダッシュボード',
              desc: '進捗・合格状況がひと目で分かり、「続きから学習」ですぐ再開できます。',
            },
            {
              src: '/screenshots/module.png',
              alt: '学習画面(冊子・クイズ)',
              title: '学習画面',
              desc: '図解豊富な冊子と確認クイズ。読了率は自動で記録されます。',
            },
            {
              src: '/screenshots/admin.png',
              alt: '管理者ダッシュボード',
              title: '管理者ダッシュボード',
              desc: '全受講者の進捗・修了状況を一括管理。アカウントはCSVで一括発行。',
            },
          ].map((s) => (
            <figure
              key={s.src}
              className="bg-white rounded-xl border border-[#1A3E6E]/10 shadow-sm overflow-hidden"
            >
              <div className="bg-[#E8EBEF] px-3 py-2 flex gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C8A84B]/60"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E6E]/30"></span>
                <span className="w-2.5 h-2.5 rounded-full bg-[#1A3E6E]/15"></span>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.src} alt={s.alt} className="w-full aspect-[4/3] object-cover object-top" />
              <figcaption className="p-4">
                <p className="font-bold text-sm text-[#1A3E6E]">{s.title}</p>
                <p className="text-xs text-[#1A2433]/60 mt-1 leading-relaxed">{s.desc}</p>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className="bg-[#132B4D] text-white rounded-xl p-7 text-center">
          <p className="font-bold mb-1.5">実際に操作してみたい方へ</p>
          <p className="text-sm text-white/70 mb-5">
            デモアカウントを無料で発行します。導入前に受講者・管理者の両画面をお試しいただけます。
          </p>
          <Link
            href="/contact?type=demo"
            className="inline-block bg-[#C8A84B] text-[#132B4D] font-bold px-8 py-3 rounded-lg hover:opacity-90 transition"
          >
            デモアカウントを申し込む(無料)
          </Link>
        </div>
      </section>

      {/* 料金 */}
      <section className="max-w-6xl mx-auto px-6 py-20 pt-0">
        <h2 className="text-center text-2xl font-bold text-[#1A3E6E] mb-10">料金</h2>
        <div className="max-w-xl mx-auto bg-white rounded-2xl border-2 border-[#1A3E6E] shadow-lg overflow-hidden">
          <div className="bg-[#1A3E6E] text-white text-center py-3 text-sm font-semibold tracking-wider">
            {PRICING.planName}
          </div>
          <div className="p-8">
            <div className="text-center mb-7">
              {PRICING.price ? (
                <p className="text-[#1A3E6E]">
                  <span className="text-4xl font-bold">{PRICING.price}</span>
                  <span className="text-sm text-[#1A2433]/60 ml-2">{PRICING.unit}</span>
                </p>
              ) : (
                <p className="text-sm text-[#1A2433]/70 leading-relaxed">
                  料金は企業規模に応じて個別にご案内しています。
                  <br />
                  お見積りフォームよりお問い合わせください。
                </p>
              )}
            </div>
            <ul className="space-y-3 text-sm text-[#1A2433]/80 mb-8">
              {PRICING.features.map((f) => (
                <li key={f} className="flex gap-2.5">
                  <span className="text-[#C8A84B] font-bold shrink-0">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href="/contact"
              className="block text-center bg-[#1A3E6E] text-white font-bold py-3.5 rounded-lg hover:bg-[#15335C] transition"
            >
              お見積りを依頼する
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
