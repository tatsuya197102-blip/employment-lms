// src/app/api/youtube/route.ts
// MARKER: LMS_VIDEO_MAP_BUNNY_V1 (2026-08-17)
// 【M1】〜【M14】タグ別スタティックマップ。
// YouTube ID → Bunny Stream 動画GUID(ライブラリ employment-lms / ID 729943)へ移行済み。
// パス名 /api/youtube は既存クライアント(useYouTubeVideos)互換のため維持。
// 並び順はモジュール内ラベル昇順(岡本さん承認 2026-08-17)。対応表: lms_upload_map_v1.csv

import { NextResponse } from 'next/server'

const STATIC_VIDEO_MAP: Record<string, string[]> = {
  M1:  ['6dee6718-3ed6-48ee-af74-8ea25d4589dd', '046ab982-4881-4eb2-b62c-91d912bd229f', 'a1769150-55a9-4210-9e23-1f48ccb96637'], // 8a, 13c, 14c
  M2:  ['09516d65-c548-4c6e-8e2f-4690c88b950c', 'b2b4b422-5f42-42d6-b07d-adc1d921e8b6', '56a677c4-91fc-4e7e-8ff7-fcda291ad38a', '460e8ba7-c11b-4a30-b42f-5415f4d34b8a', '04dad13b-5881-47a4-b461-0716e920875a'], // 2a, 3a, 9b, 10b, 11b
  M3:  ['d621da00-99e1-4897-9841-87e13267e6e9', '368ecaef-3b49-46d9-867d-57ad6e0cc6af', '9aafaedf-2e11-4419-9f77-810d6a4b9808', 'a2d5f716-9be3-435b-a655-a36a9685742d'], // 16c, 17c, 18c, 19c
  M4:  ['6a9688b7-50dc-4c23-8496-441dddc46e51'], // 15c
  M5:  ['2a897b67-453c-4a65-9f68-c614c772e614'], // 21c
  M6:  ['b290961e-4422-4126-a09c-5c831673c65d'], // 20c
  M7:  ['0a67ac6c-48db-4967-8f23-8f5eaf9851e9', 'd793d81c-3669-4b95-bbce-420c3dd7c702'], // 22c, 23c
  M8:  ['66f471ea-77f3-4af5-b51e-0c7ce11cac64', 'ae521ac8-2c83-4c7b-af52-a8682fcd5773'], // 25c, 26c
  M9:  ['f7513647-7374-41b3-b2a6-c25e30c84efa', 'd84e450d-c2d3-499f-8c24-b7d3a7a009ec', '911c48b4-1674-4970-bf5a-5e8191dd1755', '35fa6fb0-28f1-498e-bb4a-7634c413a7b8'], // 4a, 7a, 24c, 27c
  M10: ['a56ce4aa-d69c-4741-a4e0-4b8fb1616418', '434ddbb9-13af-4302-9fef-1ae23640f3fb'], // 28c, 29c
  M11: ['4c61a4fb-a08d-4cb4-9ba0-8a2a596ac13c', 'd5923c1f-4bba-4eb8-a7db-32dfbf0bd007', '2b229488-bf99-4826-93d1-603356593916', 'd4efbad2-3331-42f2-b025-fed7c24db329', '3bbd2267-df75-4844-bccd-d75a65014c47', '6165caba-2f3b-4e86-a847-b75ea3dd47bb'], // 1a, 6a, 12b, 33c, 34c, 35c
  M12: ['9220be11-50fc-49be-8f71-5c1a6d583bca', '90ed02f6-56ac-4eb9-b3de-2ee41fb04480'], // M12_問題社員への対応_1初動編, M12_問題社員への対応_2懲戒解雇の前に
  M13: ['edd3f57c-3657-437b-b10c-d39c405f3066', '9f57722f-81c0-4056-8f5e-034e007c3470', 'f37a94af-c0de-40a2-b4b1-391b6d8ae46b'], // 30c, 31c, 32c
  M14: ['d5d87de8-9386-4b21-976d-c97a9908ba6c'], // 5a
}

export async function GET() {
  return NextResponse.json(STATIC_VIDEO_MAP, {
    headers: {
      'Cache-Control': 's-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
