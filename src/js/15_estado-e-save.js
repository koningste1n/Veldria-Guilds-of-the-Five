/* ============================ ESTADO E SAVE ============================ */
const SAVE_KEY = 'ligaDasLaminas.save.v1';   // mesma chave da Fase 1: a versão fica dentro do save
const VERSAO = 6;
const consumiveisZerados = () => Object.fromEntries(Object.keys(CONSUMIVEIS).map((k) => [k, 0]));
const criadorPadrao = () => ({ liberado: false, usado: false, sorteMult: 1, tempoMult: 1 });
const statsPadrao = () => ({
  lutas: 0, vitorias: 0, maiorGolpe: 0, lendarios: 0, temporadas: 0, copas: 0, promocoes: 0, expedicoes: 0, lideres: 0,
  dano: 0, cura: 0, abates: 0, mortes: 0, supremos: 0, baus: 0, ouroGanho: 0, tempoLuta: 0, torreLutas: 0, guardioes: 0,
});
const torrePadrao = () => ({ recorde: 0, inimigo: null, tributoDia: '', lutas: 0 });
const configPadrao = () => ({ vel: 1, auto: true, dif: 'normal', som: 0.7, musica: false, vibrar: true, lenta: true });
const statsMercPadrao = () => ({ lutas: 0, vitorias: 0, abates: 0, dano: 0, cura: 0, mvp: 0 });

function estadoNovo(guilda) {
  return {
    versao: VERSAO, criadoEm: Date.now(), ultimaVez: Date.now(), nextId: 1, guilda,
    ouro: 300, emblemas: 0, divisao: 0, mercs: [], time: [], capitao: null, inventario: [],
    reliquias: [], consumiveis: consumiveisZerados(), preparo: {}, sabedoriaAte: 0, mapaAtivo: false,
    expedicoes: [], campeoesObtidos: [], campeaoPendente: null,
    construcoes: { bilheteria: 1, campo: 1, taverna: 1, forja: 1, relogio: 0, acampamento: 1 }, cofre: 0,
    taverna: { ofertas: [], loja: [], lutas: 0, ultima: Date.now(), custo: ECO.custoRenovar },
    liga: null, amistoso: null,
    config: configPadrao(),
    stats: statsPadrao(), torre: torrePadrao(), historico: [],
    pity: { semEpico: 0, semLendario: 0 }, tutorial: TUTORIAL_LIGADO ? 0 : 99, tutorialVisto: -1,
    criador: criadorPadrao(), novidades: [],
  };
}
function iniciarJogoNovo(guilda) {
  STATE = estadoNovo(guilda);
  const iniciais = [gerarMerc('guardiao', 1, 'C'), gerarMerc('arqueira', 1, 'C'), gerarMerc('clerica', 1, 'C')];
  iniciais.forEach((m) => { m.tracos = m.tracos.filter((t) => TRACOS[t].pos); });
  STATE.mercs = iniciais;
  STATE.time = iniciais.map((m) => m.id);
  STATE.capitao = iniciais[1].id;
  STATE.consumiveis.pocaoFuria = 1;   // presente de boas-vindas para conhecer os consumíveis
  renovarTaverna(false);
  novaTemporada(1);
  salvar();
}
// importante = false para o salvamento periódico do ócio (a cópia na conta espera mais)
function salvar(importante = true) {
  if (!STATE) return;
  STATE.ultimaVez = Date.now();
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(STATE)); } catch (e) { /* armazenamento indisponível: o jogo segue normalmente */ }
  if (typeof marcarNuvem === 'function') marcarNuvem(importante);
}
function carregarLocal() {
  try { const s = localStorage.getItem(SAVE_KEY); if (s) return validarSave(JSON.parse(s)); } catch (e) { /* ignora */ }
  return null;
}

