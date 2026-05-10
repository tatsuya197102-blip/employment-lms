import Link from 'next/link'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1A3E6E] via-[#2A4E8E] to-[#1A3E6E] text-white">
      {/* ヘッダー */}
      <header className="px-6 py-5 flex items-center justify-between max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white text-primary rounded-lg flex items-center justify-center font-bold text-sm">JMC</div>
          <span className="font-bold text-sm">外国人雇用LMS</span>
        </div>
        <div className="flex gap-3">
          <Link href="/learn/login" className="text-sm text-white/80 hover:text-white px-4 py-2 rounded-lg hover:bg-white/10 transition">
            受講者ログイン
          </Link>
          <Link href="/admin/login" className="text-sm bg-accent text-primary font-semibold px-5 py-2 rounded-lg hover:bg-accent/90 transition">
            管理者ログイン
          </Link>
        </div>
      </header>

      {/* メインビジュアル */}
      <main className="max-w-6xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <p className="text-sm font-medium text-accent mb-4 tracking-widest">FOREIGN EMPLOYMENT LEARNING SYSTEM</p>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            外国人雇用を、<br />
            <span className="text-accent">確実な実務</span>に。
          </h1>
          <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
            人事担当者・現場管理職向け eラーニング研修パッケージ。<br />
            動画・冊子・修了試験を通じて、外国人雇用の実務知識を体系的に習得できます。
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/learn/login" className="bg-accent text-primary font-bold px-8 py-3.5 rounded-lg hover:bg-accent/90 transition shadow-lg">
              受講者として始める
            </Link>
            <Link href="/admin/login" className="bg-white/10 backdrop-blur text-white font-semibold px-8 py-3.5 rounded-lg hover:bg-white/20 transition border border-white/20">
              管理者ダッシュボード
            </Link>
          </div>
        </div>

        {/* 特徴 */}
        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {[
            {
              n: '14',
              title: 'モジュール構成',
              desc: '在留資格・採用・労務管理・トラブル対応まで実務全領域をカバー',
            },
            {
              n: '210',
              title: 'クイズ問題',
              desc: '4択問題のランダム出題と即時フィードバックで知識を定着',
            },
            {
              n: '100%',
              title: 'クラウド完結',
              desc: 'インストール不要。PC・スマートフォンでいつでも受講可能',
            },
          ].map((c, i) => (
            <div key={i} className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-8">
              <p className="text-5xl font-bold text-accent mb-3">{c.n}</p>
              <h3 className="font-bold mb-2">{c.title}</h3>
              <p className="text-sm text-white/60 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>

        {/* カリキュラム紹介 */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-10">
          <h2 className="text-2xl font-bold mb-2">カリキュラム</h2>
          <p className="text-sm text-white/60 mb-8">最新の入管法・労働基準法に対応した14モジュール</p>
          <div className="grid md:grid-cols-2 gap-3">
            {[
              ['M1', '外国人雇用の基本と心構え'],
              ['M2', '外国人材受け入れ企業の課題分析'],
              ['M3', '在留資格の基礎知識'],
              ['M4', '在留資格の変更フロー'],
              ['M5', '海外からの採用手続き'],
              ['M6', '採用活動（募集・面接・内定）'],
              ['M7', '入社手続きと社会保険'],
              ['M8', '労務管理の基本'],
              ['M9', '定着と教育体制'],
              ['M10', '面談と指導記録'],
              ['M11', 'トラブル対応と問題解決'],
              ['M12', '問題社員への対応'],
              ['M13', '退職・解雇の手続き'],
              ['M14', '労災保険と福利厚生'],
            ].map(([id, title]) => (
              <div key={id} className="flex items-center gap-3 py-2.5 px-4 rounded-lg hover:bg-white/5 transition">
                <span className="text-xs font-bold text-accent w-8">{id}</span>
                <span className="text-sm">{title}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="border-t border-white/10 mt-20">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between text-xs text-white/40">
          <p>© 株式会社 J-MANGA CREATE</p>
          <p>外国人雇用LMS v1.0</p>
        </div>
      </footer>
    </div>
  )
}