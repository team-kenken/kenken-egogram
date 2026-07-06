'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TACore = require('../js/core.js');

const { calculateScores, QUESTIONS, SCALES } = TACore;

test('全問3点 → 全尺度30点', () => {
  const scores = calculateScores(new Array(50).fill(3));
  for (const s of SCALES) assert.equal(scores[s], 30);
});

test('全問0点 → 全尺度0点', () => {
  const scores = calculateScores(new Array(50).fill(0));
  for (const s of SCALES) assert.equal(scores[s], 0);
});

test('全問未回答（null） → 全尺度0点', () => {
  const scores = calculateScores(new Array(50).fill(null));
  for (const s of SCALES) assert.equal(scores[s], 0);
});

test('1問だけ回答 → 対応する尺度のみ加点', () => {
  for (let i = 0; i < 50; i++) {
    const answers = new Array(50).fill(null);
    answers[i] = 2;
    const scores = calculateScores(answers);
    for (const s of SCALES) {
      assert.equal(scores[s], s === QUESTIONS[i].scale ? 2 : 0,
        `Q${i + 1}(${QUESTIONS[i].scale}) に2点回答したとき ${s} の値が不正`);
    }
  }
});

test('特定尺度の10問だけ満点 → その尺度のみ30点', () => {
  for (const scale of SCALES) {
    const answers = QUESTIONS.map(q => (q.scale === scale ? 3 : 0));
    const scores = calculateScores(answers);
    for (const s of SCALES) assert.equal(scores[s], s === scale ? 30 : 0);
  }
});

test('null混在でも回答済みの分だけ正しく加算', () => {
  // Q1(A)=3, Q2(FC)=1, 残りnull
  const answers = new Array(50).fill(null);
  answers[0] = 3;
  answers[1] = 1;
  const scores = calculateScores(answers);
  assert.deepEqual(scores, { CP: 0, NP: 0, A: 3, FC: 1, AC: 0 });
});

test('不正値（範囲外・非整数・文字列）は加算されない', () => {
  const answers = new Array(50).fill(null);
  answers[0] = 4;      // 範囲外
  answers[1] = -1;     // 範囲外
  answers[2] = 1.5;    // 非整数
  answers[3] = '3';    // 文字列
  const scores = calculateScores(answers);
  assert.deepEqual(scores, { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 });
});

test('尺度レベル判定の境界（高≥18 / 中13〜17 / 低≤12）', () => {
  assert.equal(TACore.scaleLevel(30), 'high');
  assert.equal(TACore.scaleLevel(18), 'high');
  assert.equal(TACore.scaleLevel(17), 'mid');
  assert.equal(TACore.scaleLevel(13), 'mid');
  assert.equal(TACore.scaleLevel(12), 'low');
  assert.equal(TACore.scaleLevel(0), 'low');
});
