/* ============================ INTERFACE: TELAS ============================ */

/* ---- GUILDA ---- */
function telaGuilda() {
  const L = STATE.liga, eu = L.guildas[0], cofre = Math.floor(STATE.cofre), cap = capCofre(), d = divAtual();
  const efeitos = [];
  if (sabedoriaRestante() > 0) efeitos.push(`<span class="efeito">${canvasIcone('pocaoR', 16)} Sabedoria: +50% XP por <b id="sab-timer">${fmtTempo(sabedoriaRestante())}</b></span>`);
  if (STATE.mapaAtivo) efeitos.push(`<span class="efeito">${canvasIcone('mapa', 16)} Mapa do Tesouro pronto para a próxima expedição</span>`);
  if (tempoMult() > 1) efeitos.push(`<span class="efeito">${canvasIcone('criador', 16)} Ócio acelerado ×${tempoMult()}</span>`);
  return `
  <section class="painel heroi">
    ${canvasBrasao(STATE.guilda, 76)}
    <div><h1>${esc(STATE.guilda.nome)}</h1>
      <p class="muted"><span class="div-tag" style="--dc:${d.cor}">${d.nome}</span> Temporada ${L.temporada}</p>
      <p class="recorde"><span class="tag">${eu.v}V ${eu.d}D</span><span class="tag">${posicaoJogador()}º lugar</span><span class="tag">Poder ${fmt(poderLista(timeMercs()))}</span></p>
      <button class="btn pequeno btn-est" data-act="estatisticas">${canvasIcone('estatisticas', 14)} Estatísticas</button>
    </div>
  </section>
  ${efeitos.length ? `<section class="efeitos">${efeitos.join('')}</section>` : ''}
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('moeda', 20)} Cofre da Bilheteria</h2><span class="muted">${fmt1(taxaBilheteria())} ouro/min</span></div>
    <div class="barra grande"><i id="cofre-barra" style="width:${Math.min(100, (cofre / cap) * 100)}%"></i><span id="cofre-txt">${fmt(cofre)} / ${fmt(cap)}</span></div>
    <p class="dica">O cofre enche sozinho, mesmo com o jogo fechado, até o limite de ${fmt1(capOfflineMin() / 60)} h (o Relógio da Guilda aumenta).</p>
    <button class="btn primario largo" data-act="coletar" id="btn-coletar" ${cofre < 1 ? 'disabled' : ''}>Coletar +${fmt(cofre)} ouro</button>
  </section>
  ${painelExpedicoes()}
  <section class="painel">
    <div class="painel-cab"><h2>Construções</h2><span class="muted">progresso ocioso</span></div>
    <div class="lista">${Object.keys(CONSTRUCOES).map(cardConstrucao).join('')}</div>
  </section>`;
}
function cardConstrucao(id) {
  const C = CONSTRUCOES[id], n = STATE.construcoes[id], max = n >= C.max, custo = custoMelhoria(id);
  const travada = !max && n >= nivelMaxConstrucao(id), divProx = travada ? divisaoParaNivel(id, n + 1) : null;
  const botao = max ? '' : travada
    ? `<button class="btn" disabled>Divisão ${divProx ? divProx.nome : ''}</button>`
    : `<button class="btn ${STATE.ouro >= custo ? 'primario' : ''}" data-act="melhorar" data-id="${id}" ${STATE.ouro < custo ? 'disabled' : ''}>${precoBtn(custo)}</button>`;
  return `<div class="card constr">
    ${canvasIcone(C.icone, 40)}
    <div class="card-corpo"><b>${C.nome} <span class="nivel">nv. ${n}/${C.max}</span></b>
      <small>Agora: ${C.efeito(n)}</small>
      ${max ? '<small class="ok">Nível máximo</small>' : `<small class="prox">Próximo: ${C.efeito(n + 1)}</small>`}
      ${travada && divProx ? `<small class="muted">O nível ${n + 1} libera na Divisão ${divProx.nome}.</small>` : ''}
    </div>
    ${botao}
  </div>`;
}
function painelExpedicoes() {
  const ativas = STATE.expedicoes, livres = mercsLivresExpedicao(), agora = Date.now(), max = maxExpedicoes();
  const prontas = ativas.filter((e) => agora >= e.fim).length;
  const lista = ativas.map((e) => {
    const m = mercPorId(e.mercId), X = EXPEDICOES[e.tipo], pronta = agora >= e.fim, tot = Math.max(1, e.fim - e.inicio);
    return `<div class="card exped ${pronta ? 'pronta' : ''}">
      ${canvasLook(lookMeu(m), 36)}
      <div class="card-corpo"><b>${esc(m.nome)} · ${X.nome}${e.mapa ? ' · com mapa' : ''}</b>
        <div class="barra exp" data-exp-fim="${e.fim}" data-exp-tot="${tot}"${pronta ? ' data-pronta="1"' : ''}><i style="width:${clamp(100 - ((e.fim - agora) / tot) * 100, 0, 100)}%"></i></div>
        <small data-exp-txt>${pronta ? 'voltou!' : `volta em ${fmtTempo(e.fim - agora)}`}</small></div>
      ${pronta ? `<button class="btn primario" data-act="exp-coletar" data-id="${e.id}">Coletar</button>` : `<button class="btn pequeno" data-act="exp-cancelar" data-id="${e.id}">Chamar</button>`}
    </div>`;
  }).join('');
  const cheio = ativas.length >= max, nA = STATE.construcoes.acampamento || 1, maxA = CONSTRUCOES.acampamento.max;
  const vagas = max - ativas.length, podem = Math.min(vagas, livres.length);
  const dicaAcamp = nA >= maxA ? '' : nA < nivelMaxConstrucao('acampamento')
    ? ` Suba o Acampamento (em Construções) para ${slotsExpedicao(nA + 1)} vagas.`
    : ` Na Divisão ${(divisaoParaNivel('acampamento', nA + 1) || {}).nome || ''}, o Acampamento pode subir para ${slotsExpedicao(nA + 1)} vagas.`;
  return `<section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('expedicao', 20)} Expedições</h2><span class="muted">${ativas.length}/${max} vagas</span></div>
    ${prontas >= 2 ? `<button class="btn primario largo" data-act="exp-coletar-todas">Coletar todas (${prontas})</button>` : ''}
    ${lista ? `<div class="lista">${lista}</div>` : ''}
    <p class="dica">Quem está fora do time titular pode explorar: volta com ouro, XP e chance de baú. A Masmorra rende 1 Emblema (até ${EXPEDICOES[3].limite} heróis nela ao mesmo tempo).${dicaAcamp}</p>
    <button class="btn largo ${podem && !cheio ? 'primario' : ''}" data-act="exp-nova" ${!podem || cheio ? 'disabled' : ''}>${cheio ? 'Todas as vagas ocupadas' : !livres.length ? 'Ninguém fora do time' : podem > 1 ? `Enviar heróis (${podem} ${podem === 1 ? 'vaga' : 'vagas'})` : 'Enviar expedição'}</button>
  </section>`;
}
// Escolha de quem vai: vários heróis de uma vez, até as vagas livres
function htmlNovaExpedicao() {
  const livres = mercsLivresExpedicao(), vagas = Math.max(0, maxExpedicoes() - STATE.expedicoes.length);
  for (const id of [...UI.expSel]) if (!livres.some((m) => m.id === id)) UI.expSel.delete(id);
  const sel = livres.filter((m) => UI.expSel.has(m.id)), n = sel.length, cheio = n >= vagas;
  const limiteSel = Math.min(vagas, livres.length), todos = n >= limiteSel;
  const chips = livres.map((m) => {
    const on = UI.expSel.has(m.id), trava = !on && cheio;
    return `<button class="chip-merc ${on ? 'on' : ''} ${trava ? 'trava' : ''}" data-act="exp-merc" data-id="${m.id}" aria-pressed="${on}" ${trava ? 'aria-disabled="true"' : ''}>${canvasLook(lookMeu(m), 36)}<small>${esc(m.nome)}<br>nv. ${m.nivel}</small></button>`;
  }).join('');
  const destinos = EXPEDICOES.map((X, i) => {
    const base = n ? sel : [livres[0]], rs = base.map((m) => recompensaExpedicao(i, m));
    const ouro = rs.reduce((a, r) => a + r.ouro, 0), xps = rs.map((r) => r.xp), xMin = Math.min(...xps), xMax = Math.max(...xps);
    const r0 = rs[0], livreDest = vagasNoDestino(i), passa = n > livreDest;
    const bau = STATE.mapaAtivo ? `Baú Raro ou melhor garantido${n > 1 ? ' para o primeiro' : ''} (Mapa)` : r0.chance >= 1 ? `Baú garantido${n > 1 ? ' para cada um' : ''}${r0.garantia ? ' (Incomum ou melhor)' : ''}` : `${Math.round(r0.chance * 100)}% de chance de baú${n > 1 ? ' para cada um' : ''}`;
    const xpTxt = xMin === xMax ? `+${fmt(xMin)} XP` : `+${fmt(xMin)} a ${fmt(xMax)} XP`;
    return `<div class="card">
      <div class="card-corpo"><b>${X.nome} · ${fmtDuracao(X.min / tempoMult())}</b>
        <small>+${fmt(ouro)} ouro${n > 1 ? ' no total' : ''} · ${xpTxt}${n > 1 ? ' cada' : ''}${r0.emblemas ? ` · +${r0.emblemas * Math.max(1, n)} ${r0.emblemas * Math.max(1, n) === 1 ? 'Emblema' : 'Emblemas'}` : ''}</small><small>${bau}</small>
        ${X.limite ? `<small class="${passa ? 'ruim' : 'muted'}">Até ${X.limite} heróis ao mesmo tempo · ${livreDest} ${livreDest === 1 ? 'vaga livre' : 'vagas livres'}</small>` : ''}</div>
      <button class="btn primario" data-act="exp-ir" data-tipo="${i}" ${!n || passa ? 'disabled' : ''}>${passa ? `Máx. ${livreDest}` : `Partir${n > 1 ? ` (${n})` : ''}`}</button></div>`;
  }).join('');
  return `<h2>${canvasIcone('expedicao', 20)} Nova expedição</h2>
    <div class="exp-sel-cab"><span class="rot">Quem vai · ${n} de ${limiteSel} ${limiteSel === 1 ? 'vaga' : 'vagas'}</span>${limiteSel > 1 ? `<button class="btn pequeno" data-act="exp-todos">${todos ? 'Limpar' : 'Todos'}</button>` : ''}</div>
    <div class="escolha-merc">${chips}</div>
    ${!n ? '<p class="dica">Toque nos heróis que vão explorar.</p>' : ''}
    <span class="rot">Destino</span>
    <div class="lista">${destinos}</div>`;
}
/* ---- ELENCO ---- */
function telaElenco() {
  const time = timeMercs(), n = tamanhoTime(), slots = [];
  for (let i = 0; i < n; i++) slots.push(time[i] ? slotTime(time[i], n) : '<div class="slot vazio"><b>Vaga livre</b><small>Escolha alguém do elenco</small></div>');
  return `
  <section class="painel">
    <div class="painel-cab"><h2>Time titular</h2><span class="tag">Poder ${fmt(poderLista(time))}</span></div>
    <div class="slots" style="--n:${n}">${slots.join('')}</div>
    <p class="dica">Toque num mercenário para ver os números, equipar itens e pergaminhos, escolher a linha e o capitão. O capitão transforma a habilidade em SUPREMO. Na Divisão ${divAtual().nome}, o time tem ${n} titulares.</p>
  </section>
  <section class="painel">
    <div class="painel-cab"><h2>Elenco</h2><span class="muted">${STATE.mercs.length}/${limiteElenco()}</span></div>
    <div class="lista">${STATE.mercs.map((m) => cardMerc(m)).join('')}</div>
  </section>`;
}
function slotTime(m, n) {
  const cap = STATE.capitao === m.id;
  return `<button class="slot ${cap ? 'capitao' : ''} ${m.campeao ? 'campeao' : ''}" data-act="abrir-merc" data-id="${m.id}">
    ${cap ? `<span class="coroa">${canvasIcone('coroa', 14)}</span>` : ''}
    ${canvasLook(lookMeu(m), n >= 5 ? 44 : n >= 4 ? 50 : 54)}
    <b>${nomeMerc(m)}</b><small>${CLASSES[m.classe].papel} · nv. ${m.nivel}</small>
    ${estrelas(m.ascensoes, 8)}
    <span class="linha-tag ${m.linha}">${m.linha === 'frente' ? 'Frente' : 'Trás'}</span>
  </button>`;
}
function cardMerc(m, opts = {}) {
  const s = atributos(m), noTime = STATE.time.includes(m.id), meu = !opts.oferta && !opts.pendente, exp = meu && emExpedicao(m.id);
  const acao = opts.oferta ? `data-act="ver-oferta" data-id="${m.id}"` : opts.pendente ? 'data-act="ver-pendente"' : `data-act="abrir-merc" data-id="${m.id}"`;
  let lado;
  if (opts.oferta) lado = `<button class="btn primario" data-act="recrutar" data-id="${m.id}" ${podeRecrutar(m) ? '' : 'disabled'}>${precoBtn(precoMerc(m))}</button>`;
  else if (opts.pendente) lado = `<button class="btn primario" data-act="recrutar-pendente" ${STATE.mercs.length < limiteElenco() ? '' : 'disabled'}>Grátis</button>`;
  else lado = `<span class="poder">${fmt(poderMerc(m))}<small>poder</small></span>`;
  return `<div class="card merc ${m.campeao ? 'campeao' : ''}" ${acao} role="button" tabindex="0">
    ${canvasLook(lookMeu(m), 54)}
    <div class="card-corpo">
      <div class="linha1"><b>${nomeMerc(m)}</b>${badgePot(m.pot)}${estrelas(m.ascensoes)}${meu && noTime ? '<span class="tag no-time">No time</span>' : ''}${exp ? '<span class="tag exp">Expedição</span>' : ''}${meu && STATE.capitao === m.id ? canvasIcone('coroa', 14) : ''}</div>
      <small>${m.campeao ? `<span class="ouro-tx">Campeão Lendário</span> · ` : ''}${CLASSES[m.classe].nome} · nv. ${m.nivel}</small>
      <small class="stats">VIDA ${fmt(s.vida)} · ATQ ${fmt(s.atq)} · DEF ${fmt(s.def)} · AGI ${fmt(s.agi)}</small>
      ${m.tracos.length || m.pergaminhos.length ? `<div class="tracos">${m.tracos.map((t) => `<span class="chip ${TRACOS[t].pos ? '' : 'neg'}">${TRACOS[t].nome}</span>`).join('')}${m.pergaminhos.map((p) => `<span class="chip perg" style="--rc:${RARIDADES[p.raridade].cor}">${esc(p.nome)}</span>`).join('')}</div>` : ''}
    </div>
    ${lado}
  </div>`;
}
function mercDaFicha(d) {
  if (d.modo === 'oferta') return STATE.taverna.ofertas.find((o) => o.id === d.mercId);
  if (d.modo === 'pendente') return STATE.campeaoPendente && STATE.campeaoPendente.id === d.mercId ? STATE.campeaoPendente : null;
  return mercPorId(d.mercId);
}
function abrirFicha(m, modo = 'elenco') {
  if (!m) return;
  abrirModal(htmlFicha(m, modo), { dados: { ficha: true, mercId: m.id, modo } });
}
function htmlFicha(m, modo) {
  const s = atributos(m), c = CLASSES[m.classe], g = ganhoProxNivel(m), ce = crescEfetivo(m);
  const sk = SKILLS[skillDe(m)], pa = PASSIVAS[c.passiva];
  const nMax = nivelMax(m), maxN = m.nivel >= nMax, xpN = xpProx(m.nivel);
  const noTime = STATE.time.includes(m.id), cap = STATE.capitao === m.id, exp = emExpedicao(m.id);
  const deFora = modo === 'oferta' || modo === 'pendente';
  const stat = (k, rot) => `<div class="stat"><span class="rot">${rot}</span><b>${fmt(s[k])}</b>
      ${g ? `<small class="prox">+${g[k]} no próximo nível</small>` : `<small>${m.ascensoes < 2 ? 'nível máximo: ascenda' : 'nível máximo'}</small>`}
      <small>+${fmt1(ce[k])} por nível${s.itens[k] ? ` · itens +${fmt(s.itens[k])}` : ''}</small></div>`;
  const slot = (tipo) => {
    const it = m.equip[tipo];
    return `<button class="equip-slot" style="--rc:${it ? RARIDADES[it.raridade].cor : 'var(--linha)'}" data-act="slot" data-id="${m.id}" data-tipo="${tipo}" ${deFora ? 'disabled' : ''}>
      ${it ? canvasIcone(it.icone, 36) : '<span class="equip-vazio">+</span>'}
      <small>${TIPOS_ITEM[tipo]}</small>${it ? `<b style="color:${RARIDADES[it.raridade].cor}">${esc(nomeItem(it))}</b>` : '<small>vazio</small>'}</button>`;
  };
  const taticas = [['auto', 'Automático'], ['perto', 'Mais próximo'], ['fraco', 'Menor vida'], ['tras', 'Retaguarda'], ['forte', 'Mais forte']];
  let rodape;
  if (modo === 'oferta') rodape = `<p class="dica">Crescimento por nível definido pelo Potencial ${m.pot}. Preço: ${fmt(precoMerc(m))} ouro.</p>
    <button class="btn primario enorme" data-act="recrutar" data-id="${m.id}" ${podeRecrutar(m) ? '' : 'disabled'}>Recrutar · ${fmt(precoMerc(m))} ouro</button>`;
  else if (modo === 'pendente') rodape = `<button class="btn primario enorme" data-act="recrutar-pendente" ${STATE.mercs.length < limiteElenco() ? '' : 'disabled'}>${STATE.mercs.length < limiteElenco() ? 'Recrutar de graça' : 'Elenco cheio'}</button>`;
  else rodape = `
    ${htmlPergaminhosFicha(m, s)}
    ${htmlAscensao(m)}
    <span class="rot">Equipamentos</span>
    <div class="equips">${slot('arma')}${slot('armadura')}${slot('amuleto')}</div>
    <div class="chips-grupo"><span class="rot">Linha no início da luta</span>
      ${[['frente', 'Frente'], ['tras', 'Trás']].map(([v, n]) => `<button class="chip-btn ${m.linha === v ? 'on' : ''}" data-act="linha" data-id="${m.id}" data-v="${v}">${n}</button>`).join('')}</div>
    <div class="chips-grupo"><span class="rot">Alvo preferido</span>
      ${taticas.map(([v, n]) => `<button class="chip-btn ${m.tatica === v ? 'on' : ''}" data-act="tatica" data-id="${m.id}" data-v="${v}">${n}</button>`).join('')}</div>
    ${exp ? '<p class="dica">Em expedição: volta para o elenco quando você coletar na Guilda (ou chame de volta).</p>' : ''}
    <div class="acoes">
      ${noTime ? `<button class="btn" data-act="time-rem" data-id="${m.id}">Tirar do time</button>` : `<button class="btn primario" data-act="time-add" data-id="${m.id}" ${exp ? 'disabled' : ''}>Pôr no time</button>`}
      <button class="btn" data-act="capitao" data-id="${m.id}" ${!noTime || cap ? 'disabled' : ''}>${cap ? 'É o capitão' : 'Tornar capitão'}</button>
      <button class="btn perigo" data-act="vender-merc" data-id="${m.id}" ${exp ? 'disabled' : ''}>Vender +${fmt(valorVendaMerc(m))}</button>
    </div>`;
  return `
  <div class="ficha-topo">
    <div class="retrato ${m.campeao ? 'campeao' : ''}">${canvasLook(lookMeu(m), 108)}</div>
    <div>
      <h2>${nomeMerc(m)} ${badgePot(m.pot)} ${cap && !deFora ? canvasIcone('coroa', 14) : ''}</h2>
      ${m.campeao ? `<small class="ouro-tx">Campeão Lendário · ${CAMPEOES[m.campeao].titulo}</small>` : ''}
      <small class="muted">${c.nome} · ${c.papel} · alcance ${ALCANCE_NOME[c.alcance]}</small>
      <small>Nível <b>${m.nivel}</b>/${nMax} ${estrelas(m.ascensoes)}</small>
      <div class="barra xp"><i style="width:${maxN ? 100 : (m.xp / xpN) * 100}%"></i></div>
      <small class="muted">${maxN ? (m.ascensoes < 2 ? 'Nível máximo: ascenda para continuar' : 'Nível máximo') : `XP ${fmt(Math.floor(m.xp))} / ${fmt(xpN)}`}</small>
      ${exp ? '<span><span class="tag exp">Em expedição</span></span>' : ''}
    </div>
  </div>
  <div class="stat-grid">${stat('vida', 'Vida')}${stat('atq', 'Ataque')}${stat('def', 'Defesa')}${stat('agi', 'Agilidade')}</div>
  <div class="derivados">
    <span>Crítico <b>${pctTxt(s.crit)}</b></span><span>Dano crítico <b>${pctTxt(s.critDmg)}</b></span>
    <span>Esquiva <b>${pctTxt(s.esquiva)}</b></span><span>Ataque a cada <b>${fmt1(s.intervalo)} s</b></span>
    <span>Roubo de vida <b>${pctTxt(s.roubo)}</b></span><span>Sorte <b>${fmt(s.sorte)}</b></span>
  </div>
  ${m.tracos.length ? `<div class="tracos">${m.tracos.map(chipTraco).join('')}</div>` : ''}
  <div class="hab ${m.campeao ? 'lendaria' : ''}"><div class="hab-cab"><b>${sk.nome}</b><span class="tag">Ativa · recarga ${fmt1(sk.cd * (1 - s.recarga))} s</span></div><p>${sk.desc(s)}</p><small class="muted">${sk.fx}. Como capitão vira SUPREMO, com o dobro do efeito.</small></div>
  <div class="hab"><div class="hab-cab"><b>${pa.nome}</b><span class="tag">Passiva</span></div><p>${pa.desc}</p></div>
  ${s.unicos.map((u) => `<div class="hab"><div class="hab-cab"><b style="color:var(--ouro)">★ ${UNICOS[u].nome}</b><span class="tag ouro">Lendário</span></div><p>${UNICOS[u].desc}</p></div>`).join('')}
  ${rodape}`;
}
function htmlPergaminhosFicha(m, s) {
  const n = slotsPergaminho(m), partes = [];
  for (const it of m.pergaminhos) {
    const P = PERGAMINHOS[it.pid], R = RARIDADES[it.raridade];
    partes.push(`<div class="hab perg" style="--rc:${R.cor}"><div class="hab-cab"><b style="color:${R.cor}">${esc(P.nome)}</b><span class="tag">${P.tipo === 'ativa' ? `Ativa · recarga ${fmt1(P.cd * (1 - s.recarga))} s` : 'Passiva'}</span></div><p>${P.desc(s)}</p>
      <button class="btn pequeno" data-act="perg-remover" data-merc="${m.id}" data-id="${it.id}">Guardar no inventário</button></div>`);
  }
  for (let i = m.pergaminhos.length; i < n; i++) partes.push(`<button class="slot-perg" data-act="perg-slot" data-id="${m.id}">+ Equipar pergaminho</button>`);
  const prox = m.nivel < 5 ? 'O 1º espaço abre no nível 5.' : m.ascensoes < 2 ? 'Cada Ascensão abre mais 1 espaço.' : '';
  return `<div class="secao"><span class="rot">Pergaminhos de habilidade${n ? ` (${m.pergaminhos.length}/${n})` : ''}</span>${partes.join('')}${prox ? `<p class="dica">${prox} Pergaminhos ativos viram habilidades extras; passivos dão bônus fixos.</p>` : ''}</div>`;
}
function htmlAscensao(m) {
  const asc = m.ascensoes || 0;
  if (asc >= 2) return `<div class="asc max"><div class="asc-cab">${estrelas(2, 14)}<b>Ascensão máxima</b></div><small>Nível máximo 30 e +20% em todos os atributos.</small></div>`;
  const A = ASCENSOES[asc], pronto = m.nivel >= A.nivel;
  const ok = pronto && STATE.ouro >= A.ouro && STATE.emblemas >= A.emblemas;
  const falta = !pronto ? `Chegue ao nível ${A.nivel}` : STATE.emblemas < A.emblemas ? `Faltam ${A.emblemas - STATE.emblemas} Emblemas` : STATE.ouro < A.ouro ? `Faltam ${fmt(A.ouro - STATE.ouro)} de ouro` : '';
  return `<div class="asc ${pronto ? 'pronta' : ''}">
    <div class="asc-cab">${canvasIcone('estrela', 18)}<b>${asc === 0 ? '1ª' : '2ª'} Ascensão</b><span class="tag">no nível ${A.nivel}</span></div>
    <small>Nível máximo ${nivelMax(m)} → ${nivelMax(m) + 10}, +10% em todos os atributos e +1 espaço de pergaminho. Custa ${fmt(A.ouro)} de ouro e ${A.emblemas} Emblemas.</small>
    <button class="btn ${ok ? 'primario' : ''} largo" data-act="ascender" data-id="${m.id}" ${ok ? '' : 'disabled'}>${ok ? `Ascender · ${precoBtn(A.ouro)} · ${precoBtn(A.emblemas, true)}` : falta}</button>
  </div>`;
}
function podeRecrutar(m) { return STATE.mercs.length < limiteElenco() && STATE.ouro >= precoMerc(m); }

