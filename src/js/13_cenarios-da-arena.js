/* ============================ CENÁRIOS DA ARENA ============================
   Cinco cenários de 384×216: Arena (Bronze e Prata), Ruínas (Ouro), Floresta (Diamante),
   Vulcão (Lenda) e Torre. O fundo é desenhado uma vez por luta; o clima são partículas. */
const CENARIO_DIVISAO = ['arena', 'arena', 'ruinas', 'floresta', 'vulcao'];
function cenarioDaLuta(ctx) {
  if (!ctx) return 'arena';
  if (ctx.tipo === 'torre') return 'torre';
  return CENARIO_DIVISAO[STATE ? STATE.divisao : 0] || 'arena';
}
const CENARIOS = {
  arena: { chao: '#b48d5c', clima: null },
  ruinas: { chao: '#8b8a84', clima: 'poeira' },
  floresta: { chao: '#5f8f3a', clima: 'folhas' },
  vulcao: { chao: '#3b2a2e', clima: 'brasas' },
  torre: { chao: '#4a3f63', clima: 'motes' },
};
function desenharFundo(b, cenario = 'arena') {
  const W = ARENA.w, H = ARENA.h;
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const c = cv.getContext('2d');
  const R = mulberry32(7 + cenario.length);
  const px = (x, y, w, h, cor) => { c.fillStyle = cor; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  const elipse = (cx, cy, rx, ry, cor) => { for (let a = 0; a < Math.PI * 2; a += 0.015) px(cx + Math.cos(a) * rx, cy + Math.sin(a) * ry, 1, 1, cor); };
  const ceu = (cores) => { for (let i = 0; i < cores.length; i++) { px(0, i * 3, W, 3, cores[i]); if (i < cores.length - 1) for (let x = (i % 2) * 2; x < W; x += 4) px(x, i * 3 + 2, 2, 1, cores[i + 1]); } };
  const estrelas = (n, y1) => { for (let i = 0; i < n; i++) px(Math.floor(R() * W), Math.floor(R() * y1), 1, 1, R() < 0.3 ? '#fff4c2' : '#d9c9ff'); };
  const estandarte = (x, y, c1, c2, simb) => {
    px(x, y, 16, 2, '#5e3d22');
    for (let yy = y + 2; yy < y + 21; yy++) { const w = yy > y + 16 ? 16 - (yy - y - 16) * 3 : 16; px(x + (16 - w) / 2, yy, w, 1, (yy - y) % 6 === 0 ? c2 : c1); }
    if (simb) c.drawImage(brasaoCanvas({ cor1: c1, cor2: c2, simbolo: simb }), x + 1, y + 4);
  };
  const tocha = (x, y) => { px(x, y + 4, 2, 8, '#5e3d22'); px(x - 1, y + 1, 4, 3, '#ff8c1a'); px(x, y, 2, 2, '#ffe48a'); };
  const chaoBase = ARENA.chao - 8;
  Arena.publico = [];
  if (cenario === 'arena') {
    ceu(['#1b1430', '#221838', '#2c1f45', '#3b2752', '#4f2f58']); estrelas(24, 12);
    px(0, 15, W, 36, '#271f35');
    for (let fila = 0; fila < 5; fila++) { px(0, 22 + fila * 7, W, 2, fila % 2 ? '#3a2f4a' : '#332842'); px(0, 24 + fila * 7, W, 1, '#1e1729'); }
    const coresPub = ['#e8743b', '#f0c24b', '#6cc76a', '#5aa7e6', '#d35d8e', '#e9dfc9', '#bd86f5', '#c0392b', '#f4efe2', '#2f8f83'];
    for (let fila = 0; fila < 5; fila++) for (let x = 2 + (fila % 2) * 3; x < W - 3; x += 6) {
      if (R() < 0.1) continue;
      Arena.publico.push({ x, y: 16 + fila * 7, cor: coresPub[Math.floor(R() * coresPub.length)], pele: PELES_TODAS[Math.floor(R() * PELES_TODAS.length)][1], cabelo: CABELOS_TODOS[Math.floor(R() * CABELOS_TODOS.length)], fase: R() * 10 });
    }
    px(W / 2 - 24, 13, 48, 4, '#7a1f22'); for (let x = W / 2 - 24; x < W / 2 + 24; x += 6) px(x, 13, 3, 4, '#f0c24b');
    px(W / 2 - 22, 17, 44, 1, '#5e1418');
    px(0, 51, W, 19, '#4a3d5c');
    for (let r = 0; r < 4; r++) { const y = 51 + r * 4; for (let x = (r % 2) * 7 - 7; x < W; x += 14) { px(x, y, 13, 1, '#5b4c70'); px(x + 13, y, 1, 4, '#352b45'); } }
    px(0, 51, W, 1, '#6a5a80'); px(0, 69, W, 1, '#241c30');
    for (const x of [10, W - 12, W / 2 - 70, W / 2 + 68, 90, W - 92]) tocha(x, 51);
    estandarte(30, 47, b.lados[0].cor1, b.lados[0].cor2, b.lados[0].simbolo);
    estandarte(W - 46, 47, b.lados[1].cor1, b.lados[1].cor2, b.lados[1].simbolo);
    estandarte(W / 2 - 8, 47, '#7a1f22', '#f0c24b', 'coroa');
    px(0, chaoBase, W, H - chaoBase, '#b48d5c');
    px(0, chaoBase, W, 4, '#8c6a42'); px(0, chaoBase + 4, W, 2, '#a07a4c');
    for (let i = 0; i < 1100; i++) px(Math.floor(R() * W), chaoBase + 6 + Math.floor(R() * (H - chaoBase - 6)), R() < 0.2 ? 2 : 1, 1, R() < 0.5 ? '#a07a4c' : '#c49c68');
    elipse(W / 2, 145, 52, 22, '#c9a372'); elipse(W / 2, 145, 46, 19, '#a88456');
    for (let i = 0; i < 30; i++) { const x = Math.floor(R() * W), y = chaoBase + 10 + Math.floor(R() * (H - chaoBase - 14)); px(x, y, 2, 2, '#8f6c45'); px(x, y, 1, 1, '#c9a372'); }
    px(0, H - 3, W, 3, '#8c6a42');
  } else if (cenario === 'ruinas') {
    ceu(['#0e0f1c', '#141528', '#1b1d36', '#232544', '#2d2d4e']); estrelas(40, 40);
    px(W - 70, 12, 14, 14, '#f4efe2'); px(W - 68, 10, 10, 2, '#f4efe2'); px(W - 68, 26, 10, 2, '#f4efe2'); px(W - 72, 14, 2, 10, '#f4efe2'); px(W - 56, 14, 2, 10, '#f4efe2'); px(W - 66, 16, 4, 3, '#d9d2c0');
    // colunas quebradas ao fundo
    for (let i = 0; i < 9; i++) {
      const x = 14 + i * 44 + Math.floor(R() * 10), alt = 22 + Math.floor(R() * 26), topo = chaoBase - alt;
      px(x, topo, 10, alt, '#5d5a66'); px(x, topo, 3, alt, '#7a7786'); px(x + 8, topo, 2, alt, '#403d48');
      if (R() < 0.6) { px(x - 2, topo - 3, 14, 3, '#8a8796'); } else { px(x + 2, topo, 6, 2, '#8a8796'); }
      for (let k = 0; k < 3; k++) px(x + 1 + Math.floor(R() * 7), topo + 4 + Math.floor(R() * (alt - 6)), 1, 1, '#2f2d38');
    }
    px(0, chaoBase - 1, W, 1, '#2f2d38');
    // piso de lajotas
    px(0, chaoBase, W, H - chaoBase, '#8b8a84');
    for (let y = chaoBase; y < H; y += 16) for (let x = ((y / 16) % 2) * 12 - 12; x < W; x += 24) {
      px(x, y, 23, 15, R() < 0.5 ? '#8f8e88' : '#85847e'); px(x, y + 15, 24, 1, '#6b6a66'); px(x + 23, y, 1, 16, '#6b6a66');
      if (R() < 0.18) { px(x + 3 + Math.floor(R() * 10), y + 2 + Math.floor(R() * 8), 6, 1, '#6b6a66'); px(x + 9 + Math.floor(R() * 6), y + 5 + Math.floor(R() * 6), 1, 5, '#6b6a66'); }
      if (R() < 0.22) { const mx = x + 2 + Math.floor(R() * 14), my = y + 3 + Math.floor(R() * 8); px(mx, my, 6, 3, '#5f7a3e'); px(mx + 1, my - 1, 3, 1, '#7a9a4c'); px(mx + 6, my + 1, 2, 2, '#5f7a3e'); }
    }
    // pedaços de coluna caídos nas bordas
    for (const [x, y] of [[20, chaoBase + 8], [W - 60, chaoBase + 12], [W / 2 + 90, H - 18], [40, H - 16]]) { px(x, y, 28, 8, '#7a7786'); px(x, y, 28, 2, '#9a97a6'); px(x, y + 6, 28, 2, '#55525e'); px(x + 26, y + 1, 3, 6, '#9a97a6'); }
    elipse(W / 2, 148, 56, 24, '#9d9c95'); for (let a = 0; a < Math.PI * 2; a += 0.6) px(W / 2 + Math.cos(a) * 56, 148 + Math.sin(a) * 24, 3, 2, '#b5b4ac');
  } else if (cenario === 'floresta') {
    ceu(['#0f1d2a', '#13273a', '#183348', '#1f4258', '#2a5467']);
    // copas das árvores e troncos
    for (let i = 0; i < 16; i++) { const x = i * 26 + Math.floor(R() * 8) - 6, r = 16 + Math.floor(R() * 8); for (let k = 0; k < 3; k++) elipse(x, 26 + k * 9, r - k * 2, r * 0.55, k === 0 ? '#2f6b34' : k === 1 ? '#3f8a40' : '#4f9f4a'); }
    for (let y = 8; y < 44; y++) for (let x = 0; x < W; x++) { const v = Math.sin(x * 0.23 + y * 0.7) + Math.sin(x * 0.07) * 0.8; if (v > 0.9) px(x, y, 1, 1, '#1f4d27'); else if (v < -1.3) px(x, y, 1, 1, '#5fb356'); }
    for (let i = 0; i < 10; i++) { const x = 10 + i * 40 + Math.floor(R() * 12); px(x, 40, 7, chaoBase - 40, '#4a3222'); px(x, 40, 2, chaoBase - 40, '#6b4a30'); px(x + 5, 40, 2, chaoBase - 40, '#2f1e14'); px(x - 3, chaoBase - 4, 13, 4, '#3a2a1c'); }
    for (let i = 0; i < 5; i++) { const x = 30 + i * 80 + Math.floor(R() * 20); for (let y = 44; y < chaoBase; y++) px(x + (y - 44) * 0.3, y, 6, 1, 'rgba(255,240,180,0.07)'); }
    // grama
    px(0, chaoBase, W, H - chaoBase, '#5f8f3a');
    for (let i = 0; i < 1600; i++) { const x = Math.floor(R() * W), y = chaoBase + Math.floor(R() * (H - chaoBase)); const r = R(); px(x, y, 1, r < 0.3 ? 2 : 1, r < 0.4 ? '#527d31' : r < 0.75 ? '#6e9f45' : '#7fb04f'); }
    for (let i = 0; i < 26; i++) { const x = Math.floor(R() * W), y = chaoBase + 4 + Math.floor(R() * (H - chaoBase - 8)); px(x, y, 1, 1, pick(['#f0c24b', '#e8e2cf', '#d35d8e'])); px(x - 1, y + 1, 3, 1, '#4f7f2e'); }
    for (const [x, y] of [[36, H - 24], [W - 70, chaoBase + 10]]) { px(x, y, 30, 8, '#5e3d22'); px(x, y, 30, 2, '#8a6236'); px(x, y + 6, 30, 2, '#3a2418'); px(x + 28, y + 1, 3, 6, '#a07a4c'); px(x + 29, y + 3, 1, 2, '#5e3d22'); }
    elipse(W / 2, 148, 50, 20, '#4f7f2e');
  } else if (cenario === 'vulcao') {
    ceu(['#1a0b10', '#2a1016', '#3d151a', '#53201e', '#6a2a1f']);
    for (let i = 0; i < 20; i++) px(Math.floor(R() * W), Math.floor(R() * 14), 1, 1, '#ff9a3c');
    // vulcão ao fundo
    for (let y = 18; y < chaoBase; y++) { const w = (y - 18) * 2.4 + 14; px(W / 2 - w / 2, y, w, 1, y < 24 ? '#4a2a2a' : '#2a1a1e'); }
    px(W / 2 - 7, 16, 14, 3, '#ff6a1f'); px(W / 2 - 4, 14, 8, 2, '#ffd23f');
    for (let y = 19; y < 50; y++) { px(W / 2 - 3 + Math.sin(y * 0.6) * 3, y, 2, 1, '#ff6a1f'); }
    for (let i = 0; i < 8; i++) { const x = 20 + i * 48 + Math.floor(R() * 20), h = 10 + Math.floor(R() * 14); for (let y = chaoBase - h; y < chaoBase; y++) px(x - (chaoBase - y) * 0.6, y, (chaoBase - y) * 1.2 + 4, 1, '#241418'); }
    px(0, chaoBase, W, H - chaoBase, '#3b2a2e');
    for (let i = 0; i < 1200; i++) px(Math.floor(R() * W), chaoBase + Math.floor(R() * (H - chaoBase)), 1, 1, R() < 0.5 ? '#2e2024' : '#4a3338');
    // rachaduras de lava
    for (let i = 0; i < 9; i++) {
      let x = Math.floor(R() * W), y = chaoBase + 10 + Math.floor(R() * (H - chaoBase - 20));
      for (let k = 0; k < 22; k++) { px(x, y, 2, 1, k % 3 === 0 ? '#ffd23f' : '#ff6a1f'); px(x - 1, y - 1, 4, 3, 'rgba(255,106,31,0.18)'); x += R() < 0.5 ? 2 : -2; y += R() < 0.7 ? 1 : -1; }
    }
    for (const [x, y] of [[26, H - 22], [W - 58, chaoBase + 14]]) { px(x, y, 22, 10, '#1e1418'); px(x + 2, y - 3, 14, 4, '#2e2024'); px(x + 4, y + 2, 6, 2, '#ff6a1f'); }
    elipse(W / 2, 148, 50, 20, '#5a3a3a');
  } else {   // torre
    ceu(['#120c1e', '#1a1030', '#231641', '#2c1c52', '#352462']);
    px(0, 14, W, chaoBase - 14, '#2c2340');
    for (let r = 0; r < 14; r++) { const y = 14 + r * 4; for (let x = (r % 2) * 7 - 7; x < W; x += 14) { px(x, y, 13, 1, '#3a2f52'); px(x + 13, y, 1, 4, '#1f1830'); } }
    for (let i = 0; i < 7; i++) { const x = 20 + i * 56; px(x, 12, 12, chaoBase - 12, '#4a3f63'); px(x, 12, 3, chaoBase - 12, '#6a5c88'); px(x + 10, 12, 2, chaoBase - 12, '#2f2742'); px(x - 2, 10, 16, 4, '#6a5c88'); px(x - 2, chaoBase - 4, 16, 4, '#3a2f52'); tocha(x + 24, 34); }
    for (let i = 0; i < 3; i++) { const x = 60 + i * 120; px(x, 24, 20, 24, '#1a1030'); px(x + 2, 26, 16, 20, '#2a1a4a'); px(x + 8, 22, 4, 4, '#bd86f5'); }
    px(0, chaoBase - 1, W, 1, '#6a5c88');
    // piso xadrez com tapete
    for (let y = chaoBase; y < H; y += 12) for (let x = ((y / 12) % 2) * 12 - 12; x < W; x += 24) { px(x, y, 12, 12, '#4a3f63'); px(x + 12, y, 12, 12, '#413758'); }
    for (let y = chaoBase; y < H; y++) { px(W / 2 - 40, y, 80, 1, y % 10 === 0 ? '#5e1a2a' : '#7a2236'); px(W / 2 - 40, y, 3, 1, '#f0c24b'); px(W / 2 + 37, y, 3, 1, '#f0c24b'); }
    elipse(W / 2, 148, 46, 18, '#bd86f5'); elipse(W / 2, 148, 40, 15, '#8e5ad0'); for (let a = 0; a < Math.PI * 2; a += Math.PI / 3) px(W / 2 + Math.cos(a) * 43, 148 + Math.sin(a) * 16.5, 3, 3, '#efdcff');
  }
  return cv;
}
// Clima: partículas ambientes por cenário
function climaArena(dt) {
  const cen = Arena.cenario, W = ARENA.w, H = ARENA.h;
  if (cen === 'floresta') { if (Math.random() < dt * 6) particula(rnd(0, W), rnd(0, 30), rnd(8, 22), rnd(10, 22), rnd(4, 7), pick(['#7fb04f', '#e8a23b', '#c9772e']), { tipo: 'folha', g: 0, tam: 2 }); }
  else if (cen === 'vulcao') { if (Math.random() < dt * 10) particula(rnd(0, W), rnd(ARENA.chao, H), rnd(-4, 4), rnd(-26, -12), rnd(1.5, 3), pick(['#ff6a1f', '#ffd23f', '#ff9a3c']), { g: 0, tam: 1 }); }
  else if (cen === 'torre') { if (Math.random() < dt * 5) particula(rnd(0, W), rnd(ARENA.chao, H), rnd(-3, 3), rnd(-10, -4), rnd(2, 4), pick(['#bd86f5', '#efdcff']), { g: 0, tam: 1 }); }
  else if (cen === 'ruinas') { if (Math.random() < dt * 3) particula(rnd(0, W), rnd(20, H), rnd(4, 10), rnd(-3, 3), rnd(3, 5), '#c9c4b4', { g: 0, tam: 1 }); }
}

