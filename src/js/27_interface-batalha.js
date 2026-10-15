/* ============================ INTERFACE: BATALHA ============================ */
function iniciarLuta(ctx) {
  ajustarTime();
  if (timeMercs().length < tamanhoTime()) { toast(`Monte um time com ${tamanhoTime()} mercenários no Elenco.`, 'erro'); UI.aba = 'elenco'; render(); return; }
  const preparo = preparoAtivo();
  ctx.usados = consumirPreparo();
  let A, B, opts = {};
  if (ctx.tipo === 'torre') ({ A, B, opts } = ladosTorre(preparo));
  else { A = ladoJogador(preparo); B = ladoDeGuilda(ctx.rival, multAdversario()); }
  salvar();
  const seed = (Math.random() * 1e9) | 0, optsLuta = { modoAuto: STATE.config.auto, ...opts };
  const reg = prepararRegistro(A, B, optsLuta, seed);   // retrato dos lados antes da luta, para o registro
  const b = criarBatalha(A, B, { ...optsLuta, seed });
  Luta = { b, ctx, reg, vel: STATE.config.vel, pausado: false, rodando: false, acc: 0, ultimo: 0, fimT: 0, terminou: false, raf: 0, ativo: true };
  ajustarJanela(telaDeitada());   // E4-d: na tela deitada a janela da câmera é a arena inteira (384×216)
  montarTelaLuta(b);
  $('#luta').hidden = false; $('#app').hidden = true; $('#abas').hidden = true; $('#tutorial').hidden = true;
  window.scrollTo(0, 0);
  const cv = $('#arena');
  prepararArena(cv, b, cenarioDaLuta(ctx));
  Arena.aoSupremo = (u) => mostrarBanner('SUPREMO!', `${u.nome} · ${nomeHabilidade(u.skill.id)}`);
  Arena.aoEvento = eventoNaTela;
  cv.addEventListener('pointerdown', tocarArena);
  Luta.raf = requestAnimationFrame(loopLuta);
  contagem(['3', '2', '1', 'Lute!'], () => {
    Luta.rodando = true;
    musicaIniciar();
    const md = ctx.tipo === 'torre' ? modDoAndar(ctx.rival.andar) : null;
    if (ctx.rival.lider) { const Ld = LIDERES.find((l) => l.id === ctx.rival.lider); mostrarBanner(Ld.nome, Ld.desc); }
    else if (ctx.rival.guardiao) mostrarBanner(ctx.rival.mercs[0].nome, md ? `Guardião da Torre · ${md.nome}` : 'Guardião da Torre');
    else if (md) mostrarBanner(md.nome, md.desc);
    else if (ctx.usados.length) mostrarBanner('Preparo', ctx.usados.map((c) => CONSUMIVEIS[c].nome).join(' · '));
  });
}
// Avisos para os momentos especiais da luta (chefes, ressurreições, cópias)
function eventoNaTela(ev) {
  if (ev.tipo === 'copia') mostrarBanner('Copiou!', `${ev.u.nome} roubou ${nomeHabilidade(ev.id)}`);
  else if (ev.tipo === 'golens') mostrarBanner('Golens!', `${ev.u.nome} ergueu reforços de pedra`);
  else if (ev.tipo === 'furiaGemea') mostrarBanner('Fúria gêmea!', `${ev.u.nome}: +50% ATQ`);
  else if (ev.tipo === 'renascer') mostrarBanner('Renasceu!', ev.u.nome);
  else if (ev.tipo === 'bomba' && ev.team === 0) mostrarBanner('Bomba!', 'Dano em todos os inimigos');
}
function contagem(passos, fim) {
  const el = $('#contagem'); let i = 0;
  const prox = () => {
    if (!Luta || !Luta.ativo) return;
    if (i >= passos.length) { el.textContent = ''; fim(); return; }
    somTocar(i === passos.length - 1 ? 'lute' : 'conta');
    el.textContent = passos[i++]; setTimeout(prox, 520);
  };
  prox();
}
function montarTelaLuta(b) {
  const A = b.lados[0], B = b.lados[1], meus = b.units.filter((u) => u.team === 0);
  $('#luta').innerHTML = `<div class="luta-in">
    <div class="luta-topo">
      <div class="lt-lado">${canvasBrasao(A, 26)}<div><b>${esc(A.nome)}</b><div class="barra time0"><i id="vida-time0" style="width:100%"></i></div></div></div>
      <div class="lt-meio"><span id="relogio">0:00</span><small id="furia" hidden>FÚRIA</small><button class="btn-som" data-act="som-luta" aria-label="Música da luta" id="btn-som">${canvasIcone(STATE.config.musica ? 'som' : 'mudo', 14)}</button></div>
      <div class="lt-lado dir"><div><b>${esc(B.nome)}</b><div class="barra time1"><i id="vida-time1" style="width:100%"></i></div></div>${canvasBrasao(B, 26)}</div>
    </div>
    <div class="arena-wrap"><canvas id="arena" width="${VISTA.w}" height="${VISTA.h}" style="aspect-ratio:${VISTA.w}/${VISTA.h}" aria-label="Arena da batalha"></canvas><div id="banner" hidden></div><div id="contagem"></div></div>
    <div class="hud-time ${meus.length > 3 ? 'compacto' : ''}">${meus.map((u) => `<div class="hud-u ${u.capitao ? 'cap' : ''}" data-uid="${u.uid}">
      ${canvasLook(u.look, 32, 'data-parado="1" data-vista="lado"')}
      <div class="hud-info"><b>${esc(u.nome)} ${u.capitao ? canvasIcone('coroa', 12) : ''}</b>
        <div class="barra vida"><i data-hp style="width:100%"></i></div>
        <div class="hud-sk"><span>${nomeHabilidade(u.skill.id)}</span><div class="barra cd"><i data-cd></i></div></div></div></div>`).join('')}</div>
    <div class="luta-ctrl">
      <button id="btn-supremo" class="btn-supremo" data-act="supremo"><span class="sup-fill" id="sup-fill"></span><span class="sup-txt" id="sup-txt">SUPREMO</span></button>
      <div class="ctrl-linha">
        <div class="seg">${[1, 2, 3].map((v) => `<button class="seg-btn ${Luta.vel === v ? 'on' : ''}" data-act="luta-vel" data-v="${v}">${v}×</button>`).join('')}</div>
        <button class="btn pequeno" data-act="luta-auto" id="btn-auto">${b.modoAuto ? 'Auto' : 'Manual'}</button>
        <button class="btn pequeno" data-act="luta-pausa" id="btn-pausa">Pausar</button>
        <button class="btn pequeno" data-act="luta-pular">Pular</button>
      </div>
      ${STATE.criador.liberado ? `<button class="btn pequeno criador-btn" data-act="luta-vencer">${canvasIcone('criador', 14)} Vencer agora</button>` : ''}
      <p class="dica" id="dica-luta">${dicaModo(b)}</p>
    </div></div>`;
  hidratar($('#luta'));
  Luta.hud = meus.map((u) => { const el = $(`.hud-u[data-uid="${u.uid}"]`); return { u, el, hp: $('[data-hp]', el), cd: $('[data-cd]', el) }; });
}
const telaDeitada = () => window.innerWidth > window.innerHeight;
const dicaModo = (b) => (b.modoAuto ? 'Modo Auto: o capitão usa o SUPREMO sozinho. Mude para Manual para mirar e escolher a hora.' : 'Modo Manual: toque num inimigo para o capitão mirar nele e toque em SUPREMO quando a barra encher.');
function tocarArena(e) {
  if (!Luta || !Luta.b) return;
  const b = Luta.b;
  if (b.modoAuto) { toast('Mude para Manual para escolher o alvo do capitão.'); return; }
  const r = e.currentTarget.getBoundingClientRect();
  const [x, y] = telaParaMundo(((e.clientX - r.left) / r.width) * VISTA.w, ((e.clientY - r.top) / r.height) * VISTA.h);
  const d = (u) => Math.hypot(u.x - x, u.y - 19 - y);
  const alvo = minPor(b.units.filter((u) => u.vivo && u.team === 1), d);
  if (alvo && d(alvo) < 28) entradaJogador(b, { tipo: 'foco', uid: alvo.uid });
}
function mostrarBanner(titulo, sub) {
  const el = $('#banner'); if (!el) return;
  el.hidden = false; el.innerHTML = `<div class="b-in"><b>${esc(titulo)}</b><small>${esc(sub)}</small></div>`;
  clearTimeout(mostrarBanner.t); mostrarBanner.t = setTimeout(() => { el.hidden = true; }, 1300);
}
function loopLuta(ts) {
  if (!Luta || !Luta.ativo) return;
  const dt = Math.min(0.1, Luta.ultimo ? (ts - Luta.ultimo) / 1000 : 0);
  Luta.ultimo = ts;
  const b = Luta.b;
  if (Luta.rodando && !Luta.pausado) {
    if (!b.fim) {
      if (Arena.pausa > 0) Arena.pausa -= dt;
      else {
        Luta.acc += dt * Luta.vel;
        let n = 0;
        while (Luta.acc >= DT && n < 12) { passo(b); processarEventos(b); Luta.acc -= DT; n++; if (b.fim) break; }
      }
    } else {
      Luta.fimT += dt;
      if (Luta.fimT > (Arena.lentaTotal ? 1.3 + Arena.lentaTotal : 1.3) && !Luta.terminou) { Luta.terminou = true; finalizarLuta(); }
    }
    const lenta = Arena.lenta > 0;
    if (lenta) Arena.lenta -= dt;
    atualizarVfx(dt * Math.min(Luta.vel, 2) * (lenta ? 0.3 : 1));
  }
  desenharArena();
  atualizarHud();
  Luta.raf = requestAnimationFrame(loopLuta);
}
function atualizarHud() {
  const b = Luta.b;
  for (const h of Luta.hud) {
    h.hp.style.width = `${(Math.max(0, h.u.vida) / h.u.vidaMax) * 100}%`;
    h.cd.style.width = `${h.u.skill ? (1 - Math.max(0, h.u.skill.t) / h.u.skill.cd) * 100 : 0}%`;
    h.el.classList.toggle('morto', !h.u.vivo);
  }
  $('#vida-time0').style.width = `${pctVidaTime(b, 0) * 100}%`;
  $('#vida-time1').style.width = `${pctVidaTime(b, 1) * 100}%`;
  $('#relogio').textContent = fmtTempo(b.t * 1000);
  $('#furia').hidden = !(b.furia > 1);
  if (b.furia > 1) $('#furia').textContent = `FÚRIA ×${fmt1(b.furia)}`;
  const cap = b.units.find((u) => u.team === 0 && u.capitao);
  const btn = $('#btn-supremo'), fill = $('#sup-fill'), txt = $('#sup-txt');
  if (!cap || !cap.vivo) { btn.disabled = true; btn.classList.remove('pronto'); fill.style.width = '0%'; txt.textContent = 'Capitão caído'; return; }
  fill.style.width = `${cap.energia}%`;
  const pronto = cap.energia >= 100;
  btn.classList.toggle('pronto', pronto && !b.modoAuto);
  btn.disabled = b.modoAuto || !pronto;
  txt.textContent = b.modoAuto ? (pronto ? 'SUPREMO (auto)' : `SUPREMO ${Math.floor(cap.energia)}%`) : (b.pedirSupremo ? 'Preparando…' : pronto ? 'SUPREMO!' : `SUPREMO ${Math.floor(cap.energia)}%`);
}
function encerrarLuta() {
  musicaParar();
  if (Luta) { Luta.ativo = false; cancelAnimationFrame(Luta.raf); }
  Luta = null; Arena.b = null;
  $('#luta').hidden = true; $('#luta').innerHTML = '';
  $('#app').hidden = false; $('#abas').hidden = false;
  if (tutorialAtivo()) mostrarTutorial();
}
function pularLuta() {
  const b = Luta.b;
  if (Luta.terminou) return;
  b.silencioso = true; simularAteFim(b); b.silencioso = false;
  Luta.terminou = true; finalizarLuta();
}
function vencerAgora() {
  const b = Luta.b;
  if (Luta.terminou || b.fim) return;
  b.criador = true;
  b.fenix[1] = false;
  for (const u of b.units) if (u.team === 1 && u.vivo) { u.flags.delete('renascer'); morrer(b, u, null); }
  for (const u of b.units) if (u.team === 1) u.reviver = 0;
  STATE.criador.usado = true;
  if (!Luta.rodando) Luta.rodando = true;
}
function finalizarLuta() {
  const b = Luta.b, ctx = Luta.ctx;
  const res = resumoBatalha(b);
  const vit = res.vencedor === 0;
  const nivelRival = ctx.rival.mercs.reduce((s, m) => s + m.nivel, 0) / ctx.rival.mercs.length;
  const fator = ctx.tipo === 'amistoso' ? ECO.amistosoRec : ctx.tipo === 'copa' ? 1.5 : ctx.tipo === 'torre' ? (vit ? 1 : 0.5) : 1;
  const xp = Math.round((ECO.xpBase + ECO.xpPorNivel * nivelRival) * (vit ? 1 : ECO.xpDerrota) * fator);
  const ouro = ctx.tipo === 'torre' ? 0 : Math.round((ECO.ouroBase + ECO.ouroPorNivel * nivelRival) * (vit ? 1 : ECO.ouroDerrota) * fator * DIFICULDADES[STATE.config.dif].rec * (1 + somaReliquia('ouro')));
  ganharOuro(ouro);
  const subidas = [];
  for (const u of res.unidades[0]) { const m = mercPorId(u.merc.id); if (!m) continue; const s = darXp(m, xp); if (s) subidas.push(s); }
  const nv = Math.max(1, Math.round(nivelMedioTime()));
  let drop = null, copa = null, torre = null;
  STATE.stats.lutas++; if (vit) STATE.stats.vitorias++;
  if (tutorialAtivo() && STATE.tutorial < TUT_FIM) STATE.tutorial++;   // cada luta do tutorial libera um menu
  const mvp = registrarEstatisticas(b, res, vit);
  registrarPartida(b, res, ctx, vit, mvp, Luta.reg);
  if (ctx.tipo === 'torre') {
    torre = registrarAndar(vit);
    if (torre.bau >= 0) drop = darDrop(rolarRaridade(sorteGuilda(), torre.bau), nv);
  } else if (ctx.tipo === 'liga') {
    registrarRodada(vit, res.abates[0], res.abates[1]);
    if (vit && Math.random() < ECO.chanceBau) drop = darDrop(rolarRaridade(sorteGuilda()), nv);
  } else if (ctx.tipo === 'copa') {
    copa = registrarCopa(vit);
    if (copa.bauMin >= 0) drop = darDrop(rolarRaridade(sorteGuilda(), copa.bauMin), nv);
  } else {
    STATE.amistoso = null;
    if (vit && Math.random() < ECO.chanceBau * fator) drop = darDrop(rolarRaridade(sorteGuilda()), nv);
  }
  STATE.taverna.lutas++;
  let renovou = false;
  if (STATE.taverna.lutas >= ECO.lutasRenovar) { renovarTaverna(false); renovou = true; }
  salvar();
  musicaParar();
  mostrarResultado({ vit, res, xp, ouro, subidas, drop, ctx, renovou, copa, torre, mvp });
}
function blocoBau(txt = 'Baú encontrado! Toque para abrir') {
  return `<div id="bau-area"><button class="btn-bau" data-act="abrir-bau">${canvasIcone('bau', 64)}<span>${txt}</span></button></div>`;
}
function blocoCampeao(m, destino) {
  return `<div class="campeao-novo">${canvasLook(lookMeu(m), 72)}<div><span class="tag ouro">Campeão Lendário</span><b>${esc(m.nome)}</b><small>${CAMPEOES[m.campeao].titulo} · ${CLASSES[m.classe].nome}</small><small>${destino === 'elenco' ? 'Entrou para a guilda!' : 'Elenco cheio: ele espera por você no Mercado.'}</small></div></div>`;
}
function mostrarResultado(r) {
  const meus = r.res.unidades[0], L = STATE.liga, mvp = r.mvp || mvpDe(meus);
  somTocar(r.vit ? 'vitoria' : 'derrota'); vibrar(r.vit ? [40, 50, 70] : 90, true);
  if (r.subidas.length) setTimeout(() => somTocar('nivel'), 900);
  const maxV = Math.max(1, ...meus.map((u) => Math.max(u.dano, u.cura)));
  const sub = r.ctx.tipo === 'liga' ? `Rodada ${L.encerrada ? 7 : L.rodada} de 7` : r.ctx.tipo === 'copa' ? `Copa · ${r.copa.etapa === 'semi' ? 'Semifinal' : 'Final'}` : r.ctx.tipo === 'torre' ? `Torre · Andar ${r.torre.n}` : 'Amistoso';
  UI.ultimoDrop = r.drop;
  const extra = [];
  if (r.copa) {
    if (r.copa.etapa === 'semi') extra.push(r.vit ? `<p class="aviso ok">Vaga na final! O Líder ${LIDERES[STATE.divisao].nome} espera na aba Liga.</p>` : '<p class="aviso">Fim do sonho da Copa nesta temporada. Receba os prêmios na aba Liga.</p>');
    else extra.push(r.vit ? '<p class="aviso ok">A Copa é sua! O Líder caiu.</p>' : '<p class="aviso">O Líder venceu a final. Receba os prêmios na aba Liga.</p>');
    if (r.copa.campeao) extra.push(blocoCampeao(r.copa.campeao, r.copa.destino));
  } else if (r.torre) {
    extra.push(r.vit ? `<p class="aviso ok">Andar ${r.torre.n} conquistado! ${TORRE.guardiao(r.torre.n) ? 'O Guardião caiu. ' : ''}Novo recorde da Torre.</p>` : `<p class="aviso">O andar ${r.torre.n} resistiu. Fortaleça o time (níveis, itens, pergaminhos) e tente de novo: as recompensas continuam esperando.</p>`);
  } else if (r.ctx.tipo === 'liga' && L.encerrada) {
    extra.push(`<p class="aviso ok">Fim da liga: ${L.pos}º lugar. ${L.fase === 'copa' ? 'Você está na Copa! Veja na aba Liga.' : 'Veja os prêmios na aba Liga.'}</p>`);
  }
  abrirModal(`<div class="resultado ${r.vit ? 'vit' : 'der'}">
    <h2 class="res-titulo">${r.vit ? 'Vitória!' : 'Derrota'}</h2>
    <p class="muted">${sub}${r.ctx.tipo === 'torre' && !r.ctx.rival.guardiao ? '' : ` · contra ${esc(r.ctx.rival.nome)}`} · ${fmtTempo(r.res.tempo * 1000)}</p>
    <div class="mvp">${canvasLook(mvp.look, 54)}<div><span class="tag ouro">${r.vit ? 'MVP' : 'Destaque'}</span><b>${esc(mvp.nome)}</b><small>${fmt(mvp.dano)} de dano · ${fmt(mvp.cura)} de cura · ${mvp.abates} ${mvp.abates === 1 ? 'abate' : 'abates'}</small></div></div>
    <div class="barras-res">${meus.map((u) => `<div class="br-linha"><span>${esc(u.nome)}</span><div class="br-barras"><div class="barra dano"><i style="width:${(u.dano / maxV) * 100}%"></i></div>${u.cura > 0 ? `<div class="barra cura"><i style="width:${(u.cura / maxV) * 100}%"></i></div>` : ''}</div><small>${fmt(u.dano)}${u.cura > 0 ? ` / +${fmt(u.cura)}` : ''}</small></div>`).join('')}</div>
    <div class="recompensas"><span>${canvasIcone('moeda', 18)} +${fmt(r.ouro + (r.copa ? r.copa.ouro : 0) + (r.torre ? r.torre.ouro : 0))} ouro</span><span>+${fmt(r.xp)} XP para cada um</span>${(r.copa && r.copa.emblemas) || (r.torre && r.torre.emblemas) ? `<span>${canvasIcone('emblema', 18)} +${(r.copa ? r.copa.emblemas : 0) + (r.torre ? r.torre.emblemas : 0)}</span>` : ''}</div>
    ${r.ctx.usados && r.ctx.usados.length ? `<p class="dica centro">Consumíveis usados: ${r.ctx.usados.map((c) => CONSUMIVEIS[c].nome).join(', ')}.</p>` : ''}
    ${extra.join('')}
    ${r.subidas.length ? `<div class="subidas">${r.subidas.map((s) => `<div class="subida"><b><span class="tag ouro nivel-up">Nível!</span>${esc(s.m.nome)}: ${s.de} → ${s.para}</b><small>${txtGanhos(s.ganhos)}</small></div>`).join('')}</div>` : ''}
    ${r.drop ? blocoBau(r.copa ? 'Baú da Copa! Toque para abrir' : r.torre ? 'Baú da Torre! Toque para abrir' : undefined) : ''}
    ${r.renovou ? '<p class="dica centro">A Taverna recebeu novos mercenários.</p>' : ''}
    <button class="btn primario enorme" data-act="resultado-ok">Continuar</button>
  </div>`, { semFechar: true });
}
function revelarDrop(area, d) {
  area.innerHTML = `<div class="revelado">${cardItem(d)}${d.vendido ? `<p class="dica">Inventário cheio: vendido por ${fmt(d.vendido)} ouro.</p>` : ''}</div>`;
  hidratar(area);
}

