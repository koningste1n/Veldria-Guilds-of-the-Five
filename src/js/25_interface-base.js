/* ============================ INTERFACE: BASE ============================ */
const UI = {
  aba: 'guilda', filtroInv: 'todos', modais: [], criacao: null, ultimoDrop: null, toquesVersao: 0, expSel: new Set(), casaSel: null,
  criador: { merc: null, tipo: 'arma', raridade: 4, nivel: 10, unico: null, perg: 'furiaDragao', rel: 'penaFenix' },
};
let Luta = null;

/* ---- canvases de pixel no DOM ---- */
const PROP_RETRATO = RETRATO.h / RETRATO.w;
// Na interface os personagens ficam de frente (vista 'frente'); use data-vista="lado" para o perfil clássico.
const canvasLook = (look, w, extra = '') => `<canvas class="px" data-look="${look}" ${/data-vista/.test(extra) ? '' : 'data-vista="frente"'} width="${RETRATO.w}" height="${RETRATO.h}" style="width:${w}px;height:${Math.round(w * PROP_RETRATO)}px" ${extra} aria-hidden="true"></canvas>`;
const canvasBrasao = (b, tam) => `<canvas class="px" data-brasao="${b.cor1}|${b.cor2}|${b.simbolo}" width="14" height="14" style="width:${tam}px;height:${tam}px" aria-hidden="true"></canvas>`;
const canvasIcone = (nome, tam, cores) => `<canvas class="px" data-icone="${nome}"${cores ? ` data-cores='${JSON.stringify(cores)}'` : ''} width="12" height="12" style="width:${tam}px;height:${tam}px" aria-hidden="true"></canvas>`;
function desenharEm(cv, src) {
  if (cv.width !== src.width) cv.width = src.width;
  if (cv.height !== src.height) cv.height = src.height;
  const c = cv.getContext('2d'); c.imageSmoothingEnabled = false; c.clearRect(0, 0, cv.width, cv.height); c.drawImage(src, 0, 0);
}
function hidratar(raiz = document) {
  $$('canvas[data-look]', raiz).forEach((cv) => desenharEm(cv, retrato(cv.dataset.look, 0, cv.dataset.vista || 'lado')));
  $$('canvas[data-brasao]', raiz).forEach((cv) => { const [cor1, cor2, simbolo] = cv.dataset.brasao.split('|'); desenharEm(cv, brasaoCanvas({ cor1, cor2, simbolo })); });
  $$('canvas[data-icone]', raiz).forEach((cv) => {
    const src = iconeCanvas(cv.dataset.icone, cv.dataset.cores ? JSON.parse(cv.dataset.cores) : null);
    desenharEm(cv, src);
    const w = parseFloat(cv.style.width); if (src.width !== src.height) cv.style.height = `${Math.round(w * src.height / src.width)}px`;
  });
}
// Respiração dos personagens na interface (4 quadros de "idle", fora de fase entre si)
let frameAnim = 0;
function animarSprites() {
  frameAnim = (frameAnim + 1) % QUADROS_POR_ANIM.idle;
  $$('canvas[data-look]:not([data-parado])').forEach((cv, i) => desenharEm(cv, retrato(cv.dataset.look, (frameAnim + i) % QUADROS_POR_ANIM.idle, cv.dataset.vista || 'lado')));
}

