/* ============================ COMBATE ============================
   Simulação em passo fixo (1/30 s) com gerador aleatório com semente.
   Não desenha nada: só emite eventos que a arena transforma em efeitos.
   Assim "Pular luta" roda a mesma simulação sem desenhar. */

const ARENA = { w: 384, h: 216, chao: 78, fundo: 206 };
const E = 256 / 180;   // escala das distâncias (valores calibrados na arena anterior)
const DT = 1 / 30;
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const minPor = (arr, f) => { let best = null, bv = Infinity; for (const o of arr) { const v = f(o); if (v < bv) { bv = v; best = o; } } return best; };
const PAPEIS_CONJURADORES = ['mago', 'curandeira', 'suporte', 'invocador'];

function emit(b, ev) { if (!b.silencioso) b.eventos.push(ev); }

function unidadeBase(b, team, props) {
  return Object.assign({
    uid: b.uidN++, team, face: team === 0 ? 1 : -1, x: 0, y: 0,
    invocacao: false, dono: null, vidaT: Infinity, flags: new Set(), skills: [], skill: null, passiva: null, proj: null,
    crit: 0.05, critDmg: 1.5, esquiva: 0, roubo: 0, alcance: ALCANCE.corpo, papel: 'lutador', linha: 'frente', tatica: 'auto',
    st: { stun: 0, freeze: 0, slow: 0, taunt: null, dots: [], shield: null, buffs: [], debuffs: [] },
    energia: 0, capitao: false, vivo: true, reviver: 0, alvo: null, retarget: 0, atkT: 0.3 + b.rng() * 0.5, atkN: 0, primeiro: true,
    folegoUsado: false, renasceu: false, regenT: 0, curaAcc: 0, curaEmit: 0, dotAcc: {}, dotEmit: 0,
    anim: { atk: 0, cast: 0, hurt: 0, flash: 0, dash: 0, empurrao: 0, moveu: false, morteT: 0, fase: b.rng() * 10 },
    vx: 0, vy: 0, vista: 'lado', vistaT: 0, flanco: 0, ronda: 1, rondaT: 0,
    dano: 0, cura: 0, recebido: 0, abates: 0,
  }, props);
}
function novaUnidade(b, m, team, lado) {
  const s = atributos(m), c = CLASSES[m.classe], T = lado.mods || {};
  const mult = (lado.mult || 1);
  const recarga = Math.min(0.6, s.recarga + (T.recarga || 0));
  const flags = new Set([...s.flags, ...s.unicos, ...(T.flags || [])]);
  const u = unidadeBase(b, team, {
    merc: m, nome: m.nome, cls: m.classe, look: lookDe(m, lado.cor1, lado.cor2),
    vidaMax: Math.round(s.vida * mult * (1 + (T.vidaPct || 0))), atq: s.atq * mult * (1 + (T.atqPct || 0)),
    def: s.def * mult * (1 + (T.defPct || 0)), agi: s.agi * mult * (1 + (T.agiPct || 0)),
    crit: Math.min(0.8, s.crit + (T.crit || 0)), critDmg: s.critDmg, esquiva: Math.min(0.6, s.esquiva + (T.esquiva || 0)), roubo: s.roubo + (T.roubo || 0),
    alcance: s.alcance, flags, passiva: c.passiva, proj: m.campeao === 'okon' ? null : c.proj, papel: c.papelId, linha: m.linha, tatica: m.tatica,
    capitao: m.id === lado.capitaoId, chefe: m.chefe || null, campeao: m.campeao || null,
  });
  const sk0 = skillDe(m);
  u.skills.push({ id: sk0, cd: SKILLS[sk0].cd * (1 - recarga), t: SKILLS[sk0].cd * (0.35 + b.rng() * 0.2), principal: true });
  for (const it of m.pergaminhos || []) {
    const P = PERGAMINHOS[it.pid];
    if (P && P.tipo === 'ativa') u.skills.push({ id: it.pid, cd: P.cd * (1 - recarga), t: P.cd * (0.4 + b.rng() * 0.3) });
  }
  u.skill = u.skills[0];
  u.vida = u.vidaMax;
  if (u.chefe === 'colosso') u.limiares = [0.66, 0.33];
  if (u.chefe === 'selene') { u.elemento = 'fogo'; u.looks = { fogo: lookDe({ ...m, visual: 'selene_fogo' }, lado.cor1, lado.cor2), gelo: lookDe({ ...m, visual: 'selene_gelo' }, lado.cor1, lado.cor2), raio: lookDe({ ...m, visual: 'selene_raio' }, lado.cor1, lado.cor2) }; }
  return u;
}
// lado = { nome, cor1, cor2, simbolo, mercs, capitaoId, mult, mods, bomba, lider }
function criarBatalha(A, B, opts = {}) {
  const b = {
    t: 0, rng: mulberry32(opts.seed ?? ((Math.random() * 1e9) | 0)), units: [], projs: [], atrasos: [], eventos: [],
    fim: false, vencedor: -1, uidN: 1, silencioso: !!opts.silencioso, furia: 1, lados: [A, B],
    modoAuto: opts.modoAuto !== false, focoCapitao: null, pedirSupremo: false, eclipse: 0,
    fenix: [false, false], fenixUsada: [false, false], supremos: [0, 0],
    furiaInicio: opts.furiaInicio || 60, multCura: opts.multCura ?? 1,
  };
  [A, B].forEach((lado, team) => {
    const frente = lado.mercs.filter((m) => m.linha === 'frente');
    const tras = lado.mercs.filter((m) => m.linha !== 'frente');
    const posicionar = (lista, xBase) => lista.forEach((m, i) => {
      const n = lista.length;
      const u = novaUnidade(b, m, team, lado);
      u.x = team === 0 ? xBase : ARENA.w - xBase;
      u.y = clamp(142 + (i - (n - 1) / 2) * (n > 3 ? 28 : n > 2 ? 38 : 46) + (b.rng() * 6 - 3), ARENA.chao, ARENA.fundo);
      b.units.push(u);
    });
    posicionar(frente, 96); posicionar(tras, 56);
    const T = lado.mods || {};
    if ((T.flags || []).includes('fenix')) b.fenix[team] = true;
    for (const u of b.units) {
      if (u.team !== team) continue;
      if ((T.flags || []).includes('estandarte')) u.st.shield = { v: u.vidaMax * 0.15, t: 999 };
      if (u.flags.has('baluarte')) u.st.shield = { v: (u.st.shield ? u.st.shield.v : 0) + u.vidaMax * 0.15, t: 999 };
    }
    if (lado.bomba) b.atrasos.push({ t: 0.7, fn: () => {
      emit(b, { tipo: 'bomba', team });
      for (const o of b.units) if (o.vivo && o.team !== team) aplicarDano(b, null, o, lado.bomba, 'skill');
    } });
  });
  for (const u of b.units) if (u.chefe === 'rei') b.atrasos.push({ t: 1, fn: () => copiarHabilidade(b, u) });
  return b;
}
function copiarHabilidade(b, u) {
  if (!u.vivo) return;
  const alvo = minPor(b.units.filter((o) => o.vivo && o.team !== u.team && !o.invocacao), (o) => -o.atq);
  if (!alvo || !alvo.skills.length) return;
  const id = alvo.skills[0].id, def = SKILLS[id] || PERGAMINHOS[id];
  u.skills.push({ id, cd: def.cd, t: 0.5, copiada: true });
  emit(b, { tipo: 'copia', u, alvo, id });
}

