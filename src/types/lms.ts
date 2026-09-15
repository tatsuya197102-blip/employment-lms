// src/types/lms.ts
export type UserRole = 'admin' | 'learner'

export interface LmsUser {
  email: string; displayName: string; role: UserRole; companyId: string
  invitedAt: Date; lastLoginAt?: Date; completed?: boolean; completedAt?: Date
}

/**
 * 会社ごとに「どの編を見せるか」。companies/{companyId} の editions に入れる。
 * 項目が無い会社は DEFAULT_EDITIONS(必修編・実践編・育成就労編)として扱うので、
 * 既存の会社データを書き換える作業は不要。
 */
export const DEFAULT_EDITIONS: Edition[] = ['core', 'practice', 'ikusei']

export function resolveEditions(raw?: unknown): Edition[] {
  if (!Array.isArray(raw) || raw.length === 0) return DEFAULT_EDITIONS
  const allowed: Edition[] = ['core', 'practice', 'ikusei', 'agency']
  const picked = raw.filter((e): e is Edition => allowed.includes(e as Edition))
  return picked.length ? picked : DEFAULT_EDITIONS
}

export const EDITION_LABELS: Record<Edition, string> = {
  core:     '必修編',
  practice: '実践編(人事マネジメント)',
  ikusei:   '育成就労編',
  agency:   '支援機関編',
}
export interface QuizAttempt {
  score: number; passed: boolean; answeredAt: Date; questions: string[]
}
export interface ModuleProgress {
  videoWatched: boolean; bookReadPercent: number; bookCompleted: boolean
  quizAttempts: QuizAttempt[]; passed: boolean; passedAt?: Date
}
export interface QuizQuestion {
  id: string; text: string; options: string[]; correctIndex: number; explanation: string
}
export interface QuizBank { moduleId: string; title: string; questions: QuizQuestion[] }
export type Edition = 'core' | 'practice' | 'ikusei' | 'agency'
export interface Module {
  id: string; title: string; bookChapter: string; youtubeTag: string
  audience?: 'learner' | 'admin'
  /** 表示する編。未指定なら audience から判定(未指定=必修編 / 'admin'=実践編) */
  edition?: Edition
}

