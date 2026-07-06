'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TACore = require('../js/core.js');

/* 原典PDF「01TA診断１」から確定した質問番号→尺度の対応表。
   このテーブルはPDFと目視照合済みの正本。core.js 側を変更してもここは変えないこと。 */
const PDF_SCALE_MAP = {
  CP: [3, 5, 10, 14, 20, 23, 27, 29, 39, 44],
  NP: [6, 7, 12, 17, 24, 42, 43, 46, 48, 50],
  A:  [1, 8, 15, 19, 21, 33, 36, 40, 41, 49],
  FC: [2, 9, 22, 28, 32, 34, 37, 38, 45, 47],
  AC: [4, 11, 13, 16, 18, 25, 26, 30, 31, 35]
};

test('質問は50問である', () => {
  assert.equal(TACore.QUESTIONS.length, 50);
});

test('質問idは1〜50で重複がない', () => {
  const ids = TACore.QUESTIONS.map(q => q.id).sort((a, b) => a - b);
  assert.deepEqual(ids, Array.from({ length: 50 }, (_, i) => i + 1));
});

test('質問は id 順に並んでいる（回答配列のindexとidがズレない）', () => {
  TACore.QUESTIONS.forEach((q, i) => assert.equal(q.id, i + 1));
});

test('全50問の尺度対応がPDF原典と一致する', () => {
  for (const [scale, ids] of Object.entries(PDF_SCALE_MAP)) {
    for (const id of ids) {
      const q = TACore.QUESTIONS.find(x => x.id === id);
      assert.equal(q.scale, scale, `Q${id} はPDFでは ${scale} だが core.js では ${q.scale}`);
    }
  }
});

test('各尺度ちょうど10問ずつ', () => {
  for (const scale of TACore.SCALES) {
    const n = TACore.QUESTIONS.filter(q => q.scale === scale).length;
    assert.equal(n, 10, `${scale} が ${n} 問`);
  }
});

test('回答選択肢は 3/2/1/0 の4段階（PDF配点と一致）', () => {
  assert.deepEqual(TACore.ANSWER_OPTIONS.map(o => o.value), [3, 2, 1, 0]);
  assert.equal(TACore.MAX_SCALE_SCORE, 30);
});
