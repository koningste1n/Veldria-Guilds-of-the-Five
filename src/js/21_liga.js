/* ============================ LIGA ============================ */
function nomeGuildaAleatorio(usados = []) {
  const primeiras = usados.map((u) => u.split(' ')[0]);
  for (let i = 0; i < 60; i++) { const a = pick(GUILD_A), n = `${a} ${pick(GUILD_B)}`; if (!usados.includes(n) && !primeiras.includes(a)) return n; }
  for (let i = 0; i < 40; i++) { const n = `${pick(GUILD_A)} ${pick(GUILD_B)}`; if (!usados.includes(n)) return n; }
  return `${pick(GUILD_A)} ${pick(GUILD_B)}`;
}
function brasaoAleatorio() {
  const c1 = pick(CORES_BRASAO); let c2 = pick(CORES_BRASAO);
  while (c2 === c1) c2 = pick(CORES_BRASAO);
  return { cor1: c1, cor2: c2, simbolo: pick(SIMBOLOS) };
}
// Qualidade dos rivais por divisão: potenciais, chance e raridade de itens, chance de pergaminho
const QUALIDADE_RIVAL = [
  { pesos: [15, 25, 30, 20, 8, 2], item: 0.25, rar: [70, 25, 5, 0, 0], perg: 0 },
  { pesos: [8, 20, 32, 24, 12, 4], item: 0.4, rar: [55, 32, 11, 2, 0], perg: 0.15 },
  { pesos: [4, 14, 30, 28, 17, 7], item: 0.55, rar: [40, 35, 18, 6, 1], perg: 0.3 },
  { pesos: [2, 8, 26, 32, 22, 10], item: 0.7, rar: [25, 35, 25, 12, 3], perg: 0.45 },
  { pesos: [0, 4, 20, 34, 28, 14], item: 0.85, rar: [15, 30, 30, 20, 5], perg: 0.6 },
];
// Na primeira temporada os rivais são mais fracos (potenciais baixos e quase sem itens)
function qualidadeRival(div, primeira = false) { const q = { ...QUALIDADE_RIVAL[div] }; if (primeira) { q.item = 0.05; q.pesos = [25, 30, 30, 12, 3, 0]; } return q; }
function darPergaminhoRival(m, q) {
  const papel = CLASSES[m.classe].papelId, r = weighted(q.rar);
  const op = Object.keys(PERGAMINHOS).filter((k) => PERGAMINHOS[k].r <= r && pergaminhoServe(k, papel) && !m.pergaminhos.some((p) => p.pid === k));
  if (!op.length) return;
  const pid = pick(op);
  m.pergaminhos.push(gerarPergaminho(PERGAMINHOS[pid].r, pid));
}
function gerarElencoRival(nivel, q, n = tamanhoTime(), evitar = []) {
  const classes = [pick(CLASSES_FRENTE)];
  if (n >= 4) classes.push(pick(CLASSES_FRENTE));
  while (classes.length < n) classes.push(pick(CLASSES_RECRUTAVEIS));
  const mercs = [];
  for (const cls of classes) mercs.push(gerarMerc(cls, nivel, POTS[weighted(q.pesos)], [...evitar, ...mercs.map((m) => m.nome)]));
  for (const m of mercs) {
    ajustarAscPorNivel(m);
    for (const tipo of Object.keys(TIPOS_ITEM)) if (Math.random() < q.item) m.equip[tipo] = gerarItem(weighted(q.rar), nivel, tipo);
    if (q.perg && Math.random() < q.perg) darPergaminhoRival(m, q);
    if (q.perg && m.nivel > 10 && Math.random() < q.perg) darPergaminhoRival(m, q);
  }
  return mercs;
}
function roundRobin(n) {
  const idx = [...Array(n).keys()], rodadas = [];
  for (let r = 0; r < n - 1; r++) {
    const pares = [];
    for (let i = 0; i < n / 2; i++) pares.push([idx[i], idx[n - 1 - i]]);
    rodadas.push(pares);
    idx.splice(1, 0, idx.pop());
  }
  return rodadas;
}
/* ---- pareamento pelo poder: os rivais começam um pouco abaixo do poder do time (com relíquias),
   sempre dentro da faixa de níveis da divisão (base − 2 até base + 5) ---- */
