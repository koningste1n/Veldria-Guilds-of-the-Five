/* ===================== MERCENÁRIOS E ITENS ===================== */
let STATE = null;
function novoId() { STATE.nextId = (STATE.nextId || 1) + 1; return STATE.nextId; }
const CABELO_PADRAO = { machadeiro: 2, lanceira: 0, arqueira: 2, piromante: 0, criomante: 5, clerica: 3, lamina: 0, bardo: 1, invocador: 0 };

function rolarTracos(pot) {
  const n = weighted([40, 45, 15]);
  const t = shuffle(TRACOS_POS.slice()).slice(0, n);
  if ((pot === 'F' || pot === 'D') && Math.random() < 0.3) {
    const neg = pick(TRACOS_NEG);
    if (t.length >= 2) t[1] = neg; else t.push(neg);
  }
  return t;
}
// Nome que ainda não está em uso na guilda nem na Taverna
function nomeLivre(evitar = []) {
  const usados = new Set([...(STATE.mercs || []).map((m) => m.nome), ...((STATE.taverna && STATE.taverna.ofertas) || []).map((m) => m.nome), ...evitar]);
  const livres = NOMES.filter((n) => !usados.has(n));
  return pick(livres.length ? livres : NOMES);
}
function rolarCresc(cls, pot) {
  const faixa = POT_INFO[pot].faixa;
  return CLASSES[cls].cresc.map(([lo, hi]) => Math.round((lo + (hi - lo) * rnd(faixa[0], faixa[1])) * 100) / 100);
}
function gerarMerc(cls, nivel, pot, evitar = []) {
  const m = {
    id: novoId(), nome: nomeLivre(evitar), classe: cls, nivel, xp: 0, pot, cresc: rolarCresc(cls, pot), tracos: rolarTracos(pot),
    equip: { arma: null, armadura: null, amuleto: null }, pergaminhos: [], ascensoes: 0, evolucao: null,
    linha: CLASSES_FRENTE.includes(cls) ? 'frente' : 'tras', pos: CLASSES_FRENTE.includes(cls) ? 1 : 7, postura: 'auto', tatica: 'auto',
    pele: rint(0, 3), cabelo: CABELO_PADRAO[cls] != null && Math.random() < 0.5 ? CABELO_PADRAO[cls] : rint(0, 5),
  };
  // EV2: aparência estável pelo id (não usa Math.random: o simulador, que não carrega a parte visual, gera os mesmos mercenários)
  if (typeof garantirAparencia === 'function') garantirAparencia(m);
  return m;
}
// Campeão Lendário: base 25% maior, potencial mínimo A e habilidade própria
function gerarCampeao(id, nivel) {
  const C = CAMPEOES[id], pot = Math.random() < 0.4 ? 'S' : 'A';
  const m = gerarMerc(C.classe, nivel, pot);
  Object.assign(m, { nome: C.nome, campeao: id, visual: C.visual, tracos: [pick(TRACOS_POS)], pele: id === 'ravik' ? 3 : id === 'okon' ? 1 : 0, cabelo: 1 });
  return m;
}

