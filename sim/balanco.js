#!/usr/bin/env node
// Simulador de balanço: N lutas para cada par de classes, com o motor de combate ATUAL do jogo.
// Gera a matriz de taxa de vitória (linha vence coluna). É a linha de base que o motor novo (E4) precisa vencer.
//
// Uso:  node sim/balanco.js [--n 200] [--nivel 10] [--tam 1] [--ia v1|v2] [--duelo] [--salvar] [--nucleos 8]
//   --n      lutas por par (metade de cada lado da arena, para tirar a vantagem de lado)
//   --nivel  nível dos mercenários (ascensões automáticas: >30 = 1, >60 = 2)
//   --tam    tamanho do time (1 = duelo; 3 = três da mesma classe)
//   --ia     cérebro dos dois lados: v1 = IA atual do 10_combate.js (padrão), v2 = cérebro de utilidade (10b)
//   --duelo  IA nova × IA atual: a LINHA joga com o cérebro v2 e a COLUNA com a IA atual (todos os 100 pares,
//            inclusive a diagonal = espelho). É a medição do critério 1 da E4
//   --evo    a | b | mix: evolução A/B de todos (mix = LINHA com A, COLUNA com B, todos os 100 pares); sem a opção, ninguém evoluiu
//   --salvar grava sim/resultados/balanco-nN-tT[-v2|-duelo][-evoX].json e .csv
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const { carregarJogo } = require('./carregar');

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? (process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : true) : d; };
const N = +arg('n', 200), NIVEL = +arg('nivel', 10), TAM = +arg('tam', 1), SALVAR = !!arg('salvar', false);
const IA = arg('ia', 'v1'), EVO = arg('evo', null), DUELO = !!arg('duelo', false) || EVO === 'mix';
const IA_LINHA = DUELO ? 'v2' : IA, IA_COLUNA = DUELO ? 'v1' : IA;

const J = carregarJogo({ semente: 2026 });
const CLS = Object.keys(J.CLASSES);
const CURTO = { guardiao: 'Guard', machadeiro: 'Mach', lanceira: 'Lanç', arqueira: 'Arq', piromante: 'Piro', criomante: 'Crio', clerica: 'Clér', lamina: 'Lâm', bardo: 'Bardo', invocador: 'Invoc' };

// Mercenário "padrão" da classe: crescimento no meio da faixa, sem traços, sem itens
function mercPadrao(cls, k, evo) {
  const m = J.gerarMerc(cls, NIVEL, 'B');
  m.evolucao = evo === 'mix' ? null : evo;
  m.cresc = J.CLASSES[cls].cresc.map(([lo, hi]) => Math.round(((lo + hi) / 2) * 100) / 100);
  m.tracos = []; m.ascensoes = J.ascPorNivel(NIVEL); m.nome = `${CURTO[cls]}${k}`;
  return m;
}
const times = Object.fromEntries(CLS.map((c) => [c, Array.from({ length: TAM }, (_, k) => mercPadrao(c, k + 1, EVO === 'a' || EVO === 'b' ? EVO : null))]));
// no modo mix, a LINHA joga com o caminho A e a COLUNA com o caminho B (times separados)
const timesA = EVO === 'mix' ? Object.fromEntries(CLS.map((c) => [c, Array.from({ length: TAM }, (_, k) => mercPadrao(c, k + 1, 'a'))])) : times;
const timesB = EVO === 'mix' ? Object.fromEntries(CLS.map((c) => [c, Array.from({ length: TAM }, (_, k) => mercPadrao(c, k + 1, 'b'))])) : times;
const lado = (c, cor, ia, qual) => { const T = qual === 'linha' ? timesA[c] : qual === 'coluna' ? timesB[c] : times[c]; return { nome: c, cor1: cor, cor2: cor, simbolo: 0, mercs: T, capitaoId: T[0].id, mult: 1, ia }; };

// Cada par de classes (a, b) roda uma vez só: b contra a é o complemento.
// No duelo (IA nova × IA atual) não há complemento: os 100 pares ordenados rodam.
const pares = [];
for (let i = 0; i < CLS.length; i++) for (let j = DUELO ? 0 : i; j < CLS.length; j++) pares.push([i, j]);
function rodarPar([i, j]) {
  const a = CLS[i], b = CLS[j];
  let v = 0, d = 0, te = 0;
  for (let k = 0; k < N; k++) {
    const inverte = k % 2 === 1;   // metade das lutas com cada classe do lado esquerdo
    const L0 = inverte ? lado(b, 1, IA_COLUNA, 'coluna') : lado(a, 0, IA_LINHA, 'linha'), L1 = inverte ? lado(a, 0, IA_LINHA, 'linha') : lado(b, 1, IA_COLUNA, 'coluna');
    const bt = J.criarBatalha(L0, L1, { silencioso: true, seed: (i * 7919 + j * 104729 + k * 15485863) >>> 0 });
    J.simularAteFim(bt);
    if (bt.vencedor === (inverte ? 1 : 0)) v++;
    d += bt.t; if (bt.t >= 120 - 1e-6) te++;
  }
  return { i, j, v: v / N, d: d / N, te: te / N };
}

if (!isMainThread) {
  // trabalhador: recebe uma fatia dos pares e devolve os resultados
  parentPort.postMessage(workerData.fatia.map(rodarPar));
} else {
  principal();
}

