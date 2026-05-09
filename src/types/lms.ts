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
export interface Module { id: string; title: string; bookChapter: string; youtubeTag: string }

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
]
