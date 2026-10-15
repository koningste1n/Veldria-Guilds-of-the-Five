/* ============================ MOTOR DE BONECOS v3 (32×40) ============================
   Esqueleto 2D: cabeça, tronco, braços e pernas com cotovelo e joelho (cinemática inversa),
   mãos e botas desenhadas, capa, cabelo e saia com movimento secundário.
   Luz vem de cima à esquerda; cada cor tem 4 tons (brilho, base, sombra, escuro). */

function paletaBoneco(def, pele, cabelo, c1, c2) {
  const P = {};
  const pl = PELES[pele] || PELES[0];
  P.S = pl[0]; P.s = pl[1]; P.z = pl[2]; P.Q = escurecer(pl[2], 0.3); P.e = '#1a1020';
  [P.H, P.h, P.j] = rampa(def.cabeloCor || CABELOS[cabelo] || CABELOS[1]);
  [P.A, P.a, P.b] = rampa(def.cores.a);
  [P['1'], P['2'], P['3']] = rampa(def.cores.b || def.cores.a);
  [P['4'], P['5'], P['6']] = rampa(c1); P['7'] = c2;
  [P.o, P.M, P.n, P.N] = def.metal || METAL_PADRAO;
  P.W = '#c08a52'; P.w = '#94653a'; P.x = '#5e3d22';
  P.G = '#ffe9a8'; P.g = '#f0c24b'; P.y = '#b8862a';
  P.L = '#a8744a'; P.l = '#7a4f2e'; P.p = '#4e3020';
  [P.V, P.v, P.u] = rampa(def.cores.calca || '#4a3a5a');
  [P.F, P.f, P.k] = rampa(def.cores.bota || '#4a3326');
  P.C = clarear(def.cores.c, 0.5); P.c = def.cores.c; P.d = escurecer(def.cores.c, 0.35);
  P.O = '#f2ede0'; P.i = '#bdb3a0'; P.r = '#c0392b'; P.R = '#e8604c'; P.X = '#7d2219'; P.U = '#e8dcc4'; P.K = '#a8987c';
  return P;
}
// 4 tons de uma cor: brilho, base, sombra, escuro
const tons4 = (h) => [clarear(h, 0.3), h, escurecer(h, 0.3), escurecer(h, 0.52)];

/* ---- primitivas de desenho em camadas ---- */
function camada(interno = true) { return { px: new Map(), interno }; }
function ponto(L, x, y, cor) {
  if (!cor) return;
  x = Math.round(x) + OX; y = Math.round(y) + OY;
  if (x < 0 || y < 0 || x >= BW || y >= BH) return;
  L.px.set(y * BW + x, cor);
}
function carimbar(L, rows, x0, y0, P) {
  rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) { const ch = row[i]; if (ch !== '.' && ch !== ' ') ponto(L, x0 + i, y0 + j, P[ch]); } });
}
// Segmento grosso com luz de cima à esquerda: borda clara, miolo, borda escura (3 ou 4 tons)
function membro(L, x1, y1, x2, y2, esp, cores) {
  const r = esp / 2, dx = x2 - x1, dy = y2 - y1, l2 = dx * dx + dy * dy || 1;
  const c4 = cores.length > 3;
  for (let y = Math.floor(Math.min(y1, y2) - r - 1); y <= Math.ceil(Math.max(y1, y2) + r + 1); y++) {
    for (let x = Math.floor(Math.min(x1, x2) - r - 1); x <= Math.ceil(Math.max(x1, x2) + r + 1); x++) {
      const t = clamp(((x - x1) * dx + (y - y1) * dy) / l2, 0, 1);
      const qx = x1 + dx * t, qy = y1 + dy * t, ox = x - qx, oy = y - qy, d = Math.hypot(ox, oy);
      if (d > r) continue;
      const luz = -ox - oy;
      const borda = d > r - 1.05;
      let cor = cores[1];
      if (borda && luz > 0.35) cor = cores[0];
      else if (borda && luz < -0.35) cor = c4 && d > r - 0.6 ? cores[3] : cores[2];
      ponto(L, x, y, cor);
    }
  }
}
function disco(L, cx, cy, rad, cores) {
  for (let y = Math.floor(cy - rad - 1); y <= Math.ceil(cy + rad + 1); y++) for (let x = Math.floor(cx - rad - 1); x <= Math.ceil(cx + rad + 1); x++) {
    const ox = x - cx, oy = y - cy, d = Math.hypot(ox, oy);
    if (d > rad + 0.25) continue;
    const luz = -ox - oy;
    ponto(L, x, y, luz > rad * 0.5 ? cores[0] : luz < -rad * 0.6 ? cores[2] : cores[1]);
  }
}
const dirAng = (a) => { const r = (a * Math.PI) / 180; return [Math.cos(r), Math.sin(r)]; };
// Cinemática inversa de 2 segmentos: devolve a articulação do meio (cotovelo/joelho)
function articulacao(ax, ay, bx, by, l1, l2, lado) {
  let dx = bx - ax, dy = by - ay, d = Math.hypot(dx, dy) || 0.001;
  const max = l1 + l2 - 0.15;
  if (d > max) { dx *= max / d; dy *= max / d; d = max; }
  const a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, l1 * l1 - a * a));
  const mx = ax + (dx / d) * a, my = ay + (dy / d) * a;
  return [mx + (-dy / d) * h * lado, my + (dx / d) * h * lado, ax + dx, ay + dy];
}

/* ---- mãos e botas (desenhadas, não discos) ---- */
const MAO_FECHADA = ['.SS.', 'SSSs', 'sSss', '.ss.'];
const MAO_ABERTA = ['.SS.', 'SSSS', 'SSSs', '.ss.'];
function mao(L, x, y, cores, aberta = false) {
  const g = aberta ? MAO_ABERTA : MAO_FECHADA;
  const P = { S: cores[0], s: cores[2] };
  const rows = g.map((r) => r.replace(/S/g, 'B').replace(/s/g, 's'));
  const PP = { B: cores[1], s: cores[2] };
  rows.forEach((row, j) => { for (let i = 0; i < 4; i++) { const ch = row[i]; if (ch === '.') continue; ponto(L, x - 1.5 + i, y - 1.5 + j, (j === 0 || (j === 1 && i === 0)) ? cores[0] : PP[ch]); } });
}
function bota(L, fx, fy, cores, def, dir = 1) {
  if (def.perna === 'osso') { ponto(L, fx, fy - 1, cores[0]); ponto(L, fx, fy, cores[1]); ponto(L, fx + dir, fy, cores[1]); return; }
  // calcanhar atrás, biqueira na frente
  ponto(L, fx - dir, fy - 1, cores[0]); ponto(L, fx, fy - 1, cores[0]); ponto(L, fx + dir, fy - 1, cores[1]);
  ponto(L, fx - dir, fy, cores[1]); ponto(L, fx, fy, cores[1]); ponto(L, fx + dir, fy, cores[1]); ponto(L, fx + 2 * dir, fy, cores[1]);
  ponto(L, fx - dir, fy + 1, cores[2]); ponto(L, fx, fy + 1, cores[2]); ponto(L, fx + dir, fy + 1, cores[2]); ponto(L, fx + 2 * dir, fy + 1, cores[3] || cores[2]);
}

