/** @type {import('next').NextConfig} */
const nextConfig = {
  // gzip圧縮（Vercelはデフォルト有効だが明示）
  compress: true,

  // 実験的機能：パッケージの最適化
  experimental: {
    optimizePackageImports: ['firebase/app', 'firebase/auth', 'firebase/firestore'],
  },

  // HTTPヘッダー：静的アセットの長期キャッシュ
  async headers() {
    return [
      {
        source: '/manual.html',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
      },
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
