'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TACore = require('../js/core.js');

const { classify, CLASSES } = TACore;

/* ------------------------------------------------------------
   網羅テスト: 各尺度 0〜30 の全組み合わせ 31^5 = 28,629,151 通り。
   環境変数 EGOGRAM_STEP を設定すると刻み幅を粗くできる（既定 1 = 全数）。
   ------------------------------------------------------------ */
const STEP = Math.max(1, parseInt(process.env.EGOGRAM_STEP || '1', 10));

test(`全スコア組み合わせで必ず id 0〜24 のクラスに確定する（刻み ${STEP}）`, () => {
  const reached = new Set();
  const counts = new Array(25).fill(0);
  let fallback = 0;
  let total = 0;
  const scores = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };

  for (let cp = 0; cp <= 30; cp += STEP) {
    scores.CP = cp;
    for (let np = 0; np <= 30; np += STEP) {
      scores.NP = np;
      for (let a = 0; a <= 30; a += STEP) {
        scores.A = a;
        for (let fc = 0; fc <= 30; fc += STEP) {
          scores.FC = fc;
          for (let ac = 0; ac <= 30; ac += STEP) {
            scores.AC = ac;
            const c = classify(scores);
            total++;
            if (c.id >= 0 && c.id <= 24) {
              reached.add(c.id);
              counts[c.id]++;
            } else {
              fallback++;
            }
          }
        }
      }
    }
  }

  // 分布レポート（診断用に常に出力）
  const dist = CLASSES.map(c =>
    `  id ${String(c.id).padStart(2)} ${c.name.padEnd(11)} ${(counts[c.id] / total * 100).toFixed(3)}%`
  ).join('\n');
  console.log(`\n[classify 分布] 総数 ${total} / フォールバック ${fallback} (${(fallback / total * 100).toFixed(3)}%)\n${dist}`);

  assert.equal(fallback, 0,
    `フォールバック（未分類）に ${fallback} 件到達。全スコアが必ず1クラスに確定しなければならない`);

  const missing = CLASSES.filter(c => !reached.has(c.id)).map(c => `${c.id}:${c.name}`);
  assert.deepEqual(missing, [],
    `到達不能なクラスがある: ${missing.join(', ')}`);
});

test('判定は決定的（同じ入力には常に同じクラス）', () => {
  let seed = 12345;
  const rand = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) % 31;
  for (let i = 0; i < 2000; i++) {
    const s = { CP: rand(), NP: rand(), A: rand(), FC: rand(), AC: rand() };
    const a = classify(s);
    const b = classify({ ...s });
    assert.equal(a.id, b.id, `入力 ${JSON.stringify(s)} で結果が揺れた`);
  }
});

/* ------------------------------------------------------------
   ゴールデンケース: 修理後の判定仕様（統一閾値 高≥18 / 低≤12、
   特異度順マッチ、プロトタイプ距離割当、top同点はCP>NP>A>FC>AC優先）
   ------------------------------------------------------------ */
const GOLDEN = [
  { scores: { CP: 15, NP: 15, A: 15, FC: 15, AC: 15 }, id: 0,  name: 'BALANCER',  why: '全尺度同点（range 0 ≤ 5）' },
  { scores: { CP: 30, NP: 30, A: 30, FC: 30, AC: 30 }, id: 0,  name: 'BALANCER',  why: '全部満点でも range 0' },
  { scores: { CP: 30, NP: 0,  A: 0,  FC: 0,  AC: 0  }, id: 13, name: 'GUARDIAN',  why: '高CP × 低NP' },
  { scores: { CP: 24, NP: 10, A: 22, FC: 14, AC: 8  }, id: 1,  name: 'FIGHTER',   why: '高CP × 高A × 低AC' },
  { scores: { CP: 24, NP: 8,  A: 22, FC: 14, AC: 16 }, id: 22, name: 'EXECUTOR',  why: '高CP × 高A × 低NP（旧ロジックでは到達不能だった）' },
  { scores: { CP: 8,  NP: 24, A: 14, FC: 12, AC: 20 }, id: 10, name: 'SOFTHEART', why: '高NP × 高AC × 低CP（旧ロジックでは到達不能だった）' },
  { scores: { CP: 14, NP: 8,  A: 24, FC: 10, AC: 13 }, id: 14, name: 'OBSERVER',  why: '高A × 低NP × 低FC（旧ロジックでは到達不能だった）' },
  { scores: { CP: 10, NP: 12, A: 8,  FC: 6,  AC: 22 }, id: 18, name: 'IDEALIST',  why: '高AC × 低FC × 低A（旧ロジックでは到達不能だった）' },
  { scores: { CP: 0,  NP: 0,  A: 14, FC: 12, AC: 16 }, id: 15, name: 'DOUBTER',   why: '旧ロジックではフォールバックに落ちていた実例' },
  { scores: { CP: 20, NP: 15, A: 15, FC: 15, AC: 14 }, id: 24, name: 'BLAZE',     why: 'ルール外 → プロトタイプ距離割当で最近傍のBLAZE' }
];

for (const g of GOLDEN) {
  test(`ゴールデン: ${JSON.stringify(g.scores)} → ${g.name}（${g.why}）`, () => {
    const c = classify(g.scores);
    assert.equal(c.id, g.id, `期待 ${g.name}(${g.id}) だが ${c.name}(${c.id}) になった`);
  });
}
