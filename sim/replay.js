#!/usr/bin/env node
// Teste do registro de partidas: luta "ao vivo" com mercenários variados (itens, pergaminhos, traços,
// Campeões, toques do jogador) → registro → reprodução a partir do registro. Tem de dar o mesmo resultado.
//
// Uso: node sim/replay.js [--n 300] [--gravar arq.json] [--conferir arq.json]
//   --gravar   além do teste, grava os registros e as assinaturas num arquivo
//   --conferir só reproduz os registros de um arquivo gravado (por outra versão do código) e compara as assinaturas
'use strict';
const { carregarJogo } = require('./carregar');
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const N = +arg('n', 300);
const J = carregarJogo({ semente: 77 });
const CLS = Object.keys(J.CLASSES), CAMP = Object.keys(J.CAMPEOES);
const TR = Object.keys(J.TRACOS);
const r = Math.random, ri = (a, b) => a + Math.floor(r() * (b - a + 1)), pk = (a) => a[Math.floor(r() * a.length)];

function mercVariado() {
  const nivel = ri(1, 30);
  const m = r() < 0.1 ? Object.assign(J.gerarMerc(J.CAMPEOES[pk(CAMP)].classe, nivel, 'A'), { campeao: pk(CAMP) }) : J.gerarMerc(pk(CLS), nivel, pk(['F', 'D', 'C', 'B', 'A', 'S']));
  m.tracos = Array.from({ length: ri(0, 3) }, () => pk(TR));
  m.ascensoes = J.ascPorNivel(nivel);
  if (nivel >= J.NIVEL_EVOLUCAO && r() < 0.7) m.evolucao = pk(['a', 'b']);
  for (const t of ['arma', 'armadura', 'amuleto']) if (r() < 0.8) { const it = J.gerarItem(ri(0, 4), nivel, t); it.aprim = ri(0, 10); m.equip[t] = it; }
  m.pergaminhos = Array.from({ length: ri(0, 2) }, () => J.gerarPergaminho(ri(0, 4)));
  m.pos = ri(0, 8); m.linha = m.pos < 3 ? 'frente' : 'tras'; m.postura = pk(Object.keys(J.POSTURAS)); m.tatica = pk(['auto', 'perto', 'fraco', 'forte', 'tras']);
  m.stats = { lutas: 5, dano: 999 };   // lixo que não deve importar
  return m;
}
const ladoVariado = (cor) => {
  const mercs = Array.from({ length: ri(1, 5) }, mercVariado);
  return { nome: 'G' + cor, cor1: cor, cor2: cor, simbolo: 0, mercs, capitaoId: pk(mercs).id, mult: r() < 0.3 ? 1 + r() : 1,
    mods: r() < 0.5 ? { flags: r() < 0.3 ? ['fenix'] : [], atqPct: r() * 0.2, defPct: 0, agiPct: 0, vidaPct: r() * 0.2, crit: 0.05, roubo: 0, recarga: 0.1 } : undefined,
    bomba: r() < 0.2 ? ri(10, 200) : 0,
    ia: r() < 0.5 ? 'v2' : 'v1' };   // metade dos lados com cada cérebro: os dois têm de reproduzir igual
};

const fs = require('fs');
if (arg('conferir', null)) {
  const dados = JSON.parse(fs.readFileSync(arg('conferir'), 'utf8'));
  let ok = 0;
  for (const d of dados) { const rep = J.reproduzirPartida(d.reg); if (J.mesmaAssinatura(d.ass, rep)) ok++; }
  console.log(`Conferência de ${dados.length} registros gravados por outra versão: ${ok}/${dados.length} reproduzem igual`);
  process.exit(ok === dados.length ? 0 : 1);
}
let iguais = 0, difAtrib = 0;
const gravados = [];
const t0 = Date.now();
for (let k = 0; k < N; k++) {
  const A = ladoVariado(0), B = ladoVariado(1);
  // 1) os atributos do retrato do registro são idênticos aos do mercenário real
  for (const m of [...A.mercs, ...B.mercs]) if (JSON.stringify(J.atributos(m)) !== JSON.stringify(J.atributos(J.mercParaRegistro(m)))) difAtrib++;
  // 2) luta "ao vivo" com toques do jogador em passos aleatórios
  const opts = { modoAuto: r() < 0.5, furiaInicio: pk([60, 30, 15]), multCura: pk([1, 0.5]) };
  const seed = ri(0, 1e9);
  const reg = { seed, regras: J.REGRAS_COMBATE, replay: { A: J.ladoParaRegistro(A), B: J.ladoParaRegistro(B), opts } };
  const b = J.criarBatalha(A, B, { ...opts, seed });
  let passos = 0;
  while (!b.fim && passos < 5000) {
    if (r() < 0.01) {
      const x = r();
      if (x < 0.3) J.entradaJogador(b, { tipo: 'auto', v: !b.modoAuto });
      else if (x < 0.7) { const alvo = pk(b.units.filter((u) => u.vivo && u.team === 1)); if (alvo && !b.modoAuto) J.entradaJogador(b, { tipo: 'foco', uid: alvo.uid }); }
      else if (!b.modoAuto) J.entradaJogador(b, { tipo: 'supremo' });
    }
    J.passo(b); b.eventos.length = 0; passos++;
  }
  reg.replay.entradas = b.entradas;
  const ao = J.assinaturaLuta(b, J.resumoBatalha(b));
  const rep = J.reproduzirPartida(JSON.parse(JSON.stringify(reg)));   // como se viesse do save
  gravados.push({ reg, ass: ao });
  if (J.mesmaAssinatura(ao, rep)) iguais++;
  else if (iguais + 5 > k) console.log('DIFERENTE', k, JSON.stringify(ao).slice(0, 200), '\n          ', JSON.stringify(rep).slice(0, 200));
}
console.log(`Reprodução: ${iguais}/${N} lutas idênticas · atributos divergentes no registro: ${difAtrib} · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (arg('gravar', null)) { fs.writeFileSync(arg('gravar'), JSON.stringify(gravados)); console.log(`${gravados.length} registros gravados em ${arg('gravar')}`); }
process.exit(iguais === N && difAtrib === 0 ? 0 : 1);
