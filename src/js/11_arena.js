/* ============================ ARENA (desenho) ============================
   Transforma o estado da simulação e os eventos em pixels: sprites animados,
   projéteis, partículas, números de dano, tremor de tela e "congelamento". */

const Arena = {
  cv: null, ctx: null, fundo: null, b: null, t: 0,
  part: [], nums: [], fx: [], publico: [], tremor: 0, tremorAmp: 0, flash: 0, flashCor: '255,248,220', pausa: 0, festa: 0,
  aoSupremo: null, aoEvento: null,
  buf: null, bctx: null, lenta: 0, lentaTotal: 0, zoomFoco: null, ultimaMorte: null,
  cenario: 'arena', cam: { x: 0, y: 0, zoom: 1 }, camFoco: null, cutin: null, lua: null,
};
const COR_TIME = ['#6cc76a', '#e0574f'];
const COR_DOT = { queimar: '#ff9a3c', veneno: '#8be05a', sangrar: '#ff5a6a' };
const semAcento = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
const COR_SKILL = {
  muralha: '#9fd3ff', redemoinho: '#e9dfc9', investida: '#ffb36b', chuva: '#c8e6a0', bolaFogo: '#ff9a3c',
  lancaGelo: '#9fe6ff', luz: '#ffe48a', passo: '#d4a6ff', hino: '#ffe48a', esqueletos: '#8dffaa',
  terremoto: '#e8c88a', tempestadeFlechas: '#9ff0e8', milPalmas: '#ffd27a', juramento: '#fff4c2', eclipse: '#c48bff',
};
const nomeHabilidade = (id) => (SKILLS[id] || PERGAMINHOS[id] || { nome: id }).nome;

/* ---- câmera: o mundo (384×216) é desenhado num buffer e a janela (256×180) enquadra a ação ----
   Tela em pé (decisão do Kevin, 15/10/2026). Três momentos (E4-d): 'formacao' — afastada, as duas formações inteiras, do preparo até o primeiro embate;
   'embate' — aproxima e segue o centro dos embates (lutadores ao alcance um do outro, golpeando ou apanhando);
   e o foco pontual (camFoco) do SUPREMO e do golpe final, que continua como era. */
const VISTA = { w: 256, h: 180 };
const ZOOM_MAX = 1.75;
const CAM = { quente: 1.2, rapidez: 3, rapidezEntrada: 2, entrada: 1.6, margemX: 48, margemY: 22, minW: 132, minH: 100 };
const zoomTotal = () => Math.min(VISTA.w / ARENA.w, VISTA.h / ARENA.h);   // a arena inteira cabe (com faixas pretas em cima e embaixo: a janela é mais alta que 16:9)
// Um lutador está "no embate" se tem inimigo ao alcance (dele ou do inimigo), está golpeando, conjurando ou apanhando,
// ou atira/é alvo de um projétil em voo. O calor dura CAM.quente segundos, para a câmera não pular entre grupos.
function marcarEmbates(b, dt) {
  const vivos = b.units.filter((u) => u.vivo);
  for (const u of vivos) {
    let quente = u.anim.atk > 0 || u.anim.cast > 0 || u.anim.hurt > 0;
    if (!quente) for (const o of vivos) if (o.team !== u.team && dist(u, o) <= Math.max(u.alcance, o.alcance) + 8) { quente = true; break; }
    u.camQuente = quente ? CAM.quente : Math.max(0, (u.camQuente || 0) - dt);
  }
  for (const p of b.projs) { if (p.src) p.src.camQuente = CAM.quente; if (p.alvo && p.alvo.vivo) p.alvo.camQuente = CAM.quente; }
  return vivos.some((u) => u.camQuente > 0);
}
function enquadrar(lista, projs) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const u of lista) { x0 = Math.min(x0, u.x); x1 = Math.max(x1, u.x); y0 = Math.min(y0, u.y - 52); y1 = Math.max(y1, u.y + 6); }
  for (const p of projs) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); }
  const mw = Math.max(x1 - x0 + CAM.margemX, CAM.minW), mh = Math.max(y1 - y0 + CAM.margemY, CAM.minH);   // enquadramento justo: personagens em destaque
  const zoom = clamp(Math.min(VISTA.w / mw, VISTA.h / mh), zoomTotal(), ZOOM_MAX);
  return { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 + 6, zoom };
}
function alvoCamera(b) {
  if (Arena.camModo === 'formacao') return { cx: ARENA.w / 2, cy: ARENA.h / 2, zoom: zoomTotal() };
  const vivos = b.units.filter((u) => u.vivo || u.reviver > 0);
  const quentes = vivos.filter((u) => u.camQuente > 0);
  const lista = quentes.length ? quentes : vivos.length ? vivos : b.units;
  return enquadrar(lista, quentes.length ? b.projs : []);
}
function atualizarCamera(dt) {
  const b = Arena.b, cam = Arena.cam;
  if (Arena.camModo === 'formacao' && !b.fim && marcarEmbates(b, dt)) { Arena.camModo = 'embate'; Arena.camEntrada = CAM.entrada; }
  else if (Arena.camModo === 'embate') marcarEmbates(b, dt);
  let alvo = alvoCamera(b), rapidez = CAM.rapidez;
  if (Arena.camEntrada > 0) { Arena.camEntrada -= dt; rapidez = CAM.rapidezEntrada; }   // a aproximação do primeiro embate é mais lenta, para ser vista
  if (Arena.camFoco) {
    const f = Arena.camFoco; f.t -= dt;
    if (f.t <= 0) Arena.camFoco = null;
    else { alvo = { cx: f.x, cy: f.y - 18, zoom: f.zoom }; rapidez = 7; }
  }
  const k = Math.min(1, rapidez * dt);
  cam.zoom += (alvo.zoom - cam.zoom) * k;
  const vw = VISTA.w / cam.zoom, vh = VISTA.h / cam.zoom;
  const tx = centrarJanela(alvo.cx, vw, ARENA.w), ty = centrarJanela(alvo.cy, vh, ARENA.h);
  if (cam.pronta) { cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k; } else { cam.x = tx; cam.y = ty; cam.pronta = true; }
}
// Canto da janela: dentro da arena quando a janela é menor que ela; centrado (com faixa) quando é maior
const centrarJanela = (c, tam, total) => (tam >= total ? (total - tam) / 2 : clamp(c - tam / 2, 0, total - tam));
// Converte um toque na janela para o mundo
function telaParaMundo(sx, sy) { const j = Arena.janela || { x: Arena.cam.x, y: Arena.cam.y, z: Arena.cam.zoom }; return [j.x + sx / j.z, j.y + sy / j.z]; }
function focarCamera(x, y, zoom, t) { Arena.camFoco = { x, y, zoom, t }; }
// "soco" de câmera: um zoom rápido que volta sozinho nos golpes pesados
function socar(v) { Arena.soco = Math.max(Arena.soco || 0, v); }

