import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

const CHAPTER_KEYWORDS: Record<string, string[]> = {
  M1:  ['第3章','第３章','基本と心構え'],
  M2:  ['第2章','第２章','受け入れた企業の課題'],
  M3:  ['第5章','第５章','在留資格'],
  M4:  ['第5章','第５章','在留資格'],
  M5:  ['第6章','第６章','募集と採用'],
  M6:  ['第6章','第６章','募集と採用'],
  M7:  ['第7章','第７章','労務管理'],
  M8:  ['第7章','第７章','労務管理'],
  M9:  ['第8章','第８章','指導','教育','定着'],
  M10: ['第8章','第８章','指導','教育','定着'],
  M11: ['第1章','第１章','トラブル30'],
  M12: ['第10章','第１０章','トラブルQ&A','よくある'],
  M13: ['第9章','第９章','退職','解雇'],
  M14: ['第4章','第４章','法律知識'],
}

const FALLBACK: Record<string, string> = {
  M1:'外国人雇用の背景・動向、メリット・デメリット、3ステップ、企業の5つの義務',
  M2:'受け入れ企業の6課題・根本原因（氷山モデル）・8つの解決策',
  M3:'在留資格3分類、在留カード、不法就労助長罪',
  M4:'育成就労制度（2027年施行）、変更フロー、留学→就労資格変更',
  M5:'海外採用フロー（2〜4か月）、在留資格認定証明書',
  M6:'均等待遇原則、労働条件明示義務（2024年4月改正）、誓約書',
  M7:'社会保険加入、雇用保険、脱退一時金、外国人雇用状況届出',
  M8:'賃金支払い5原則、同一労働同一賃金、36協定、割増賃金率',
  M9:'離職リスク、定着3本柱、メンター制度、業務マニュアル',
  M10:'定期面談、業務指示4原則、人前での叱責禁止',
  M11:'トラブル4象限、専門家活用、相談窓口',
  M12:'問題行動への段階的対応、懲戒処分、ハラスメント対策',
  M13:'解雇3種類、解雇予告、整理解雇4要件、脱退一時金説明',
  M14:'労災保険、健康診断義務、帰国支援、宗教的配慮',
}

const STYLES = `
<style>
  .book-content {
    font-family: 'Hiragino Sans', 'Yu Gothic', sans-serif;
    color: #333;
    line-height: 1.9;
    font-size: 15px;
    padding: 24px;
    max-width: 720px;
    margin: 0 auto;
  }
  .book-content h1, .book-content h2 { color: #1A3E6E; font-weight: bold; margin: 28px 0 16px; padding-bottom: 8px; border-bottom: 2px solid #C8A84B; }
  .book-content h1 { font-size: 22px; }
  .book-content h2 { font-size: 19px; }
  .book-content h3 { color: #1A3E6E; font-size: 17px; font-weight: bold; margin: 22px 0 12px; }
  .book-content h4 { font-size: 15px; font-weight: bold; margin: 18px 0 10px; }
  .book-content p { margin: 12px 0; }
  .book-content ul, .book-content ol { margin: 12px 0 12px 24px; padding-left: 12px; }
  .book-content li { margin: 6px 0; }
  .book-content table { border-collapse: collapse; width: 100%; margin: 16px 0; font-size: 13px; }
  .book-content th, .book-content td { border: 1px solid #ddd; padding: 8px 12px; text-align: left; }
  .book-content th { background: #F4F2EE; color: #1A3E6E; font-weight: bold; }
  .book-content blockquote { border-left: 4px solid #C8A84B; padding: 8px 16px; margin: 16px 0; background: #FFF9E6; }
  .book-content strong, .book-content b { color: #1A3E6E; }
  .book-content img { max-width: 100%; height: auto; }
  .book-content svg { max-width: 100%; }
</style>
`

export async function GET(
  _req: NextRequest,
  { params }: { params: { moduleId: string } }
) {
  const { moduleId } = params
  const kws = CHAPTER_KEYWORDS[moduleId]
  if (!kws) return new NextResponse('<p>モジュールが見つかりません。</p>',{headers:{'Content-Type':'text/html;charset=utf-8'}})

  try {
    const fp = join(process.cwd(),'public','manual.html')
    if (!existsSync(fp)) throw new Error('not found')
    const html = readFileSync(fp,'utf-8')

    let bestIdx = -1
    for (const kw of kws){
      const idx = html.indexOf(kw)
      if (idx !== -1 && (bestIdx === -1 || idx < bestIdx)) bestIdx = idx
    }

    if (bestIdx !== -1){
      const chunk = html.slice(bestIdx, bestIdx+15000)
      return new NextResponse(
        `${STYLES}<div class="book-content">${chunk}</div>`,
        {headers:{'Content-Type':'text/html;charset=utf-8'}}
      )
    }
    throw new Error('chapter not found')
  } catch {
    return new NextResponse(
      `${STYLES}<div class="book-content">
        <h2>📚 ${moduleId} の冊子内容</h2>
        <p>${FALLBACK[moduleId]??''}</p>
        <p style="font-size:12px;color:#999;margin-top:24px;">冊子全文を表示するには <code>public/manual.html</code> を配置してください。</p>
       </div>`,
      {headers:{'Content-Type':'text/html;charset=utf-8'}}
    )
  }
}