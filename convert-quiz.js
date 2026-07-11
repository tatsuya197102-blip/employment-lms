const fs = require("fs");
const os = require("os");
const path = require("path");

const pkg = path.join(os.homedir(), "Desktop", "M15-M24_package");
const bankPath = "quiz_bank_all.json";
const bank = JSON.parse(fs.readFileSync(bankPath, "utf8"));

const titles = {
  M15:"受け入れ準備と初期定着（入社前後30日）", M16:"職場コミュニケーションとやさしい日本語",
  M17:"生活支援の実務", M18:"キャリアパスと評価・処遇", M19:"離職予防とトラブルの早期発見",
  M20:"在留資格の基礎と更新実務", M21:"雇用契約と労働条件", M22:"社会保険・税務の実務",
  M23:"育成就労制度への移行対応", M24:"コンプライアンスとトラブル対応"
};
const letters = ["A","B","C","D"];
const files = ["M15_quiz_draft.json","M16-M19_quiz_draft.json","M20-M24_quiz_draft.json"];

let added = [];
for (const f of files) {
  const d = JSON.parse(fs.readFileSync(path.join(pkg, f), "utf8"));
  // M15形式 {moduleId, questions} と M16-M19形式 {M16:[...], ...} の両対応
  const mods = d.questions ? { [d.moduleId]: d.questions }
    : Object.fromEntries(Object.entries(d).filter(([k]) => /^M\d+$/.test(k)));
  for (const [mid, qs] of Object.entries(mods)) {
    if (bank[mid]) { console.log(`SKIP ${mid}（既に存在）`); continue; }
    bank[mid] = {
      moduleId: mid,
      title: titles[mid] || mid,
      questions: qs.map((q, i) => {
        const out = {
          id: `${mid}_Q${String(i + 1).padStart(2, "0")}`,
          text: q.question,
          options: q.choices.map((c, j) => `${letters[j]}. ${c}`),
          correctIndex: q.answerIndex,
          explanation: q.explanation
        };
        if (q.reviewYear) out.reviewYear = q.reviewYear;
        return out;
      })
    };
    added.push(`${mid}(${qs.length}問)`);
  }
}
fs.writeFileSync(bankPath, JSON.stringify(bank, null, 2), "utf8");
console.log("追加:", added.join(", "));
console.log("総モジュール数:", Object.keys(bank).length);
