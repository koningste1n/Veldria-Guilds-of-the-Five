/* ============================ INTERFACE: TORRE INFINITA E ESTATÍSTICAS ============================ */
const nomeEco = (n) => CAMPEOES[ecoDoAndar(n)].nome.split(/[ ,]/)[0];
function escadaTorre(n) {
  const linhas = [];
  for (let k = n + 3; k >= Math.max(1, n - 2); k--) {
    const md = modDoAndar(k), gd = TORRE.guardiao(k), estado = k < n ? 'feito' : k === n ? 'atual' : 'futuro';
    const info = gd ? `Guardião: eco de ${nomeEco(k)}` : md ? md.nome : 'Andar comum';
    const premios = [TORRE.bau(k) ? canvasIcone('bau', 14) : '', TORRE.emblemas(k) ? canvasIcone('emblema', 14) : ''].join('');
    linhas.push(`<div class="andar ${estado} ${gd ? 'guardiao' : ''}">
      <span class="an-num">${k}</span><span class="an-info">${info}</span>
      <span class="an-fim">${estado === 'feito' ? '<i class="ok-marca">vencido</i>' : premios}</span></div>`);
  }
  return `<div class="torre-col" aria-label="Andares da torre"><div class="torre-teto"></div>${linhas.join('')}</div>`;
}
function telaTorre() {
  const T = STATE.torre, n = proximoAndar(), g = inimigoDaTorre(), md = modDoAndar(n), r = recompensaAndar(n), gd = TORRE.guardiao(n);
  const xp = Math.round(ECO.xpBase + ECO.xpPorNivel * TORRE.nivel(n));
  return `
  <section class="painel torre-topo">
    <div class="painel-cab"><h2>${canvasIcone('torre', 20, { a: '#e9dfc9', b: '#a99bb8' })} Torre Infinita</h2><span class="tag">${T.recorde ? `Recorde: andar ${T.recorde}` : 'Sem recorde'}</span></div>
    <p class="dica">Suba andar por andar. Os inimigos ficam mais fortes, muitos andares têm uma regra especial e, a cada 10, um Guardião espera: o eco de um Campeão Lendário. As recompensas vêm na primeira vitória de cada andar.</p>
    ${escadaTorre(n)}
  </section>
  <section class="painel andar-atual ${gd ? 'guardiao' : ''}">
    <div class="painel-cab"><h2>Andar ${n}</h2>${gd ? '<span class="tag ouro">Guardião</span>' : `<span class="tag">inimigos nv. ${TORRE.nivel(n)}</span>`}</div>
    ${md ? `<div class="mod-andar"><b>${md.nome}</b><small>${md.desc}</small></div>` : '<p class="dica">Sem regra especial neste andar.</p>'}
    ${gd ? `<div class="lider"><div class="retrato chefe">${canvasLook(lookDe(g.mercs[0], g.cor1, g.cor2), 72)}</div><div><span class="tag ouro">Guardião da Torre</span><b>${esc(g.mercs[0].nome)}</b><small>${SKILLS[skillDe(g.mercs[0])].nome}: ${SKILLS[skillDe(g.mercs[0])].fx.toLowerCase()}.</small><small class="muted">Atributos de Campeão ×1,2.</small></div></div>` : ''}
    ${htmlConfronto(g, multDificuldade() * TORRE.mult(n))}
    <div class="premios-andar"><span class="rot">Recompensa da 1ª vitória</span>
      <div class="premios">
        <span>${canvasIcone('moeda', 16)} +${fmt(r.ouro)}</span><span>+${fmt(xp)} XP</span>
        ${r.emblemas ? `<span>${canvasIcone('emblema', 16)} +${r.emblemas}</span>` : ''}
        ${r.bau >= 0 ? `<span>${canvasIcone('bau', 16)} baú${r.bau >= 2 ? ' Raro ou melhor' : ''}</span>` : ''}
      </div></div>
    ${htmlPreparo()}
    <button class="btn primario enorme" data-act="lutar-torre">${gd ? 'Enfrentar o Guardião' : `Subir para o andar ${n}`}</button>
  </section>
  <section class="painel">
    <div class="painel-cab"><h2>${canvasIcone('moeda', 20)} Tributo da Torre</h2><span class="muted">1 vez por dia</span></div>
    <p class="dica">Quanto mais alto o recorde, maior o tributo: 25 de ouro por andar conquistado.</p>
    <button class="btn ${tributoDisponivel() ? 'primario' : ''} largo" data-act="tributo" ${tributoDisponivel() ? '' : 'disabled'}>${T.recorde === 0 ? 'Vença o 1º andar para liberar' : tributoDisponivel() ? `Coletar +${fmt(valorTributo())} ouro` : 'Coletado hoje. Volte amanhã'}</button>
  </section>`;
}