function prepararArena(cv, b, cenario = 'arena') {
  Arena.cv = cv; Arena.ctx = cv.getContext('2d'); Arena.ctx.imageSmoothingEnabled = false;
  if (!Arena.buf) { Arena.buf = document.createElement('canvas'); Arena.buf.width = ARENA.w; Arena.buf.height = ARENA.h; }
  Arena.bctx = Arena.buf.getContext('2d'); Arena.bctx.imageSmoothingEnabled = false;
  Arena.lenta = 0; Arena.lentaTotal = 0; Arena.zoomFoco = null; Arena.ultimaMorte = null; Arena.camFoco = null; Arena.cutin = null; Arena.lua = null; Arena.soco = 0; Arena.janela = null; timersArena.length = 0;
  Arena.cenario = cenario; Arena.cam = { x: 0, y: 0, zoom: 1, pronta: false }; Arena.camModo = 'formacao'; Arena.camEntrada = 0;
  for (const u of b.units) u.camQuente = 0;
  Arena.b = b; Arena.t = 0; Arena.part = []; Arena.nums = []; Arena.fx = [];
  Arena.tremor = 0; Arena.flash = 0; Arena.pausa = 0; Arena.festa = 0;
  Arena.fundo = desenharFundo(b, cenario);
  atualizarCamera(1);
  const looks = new Set();
  for (const u of b.units) { looks.add(u.look); if (u.looks) Object.values(u.looks).forEach((l) => looks.add(l)); }
  b.lados.forEach((l, team) => {
    if (b.units.some((u) => u.team === team && u.cls === 'invocador')) looks.add(`esqueleto|0|0|${l.cor1}|${l.cor2}`);
    if (b.units.some((u) => u.team === team && u.chefe === 'colosso')) looks.add(`golem|0|0|${l.cor1}|${l.cor2}`);
  });
  looks.forEach(precarregar);
  aquecerSprites([...looks]);
}
// O resto dos quadros (todas as vistas e animações) é gerado aos poucos, nos intervalos livres,
// para nenhuma animação nova causar um engasgo no meio da luta.
let filaAquecer = [], aquecendo = false;
function aquecerSprites(looks) {
  filaAquecer = [];   // a fila antiga (de outra luta) é descartada
  for (const look of looks) for (const v of VISTAS) for (const a of ANIMS) if (v === 'lado' || (a !== 'morte' && a !== 'dash')) filaAquecer.push([look, v, a]);
  if (!aquecendo) { aquecendo = true; agendarAquecer(); }
}
function agendarAquecer() { if (window.requestIdleCallback) requestIdleCallback(passoAquecer, { timeout: 250 }); else setTimeout(passoAquecer, 30); }
function passoAquecer(dl) {
  let n = 0;
  while (filaAquecer.length && (n === 0 || (dl && dl.timeRemaining && dl.timeRemaining() > 3))) {
    const [l, v, a] = filaAquecer.shift(), vs = spriteSet(l).vistas[v];
    vs.quadros[a]; if (a !== 'morte') vs.brancos[a]; n++;
  }
  if (filaAquecer.length) agendarAquecer(); else aquecendo = false;
}

/* ---- partículas e efeitos ---- */
function particula(x, y, vx, vy, vida, cor, opt = {}) {
  if (Arena.part.length > 180) Arena.part.shift();
  Arena.part.push(Object.assign({ x, y, vx, vy, vida, max: vida, cor, g: 0, tam: 2, tipo: 'px' }, opt));
}
function faiscas(x, y, n, cores, vel = 55, opt = {}) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2, v = vel * (0.4 + Math.random() * 0.8);
    particula(x, y, Math.cos(a) * v, Math.sin(a) * v - 14, 0.25 + Math.random() * 0.3, pick(cores), Object.assign({ g: 90, tam: Math.random() < 0.5 ? 1 : 2 }, opt));
  }
}
function fumaca(x, y, n, cores) {
  for (let i = 0; i < n; i++) particula(x + rnd(-7, 7), y + rnd(-8, 3), rnd(-11, 11), rnd(-26, -8), rnd(0.4, 0.8), pick(cores), { tam: 3 });
}
function numero(x, y, txt, cor, esc = 2) {
  Arena.nums.push({ x: x + rnd(-4, 4), y, txt, cor, esc, vida: 0.85, max: 0.85 });
  if (Arena.nums.length > 40) Arena.nums.shift();
}
function efeito(tipo, props) { Arena.fx.push(Object.assign({ tipo, t: 0 }, props)); }
function tremer(dur, amp) { Arena.tremorAmp = Arena.tremor > 0 ? Math.max(amp, Arena.tremorAmp) : amp; Arena.tremor = Math.max(Arena.tremor, dur); }
const cab = (u) => u.y - 40;