/* ---- validação e migração (Fase 1 → 2 → 3 → 4 → 4.1) ---- */
function itemValido(it) {
  if (!it || typeof it !== 'object') return false;
  if (it.tipo === 'pergaminho') return !!PERGAMINHOS[it.pid];
  if (it.tipo === 'reliquia') return !!RELIQUIAS[it.rid];
  return it.tipo in TIPOS_ITEM && RARIDADES[it.raridade] != null;
}
function normalizarItem(it) {
  if (it.aprim == null) it.aprim = 0;
  if (it.investido == null) it.investido = 0;
  if (!it.bonus) it.bonus = {};
  if (it.unico && !UNICOS[it.unico]) it.unico = null;
  return it;
}
function normalizarMerc(m) {
  if (!m.equip) m.equip = {};
  for (const k of Object.keys(TIPOS_ITEM)) {
    if (!itemValido(m.equip[k]) || m.equip[k].tipo !== k) m.equip[k] = null;
    else normalizarItem(m.equip[k]);
  }
  m.pergaminhos = Array.isArray(m.pergaminhos) ? m.pergaminhos.filter((it) => it && PERGAMINHOS[it.pid]) : [];
  m.ascensoes = clamp(m.ascensoes | 0, 0, 2);
  m.tracos = Array.isArray(m.tracos) ? m.tracos.filter((t) => TRACOS[t]) : [];
  if (!POT_INFO[m.pot]) m.pot = 'C';
  if (!Array.isArray(m.cresc) || m.cresc.length !== 4) m.cresc = rolarCresc(m.classe, m.pot);
  if (m.campeao && !CAMPEOES[m.campeao]) m.campeao = null;
  if (m.linha !== 'frente' && m.linha !== 'tras') m.linha = CLASSES_FRENTE.includes(m.classe) ? 'frente' : 'tras';
  if (!m.tatica) m.tatica = 'auto';
  m.nivel = clamp(m.nivel | 0 || 1, 1, 30);
  m.xp = Math.max(0, +m.xp || 0);
  m.stats = Object.assign(statsMercPadrao(), m.stats || {});
  return m;
}
const mercsValidos = (lista) => (Array.isArray(lista) ? lista : []).filter((m) => m && CLASSES[m.classe]).map(normalizarMerc);
function validarSave(s) {
  if (!s || typeof s !== 'object' || !s.guilda || !Array.isArray(s.mercs) || !Array.isArray(s.inventario)) throw new Error('Código de save inválido.');
  const versaoAntiga = s.versao || 1, daFase1 = versaoAntiga < 2;
  const st = Object.assign(estadoNovo(s.guilda), s);
  st.versao = VERSAO;
  st.config = Object.assign(configPadrao(), s.config || {});
  st.config.som = clamp(+st.config.som || 0, 0, 1);
  if (!DIFICULDADES[st.config.dif]) st.config.dif = 'normal';
  st.stats = Object.assign(statsPadrao(), s.stats || {});
  st.torre = Object.assign(torrePadrao(), s.torre || {});
  st.torre.recorde = Math.max(0, st.torre.recorde | 0);
  if (st.torre.inimigo) { st.torre.inimigo.mercs = mercsValidos(st.torre.inimigo.mercs); if (!st.torre.inimigo.mercs.length) st.torre.inimigo = null; }
  st.historico = Array.isArray(st.historico) ? st.historico.slice(-60) : [];
  st.pity = Object.assign({ semEpico: 0, semLendario: 0 }, s.pity || {});
  st.construcoes = Object.assign({ bilheteria: 1, campo: 1, taverna: 1, forja: 1, relogio: 0, acampamento: 1 }, s.construcoes || {});
  for (const k in CONSTRUCOES) st.construcoes[k] = clamp(st.construcoes[k] | 0, CONSTRUCOES[k].inicial ?? 1, CONSTRUCOES[k].max);
  st.consumiveis = Object.assign(consumiveisZerados(), s.consumiveis || {});
  for (const k in st.consumiveis) if (!CONSUMIVEIS[k]) delete st.consumiveis[k]; else st.consumiveis[k] = Math.max(0, st.consumiveis[k] | 0);
  st.criador = Object.assign(criadorPadrao(), s.criador || {});
  if (!st.preparo || typeof st.preparo !== 'object') st.preparo = {};
  st.divisao = clamp(st.divisao | 0, 0, DIVISOES.length - 1);
  st.emblemas = Math.max(0, Math.floor(+st.emblemas || 0));
  st.ouro = Math.max(0, Math.floor(+st.ouro || 0));
  st.mercs = mercsValidos(st.mercs);
  st.inventario = st.inventario.filter(itemValido).map(normalizarItem);
  st.reliquias = (Array.isArray(st.reliquias) ? st.reliquias : []).filter((it) => it && it.tipo === 'reliquia' && RELIQUIAS[it.rid]);
  st.campeoesObtidos = (Array.isArray(st.campeoesObtidos) ? st.campeoesObtidos : []).filter((id) => CAMPEOES[id]);
  st.expedicoes = (Array.isArray(st.expedicoes) ? st.expedicoes : []).filter((e) => e && EXPEDICOES[e.tipo] && st.mercs.some((m) => m.id === e.mercId));
  st.campeaoPendente = st.campeaoPendente && CLASSES[st.campeaoPendente.classe] ? normalizarMerc(st.campeaoPendente) : null;
  st.taverna = Object.assign({ ofertas: [], loja: [], lutas: 0, ultima: Date.now(), custo: ECO.custoRenovar }, st.taverna || {});
  st.taverna.ofertas = mercsValidos(st.taverna.ofertas);
  st.taverna.loja = (st.taverna.loja || []).filter(itemValido).map(normalizarItem);
  if (st.amistoso) { st.amistoso.mercs = mercsValidos(st.amistoso.mercs); if (!st.amistoso.mercs.length) st.amistoso = null; }
  if (st.liga) normalizarLiga(st);
  if (!Array.isArray(st.time)) st.time = [];
  // Novidades a mostrar: lista das fases que o jogador ainda não viu
  const nov = Array.isArray(s.novidades) ? s.novidades.slice() : (s.novidades ? [2] : []);
  if (versaoAntiga < 2 && !nov.includes(2)) nov.push(2);
  if (versaoAntiga < 3 && !nov.includes(3)) nov.push(3);
  if (versaoAntiga < 4 && !nov.includes(4)) nov.push(4);
  if (versaoAntiga < 5 && !nov.includes(5)) nov.push(5);
  if (versaoAntiga < 6 && !nov.includes(6) && (st.stats.lutas > 0 || st.tutorial >= 4)) nov.push(6);
  st.novidades = nov.filter((f) => f >= 2 && f <= 6).sort();
  if (versaoAntiga < 3 && st.tutorial >= 4) st.tutorial = 99;   // quem já viu o tutorial antigo não o repete
  // v6: tutorial progressivo. Quem já lutou (ou terminou o tutorial antigo) não repete nada.
  if (versaoAntiga < 6) { st.tutorial = (st.tutorial >= 4 || st.stats.lutas > 0) ? 99 : 0; st.tutorialVisto = -1; }
  st.tutorial = st.tutorial >= TUT_FIM + 1 ? 99 : clamp(st.tutorial | 0, 0, TUT_FIM);
  if (typeof st.tutorialVisto !== 'number') st.tutorialVisto = -1;
  if (!TUTORIAL_LIGADO) st.tutorial = 99;   // tutorial desligado: ninguém fica com menu travado
  return st;
}
function normalizarLiga(st) {
  const L = st.liga;
  if (!Array.isArray(L.guildas) || L.guildas.length !== 8 || !Array.isArray(L.calendario)) { st.liga = null; return; }
  for (const g of L.guildas) if (g.mercs) g.mercs = mercsValidos(g.mercs);
  if (L.nivelBase == null) L.nivelBase = clamp(DIVISOES[st.divisao].base + 2 * ((L.temporada || 1) - 1), 1, 30);
  if (L.divIdx == null) L.divIdx = st.divisao;
  if (!L.fase) {
    if (!L.encerrada) L.fase = 'liga';
    else { L.copa = null; L.pos = classificacao(L).findIndex((x) => x.i === 0) + 1; L.fase = 'fim'; }
  }
  if (L.copa && L.copa.lider) L.copa.lider.mercs = mercsValidos(L.copa.lider.mercs);
  if (!Array.isArray(L.resultados)) L.resultados = [];
}
function utf8ParaB64(str) { const bytes = new TextEncoder().encode(str); let bin = ''; bytes.forEach((b) => { bin += String.fromCharCode(b); }); return btoa(bin); }
function b64ParaUtf8(b64) { const bin = atob(b64); const bytes = Uint8Array.from(bin, (c) => c.charCodeAt(0)); return new TextDecoder().decode(bytes); }
function exportarCodigo() { STATE.ultimaVez = Date.now(); return 'LDL1:' + utf8ParaB64(JSON.stringify(STATE)); }
function importarCodigo(txt) {
  const limpo = String(txt || '').replace(/\s+/g, '');
  if (!limpo.startsWith('LDL1:')) throw new Error('O código precisa começar com LDL1:');
  let obj;
  try { obj = JSON.parse(b64ParaUtf8(limpo.slice(5))); } catch (e) { throw new Error('Não consegui ler o código. Confira se ele foi copiado inteiro.'); }
  return validarSave(obj);
}

