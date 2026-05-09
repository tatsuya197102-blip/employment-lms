// src/app/api/book/[moduleId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const CHAPTER_MAP: Record<string, string[]> = {
  M1:  ['第３章','第3章'],  M2:  ['第２章','第2章'],
  M3:  ['第５章','第5章'],  M4:  ['第５章','第5章'],
  M5:  ['第６章','第6章'],  M6:  ['第６章','第6章'],
  M7:  ['第７章','第7章'],  M8:  ['第７章','第7章'],
  M9:  ['第８章','第8章'],  M10: ['第８章','第8章'],
  M11: ['第１章','第1章','第１０章','第10章'],
  M12: ['第１０章','第10章'],
  M13: ['第９章','第9章'],  M14: ['第４章','第4章'],
}

const FALLBACK: Record<string, string> = {
  M1:'外国人雇用の背景・動向、メリット・デメリット、3ステップ、企業の5つの義務',
  M2:'受け入れ企業の6課題・根本原因（氷山モデル）・8つの解決策',
  M3:'在留資格3分類、在留カード、不法就労助長罪（3年以下の懲役または300万円以下の罰金）',
  M4:'育成就労制度（2027年施行）、変更フロー、留学→就労資格変更',
  M5:'海外採用フロー（2〜4か月）、在留資格認定証明書（有効期限3か月）、要件',
  M6:'均等待遇原則、労働条件明示義務（2024年4月改正）、誓約書',
  M7:'社会保険加入、雇用保険、脱退一時金、外国人雇用状況届出（翌月10日）',
  M8:'賃金支払い5原則、同一労働同一賃金、36協定、割増賃金率',
  M9:'離職リスク（入社後3か月〜1年）、定着3本柱、メンター制度、業務マニュアル',
  M10:'定期面談（入社後3か月は月2回）、業務指示4原則、人前での叱責禁止',
  M11:'トラブル4象限、専門家活用、相談窓口（労働基準監督署等）',
  M12:'問題行動への段階的対応、懲戒処分、ハラスメント対策',
  M13:'解雇3種類、解雇予告（30日前）、整理解雇4要件、脱退一時金説明',
  M14:'労災保険（事業主全額負担）、健康診断義務、帰国支援、宗教的配慮',
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const { moduleId } = params
  const kws = CHAPTER_MAP[moduleId]
  if (!kws) return new NextResponse('<p>モジュールが見つかりません。</p>',{headers:{'Content-Type':'text/html;charset=utf-8'}})

  try {
    const fp = join(process.cwd(),'public','manual.html')
    if (!existsSync(fp)) throw new Error('not found')
    const html = readFileSync(fp,'utf-8')

    // キーワードで章の開始位置を探して10000文字切り出し
    for (const kw of kws){
      const idx = html.indexOf(kw)
      if (idx !== -1){
        const chunk = html.slice(idx, idx+12000)
        return new NextResponse(
          `<div class="prose prose-sm px-2 py-4 max-w-none">${chunk}</div>`,
          {headers:{'Content-Type':'text/html;charset=utf-8'}}
        )
      }
    }
    throw new Error('chapter not found')
  } catch {
    return new NextResponse(
      `<div style="padding:20px;font-family:sans-serif;">
        <div style="background:#EEF4FC;border-left:4px solid #1A3E6E;padding:16px;border-radius:8px;margin-bottom:12px;">
          <p style="font-weight:bold;color:#1A3E6E;margin:0 0 6px;">📚 ${moduleId} の冊子内容</p>
          <p style="margin:0;font-size:14px;color:#444;">${FALLBACK[moduleId]??''}</p>
        </div>
        <p style="font-size:12px;color:#999;">冊子全文を表示するには <code>外国人雇用マニュアル_完全版_2026.html</code> を <code>public/manual.html</code> としてリポジトリに配置してください。</p>
      </div>`,
      {headers:{'Content-Type':'text/html;charset=utf-8'}}
    )
  }
}
