'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TACore = require('../js/core.js');

const { averageScores, SCALES } = TACore;

test('1人の平均は本人のスコアと同じ', () => {
  const s = { CP: 17, NP: 21, A: 14, FC: 25, AC: 9 };
  assert.deepEqual(averageScores([s]), s);
});

test('全30点と全0点の2人 → 全尺度15', () => {
  const avg = averageScores([
    { CP: 30, NP: 30, A: 30, FC: 30, AC: 30 },
    { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 }
  ]);
  for (const sc of SCALES) assert.equal(avg[sc], 15);
});

test('3人の平均（10/20/30 → 20）', () => {
  const mk = v => ({ CP: v, NP: v, A: v, FC: v, AC: v });
  const avg = averageScores([mk(10), mk(20), mk(30)]);
  for (const sc of SCALES) assert.equal(avg[sc], 20);
});

test('割り切れない平均も正確（15と16 → 15.5）', () => {
  const avg = averageScores([
    { CP: 15, NP: 0, A: 30, FC: 1, AC: 2 },
    { CP: 16, NP: 1, A: 29, FC: 2, AC: 3 }
  ]);
  assert.equal(avg.CP, 15.5);
  assert.equal(avg.NP, 0.5);
  assert.equal(avg.A, 29.5);
  assert.equal(avg.FC, 1.5);
  assert.equal(avg.AC, 2.5);
});

test('尺度ごとに独立して平均される（混合ケース）', () => {
  const avg = averageScores([
    { CP: 30, NP: 0, A: 10, FC: 20, AC: 5 },
    { CP: 0, NP: 30, A: 20, FC: 10, AC: 25 }
  ]);
  assert.deepEqual(avg, { CP: 15, NP: 15, A: 15, FC: 15, AC: 15 });
});

test('空配列・不正入力は全尺度0', () => {
  assert.deepEqual(averageScores([]), { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 });
  assert.deepEqual(averageScores(null), { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 });
});
