/** @type {import('next').NextConfig} */
const nextConfig = {
  // Firebaseをサーバーコンポーネントから使う場合に必要
  experimental: {
    serverComponentsExternalPackages: ['firebase-admin'],
  },
}

export default nextConfig
