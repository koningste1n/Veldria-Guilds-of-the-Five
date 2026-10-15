/* ============================ OCIOSO ============================ */
const tempoMult = () => (STATE && STATE.criador && STATE.criador.tempoMult) || 1;
const multOcio = () => (1 + somaReliquia('ocio')) * tempoMult();
const capOfflineMin = () => (8 + 2 * (STATE.construcoes.relogio || 0) + somaReliquia('offline')) * 60;
const taxaBilheteria = () => STATE.construcoes.bilheteria * divAtual().mult * multOcio();   // ouro/min
const capCofre = () => Math.round(taxaBilheteria() * capOfflineMin());
const xpCampoMin = () => 2 * STATE.construcoes.campo * multOcio();
// Construções com teto por divisão (Acampamento): o nível máximo cresce conforme o jogador sobe de divisão
function nivelMaxConstrucao(id) { const C = CONSTRUCOES[id]; return C.maxDiv ? Math.min(C.max, C.maxDiv[STATE.divisao] ?? C.max) : C.max; }
function divisaoParaNivel(id, n) { const C = CONSTRUCOES[id]; if (!C.maxDiv) return null; const d = C.maxDiv.findIndex((x) => x >= n); return d < 0 ? null : DIVISOES[d]; }
const maxExpedicoes = () => slotsExpedicao(STATE.construcoes.acampamento || 1);
const limiteElenco = () => elencoDoAcampamento(STATE.construcoes.acampamento || 1);
function custoMelhoria(id) { const C = CONSTRUCOES[id]; return Math.round(C.base * Math.pow(C.fator, STATE.construcoes[id] - (C.inicial ?? 1))); }

// Aplica ganhos de "minutos" passados (usado a cada segundo e ao voltar ao jogo)
function aplicarTempo(minutos) {
  minutos = clamp(minutos, 0, capOfflineMin());
  const res = { minutos, ouro: 0, xp: 0, subidas: [], sabedoria: false };
  if (minutos <= 0) return res;
  const antes = STATE.cofre;
  STATE.cofre = Math.max(STATE.cofre, Math.min(capCofre(), STATE.cofre + taxaBilheteria() * minutos));
  res.ouro = Math.max(0, STATE.cofre - antes);
  res.xp = xpCampoMin() * minutos;
  // O Tônico de Sabedoria só conta pela parte do período em que estava ativo
  const agora = Date.now(), ini = agora - minutos * 60000;
  const fracSab = STATE.sabedoriaAte > ini ? clamp((Math.min(STATE.sabedoriaAte, agora) - ini) / Math.max(1, agora - ini), 0, 1) : 0;
  res.sabedoria = fracSab > 0;
  const mult = (1 + somaReliquia('xp')) * (1 + 0.5 * fracSab);
  for (const m of STATE.mercs) { const s = darXp(m, res.xp, mult); if (s) res.subidas.push(s); }
  return res;
}
function verificarTaverna() {
  if (Date.now() - STATE.taverna.ultima >= ECO.minutosRenovar * 60000) { renovarTaverna(false); return true; }
  return false;
}