/* ---- armas procedurais (gx, gy = mão que segura) ---- */
function armaEspada(L, gx, gy, a, P, comp = 10, larg = 2.2) {
  const [dx, dy] = dirAng(a), nx = -dy, ny = dx;
  membro(L, gx - dx * 2.2, gy - dy * 2.2, gx, gy, 1.6, [P.L, P.l, P.p]);
  ponto(L, gx - dx * 3, gy - dy * 3, P.g);
  membro(L, gx + dx * 1.2 + nx * 2.4, gy + dy * 1.2 + ny * 2.4, gx + dx * 1.2 - nx * 2.4, gy + dy * 1.2 - ny * 2.4, 1.5, [P.G, P.g, P.y]);
  membro(L, gx + dx * 2.2, gy + dy * 2.2, gx + dx * (2.2 + comp), gy + dy * (2.2 + comp), larg, [P.o, P.M, P.n]);
  ponto(L, gx + dx * (2.8 + comp), gy + dy * (2.8 + comp), P.o);
}
function armaMachado(L, gx, gy, a, P, martelo = false) {
  const [dx, dy] = dirAng(a), nx = -dy, ny = dx;
  membro(L, gx - dx * 3.5, gy - dy * 3.5, gx + dx * 10, gy + dy * 10, 1.7, [P.W, P.w, P.x]);
  const s = nx >= 0 ? 1 : -1;
  if (martelo) {
    for (let i = -2; i <= 2; i += 0.5) for (let k = -3; k <= 3; k += 0.5) {
      const px = gx + dx * (9.5 + i) + nx * k, py = gy + dy * (9.5 + i) + ny * k;
      ponto(L, px, py, Math.abs(k) > 2.5 || Math.abs(i) > 1.6 ? P.N : (i < 0 && k * s < 0 ? P.o : P.M));
    }
    return;
  }
  for (let i = -3; i <= 3; i += 0.5) {
    const alcance = 5.2 - Math.abs(i) * 0.75;
    for (let k = 0.5; k <= alcance; k += 0.5) {
      const px = gx + dx * (8.5 + i) + nx * s * k, py = gy + dy * (8.5 + i) + ny * s * k;
      ponto(L, px, py, k > alcance - 0.9 ? P.o : i < 0 ? P.M : P.n);
    }
  }
}
function armaLanca(L, gx, gy, a, P) {
  const [dx, dy] = dirAng(a), nx = -dy, ny = dx;
  membro(L, gx - dx * 6, gy - dy * 6, gx + dx * 13, gy + dy * 13, 1.5, [P.W, P.w, P.x]);
  for (let i = 0; i <= 4; i += 0.5) { const w = (4 - i) * 0.45; for (let k = -w; k <= w; k += 0.5) ponto(L, gx + dx * (13.5 + i) + nx * k, gy + dy * (13.5 + i) + ny * k, k < -0.2 ? P.n : i > 3 ? P.o : P.M); }
  const s = nx >= 0 ? 1 : -1;
  for (let i = 0; i < 3; i++) for (let k = 1; k <= 3; k++) ponto(L, gx + dx * (11 - i) + nx * s * k, gy + dy * (11 - i) + ny * s * k, k === 3 ? P['6'] : i === 0 ? P['4'] : P['5']);
}
function armaArco(L, gx, gy, P, puxar) {
  const R = 8.5, cx = gx - R + 1, cy = gy;
  let ant = null;
  for (let t = -68; t <= 68; t += 8) {
    const r = (t * Math.PI) / 180, x = cx + R * Math.cos(r), y = cy + R * Math.sin(r);
    if (ant) membro(L, ant[0], ant[1], x, y, 1.9, [P.W, P.w, P.x]);
    ant = [x, y];
  }
  const topo = [cx + R * Math.cos(-1.19), cy + R * Math.sin(-1.19)], base = [cx + R * Math.cos(1.19), cy + R * Math.sin(1.19)];
  if (puxar) {
    const px = gx - 6.5, py = gy;
    membro(L, topo[0], topo[1], px, py, 1, [P.O, P.O, P.O]); membro(L, base[0], base[1], px, py, 1, [P.O, P.O, P.O]);
    membro(L, px, py, gx + 3, gy, 1, [P.w, P.w, P.w]); ponto(L, gx + 4, gy, P.o); ponto(L, gx + 3, gy - 1, P.n); ponto(L, gx + 3, gy + 1, P.n);
    ponto(L, px - 1, py - 1, P.r); ponto(L, px - 1, py + 1, P.r);
  } else membro(L, topo[0], topo[1], base[0], base[1], 1, [P.O, P.O, P.O]);
}
function armaCajado(L, gx, gy, a, P, orbe, brilho) {
  const [dx, dy] = dirAng(a), nx = -dy, ny = dx;
  membro(L, gx - dx * 7, gy - dy * 7, gx + dx * 9, gy + dy * 9, 1.6, orbe === 'cristal' ? [P.o, P.M, P.n] : orbe === 'sol' ? [P.G, P.g, P.y] : [P.W, P.w, P.x]);
  const ex = gx + dx * 11, ey = gy + dy * 11;
  if (orbe === 'cristal') {
    for (let i = -3; i <= 3; i += 0.5) { const w = (3 - Math.abs(i)) * 0.6; for (let k = -w; k <= w; k += 0.5) ponto(L, ex + dx * i + nx * k, ey + dy * i + ny * k, k < -0.3 ? P.c : i < 0 ? P.C : P.c); }
  } else if (orbe === 'caveira') {
    carimbar(L, ['.OOO.', 'OOOOO', 'OCOCO', '.OOO.', '.O.O.'], ex - 2, ey - 3, P);
  } else if (orbe === 'sol') {
    disco(L, ex, ey, 2.2, [P.G, P.g, P.y]);
    for (let k = 0; k < 8; k++) { const r = (k * Math.PI) / 4; ponto(L, ex + Math.cos(r) * 3.6, ey + Math.sin(r) * 3.6, k % 2 ? P.g : P.G); }
  } else if (orbe === 'raio') {
    disco(L, ex, ey, 2.2, [P.C, P.c, P.d]);
    ponto(L, ex + 1, ey - 3, P.C); ponto(L, ex, ey - 4, P.C); ponto(L, ex - 1, ey + 3, P.C); ponto(L, ex, ey + 4, P.c);
  } else {
    disco(L, ex, ey, 2.4, [P.C, P.c, P.d]); ponto(L, ex - 1, ey - 1, '#ffffff');
  }
  if (brilho) for (let k = 0; k < 8; k++) { const r = (k * Math.PI) / 4 + 0.39; ponto(L, ex + Math.cos(r) * 4.6, ey + Math.sin(r) * 4.6, k % 2 ? P.C : P.c); }
}
function armaAdaga(L, gx, gy, a, P) {
  const [dx, dy] = dirAng(a), nx = -dy, ny = dx;
  membro(L, gx - dx * 1.5, gy - dy * 1.5, gx, gy, 1.4, [P.L, P.l, P.p]);
  membro(L, gx + dx * 1 + nx * 1.5, gy + dy * 1 + ny * 1.5, gx + dx * 1 - nx * 1.5, gy + dy * 1 - ny * 1.5, 1.2, [P.G, P.g, P.y]);
  membro(L, gx + dx * 1.8, gy + dy * 1.8, gx + dx * 6, gy + dy * 6, 1.6, [P.o, P.M, P.n]);
  ponto(L, gx + dx * 6.6, gy + dy * 6.6, P.C);
}
function armaAlaude(L, gx, gy, a, P) {
  const [dx, dy] = dirAng(a);
  const bx = gx - 2.5, by = gy - 1;
  membro(L, bx, by, bx + dx * 11, by + dy * 11, 1.5, [P.W, P.w, P.x]);
  membro(L, bx + dx * 11, by + dy * 11, bx + dx * 13, by + dy * 13, 2.2, [P.w, P.x, P.x]);
  for (let y = -4; y <= 4; y++) for (let x = -5; x <= 5; x++) {
    if ((x * x) / 25 + (y * y) / 14 > 1.05) continue;
    ponto(L, bx + x, by + y, x + y < -4 ? P.W : x + y > 4 ? P.x : P.w);
  }
  ponto(L, bx + 1, by - 1, P.p); ponto(L, bx + 2, by - 1, P.p); ponto(L, bx + 1, by, P.p); ponto(L, bx + 2, by, P.p);
  ponto(L, bx - 2, by + 2, P.G); ponto(L, bx - 1, by + 2, P.G);
}
function desenharArma(L, tipo, gx, gy, a, P, def, extra) {
  switch (tipo) {
    case 'espada': armaEspada(L, gx, gy, a, P); break;
    case 'espadao': armaEspada(L, gx, gy, a, P, 14, 3); break;
    case 'machado': armaMachado(L, gx, gy, a, P); break;
    case 'martelo': armaMachado(L, gx, gy, a, P, true); break;
    case 'lanca': armaLanca(L, gx, gy, a, P); break;
    case 'arco': armaArco(L, gx, gy, P, extra.puxar); break;
    case 'cajado': armaCajado(L, gx, gy, a, P, def.orbe, extra.brilho); break;
    case 'adagas': armaAdaga(L, gx, gy, a, P); break;
    case 'alaude': armaAlaude(L, gx, gy, a, P); break;
  }
}


