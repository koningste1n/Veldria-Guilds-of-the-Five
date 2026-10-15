/* ============================ TORRE INFINITA ============================ */
const proximoAndar = () => STATE.torre.recorde + 1;
const nivelarRival = (m, L) => { m.nivel = clamp(L, 1, 30); m.ascensoes = m.nivel > 20 ? 2 : m.nivel > 10 ? 1 : 0; return m; };
function gerarAndar(n) {
  const nv = TORRE.nivel(n), q = qualidadeRival(TORRE.tier(n)), tam = tamanhoTime();
  if (TORRE.guardiao(n)) {
    const id = ecoDoAndar(n), C = CAMPEOES[id], curto = C.nome.split(/[ ,]/)[0];
    const eco = gerarCampeao(id, nv);
    Object.assign(eco, { nome: `Eco de ${curto}`, chefe: 'eco', pot: 'S', cresc: rolarCresc(C.classe, 'S') });
    nivelarRival(eco, nv);
    const escolta = gerarElencoRival(Math.max(1, nv - 1), q, tam - 1, [eco.nome]).map((m) => nivelarRival(m, nv - 1));
    return { andar: n, nome: `Salão de ${curto}`, cor1: '#2b2233', cor2: '#bd86f5', simbolo: 'torre', mercs: [eco, ...escolta], capitaoId: eco.id, guardiao: id };
  }
  const mercs = gerarElencoRival(nv, q, tam).map((m) => nivelarRival(m, nv + rint(-1, 0)));
  return { andar: n, nome: `Andar ${n}`, ...brasaoAleatorio(), mercs, capitaoId: pick(mercs).id };
}
function inimigoDaTorre() {
  const T = STATE.torre, n = proximoAndar();
  if (!T.inimigo || T.inimigo.andar !== n || T.inimigo.mercs.length !== tamanhoTime()) T.inimigo = gerarAndar(n);
  return T.inimigo;
}
const recompensaAndar = (n) => ({ ouro: Math.round(TORRE.ouro(n) * (1 + somaReliquia('ouro'))), emblemas: TORRE.emblemas(n), bau: TORRE.bau(n) ? (TORRE.guardiao(n) ? 2 : 1) : -1 });
// Soma vários conjuntos de modificadores de time (relíquias, preparo, regra do andar)
function somarMods(...lista) {
  const out = { flags: [] };
  for (const m of lista) {
    if (!m) continue;
    for (const k in m) { if (k === 'flags') out.flags.push(...m.flags); else out[k] = (out[k] || 0) + m[k]; }
  }
  return out;
}
// Lados e regras de uma luta na Torre
function ladosTorre(preparo) {
  const g = inimigoDaTorre(), md = modDoAndar(g.andar);
  const A = ladoJogador(preparo);
  A.mods = somarMods(A.mods, md && md.todos, md && md.aliados);
  const B = ladoDeGuilda(g, multDificuldade() * TORRE.mult(g.andar));
  B.mods = somarMods(md && md.todos, md && md.inimigos);
  return { A, B, opts: { furiaInicio: (md && md.furia) || 60, multCura: (md && md.cura) || 1 } };
}
function registrarAndar(vit) {
  const T = STATE.torre, n = proximoAndar();
  T.lutas++; STATE.stats.torreLutas++;
  if (!vit) return { n, vit: false, ouro: 0, emblemas: 0, bau: -1 };
  const r = recompensaAndar(n);
  T.recorde = n; T.inimigo = null;
  ganharOuro(r.ouro); STATE.emblemas += r.emblemas;
  if (TORRE.guardiao(n)) STATE.stats.guardioes++;
  return { n, vit: true, ...r };
}
const hojeTxt = () => new Date().toDateString();
const valorTributo = () => Math.round(25 * STATE.torre.recorde * (1 + somaReliquia('ouro')));
const tributoDisponivel = () => STATE.torre.recorde > 0 && STATE.torre.tributoDia !== hojeTxt();
function coletarTributo() {
  if (!tributoDisponivel()) return 0;
  STATE.torre.tributoDia = hojeTxt();
  return ganharOuro(valorTributo());
}

