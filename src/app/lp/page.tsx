// [HR_LP_V1] /lp … 外国人雇用LMS 法人向け紹介ページ
// 文言は「雇用LMS_介護施設向けチラシ_v5」から転記。数字・文言を変えるときは下の DICT だけを直す。
import type { Metadata } from 'next'
import Link from 'next/link'
import SiteFooter from '@/components/SiteFooter'

export const metadata: Metadata = {
  title: '外国人雇用LMS 法人向け | 外国人スタッフの雇用を、「知らなかった」で済ませない。',
  description:
    '施設長・人事担当者・現場管理職向けの外国人雇用研修 eラーニング。在留資格の確認から採用・労務管理、育成就労制度への移行、定着支援まで、冊子・動画・クイズで。年額98,000円(税別)・1施設あたり定額・受講人数無制限。',
  alternates: { canonical: '/lp' },
}

const DICT = {
  eyebrow: '施設長・人事担当者・現場管理職向け 外国人雇用研修 eラーニング　外国人雇用LMS',
  title1: '外国人スタッフの雇用を、',
  title2: '「知らなかった」で済ませない。',
  lead: '在留資格の確認から採用・労務管理、育成就労制度への移行、定着支援まで。外国人スタッフを受け入れる施設の人事担当者と現場管理職が、実務に必要な知識を冊子・動画・クイズで身につけられるeラーニングです。',
  price: { amount: '98,000', line1: '1年間・1施設あたり定額・受講人数無制限', line2: '税別。月あたり約8,200円', line3: '初期費用0円／アカウント発行料0円' },
  law: {
    heading: '2027年4月、不法就労助長罪の罰則が厳罰化されます。同時に技能実習は「育成就労制度」へ移行(本サービスは専用モジュールで対応済み)',
    now: { label: '現行', a: '3年以下の拘禁刑', b: '300万円以下の罰金' },
    next: { label: '2027年4月から', a: '5年以下の拘禁刑', b: '500万円以下の罰金' },
  },
  media: [
    { img: '/lp/img/shot_video.png', t: '動画で深める', d: '要点を押さえた解説動画(各モジュール複数本)' },
    { img: '/lp/img/shot_booklet.png', t: '冊子で学ぶ', d: '図解つきデジタル冊子。読了率を自動記録し、途中から再開' },
    { img: '/lp/img/shot_quiz.png', t: 'クイズで確認', d: '各モジュール15問・解説つき。全モジュール合格で修了証を発行' },
  ],
  accounts: { t: '受講アカウントは無制限', d: '1施設の契約で発行数に制限はありません。全職員への展開も追加費用なしです。' },
  system: {
    heading: '担当者が替わっても、実務が止まらない体制を。',
    body: '「あの人しか在留資格の手続きが分からない」。担当者の異動・退職のたびに実務が止まり、届出漏れや手続きミスの危険が高まります。研修の実施記録と修了証は、監査や入管対応の際に、施設の教育体制を示す材料になります。',
    shotCaption: '受講者画面のトップ。合格モジュール・クイズ挑戦・動画視聴・読了率と、次に学ぶ内容が一目で分かります',
    required: { t: '必修編 14モジュール', sub: '人事・採用担当者向け', items: ['在留資格の基礎知識・変更フロー', '海外からの採用手続き／募集・面接・内定', '入社手続きと社会保険／労務管理・給与・税務', '職場コミュニケーションと文化理解', 'トラブル対応・退職時の手続き ほか'] },
    practice: { t: '実践編 10モジュール', sub: '現場管理職・労務責任者向け', items: ['やさしい日本語の実践／生活支援の実務', 'キャリアパスと評価・処遇', '離職予防とトラブルの早期発見', '育成就労制度への移行対応', '雇用契約と労働条件／コンプライアンス ほか'] },
  },
  table: [
    { k: '料金', v: '年額 98,000円(税別・1施設あたり)。1年間の定額で、受講人数は無制限。月額課金や1人あたりの課金はありません。' },
    { k: '初期費用', v: '0円。サーバー構築やシステム導入作業はありません。' },
    { k: '受講環境', v: 'PC・スマホのブラウザだけで受講できます。インストール不要。' },
    { k: '管理機能', v: '管理者ダッシュボードで、誰がどこまで学び、どのモジュールに合格したかを確認。受講アカウントはCSVで一括発行。' },
    { k: '本人向けとのセット', v: '外国人スタッフ本人向け「Global Workforce Learn」(16言語・受講者100名まで)とのセットは年額144,000円(税別)。単品合算より約23%お得です。' },
    { k: '始め方', v: 'メールでお問い合わせ → デモ・お見積り → ご契約(請求書払い) → アカウント一括発行。最短当日から受講できます。' },
  ],
  contact: { heading: 'お問い合わせ・お見積り・デモのご依頼', cta: '問い合わせフォームへ', gwl: '本人向け「Global Workforce Learn」の紹介を見る' },
}

const GWL_LP = 'https://learn.globalworkforce.jp/lp/gwl'

