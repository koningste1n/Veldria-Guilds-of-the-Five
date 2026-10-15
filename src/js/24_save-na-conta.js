/* ============================ SAVE NA CONTA (Fase 4.1) ============================
   Quando o jogo roda dentro do Claude, com a pessoa conectada e com permissão de escrita,
   o progresso também fica guardado na conta dela: um documento privado em
   data/users/<id>/save (nem o dono do jogo consegue ler). Assim o progresso
   sobrevive a limpar o navegador e acompanha a pessoa entre aparelhos.
   Sem isso (fora do Claude, sem login ou só com permissão de leitura), o jogo
   segue salvando neste aparelho, como sempre. */
const Nuvem = {
  estado: 'local',            // local | conectando | ativa | sem-permissao
  db: null, ref: null, sessao: Math.random().toString(36).slice(2, 10),
  localEm: 0,                 // ultimaVez do save local ao abrir (antes de esta visita mexer nele)
  sujo: 0, enviando: false, pausada: false, ultimoEnvio: 0, ultimoTexto: '', ultimaNuvem: 0,
  erro: '', cancelar: null, pendente: null, avisoDepois: null,
};
const TAM_MAX_NUVEM = 240000;   // o documento aceita até 256 KiB
const esperar = (ms) => new Promise((r) => setTimeout(r, ms));
const lutaRolando = () => !!(Luta && Luta.ativo);

function resumoSave(st) {
  const n = Math.max(1, st.mercs.length);
  return {
    guilda: st.guilda && st.guilda.nome ? st.guilda.nome : 'Guilda', divisao: st.divisao | 0,
    temporada: st.liga ? st.liga.temporada : 1, rodada: st.liga ? st.liga.rodada | 0 : 0, ouro: Math.floor(st.ouro || 0), mercs: st.mercs.length,
    nivel: Math.round(st.mercs.reduce((a, m) => a + (m.nivel || 1), 0) / n), torre: st.torre ? st.torre.recorde | 0 : 0,
  };
}
function docParaSave(snap) {
  if (!snap || !snap.exists) return null;
  const d = snap.data() || {};
  if (typeof d.save !== 'string') return null;
  try {
    const st = validarSave(JSON.parse(d.save));
    return { st, ultimaVez: +d.ultimaVez || st.ultimaVez || 0, criadoEm: +d.criadoEm || st.criadoEm || 0, sessao: d.sessao || '' };
  } catch (e) { return null; }
}

// Liga a nuvem depois que o jogo já abriu com o save local (nunca atrasa a primeira tela)
async function iniciarNuvem() {
  const c = window.claude;
  if (!c || typeof c.use !== 'function') return;
  Nuvem.estado = 'conectando'; atualizarStatusNuvem();
  let db = null, user = null;
  try { [db, user] = await Promise.all([c.use('db'), c.use('user')]); } catch (e) { /* segue só neste aparelho */ }
  const uid = user ? await user.id() : null;
  const podeEscrever = user ? await user.can('data.write') : null;
  if (!db || !uid || podeEscrever === false) { Nuvem.estado = podeEscrever === false && uid ? 'sem-permissao' : 'local'; atualizarStatusNuvem(); return; }
  Nuvem.db = db;
  Nuvem.ref = db.doc(`data/users/${uid}/save`);
  let snap = null;
  for (let t = 0; t < 2 && !snap; t++) {
    try { snap = await Nuvem.ref.get(); }
    catch (e) { if (t === 0 && e && e.code === 'unavailable') await esperar(700 + Math.random() * 900); else break; }
  }
  if (!snap) { Nuvem.estado = 'local'; atualizarStatusNuvem(); return; }
  while (lutaRolando()) await esperar(1000);   // não troca o jogo no meio de uma luta
  Nuvem.estado = 'ativa';
  await reconciliarNuvem(docParaSave(snap));
  if (Nuvem.estado === 'ativa') escutarNuvem();
  atualizarStatusNuvem();
}