/* ---- consultas de elenco ---- */
const mercPorId = (id) => STATE.mercs.find((m) => m.id === id);
const timeMercs = () => STATE.time.map(mercPorId).filter(Boolean);
const tamanhoTime = () => divAtual().time;
function nivelMedioTime() { const t = timeMercs(); const l = t.length ? t : STATE.mercs; return l.length ? l.reduce((s, m) => s + m.nivel, 0) / l.length : 1; }
function sorteGuilda() { return timeMercs().reduce((s, m) => s + atributos(m).sorte, 0) + somaReliquia('sorte'); }
const emExpedicao = (id) => !!(STATE && STATE.expedicoes && STATE.expedicoes.some((e) => e.mercId === id));
const ajustarAscPorNivel = (m) => { m.ascensoes = Math.max(m.ascensoes || 0, m.nivel > 20 ? 2 : m.nivel > 10 ? 1 : 0); return m; };
// Mantém o time válido: sem repetidos, sem quem está em expedição, no tamanho da divisão e com capitão
function ajustarTime() {
  STATE.time = [...new Set(STATE.time)].filter((id) => mercPorId(id) && !emExpedicao(id));
  const n = tamanhoTime();
  if (STATE.time.length > n) {
    const t = STATE.time.slice(0, n);
    if (STATE.time.includes(STATE.capitao) && !t.includes(STATE.capitao)) t[n - 1] = STATE.capitao;
    STATE.time = t;
  }
  if (!STATE.time.includes(STATE.capitao)) STATE.capitao = STATE.time[0] ?? null;
}
const garantirCapitao = ajustarTime;
function preencherTime() {
  ajustarTime();
  for (const m of STATE.mercs) {
    if (STATE.time.length >= tamanhoTime()) break;
    if (!STATE.time.includes(m.id) && !emExpedicao(m.id)) STATE.time.push(m.id);
  }
  ajustarTime();
}
function devolverAoInventario(it) {
  if (STATE.inventario.length < ECO.invMax) { STATE.inventario.push(it); return true; }
  STATE.ouro += valorVendaItem(it); return false;
}
// Procura um item no inventário, nos equipamentos ou nas relíquias da guilda
function acharItem(id) {
  let it = STATE.inventario.find((i) => i.id === id);
  if (it) return { it, onde: 'inv' };
  for (const m of STATE.mercs) {
    for (const k of Object.keys(TIPOS_ITEM)) if (m.equip[k] && m.equip[k].id === id) return { it: m.equip[k], onde: 'merc', m, slot: k };
    const p = m.pergaminhos.find((x) => x.id === id); if (p) return { it: p, onde: 'perg', m };
  }
  it = STATE.reliquias.find((i) => i.id === id);
  return it ? { it, onde: 'reliquia' } : null;
}

