'use client'
// src/components/book-viewer/BookViewer.tsx
// 冊子HTML表示 + スクロール80%到達で読了判定

import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  htmlContent: string           // 表示するHTMLコンテンツ（該当章のみ）
  initialPercent?: number       // 保存済みの読了率
  onProgress?: (percent: number) => void  // 進捗が変わるたびに呼ぶ
  onCompleted?: () => void      // 80%到達で呼ぶ（1回だけ）
}

export default function BookViewer({
  htmlContent, initialPercent = 0, onProgress, onCompleted,
}: Props) {
  const scrollRef   = useRef<HTMLDivElement>(null)
  const endRef      = useRef<HTMLDivElement>(null)
  const completedRef = useRef(initialPercent >= 80)
  const [percent, setPercent] = useState(initialPercent)

  // スクロール進捗の計算
  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const scrolled = el.scrollTop
    const total    = el.scrollHeight - el.clientHeight
    if (total <= 0) return
    const pct = Math.min(100, Math.round((scrolled / total) * 100))
    setPercent(pct)
    onProgress?.(pct)

    if (pct >= 80 && !completedRef.current) {
      completedRef.current = true
      onCompleted?.()
    }
  }, [onProgress, onCompleted])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 右クリック無効
  const preventContext = (e: React.MouseEvent) => e.preventDefault()

  return (
    <div className="flex flex-col h-full">
      {/* 進捗バー */}
      <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 border-b border-gray-100">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className="bg-accent h-2 rounded-full transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
        <span className="text-xs text-gray-500 shrink-0">{percent}% 読了</span>
        {percent >= 80 && (
          <span className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
            ✓ 読了
          </span>
        )}
      </div>

      {/* 本文 */}
      <div
        ref={scrollRef}
        onContextMenu={preventContext}
        className="book-viewer flex-1 overflow-y-auto px-6 py-4 prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />

      {/* 章末マーカー（IntersectionObserver用） */}
      <div ref={endRef} className="h-1" />
    </div>
  )
}