// Decide entre o save deste aparelho e o da conta
async function reconciliarNuvem(remoto) {
  if (!remoto) { if (STATE) { await enviarNuvem(true); avisarNuvemAtiva(); } return; }   // conta vazia: sobe o deste aparelho
  Nuvem.ultimaNuvem = remoto.ultimaVez;
  if (!STATE) { fecharTodosModais(); entrarNoJogo(remoto.st); Nuvem.ultimoTexto = ''; toast('Progresso carregado da sua conta.', 'ok'); return; }
  if (remoto.criadoEm && remoto.criadoEm === STATE.criadoEm) {   // mesma guilda
    if (remoto.ultimaVez > Nuvem.localEm + 1500) { usarRemoto(remoto, 'Progresso atualizado com o que estava salvo na sua conta.'); return; }
    await enviarNuvem(true); avisarNuvemAtiva(); return;
  }
  perguntarQualSave(remoto);                                      // guildas diferentes: a pessoa escolhe
}
function usarRemoto(remoto, msg) {
  fecharTodosModais();
  entrarNoJogo(remoto.st);
  Nuvem.ultimoTexto = ''; Nuvem.pausada = false; Nuvem.pendente = null; Nuvem.ultimaNuvem = remoto.ultimaVez;
  if (msg) toast(msg, 'ok');
}
function avisarNuvemAtiva() {
  let avisado = false;
  try { avisado = localStorage.getItem('ligaDasLaminas.nuvemAvisada') === '1'; localStorage.setItem('ligaDasLaminas.nuvemAvisada', '1'); } catch (e) { /* ignora */ }
  if (!avisado && Nuvem.estado === 'ativa') toast('Seu progresso agora também fica salvo na sua conta Claude.', 'ok');
}

function cartaoSave(titulo, r, quando, act) {
  const div = DIVISOES[clamp(r.divisao | 0, 0, DIVISOES.length - 1)];
  return `<div class="card"><div class="card-corpo"><span class="rot">${titulo}</span><b>${esc(r.guilda)}</b>
    <small>Divisão ${div.nome} · Temporada ${r.temporada}${r.rodada ? `, rodada ${r.rodada}` : ''} · ${fmt(r.ouro || 0)} ouro</small>
    <small>${r.mercs} mercenários (nível médio ${r.nivel})${r.torre ? ` · Torre: andar ${r.torre}` : ''}</small>
    <small>Salvo em ${new Date(quando).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</small></div>
    <button class="btn primario" data-act="${act}">Continuar este</button></div>`;
}
function perguntarQualSave(remoto) {
  Nuvem.pendente = remoto; Nuvem.pausada = true;
  abrirModal(`<h2>Dois progressos encontrados</h2>
    <p class="dica">Sua conta Claude e este aparelho têm guildas diferentes. Escolha qual continuar: o outro será substituído.</p>
    <div class="lista">${cartaoSave('Na sua conta', resumoSave(remoto.st), remoto.ultimaVez, 'nuvem-usar-conta')}${cartaoSave('Neste aparelho', resumoSave(STATE), Nuvem.localEm || STATE.ultimaVez, 'nuvem-usar-aparelho')}</div>`, { semFechar: true, dados: { nuvem: true } });
}

// Outra aba ou aparelho salvou depois desta: pausa os envios e pergunta
function escutarNuvem() {
  if (Nuvem.cancelar || !Nuvem.ref) return;
  Nuvem.cancelar = Nuvem.ref.onSnapshot((snap) => {
    if (!snap.exists || snap.metadata.hasPendingWrites || !STATE) return;
    const d = snap.data() || {};
    if (!d.sessao || d.sessao === Nuvem.sessao || (+d.ultimaVez || 0) <= Nuvem.ultimaNuvem) return;
    Nuvem.ultimaNuvem = +d.ultimaVez || 0;
    Nuvem.pausada = true;
    Nuvem.avisoDepois = snap;
    if (!lutaRolando()) mostrarAvisoOutroAparelho();
  }, () => { Nuvem.cancelar = null; });
}
function mostrarAvisoOutroAparelho() {
  const snap = Nuvem.avisoDepois; Nuvem.avisoDepois = null;
  const remoto = docParaSave(snap); if (!remoto) { Nuvem.pausada = false; return; }
  Nuvem.pendente = remoto;
  if (modalCom('nuvem')) return;
  abrirModal(`<h2>Jogo salvo em outro lugar</h2>
    <p class="dica">Seu progresso foi salvo em outro aparelho ou aba depois desta. Para não perder nada, escolha com qual continuar.</p>
    <div class="lista">${cartaoSave('O mais recente (outro aparelho)', resumoSave(remoto.st), remoto.ultimaVez, 'nuvem-usar-conta')}${cartaoSave('Esta aba', resumoSave(STATE), STATE.ultimaVez, 'nuvem-usar-aparelho')}</div>`, { semFechar: true, dados: { nuvem: true } });
}

