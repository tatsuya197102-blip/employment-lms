'use client'

import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  moduleId: string
  initialPercent?: number
  onProgress?: (percent: number) => void
  onCompleted?: () => void
}

const CHAPTER_ANCHOR: Record<string, string> = {
  M1:  'ch3',  M2:  'ch2',  M3:  'ch5',  M4:  'ch5',
  M5:  'ch6',  M6:  'ch6',  M7:  'ch7',  M8:  'ch7',
  M9:  'ch8',  M10: 'ch8',  M11: 'ch1',  M12: 'ch10',
  M13: 'ch9',  M14: 'ch4',
}

export default function BookViewer({
  moduleId, initialPercent = 0, onProgress, onCompleted,
}: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const completedRef = useRef(initialPercent >= 80)
  const [percent, setPercent] = useState(initialPercent)

  const handleLoad = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe?.contentWindow) return
    const doc = iframe.contentDocument
    if (!doc) return

    // 該当章へスクロール
    const anchor = CHAPTER_ANCHOR[moduleId]
    if (anchor) {
      const target = doc.getElementById(anchor) ||
        Array.from(doc.querySelectorAll('h1, h2')).find(h =>
          (h.textContent || '').includes(`第${moduleId.slice(1)}章`)
        )
      if (target) target.scrollIntoView()
    }

    // 右クリック・印刷防止
    doc.addEventListener('contextmenu', e => e.preventDefault())
    const style = doc.createElement('style')
    style.textContent = `
      @media print { body { display: none !important; } }
      body { user-select: none !important; }
    `
    doc.head.appendChild(style)

    // スクロール進捗追跡
    const scrollWindow = iframe.contentWindow!
    const onScroll = () => {
      const scrolled = scrollWindow.scrollY
      const total = doc.documentElement.scrollHeight - scrollWindow.innerHeight
      if (total <= 0) return
      const pct = Math.min(100, Math.round((scrolled / total) * 100))
      setPercent(pct)
      onProgress?.(pct)
      if (pct >= 80 && !completedRef.current) {
        completedRef.current = true
        onCompleted?.()
      }
    }
    scrollWindow.addEventListener('scroll', onScroll, { passive: true })
  }, [moduleId, onProgress, onCompleted])

  return (
    <div className="flex flex-col h-full">
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
      <iframe
        ref={iframeRef}
        src="/manual.html?v=2"
        onLoad={handleLoad}
        className="flex-1 w-full border-0"
        sandbox="allow-same-origin allow-scripts"
      />
    </div>
  )
}