/* ---- toasts e modais ---- */
function toast(msg, tipo = '') {
  if (tipo === 'erro') somTocar('erro');
  const el = document.createElement('div'); el.className = 'toast ' + tipo; el.textContent = msg;
  $('#toasts').appendChild(el);
  while ($('#toasts').children.length > 3) $('#toasts').firstChild.remove();
  setTimeout(() => el.remove(), 2600);
}
function abrirModal(html, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'modal-fundo ' + (opts.classe || '');
  wrap.innerHTML = `<div class="modal" role="dialog" aria-modal="true">${opts.semFechar ? '' : '<button class="modal-x" data-act="fechar-modal" aria-label="Fechar">×</button>'}<div class="modal-corpo">${html}</div></div>`;
  wrap.dados = opts.dados || {};
  wrap.semFechar = !!opts.semFechar;
  if (!opts.semFechar) wrap.addEventListener('click', (e) => { if (e.target === wrap) fecharModal(); });
  $('#modais').appendChild(wrap); UI.modais.push(wrap); hidratar(wrap);
  document.body.classList.add('com-modal');
  return wrap;
}
function fecharModal() {
  const w = UI.modais.pop(); if (w) w.remove();
  if (!UI.modais.length) document.body.classList.remove('com-modal');
}
function fecharTodosModais() { while (UI.modais.length) fecharModal(); }
function atualizarModal(w, html) {
  if (!w) return;
  const m = w.querySelector('.modal'), topo = m.scrollTop;
  w.querySelector('.modal-corpo').innerHTML = html; hidratar(w);
  m.scrollTop = topo;
}
const modalCom = (chave) => UI.modais.find((w) => w.dados[chave]);
function removerModal(w) { UI.modais.splice(UI.modais.indexOf(w), 1); w.remove(); if (!UI.modais.length) document.body.classList.remove('com-modal'); }
// Redesenha os modais abertos que mostram dados vivos (ficha, forja, item, criador…)
function atualizarModais() {
  for (const w of [...UI.modais]) {
    const d = w.dados;
    if (d.ficha) {
      const m = d.modo === 'oferta' ? STATE.taverna.ofertas.find((o) => o.id === d.mercId) : mercPorId(d.mercId);
      if (!m) removerModal(w); else atualizarModal(w, htmlFicha(m, d.modo));
    } else if (d.forja) atualizarModal(w, htmlForja());
    else if (d.item) { const a = acharItem(d.item); if (!a) removerModal(w); else atualizarModal(w, htmlItem(a)); }
    else if (d.consumivel) atualizarModal(w, htmlConsumivel(d.consumivel));
    else if (d.criador) atualizarModal(w, htmlCriador());
    else if (d.reliquias) atualizarModal(w, htmlEscolhaReliquia());
    else if (d.estatisticas) atualizarModal(w, htmlEstatisticas());
    else if (d.intervalo) atualizarModal(w, htmlIntervalo());
  }
}