/* ---- Colosso de Basalto: tronco e cabeça próprios, com núcleo de lava ---- */
const TRONCO_COLOSSO = [
  '......nnnMMMMnnn......', '....nnMMMoooMMMMnn....', '...nMMMoooMMMMMMMMn...', '..nMMooMMMMMMMMMMMMn..',
  '.nMMoMMMMMnnMMMMMMMMn.', '.nMMMMMMMndCdnMMMMMMnN', 'nMMMMMMMndCCCdnMMMMnNN', 'nMMoMMMMncCGCcnMMMMnNN',
  'nMMMMMMMndCCCdnMMMnnNN', 'nMMMMcMMMndCdnMMMMnNNN', 'nnMMMMcMMMnnMMMcMMnNN.', '.nMMMMMcMMMMMMcMMnnNN.',
  '.nnMMMMMMMMMMMMMnnNNN.', '..NnnMMMMMMMMMnnnNNN..', '...NNnnnMMMnnnnNNN....', '.....NNNnnnnnNNN......', '.......NNNNNNNN.......',
];
const CABECA_COLOSSO = ['...NnnnnN...', '..NnMoMMnN..', '.NnMoMMMMnN.', '.NMMMMMMMMN.', '.NnCCnnCCnN.', '.NnMMMMMMnN.', '.NnnMddMnnN.', '..NnncCnnN..', '...NNNNNN...'];

/* ---- poses por arma: m = mão da frente relativa ao ombro, a = ângulo da arma ----
   atk tem 5 quadros: antecipação, antecipação 2, golpe, continuação, recuperação */
