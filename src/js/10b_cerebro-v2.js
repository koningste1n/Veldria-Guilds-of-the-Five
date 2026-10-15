/* ============================ CÉREBRO v2 (E4) ============================
   IA de utilidade: a cada decisão (IA2.tick) a unidade pontua as opções que tem
   — que inimigo atacar, que manobra fazer, se vale usar a habilidade agora —
   com considerações normalizadas de 0 a 1 e pesos por FUNÇÃO (D1: tanque, corpo
   a corpo, assassino, distância, controle, suporte). A opção vencedora vale até
   a próxima decisão, para a unidade não ficar oscilando.

   Este arquivo não muda regra nenhuma de combate: dano, habilidades, estados e
   projéteis continuam no 10_combate.js. Ele só responde às três perguntas que o
   combate faz a cada unidade com cérebro (lado.ia === 'v2'):
     escolherAlvoV2  → em quem bater
     destinoV2       → para onde andar (mesmo formato de destinoDe)
     querUsarV2      → usar esta habilidade agora? (p = 1 normal, 2 SUPREMO)
   Toda aleatoriedade passa por b.rng(): a luta continua reproduzível. */

// Cérebro usado em todas as lutas do jogo (ladoJogador / ladoDeGuilda). O simulador escolhe por lado.
const IA_JOGO = 'v2';

const IA2 = {
  tick: 0.25,            // segundos entre decisões
  fixarAlvo: 0.15,       // bônus para o alvo atual (hysterese: não troca de alvo à toa)
  limiar: 0.35,          // pontuação mínima para gastar uma habilidade
  limiarSupremo: 0.45,   // o SUPREMO é mais caro: exige uma situação melhor
  // Pesos das considerações de ALVO por função
  alvo: {
    tanque:    { perto: 0.50, ameaca: 0.40, fraco: 0.15, matar: 0.20, foco: 0.30, retaguarda: 0.00 },
    corpo:     { perto: 0.45, ameaca: 0.10, fraco: 0.30, matar: 0.30, foco: 0.30, retaguarda: 0.10 },
    assassino: { perto: 0.10, ameaca: 0.10, fraco: 0.40, matar: 0.40, foco: 0.10, retaguarda: 0.60 },
    distancia: { perto: 0.30, ameaca: 0.25, fraco: 0.40, matar: 0.40, foco: 0.30, retaguarda: 0.10 },
    controle:  { perto: 0.30, ameaca: 0.35, fraco: 0.25, matar: 0.30, foco: 0.25, retaguarda: 0.00 },
    suporte:   { perto: 0.50, ameaca: 0.20, fraco: 0.20, matar: 0.20, foco: 0.30, retaguarda: 0.00 },
  },
  // Manobras: quanto cada função quer recuar (kiting) e a que fração do alcance se sente exposta.
  // O recuo é só PARA TRÁS (até `abertura` graus da direção oposta à ameaça): quem recua acaba na
  // parede e aí luta. Sem isso uma unidade mais rápida orbitaria o inimigo por 2 minutos.
  recuo: {
    peso:     { tanque: 0, corpo: 0, assassino: 0, distancia: 1.0, controle: 1.0, suporte: 0.9 },
    perigo:   { tanque: 0, corpo: 0, assassino: 0, distancia: 0.55, controle: 0.55, suporte: 0.65 },
    passo: 46,           // quanto anda por recuo (px)
    abertura: 60,        // graus para cada lado da direção oposta à ameaça
  },
  // Distância (fração do alcance) em que uma unidade à distância para de avançar
  paradaDistancia: 0.88,
};

function criarCerebro(b, u) {
  return { t: b.rng() * IA2.tick, manobra: null, flanco: 0 };
}

/* ---- considerações auxiliares ---- */
const danoEstimado = (u, o) => atqEf(u) * 100 / (100 + o.def);
const golpesParaMatar = (u, o) => (o.vida + (o.st.shield ? o.st.shield.v : 0)) / Math.max(1, danoEstimado(u, o));
const corpoACorpo = (o) => o.alcance <= 31;
const imobilizado = (o) => o.st.stun > 0 || o.st.freeze > 0;
function ameacaMaisProxima(b, u) {
  // inimigo corpo a corpo (ou invocação) mais perto: quem pode chegar em mim
  return minPor(inimigosDe(b, u).filter(corpoACorpo), (o) => dist(u, o));
}

