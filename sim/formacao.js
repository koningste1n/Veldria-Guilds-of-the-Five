#!/usr/bin/env node
// E4 (c): a formação 3×3 e a postura escolhidas pelo jogador mudam o resultado da luta?
// Um time fixo (Guardião + Arqueira + Clériga) enfrenta dois adversários fixos com todas as
// combinações de 4 formações × 4 posturas. Imprime a taxa de vitória de cada combinação.
// Critério: a diferença entre a melhor e a pior escolha tem de ser ≥ 10 pontos (a escolha importa).
//
// Uso: node sim/formacao.js [--n 200] [--nivel 10]
'use strict';
const { carregarJogo } = require('./carregar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 200), NIVEL = +arg('nivel', 10);
const J = carregarJogo({ semente: 2026 });

function mercPadrao(cls, nome) {
  const m = J.gerarMerc(cls, NIVEL, 'B');
  m.cresc = J.CLASSES[cls].cresc.map(([lo, hi]) => Math.round(((lo + hi) / 2) * 100) / 100);
  m.tracos = []; m.ascensoes = NIVEL > 20 ? 2 : NIVEL > 10 ? 1 : 0; m.nome = nome;
  return m;
}
// casas: pos = coluna×3 + fileira (coluna 0 frente / 2 trás; fileira 0 cima / 1 centro / 2 baixo)
const C = (col, fil) => J.posDe(col, fil);
const FORMACOES = {
  'muralha':      [C(0, 1), C(2, 1), C(2, 0)],   // tanque na frente, arqueira e clériga atrás
  'tudo-frente':  [C(0, 1), C(0, 0), C(0, 2)],   // os três na coluna da frente
  'invertida':    [C(2, 1), C(0, 1), C(0, 0)],   // tanque atrás, frágeis na frente (escolha ruim de propósito)
  'em-coluna':    [C(0, 1), C(1, 1), C(2, 1)],   // um atrás do outro no centro
};
const POSTURAS = Object.keys(J.POSTURAS);
const ADVERSARIOS = {
  'corpo a corpo (Machadeiro, Lanceira, Piromante)': ['machadeiro', 'lanceira', 'piromante'],
  'à distância (Arqueira, Criomante, Lâmina)': ['arqueira', 'criomante', 'lamina'],
};

const meuTime = [mercPadrao('guardiao', 'Guard'), mercPadrao('arqueira', 'Arq'), mercPadrao('clerica', 'Clér')];
const lado = (mercs, cor) => ({ nome: 'G' + cor, cor1: cor, cor2: cor, simbolo: 0, mercs, capitaoId: mercs[0].id, mult: 1, ia: 'v2' });

function taxa(formacao, postura, advCls) {
  const adv = advCls.map((c, i) => mercPadrao(c, c + i));
  meuTime.forEach((m, i) => { m.pos = formacao[i]; m.linha = m.pos < 3 ? 'frente' : 'tras'; m.postura = postura; });
  let v = 0;
  for (let k = 0; k < N; k++) {
    const inv = k % 2 === 1;
    const b = J.criarBatalha(inv ? lado(adv, 1) : lado(meuTime, 0), inv ? lado(meuTime, 0) : lado(adv, 1), { silencioso: true, seed: 900 + k });
    J.simularAteFim(b);
    if (b.vencedor === (inv ? 1 : 0)) v++;
  }
  return v / N;
}

const t0 = Date.now();
const pct = (x) => String(Math.round(x * 100)).padStart(5);
let criterio = true;
console.log(`\nVeldria · formação × postura · Guardião + Arqueira + Clériga, nível ${NIVEL}, ${N} lutas por combinação · regras v${J.REGRAS_COMBATE}`);
for (const [nomeAdv, advCls] of Object.entries(ADVERSARIOS)) {
  console.log(`\nContra ${nomeAdv} — taxa de vitória (%)\n`);
  console.log('formação \\ postura'.padEnd(20) + POSTURAS.map((p) => p.padStart(10)).join(''));
  const todas = [];
  for (const [nomeF, f] of Object.entries(FORMACOES)) {
    const linha = POSTURAS.map((p) => taxa(f, p, advCls));
    todas.push(...linha);
    console.log(nomeF.padEnd(20) + linha.map((x) => pct(x).padStart(10)).join(''));
  }
  const dif = Math.max(...todas) - Math.min(...todas);
  console.log(`\nmelhor ${pct(Math.max(...todas)).trim()}% · pior ${pct(Math.min(...todas)).trim()}% · diferença ${(dif * 100).toFixed(0)} pontos ${dif >= 0.10 ? '(a escolha importa ✅)' : '(a escolha NÃO importa ❌)'}`);
  if (dif < 0.10) criterio = false;
}
console.log(`\n${((Date.now() - t0) / 1000).toFixed(1)} s · critério (c): ${criterio ? 'PASSOU' : 'ainda não'}`);
