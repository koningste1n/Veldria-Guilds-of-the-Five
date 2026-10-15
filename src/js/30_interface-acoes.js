/* ============================ INTERFACE: AÇÕES ============================ */
function aposMudanca() { salvar(); render(); atualizarModais(); }
const avisoElencoCheio = () => (STATE.construcoes.acampamento < CONSTRUCOES.acampamento.max ? 'Elenco cheio. Venda alguém ou suba o Acampamento para abrir vagas.' : 'Elenco cheio. Venda alguém para abrir vaga.');
const topoModal = () => UI.modais[UI.modais.length - 1];
const MSG_RESULTADO = {
  cheio: 'Inventário cheio.', papel: 'Esse pergaminho não serve para o papel dele.', repetido: 'Ele já tem esse pergaminho.',
  repetida: 'Já há uma relíquia igual equipada.', ouro: 'Ouro insuficiente.', emblemas: 'Emblemas insuficientes.', nivel: 'Nível insuficiente.',
};
const ACOES = {
  'fechar-modal': () => fecharModal(),
  aba: (el) => { UI.aba = el.dataset.id; window.scrollTo(0, 0); render(); },
  coletar: () => {
    const v = Math.floor(STATE.cofre); if (v < 1) return;
    ganharOuro(v); STATE.cofre -= v; salvar(); somTocar('moeda'); toast(`+${fmt(v)} ouro`, 'ouro'); render();
  },
  melhorar: (el) => {
    const id = el.dataset.id, custo = custoMelhoria(id);
    if (STATE.ouro < custo || STATE.construcoes[id] >= nivelMaxConstrucao(id)) return;
    STATE.ouro -= custo; STATE.construcoes[id]++; somTocar('construir');
    toast(`${CONSTRUCOES[id].nome} subiu para o nível ${STATE.construcoes[id]}!`, 'ok'); aposMudanca();
  },

  /* --- elenco e ficha --- */
  'abrir-merc': (el) => abrirFicha(mercPorId(+el.dataset.id), 'elenco'),
  'ver-oferta': (el) => abrirFicha(STATE.taverna.ofertas.find((m) => m.id === +el.dataset.id), 'oferta'),
  'ver-pendente': () => abrirFicha(STATE.campeaoPendente, 'pendente'),
  recrutar: (el) => {
    const m = STATE.taverna.ofertas.find((o) => o.id === +el.dataset.id); if (!m) return;
    if (STATE.mercs.length >= limiteElenco()) { toast(avisoElencoCheio(), 'erro'); return; }
    if (STATE.ouro < precoMerc(m)) { toast('Ouro insuficiente.', 'erro'); return; }
    STATE.ouro -= precoMerc(m);
    STATE.taverna.ofertas = STATE.taverna.ofertas.filter((o) => o !== m);
    STATE.mercs.push(m);
    if (m.campeao && !STATE.campeoesObtidos.includes(m.campeao)) STATE.campeoesObtidos.push(m.campeao);
    if (STATE.time.length < tamanhoTime()) STATE.time.push(m.id);
    ajustarTime();
    toast(`${m.nome} entrou para a guilda!`, 'ok');
    const w = modalCom('ficha'); if (w && w.dados.modo === 'oferta') removerModal(w);
    aposMudanca();
  },
  'recrutar-pendente': () => {
    const m = STATE.campeaoPendente; if (!m) return;
    if (STATE.mercs.length >= limiteElenco()) { toast(avisoElencoCheio(), 'erro'); return; }
    STATE.campeaoPendente = null;
    receberCampeao(m);
    toast(`${m.nome} entrou para a guilda!`, 'ok');
    const w = modalCom('ficha'); if (w && w.dados.modo === 'pendente') removerModal(w);
    aposMudanca();
  },
  renovar: () => {
    const T = STATE.taverna; if (STATE.ouro < T.custo) return;
    STATE.ouro -= T.custo; const novo = T.custo + ECO.custoRenovar;
    renovarTaverna(true); STATE.taverna.custo = novo; aposMudanca();
  },
  comprar: (el) => {
    const it = STATE.taverna.loja.find((i) => i.id === +el.dataset.id); if (!it) return;
    if (STATE.inventario.length >= ECO.invMax) { toast('Inventário cheio.', 'erro'); return; }
    if (STATE.ouro < precoItem(it)) return;
    STATE.ouro -= precoItem(it); STATE.taverna.loja = STATE.taverna.loja.filter((i) => i !== it); STATE.inventario.push(it);
    somTocar('moeda'); toast(`${it.nome} foi para o inventário.`, 'ok'); aposMudanca();
  },
  'comprar-cons': (el) => { if (comprarConsumivel(el.dataset.id)) { somTocar('moeda'); toast(`${CONSUMIVEIS[el.dataset.id].nome} foi para a bolsa.`, 'ok'); aposMudanca(); } },
  'time-add': (el) => {
    const id = +el.dataset.id;
    if (STATE.time.includes(id)) return;
    if (emExpedicao(id)) { toast('Está em expedição.', 'erro'); return; }
    if (STATE.time.length < tamanhoTime()) { STATE.time.push(id); ajustarTime(); aposMudanca(); return; }
    const m = mercPorId(id);
    abrirModal(`<h2>Quem sai para ${esc(m.nome)} entrar?</h2><div class="lista">${timeMercs().map((t) => `<div class="card">${canvasLook(lookMeu(t), 40)}<div class="card-corpo"><b>${esc(t.nome)}</b><small>${CLASSES[t.classe].nome} · nv. ${t.nivel}</small></div><button class="btn" data-act="trocar" data-sai="${t.id}" data-entra="${id}">Trocar</button></div>`).join('')}</div>`, { dados: { troca: true } });
  },
  trocar: (el) => {
    const sai = +el.dataset.sai, entra = +el.dataset.entra;
    STATE.time = STATE.time.map((x) => (x === sai ? entra : x));
    if (STATE.capitao === sai) STATE.capitao = entra;
    ajustarTime(); fecharModal(); aposMudanca();
  },
  'time-rem': (el) => { STATE.time = STATE.time.filter((x) => x !== +el.dataset.id); ajustarTime(); aposMudanca(); },
  capitao: (el) => { STATE.capitao = +el.dataset.id; toast('Novo capitão definido.', 'ok'); aposMudanca(); },
  linha: (el) => { const m = mercPorId(+el.dataset.id); m.pos = posDe(el.dataset.v === 'frente' ? 0 : 2, posFileira(m.pos)); m.linha = linhaDePos(m.pos); aposMudanca(); },
  aparencia: (el) => { const m = mercPorId(+el.dataset.id); if (m) abrirModal(htmlAparencia(m), { dados: { aparencia: m.id } }); },
  'ap-set': (el) => {
    const m = mercPorId(+el.dataset.id); if (!m) return;
    garantirAparencia(m);
    const k = el.dataset.k, v = el.dataset.v;
    m.ap[k] = k === 'raca' || k === 'penteado' ? v : +v;
    if (k === 'raca') m.ap.pele = Math.min(m.ap.pele, RACAS[v].peles.length - 1);
    aposMudanca();
  },
  'ap-sortear': (el) => { const m = mercPorId(+el.dataset.id); if (!m) return; m.ap = sortearAparencia(m.classe, m.nome); aposMudanca(); },
  tatica: (el) => { mercPorId(+el.dataset.id).tatica = el.dataset.v; aposMudanca(); },
  postura: (el) => { mercPorId(+el.dataset.id).postura = POSTURAS[el.dataset.v] ? el.dataset.v : 'auto'; aposMudanca(); },
  // grade de formação: 1º toque seleciona o mercenário; 2º toque numa casa move (ou troca de lugar com quem está lá)
  casa: (el) => {
    const pos = +el.dataset.pos, time = timeMercs(), aqui = time.find((m) => m.pos === pos);
    if (UI.casaSel == null) { if (aqui) { UI.casaSel = pos; render(); atualizarModais(); } return; }
    if (pos === UI.casaSel) { UI.casaSel = null; render(); atualizarModais(); return; }
    const sel = time.find((m) => m.pos === UI.casaSel);
    if (!sel) { UI.casaSel = null; render(); atualizarModais(); return; }
    sel.pos = pos; sel.linha = linhaDePos(pos);
    if (aqui) { aqui.pos = UI.casaSel; aqui.linha = linhaDePos(aqui.pos); }
    UI.casaSel = pos;
    aposMudanca();
  },
  // Kevin (15/10): um botão para fechar a edição da formação. No Elenco, salva e leva à Liga (onde está o LUTAR);
  // no intervalo da partida, só tira a seleção (o botão "Luta N" continua sendo o que começa a próxima luta)
  'confirmar-formacao': (el) => {
    UI.casaSel = null;
    if (el.dataset.onde === 'intervalo') { salvar(); atualizarModais(); toast('Formação confirmada.', 'ok'); return; }
    ajustarTime(); salvar();
    UI.aba = 'liga'; window.scrollTo(0, 0); render();
    toast('Formação confirmada. Pronto para lutar!', 'ok');
  },
  'vender-merc': (el) => {
    const m = mercPorId(+el.dataset.id);
    if (emExpedicao(m.id)) { toast('Está em expedição.', 'erro'); return; }
    if (STATE.mercs.length <= tamanhoTime()) { toast(`Você precisa de pelo menos ${tamanhoTime()} mercenários.`, 'erro'); return; }
    abrirModal(`<h2>Vender ${esc(m.nome)}?</h2><p>Você recebe <b>${fmt(valorVendaMerc(m))} ouro</b>. Itens e pergaminhos equipados voltam para o inventário.</p>
      <div class="confirmar"><button class="btn" data-act="fechar-modal">Cancelar</button><button class="btn perigo" data-act="vender-merc-sim" data-id="${m.id}">Vender</button></div>`);
  },
  'vender-merc-sim': (el) => {
    const m = mercPorId(+el.dataset.id); if (!m) return;
    for (const k of Object.keys(m.equip)) if (m.equip[k]) devolverAoInventario(m.equip[k]);
    for (const p of m.pergaminhos) devolverAoInventario(p);
    STATE.ouro += valorVendaMerc(m);
    STATE.mercs = STATE.mercs.filter((x) => x !== m);
    STATE.time = STATE.time.filter((x) => x !== m.id);
    preencherTime();
    toast(`${m.nome} deixou a guilda. +${fmt(valorVendaMerc(m))} ouro`, 'ouro');
    fecharTodosModais(); aposMudanca();
  },
  evoluir: (el) => {
    const m = mercPorId(+el.dataset.id), k = el.dataset.v, EV = EVOLUCOES[m.classe];
    if (!podeEvoluir(m) || !EV[k]) return;
    const outro = k === 'a' ? 'b' : 'a';
    abrirModal(`<h2>${esc(m.nome)} vira ${EV[k].nome}?</h2><p>${EV[k].desc}</p><p class="dica">A escolha é <b>para sempre</b>: ${EV[outro].nome} não vai mais estar disponível para ${esc(m.nome)}.</p>
      <div class="confirmar"><button class="btn" data-act="fechar-modal">Pensar mais</button><button class="btn primario" data-act="evoluir-sim" data-id="${m.id}" data-v="${k}">Evoluir</button></div>`);
  },
  'evoluir-sim': (el) => {
    const m = mercPorId(+el.dataset.id);
    if (!evoluir(m, el.dataset.v)) return;
    fecharModal(); somTocar('vitoria'); vibrar([30, 40], true);
    toast(`${m.nome} agora é ${nomeEvo(m)}!`, 'ouro'); aposMudanca();
  },
  ascender: (el) => {
    const m = mercPorId(+el.dataset.id); if (!m) return;
    const r = ascender(m);
    if (r !== 'ok') { toast(MSG_RESULTADO[r] || 'Não deu.', 'erro'); return; }
    somTocar('nivel'); vibrar([20, 40, 20], true);
    toast(`${m.nome} ascendeu! Nível máximo ${nivelMax(m)}.`, 'ouro'); aposMudanca();
  },

  /* --- equipamentos, pergaminhos e relíquias --- */
  slot: (el) => abrirEscolhaItem(mercPorId(+el.dataset.id), el.dataset.tipo),
  equipar: (el) => {
    const m = mercPorId(+el.dataset.merc), it = STATE.inventario.find((i) => i.id === +el.dataset.item);
    if (!m || !it) return;
    const antigo = m.equip[it.tipo];
    m.equip[it.tipo] = it;
    STATE.inventario = STATE.inventario.filter((i) => i !== it);
    if (antigo) STATE.inventario.push(antigo);
    somTocar('equipar'); toast(`${m.nome} equipou ${nomeItem(it)}.`, 'ok');
    const t = topoModal(); if (t && t.dados.escolha) fecharModal();
    aposMudanca();
  },
  desequipar: (el) => {
    const m = mercPorId(+el.dataset.id), tipo = el.dataset.tipo, it = m.equip[tipo];
    if (!it) return;
    if (STATE.inventario.length >= ECO.invMax) { toast('Inventário cheio.', 'erro'); return; }
    m.equip[tipo] = null; STATE.inventario.push(it);
    const t = topoModal(); if (t && t.dados.escolha) fecharModal();
    aposMudanca();
  },
  'perg-slot': (el) => abrirEscolhaPergaminho(mercPorId(+el.dataset.id)),
  'perg-equipar': (el) => {
    const m = mercPorId(+el.dataset.merc); if (!m) return;
    const r = equiparPergaminho(m, +el.dataset.item);
    if (r !== 'ok') { toast(MSG_RESULTADO[r] || (r === 'cheio' ? 'Sem espaço de pergaminho.' : 'Não deu.'), 'erro'); return; }
    somTocar('equipar'); toast(`${m.nome} aprendeu ${m.pergaminhos[m.pergaminhos.length - 1].nome}!`, 'ok');
    const t = topoModal(); if (t && t.dados.escolha) fecharModal();
    aposMudanca();
  },
  'perg-remover': (el) => {
    const m = mercPorId(+el.dataset.merc); if (!m) return;
    const r = removerPergaminho(m, +el.dataset.id);
    if (r !== 'ok') { toast(MSG_RESULTADO[r] || 'Não deu.', 'erro'); return; }
    aposMudanca();
  },
  'rel-slot': () => abrirModal(htmlEscolhaReliquia(), { dados: { reliquias: true } }),
  'rel-equipar': (el) => {
    const r = equiparReliquia(+el.dataset.id);
    if (r !== 'ok') { toast(r === 'cheio' ? 'Todos os espaços de relíquia estão ocupados.' : MSG_RESULTADO[r] || 'Não deu.', 'erro'); return; }
    somTocar('equipar'); toast('Relíquia equipada na guilda.', 'ok');
    const t = topoModal(); if (t && t.dados.reliquias) fecharModal();
    aposMudanca();
  },
  'rel-guardar': (el) => {
    const r = desequiparReliquia(+el.dataset.id);
    if (r !== 'ok') { toast(MSG_RESULTADO[r] || 'Não deu.', 'erro'); return; }
    aposMudanca();
  },
  'abrir-item': (el) => abrirItem(+el.dataset.id),
  'vender-item': (el) => {
    const it = STATE.inventario.find((i) => i.id === +el.dataset.id); if (!it) return;
    const v = valorVendaItem(it);
    STATE.ouro += v; STATE.inventario = STATE.inventario.filter((i) => i !== it);
    toast(`Vendido por ${fmt(v)} ouro.`, 'ouro'); fecharModal(); aposMudanca();
  },
  'filtro-inv': (el) => { UI.filtroInv = el.dataset.id; renderTela(); },
  'abrir-forja': () => abrirModal(htmlForja(), { dados: { forja: true } }),
  aprimorar: (el) => {
    const a = acharItem(+el.dataset.id); if (!a) return;
    const r = aprimorarItem(a.it);
    if (r !== 'ok') { toast(r === 'ouro' ? 'Ouro insuficiente.' : 'Melhore a Forja para ir além.', 'erro'); return; }
    somTocar('construir'); toast(`${nomeItem(a.it)}!`, 'ok'); aposMudanca();
  },

  /* --- consumíveis --- */
  'abrir-cons': (el) => abrirModal(htmlConsumivel(el.dataset.id), { dados: { consumivel: el.dataset.id } }),
  'usar-cons': (el) => {
    const cid = el.dataset.id, r = usarConsumivel(cid);
    if (r === 'ativo') { toast('Já existe um mapa pronto.', 'erro'); return; }
    if (r !== 'ok') return;
    toast(CONSUMIVEIS[cid].uso === 'sabedoria' ? 'Sabedoria ativa: +50% de XP por 1 h.' : 'Mapa pronto: a próxima expedição garante um baú Raro ou melhor.', 'ok');
    const t = topoModal(); if (t && t.dados.consumivel) fecharModal();
    aposMudanca();
  },
  preparo: (el) => { if (alternarPreparo(el.dataset.id)) aposMudanca(); },

  /* --- expedições --- */
  'exp-nova': () => {
    const livres = mercsLivresExpedicao(); if (!livres.length) return;
    const vagas = maxExpedicoes() - STATE.expedicoes.length; if (vagas <= 0) return;
    UI.expSel = new Set(livres.slice(0, vagas).map((m) => m.id));   // já vem com todos que cabem marcados
    abrirModal(htmlNovaExpedicao(), { dados: { expedicao: true } });
  },
  'exp-merc': (el) => {
    const id = +el.dataset.id, vagas = maxExpedicoes() - STATE.expedicoes.length;
    if (UI.expSel.has(id)) UI.expSel.delete(id);
    else if (UI.expSel.size < vagas) UI.expSel.add(id);
    else { toast(`Só ${vagas === 1 ? 'há 1 vaga' : `há ${vagas} vagas`} livres. Suba o Acampamento para mais.`); return; }
    const w = modalCom('expedicao'); if (w) atualizarModal(w, htmlNovaExpedicao());
  },
  'exp-todos': () => {
    const livres = mercsLivresExpedicao(), vagas = maxExpedicoes() - STATE.expedicoes.length, alvo = Math.min(vagas, livres.length);
    UI.expSel = UI.expSel.size >= alvo ? new Set() : new Set(livres.slice(0, vagas).map((m) => m.id));
    const w = modalCom('expedicao'); if (w) atualizarModal(w, htmlNovaExpedicao());
  },
  'exp-ir': (el) => {
    const tipo = +el.dataset.tipo, ids = mercsLivresExpedicao().filter((m) => UI.expSel.has(m.id)).map((m) => m.id);
    const foram = iniciarExpedicoes(ids, tipo);
    if (!foram.length) { toast('Não foi possível enviar.', 'erro'); return; }
    toast(foram.length === 1 ? `${foram[0].nome} partiu: ${EXPEDICOES[tipo].nome}.` : `${foram.length} heróis partiram: ${EXPEDICOES[tipo].nome}.`, 'ok');
    UI.expSel = new Set();
    const w = modalCom('expedicao'); if (w) removerModal(w);
    aposMudanca();
  },
  'exp-coletar-todas': () => {
    const rs = coletarTodas(); if (!rs.length) return;
    somTocar('moeda'); salvar(); render();
    if (rs.length === 1) mostrarExpedicao(rs[0]); else mostrarColetaTodas(rs);
  },
  'exp-coletar': (el) => {
    const r = coletarExpedicao(+el.dataset.id); if (!r) return;
    somTocar('moeda'); salvar(); render();
    mostrarExpedicao(r);
  },
  'exp-cancelar': (el) => {
    const e = STATE.expedicoes.find((x) => x.id === +el.dataset.id); if (!e) return;
    const m = mercPorId(e.mercId);
    abrirModal(`<h2>Chamar ${esc(m.nome)} de volta?</h2><p>A expedição é cancelada sem recompensas.${e.mapa ? ' O Mapa do Tesouro volta para você.' : ''}</p>
      <div class="confirmar"><button class="btn" data-act="fechar-modal">Deixar ir</button><button class="btn perigo" data-act="exp-cancelar-sim" data-id="${e.id}">Chamar de volta</button></div>`);
  },
  'exp-cancelar-sim': (el) => { cancelarExpedicao(+el.dataset.id); fecharModal(); aposMudanca(); },

  /* --- liga, copa e lutas --- */
  'lutar-liga': () => { const g = adversarioDaRodada(); if (g) iniciarLuta({ tipo: 'liga', rival: g }); },
  'lutar-copa': () => { const g = adversarioCopa(); if (g) iniciarLuta({ tipo: 'copa', rival: g }); },
  'lutar-torre': () => { UI.voltarPara = 'torre'; iniciarLuta({ tipo: 'torre', rival: inimigoDaTorre() }); },
  tributo: () => { const v = coletarTributo(); if (v) { somTocar('moeda'); toast(`Tributo da Torre: +${fmt(v)} ouro`, 'ouro'); aposMudanca(); } },
  estatisticas: () => abrirEstatisticas(),
  'rec-funcao': (el) => { UI.recFuncao = el.dataset.id; atualizarModais(); },
  'conferir-partida': (el) => {
    const p = STATE.partidas.find((x) => x.n === +el.dataset.n); if (!p) return;
    const r = conferirPartida(p);
    const msg = { igual: ['Reprodução idêntica: mesmo vencedor, mesma duração e os mesmos números de cada lutador.', 'ok'], diferente: ['A reprodução deu um resultado diferente. Anote o número da luta para o Claude investigar.', 'erro'],
      regras: ['Esta luta é de uma versão anterior das regras de combate e não pode mais ser reproduzida.', ''], criador: ['Luta encerrada pelo Modo Criador: não dá para reproduzir.', ''], 'sem-dados': ['Só as 10 lutas mais recentes guardam os dados para reproduzir.', ''] }[r];
    toast(msg[0], msg[1]);
  },
  'som-luta': () => {
    STATE.config.musica = !STATE.config.musica; somIniciar(); somVolume(); salvar();
    if (STATE.config.musica && Luta && Luta.rodando && !Luta.terminou) musicaIniciar(); else musicaParar();
    const bt = $('#btn-som'); if (bt) { bt.innerHTML = canvasIcone(STATE.config.musica ? 'som' : 'mudo', 14); hidratar(bt); }
    toast(STATE.config.musica ? 'Música ligada.' : 'Música desligada.');
  },
  'lutar-amistoso': () => { if (!STATE.amistoso) gerarAmistoso(); iniciarLuta({ tipo: 'amistoso', rival: STATE.amistoso }); },
  'nova-temporada': () => {
    const r = encerrarTemporada(); if (!r) return;
    salvar(); render();
    UI.ultimoDrop = r.item;
    const dA = DIVISOES[r.divAntes], dD = DIVISOES[r.divDepois];
    const mov = r.sobe ? `<div class="promo sobe"><b>Promoção!</b><span>${dA.nome} → <b style="color:${dD.cor}">${dD.nome}</b></span><small>Rivais mais fortes, bilheteria ×${fmt1(dD.mult)}${dD.time > dA.time ? `, time de ${dD.time} titulares` : ''}${dD.reliquias > dA.reliquias ? `, ${dD.reliquias} espaços de relíquia` : ''}.</small></div>`
      : r.cai ? `<div class="promo cai"><b>Rebaixamento</b><span>${dA.nome} → ${dD.nome}</span><small>Termine entre os 2 primeiros para voltar a subir.</small></div>` : '';
    const faltam = timeMercs().length < tamanhoTime();
    abrirModal(`<h2>Prêmios da temporada</h2><p>${r.pos}º lugar: <b>+${fmt(r.ouro)} ouro</b>${r.emblemas ? ` e <b>+${r.emblemas} ${r.emblemas === 1 ? 'Emblema' : 'Emblemas'}</b>` : ''}.</p>
      ${mov}
      ${r.item ? blocoBau('Baú de prêmio! Toque para abrir') : ''}
      ${faltam ? `<p class="aviso">A Divisão ${dD.nome} pede ${tamanhoTime()} titulares: recrute na Taverna.</p>` : ''}
      <p class="dica">A Temporada ${STATE.liga.temporada} começou com 7 novas guildas rivais.</p>
      <button class="btn primario enorme" data-act="fechar-modal">Vamos lá</button>`);
  },
  'abrir-bau': (el) => { const area = el.closest('#bau-area'); if (area && UI.ultimoDrop) { somTocar('bau'); vibrar(25, true); revelarDrop(area, UI.ultimoDrop); } },
  'resultado-ok': () => { fecharTodosModais(); UI.aba = UI.voltarPara || 'liga'; UI.voltarPara = null; encerrarLuta(); render(); window.scrollTo(0, 0); },   // encerrarLuta por último: o tutorial pode levar à aba recém-liberada
  'luta-vel': (el) => { Luta.vel = +el.dataset.v; STATE.config.vel = Luta.vel; $$('.seg-btn').forEach((b) => b.classList.toggle('on', +b.dataset.v === Luta.vel)); },
  'luta-auto': () => {
    const b = Luta.b; entradaJogador(b, { tipo: 'auto', v: !b.modoAuto }); STATE.config.auto = b.modoAuto;
    $('#btn-auto').textContent = b.modoAuto ? 'Auto' : 'Manual'; $('#dica-luta').textContent = dicaModo(b);
  },
  'luta-pausa': () => { Luta.pausado = !Luta.pausado; $('#btn-pausa').textContent = Luta.pausado ? 'Continuar' : 'Pausar'; },
  'luta-pular': () => pularLuta(),
  'proxima-rodada': () => proximaRodada(),
  'luta-vencer': () => vencerAgora(),
  supremo: () => {
    const b = Luta.b, cap = b.units.find((u) => u.team === 0 && u.capitao);
    if (b.modoAuto || !cap || !cap.vivo || cap.energia < 100 || b.pedirSupremo) return;
    entradaJogador(b, { tipo: 'supremo' });
  },

  /* --- configurações, save e criador --- */
  config: () => abrirConfig(),
  cfg: (el) => {
    const k = el.dataset.k, v = el.dataset.v;
    if (k === 'vel') STATE.config.vel = +v;
    if (k === 'auto') STATE.config.auto = v === 'auto';
    if (k === 'dif') STATE.config.dif = v;
    if (k === 'som') { STATE.config.som = +v; somIniciar(); somVolume(); setTimeout(() => somTocar('moeda'), 30); }
    if (k === 'musica' || k === 'vibrar' || k === 'lenta') STATE.config[k] = v === 'sim';
    if (k === 'musica') somVolume();
    if (k === 'vibrar' && v === 'sim') vibrar(40, true);
    salvar(); fecharModal(); abrirConfig(); render();
  },
  versao: () => {
    if (STATE.criador.liberado) { toast('O Modo Criador já está liberado.'); return; }
    UI.toquesVersao++;
    if (UI.toquesVersao >= 7) {
      STATE.criador.liberado = true; salvar();
      toast('Modo Criador liberado!', 'ouro');
      fecharModal(); abrirConfig();
    } else if (UI.toquesVersao >= 3) { const f = 7 - UI.toquesVersao; toast(`Mais ${f} ${f === 1 ? 'toque' : 'toques'}…`); }
  },
  criador: () => abrirCriador(),
  cri: (el) => acaoCriador(el),
  'cri-merc': (el) => { UI.criador.merc = +el.dataset.id; atualizarModais(); },
  exportar: () => {
    abrirModal(`<h2>Exportar save</h2><p class="dica">Guarde este código num lugar seguro (notas, mensagem para você mesmo). Para continuar, use Importar save.</p>
      <textarea id="codigo-save" readonly aria-label="Código do save">${exportarCodigo()}</textarea>
      <button class="btn primario" data-act="copiar">Copiar código</button>`);
  },
  copiar: () => {
    const ta = $('#codigo-save'); if (!ta) return;
    const selecionar = () => { ta.focus(); ta.select(); ta.setSelectionRange(0, ta.value.length); };
    try {
      navigator.clipboard.writeText(ta.value).then(() => toast('Código copiado.', 'ok'), () => { selecionar(); toast('Código selecionado. Use Copiar do seu teclado.'); });
    } catch (e) { selecionar(); toast('Código selecionado. Use Copiar do seu teclado.'); }
  },
  importar: () => {
    abrirModal(`<h2>Importar save</h2><p class="dica">Cole o código que começa com LDL1:. O progresso atual será substituído. Saves da Fase 1 funcionam.</p>
      <textarea id="codigo-import" aria-label="Cole o código do save"></textarea><p class="dica" id="erro-import"></p>
      <button class="btn primario" data-act="carregar-save">Carregar</button>`);
  },
  'carregar-save': () => {
    try {
      const st = importarCodigo($('#codigo-import').value);
      STATE = st;
      const r = aplicarTempo((Date.now() - STATE.ultimaVez) / 60000);
      verificarTaverna();
      if (!STATE.liga) novaTemporada(1);
      preencherTime(); salvar(); fecharTodosModais(); abrirApp();
      toast('Save carregado.', 'ok');
      if (!temNovidades()) mostrarResumoOffline(r);
    } catch (e) { $('#erro-import').textContent = e.message; }
  },
  reiniciar: () => abrirModal(`<h2>Reiniciar o jogo?</h2><p>Isso apaga a guilda, os mercenários e os itens deste aparelho${Nuvem.estado === 'ativa' ? ' e da sua conta Claude' : ''}. Exporte o save antes se quiser guardar uma cópia.</p>
      <div class="confirmar"><button class="btn" data-act="fechar-modal">Cancelar</button><button class="btn perigo" data-act="reiniciar-sim">Apagar e recomeçar</button></div>`),
  'reiniciar-sim': () => {
    try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignora */ }
    apagarNuvem();
    STATE = null; UI.criacao = null; UI.aba = 'guilda'; fecharTodosModais(); $('#tutorial').hidden = true; mostrarCriacao();
  },
  'tutorial-prox': () => {
    STATE.tutorialVisto = STATE.tutorial;
    if (STATE.tutorial >= TUT_FIM) STATE.tutorial = 99;   // tutorial concluído
    salvar(); $('#tutorial').hidden = true; render();
    if (!tutorialAtivo() && temNovidades()) mostrarNovidades();
  },
  'fechar-novidades': () => { STATE.novidades = []; salvar(); fecharModal(); },
  /* --- save na conta --- */
  'nuvem-usar-conta': () => { if (Nuvem.pendente) usarRemoto(Nuvem.pendente, 'Progresso da sua conta carregado.'); },
  'nuvem-usar-aparelho': () => {
    Nuvem.pendente = null; Nuvem.pausada = false;
    const w = modalCom('nuvem'); if (w) removerModal(w);
    salvar(); enviarNuvem(true).then((ok) => { if (ok) toast('Este progresso agora é o salvo na sua conta.', 'ok'); });
  },
  'nuvem-salvar': () => {
    salvar();
    enviarNuvem(true).then((ok) => toast(ok ? 'Salvo na sua conta Claude.' : 'Não deu para salvar na conta agora. O jogo tenta de novo sozinho.', ok ? 'ok' : 'erro'));
  },
  'nome-aleatorio': () => { UI.criacao.nome = nomeGuildaAleatorio(); renderCriacao(); },
  cor: (el) => { UI.criacao[el.dataset.campo] = el.dataset.v; renderCriacao(); },
  simbolo: (el) => { UI.criacao.simbolo = el.dataset.v; renderCriacao(); },
  'criar-guilda': () => {
    const c = UI.criacao, nome = (c.nome || '').trim();
    if (!nome) { toast('Dê um nome para a guilda.', 'erro'); return; }
    if (c.cor1 === c.cor2) { toast('Escolha duas cores diferentes.', 'erro'); return; }
    iniciarJogoNovo({ nome, cor1: c.cor1, cor2: c.cor2, simbolo: c.simbolo });
    UI.aba = 'guilda'; abrirApp();
  },
};
document.addEventListener('click', (e) => {
  somIniciar();   // o navegador só libera o áudio depois de um toque
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled) return;
  const fn = ACOES[el.dataset.act];
  if (!fn) return;
  if (el.matches('.btn, .aba, .chip-btn, .seg-btn, .tile, .tile-cons, .rel-tile, .chip-merc, .card[role="button"], .slot, .casa')) somTocar('clique');
  e.preventDefault(); e.stopPropagation(); fn(el, e);
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && UI.modais.length && !UI.modais[UI.modais.length - 1].semFechar) { fecharModal(); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-act][role="button"]')) { e.preventDefault(); e.target.click(); }
});

