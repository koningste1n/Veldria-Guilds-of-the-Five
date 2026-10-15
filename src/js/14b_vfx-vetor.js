/* ============================ VFX VETORIAIS (EV4) ============================
   Efeitos lisos (não pixelados), desenhados na camada de alta resolução por cima/por baixo dos bonecos:
   cortes de luz em meia-lua, faíscas de impacto, ondas de choque, feixes, rastros de flecha, pilares de luz,
   círculos mágicos, explosões, raios e cúpulas. Referência: os cortes brancos do Super Smash Flash 2 e os
   impactos constantes do Eslabong — tudo curto (0,1–0,6 s), claro no centro e colorido na borda.
   Coordenadas no mundo (1 = 1 pixel da arena); o chão é achatado (elipses com ry = 0,45 × rx). */

const VX_CHAO = new Set(['circuloMagico', 'marcaV', 'anelChao', 'rachaduraV', 'sombraV']);
function vx(tipo, props) {
  if (!Arena.vx) Arena.vx = [];
  if (Arena.vx.length > 90) Arena.vx.shift();
  const f = Object.assign({ tipo, t: 0, dur: 0.3 }, props);
  Arena.vx.push(f); return f;
}
function atualizarVx(dt) {
  const L = Arena.vx || [];
  for (let i = L.length - 1; i >= 0; i--) { const f = L[i]; f.t += dt; if (f.atraso) { f.atraso -= dt; f.t = 0; continue; } if (f.t >= f.dur) L.splice(i, 1); }
}
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const rgba = (hex, a) => { const [r, g, b] = hexRgb(hex); return `rgba(${r},${g},${b},${clamp(a, 0, 1)})`; };
function desenharVxChao(c) {
  // EV5: aura da evolução no chão (pulsa devagar)
  if (Arena.b) for (const u of Arena.b.units) {
    if (!u.vivo || !u.evo) continue;
    const cor = corEvo(u); if (!cor) continue;
    c.save(); c.globalCompositeOperation = 'lighter';
    brilhoRadial(c, u.x, u.y, 13 + Math.sin(Arena.t * 3 + u.anim.fase) * 1.5, cor, 0.35, 5);
    c.restore();
  }
  for (const f of Arena.vx || []) if (!f.atraso && VX_CHAO.has(f.tipo)) desenharVx(c, f);
}
const corEvo = (u) => { const d = spriteSet(u.look).def; return d && d.evoCor; };
function desenharVxAr(c) {
  for (const f of Arena.vx || []) if (!f.atraso && !VX_CHAO.has(f.tipo)) desenharVx(c, f);
  // escudo ativo: bolha fina e brilhante em volta do boneco
  if (Arena.b) for (const u of Arena.b.units) if (u.vivo && u.st.shield) {
    const [ox, oy] = deslocVis(u), x = u.x + ox, y = u.y + oy - 19, a = 0.45 + 0.15 * Math.sin(Arena.t * 6);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineWidth = 0.9; c.strokeStyle = rgba('#9fd3ff', a);
    c.beginPath(); c.ellipse(x, y, 14, 21, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = rgba('#7fbcf0', 0.08); c.fill(); c.restore();
  }
  if (Arena.b) for (const p of Arena.b.projs) desenharProjetilVx(c, p);
}

/* ---- primitivas ---- */
// Meia-lua de luz: varre de a0 a a1 em volta de (x, y); grossa no meio, fina nas pontas
function caminhoMeiaLua(c, x, y, r, a0, a1, esp, achata = 0.72) {
  const n = 18;
  c.beginPath();
  for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + (a1 - a0) * t; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * achata); }
  for (let i = n; i >= 0; i--) { const t = i / n, a = a0 + (a1 - a0) * t, w = esp * Math.sin(t * Math.PI) ** 0.8; c.lineTo(x + Math.cos(a) * (r - w), y + Math.sin(a) * (r - w) * achata); }
  c.closePath();
}
function estrela(c, x, y, n, r0, r1, rot, ach = 1) {
  c.beginPath();
  for (let i = 0; i < n * 2; i++) { const a = rot + (i / (n * 2)) * Math.PI * 2, r = i % 2 ? r0 : r1; c.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * ach); }
  c.closePath();
}
function brilhoRadial(c, x, y, r, cor, a = 1, ry = r) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba('#ffffff', a)); g.addColorStop(0.25, rgba(cor, a * 0.85)); g.addColorStop(1, rgba(cor, 0));
  c.fillStyle = g;
  c.save(); c.translate(x, y); c.scale(1, ry / r); c.beginPath(); c.arc(0, 0, r, 0, Math.PI * 2); c.restore(); c.fill();
}