const POSES = {
  espada: { idle: { m: [1.5, 8.5], a: -55 }, atk: [{ m: [-3, 2], a: -150 }, { m: [-3.5, 0], a: -165 }, { m: [7.5, 4], a: 15 }, { m: [6.5, 7], a: -5 }, { m: [3, 8], a: -35 }], cast: { m: [1, -3], a: -95 }, vit: { m: [0, -6], a: -100 } },
  espadao: { idle: { m: [1.5, 8.5], a: -65 }, atk: [{ m: [-3.5, 1], a: -155 }, { m: [-4, -1], a: -170 }, { m: [8, 5], a: 20 }, { m: [7, 8], a: 0 }, { m: [3, 8], a: -30 }], cast: { m: [0, -3], a: -100 }, vit: { m: [0, -6], a: -100 }, duas: true },
  machado: { idle: { m: [1.5, 8.5], a: -70 }, atk: [{ m: [-3.5, 1], a: -160 }, { m: [-4, -1.5], a: -175 }, { m: [8, 5.5], a: 25 }, { m: [7, 8], a: 5 }, { m: [3, 8], a: -35 }], cast: { m: [0, -3], a: -100 }, vit: { m: [0, -6], a: -105 }, duas: true },
  martelo: { idle: { m: [1.5, 8.5], a: -70 }, atk: [{ m: [-3.5, 1], a: -160 }, { m: [-4, -1.5], a: -175 }, { m: [8, 5.5], a: 25 }, { m: [7, 8], a: 5 }, { m: [3, 8], a: -35 }], cast: { m: [0, -3], a: -100 }, vit: { m: [0, -6], a: -105 }, duas: true },
  lanca: { idle: { m: [1.5, 8.5], a: -88 }, atk: [{ m: [-2.5, 5], a: -6 }, { m: [-3.5, 5], a: -4 }, { m: [8.5, 5], a: -6 }, { m: [7, 5.5], a: -10 }, { m: [3, 7], a: -35 }], cast: { m: [1, -2], a: -90 }, vit: { m: [1, -5], a: -90 } },
  arco: { idle: { m: [3.5, 6.5], a: -90 }, atk: [{ m: [3.5, 5.5], a: -90, puxar: 1 }, { m: [3.5, 5.5], a: -90, puxar: 1 }, { m: [5, 5.5], a: -90 }, { m: [4.5, 6], a: -90 }, { m: [3.5, 6.5], a: -90 }], cast: { m: [3.5, 1], a: -90, puxar: 1 }, vit: { m: [2, -3], a: -90 } },
  cajado: { idle: { m: [3.5, 8], a: -76 }, atk: [{ m: [0.5, 2], a: -110 }, { m: [-1, 0.5], a: -120 }, { m: [6.5, 3.5], a: -25, brilho: 1 }, { m: [5.5, 5.5], a: -40, brilho: 1 }, { m: [3.5, 7.5], a: -60 }], cast: { m: [1, -3.5], a: -90, brilho: 1 }, vit: { m: [0, -5], a: -90, brilho: 1 } },
  adagas: { idle: { m: [1.5, 8.5], a: 100 }, atk: [{ m: [-2, 3.5], a: -140 }, { m: [-3, 2], a: -150 }, { m: [7.5, 4.5], a: 5 }, { m: [6, 6], a: 60 }, { m: [3, 8], a: 80 }], cast: { m: [1, -1], a: -80 }, vit: { m: [0, -5], a: -90 }, tras: true },
  alaude: { idle: { m: [2, 7.5], a: -38 }, atk: [{ m: [0.5, 7], a: -48 }, { m: [0.5, 6.5], a: -50 }, { m: [2.5, 6], a: -28 }, { m: [1.5, 6.5], a: -35 }, { m: [1, 7.5], a: -40 }], cast: { m: [0.5, 5], a: -55 }, vit: { m: [0, 1], a: -60 } },
  punho: { idle: { m: [3, 5.5], a: 0 }, atk: [{ m: [-1.5, 5], a: 0 }, { m: [-2.5, 4.5], a: 0 }, { m: [8.5, 3.5], a: 0 }, { m: [6, 4.5], a: 0 }, { m: [4, 5.5], a: 0 }], cast: { m: [2, -3], a: 0 }, vit: { m: [1, -6], a: 0 } },
};
// Quadros de cada animação. by/bx = corpo · pf/pt = pés [dx, levanta] · dm/dt = ajuste das mãos ·
// capa = balanço (-: para trás) · hx/hy = cabeça · lean = inclinação do tronco · pernaDobra = joelhos
function quadros(anim) {
  switch (anim) {
    case 'idle': return [
      { by: 0 }, { by: 0, dmy: 0.5, capa: 0.3 }, { by: 1, dmy: 1, capa: 0.6 }, { by: 1, dmy: 1, hy: 0.5, capa: 0.4 }, { by: 1, dmy: 0.5, capa: 0 }, { by: 0, capa: -0.3 }];
    case 'walk': return [
      { by: 0, pf: [3, 0], pt: [-3, 0], dm: [-2, 0], dt: [2, 0], saia: 1, capa: -1.5 },
      { by: -1, pf: [1.5, 1.5], pt: [-1.5, 0], dm: [-1, 0], dt: [1, 0], saia: 0.5, capa: -2 },
      { by: -1, pf: [-0.5, 2], pt: [0.5, 0], dm: [0, 0], dt: [0, 0], saia: 0, capa: -1.5 },
      { by: 0, pf: [-3, 0], pt: [3, 0], dm: [2, 0], dt: [-2, 0], saia: -1, capa: -1 },
      { by: -1, pf: [-1.5, 0], pt: [1.5, 1.5], dm: [1, 0], dt: [-1, 0], saia: -0.5, capa: -1.5 },
      { by: -1, pf: [0.5, 0], pt: [-0.5, 2], dm: [0, 0], dt: [0, 0], saia: 0, capa: -2 }];
    case 'run': return [
      { by: 0, lean: 2, pf: [5, 0], pt: [-5, 1], dm: [-3, -1], dt: [3, -1], saia: 1.5, capa: -4 },
      { by: -2, lean: 2, pf: [1, 3], pt: [-2, 2], dm: [-1, -2], dt: [1, -2], saia: 0.5, capa: -4.5 },
      { by: 0, lean: 2, pf: [-5, 1], pt: [5, 0], dm: [3, -1], dt: [-3, -1], saia: -1.5, capa: -4 },
      { by: -2, lean: 2, pf: [-2, 2], pt: [1, 3], dm: [1, -2], dt: [-1, -2], saia: -0.5, capa: -4.5 }];
    case 'atk': return [
      { bx: -1, atk: 0, pf: [-1, 0], capa: 1 }, { bx: -2, atk: 1, pf: [-1.5, 0], hx: -1, capa: 2 },
      { bx: 3, atk: 2, pf: [3, 0], lean: 2, hx: 1, capa: -3 }, { bx: 2, atk: 3, pf: [2, 0], lean: 1, capa: -2 }, { bx: 1, atk: 4, pf: [1, 0], capa: -0.5 }];
    case 'cast': return [
      { by: 0, cast: true, dt: [0, -5], capa: 0.5 }, { by: -1, cast: true, dt: [0, -8], hy: -0.5, capa: 1 },
      { by: -1, cast: true, dt: [0, -8.5], hy: -0.5, capa: 1.5 }, { by: 0, cast: true, dt: [1, -6], capa: 0.5 }];
    case 'hurt': return [{ bx: -2, hx: -1, hy: -0.5, dm: [-1, -1], da: 15, dt: [-1, -1], lean: -1, capa: 3 }, { bx: -1, hx: -0.5, dm: [-0.5, -0.5], da: 8, lean: -0.5, capa: 1.5 }];
    case 'empurrao': return [{ bx: -3, by: -1, hx: -1.5, hy: -1, pf: [4, 1], pt: [2, 2], dm: [-3, -4], dt: [-2, -4], da: 40, lean: -3, capa: 4 }, { bx: -2, hx: -1, pf: [3, 0], pt: [1, 1], dm: [-2, -2], dt: [-1, -2], da: 25, lean: -2, capa: 3 }];
    case 'dash': return [{ bx: 3, lean: 4, pf: [3, 1], pt: [-6, 2], dm: [-3, -2], dt: [-4, -1], capa: -6, hx: 1 }, { bx: 2, lean: 3, pf: [4, 0], pt: [-4, 1], dm: [-2, -1], dt: [-3, 0], capa: -5, hx: 1 }];
    case 'morte': return [
      { bx: -2, hx: -1.5, hy: -1, dm: [-2, -3], dt: [-2, -3], da: 30, lean: -2, capa: 3 },
      { by: 4, bx: -1, hx: -1, hy: 1, pf: [3, 1], pt: [-1, 2], dm: [1, 2], dt: [-1, 3], da: 50, lean: 1, capa: 2, joelhos: true },
      { by: 7, bx: 0, hx: 1, hy: 2.5, pf: [4, 3], pt: [-2, 3], dm: [3, 6], dt: [0, 6], da: 75, lean: 3, capa: 1, joelhos: true },
      { deitado: true }];
    case 'vit': return [
      { by: 2, vit: true, dt: [0, 0], dm: [0, 0], pf: [0, 0], pt: [0, 0], joelhos: true, capa: 0.5 },
      { by: -5, vit: true, dt: [0, -8], pf: [1, 3], pt: [-1, 2], capa: 3 },
      { by: -7, vit: true, dt: [0, -9], pf: [2, 3], pt: [-2, 3], hy: -0.5, capa: 2 },
      { by: -1, vit: true, dt: [0, -8], capa: -1 }];
  }
  return [{}];
}
const ANIMS = ['idle', 'walk', 'run', 'atk', 'cast', 'hurt', 'empurrao', 'dash', 'morte', 'vit'];
const QUADROS_POR_ANIM = Object.fromEntries(ANIMS.map((a) => [a, quadros(a).length]));