async function principal() {
const t0 = Date.now();
const nucleos = Math.max(1, Math.min(os.cpus().length, +arg('nucleos', 8)));
const fatias = Array.from({ length: nucleos }, () => []);
pares.forEach((p, k) => fatias[k % nucleos].push(p));
const partes = await Promise.all(fatias.map((fatia) => new Promise((ok, erro) => {
  const w = new Worker(__filename, { workerData: { fatia }, argv: process.argv.slice(2) });
  w.once('message', ok); w.once('error', erro);
})));
const vit = {}, dur = {}, tempoEsgotado = {};
for (const r of partes.flat()) {
  const a = CLS[r.i], b = CLS[r.j];
  vit[`${a}|${b}`] = r.v; dur[`${a}|${b}`] = r.d; tempoEsgotado[`${a}|${b}`] = r.te;
  if (a !== b && !DUELO) { vit[`${b}|${a}`] = 1 - r.v; dur[`${b}|${a}`] = r.d; tempoEsgotado[`${b}|${a}`] = r.te; }
}
const lutas = pares.length * N;
const seg = (Date.now() - t0) / 1000;

// ---- saída ----
const pct = (x) => String(Math.round(x * 100)).padStart(4);
const col = (s, w = 6) => String(s).padStart(w);
const rotulo = (EVO === 'mix' ? 'evolução A (linha) × evolução B (coluna) · ' : EVO ? `evolução ${EVO.toUpperCase()} dos dois lados · ` : '') + (DUELO && EVO !== 'mix' ? 'IA nova (linha) × IA atual (coluna)' : IA === 'v2' ? 'cérebro v2 dos dois lados' : 'IA atual dos dois lados');
console.log(`\nVeldria · simulador de balanço · ${rotulo} · regras v${J.REGRAS_COMBATE}`);
console.log(`${TAM}v${TAM} · nível ${NIVEL} · ${N} lutas por par de classes · ${lutas} lutas em ${seg.toFixed(1)} s (${nucleos} núcleos)\n`);
console.log('Taxa de vitória (%) da LINHA contra a COLUNA\n');
console.log(col('', 7) + CLS.map((c) => col(CURTO[c])).join('') + col('Média', 7) + col('Dur.s', 7));
const media = {};
for (const a of CLS) {
  // no duelo a diagonal (espelho) conta: é a mesma classe com cérebros diferentes
  const outros = DUELO ? CLS : CLS.filter((b) => b !== a);
  media[a] = outros.reduce((s, b) => s + vit[`${a}|${b}`], 0) / outros.length;
  const durA = CLS.reduce((s, b) => s + dur[`${a}|${b}`], 0) / CLS.length;
  console.log(col(CURTO[a], 7) + CLS.map((b) => (a === b ? col('·' + pct(vit[`${a}|${b}`]).trim()) : col(pct(vit[`${a}|${b}`]).trim()))).join('') + col(pct(media[a]).trim(), 7) + col(durA.toFixed(1), 7));
}
const espelho = CLS.reduce((s, c) => s + vit[`${c}|${c}`], 0) / CLS.length;
const ordem = CLS.slice().sort((a, b) => media[b] - media[a]);
const desvio = Math.sqrt(CLS.reduce((s, c) => s + (media[c] - 0.5) ** 2, 0) / CLS.length);
const esgot = Object.values(tempoEsgotado).reduce((s, x) => s + x, 0) / Object.keys(tempoEsgotado).length;
console.log(`\nRanking: ${ordem.map((c) => `${CURTO[c]} ${pct(media[c]).trim()}%`).join(' · ')}`);
if (DUELO) {
  const geral = CLS.reduce((s, c) => s + media[c], 0) / CLS.length;
  const piorEsp = CLS.slice().sort((a, b) => vit[`${a}|${a}`] - vit[`${b}|${b}`])[0];
  console.log(`Espelho (mesma classe, v2 × atual): ${CLS.map((c) => `${CURTO[c]} ${pct(vit[`${c}|${c}`]).trim()}%`).join(' · ')}`);
  console.log(`\nCRITÉRIO 1 DA E4 → média da matriz: ${(geral * 100).toFixed(1)}% (meta ≥ 55%)  ·  pior espelho: ${CURTO[piorEsp]} ${pct(vit[`${piorEsp}|${piorEsp}`]).trim()}% (meta ≥ 42%)  ·  ${geral >= 0.55 && vit[`${piorEsp}|${piorEsp}`] >= 0.42 ? 'PASSOU' : 'ainda não'}`);
} else {
  console.log(`Espelho (mesma classe dos dois lados): ${pct(espelho).trim()}%  (perto de 50% = sem vantagem de lado)`);
  console.log(`Desvio das médias em relação a 50%: ${(desvio * 100).toFixed(1)} pontos  ·  lutas que acabaram no tempo: ${(esgot * 100).toFixed(1)}%`);
}

if (SALVAR) {
  const dir = path.join(__dirname, 'resultados'); fs.mkdirSync(dir, { recursive: true });
  const base = path.join(dir, `balanco-n${NIVEL}-t${TAM}${DUELO && EVO !== 'mix' ? '-duelo' : IA === 'v2' ? '-v2' : ''}${EVO ? `-evo${EVO}` : ''}`);
  fs.writeFileSync(base + '.json', JSON.stringify({ regras: J.REGRAS_COMBATE, ia: DUELO ? 'duelo' : IA, nivel: NIVEL, tam: TAM, n: N, classes: CLS, vitoria: vit, duracao: dur, tempoEsgotado, media, desvio, espelho }, null, 1));
  fs.writeFileSync(base + '.csv', ['linha\\coluna,' + CLS.join(',') + ',media'].concat(CLS.map((a) => [a, ...CLS.map((b) => vit[`${a}|${b}`].toFixed(3)), media[a].toFixed(3)].join(','))).join('\n') + '\n');
  console.log(`\nGravado em ${path.relative(process.cwd(), base)}.json / .csv`);
}
}