/* ---- desenho de cada efeito ---- */
function desenharVx(c, f) {
  const k = clamp(f.t / f.dur, 0, 1);
  c.save();
  switch (f.tipo) {
    case 'corte': {   // corte em meia-lua: varre rápido, fica um instante e afina
      const varre = easeOut(Math.min(1, k / 0.45)), some = k > 0.45 ? (k - 0.45) / 0.55 : 0;
      const a0 = f.ang - f.sentido * f.abre / 2, a1 = a0 + f.sentido * f.abre * varre;
      const ini = a0 + f.sentido * f.abre * some * 0.9;
      const esp = f.esp * (1 - some * 0.8);
      c.globalCompositeOperation = 'lighter';
      caminhoMeiaLua(c, f.x, f.y, f.r + 1.2, ini, a1, esp + 2.4, f.achata); c.fillStyle = rgba(f.cor, 0.45 * (1 - some)); c.fill();
      c.globalCompositeOperation = 'source-over';
      caminhoMeiaLua(c, f.x, f.y, f.r, ini, a1, esp, f.achata); c.fillStyle = rgba('#ffffff', 0.95 * (1 - some * some)); c.fill();
      if (f.duplo) { caminhoMeiaLua(c, f.x, f.y, f.r - esp - 1.5, ini, a1, esp * 0.5, f.achata); c.fillStyle = rgba(f.cor, 0.8 * (1 - some)); c.fill(); }
      break;
    }
    case 'faisca': {   // estrela de impacto: nasce grande e branca, gira um pouco e some
      const e = easeOut(Math.min(1, k * 2.2)), a = 1 - k;
      c.globalCompositeOperation = 'lighter';
      brilhoRadial(c, f.x, f.y, f.r * (0.8 + e * 0.6), f.cor, 0.55 * a);
      c.globalCompositeOperation = 'source-over';
      estrela(c, f.x, f.y, f.n, f.r * 0.12 * (1 - k), f.r * e * (1 - k * 0.3), f.rot + k * 0.6); c.fillStyle = rgba(f.cor, 0.95 * a); c.fill();
      estrela(c, f.x, f.y, f.n, f.r * 0.06, f.r * 0.62 * e * (1 - k * 0.5), f.rot + k * 0.6); c.fillStyle = rgba('#ffffff', a); c.fill();
      break;
    }
    case 'anel': case 'anelChao': {   // onda de choque: elipse que abre e afina
      const e = easeOut(k), r = f.r0 + (f.r1 - f.r0) * e;
      c.lineWidth = Math.max(0.3, f.esp * (1 - k)); c.strokeStyle = rgba(f.cor, 0.95 * (1 - k * k));
      c.beginPath(); c.ellipse(f.x, f.y, r, r * (f.ach || 0.45), 0, 0, Math.PI * 2); c.stroke();
      if (f.brilho !== false) { c.globalCompositeOperation = 'lighter'; c.lineWidth = Math.max(0.3, f.esp * 2.4 * (1 - k)); c.strokeStyle = rgba(f.cor, 0.25 * (1 - k)); c.stroke(); }
      break;
    }
    case 'feixe': {   // feixe/estocada: faixa afunilada de p0 a p1 que acende e se estreita
      const surge = Math.min(1, k / 0.25), some = k > 0.35 ? (k - 0.35) / 0.65 : 0;
      const x0 = f.x0, y0 = f.y0, x1 = f.x0 + (f.x1 - f.x0) * easeOut(surge), y1 = f.y0 + (f.y1 - f.y0) * easeOut(surge);
      const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, w = f.larg * (1 - some);
      const faixa = (ww) => { c.beginPath(); c.moveTo(x0 + nx * ww * 0.25, y0 + ny * ww * 0.25); c.lineTo(x1 + nx * ww, y1 + ny * ww); c.lineTo(x1 + (dx / L) * ww * 2.2, y1 + (dy / L) * ww * 2.2); c.lineTo(x1 - nx * ww, y1 - ny * ww); c.lineTo(x0 - nx * ww * 0.25, y0 - ny * ww * 0.25); c.closePath(); };
      c.globalCompositeOperation = 'lighter'; faixa(w * 2.2); c.fillStyle = rgba(f.cor, 0.5 * (1 - some)); c.fill();
      c.globalCompositeOperation = 'source-over'; faixa(w * 0.8); c.fillStyle = rgba('#ffffff', 0.95 * (1 - some)); c.fill();
      break;
    }
    case 'pilar': {   // coluna de luz do céu até o alvo
      const x = f.alvo ? f.alvo.x : f.x, base = f.alvo ? f.alvo.y : f.y;
      const abre = Math.min(1, k / 0.15), fecha = k > 0.6 ? (k - 0.6) / 0.4 : 0, w = f.larg * abre * (1 - fecha);
      const g = c.createLinearGradient(x - w, 0, x + w, 0);
      g.addColorStop(0, rgba(f.cor, 0)); g.addColorStop(0.3, rgba(f.cor, 0.55)); g.addColorStop(0.5, rgba('#ffffff', 0.95)); g.addColorStop(0.7, rgba(f.cor, 0.55)); g.addColorStop(1, rgba(f.cor, 0));
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g; c.fillRect(x - w, base - 240, w * 2, 240);
      brilhoRadial(c, x, base - 2, w * 2.4 + 4, f.cor, 0.6 * (1 - fecha), (w * 2.4 + 4) * 0.4);
      for (let i = 0; i < 3; i++) { const yy = base - ((f.t * 70 + i * 22) % 60); c.lineWidth = 0.8; c.strokeStyle = rgba('#ffffff', 0.7 * (1 - fecha)); c.beginPath(); c.ellipse(x, yy, w + 4, 2.2, 0, 0, Math.PI * 2); c.stroke(); }
      break;
    }
    case 'circuloMagico': {   // círculo no chão que gira, com marcas
      const abre = easeOut(Math.min(1, k / 0.2)), fecha = k > 0.75 ? (k - 0.75) / 0.25 : 0, r = f.r * abre, a = 1 - fecha;
      c.globalCompositeOperation = 'lighter';
      brilhoRadial(c, f.x, f.y, r * 1.1, f.cor, 0.35 * a, r * 0.5);
      c.lineWidth = 0.9; c.strokeStyle = rgba(f.cor, 0.95 * a);
      c.beginPath(); c.ellipse(f.x, f.y, r, r * 0.45, 0, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.ellipse(f.x, f.y, r * 0.72, r * 0.72 * 0.45, 0, 0, Math.PI * 2); c.stroke();
      const n = 8, rot = f.t * (f.giro || 2.2);
      for (let i = 0; i < n; i++) { const an = rot + (i / n) * Math.PI * 2; const px = f.x + Math.cos(an) * r * 0.86, py = f.y + Math.sin(an) * r * 0.86 * 0.45; c.fillStyle = rgba('#ffffff', a); c.fillRect(px - 0.7, py - 0.7, 1.4, 1.4); }
      c.beginPath(); for (let i = 0; i <= 3; i++) { const an = -rot * 0.7 + (i / 3) * Math.PI * 2; const px = f.x + Math.cos(an) * r * 0.72, py = f.y + Math.sin(an) * r * 0.72 * 0.45; i ? c.lineTo(px, py) : c.moveTo(px, py); } c.stroke();
      break;
    }
    case 'marcaV': {   // aviso no chão (onde vai cair): anel tracejado + preenchimento que cresce
      const a = 1 - (k > 0.85 ? (k - 0.85) / 0.15 : 0);
      c.setLineDash([2.5, 2]); c.lineDashOffset = -f.t * 12; c.lineWidth = 0.9; c.strokeStyle = rgba(f.cor, 0.95 * a);
      c.beginPath(); c.ellipse(f.x, f.y, f.r, f.r * 0.45, 0, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      c.fillStyle = rgba(f.cor, 0.22 * a); c.beginPath(); c.ellipse(f.x, f.y, f.r * Math.min(1, k * 1.2), f.r * 0.45 * Math.min(1, k * 1.2), 0, 0, Math.PI * 2); c.fill();
      break;
    }
    case 'explosao': {   // clarão → bola de fogo → fumaça clara
      const e = easeOut(Math.min(1, k * 1.6)), r = f.r * (0.4 + e * 0.8), a = 1 - k;
      c.globalCompositeOperation = 'lighter';
      brilhoRadial(c, f.x, f.y, r * 1.6, f.cor2, 0.5 * a, r * 1.1);
      brilhoRadial(c, f.x, f.y - r * 0.15, r, f.cor, 0.95 * a, r * 0.8);
      if (k < 0.18) { c.fillStyle = rgba('#ffffff', 0.9 * (1 - k / 0.18)); c.beginPath(); c.ellipse(f.x, f.y, r * 0.7, r * 0.55, 0, 0, Math.PI * 2); c.fill(); }
      break;
    }
    case 'brilho': { c.globalCompositeOperation = 'lighter'; const a = (f.a ?? 1) * (k < 0.2 ? k / 0.2 : 1 - (k - 0.2) / 0.8); brilhoRadial(c, f.alvo ? f.alvo.x : f.x, (f.alvo ? f.alvo.y - 18 : f.y), f.r, f.cor, a, f.r * (f.ach || 1)); break; }
    case 'raioV': {   // raio: linha quebrada com núcleo branco e brilho
      const x1 = f.de.x, y1 = f.de.y - 18, x2 = f.para.x, y2 = f.para.y - 18, a = 1 - k;
      if (!f.pts || Math.floor(f.t * 30) !== f.q) { f.q = Math.floor(f.t * 30); f.pts = []; for (let i = 0; i <= 7; i++) { const t = i / 7; f.pts.push([x1 + (x2 - x1) * t + (i && i < 7 ? rnd(-5, 5) : 0), y1 + (y2 - y1) * t + (i && i < 7 ? rnd(-4, 4) : 0)]); } }
      const linha = () => { c.beginPath(); f.pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); };
      c.lineJoin = 'round'; c.globalCompositeOperation = 'lighter'; linha(); c.lineWidth = 3.4; c.strokeStyle = rgba(f.cor, 0.5 * a); c.stroke();
      c.globalCompositeOperation = 'source-over'; linha(); c.lineWidth = 1.1; c.strokeStyle = rgba('#ffffff', a); c.stroke();
      break;
    }
    case 'cupula': {   // escudo em cúpula
      const abre = easeOut(Math.min(1, k / 0.18)), a = 1 - (k > 0.7 ? (k - 0.7) / 0.3 : 0), x = f.alvo ? f.alvo.x : f.x, y = f.alvo ? f.alvo.y : f.y, r = f.r * abre;
      const g = c.createRadialGradient(x, y - r * 0.5, r * 0.2, x, y - r * 0.4, r * 1.1);
      g.addColorStop(0, rgba(f.cor, 0.05 * a)); g.addColorStop(0.8, rgba(f.cor, 0.3 * a)); g.addColorStop(1, rgba('#ffffff', 0.8 * a));
      c.globalCompositeOperation = 'lighter'; c.fillStyle = g;
      c.beginPath(); c.ellipse(x, y, r, r * 1.25, 0, Math.PI, 0); c.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI); c.fill();
      c.lineWidth = 0.9; c.strokeStyle = rgba('#ffffff', 0.85 * a); c.beginPath(); c.ellipse(x, y, r, r * 1.25, 0, Math.PI, 0); c.stroke();
      c.strokeStyle = rgba(f.cor, 0.9 * a); c.beginPath(); c.ellipse(x, y, r, r * 0.42, 0, 0, Math.PI * 2); c.stroke();
      // hexágonos
      c.lineWidth = 0.5; c.strokeStyle = rgba('#ffffff', 0.35 * a);
      for (let i = -2; i <= 2; i++) { c.beginPath(); c.ellipse(x, y - r * 0.55, Math.abs(r * Math.cos(i * 0.5)) * 0.95, r * 0.7, 0, Math.PI * 1.05, Math.PI * 1.95); c.stroke(); }
      break;
    }
    case 'linhas': {   // linhas de velocidade em volta de um ponto (SUPREMO, arrancadas)
      const a = 1 - k; c.globalCompositeOperation = 'lighter'; c.strokeStyle = rgba(f.cor, 0.7 * a);
      for (const L of f.ls || (f.ls = Array.from({ length: f.n || 16 }, () => ({ ang: rnd(0, Math.PI * 2), r0: rnd(18, 30), len: rnd(14, 34), w: rnd(0.5, 1.4) })))) {
        const r0 = L.r0 + k * 30; c.lineWidth = L.w; c.beginPath(); c.moveTo(f.x + Math.cos(L.ang) * r0, f.y + Math.sin(L.ang) * r0 * 0.7); c.lineTo(f.x + Math.cos(L.ang) * (r0 + L.len), f.y + Math.sin(L.ang) * (r0 + L.len) * 0.7); c.stroke();
      }
      break;
    }
    case 'chama': {   // labareda subindo (Pira, queimaduras grandes)
      const x = f.alvo ? f.alvo.x : f.x, y = f.alvo ? f.alvo.y : f.y, a = 1 - (k > 0.6 ? (k - 0.6) / 0.4 : 0), h = f.h * easeOut(Math.min(1, k * 3));
      c.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 7; i++) { const t = i / 6, yy = y - h * t, ww = f.larg * (1 - t * 0.75) * (0.85 + 0.15 * Math.sin(f.t * 30 + i)); brilhoRadial(c, x + Math.sin(f.t * 18 + i * 1.7) * 2 * t, yy, ww, t < 0.3 ? '#ffd23f' : t < 0.65 ? '#ff8c1a' : '#ff4a1f', 0.75 * a, ww * 1.3); }
      break;
    }
    case 'gelo': {   // estalactites de gelo vetoriais
      const cresce = easeOut(Math.min(1, k * 3)), some = k > 0.7 ? (k - 0.7) / 0.3 : 0;
      for (let i = 0; i < f.n; i++) {
        const an = (i / f.n) * Math.PI * 2 + 0.4, d = f.r * (i % 2 ? 0.55 : 1), px = f.x + Math.cos(an) * d, py = f.y + Math.sin(an) * d * 0.45, h = (8 + (i % 3) * 5) * cresce * (1 - some), w = 2.2 + (i % 2);
        c.beginPath(); c.moveTo(px - w, py); c.lineTo(px + (i % 2 ? 1 : -1), py - h); c.lineTo(px + w, py); c.closePath();
        const g = c.createLinearGradient(px, py, px, py - h); g.addColorStop(0, rgba('#3a9fd6', 0.95)); g.addColorStop(1, rgba('#ffffff', 0.95)); c.fillStyle = g; c.fill();
        c.lineWidth = 0.4; c.strokeStyle = rgba('#e8fbff', 0.9); c.stroke();
      }
      break;
    }
    case 'notas': {   // anéis de música (Hino)
      const a = 1 - k;
      for (let i = 0; i < 3; i++) { const kk = clamp(k * 1.4 - i * 0.18, 0, 1); if (kk <= 0) continue; const r = 6 + kk * f.r; c.lineWidth = 1.2 * (1 - kk); c.strokeStyle = rgba(i % 2 ? '#ffffff' : f.cor, 0.9 * (1 - kk)); c.beginPath(); c.ellipse(f.x, f.y, r, r * 0.6, 0, 0, Math.PI * 2); c.stroke(); }
      c.globalAlpha = a; break;
    }
    case 'rastroArco': {   // trilha luminosa (flecha certeira, arrancadas)
      const a = 1 - k, x0 = f.x0, y0 = f.y0, x1 = f.x1, y1 = f.y1;
      const g = c.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, rgba(f.cor, 0)); g.addColorStop(1, rgba(f.cor, 0.85 * a));
      c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
      c.strokeStyle = g; c.lineWidth = f.larg * 2.5 * (1 - k * 0.5); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      const g2 = c.createLinearGradient(x0, y0, x1, y1); g2.addColorStop(0, rgba('#ffffff', 0)); g2.addColorStop(1, rgba('#ffffff', a));
      c.strokeStyle = g2; c.lineWidth = f.larg * (1 - k * 0.5); c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke();
      break;
    }
    case 'mira': {   // linha de mira (antes do Tiro Certeiro)
      const a = Math.min(1, k * 3) * (1 - (k > 0.85 ? (k - 0.85) / 0.15 : 0)), x2 = f.alvo.x, y2 = f.alvo.y - 18;
      c.setLineDash([3, 2]); c.lineDashOffset = -f.t * 30; c.lineWidth = 0.6; c.strokeStyle = rgba(f.cor, 0.9 * a);
      c.beginPath(); c.moveTo(f.u.x + f.u.face * 10, f.u.y - 19); c.lineTo(x2, y2); c.stroke(); c.setLineDash([]);
      const r = 7 - k * 3; c.lineWidth = 0.8; c.beginPath(); c.arc(x2, y2, r, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.moveTo(x2 - r - 3, y2); c.lineTo(x2 - r + 2, y2); c.moveTo(x2 + r - 2, y2); c.lineTo(x2 + r + 3, y2); c.moveTo(x2, y2 - r - 3); c.lineTo(x2, y2 - r + 2); c.moveTo(x2, y2 + r - 2); c.lineTo(x2, y2 + r + 3); c.stroke();
      break;
    }
    case 'juntar': {   // partículas de energia que convergem para um ponto (carga)
      const px = f.u ? f.u.x + f.u.face * (f.dx || 10) : f.x, py = f.u ? f.u.y - (f.dy || 19) : f.y;
      c.globalCompositeOperation = 'lighter';
      for (const q of f.qs || (f.qs = Array.from({ length: 10 }, () => ({ ang: rnd(0, Math.PI * 2), d: rnd(14, 26) })))) {
        const d = q.d * (1 - easeOut(k)); c.fillStyle = rgba(f.cor, 0.9); c.beginPath(); c.arc(px + Math.cos(q.ang) * d, py + Math.sin(q.ang) * d, 0.9, 0, Math.PI * 2); c.fill();
      }
      brilhoRadial(c, px, py, 3 + k * 5, f.cor, 0.8);
      break;
    }
  }
  c.restore();
}