/* ---- montagem de um quadro ---- */
function montarQuadro(def, P, f) {
  if (f.deitado) return montarDeitado(def, P);
  const camadas = [];
  const by = f.by || 0, bx = f.bx || 0, lean = f.lean || 0;
  const tipoArma = def.golem ? 'punho' : def.arma;
  const poses = POSES[tipoArma] || POSES.espada;
  let pose = poses.idle;
  if (f.atk !== undefined) pose = poses.atk[f.atk];
  else if (f.cast) pose = poses.cast;
  else if (f.vit) pose = poses.vit;
  const G = def.golem, k = def.grande ? 1.55 : 1;
  const S = (p) => (k === 1 ? p : [16 + (p[0] - 16) * k, 38 + (p[1] - 38) * k]);
  // esqueleto (facing direita): ombros, quadris e pés
  const ombroF = S(G ? [22 + bx + lean, 20 + by] : [19.5 + bx + lean, 18 + by]);
  const ombroT = S(G ? [10 + bx + lean, 20 + by] : [12.5 + bx + lean, 18 + by]);
  const quadF = S(G ? [19 + bx, 28 + by] : [17.5 + bx, 26 + by]), quadT = S(G ? [13 + bx, 28 + by] : [14.5 + bx, 26 + by]);
  const pf = f.pf || [0, 0], pt = f.pt || [0, 0];
  const peF = S([(G ? 19 : 18) + pf[0] + bx * 0.4, 36 - pf[1]]), peT = S([(G ? 13 : 14) + pt[0] + bx * 0.4, 36 - pt[1]]);
  const dm = f.dm || [0, 0], dmy = f.dmy || 0;
  const maoF = [ombroF[0] + (pose.m[0] + dm[0]) * k, ombroF[1] + (pose.m[1] + dm[1] + dmy) * k];
  const ang = pose.a + (f.da || 0);
  const [adx, ady] = dirAng(ang);
  const dt = f.dt || [0, 0];
  let maoT = [ombroT[0] - 1 + dt[0], ombroT[1] + 8 + dt[1] + dmy];
  if (poses.duas && !f.vit && !f.cast && f.joelhos === undefined) maoT = [maoF[0] - adx * 3, maoF[1] - ady * 3];
  if (tipoArma === 'punho') maoT = [ombroT[0] + (2 + dt[0] + (f.atk === 2 ? -1 : 0)) * k, ombroT[1] + (6 + dt[1] + dmy) * k];
  if (def.escudo) maoT = [ombroT[0] + 2 + (f.atk === 2 ? 1 : 0) + dt[0] * 0.3, ombroT[1] + 7 + (dt[1] < 0 ? -2 : 0) + dmy];

  const corManga = def.golem ? [P.M, P.n, P.N] : def.manga === 'metal' ? [P.o, P.M, P.n, P.N] : def.manga === 'pele' ? [P.S, P.s, P.z, P.Q] : def.manga === 'osso' ? [P.O, P.O, P.i] : [P.A, P.a, P.b, escurecer(P.b, 0.3)];
  const corMangaT = corManga.map((c) => escurecer(c, 0.18));
  const corMao = def.golem ? [P.M, P.n, P.N] : def.mao === 'metal' ? [P.o, P.M, P.n] : def.mao === 'osso' ? [P.O, P.O, P.i] : def.mao === 'faixa' ? [P.O, P.i, P.i] : [P.S, P.s, P.z];
  const espBraco = def.golem ? 4.6 * k : def.mangaGrossa ? 3.4 : def.manga === 'osso' ? 2 : 3;
  const espPerna = def.golem ? 4.4 * k : def.perna === 'osso' ? 2.2 : 3.6;
  const corPerna = def.perna === 'osso' ? [P.O, P.O, P.i] : def.golem ? [P.M, P.n, P.N] : [P.V, P.v, P.u, escurecer(P.u, 0.3)];
  const corBota = def.perna === 'osso' ? [P.O, P.i, P.i] : def.golem ? [P.n, P.N, P.N] : [P.F, P.f, P.k, escurecer(P.k, 0.3)];
  const lBraco = (G ? 5 : 4.9) * k, lPerna = (G ? 4 : 5.5) * k;
  const capa = f.capa || 0;

  // capa (atrás de tudo), com balanço que aumenta para baixo
  if (def.capa) {
    const L = camada(false);
    const topo = 17 + by, alt = 15;
    for (let y = 0; y <= alt; y++) {
      const t = y / alt, sway = (capa > 0 ? capa * 0.5 : capa) * t * t * 1.2 + lean * 0.4 * t;
      const xa = 12.5 + bx - t * 4 + sway, xb = 18 + bx - t * 2 + sway * 0.6;
      for (let x = Math.floor(xa); x <= Math.ceil(xb); x++) {
        const borda = x < xa + 1 ? 0 : x > xb - 1.2 ? 2 : 1;
        ponto(L, x, topo + y, y > alt - 1.5 ? P['6'] : [P['4'], P['5'], P['6']][borda]);
      }
    }
    camadas.push(L);
  }
  if (def.aljava) { const L = camada(false); carimbar(L, ALJAVA, 8 + bx, 15 + by, P); camadas.push(L); }
  if (def.cabeloLongo) {
    const L = camada(false);
    CABELO_LONGO.rows.forEach((row, j) => { const t = j / CABELO_LONGO.rows.length, off = Math.round(capa * t * t * 0.9); for (let i = 0; i < row.length; i++) if (row[i] !== '.') ponto(L, 10 + bx + (f.hx || 0) + i + off, 4 + by + CABELO_LONGO.y + j + (f.hy || 0), P[row[i]]); });
    camadas.push(L);
  }
  // braço de trás (ombro → cotovelo → mão)
  { const L = camada(true);
    const [cx, cy, hx2, hy2] = articulacao(ombroT[0], ombroT[1], maoT[0], maoT[1], lBraco, lBraco, 1);
    membro(L, ombroT[0], ombroT[1], cx, cy, espBraco, corMangaT); membro(L, cx, cy, hx2, hy2, espBraco * 0.9, corMangaT);
    if (def.golem) disco(L, hx2, hy2, 2.2 * k, corMao.map((c) => escurecer(c, 0.12))); else mao(L, hx2, hy2, corMao.map((c) => escurecer(c, 0.12)), f.cast || f.vit);
    if (POSES[tipoArma] && POSES[tipoArma].tras) armaAdaga(L, hx2, hy2, (f.atk === 2 ? 160 : 100), P);
    camadas.push(L); }
  // pernas (quadril → joelho → pé), joelho dobra para a frente
  for (const [q, pe, cores, cb, tras] of [[quadT, peT, corPerna.map((c) => escurecer(c, 0.15)), corBota.map((c) => escurecer(c, 0.15)), true], [quadF, peF, corPerna, corBota, false]]) {
    const L = camada(true);
    const alvoY = pe[1] - 1.5 * k;
    // golens têm pernas retas e grossas (sem joelho visível)
    const [jx, jy, px2, py2] = G ? [(q[0] + pe[0]) / 2, (q[1] + alvoY) / 2, pe[0], alvoY] : articulacao(q[0], q[1], pe[0], alvoY, lPerna, lPerna, -1);
    membro(L, q[0], q[1], jx, jy, espPerna, cores); membro(L, jx, jy, px2, py2, espPerna * 0.9, cores);
    if (k > 1) bota(L, px2 - 2, py2 + 1.5, cb, def);
    bota(L, px2, py2 + 1.5, cb, def);
    camadas.push(L);
  }
  // tronco
  { const L = camada(true);
    if (def.golem) { const [tx, ty] = S([9 + bx + lean, 16 + by]); carimbar(L, k > 1 ? TRONCO_COLOSSO : TRONCO_GOLEM, tx, ty, P); }
    else {
      const T = TRONCOS[def.torso] || TRONCOS.tunica;
      // inclinação: linhas de cima deslocam mais que as de baixo
      T.forEach((row, j) => { const off = Math.round(lean * (1 - j / 10)); for (let i = 0; i < row.length; i++) if (row[i] !== '.') ponto(L, 11 + bx + i + off, 16 + by + j, P[row[i]]); });
      if (def.ombreiras) carimbar(L, OMBREIRAS.rows, 11 + bx + lean + OMBREIRAS.x, 16 + by + OMBREIRAS.y, P);
      if (def.colar) carimbar(L, COLAR.rows, 11 + bx + lean + COLAR.x, 16 + by + COLAR.y, P);
      // cinto escuro na base do tronco (peso visual)
      for (let i = 1; i < 9; i++) ponto(L, 11 + bx + i, 25.5 + by, P['6']);
    }
    camadas.push(L); }
  if (def.saia) {
    const L = camada(true), sd = (f.saia || 0) + capa * 0.4;
    SAIA.forEach((row, j) => { const off = j >= 2 ? Math.round(sd * (j / 9)) : 0; for (let i = 0; i < row.length; i++) if (row[i] !== '.') ponto(L, 10 + bx + i + off, 26 + by + j, P[row[i]]); });
    camadas.push(L);
  }
  // cabeça
  { const L = camada(true), hx = 10 + bx + lean + (f.hx || 0), hy = 4 + by + (f.hy || 0);
    if (def.golem) { const [gx, gy] = S([12 + bx + lean + (f.hx || 0), 9 + by + (f.hy || 0)]); carimbar(L, k > 1 ? CABECA_COLOSSO : CABECA_GOLEM, gx, gy, P); }
    else {
      carimbar(L, CABECAS[def.cabeca || 'normal'], hx, hy, P);
      if (def.barba) carimbar(L, BARBA.rows, hx + BARBA.x, hy + BARBA.y, P);
      if (def.mascara) carimbar(L, MASCARA.rows, hx + MASCARA.x, hy + MASCARA.y, P);
      if (def.capacete) { const c = CHAPEUS[def.capacete]; carimbar(L, c.rows, hx + c.x, hy + c.y, P); }
      if (def.olho) carimbar(L, OLHO_BRILHO.rows, hx + OLHO_BRILHO.x, hy + OLHO_BRILHO.y, P);
      if (def.faixa) carimbar(L, ['.55555555555', '6655555555..', '56..........', '6...........'], hx, hy + 3, P);
      if (def.aureola) carimbar(L, AUREOLA.rows, hx + AUREOLA.x, hy + AUREOLA.y + (f.by === 1 ? -1 : 0), P);
    }
    camadas.push(L); }
  if (def.cachecol) { const L = camada(true); CACHECOL.rows.forEach((row, j) => { const off = Math.round(capa * j * 0.3); for (let i = 0; i < row.length; i++) if (row[i] !== '.') ponto(L, CACHECOL.x + bx + lean + i + off, CACHECOL.y + 3 + by + j, P[row[i]]); }); camadas.push(L); }
  if (def.escudo) { const L = camada(true); carimbar(L, ESCUDO_ARMA, maoT[0] - 7, maoT[1] - 8, P); camadas.push(L); }
  // arma + braço da frente
  const camArma = camada(true);
  if (tipoArma !== 'punho') desenharArma(camArma, tipoArma, maoF[0], maoF[1], ang, P, def, pose);
  const camBraco = camada(true);
  { const [cx, cy, hx2, hy2] = articulacao(ombroF[0], ombroF[1], maoF[0], maoF[1], lBraco, lBraco, 1);
    membro(camBraco, ombroF[0], ombroF[1], cx, cy, espBraco, corManga); membro(camBraco, cx, cy, hx2, hy2, espBraco * 0.9, corManga);
    if (def.golem) disco(camBraco, hx2, hy2, 2.6 * k, corMao); else mao(camBraco, hx2, hy2, corMao, tipoArma === 'punho' ? false : f.cast || f.vit);
  }
  if (tipoArma === 'alaude') { camadas.push(camBraco, camArma); const Lm = camada(false); mao(Lm, maoF[0] + 1, maoF[1] - 1, corMao); camadas.push(Lm); }
  else camadas.push(camArma, camBraco);
  return camadas;
}
// Quadro "caído": pose relaxada deitada de costas (gira 90° no achatamento)
function montarDeitado(def, P) {
  const cam = montarQuadro(def, P, { pf: [2, 0], pt: [-1, 0], dm: [-1, -2], dt: [-1, -2], da: 60, hx: -1 });
  cam.deitado = true;
  return cam;
}