/* ---- estatísticas ---- */
function fmtCompacto(n) {
  n = Math.round(n || 0);
  if (n >= 1e6) return `${fmt1(n / 1e6)} mi`;
  if (n >= 1e4) return `${fmt1(n / 1e3)} mil`;
  return fmt(n);
}
const COPA_TXT = { campeao: 'Campeão', vice: 'Vice', semi: 'Semifinal' };
function htmlEstatisticas() {
  const S = STATE.stats, taxa = S.lutas ? Math.round((S.vitorias / S.lutas) * 100) : 0;
  const tile = (rot, valor, sub) => `<div class="kpi"><span class="rot">${rot}</span><b>${valor}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const kpis = [
    tile('Vitórias', fmt(S.vitorias), `${fmt(S.lutas)} partidas · ${taxa}%${S.rodadas > S.lutas ? ` · ${fmt(S.rodadas)} lutas` : ''}`),
    tile('Temporadas', fmt(S.temporadas), `${fmt(S.copas)} ${S.copas === 1 ? 'Copa' : 'Copas'} · ${fmt(S.promocoes)} ${S.promocoes === 1 ? 'promoção' : 'promoções'}`),
    tile('Guardiões', fmt(S.guardioes), `${fmt(S.torreLutas)} lutas na Torre`),
    tile('Maior golpe', fmt(S.maiorGolpe), `${fmt(S.supremos)} supremos`),
    tile('Dano total', fmtCompacto(S.dano), `${fmt(S.abates)} abates · ${fmt(S.mortes)} quedas`),
    tile('Cura total', fmtCompacto(S.cura), `${fmtTempo(S.tempoLuta * 1000)} em luta`),
    tile('Ouro ganho', fmtCompacto(S.ouroGanho), `${fmt(S.baus)} baús abertos`),
    tile('Lendários', fmt(S.lendarios), `${fmt(S.expedicoes)} expedições`),
  ];
  const st = (m) => m.stats || statsMercPadrao();
  const mercs = STATE.mercs.slice().sort((a, b) => (st(b).dano - st(a).dano) || (st(b).lutas - st(a).lutas));
  const maxDano = Math.max(1, ...mercs.map((m) => st(m).dano));
  const linhasMerc = mercs.map((m) => `<div class="est-merc">
      ${canvasLook(lookMeu(m), 32)}
      <div class="em-corpo"><div class="em-linha"><b>${nomeMerc(m)}</b><span class="em-valor">${fmtCompacto(st(m).dano)}</span></div>
        <div class="em-barra"><i style="width:${Math.max(st(m).dano ? 2 : 0, (st(m).dano / maxDano) * 100)}%"></i></div>
        <small>${CLASSES[m.classe].papel} · ${fmt(st(m).lutas)} lutas · ${fmt(st(m).abates)} abates · ${fmt(st(m).mvp)} MVP</small></div></div>`).join('');
  const hist = STATE.historico.slice().reverse();
  const linhasHist = hist.map((h) => { const d = DIVISOES[h.div] || DIVISOES[0]; return `<tr><td>${h.t}</td><td><span class="div-tag" style="--dc:${d.cor}">${d.nome}</span></td><td><b>${h.pos}º</b></td><td>${h.copa ? COPA_TXT[h.copa] : '—'}</td><td class="${h.mov}">${h.mov === 'sobe' ? 'Subiu' : h.mov === 'cai' ? 'Caiu' : '—'}</td></tr>`; }).join('');
  return `<h2>${canvasIcone('estatisticas', 22)} Estatísticas</h2>
    ${htmlRastro(tile)}
    ${htmlMelhoresTemporada()}
    <section class="est-sec"><h3>Totais da guilda</h3><div class="kpis">${kpis.join('')}</div></section>
    <section class="est-sec"><h3>Mercenários</h3><p class="dica">Dano total causado por cada um desde que entrou na guilda.</p>
      ${linhasMerc || '<p class="vazio">Sem lutas ainda.</p>'}</section>
    ${htmlUltimasLutas()}
    <section class="est-sec"><h3>Temporadas</h3>
      ${hist.length ? `<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Temp.</th><th>Divisão</th><th>Posição</th><th>Copa</th><th>Divisão seguinte</th></tr></thead><tbody>${linhasHist}</tbody></table></div>` : '<p class="vazio">O histórico aparece quando a primeira temporada terminar.</p>'}</section>`;
}
// Ficha de rastro: sequência, Torre, Líder mais derrotado e tempo de jogo
function htmlRastro(tile) {
  const S = STATE.stats, lv = Object.entries(S.lideresVencidos || {}).sort((a, b) => b[1] - a[1])[0];
  const lider = lv && LIDERES.find((l) => l.id === lv[0]);
  return `<section class="est-sec"><h3>Recordes</h3><div class="kpis">
    ${tile('Sequência de vitórias', fmt(S.seqAtual), `recorde: ${fmt(S.seqRecorde)}`)}
    ${tile('Melhor andar da Torre', STATE.torre.recorde ? `andar ${STATE.torre.recorde}` : '—', `${fmt(S.guardioes)} ${S.guardioes === 1 ? 'Guardião vencido' : 'Guardiões vencidos'}`)}
    ${tile('Líder mais derrotado', lider ? esc(lider.nome) : '—', lider ? `${fmt(lv[1])} ${lv[1] === 1 ? 'vitória' : 'vitórias'} na final` : S.lideres ? 'conta a partir da v0.6' : 'vença a final da Copa')}
    ${tile('Tempo de jogo', fmtDuracao((S.tempoJogo || 0) / 60000), 'com o jogo aberto, desde a v0.6')}
  </div></section>`;
}
// Melhores da temporada: 5 categorias, filtro por função, meus heróis contra os das guildas rivais
function htmlMelhoresTemporada() {
  const f = UI.recFuncao && (UI.recFuncao === 'todas' || FUNCOES[UI.recFuncao]) ? UI.recFuncao : 'todas';
  const R = STATE.temporadaRec, t = STATE.liga ? STATE.liga.temporada : 1;
  const chips = [['todas', 'Todas'], ...Object.entries(FUNCOES)].map(([id, n]) => `<button class="chip-btn alto ${f === id ? 'on' : ''}" data-act="rec-funcao" data-id="${id}">${n}</button>`).join('');
  const linha = (c) => ({ h, pos }) => `<div class="rec-linha ${h.meu ? 'meu' : ''}"><span class="rec-pos">${pos}º</span>${canvasLook(h.look, 26)}
    <div class="rec-nome"><b>${esc(h.nome)}</b><small>${h.meu ? 'sua guilda' : esc(h.guilda)} · ${FUNCOES[funcaoDe(h.cls)]}</small></div><span class="rec-valor">${c.txt(h)}</span></div>`;
  const cards = CATEGORIAS_TEMPORADA.map((c) => {
    const top = rankingTemporada(c, f);
    return `<div class="rec-cat" data-cat="${c.id}"><div class="rec-cab"><b>${c.nome}</b>${c.dica ? `<small>${c.dica}</small>` : ''}</div>
      ${top.length ? top.map(linha(c)).join('') : '<p class="vazio">Ninguém ainda.</p>'}</div>`;
  }).join('');
  return `<section class="est-sec melhores"><h3>Melhores da temporada ${t}</h3>
    <p class="dica">Seus heróis contra os das guildas rivais, em todas as lutas desta temporada. Os seus aparecem destacados.</p>
    <div class="filtros">${chips}</div>
    ${R && Object.keys(R.herois).length ? cards : '<p class="vazio">Os melhores aparecem depois da primeira luta da temporada.</p>'}</section>`;
}
const TIPO_LUTA = { liga: 'Liga', copa: 'Copa', torre: 'Torre', amistoso: 'Amistoso' };
function htmlUltimasLutas() {
  const lista = STATE.partidas.slice(-10).reverse();
  if (!lista.length) return '<section class="est-sec"><h3>Últimas lutas</h3><p class="vazio">O registro começa na próxima luta.</p></section>';
  const linhas = lista.map((p) => {
    const mvp = p.times[0].find((u) => u.mvp) || p.times[0][0];
    return `<div class="partida"><span class="tag ${p.vit ? 'vit' : 'der'}">${p.vit ? 'V' : 'D'}</span>
      <div class="pt-corpo"><b>${TIPO_LUTA[p.tipo] || p.tipo}${p.tipo === 'torre' && p.andar ? ` ${p.andar}` : ''} · ${esc(p.rival)}</b>
        <small>Luta nº ${p.n}${p.serie ? ` · luta ${p.serie.rodada} de até ${p.serie.de} (${p.serie.placar[0]}×${p.serie.placar[1]})` : ''} · ${fmtTempo(p.tempo * 1000)} · destaque: ${esc(mvp ? mvp.nome : '—')}${p.criador ? ' · Modo Criador' : ''}</small></div>
      ${p.replay ? `<button class="btn pequeno" data-act="conferir-partida" data-n="${p.n}">Conferir</button>` : ''}</div>`;
  }).join('');
  return `<section class="est-sec"><h3>Últimas lutas</h3>
    <p class="dica">Cada luta fica registrada com a semente e os times. "Conferir" roda a luta de novo, sem tela, e confere se o resultado é idêntico.</p>
    ${linhas}</section>`;
}
function abrirEstatisticas() { abrirModal(htmlEstatisticas(), { dados: { estatisticas: true } }); }