export default function LpPage() {
  return (
    <div className="min-h-screen bg-[#F6F7F9] text-[#1A2433]">
      <header className="sticky top-0 z-20 bg-[#F6F7F9]/90 backdrop-blur border-b border-[#E3E7EE]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1A3E6E] text-[11px] font-bold text-white">JMC</span>
            <span className="text-sm font-bold tracking-wide">外国人雇用LMS</span>
          </Link>
          <nav className="flex items-center gap-3 text-xs">
            <a href={GWL_LP} className="hidden sm:inline text-[#4A5968] hover:underline">本人向け GWL</a>
            <Link href="/learn/login" className="rounded-full border border-[#1A2433] px-4 py-1.5 font-bold">受講者ログイン</Link>
          </nav>
        </div>
      </header>

      {/* ヒーロー */}
      <section className="mx-auto max-w-5xl px-5 pt-14 pb-10">
        <div className="grid items-end gap-8 md:grid-cols-[1.25fr_.75fr]">
          <div>
            <p className="inline-block rounded-full bg-[#E8EDF5] px-3 py-1 text-[11px] font-bold text-[#1A3E6E]">{DICT.eyebrow}</p>
            <h1 className="mt-4 text-[30px] font-black leading-tight md:text-[46px]">
              {DICT.title1}<br />{DICT.title2}
            </h1>
            <p className="mt-5 max-w-2xl text-[16px] leading-relaxed text-[#4A5968]">{DICT.lead}</p>
            <div className="mt-7 flex flex-wrap items-center gap-5 rounded-2xl border border-[#E3E7EE] bg-white p-6">
              <span className="rounded-lg bg-[#1A3E6E] px-3 py-2 text-xl font-black text-white">年額</span>
              <span className="text-5xl font-black tracking-tight md:text-6xl">{DICT.price.amount}<span className="ml-1 text-2xl">円</span></span>
              <div className="border-l-2 border-[#E3E7EE] pl-5 text-sm text-[#4A5968]">
                <b className="block text-base text-[#1A3E6E]">{DICT.price.line1}</b>
                {DICT.price.line2}<br />{DICT.price.line3}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/contact" className="rounded-xl bg-[#C9553F] px-6 py-3.5 font-bold text-white shadow-[0_6px_0_#A64432] hover:translate-y-0.5 hover:shadow-[0_4px_0_#A64432]">{DICT.contact.cta}</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-[220px] md:max-w-none"><img src="/lp/img/mia.png" alt="" className="w-full drop-shadow-xl" /></div>
        </div>
      </section>

      {/* 法改正 */}
      <section className="bg-[#1A3E6E] text-white">
        <div className="mx-auto max-w-5xl px-5 py-10">
          <h2 className="text-lg font-bold leading-relaxed md:text-xl">{DICT.law.heading}</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            {[DICT.law.now, DICT.law.next].map((x) => (
              <div key={x.label} className="border-t border-white/30 pt-4">
                <p className="text-sm text-white/70">{x.label}</p>
                <p className="mt-1 text-2xl font-black md:text-3xl">{x.a}<br />{x.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 学び方3つ */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {DICT.media.map((m) => (
            <div key={m.t} className="overflow-hidden rounded-2xl border border-[#E3E7EE] bg-white">
              <img src={m.img} alt="" className="w-full" />
              <div className="p-4"><h3 className="font-bold">{m.t}</h3><p className="mt-1 text-sm text-[#4A5968]">{m.d}</p></div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-[#E3E7EE] bg-white p-5">
          <p className="font-bold">{DICT.accounts.t}</p>
          <p className="mt-1 text-sm text-[#4A5968]">{DICT.accounts.d}</p>
        </div>
      </section>

      {/* 体制・モジュール */}
      <section className="bg-white">
        <div className="mx-auto max-w-5xl px-5 py-12">
          <h2 className="text-2xl font-black md:text-3xl">{DICT.system.heading}</h2>
          <p className="mt-4 max-w-3xl leading-relaxed text-[#4A5968]">{DICT.system.body}</p>
          <div className="mt-8 grid gap-8 md:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-[#E3E7EE]">
              <img src="/lp/img/shot_learner_top.png" alt="" className="w-full" />
              <p className="border-t border-[#E3E7EE] px-3 py-2 text-xs text-[#7A8592]">{DICT.system.shotCaption}</p>
            </div>
            <div className="space-y-6">
              {[DICT.system.required, DICT.system.practice].map((g) => (
                <div key={g.t}>
                  <h3 className="text-lg font-black text-[#1A3E6E]">{g.t} <span className="ml-2 text-xs font-bold text-[#7A8592]">{g.sub}</span></h3>
                  <ul className="mt-2 space-y-1.5">
                    {g.items.map((i) => (
                      <li key={i} className="flex gap-2 text-sm"><span className="mt-2 h-2 w-2 flex-none bg-[#C89B3F]" />{i}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 料金表 */}
      <section className="mx-auto max-w-5xl px-5 py-12">
        <h2 className="text-2xl font-black md:text-3xl">料金と始め方</h2>
        <table className="mt-6 w-full overflow-hidden rounded-2xl border border-[#E3E7EE] bg-white text-sm">
          <tbody>
            {DICT.table.map((r) => (
              <tr key={r.k} className="border-b border-[#E3E7EE] last:border-0">
                <th className="w-32 bg-[#EEF2F7] px-4 py-4 text-left align-top font-bold text-[#4A5968] md:w-40">{r.k}</th>
                <td className="px-4 py-4 align-top leading-relaxed">{r.v}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* 問い合わせ */}
      <section className="mx-auto max-w-5xl px-5 pb-14">
        <div className="grid items-center gap-5 rounded-3xl bg-[#1A3E6E] p-8 text-white md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-xl font-bold">{DICT.contact.heading}</h2>
            <a href={GWL_LP} className="mt-2 inline-block text-sm text-white/80 underline underline-offset-4">{DICT.contact.gwl} →</a>
          </div>
          <Link href="/contact" className="rounded-xl bg-[#C9553F] px-6 py-3.5 text-center font-bold text-white shadow-[0_6px_0_#A64432]">{DICT.contact.cta}</Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  )
}