/* ---- decisão periódica: a manobra vale até a próxima decisão ---- */
function pensar(b, u) {
  const c = u.cerebro;
  c.t -= DT;
  if (c.t > 0 && c.manobra) return;
  c.t = IA2.tick;
  c.manobra = escolherManobra(b, u);
}

/* ---- 1. alvo ---- */
function escolherAlvoV2(b, u) {
  const ini = inimigosDe(b, u);
  if (!ini.length) return null;
  // tática escolhida pelo jogador na ficha vale mais que o cérebro (é escolha dele)
  const t = u.tatica && u.tatica !== 'auto' ? u.tatica : null;
  if (t === 'fraco') return minPor(ini, (o) => o.vida);
  if (t === 'forte') return minPor(ini, (o) => -o.atq);
  if (t === 'tras') { const tr = ini.filter(daRetaguarda); return tr.length ? minPor(tr, (o) => o.vida) : minPor(ini, (o) => dist(u, o)); }
  if (t === 'perto') return minPor(ini, (o) => dist(u, o));
  const W = IA2.alvo[funcaoDe(u.cls)] || IA2.alvo.corpo;
  const al = aliadosDe(b, u).filter((o) => o !== u && !o.invocacao);
  let maxAtq = 1;
  for (const o of ini) maxAtq = Math.max(maxAtq, atqEf(o));
  let melhor = null, mv = -Infinity;
  for (const o of ini) {
    const d = dist(u, o);
    const perto = 1 - clamp(d / 260, 0, 1);
    const fraco = 1 - o.vida / o.vidaMax;
    const g = golpesParaMatar(u, o);
    const matar = g <= 1 ? 1 : g <= 3 ? 0.6 : g <= 6 ? 0.25 : 0;
    const ameaca = atqEf(o) / maxAtq;
    const foco = al.length ? al.filter((a) => a.alvo === o).length / al.length : 0;
    const ret = daRetaguarda(o) ? 1 : 0;
    let s = W.perto * perto + W.fraco * fraco + W.matar * matar + W.ameaca * ameaca + W.foco * foco + W.retaguarda * ret;
    // invocações valem menos que quem as invocou, a não ser que estejam em cima de mim
    if (o.invocacao) s *= d < u.alcance + 6 ? 0.8 : 0.45;
    // à distância: não vale a pena trocar para um alvo fora do alcance se há um dentro
    if (!corpoACorpo(u) && d > u.alcance && ini.some((x) => dist(u, x) <= u.alcance)) s -= 0.25;
    if (o === u.alvo) s += IA2.fixarAlvo;
    if (s > mv) { mv = s; melhor = o; }
  }
  return melhor;
}

