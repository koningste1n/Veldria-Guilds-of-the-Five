/* ============================ RELÍQUIAS E PREPARO ============================ */
function somaReliquia(k) {
  if (!STATE || !STATE.reliquias) return 0;
  let s = 0;
  for (const it of STATE.reliquias) { const R = RELIQUIAS[it.rid]; if (R && R[k]) s += R[k]; }
  return s;
}
const flagsReliquias = () => (STATE.reliquias || []).map((it) => RELIQUIAS[it.rid] && RELIQUIAS[it.rid].flag).filter(Boolean);
const slotsReliquia = () => divAtual().reliquias;
function equiparReliquia(id) {
  const it = STATE.inventario.find((i) => i.id === id && i.tipo === 'reliquia');
  if (!it) return 'erro';
  if (STATE.reliquias.length >= slotsReliquia()) return 'cheio';
  if (STATE.reliquias.some((r) => r.rid === it.rid)) return 'repetida';
  STATE.inventario = STATE.inventario.filter((i) => i !== it);
  STATE.reliquias.push(it);
  return 'ok';
}
function desequiparReliquia(id) {
  const it = STATE.reliquias.find((i) => i.id === id);
  if (!it) return 'erro';
  if (STATE.inventario.length >= ECO.invMax) return 'cheio';
  STATE.reliquias = STATE.reliquias.filter((i) => i !== it);
  STATE.inventario.push(it);
  return 'ok';
}
function ajustarReliquias() { while (STATE.reliquias.length > slotsReliquia()) devolverAoInventario(STATE.reliquias.pop()); }
function preparoAtivo() {
  const out = {};
  for (const cid in STATE.preparo) if (STATE.preparo[cid] && CONSUMIVEIS[cid] && CONSUMIVEIS[cid].luta && (STATE.consumiveis[cid] || 0) > 0) out[cid] = true;
  return out;
}
function modsDoTime(preparo = {}) {
  const mods = { flags: flagsReliquias() };
  for (const k of ['atqPct', 'defPct', 'agiPct', 'vidaPct', 'crit', 'roubo', 'recarga']) mods[k] = somaReliquia(k);
  for (const cid in preparo) {
    const L = CONSUMIVEIS[cid] && CONSUMIVEIS[cid].luta; if (!L) continue;
    for (const k in L) if (k in mods && k !== 'flags') mods[k] += L[k];
  }
  return mods;
}
function alternarPreparo(cid) {
  if (STATE.preparo[cid]) { delete STATE.preparo[cid]; return true; }
  if ((STATE.consumiveis[cid] || 0) <= 0 || !CONSUMIVEIS[cid].luta) return false;
  STATE.preparo[cid] = true; return true;
}
function consumirPreparo() {
  const usados = Object.keys(preparoAtivo());
  for (const cid of usados) STATE.consumiveis[cid]--;
  STATE.preparo = {};
  return usados;
}
const precoConsumivel = (cid) => Math.round(CONSUMIVEIS[cid].preco * divAtual().mult);
function comprarConsumivel(cid) {
  const p = precoConsumivel(cid);
  if (STATE.ouro < p) return false;
  STATE.ouro -= p; STATE.consumiveis[cid] = (STATE.consumiveis[cid] || 0) + 1;
  return true;
}
function usarConsumivel(cid) {
  const C = CONSUMIVEIS[cid];
  if (!C || (STATE.consumiveis[cid] || 0) <= 0) return 'zero';
  if (C.uso === 'sabedoria') STATE.sabedoriaAte = Math.max(Date.now(), STATE.sabedoriaAte || 0) + 3600000;
  else if (C.uso === 'mapa') { if (STATE.mapaAtivo) return 'ativo'; STATE.mapaAtivo = true; }
  else return 'luta';
  STATE.consumiveis[cid]--;
  return 'ok';
}
const sabedoriaRestante = () => Math.max(0, (STATE.sabedoriaAte || 0) - Date.now());