const multTraco = (m, k) => m.tracos.reduce((a, t) => a * (TRACOS[t][k] || 1), 1);
const somaTraco = (m, k) => m.tracos.reduce((a, t) => a + (TRACOS[t][k] || 0), 0);
const multExtra = (m) => (1 + 0.1 * (m.ascensoes || 0)) * (m.campeao ? 1.25 : 1) * (m.chefe ? MULT_CHEFE[m.chefe] || 1.5 : 1);
// Crescimento efetivo por nível (com traços, Ascensão e bônus de Campeão), para exibir
const ACEL_VIDA = 0.025;   // a VIDA cresce 2,5% mais rápido a cada nível (lutas não encurtam nos níveis altos)
function crescEfetivo(m) {
  const k = multExtra(m) * fatorCrescNivel(m.nivel), L = nivelEf(m.nivel), bv = CLASSES[m.classe].base[0];
  const dVida = m.cresc[0] * (1 + ACEL_VIDA * (L - 1)) + (bv + m.cresc[0] * (L - 1)) * ACEL_VIDA;
  return { vida: dVida * multTraco(m, 'vida') * k, atq: m.cresc[1] * multTraco(m, 'atq') * k, def: m.cresc[2] * multTraco(m, 'def') * k, agi: m.cresc[3] * multTraco(m, 'agi') * k };
}
// Atributo no nível N = (base + crescimento × (Nef − 1)) × traços × (1 + 10% por Ascensão); a VIDA ainda acelera 2,5%/nível.
// Nef = nivelEf(N): igual a N até 30, depois cresce mais devagar (CRESC_FAIXAS, 02_dados)
function atributosBase(m, nivel = m.nivel) {
  const c = CLASSES[m.classe], k = multExtra(m), bc = m.bonusCriador || {}, ef = nivelEf(nivel);
  const v = c.base.map((b, i) => (b + m.cresc[i] * (ef - 1)) * k);
  v[0] *= 1 + ACEL_VIDA * (ef - 1);
  return {
    vida: Math.round(v[0] * multTraco(m, 'vida')) + (bc.vida || 0), atq: Math.round(v[1] * multTraco(m, 'atq')) + (bc.atq || 0),
    def: Math.round(v[2] * multTraco(m, 'def')) + (bc.def || 0), agi: Math.round(v[3] * multTraco(m, 'agi')) + (bc.agi || 0),
  };
}
// Bônus do item já com o aprimoramento da Forja (+8% por nível)
function bonusEfetivo(it) {
  const k = 1 + 0.08 * (it.aprim || 0), out = {};
  for (const s in it.bonus) out[s] = STAT_PCT[s] ? Math.round(it.bonus[s] * k * 1000) / 1000 : Math.round(it.bonus[s] * k);
  return out;
}
const nomeItem = (it) => it.nome + (it.aprim ? ` +${it.aprim}` : '');
function bonusItens(m) {
  const b = { vida: 0, atq: 0, def: 0, agi: 0, crit: 0, critDmg: 0, esquiva: 0, roubo: 0, sorte: 0, recarga: 0 };
  const unicos = [];
  for (const k of ['arma', 'armadura', 'amuleto']) {
    const it = m.equip && m.equip[k]; if (!it) continue;
    const be = bonusEfetivo(it);
    for (const s in be) b[s] += be[s];
    if (it.unico) unicos.push(it.unico);
  }
  return { b, unicos };
}
// Modificadores dos pergaminhos passivos equipados
function modsPergaminhos(m) {
  const mod = { atqPct: 0, defPct: 0, agiPct: 0, vidaPct: 0, crit: 0, critDmg: 0, esquiva: 0, roubo: 0, recarga: 0 }, flags = [];
  for (const it of m.pergaminhos || []) {
    const P = PERGAMINHOS[it.pid]; if (!P || P.tipo !== 'passiva') continue;
    for (const k in P.mod || {}) mod[k] += P.mod[k];
    if (P.flag) flags.push(P.flag);
  }
  return { mod, flags };
}
function atributos(m) {
  const c = CLASSES[m.classe];
  const base = atributosBase(m);
  const { b, unicos } = bonusItens(m);
  const { mod, flags } = modsPergaminhos(m);
  const s = {
    vida: Math.round((base.vida + b.vida) * (1 + mod.vidaPct)), atq: Math.round((base.atq + b.atq) * (1 + mod.atqPct)),
    def: Math.round((base.def + b.def) * (1 + mod.defPct)), agi: Math.round((base.agi + b.agi) * (1 + mod.agiPct)),
  };
  s.base = base; s.itens = b; s.unicos = unicos; s.flags = flags;
  s.crit = clamp(0.05 + (c.crit || 0) + somaTraco(m, 'crit') + b.crit + mod.crit, 0, 0.75);
  s.critDmg = 1.5 + (c.critDmg || 0) + b.critDmg + mod.critDmg;
  s.esquiva = Math.min(0.45, Math.min(0.25, s.agi / (s.agi + 300)) + b.esquiva + mod.esquiva);
  s.roubo = somaTraco(m, 'roubo') + b.roubo + mod.roubo;
  s.sorte = somaTraco(m, 'sorte') + b.sorte + (unicos.includes('trevo') ? 25 : 0);
  s.recarga = Math.min(0.5, b.recarga + mod.recarga);
  s.intervalo = 1.8 * 50 / (50 + s.agi);
  s.alcance = c.alcanceCustom || ALCANCE[c.alcance];
  return s;
}
function poderMerc(m, mult = 1) {
  const s = atributos(m);
  return (s.vida / 5 + s.atq * 2 + s.def * 1.5 + s.agi * 1.5) * mult * (1 + 0.04 * (m.pergaminhos || []).length);
}
function poderLista(lista, mult = 1) { return lista.reduce((t, m) => t + poderMerc(m, mult), 0); }
const xpProx = (n) => Math.round(50 * Math.pow(n, 1.5));
const nivelMax = (m) => TETO_POR_ASCENSAO[Math.min(2, (m && m.ascensoes) || 0)];
const podeAscender = (m) => (m.ascensoes || 0) < 2 && m.nivel >= ASCENSOES[m.ascensoes || 0].nivel;
// Evolução A/B (E5a): escolha única no nível 15; Campeões não evoluem
const evoDe = (m) => (m && !m.campeao && (m.evolucao === 'a' || m.evolucao === 'b') ? m.evolucao : null);
const podeEvoluir = (m) => !m.campeao && !evoDe(m) && m.nivel >= NIVEL_EVOLUCAO && !!EVOLUCOES[m.classe];
function evoluir(m, caminho) { if (!podeEvoluir(m) || !EVOLUCOES[m.classe][caminho]) return false; m.evolucao = caminho; return true; }
const nomeEvo = (m) => (evoDe(m) ? EVOLUCOES[m.classe][evoDe(m)].nome : null);
const slotsPergaminho = (m) => (m.nivel >= 5 ? 1 : 0) + (m.ascensoes || 0);
const skillDe = (m) => m.skillFixa || (m.campeao ? CAMPEOES[m.campeao].skill : CLASSES[m.classe].skill);
function xpMultGlobal() {
  if (!STATE) return 1;
  return (1 + somaReliquia('xp')) * (STATE.sabedoriaAte > Date.now() ? 1.5 : 1);
}
function darXp(m, qtd, multG = xpMultGlobal()) {
  const de = m.nivel, antes = atributosBase(m);
  m.xp += qtd * multTraco(m, 'xp') * multG;
  while (m.nivel < nivelMax(m) && m.xp >= xpProx(m.nivel)) { m.xp -= xpProx(m.nivel); m.nivel++; }
  if (m.nivel >= nivelMax(m)) m.xp = Math.min(m.xp, xpProx(m.nivel));
  if (m.nivel > de) {
    const dep = atributosBase(m);
    return { m, de, para: m.nivel, ganhos: { vida: dep.vida - antes.vida, atq: dep.atq - antes.atq, def: dep.def - antes.def, agi: dep.agi - antes.agi } };
  }
  return null;
}
function ganhoProxNivel(m) {
  if (m.nivel >= nivelMax(m)) return null;
  const a = atributosBase(m), b = atributosBase(m, m.nivel + 1);
  return { vida: b.vida - a.vida, atq: b.atq - a.atq, def: b.def - a.def, agi: b.agi - a.agi };
}
const precoMerc = (m) => Math.round((m.campeao ? 3000 : POT_INFO[m.pot].preco) * (1 + 0.2 * (m.nivel - 1)) * (1 + 0.5 * (m.ascensoes || 0)));
const valorVendaMerc = (m) => Math.round(precoMerc(m) * ECO.vendaMerc);
const txtGanhos = (g) => `+${g.vida} VIDA, +${g.atq} ATQ, +${g.def} DEF, +${g.agi} AGI`;

