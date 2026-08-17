'use client'
// src/components/youtube/YouTubePlayer.tsx
// MARKER: LMS_VIDEO_PLAYER_BUNNY_V1 (2026-08-17)
// 中身をYouTube IFrame API → Bunny Stream埋め込みへ移行。
// ファイル名・コンポーネント名は既存import(page.tsx)を壊さないため維持。
// videoId には /api/youtube が返す Bunny動画GUID が入る。
// 再生終了(onEnded)はBunnyプレーヤーのPlayer.js互換APIで検知。万一イベントが
// 取れない環境でも再生自体は動き、画面の「視聴済みにする」ボタンで代替できる。

import { useEffect, useRef } from 'react'

const BUNNY_LIBRARY_ID = '729943' // Bunny Stream ライブラリ employment-lms

interface PlayerJsPlayer { on: (event: string, cb: () => void) => void }
declare global {
  interface Window { playerjs?: { Player: new (el: HTMLIFrameElement) => PlayerJsPlayer } }
}

interface Props {
  videoId: string
  onEnded?: () => void
}

export default function YouTubePlayer({ videoId, onEnded }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    let cancelled = false
    const attach = () => {
      if (cancelled || !iframeRef.current || !window.playerjs) return
      try {
        const player = new window.playerjs.Player(iframeRef.current)
        player.on('ready', () => {
          player.on('ended', () => { if (!cancelled) onEnded?.() })
        })
      } catch {
        // イベント取得に失敗しても再生は継続。視聴済みは手動ボタンで代替。
      }
    }
    if (window.playerjs) {
      attach()
    } else {
      const tag = document.createElement('script')
      tag.src = 'https://assets.mediadelivery.net/playerjs/player-0.1.0.min.js'
      tag.onload = attach
      document.head.appendChild(tag)
    }
    return () => { cancelled = true }
  }, [videoId, onEnded])

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <iframe
        ref={iframeRef}
        key={videoId}
        src={`https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=false&preload=true`}
        title="lesson video"
        className="w-full h-full"
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}
