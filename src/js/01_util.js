/* ============================ UTIL ============================ */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = (a, b) => a + Math.random() * (b - a);
const rint = (a, b) => Math.floor(a + Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
function weighted(weights) {
  const tot = weights.reduce((s, w) => s + w, 0);
  let r = Math.random() * tot;
  for (let i = 0; i < weights.length; i++) { r -= weights[i]; if (r < 0) return i; }
  return weights.length - 1;
}
function shuffle(arr) { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; }
const fmt = (n) => Math.round(n).toLocaleString('pt-BR');
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString('pt-BR');
const pctTxt = (n) => (Math.round(n * 1000) / 10).toLocaleString('pt-BR') + '%';
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
function fmtTempo(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}:${String(ss).padStart(2, '0')}`;
}
function fmtDuracao(min) {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h ? `${h}h ${m}min` : `${m}min`;
}

