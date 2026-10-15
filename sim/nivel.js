// Quanto pesa a diferença de nível? Critério 3 da E5a: um nv. 100 não pode vencer um nv. 60 por mais de 70 %.
// Espelho de classe (a mesma classe dos dois lados), cérebro v2, mercenário padrão (crescimento no meio da faixa,
// sem traços e sem itens). Os dois lados com Ascensão II (o nv. 60 é medido logo depois de ascender).
//
// Uso:  node sim/nivel.js [--a 100] [--b 60] [--n 60] [--bonus 0]
//   --a / --b  níveis do lado A e do lado B
//   --bonus    bônus extra de atributos do lado A (ex. 0.02 = +2%), para medir o Rank S antes de ele existir
// Imprime a taxa de vitória de A por classe, em 1v1 e em 3v3.
'use strict';
const { carregarJogo } = require('./carregar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const LA = +arg('a', 100), LB = +arg('b', 60), N = +arg('n', 60), BON = +arg('bonus', 0);
const J = carregarJogo({ semente: 7 });
const CLS = Object.keys(J.CLASSES);

function merc(cls, L, bon) {
  const m = J.gerarMerc(cls, L, 'B');
  m.cresc = J.CLASSES[cls].cresc.map(([lo, hi]) => (lo + hi) / 2); m.tracos = []; m.ascensoes = 2;
  if (bon) { const s = J.atributos(m); m.bonusCriador = { vida: Math.round(s.vida * bon), atq: Math.round(s.atq * bon), def: Math.round(s.def * bon), agi: 0 }; }
  return m;
}
const lado = (nome, mercs, cor) => ({ nome, cor1: cor, cor2: cor, simbolo: 0, mercs, capitaoId: mercs[0].id, mult: 1, ia: 'v2' });

function medir(tam) {
  const por = {};
  for (const c of CLS) {
    let v = 0;
    for (let k = 0; k < N; k++) {
      const A = lado('A', Array.from({ length: tam }, () => merc(c, LA, BON)), 0), B = lado('B', Array.from({ length: tam }, () => merc(c, LB, 0)), 1);
      const inv = k % 2 === 1;
      const bt = J.criarBatalha(inv ? B : A, inv ? A : B, { silencioso: true, seed: (k * 2654435761 + tam) >>> 0 });
      J.simularAteFim(bt);
      if (bt.vencedor === (inv ? 1 : 0)) v++;
    }
    por[c] = v / N;
  }
  const media = Object.values(por).reduce((a, b) => a + b, 0) / CLS.length;
  return { por, media };
}

const t0 = Date.now();
const efA = J.nivelEf(LA), efB = J.nivelEf(LB);
console.log(`\nVeldria · peso do nível · A nv. ${LA}${BON ? ` (+${Math.round(BON * 100)}% atributos)` : ''} × B nv. ${LB} · espelho de classe, cérebro v2, ${N} lutas por classe`);
console.log(`nível efetivo dos atributos: A ${efA.toFixed(1)} · B ${efB.toFixed(1)}\n`);
for (const tam of [1, 3]) {
  const r = medir(tam);
  console.log(`${tam}v${tam}: A vence ${Math.round(r.media * 100)}% em média · ` + CLS.map((c) => `${c.slice(0, 5)} ${Math.round(r.por[c] * 100)}`).join(' · '));
}
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)} s) Critério da E5a: A ≤ 70% com A = 100 (Rank S) e B = 60.`);
