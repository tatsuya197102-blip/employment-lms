// src/hooks/useYouTubeVideos.ts
// モジュールごとの YouTube 動画IDリストをキャッシュ付きで取得

import { useEffect, useState } from 'react'

type VideoMap = Record<string, string[]>

let cache: VideoMap | null = null
let fetching: Promise<VideoMap> | null = null

async function fetchVideoMap(): Promise<VideoMap> {
  if (cache) return cache
  if (fetching) return fetching
  fetching = fetch('/api/youtube').then(r => r.json()).then((data: VideoMap) => {
    cache = data
    return data
  })
  return fetching
}

export function useYouTubeVideos(moduleId: string) {
  const [videoIds, setVideoIds] = useState<string[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    fetchVideoMap().then(map => {
      setVideoIds(map[moduleId] ?? [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [moduleId])

  return { videoIds, loading }
}
