// Quanto vale cada evolução A/B dentro de um time de verdade? (E5a, bloco 2)
// Para cada classe monta um time de 3 com dois parceiros padrão (tanque + curandeira; para o tanque, arqueira + curandeira;
// para a curandeira e o bardo, tanque + arqueira) e mede, em espelho de composição, o time em que SÓ a classe testada evoluiu
// (caminho A ou B) contra o mesmo time sem evolução. Parceiros nunca evoluem. Cérebro v2 dos dois lados.
//
// Uso:  node sim/evolucoes.js [--n 80] [--nivel 15] [--classe arqueira]
// Leitura: 50 % = a evolução não mudou nada; 60–70 % = recompensa clara sem atropelar; > 80 % ou < 40 % = ajustar.
'use strict';
const { carregarJogo } = require('./carregar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 80), NIVEL = +arg('nivel', 15), SO = arg('classe', null);
const J = carregarJogo({ semente: 11 });
const CLS = SO ? [SO] : Object.keys(J.CLASSES);

function merc(cls, evo) {
  const m = J.gerarMerc(cls, NIVEL, 'B');
  m.cresc = J.CLASSES[cls].cresc.map(([lo, hi]) => (lo + hi) / 2); m.tracos = []; m.ascensoes = J.ascPorNivel(NIVEL);
  m.evolucao = evo; m.nome = `${cls.slice(0, 4)}${evo ? '-' + evo : ''}`;
  return m;
}
function parceiros(cls) {
  if (cls === 'guardiao') return ['arqueira', 'clerica'];
  if (cls === 'clerica' || cls === 'bardo') return ['guardiao', 'arqueira'];   // suportes: time com dano, senão a luta vai ao relógio
  return ['guardiao', 'clerica'];
}
const lado = (nome, mercs, cor) => ({ nome, cor1: cor, cor2: cor, simbolo: 0, mercs, capitaoId: mercs[0].id, mult: 1, ia: 'v2' });

function medir(cls, evo) {
  let v = 0, dur = 0;
  for (let k = 0; k < N; k++) {
    const [p1, p2] = parceiros(cls);
    const A = lado('evo', [merc(cls, evo), merc(p1, null), merc(p2, null)], 0);
    const B = lado('base', [merc(cls, null), merc(p1, null), merc(p2, null)], 1);
    const inv = k % 2 === 1;
    const bt = J.criarBatalha(inv ? B : A, inv ? A : B, { silencioso: true, seed: (k * 2654435761 + cls.length * 7) >>> 0 });
    J.simularAteFim(bt);
    if (bt.vencedor === (inv ? 1 : 0)) v++;
    dur += bt.t;
  }
  return { v: v / N, d: dur / N };
}

const t0 = Date.now();
console.log(`\nVeldria · valor das evoluções A/B em time de 3 · nível ${NIVEL} · ${N} lutas por medição · cérebro v2 · regras v${J.REGRAS_COMBATE}\n`);
console.log('Classe        A (nome)                 vence a base   B (nome)                 vence a base   A × B (mesmo time)');
const saida = {};
for (const c of CLS) {
  const EV = J.EVOLUCOES[c];
  const a = medir(c, 'a'), b = medir(c, 'b');
  // A × B direto dentro do mesmo time
  let vab = 0;
  for (let k = 0; k < N; k++) {
    const [p1, p2] = parceiros(c);
    const A = lado('A', [merc(c, 'a'), merc(p1, null), merc(p2, null)], 0), B = lado('B', [merc(c, 'b'), merc(p1, null), merc(p2, null)], 1);
    const inv = k % 2 === 1;
    const bt = J.criarBatalha(inv ? B : A, inv ? A : B, { silencioso: true, seed: (k * 40503 + 99) >>> 0 });
    J.simularAteFim(bt); if (bt.vencedor === (inv ? 1 : 0)) vab++;
  }
  const pct = (x) => `${Math.round(x * 100)}%`.padStart(5);
  const flag = (x) => (x > 0.8 || x < 0.4 ? ' ⚠' : '  ');
  console.log(`${c.padEnd(12)}  ${EV.a.nome.padEnd(24)} ${pct(a.v)}${flag(a.v)}         ${EV.b.nome.padEnd(24)} ${pct(b.v)}${flag(b.v)}         ${pct(vab / N)}`);
  saida[c] = { a: a.v, b: b.v, ab: vab / N };
}
console.log(`\n(${((Date.now() - t0) / 1000).toFixed(1)} s) Alvo: cada caminho entre 40 % e 80 % contra a base; A × B perto de 50 %.`);
if (arg('json', null)) require('fs').writeFileSync(arg('json'), JSON.stringify(saida, null, 1));