/* ---- atributos efetivos (com bônus e penalidades) ---- */
function atqEf(u) {
  let m = 1;
  for (const bf of u.st.buffs) m += bf.atq || 0;
  for (const df of u.st.debuffs) m += df.atq || 0;
  if (u.passiva === 'furia') m += Math.min(0.30, (1 - u.vida / u.vidaMax) / 3);
  return u.atq * Math.max(0.2, m);
}
function agiEf(u, b) {
  let m = 1;
  for (const bf of u.st.buffs) m += bf.agi || 0;
  if (b && u.flags.has('pressa') && b.t < 6) m += 0.3;
  if (u.flags.has('luaSangue') && u.vida < u.vidaMax * 0.5) m += 0.15;
  return u.agi * m;
}
const intervalo = (u, b) => 1.8 * 50 / (50 + agiEf(u, b)) * (u.st.slow > 0 ? 1.25 : 1);
const velocidade = (u, b) => (19.5 + agiEf(u, b) * 0.26) * E * (u.st.slow > 0 ? 0.6 : 1);
const inimigosDe = (b, u) => b.units.filter((o) => o.vivo && o.team !== u.team);
const aliadosDe = (b, u) => b.units.filter((o) => o.vivo && o.team === u.team);
const daRetaguarda = (o) => !o.invocacao && (o.linha === 'tras' || o.alcance >= 43);
function pctVidaTime(b, team) {
  let v = 0, mx = 0;
  for (const u of b.units) if (u.team === team && !u.invocacao) { v += Math.max(0, u.vida); mx += u.vidaMax; }
  return mx ? v / mx : 0;
}
const timeDePe = (b, team) => b.units.some((u) => u.team === team && !u.invocacao && (u.vivo || u.reviver > 0));

/* ---- passo principal ---- */
function passo(b) {
  if (b.fim) return;
  b.t += DT;
  b.furia = b.t > b.furiaInicio ? 1 + (b.t - b.furiaInicio) / 30 : 1;
  b.eclipse = Math.max(0, b.eclipse - DT);
  for (let i = b.atrasos.length - 1; i >= 0; i--) {
    const a = b.atrasos[i]; a.t -= DT;
    if (a.t <= 0) { b.atrasos.splice(i, 1); a.fn(); }
  }
  for (let i = b.projs.length - 1; i >= 0; i--) {
    const p = b.projs[i];
    if (!p.alvo.vivo) { b.projs.splice(i, 1); continue; }
    const tx = p.alvo.x, ty = p.alvo.y - 15, dx = tx - p.x, dy = ty - p.y, d = Math.hypot(dx, dy), st = p.vel * DT;
    p.ang = Math.atan2(dy, dx);
    if (d <= st + 3) { b.projs.splice(i, 1); p.aoAcertar(); }
    else { p.x += (dx / d) * st; p.y += (dy / d) * st; }
  }
  for (const u of b.units) {
    if (u.vivo) atualizarUnidade(b, u);
    else if (u.reviver > 0) { u.reviver -= DT; if (u.reviver <= 0) reviver(b, u, u.revivePct); }
  }
  const de0 = timeDePe(b, 0), de1 = timeDePe(b, 1);
  if (!de0 || !de1) { b.fim = true; b.vencedor = de0 ? 0 : 1; emit(b, { tipo: 'fim' }); }
  else if (b.t >= 120) { b.fim = true; b.vencedor = pctVidaTime(b, 0) >= pctVidaTime(b, 1) ? 0 : 1; emit(b, { tipo: 'fim', tempo: true }); }
}
function simularAteFim(b) { let n = 0; while (!b.fim && n < 5000) { passo(b); n++; } b.eventos.length = 0; }

function atualizarUnidade(b, u) {
  const st = u.st, a = u.anim;
  a.atk = Math.max(0, a.atk - DT); a.cast = Math.max(0, a.cast - DT); a.hurt = Math.max(0, a.hurt - DT); a.flash = Math.max(0, a.flash - DT);
  a.dash = Math.max(0, a.dash - DT); a.empurrao = Math.max(0, a.empurrao - DT);
  if (u.invocacao) { u.vidaT -= DT; if (u.vidaT <= 0) { morrer(b, u, null, true); return; } }
  if (st.shield) { st.shield.t -= DT; if (st.shield.t <= 0 || st.shield.v <= 0.5) st.shield = null; }
  if (st.taunt) { st.taunt.t -= DT; if (st.taunt.t <= 0 || !st.taunt.src.vivo) st.taunt = null; }
  st.slow = Math.max(0, st.slow - DT); st.stun = Math.max(0, st.stun - DT); st.freeze = Math.max(0, st.freeze - DT);
  for (const lista of [st.buffs, st.debuffs]) for (let i = lista.length - 1; i >= 0; i--) { lista[i].t -= DT; if (lista[i].t <= 0) lista.splice(i, 1); }
  for (let i = st.dots.length - 1; i >= 0; i--) {
    const d = st.dots[i]; d.t -= DT;
    aplicarDano(b, d.src, u, d.dps * DT, 'dot', false, d.tipo);
    if (!u.vivo) return;
    if (d.t <= 0) st.dots.splice(i, 1);
  }
  // Bênção: regenera 1,2% da VIDA máx./s perto de uma Clériga aliada
  u.regenT += DT;
  if (u.regenT >= 1) {
    u.regenT = 0;
    if (u.vida < u.vidaMax && b.units.some((o) => o.vivo && o.team === u.team && o.passiva === 'bencao' && dist(o, u) < 60 * E)) curar(b, null, u, u.vidaMax * 0.012, true);
  }
  if (u.flags.has('folego') && !u.folegoUsado && u.vida < u.vidaMax * 0.3) { u.folegoUsado = true; curar(b, u, u, u.vidaMax * 0.2); }
  if (u.chefe === 'selene') {
    const el = ['fogo', 'gelo', 'raio'][Math.floor(b.t / 8) % 3];
    if (el !== u.elemento) { u.elemento = el; u.look = u.looks[el]; emit(b, { tipo: 'elemento', u, el }); }
  }
  if (st.stun > 0 || st.freeze > 0) return;
  if (u.capitao) u.energia = Math.min(100, u.energia + DT * (u.flags.has('energia') ? 1.3 : 1));
  u.retarget -= DT;
  if (!u.alvo || !u.alvo.vivo || u.retarget <= 0) { u.alvo = escolherAlvo(b, u); u.retarget = 0.6; }
  if (st.taunt) u.alvo = st.taunt.src;
  if (u.capitao && u.team === 0 && b.focoCapitao && b.focoCapitao.vivo && !st.taunt) u.alvo = b.focoCapitao;
  if (!u.alvo) return;
  if (u.capitao && u.skill && u.energia >= 100 && (u.team === 1 || b.modoAuto || b.pedirSupremo)) {
    if (usarSkill(b, u, u.skill, 2)) {
      u.energia = 0;
      if (u.team === 0) b.pedirSupremo = false;
      b.supremos[u.team]++;
      emit(b, { tipo: 'supremo', u });
    }
  }
  for (const sk of u.skills) {
    if (!u.vivo || u.st.stun > 0) break;
    if (sk.t > 0) { sk.t -= DT; continue; }
    if (usarSkill(b, u, sk, 1)) { sk.t = sk.cd; break; }
  }
  if (!u.vivo) return;
  mover(b, u);
  u.atkT -= DT;
  if (u.alvo && u.alvo.vivo && u.atkT <= 0 && dist(u, u.alvo) <= u.alcance + 4) { ataqueBasico(b, u, u.alvo); u.atkT = intervalo(u, b); }
}