/* ---- MERCADO ---- */
function textoTimerTaverna() {
  const T = STATE.taverna, faltam = Math.max(0, ECO.lutasRenovar - T.lutas);
  const ms = ECO.minutosRenovar * 60000 - (Date.now() - T.ultima);
  return `Novos mercenários em ${faltam} ${faltam === 1 ? 'luta' : 'lutas'} ou ${fmtTempo(ms)}.`;
}
function telaMercado() {
  const T = STATE.taverna, nT = STATE.construcoes.taverna, cheio = STATE.inventario.length >= ECO.invMax, P = STATE.campeaoPendente;
  return `
  ${P ? `<section class="painel destaque-ouro">
    <div class="painel-cab"><h2>${canvasIcone('estrela', 20)} Campeão à sua espera</h2></div>
    ${cardMerc(P, { pendente: true })}
    <p class="dica">${esc(P.nome)} quer entrar na guilda. Abra uma vaga no elenco (máx. ${limiteElenco()}) para recrutar de graça.</p>
  </section>` : ''}
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('taverna', 20)} Taverna <span class="nivel">nv. ${nT}</span></h2>
      <button class="btn pequeno" data-act="renovar" ${STATE.ouro < T.custo ? 'disabled' : ''}>Renovar ${canvasIcone('moeda', 12)} ${fmt(T.custo)}</button></div>
    <p class="dica" id="taverna-timer">${textoTimerTaverna()}</p>
    <div class="lista">${T.ofertas.length ? T.ofertas.map((m) => cardMerc(m, { oferta: true })).join('') : '<p class="vazio">Todos recrutados. Volte mais tarde.</p>'}</div>
    <p class="dica">Elenco ${STATE.mercs.length}/${limiteElenco()}. O Potencial (F a S) define quanto cada atributo cresce por nível.${STATE.divisao >= 2 ? ' Da Divisão Ouro em diante, um Campeão Lendário pode aparecer aqui (1% por vaga).' : ''}</p>
  </section>
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('bau', 20)} Loja</h2><span class="muted">renova junto com a Taverna</span></div>
    <div class="lista">${T.loja.length ? T.loja.map((it) => cardItem(it, `<button class="btn primario" data-act="comprar" data-id="${it.id}" ${STATE.ouro < precoItem(it) || cheio ? 'disabled' : ''}>${precoBtn(precoItem(it))}</button>`)).join('') : '<p class="vazio">Loja vazia até a próxima renovação.</p>'}</div>
    ${cheio ? '<p class="dica">Inventário cheio: venda itens para comprar mais.</p>' : ''}
  </section>
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('pocaoV', 20)} Boticário</h2><span class="muted">consumíveis</span></div>
    <div class="lista">${Object.keys(CONSUMIVEIS).map((cid) => {
      const C = CONSUMIVEIS[cid], p = precoConsumivel(cid);
      return `<div class="card">
        <span class="item-ico">${canvasIcone(C.icone, 32)}</span>
        <div class="card-corpo"><b>${C.nome}</b><small>${C.desc}</small><small>Na bolsa: ${STATE.consumiveis[cid] || 0}</small></div>
        <button class="btn ${STATE.ouro >= p ? 'primario' : ''}" data-act="comprar-cons" data-id="${cid}" ${STATE.ouro < p ? 'disabled' : ''}>${precoBtn(p)}</button></div>`;
    }).join('')}</div>
  </section>`;
}