/* ---- projéteis com brilho (por cima do desenho em pixel) ---- */
function desenharProjetilVx(c, p) {
  const cor = { flecha: '#ffffff', fagulha: '#ff8c1a', bolaFogo: '#ff8c1a', bolaFogoG: '#ff8c1a', gelinho: '#7fd6ff', gelo: '#9fe6ff', geloG: '#9fe6ff', luzinha: '#ffe48a', osso: '#7dff9a', nota: '#5fe0c8', veneno: '#8be05a' }[p.tipo] || '#ffffff';
  const certeiro = p.vis === 'tiro';
  // rastro: guarda as últimas posições
  p.hist = p.hist || []; p.hist.push([p.x, p.y]); if (p.hist.length > (certeiro ? 9 : 6)) p.hist.shift();
  c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
  const h = p.hist;
  if (h.length > 1) {
    const g = c.createLinearGradient(h[0][0], h[0][1], p.x, p.y); g.addColorStop(0, rgba(certeiro ? '#ffd84a' : cor, 0)); g.addColorStop(1, rgba(certeiro ? '#ffd84a' : cor, certeiro ? 0.95 : 0.6));
    c.strokeStyle = g; c.lineWidth = certeiro ? 4 : p.tipo === 'flecha' ? 1.4 : 3; c.beginPath(); h.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    if (certeiro) { c.strokeStyle = rgba('#ffffff', 0.9); c.lineWidth = 1.3; c.beginPath(); h.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); }
  }
  if (p.tipo !== 'flecha' || certeiro) brilhoRadial(c, p.x, p.y, certeiro ? 9 : p.tipo === 'bolaFogoG' || p.tipo === 'geloG' ? 10 : p.tipo === 'bolaFogo' || p.tipo === 'gelo' ? 7 : 4.5, certeiro ? '#ffd84a' : cor, 0.85);
  c.restore();
}