export const MODULES: Module[] = [
  { id:'M1',  title:'外国人雇用の基本と心構え',         bookChapter:'第3章',                 youtubeTag:'【M1】' },
  { id:'M2',  title:'外国人材受け入れ企業の課題分析',   bookChapter:'第2章',                 youtubeTag:'【M2】' },
  { id:'M3',  title:'在留資格の基礎知識',               bookChapter:'第5章（前半）',         youtubeTag:'【M3】' },
  { id:'M4',  title:'在留資格の変更フロー',             bookChapter:'第5章（後半）',         youtubeTag:'【M4】' },
  { id:'M5',  title:'海外からの採用手続き',             bookChapter:'第6章（前半）',         youtubeTag:'【M5】' },
  { id:'M6',  title:'採用活動（募集・面接・内定）',     bookChapter:'第6章（後半）',         youtubeTag:'【M6】' },
  { id:'M7',  title:'入社手続きと社会保険',             bookChapter:'第7章（前半）',         youtubeTag:'【M7】' },
  { id:'M8',  title:'労務管理の基本',                   bookChapter:'第7章（後半）',         youtubeTag:'【M8】' },
  { id:'M9',  title:'定着と教育体制',                   bookChapter:'第8章（前半）',         youtubeTag:'【M9】' },
  { id:'M10', title:'面談と指導記録',                   bookChapter:'第8章（後半）',         youtubeTag:'【M10】' },
  { id:'M11', title:'トラブル対応と問題解決',           bookChapter:'第1章・第10章（前半）', youtubeTag:'【M11】' },
  { id:'M12', title:'問題社員への対応',                 bookChapter:'第10章（後半）',        youtubeTag:'【M12】' },
  { id:'M13', title:'退職・解雇の手続き',               bookChapter:'第9章',                 youtubeTag:'【M13】' },
  { id:'M14', title:'労災保険と福利厚生',               bookChapter:'第4章',                 youtubeTag:'【M14】' },
  // ===== 人事・管理者向けコース（audience:'admin' は admin ロールのみ表示） =====
  { id:'M15', title:'受け入れ準備と初期定着（入社前後30日）', bookChapter:'管理者向け・定着支援', youtubeTag:'【M15】', audience:'admin' },
  { id:'M16', title:'職場コミュニケーションとやさしい日本語', bookChapter:'管理者向け・定着支援', youtubeTag:'【M16】', audience:'admin' },
  { id:'M17', title:'生活支援の実務',                         bookChapter:'管理者向け・定着支援', youtubeTag:'【M17】', audience:'admin' },
  { id:'M18', title:'キャリアパスと評価・処遇',               bookChapter:'管理者向け・定着支援', youtubeTag:'【M18】', audience:'admin' },
  { id:'M19', title:'離職予防とトラブルの早期発見',           bookChapter:'管理者向け・定着支援', youtubeTag:'【M19】', audience:'admin' },
  { id:'M20', title:'在留資格の基礎と更新実務',               bookChapter:'管理者向け・法務労務', youtubeTag:'【M20】', audience:'admin' },
  { id:'M21', title:'雇用契約と労働条件',                     bookChapter:'管理者向け・法務労務', youtubeTag:'【M21】', audience:'admin' },
  { id:'M22', title:'社会保険・税務の実務',                   bookChapter:'管理者向け・法務労務', youtubeTag:'【M22】', audience:'admin' },
  { id:'M23', title:'育成就労制度への移行対応',               bookChapter:'管理者向け・法務労務', youtubeTag:'【M23】', audience:'admin' },
  { id:'M24', title:'コンプライアンスとトラブル対応',         bookChapter:'管理者向け・法務労務', youtubeTag:'【M24】', audience:'admin' },
  // ===== 育成就労編(M25〜M29・audience:'admin' は admin ロールのみ表示) =====
  { id:'M25', title:'育成就労の全体像と経過措置',             bookChapter:'育成就労編', youtubeTag:'【M25】', audience:'admin', edition:'ikusei' },
  { id:'M26', title:'本人意向転籍のルールと定着設計',         bookChapter:'育成就労編', youtubeTag:'【M26】', audience:'admin', edition:'ikusei' },
  { id:'M27', title:'育成就労計画の作成と認定申請',           bookChapter:'育成就労編', youtubeTag:'【M27】', audience:'admin', edition:'ikusei' },
  { id:'M28', title:'監理支援機関の選び方と付き合い方',       bookChapter:'育成就労編', youtubeTag:'【M28】', audience:'admin', edition:'ikusei' },
  { id:'M29', title:'育成就労から特定技能1号への移行',        bookChapter:'育成就労編', youtubeTag:'【M29】', audience:'admin', edition:'ikusei' },
  // ===== 支援機関編(M30〜M34・支援機関向けプランの会社にのみ表示) =====
  { id:'M30', title:'登録支援機関の支援義務10項目',           bookChapter:'支援機関編', youtubeTag:'【M30】', audience:'admin', edition:'agency' },
  { id:'M31', title:'監理支援機関の許可要件と体制',           bookChapter:'支援機関編', youtubeTag:'【M31】', audience:'admin', edition:'agency' },
  { id:'M32', title:'監査・訪問指導の実務',                   bookChapter:'支援機関編', youtubeTag:'【M32】', audience:'admin', edition:'agency' },
  { id:'M33', title:'受け入れ企業への指導と初動',             bookChapter:'支援機関編', youtubeTag:'【M33】', audience:'admin', edition:'agency' },
  { id:'M34', title:'機構への届出・報告と情報公開',           bookChapter:'支援機関編', youtubeTag:'【M34】', audience:'admin', edition:'agency' },
]