/* ---- itens ---- */
function addExtra(bonus, k, nivel, mult) {
  const v = { crit: 0.03 * mult, critDmg: 0.12 * mult, roubo: 0.03 * mult, agi: (1 + 0.4 * nivel) * mult, esquiva: 0.02 * mult, sorte: 5 * mult, recarga: 0.04 * mult }[k];
  bonus[k] = (k === 'agi' || k === 'sorte') ? Math.max(1, Math.round(v)) : Math.round(v * 1000) / 1000;
}
function gerarItem(raridade, nivel, tipo) {
  tipo = tipo || pick(Object.keys(TIPOS_ITEM));
  const R = RARIDADES[raridade], mult = R.mult, maior = raridade === 2 ? 1.25 : 1;
  const [baseNome, icone] = pick(ITEM_BASES[tipo]);
  const nivelItem = nivel; nivel = nivelEf(nivel);   // o bônus segue a mesma faixa de crescimento dos mercenários (igual até 30)
  const bonus = {};
  if (tipo === 'arma') {
    bonus.atq = Math.round((3 + 1.2 * nivel) * mult * maior);
    const ex = shuffle(['crit', 'critDmg', 'roubo', 'agi']);
    for (let i = 0; i < R.nb - 1; i++) addExtra(bonus, ex[i], nivel, mult);
  } else if (tipo === 'armadura') {
    bonus.vida = Math.round((30 + 13 * nivel) * mult * maior);
    if (R.nb >= 2) bonus.def = Math.round((2 + 0.8 * nivel) * mult);
    if (R.nb >= 3) addExtra(bonus, pick(['esquiva', 'roubo']), nivel, mult);
  } else {
    bonus.agi = Math.round((2 + 0.6 * nivel) * mult * maior);
    const ex = shuffle(['crit', 'esquiva', 'sorte', 'recarga']);
    for (let i = 0; i < R.nb - 1; i++) addExtra(bonus, ex[i], nivel, mult);
  }
  const unico = raridade === 4 ? pick(Object.keys(UNICOS).filter((k) => UNICOS[k].tipo === tipo)) : null;
  return { id: novoId(), tipo, raridade, nivel: nivelItem, nome: `${baseNome} ${pick(ITEM_SUFIXOS[raridade])}`, icone, bonus, unico, aprim: 0, investido: 0, flavor: pick(ITEM_FLAVOR[raridade]) };
}
function gerarPergaminho(raridade, pid) {
  pid = pid || pick(Object.keys(PERGAMINHOS).filter((k) => PERGAMINHOS[k].r === raridade));
  const P = PERGAMINHOS[pid];
  return { id: novoId(), tipo: 'pergaminho', pid, raridade: P.r, nivel: 0, nome: P.nome, icone: 'pergaminho', bonus: {} };
}
function gerarReliquia(raridade, rid) {
  rid = rid || pick(Object.keys(RELIQUIAS).filter((k) => RELIQUIAS[k].r === raridade));
  const R = RELIQUIAS[rid];
  return { id: novoId(), tipo: 'reliquia', rid, raridade: R.r, nivel: 0, nome: R.nome, icone: 'reliquia', bonus: {} };
}
const ehEquipamento = (it) => it.tipo in TIPOS_ITEM;
function precoItem(it) {
  const p = RARIDADES[it.raridade].preco;
  if (it.tipo === 'pergaminho') return Math.round(70 * p);
  if (it.tipo === 'reliquia') return Math.round(110 * p);
  return Math.round(40 * (1 + 0.15 * it.nivel) * p);
}
const valorVendaItem = (it) => Math.max(5, Math.round(precoItem(it) * ECO.vendaItem + (it.investido || 0) * 0.5));
const custoAprimorar = (it) => Math.round(precoItem(it) * 0.3 * ((it.aprim || 0) + 1));
function txtBonus(k, v) {
  if (STAT_PCT[k]) return `${k === 'recarga' ? '−' : '+'}${fmt1(v * 100)}% ${STAT_NOME[k]}`;
  return `+${fmt(v)} ${STAT_NOME[k]}`;
}
function descItem(it) {
  if (it.tipo === 'pergaminho') { const P = PERGAMINHOS[it.pid]; return `${P.tipo === 'ativa' ? `Ativa · recarga ${P.cd} s` : 'Passiva'} · ${txtPapeis(it.pid)}`; }
  if (it.tipo === 'reliquia') return RELIQUIAS[it.rid].desc;
  return Object.entries(bonusEfetivo(it)).map(([k, v]) => txtBonus(k, v)).join(' · ');
}
function rolarComSorte(sorte, minimo) {
  const w = RARIDADES.map((x) => x.peso);
  const sm = (STATE && STATE.criador && STATE.criador.sorteMult) || 1;
  w[2] *= Math.sqrt(sm); w[3] *= (1 + sorte / 100) * sm; w[4] *= (1 + 1.5 * sorte / 100) * sm;
  for (let i = 0; i < minimo; i++) w[i] = 0;
  return weighted(w);
}
// Sorteio com garantia (10 sem Épico+ → Épico+; 50 sem Lendário → Lendário)
function rolarRaridade(sorte, minimo = 0) {
  const p = STATE.pity;
  let r;
  if (p.semLendario + 1 >= GARANTIA.lendario) r = 4;
  else if (p.semEpico + 1 >= GARANTIA.epico) r = Math.max(3, rolarComSorte(sorte, 3));
  else r = rolarComSorte(sorte, minimo);
  r = Math.max(r, minimo);
  p.semEpico = r >= 3 ? 0 : p.semEpico + 1;
  p.semLendario = r === 4 ? 0 : p.semLendario + 1;
  if (r === 4) STATE.stats.lendarios++;
  return r;
}
// Conteúdo de um baú: equipamento, pergaminho, relíquia ou consumível
function gerarDrop(raridade, nivel) {
  const t = weighted([55, 25, 12, 8]);
  if (t === 1) return gerarPergaminho(raridade);
  if (t === 2) return gerarReliquia(raridade);
  if (t === 3) return { tipo: 'consumivel', cid: pick(Object.keys(CONSUMIVEIS)), qtd: raridade >= 3 ? 3 : raridade >= 1 ? 2 : 1, raridade };
  return gerarItem(raridade, nivel);
}

