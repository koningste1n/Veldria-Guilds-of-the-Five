/* ============================ VFX DIRECIONAIS (Fase 4) ============================
   Efeitos "desenhados à mão" em pixel: cortes em meia-lua orientados pelo ângulo
   atacante→alvo, impactos, colunas de fogo, cristais de gelo, pilares sagrados,
   raios com brilho, rastros de investida e marcações no chão (telegraph). */
const dirDe = (a) => [Math.cos(a), Math.sin(a)];
function discoPixel(c, x, y, rx, ry, cor) {
  c.fillStyle = cor; x = Math.round(x); y = Math.round(y);
  for (let j = -Math.ceil(ry); j <= Math.ceil(ry); j++) {
    const k = 1 - (j * j) / (ry * ry || 1); if (k <= 0) continue;
    const w = Math.round(rx * Math.sqrt(k)); c.fillRect(x - w, y + j, w * 2 + 1, 1);
  }
}
// pixel "gordo" com contorno opcional
function pontoFx(c, x, y, cor, tam = 2) { c.fillStyle = cor; c.fillRect(Math.round(x - tam / 2), Math.round(y - tam / 2), tam, tam); }

/* ---- disparadores (chamados pelos eventos) ---- */
function fxCorte(u, alvo, forte) {
  const ang = Math.atan2((alvo.y - 18) - (u.y - 18), alvo.x - u.x);
  const px = u.x + Math.cos(ang) * Math.min(14, dist(u, alvo) * 0.7), py = u.y - 18 + Math.sin(ang) * Math.min(14, dist(u, alvo) * 0.7) * 0.6;
  efeito('meiaLua', { x: px, y: py, ang, r: forte ? 15 : 11, dur: forte ? 0.2 : 0.15, cor: forte ? '#ffe9a8' : '#ffffff', cor2: forte ? '#f0c24b' : '#c8c0d4', sentido: (u.atkN || 0) % 2 ? 1 : -1 });
  if (forte) efeito('impacto', { x: alvo.x, y: alvo.y - 18, dur: 0.16, cor: '#fff4c2', n: 8, r: 14 });
}
function fxImpacto(x, y, cor, n = 6, r = 10) { efeito('impacto', { x, y, dur: 0.14, cor, n, r }); }
function fxRastro(u, x0, y0, cor) {
  const set = spriteSet(u.look), fr = set.vistas.lado.quadros.dash[0];
  efeito('rastro', { x0, y0, x1: u.x, y1: u.y, fr, face: u.face, cor, dur: 0.38 });
  const n = Math.round(Math.hypot(u.x - x0, u.y - y0) / 6);
  for (let i = 0; i < n; i++) { const k = i / n; particula(x0 + (u.x - x0) * k + rnd(-2, 2), y0 + (u.y - y0) * k - rnd(4, 26), rnd(-6, 6), rnd(-12, 2), 0.3 + k * 0.2, cor, { tam: 2 }); }
}

