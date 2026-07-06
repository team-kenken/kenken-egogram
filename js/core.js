/* ============================================================
   TACore — TA診断 計算コア（ブラウザ / Node 両用）
   ブラウザ: <script src="js/core.js"></script> → globalThis.TACore
   Node:     const TACore = require('./js/core.js')
   ※ このファイルは診断の正確性の心臓部。変更時は必ず `node --test test/` を実行すること。
   ============================================================ */
(function (global) {
'use strict';

const SCALES = ['CP', 'NP', 'A', 'FC', 'AC'];

/* 質問→尺度の対応は原典PDF（01TA診断１）と全50問一致していること。
   test/questions.test.js が対応表をハードコードして照合する。 */
const QUESTIONS = [
  { id:1,  text:'何でも、何が問題の中心なのかを考え直す。', scale:'A'  },
  { id:2,  text:'やってみたいことが、いっぱいある。',         scale:'FC' },
  { id:3,  text:'間違ったことに対して、間違いだと言う。',     scale:'CP' },
  { id:4,  text:'人の気持ちが気になって、つい合わせてしまう。', scale:'AC' },
  { id:5,  text:'時間を守らないことは嫌だ。',                   scale:'CP' },
  { id:6,  text:'思いやりがあるほうだ。',                       scale:'NP' },
  { id:7,  text:'人をほめるのが上手だ。',                       scale:'NP' },
  { id:8,  text:'物事を分析して、事実に基づいて考える。',       scale:'A'  },
  { id:9,  text:'気分転換が上手だ。',                           scale:'FC' },
  { id:10, text:'規則やルールを守る。',                       scale:'CP' },
  { id:11, text:'人前に出るよりは、後ろに引っ込んでしまう。', scale:'AC' },
  { id:12, text:'人の話をよく聞いてあげる。',                   scale:'NP' },
  { id:13, text:'よく後悔して、クヨクヨする。',                 scale:'AC' },
  { id:14, text:'他人も自分もとがめる。',                       scale:'CP' },
  { id:15, text:'「なぜ」そうなのか、理由を検討する。',         scale:'A'  },
  { id:16, text:'相手の顔色をうかがう。',                     scale:'AC' },
  { id:17, text:'人の気持ちを考える。',                         scale:'NP' },
  { id:18, text:'不愉快なことがあっても口に出さず、押さえてしまう。', scale:'AC' },
  { id:19, text:'情緒的というより、理論的だ。',                 scale:'A'  },
  { id:20, text:'「〜すべきである」「〜ねばならない」と思う。', scale:'CP' },
  { id:21, text:'ニュースなど社会のことに関心がある。',             scale:'A'  },
  { id:22, text:'よく笑うほうだ。',                             scale:'FC' },
  { id:23, text:'決めたことは最後まで守らないと、気がすまない。', scale:'CP' },
  { id:24, text:'ちょっとした贈り物でもしたいほうだ。',         scale:'NP' },
  { id:25, text:'人によく思われるよう、振る舞う。',           scale:'AC' },
  { id:26, text:'協調性がある。',                             scale:'AC' },
  { id:27, text:'借りたものや約束した期限を守らないと気になる。', scale:'CP' },
  { id:28, text:'好奇心が強いほうだ。',                         scale:'FC' },
  { id:29, text:'約束を破ることは、ない。',                 scale:'CP' },
  { id:30, text:'遠慮しがちだ。',                               scale:'AC' },
  { id:31, text:'周囲の人の意見に振り回される。',               scale:'AC' },
  { id:32, text:'物事を明るく考える。',                         scale:'FC' },
  { id:33, text:'結末を予想して、準備をする。',                 scale:'A'  },
  { id:34, text:'茶目っ気がある。',                           scale:'FC' },
  { id:35, text:'自分が悪くもないのに、謝ってしまう。',       scale:'AC' },
  { id:36, text:'物事を冷静に判断する。',                       scale:'A'  },
  { id:37, text:'新しいことが好きだ。',                         scale:'FC' },
  { id:38, text:'将来の夢や、楽しいことを空想するのが好きだ。', scale:'FC' },
  { id:39, text:'不正なことには妥協しない。',                   scale:'CP' },
  { id:40, text:'わからない時には、わかるまで追求する。',       scale:'A'  },
  { id:41, text:'予定や計画を記録する。',                 scale:'A'  },
  { id:42, text:'人の失敗には寛大だ。',                         scale:'NP' },
  { id:43, text:'世話好きだ。',                                 scale:'NP' },
  { id:44, text:'無責任な人をみると許せない。',                 scale:'CP' },
  { id:45, text:'趣味が豊富だ。',                               scale:'FC' },
  { id:46, text:'自分から温かくあいさつする。',                 scale:'NP' },
  { id:47, text:'「すごい」「わぁー」「へぇー」などの感嘆詞を使う。', scale:'FC' },
  { id:48, text:'困っている人を見ると、何とかしてあげたいと行動する。', scale:'NP' },
  { id:49, text:'他の人ならどうするだろうかと、客観視する。',   scale:'A'  },
  { id:50, text:'年下や仲間を、気にかけて世話する。',             scale:'NP' }
];

/* 配点は原典PDF: その通り/いつも=3、まあまあ/ときどき=2、たまには=1、いいえ/めったにない=0 */
const ANSWER_OPTIONS = [
  { value: 3, label: 'YES',     sub: 'いつも・はっきり当てはまる' },
  { value: 2, label: 'OFTEN',   sub: 'まあまあ・ときどき' },
  { value: 1, label: 'RARE',    sub: 'たまに・少し' },
  { value: 0, label: 'NO',      sub: 'めったにない・全然' }
];

const MAX_SCALE_SCORE = 30; // 3点 × 10問

const CLASSES = [
  {
    id: 0, name: 'BALANCER', jp: 'バランサー', sub: '安定型',
    formula: '5尺度すべてが均等',
    desc: '5つの自我状態がいずれも極端でなく、状況に応じて使い分けられる安定した姿。「どの場面でも崩れない」万能型。意識的に強みを作っていくと魅力が際立つ。',
    skills: { strong: ['ALL ROUND', 'STABLE'], grow: ['SIGNATURE MOVE', 'EDGE'] },
    match: (s) => (Math.max(...Object.values(s)) - Math.min(...Object.values(s))) <= 5
  },
  {
    id: 1, name: 'FIGHTER', jp: '目標指向ファイター', sub: 'ストライカー型',
    formula: '高CP × 高A × 低AC',
    desc: '高い理想と冷静な分析力。決めたらまっすぐ進む実行力。情への配慮が伸びしろ。試合本番でこそ力を発揮するタイプ。',
    skills: { strong: ['DECISION SPEED', 'PLAN & EXECUTE'], grow: ['EMPATHY RANGE', 'FLOW RELEASE'] },
    match: (s,t,b) => t === 'CP' && s.A >= 20 && (b === 'NP' || b === 'AC')
  },
  {
    id: 2, name: 'DRIFTER', jp: 'サッパリドリフター', sub: 'やぶ蛇注意型',
    formula: '高FC × 高A × 低AC/NP',
    desc: '明るく合理的でサッパリした人柄。直感と論理の両方を持つ。相手の感情を置き去りにしやすいので、配慮の一押しで関係性が一気に深まる。',
    skills: { strong: ['INSTINCT', 'LOGIC'], grow: ['EMPATHY', 'ATTUNEMENT'] },
    match: (s,t,b) => t === 'FC' && s.A >= 20 && (b === 'AC' || b === 'NP')
  },
  {
    id: 3, name: 'ANALYST', jp: '理論派アナリスト', sub: 'データ重視型',
    formula: '高A × 低NP',
    desc: '冷静で論理的。事実とデータを重視し、合理的な判断ができる。感情を扱うのが苦手なので、人を動かす場面では「気持ち」への目配りを意識的に。',
    skills: { strong: ['DATA SENSE', 'RATIONAL'], grow: ['HEART READ', 'WARMTH'] },
    match: (s,t,b) => t === 'A' && s.NP <= 12
  },
  {
    id: 4, name: 'SUPPORTER', jp: '縁の下サポーター', sub: 'ボランティア型',
    formula: '高NP × 高AC',
    desc: '人を支えることに喜びを感じ、協調性も高い縁の下の力持ち。自己犠牲になりやすいので、自分の楽しみを意識的に確保する。',
    skills: { strong: ['CARE', 'TEAM PLAY'], grow: ['SELF JOY', 'BOUNDARY'] },
    match: (s,t,b) => t === 'NP' && s.AC >= 18
  },
  {
    id: 5, name: 'MEDIATOR', jp: '温厚メディエーター', sub: '優柔不断型',
    formula: '高NP × 低CP',
    desc: '温かく穏やか。包容力がある一方、決断や叱責が苦手で流されやすい。時に「線を引く力」を発揮しよう。',
    skills: { strong: ['HARMONY', 'KINDNESS'], grow: ['BOUNDARY', 'DECISION'] },
    match: (s,t,b) => t === 'NP' && s.CP <= 12
  },
  {
    id: 6, name: 'SOLVER', jp: '問題解決ソルバー', sub: '人の心を忘れがち型',
    formula: '高A × 高CP',
    desc: '論理と規範で問題をテキパキ解決する。「正しさ」を優先するあまり、相手の気持ちを置き去りにしやすい。',
    skills: { strong: ['LOGIC', 'STANDARD'], grow: ['EMPATHY', 'WARMTH'] },
    match: (s,t,b) => t === 'A' && s.CP >= 20
  },
  {
    id: 7, name: 'STRUGGLER', jp: '葛藤ストラッグラー', sub: '自罰型',
    formula: '高AC × 高CP × 低FC',
    desc: '自分に厳しく、自分を責めやすい。理想と現実のギャップに苦しみがち。完璧主義をゆるめて、自分の楽しみに時間を使うことが助けになる。',
    skills: { strong: ['SELF CONTROL', 'IDEAL'], grow: ['SELF JOY', 'FORGIVENESS'] },
    match: (s,t,b) => t === 'AC' && s.CP >= 18 && s.FC <= 12
  },
  {
    id: 8, name: 'NARCISSIST', jp: 'ナルシスト', sub: '自己関心型',
    formula: '高FC × 低NP',
    desc: '自由奔放で自己表現が豊か。自分への関心が高い一方、他者への関心が薄くなりがち。思いやりを加えると魅力が倍増する。',
    skills: { strong: ['SELF EXPRESSION', 'FREEDOM'], grow: ['EMPATHY', 'OTHERS FOCUS'] },
    match: (s,t,b) => t === 'FC' && s.NP <= 12
  },
  {
    id: 9, name: 'HARMONIZER', jp: '円満ハーモナイザー', sub: '他者関心型',
    formula: '高NP × 高FC',
    desc: '温かく明るい人柄で、まわりに人が集まる型。みんなを喜ばせたい気持ちが強く、自分の本音を言いそびれることも。Aで時々自分の状態を点検しよう。',
    skills: { strong: ['WARMTH', 'JOY'], grow: ['SELF VOICE', 'OBJECTIVITY'] },
    match: (s,t,b) => t === 'NP' && s.FC >= 18
  },
  {
    id: 10, name: 'SOFTHEART', jp: '温情ソフトハート', sub: '情に流される型',
    formula: '高NP × 高AC × 低CP',
    desc: '人の心に寄り添える優しさと、相手に合わせる協調性を併せ持つ。情に流されて自分を見失いやすいので、線を意識する。',
    skills: { strong: ['EMPATHY', 'CARE'], grow: ['BOUNDARY', 'SELF VOICE'] },
    match: (s,t,b) => t === 'NP' && s.AC >= 18 && s.CP <= 12
  },
  {
    id: 11, name: 'CARETAKER', jp: '気配りケアテイカー', sub: '自己犠牲注意型',
    formula: '高AC × 高NP',
    desc: 'まわりに気を配り、人への思いやりも豊か。素晴らしい資質だが、自己主張を控えすぎて疲れやすい面も。FCを大事にしよう。',
    skills: { strong: ['ATTENTIVE', 'CARING'], grow: ['SELF JOY', 'ASSERTIVENESS'] },
    match: (s,t,b) => t === 'AC' && s.NP >= 18
  },
  {
    id: 12, name: 'CARRIER', jp: '面倒見キャリア', sub: '頼られすぎ注意型',
    formula: '高NP × 低AC',
    desc: '人を放っておけない面倒見の良いタイプ。頼まれたら断れず、いいように使われがち。時に「NO」を言おう。',
    skills: { strong: ['CARING', 'GENEROUS'], grow: ['SAY NO', 'SELF FIRST'] },
    match: (s,t,b) => t === 'NP' && (s.AC <= 12 || s.CP <= 12)
  },
  {
    id: 13, name: 'GUARDIAN', jp: '正義ガーディアン', sub: '上から目線注意型',
    formula: '高CP × 低NP',
    desc: '正義感が強く、責任感も強い。ルールに厳しく、不正を許せない。一方で、人を上から見てしまったり追い詰めることがあるので、温度を加える。',
    skills: { strong: ['JUSTICE', 'RESPONSIBLE'], grow: ['WARMTH', 'GENTLENESS'] },
    match: (s,t,b) => t === 'CP' && s.NP <= 12
  },
  {
    id: 14, name: 'OBSERVER', jp: 'クールオブザーバー', sub: '冷徹冷淡型',
    formula: '高A × 低NP × 低FC',
    desc: '非常に冷静で客観的。データと論理で物事を見るので信頼が厚い一方、感情が伝わらず冷たく映ることも。NP・FCを意識的に。',
    skills: { strong: ['OBJECTIVITY', 'CLARITY'], grow: ['WARMTH', 'PLAYFULNESS'] },
    match: (s,t,b) => t === 'A' && s.NP <= 12 && s.FC <= 12
  },
  {
    id: 15, name: 'DOUBTER', jp: '自己卑下ダウター', sub: '自分を責める型',
    formula: '高AC × 低FC',
    desc: '自分を低く見て、楽しむことが苦手。「自分なんて」が口癖になりがち。FCを上げる（楽しみを増やす、感情表現を増やす）と人生が広がる。',
    skills: { strong: ['HUMBLE', 'AWARE'], grow: ['SELF LOVE', 'JOY'] },
    match: (s,t,b) => t === 'AC' && s.FC <= 10
  },
  {
    id: 16, name: 'WILDCAT', jp: '自由奔放ワイルドキャット', sub: 'ガキっぽい注意型',
    formula: '高FC × 低AC',
    desc: '自由でエネルギッシュ。やりたいことに突進できる魅力的な型。配慮や規律が弱いと軋轢を生むことも。',
    skills: { strong: ['ENERGY', 'CREATIVITY'], grow: ['CONSIDERATION', 'DISCIPLINE'] },
    match: (s,t,b) => t === 'FC' && s.AC <= 10
  },
  {
    id: 17, name: 'WANDERER', jp: '予測不能ワンダラー', sub: '足の向くまま型',
    formula: '高FC × 低A',
    desc: '発想と行動が自由で、計画性は控えめ。インスピレーションで動ける反面、見通しを立てるのが苦手。Aを意識的に使おう。',
    skills: { strong: ['IMAGINATION', 'SPONTANEITY'], grow: ['PLANNING', 'STRUCTURE'] },
    match: (s,t,b) => t === 'FC' && s.A <= 12
  },
  {
    id: 18, name: 'IDEALIST', jp: '理想主義アイデアリスト', sub: 'ねくら注意型',
    formula: '高AC × 低FC × 低A',
    desc: '楽しむのが苦手で、自分を責めがち。理想は高いが、現実への動きが鈍くなりやすい。FCを上げて、まず「楽しい」を増やすことから。',
    skills: { strong: ['DEPTH', 'IDEAL'], grow: ['JOY', 'ACTION'] },
    match: (s,t,b) => t === 'AC' && s.FC <= 8
  },
  {
    id: 19, name: 'LEADER', jp: 'リーダーシップ型', sub: '自己主張型',
    formula: '高CP × 高FC',
    desc: '規範と自由な行動力を兼ね備えた、引っ張る力のある型。自己主張が強くなりすぎると周りが疲れることも。NP・ACでバランスを。',
    skills: { strong: ['DRIVE', 'INFLUENCE'], grow: ['LISTEN', 'YIELD'] },
    match: (s,t,b) => t === 'CP' && s.FC >= 18
  },
  {
    id: 20, name: 'DEPENDER', jp: '人頼みディペンダー', sub: 'クヨクヨ型',
    formula: '高AC × 低A',
    desc: '自分で決めるのが苦手。「みんなどう思ってる？」が口癖になりがち。Aを上げる（事実を集める、5W1H）と決断力がついてくる。',
    skills: { strong: ['HARMONY', 'TRUST'], grow: ['DECISION', 'OBJECTIVITY'] },
    match: (s,t,b) => t === 'AC' && s.A <= 12
  },
  {
    id: 21, name: 'CHEERFUL', jp: '朗らかチアフル', sub: 'ルーズ注意型',
    formula: '高FC × 低CP',
    desc: '明るく楽しい一方、規律はゆるめ。場を和ませる才能はあるが、約束や時間にルーズになりやすい。CPを少し意識すると信頼が増す。',
    skills: { strong: ['CHEER', 'WARMTH'], grow: ['DISCIPLINE', 'PUNCTUALITY'] },
    match: (s,t,b) => t === 'FC' && s.CP <= 12
  },
  {
    id: 22, name: 'EXECUTOR', jp: '決断エグゼキューター', sub: 'ほめ下手型',
    formula: '高CP × 高A × 低NP',
    desc: '決めたら一直線。決断力と実行力は抜群だが、人をほめたり気遣うのが苦手。NPを意識的に発揮すると、人がついてくる。',
    skills: { strong: ['EXECUTION', 'DECISIVE'], grow: ['PRAISE', 'EMPATHY'] },
    match: (s,t,b) => t === 'CP' && s.A >= 20 && s.NP <= 12
  },
  {
    id: 23, name: 'GENTLEMAN', jp: '義理人情ジェントルマン', sub: '頑固親父型',
    formula: '高CP × 高NP',
    desc: '規範と思いやりの両方が強い、義理堅く人情味あるタイプ。頑固で自分のやり方を曲げにくい面も。FCで柔らかさを。',
    skills: { strong: ['HONOR', 'CARE'], grow: ['FLEXIBILITY', 'PLAYFULNESS'] },
    match: (s,t,b) => t === 'CP' && s.NP >= 18
  },
  {
    id: 24, name: 'BLAZE', jp: 'かんしゃくブレイズ', sub: '自他否定型',
    formula: '高CP × 低AC',
    desc: '規範意識が強く、合わせることが苦手。自分にも他人にも厳しく、感情が爆発しやすい。NPでクッションを作ると関係が楽になる。',
    skills: { strong: ['INTENSITY', 'PRINCIPLE'], grow: ['EMPATHY', 'PATIENCE'] },
    match: (s,t,b) => t === 'CP' && s.AC <= 10
  }
];

/**
 * 回答配列（QUESTIONSと同順、値は0〜3の整数、未回答はnull）から尺度別合計を計算する。
 * 0〜3以外の値は診断を壊さないよう加算しない。
 */
function calculateScores(answers) {
  const scores = { CP: 0, NP: 0, A: 0, FC: 0, AC: 0 };
  QUESTIONS.forEach((q, i) => {
    const ans = answers[i];
    if (Number.isInteger(ans) && ans >= 0 && ans <= 3) scores[q.scale] += ans;
  });
  return scores;
}

/**
 * スコアからクラスを判定する。
 * 【現行v0.5aロジックの忠実移植】既知の欠陥あり:
 *  - どのクラスにもマッチしないスコアが存在（フォールバック到達 約11.8%）
 *  - id 10/14/18/22 は先行クラスに遮蔽され到達不能
 * → test/classify.test.js の網羅テストで検出され、次段階で置換される。
 */
function classify(scores) {
  const sorted = SCALES.map(s => ({ scale: s, score: scores[s] })).sort((a, b) => b.score - a.score);
  const top = sorted[0].scale;
  const bottom = sorted[sorted.length - 1].scale;
  const range = sorted[0].score - sorted[sorted.length - 1].score;

  if (range <= 5) return CLASSES[0];

  for (let i = 1; i < CLASSES.length; i++) {
    if (CLASSES[i].match(scores, top, bottom)) return CLASSES[i];
  }

  return {
    id: -1,
    name: top + '_DOMINANT',
    jp: top + '優位型',
    sub: '主体: ' + top,
    formula: top + '優位',
    desc: top + 'が最も高く出ています。',
    skills: { strong: [top + ' STRONG'], grow: ['BALANCE'] }
  };
}

/** 尺度スコアの高・中・低レベル判定（結果画面の解説の出し分けに使用） */
function scaleLevel(score) {
  if (score >= 18) return 'high';
  if (score >= 13) return 'mid';
  return 'low';
}

const TACore = {
  SCALES,
  QUESTIONS,
  ANSWER_OPTIONS,
  MAX_SCALE_SCORE,
  CLASSES,
  calculateScores,
  classify,
  scaleLevel
};

global.TACore = TACore;
if (typeof module !== 'undefined' && module.exports) module.exports = TACore;

})(typeof globalThis !== 'undefined' ? globalThis : this);
