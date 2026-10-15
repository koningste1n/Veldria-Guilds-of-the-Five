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
    tile('Vitórias', fmt(S.vitorias), `${fmt(S.lutas)} lutas · ${taxa}%`),
    tile('Temporadas', fmt(S.temporadas), `${fmt(S.copas)} ${S.copas === 1 ? 'Copa' : 'Copas'} · ${fmt(S.promocoes)} ${S.promocoes === 1 ? 'promoção' : 'promoções'}`),
    tile('Recorde da Torre', STATE.torre.recorde ? `andar ${STATE.torre.recorde}` : '—', `${fmt(S.guardioes)} ${S.guardioes === 1 ? 'Guardião vencido' : 'Guardiões vencidos'}`),
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
    <div class="kpis">${kpis.join('')}</div>
    <section class="est-sec"><h3>Mercenários</h3><p class="dica">Dano total causado por cada um desde que entrou na guilda.</p>
      ${linhasMerc || '<p class="vazio">Sem lutas ainda.</p>'}</section>
    <section class="est-sec"><h3>Temporadas</h3>
      ${hist.length ? `<div class="tabela-wrap"><table class="tabela"><thead><tr><th>Temp.</th><th>Divisão</th><th>Posição</th><th>Copa</th><th>Divisão seguinte</th></tr></thead><tbody>${linhasHist}</tbody></table></div>` : '<p class="vazio">O histórico aparece quando a primeira temporada terminar.</p>'}</section>`;
}
function abrirEstatisticas() { abrirModal(htmlEstatisticas(), { dados: { estatisticas: true } }); }