/* ---- desenho ---- */
function desenharFx2(c, f, k) {
  switch (f.tipo) {
    case 'meiaLua': {   // corte em arco: varre de -70° a +70° em torno do ângulo do golpe
      const abre = Math.PI * 0.8, ini = f.ang - f.sentido * abre / 2, fim = f.ang + f.sentido * abre / 2;
      const prog = Math.min(1, k / 0.6), apaga = k > 0.6 ? (k - 0.6) / 0.4 : 0;
      const n = 22;
      for (let i = 0; i <= n * prog; i++) {
        const a = ini + (fim - ini) * (i / n), esp = 1 - Math.abs(i / n - 0.5) * 1.4;   // mais grosso no meio
        const r = f.r * (0.9 + 0.2 * Math.sin((i / n) * Math.PI));
        if (apaga > 0 && i / n < apaga) continue;
        const x = f.x + Math.cos(a) * r, y = f.y + Math.sin(a) * r * 0.75;
        pontoFx(c, x, y, i / n > prog - 0.12 ? '#ffffff' : f.cor, esp > 0.5 ? 3 : 2);
        pontoFx(c, x - Math.cos(a) * 2, y - Math.sin(a) * 1.5, f.cor2, 1);
      }
      break;
    }
    case 'impacto': {   // estrela de impacto: raios que crescem e somem
      const r = f.r * Math.min(1, k * 2.2), fade = k > 0.5;
      for (let i = 0; i < f.n; i++) {
        const a = (i / f.n) * Math.PI * 2 + 0.3, len = r * (i % 2 ? 0.6 : 1);
        const x0 = f.x + Math.cos(a) * len * (fade ? 0.5 : 0.15), y0 = f.y + Math.sin(a) * len * 0.7 * (fade ? 0.5 : 0.15);
        linhaPixel(c, x0, y0, f.x + Math.cos(a) * len, f.y + Math.sin(a) * len * 0.7, fade ? f.cor : '#ffffff');
      }
      if (k < 0.3) discoPixel(c, f.x, f.y, 4, 3, '#ffffff');
      break;
    }
    case 'rastro': {   // imagens residuais da investida
      const n = 3, alpha = 1 - k;
      for (let i = 0; i < n; i++) {
        const t = (i + 1) / (n + 1), x = f.x0 + (f.x1 - f.x0) * t, y = f.y0 + (f.y1 - f.y0) * t;
        c.save(); c.globalAlpha = alpha * (0.25 + 0.2 * i); c.translate(Math.round(x), Math.round(y)); if (f.face < 0) c.scale(-1, 1);
        c.drawImage(tingir(f.fr, f.cor, 1), -ANCORA.x - (f.fr.ox || 0), -ANCORA.y - (f.fr.oy || 0)); c.restore();
      }
      break;
    }
    case 'marca': {   // telegraph no chão: anel pulsante + preenchimento que cresce até a hora do golpe
      const pulsa = Math.floor(f.t * 12) % 2;
      desenharElipse(c, f.x, f.y, f.r, f.r * 0.45, pulsa ? f.cor : '#ffffff');
      discoPixel(c, f.x, f.y, f.r * k, f.r * 0.45 * k, f.cor2);
      desenharElipse(c, f.x, f.y, f.r * k, f.r * 0.45 * k, f.cor);
      break;
    }
    case 'coluna': {   // coluna de fogo/luz que sobe do chão e tremula
      const alt = f.h * Math.min(1, k * 3), w = f.w * (k < 0.75 ? 1 : 1 - (k - 0.75) * 4);
      for (let y = 0; y < alt; y += 2) {
        const ww = Math.max(1, w * (1 - (y / f.h) * 0.6) * (0.8 + 0.2 * Math.sin(y * 0.7 + Arena.t * 40)));
        const ox = Math.sin(y * 0.5 + Arena.t * 30) * 1.5;
        c.fillStyle = f.cores[Math.floor((y / 2 + Arena.t * 25) % f.cores.length)];
        c.fillRect(Math.round(f.x - ww / 2 + ox), Math.round(f.y - y), Math.round(ww), 2);
      }
      if (Math.random() < 0.8) particula(f.x + rnd(-f.w / 2, f.w / 2), f.y - rnd(0, alt), rnd(-6, 6), rnd(-40, -15), 0.4, pick(f.cores), { tam: 2 });
      break;
    }
    case 'cone': {   // sopro de fogo: leque de chamas na direção do ângulo, mais ralo e escuro na ponta
      const [dx, dy] = dirDe(f.ang), nx = -dy, ny = dx;
      const alc = f.alc * Math.min(1, k * 2.5), fade = k > 0.65 ? (k - 0.65) / 0.35 : 0;
      for (let d = 4; d < alc; d += 2.5) {
        const fr = d / f.alc, meia = fr * f.abre * (1 - fade * 0.6);
        for (let s = -meia; s <= meia; s += 2.5) {
          const borda = Math.abs(s) / (meia || 1);
          const ponta = f.alc * (0.82 + 0.18 * Math.sin(s * 0.8 + Arena.t * 22));
          if (d > ponta || Math.random() < 0.15 + fr * 0.45 + fade * 0.4) continue;
          const x = f.x + dx * d + nx * s, y = f.y + dy * d * 0.7 + ny * s * 0.6 + Math.sin(d * 0.35 + Arena.t * 35) * 1.5;
          const cor = fr < 0.25 && borda < 0.5 ? f.cores[0] : borda > 0.75 || fr > 0.8 ? f.cores[3] : fr > 0.55 ? f.cores[2] : f.cores[1];
          pontoFx(c, x, y, cor, fr < 0.5 ? 3 : 2);
        }
      }
      break;
    }
    case 'cristais': {   // estalactites de gelo brotando do chão
      const cresce = Math.min(1, k * 2.5), some = k > 0.7 ? (k - 0.7) / 0.3 : 0;
      for (let i = 0; i < f.n; i++) {
        const a = (i / f.n) * Math.PI * 2 + 0.5, px = f.x + Math.cos(a) * f.r * (i % 2 ? 0.5 : 1), py = f.y + Math.sin(a) * f.r * 0.45 * (i % 2 ? 0.5 : 1);
        const h = (10 + (i % 3) * 5) * cresce * (1 - some), w = 2 + (i % 2);
        for (let y = 0; y < h; y++) { const ww = Math.max(1, Math.round(w * (1 - y / h) + 1)); c.fillStyle = y > h - 3 ? '#ffffff' : i % 2 ? '#9fe6ff' : '#7fd6ff'; c.fillRect(Math.round(px - ww / 2 + (i % 2 ? 1 : 0)), Math.round(py - y), ww, 1); }
        c.fillStyle = '#3a9fd6'; c.fillRect(Math.round(px - w / 2 - 1), Math.round(py), w + 2, 1);
      }
      break;
    }
    case 'cupula': {   // escudo em cúpula sobre o guardião
      const r = f.r * Math.min(1, k * 3), pisca = Math.floor(f.t * 10) % 2;
      c.fillStyle = pisca ? f.cor : f.cor2;
      const n = Math.max(16, Math.round(r * 2));
      for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; c.fillRect(Math.round(f.x + Math.cos(a) * r), Math.round(f.y - 6 + Math.sin(a) * r * 1.1), 2, 2); }
      desenharElipse(c, f.x, f.y, r, r * 0.4, pisca ? f.cor2 : f.cor);
      break;
    }
    case 'rachadura': {   // terremoto: fendas que se abrem a partir do epicentro
      const alc = f.alc * Math.min(1, k * 2);
      for (let i = 0; i < f.n; i++) {
        const a = (i / f.n) * Math.PI * 2 + f.fase; let x = f.x, y = f.y;
        for (let d = 0; d < alc; d += 5) {
          const nx = f.x + Math.cos(a) * d + Math.sin(d * 0.9 + i) * 3, ny = f.y + Math.sin(a) * d * 0.45 + Math.cos(d * 0.7 + i) * 2;
          linhaPixel(c, x, y, nx, ny, '#3e2a1e'); linhaPixel(c, x, y + 1, nx, ny + 1, k < 0.5 ? '#ffb33c' : '#6b4a2e');
          x = nx; y = ny;
        }
      }
      break;
    }
    case 'lua': {   // eclipse: disco escuro cobrindo um sol no céu
      const cx = f.x, cy = f.y, r = 16, desl = 26 * (1 - Math.min(1, k * 1.6));
      discoPixel(c, cx, cy, r + 3, r + 3, k < 0.3 ? '#ffe9a8' : '#c48bff');
      discoPixel(c, cx, cy, r, r, '#fff4c2');
      discoPixel(c, cx + desl, cy, r, r, '#1a0f2a');
      if (k > 0.55) for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2 + Arena.t * 2; linhaPixel(c, cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4), cx + Math.cos(a) * (r + 10 + (i % 2) * 6), cy + Math.sin(a) * (r + 10 + (i % 2) * 6), '#c48bff'); }
      break;
    }
    case 'raioG': {   // raio com núcleo branco, brilho colorido e ramos
      const x1 = f.de ? f.de.x : f.alvo.x + rint(-6, 6), y1 = f.de ? f.de.y - 18 : -4;
      const x2 = f.para ? f.para.x : f.alvo.x, y2 = f.para ? f.para.y - 18 : f.alvo.y - 10;
      const passos = 8; let px = x1, py = y1;
      for (let i = 1; i <= passos; i++) {
        const t = i / passos, nx = x1 + (x2 - x1) * t + (i < passos ? rint(-6, 6) : 0), ny = y1 + (y2 - y1) * t + (i < passos ? rint(-4, 4) : 0);
        for (const [ox, oy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) linhaPixel(c, px + ox, py + oy, nx + ox, ny + oy, f.cor2);
        linhaPixel(c, px, py, nx, ny, f.cor);
        if (i % 3 === 0 && k < 0.6) linhaPixel(c, nx, ny, nx + rint(-12, 12), ny + rint(-10, 10), f.cor2);
        px = nx; py = ny;
      }
      if (k < 0.4) { fxPonta(c, x2, y2, f.cor); }
      break;
    }
    case 'pilar': {   // pilar sagrado: feixe largo com núcleo, anéis que sobem
      const a = f.alvo, x = Math.round(a.x), base = Math.round(a.y);
      const w = k < 0.6 ? 7 : Math.max(1, Math.round(7 * (1 - (k - 0.6) / 0.4)));
      c.fillStyle = f.cor2; c.fillRect(x - w, 0, w * 2 + 1, base);
      c.fillStyle = f.cor; c.fillRect(x - Math.max(0, w - 3), 0, Math.max(1, (w - 3) * 2 + 1), base);
      c.fillStyle = '#ffffff'; c.fillRect(x - Math.max(0, w - 5), 0, Math.max(1, (w - 5) * 2 + 1), base);
      for (let i = 0; i < 3; i++) { const y = base - ((Arena.t * 60 + i * 24) % 70); desenharElipse(c, x, y, w + 4, 3, i % 2 ? f.cor : '#ffffff'); }
      desenharElipse(c, x, base, w + 6, 4, f.cor);
      if (Math.random() < 0.8) particula(x + rint(-10, 10), base - rint(3, 30), 0, -18, 0.5, pick(['#fff4c2', '#7dff8a']), { tipo: 'cruz' });
      break;
    }
    case 'explosaoG': {   // explosão: clarão branco → bola de fogo → anel de fumaça
      if (k < 0.2) { discoPixel(c, f.x, f.y, f.r * 0.7, f.r * 0.5, '#ffffff'); }
      else if (k < 0.65) {
        const r = f.r * (0.7 + (k - 0.2)), ry = r * 0.6;
        discoPixel(c, f.x, f.y, r, ry, f.cor2); discoPixel(c, f.x, f.y, r * 0.7, ry * 0.7, f.cor); discoPixel(c, f.x, f.y - 2, r * 0.35, ry * 0.35, '#fff4c2');
        for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + k * 3; pontoFx(c, f.x + Math.cos(a) * r * 1.1, f.y + Math.sin(a) * ry * 1.1, i % 2 ? f.cor : '#fff4c2', 3); }
      } else { const r = f.r * (1 + (k - 0.65)); desenharElipse(c, f.x, f.y, r, r * 0.6, '#5d5868'); desenharElipse(c, f.x, f.y + 1, r, r * 0.6, '#3e3a46'); }
      break;
    }
  }
}
function fxPonta(c, x, y, cor) { for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; linhaPixel(c, x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 5, cor); } }