/* ---- topo, abas e telas ---- */
const ABAS = [['guilda', 'Guilda'], ['elenco', 'Elenco'], ['mercado', 'Mercado'], ['liga', 'Liga'], ['torre', 'Torre'], ['inventario', 'Itens']];
function render() {
  if (!STATE) return;
  renderTopo(); renderAbas(); renderTela();
}
function renderTopo() {
  const L = STATE.liga, d = divAtual();
  $('#topo').innerHTML = `
    <div class="topo-guilda">${canvasBrasao(STATE.guilda, 30)}<div><b class="topo-nome">${esc(STATE.guilda.nome)}</b><small><span style="color:${d.cor}">${d.nome}</span> · Temporada ${L.temporada}</small></div></div>
    ${STATE.criador.usado ? `<span class="selo-criador" title="Save editado no Modo Criador">${canvasIcone('criador', 16)}</span>` : ''}
    <div class="topo-rec">
      <span title="Ouro">${canvasIcone('moeda', 16)}<b class="ouro" id="topo-ouro">${fmt(STATE.ouro)}</b></span>
      <span title="Emblemas">${canvasIcone('emblema', 16)}<b class="emb" id="topo-emb">${fmt(STATE.emblemas)}</b></span>
    </div>
    ${liberado('config') ? `<button class="btn-icone" data-act="config" aria-label="Configurações">${canvasIcone('engrenagem', 20)}</button>` : ''}`;
  hidratar($('#topo'));
}
function avisoAba(id) {
  if (id === 'guilda') return expedicoesProntas().length > 0 || Math.floor(STATE.cofre) >= capCofre();
  if (id === 'liga') return STATE.liga.fase !== 'liga';
  if (id === 'mercado') return !!STATE.campeaoPendente;
  if (id === 'torre') return tributoDisponivel();
  return false;
}
function renderAbas() {
  $('#abas').innerHTML = `<div class="wrap">${ABAS.filter(([id]) => liberado(id)).map(([id, n]) => `<button class="aba ${UI.aba === id ? 'ativa' : ''}" data-act="aba" data-id="${id}">${avisoAba(id) ? '<i class="ponto" aria-label="novidade"></i>' : ''}${canvasIcone(id, 24, UI.aba === id ? { a: '#f0c24b', b: '#b8892a' } : { a: '#a99bb8', b: '#6f6383' })}<span>${n}</span></button>`).join('')}</div>`;
  hidratar($('#abas'));
  if (tutorialAtivo()) $$('.aba').forEach((el) => el.classList.toggle('destaque', el.dataset.id === TUTORIAL[STATE.tutorial].aba && UI.aba !== el.dataset.id));
}
function renderTela() {
  const telas = { guilda: telaGuilda, elenco: telaElenco, mercado: telaMercado, liga: telaLiga, torre: telaTorre, inventario: telaInventario };
  $('#tela').innerHTML = telas[UI.aba]();
  hidratar($('#tela'));
}
let avisosAntes = '';
function atualizarVivos() {
  if (!STATE || $('#app').hidden) return;
  const ouro = $('#topo-ouro'); if (ouro) ouro.textContent = fmt(STATE.ouro);
  const emb = $('#topo-emb'); if (emb) emb.textContent = fmt(STATE.emblemas);
  const cofre = Math.floor(STATE.cofre), cap = capCofre();
  const barra = $('#cofre-barra'); if (barra) barra.style.width = `${Math.min(100, (cofre / cap) * 100)}%`;
  const txt = $('#cofre-txt'); if (txt) txt.textContent = `${fmt(cofre)} / ${fmt(cap)}`;
  const btn = $('#btn-coletar'); if (btn) { btn.disabled = cofre < 1; btn.textContent = `Coletar +${fmt(cofre)} ouro`; }
  const tt = $('#taverna-timer'); if (tt) tt.textContent = textoTimerTaverna();
  for (const el of $$('[data-exp-fim]')) {
    const falta = +el.dataset.expFim - Date.now(), tot = +el.dataset.expTot;
    const bar = el.querySelector('i'); if (bar) bar.style.width = `${clamp(100 - (falta / tot) * 100, 0, 100)}%`;
    const t = el.parentElement.querySelector('[data-exp-txt]'); if (t) t.textContent = falta > 0 ? `volta em ${fmtTempo(falta)}` : 'voltou!';
    if (falta <= 0 && !el.dataset.pronta) { el.dataset.pronta = '1'; if (UI.aba === 'guilda' && !Luta && !UI.modais.length) renderTela(); }
  }
  const sab = $('#sab-timer'); if (sab) sab.textContent = sabedoriaRestante() > 0 ? fmtTempo(sabedoriaRestante()) : 'acabou';
  const av = ABAS.map(([id]) => +avisoAba(id)).join('');
  if (av !== avisosAntes) { avisosAntes = av; renderAbas(); }
}

/* ---- componentes reutilizados ---- */
const badgePot = (p) => `<span class="pot" style="--c:${POT_INFO[p].cor}" title="Potencial ${p}">${p}</span>`;
const chipTraco = (t) => `<span class="chip ${TRACOS[t].pos ? '' : 'neg'}" title="${TRACOS[t].desc}">${TRACOS[t].nome} <span class="muted">${TRACOS[t].desc}</span></span>`;
const lookMeu = (m) => lookDe(m, STATE.guilda.cor1, STATE.guilda.cor2);
const estrelas = (n, tam = 10) => (n ? `<span class="estrelas" title="${n} ${n === 1 ? 'Ascensão' : 'Ascensões'}">${Array.from({ length: n }, () => canvasIcone('estrela', tam)).join('')}</span>` : '');
const nomeMerc = (m) => `<span class="${m.campeao ? 'nome-campeao' : ''}">${esc(m.nome)}</span>`;
const precoBtn = (v, emb) => `${canvasIcone(emb ? 'emblema' : 'moeda', 14)} ${fmt(v)}`;