function processarEventos(b) {
  for (const ev of b.eventos) {
    vfxEvento(ev); somDoEvento(ev);
    if (ev.tipo === 'morte' && !ev.u.invocacao) Arena.ultimaMorte = { x: ev.u.x, y: ev.u.y };
    if (ev.tipo === 'fim' && !ev.tempo) iniciarCameraLenta();
    if (Arena.aoEvento) Arena.aoEvento(ev);
  }
  b.eventos.length = 0;
}
// Câmera lenta no golpe final: flash, zoom 2× no último abatido e efeitos a 30% da velocidade
function iniciarCameraLenta() {
  if (cfgSom().lenta === false || !Arena.ultimaMorte) return;
  Arena.lenta = 1.7; Arena.lentaTotal = 1.7; Arena.zoomFoco = Arena.ultimaMorte;
  focarCamera(Arena.ultimaMorte.x, Arena.ultimaMorte.y, 2.3, 2.6);
  Arena.nums = Arena.nums.slice(-2);   // no zoom, só o número do golpe final fica na tela
  Arena.flash = 0.18; Arena.flashCor = '255,255,255'; Arena.festa = 2.5;
  somTocar('lenta'); vibrar([30, 40, 30], true);
}
function vfxEvento(ev) {
  switch (ev.tipo) {
    case 'dano': {
      const a = ev.alvo;
      if (ev.crit) {
        numero(a.x, cab(a) - 6, ev.valor + '!', '#ffd84a', 3);
        faiscas(a.x, a.y - 15, 9, ['#ffffff', '#ffd84a', '#ffb36b'], 75);
        fxImpacto(a.x, a.y - 18, '#ffd84a', 8, 13); socar(0.035);
        tremer(0.14, 2); Arena.pausa = Math.max(Arena.pausa, 0.05); Arena.festa = Math.max(Arena.festa, 0.6);
      } else {
        numero(a.x, cab(a), String(ev.valor), ev.escudo ? '#cfe8ff' : '#ffffff', 2);
        faiscas(a.x, a.y - 15, 4, ev.escudo ? ['#cfe8ff', '#9fd3ff'] : ['#ffffff', '#e9dfc9'], 50);
      }
      break;
    }
    case 'dot': numero(ev.alvo.x, cab(ev.alvo) + 4, String(ev.valor), COR_DOT[ev.dot] || '#ff9a3c', 2); break;
    case 'esquiva': numero(ev.alvo.x, cab(ev.alvo), 'ESQUIVA', '#b8b0c4', 1); break;
    case 'cura': {
      const a = ev.alvo;
      if (!ev.pequeno || ev.valor >= 12) numero(a.x, cab(a), '+' + ev.valor, '#7dff8a', 2);
      for (let i = 0; i < (ev.pequeno ? 1 : 4); i++) particula(a.x + rnd(-9, 9), a.y - rnd(6, 24), 0, -22, 0.7, '#7dff8a', { tipo: 'cruz' });
      break;
    }
    case 'corte':
      fxCorte(ev.u, ev.alvo, ev.forte);
      if (ev.forte) { Arena.pausa = Math.max(Arena.pausa, 0.045); tremer(0.1, 1.5); socar(0.05); faiscas(ev.alvo.x, ev.alvo.y - 18, 6, ['#ffffff', '#ffe9a8'], 70); }
      break;
    case 'congelar': faiscas(ev.alvo.x, ev.alvo.y - 15, 10, ['#e8fbff', '#7fd6ff'], 40); numero(ev.alvo.x, cab(ev.alvo) - 8, 'GELO', '#9fe6ff', 2); break;
    case 'atordoar': faiscas(ev.alvo.x, ev.alvo.y - 30, 7, ['#ffe48a', '#ffffff'], 35); break;
    case 'ritmo': particula(ev.u.x + rnd(-6, 6), ev.u.y - 34, rnd(-8, 8), -20, 0.8, '#f0c24b', { tipo: 'nota' }); break;
    case 'colheita': faiscas(ev.u.x, ev.u.y - 18, 6, ['#7dff9a', '#d6ffe0'], 30); break;
    case 'invocar': efeito('circulo', { x: ev.u.x, y: ev.u.y, cor: ev.u.cls === 'golem' ? '#ff8a3c' : '#7dff9a', dur: 0.6 }); fumaca(ev.u.x, ev.u.y - 8, 10, ['#8a8496', '#5d5868', ev.u.cls === 'golem' ? '#ff8a3c' : '#7dff9a']); break;
    case 'expirou': fumaca(ev.u.x, ev.u.y - 10, 10, ['#8a8496', '#5d5868']); break;
    case 'morte': Arena.festa = Math.max(Arena.festa, 0.8); break;
    case 'explosao': {
      const met = ev.cor === 'meteoro';
      efeito('explosaoG', { x: ev.x, y: ev.y, r: ev.raio * (met ? 0.6 : 0.5), cor: met ? '#ff8c1a' : '#ffb33c', cor2: met ? '#c4351c' : '#ff5a1f', dur: met ? 0.6 : 0.42 });
      efeito('anel', { x: ev.x, y: ev.y + (met ? 6 : 12), r0: 4, r1: ev.raio, cor: met ? '#ff6a3c' : '#ffb33c', cor2: met ? '#7d2219' : '#ff5a1f', dur: 0.32 });
      if (met) efeito('coluna', { x: ev.x, y: ev.y + 6, w: 16, h: 70, cores: ['#fff4c2', '#ffd23f', '#ff8c1a', '#ff5a1f'], dur: 0.55 });
      Arena.pausa = Math.max(Arena.pausa, met ? 0.08 : 0.04); socar(met ? 0.11 : 0.06);
      faiscas(ev.x, ev.y, met ? 26 : 16, ['#ffd23f', '#ff8c1a', '#ff5a1f', '#ffffff'], met ? 110 : 80);
      if (met) fumaca(ev.x, ev.y, 14, ['#5d5868', '#3e3a46', '#ff8c1a']);
      tremer(met ? 0.3 : 0.12, met ? 3 : 1.5);
      break;
    }
    case 'estilhaco': faiscas(ev.x, ev.y, ev.sup ? 18 : 11, ['#e8fbff', '#7fd6ff', '#3a9fd6'], 65); efeito('cristais', { x: ev.x, y: ev.y + 12, r: ev.sup ? 16 : 9, n: ev.sup ? 9 : 5, dur: 0.7 }); fxImpacto(ev.x, ev.y, '#9fe6ff', 6, 11); if (ev.sup) efeito('anel', { x: ev.x, y: ev.y, r0: 4, r1: 24, cor: '#9fe6ff', cor2: '#3a9fd6', dur: 0.3 }); break;
    case 'flechada': {
      for (let i = 0; i < 7; i++) {
        const tx = ev.tx + rnd(-ev.raio, ev.raio) * 0.8, ty = ev.ty + rnd(-ev.raio, ev.raio) * 0.4;
        particula(tx - 20, ty - 48, 100, 240, 0.2, '#f4efe2', { tipo: 'flecha', fimY: ty });
      }
      setTimeoutArena(0.2, () => fumaca(ev.tx, ev.ty, 6, ['#c49c68', '#a07a4c']));
      break;
    }
    case 'flechaCai': { const a = ev.alvo; particula(a.x - 20, a.y - 60, 100, 290, 0.2, '#f4efe2', { tipo: 'flecha', fimY: a.y - 8 }); break; }
    case 'adagaCai': { const a = ev.alvo; particula(a.x + rnd(-30, 30), a.y - 50, 0, 300, 0.15, '#d2d9e0', { tipo: 'adaga', fimY: a.y - 12 }); break; }
    case 'raio': efeito('raioG', { de: ev.de, para: ev.para, dur: 0.2, cor: '#ffffff', cor2: '#ffe14a' }); fxImpacto(ev.para.x, ev.para.y - 18, '#fff7a8', 6, 9); break;
    case 'raioCeu': efeito('raioG', { alvo: ev.alvo, dur: 0.24, cor: '#ffffff', cor2: '#9fc8ff' }); fxImpacto(ev.alvo.x, ev.alvo.y - 10, '#cfe0ff', 8, 12); tremer(0.1, 1.5); Arena.flash = Math.max(Arena.flash, 0.08); Arena.flashCor = '200,220,255'; break;
    case 'execucao': socar(0.1); numero(ev.alvo.x, cab(ev.alvo) - 10, 'EXECUTADO', '#d4a6ff', 2); faiscas(ev.alvo.x, ev.alvo.y - 15, 14, ['#c48bff', '#3b3150', '#ffffff'], 70); break;
    case 'renascer': efeito('pilar', { alvo: ev.u, dur: 0.7, cor: '#fff4c2', cor2: '#ffb33c' }); numero(ev.u.x, cab(ev.u) - 6, 'RENASCEU', '#ffe48a', 2); faiscas(ev.u.x, ev.u.y - 16, 16, ['#ffd23f', '#ff8c1a', '#fff4c2'], 70); break;
    case 'bomba': {
      Arena.flash = 0.2; Arena.flashCor = '255,200,120'; tremer(0.35, 3);
      for (const u of Arena.b.units) if (u.vivo && u.team !== ev.team) { efeito('anel', { x: u.x, y: u.y - 10, r0: 3, r1: 18, cor: '#ffb33c', cor2: '#ff5a1f', dur: 0.3 }); faiscas(u.x, u.y - 10, 10, ['#ffd23f', '#ff8c1a', '#5d5868'], 70); }
      break;
    }
    case 'copia': numero(ev.u.x, cab(ev.u) - 14, 'COPIOU ' + semAcento(nomeHabilidade(ev.id)).toUpperCase(), '#d4a6ff', 1); efeito('raioG', { de: ev.alvo, para: ev.u, dur: 0.4, cor: '#efdcff', cor2: '#7a4fc0' }); break;
    case 'elemento': {
      const cor = ev.el === 'fogo' ? '#ff8c1a' : ev.el === 'gelo' ? '#7fd6ff' : '#ffe14a';
      efeito('anel', { x: ev.u.x, y: ev.u.y - 14, r0: 4, r1: 30, cor, cor2: '#ffffff', dur: 0.4 });
      numero(ev.u.x, cab(ev.u) - 14, ev.el.toUpperCase(), cor, 2);
      break;
    }
    case 'golens': numero(ev.u.x, cab(ev.u) - 14, 'GOLENS!', '#ff8a3c', 2); tremer(0.3, 2.5); break;
    case 'furiaGemea': numero(ev.u.x, cab(ev.u) - 14, 'FURIA!', '#ff5a4f', 3); faiscas(ev.u.x, ev.u.y - 18, 16, ['#ff5a4f', '#7d2219'], 70); break;
    case 'skill': vfxSkill(ev); break;
    case 'supremo': {
      Arena.flash = 0.25; Arena.flashCor = '255,248,220'; tremer(0.35, 3.5); Arena.pausa = Math.max(Arena.pausa, 0.55); Arena.festa = 1.5;
      Arena.cutin = { u: ev.u, t: 0, dur: 1.1 }; focarCamera(ev.u.x, ev.u.y, 1.7, 1.3);
      faiscas(ev.u.x, ev.u.y - 18, 22, ['#ffd84a', '#ffffff', '#f0c24b'], 90);
      if (Arena.aoSupremo) Arena.aoSupremo(ev.u);
      break;
    }
  }
}
const timersArena = [];
function setTimeoutArena(t, fn) { timersArena.push({ t, fn }); }

