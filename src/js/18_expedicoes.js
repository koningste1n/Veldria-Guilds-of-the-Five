/* ============================ EXPEDIÇÕES ============================ */
const mercsLivresExpedicao = () => STATE.mercs.filter((m) => !STATE.time.includes(m.id) && !emExpedicao(m.id));
function recompensaExpedicao(tipo, m) {
  const X = EXPEDICOES[tipo], div = divAtual();
  return {
    ouro: Math.round(X.min * (0.6 + 0.12 * m.nivel) * div.mult * (1 + somaReliquia('ouro'))),
    xp: Math.round(X.min * (2 + 0.2 * m.nivel)), chance: X.chance, garantia: X.garantia || 0, emblemas: X.emblema || 0,
  };
}
const ocupadasNoDestino = (tipo) => STATE.expedicoes.filter((e) => e.tipo === tipo).length;
const vagasNoDestino = (tipo) => (EXPEDICOES[tipo].limite ? Math.max(0, EXPEDICOES[tipo].limite - ocupadasNoDestino(tipo)) : Infinity);
function iniciarExpedicao(mercId, tipo) {
  if (STATE.expedicoes.length >= maxExpedicoes() || !EXPEDICOES[tipo]) return 'cheio';
  if (vagasNoDestino(tipo) <= 0) return 'limite';
  const m = mercPorId(mercId);
  if (!m || STATE.time.includes(mercId) || emExpedicao(mercId)) return 'merc';
  const agora = Date.now();
  STATE.expedicoes.push({ id: novoId(), mercId, tipo, inicio: agora, fim: agora + (EXPEDICOES[tipo].min * 60000) / tempoMult(), mapa: !!STATE.mapaAtivo });
  STATE.mapaAtivo = false;
  return 'ok';
}
// Envia vários de uma vez para o mesmo destino (para quando acabam as vagas). Devolve quem partiu.
function iniciarExpedicoes(ids, tipo) {
  const foram = [];
  for (const id of ids) { if (iniciarExpedicao(id, tipo) !== 'ok') break; foram.push(mercPorId(id)); }
  return foram;
}
function cancelarExpedicao(eid) {
  const e = STATE.expedicoes.find((x) => x.id === eid); if (!e) return false;
  if (e.mapa) STATE.mapaAtivo = true;   // o mapa não se perde
  STATE.expedicoes = STATE.expedicoes.filter((x) => x !== e);
  return true;
}
function coletarExpedicao(eid) {
  const e = STATE.expedicoes.find((x) => x.id === eid);
  if (!e || Date.now() < e.fim) return null;
  STATE.expedicoes = STATE.expedicoes.filter((x) => x !== e);
  const m = mercPorId(e.mercId); if (!m) return null;
  const r = recompensaExpedicao(e.tipo, m);
  ganharOuro(r.ouro);
  const sub = darXp(m, r.xp);
  let drop = null;
  if (e.mapa || Math.random() < r.chance) drop = darDrop(rolarRaridade(sorteGuilda(), e.mapa ? Math.max(2, r.garantia) : r.garantia), m.nivel);
  STATE.emblemas += r.emblemas;
  STATE.stats.expedicoes++;
  return { m, tipo: e.tipo, ouro: r.ouro, xp: r.xp, sub, drop, emblemas: r.emblemas, mapa: e.mapa };
}
const expedicoesProntas = () => STATE.expedicoes.filter((e) => Date.now() >= e.fim);
function coletarTodas() { return expedicoesProntas().map((e) => coletarExpedicao(e.id)).filter(Boolean); }