/* ---- ITENS ---- */
function telaInventario() {
  const f = UI.filtroInv;
  const filtros = [['todos', 'Todos'], ['arma', 'Armas'], ['armadura', 'Armaduras'], ['amuleto', 'Amuletos'], ['pergaminho', 'Pergaminhos'], ['reliquia', 'Relíquias']];
  const ordemTipo = { arma: 0, armadura: 1, amuleto: 2, pergaminho: 3, reliquia: 4 };
  const itens = STATE.inventario.filter((i) => f === 'todos' || i.tipo === f).sort((a, b) => b.raridade - a.raridade || ordemTipo[a.tipo] - ordemTipo[b.tipo] || b.nivel - a.nivel);
  const equipados = STATE.mercs.filter((m) => Object.values(m.equip).some(Boolean) || m.pergaminhos.length);
  const p = STATE.pity;
  return `
  ${painelReliquias()}
  ${painelBolsa()}
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('inventario', 20, { a: '#e9dfc9', b: '#a99bb8' })} Inventário</h2><span class="muted">${STATE.inventario.length}/${ECO.invMax}</span></div>
    <div class="filtros">${filtros.map(([id, n]) => `<button class="chip-btn ${f === id ? 'on' : ''}" data-act="filtro-inv" data-id="${id}">${n}</button>`).join('')}</div>
    ${itens.length ? `<div class="grade-itens">${itens.map(tileItem).join('')}</div>`
      : '<p class="vazio">Nada aqui ainda. Vitórias e expedições podem render baús, e a Loja do Mercado vende equipamentos e pergaminhos.</p>'}
  </section>
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('forja', 20)} Forja <span class="nivel">nv. ${STATE.construcoes.forja}</span></h2><span class="muted">até +${limiteForja()}</span></div>
    <p class="dica">Cada aprimoramento dá +8% nos bônus de uma arma, armadura ou amuleto. Melhore a Forja na Guilda para ir mais longe (até +10).</p>
    <button class="btn largo" data-act="abrir-forja">Abrir a Forja</button>
  </section>
  <section class="painel">
    <h2>Equipados</h2>
    ${equipados.length ? `<div class="lista">${equipados.map((m) => `<div class="card" data-act="abrir-merc" data-id="${m.id}" role="button" tabindex="0">${canvasLook(lookMeu(m), 36)}<div class="card-corpo"><b>${esc(m.nome)}</b><small>${[...Object.values(m.equip).filter(Boolean), ...m.pergaminhos].map((it) => `<span style="color:${RARIDADES[it.raridade].cor}">${esc(nomeItem(it))}</span>`).join(' · ')}</small></div></div>`).join('')}</div>` : '<p class="vazio">Ninguém equipado. Abra a ficha de um mercenário para equipar.</p>'}
  </section>
  <section class="painel">
    <h2>Raridades e garantia</h2>
    <table class="tabela-rar"><thead><tr><th>Raridade</th><th>Chance</th><th>Poder</th><th>Bônus</th></tr></thead><tbody>
      ${RARIDADES.map((r) => `<tr><td style="color:${r.cor}">${r.nome}</td><td>${r.peso}%</td><td>×${fmt1(r.mult)}</td><td>${r.nb}${r.nome === 'Lendário' ? ' + único' : ''}</td></tr>`).join('')}
    </tbody></table>
    <p class="dica">Um baú traz equipamento (55%), pergaminho (25%), relíquia (12%) ou consumíveis (8%). Garantia: Épico ou melhor em até ${GARANTIA.epico - p.semEpico} baú(s) · Lendário em até ${GARANTIA.lendario - p.semLendario}. Sorte da guilda: ${fmt(sorteGuilda())}.</p>
  </section>`;
}
// Resumo do que as relíquias equipadas dão ao time
const REL_TXT = { atqPct: 'ATQ', defPct: 'DEF', agiPct: 'AGI', vidaPct: 'VIDA', crit: 'crítico', roubo: 'roubo de vida', recarga: 'recarga', ouro: 'ouro', xp: 'XP', ocio: 'ócio' };
const FLAG_TXT = { brasaRel: 'ataques queimam', estandarte: 'escudo inicial', fenix: 'Fênix' };
function resumoReliquias() {
  const partes = [];
  for (const k in REL_TXT) { const v = somaReliquia(k); if (v) partes.push(`${k === 'recarga' ? '−' : v > 0 ? '+' : '−'}${fmt1(Math.abs(v) * 100)}% ${REL_TXT[k]}`); }
  const sorte = somaReliquia('sorte'), off = somaReliquia('offline');
  if (sorte) partes.push(`+${sorte} Sorte`);
  if (off) partes.push(`+${off} h offline`);
  for (const f of flagsReliquias()) partes.push(FLAG_TXT[f] || f);
  return partes.join(' · ');
}
function painelReliquias() {
  const n = slotsReliquia(), cards = [];
  for (let i = 0; i < n; i++) {
    const it = STATE.reliquias[i];
    cards.push(it ? `<button class="rel-tile" style="--rc:${RARIDADES[it.raridade].cor}" data-act="abrir-item" data-id="${it.id}" aria-label="${esc(it.nome)}">${iconeDeItem(it, 30)}<small>${esc(it.nome)}</small></button>`
      : '<button class="rel-tile vazio" data-act="rel-slot" aria-label="Equipar relíquia"><span class="equip-vazio">+</span><small>livre</small></button>');
  }
  const prox = DIVISOES.find((d, i) => i > STATE.divisao && d.reliquias > n), resumo = resumoReliquias();
  return `<section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('reliquia', 20)} Relíquias da guilda</h2><span class="muted">${STATE.reliquias.length}/${n}</span></div>
    <div class="rel-grade" style="--n:${n}">${cards.join('')}</div>
    ${resumo ? `<p class="rel-resumo">${resumo}</p>` : ''}
    <p class="dica">Valem para o time inteiro em todas as lutas.${prox ? ` Na Divisão ${prox.nome} abre o ${prox.reliquias}º espaço.` : ''}</p>
  </section>`;
}
function painelBolsa() {
  const tem = Object.keys(CONSUMIVEIS).filter((cid) => STATE.consumiveis[cid] > 0);
  return `<section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('pocaoV', 20)} Bolsa</h2><span class="muted">consumíveis</span></div>
    ${tem.length ? `<div class="bolsa">${tem.map((cid) => `<button class="tile-cons ${STATE.preparo[cid] ? 'on' : ''}" data-act="abrir-cons" data-id="${cid}" aria-label="${CONSUMIVEIS[cid].nome}">${canvasIcone(CONSUMIVEIS[cid].icone, 30)}<b>×${STATE.consumiveis[cid]}</b>${STATE.preparo[cid] ? '<small>na luta</small>' : ''}</button>`).join('')}</div>`
      : '<p class="vazio">Bolsa vazia. O Boticário, no Mercado, vende poções, bombas, tônicos e mapas.</p>'}
    <p class="dica">Toque num consumível para usar. Os de luta você escolhe antes de lutar, na aba Liga.</p>
  </section>`;
}
function htmlConsumivel(cid) {
  const C = CONSUMIVEIS[cid], q = STATE.consumiveis[cid] || 0;
  let acao;
  if (C.luta) acao = `<button class="btn ${STATE.preparo[cid] ? '' : 'primario'} enorme" data-act="preparo" data-id="${cid}" ${q ? '' : 'disabled'}>${STATE.preparo[cid] ? 'Não levar na próxima luta' : 'Levar na próxima luta'}</button>`;
  else if (C.uso === 'mapa' && STATE.mapaAtivo) acao = '<p class="dica">Já existe um mapa pronto para a próxima expedição.</p>';
  else acao = `<button class="btn primario enorme" data-act="usar-cons" data-id="${cid}" ${q ? '' : 'disabled'}>Usar agora</button>`;
  return `<div class="card item" style="--rc:var(--linha)"><span class="item-ico">${canvasIcone(C.icone, 48)}</span><div class="card-corpo"><b style="font-size:17px">${C.nome}</b><small>Na bolsa: ${q}</small></div></div>
    <p>${C.desc}</p>${acao}`;
}
// Detalhe de qualquer item (onde ele estiver)
function htmlItem(a) {
  const it = a.it, R = RARIDADES[it.raridade];
  const onde = a.onde === 'merc' ? `Equipado em ${esc(a.m.nome)}` : a.onde === 'perg' ? `Com ${esc(a.m.nome)}` : a.onde === 'reliquia' ? 'Equipada na guilda' : 'No inventário';
  const partes = [`<div class="card item" style="--rc:${R.cor}"><span class="item-ico">${iconeDeItem(it, 56)}</span><div class="card-corpo"><b style="color:${R.cor};font-size:17px">${esc(nomeItem(it))}</b><small>${R.nome} · ${tipoItemTxt(it)}</small><small>${onde}</small></div></div>`];
  const vender = a.onde === 'inv' ? `<button class="btn perigo" data-act="vender-item" data-id="${it.id}">Vender por ${fmt(valorVendaItem(it))} ouro</button>` : '';
  if (ehEquipamento(it)) {
    const be = bonusEfetivo(it);
    partes.push(`<div class="derivados">${Object.entries(be).map(([k, v]) => `<span>${STAT_NOME[k]} <b>${txtBonus(k, v).split(' ')[0]}</b></span>`).join('')}</div>`);
    if (it.unico) partes.push(`<div class="hab"><b style="color:var(--ouro)">★ ${UNICOS[it.unico].nome}</b><p>${UNICOS[it.unico].desc}</p></div>`);
    if (it.flavor) partes.push(`<p class="muted"><i>“${esc(it.flavor)}”</i></p>`);
    const c = custoAprimorar(it), pode = podeAprimorar(it);
    partes.push(`<div class="forja-linha">${canvasIcone('forja', 24)}<div><b>Forja</b><small>${pode ? `+${it.aprim || 0} → +${(it.aprim || 0) + 1}: bônus +8%` : (it.aprim || 0) >= 10 ? 'Aprimoramento máximo (+10)' : `A Forja nv. ${STATE.construcoes.forja} vai até +${limiteForja()}`}</small></div>
      ${pode ? `<button class="btn ${STATE.ouro >= c ? 'primario' : ''}" data-act="aprimorar" data-id="${it.id}" ${STATE.ouro >= c ? '' : 'disabled'}>${precoBtn(c)}</button>` : ''}</div>`);
    if (a.onde === 'inv') partes.push(`<span class="rot">Equipar em</span><div class="chips-grupo">${STATE.mercs.map((m) => `<button class="chip-btn" data-act="equipar" data-merc="${m.id}" data-item="${it.id}">${esc(m.nome)} · ${CLASSES[m.classe].papel}${m.equip[it.tipo] ? ' (troca)' : ''}</button>`).join('')}</div>`);
    if (a.onde === 'merc') partes.push(`<button class="btn" data-act="desequipar" data-id="${a.m.id}" data-tipo="${a.slot}">Remover de ${esc(a.m.nome)}</button>`);
  } else if (it.tipo === 'pergaminho') {
    const P = PERGAMINHOS[it.pid];
    const s = a.onde === 'perg' ? atributos(a.m) : null;
    partes.push(`<div class="hab"><div class="hab-cab"><b>${P.tipo === 'ativa' ? `Habilidade ativa · recarga ${P.cd} s` : 'Bônus passivo'}</b>${P.fx ? `<span class="tag">${P.fx}</span>` : ''}</div><p>${P.desc(s)}</p><small class="muted">Serve para: ${txtPapeis(it.pid)}</small></div>`);
    if (a.onde === 'inv') {
      const aptos = STATE.mercs.filter((m) => pergaminhoServe(it.pid, CLASSES[m.classe].papelId));
      partes.push(`<span class="rot">Equipar em</span>${aptos.length ? `<div class="chips-grupo">${aptos.map((m) => {
        const livre = m.pergaminhos.length < slotsPergaminho(m), repetido = m.pergaminhos.some((p) => p.pid === it.pid);
        const motivo = repetido ? 'já tem' : !slotsPergaminho(m) ? 'nível 5' : !livre ? 'sem espaço' : '';
        return `<button class="chip-btn" data-act="perg-equipar" data-merc="${m.id}" data-item="${it.id}" ${motivo ? 'disabled' : ''}>${esc(m.nome)}${motivo ? ` (${motivo})` : ''}</button>`;
      }).join('')}</div>` : '<p class="dica">Ninguém do elenco tem um papel compatível.</p>'}`);
    }
    if (a.onde === 'perg') partes.push(`<button class="btn" data-act="perg-remover" data-merc="${a.m.id}" data-id="${it.id}">Guardar no inventário</button>`);
  } else if (it.tipo === 'reliquia') {
    partes.push(`<div class="hab"><b>Efeito para o time todo</b><p>${RELIQUIAS[it.rid].desc}</p></div>`);
    if (a.onde === 'inv') {
      const repetida = STATE.reliquias.some((r) => r.rid === it.rid), cheio = STATE.reliquias.length >= slotsReliquia();
      partes.push(`<button class="btn primario" data-act="rel-equipar" data-id="${it.id}" ${repetida || cheio ? 'disabled' : ''}>${repetida ? 'Já há uma igual equipada' : cheio ? `Espaços cheios (${slotsReliquia()})` : 'Equipar na guilda'}</button>`);
    }
    if (a.onde === 'reliquia') partes.push(`<button class="btn" data-act="rel-guardar" data-id="${it.id}">Guardar no inventário</button>`);
  }
  if (vender) partes.push(vender);
  return partes.join('');
}
function abrirItem(id) { const a = acharItem(id); if (a) abrirModal(htmlItem(a), { dados: { item: id } }); }
function abrirEscolhaItem(m, tipo) {
  const itens = STATE.inventario.filter((i) => i.tipo === tipo).sort((a, b) => b.raridade - a.raridade || b.nivel - a.nivel);
  const atual = m.equip[tipo];
  abrirModal(`
    <h2>${TIPOS_ITEM[tipo]} de ${esc(m.nome)}</h2>
    ${atual ? cardItem(atual, `<button class="btn" data-act="desequipar" data-id="${m.id}" data-tipo="${tipo}">Remover</button>`) : '<p class="muted">Nenhum item equipado neste espaço.</p>'}
    <span class="rot">No inventário</span>
    ${itens.length ? `<div class="lista">${itens.map((it) => cardItem(it, `<button class="btn primario" data-act="equipar" data-merc="${m.id}" data-item="${it.id}">Equipar</button>`)).join('')}</div>`
      : '<p class="vazio">Nenhum item desse tipo. Vença lutas para achar baús ou compre na Loja.</p>'}`, { dados: { escolha: true } });
}
function abrirEscolhaPergaminho(m) {
  const papel = CLASSES[m.classe].papelId, s = atributos(m);
  const todos = STATE.inventario.filter((i) => i.tipo === 'pergaminho');
  const aptos = todos.filter((i) => pergaminhoServe(i.pid, papel) && !m.pergaminhos.some((p) => p.pid === i.pid)).sort((a, b) => b.raridade - a.raridade);
  abrirModal(`
    <h2>Pergaminho para ${esc(m.nome)}</h2>
    <p class="dica">${CLASSES[m.classe].papel}: só aparecem pergaminhos compatíveis com o papel.${todos.length > aptos.length ? ` ${todos.length - aptos.length} outro(s) no inventário não servem.` : ''}</p>
    ${aptos.length ? `<div class="lista">${aptos.map((it) => cardItem(it, `<button class="btn primario" data-act="perg-equipar" data-merc="${m.id}" data-item="${it.id}">Equipar</button>`, s)).join('')}</div>`
      : '<p class="vazio">Nenhum pergaminho compatível. Eles vêm de baús e da Loja do Mercado.</p>'}`, { dados: { escolha: true } });
}
function htmlEscolhaReliquia() {
  const rels = STATE.inventario.filter((i) => i.tipo === 'reliquia').sort((a, b) => b.raridade - a.raridade);
  const cheio = STATE.reliquias.length >= slotsReliquia();
  return `<h2>${canvasIcone('reliquia', 20)} Equipar relíquia</h2>
    <p class="dica">Espaços: ${STATE.reliquias.length}/${slotsReliquia()}. Relíquias iguais não se somam.</p>
    ${rels.length ? `<div class="lista">${rels.map((it) => {
      const rep = STATE.reliquias.some((r) => r.rid === it.rid);
      return cardItem(it, `<button class="btn primario" data-act="rel-equipar" data-id="${it.id}" ${rep || cheio ? 'disabled' : ''}>${rep ? 'Igual' : 'Equipar'}</button>`);
    }).join('')}</div>` : '<p class="vazio">Nenhuma relíquia no inventário. Elas vêm de baús, da Copa e das expedições.</p>'}`;
}
function htmlForja() {
  const lim = limiteForja(), equipados = [];
  for (const m of STATE.mercs) for (const k of Object.keys(TIPOS_ITEM)) if (m.equip[k]) equipados.push({ it: m.equip[k], m });
  const inv = STATE.inventario.filter(ehEquipamento).sort((a, b) => b.raridade - a.raridade || b.nivel - a.nivel).map((it) => ({ it }));
  const linha = ({ it, m }) => {
    const c = custoAprimorar(it), pode = podeAprimorar(it), ok = pode && STATE.ouro >= c;
    return cardItem(it, `<button class="btn ${ok ? 'primario' : ''}" data-act="aprimorar" data-id="${it.id}" ${ok ? '' : 'disabled'}>${pode ? `+${(it.aprim || 0) + 1} · ${precoBtn(c)}` : 'Máx.'}</button>`) .replace('</small>', `${m ? ` · com ${esc(m.nome)}` : ''}</small>`);
  };
  return `<h2>${canvasIcone('forja', 22)} Forja <span class="nivel">nv. ${STATE.construcoes.forja}</span></h2>
    <p class="dica">Aprimora até +${lim}. Cada nível dá +8% nos bônus do item (+80% no +10). Ao vender, metade do ouro investido volta.</p>
    ${equipados.length ? `<span class="rot">Equipados</span><div class="lista">${equipados.map(linha).join('')}</div>` : ''}
    ${inv.length ? `<span class="rot">No inventário</span><div class="lista">${inv.map(linha).join('')}</div>` : ''}
    ${!equipados.length && !inv.length ? '<p class="vazio">Nenhum equipamento para aprimorar.</p>' : ''}`;
}

