/* ============================ SOM, MÚSICA E VIBRAÇÃO ============================
   Tudo sintetizado na hora com Web Audio (osciladores e ruído): nenhum arquivo externo.
   O áudio só liga depois do primeiro toque do jogador (regra dos navegadores). */
const Som = { ctx: null, mestre: null, sfx: null, mus: null, ruido: null, ultimo: {}, musica: null };
const cfgSom = () => (STATE && STATE.config) || {};
function somIniciar() {
  if (Som.ctx) { if (Som.ctx.state === 'suspended') Som.ctx.resume().catch(() => {}); return true; }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return false;
  try { Som.ctx = new AC(); } catch (e) { return false; }
  const c = Som.ctx;
  const comp = c.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 6; comp.connect(c.destination);
  Som.mestre = c.createGain(); Som.mestre.connect(comp);
  Som.sfx = c.createGain(); Som.sfx.connect(Som.mestre);
  Som.mus = c.createGain(); Som.mus.connect(Som.mestre);
  Som.ruido = c.createBuffer(1, c.sampleRate, c.sampleRate);
  const d = Som.ruido.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  somVolume();
  return true;
}
function somVolume() {
  if (!Som.ctx) return;
  const C = cfgSom(), v = C.som ?? 0.7;
  Som.sfx.gain.value = v * 0.55;
  Som.mus.gain.value = C.musica ? v * 0.3 : 0;
}
const somAtivo = () => !!(Som.ctx && Som.ctx.state === 'running' && (cfgSom().som ?? 0) > 0);

/* ---- primitivas ---- */
function tom(f, dur, o = {}) {
  const c = Som.ctx, t = c.currentTime + (o.atraso || 0);
  const os = c.createOscillator(), g = c.createGain();
  os.type = o.tipo || 'square';
  os.frequency.setValueAtTime(f, t);
  if (o.ate) os.frequency.exponentialRampToValueAtTime(Math.max(20, o.ate), t + dur);
  const vol = o.vol ?? 0.2, ataque = o.ataque ?? 0.004;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + ataque);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  os.connect(g); g.connect(o.canal || Som.sfx);
  os.start(t); os.stop(t + dur + 0.03);
}
function ruido(dur, o = {}) {
  const c = Som.ctx, t = c.currentTime + (o.atraso || 0);
  const src = c.createBufferSource(); src.buffer = Som.ruido;
  const f = c.createBiquadFilter();
  f.type = o.filtro || 'bandpass'; f.frequency.setValueAtTime(o.freq || 1200, t); f.Q.value = o.q ?? 1;
  if (o.ate) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.ate), t + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(o.vol ?? 0.2, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(o.canal || Som.sfx);
  src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.03);
}
const acorde = (notas, dur, o, passo = 0) => notas.forEach((n, i) => tom(n, dur, { ...o, atraso: (o.atraso || 0) + i * passo }));