function vfxSkill(ev) {
  const u = ev.u, cor = COR_SKILL[ev.id] || '#ffffff', sup = ev.sup;
  switch (ev.id) {
    case 'muralha':
      efeito('cupula', { x: u.x, y: u.y, r: sup ? 20 : 16, cor: '#cfe8ff', cor2: '#5aa7e6', dur: 0.7 });
      efeito('anel', { x: u.x, y: u.y, r0: 5, r1: (sup ? 60 : 43), cor: '#9fd3ff', cor2: '#5aa7e6', dur: 0.4 });
      fumaca(u.x, u.y, 6, ['#c49c68', '#a07a4c']); tremer(0.12, 1.5);
      break;
    case 'redemoinho':
      efeito('marca', { x: u.x, y: u.y, r: ev.raio, cor: '#ffe9a8', cor2: 'rgba(224,87,79,0.22)', dur: 0.16 });
      setTimeoutArena(0.16, () => { efeito('giro', { u, r: ev.raio, dur: 0.4 }); efeito('anel', { x: u.x, y: u.y, r0: 6, r1: ev.raio + 6, cor: '#ffffff', cor2: '#d2d9e0', dur: 0.25 }); fumaca(u.x, u.y, 9, ['#c49c68', '#a07a4c']); tremer(0.15, 2); });
      break;
    case 'investida': {
      fumaca(ev.x0, ev.y0, 6, ['#c49c68', '#a07a4c']);
      fxRastro(u, ev.x0, ev.y0, '#ffe9c2');
      fumaca(u.x, u.y, 7, ['#c49c68', '#a07a4c']); tremer(0.18, 2.5); socar(0.07);
      break;
    }
    case 'chuva': case 'meteoro': efeito('marca', { x: ev.tx, y: ev.ty, r: ev.raio, cor: ev.id === 'meteoro' ? '#ff8c1a' : '#e0574f', cor2: ev.id === 'meteoro' ? 'rgba(255,140,26,0.22)' : 'rgba(224,87,79,0.22)', dur: ev.dur });
      if (ev.id === 'meteoro') setTimeoutArena(0.15, () => particula(ev.tx - 50, ev.ty - 110, 110, 230, 0.45, '#ff8c1a', { tipo: 'meteoro', fimY: ev.ty - 6 }));
      break;
    case 'bolaFogo': case 'lancaGelo': {
      const [dx, dy] = dirDe(ev.ang), fogo = ev.id === 'bolaFogo';
      efeito('circulo', { x: u.x, y: u.y, cor: fogo ? '#ff8c1a' : '#7fd6ff', dur: 0.4 });
      faiscas(u.x + dx * 11, u.y - 20 + dy * 6, sup ? 12 : 7, fogo ? ['#ffd23f', '#ff8c1a', '#fff4c2'] : ['#e8fbff', '#7fd6ff', '#ffffff'], 35);
      break;
    }
    case 'luz': {
      const a = ev.alvo;
      efeito('pilar', { alvo: a, dur: 0.6, cor: '#fff4c2', cor2: '#ffd23f' });
      if (sup) aliadosDeArena(u).forEach((o) => o !== a && efeito('pilar', { alvo: o, dur: 0.6, cor: '#fff4c2', cor2: '#ffd23f' }));
      break;
    }
    case 'bencaoMenor': case 'primeirosSocorros': efeito('feixe', { alvo: ev.alvo, dur: 0.45, cor: '#fff4c2', cor2: '#ffd23f' }); break;
    case 'barreiraArcana': efeito('anel', { x: ev.alvo.x, y: ev.alvo.y - 14, r0: 20, r1: 6, cor: '#bd86f5', cor2: '#efdcff', dur: 0.4 }); break;
    case 'egideDivina': for (const o of ev.aliados || []) efeito('cupula', { x: o.x, y: o.y, r: 15, cor: '#fff4c2', cor2: '#ffd23f', dur: 0.6 }); break;
    case 'passo': {
      fumaca(ev.x0, ev.y0 - 10, 12, ['#3b3150', '#6b4fa0', '#c48bff']);
      fxRastro(u, ev.x0, ev.y0, '#c48bff');
      fumaca(u.x, u.y - 10, 12, ['#3b3150', '#6b4fa0', '#c48bff']);
      break;
    }
    case 'hino': case 'gritoGuerra': {
      for (const o of ev.aliados || []) {
        for (let i = 0; i < 2; i++) particula(o.x + rnd(-8, 8), o.y - rnd(16, 28), rnd(-8, 8), -22, 0.9, '#f0c24b', { tipo: 'nota' });
        particula(o.x, o.y - 40, 0, -14, 0.7, '#ffe48a', { tipo: 'seta' });
      }
      break;
    }
    case 'gritoIntimidador': efeito('anel', { x: u.x, y: u.y - 14, r0: 5, r1: 70, cor: '#e0574f', cor2: '#7d2219', dur: 0.4 }); fxImpacto(u.x, u.y - 34, '#ff8a7a', 8, 12); tremer(0.15, 1.5); break;
    case 'esqueletos': efeito('circulo', { x: u.x, y: u.y, cor: '#7dff9a', dur: 0.5 }); break;
    case 'terremoto':
      efeito('marca', { x: u.x, y: u.y, r: 30, cor: '#ffb33c', cor2: 'rgba(255,179,60,0.2)', dur: 0.25 });
      setTimeoutArena(0.25, () => {
        tremer(0.6, 4); Arena.flash = 0.15; Arena.flashCor = '232,200,138'; Arena.pausa = Math.max(Arena.pausa, 0.06); socar(0.12);
        efeito('rachadura', { x: u.x, y: u.y, alc: 140, n: 7, fase: rnd(0, 6), dur: 1.1 });
        for (let i = 0; i < 30; i++) particula(rnd(0, ARENA.w), rnd(ARENA.chao, ARENA.fundo), rnd(-10, 10), rnd(-50, -20), 0.6, pick(['#c49c68', '#8f6c45', '#a07a4c']), { g: 120, tam: 3 });
      });
      break;
    case 'juramento': Arena.flash = 0.2; Arena.flashCor = '255,244,194'; for (const o of aliadosDeArena(u)) efeito('pilar', { alvo: o, dur: 0.7, cor: '#ffffff', cor2: '#ffe48a' }); break;
    case 'eclipse': Arena.festa = 1; Arena.lua = { t: 0, dur: 1.5 }; setTimeoutArena(0.45, () => { Arena.flash = 0.2; Arena.flashCor = '196,139,255'; tremer(0.2, 2.5); }); break;
    case 'furiaDragao': {
      const [dx, dy] = dirDe(ev.ang);
      efeito('cone', { x: u.x + dx * 8, y: u.y - 18 + dy * 4, ang: ev.ang, alc: 70 * E, abre: 30, cores: ['#fff4c2', '#ffd23f', '#ff8c1a', '#ff5a1f'], dur: 0.6 });
      for (let i = 0; i < 26; i++) { const a = ev.ang + rnd(-0.45, 0.45), v = rnd(80, 200); particula(u.x + dx * 12, u.y - 18 + dy * 6, Math.cos(a) * v, Math.sin(a) * v * 0.7, rnd(0.3, 0.55), pick(['#ffd23f', '#ff8c1a', '#ff5a1f', '#fff4c2']), { tam: 3 }); }
      tremer(0.35, 2.5);
      break;
    }
    case 'olhoTempestade': Arena.flash = 0.1; Arena.flashCor = '200,220,255'; break;
    case 'chuvaLaminas': faiscas(u.x, u.y - 30, 8, ['#d2d9e0', '#ffffff'], 40); break;
  }
  numero(u.x, u.y - 54, semAcento(nomeHabilidade(ev.id)), cor, 1);
}
function aliadosDeArena(u) { return Arena.b ? Arena.b.units.filter((o) => o.vivo && o.team === u.team) : []; }

