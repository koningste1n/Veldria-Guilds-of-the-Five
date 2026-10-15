/* ============================ MERCADO ============================ */
const nivelRecruta = () => clamp(Math.round(nivelMedioTime()), 1, NIVEL_TETO);
function renovarTaverna(pago) {
  const nT = STATE.construcoes.taverna;
  const vagas = 4 + Math.floor((nT - 1) / 2);
  const nv = nivelRecruta();
  const ocupados = new Set([...STATE.campeoesObtidos, ...STATE.mercs.map((m) => m.campeao).filter(Boolean)]);
  const ofertas = [];
  for (let i = 0; i < vagas; i++) {
    const nivel = clamp(nv - rint(0, 2), 1, NIVEL_TETO);
    const livres = Object.keys(CAMPEOES).filter((id) => !ocupados.has(id));
    // A partir da Divisão Ouro, cada vaga tem 1% de chance de trazer um Campeão Lendário
    if (STATE.divisao >= 2 && livres.length && Math.random() < 0.01) { const id = pick(livres); ocupados.add(id); ofertas.push(ajustarAscPorNivel(gerarCampeao(id, nivel))); continue; }
    ofertas.push(ajustarAscPorNivel(gerarMerc(pick(CLASSES_RECRUTAVEIS), nivel, POTS[weighted(potPesos(nT))], ofertas.map((o) => o.nome))));
  }
  STATE.taverna.ofertas = ofertas;
  STATE.taverna.loja = [
    ...Array.from({ length: 3 }, () => gerarItem(weighted([50, 30, 15, 4.5, 0.5]), Math.max(1, nv))),
    gerarPergaminho(weighted([45, 30, 17, 7, 1])),
  ];
  STATE.taverna.lutas = 0;
  STATE.taverna.ultima = Date.now();
  if (!pago) STATE.taverna.custo = ECO.custoRenovar;
}
// Baú: equipamento, pergaminho, relíquia ou consumível (vai para a bolsa)
const temNovidades = () => !!(STATE && STATE.novidades && STATE.novidades.length);
function ganharOuro(v) { v = Math.max(0, Math.round(v)); STATE.ouro += v; STATE.stats.ouroGanho += v; return v; }
function darDrop(raridade, nivel) {
  STATE.stats.baus++;
  const d = gerarDrop(raridade, nivel);
  if (d.tipo === 'consumivel') { STATE.consumiveis[d.cid] = (STATE.consumiveis[d.cid] || 0) + d.qtd; return d; }
  if (STATE.inventario.length >= ECO.invMax) { d.vendido = valorVendaItem(d); STATE.ouro += d.vendido; }
  else STATE.inventario.push(d);
  return d;
}
function sortearCampeao() {
  const noElenco = new Set(STATE.mercs.map((m) => m.campeao).filter(Boolean));
  if (STATE.campeaoPendente) noElenco.add(STATE.campeaoPendente.campeao);
  let op = Object.keys(CAMPEOES).filter((id) => !STATE.campeoesObtidos.includes(id) && !noElenco.has(id));
  if (!op.length) op = Object.keys(CAMPEOES).filter((id) => !noElenco.has(id));
  if (!op.length) return null;
  return ajustarAscPorNivel(gerarCampeao(pick(op), nivelRecruta()));
}
function receberCampeao(m) {
  if (!STATE.campeoesObtidos.includes(m.campeao)) STATE.campeoesObtidos.push(m.campeao);
  if (STATE.mercs.length < limiteElenco()) {
    STATE.mercs.push(m);
    if (STATE.time.length < tamanhoTime()) STATE.time.push(m.id);
    ajustarTime();
    return 'elenco';
  }
  STATE.campeaoPendente = m;
  return 'pendente';
}

