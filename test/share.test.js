'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TACore = require('../js/core.js');

const { encodeShare, decodeShare, SCALES } = TACore;

test('エンコード→デコードで元のスコアに戻る（往復）', () => {
  const cases = [
    { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 },
    { CP: 30, NP: 30, A: 30, FC: 30, AC: 30 },
    { CP: 17, NP: 21, A: 14, FC: 25, AC: 9 },
    { CP: 1, NP: 0, A: 30, FC: 2, AC: 29 }
  ];
  for (const scores of cases) {
    assert.deepEqual(decodeShare('#' + encodeShare(scores)), scores);
    assert.deepEqual(decodeShare(encodeShare(scores)), scores); // #なしでも可
  }
});

test('不正なハッシュは null（例外を投げない）', () => {
  const bad = [
    '', null, undefined,
    '#r=1&s=1.2.3.4',        // 4値しかない
    '#r=1&s=1.2.3.4.5.6',    // 6値ある
    '#r=1&s=31.0.0.0.0',     // 範囲外（31）
    '#r=1&s=99.99.99.99.99', // 範囲外
    '#r=1&s=-1.0.0.0.0',     // 負数
    '#r=1&s=a.b.c.d.e',      // 数字でない
    '#r=2&s=1.2.3.4.5',      // 未知のバージョン
    '#foo=bar',
    '#r=1&s=1.2.3.4.5extra'
  ];
  for (const h of bad) {
    assert.equal(decodeShare(h), null, `'${h}' が null にならなかった`);
  }
});

test('境界値 0 と 30 を正しく受け付ける', () => {
  const scores = decodeShare('#r=1&s=0.30.0.30.15');
  assert.deepEqual(scores, { CP: 0, NP: 30, A: 0, FC: 30, AC: 15 });
  for (const s of SCALES) assert.ok(scores[s] >= 0 && scores[s] <= 30);
});
