/** @type {import('next').NextConfig} */
const nextConfig = {
  // gzip圧縮（Vercelはデフォルト有効だが明示）
  compress: true,

  // 実験的機能：パッケージの最適化
  experimental: {
    optimizePackageImports: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
    // [HR_BOOK_GUARD_V1] 冊子HTML(content/books)を冊子APIの実行環境に同梱する
    outputFileTracingIncludes: {
      '/api/book/[moduleId]': ['./content/books/**/*'],
    },
  },

  // HTTPヘッダー：静的アセットの長期キャッシュ
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ]
  },
}

export default nextConfig