let RAZAO_PODER = 0.85;
function poderTime(mercs, mods = {}) {
  const k = 1 + 0.6 * (mods.atqPct || 0) + 0.4 * (mods.vidaPct || 0) + 0.3 * (mods.defPct || 0) + 0.3 * (mods.agiPct || 0)
    + (mods.crit || 0) + 0.8 * (mods.roubo || 0) + 0.5 * (mods.recarga || 0) + 0.08 * (mods.flags || []).length;
  return poderLista(mercs) * k;
}
function poderNoNivel(m, L) {
  const n = m.nivel, a = m.ascensoes;
  m.nivel = L; m.ascensoes = L > 20 ? 2 : L > 10 ? 1 : 0;
  const p = poderMerc(m);
  m.nivel = n; m.ascensoes = a;
  return p;
}
function nivelBaseRivais(rivais, poderJ, faixa, mult) {
  const alvo = poderJ * RAZAO_PODER;
  let melhor = faixa[0], dif = Infinity;
  for (let L = faixa[0]; L <= faixa[1]; L++) {
    const media = (rivais.reduce((s, g) => s + g.mercs.reduce((t, m) => t + poderNoNivel(m, L), 0), 0) / rivais.length) * mult;
    if (Math.abs(media - alvo) < dif) { dif = Math.abs(media - alvo); melhor = L; }
  }
  return melhor;
}
const faixaDivisao = (div) => [Math.max(1, div.base - 2), Math.min(30, div.base + 5)];
function novaTemporada(temporada) {
  const div = divAtual(), faixa = faixaDivisao(div);
  const usados = [STATE.guilda.nome];
  const guildas = [{ id: 'eu', ...STATE.guilda, nome: STATE.guilda.nome, pontos: 0, v: 0, d: 0, abP: 0, abC: 0 }];
  const primeira = temporada === 1 && STATE.divisao === 0;
  const q = qualidadeRival(STATE.divisao, primeira);
  const provisorio = clamp(Math.round(nivelMedioTime()) - 1, faixa[0], faixa[1]);
  for (let i = 0; i < 7; i++) {
    const nome = nomeGuildaAleatorio(usados); usados.push(nome);
    const mercs = gerarElencoRival(provisorio, q);
    guildas.push({ id: 'g' + i, nome, ...brasaoAleatorio(), mercs, capitaoId: pick(mercs).id, offsets: mercs.map(() => (primeira ? rint(-1, 0) : rint(-1, 1))), pontos: 0, v: 0, d: 0, abP: 0, abC: 0 });
  }
  const nivelBase = primeira ? 1 : nivelBaseRivais(guildas.slice(1), poderTime(timeMercs(), modsDoTime({})), faixa, MULT_RIVAL[STATE.divisao]);
  const ordem = [0, ...shuffle([1, 2, 3, 4, 5, 6, 7])];
  const cal = roundRobin(8).map((pares) => pares.map(([a, b]) => [ordem[a], ordem[b]]));
  STATE.liga = { temporada, div: div.id, divIdx: STATE.divisao, nivelBase, rodada: 0, guildas, calendario: shuffle(cal), resultados: [], encerrada: false, fase: 'liga', copa: null, pos: null };
  for (const g of guildas.slice(1)) ajustarRival(g, 0);
}
function nivelRival(g, i, rodada) {
  return clamp(Math.round(STATE.liga.nivelBase + 0.45 * rodada + (g.offsets ? g.offsets[i] || 0 : 0)), 1, 30);
}
function ajustarRival(g, rodada) { g.mercs.forEach((m, i) => { m.nivel = nivelRival(g, i, rodada); m.ascensoes = m.nivel > 20 ? 2 : m.nivel > 10 ? 1 : 0; }); }
function ladoJogador(preparo = {}) {
  return {
    nome: STATE.guilda.nome, cor1: STATE.guilda.cor1, cor2: STATE.guilda.cor2, simbolo: STATE.guilda.simbolo,
    mercs: timeMercs(), capitaoId: STATE.capitao, mult: 1, mods: modsDoTime(preparo), ia: IA_JOGO,
    bomba: preparo.bombaPolvora ? Math.round(20 * nivelMedioTime()) : 0,
  };
}
function ladoDeGuilda(g, mult) { return { nome: g.nome, cor1: g.cor1, cor2: g.cor2, simbolo: g.simbolo, mercs: g.mercs, capitaoId: g.capitaoId, mult, lider: g.lider || null, ia: IA_JOGO }; }
const multDificuldade = () => DIFICULDADES[STATE.config.dif].mult;
const multAdversario = () => multDificuldade() * MULT_RIVAL[STATE.divisao];
function adversarioDaRodada() {
  const L = STATE.liga;
  if (!L || L.fase !== 'liga' || L.encerrada) return null;
  const par = L.calendario[L.rodada].find((p) => p.includes(0));
  const g = L.guildas[par[0] === 0 ? par[1] : par[0]];
  ajustarRival(g, L.rodada);
  return g;
}
function registrarRodada(vitoria, abatesEu, abatesEles) {
  const L = STATE.liga, eu = L.guildas[0];
  const rival = adversarioDaRodada();
  const res = [];
  const marcar = (gA, gB, vA, abA, abB) => {
    gA.abP += abA; gA.abC += abB; gB.abP += abB; gB.abC += abA;
    if (vA) { gA.pontos += 3; gA.v++; gB.d++; } else { gB.pontos += 3; gB.v++; gA.d++; }
    res.push({ a: gA.nome, b: gB.nome, vencedor: vA ? gA.nome : gB.nome, placar: `${abA}×${abB}` });
  };
  marcar(eu, rival, vitoria, abatesEu, abatesEles);
  for (const [ia, ib] of L.calendario[L.rodada]) {
    if (ia === 0 || ib === 0) continue;
    const gA = L.guildas[ia], gB = L.guildas[ib];
    ajustarRival(gA, L.rodada); ajustarRival(gB, L.rodada);
    const bt = criarBatalha(ladoDeGuilda(gA, 1), ladoDeGuilda(gB, 1), { silencioso: true });
    simularAteFim(bt);
    const r = resumoBatalha(bt);
    somarLutaRivais(bt, r, gA.nome, gB.nome);
    marcar(gA, gB, r.vencedor === 0, r.abates[0], r.abates[1]);
  }
  L.resultados = res;
  L.rodada++;
  if (L.rodada >= L.calendario.length) montarPosLiga(L);
}
function classificacao(L = STATE.liga) {
  return L.guildas.map((g, i) => ({ g, i })).sort((p, q) => (q.g.pontos - p.g.pontos) || ((q.g.abP - q.g.abC) - (p.g.abP - p.g.abC)) || (q.g.v - p.g.v) || (p.i - q.i));
}
function posicaoJogador() { return classificacao().findIndex((x) => x.i === 0) + 1; }