/* ---- atualização dos efeitos (tempo real × velocidade) ---- */
function atualizarVfx(dt) {
  Arena.t += dt;
  atualizarCamera(dt); climaArena(dt);
  if (Arena.cutin) { Arena.cutin.t += dt; if (Arena.cutin.t >= Arena.cutin.dur) Arena.cutin = null; }
  if (Arena.lua) { Arena.lua.t += dt; if (Arena.lua.t >= Arena.lua.dur) Arena.lua = null; }
  Arena.soco = (Arena.soco || 0) * Math.exp(-dt * 9); if (Arena.soco < 0.003) Arena.soco = 0;
  Arena.tremor = Math.max(0, Arena.tremor - dt);
  Arena.flash = Math.max(0, Arena.flash - dt);
  Arena.festa = Math.max(0, Arena.festa - dt);
  for (let i = timersArena.length - 1; i >= 0; i--) { timersArena[i].t -= dt; if (timersArena[i].t <= 0) { const f = timersArena[i].fn; timersArena.splice(i, 1); f(); } }
  for (let i = Arena.part.length - 1; i >= 0; i--) {
    const p = Arena.part[i];
    p.vida -= dt; p.vy += p.g * dt; p.x += p.vx * dt + (p.tipo === 'folha' ? Math.sin(p.vida * 6) * 18 * dt : 0); p.y += p.vy * dt;
    if (p.tipo === 'folha' && p.y > ARENA.h - 2) p.vida = 0;
    if ((p.tipo === 'flecha' || p.tipo === 'adaga' || p.tipo === 'meteoro') && p.y >= p.fimY) { p.vida = 0; faiscas(p.x, p.y, 3, ['#c49c68', '#e9dfc9'], 30); }
    if (p.vida <= 0) Arena.part.splice(i, 1);
  }
  for (let i = Arena.nums.length - 1; i >= 0; i--) { const n = Arena.nums[i]; n.vida -= dt; n.y -= 32 * dt * (n.vida / n.max + 0.3); if (n.vida <= 0) Arena.nums.splice(i, 1); }
  for (let i = Arena.fx.length - 1; i >= 0; i--) { const f = Arena.fx[i]; f.t += dt; if (f.t >= f.dur) Arena.fx.splice(i, 1); }
  if (Arena.b) for (const p of Arena.b.projs) {
    if (p.tipo === 'bolaFogo' || p.tipo === 'bolaFogoG' || p.tipo === 'fagulha') { if (Math.random() < (p.tipo === 'fagulha' ? 0.4 : 1)) particula(p.x + rnd(-2, 2), p.y + rnd(-2, 2), rnd(-8, 8), rnd(-16, 0), 0.3, pick(['#ffd23f', '#ff8c1a', '#ff5a1f'])); }
    else if (p.tipo === 'gelo' || p.tipo === 'geloG') { if (Math.random() < 0.8) particula(p.x, p.y, rnd(-6, 6), rnd(-6, 6), 0.3, pick(['#e8fbff', '#7fd6ff'])); }
    else if (p.tipo === 'veneno') { if (Math.random() < 0.6) particula(p.x, p.y, rnd(-4, 4), rnd(-4, 4), 0.3, pick(['#8be05a', '#3d6129'])); }
    else if (p.tipo === 'luzinha' || p.tipo === 'osso') { if (Math.random() < 0.4) particula(p.x, p.y, 0, 0, 0.2, p.tipo === 'osso' ? '#7dff9a' : '#ffe48a'); }
  }
  if (Arena.b) for (const u of Arena.b.units) {
    if (u.chefe && u.vivo && Math.random() < 0.25) particula(u.x + rnd(-9, 9), u.y - rnd(0, 6), rnd(-3, 3), rnd(-18, -8), 0.6, u.chefe === 'colosso' ? '#ff8a3c' : '#c48bff', { tam: 2 });
    if (u.campeao && u.vivo && Math.random() < 0.12) particula(u.x + rnd(-8, 8), u.y - rnd(4, 30), 0, -10, 0.5, '#ffe48a', { tam: 1 });
    if (!u.vivo && u.anim.morteT > 0 && u.anim.morteT < 2) {
      const antes = u.anim.morteT; u.anim.morteT += dt;
      if (antes < 0.42 && u.anim.morteT >= 0.42) { fumaca(u.x, u.y, 6, ['#c49c68', '#a07a4c']); }
      if (antes < 1.0 && u.anim.morteT >= 1.0) { const pal = spriteSet(u.look).pal; fumaca(u.x, u.y - 8, 12, [pal.a, pal.b, pal.s, '#8a8496']); faiscas(u.x, u.y - 12, 8, [pal.a, pal.s], 40); }
    }
  }
}

