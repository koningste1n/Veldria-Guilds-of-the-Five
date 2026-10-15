/* ============================ VISTAS DE FRENTE E DE COSTAS ============================
   O mesmo esqueleto, visto de frente (andando para baixo) e de costas (andando para cima).
   As grades de frente são simétricas; a vista de costas usa grades próprias (sem rosto,
   capa por cima do tronco) e é espelhada para a arma ficar do lado certo. */

// Espelha a metade esquerda de cada linha (desenha-se só 7 colunas de 14 ou 6 de 12)
const simetrico = (rows) => rows.map((r) => r + r.split('').reverse().join(''));
const CABECAS_F = {
  normal: ['...hhhhhh...', '..hHHHhhhh..', '.hHHhhhhhhh.', '.hhhhhhhhhh.', 'hhhHhhhhhhhh', 'hhSSSSSSSShh', 'hSSSeSSSeSSh', 'jSSSSSSSSSSj', '.sSSSSSSSSs.', '.ssSSsSSSss.', '..zzsssszz..'],
  careca: ['...SSSSSS...', '..SSSSSSSs..', '.SSSSSSSSss.', '.SSSSSSSSss.', 'SSSSSSSSSSsz', 'SSSSSSSSSSsz', 'SSSSeSSSeSsz', 'zSSSSSSSSSsz', '.sSSSSSSSSs.', '.ssSSsSSSss.', '..zzsssszz..'],
  caveira: ['...OOOOOO...', '..OOOOOOOO..', '.OOOOOOOOOO.', '.OOOOOOOOOO.', 'OOOOOOOOOOOi', 'OOeeOOOOeeOi', 'OOeeOOOOeeOi', 'iOOOOeeOOOOi', '.iOOOOOOOOi.', '.iOeOeOeOei.', '..iiOOOOii..'],
};
const CABECAS_B = {
  normal: ['...hhhhhh...', '..hHHHhhhh..', '.hHHhhhhhhh.', '.hhhhhhhhhh.', 'hhhhhhhhhhhj', 'hhhhhhhhhhhj', 'hhhhhhhhhhjj', 'hhhhhhhhhjjj', '.hhhhhhhhjj.', '.jhhhhhhhjj.', '..jjzzzzjj..'],
  careca: ['...SSSSSS...', '..SSSSSSSs..', '.SSSSSSSSss.', '.SSSSSSSSss.', 'SSSSSSSSSssz', 'SSSSSSSSSssz', 'SSSSSSSSSssz', 'zSSSSSSSSssz', '.sSSSSSSSss.', '.ssSSSSSSss.', '..zzsssszz..'],
  caveira: ['...OOOOOO...', '..OOOOOOOO..', '.OOOOOOOOOO.', '.OOOOOOOOOO.', 'OOOOOOOOOOOi', 'OOOOOOOOOOOi', 'OOOOOOOOOOii', 'iOOOOOOOOOii', '.iOOOOOOOOi.', '.iiOOOOOOii.', '..iiOOOOii..'],
};
// Chapéus de frente (f) e de costas (b), relativos à origem da cabeça
const CHAPEUS_F = {
  elmo: { x: -1, y: -2, f: ['......55......', '.....455......', '....nMMMMn....', '...nMooMMMn...', '..nMoMMMMMMn..', '..nMMMMMMMMn..', '..nMMMMMMMMn..', '..nNeeeeeeNn..', '..nMMMMMMMMn..', '..nnMMMMMMnn..', '...nMMMMMMn...', '....nnnnnn....'], b: ['......55......', '.....455......', '....nMMMMn....', '...nMooMMMn...', '..nMoMMMMMMn..', '..nMMMMMMMMn..', '..nMMMMMMMMn..', '..nMMMMMMMMn..', '..nMMMMMMMMn..', '..nnMMMMMMnn..', '...nMMMMMMn...', '....nnnnnn....'] },
  elmoCoroa: { x: -1, y: -4, f: ['...g..gg..g...', '...gyggyyggy..', '...yyyyyyyyy..', '....NNNNNN....', '...NnnnnnnN...', '..NnnNNNnnnN..', '..NnnnnnnnnnN.', '..NnnnnnnnnnN.', '..NNccccccNN..', '..NnnnnnnnnnN.', '..NNnnnnnnnnN.', '...NnnnnnnnN..', '....NNNNNNN...'], b: ['...g..gg..g...', '...gyggyyggy..', '...yyyyyyyyy..', '....NNNNNN....', '...NnnnnnnN...', '..NnnNNNnnnN..', '..NnnnnnnnnnN.', '..NnnnnnnnnnN.', '..NnnnnnnnnnN.', '..NnnnnnnnnnN.', '..NNnnnnnnnnN.', '...NnnnnnnnN..', '....NNNNNNN...'] },
  chifres: { x: -1, y: -1, f: ['O............O', 'Oi...nnnn...iO', '.Oi.nMooMn.iO.', '..OinMMMMMniO.', '...nMMMMMMMn..', '...NNNNNNNNN..'] },
  asas: { x: -1, y: -2, f: ['.OO........OO.', 'OOOi.nnnnn.iOO', '.OOinMooMMniOO', '..OinMMMMMMiO.', '...nMMMMMMMMn.', '...ggggggggg..'] },
  capuz: { x: -1, y: -2, f: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAa.......ab.', '.aaa.......ab.', 'aaa.........ab', 'aaa.........ab', 'aab.........ab', '.ab.........b.'], b: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAaaaaaaaaab.', '.aaaaaaaaaaab.', 'aaaaaaaaaaaaab', 'aaaaaaaaaaaaab', 'aabaaaaaaaaaab', '.abbbbbbbbbbb.'] },
  chapeu: { x: -2, y: -8, f: ['......bb......', '......ab......', '.....aAab.....', '.....aAab.....', '....aAAaab....', '....aAaaab....', '...aAaaaaab...', '...gGggggy....', '..aaaaaaaaab..', '.bbbbbbbbbbbb.', 'bbbbbbbbbbbbbb'] },
  boina: { x: -1, y: -2, f: ['.....rrrrr....', '...rRRRrrrrr..', '..rRRrrrrrrrr.', '..rrrrrrrrrrrX', '...XXXXXXXXX..'] },
  pena: { x: -1, y: -1, f: ['.............O', '............Oi', '...........Oi.', '..........Oi..', '...ggggggggg..'] },
  coroaSol: { x: 0, y: -4, f: ['..G..G..G...', '..gG.gG.gG..', '..gggggggg..', '..yyyyyyyy..'] },
  corvo: { x: -1, y: -2, f: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaaa.', '.aAaaaNNNaaaa.', '.aaa.NNCNN.ab.', 'aaa...NNN...ab', 'aaa.........ab', 'aab.........ab', '.ab.........b.'], b: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAaaaaaaaaab.', '.aaaaaaaaaaab.', 'aaaaaaaaaaaaab', 'aaaaaaaaaaaaab', 'aabaaaaaaaaaab', '.abbbbbbbbbbb.'] },
};
for (const k of ['capuzGelo', 'capuzSol', 'capuzSombra', 'capuzOsso', 'capuzLua']) CHAPEUS_F[k] = { x: -1, y: -2, f: CHAPEUS_F.capuz.f, b: CHAPEUS_F.capuz.b };
CHAPEUS_F.capuzGelo.f = ['.......C......', '......CcC.....', '....aaacaaa...', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAa.......ab.', '.aaa.......ab.', 'aaa.........ab', 'aaa.........ab', 'aab.........ab', '.ab.........b.'];
CHAPEUS_F.capuzGelo.y = -4; CHAPEUS_F.capuzGelo.b = ['.......C......', '......CcC.....', '....aaacaaa...', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAaaaaaaaaab.', '.aaaaaaaaaaab.', 'aaaaaaaaaaaaab', 'aaaaaaaaaaaaab', 'aabaaaaaaaaaab', '.abbbbbbbbbbb.'];
CHAPEUS_F.capuzSol.f = ['....aaaaa.....', '...aAAAaaaa...', '..aAAagaaaaa..', '.aAAagGGgaaab.', '.aAa.gGg...ab.', '.aaa..g....ab.', 'aaa.........ab', 'aaa.........ab', 'aab.........ab', '.ab.........b.'];
CHAPEUS_F.capuzOsso.f = ['.....OOOO.....', '....OeOOeO....', '....aOOOOa....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAa.......ab.', '.aaa.......ab.', 'aaa.........ab', 'aaa.........ab', 'aab.........ab', '.ab.........b.']; CHAPEUS_F.capuzOsso.y = -3;
CHAPEUS_F.capuzLua.f = ['......CC......', '.....C..C.....', '....aaaCaaa...', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaab.', '.aAa.......ab.', '.aaa.......ab.', 'aaa.........ab', 'aaa.........ab', 'aab.........ab', '.ab.........b.']; CHAPEUS_F.capuzLua.y = -3;
const BARBA_F = { x: 1, y: 7, rows: ['hHhhhhhhhh', 'hhhhhhhhhh', '.hhhhhhhh.', '..hhhhhh..', '...hhhh...'] };
const CABELO_LONGO_F = { x: -1, y: 4, rows: ['hh..........hh', 'hh..........hh', 'hh..........hh', 'hh..........hj', 'hh..........hj', '.h..........j.', '.j..........j.'] };
const CABELO_LONGO_B = { x: 0, y: 7, rows: ['hhhhhhhhhhhh', 'hHhhhhhhhhhj', 'hhhhhhhhhhhj', '.hhhhhhhhhj.', '.hhhhhhhhjj.', '..hhhhhhjj..', '..hhhhhhj...', '...hhhhj....'] };
const MASCARA_F = { x: 1, y: 7, rows: ['3333333333', '2222222222', '.22222222.'] };
const OLHO_BRILHO_F = { x: 4, y: 6, rows: ['C...C', 'c...c'] };
const CACHECOL_F = { x: 3, y: 15, rows: ['.44555554..', '45555555554', '.5566.6655.', '..66...66..'] };
const CACHECOL_B = { x: 3, y: 15, rows: ['.44555554..', '45555555554', '..5555555..', '...66666...', '....666....'] };
const ESCUDO_F = ['.NnnnnnN.', 'NnMMMMMnN', 'nM44744Mn', 'nM47774Mn', 'nM44744Mn', 'nM44744Mn', 'nM45555Mn', '.nM555Mn.', '.nnM5Mnn.', '..nnMnn..', '...NNN...'];
const ALJAVA_B = ['.O.O', '.rOr', '.WWW', '.xww', '.xww', '.xww', '.xww', '.xww', '..x.'];
const AUREOLA_F = { x: 1, y: -6, rows: ['..gGGGGg..', '.g......g.', '..gggggg..'] };
// Tronco de costas: sem fivela, sem brasão, sem detalhes do peito
function troncoCostas(rows) { return rows.map((r) => r.replace(/g/g, 'l').replace(/[57]/g, 'a').replace(/[46]/g, 'a').replace(/K/g, 'U').replace(/c/g, 'M')); }
const CABECA_GOLEM_F = ['.NnnnnN.', 'NnMMMMnN', 'NMCnnCMN', 'NnMMMMnN', '.NnccnN.', '..NNNN..'];
const CABECA_GOLEM_B = ['.NnnnnN.', 'NnMMMMnN', 'NMMMMMMN', 'NnMMMMnN', '.NnnnnN.', '..NNNN..'];

/* ---- poses de frente: m = mão da arma relativa ao ombro direito (lado da arma), a = ângulo ---- */
const POSES_F = {
  espada: { idle: { m: [2, 8.5], a: -75 }, atk: [{ m: [2.5, 1], a: -110 }, { m: [3, -1], a: -125 }, { m: [-7, 5], a: 150 }, { m: [-7, 7.5], a: 165 }, { m: [-1, 8.5], a: -75 }], cast: { m: [1, -3], a: -90 }, vit: { m: [0, -6], a: -90 } },
  espadao: { idle: { m: [2, 8.5], a: -80 }, atk: [{ m: [2.5, 0], a: -115 }, { m: [3, -2], a: -130 }, { m: [-7.5, 5], a: 150 }, { m: [-7.5, 8], a: 165 }, { m: [-1, 8.5], a: -80 }], cast: { m: [1, -3], a: -90 }, vit: { m: [0, -6], a: -90 }, duas: true },
  machado: { idle: { m: [2, 8.5], a: -80 }, atk: [{ m: [2.5, 0], a: -115 }, { m: [3, -2], a: -130 }, { m: [-7.5, 5], a: 150 }, { m: [-7.5, 8], a: 165 }, { m: [-1, 8.5], a: -80 }], cast: { m: [1, -3], a: -90 }, vit: { m: [0, -6], a: -90 }, duas: true },
  martelo: { idle: { m: [2, 8.5], a: -80 }, atk: [{ m: [2.5, 0], a: -115 }, { m: [3, -2], a: -130 }, { m: [-7.5, 5], a: 150 }, { m: [-7.5, 8], a: 165 }, { m: [-1, 8.5], a: -80 }], cast: { m: [1, -3], a: -90 }, vit: { m: [0, -6], a: -90 }, duas: true },
  lanca: { idle: { m: [2, 8], a: -90 }, atk: [{ m: [2, 3], a: -100 }, { m: [2, 1], a: -105 }, { m: [-4, 8], a: 120 }, { m: [-3, 8], a: 110 }, { m: [1, 8], a: -90 }], cast: { m: [1, -2], a: -90 }, vit: { m: [1, -5], a: -90 } },
  arco: { idle: { m: [2.5, 8], a: -90 }, atk: [{ m: [-3, 4], a: -90, puxar: 1 }, { m: [-3, 4], a: -90, puxar: 1 }, { m: [-3, 4], a: -90 }, { m: [-1, 6], a: -90 }, { m: [2.5, 8], a: -90 }], cast: { m: [1, -1], a: -90, puxar: 1 }, vit: { m: [2, -3], a: -90 } },
  cajado: { idle: { m: [2.5, 8], a: -80 }, atk: [{ m: [2, 2], a: -100 }, { m: [2, 0], a: -105 }, { m: [-5, 6], a: 140, brilho: 1 }, { m: [-4, 7], a: 150, brilho: 1 }, { m: [0, 8], a: -80 }], cast: { m: [1, -3.5], a: -90, brilho: 1 }, vit: { m: [0, -5], a: -90, brilho: 1 } },
  adagas: { idle: { m: [2, 8.5], a: 110 }, atk: [{ m: [2.5, 2], a: -120 }, { m: [3, 0], a: -135 }, { m: [-6, 5], a: 150 }, { m: [-6, 7], a: 165 }, { m: [-1, 8.5], a: 110 }], cast: { m: [1, -1], a: -80 }, vit: { m: [0, -5], a: -90 }, tras: true },
  alaude: { idle: { m: [-3, 8], a: -20 }, atk: [{ m: [-4, 7.5], a: -25 }, { m: [-4, 7], a: -28 }, { m: [-2, 6.5], a: -15 }, { m: [-3, 7], a: -20 }, { m: [-3.5, 8], a: -22 }], cast: { m: [-2, 5], a: -30 }, vit: { m: [0, 1], a: -40 } },
  punho: { idle: { m: [2.5, 8], a: 0 }, atk: [{ m: [-1, 4], a: 0 }, { m: [-1.5, 3], a: 0 }, { m: [-1, 7.5], a: 0, soco: 1 }, { m: [-1, 7], a: 0, soco: 1 }, { m: [2, 8], a: 0 }], cast: { m: [2, -3], a: 0 }, vit: { m: [1, -6], a: 0 } },
};
// Quadros de frente/costas (reaproveitam os parâmetros das animações laterais: lift dos pés, mãos, corpo)
function quadrosVista(anim) {
  switch (anim) {
    case 'idle': return [{ by: 0 }, { by: 0, dmy: 0.5 }, { by: 1, dmy: 1 }, { by: 1, dmy: 1, hy: 0.5 }, { by: 1, dmy: 0.5 }, { by: 0 }];
    case 'walk': return [
      { by: 0, pl: 0, pr: 0, sx: 0.5, dm: [0, 0], dt: [0, 0] }, { by: -1, pl: 2, pr: 0, sx: 0.3, dm: [-1, -1.5], dt: [1, 1] }, { by: -1, pl: 2.5, pr: 0, sx: 0, dm: [-1, -2], dt: [1, 1.5] },
      { by: 0, pl: 0, pr: 0, sx: -0.5, dm: [0, 0], dt: [0, 0] }, { by: -1, pl: 0, pr: 2, sx: -0.3, dm: [1, 1], dt: [-1, -1.5] }, { by: -1, pl: 0, pr: 2.5, sx: 0, dm: [1, 1.5], dt: [-1, -2] }];
    case 'run': return [
      { by: 0, pl: 1, pr: 0, sx: 1, dm: [-2, -3], dt: [2, 2] }, { by: -2, pl: 3.5, pr: 0.5, sx: 0.5, dm: [-2, -3], dt: [2, 2] },
      { by: 0, pl: 0, pr: 1, sx: -1, dm: [2, 2], dt: [-2, -3] }, { by: -2, pl: 0.5, pr: 3.5, sx: -0.5, dm: [2, 2], dt: [-2, -3] }];
    case 'atk': return [{ by: 0, atk: 0, dt: [0, -1] }, { by: -1, atk: 1, dt: [0, -2], hy: -0.5 }, { by: 1, atk: 2, dt: [1, 1], hy: 0.5 }, { by: 1, atk: 3, dt: [1, 1] }, { by: 0, atk: 4 }];
    case 'cast': return [{ by: 0, cast: true, dt: [-1, -5] }, { by: -1, cast: true, dt: [-1, -8], hy: -0.5 }, { by: -1, cast: true, dt: [-1, -8.5], hy: -0.5 }, { by: 0, cast: true, dt: [-1, -6] }];
    case 'hurt': return [{ by: -1, hy: -1, dm: [1, -2], dt: [-1, -2], da: -15, pl: 0, pr: 0, sx: 0.5 }, { by: 0, hy: -0.5, dm: [0.5, -1], dt: [-0.5, -1] }];
    case 'empurrao': return [{ by: -2, hy: -2, dm: [2, -5], dt: [-2, -5], da: -40, sx: 1 }, { by: -1, hy: -1, dm: [1.5, -3], dt: [-1.5, -3], da: -25, sx: 0.5 }];
    case 'dash': return [{ by: -1, pl: 2, pr: 0, sx: 1, dm: [-3, -4], dt: [3, -4] }, { by: 0, pl: 0, pr: 2, sx: 1, dm: [-3, -3], dt: [3, -3] }];
    case 'morte': return [
      { by: 0, hy: -1, dm: [2, -4], dt: [-2, -4], da: -30 },
      { by: 4, hy: 1, dm: [1, 2], dt: [-1, 2], da: 40, joelhos: true },
      { by: 7, hy: 2.5, dm: [2, 4], dt: [-2, 4], da: 60, joelhos: true },
      { deitado: true }];
    case 'vit': return [
      { by: 2, vit: true, dt: [0, 0], dm: [0, 0], joelhos: true }, { by: -5, vit: true, dt: [-1, -8], dm: [1, -8], pl: 3, pr: 3 },
      { by: -7, vit: true, dt: [-2, -9], dm: [2, -9], pl: 3, pr: 3, hy: -0.5 }, { by: -1, vit: true, dt: [-1, -8], dm: [1, -8] }];
  }
  return [{}];
}

/* ---- montagem de um quadro de frente (costas = mesma composição com grades de trás, espelhada) ---- */
function montarQuadroVista(def, P, f, costas) {
  if (f.deitado) return montarDeitado(def, P);
  const camadas = [];
  const by = f.by || 0, bx = f.bx || 0, sx = f.sx || 0;
  const tipoArma = def.golem ? 'punho' : def.arma;
  const poses = POSES_F[tipoArma] || POSES_F.espada;
  let pose = poses.idle;
  if (f.atk !== undefined) pose = poses.atk[f.atk];
  else if (f.cast) pose = poses.cast;
  else if (f.vit) pose = poses.vit;
  const G = def.golem, k = def.grande ? 1.55 : 1;
  const S = (p) => (k === 1 ? p : [16 + (p[0] - 16) * k, 38 + (p[1] - 38) * k]);
  // esqueleto de frente: ombro esquerdo (tela) e direito (arma)
  const ombroL = S(G ? [9.5 + bx, 20 + by] : [11.5 + bx, 18 + by]), ombroR = S(G ? [22.5 + bx, 20 + by] : [20.5 + bx, 18 + by]);
  const quadL = S(G ? [13 + bx, 28 + by] : [14 + bx, 26 + by]), quadR = S(G ? [19 + bx, 28 + by] : [18 + bx, 26 + by]);
  const pl = f.pl || 0, pr = f.pr || 0;
  const peL = S([(G ? 12.5 : 13.5) + bx + sx, 36 - pl]), peR = S([(G ? 19.5 : 18.5) + bx - sx, 36 - pr]);
  const dm = f.dm || [0, 0], dt = f.dt || [0, 0], dmy = f.dmy || 0;
  // mão da arma (direita) e mão livre (esquerda)
  const maoR = [ombroR[0] + (pose.m[0] + dm[0]) * k, ombroR[1] + (pose.m[1] + dm[1] + dmy) * k];
  let maoL = [ombroL[0] - 1 + dt[0], ombroL[1] + 8.5 + dt[1] + dmy];
  const ang = pose.a + (f.da || 0);
  const [adx, ady] = dirAng(ang);
  if (poses.duas && !f.vit && !f.cast && f.joelhos === undefined) maoL = [maoR[0] - adx * 3, maoR[1] - ady * 3];
  if (tipoArma === 'punho') maoL = [ombroL[0] - (2 + dt[0]) * k, ombroL[1] + (7 + dt[1] + dmy) * k];
  if (def.escudo) maoL = [ombroL[0] - 1.5 + dt[0] * 0.3, ombroL[1] + 7 + (dt[1] < 0 ? -2 : 0) + dmy];
  if (f.cast || f.vit) maoL = [ombroL[0] - 2 + dt[0], ombroL[1] + 8 + dt[1]];

  const corManga = def.golem ? [P.M, P.n, P.N] : def.manga === 'metal' ? [P.o, P.M, P.n, P.N] : def.manga === 'pele' ? [P.S, P.s, P.z, P.Q] : def.manga === 'osso' ? [P.O, P.O, P.i] : [P.A, P.a, P.b, escurecer(P.b, 0.3)];
  const corMao = def.golem ? [P.M, P.n, P.N] : def.mao === 'metal' ? [P.o, P.M, P.n] : def.mao === 'osso' ? [P.O, P.O, P.i] : def.mao === 'faixa' ? [P.O, P.i, P.i] : [P.S, P.s, P.z];
  const espBraco = def.golem ? 4.6 * k : def.mangaGrossa ? 3.4 : def.manga === 'osso' ? 2 : 3;
  const espPerna = def.golem ? 4.4 * k : def.perna === 'osso' ? 2.2 : 3.6;
  const corPerna = def.perna === 'osso' ? [P.O, P.O, P.i] : def.golem ? [P.M, P.n, P.N] : [P.V, P.v, P.u, escurecer(P.u, 0.3)];
  const corBota = def.perna === 'osso' ? [P.O, P.i, P.i] : def.golem ? [P.n, P.N, P.N] : [P.F, P.f, P.k, escurecer(P.k, 0.3)];
  const lBraco = (G ? 5 : 4.9) * k, lPerna = (G ? 4 : 5.5) * k;
  const botaF = (L, x, y, cores) => { for (let i = -1; i <= 1; i++) { ponto(L, x + i, y, i < 0 ? cores[0] : cores[1]); ponto(L, x + i, y + 1, cores[2]); } ponto(L, x - 2, y + 1, cores[1]); ponto(L, x + 2, y + 1, cores[2]); ponto(L, x - 2, y, cores[0]); ponto(L, x + 2, y, cores[1]); };

  // capa: de frente aparece atrás, nas laterais; de costas cobre o tronco (desenhada depois dele)
  const capa = (L) => {
    const topo = 17 + by, alt = 16;
    for (let y = 0; y <= alt; y++) {
      const t = y / alt, w = 5.5 + t * 2;
      for (let x = Math.floor(16 + bx - w); x <= Math.ceil(16 + bx + w); x++) ponto(L, x, topo + y, y > alt - 1.5 ? P['6'] : x < 16 + bx - w + 1.5 ? P['4'] : x > 16 + bx + w - 1.5 ? P['6'] : P['5']);
    }
  };
  if (def.capa && !costas) { const L = camada(false); capa(L); camadas.push(L); }
  if (def.aljava && costas) { const L = camada(false); carimbar(L, ALJAVA_B, 11 + bx, 15 + by, P); camadas.push(L); }
  if (def.cabeloLongo && costas) { const L = camada(false); carimbar(L, CABELO_LONGO_B.rows, 10 + bx + CABELO_LONGO_B.x, 4 + by + CABELO_LONGO_B.y + (f.hy || 0), P); camadas.push(L); }
  // pernas (retas de frente; o passo encurta a perna e levanta o pé)
  for (const [q, pe, cores, cb] of [[quadL, peL, corPerna.map((c) => escurecer(c, 0.08)), corBota.map((c) => escurecer(c, 0.08))], [quadR, peR, corPerna, corBota]]) {
    const L = camada(true);
    let fx = pe[0], fy = pe[1] - 1.5 * k;
    if (f.joelhos) fy = q[1] + 5;
    membro(L, q[0], q[1], fx, fy, espPerna, cores);
    botaF(L, fx, fy + 1.5, cb);
    camadas.push(L);
  }
  // tronco
  { const L = camada(true);
    if (def.golem) { const [tx, ty] = S([9 + bx, 16 + by]); carimbar(L, k > 1 ? TRONCO_COLOSSO : TRONCO_GOLEM, tx, ty, P); }
    else {
      const T = TRONCOS[def.torso] || TRONCOS.tunica;
      carimbar(L, costas ? troncoCostas(T) : T, 11 + bx, 16 + by, P);
      if (def.ombreiras) carimbar(L, OMBREIRAS.rows, 11 + bx + OMBREIRAS.x, 16 + by + OMBREIRAS.y, P);
      if (def.colar && !costas) carimbar(L, COLAR.rows, 11 + bx + COLAR.x, 16 + by + COLAR.y, P);
      for (let i = 1; i < 9; i++) ponto(L, 11 + bx + i, 25.5 + by, P['6']);
    }
    camadas.push(L); }
  if (def.saia) {
    const L = camada(true);
    SAIA.forEach((row, j) => { const off = j >= 3 ? Math.round(sx * (j / 9)) : 0; for (let i = 0; i < row.length; i++) if (row[i] !== '.') ponto(L, 10 + bx + i + off, 26 + by + j, P[row[i]]); });
    camadas.push(L);
  }
  if (def.capa && costas) { const L = camada(true); capa(L); camadas.push(L); }
  if (def.cabeloLongo && !costas) { const L = camada(true); carimbar(L, CABELO_LONGO_F.rows, 10 + bx + CABELO_LONGO_F.x, 4 + by + CABELO_LONGO_F.y + (f.hy || 0), P); camadas.push(L); }
  // cabeça
  { const L = camada(true), hx = 10 + bx, hy = 4 + by + (f.hy || 0);
    if (def.golem) { const [gx, gy] = S([12 + bx, 9 + by + (f.hy || 0)]); carimbar(L, costas ? CABECA_GOLEM_B : k > 1 ? CABECA_COLOSSO : CABECA_GOLEM_F, gx, gy, P); }
    else {
      carimbar(L, (costas ? CABECAS_B : CABECAS_F)[def.cabeca || 'normal'], hx, hy, P);
      if (def.barba && !costas) carimbar(L, BARBA_F.rows, hx + BARBA_F.x, hy + BARBA_F.y, P);
      if (def.mascara && !costas) carimbar(L, MASCARA_F.rows, hx + MASCARA_F.x, hy + MASCARA_F.y, P);
      if (def.capacete) { const c = CHAPEUS_F[def.capacete] || CHAPEUS_F.elmo; carimbar(L, costas ? (c.b || c.f) : c.f, hx + c.x, hy + c.y, P); }
      if (def.olho && !costas) carimbar(L, OLHO_BRILHO_F.rows, hx + OLHO_BRILHO_F.x, hy + OLHO_BRILHO_F.y, P);
      if (def.faixa) carimbar(L, ['555555555555', '655555555556'], hx, hy + 3, P);
      if (def.aureola) carimbar(L, AUREOLA_F.rows, hx + AUREOLA_F.x, hy + AUREOLA_F.y + (f.by === 1 ? -1 : 0), P);
    }
    camadas.push(L); }
  if (def.cachecol) { const L = camada(true); const C = costas ? CACHECOL_B : CACHECOL_F; carimbar(L, C.rows, C.x + bx, C.y + by, P); camadas.push(L); }
  // braço livre (esquerdo na tela) + escudo
  { const L = camada(true);
    const [cx, cy, hx2, hy2] = articulacao(ombroL[0], ombroL[1], maoL[0], maoL[1], lBraco, lBraco, 1);
    membro(L, ombroL[0], ombroL[1], cx, cy, espBraco, corManga); membro(L, cx, cy, hx2, hy2, espBraco * 0.9, corManga);
    if (def.golem) disco(L, hx2, hy2, 2.2 * k, corMao); else mao(L, hx2, hy2, corMao, f.cast || f.vit);
    if (POSES_F[tipoArma] && POSES_F[tipoArma].tras) armaAdaga(L, hx2, hy2, (f.atk === 2 ? 30 : 70), P);
    camadas.push(L);
    if (def.escudo) { const Le = camada(true); carimbar(Le, ESCUDO_F, hx2 - 4, hy2 - 6, P); camadas.push(Le); } }
  // arma + braço da arma (direito na tela)
  const camArma = camada(true);
  if (tipoArma !== 'punho') desenharArma(camArma, tipoArma, maoR[0], maoR[1], ang, P, def, pose);
  const camBraco = camada(true);
  { const [cx, cy, hx2, hy2] = articulacao(ombroR[0], ombroR[1], maoR[0], maoR[1], lBraco, lBraco, -1);
    membro(camBraco, ombroR[0], ombroR[1], cx, cy, espBraco, corManga); membro(camBraco, cx, cy, hx2, hy2, espBraco * 0.9, corManga);
    if (def.golem) disco(camBraco, hx2, hy2, (pose.soco ? 3.2 : 2.6) * k, corMao); else if (pose.soco) disco(camBraco, hx2, hy2, 2.3, corMao); else mao(camBraco, hx2, hy2, corMao, f.cast || f.vit);
  }
  if (tipoArma === 'alaude') camadas.push(camBraco, camArma); else camadas.push(camArma, camBraco);
  camadas.espelhar = !!costas;
  return camadas;
}