/* ---- fim da liga: Copa dos 4 primeiros ---- */
function montarPosLiga(L) {
  L.encerrada = true;
  const cls = classificacao(L), pos = cls.findIndex((x) => x.i === 0) + 1;
  L.pos = pos;
  if (pos <= 4) {
    const par = { 1: 4, 2: 3, 3: 2, 4: 1 }[pos];
    L.copa = { etapa: 'semi', semiRival: cls[par - 1].i, lider: null, venceuSemi: null, venceuFinal: null };
    L.fase = 'copa';
  } else { L.copa = null; L.fase = 'fim'; }
}
const LIDER_GUILDA = {
  barao: { nome: 'Ferro-Velho do Barão', cor1: '#7f8c8d', cor2: '#e8743b', simbolo: 'torre' },
  corvina: { nome: 'Ninho das Corvina', cor1: '#2b2233', cor2: '#c0392b', simbolo: 'lua' },
  colosso: { nome: 'Pedreira do Colosso', cor1: '#7f8c8d', cor2: '#f0c24b', simbolo: 'torre' },
  selene: { nome: 'Torre de Selene', cor1: '#8e44ad', cor2: '#7fd6ff', simbolo: 'estrela' },
  rei: { nome: 'Corte Sem Coroa', cor1: '#2b2233', cor2: '#f0c24b', simbolo: 'coroa' },
};
// Líder da Copa: o chefe (atributos multiplicados e mecânica própria) com escolta da divisão.
// O nível é pareado pelo poder do time, para a final ser sempre um desafio de verdade.
let RAZAO_LIDER = 1.0;
function gerarLider(divIdx) {
  const Ld = LIDERES[divIdx], G = LIDER_GUILDA[Ld.id], D = DIVISOES[divIdx];
  const faixa = [Math.max(1, D.base - 2), Math.min(30, D.base + 8)];
  const nv0 = clamp(Math.round(nivelMedioTime()), faixa[0], faixa[1]);
  const n = D.time;
  const chefe = (nome) => {
    const m = gerarMerc(Ld.classe, nv0, 'A');
    Object.assign(m, { nome, chefe: Ld.id, visual: Ld.visual, tracos: [], pele: 0, cabelo: 1 });
    if (Ld.skill) m.skillFixa = Ld.skill;
    return m;
  };
  const chefes = Ld.duplo ? [chefe('Corvina Rubra'), chefe('Corvina Negra')] : [chefe(Ld.nome)];
  const escolta = gerarElencoRival(Math.max(1, nv0 - 1), qualidadeRival(divIdx), n - chefes.length, chefes.map((m) => m.nome));
  const alvo = (poderTime(timeMercs(), modsDoTime({})) * RAZAO_LIDER * (Ld.razao || 1)) / MULT_RIVAL[divIdx];
  let melhor = nv0, dif = Infinity;
  for (let L = faixa[0]; L <= faixa[1]; L++) {
    const p = chefes.reduce((s, m) => s + poderNoNivel(m, L), 0) + escolta.reduce((s, m) => s + poderNoNivel(m, Math.max(1, L - 1)), 0);
    if (Math.abs(p - alvo) < dif) { dif = Math.abs(p - alvo); melhor = L; }
  }
  const nivelar = (m, L) => { m.nivel = L; m.ascensoes = L > 20 ? 2 : L > 10 ? 1 : 0; };
  chefes.forEach((m) => nivelar(m, melhor));
  escolta.forEach((m) => nivelar(m, Math.max(1, melhor - 1)));
  return { id: 'lider', lider: Ld.id, nome: G.nome, cor1: G.cor1, cor2: G.cor2, simbolo: G.simbolo, mercs: [...chefes, ...escolta], capitaoId: chefes[0].id };
}
function adversarioCopa() {
  const L = STATE.liga, C = L && L.copa;
  if (!C || L.fase !== 'copa') return null;
  if (C.etapa === 'semi') { const g = L.guildas[C.semiRival]; ajustarRival(g, 7); return g; }
  if (C.etapa === 'final') { if (!C.lider) C.lider = gerarLider(STATE.divisao); return C.lider; }
  return null;
}
function registrarCopa(vit) {
  const L = STATE.liga, C = L.copa, div = divAtual();
  const r = { etapa: C.etapa, ouro: 0, emblemas: 0, bauMin: -1, campeao: null, destino: null };
  if (C.etapa === 'semi') {
    C.venceuSemi = vit;
    if (vit) { r.ouro = Math.round(COPA.semiOuro * div.mult); r.emblemas = COPA.semiEmblemas; r.bauMin = 1; C.etapa = 'final'; C.lider = gerarLider(STATE.divisao); }
    else { C.etapa = 'fim'; L.fase = 'fim'; }
  } else if (C.etapa === 'final') {
    C.venceuFinal = vit; C.etapa = 'fim'; L.fase = 'fim';
    if (vit) {
      r.ouro = Math.round(COPA.semiOuro * 2.5 * div.mult); r.emblemas = COPA.finalEmblemas; r.bauMin = 2;
      STATE.stats.copas++; STATE.stats.lideres++;
      if (Math.random() < COPA.chanceCampeao[STATE.divisao]) { const m = sortearCampeao(); if (m) { r.campeao = m; r.destino = receberCampeao(m); } }
    }
  }
  ganharOuro(r.ouro); STATE.emblemas += r.emblemas;
  return r;
}
function premiosTemporada() {
  const L = STATE.liga, pos = L.pos || posicaoJogador();
  return {
    pos, ouro: Math.round(PREMIOS_TEMPORADA[pos - 1] * divAtual().mult), emblemas: [3, 2, 1][pos - 1] || 0,
    bau: pos === 1 ? 2 : pos <= 3 ? 0 : -1,
    sobe: pos <= 2 && STATE.divisao < DIVISOES.length - 1, cai: pos === 8 && STATE.divisao > 0,
  };
}
function encerrarTemporada() {
  const L = STATE.liga;
  if (!L || L.fase !== 'fim') return null;
  const p = premiosTemporada(), C = L.copa;
  ganharOuro(p.ouro); STATE.emblemas += p.emblemas;
  STATE.historico.push({ t: L.temporada, div: STATE.divisao, pos: p.pos, copa: C ? (C.venceuFinal ? 'campeao' : C.venceuSemi ? 'vice' : 'semi') : null, mov: p.sobe ? 'sobe' : p.cai ? 'cai' : '' });
  if (STATE.historico.length > 60) STATE.historico.shift();
  const item = p.bau >= 0 ? darDrop(rolarRaridade(sorteGuilda(), p.bau), Math.max(1, Math.round(nivelMedioTime()))) : null;
  const divAntes = STATE.divisao, timeAntes = tamanhoTime();
  if (p.sobe) { STATE.divisao++; STATE.stats.promocoes++; } else if (p.cai) STATE.divisao--;
  STATE.stats.temporadas++;
  preencherTime(); ajustarReliquias();
  novaTemporada(L.temporada + 1);
  STATE.amistoso = null;
  return { ...p, item, divAntes, divDepois: STATE.divisao, timeAntes, copa: L.copa, temporada: L.temporada };
}
function gerarAmistoso() {
  const nv = Math.round(nivelMedioTime());
  const q = qualidadeRival(STATE.divisao);
  const mercs = gerarElencoRival(nv, { ...q, pesos: POTS.map((p) => POT_INFO[p].peso), item: Math.min(q.item, 0.3) });
  mercs.forEach((m) => { m.nivel = clamp(nv + rint(-1, 1), 1, 30); ajustarAscPorNivel(m); });
  STATE.amistoso = { nome: nomeGuildaAleatorio([STATE.guilda.nome]), ...brasaoAleatorio(), mercs, capitaoId: pick(mercs).id };
}