/* ---- desenho ---- */
function desenharArena() {
  const v = Arena.ctx, c = Arena.bctx, b = Arena.b;
  if (!v || !c || !b) return;
  c.save();
  if (Arena.tremor > 0) c.translate(Math.round(rnd(-1, 1) * Arena.tremorAmp), Math.round(rnd(-1, 1) * Arena.tremorAmp));
  c.drawImage(Arena.fundo, 0, 0);
  for (const p of Arena.publico) {
    const pula = Arena.festa > 0 ? (Math.sin(Arena.t * 14 + p.fase) > 0 ? -1 : 0) : (Math.sin(Arena.t * 2 + p.fase * 3) > 0.97 ? -1 : 0);
    c.fillStyle = p.cor; c.fillRect(p.x, p.y + 4 + pula, 4, 3);
    c.fillStyle = p.pele; c.fillRect(p.x + 1, p.y + 1 + pula, 3, 3);
    c.fillStyle = p.cabelo; c.fillRect(p.x + 1, p.y + pula, 3, 1);
    if (Arena.festa > 0.8 && Math.sin(p.fase * 7) > 0.6) { c.fillStyle = p.pele; c.fillRect(p.x + (pula ? 4 : -1), p.y - 1 + pula, 1, 2); }
  }
  for (const f of Arena.fx) {
    if (f.tipo === 'alvo') desenharElipse(c, f.x, f.y, f.r, f.r * 0.45, (Math.floor(f.t * 10) % 2) ? f.cor : '#ffd0c8');
    if (f.tipo === 'circulo') { const k = f.t / f.dur; desenharElipse(c, f.x, f.y, 5 + k * 14, 2 + k * 6, f.cor); desenharElipse(c, f.x, f.y, 3 + k * 9, 1 + k * 4, '#ffffff'); }
    if (FX_CHAO.has(f.tipo)) desenharFx2(c, f, f.t / f.dur);
  }
  for (const u of b.units) {
    if (!u.vivo && u.anim.morteT > 1.3) continue;
    const x = Math.round(u.x), y = Math.round(u.y), w = u.cls === 'golem' || u.chefe === 'colosso' ? 9 : 7;
    c.fillStyle = 'rgba(20,10,24,0.32)';
    c.fillRect(x - w, y, w * 2 + 1, 1); c.fillRect(x - w + 2, y + 1, w * 2 - 3, 1); c.fillRect(x - w + 2, y - 1, w * 2 - 3, 1);
    if (u.vivo && !u.invocacao) anelTime(c, x, y, w + 3, 3, u.team === 0 ? 'rgba(108,199,106,0.55)' : 'rgba(224,87,79,0.55)');
  }
  const lista = b.units.filter((u) => u.vivo || u.anim.morteT < 1.3 || u.reviver > 0).sort((p, q) => ((p.vivo ? 1 : 0) - (q.vivo ? 1 : 0)) || p.y - q.y);
  for (const u of lista) desenharUnidade(c, u);
  for (const u of lista) if (u.vivo) desenharBarras(c, u);
  for (const p of b.projs) desenharProjetil(c, p);
  for (const f of Arena.fx) desenharFx(c, f);
  for (const p of Arena.part) desenharParticula(c, p);
  for (const n of Arena.nums) {
    if (n.vida < 0.2 && Math.floor(n.vida * 30) % 2) continue;
    const w = larguraTexto(n.txt, n.esc);
    textoPixel(c, n.txt, Math.round(clamp(n.x - w / 2, 2, ARENA.w - w - 2)), Math.round(n.y), n.cor, n.esc);
  }
  if (b.focoCapitao && b.focoCapitao.vivo && Math.floor(Arena.t * 4) % 2) {
    const f = b.focoCapitao, x = Math.round(f.x), y = Math.round(f.y) - 54;
    c.fillStyle = CONTORNO; c.fillRect(x - 4, y - 1, 9, 6);
    c.fillStyle = '#ff5a4f'; c.fillRect(x - 3, y, 7, 1); c.fillRect(x - 2, y + 1, 5, 1); c.fillRect(x - 1, y + 2, 3, 1); c.fillRect(x, y + 3, 1, 1);
  }
  c.restore();
  // janela da câmera
  const cam = Arena.cam, z = cam.zoom * (1 + (Arena.soco || 0)), vw = VISTA.w / z, vh = VISTA.h / z;
  const ccx = cam.x + VISTA.w / cam.zoom / 2, ccy = cam.y + VISTA.h / cam.zoom / 2;
  const jx = centrarJanela(ccx, vw, ARENA.w), jy = centrarJanela(ccy, vh, ARENA.h);
  Arena.janela = { x: jx, y: jy, z };
  v.fillStyle = '#05030a'; v.fillRect(0, 0, VISTA.w, VISTA.h);   // faixas quando a janela é maior que a arena (vista afastada)
  const sx = Math.max(0, jx), sy = Math.max(0, jy), sw = Math.min(ARENA.w, jx + vw) - sx, sh = Math.min(ARENA.h, jy + vh) - sy;
  v.drawImage(Arena.buf, sx, sy, sw, sh, Math.round((sx - jx) * z), Math.round((sy - jy) * z), Math.round(sw * z), Math.round(sh * z));
  if (b.eclipse > 0) { v.fillStyle = `rgba(14,6,26,${Math.min(0.65, b.eclipse)})`; v.fillRect(0, 0, VISTA.w, VISTA.h); }
  if (Arena.lua) desenharFx2(v, { tipo: 'lua', x: VISTA.w / 2, y: 26, t: Arena.lua.t }, Arena.lua.t / Arena.lua.dur);
  if (Arena.flash > 0) { v.fillStyle = `rgba(${Arena.flashCor},${(Arena.flash / 0.25) * 0.55})`; v.fillRect(0, 0, VISTA.w, VISTA.h); }
  if (b.furia > 1 && !(Arena.lenta > 0)) { v.fillStyle = `rgba(224,87,79,${0.06 + 0.04 * Math.sin(Arena.t * 6)})`; v.fillRect(0, 0, VISTA.w, VISTA.h); }
  if (Arena.cutin) desenharCutin(v, Arena.cutin);
  if (Arena.lenta > 0) {   // faixas de cinema
    const k = Math.min(1, (Arena.lentaTotal - Arena.lenta) / 0.15, Arena.lenta / 0.2), h = Math.round(14 * k);
    v.fillStyle = '#05030a'; v.fillRect(0, 0, VISTA.w, h); v.fillRect(0, VISTA.h - h, VISTA.w, h);
  }
}
// SUPREMO: escurece a janela e mostra o retrato do capitão entrando pela lateral
function desenharCutin(v, ci) {
  const u = ci.u, k = ci.t / ci.dur, lado = u.team === 0 ? -1 : 1;
  const entra = Math.min(1, ci.t / 0.18), sai = Math.max(0, (ci.t - (ci.dur - 0.22)) / 0.22);
  v.fillStyle = `rgba(10,6,20,${0.5 * (1 - sai)})`; v.fillRect(0, 0, VISTA.w, VISTA.h);
  const px = u.team === 0 ? -80 + 86 * entra - 90 * sai : VISTA.w - 6 - 86 * entra + 90 * sai;
  const ret = retrato(u.look, 0, 'frente');
  v.fillStyle = u.team === 0 ? 'rgba(108,199,106,0.25)' : 'rgba(224,87,79,0.25)'; v.fillRect(px - 6, 30, 100, 110);
  v.drawImage(ret, px, 36, ret.width * 2, ret.height * 2);
  const nome = semAcento(u.nome).toUpperCase(), sk = semAcento(nomeHabilidade(u.skill.id)).toUpperCase();
  const tx = u.team === 0 ? px + 2 : px - 4 - larguraTexto(sk, 2);
  textoPixel(v, 'SUPREMO', tx, 128, '#ffe48a', 2); textoPixel(v, nome, tx, 140, '#ffffff', 1); textoPixel(v, sk, tx, 150, '#f0c24b', 2);
  if (k > 0.2 && k < 0.9 && Math.floor(ci.t * 20) % 2) { v.fillStyle = 'rgba(255,244,194,0.08)'; v.fillRect(0, 0, VISTA.w, VISTA.h); }
}
function anelTime(c, x, y, rx, ry, cor) {
  c.fillStyle = cor;
  for (let j = -ry; j <= ry; j++) {   // contorno contínuo da elipse, linha a linha
    const w = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry)));
    const wAnt = Math.round(rx * Math.sqrt(Math.max(0, 1 - ((Math.abs(j) + 1) ** 2) / (ry * ry))));
    const larg = Math.max(1, w - wAnt);
    if (j === -ry || j === ry) c.fillRect(x - w, y + j, w * 2 + 1, 1);
    else { c.fillRect(x - w, y + j, larg, 1); c.fillRect(x + w - larg + 1, y + j, larg, 1); }
  }
}
function desenharElipse(c, x, y, rx, ry, cor) {
  c.fillStyle = cor;
  const n = Math.max(14, Math.round(rx * 1.8));
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; c.fillRect(Math.round(x + Math.cos(a) * rx), Math.round(y + Math.sin(a) * ry), 1, 1); }
}
function quadroDe(u) {
  const a = u.anim, b = Arena.b;
  if (!u.vivo) { if (u.reviver > 0) return ['morte', 3]; const f = Math.min(3, Math.floor(a.morteT / 0.14)); return ['morte', f]; }
  if (b.fim && u.team === b.vencedor) { const k = Math.floor(Arena.t * 5 + a.fase) % 8; return ['vit', k < 1 ? 0 : k < 3 ? 1 : k < 5 ? 2 : 3]; }
  if (a.empurrao > 0) return ['empurrao', a.empurrao > 0.18 ? 0 : 1];
  if (a.dash > 0) return ['dash', Math.floor(Arena.t * 12) % 2];
  if (a.atk > 0) { const f = 1 - a.atk / 0.32; return ['atk', f < 0.18 ? 0 : f < 0.34 ? 1 : f < 0.52 ? 2 : f < 0.76 ? 3 : 4]; }
  if (a.cast > 0) { const f = 1 - a.cast / 0.4; return ['cast', f < 0.2 ? 0 : f < 0.5 ? 1 : f < 0.8 ? 2 : 3]; }
  if (a.hurt > 0) return ['hurt', a.hurt > 0.08 ? 0 : 1];
  if (a.moveu) return u.agi >= 45 && !u.st.slow ? ['run', Math.floor(Arena.t * 10 + a.fase) % 4] : ['walk', Math.floor(Arena.t * 11 + a.fase) % 6];
  return ['idle', Math.floor(Arena.t * 4.5 + a.fase) % 6];
}
function desenharUnidade(c, u) {
  const set = spriteSet(u.look), [anim, i] = quadroDe(u);
  const vista = (!u.vivo || u.anim.dash > 0) ? 'lado' : (u.vista || 'lado');
  const vs = set.vistas[vista] || set.vistas.lado;
  let fr = (u.vivo && u.anim.flash > 0 ? vs.brancos : vs.quadros)[anim][i];
  const virar = vista === 'lado' && u.face < 0;
  if (u.vivo && u.st.freeze > 0) fr = tingir(fr, '#7fd6ff', 0.55);
  const x = Math.round(u.x), y = Math.round(u.y);
  if (u.chefe && u.vivo) desenharElipse(c, x, y + 1, u.chefe === 'colosso' ? 17 : 12, u.chefe === 'colosso' ? 5 : 4, Math.floor(Arena.t * 6) % 2 ? '#ff5a2a' : '#ffb02a');
  c.save();
  c.translate(x, y);
  if (!u.vivo) {
    if (u.reviver > 0) { c.globalAlpha = 0.5 + 0.5 * Math.sin(Arena.t * 20); }
    else if (u.anim.morteT > 0.6 && Math.floor(u.anim.morteT * 12) % 2) { c.restore(); return; }
    if (virar) c.scale(-1, 1);
    c.drawImage(fr, -ANCORA.x - (fr.ox || 0), -ANCORA.y - (fr.oy || 0));
  } else {
    if (virar) c.scale(-1, 1);
    if (u.chefe) {   // aura pulsante dos Líderes
      const pulso = 0.5 + 0.5 * Math.sin(Arena.t * 5 + u.anim.fase);
      const sil = tingir(fr, pulso > 0.5 ? '#ffb02a' : '#ff4a2a', 1);
      c.globalAlpha = 0.55 + 0.4 * pulso;
      for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, -2]]) c.drawImage(sil, -ANCORA.x - (fr.ox || 0) + ox, -ANCORA.y - (fr.oy || 0) + oy);
      c.globalAlpha = 1;
    }
    c.drawImage(fr, -ANCORA.x - (fr.ox || 0), -ANCORA.y - (fr.oy || 0));
  }
  c.restore();
  if (!u.vivo) return;
  const st = u.st;
  if (st.shield) desenharElipse(c, x, y - 19, 15, 22, Math.floor(Arena.t * 8) % 2 ? '#cfe8ff' : '#7fbcf0');
  for (const d of st.dots) if (Math.random() < 0.7) { c.fillStyle = d.tipo === 'veneno' ? pick(['#8be05a', '#3d6129']) : d.tipo === 'sangrar' ? pick(['#ff5a6a', '#7d2219']) : pick(['#ffd23f', '#ff8c1a', '#ff5a1f']); c.fillRect(x + rint(-6, 6), y - rint(6, 34), 1, 2); }
  if (st.slow > 0 && Math.floor(Arena.t * 4 + u.anim.fase) % 3 === 0) { c.fillStyle = '#7fd6ff'; c.fillRect(x + rint(-6, 6), y - rint(2, 14), 1, 2); }
  if (st.stun > 0 || st.freeze > 0) {
    for (let k = 0; k < 3; k++) { const ang = Arena.t * 8 + (k * Math.PI * 2) / 3; c.fillStyle = st.freeze > 0 ? '#e8fbff' : '#ffe48a'; c.fillRect(Math.round(x + Math.cos(ang) * 8), Math.round(y - 42 + Math.sin(ang) * 2), 2, 2); }
  }
  if (st.taunt) { c.fillStyle = '#ff5a4f'; c.fillRect(x + 9, y - 44, 2, 5); c.fillRect(x + 9, y - 38, 2, 2); }
  if (st.debuffs.length && Math.floor(Arena.t * 3) % 2) { c.fillStyle = '#bd86f5'; c.fillRect(x - 11, y - 32, 1, 3); c.fillRect(x - 12, y - 30, 3, 1); }
  if (st.buffs.length && Math.floor(Arena.t * 3 + u.anim.fase) % 4 === 0) { c.fillStyle = '#ffe48a'; c.fillRect(x - 11, y - 34, 1, 1); c.fillRect(x - 12, y - 33, 3, 1); }
}
function desenharBarras(c, u) {
  const largo = u.chefe ? 28 : 20, x = Math.round(u.x) - largo / 2, y = Math.round(u.y) - (u.chefe === 'colosso' ? 60 : 48);
  c.fillStyle = CONTORNO; c.fillRect(x - 1, y - 1, largo + 2, 5);
  c.fillStyle = '#3a1f2a'; c.fillRect(x, y, largo, 3);
  const w = Math.max(0, Math.round(largo * u.vida / u.vidaMax));
  c.fillStyle = u.invocacao ? '#b8b0c4' : COR_TIME[u.team]; c.fillRect(x, y, w, 3);
  c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(x, y, w, 1);
  if (u.st.shield) { const ws = Math.min(largo, Math.round(largo * u.st.shield.v / u.vidaMax)); c.fillStyle = '#e8f4ff'; c.fillRect(x, y, ws, 1); }
  if (u.capitao) {
    c.fillStyle = '#2a1e2e'; c.fillRect(x, y + 3, largo, 1);
    c.fillStyle = u.energia >= 100 ? (Math.floor(Arena.t * 6) % 2 ? '#fff4c2' : '#f0c24b') : '#f0c24b';
    c.fillRect(x, y + 3, Math.round(largo * u.energia / 100), 1);
    c.drawImage(iconeCanvas('coroa'), Math.round(u.x) - 3, y - 6);
  }
  if (u.chefe) c.drawImage(iconeCanvas('caveira'), Math.round(u.x) - 7, y - 12);
  else if (u.campeao) c.drawImage(iconeCanvas('estrela'), x - 14, y - 4);
}
function desenharProjetil(c, p) {
  const x = Math.round(p.x), y = Math.round(p.y);
  switch (p.tipo) {
    case 'flecha': {
      const dx = Math.cos(p.ang), dy = Math.sin(p.ang);
      c.fillStyle = '#9a6a3c'; for (let i = 1; i < 7; i++) c.fillRect(Math.round(x - dx * i), Math.round(y - dy * i), 1, 1);
      c.fillStyle = '#f4efe2'; c.fillRect(x, y, 2, 1); c.fillRect(Math.round(x - dx * 7), Math.round(y - dy * 7 - 1), 1, 1); c.fillRect(Math.round(x - dx * 7), Math.round(y - dy * 7 + 1), 1, 1);
      break;
    }
    case 'veneno': c.fillStyle = '#3d6129'; c.fillRect(x - 2, y - 2, 4, 4); c.fillStyle = '#8be05a'; c.fillRect(x - 1, y - 1, 2, 2); break;
    case 'fagulha': c.fillStyle = '#ff5a1f'; c.fillRect(x - 2, y - 2, 4, 4); c.fillStyle = '#ffd23f'; c.fillRect(x - 1, y - 1, 2, 2); break;
    case 'gelinho': c.fillStyle = '#3a9fd6'; c.fillRect(x - 2, y - 1, 4, 3); c.fillStyle = '#e8fbff'; c.fillRect(x - 1, y - 1, 2, 2); break;
    case 'luzinha': c.fillStyle = '#ffb33c'; c.fillRect(x - 2, y - 2, 5, 5); c.fillStyle = '#fff4c2'; c.fillRect(x - 1, y - 1, 3, 3); break;
    case 'osso': c.fillStyle = '#e8e2cf'; c.fillRect(x - 2, y, 5, 1); c.fillRect(x, y - 2, 1, 5); c.fillStyle = '#7dff9a'; c.fillRect(x, y, 1, 1); break;
    case 'nota': desenharNota(c, x, y, '#5fe0c8'); break;
    case 'bolaFogo': case 'bolaFogoG': {
      const r = p.tipo === 'bolaFogoG' ? 5 : 3, fl = Math.floor(Arena.t * 20) % 2;
      c.fillStyle = '#ff5a1f'; c.fillRect(x - r - fl, y - r, r * 2 + 1 + fl, r * 2 + 1);
      c.fillStyle = '#ff8c1a'; c.fillRect(x - r + 1, y - r + 1, r * 2 - 1, r * 2 - 1);
      c.fillStyle = '#ffe48a'; c.fillRect(x - 1, y - 1, r > 3 ? 3 : 2, r > 3 ? 3 : 2);
      break;
    }
    case 'gelo': case 'geloG': {
      const r = p.tipo === 'geloG' ? 5 : 3;
      c.fillStyle = '#3a9fd6'; c.fillRect(x - r, y, r * 2 + 1, 1); c.fillRect(x, y - r, 1, r * 2 + 1);
      c.fillStyle = '#9fe6ff'; c.fillRect(x - 1, y - 1, 3, 3); c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 1);
      break;
    }
  }
}
function desenharNota(c, x, y, cor) { c.fillStyle = cor; c.fillRect(x, y - 5, 1, 6); c.fillRect(x - 2, y, 3, 2); c.fillRect(x + 1, y - 5, 2, 1); c.fillRect(x + 2, y - 4, 1, 2); }
function desenharParticula(c, p) {
  const x = Math.round(p.x), y = Math.round(p.y);
  if (p.vida < 0.1 && Math.floor(p.vida * 40) % 2) return;
  c.fillStyle = p.cor;
  if (p.tipo === 'cruz') { c.fillRect(x - 2, y, 5, 1); c.fillRect(x, y - 2, 1, 5); }
  else if (p.tipo === 'nota') desenharNota(c, x, y, p.cor);
  else if (p.tipo === 'seta') { c.fillRect(x, y, 1, 5); c.fillRect(x - 1, y + 1, 3, 1); c.fillRect(x - 2, y + 2, 1, 1); c.fillRect(x + 2, y + 2, 1, 1); }
  else if (p.tipo === 'flecha') { c.fillStyle = '#9a6a3c'; c.fillRect(x - 3, y - 6, 1, 2); c.fillRect(x - 2, y - 4, 1, 2); c.fillRect(x - 1, y - 2, 1, 2); c.fillStyle = '#f4efe2'; c.fillRect(x, y, 1, 1); }
  else if (p.tipo === 'adaga') { c.fillStyle = '#7f8a97'; c.fillRect(x, y - 6, 1, 6); c.fillStyle = '#ffffff'; c.fillRect(x, y, 1, 2); c.fillStyle = '#f0c24b'; c.fillRect(x - 1, y - 6, 3, 1); }
  else if (p.tipo === 'meteoro') { c.fillStyle = '#ff5a1f'; c.fillRect(x - 4, y - 4, 9, 9); c.fillStyle = '#ffd23f'; c.fillRect(x - 2, y - 2, 5, 5); for (let k = 1; k < 5; k++) { c.fillStyle = k % 2 ? '#ff8c1a' : '#5d5868'; c.fillRect(x - 4 - k * 4, y - 4 - k * 8, 3, 3); } }
  else c.fillRect(x, y, p.tam, p.tam);
}
function desenharFx(c, f) {
  const k = f.t / f.dur;
  switch (f.tipo) {
    case 'anel': { const r = f.r0 + (f.r1 - f.r0) * k; desenharElipse(c, f.x, f.y, r, r * 0.55, k < 0.5 ? f.cor : f.cor2); desenharElipse(c, f.x, f.y + 1, r, r * 0.55, k < 0.5 ? f.cor2 : f.cor); break; }
    case 'arco': {
      const u = f.u, a = f.alvo; if (!a) break;
      const dir = a.x >= u.x ? 1 : -1, cx = Math.round(u.x + dir * 13), cy = Math.round(u.y - 17);
      c.fillStyle = k < 0.5 ? '#ffffff' : '#c8c0d4';
      for (let i = -4; i <= 4; i++) c.fillRect(cx + dir * Math.round(5 - Math.abs(i) * 0.9), cy + i * 2, 2, 2);
      break;
    }
    case 'giro': {
      const u = f.u, n = 14;
      for (let i = 0; i < n; i++) { const ang = k * Math.PI * 4 + (i / n) * Math.PI * 2; c.fillStyle = i % 3 ? '#d2d9e0' : '#ffffff'; c.fillRect(Math.round(u.x + Math.cos(ang) * f.r * 0.85), Math.round(u.y - 10 + Math.sin(ang) * f.r * 0.35), 3, 2); }
      break;
    }
    case 'feixe': {
      const a = f.alvo, x = Math.round(a.x), base = Math.round(a.y);
      const w = k < 0.7 ? 5 : 2;
      c.fillStyle = f.cor2; c.fillRect(x - w, 0, w * 2 + 1, base);
      c.fillStyle = f.cor; c.fillRect(x - Math.max(0, w - 3), 0, Math.max(1, (w - 3) * 2 + 1), base);
      if (Math.random() < 0.7) particula(x + rint(-8, 8), base - rint(3, 24), 0, -16, 0.5, '#7dff8a', { tipo: 'cruz' });
      break;
    }
    case 'raio': case 'raioCeu': {
      const x1 = f.tipo === 'raioCeu' ? f.alvo.x + rint(-6, 6) : f.de.x, y1 = f.tipo === 'raioCeu' ? 0 : f.de.y - 18;
      const x2 = f.tipo === 'raioCeu' ? f.alvo.x : f.para.x, y2 = f.tipo === 'raioCeu' ? f.alvo.y - 10 : f.para.y - 18;
      const passos = 7; let px = x1, py = y1;
      for (let i = 1; i <= passos; i++) {
        const t = i / passos, nx = x1 + (x2 - x1) * t + (i < passos ? rint(-5, 5) : 0), ny = y1 + (y2 - y1) * t + (i < passos ? rint(-4, 4) : 0);
        linhaPixel(c, px, py, nx, ny, f.cor || '#fff7a8'); linhaPixel(c, px + 1, py, nx + 1, ny, f.cor ? '#efdcff' : '#ffe14a');
        px = nx; py = ny;
      }
      break;
    }
    default: if (!FX_CHAO.has(f.tipo)) desenharFx2(c, f, k);
  }
}
const FX_CHAO = new Set(['marca', 'rachadura']);
function linhaPixel(c, x0, y0, x1, y1, cor) {
  c.fillStyle = cor; x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let err = dx + dy;
  for (let n = 0; n < 400; n++) { c.fillRect(x0, y0, 1, 1); if (x0 === x1 && y0 === y1) break; const e2 = 2 * err; if (e2 >= dy) { err += dy; x0 += sx; } if (e2 <= dx) { err += dx; y0 += sy; } }
}