function escolherAlvo(b, u) {
  const ini = inimigosDe(b, u);
  if (!ini.length) return null;
  const t = u.tatica && u.tatica !== 'auto' ? u.tatica : (u.papel === 'assassino' ? 'tras' : 'perto');
  if (t === 'fraco') return minPor(ini, (o) => o.vida);
  if (t === 'forte') return minPor(ini, (o) => -o.atq);
  if (t === 'tras') { const tr = ini.filter(daRetaguarda); return tr.length ? minPor(tr, (o) => o.vida) : minPor(ini, (o) => dist(u, o)); }
  return minPor(ini, (o) => dist(u, o));
}
/* ---- movimento: cada papel se posiciona de um jeito ----
   tanque/lutador avançam e rondam o alvo; atiradores, magos e invocadores mantêm distância e recuam;
   assassino flanqueia pela retaguarda; curandeira fica atrás da linha de frente; suporte no meio. */
const LIMITES = { x0: 18, x1: () => ARENA.w - 18 };
function dentroArena(x, y) { return [clamp(x, LIMITES.x0, LIMITES.x1()), clamp(y, ARENA.chao, ARENA.fundo)]; }
function fugirDe(u, o, d = 42) {
  const dx = u.x - o.x, dy = u.y - o.y, n = Math.hypot(dx, dy) || 1;
  let fx = u.x + (dx / n) * d, fy = u.y + (dy / n) * d;
  // perto da parede, foge pela lateral em vez de ficar encurralado
  if (fx < LIMITES.x0 + 6 || fx > LIMITES.x1() - 6) { fx = u.x; fy = u.y + (dy >= 0 ? d : -d); }
  if (fy < ARENA.chao + 4 || fy > ARENA.fundo - 4) { fy = u.y; fx = u.x + (dx >= 0 ? d : -d); }
  return dentroArena(fx, fy);
}
function destinoDe(b, u) {
  const alvo = u.alvo, ini = inimigosDe(b, u), al = aliadosDe(b, u);
  const perto = minPor(ini, (o) => dist(u, o)), dPerto = perto ? dist(u, perto) : 999;
  const papel = u.papel;
  if (papel === 'curandeira') {
    const ferido = minPor(al, (o) => o.vida / o.vidaMax);
    if (perto && dPerto < 30) return { p: fugirDe(u, perto), modo: 'fuga' };
    if (ferido && ferido !== u && ferido.vida / ferido.vidaMax < 0.75 && dist(u, ferido) > 36 * E) return { p: dentroArena(ferido.x - u.face * 16, ferido.y) };
    const frente = minPor(al.filter((o) => o !== u && !o.invocacao && o.alcance <= 31), (o) => (perto ? dist(o, perto) : 0));
    if (frente) { const px = frente.x - u.face * 30, py = frente.y + (u.y > frente.y ? 10 : -10); if (dist(u, { x: px, y: py }) > 10) return { p: dentroArena(px, py) }; }
    if (alvo && dist(u, alvo) > u.alcance) return { p: [alvo.x, alvo.y] };
    return null;
  }
  if (papel === 'atirador' || papel === 'mago' || papel === 'invocador') {
    if (perto && dPerto < u.alcance * 0.42) return { p: fugirDe(u, perto, 46), modo: 'fuga' };
    if (alvo && dist(u, alvo) > u.alcance * 0.92) return { p: [alvo.x, alvo.y] };
    return null;
  }
  if (papel === 'suporte') {
    if (perto && dPerto < 24) return { p: fugirDe(u, perto, 36), modo: 'fuga' };
    if (alvo && dist(u, alvo) > u.alcance * 0.9) return { p: [alvo.x, alvo.y] };
    return null;
  }
  if (papel === 'assassino' && alvo && dist(u, alvo) > u.alcance + 4) {
    const d = dist(u, alvo);
    if (d > 36) {
      // há alguém no caminho? então contorna por cima ou por baixo
      const bloq = ini.some((o) => o !== alvo && dist(o, u) < d && distSegmento(o, u, alvo) < 18);
      if (bloq) {
        if (!u.flanco) u.flanco = alvo.y > (ARENA.chao + ARENA.fundo) / 2 ? -1 : 1;
        return { p: dentroArena(u.x + (alvo.x - u.x) * 0.5, alvo.y + u.flanco * 46), modo: 'flanco' };
      }
    }
    return { p: pontoDeAtaque(b, u, alvo) };
  }
  if (alvo && dist(u, alvo) > u.alcance) return { p: pontoDeAtaque(b, u, alvo) };
  // no alcance: ronda o alvo devagar enquanto espera o próximo golpe
  if (alvo && u.atkT > 0.3 && !u.invocacao) {
    u.rondaT = (u.rondaT || 0) - DT;
    if (u.rondaT <= 0) { u.rondaT = 0.9 + b.rng() * 0.8; u.ronda = b.rng() < 0.5 ? -1 : 1; }
    return { p: dentroArena(u.x, u.y + u.ronda * 12), modo: 'ronda' };
  }
  return null;
}
// Ponto ao redor do alvo onde esta unidade vai parar para bater: cada atacante
// pega uma "vaga" num ângulo diferente, assim o grupo cerca o alvo em vez de empilhar.
function pontoDeAtaque(b, u, alvo) {
  const ataca = b.units.filter((o) => o.vivo && o.team === u.team && o.alvo === alvo && o.alcance <= 31 && !o.invocacao);
  const n = Math.max(1, ataca.length), k = Math.max(0, ataca.indexOf(u));
  const base = Math.atan2(u.y - alvo.y, u.x - alvo.x);
  const lado = Math.cos(base) >= 0 ? 0 : Math.PI;          // de que lado do alvo estamos
  const leque = n === 1 ? 0 : (k - (n - 1) / 2) * (Math.PI / (n + 1)) * 1.6;
  const ang = lado + leque, r = Math.max(10, u.alcance - 5);
  return dentroArena(alvo.x + Math.cos(ang) * r, alvo.y + Math.sin(ang) * r * 0.7);
}
function distSegmento(p, a, b2) {
  const dx = b2.x - a.x, dy = b2.y - a.y, l2 = dx * dx + dy * dy || 1;
  const t = clamp(((p.x - a.x) * dx + (p.y - a.y) * dy) / l2, 0, 1);
  return Math.hypot(p.x - (a.x + dx * t), p.y - (a.y + dy * t));
}
function mover(b, u) {
  const dest = destinoDe(b, u);
  const vel = velocidade(u, b) * (dest && dest.modo === 'ronda' ? 0.35 : dest && dest.modo === 'fuga' ? 1.1 : 1);
  let mx = 0, my = 0;
  if (dest) {
    const [tx, ty] = dest.p;
    const dx = tx - u.x, dy = ty - u.y, d = Math.hypot(dx, dy) || 1;
    mx = (dx / d) * vel * DT; my = (dy / d) * vel * DT;
    if (Math.abs(mx) > Math.abs(dx)) mx = dx;
    if (Math.abs(my) > Math.abs(dy)) my = dy;
  }
  // separação entre unidades
  const sep = 16;
  for (const o of b.units) {
    if (o === u || !o.vivo) continue;
    const dx = u.x - o.x, dy = (u.y - o.y) * 1.6, d = Math.hypot(dx, dy);   // elipse: afasta mais na vertical
    if (d < sep) {
      if (d < 0.01) { mx += b.rng() - 0.5; my += b.rng() - 0.5; }
      else { const f = ((sep - d) / sep) * 40 * DT; mx += (dx / d) * f; my += (dy / d) * f * 0.8; }
    }
  }
  // empurrão (velocidade residual com atrito)
  if (u.vx || u.vy) {
    mx += u.vx * DT; my += u.vy * DT;
    const k = Math.max(0, 1 - 7 * DT); u.vx *= k; u.vy *= k;
    if (Math.abs(u.vx) < 2 && Math.abs(u.vy) < 2) { u.vx = 0; u.vy = 0; }
  }
  [u.x, u.y] = dentroArena(u.x + mx, u.y + my);
  const andou = Math.abs(mx) + Math.abs(my) > 0.15;
  u.anim.moveu = andou && !(u.vx || u.vy);
  // direção do corpo: pelo movimento quando anda, senão pelo alvo
  let dx = 0, dy = 0;
  // ao rondar (passo lateral) continua encarando o alvo, como um lutador estudando o oponente
  if (andou && !(u.vx || u.vy) && !(dest && dest.modo === 'ronda')) { dx = mx; dy = my; }
  else if (u.alvo && u.alvo.vivo) { dx = u.alvo.x - u.x; dy = u.alvo.y - u.y; }
  if (dx || dy) {
    const cand = Math.abs(dy) > Math.abs(dx) * 1.1 ? (dy < 0 ? 'costas' : 'frente') : 'lado';
    if (cand !== u.vista) { u.vistaT = (u.vistaT || 0) + DT; if (u.vistaT > 0.18) { u.vista = cand; u.vistaT = 0; } } else u.vistaT = 0;
    if (cand === 'lado' || Math.abs(dx) > 0.8) u.face = dx >= 0 ? 1 : -1;
  }
}
function empurrar(u, de, forca) {
  if (!u.vivo || u.chefe) return;
  const dx = u.x - de.x, dy = u.y - de.y, d = Math.hypot(dx, dy) || 1;
  u.vx += (dx / d) * forca; u.vy += (dy / d) * forca;
  u.anim.empurrao = Math.max(u.anim.empurrao, 0.35);
}