// Envio: logo depois de ações (com folga de 8 s) e, no ócio, no máximo a cada 90 s
function marcarNuvem(importante) { if (Nuvem.estado === 'ativa') Nuvem.sujo = Math.max(Nuvem.sujo, importante ? 2 : 1); }
function cicloNuvem() {
  if (Nuvem.avisoDepois && !lutaRolando()) mostrarAvisoOutroAparelho();
  if (Nuvem.estado !== 'ativa' || Nuvem.pausada || Nuvem.enviando || !STATE || !Nuvem.sujo) return;
  const desde = Date.now() - Nuvem.ultimoEnvio;
  if ((Nuvem.sujo >= 2 && desde >= 8000) || desde >= 90000) enviarNuvem();
}
async function enviarNuvem(forcar = false) {
  if (Nuvem.estado !== 'ativa' || !STATE || Nuvem.enviando || (Nuvem.pausada && !forcar)) return false;
  const texto = JSON.stringify(STATE);
  if (texto === Nuvem.ultimoTexto) { Nuvem.sujo = 0; return true; }
  if (texto.length > TAM_MAX_NUVEM) { Nuvem.erro = 'grande'; Nuvem.sujo = 0; atualizarStatusNuvem(); return false; }
  const sujoAntes = Nuvem.sujo;
  Nuvem.enviando = true; Nuvem.sujo = 0;
  try {
    await Nuvem.ref.set({ v: 1, save: texto, ultimaVez: STATE.ultimaVez, criadoEm: STATE.criadoEm, sessao: Nuvem.sessao, resumo: resumoSave(STATE) });
    Nuvem.ultimoTexto = texto; Nuvem.ultimoEnvio = Date.now(); Nuvem.ultimaNuvem = STATE.ultimaVez; Nuvem.erro = ''; Nuvem.pausada = false;
    return true;
  } catch (e) {
    const code = (e && e.code) || 'unavailable';
    if (code === 'invalid_argument') Nuvem.estado = 'sem-permissao';
    else if (['revoked', 'not_granted', 'capability_disabled', 'capability_removed', 'quota_exceeded'].includes(code)) Nuvem.estado = 'local';
    else { Nuvem.sujo = Math.max(Nuvem.sujo, sujoAntes || 1); Nuvem.ultimoEnvio = Date.now(); Nuvem.erro = code; }   // tenta de novo mais tarde
    return false;
  } finally {
    Nuvem.enviando = false;
    if (Nuvem.estado !== 'ativa' && Nuvem.cancelar) { Nuvem.cancelar(); Nuvem.cancelar = null; }
    atualizarStatusNuvem();
  }
}
function apagarNuvem() {
  if (Nuvem.estado !== 'ativa' || !Nuvem.ref) return;
  Nuvem.ultimoTexto = ''; Nuvem.sujo = 0;
  Nuvem.ref.delete().catch(() => { /* fica para o próximo envio sobrescrever */ });
}

function textoStatusNuvem() {
  switch (Nuvem.estado) {
    case 'ativa': {
      const min = Nuvem.ultimoEnvio ? Math.floor((Date.now() - Nuvem.ultimoEnvio) / 60000) : null;
      const quando = min === null ? 'aguardando a primeira cópia' : min < 1 ? 'última cópia agora há pouco' : `última cópia há ${min} min`;
      return `Salvo neste aparelho e na sua conta Claude (${quando}). Você pode continuar em outro aparelho entrando com a mesma conta.${Nuvem.erro === 'grande' ? ' O save ficou grande demais para a conta: use Exportar save.' : ''}`;
    }
    case 'conectando': return 'Salvo neste aparelho. Conectando à sua conta Claude…';
    case 'sem-permissao': return 'Salvo neste aparelho. Este link não permite guardar o progresso na sua conta, então exporte o código de vez em quando para não perder.';
    default: return 'O jogo salva sozinho neste aparelho. Exporte o código para guardar uma cópia ou continuar em outro lugar.';
  }
}
function atualizarStatusNuvem() {
  const el = document.getElementById('status-nuvem'); if (el) el.textContent = textoStatusNuvem();
  const b = document.getElementById('btn-nuvem'); if (b) b.hidden = Nuvem.estado !== 'ativa';
}