/* ---- 2. manobra ---- */
// Devolve { modo, p?, dir?, ate? }. O destino concreto é recalculado a cada passo em destinoV2
// (o alvo se mexe); a manobra em si dura até a próxima decisão.
function escolherManobra(b, u) {
  const c = u.cerebro, f = funcaoDe(u.cls), papel = u.papel;
  const alvo = u.alvo && u.alvo.vivo ? u.alvo : null;
  const ini = inimigosDe(b, u), al = aliadosDe(b, u).filter((o) => o !== u && !o.invocacao);
  const ameaca = ameacaMaisProxima(b, u), dAmeaca = ameaca ? dist(u, ameaca) : 999;
  const opcoes = [];

  // recuar: só quem tem alcance; exposto × espaço para trás × (sou mais rápido?)
  const pesoRec = IA2.recuo.peso[f] || 0;
  if (pesoRec > 0 && ameaca) {
    const raioPerigo = u.alcance * (IA2.recuo.perigo[f] || 0.5);
    const exposto = clamp(1 - dAmeaca / raioPerigo, 0, 1);
    if (exposto > 0) {
      const fuga = melhorFuga(b, u, ameaca, alvo);
      const maisRapido = velocidade(u, b) * 1.1 >= velocidade(ameaca, b) ? 1 : 0.55;
      // quanto da minha vida a ameaça tira em 8 s: de um esqueleto não se foge
      const letal = clamp(danoEstimado(ameaca, u) / intervalo(ameaca, b) * 8 / Math.max(1, u.vida), 0, 1);
      // invocador: as invocações são a minha linha de frente; se elas estão em cima da ameaça, fico atrás delas em vez de fugir
      const escudoVivo = b.units.some((o) => o.vivo && o.dono === u && dist(o, ameaca) < 40) ? 0.15 : 1;
      const s = pesoRec * Math.pow(exposto, 0.7) * fuga.espaco * maisRapido * Math.pow(letal, 0.75) * escudoVivo;
      if (s > 0) opcoes.push({ s, modo: 'fuga', dir: fuga.dir });
    }
  }
  if (!alvo) { opcoes.push({ s: 0.05, modo: 'parar' }); return melhorOpcao(opcoes); }
  const d = dist(u, alvo);

  if (papel === 'curandeira' || papel === 'suporte') {
    // apoiar: perto de quem está ferido, atrás da linha de frente
    const ferido = minPor(al, (o) => o.vida / o.vidaMax);
    const frente = minPor(al.filter(corpoACorpo), (o) => (ameaca ? dist(o, ameaca) : 0));
    if (ferido && ferido.vida / ferido.vidaMax < 0.75 && dist(u, ferido) > 36 * E) opcoes.push({ s: 0.6 + (1 - ferido.vida / ferido.vidaMax) * 0.5, modo: 'apoiar', quem: ferido });
    if (frente) opcoes.push({ s: 0.45, modo: 'atras', quem: frente });
    opcoes.push({ s: d > u.alcance * 0.9 ? 0.4 : 0.3, modo: 'atacar' });
    return melhorOpcao(opcoes);
  }
  if (!corpoACorpo(u)) {
    // à distância: avança só até a parada; dentro do alcance, segura (destinoV2 decide a cada passo)
    const falta = clamp((d - u.alcance * IA2.paradaDistancia) / u.alcance, 0, 1);
    opcoes.push({ s: 0.2 + falta * 0.6, modo: 'atacar' });
    return melhorOpcao(opcoes);
  }
  // corpo a corpo
  if (papel === 'assassino' && d > u.alcance + 4 && d > 36) {
    const bloq = ini.some((o) => o !== alvo && dist(o, u) < d && distSegmento(o, u, alvo) < 18);
    if (bloq) opcoes.push({ s: 0.7, modo: 'flanco' });
  }
  // proteger: tanque e corpo a corpo entram na frente de um aliado frágil ameaçado
  if ((f === 'tanque' || f === 'corpo') && al.length) {
    for (const o of al) {
      if (corpoACorpo(o)) continue;
      const am = minPor(ini.filter(corpoACorpo), (x) => dist(x, o));
      if (!am) continue;
      const dA = dist(am, o);
      if (dA < 60 && dist(u, am) > u.alcance + 4) opcoes.push({ s: (f === 'tanque' ? 0.75 : 0.5) * clamp(1 - dA / 60, 0, 1) + 0.2, modo: 'proteger', quem: o, de: am });
    }
  }
  opcoes.push({ s: d > u.alcance ? 0.55 : 0.5, modo: 'atacar' });
  return melhorOpcao(opcoes);
}
function melhorOpcao(opcoes) {
  let m = null;
  for (const o of opcoes) if (!m || o.s > m.s) m = o;
  return m;
}
// Melhor direção para recuar de `ameaca`: para trás (dentro da abertura), ganhando distância,
// sem se encurralar e tentando manter `alvo` no alcance. Devolve { dir: [x, y] unitário, espaco: 0–1 }.
// espaco = 0 quando não há para onde ir (parede): a unidade para de recuar e luta.
function melhorFuga(b, u, ameaca, alvo) {
  const passo = IA2.recuo.passo, base = Math.atan2(u.y - ameaca.y, u.x - ameaca.x), ab = IA2.recuo.abertura * Math.PI / 180;
  let melhor = null, mv = -Infinity;
  for (let k = -3; k <= 3; k++) {
    const ang = base + (k / 3) * ab, cx = Math.cos(ang), cy = Math.sin(ang);
    const [px, py] = dentroArena(u.x + cx * passo, u.y + cy * passo * 0.8);
    const ganho = Math.hypot(px - ameaca.x, py - ameaca.y) - dist(u, ameaca);
    // espaço além do ponto: quanto ainda dá para andar nessa direção antes da parede
    const sobra = Math.min(
      cx > 0 ? (LIMITES.x1() - px) / cx : cx < 0 ? (LIMITES.x0 - px) / cx : 999,
      cy > 0 ? (ARENA.fundo - py) / cy : cy < 0 ? (ARENA.chao - py) / cy : 999,
    );
    let v = ganho + Math.min(sobra, 60) * 0.35;
    if (alvo && Math.hypot(px - alvo.x, py - alvo.y) > u.alcance) v -= 25;
    if (v > mv) { mv = v; melhor = { dir: [cx, cy], ganho }; }
  }
  return { dir: melhor.dir, espaco: clamp(melhor.ganho / (passo * 0.6), 0, 1) };
}
function destinoV2(b, u) {
  const c = u.cerebro, m = c.manobra;
  const alvo = u.alvo && u.alvo.vivo ? u.alvo : null;
  if (!m) return null;
  switch (m.modo) {
    case 'fuga': {
      const [cx, cy] = m.dir;
      return { p: dentroArena(u.x + cx * 30, u.y + cy * 30 * 0.8), modo: 'fuga' };
    }
    case 'atacar': {
      // decidido a cada passo (o alvo se mexe): fora do alcance persegue, dentro espera/ronda
      if (!alvo) return null;
      if (!corpoACorpo(u)) return dist(u, alvo) > u.alcance * IA2.paradaDistancia ? { p: [alvo.x, alvo.y] } : null;
      if (dist(u, alvo) > u.alcance) return { p: pontoDeAtaque(b, u, alvo) };
      if (u.atkT > 0.3 && !u.invocacao) {
        u.rondaT = (u.rondaT || 0) - DT;
        if (u.rondaT <= 0) { u.rondaT = 0.9 + b.rng() * 0.8; u.ronda = b.rng() < 0.5 ? -1 : 1; }
        return { p: dentroArena(u.x, u.y + u.ronda * 12), modo: 'ronda' };
      }
      return null;
    }
    case 'flanco': {
      if (!alvo) return null;
      if (!c.flanco) c.flanco = alvo.y > (ARENA.chao + ARENA.fundo) / 2 ? -1 : 1;
      return { p: dentroArena(u.x + (alvo.x - u.x) * 0.5, alvo.y + c.flanco * 46), modo: 'flanco' };
    }
    case 'proteger': {
      const o = m.quem, am = m.de;
      if (!o || !o.vivo || !am || !am.vivo) return null;
      // ponto entre o aliado e a ameaça, mais perto da ameaça
      return { p: dentroArena(o.x + (am.x - o.x) * 0.7, o.y + (am.y - o.y) * 0.7) };
    }
    case 'apoiar': {
      const o = m.quem;
      if (!o || !o.vivo) return null;
      return dist(u, o) > 30 * E ? { p: dentroArena(o.x - u.face * 16, o.y) } : null;
    }
    case 'atras': {
      const fr = m.quem;
      if (!fr || !fr.vivo) return null;
      const px = fr.x - u.face * 30, py = fr.y + (u.y > fr.y ? 10 : -10);
      return dist(u, { x: px, y: py }) > 10 ? { p: dentroArena(px, py) } : null;
    }
    default:
      return null;
  }
}