/* ---- ataque básico ---- */
function lancarProjetil(b, src, alvo, tipo, aoAcertar, vel = 176) {
  const ox = src.vista === 'lado' ? src.face * 10 : src.vista === 'frente' ? 6 : -6, oy = src.vista === 'costas' ? -22 : -19;
  b.projs.push({ tipo, x: src.x + ox, y: src.y + oy, alvo, vel, aoAcertar, src, ang: 0 });
}
function ataqueBasico(b, u, alvo) {
  u.anim.atk = 0.32; u.atkN++; encarar(u, alvo);
  const golpe = () => {
    if (!alvo.vivo) return;
    if (u.proj) lancarProjetil(b, u, alvo, u.proj, () => acertoBasico(b, u, alvo));
    else { emit(b, { tipo: 'corte', u, alvo }); acertoBasico(b, u, alvo); }
  };
  b.atrasos.push({ t: 0.11, fn: () => { if (u.vivo && u.st.stun <= 0) golpe(); } });
  if (u.flags.has('eco') && u.atkN % 5 === 0) b.atrasos.push({ t: 0.26, fn: () => { if (u.vivo) golpe(); } });
  if (u.passiva === 'ritmo' && u.atkN % 4 === 0) {
    for (const o of b.units) if (o.vivo && o.team === u.team && o !== u) for (const sk of o.skills) sk.t = Math.max(0, sk.t - 0.75);
    emit(b, { tipo: 'ritmo', u });
  }
}
// Vira o corpo (vista + lado) para o alvo
function encarar(u, t) {
  const dx = t.x - u.x, dy = t.y - u.y;
  u.vista = Math.abs(dy) > Math.abs(dx) * 1.1 ? (dy < 0 ? 'costas' : 'frente') : 'lado'; u.vistaT = 0;
  if (Math.abs(dx) > 0.8) u.face = dx >= 0 ? 1 : -1;
}
function acertoBasico(b, u, alvo) {
  if (!alvo.vivo) return;
  const critForcado = u.passiva === 'olho' && u.primeiro;
  u.primeiro = false;
  const d = causarDano(b, u, alvo, 1, { esquivavel: true, critForcado, basico: true });
  if (d <= 0) return;
  if (u.capitao) u.energia = Math.min(100, u.energia + 4 * (u.flags.has('energia') ? 1.3 : 1));
  if (u.passiva === 'inverno' && alvo.vivo && alvo.st.slow > 0 && b.rng() < 0.30) { alvo.st.freeze = 1.5; emit(b, { tipo: 'congelar', alvo }); }
  if (u.flags.has('chama') && alvo.vivo && b.rng() < 0.15) aplicarDot(b, u, alvo, 'queimar', 0.08, 3);
  if (u.flags.has('brasaRel') && alvo.vivo && b.rng() < 0.10) aplicarDot(b, u, alvo, 'queimar', 0.08, 3);
  if (u.chefe === 'selene' && alvo.vivo) {
    if (u.elemento === 'fogo') aplicarDot(b, u, alvo, 'queimar', 0.1, 3);
    else if (u.elemento === 'gelo') alvo.st.slow = Math.max(alvo.st.slow, 2);
    else {
      const s2 = minPor(b.units.filter((o) => o.vivo && o !== alvo && o.team === alvo.team && dist(o, alvo) < 50 * E), (o) => dist(o, alvo));
      if (s2) { emit(b, { tipo: 'raio', de: alvo, para: s2 }); causarDano(b, u, s2, 0.5); }
    }
  }
  if (u.passiva === 'estocada') {
    const seg = b.units.filter((o) => o.vivo && o !== alvo && o.team === alvo.team && dist(o, alvo) < 17 * E);
    const s2 = minPor(seg, (o) => -dist(o, u));
    if (s2) causarDano(b, u, s2, 1, { esquivavel: true, basico: true });
  }
}

