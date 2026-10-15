/* ============================ MODO CRIADOR ============================
   Liberado com 7 toques na versão (Configurações). É o "trainer" do jogo:
   edita recursos, mercenários, itens, sorte, tempo e liga. */
function htmlCriador() {
  const C = STATE.criador, U = UI.criador;
  const m = mercPorId(U.merc) || STATE.mercs[0];
  if (m) U.merc = m.id;
  const bc = (m && m.bonusCriador) || {};
  const chip = (op, v, txt, on, extra = '') => `<button class="chip-btn ${on ? 'on' : ''}" data-act="cri" data-op="${op}" data-v="${v}" ${extra}>${txt}</button>`;
  const unicos = Object.keys(UNICOS).filter((k) => UNICOS[k].tipo === U.tipo);
  const noElenco = new Set(STATE.mercs.map((x) => x.campeao).filter(Boolean));
  return `<h2>${canvasIcone('criador', 22)} Modo Criador</h2>
  <p class="dica">Edite o que quiser. Saves editados ganham o selo ${canvasIcone('criador', 12)} no topo.</p>

  <section class="cri-sec"><h3>Recursos</h3>
    <div class="chips-grupo">${chip('ouro', 1000, '+1.000 ouro')}${chip('ouro', 10000, '+10.000')}${chip('ouro', 100000, '+100.000')}${chip('emb', 5, '+5 emblemas')}${chip('emb', 25, '+25')}</div>
    <div class="linha-input"><input id="cri-ouro" type="number" inputmode="numeric" min="0" value="${STATE.ouro}" aria-label="Ouro"><button class="btn pequeno" data-act="cri" data-op="ouro-def">Definir ouro</button></div>
    <div class="linha-input"><input id="cri-emb" type="number" inputmode="numeric" min="0" value="${STATE.emblemas}" aria-label="Emblemas"><button class="btn pequeno" data-act="cri" data-op="emb-def">Definir emblemas</button></div>
  </section>

  <section class="cri-sec"><h3>Sorte e tempo</h3>
    <span class="rot">Chance de Épicos e Lendários nos baús</span>
    <div class="chips-grupo">${[1, 2, 5, 10].map((v) => chip('sorte', v, `×${v}`, C.sorteMult === v)).join('')}</div>
    <span class="rot">Velocidade do progresso ocioso e das expedições</span>
    <div class="chips-grupo">${[1, 2, 5, 10].map((v) => chip('tempo', v, `×${v}`, C.tempoMult === v)).join('')}</div>
    <div class="chips-grupo">${chip('avancar', 60, 'Avançar 1 h')}${chip('avancar', 480, 'Avançar 8 h')}${chip('expedicoes', 0, 'Terminar expedições')}</div>
  </section>

  ${m ? `<section class="cri-sec"><h3>Mercenários</h3>
    <div class="escolha-merc">${STATE.mercs.map((x) => `<button class="chip-merc ${x.id === m.id ? 'on' : ''}" data-act="cri-merc" data-id="${x.id}">${canvasLook(lookMeu(x), 36)}<small>${esc(x.nome)}<br>nv. ${x.nivel}</small></button>`).join('')}</div>
    <div class="cri-grade">
      <label>Nível (1–${NIVEL_TETO})<input id="cri-nivel" type="number" inputmode="numeric" min="1" max="${NIVEL_TETO}" value="${m.nivel}"></label>
      <label>Ascensões (0–2)<input id="cri-asc" type="number" inputmode="numeric" min="0" max="2" value="${m.ascensoes}"></label>
      <label>+VIDA<input id="cri-b-vida" type="number" inputmode="numeric" value="${bc.vida || 0}"></label>
      <label>+ATQ<input id="cri-b-atq" type="number" inputmode="numeric" value="${bc.atq || 0}"></label>
      <label>+DEF<input id="cri-b-def" type="number" inputmode="numeric" value="${bc.def || 0}"></label>
      <label>+AGI<input id="cri-b-agi" type="number" inputmode="numeric" value="${bc.agi || 0}"></label>
    </div>
    <button class="btn primario largo" data-act="cri" data-op="merc-aplicar">Aplicar em ${esc(m.nome)}</button>
    <span class="rot">Potencial (refaz o crescimento por nível)</span>
    <div class="chips-grupo">${POTS.map((p) => chip('pot', p, p, m.pot === p)).join('')}</div>
    <span class="rot">Traços</span>
    <div class="chips-grupo">${Object.keys(TRACOS).map((t) => chip('traco', t, TRACOS[t].nome, m.tracos.includes(t))).join('')}</div>
  </section>` : ''}

  <section class="cri-sec"><h3>Criar itens</h3>
    <span class="rot">Equipamento</span>
    <div class="chips-grupo">${Object.entries(TIPOS_ITEM).map(([k, n]) => chip('it-tipo', k, n, U.tipo === k)).join('')}</div>
    <div class="chips-grupo">${RARIDADES.map((r, i) => chip('it-rar', i, r.nome, U.raridade === i, `style="--rc:${r.cor}"`)).join('')}</div>
    ${U.raridade === 4 ? `<div class="chips-grupo">${chip('it-unico', '', 'Único aleatório', !U.unico)}${unicos.map((k) => chip('it-unico', k, UNICOS[k].nome, U.unico === k)).join('')}</div>` : ''}
    <div class="linha-input"><input id="cri-it-nivel" type="number" inputmode="numeric" min="1" max="${NIVEL_TETO}" value="${U.nivel}" aria-label="Nível do item"><button class="btn pequeno primario" data-act="cri" data-op="it-criar">Criar</button></div>
    <span class="rot">Pergaminho</span>
    <div class="chips-grupo lista-cri">${Object.entries(PERGAMINHOS).map(([k, P]) => chip('perg-sel', k, P.nome, U.perg === k, `style="--rc:${RARIDADES[P.r].cor}"`)).join('')}</div>
    <button class="btn" data-act="cri" data-op="perg-criar">Criar ${PERGAMINHOS[U.perg].nome}</button>
    <span class="rot">Relíquia</span>
    <div class="chips-grupo lista-cri">${Object.entries(RELIQUIAS).map(([k, R]) => chip('rel-sel', k, R.nome, U.rel === k, `style="--rc:${RARIDADES[R.r].cor}"`)).join('')}</div>
    <button class="btn" data-act="cri" data-op="rel-criar">Criar ${RELIQUIAS[U.rel].nome}</button>
    <span class="rot">Consumíveis</span>
    <button class="btn" data-act="cri" data-op="cons-todos">+5 de cada consumível</button>
    <p class="dica">Inventário: ${STATE.inventario.length}/${ECO.invMax}.</p>
  </section>

  <section class="cri-sec"><h3>Campeões Lendários</h3>
    <div class="chips-grupo">${Object.entries(CAMPEOES).map(([id, Cp]) => chip('campeao', id, Cp.nome, false, noElenco.has(id) || STATE.mercs.length >= limiteElenco() ? 'disabled' : '')).join('')}</div>
    <p class="dica">Entram no nível médio do time. Elenco: ${STATE.mercs.length}/${limiteElenco()}.</p>
  </section>

  <section class="cri-sec"><h3>Liga</h3>
    <div class="chips-grupo">${chip('liga-vencer', 0, 'Vencer a rodada', false, STATE.liga.fase !== 'liga' ? 'disabled' : '')}${chip('liga-fim', 0, 'Vencer o resto da liga', false, STATE.liga.fase !== 'liga' ? 'disabled' : '')}</div>
    <span class="rot">Torre (recorde atual: ${STATE.torre.recorde})</span>
    <div class="chips-grupo">${chip('torre-mais', 1, '+1 andar')}${chip('torre-mais', 10, '+10 andares')}${chip('torre-zero', 0, 'Zerar recorde')}${chip('tributo-reset', 0, 'Liberar tributo')}</div>
    <span class="rot">Divisão (recomeça a temporada)</span>
    <div class="chips-grupo">${DIVISOES.map((d, i) => chip('div', i, d.nome, STATE.divisao === i)).join('')}</div>
  </section>
  <button class="btn" data-act="cri" data-op="esconder">Esconder o Modo Criador</button>`;
}
function abrirCriador() { abrirModal(htmlCriador(), { dados: { criador: true } }); }
const lerNum = (id, padrao = 0) => { const v = Math.floor(Number(($('#' + id) || {}).value)); return Number.isFinite(v) ? v : padrao; };
function acaoCriador(el) {
  const op = el.dataset.op, v = el.dataset.v, U = UI.criador, C = STATE.criador;
  const m = mercPorId(U.merc);
  let msg = '';
  switch (op) {
    case 'ouro': STATE.ouro += +v; msg = `+${fmt(+v)} ouro`; break;
    case 'emb': STATE.emblemas += +v; msg = `+${v} emblemas`; break;
    case 'ouro-def': STATE.ouro = Math.max(0, lerNum('cri-ouro', STATE.ouro)); msg = 'Ouro definido'; break;
    case 'emb-def': STATE.emblemas = Math.max(0, lerNum('cri-emb', STATE.emblemas)); msg = 'Emblemas definidos'; break;
    case 'sorte': C.sorteMult = +v; msg = `Sorte ×${v}`; break;
    case 'tempo': C.tempoMult = +v; msg = `Ócio ×${v}`; break;
    case 'avancar': {
      const r = aplicarTempo(+v);
      for (const e of STATE.expedicoes) { e.fim -= +v * 60000; e.inicio -= +v * 60000; }
      STATE.sabedoriaAte = Math.max(0, (STATE.sabedoriaAte || 0) - +v * 60000);
      msg = `+${fmt(r.ouro)} ouro no cofre e +${fmt(r.xp)} XP`; break;
    }
    case 'expedicoes': for (const e of STATE.expedicoes) e.fim = Math.min(e.fim, Date.now()); msg = 'Expedições prontas'; break;
    case 'merc-aplicar': {
      if (!m) return;
      m.ascensoes = clamp(lerNum('cri-asc', m.ascensoes), 0, 2);
      m.nivel = clamp(lerNum('cri-nivel', m.nivel), 1, NIVEL_TETO);
      if (m.nivel > nivelMax(m)) m.ascensoes = ascPorNivel(m.nivel);
      m.xp = 0;
      m.bonusCriador = { vida: lerNum('cri-b-vida'), atq: lerNum('cri-b-atq'), def: lerNum('cri-b-def'), agi: lerNum('cri-b-agi') };
      while (m.pergaminhos.length > slotsPergaminho(m)) devolverAoInventario(m.pergaminhos.pop());
      msg = `${m.nome} atualizado`; break;
    }
    case 'pot': if (m) { m.pot = v; m.cresc = rolarCresc(m.classe, v); msg = `Potencial ${v}`; } break;
    case 'traco': if (m) { m.tracos = m.tracos.includes(v) ? m.tracos.filter((t) => t !== v) : [...m.tracos, v]; } break;
    case 'it-tipo': U.tipo = v; U.unico = null; break;
    case 'it-rar': U.raridade = +v; break;
    case 'it-unico': U.unico = v || null; break;
    case 'it-criar': {
      if (STATE.inventario.length >= ECO.invMax) { toast('Inventário cheio.', 'erro'); return; }
      U.nivel = clamp(lerNum('cri-it-nivel', U.nivel), 1, NIVEL_TETO);
      const it = gerarItem(U.raridade, U.nivel, U.tipo);
      if (U.raridade === 4 && U.unico) it.unico = U.unico;
      STATE.inventario.push(it); msg = `${it.nome} criado`; break;
    }
    case 'perg-sel': U.perg = v; break;
    case 'rel-sel': U.rel = v; break;
    case 'perg-criar': if (STATE.inventario.length >= ECO.invMax) { toast('Inventário cheio.', 'erro'); return; } STATE.inventario.push(gerarPergaminho(PERGAMINHOS[U.perg].r, U.perg)); msg = 'Pergaminho criado'; break;
    case 'rel-criar': if (STATE.inventario.length >= ECO.invMax) { toast('Inventário cheio.', 'erro'); return; } STATE.inventario.push(gerarReliquia(RELIQUIAS[U.rel].r, U.rel)); msg = 'Relíquia criada'; break;
    case 'cons-todos': for (const k in CONSUMIVEIS) STATE.consumiveis[k] = (STATE.consumiveis[k] || 0) + 5; msg = '+5 de cada consumível'; break;
    case 'campeao': {
      if (STATE.mercs.length >= limiteElenco()) { toast('Elenco cheio.', 'erro'); return; }
      const nm = ajustarAscPorNivel(gerarCampeao(v, nivelRecruta()));
      receberCampeao(nm); msg = `${nm.nome} entrou para a guilda!`; break;
    }
    case 'liga-vencer': {
      if (STATE.liga.fase !== 'liga') return;
      registrarRodada(true, tamanhoTime(), 0); msg = 'Rodada vencida'; break;
    }
    case 'liga-fim': {
      while (STATE.liga.fase === 'liga') registrarRodada(true, tamanhoTime(), 0);
      msg = `Liga encerrada em ${STATE.liga.pos}º`; break;
    }
    case 'torre-mais': STATE.torre.recorde += +v; STATE.torre.inimigo = null; msg = `Recorde: andar ${STATE.torre.recorde}`; break;
    case 'torre-zero': STATE.torre.recorde = 0; STATE.torre.inimigo = null; msg = 'Recorde zerado'; break;
    case 'tributo-reset': STATE.torre.tributoDia = ''; msg = 'Tributo liberado'; break;
    case 'div': {
      STATE.divisao = clamp(+v, 0, DIVISOES.length - 1);
      preencherTime(); ajustarReliquias();
      novaTemporada(STATE.liga.temporada);
      STATE.amistoso = null; msg = `Divisão ${divAtual().nome}`; break;
    }
    case 'esconder': C.liberado = false; UI.toquesVersao = 0; salvar(); fecharTodosModais(); render(); toast('Modo Criador escondido. 7 toques na versão trazem de volta.'); return;
    default: return;
  }
  if (!['it-tipo', 'it-rar', 'it-unico', 'perg-sel', 'rel-sel'].includes(op)) C.usado = true;
  if (msg) toast(msg, 'ok');
  aposMudanca();
}

