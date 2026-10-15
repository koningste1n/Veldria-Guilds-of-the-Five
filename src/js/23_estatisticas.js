/* ============================ ESTATÍSTICAS ============================ */
function mvpDe(meus) {
  let mvp = meus[0];
  for (const u of meus) if (u.dano + u.cura * 1.2 > mvp.dano + mvp.cura * 1.2) mvp = u;
  return mvp;
}
function registrarEstatisticas(b, res, vit) {
  const S = STATE.stats, meus = res.unidades[0], mvp = mvpDe(meus);
  for (const u of meus) {
    S.dano += Math.round(u.dano); S.cura += Math.round(u.cura); S.abates += u.abates; if (!u.vivo) S.mortes++;
    S.maiorGolpe = Math.max(S.maiorGolpe, Math.round(u.maiorGolpe || 0));
    const m = mercPorId(u.merc.id); if (!m) continue;
    const ms = m.stats || (m.stats = statsMercPadrao());
    ms.lutas++; if (vit) ms.vitorias++; ms.abates += u.abates; ms.dano += Math.round(u.dano); ms.cura += Math.round(u.cura); if (u === mvp) ms.mvp++;
  }
  S.supremos += b.supremos ? b.supremos[0] : 0;
  S.tempoLuta += res.tempo;
  return mvp;
}


/* ---- registro de partidas (E3) ----
   Cada luta grava semente, versão das regras, times, vencedor, duração e os números de cada lutador.
   As REPLAYS_MAX mais recentes guardam também os lados e os toques do jogador para reproduzir a luta. */
function prepararRegistro(A, B, opts, seed) {
  return { seed, regras: REGRAS_COMBATE, replay: { A: ladoParaRegistro(A), B: ladoParaRegistro(B), opts: JSON.parse(JSON.stringify(opts)), entradas: [] } };
}
function registrarPartida(b, res, ctx, vit, mvp, reg) {
  const snap = {};
  for (const lado of [reg.replay.A, reg.replay.B]) for (const m of lado.mercs) snap[m.id] = m;
  const lut = (u) => {
    const m = u.merc && snap[u.merc.id];
    return {
      uid: u.uid, id: u.merc ? u.merc.id : null, nome: u.nome, cls: u.cls, nv: m ? m.nivel : 0,
      itens: m ? ['arma', 'armadura', 'amuleto'].map((k) => m.equip[k] && m.equip[k].nome).filter(Boolean) : [],
      dano: Math.round(u.dano), cura: Math.round(u.cura), rec: Math.round(u.recebido), ab: u.abates, mo: u.mortes, mvp: u === mvp ? 1 : 0,
    };
  };
  const S = STATE.stats, sr = ctx.serie;
  const p = {
    n: ++S.partidasN, quando: Date.now(), tipo: ctx.tipo, rival: ctx.rival.nome, andar: ctx.rival.andar || null,
    seed: reg.seed, regras: reg.regras, vit, vencedor: b.vencedor, tempo: Math.round(b.t * 10) / 10, passos: b.n,
    criador: !!b.criador, times: res.unidades.map((t) => t.map(lut)),
    // E4 (e): numa partida melhor de N, cada rodada é uma luta registrada; `serie` diz qual rodada e o placar depois dela
    serie: sr && sr.max > 1 ? { id: sr.id, rodada: sr.rodada, de: sr.max, placar: sr.placar.slice() } : null,
  };
  // Luta encerrada pelo Modo Criador ("Vencer agora") não é reproduzível
  if (!b.criador) { reg.replay.entradas = b.entradas.map((e) => ({ ...e })); p.replay = reg.replay; }
  STATE.partidas.push(p);
  while (STATE.partidas.length > PARTIDAS_MAX) STATE.partidas.shift();
  STATE.partidas.forEach((x, i) => { if (i < STATE.partidas.length - REPLAYS_MAX) delete x.replay; });
  // teto de tamanho (o save na conta aceita ~234 KB): times grandes descartam primeiro os dados de reprodução mais antigos
  while (JSON.stringify(STATE.partidas).length > PARTIDAS_BYTES) {
    const velho = STATE.partidas.find((x) => x.replay && x !== p);
    if (velho) delete velho.replay; else if (STATE.partidas.length > 1) STATE.partidas.shift(); else break;
  }
  // melhores da temporada: meus heróis em toda luta; rivais só quando são guildas da liga
  somarHerois(res.unidades[0], STATE.guilda.nome, true, vit);
  if (ctx.tipo !== 'torre') somarHerois(res.unidades[1], ctx.rival.nome, false, !vit);
  return p;
}
// Ficha de rastro: conta partidas (não rodadas) — chamada uma vez, quando a partida termina
function registrarRastro(ctx, vit) {
  const S = STATE.stats;
  S.seqAtual = vit ? S.seqAtual + 1 : 0;
  S.seqRecorde = Math.max(S.seqRecorde, S.seqAtual);
  if (vit && ctx.rival.lider) S.lideresVencidos[ctx.rival.lider] = (S.lideresVencidos[ctx.rival.lider] || 0) + 1;
}
// Soma os números dos meus lutadores ao longo das rodadas de uma partida (para o resultado e o MVP da partida)
function somarRodadas(rodadas) {
  const por = new Map();
  for (const r of rodadas) for (const u of r.res.unidades[0]) {
    const k = u.merc ? u.merc.id : u.uid;
    const a = por.get(k) || { merc: u.merc, nome: u.nome, look: u.look, uid: u.uid, dano: 0, cura: 0, abates: 0, mortes: 0, vivo: true, maiorGolpe: 0 };
    a.dano += u.dano; a.cura += u.cura; a.abates += u.abates; a.mortes += u.mortes || 0; a.vivo = u.vivo; a.maiorGolpe = Math.max(a.maiorGolpe, u.maiorGolpe || 0);
    por.set(k, a);
  }
  return [...por.values()];
}
// O que aconteceu na tela, no mesmo formato de assinaturaLuta
const assinaturaRegistro = (p) => ({ vencedor: p.vencedor, passos: p.passos, lutadores: p.times.flat().map((u) => [u.uid, u.dano, u.cura, u.rec, u.ab, u.mo]) });
// Reproduz uma partida do registro e compara com o que aconteceu na tela
function conferirPartida(p) {
  if (!p.replay) return p.criador ? 'criador' : 'sem-dados';
  const r = reproduzirPartida(p);
  if (r.erro) return r.erro;
  return mesmaAssinatura(r, assinaturaRegistro(p)) ? 'igual' : 'diferente';
}