/* ---- dano, cura, morte e ressurreição ---- */
function causarDano(b, src, alvo, mult, opt = {}) {
  if (!alvo.vivo) return 0;
  if (opt.esquivavel && b.rng() < alvo.esquiva) { emit(b, { tipo: 'esquiva', alvo }); return 0; }
  let d = atqEf(src) * mult * 100 / (100 + alvo.def) * (0.9 + b.rng() * 0.2);
  let crit = false;
  if (opt.critForcado || b.rng() < src.crit) { crit = true; d *= src.critDmg; }
  if (alvo.passiva === 'peleAco') d *= 0.92;
  if (alvo.st.dots.some((x) => x.amp)) d *= 1.1;
  const baixa = alvo.vida < alvo.vidaMax * 0.3;
  if (baixa && src.flags.has('executor')) d *= 1.4;
  if (baixa && src.flags.has('ceifador')) d *= 1.5;
  d = Math.max(1, Math.round(d * b.furia));
  return aplicarDano(b, src, alvo, d, opt.basico ? 'basico' : 'skill', crit);
}
function aplicarDano(b, src, alvo, d, tipo, crit = false, dotTipo = null) {
  if (!alvo.vivo) return 0;
  let abs = 0;
  if (alvo.st.shield) {
    abs = Math.min(alvo.st.shield.v, d); alvo.st.shield.v -= abs; d -= abs;
    if (alvo.st.shield.v <= 0.5) alvo.st.shield = null;
  }
  alvo.vida -= d; alvo.recebido += d + abs;
  if (src) { src.dano += d + abs; if (tipo !== 'dot' && d + abs > (src.maiorGolpe || 0)) src.maiorGolpe = d + abs; }
  if (alvo.capitao && d > 0) alvo.energia = Math.min(100, alvo.energia + 60 * d / alvo.vidaMax);
  if (tipo === 'dot') {
    alvo.dotAcc[dotTipo] = (alvo.dotAcc[dotTipo] || 0) + d;
    if (b.t - alvo.dotEmit > 0.6) {
      for (const k in alvo.dotAcc) if (alvo.dotAcc[k] >= 1) { emit(b, { tipo: 'dot', alvo, valor: Math.round(alvo.dotAcc[k]), dot: k }); alvo.dotAcc[k] = 0; }
      alvo.dotEmit = b.t;
    }
  } else {
    alvo.anim.flash = 0.08; alvo.anim.hurt = Math.max(alvo.anim.hurt, 0.18);
    if (tipo === 'skill' && d > alvo.vidaMax * 0.15 && src && src !== alvo) empurrar(alvo, src, 40);
    emit(b, { tipo: 'dano', alvo, src, valor: Math.round(d + abs), crit, escudo: abs > 0 });
  }
  if (src && src.vivo && src.roubo > 0 && tipo !== 'dot' && d > 0) curar(b, src, src, d * src.roubo, true);
  if (src && src.vivo && d > 0 && tipo === 'basico' && src.alcance <= 31) {
    const refl = (alvo.flags.has('espinhos') ? 0.15 : 0) + (alvo.flags.has('espinhos20') ? 0.2 : 0);
    if (refl > 0) aplicarDano(b, alvo, src, Math.max(1, Math.round(d * refl)), 'reflexo');
  }
  if (alvo.chefe === 'barao' && src && src.vivo && d > 0 && (tipo === 'basico' || tipo === 'skill')) aplicarDano(b, alvo, src, Math.max(1, Math.round(d * 0.2)), 'reflexo');
  if (alvo.vida <= 0) morrer(b, alvo, src);
  else if (alvo.limiares && alvo.limiares.length && alvo.vida / alvo.vidaMax < alvo.limiares[0]) {
    alvo.limiares.shift();
    for (let i = 0; i < 2; i++) criarInvocacao(b, alvo, i, 2, 'golem', 0.3, Infinity);
    emit(b, { tipo: 'golens', u: alvo });
  }
  return d + abs;
}
function curar(b, src, alvo, qtd, pequeno = false) {
  if (!alvo.vivo) return 0;
  qtd *= b.multCura;
  const real = Math.min(alvo.vidaMax - alvo.vida, qtd);
  if (real <= 0) return 0;
  alvo.vida += real;
  if (src) src.cura += real;
  if (pequeno) {
    alvo.curaAcc += real;
    if (alvo.curaAcc >= 4 && b.t - alvo.curaEmit > 0.5) { emit(b, { tipo: 'cura', alvo, valor: Math.round(alvo.curaAcc), pequeno: true }); alvo.curaAcc = 0; alvo.curaEmit = b.t; }
  } else emit(b, { tipo: 'cura', alvo, valor: Math.round(real) });
  return real;
}
function aplicarDot(b, src, alvo, tipo, frac, dur) {
  if (!alvo.vivo) return;
  const dps = atqEf(src) * frac, amp = tipo === 'queimar' && src.passiva === 'brasa';
  const ex = alvo.st.dots.find((d) => d.tipo === tipo);
  if (!ex) alvo.st.dots.push({ tipo, dps, t: dur, src, amp });
  else { ex.dps = Math.max(ex.dps, dps); ex.t = Math.max(ex.t, dur); ex.amp = ex.amp || amp; if (dps >= ex.dps) ex.src = src; }
}
function morrer(b, u, src, expirou = false) {
  if (!u.vivo) return;
  u.vivo = false; u.vida = 0; u.anim.morteT = 0.0001; u.st.shield = null; u.st.dots = []; u.st.buffs = []; u.st.debuffs = [];
  emit(b, { tipo: expirou ? 'expirou' : 'morte', u });
  if (expirou) return;
  if (src && src !== u) src.abates++;
  if (u.invocacao) return;
  for (const o of b.units) {
    if (o.vivo && o.team !== u.team && o.passiva === 'colheita') {
      for (const al of b.units) if (al.vivo && al.team === o.team) curar(b, o, al, al.vidaMax * 0.05, true);
      emit(b, { tipo: 'colheita', u: o });
    }
  }
  if (u.chefe === 'corvina') {
    const irma = b.units.find((o) => o.vivo && o.chefe === 'corvina' && o !== u);
    if (irma) { irma.st.buffs.push({ atq: 0.5, t: 999 }); emit(b, { tipo: 'furiaGemea', u: irma }); }
  }
  if (u.flags.has('renascer') && !u.renasceu) { u.renasceu = true; u.reviver = 0.9; u.revivePct = 0.5; }
  else if (b.fenix[u.team] && !b.fenixUsada[u.team]) { b.fenixUsada[u.team] = true; u.reviver = 0.9; u.revivePct = 0.4; }
}
function reviver(b, u, pct) {
  u.vivo = true; u.reviver = 0; u.vida = Math.max(1, u.vidaMax * pct); u.anim.morteT = 0;
  u.st.stun = 0; u.st.freeze = 0; u.st.slow = 0; u.alvo = null;
  emit(b, { tipo: 'renascer', u });
}

