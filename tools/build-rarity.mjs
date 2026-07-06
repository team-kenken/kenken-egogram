/* ============================================================
   クラス別出現確率の厳密計算 → js/rarity-table.js を生成する開発用スクリプト
   実行: node tools/build-rarity.mjs

   モデル: 各質問の回答 {0,1,2,3} が等確率と仮定すると、1尺度（10問）の
   スコア分布は多項式 ((1 + x + x^2 + x^3) / 4)^10 の係数として厳密に求まる。
   5尺度は独立なので、任意のスコア組の確率は5つの積。
   全 31^5 = 28,629,151 通りを classify に通して確率重みを積算する。
   ============================================================ */
import { createRequire } from 'node:module';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const require = createRequire(import.meta.url);
const TACore = require('../js/core.js');

/* 1尺度のスコア分布 pmf[0..30]（厳密値、合計1） */
let pmf = [1];
for (let q = 0; q < 10; q++) {
  const next = new Array(pmf.length + 3).fill(0);
  for (let i = 0; i < pmf.length; i++) {
    for (let v = 0; v <= 3; v++) next[i + v] += pmf[i] / 4;
  }
  pmf = next;
}

/* 全組み合わせに確率重みを掛けてクラス別に積算 */
const probs = new Array(25).fill(0);
const scores = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
for (let cp = 0; cp <= 30; cp++) {
  scores.CP = cp; const pCp = pmf[cp];
  for (let np = 0; np <= 30; np++) {
    scores.NP = np; const pNp = pCp * pmf[np];
    for (let a = 0; a <= 30; a++) {
      scores.A = a; const pA = pNp * pmf[a];
      for (let fc = 0; fc <= 30; fc++) {
        scores.FC = fc; const pFc = pA * pmf[fc];
        for (let ac = 0; ac <= 30; ac++) {
          scores.AC = ac;
          probs[TACore.classify(scores).id] += pFc * pmf[ac];
        }
      }
    }
  }
}

const total = probs.reduce((s, p) => s + p, 0);
console.log(`確率合計 = ${total}（1との差 ${Math.abs(1 - total).toExponential(2)}）`);

/* レアリティ帯: 出現確率が低いほど希少 */
const TIERS = [
  { label: 'LEGENDARY', below: 0.007 },
  { label: 'EPIC',      below: 0.02 },
  { label: 'RARE',      below: 0.05 },
  { label: 'COMMON',    below: Infinity }
];
function tierOf(p) {
  for (const t of TIERS) if (p < t.below) return t.label;
  return 'COMMON';
}

const rows = TACore.CLASSES.map(c => ({
  id: c.id,
  name: c.name,
  probability: probs[c.id],
  rarity: tierOf(probs[c.id])
}));

rows.slice().sort((a, b) => a.probability - b.probability).forEach(r => {
  console.log(`  ${r.rarity.padEnd(9)} id ${String(r.id).padStart(2)} ${r.name.padEnd(11)} ${(r.probability * 100).toFixed(3)}%`);
});

const body = rows.map(r =>
  `  ${r.id}: { name: '${r.name}', probability: ${r.probability.toPrecision(10)}, rarity: '${r.rarity}' }`
).join(',\n');

const out = `/* ============================================================
   TA_RARITY — クラス別出現確率とレアリティ（自動生成・手編集禁止）
   生成: node tools/build-rarity.mjs
   モデル: 回答一様（各0〜3が等確率）での厳密確率
   帯: <0.7% LEGENDARY / <2% EPIC / <5% RARE / それ以上 COMMON
   ============================================================ */
(function (global) {
'use strict';

const TA_RARITY = {
  byClassId: {
${body}
  }
};

global.TA_RARITY = TA_RARITY;
if (typeof module !== 'undefined' && module.exports) module.exports = TA_RARITY;

})(typeof globalThis !== 'undefined' ? globalThis : this);
`;

const dest = join(dirname(fileURLToPath(import.meta.url)), '..', 'js', 'rarity-table.js');
writeFileSync(dest, out, 'utf8');
console.log(`書き出し完了: ${dest}`);