/* ---- disparadores usados pelos eventos ---- */
// Corte de arma corpo a corpo: meia-lua do lado do golpe, na cor da arma
const COR_ARMA = { espada: '#cfe6ff', espadao: '#d4a6ff', machado: '#ffb36b', martelo: '#ffb36b', lanca: '#ffd27a', adagas: '#c48bff', punho: '#ffd27a', cajado: '#9fd3ff', alaude: '#5fe0c8', arco: '#c8e6a0' };
function vxCorte(u, alvo, forte) {
  const def = spriteSet(u.look).def || {}, arma = def.golem ? 'punho' : def.arma || 'espada';
  const ang = Math.atan2((alvo.y - 18) - (u.y - 18), alvo.x - u.x), cor = COR_ARMA[arma] || '#ffffff';
  const d = Math.min(12, dist(u, alvo) * 0.55), x = u.x + Math.cos(ang) * d, y = u.y - 18 + Math.sin(ang) * d * 0.6;
  if (arma === 'lanca' || arma === 'punho') {   // estocada / soco: feixe reto
    vx('feixe', { x0: u.x + u.face * 6, y0: u.y - 17, x1: alvo.x - Math.cos(ang) * 2, y1: alvo.y - 18, larg: forte ? 2.6 : 1.6, cor, dur: forte ? 0.22 : 0.16 });
    return;
  }
  const sentido = (u.atkN || 0) % 2 ? 1 : -1;
  vx('corte', { x, y, ang, r: forte ? 17 : arma === 'adagas' ? 10 : 13, abre: Math.PI * (forte ? 1.05 : 0.85), esp: forte ? 5 : arma === 'adagas' ? 2.6 : 3.6, sentido, cor, achata: 0.75, dur: forte ? 0.24 : 0.17, duplo: forte });
  if (arma === 'adagas') vx('corte', { x, y: y + 2, ang, r: 9, abre: Math.PI * 0.8, esp: 2.2, sentido: -sentido, cor, achata: 0.75, dur: 0.17, atraso: 0.05 });
}
// Impacto no alvo: faísca + onda; o tamanho acompanha a força
function vxImpacto(a, cor, forca = 1, crit = false) {
  const x = a.x + rnd(-2, 2), y = a.y - 18 + rnd(-3, 3);
  vx('faisca', { x, y, r: 7 + forca * 5, n: crit ? 8 : 6, rot: rnd(0, 1), cor, dur: 0.16 + forca * 0.05 });
  if (forca >= 1.5 || crit) vx('anel', { x, y, r0: 3, r1: 12 + forca * 6, esp: 1.6, cor: crit ? '#ffd84a' : cor, ach: 0.75, dur: 0.24 });
}
