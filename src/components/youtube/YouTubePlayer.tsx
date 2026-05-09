'use client'
// src/components/youtube/YouTubePlayer.tsx

import { useEffect, useRef } from 'react'

interface Props {
  videoId: string
  onEnded?: () => void
}

export default function YouTubePlayer({ videoId, onEnded }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef    = useRef<YT.Player | null>(null)

  useEffect(() => {
    const init = () => {
      if (!containerRef.current) return
      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        playerVars: {
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (e: YT.OnStateChangeEvent) => {
            if (e.data === window.YT.PlayerState.ENDED) {
              onEnded?.()
            }
          },
        },
      })
    }

    if (window.YT && window.YT.Player) {
      init()
    } else {
      // YouTube IFrame API をロード
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      document.head.appendChild(tag)
      ;(window as unknown as Record<string, unknown>).onYouTubeIframeAPIReady = init
    }

    return () => {
      playerRef.current?.destroy()
    }
  }, [videoId, onEnded])

  return (
    <div className="relative aspect-video bg-black rounded-xl overflow-hidden">
      <div ref={containerRef} className="w-full h-full" />
    </div>
  )
}