/* ---- 3. habilidades ----
   Cada habilidade de classe tem uma função que devolve a utilidade (0 = não vale, 1 = ótimo).
   Habilidade sem função aqui (pergaminhos, Campeões) segue a decisão do 10_combate.js. */
const VALOR_SKILL = {
  muralha(b, u, sup, ini) {
    const perto = ini.filter((o) => dist(u, o) < 35 * E);
    const vindo = ini.filter((o) => corpoACorpo(o) && o.alvo === u && dist(u, o) < 60 * E);
    const vida = 1 - u.vida / u.vidaMax;
    // aliado frágil sendo atacado por quem eu posso provocar
    let aliadoEmRisco = 0;
    for (const o of ini) if (dist(u, o) < 30 * E && o.alvo && o.alvo !== u && o.alvo.team === u.team && !corpoACorpo(o.alvo)) aliadoEmRisco = 0.8;
    return Math.max(perto.length ? 0.45 + vida * 0.6 : 0, vindo.length && vida > 0.15 ? 0.4 : 0, aliadoEmRisco, sup && perto.length ? 0.7 : 0);
  },
  redemoinho(b, u, sup, ini) {
    const raio = (sup ? 24 : 18) * E;
    const perto = ini.filter((o) => dist(u, o) <= raio);
    if (!perto.length) return 0;
    if (perto.length >= 2) return 1;
    const g = golpesParaMatar(u, perto[0]);
    return 0.6 + (g <= 1.4 * (sup ? 2 : 1) ? 0.35 : 0);   // matar agora vale mais que guardar a recarga
  },
  investida(b, u, sup, ini) {
    const o = u.alvo; if (!o || !o.vivo) return 0;
    const d = dist(u, o);
    if (d > 82 * E || (!sup && d < 14 * E)) return 0;
    if (imobilizado(o)) return 0.1;         // já está parado: atordoar de novo é desperdício
    let s = 0.5;
    if (!corpoACorpo(o)) s += 0.3;          // fecha a distância em quem foge
    if (d > u.alcance + 10) s += 0.2;       // está longe: a investida ganha tempo
    if (golpesParaMatar(u, o) <= 1.5 * (sup ? 2 : 1)) s += 0.3;
    return s;
  },
  chuva(b, u, sup, ini) {
    const o = u.alvo; if (!o || !o.vivo) return 0;
    const d = dist(u, o);
    if (d > u.alcance + 21) return 0;
    const raio = (sup ? 21 : 17) * E;
    const naArea = ini.filter((x) => Math.hypot(x.x - o.x, x.y - o.y) <= raio).length;
    if (naArea >= 2) return 1;
    if (imobilizado(o) || o.st.slow > 0.9) return 0.9;       // não sai da área
    if (d <= u.alcance * 0.35) return 0.8;                   // em cima de mim: fica parado batendo
    const travado = aliadosDe(b, u).some((a) => a !== u && dist(a, o) <= o.alcance + 6 && corpoACorpo(o));
    if (travado) return 0.8;
    return o.anim.moveu ? 0.45 : 0.7;                        // parado: as 3 ondas acertam; andando: só a 1ª
  },
  bolaFogo(b, u, sup, ini) {
    const o = u.alvo; if (!o || !o.vivo || dist(u, o) > u.alcance + 14) return 0;
    const raio = (sup ? 18 : 12) * E;
    const outros = ini.filter((x) => x !== o && Math.hypot(x.x - o.x, x.y - o.y) <= raio).length;
    let s = 0.65 + Math.min(0.3, outros * 0.15);
    if (golpesParaMatar(u, o) <= 1.8 * (sup ? 2 : 1)) s += 0.3;
    return s;
  },
  lancaGelo(b, u, sup, ini) {
    const o = u.alvo; if (!o || !o.vivo || dist(u, o) > u.alcance + 14) return 0;
    let s = 0.6;
    if (o.st.slow < 0.8) s += 0.3;          // renovar a lentidão alimenta o Inverno (congelar)
    if (golpesParaMatar(u, o) <= 2 * (sup ? 2 : 1)) s += 0.3;
    return s;
  },
  luz(b, u, sup) {
    const al = aliadosDe(b, u);
    const ferido = minPor(al, (o) => o.vida / o.vidaMax);
    if (!ferido) return 0;
    const falta = ferido.vidaMax - ferido.vida, cura = atqEf(u) * 2.8 * (sup ? 2 : 1);
    if (falta < cura * 0.6 && !sup) return 0;                // curaria pouco: espera
    const frac = 1 - ferido.vida / ferido.vidaMax;
    let s = Math.pow(frac, 0.8) * 1.3;
    if (inimigosDe(b, u).some((o) => o.alvo === ferido && dist(o, ferido) < o.alcance + 10)) s += 0.2;
    if (sup) s += 0.2;
    return s;
  },
  passo(b, u, sup, ini) {
    if (!sup && b.t < 1.5) return 0;
    const tr = ini.filter(daRetaguarda);
    const t2 = tr.length ? minPor(tr, (o) => o.vida) : minPor(ini, (o) => o.vida);
    let s = tr.length ? 0.7 : 0.45;
    if (golpesParaMatar(u, t2) <= 2 * (sup ? 2 : 1)) s += 0.3;
    if (u.alvo && u.alvo.vivo && dist(u, u.alvo) > u.alcance + 20) s += 0.15;
    return s;
  },
  hino(b, u, sup) {
    if (!sup && b.t < 2) return 0;
    const al = aliadosDe(b, u), ini = inimigosDe(b, u);
    const engajados = al.filter((a) => ini.some((o) => dist(a, o) <= Math.max(a.alcance, o.alcance) + 8)).length;
    if (!engajados) return 0.15;
    return 0.5 + 0.5 * Math.min(1, engajados / 3);
  },
  esqueletos(b, u, sup) {
    const meus = b.units.filter((o) => o.vivo && o.dono === u).length, max = sup ? 6 : 4;
    if (meus >= max) return 0;
    return 0.5 + 0.5 * (max - meus) / max;
  },
};
function querUsarV2(b, u, sk, p) {
  const f = VALOR_SKILL[sk.id];
  if (!f) return true;                      // sem regra própria: decide como hoje (usarSkill tem suas próprias condições)
  const ini = inimigosDe(b, u);
  if (!ini.length) return false;
  const s = f(b, u, p === 2, ini);
  return s >= (p === 2 ? IA2.limiarSupremo : IA2.limiar);
}