/* ---- melhores da temporada ---- */
function recTemporada() {
  const t = STATE.liga ? STATE.liga.temporada : 1;
  if (!STATE.temporadaRec || STATE.temporadaRec.t !== t) STATE.temporadaRec = { t, herois: {} };
  return STATE.temporadaRec;
}
function somarHerois(unidades, guilda, meu, venceu) {
  const lista = unidades.filter((u) => u.merc && !u.chefe && !u.invocacao);
  if (!lista.length) return;
  const R = recTemporada(), mvp = mvpDe(lista);
  for (const u of lista) {
    const k = (meu ? 'm' : 'r') + u.merc.id;
    const h = R.herois[k] || (R.herois[k] = { meu, guilda, nome: u.nome, cls: u.cls, look: u.look, lutas: 0, vit: 0, dano: 0, cura: 0, abates: 0, mortes: 0, mvp: 0 });
    h.nome = u.nome; h.look = u.look; h.guilda = guilda;
    h.lutas++; if (venceu) h.vit++;
    h.dano += Math.round(u.dano); h.cura += Math.round(u.cura); h.abates += u.abates; h.mortes += u.mortes;
    if (u === mvp) h.mvp++;
  }
}
// Lutas entre duas guildas rivais (simuladas na rodada da liga) também contam
function somarLutaRivais(bt, res, nomeA, nomeB) {
  somarHerois(res.unidades[0], nomeA, false, bt.vencedor === 0);
  somarHerois(res.unidades[1], nomeB, false, bt.vencedor === 1);
}
const kdaDe = (h) => h.abates / Math.max(1, h.mortes);
const CATEGORIAS_TEMPORADA = [
  { id: 'mvp', nome: 'MVP', valor: (h) => h.mvp, txt: (h) => `${fmt(h.mvp)} ${h.mvp === 1 ? 'vez' : 'vezes'}` },
  { id: 'abates', nome: 'Mais abates', valor: (h) => h.abates, txt: (h) => fmt(h.abates) },
  { id: 'kda', nome: 'Melhor KDA', valor: (h) => (h.lutas >= 3 ? kdaDe(h) : -1), txt: (h) => `${fmt1(kdaDe(h))} (${fmt(h.abates)}/${fmt(h.mortes)})`, dica: 'abates ÷ quedas, mín. 3 lutas' },
  { id: 'dano', nome: 'Mais dano', valor: (h) => h.dano, txt: (h) => fmtCompacto(h.dano) },
  { id: 'cura', nome: 'Mais cura', valor: (h) => h.cura, txt: (h) => fmtCompacto(h.cura) },
];
// Ranking de uma categoria: os 3 primeiros e, se nenhum for meu, o meu melhor com a posição
function rankingTemporada(cat, funcao) {
  const R = STATE.temporadaRec;
  const lista = R ? Object.values(R.herois).filter((h) => (funcao === 'todas' || funcaoDe(h.cls) === funcao) && cat.valor(h) > 0) : [];
  lista.sort((a, b) => cat.valor(b) - cat.valor(a) || b.dano - a.dano);
  const top = lista.slice(0, 3).map((h, i) => ({ h, pos: i + 1 }));
  if (!top.some((x) => x.h.meu)) { const i = lista.findIndex((h) => h.meu); if (i >= 0) top.push({ h: lista[i], pos: i + 1 }); }
  return top;
}
