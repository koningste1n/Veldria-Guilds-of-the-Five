/* ============================ FORJA, PERGAMINHOS E ASCENSÃO ============================ */
const limiteForja = () => Math.min(10, STATE.construcoes.forja);
const podeAprimorar = (it) => ehEquipamento(it) && (it.aprim || 0) < limiteForja();
function aprimorarItem(it) {
  if (!podeAprimorar(it)) return 'limite';
  const c = custoAprimorar(it);
  if (STATE.ouro < c) return 'ouro';
  STATE.ouro -= c; it.aprim = (it.aprim || 0) + 1; it.investido = (it.investido || 0) + c;
  return 'ok';
}
function equiparPergaminho(m, id) {
  const it = STATE.inventario.find((i) => i.id === id && i.tipo === 'pergaminho');
  if (!it) return 'erro';
  if (!pergaminhoServe(it.pid, CLASSES[m.classe].papelId)) return 'papel';
  if (m.pergaminhos.some((p) => p.pid === it.pid)) return 'repetido';
  if (m.pergaminhos.length >= slotsPergaminho(m)) return 'cheio';
  STATE.inventario = STATE.inventario.filter((i) => i !== it);
  m.pergaminhos.push(it);
  return 'ok';
}
function removerPergaminho(m, id) {
  const it = m.pergaminhos.find((p) => p.id === id); if (!it) return 'erro';
  if (STATE.inventario.length >= ECO.invMax) return 'cheio';
  m.pergaminhos = m.pergaminhos.filter((p) => p !== it);
  STATE.inventario.push(it);
  return 'ok';
}
const custoAscensao = (m) => ASCENSOES[m.ascensoes || 0] || null;
function ascender(m) {
  const A = custoAscensao(m);
  if (!A || !podeAscender(m)) return 'nivel';
  if (STATE.ouro < A.ouro) return 'ouro';
  if (STATE.emblemas < A.emblemas) return 'emblemas';
  STATE.ouro -= A.ouro; STATE.emblemas -= A.emblemas;
  m.ascensoes = (m.ascensoes || 0) + 1;
  return 'ok';
}

