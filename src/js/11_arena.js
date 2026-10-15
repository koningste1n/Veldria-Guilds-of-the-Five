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

/* EV1 — nitidez igual perto e longe: o canvas da arena tem a resolução real da tela (CSS × densidade de pixels).
   O mundo em pixel art é desenhado numa camada em escala INTEIRA (k = cada pixel do mundo vira k×k) e essa camada
   é levada à tela com suavização: nenhum pixel some ao afastar nem fica torto ao aproximar ("sharp bilinear").
   Por cima, na resolução da tela, vêm os efeitos vetoriais, as barras de vida e os números. */
function ajustarResolucao() {
  const cv = Arena.cv; if (!cv) return;
  const dpr = Math.min(3, Math.max(1, window.devicePixelRatio || 1));
  const cssW = cv.clientWidth || VISTA.w;
  const w = Math.round(cssW * dpr), h = Math.round((cssW * dpr * VISTA.h) / VISTA.w);
  if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
  Arena.dpr = dpr; Arena.esc = w / VISTA.w;   // pixels de tela por unidade da janela
}
function prepararArena(cv, b, cenario = 'arena') {
  Arena.cv = cv; Arena.ctx = cv.getContext('2d');
  ajustarResolucao();
  if (!Arena.buf) Arena.buf = document.createElement('canvas');
  Arena.bctx = Arena.buf.getContext('2d');
  Arena.lenta = 0; Arena.lentaTotal = 0; Arena.zoomFoco = null; Arena.ultimaMorte = null; Arena.camFoco = null; Arena.cutin = null; Arena.lua = null; Arena.soco = 0; Arena.janela = null; timersArena.length = 0;
  Arena.cenario = cenario; Arena.cam = { x: 0, y: 0, zoom: 1, pronta: false }; Arena.camModo = 'formacao'; Arena.camEntrada = 0;
  for (const u of b.units) u.camQuente = 0;
  Arena.b = b; Arena.t = 0; Arena.part = []; Arena.nums = []; Arena.fx = []; Arena.vx = [];
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
// Números de dano/cura e rótulos: posição presa ao mundo, tamanho fixo na tela (não crescem com o zoom).
// esc 1 = rótulo pequeno · 2 = número normal · 3 = crítico. Números do mesmo alvo empilham para não se cobrirem.
function numero(x, y, txt, cor, esc = 2, dono = null, rotulo = false) {
  const pilha = Arena.nums.filter((n) => n.dono && n.dono === dono && n.max - n.vida < 0.35).length;
  Arena.nums.push({ x, y, txt: String(txt), cor, esc, vida: esc === 3 ? 1.0 : 0.85, max: esc === 3 ? 1.0 : 0.85, dono, pilha, jx: rnd(-7, 7), rotulo });
  if (Arena.nums.length > 40) Arena.nums.shift();
}
const TAM_NUM = { 1: 11, 2: 14, 3: 19 };   // px CSS
function efeito(tipo, props) { Arena.fx.push(Object.assign({ tipo, t: 0 }, props)); }
function tremer(dur, amp) { Arena.tremorAmp = Arena.tremor > 0 ? Math.max(amp, Arena.tremorAmp) : amp; Arena.tremor = Math.max(Arena.tremor, dur); }
const cab = (u) => u.y - 47;   // altura da barra de vida: os números nascem logo acima dela

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
// Cor do golpe de quem bate (arma ou projétil)
const COR_PROJ = { flecha: '#ffffff', fagulha: '#ff8c1a', gelinho: '#9fe6ff', luzinha: '#ffe48a', osso: '#7dff9a', nota: '#5fe0c8', veneno: '#8be05a' };
function corGolpe(src) {
  if (!src) return '#ffffff';
  if (src.proj) return COR_PROJ[src.proj] || '#ffffff';
  const def = spriteSet(src.look).def || {};
  return COR_ARMA[def.golem ? 'punho' : def.arma] || '#ffffff';
}
// Habilidade lançada que ainda vai acertar (projétil): o acerto ganha o efeito próprio dela
function marcarPendente(u, id, alvo) { vis(u).pend = { id, alvo, t: Arena.t }; }
function acertoDeHabilidade(ev) {
  const src = ev.src, V = src && src.vis, P = V && V.pend;
  if (!P || P.alvo !== ev.alvo || Arena.t - P.t > 2.5) return false;
  V.pend = null;
  const a = ev.alvo;
  switch (P.id) {
    case 'tiro':   // Atiradora de Elite: Tiro Certeiro
      vx('faisca', { x: a.x, y: a.y - 18, r: 24, n: 10, rot: 0.2, cor: '#ffd84a', dur: 0.32 });
      vx('anel', { x: a.x, y: a.y - 18, r0: 4, r1: 40, esp: 3, cor: '#ffd84a', ach: 0.8, dur: 0.36 });
      vx('anelChao', { x: a.x, y: a.y, r0: 4, r1: 30, esp: 2, cor: '#fff4c2', dur: 0.4 });
      vx('linhas', { x: a.x, y: a.y - 18, cor: '#ffe9a8', n: 18, dur: 0.35 });
      recuar(a, Math.sign(a.x - src.x) || 1, 11);
      Arena.pausa = Math.max(Arena.pausa, 0.12); tremer(0.22, 3); socar(0.1); Arena.flash = Math.max(Arena.flash, 0.1); Arena.flashCor = '255,236,170';
      numero(a.x, cab(a) - 22, 'CERTEIRO!', '#ffd84a', 1, a);
      faiscas(a.x, a.y - 18, 14, ['#ffffff', '#ffd84a', '#ffb36b'], 110);
      return true;
    case 'pira':   // Piromante Pira: coluna de fogo no alvo
      vx('chama', { alvo: a, h: 46, larg: 9, dur: 0.7 });
      vx('anelChao', { x: a.x, y: a.y, r0: 4, r1: 26, esp: 2.4, cor: '#ff8c1a', dur: 0.4 });
      vx('faisca', { x: a.x, y: a.y - 18, r: 18, n: 8, rot: 0, cor: '#ff8c1a', dur: 0.3 });
      Arena.pausa = Math.max(Arena.pausa, 0.08); tremer(0.2, 2.5); socar(0.07);
      fumaca(a.x, a.y - 6, 8, ['#5d5868', '#3e3a46', '#ff8c1a']);
      return true;
  }
  return false;
}
function vfxEvento(ev) {
  switch (ev.tipo) {
    case 'dano': {
      const a = ev.alvo, forca = clamp(ev.valor / Math.max(1, a.vidaMax * 0.08), 0.6, 3);
      recuar(a, ev.src && ev.src !== a ? Math.sign(a.x - ev.src.x) || -a.face : -a.face, ev.crit ? 6 : forca > 1.6 ? 4.5 : 2.5);
      const especial = acertoDeHabilidade(ev);
      if (ev.crit) {
        numero(a.x, cab(a) - 6, ev.valor + '!', '#ffd84a', 3, a);
        if (!especial) { vxImpacto(a, '#ffd84a', 2, true); faiscas(a.x, a.y - 15, 8, ['#ffffff', '#ffd84a', '#ffb36b'], 80); }
        socar(0.04); tremer(0.14, 2); Arena.pausa = Math.max(Arena.pausa, 0.06); Arena.festa = Math.max(Arena.festa, 0.6);
      } else {
        numero(a.x, cab(a), String(ev.valor), ev.escudo ? '#cfe8ff' : '#ffffff', 2, a);
        if (!especial) vxImpacto(a, ev.escudo ? '#9fd3ff' : corGolpe(ev.src), forca, false);
        if (forca > 1.6) { Arena.pausa = Math.max(Arena.pausa, 0.035); faiscas(a.x, a.y - 15, 5, ['#ffffff', '#e9dfc9'], 60); }
      }
      break;
    }
    case 'dot': numero(ev.alvo.x, cab(ev.alvo) + 4, String(ev.valor), COR_DOT[ev.dot] || '#ff9a3c', 2, ev.alvo); break;
    case 'esquiva': { const V = vis(ev.alvo); V.esq = 0.34; V.esqDir = -ev.alvo.face; numero(ev.alvo.x, cab(ev.alvo), 'ESQUIVA', '#cfd6ff', 1, ev.alvo); vx('linhas', { x: ev.alvo.x, y: ev.alvo.y - 18, cor: '#cfe0ff', n: 6, dur: 0.2 }); break; }
    case 'cura': {
      const a = ev.alvo;
      if (!ev.pequeno || ev.valor >= 12) { numero(a.x, cab(a), '+' + ev.valor, '#7dff8a', 2, a); vx('brilho', { alvo: a, r: 14, cor: '#7dff8a', a: 0.6, dur: 0.5 }); }
      for (let i = 0; i < (ev.pequeno ? 1 : 4); i++) particula(a.x + rnd(-9, 9), a.y - rnd(6, 24), 0, -22, 0.7, '#7dff8a', { tipo: 'cruz' });
      break;
    }
    case 'corte':
      vxCorte(ev.u, ev.alvo, ev.forte);
      if (ev.forte) { Arena.pausa = Math.max(Arena.pausa, 0.05); tremer(0.1, 1.5); socar(0.05); faiscas(ev.alvo.x, ev.alvo.y - 18, 6, ['#ffffff', '#ffe9a8'], 70); }
      break;
    case 'congelar':
      vx('gelo', { x: ev.alvo.x, y: ev.alvo.y + 2, r: 9, n: 7, dur: 1.2 }); vx('brilho', { alvo: ev.alvo, r: 16, cor: '#7fd6ff', a: 0.7, dur: 0.4 });
      faiscas(ev.alvo.x, ev.alvo.y - 15, 8, ['#e8fbff', '#7fd6ff'], 40); numero(ev.alvo.x, cab(ev.alvo) - 8, 'CONGELOU', '#9fe6ff', 1, ev.alvo); break;
    case 'atordoar':
      vx('faisca', { x: ev.alvo.x, y: ev.alvo.y - 30, r: 9, n: 5, rot: 0.3, cor: '#ffe48a', dur: 0.22 });
      vx('anel', { x: ev.alvo.x, y: ev.alvo.y - 30, r0: 2, r1: 12, esp: 1.2, cor: '#ffe48a', ach: 0.5, dur: 0.3 });
      numero(ev.alvo.x, cab(ev.alvo) - 8, 'ATORDOADO', '#ffe48a', 1, ev.alvo); break;
    case 'ritmo': particula(ev.u.x + rnd(-6, 6), ev.u.y - 34, rnd(-8, 8), -20, 0.8, '#f0c24b', { tipo: 'nota' }); break;
    case 'colheita': faiscas(ev.u.x, ev.u.y - 18, 6, ['#7dff9a', '#d6ffe0'], 30); vx('brilho', { alvo: ev.u, r: 12, cor: '#7dff9a', a: 0.5, dur: 0.4 }); break;
    case 'invocar': {
      const cor = ev.u.cls === 'golem' ? '#ff8a3c' : '#7dff9a';
      vx('circuloMagico', { x: ev.u.x, y: ev.u.y, r: 13, cor, dur: 0.7, giro: 4 }); vx('brilho', { x: ev.u.x, y: ev.u.y - 12, r: 16, cor, a: 0.8, ach: 1.4, dur: 0.45 });
      fumaca(ev.u.x, ev.u.y - 8, 8, ['#8a8496', '#5d5868', cor]); break;
    }
    case 'expirou': fumaca(ev.u.x, ev.u.y - 10, 10, ['#8a8496', '#5d5868']); break;
    case 'morte': Arena.festa = Math.max(Arena.festa, 0.8); if (!ev.u.invocacao) { vx('anel', { x: ev.u.x, y: ev.u.y - 14, r0: 4, r1: 18, esp: 1.6, cor: '#ffffff', ach: 0.6, dur: 0.3 }); vx('faisca', { x: ev.u.x, y: ev.u.y - 16, r: 16, n: 8, rot: 0, cor: '#ffe9c2', dur: 0.28 }); } break;
    case 'explosao': {
      const met = ev.cor === 'meteoro', inc = ev.raio > 30;
      vx('explosao', { x: ev.x, y: ev.y, r: ev.raio * (met ? 0.75 : 0.7) + 6, cor: '#ffb33c', cor2: met ? '#c4351c' : '#ff5a1f', dur: met ? 0.6 : 0.45 });
      vx('anelChao', { x: ev.x, y: ev.y + 12, r0: 4, r1: ev.raio + 4, esp: 2.6, cor: '#ffb33c', dur: 0.38 });
      vx('faisca', { x: ev.x, y: ev.y, r: 14 + ev.raio * 0.3, n: 8, rot: 0.4, cor: '#ffd23f', dur: 0.24 });
      if (met || inc) { vx('chama', { x: ev.x, y: ev.y + 12, h: 54, larg: 12, dur: 0.6 }); vx('linhas', { x: ev.x, y: ev.y, cor: '#ffb33c', n: 16, dur: 0.35 }); }
      Arena.pausa = Math.max(Arena.pausa, met ? 0.09 : 0.05); socar(met ? 0.11 : 0.07);
      faiscas(ev.x, ev.y, met ? 22 : 14, ['#ffd23f', '#ff8c1a', '#ff5a1f', '#ffffff'], met ? 110 : 85);
      fumaca(ev.x, ev.y, met ? 14 : 6, ['#5d5868', '#3e3a46', '#ff8c1a']);
      tremer(met ? 0.3 : 0.14, met ? 3 : 2);
      break;
    }
    case 'estilhaco':
      vx('gelo', { x: ev.x, y: ev.y + 12, r: ev.sup ? 16 : 10, n: ev.sup ? 9 : 6, dur: 0.75 });
      vx('faisca', { x: ev.x, y: ev.y, r: ev.sup ? 18 : 12, n: 6, rot: 0.5, cor: '#9fe6ff', dur: 0.22 });
      vx('anel', { x: ev.x, y: ev.y, r0: 3, r1: ev.sup ? 28 : 18, esp: 1.8, cor: '#bfefff', ach: 0.7, dur: 0.3 });
      faiscas(ev.x, ev.y, ev.sup ? 16 : 9, ['#e8fbff', '#7fd6ff', '#3a9fd6'], 65); socar(0.04);
      break;
    case 'flechada': {
      const bate = Arena.b && Arena.b.units.some((o) => o.vivo && o.cls === 'arqueira' && o.evo === 'b' && Math.abs(o.alvo ? o.alvo.x - ev.tx : 99) < 30);
      for (let i = 0; i < 6; i++) {
        const tx = ev.tx + rnd(-ev.raio, ev.raio) * 0.8, ty = ev.ty + rnd(-ev.raio, ev.raio) * 0.4, atraso = i * 0.03;
        vx('rastroArco', { x0: tx - 22, y0: ty - 70, x1: tx, y1: ty - 4, cor: bate ? '#9fe0a0' : '#fff4dc', larg: 0.9, dur: 0.16, atraso });
        vx('anelChao', { x: tx, y: ty, r0: 1, r1: 6, esp: 1, cor: bate ? '#9fe0a0' : '#e9dfc9', dur: 0.2, atraso: atraso + 0.12 });
        particula(tx - 20, ty - 48, 100, 240, 0.2, '#f4efe2', { tipo: 'flecha', fimY: ty });
      }
      setTimeoutArena(0.2, () => fumaca(ev.tx, ev.ty, 5, ['#c49c68', '#a07a4c']));
      break;
    }
    case 'flechaCai': { const a = ev.alvo; vx('rastroArco', { x0: a.x - 24, y0: a.y - 90, x1: a.x, y1: a.y - 10, cor: '#9ff0e8', larg: 1.1, dur: 0.18 }); particula(a.x - 20, a.y - 60, 100, 290, 0.2, '#f4efe2', { tipo: 'flecha', fimY: a.y - 8 }); break; }
    case 'adagaCai': { const a = ev.alvo; particula(a.x + rnd(-30, 30), a.y - 50, 0, 300, 0.15, '#d2d9e0', { tipo: 'adaga', fimY: a.y - 12 }); break; }
    case 'raio': vx('raioV', { de: ev.de, para: ev.para, cor: ev.de && ev.de.cls === 'clerica' ? '#ffe48a' : '#fff07a', dur: 0.24 }); vxImpacto(ev.para, '#fff7a8', 1.5); break;
    case 'raioCeu': vx('raioV', { de: { x: ev.alvo.x + rnd(-6, 6), y: ev.alvo.y - 120 }, para: ev.alvo, cor: '#9fc8ff', dur: 0.26 }); vxImpacto(ev.alvo, '#cfe0ff', 2); tremer(0.1, 1.5); Arena.flash = Math.max(Arena.flash, 0.08); Arena.flashCor = '200,220,255'; break;
    case 'execucao': socar(0.1); numero(ev.alvo.x, cab(ev.alvo) - 10, 'EXECUTADO', '#d4a6ff', 2, ev.alvo);
      vx('corte', { x: ev.alvo.x, y: ev.alvo.y - 18, ang: -0.8, r: 18, abre: Math.PI * 0.9, esp: 4, sentido: 1, cor: '#c48bff', achata: 0.8, dur: 0.3 });
      vx('corte', { x: ev.alvo.x, y: ev.alvo.y - 18, ang: 0.8 + Math.PI, r: 18, abre: Math.PI * 0.9, esp: 4, sentido: -1, cor: '#c48bff', achata: 0.8, dur: 0.3, atraso: 0.06 });
      faiscas(ev.alvo.x, ev.alvo.y - 15, 14, ['#c48bff', '#3b3150', '#ffffff'], 70); break;
    case 'renascer': vx('pilar', { alvo: ev.u, larg: 9, cor: '#ffd23f', dur: 0.8 }); numero(ev.u.x, cab(ev.u) - 6, 'RENASCEU', '#ffe48a', 2, ev.u); faiscas(ev.u.x, ev.u.y - 16, 16, ['#ffd23f', '#ff8c1a', '#fff4c2'], 70); break;
    case 'bomba': {
      Arena.flash = 0.2; Arena.flashCor = '255,200,120'; tremer(0.35, 3);
      for (const u of Arena.b.units) if (u.vivo && u.team !== ev.team) { vx('explosao', { x: u.x, y: u.y - 10, r: 14, cor: '#ffb33c', cor2: '#ff5a1f', dur: 0.4 }); faiscas(u.x, u.y - 10, 10, ['#ffd23f', '#ff8c1a', '#5d5868'], 70); }
      break;
    }
    case 'copia': numero(ev.u.x, cab(ev.u) - 14, 'COPIOU ' + semAcento(nomeHabilidade(ev.id)).toUpperCase(), '#d4a6ff', 1, ev.u); vx('raioV', { de: ev.alvo, para: ev.u, cor: '#bd86f5', dur: 0.4 }); break;
    case 'elemento': {
      const cor = ev.el === 'fogo' ? '#ff8c1a' : ev.el === 'gelo' ? '#7fd6ff' : '#ffe14a';
      vx('anel', { x: ev.u.x, y: ev.u.y - 14, r0: 4, r1: 30, esp: 2, cor, ach: 0.6, dur: 0.4 }); vx('circuloMagico', { x: ev.u.x, y: ev.u.y, r: 16, cor, dur: 0.6 });
      numero(ev.u.x, cab(ev.u) - 14, ev.el.toUpperCase(), cor, 2, ev.u);
      break;
    }
    case 'golens': numero(ev.u.x, cab(ev.u) - 14, 'GOLENS!', '#ff8a3c', 2, ev.u); tremer(0.3, 2.5); vx('anelChao', { x: ev.u.x, y: ev.u.y, r0: 6, r1: 50, esp: 3, cor: '#ff8a3c', dur: 0.5 }); break;
    case 'furiaGemea': numero(ev.u.x, cab(ev.u) - 14, 'FÚRIA!', '#ff5a4f', 3, ev.u); faiscas(ev.u.x, ev.u.y - 18, 16, ['#ff5a4f', '#7d2219'], 70); vx('brilho', { alvo: ev.u, r: 22, cor: '#ff5a4f', a: 0.8, dur: 0.6 }); break;
    case 'skill': vfxSkill(ev); break;
    case 'supremo': {
      Arena.flash = 0.25; Arena.flashCor = '255,248,220'; tremer(0.35, 3.5); Arena.pausa = Math.max(Arena.pausa, 0.55); Arena.festa = 1.5;
      Arena.cutin = { u: ev.u, t: 0, dur: 1.1 }; focarCamera(ev.u.x, ev.u.y, 1.7, 1.3);
      vx('linhas', { x: ev.u.x, y: ev.u.y - 18, cor: '#ffe48a', n: 26, dur: 0.8 });
      vx('anel', { x: ev.u.x, y: ev.u.y - 18, r0: 6, r1: 48, esp: 3, cor: '#ffd84a', ach: 0.7, dur: 0.5 });
      vx('circuloMagico', { x: ev.u.x, y: ev.u.y, r: 22, cor: '#ffd84a', dur: 1.1, giro: 5 });
      faiscas(ev.u.x, ev.u.y - 18, 22, ['#ffd84a', '#ffffff', '#f0c24b'], 90);
      if (Arena.aoSupremo) Arena.aoSupremo(ev.u);
      break;
    }
  }
}
const timersArena = [];
function setTimeoutArena(t, fn) { timersArena.push({ t, fn }); }

/* ---- habilidades: cada uma (e cada evolução) com assinatura visual própria ---- */
function vfxSkill(ev) {
  const u = ev.u, cor = COR_SKILL[ev.id] || '#ffffff', sup = ev.sup, evo = u.evo;
  if ((ev.id === 'investida' && evo !== 'b') || ev.id === 'passo') saltar(u, ev.x0, ev.y0, ev.id === 'passo' ? 0.2 : 0.26, ev.id === 'passo' ? 6 : 16);
  if (ev.id === 'luz' || ev.id === 'bencaoMenor' || ev.id === 'primeirosSocorros' || ev.id === 'juramento') vis(u).cura = 0.45;
  switch (ev.id) {
    case 'muralha': {
      const r = sup ? 20 : 16;
      vx('cupula', { alvo: u, r, cor: evo === 'a' ? '#ff9a7a' : '#7fc8ff', dur: 0.85 });
      vx('anelChao', { x: u.x, y: u.y, r0: 5, r1: evo === 'a' ? 64 : sup ? 60 : 43, esp: 3, cor: evo === 'a' ? '#ff6a5a' : '#9fd3ff', dur: 0.45 });
      if (evo === 'a') vx('anelChao', { x: u.x, y: u.y, r0: 5, r1: 64, esp: 2, cor: '#ff6a5a', dur: 0.45, atraso: 0.2 });
      if (evo === 'b') { const al = aliadosDeArena(u).filter((o) => o !== u && o.st.shield).sort((p, q) => p.vida / p.vidaMax - q.vida / q.vidaMax)[0]; if (al) { vx('cupula', { alvo: al, r: 14, cor: '#ffd23f', dur: 0.8 }); vx('raioV', { de: u, para: al, cor: '#ffe48a', dur: 0.3 }); } }
      vx('faisca', { x: u.x, y: u.y - 20, r: 12, n: 6, rot: 0, cor: '#9fd3ff', dur: 0.2 });
      fumaca(u.x, u.y, 6, ['#c49c68', '#a07a4c']); tremer(0.14, 1.8); socar(0.04);
      break;
    }
    case 'redemoinho': {
      const ceif = evo === 'b', c1 = ceif ? '#ff5a6a' : '#ffe9c2';
      vx('marcaV', { x: u.x, y: u.y, r: ev.raio, cor: ceif ? '#ff5a6a' : '#ffb36b', dur: 0.18 });
      vx('corte', { x: u.x, y: u.y - 14, ang: 0, r: ev.raio * 0.9, abre: Math.PI * 2, esp: 5, sentido: 1, cor: c1, achata: 0.5, dur: 0.32, atraso: 0.14, duplo: true });
      vx('corte', { x: u.x, y: u.y - 10, ang: Math.PI, r: ev.raio * 0.75, abre: Math.PI * 2, esp: 3.5, sentido: 1, cor: c1, achata: 0.5, dur: 0.3, atraso: 0.2 });
      vx('anelChao', { x: u.x, y: u.y, r0: 6, r1: ev.raio + 8, esp: 3, cor: c1, dur: 0.3, atraso: 0.16 });
      if (ceif) vx('linhas', { x: u.x, y: u.y - 14, cor: '#ff5a6a', n: 14, dur: 0.35 });
      setTimeoutArena(0.16, () => { fumaca(u.x, u.y, 9, ['#c49c68', '#a07a4c']); tremer(0.16, 2.2); socar(0.06); });
      break;
    }
    case 'investida': {
      const a = u.alvo;
      if (evo === 'b') {   // Sentinela: varre quem chegou perto
        vx('corte', { x: u.x + u.face * 8, y: u.y - 16, ang: u.face > 0 ? 0 : Math.PI, r: 18, abre: Math.PI * 1.1, esp: 5, sentido: u.face, cor: '#ffd27a', achata: 0.6, dur: 0.26, duplo: true });
        vx('anelChao', { x: u.x, y: u.y, r0: 4, r1: 32, esp: 2.5, cor: '#ffd27a', dur: 0.35 });
        tremer(0.15, 2); socar(0.06); break;
      }
      vx('feixe', { x0: ev.x0, y0: ev.y0 - 18, x1: u.x + u.face * 26, y1: u.y - 18, larg: sup ? 4 : 3, cor: '#ffb36b', dur: 0.3 });
      vx('anelChao', { x: u.x + u.face * 10, y: u.y, r0: 4, r1: 34, esp: 3, cor: '#ffd27a', dur: 0.4 });
      vx('linhas', { x: u.x + u.face * 14, y: u.y - 18, cor: '#ffe9c2', n: 14, dur: 0.3 });
      if (a) vx('faisca', { x: a.x, y: a.y - 18, r: 18, n: 8, rot: 0, cor: '#ffd27a', dur: 0.26 });
      fumaca(ev.x0, ev.y0, 6, ['#c49c68', '#a07a4c']); fumaca(u.x, u.y, 7, ['#c49c68', '#a07a4c']);
      tremer(0.2, 2.6); socar(0.08); Arena.pausa = Math.max(Arena.pausa, 0.07);
      break;
    }
    case 'chuva': case 'meteoro': {
      if (ev.tiro) {   // Atiradora de Elite: carrega, mira e dispara
        vx('juntar', { u, cor: '#ffd84a', dur: 0.22 }); vx('mira', { u, alvo: ev.alvo || u.alvo, cor: '#ffd84a', dur: 0.4 });
        vx('anel', { x: u.x + u.face * 10, y: u.y - 19, r0: 2, r1: 14, esp: 1.6, cor: '#ffd84a', ach: 1, dur: 0.25, atraso: 0.08 });
        const p = Arena.b.projs.filter((q) => q.src === u).pop(); if (p) p.vis = 'tiro';
        marcarPendente(u, 'tiro', p ? p.alvo : u.alvo);
        break;
      }
      const met = ev.id === 'meteoro';
      vx('marcaV', { x: ev.tx, y: ev.ty, r: ev.raio, cor: met ? '#ff8c1a' : evo === 'b' ? '#7fd08a' : '#ff6a5a', dur: ev.dur });
      if (met) setTimeoutArena(0.15, () => particula(ev.tx - 50, ev.ty - 110, 110, 230, 0.45, '#ff8c1a', { tipo: 'meteoro', fimY: ev.ty - 6 }));
      vx('anel', { x: u.x + u.face * 6, y: u.y - 26, r0: 2, r1: 10, esp: 1.2, cor: '#c8e6a0', ach: 1, dur: 0.22 });
      break;
    }
    case 'bolaFogo': {
      vx('circuloMagico', { x: u.x, y: u.y, r: sup ? 18 : 13, cor: '#ff8c1a', dur: 0.55, giro: 4 });
      vx('juntar', { u, cor: '#ffb33c', dx: 8, dy: 30, dur: 0.18 });
      faiscas(u.x + u.face * 11, u.y - 20, sup ? 12 : 7, ['#ffd23f', '#ff8c1a', '#fff4c2'], 35);
      if (evo === 'b') marcarPendente(u, 'pira', u.alvo);
      break;
    }
    case 'lancaGelo': {
      vx('circuloMagico', { x: u.x, y: u.y, r: sup ? 18 : 13, cor: '#7fd6ff', dur: 0.55, giro: -4 });
      vx('juntar', { u, cor: '#bfefff', dx: 8, dy: 30, dur: 0.18 });
      if (evo === 'b' && u.alvo) { const a = u.alvo, ang = Math.atan2(a.y - u.y, a.x - u.x); vx('feixe', { x0: u.x + u.face * 8, y0: u.y - 20, x1: a.x + Math.cos(ang) * 70, y1: a.y - 18 + Math.sin(ang) * 70, larg: 2.4, cor: '#9fe6ff', dur: 0.45, atraso: 0.18 }); }
      faiscas(u.x + u.face * 11, u.y - 20, sup ? 12 : 7, ['#e8fbff', '#7fd6ff', '#ffffff'], 35);
      break;
    }
    case 'luz': {
      const a = ev.alvo, todos = evo === 'a' || sup;
      vx('circuloMagico', { x: u.x, y: u.y, r: 14, cor: '#ffd23f', dur: 0.6 });
      vx('pilar', { alvo: a, larg: 8, cor: '#ffd23f', dur: 0.7 });
      if (todos) aliadosDeArena(u).forEach((o) => o !== a && vx('pilar', { alvo: o, larg: 6, cor: '#ffe48a', dur: 0.6, atraso: 0.08 }));
      vx('brilho', { alvo: a, r: 18, cor: '#fff4c2', a: 0.8, dur: 0.5 });
      break;
    }
    case 'bencaoMenor': case 'primeirosSocorros': vx('pilar', { alvo: ev.alvo, larg: 5, cor: '#7dff8a', dur: 0.5 }); break;
    case 'barreiraArcana': vx('cupula', { alvo: ev.alvo, r: 13, cor: '#bd86f5', dur: 0.6 }); break;
    case 'egideDivina': for (const o of ev.aliados || []) vx('cupula', { alvo: o, r: 14, cor: '#ffd23f', dur: 0.7 }); break;
    case 'passo': {
      const a = ev.alvo || u.alvo;
      fumaca(ev.x0, ev.y0 - 10, 12, ['#3b3150', '#6b4fa0', '#c48bff']);
      vx('rastroArco', { x0: ev.x0, y0: ev.y0 - 18, x1: u.x, y1: u.y - 18, cor: '#c48bff', larg: 2, dur: 0.3 });
      if (a) {
        vx('corte', { x: a.x, y: a.y - 18, ang: -0.7, r: 15, abre: Math.PI * 0.9, esp: 3.5, sentido: 1, cor: '#c48bff', achata: 0.85, dur: 0.24, atraso: 0.04 });
        vx('corte', { x: a.x, y: a.y - 18, ang: 0.7 + Math.PI, r: 15, abre: Math.PI * 0.9, esp: 3.5, sentido: -1, cor: '#c48bff', achata: 0.85, dur: 0.24, atraso: 0.1 });
      }
      if (evo === 'b') vx('brilho', { alvo: u, r: 16, cor: '#7a4fc0', a: 0.6, dur: 2 });
      fumaca(u.x, u.y - 10, 10, ['#3b3150', '#6b4fa0', '#c48bff']); tremer(0.12, 1.8); socar(0.05);
      break;
    }
    case 'hino': case 'gritoGuerra': {
      const mal = ev.maldicao, c1 = mal ? '#bd86f5' : '#5fe0c8';
      vx('notas', { x: u.x, y: u.y - 18, r: 46, cor: c1, dur: 0.8 });
      vx('circuloMagico', { x: u.x, y: u.y, r: 16, cor: c1, dur: 0.7 });
      for (const o of ev.aliados || []) {
        vx('brilho', { alvo: o, r: 14, cor: mal ? '#7a4fc0' : '#ffe48a', a: 0.7, dur: 0.6, atraso: 0.1 });
        for (let i = 0; i < 2; i++) particula(o.x + rnd(-8, 8), o.y - rnd(16, 28), rnd(-8, 8), -22, 0.9, mal ? '#bd86f5' : '#f0c24b', { tipo: 'nota' });
        particula(o.x, o.y - 40, 0, mal ? 14 : -14, 0.7, mal ? '#bd86f5' : '#ffe48a', { tipo: 'seta' });
      }
      break;
    }
    case 'gritoIntimidador': vx('anel', { x: u.x, y: u.y - 14, r0: 5, r1: 70, esp: 3, cor: '#e0574f', ach: 0.6, dur: 0.4 }); vx('linhas', { x: u.x, y: u.y - 20, cor: '#ff8a7a', n: 14, dur: 0.3 }); tremer(0.15, 1.5); break;
    case 'esqueletos': vx('circuloMagico', { x: u.x, y: u.y, r: evo === 'b' ? 22 : 18, cor: '#7dff9a', dur: 0.8, giro: 3 }); vx('juntar', { u, cor: '#7dff9a', dx: 8, dy: 30, dur: 0.25 }); break;
    case 'terremoto':
      vx('marcaV', { x: u.x, y: u.y, r: 30, cor: '#ffb33c', dur: 0.25 });
      setTimeoutArena(0.25, () => {
        tremer(0.6, 4); Arena.flash = 0.15; Arena.flashCor = '232,200,138'; Arena.pausa = Math.max(Arena.pausa, 0.06); socar(0.12);
        vx('anelChao', { x: u.x, y: u.y, r0: 6, r1: 150, esp: 4, cor: '#ffb33c', dur: 0.6 }); vx('anelChao', { x: u.x, y: u.y, r0: 6, r1: 100, esp: 3, cor: '#fff4c2', dur: 0.5, atraso: 0.1 });
        efeito('rachadura', { x: u.x, y: u.y, alc: 140, n: 7, fase: rnd(0, 6), dur: 1.1 });
        for (let i = 0; i < 30; i++) particula(rnd(0, ARENA.w), rnd(ARENA.chao, ARENA.fundo), rnd(-10, 10), rnd(-50, -20), 0.6, pick(['#c49c68', '#8f6c45', '#a07a4c']), { g: 120, tam: 3 });
      });
      break;
    case 'juramento': Arena.flash = 0.2; Arena.flashCor = '255,244,194'; for (const o of aliadosDeArena(u)) vx('pilar', { alvo: o, larg: 9, cor: '#ffe48a', dur: 0.8 }); break;
    case 'eclipse': Arena.festa = 1; Arena.lua = { t: 0, dur: 1.5 }; setTimeoutArena(0.45, () => { Arena.flash = 0.2; Arena.flashCor = '196,139,255'; tremer(0.2, 2.5); }); break;
    case 'furiaDragao': {
      const [dx, dy] = dirDe(ev.ang);
      efeito('cone', { x: u.x + dx * 8, y: u.y - 18 + dy * 4, ang: ev.ang, alc: 70 * E, abre: 30, cores: ['#fff4c2', '#ffd23f', '#ff8c1a', '#ff5a1f'], dur: 0.6 });
      for (let i = 0; i < 4; i++) vx('explosao', { x: u.x + dx * (20 + i * 14), y: u.y - 18 + dy * (10 + i * 7), r: 8 + i * 2, cor: '#ffb33c', cor2: '#ff5a1f', dur: 0.5, atraso: i * 0.06 });
      tremer(0.35, 2.5);
      break;
    }
    case 'olhoTempestade': Arena.flash = 0.1; Arena.flashCor = '200,220,255'; break;
    case 'chuvaLaminas': faiscas(u.x, u.y - 30, 8, ['#d2d9e0', '#ffffff'], 40); break;
  }
  numero(u.x, u.y, nomeHabilidade(ev.id), cor, 1, null, true);   // nome da habilidade: legenda sob os pés, sem disputar espaço com os números
}
function aliadosDeArena(u) { return Arena.b ? Arena.b.units.filter((o) => o.vivo && o.team === u.team) : []; }

/* ---- atualização dos efeitos (tempo real × velocidade) ---- */
function atualizarVfx(dt) {
  Arena.t += dt;
  atualizarCamera(dt); climaArena(dt); atualizarVx(dt);
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
  for (let i = Arena.nums.length - 1; i >= 0; i--) { const n = Arena.nums[i]; n.vida -= dt; if (n.vida <= 0) Arena.nums.splice(i, 1); }
  for (let i = Arena.fx.length - 1; i >= 0; i--) { const f = Arena.fx[i]; f.t += dt; if (f.t >= f.dur) Arena.fx.splice(i, 1); }
  if (Arena.b) for (const p of Arena.b.projs) {
    if (p.tipo === 'bolaFogo' || p.tipo === 'bolaFogoG' || p.tipo === 'fagulha') { if (Math.random() < (p.tipo === 'fagulha' ? 0.4 : 1)) particula(p.x + rnd(-2, 2), p.y + rnd(-2, 2), rnd(-8, 8), rnd(-16, 0), 0.3, pick(['#ffd23f', '#ff8c1a', '#ff5a1f'])); }
    else if (p.tipo === 'gelo' || p.tipo === 'geloG') { if (Math.random() < 0.8) particula(p.x, p.y, rnd(-6, 6), rnd(-6, 6), 0.3, pick(['#e8fbff', '#7fd6ff'])); }
    else if (p.tipo === 'veneno') { if (Math.random() < 0.6) particula(p.x, p.y, rnd(-4, 4), rnd(-4, 4), 0.3, pick(['#8be05a', '#3d6129'])); }
    else if (p.tipo === 'luzinha' || p.tipo === 'osso') { if (Math.random() < 0.4) particula(p.x, p.y, 0, 0, 0.2, p.tipo === 'osso' ? '#7dff9a' : '#ffe48a'); }
  }
  if (Arena.b) for (const u of Arena.b.units) {
    atualizarVis(u, dt);
    if (u.evo && u.vivo && Math.random() < dt * 5) { const cor = corEvo(u); if (cor) particula(u.x + rnd(-8, 8), u.y - rnd(0, 26), rnd(-3, 3), rnd(-22, -10), rnd(0.4, 0.7), Math.random() < 0.3 ? '#ffffff' : cor, { tam: 1 }); }
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
  ajustarResolucao();
  // janela da câmera (em unidades do mundo)
  const cam = Arena.cam, z = cam.zoom * (1 + (Arena.soco || 0)), vw = VISTA.w / z, vh = VISTA.h / z;
  const ccx = cam.x + VISTA.w / cam.zoom / 2, ccy = cam.y + VISTA.h / cam.zoom / 2;
  let jx = centrarJanela(ccx, vw, ARENA.w), jy = centrarJanela(ccy, vh, ARENA.h);
  Arena.janela = { x: jx, y: jy, z };
  if (Arena.tremor > 0) { jx += rnd(-1, 1) * Arena.tremorAmp * 0.8; jy += rnd(-1, 1) * Arena.tremorAmp * 0.8; }
  const S = Arena.esc * z;                       // pixels de tela por pixel do mundo
  const k = Math.max(1, Math.min(8, Math.ceil(S - 0.1)));   // escala inteira da camada de pixels
  const bw = Math.ceil(vw * k) + 2, bh = Math.ceil(vh * k) + 2;
  if (Arena.buf.width < bw || Arena.buf.height < bh) { Arena.buf.width = Math.max(bw, Arena.buf.width); Arena.buf.height = Math.max(bh, Arena.buf.height); }
  Arena.k = k; Arena.S = S; Arena.jx = jx; Arena.jy = jy;
  // ---- camada de pixels (mundo) ----
  c.setTransform(1, 0, 0, 1, 0, 0); c.imageSmoothingEnabled = false;
  c.fillStyle = '#05030a'; c.fillRect(0, 0, bw, bh);
  c.setTransform(k, 0, 0, k, -jx * k, -jy * k);
  desenharMundo(c, b);
  // ---- para a tela, com suavização (pixels inteiros, bordas limpas) ----
  v.setTransform(1, 0, 0, 1, 0, 0);
  v.fillStyle = '#05030a'; v.fillRect(0, 0, Arena.cv.width, Arena.cv.height);
  v.imageSmoothingEnabled = true; v.imageSmoothingQuality = S / k < 0.75 ? 'medium' : 'low';
  v.drawImage(Arena.buf, 0, 0, bw, bh, 0, 0, (bw * S) / k, (bh * S) / k);
  // ---- camada vetorial (resolução da tela) ----
  v.setTransform(S, 0, 0, S, -jx * S, -jy * S);
  if (typeof desenharVetorMundo === 'function') desenharVetorMundo(v, b);
  v.setTransform(1, 0, 0, 1, 0, 0);
  desenharBarrasTela(v, b);
  desenharNumerosTela(v);
  // ---- sobreposições na escala da janela (256×180) ----
  v.setTransform(Arena.esc, 0, 0, Arena.esc, 0, 0); v.imageSmoothingEnabled = false;
  if (b.eclipse > 0) { v.fillStyle = `rgba(14,6,26,${Math.min(0.65, b.eclipse)})`; v.fillRect(0, 0, VISTA.w, VISTA.h); }
  if (Arena.lua) desenharFx2(v, { tipo: 'lua', x: VISTA.w / 2, y: 26, t: Arena.lua.t }, Arena.lua.t / Arena.lua.dur);
  if (Arena.flash > 0) { v.fillStyle = `rgba(${Arena.flashCor},${(Arena.flash / 0.25) * 0.55})`; v.fillRect(0, 0, VISTA.w, VISTA.h); }
  if (b.furia > 1 && !(Arena.lenta > 0)) { v.fillStyle = `rgba(224,87,79,${0.06 + 0.04 * Math.sin(Arena.t * 6)})`; v.fillRect(0, 0, VISTA.w, VISTA.h); }
  if (Arena.cutin) desenharCutin(v, Arena.cutin);
  if (Arena.lenta > 0) {   // faixas de cinema
    const kk = Math.min(1, (Arena.lentaTotal - Arena.lenta) / 0.15, Arena.lenta / 0.2), h = 14 * kk;
    v.fillStyle = '#05030a'; v.fillRect(0, 0, VISTA.w, h); v.fillRect(0, VISTA.h - h, VISTA.w, h);
  }
  v.setTransform(1, 0, 0, 1, 0, 0);
}
// Mundo → pixels de tela
const naTela = (x, y) => [(x - Arena.jx) * Arena.S, (y - Arena.jy) * Arena.S];
// Posição de desenho de um sprite: arredonda para a grade da camada (1/k de pixel do mundo) — movimento suave no zoom
const gradeK = (v) => Math.round(v * (Arena.k || 1)) / (Arena.k || 1);
function desenharMundo(c, b) {
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
  desenharVxChao(c);
  for (const u of b.units) {
    if (!u.vivo && u.anim.morteT > 1.3) continue;
    const x = Math.round(u.x), y = Math.round(u.y), w = u.cls === 'golem' || u.chefe === 'colosso' ? 9 : 7;
    c.fillStyle = 'rgba(20,10,24,0.32)';
    c.fillRect(x - w, y, w * 2 + 1, 1); c.fillRect(x - w + 2, y + 1, w * 2 - 3, 1); c.fillRect(x - w + 2, y - 1, w * 2 - 3, 1);
    if (u.vivo && !u.invocacao) anelTime(c, x, y, w + 3, 3, u.team === 0 ? 'rgba(108,199,106,0.55)' : 'rgba(224,87,79,0.55)');
  }
  const lista = b.units.filter((u) => u.vivo || u.anim.morteT < 1.3 || u.reviver > 0).sort((p, q) => ((p.vivo ? 1 : 0) - (q.vivo ? 1 : 0)) || p.y - q.y);
  for (const u of lista) desenharUnidade(c, u);
  for (const p of b.projs) desenharProjetil(c, p);
  for (const f of Arena.fx) desenharFx(c, f);
  for (const p of Arena.part) desenharParticula(c, p);
  desenharVxAr(c);
  if (b.focoCapitao && b.focoCapitao.vivo && Math.floor(Arena.t * 4) % 2) {
    const f = b.focoCapitao, x = Math.round(f.x), y = Math.round(f.y) - 58;
    c.fillStyle = CONTORNO; c.fillRect(x - 4, y - 1, 9, 6);
    c.fillStyle = '#ff5a4f'; c.fillRect(x - 3, y, 7, 1); c.fillRect(x - 2, y + 1, 5, 1); c.fillRect(x - 1, y + 2, 3, 1); c.fillRect(x, y + 3, 1, 1);
  }
}
// Números: fonte de verdade, contorno escuro, "pulo" ao nascer, sobem e somem; tamanho fixo na tela
function desenharNumerosTela(v) {
  const dpr = Arena.dpr || 1;
  v.textAlign = 'center'; v.textBaseline = 'alphabetic'; v.lineJoin = 'round';
  for (const n of Arena.nums) {
    const idade = n.max - n.vida, t = idade / n.max;
    const [sx, sy0] = naTela(n.x, n.y);
    const sobe = (1 - Math.pow(1 - Math.min(1, t * 1.6), 2)) * 16 + n.pilha * 12;
    const pulo = idade < 0.12 ? 1 + (n.esc === 3 ? 0.7 : 0.4) * (1 - idade / 0.12) : 1;
    const tam = TAM_NUM[n.esc] * dpr * pulo;
    const sy = n.rotulo ? sy0 + 13 * dpr : sy0 - (sobe + 7) * dpr;
    v.globalAlpha = t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1;
    v.font = `${Math.round(tam)}px 'Lilita One', 'Nunito', sans-serif`;
    const meia = v.measureText(n.txt).width / 2 + 4 * dpr;
    const x = clamp(sx + (n.esc === 1 ? 0 : n.jx * dpr), meia, Arena.cv.width - meia);
    v.lineWidth = Math.max(2, tam * 0.2); v.strokeStyle = '#140a1c'; v.strokeText(n.txt, x, sy);
    v.fillStyle = n.cor; v.fillText(n.txt, x, sy);
    if (n.esc === 3) { v.globalAlpha *= 0.55; v.fillStyle = '#ffffff'; v.fillText(n.txt, x, sy - tam * 0.06); v.globalAlpha = 1; v.fillStyle = n.cor; v.save(); v.beginPath(); v.rect(x - 200, sy - tam * 0.45, 400, tam); v.clip(); v.fillText(n.txt, x, sy); v.restore(); }
  }
  v.globalAlpha = 1;
}
// Barras de vida sobre a cabeça: nítidas, proporcionais ao boneco, com um "rastro" branco do dano recente
function desenharBarrasTela(v, b) {
  const dpr = Arena.dpr || 1, S = Arena.S;
  for (const u of b.units) {
    if (!u.vivo) continue;
    const grande = u.chefe === 'colosso';
    const [sx, sy] = naTela(u.x, u.y - (grande ? 62 : 47));
    const w = clamp((u.chefe ? 28 : 20) * S, 22 * dpr, 46 * dpr), h = Math.max(3 * dpr, Math.min(5 * dpr, 2.6 * S));
    const x = Math.round(sx - w / 2), y = Math.round(sy);
    const pct = clamp(u.vida / u.vidaMax, 0, 1);
    u.vidaRastro = u.vidaRastro === undefined ? pct : Math.max(pct, u.vidaRastro - 0.6 * (1 / 60));
    v.fillStyle = 'rgba(12,6,18,0.85)'; v.fillRect(x - dpr, y - dpr, w + 2 * dpr, h + 2 * dpr);
    v.fillStyle = '#3a1f2a'; v.fillRect(x, y, w, h);
    v.fillStyle = '#fff2d8'; v.fillRect(x, y, w * u.vidaRastro, h);
    v.fillStyle = u.invocacao ? '#b8b0c4' : COR_TIME[u.team]; v.fillRect(x, y, w * pct, h);
    v.fillStyle = 'rgba(255,255,255,0.28)'; v.fillRect(x, y, w * pct, Math.max(1, h * 0.35));
    if (u.st.shield) { const ws = Math.min(w, (w * u.st.shield.v) / u.vidaMax); v.fillStyle = '#dff0ff'; v.fillRect(x, y + h - Math.max(1, h * 0.4), ws, Math.max(1, h * 0.4)); }
    if (u.capitao) {
      v.fillStyle = 'rgba(12,6,18,0.85)'; v.fillRect(x - dpr, y + h, w + 2 * dpr, 2 * dpr + dpr);
      v.fillStyle = u.energia >= 100 ? (Math.floor(Arena.t * 6) % 2 ? '#fff4c2' : '#f0c24b') : '#f0c24b';
      v.fillRect(x, y + h + dpr, (w * u.energia) / 100, 2 * dpr);
      const ic = iconeCanvas('coroa'), e = 2 * dpr; v.imageSmoothingEnabled = false;
      v.drawImage(ic, Math.round(sx - (ic.width * e) / 2), Math.round(y - ic.height * e - dpr), ic.width * e, ic.height * e);
    }
    if (u.evo && !u.chefe && !u.campeao) { const cor = corEvo(u); if (cor) { const r = 3.2 * dpr, cx = x - r - 2 * dpr, cy = y + h / 2; v.fillStyle = '#140a1c'; v.beginPath(); v.moveTo(cx, cy - r - dpr); v.lineTo(cx + r + dpr, cy); v.lineTo(cx, cy + r + dpr); v.lineTo(cx - r - dpr, cy); v.fill(); v.fillStyle = cor; v.beginPath(); v.moveTo(cx, cy - r); v.lineTo(cx + r, cy); v.lineTo(cx, cy + r); v.lineTo(cx - r, cy); v.fill(); } }
    if (u.chefe || u.campeao) { const ic = iconeCanvas(u.chefe ? 'caveira' : 'estrela'), e = 1.5 * dpr; v.imageSmoothingEnabled = false; v.drawImage(ic, Math.round(x - ic.width * e - dpr), Math.round(y + h / 2 - (ic.height * e) / 2), ic.width * e, ic.height * e); }
  }
}
// SUPREMO: escurece a janela, uma faixa diagonal na cor do time cruza a tela com o retrato e o nome do golpe
function desenharCutin(v, ci) {
  const u = ci.u, esq = u.team === 0, W = VISTA.w, H = VISTA.h;
  const entra = easeOut(Math.min(1, ci.t / 0.2)), sai = Math.max(0, (ci.t - (ci.dur - 0.22)) / 0.22), vis1 = entra * (1 - sai);
  v.save();
  v.fillStyle = `rgba(8,4,16,${0.55 * (1 - sai)})`; v.fillRect(0, 0, W, H);
  // faixa
  const cy = H * 0.52, alt = 62, inc = 26, desl = (esq ? -1 : 1) * (1 - entra) * W + (esq ? 1 : -1) * sai * W;
  v.translate(desl, 0);
  const g = v.createLinearGradient(0, cy - alt / 2, 0, cy + alt / 2);
  const cor = esq ? ['#1e5a2e', '#6cc76a'] : ['#5a1e22', '#e0574f'];
  g.addColorStop(0, cor[0]); g.addColorStop(0.5, cor[1]); g.addColorStop(1, cor[0]);
  v.fillStyle = g; v.beginPath(); v.moveTo(-20, cy - alt / 2 + inc); v.lineTo(W + 20, cy - alt / 2 - inc); v.lineTo(W + 20, cy + alt / 2 - inc); v.lineTo(-20, cy + alt / 2 + inc); v.closePath(); v.fill();
  v.strokeStyle = '#ffe48a'; v.lineWidth = 1.5; v.stroke();
  // linhas de velocidade dentro da faixa
  v.save(); v.clip(); v.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 14; i++) { const yy = cy - alt / 2 + ((i * 37 + ci.t * 900) % alt) - inc * 0.2, xx = ((i * 71 + ci.t * 600 * (esq ? 1 : -1)) % (W + 80)) - 40; v.fillStyle = 'rgba(255,255,255,0.18)'; v.fillRect(xx, yy, 40, 1); }
  v.restore();
  // retrato
  const ret = retrato(u.look, 0), e = 2.2, rx = esq ? 14 : W - 14 - ret.width * e, ry = cy - ret.height * e * 0.62;
  v.imageSmoothingEnabled = false; v.drawImage(ret, rx, ry, ret.width * e, ret.height * e);
  // textos
  const tx = esq ? rx + ret.width * e + 8 : rx - 8;
  v.textAlign = esq ? 'left' : 'right'; v.textBaseline = 'alphabetic'; v.lineJoin = 'round';
  const txt = (t, x, y, tam, corT) => { v.font = `${tam}px 'Lilita One', sans-serif`; v.lineWidth = tam * 0.22; v.strokeStyle = '#140a1c'; v.strokeText(t, x, y); v.fillStyle = corT; v.fillText(t, x, y); };
  txt('SUPREMO!', tx, cy - 8 - (esq ? 6 : -6), 18, '#ffe48a');
  txt(nomeHabilidade(u.skill.id), tx, cy + 10 - (esq ? 6 : -6), 12, '#ffffff');
  v.font = `600 9px 'Nunito', sans-serif`; v.fillStyle = 'rgba(255,255,255,.85)'; v.fillText(u.nome, tx, cy + 21 - (esq ? 6 : -6));
  v.restore();
  if (vis1 > 0.9 && Math.floor(ci.t * 20) % 2) { v.fillStyle = 'rgba(255,244,194,0.06)'; v.fillRect(0, 0, W, H); }
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
/* ---- EV3: animação e deslocamentos SÓ VISUAIS (u.vis). A simulação não lê nada disto: reproduções continuam idênticas ----
   kb = recuo ao apanhar (empurra e volta) · esq = esquiva (recua e volta, com imagem fantasma) · salto = pulo/arrancada
   entre dois pontos (investida, passo) · caido = atordoado no chão, depois levanta */
function vis(u) { return u.vis || (u.vis = { kb: 0, kbT: 9, esq: 0, esqDir: -1, salto: null, caido: 0, levantar: 0, cura: 0, fantasmas: [] }); }
function recuar(u, dir, amp) { const V = vis(u); V.kb = dir * Math.max(Math.abs(V.kbT < 0.15 ? V.kb : 0), amp); V.kbT = 0; }
function saltar(u, x0, y0, dur, alto) { const V = vis(u); V.salto = { t: 0, dur, dx: x0 - u.x, dy: y0 - u.y, alto }; }
function atualizarVis(u, dt) {
  const V = vis(u);
  V.kbT += dt; if (V.esq > 0) V.esq = Math.max(0, V.esq - dt);
  if (V.salto) { V.salto.t += dt; if (V.salto.t >= V.salto.dur) V.salto = null; }
  if (V.cura > 0) V.cura = Math.max(0, V.cura - dt);
  const atord = u.vivo && u.st.stun > 0 && !(u.st.freeze > 0);
  if (atord) V.caido += dt; else if (V.caido > 0) { V.caido = 0; V.levantar = 0.26; }
  if (V.levantar > 0) V.levantar = Math.max(0, V.levantar - dt);
  for (let i = V.fantasmas.length - 1; i >= 0; i--) { V.fantasmas[i].t += dt; if (V.fantasmas[i].t > V.fantasmas[i].dur) V.fantasmas.splice(i, 1); }
}
// Deslocamento visual do sprite (x, y) e altura do pulo (z, o sprite sobe e a sombra fica)
function deslocVis(u) {
  const V = vis(u); let x = 0, y = 0, z = 0;
  if (V.kbT < 0.4) { const t = V.kbT; x += V.kb * (t < 0.05 ? t / 0.05 : Math.exp(-(t - 0.05) * 11)); }
  if (V.esq > 0) { const k = 1 - V.esq / 0.34; x += V.esqDir * 7 * Math.sin(Math.min(1, k * 1.4) * Math.PI) ; }
  if (V.salto) { const k = Math.min(1, V.salto.t / V.salto.dur), e = 1 - Math.pow(1 - k, 2); x += V.salto.dx * (1 - e); y += V.salto.dy * (1 - e); z = Math.sin(k * Math.PI) * V.salto.alto; }
  if (Arena.pausa > 0 && V.kbT < 0.14) x += (Math.floor(Arena.t * 60) % 2 ? 1 : -1) * 0.7;   // treme durante o congelamento do golpe
  return [x, y, z];
}
function quadroDe(u) {
  const a = u.anim, b = Arena.b, V = vis(u);
  if (!u.vivo) { if (u.reviver > 0) return ['morte', 3]; const f = Math.min(3, Math.floor(a.morteT / 0.14)); return ['morte', f]; }
  if (b.fim && u.team === b.vencedor) { const k = Math.floor(Arena.t * 5 + a.fase) % 8; return ['vit', k < 1 ? 0 : k < 3 ? 1 : k < 5 ? 2 : 3]; }
  if (V.salto) { const k = V.salto.t / V.salto.dur; return ['pulo', k < 0.15 ? 0 : k < 0.5 ? 1 : k < 0.85 ? 2 : 3]; }
  if (u.st.stun > 0 && !(u.st.freeze > 0)) {   // atordoado: é jogado ao chão e fica deitado até passar
    if (a.empurrao > 0.3) return ['empurrao', 0];
    return V.caido < 0.12 ? ['morte', 1] : V.caido < 0.22 ? ['morte', 2] : ['morte', 3];
  }
  if (V.levantar > 0) return ['levantar', V.levantar > 0.13 ? 0 : 1];
  if (V.esq > 0) return ['esquiva', V.esq > 0.16 ? 0 : 1];
  if (a.empurrao > 0) return ['empurrao', a.empurrao > 0.18 ? 0 : 1];
  if (a.dash > 0) return ['dash', Math.floor(Arena.t * 12) % 2];
  if (a.atk > 0) { const f = 1 - a.atk / 0.32; return ['atk', f < 0.18 ? 0 : f < 0.34 ? 1 : f < 0.52 ? 2 : f < 0.76 ? 3 : 4]; }
  if (a.cast > 0) { const f = 1 - a.cast / 0.4; if (V.cura > 0) return ['cura', f < 0.25 ? 0 : f < 0.6 ? 1 : 2]; return ['cast', f < 0.2 ? 0 : f < 0.5 ? 1 : f < 0.8 ? 2 : 3]; }
  if (a.hurt > 0) return ['hurt', a.hurt > 0.08 ? 0 : 1];
  if (a.moveu) return u.agi >= 45 && !u.st.slow ? ['run', Math.floor(Arena.t * 10 + a.fase) % 4] : ['walk', Math.floor(Arena.t * 11 + a.fase) % 6];
  return ['idle', Math.floor(Arena.t * 4.5 + a.fase) % 6];
}
function desenharUnidade(c, u) {
  const set = spriteSet(u.look), [anim, i] = quadroDe(u), V = vis(u);
  const vs = set.vistas.lado;
  let fr = (u.vivo && u.anim.flash > 0 ? vs.brancos : vs.quadros)[anim][i];
  const virar = u.face < 0;
  if (u.vivo && u.st.freeze > 0) fr = tingir(fr, '#7fd6ff', 0.55);
  const [ox, oy, oz] = deslocVis(u);
  const x = gradeK(u.x + ox), y = gradeK(u.y + oy - oz);
  // imagens fantasma (esquiva, arrancada, passo sombrio)
  for (const g of V.fantasmas) {
    c.save(); c.globalAlpha = 0.45 * (1 - g.t / g.dur); c.translate(gradeK(g.x), gradeK(g.y)); if (g.face < 0) c.scale(-1, 1);
    c.drawImage(tingir(g.fr, g.cor, 0.85), -ANCORA.x - (g.fr.ox || 0), -ANCORA.y - (g.fr.oy || 0)); c.restore();
  }
  if (u.vivo && (V.esq > 0 || V.salto || u.anim.dash > 0) && Math.floor(Arena.t * 30) % 3 === 0 && V.fantasmas.length < 6)
    V.fantasmas.push({ x: u.x + ox, y: u.y + oy - oz, fr, face: u.face, t: 0, dur: 0.22, cor: V.esq > 0 ? '#cfe0ff' : (COR_SKILL[u.skill && u.skill.id] || '#ffffff') });
  if (u.chefe && u.vivo) desenharElipse(c, Math.round(u.x), Math.round(u.y) + 1, u.chefe === 'colosso' ? 17 : 12, u.chefe === 'colosso' ? 5 : 4, Math.floor(Arena.t * 6) % 2 ? '#ff5a2a' : '#ffb02a');
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
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, -2]]) c.drawImage(sil, -ANCORA.x - (fr.ox || 0) + dx, -ANCORA.y - (fr.oy || 0) + dy);
      c.globalAlpha = 1;
    }
    c.drawImage(fr, -ANCORA.x - (fr.ox || 0), -ANCORA.y - (fr.oy || 0));
  }
  c.restore();
  if (!u.vivo) return;
  const st = u.st;
  for (const d of st.dots) if (Math.random() < 0.7) { c.fillStyle = d.tipo === 'veneno' ? pick(['#8be05a', '#3d6129']) : d.tipo === 'sangrar' ? pick(['#ff5a6a', '#7d2219']) : pick(['#ffd23f', '#ff8c1a', '#ff5a1f']); c.fillRect(x + rint(-6, 6), y - rint(6, 34), 1, 2); }
  if (st.slow > 0 && Math.floor(Arena.t * 4 + u.anim.fase) % 3 === 0) { c.fillStyle = '#7fd6ff'; c.fillRect(x + rint(-6, 6), y - rint(2, 14), 1, 2); }
  if (st.stun > 0 || st.freeze > 0) {
    const deitado = st.freeze > 0 ? false : vis(u).caido > 0.2, cx = deitado ? x - u.face * 22 : x, cy = deitado ? y - 14 : y - 44;
    for (let k = 0; k < 3; k++) { const ang = Arena.t * 8 + (k * Math.PI * 2) / 3; c.fillStyle = st.freeze > 0 ? '#e8fbff' : '#ffe48a'; c.fillRect(Math.round(cx + Math.cos(ang) * 8), Math.round(cy + Math.sin(ang) * 2), 2, 2); }
  }
  if (st.taunt) { c.fillStyle = '#ff5a4f'; c.fillRect(x + 9, y - 44, 2, 5); c.fillRect(x + 9, y - 38, 2, 2); }
  if (st.debuffs.length && Math.floor(Arena.t * 3) % 2) { c.fillStyle = '#bd86f5'; c.fillRect(x - 11, y - 32, 1, 3); c.fillRect(x - 12, y - 30, 3, 1); }
  if (st.buffs.length && Math.floor(Arena.t * 3 + u.anim.fase) % 4 === 0) { c.fillStyle = '#ffe48a'; c.fillRect(x - 11, y - 34, 1, 1); c.fillRect(x - 12, y - 33, 3, 1); }
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