/* ---- biblioteca de efeitos ---- */
const SONS = {
  golpe: () => { ruido(0.07, { vol: 0.34, freq: 900 + Math.random() * 500, q: 0.8 }); tom(150 + Math.random() * 40, 0.08, { tipo: 'sine', vol: 0.34, ate: 60 }); },
  golpeLeve: () => ruido(0.05, { vol: 0.17, freq: 1500 + Math.random() * 600, q: 1 }),
  critico: () => { ruido(0.13, { vol: 0.45, freq: 2400, q: 0.7, ate: 500 }); tom(220, 0.12, { vol: 0.16, ate: 80 }); tom(1320, 0.12, { tipo: 'triangle', vol: 0.12, atraso: 0.02 }); },
  escudo: () => { tom(880, 0.18, { tipo: 'triangle', vol: 0.18 }); tom(1320, 0.15, { tipo: 'triangle', vol: 0.1, atraso: 0.03 }); },
  esquiva: () => ruido(0.11, { vol: 0.14, freq: 3200, q: 2, ate: 700 }),
  cura: () => acorde([523, 659, 784], 0.2, { tipo: 'sine', vol: 0.13 }, 0.05),
  morte: () => { tom(330, 0.36, { vol: 0.15, ate: 70 }); ruido(0.32, { vol: 0.2, freq: 600, ate: 120, filtro: 'lowpass' }); },
  magia: () => { tom(392, 0.16, { vol: 0.11, ate: 784 }); tom(587, 0.22, { tipo: 'triangle', vol: 0.1, atraso: 0.06, ate: 1175 }); },
  fogo: () => { ruido(0.36, { vol: 0.32, freq: 800, q: 0.6, ate: 180, filtro: 'lowpass' }); tom(110, 0.3, { tipo: 'sawtooth', vol: 0.07, ate: 55 }); },
  explosao: () => { ruido(0.55, { vol: 0.5, freq: 1300, ate: 70, filtro: 'lowpass', q: 0.5 }); tom(90, 0.45, { tipo: 'sine', vol: 0.42, ate: 32 }); },
  gelo: () => { tom(1568, 0.12, { tipo: 'triangle', vol: 0.13 }); tom(2093, 0.18, { tipo: 'triangle', vol: 0.09, atraso: 0.04 }); ruido(0.12, { vol: 0.1, freq: 5200, q: 3 }); },
  raio: () => { ruido(0.2, { vol: 0.34, freq: 4200, q: 0.5, ate: 1400, filtro: 'highpass' }); tom(70, 0.22, { tipo: 'sawtooth', vol: 0.12 }); },
  flecha: () => ruido(0.12, { vol: 0.15, freq: 2600, q: 4, ate: 6000 }),
  atordoar: () => acorde([1760, 1320, 1760], 0.06, { vol: 0.05 }, 0.07),
  invocar: () => { tom(196, 0.42, { tipo: 'sawtooth', vol: 0.07, ate: 98 }); tom(233, 0.42, { tipo: 'sawtooth', vol: 0.05, ate: 117, atraso: 0.05 }); },
  renascer: () => acorde([392, 523, 659, 784, 1047], 0.22, { tipo: 'triangle', vol: 0.11 }, 0.06),
  skill: () => { tom(660, 0.08, { vol: 0.09 }); tom(990, 0.1, { vol: 0.07, atraso: 0.05 }); },
  supremo: () => { acorde([262, 330, 392, 523], 0.65, { vol: 0.07, ataque: 0.02 }); ruido(0.6, { vol: 0.24, freq: 300, ate: 3200, q: 0.7 }); tom(65, 0.55, { tipo: 'sine', vol: 0.42, ate: 38 }); },
  conta: () => tom(660, 0.1, { vol: 0.14 }),
  lute: () => { tom(880, 0.28, { vol: 0.14 }); tom(1320, 0.28, { vol: 0.09 }); },
  lenta: () => { tom(140, 1.3, { tipo: 'sine', vol: 0.3, ate: 42 }); ruido(1.3, { vol: 0.16, freq: 900, ate: 110, filtro: 'lowpass' }); },
  vitoria: () => { [523, 659, 784, 1047].forEach((f, i) => { const d = i === 3 ? 0.55 : 0.14; tom(f, d, { vol: 0.13, atraso: i * 0.12 }); tom(f / 2, d, { tipo: 'triangle', vol: 0.13, atraso: i * 0.12 }); }); },
  derrota: () => [392, 349, 311, 262].forEach((f, i) => tom(f, i === 3 ? 0.65 : 0.22, { tipo: 'triangle', vol: 0.16, atraso: i * 0.2 })),
  moeda: () => { tom(988, 0.07, { vol: 0.09 }); tom(1319, 0.17, { vol: 0.09, atraso: 0.07 }); },
  clique: () => tom(1250, 0.025, { vol: 0.035 }),
  nivel: () => acorde([523, 659, 784, 1047, 1319], 0.13, { vol: 0.09 }, 0.07),
  bau: () => { ruido(0.22, { vol: 0.15, freq: 420, filtro: 'lowpass' }); acorde([784, 988, 1175, 1568], 0.26, { tipo: 'triangle', vol: 0.12, atraso: 0.12 }, 0.07); },
  construir: () => [0, 0.13].forEach((a) => { ruido(0.08, { vol: 0.28, freq: 1500, q: 2, atraso: a }); tom(200, 0.08, { vol: 0.1, atraso: a }); }),
  equipar: () => { tom(1046, 0.08, { tipo: 'triangle', vol: 0.11 }); ruido(0.06, { vol: 0.11, freq: 4200, q: 2, atraso: 0.02 }); },
  erro: () => { tom(196, 0.12, { vol: 0.09 }); tom(147, 0.18, { vol: 0.09, atraso: 0.1 }); },
};
const INTERVALO_SOM = { golpe: 0.05, golpeLeve: 0.05, critico: 0.08, esquiva: 0.1, cura: 0.12, flecha: 0.08, morte: 0.1, skill: 0.08, magia: 0.1, gelo: 0.1, raio: 0.06, atordoar: 0.2, clique: 0.03, escudo: 0.1, fogo: 0.12 };
function somTocar(nome) {
  if (!somAtivo() || !SONS[nome]) return;
  const agora = Som.ctx.currentTime;
  if (agora - (Som.ultimo[nome] || 0) < (INTERVALO_SOM[nome] || 0.03)) return;
  Som.ultimo[nome] = agora;
  try { SONS[nome](); } catch (e) { /* o som é opcional: nunca trava o jogo */ }
}

/* ---- vibração (Android; o iPhone não permite pelo navegador) ---- */
let ultimaVibracao = 0;
function vibrar(padrao, forte = false) {
  if (cfgSom().vibrar === false || !navigator.vibrate) return;
  const agora = performance.now();
  if (!forte && agora - ultimaVibracao < 250) return;
  ultimaVibracao = agora;
  try { navigator.vibrate(padrao); } catch (e) { /* ignora */ }
}

