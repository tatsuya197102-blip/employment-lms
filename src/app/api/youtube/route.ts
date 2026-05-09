// src/app/api/youtube/route.ts
// YouTube Data API v3 で【M1】〜【M14】タグを検索し自動マッピング

import { NextResponse } from 'next/server'

interface YouTubeItem {
  id: { videoId: string }
  snippet: { title: string; description: string }
}

export async function GET() {
  const apiKey    = process.env.YOUTUBE_API_KEY
  const channelId = process.env.YOUTUBE_CHANNEL_ID

  if (!apiKey || !channelId) {
    return NextResponse.json({ error: 'YOUTUBE_API_KEY or YOUTUBE_CHANNEL_ID not set' }, { status: 500 })
  }

  const moduleIds = Array.from({ length: 14 }, (_, i) => `M${i + 1}`)
  const result: Record<string, string[]> = {}

  for (const moduleId of moduleIds) {
    const tag = `【${moduleId}】`
    const url = new URL('https://www.googleapis.com/youtube/v3/search')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('channelId', channelId)
    url.searchParams.set('q', tag)
    url.searchParams.set('part', 'snippet')
    url.searchParams.set('type', 'video')
    url.searchParams.set('maxResults', '10')
    url.searchParams.set('order', 'title')

    try {
      const res  = await fetch(url.toString())
      const data = await res.json()
      const videoIds = (data.items as YouTubeItem[])
        ?.filter((item) => item.snippet.title.includes(tag))
        .map((item) => item.id.videoId) ?? []
      result[moduleId] = videoIds
    } catch {
      result[moduleId] = []
    }
  }

  return NextResponse.json(result, {
    headers: {
      'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