// Itens: equipamentos, pergaminhos, relíquias e consumíveis (vindos de baús)
const iconeItem = (it) => (it.tipo === 'consumivel' ? CONSUMIVEIS[it.cid].icone : it.icone || it.tipo);
function coresItem(it) {
  const c = RARIDADES[it.raridade ?? 0].cor;
  if (it.tipo === 'pergaminho') return { w: c, x: escurecer(c, 0.5) };
  if (it.tipo === 'reliquia') return { c, d: escurecer(c, 0.45) };
  return null;
}
const iconeDeItem = (it, tam) => canvasIcone(iconeItem(it), tam, coresItem(it));
function tipoItemTxt(it) {
  if (it.tipo === 'pergaminho') return `Pergaminho ${PERGAMINHOS[it.pid].tipo === 'ativa' ? 'ativo' : 'passivo'}`;
  if (it.tipo === 'reliquia') return 'Relíquia da guilda';
  if (it.tipo === 'consumivel') return 'Consumível';
  return `${TIPOS_ITEM[it.tipo]} · nv. ${it.nivel}`;
}
function textoItem(it, s = null) {
  if (it.tipo === 'pergaminho') { const P = PERGAMINHOS[it.pid]; return P.desc(s) + (P.tipo === 'ativa' ? ` Recarga ${P.cd} s.` : ''); }
  if (it.tipo === 'reliquia') return RELIQUIAS[it.rid].desc;
  if (it.tipo === 'consumivel') return CONSUMIVEIS[it.cid].desc;
  return Object.entries(bonusEfetivo(it)).map(([k, v]) => txtBonus(k, v)).join(' · ');
}
const nomeDeItem = (it) => (it.tipo === 'consumivel' ? `${CONSUMIVEIS[it.cid].nome} ×${it.qtd}` : nomeItem(it));
function cardItem(it, acoes = '', s = null) {
  const R = RARIDADES[it.raridade ?? 0];
  return `<div class="card item" style="--rc:${R.cor}">
    <span class="item-ico">${iconeDeItem(it, 36)}</span>
    <div class="card-corpo"><b style="color:${R.cor}">${esc(nomeDeItem(it))}</b><small>${it.tipo === 'consumivel' ? 'Consumível · foi para a bolsa' : `${R.nome} · ${tipoItemTxt(it)}`}</small>
      <small class="bonus">${textoItem(it, s)}</small>
      ${it.tipo === 'pergaminho' ? `<small>Serve para: ${txtPapeis(it.pid)}</small>` : ''}
      ${it.unico ? `<small class="unico">★ ${UNICOS[it.unico].nome}: ${UNICOS[it.unico].desc}</small>` : ''}</div>
    ${acoes}
  </div>`;
}
function rotuloTile(it) {
  if (ehEquipamento(it)) return `nv. ${it.nivel}${it.aprim ? ` +${it.aprim}` : ''}`;
  if (it.tipo === 'pergaminho') return PERGAMINHOS[it.pid].tipo === 'ativa' ? 'ativo' : 'passivo';
  return 'relíquia';
}
const tileItem = (it) => `<button class="tile r${it.raridade}" style="--rc:${RARIDADES[it.raridade].cor}" data-act="abrir-item" data-id="${it.id}" aria-label="${esc(nomeItem(it))}">${iconeDeItem(it, 36)}<small>${rotuloTile(it)}</small></button>`;