/* ---- LIGA ---- */
function telaLiga() {
  const L = STATE.liga;
  const topo = L.fase === 'liga' ? painelRodada() : L.fase === 'copa' ? painelCopa() : painelFimTemporada();
  const cls = classificacao(), div = STATE.divisao, ultimaDiv = div >= DIVISOES.length - 1;
  const tabela = `<section class="painel"><div class="painel-cab"><h2>Classificação</h2><span class="muted">Divisão ${divAtual().nome}</span></div>
    <div class="tabela-wrap"><table class="tabela"><thead><tr><th>#</th><th></th><th class="esq">Guilda</th><th>V</th><th>D</th><th>Saldo</th><th>Pts</th></tr></thead><tbody>
    ${cls.map((x, i) => { const sd = x.g.abP - x.g.abC; return `<tr class="${x.i === 0 ? 'eu' : ''} ${i < 2 && !ultimaDiv ? 'sobe' : ''} ${i === 7 && div > 0 ? 'cai' : ''}"><td>${i + 1}${i < 4 ? '<i class="mk-copa" title="Vaga na Copa"></i>' : ''}</td><td>${canvasBrasao(x.g, 18)}</td><td class="esq">${esc(x.g.nome)}</td><td>${x.g.v}</td><td>${x.g.d}</td><td>${sd > 0 ? '+' : ''}${sd}</td><td><b>${x.g.pontos}</b></td></tr>`; }).join('')}
    </tbody></table></div><p class="dica">Vitória vale 3 pontos. Saldo = abates feitos − sofridos. Os 4 primeiros (marca dourada) jogam a Copa${ultimaDiv ? '' : ', os 2 primeiros sobem'}${div > 0 ? ' e o último cai' : ''}.</p></section>`;
  const ult = L.resultados.length ? `<section class="painel"><h2>Última rodada</h2><ul class="resultados">${L.resultados.map((r) => `<li><span class="${r.vencedor === r.a ? 'venceu' : ''}">${esc(r.a)}</span><b>${r.placar}</b><span class="${r.vencedor === r.b ? 'venceu' : ''}">${esc(r.b)}</span></li>`).join('')}</ul></section>` : '';
  const nvA = STATE.amistoso ? STATE.amistoso.mercs.reduce((t, m) => t + m.nivel, 0) / STATE.amistoso.mercs.length : 0;
  if (!STATE.amistoso || nvA < nivelMedioTime() - 2 || STATE.amistoso.mercs.length !== tamanhoTime()) gerarAmistoso();
  const A = STATE.amistoso;
  const amist = `<section class="painel"><div class="painel-cab"><h2>Amistoso</h2><span class="muted">50% das recompensas</span></div>
    <div class="card">${canvasBrasao(A, 40)}<div class="card-corpo"><b>${esc(A.nome)}</b><small>Poder ${fmt(poderLista(A.mercs, multAdversario()))} · níveis ${A.mercs.map((m) => m.nivel).join(', ')}</small><small>Treino que não vale pontos.</small></div><button class="btn" data-act="lutar-amistoso">Treinar</button></div></section>`;
  return escadaDivisoes() + topo + tabela + ult + amist;
}
function escadaDivisoes() {
  return `<section class="escada" aria-label="Divisões">${DIVISOES.map((d, i) => `<span class="degrau ${i === STATE.divisao ? 'atual' : i < STATE.divisao ? 'feito' : ''}" style="--dc:${d.cor}">${d.nome}</span>`).join('<i aria-hidden="true">›</i>')}</section>`;
}
function htmlConfronto(g, mult) {
  return `<div class="confronto">
      <div class="lado-c">${canvasBrasao(STATE.guilda, 48)}<b>${esc(STATE.guilda.nome)}</b><small>Poder ${fmt(poderLista(timeMercs()))}</small></div>
      <div class="vs">VS</div>
      <div class="lado-c">${canvasBrasao(g, 48)}<b>${esc(g.nome)}</b><small>Poder ${fmt(poderLista(g.mercs, mult))}</small></div>
    </div>
    <div class="rival-elenco">${g.mercs.map((m) => `<div class="mini ${m.chefe ? 'chefe' : ''}">${canvasLook(lookDe(m, g.cor1, g.cor2), 36)}<small>${m.chefe ? `<b class="ouro-tx">${m.chefe === 'eco' ? 'GUARDIÃO' : 'LÍDER'}</b><br>` : ''}${CLASSES[m.classe].papel}<br>nv. ${m.nivel} ${m.chefe ? '' : badgePot(m.pot)}</small></div>`).join('')}</div>`;
}
function htmlPreparo() {
  const tem = CONSUMIVEIS_LUTA.filter((cid) => STATE.consumiveis[cid] > 0);
  return `<div class="preparo"><span class="rot">Preparo para a luta</span>
    ${tem.length ? `<div class="chips-grupo">${tem.map((cid) => `<button class="chip-btn cons ${STATE.preparo[cid] ? 'on' : ''}" data-act="preparo" data-id="${cid}" aria-pressed="${!!STATE.preparo[cid]}">${canvasIcone(CONSUMIVEIS[cid].icone, 16)} ${CONSUMIVEIS[cid].nome} ×${STATE.consumiveis[cid]}</button>`).join('')}</div><small class="dica">Os escolhidos são gastos quando a luta começa.</small>`
      : '<small class="dica">Sem consumíveis de luta na bolsa. O Boticário, no Mercado, vende poções e bombas.</small>'}
  </div>`;
}
function painelRodada() {
  const L = STATE.liga, g = adversarioDaRodada();
  return `<section class="painel">
    <div class="painel-cab"><h2>Rodada ${L.rodada + 1} de 7</h2><span class="tag">${DIFICULDADES[STATE.config.dif].nome}</span></div>
    ${htmlConfronto(g, multAdversario())}
    ${htmlPreparo()}
    <button class="btn primario enorme" data-act="lutar-liga">Lutar</button>
  </section>`;
}
function painelCopa() {
  const L = STATE.liga, C = L.copa, g = adversarioCopa(), semi = C.etapa === 'semi', Ld = LIDERES[STATE.divisao];
  return `<section class="painel copa">
    <div class="painel-cab"><h2>${canvasIcone('liga', 20, { a: '#f0c24b', b: '#b8892a' })} Copa ${divAtual().nome}</h2><span class="tag ouro">${semi ? 'Semifinal' : 'Final'}</span></div>
    <div class="chave"><span class="${semi ? 'atual' : 'feito'}">Semifinal</span><i aria-hidden="true">›</i><span class="${semi ? '' : 'atual'}">Final contra o Líder</span></div>
    <p class="dica">Você terminou a liga em ${L.pos}º lugar. ${semi ? `Vença ${esc(g.nome)} para enfrentar ${Ld.nome} na final.` : `Vença ${Ld.nome} para levar a Copa: 3 Emblemas, baú Raro ou melhor e ${Math.round(COPA.chanceCampeao[STATE.divisao] * 100)}% de chance de um Campeão Lendário entrar na guilda.`}</p>
    ${semi ? '' : `<div class="lider"><div class="retrato chefe">${canvasLook(lookDe(g.mercs[0], g.cor1, g.cor2), 72)}</div><div><span class="tag ouro">Líder da divisão</span><b>${Ld.nome}</b><small>${Ld.desc}</small><small class="muted">Atributos ×1,5.</small></div></div>`}
    ${htmlConfronto(g, multAdversario())}
    ${htmlPreparo()}
    <button class="btn primario enorme" data-act="lutar-copa">${semi ? 'Lutar a semifinal' : 'Desafiar o Líder'}</button>
  </section>`;
}
function painelFimTemporada() {
  const L = STATE.liga, p = premiosTemporada(), C = L.copa, Ld = LIDERES[STATE.divisao];
  const prox = p.sobe ? DIVISOES[STATE.divisao + 1] : p.cai ? DIVISOES[STATE.divisao - 1] : divAtual();
  const copaTxt = !C ? 'Só os 4 primeiros disputam a Copa.' : C.venceuFinal ? `Campeões da Copa! ${Ld.nome} foi derrotado.` : C.venceuSemi ? `Vice da Copa: ${Ld.nome} venceu a final.` : 'Eliminados na semifinal da Copa.';
  return `<section class="painel fim-temp">
    <h2>Temporada ${L.temporada} encerrada</h2>
    <p class="pos-final">${p.pos}º lugar</p>
    <p class="dica">${copaTxt}</p>
    <div class="premios">
      <span>${canvasIcone('moeda', 16)} +${fmt(p.ouro)} ouro</span>
      ${p.emblemas ? `<span>${canvasIcone('emblema', 16)} +${p.emblemas} ${p.emblemas === 1 ? 'Emblema' : 'Emblemas'}</span>` : ''}
      ${p.bau >= 0 ? `<span>${canvasIcone('bau', 16)} baú${p.bau === 2 ? ' Raro ou melhor' : ''}</span>` : ''}
    </div>
    <p class="mov ${p.sobe ? 'sobe' : p.cai ? 'cai' : ''}">${p.sobe ? `Promoção! A próxima temporada é na Divisão ${prox.nome}.` : p.cai ? `Rebaixamento: a próxima temporada é na Divisão ${prox.nome}.` : `A guilda continua na Divisão ${prox.nome}.`}</p>
    <button class="btn primario enorme" data-act="nova-temporada">Receber prêmios</button>
  </section>`;
}