/* ---- achatamento: contorno seletivo entre partes + contorno externo ---- */
function mapaDeCores(camadas) {
  const N = BW * BH, cor = new Array(N).fill(null), dono = new Int16Array(N).fill(-1);
  camadas.forEach((L, idx) => {
    for (const [k, c] of L.px) { cor[k] = c; dono[k] = idx; }
    if (!L.interno) return;
    for (const [k] of L.px) {
      const x = k % BW, y = (k / BW) | 0;
      for (const [vx, vy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = x + vx, ny = y + vy; if (nx < 0 || ny < 0 || nx >= BW || ny >= BH) continue;
        const nk = ny * BW + nx;
        if (dono[nk] >= 0 && dono[nk] !== idx && !L.px.has(nk)) cor[nk] = CONT_INT;
      }
    }
  });
  return cor;
}
const DEITADO_OX = 26, DEITADO_OY = 8;   // deslocamento do canvas "caído" (o corpo se estende para trás)
function achatar(camadas, branco) {
  let cor = mapaDeCores(camadas), W = BW, H = BH, ox = 0, oy = 0;
  if (camadas.espelhar) {   // vista de costas: espelha em volta do eixo do corpo (x = 16 nas coordenadas do boneco)
    const out = new Array(BW * BH).fill(null);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) { const c = cor[y * BW + x]; if (!c) continue; const nx = 2 * OX + 31 - x; if (nx >= 0 && nx < BW) out[y * BW + nx] = c; }
    cor = out;
  }
  if (camadas.deitado) {
    // gira 90° em volta dos pés: a cabeça vai para trás (esquerda), o corpo fica 8 px acima do chão
    const px = OX + 16, py = OY + 38, W2 = BW + DEITADO_OX, H2 = BH;
    const out = new Array(W2 * H2).fill(null);
    for (let y = 0; y < BH; y++) for (let x = 0; x < BW; x++) {
      const c = cor[y * BW + x]; if (!c) continue;
      const nx = px + (y - py) + DEITADO_OX, ny = py - DEITADO_OY - (x - px);
      if (nx >= 0 && ny >= 0 && nx < W2 && ny < H2) out[ny * W2 + nx] = c;
    }
    cor = out; W = W2; H = H2; ox = DEITADO_OX;
  }
  const cv = document.createElement('canvas'); cv.width = W + 2; cv.height = H + 2;
  cv.ox = ox; cv.oy = oy;
  const c = cv.getContext('2d'), img = c.createImageData(cv.width, cv.height), d = img.data;
  const pinta = (x, y, hex) => { const [r, g, b] = hexRgb(hex); const i = ((y + 1) * cv.width + (x + 1)) * 4; d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; };
  for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
    const dentro = x >= 0 && y >= 0 && x < W && y < H;
    const k = y * W + x;
    if (dentro && cor[k]) { pinta(x, y, branco ? (cor[k] === CONT_INT ? '#ffe8f0' : '#ffffff') : cor[k]); continue; }
    const viz = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([a, b]) => a >= 0 && b >= 0 && a < W && b < H && cor[b * W + a]);
    if (viz) pinta(x, y, CONTORNO);
  }
  c.putImageData(img, 0, 0);
  return cv;
}