/* ---- invocações ---- */
function criarInvocacao(b, dono, i, n, tipo, frac, vidaT) {
  const lado = b.lados[dono.team];
  const u = unidadeBase(b, dono.team, {
    nome: tipo === 'golem' ? 'Golem' : 'Esqueleto', cls: tipo, look: `${tipo}|0|0|${lado.cor1}|${lado.cor2}`, invocacao: true, dono, vidaT,
    x: clamp(dono.x + dono.face * (14 + i * 4) * (tipo === 'golem' ? -1 : 1), LIMITES.x0, LIMITES.x1()), y: clamp(dono.y + (i - (n - 1) / 2) * 18, ARENA.chao, ARENA.fundo),
    face: dono.face, vidaMax: Math.max(1, Math.round(dono.vidaMax * frac)), atq: dono.atq * frac, def: dono.def * frac, agi: dono.agi * (tipo === 'golem' ? 0.3 : frac),
    tatica: 'perto',
  });
  u.vida = u.vidaMax;
  b.units.push(u);
  emit(b, { tipo: 'invocar', u });
}

/* ---- habilidades (p = 1 normal, p = 2 SUPREMO) ---- */
function usarSkill(b, u, sk, p) {
  const id = sk.id, sup = p === 2;
  const ini = inimigosDe(b, u);
  if (!ini.length) return false;
  const conj = PAPEIS_CONJURADORES.includes(u.papel);
  const alvo = u.alvo && u.alvo.vivo ? u.alvo : null;
  const ev = (extra) => {
    if (conj) u.anim.cast = 0.4; else u.anim.atk = 0.32;
    const t = (extra && extra.alvo) || alvo;
    if (t && t !== u) encarar(u, t);
    emit(b, Object.assign({ tipo: 'skill', id, u, sup, ang: t && t !== u ? Math.atan2(t.y - u.y, t.x - u.x) : (u.face < 0 ? Math.PI : 0) }, extra));
  };
  const aliados = () => aliadosDe(b, u);
  const aoAlcance = (extra = 4) => alvo && dist(u, alvo) <= u.alcance + extra;
  switch (id) {
    /* --- habilidades de classe --- */
    case 'muralha': {
      const perto = ini.filter((o) => dist(u, o) < 35 * E);
      if (!sup && !perto.length && u.vida > u.vidaMax * 0.7) return false;
      u.st.shield = { v: u.vidaMax * 0.2 * p, t: 5 };
      ev({});
      for (const o of ini) if (dist(u, o) < (sup ? 42 : 30) * E) { o.st.taunt = { src: u, t: sup ? 4 : 2 }; o.alvo = u; }
      return true;
    }
    case 'redemoinho': {
      const raio = (sup ? 24 : 18) * E;
      const perto = ini.filter((o) => dist(u, o) <= raio);
      if (!perto.length) return false;
      ev({ raio });
      b.atrasos.push({ t: 0.16, fn: () => { if (!u.vivo) return; for (const o of ini) if (o.vivo && dist(u, o) <= raio + 4) { causarDano(b, u, o, 1.4 * p); empurrar(o, u, sup ? 40 : 16); } } });
      return true;
    }
    case 'investida': {
      if (!alvo) return false;
      const d = dist(u, alvo);
      if (d > 82 * E || (!sup && d < 14 * E)) return false;
      const x0 = u.x, y0 = u.y, dir = alvo.x >= u.x ? 1 : -1;
      [u.x, u.y] = dentroArena(alvo.x - dir * 14, alvo.y); u.face = dir; u.vista = 'lado'; u.anim.dash = 0.3;
      ev({ x0, y0 });
      emit(b, { tipo: 'corte', u, alvo, forte: true });
      causarDano(b, u, alvo, 1.5 * p);
      if (alvo.vivo) { alvo.vx += dir * 110 * p; alvo.anim.empurrao = 0.45; alvo.st.stun = Math.max(alvo.st.stun, p); emit(b, { tipo: 'atordoar', alvo }); }
      return true;
    }
    case 'chuva': {
      if (!alvo || dist(u, alvo) > u.alcance + 21) return false;
      const tx = alvo.x, ty = alvo.y, raio = (sup ? 21 : 17) * E, ondas = 3 * p;
      ev({ tx, ty, raio, dur: 0.3 + ondas * 0.3 });
      for (let i = 0; i < ondas; i++) b.atrasos.push({ t: 0.3 + i * 0.3, fn: () => {
        emit(b, { tipo: 'flechada', tx, ty, raio });
        for (const o of b.units) if (o.vivo && o.team !== u.team && Math.hypot(o.x - tx, o.y - ty) <= raio) causarDano(b, u, o, 0.6);
      } });
      return true;
    }
    case 'bolaFogo': {
      if (!aoAlcance(14)) return false;
      ev({});
      const raio = (sup ? 18 : 12) * E, alvoF = alvo;
      lancarProjetil(b, u, alvoF, sup ? 'bolaFogoG' : 'bolaFogo', () => {
        emit(b, { tipo: 'explosao', x: alvoF.x, y: alvoF.y - 12, raio, cor: 'fogo' });
        causarDano(b, u, alvoF, 1.8 * p);
        aplicarDot(b, u, alvoF, 'queimar', 0.10 * p, 4);
        for (const o of b.units) if (o.vivo && o !== alvoF && o.team !== u.team && Math.hypot(o.x - alvoF.x, o.y - alvoF.y) <= raio) { causarDano(b, u, o, 0.9 * p); empurrar(o, alvoF, 50); if (sup) aplicarDot(b, u, o, 'queimar', 0.10, 4); }
      }, 128);
      return true;
    }
    case 'lancaGelo': {
      if (!aoAlcance(14)) return false;
      ev({});
      const alvoG = alvo;
      lancarProjetil(b, u, alvoG, sup ? 'geloG' : 'gelo', () => {
        emit(b, { tipo: 'estilhaco', x: alvoG.x, y: alvoG.y - 12, sup });
        causarDano(b, u, alvoG, 2.0 * p);
        if (alvoG.vivo) { alvoG.st.slow = Math.max(alvoG.st.slow, 3); if (sup) { alvoG.st.freeze = 1.5; emit(b, { tipo: 'congelar', alvo: alvoG }); } }
        if (sup) for (const o of b.units) if (o.vivo && o !== alvoG && o.team !== u.team && Math.hypot(o.x - alvoG.x, o.y - alvoG.y) <= 17 * E) { o.st.slow = Math.max(o.st.slow, 3); causarDano(b, u, o, 0.7); }
      }, 160);
      return true;
    }
    case 'luz': {
      const al = aliados(), ferido = minPor(al, (o) => o.vida / o.vidaMax);
      if (!ferido || (!sup && ferido.vida / ferido.vidaMax > 0.7)) return false;
      ev({ alvo: ferido });
      curar(b, u, ferido, atqEf(u) * 2.8 * p);
      if (sup) for (const o of al) if (o !== ferido) curar(b, u, o, atqEf(u) * 0.8);
      return true;
    }
    case 'passo': {
      if (!sup && b.t < 1.5) return false;
      const tr = ini.filter(daRetaguarda);
      const t2 = tr.length ? minPor(tr, (o) => o.vida) : minPor(ini, (o) => o.vida);
      const x0 = u.x, y0 = u.y, lado = t2.team === 1 ? 1 : -1;
      [u.x, u.y] = dentroArena(t2.x + lado * 13, t2.y); u.face = -lado; u.vista = 'lado'; u.alvo = t2; u.retarget = 1.5; u.anim.dash = 0.3;
      ev({ x0, y0, alvo: t2 });
      emit(b, { tipo: 'corte', u, alvo: t2, forte: true });
      causarDano(b, u, t2, 2.0 * p);
      return true;
    }
    case 'hino': {
      if (!sup && b.t < 2) return false;
      const al = aliados();
      for (const o of al) o.st.buffs.push({ atq: 0.30 * p, agi: 0.30 * p, t: 8 });
      ev({ aliados: al });
      return true;
    }
    case 'esqueletos': {
      const meus = b.units.filter((o) => o.vivo && o.dono === u).length;
      const max = sup ? 6 : 4;
      if (meus >= max) return false;
      const n = Math.min(2 * p, max - meus);
      ev({});
      for (let i = 0; i < n; i++) criarInvocacao(b, u, i, n, 'esqueleto', 0.36, 12);
      return true;
    }
    /* --- Campeões --- */
    case 'terremoto': {
      if (!sup && b.t < 2) return false;
      ev({});
      b.atrasos.push({ t: 0.25, fn: () => { for (const o of ini) if (o.vivo) { o.st.stun = Math.max(o.st.stun, 2 + (p - 1)); o.anim.empurrao = 0.4; emit(b, { tipo: 'atordoar', alvo: o }); } } });
      for (const o of aliados()) o.st.shield = { v: (o.st.shield ? o.st.shield.v : 0) + o.vidaMax * 0.15 * p, t: 6 };
      return true;
    }
    case 'tempestadeFlechas': {
      ev({});
      for (let i = 0; i < 12 * p; i++) b.atrasos.push({ t: 0.15 + i * 0.06, fn: () => {
        const vivos = b.units.filter((o) => o.vivo && o.team !== u.team); if (!vivos.length) return;
        const o = vivos[Math.floor(b.rng() * vivos.length)];
        emit(b, { tipo: 'flechaCai', alvo: o });
        causarDano(b, u, o, 0.7);
      } });
      return true;
    }
    case 'milPalmas': {
      if (!aoAlcance(6)) return false;
      ev({ alvo });
      const golpes = 10 * p, alvoM = alvo;
      for (let i = 0; i < golpes; i++) b.atrasos.push({ t: 0.05 + i * 0.07, fn: () => {
        if (!u.vivo || !alvoM.vivo) return;
        u.anim.atk = 0.2; emit(b, { tipo: 'corte', u, alvo: alvoM });
        causarDano(b, u, alvoM, 0.45);
        if (i === golpes - 1 && alvoM.vivo) { alvoM.st.stun = Math.max(alvoM.st.stun, 1.5 * p); emit(b, { tipo: 'atordoar', alvo: alvoM }); }
      } });
      return true;
    }
    case 'juramento': {
      const caidos = b.units.filter((o) => !o.vivo && !o.invocacao && o.team === u.team && o.reviver <= 0);
      const al = aliados();
      if (!sup && !caidos.length && !al.some((o) => o.vida < o.vidaMax * 0.6)) return false;
      ev({});
      caidos.slice(0, sup ? 2 : 1).forEach((o) => reviver(b, o, 0.5));
      for (const o of aliados()) curar(b, u, o, o.vidaMax * 0.3 * (sup ? 1.6 : 1));
      return true;
    }
    case 'eclipse': {
      const lim = sup ? 0.4 : 0.25;
      if (!sup && !ini.some((o) => o.vida < o.vidaMax * lim) && b.t < 4) return false;
      ev({}); b.eclipse = 1.2;
      b.atrasos.push({ t: 0.45, fn: () => { for (const o of ini) {
        if (!o.vivo) continue;
        if (o.vida < o.vidaMax * lim) { emit(b, { tipo: 'execucao', alvo: o }); aplicarDano(b, u, o, Math.ceil(o.vida + (o.st.shield ? o.st.shield.v : 0)), 'skill', true); }
        else causarDano(b, u, o, 1.5 * p);
      } } });
      return true;
    }
    /* --- Pergaminhos --- */
    case 'golpeFirme': {
      if (!aoAlcance(4)) return false;
      ev({});
      const a2 = alvo;
      if (u.proj) lancarProjetil(b, u, a2, u.proj, () => causarDano(b, u, a2, 1.5));
      else b.atrasos.push({ t: 0.1, fn: () => { if (!u.vivo || !a2.vivo) return; emit(b, { tipo: 'corte', u, alvo: a2, forte: true }); causarDano(b, u, a2, 1.5); } });
      return true;
    }
    case 'primeirosSocorros': {
      if (u.vida > u.vidaMax * 0.6) return false;
      ev({ alvo: u }); curar(b, u, u, u.vidaMax * 0.15);
      return true;
    }
    case 'gritoIntimidador': {
      const perto = ini.filter((o) => dist(u, o) < 50 * E);
      if (!perto.length) return false;
      ev({});
      for (const o of perto) o.st.debuffs.push({ atq: -0.15, t: 4 });
      return true;
    }
    case 'flechaVenenosa': {
      if (!aoAlcance(10)) return false;
      ev({}); const a2 = alvo;
      lancarProjetil(b, u, a2, 'veneno', () => { causarDano(b, u, a2, 1); aplicarDot(b, u, a2, 'veneno', 0.2, 4); });
      return true;
    }
    case 'gritoGuerra': {
      if (b.t < 2) return false;
      const al = aliados(); ev({ aliados: al });
      for (const o of al) o.st.buffs.push({ atq: 0.12, t: 6 });
      return true;
    }
    case 'corteSangrento': {
      if (!aoAlcance(5)) return false;
      ev({}); const aS = alvo;
      b.atrasos.push({ t: 0.1, fn: () => { if (!u.vivo || !aS.vivo) return; emit(b, { tipo: 'corte', u, alvo: aS, forte: true }); causarDano(b, u, aS, 1.2); aplicarDot(b, u, aS, 'sangrar', 0.15, 5); } });
      return true;
    }
    case 'bencaoMenor': {
      const ferido = minPor(aliados(), (o) => o.vida / o.vidaMax);
      if (!ferido || ferido.vida / ferido.vidaMax > 0.7) return false;
      ev({ alvo: ferido }); curar(b, u, ferido, atqEf(u) * 1.5);
      return true;
    }
    case 'correnteEletrica': {
      if (!aoAlcance(20)) return false;
      ev({});
      let atual = alvo; const atingidos = [];
      for (let i = 0; i < 3 && atual; i++) {
        atingidos.push(atual);
        const de = i === 0 ? u : atingidos[i - 1];
        emit(b, { tipo: 'raio', de, para: atual });
        causarDano(b, u, atual, 0.9);
        atual = minPor(b.units.filter((o) => o.vivo && o.team !== u.team && !atingidos.includes(o) && dist(o, atual) < 50 * E), (o) => dist(o, atual));
      }
      return true;
    }
    case 'barreiraArcana': {
      const ferido = minPor(aliados().filter((o) => !o.st.shield), (o) => o.vida / o.vidaMax);
      if (!ferido || ferido.vida / ferido.vidaMax > 0.75) return false;
      ev({ alvo: ferido }); ferido.st.shield = { v: ferido.vidaMax * 0.25, t: 6 };
      return true;
    }
    case 'golpeAtordoante': {
      if (!aoAlcance(5)) return false;
      ev({}); const aA = alvo;
      b.atrasos.push({ t: 0.1, fn: () => { if (!u.vivo || !aA.vivo) return; emit(b, { tipo: 'corte', u, alvo: aA, forte: true }); causarDano(b, u, aA, 1.3); if (aA.vivo) { aA.st.stun = Math.max(aA.st.stun, 1.2); emit(b, { tipo: 'atordoar', alvo: aA }); } } });
      return true;
    }
    case 'meteoro': {
      if (!alvo || dist(u, alvo) > u.alcance + 28) return false;
      const tx = alvo.x, ty = alvo.y, raio = 30 * E;
      ev({ tx, ty, raio, dur: 0.7 });
      b.atrasos.push({ t: 0.6, fn: () => {
        emit(b, { tipo: 'explosao', x: tx, y: ty - 6, raio, cor: 'meteoro' });
        for (const o of b.units) if (o.vivo && o.team !== u.team && Math.hypot(o.x - tx, o.y - ty) <= raio) { causarDano(b, u, o, 2.5); empurrar(o, { x: tx, y: ty }, 70); if (o.vivo) o.st.stun = Math.max(o.st.stun, 1); }
      } });
      return true;
    }
    case 'chuvaLaminas': {
      ev({});
      for (let i = 0; i < 5; i++) b.atrasos.push({ t: 0.1 + i * 0.09, fn: () => {
        const vivos = b.units.filter((o) => o.vivo && o.team !== u.team); if (!vivos.length) return;
        const o = vivos[Math.floor(b.rng() * vivos.length)];
        emit(b, { tipo: 'adagaCai', alvo: o }); causarDano(b, u, o, 0.8);
      } });
      return true;
    }
    case 'furiaDragao': {
      const foco = alvo || minPor(ini, (o) => dist(u, o));
      const ang = Math.atan2(foco.y - u.y, foco.x - u.x);
      const noCone = (o) => dist(u, o) < 70 * E && Math.abs(Math.atan2(Math.sin(Math.atan2(o.y - u.y, o.x - u.x) - ang), Math.cos(Math.atan2(o.y - u.y, o.x - u.x) - ang))) < 0.6;
      if (!ini.some(noCone)) return false;
      ev({ alvo: foco, cone: true });
      b.atrasos.push({ t: 0.2, fn: () => { if (!u.vivo) return; for (const o of ini) if (o.vivo && noCone(o)) { causarDano(b, u, o, 4); aplicarDot(b, u, o, 'queimar', 0.25, 5); empurrar(o, u, 40); } } });
      return true;
    }
    case 'olhoTempestade': {
      ev({});
      for (let i = 0; i < 6; i++) b.atrasos.push({ t: 0.15 + i * 0.15, fn: () => {
        const vivos = b.units.filter((o) => o.vivo && o.team !== u.team); if (!vivos.length) return;
        const o = vivos[Math.floor(b.rng() * vivos.length)];
        emit(b, { tipo: 'raioCeu', alvo: o }); causarDano(b, u, o, 1.2);
        if (o.vivo && b.rng() < 0.2) { o.st.stun = Math.max(o.st.stun, 1); emit(b, { tipo: 'atordoar', alvo: o }); }
      } });
      return true;
    }
    case 'egideDivina': {
      if (b.t < 1) return false;
      const al = aliados(); ev({ aliados: al });
      for (const o of al) o.st.shield = { v: (o.st.shield ? o.st.shield.v : 0) + o.vidaMax * 0.2, t: 6 };
      return true;
    }
  }
  return false;
}

// Resumo de uma batalha (invocações creditam o dono)
function resumoBatalha(b) {
  const porTime = [[], []];
  for (const u of b.units) {
    if (u.invocacao) { if (u.dono) { u.dono.dano += u.dano; u.dono.abates += u.abates; u.dano = 0; u.abates = 0; } continue; }
    porTime[u.team].push(u);
  }
  const abates = [porTime[1].filter((u) => !u.vivo).length, porTime[0].filter((u) => !u.vivo).length];
  return { vencedor: b.vencedor, tempo: b.t, unidades: porTime, abates };
}

