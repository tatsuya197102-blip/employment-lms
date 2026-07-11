// src/types/lms.ts
export type UserRole = 'admin' | 'learner'

export interface LmsUser {
  email: string; displayName: string; role: UserRole; companyId: string
  invitedAt: Date; lastLoginAt?: Date; completed?: boolean; completedAt?: Date
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
export interface Module { id: string; title: string; bookChapter: string; youtubeTag: string; audience?: 'learner' | 'admin' }

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
]
