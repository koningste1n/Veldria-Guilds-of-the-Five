/* ============================ INÍCIO ============================ */
let ultimoTick = Date.now(), ultimoSave = Date.now();
const expAvisadas = new Set();
function tickOcioso() {
  if (!STATE) return;
  const agora = Date.now(), min = (agora - ultimoTick) / 60000;
  ultimoTick = agora;
  if (!document.hidden && min < 0.1) STATE.stats.tempoJogo += min * 60000;   // tempo de jogo: só com a tela aberta
  const r = aplicarTempo(min);
  if (min > 5) mostrarResumoOffline(r);           // voltou depois de um tempo em segundo plano
  else if (r.subidas.length) {
    for (const s of r.subidas) toast(`${s.m.nome} subiu para o nível ${s.para} no Campo de Treino!`, 'ok');
    if (!Luta) { renderTela(); atualizarModais(); }
  }
  let voltou = false;
  for (const e of expedicoesProntas()) {
    if (expAvisadas.has(e.id)) continue;
    expAvisadas.add(e.id); voltou = true;
    if (min <= 5) { const m = mercPorId(e.mercId); if (m) toast(`${m.nome} voltou ${EXPEDICOES[e.tipo].da}! Colete na Guilda.`, 'ok'); }
  }
  if (voltou && UI.aba === 'guilda' && !Luta && !UI.modais.length) renderTela();
  if (verificarTaverna() && UI.aba === 'mercado' && !Luta) renderTela();
  atualizarVivos();
  if (agora - ultimoSave > 30000) { salvar(false); ultimoSave = agora; }
}
// Abre um save (deste aparelho, da conta ou importado): ganhos offline, liga, time e tela
function entrarNoJogo(st, resumo = true) {
  STATE = st;
  const r = aplicarTempo((Date.now() - STATE.ultimaVez) / 60000);
  verificarTaverna();
  if (!STATE.liga) novaTemporada(1);
  preencherTime(); ajustarReliquias();
  expAvisadas.clear();
  for (const e of expedicoesProntas()) expAvisadas.add(e.id);
  salvar();
  ultimoTick = Date.now();
  abrirApp();
  if (resumo && !temNovidades()) mostrarResumoOffline(r);
}
function start(data) {
  let st = null, veioDoHot = false;
  if (data && data.save) { try { st = validarSave(data.save); veioDoHot = true; } catch (e) { st = null; } }
  if (!st) st = carregarLocal();
  Nuvem.localEm = st ? st.ultimaVez || 0 : 0;
  if (st) entrarNoJogo(st, !veioDoHot); else mostrarCriacao();
  ultimoTick = Date.now();
  setInterval(tickOcioso, 1000);
  setInterval(animarSprites, 220);
  setInterval(cicloNuvem, 5000);
  document.addEventListener('visibilitychange', () => { if (document.hidden) { salvar(); enviarNuvem(); } });
  window.addEventListener('pagehide', () => { salvar(); enviarNuvem(); });
  iniciarNuvem();
}
try { window.claude?.hot?.snapshot?.(() => ({ save: STATE })); } catch (e) { /* fora do visualizador */ }
if (window.claude?.hot?.ready) window.claude.hot.ready(start); else start(window.claude?.hot?.data ?? {});

