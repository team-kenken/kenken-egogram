'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const TACore = require('../js/core.js');
const TA_RARITY = require('../js/rarity-table.js');

const VALID = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY'];
/* tools/build-rarity.mjs の帯定義と一致していること */
const TIERS = [
  { label: 'LEGENDARY', below: 0.007 },
  { label: 'EPIC',      below: 0.02 },
  { label: 'RARE',      below: 0.05 },
  { label: 'COMMON',    below: Infinity }
];

test('25クラス全てにレアリティが定義されている', () => {
  for (const c of TACore.CLASSES) {
    const r = TA_RARITY.byClassId[c.id];
    assert.ok(r, `id ${c.id} (${c.name}) のレアリティが未定義`);
    assert.equal(r.name, c.name, `id ${c.id} のクラス名がcore.jsとズレている（テーブル再生成が必要）`);
    assert.ok(VALID.includes(r.rarity), `id ${c.id} のレアリティ '${r.rarity}' が不正`);
  }
});

test('出現確率の合計はほぼ1（厳密計算の検算）', () => {
  const sum = Object.values(TA_RARITY.byClassId).reduce((s, r) => s + r.probability, 0);
  assert.ok(Math.abs(sum - 1) < 1e-9, `確率合計が ${sum}`);
});

test('確率とレアリティ帯が整合している', () => {
  for (const r of Object.values(TA_RARITY.byClassId)) {
    const expected = TIERS.find(t => r.probability < t.below).label;
    assert.equal(r.rarity, expected,
      `${r.name}: 確率 ${(r.probability * 100).toFixed(3)}% は ${expected} のはずが ${r.rarity}`);
  }
});

test('確率は全クラス正の値（到達不能クラスがない）', () => {
  for (const r of Object.values(TA_RARITY.byClassId)) {
    assert.ok(r.probability > 0, `${r.name} の出現確率が0`);
  }
});