/* ---- conjunto de sprites de um "look": tipo|pele|cabelo|cor1|cor2 ---- */
function lookDe(m, cor1, cor2) { return `${m.visual || m.classe}|${m.pele ?? 0}|${m.cabelo ?? 1}|${cor1}|${cor2}`; }
const cacheSprites = new Map();
// Versão branca de um quadro (piscar ao levar dano): mantém o contorno, clareia o resto
function brancoDe(cv) {
  const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; t.ox = cv.ox; t.oy = cv.oy;
  const c = t.getContext('2d'); c.drawImage(cv, 0, 0);
  const img = c.getImageData(0, 0, t.width, t.height), d = img.data;
  const [cr, cg, cb] = hexRgb(CONTORNO), [ir, ig, ib] = hexRgb(CONT_INT);
  for (let i = 0; i < d.length; i += 4) {
    if (!d[i + 3] || (d[i] === cr && d[i + 1] === cg && d[i + 2] === cb)) continue;
    if (d[i] === ir && d[i + 1] === ig && d[i + 2] === ib) { d[i] = 255; d[i + 1] = 232; d[i + 2] = 240; }
    else { d[i] = 255; d[i + 1] = 255; d[i + 2] = 255; }
  }
  c.putImageData(img, 0, 0);
  return t;
}
// Os quadros são montados sob demanda: a interface só precisa do "idle"; a arena pré-carrega tudo
// Limite de memória: guarda os conjuntos de quadros dos ~20 visuais usados mais recentemente
// (os que estão em luta nunca saem). Cada visual completo ocupa ~3 MB de canvas.
const LIMITE_SPRITES = 20;
function emUsoNaArena(look) {
  const b = typeof Arena !== 'undefined' && Arena.b;
  return !!b && b.units.some((u) => u.look === look || (u.looks && Object.values(u.looks).includes(look)));
}
function spriteSet(look) {
  let set = cacheSprites.get(look);
  if (set) { if (cacheSprites.size > LIMITE_SPRITES / 2) { cacheSprites.delete(look); cacheSprites.set(look, set); } return set; }
  if (cacheSprites.size >= LIMITE_SPRITES) for (const k of [...cacheSprites.keys()]) { if (cacheSprites.size < LIMITE_SPRITES) break; if (!emUsoNaArena(k)) cacheSprites.delete(k); }
  const [tipo, pele, cabelo, c1, c2] = look.split('|');
  const def = BONECOS[tipo] || BONECOS.guardiao;
  const P = paletaBoneco(def, +pele, +cabelo, c1, c2);
  set = { pal: P, vistas: {} };
  for (const v of VISTAS) {
    const q = {}, br = {}, vs = { quadros: {}, brancos: {} };
    const montar = (anim) => (v === 'lado' ? quadros(anim).map((f) => achatar(montarQuadro(def, P, f), false)) : quadrosVista(anim).map((f) => achatar(montarQuadroVista(def, P, f, v === 'costas'), false)));
    for (const anim of ANIMS) {
      Object.defineProperty(vs.quadros, anim, { enumerable: true, get: () => q[anim] || (q[anim] = montar(anim)) });
      Object.defineProperty(vs.brancos, anim, { enumerable: true, get: () => br[anim] || (br[anim] = vs.quadros[anim].map(brancoDe)) });
    }
    set.vistas[v] = vs;
  }
  set.quadros = set.vistas.lado.quadros; set.brancos = set.vistas.lado.brancos;
  Object.defineProperty(set, 'idle0', { enumerable: true, get: () => set.quadros.idle[0] });
  cacheSprites.set(look, set);
  return set;
}
const VISTAS = ['lado', 'frente', 'costas'];
// Pré-carrega o que aparece logo no início da luta; o resto é montado na primeira vez que for usado
function precarregar(look) {
  const s = spriteSet(look);
  for (const a of ['idle', 'walk', 'run', 'atk', 'hurt']) { s.vistas.lado.quadros[a]; s.vistas.lado.brancos[a]; }
  for (const v of ['frente', 'costas']) for (const a of ['idle', 'walk']) s.vistas[v].quadros[a];
  return s;
}
// Retrato recortado (interface)
const cacheRetrato = new Map();
function retrato(look, i = 0, vista = 'lado') {
  const key = look + '#' + i + vista;
  if (cacheRetrato.has(key)) return cacheRetrato.get(key);
  const src = spriteSet(look).vistas[vista].quadros.idle[i % QUADROS_POR_ANIM.idle];
  const cv = document.createElement('canvas'); cv.width = RETRATO.w; cv.height = RETRATO.h;
  cv.getContext('2d').drawImage(src, RETRATO.x, RETRATO.y, RETRATO.w, RETRATO.h, 0, 0, RETRATO.w, RETRATO.h);
  cacheRetrato.set(key, cv);
  if (cacheRetrato.size > 900) { let n = 300; for (const k of cacheRetrato.keys()) { cacheRetrato.delete(k); if (--n <= 0) break; } }
  return cv;
}
const cacheTinta = new WeakMap();   // chave = canvas: some junto com o quadro
function tingir(cv, cor, alfa) {
  let mp = cacheTinta.get(cv);
  if (!mp) { mp = {}; cacheTinta.set(cv, mp); }
  if (mp[cor]) return mp[cor];
  const t = document.createElement('canvas'); t.width = cv.width; t.height = cv.height; t.ox = cv.ox; t.oy = cv.oy;
  const c = t.getContext('2d'); c.drawImage(cv, 0, 0);
  c.globalCompositeOperation = 'source-atop'; c.globalAlpha = alfa; c.fillStyle = cor; c.fillRect(0, 0, t.width, t.height);
  mp[cor] = t; return t;
}

