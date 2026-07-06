/* ============================================================
   TA_RARITY — クラス別出現確率とレアリティ（自動生成・手編集禁止）
   生成: node tools/build-rarity.mjs
   モデル: 回答一様（各0〜3が等確率）での厳密確率
   帯: <0.7% LEGENDARY / <2% EPIC / <5% RARE / それ以上 COMMON
   ============================================================ */
(function (global) {
'use strict';

const TA_RARITY = {
  byClassId: {
  0: { name: 'BALANCER', probability: 0.1906183242, rarity: 'COMMON' },
  1: { name: 'FIGHTER', probability: 0.007979948515, rarity: 'EPIC' },
  2: { name: 'DRIFTER', probability: 0.005320760974, rarity: 'LEGENDARY' },
  3: { name: 'ANALYST', probability: 0.09534969665, rarity: 'COMMON' },
  4: { name: 'SUPPORTER', probability: 0.03701436867, rarity: 'RARE' },
  5: { name: 'MEDIATOR', probability: 0.06394937347, rarity: 'COMMON' },
  6: { name: 'SOLVER', probability: 0.03731760436, rarity: 'RARE' },
  7: { name: 'STRUGGLER', probability: 0.005414577974, rarity: 'LEGENDARY' },
  8: { name: 'NARCISSIST', probability: 0.05866052152, rarity: 'COMMON' },
  9: { name: 'HARMONIZER', probability: 0.01810937423, rarity: 'EPIC' },
  10: { name: 'SOFTHEART', probability: 0.007467333674, rarity: 'EPIC' },
  11: { name: 'CARETAKER', probability: 0.02964094912, rarity: 'RARE' },
  12: { name: 'CARRIER', probability: 0.04460878515, rarity: 'RARE' },
  13: { name: 'GUARDIAN', probability: 0.07804376238, rarity: 'COMMON' },
  14: { name: 'OBSERVER', probability: 0.02844016560, rarity: 'RARE' },
  15: { name: 'DOUBTER', probability: 0.04826633172, rarity: 'RARE' },
  16: { name: 'WILDCAT', probability: 0.03526354477, rarity: 'RARE' },
  17: { name: 'WANDERER', probability: 0.03063056189, rarity: 'RARE' },
  18: { name: 'IDEALIST', probability: 0.01409862712, rarity: 'EPIC' },
  19: { name: 'LEADER', probability: 0.02161280328, rarity: 'RARE' },
  20: { name: 'DEPENDER', probability: 0.04585236597, rarity: 'RARE' },
  21: { name: 'CHEERFUL', probability: 0.02195917742, rarity: 'RARE' },
  22: { name: 'EXECUTOR', probability: 0.006291464579, rarity: 'LEGENDARY' },
  23: { name: 'GENTLEMAN', probability: 0.03457372991, rarity: 'RARE' },
  24: { name: 'BLAZE', probability: 0.03351584682, rarity: 'RARE' }
  }
};

global.TA_RARITY = TA_RARITY;
if (typeof module !== 'undefined' && module.exports) module.exports = TA_RARITY;

})(typeof globalThis !== 'undefined' ? globalThis : this);
