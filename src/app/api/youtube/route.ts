// src/app/api/youtube/route.ts
// 【M1】〜【M14】タグ別スタティックマップ

import { NextResponse } from 'next/server'

const STATIC_VIDEO_MAP: Record<string, string[]> = {
  M1:  ['N7jSKHnx8n8', '0APNyc8vOsw', '4fem9NW1mzA'],
  M2:  ['87Gy87gbE0k', 'zcN3A-5nWi4', '59WiSYTym9M', 'auyLoumoE1Y', '6ukU5r_LRBY'],
  M3:  ['_aFYLMRQoKA', '1qAwxWVCS2M', 'cQFR82_5osM', 'pN7K5YdyLx0'],
  M4:  ['6lNdrP1phBU'],
  M5:  ['OV-gjcwuz4o'],
  M6:  ['U2DtGRThDvE'],
  M7:  ['DiHYIoCgEfk', 'Xf02k-9qoJU'],
  M8:  ['2lAY7y9esbA', 'utDVMwj1Tko'],
  M9:  ['vzrvCqfhvg4', 'oo2BfVth1qM', 'eKsIm4EUpzM', '8kAp7w8Cmew'],
  M10: ['xB6-e5AY8IM', '2mcHJfnc1yo'],
  M11: ['5hhknVhHCfE', 'k6LkyvAbI48', 'mmJKOaTAW2k', '6yJrzHAPLjE', 'OL-A5OTeVxs', 'TuHIPHas7cs'],
  M12: [],
  M13: ['5FdfDSk6MSs', '0B-5nnJRUyo', 'pvnib9ImvRo'],
  M14: ['aomuI4EV4E4'],
}

export async function GET() {
  return NextResponse.json(STATIC_VIDEO_MAP, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