/* ---- sons dos eventos da luta ---- */
const SKILL_SOM = {
  bolaFogo: 'fogo', furiaDragao: 'fogo', meteoro: 'fogo', lancaGelo: 'gelo', luz: 'cura', bencaoMenor: 'cura', primeirosSocorros: 'cura',
  juramento: 'renascer', muralha: 'escudo', egideDivina: 'escudo', barreiraArcana: 'escudo', terremoto: 'explosao', correnteEletrica: 'raio',
  olhoTempestade: 'raio', esqueletos: 'invocar', hino: 'magia', gritoGuerra: 'magia', chuva: 'flecha', tempestadeFlechas: 'flecha', flechaVenenosa: 'flecha', eclipse: 'morte',
};
function somDoEvento(ev) {
  switch (ev.tipo) {
    case 'dano':
      if (ev.crit) { somTocar('critico'); if (ev.src && ev.src.team === 0 && ev.valor > ev.alvo.vidaMax * 0.12) vibrar(12); }
      else if (ev.escudo) somTocar('escudo');
      else somTocar(ev.valor > ev.alvo.vidaMax * 0.08 ? 'golpe' : 'golpeLeve');
      break;
    case 'esquiva': somTocar('esquiva'); break;
    case 'cura': if (!ev.pequeno) somTocar('cura'); break;
    case 'morte': somTocar('morte'); if (ev.u.team === 0 && !ev.u.invocacao) vibrar(35); break;
    case 'explosao': somTocar(ev.cor === 'meteoro' ? 'explosao' : 'fogo'); break;
    case 'bomba': case 'golens': somTocar('explosao'); break;
    case 'congelar': case 'estilhaco': somTocar('gelo'); break;
    case 'atordoar': somTocar('atordoar'); break;
    case 'raio': case 'raioCeu': somTocar('raio'); break;
    case 'flechada': case 'flechaCai': case 'adagaCai': somTocar('flecha'); break;
    case 'invocar': somTocar('invocar'); break;
    case 'renascer': somTocar('renascer'); break;
    case 'skill': somTocar(SKILL_SOM[ev.id] || 'skill'); break;
    case 'supremo': somTocar('supremo'); if (ev.u.team === 0) vibrar(50, true); break;
  }
}

/* ---- música das lutas: chiptune em lá menor (Am F C G), 132 bpm ---- */
const MUSICA = {
  bpm: 132,
  baixo: [45, 41, 48, 43],
  arpejo: [[57, 60, 64], [53, 57, 60], [55, 60, 64], [55, 59, 62]],
  melodia: [
    76, 0, 76, 0, 81, 0, 79, 76, 0, 74, 76, 0, 72, 0, 69, 0,
    72, 0, 72, 0, 77, 0, 76, 72, 0, 69, 72, 0, 74, 0, 0, 0,
    76, 0, 76, 0, 79, 0, 81, 79, 0, 76, 74, 0, 72, 0, 74, 0,
    71, 0, 74, 0, 79, 0, 0, 0, 74, 0, 71, 0, 74, 0, 76, 0,
  ],
};
const midiHz = (n) => 440 * Math.pow(2, (n - 69) / 12);
function tocarPasso(p, t) {
  const c = Som.ctx, atraso = Math.max(0, t - c.currentTime), canal = Som.mus, s = p % 16, compasso = Math.floor(p / 16) % 4;
  const passo = 60 / MUSICA.bpm / 4;
  if (s % 8 === 0) tom(110, 0.13, { tipo: 'sine', vol: 0.5, ate: 40, atraso, canal });
  if (s % 8 === 4) ruido(0.12, { vol: 0.22, freq: 1900, q: 0.8, atraso, canal });
  if (s % 2 === 1) ruido(0.03, { vol: 0.07, freq: 8000, filtro: 'highpass', atraso, canal });
  if (s % 2 === 0) tom(midiHz(MUSICA.baixo[compasso] + (s % 4 === 2 ? 12 : 0)), passo * 1.6, { tipo: 'triangle', vol: 0.32, atraso, canal });
  tom(midiHz(MUSICA.arpejo[compasso][s % 3] + 12), passo * 0.9, { vol: 0.035, atraso, canal });
  const m = MUSICA.melodia[p % 64];
  if (m) tom(midiHz(m), passo * 1.7, { vol: 0.075, atraso, canal });
}
function musicaIniciar() {
  if (!somAtivo() || !cfgSom().musica || Som.musica) return;
  const passo = 60 / MUSICA.bpm / 4;
  const M = { p: 0, prox: Som.ctx.currentTime + 0.08 };
  M.timer = setInterval(() => {
    if (!Som.ctx) return;
    while (M.prox < Som.ctx.currentTime + 0.15) { tocarPasso(M.p, M.prox); M.prox += passo; M.p = (M.p + 1) % 64; }
  }, 30);
  Som.musica = M;
}
function musicaParar() { if (Som.musica) { clearInterval(Som.musica.timer); Som.musica = null; } }