/* Ícones da Fase 2 (12×12) */
Object.assign(ICONES, {
  forja: ['...g..y..g..', '..y..g...y..', '..nnnnnnnn..', '.nmmmmmmmmnn', '..nnmmmmnn..', '....nmmn....', '....nmmn....', '...nnmmnn...', '..nnnnnnnn..', '............'],
  relogio: ['..wwwwwwww..', '...gggggg...', '...gyyyyg...', '....gyyg....', '.....gg.....', '....g..g....', '...g.yy.g...', '...gyyyyg...', '..wwwwwwww..'],
  pergaminho: ['.wwwwwwwwww.', 'woooooooooow', '.oyyyyyyyyo.', '.oyrrryyyyo.', '.oyyyyyyyyo.', '.oyyrrrryyo.', '.oyyyyyyyyo.', 'woooooooooow', '.wwwwwwwwww.'],
  reliquia: ['....gggg....', '...oddddo...', '..dccdccdd..', '.dccccccccd.', '..dccccccd..', '...dccccd...', '....dccd....', '.....dd.....'],
  pocaoV: ['....xxxx....', '.....oo.....', '.....oo.....', '....oppo....', '...oppppo...', '..oppqpppo..', '..opqppppo..', '..oppppppo..', '...oppppo...', '....oooo....'],
  pocaoA: ['....xxxx....', '.....oo.....', '.....oo.....', '....oppo....', '...oppppo...', '..oppqpppo..', '..opqppppo..', '..oppppppo..', '...oppppo...', '....oooo....'],
  pocaoE: ['....xxxx....', '.....oo.....', '.....oo.....', '....oppo....', '...oppppo...', '..oppqpppo..', '..opqppppo..', '..oppppppo..', '...oppppo...', '....oooo....'],
  pocaoR: ['....xxxx....', '.....oo.....', '.....oo.....', '....oppo....', '...oppppo...', '..oppqpppo..', '..opqppppo..', '..oppppppo..', '...oppppo...', '....oooo....'],
  bomba: ['.......g....', '......y.....', '.....x......', '...kkkkk....', '..kknkkkk...', '.kknkkkkkk..', '.kkkkkkkkk..', '.kkkkkkkkk..', '..kkkkkkk...', '...kkkkk....'],
  mapa: ['.yyyyyyyyyy.', '.yyrryyyyyy.', '.yyyryyyyyy.', '.yyyyrryyyy.', '.yyyyyyryyy.', '.yyyyyyyryy.', '.yyyyyykyky.', '.yyyyyyykyy.', '.yyyyyykyky.', '.yyyyyyyyyy.'],
  emblema: ['..rr....rr..', '...rr..rr...', '....rrrr....', '....gggg....', '...gyyyyg...', '..gyygyyyg..', '..gygggyyg..', '..gyygyyyg..', '...gyyyyg...', '....gggg....'],
  caveira: ['...oooooo...', '..oooooooo..', '.oooooooooo.', '.okkooookko.', '.okkooookko.', '.oooookoooo.', '..oooooooo..', '...okokoko..', '...oooooo...'],
  estrela: ['.....gg.....', '.....gg.....', '....gyyg....', 'ggggyyyygggg', '.gyyyyyyyyg.', '..gyyyyyyg..', '..gyyggyyg..', '.gyyg..gyyg.', '.gg......gg.'],
  criador: ['.mm.........', 'm..m........', 'm..mm.......', '.mmmnm......', '....nmn.....', '.....nmn....', '......nmn...', '.......nmw..', '........www.', '.........ww.'],
  torre: ['..a..a..a...', '..aaaaaaa...', '..abbbbba...', '..aaaaaaa...', '...abbba....', '...ab.ba....', '...abbba....', '...ab.ba....', '...abbba....', '..aaaaaaa...', '.aaaaaaaaa..', '............'],
  estatisticas: ['............', '.........gg.', '.........gg.', '......rr.gg.', '......rr.gg.', '...cc.rr.gg.', '...cc.rr.gg.', '.m.cc.rr.gg.', '.m.cc.rr.gg.', 'aaaaaaaaaaaa', '............'],
  som: ['....m.......', '...mm...o...', '.mmmm.o..o..', '.mmmm..o.o..', '.mmmm..o.o..', '.mmmm.o..o..', '...mm...o...', '....m.......'],
  mudo: ['....m.......', '...mm.......', '.mmmm.r...r.', '.mmmm..r.r..', '.mmmm...r...', '.mmmm..r.r..', '...mm.r...r.', '....m.......'],
  expedicao: ['.....r......', '.....rr.....', '.....rrr....', '.....r......', '.....w......', '....www.....', '...wwwww....', '..wwwwwww...', '.wwwwwwwww..', 'xxxxxxxxxxx.'],
});
const ICONE_CORES = {
  reliquia: { c: '#63aef0', d: '#2c5f9e' },
  pocaoV: { p: '#e0574f', q: '#ffb3a8', o: '#e8f4ff' },
  pocaoA: { p: '#8c97a6', q: '#e0e6ee', o: '#e8f4ff' },
  pocaoE: { p: '#6cc76a', q: '#c8f5c0', o: '#e8f4ff' },
  pocaoR: { p: '#bd86f5', q: '#efdcff', o: '#e8f4ff' },
  bomba: { k: '#2b2233', n: '#6f6383' },
  mapa: { y: '#e8d5a0', r: '#c0392b', k: '#7d2219' },
  emblema: { r: '#c0392b' },
  caveira: { o: '#e8e2cf', k: '#2a2030' },
  pergaminho: { y: '#f0e2b8', r: '#a8744a' },
};

