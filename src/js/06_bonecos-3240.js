/* ============================ BONECOS 32×40 ============================
   Cada personagem é montado por partes sobre um esqueleto 2D: cabeça (cabelo, capacete),
   tronco, braços e pernas com cotovelo e joelho, mãos e botas desenhadas, arma procedural,
   capa/cabelo/saia com movimento secundário. Cada quadro de animação move as articulações.
   Depois aplicamos contorno seletivo entre as partes e contorno externo escuro. */

const BW = 56, BH = 60, OX = 12, OY = 12;          // área de trabalho (com folga para chapéus, pulos e o Colosso)
const ANCORA = { x: OX + 16 + 1, y: OY + 38 + 1 };  // pés no canvas final (com 1 px de borda)
const RETRATO = { x: 11, y: 8, w: 36, h: 45 };      // recorte usado na interface
const CONT_INT = '#2a1630';

/* ---- cores ---- */
function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join(''); }
function clarear(h, f) { const [r, g, b] = hexRgb(h); return rgbHex(r + (255 - r) * f, g + (255 - g) * f, b + (255 - b) * f); }
function escurecer(h, f) { const [r, g, b] = hexRgb(h); return rgbHex(r * (1 - f) + 22 * f, g * (1 - f) + 10 * f, b * (1 - f) + 38 * f); }
const rampa = (h, l = 0.28, d = 0.34) => [clarear(h, l), h, escurecer(h, d)];

/* ---- grades das partes ---- */
const CABECAS = {
  normal: [
    '...hhhhhh...', '..hHHHhhhhh.', '.hHHhhhhhhhh', '.hhhhhhhhhhj', 'hhhhhhhhhhhh', 'hhhhhsssshss',
    'hhhzSsssesss', 'jhhzzsssesss', '.jhhzsssssss', '.jjhzssssQss', '..jj.zzsss..'],
  careca: [
    '...ssssss...', '..sSSSssss..', '.sSSsssssss.', '.sSssssssssz', 'zsssssssssss', 'zsssssssjsss',
    'zzzzSsssesss', 'zzzzzsssesss', '.zzzzsssssss', '.zzzzssssQss', '..zz.zzsss..'],
  caveira: [
    '...OOOOOO...', '..OOOOOOOO..', '.OOOOOOOOOO.', '.OOOOOOOOOOi', 'iOOOOOOOOOOO', 'iOOOOOeeOeeO',
    'iOOOOOeeOeeO', 'iiOOOOOOOOOO', '.iiOOOOOeOO.', '.iiiOeOeOe..', '..ii.OOOO...'],
};
// Capacetes, capuzes e chapéus: { x, y, rows } relativos à origem da cabeça
const CHAPEUS = {
  elmo: { x: -1, y: -2, rows: ['......55......', '.....455......', '....nMMMMn....', '...nMooMMMn...', '..nMoMMMMMMn..', '..nMMMMMMMMMn.', '..nMMMMMNNNNn.', '..nMMMMNeeeen.', '..nMMMMMNNNNn.', '..nnMMMMMMMMn.', '...nMMMMMMMn..', '....nnnnnnn...'] },
  elmoCoroa: { x: -1, y: -4, rows: ['...g..g..g....', '...gyggyggy...', '...yyyyyyyy...', '....NNNNNN....', '...NnnnnnnN...', '..NnnNNNnnnN..', '..NnnnnnnnnnN.', '..NnnnnnNNNNN.', '..NnnnnNcccc N', '..NnnnnnNNNNN.', '..NNnnnnnnnnN.', '...NnnnnnnnN..', '....NNNNNNN...'] },
  chifres: { x: -1, y: -1, rows: ['O............O', 'Oi...nnnn...iO', '.Oi.nMooMn.iO.', '..OinMMMMMniO.', '...nMMMMMMMn..', '...NNNNNNNNN..'] },
  asas: { x: -1, y: -2, rows: ['.OO...........', 'OOOi.nnnnn....', '.OOinMooMMn...', '..OinMMMMMMn..', '...nMMMMMMMMn.', '...ggggggggg..'] },
  capuz: { x: -1, y: -2, rows: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaaab', '.aAaaaaaaaaab.', '.aaaab.....ab.', 'aaaab.........', 'aaaab.........', 'aaab..........', 'aaab..........', '.aab..........', '..bb..........'] },
  capuzGelo: { x: -1, y: -3, rows: ['.......C......', '......CcC.....', '.....aacaa....', '...aAAaaaaa...', '..aAAaaaaaaO..', '.aAaaaaaaaaOO.', '.aaaaO.....OO.', 'aaaaO.........', 'aaaaO.........', 'aaaO..........', 'aaaO..........', '.aaO..........', '..OO..........'] },
  capuzSol: { x: -1, y: -2, rows: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaGaaaaa..', '.aAAaGGGaaaagg', '.aAaaaGaaaagg.', '.aaaag.....gg.', 'aaaag.........', 'aaaag.........', 'aaag..........', 'aaag..........', '.aag..........', '..gg..........'] },
  capuzSombra: { x: -1, y: -2, rows: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaaab', '.aAaaaaaaaaab.', '.aaaab.....ab.', 'aaaab.........', 'aaaab.........', 'aaab..........', 'aaab..........', '.aab..........', '..bb..........'] },
  capuzOsso: { x: -1, y: -3, rows: ['.....OOO......', '....OeOeO.....', '....aOOOa.....', '...aAAaaaa....', '..aAAaaaaaaa..', '.aAaaaaaaaaaab', '.aaaab.....ab.', 'aaaab.........', 'aaaab.........', 'aaab..........', 'aaab..........', '.aab..........', '..bb..........'] },
  capuzLua: { x: -1, y: -3, rows: ['.......CC.....', '......C..C....', '.....aaaCaa...', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaaab', '.aaaab.....ab.', 'aaaab.........', 'aaaab.........', 'aaab..........', 'aaab..........', '.aab..........', '..bb..........'] },
  chapeu: { x: -2, y: -8, rows: ['..b.............', '...bb...........', '....bab.........', '.....aab........', '.....aAab.......', '....aAAaab......', '....aAaaab......', '...aAaaaaab.....', '...gGgggggy.....', '..aaaaaaaaaab...', '.bbbbbbbbbbbbbb.'] },
  boina: { x: -1, y: -2, rows: ['.....rrrrr....', '...rRRRrrrrr..', '..rRRrrrrrrrr.', '..rrrrrrrrrrrX', '...XXXXXXXXX..'] },
  pena: { x: -1, y: -1, rows: ['O.............', 'Oi............', '.Oi...........', '..Oi..........', '...ggggggggg..'] },
  coroaSol: { x: 0, y: -4, rows: ['..G..G..G...', '..gG.gG.gG..', '..gggggggg..', '..yyyyyyyy..'] },
  corvo: { x: -1, y: -2, rows: ['....aaaaa.....', '...aAAAaaaa...', '..aAAaaaaaaa..', '.aAAaaaaaaaaa.', '.aAaaaaaaaaaaN', '.aaaaaaanNNNNN', 'aaaaaaaaCnNNN.', 'aaaaaaaaanNN..', 'aaab....aaN...', 'aaab..........', '.aab..........', '..bb..........'] },
};
const BARBA = { x: 0, y: 7, rows: ['....hHhhhhh.', '....hhhhhhhh', '....hhhhhhh.', '.....hhhhhh.', '......hhhh..', '.......hh...'] };
const CABELO_LONGO = { x: 0, y: 7, rows: ['hhhh..', 'hhhhh.', 'hHhhh.', 'hhhhh.', '.hhhh.', '.hhhj.', '..hhj.', '..hj..', '...j..'] };
const MASCARA = { x: 4, y: 8, rows: ['33333333', '22222222', '.222222.'] };
const OLHO_BRILHO = { x: 8, y: 6, rows: ['C', 'c'] };
const AUREOLA = { x: 1, y: -6, rows: ['..gGGGGg..', '.g......g.', '..gggggg..'] };
const CACHECOL = { x: 5, y: 12, rows: ['.....5555', '..4555665', '.4556....', '456......', '56.......'] };

// Troncos 10×10 (origem do tronco = sprite 11,13)
const TRONCOS = {
  tunica: ['..aaaaaa..', '.aAAAaaab.', 'aAAaaaaabb', 'aAaaaaaabb', 'aAaaaaaabb', 'aaaaaaaabb', 'llllglllll', 'aaa5555abb', 'aaa5555abb', '.aa5555bb.'],
  alca: ['..aaaaaa..', '.aAAAaalb.', 'aAAaaalabb', 'aAaaalaabb', 'aAaalaaabb', 'aaalaaaabb', 'llllglllll', 'aaa5555abb', 'aaa5555abb', '.aa5555bb.'],
  placa: ['..MMMMMM..', '.MooMMMMn.', 'MoMM55MMnn', 'MoMM55MMnn', 'MMMM55MMnn', 'nMMM55MMnN', 'llllglllll', 'MMM5555MnN', 'MMM5555nnN', '.nn5555nN.'],
  couro: ['..UUUUUU..', '.UUUKUUUK.', 'aAUUUUUabb', 'aAaassaabb', 'aAaassaabb', 'aaaasaaabb', 'llllglllll', 'aaa5555abb', 'aaa5555abb', '.aa5555bb.'],
  escamas: ['..aaaaaa..', '.aAaAaAab.', 'aAaAaAaabb', 'aaAaAaAabb', 'aAaAaAaabb', 'aaAaAaAabb', 'gggggggggg', 'aaa5555abb', 'aaa5555abb', '.aa5555bb.'],
  manto: ['..222222..', '.2AAAaa2b.', 'aAA5aaaabb', 'aAaa5aaabb', 'aAaaa5aabb', 'aaaaaa5abb', '2222222522', 'aaaaaaaabb', 'aaaaaaaabb', 'aaaaaaaabb'],
  gibao: ['..aaaaaa..', '.aAAAaa5b.', 'aAAaaa5abb', 'aAaaa5aabb', 'aAaa5aaabb', 'aaa5aaaabb', 'llllglllll', 'aaaaaaaabb', 'aAaaaaaabb', '.aaaaaabb.'],
  sombra: ['..aaaaaa..', '.aAAaaaab.', 'aAlaaalabb', 'aAlaaalabb', 'aAgaaagabb', 'aalaaalabb', 'llllglllll', 'aaaaaaaabb', 'aaaaaaaabb', '.aaaaaabb.'],
  monge: ['..ssaaaa..', '.sSsaAaab.', 'sSsaAaaabb', 'sssaAaaabb', 'ssaAaaaabb', 'saAaaaaabb', '5555g55555', 'aaaaaaaabb', 'aaaaaaaabb', '.aaaaaabb.'],
  ossos: ['...OOOO...', '..O.OO.O..', '..OOOOOO..', '..O.OO.O..', '..OOOOOO..', '....OO....', '...OOOO...', '..O.OO.O..', '..O....O..', '..........'],
  pedra: ['.nnMMMMnn.', 'nMMoMMMMnN', 'nMMMcMMMnN', 'MMMMcMMnNN', 'nMMMMcMMnN', 'nMMMMcMMnN', 'nnMMMMMnNN', 'NnnMMMnnNN', '.NnnnnnNN.', '..NNNNNN..'],
};
const OMBREIRAS = { x: -1, y: -1, rows: ['.oMn......oMn.', 'oMMMn....oMMMn', '.nnn......nnn.'] };
const COLAR = { x: 2, y: 1, rows: ['O.O.O.', '.OOO..'] };
const SAIA = ['.aaaaaaaabb.', '.aAaaaaaabb.', 'aAaaaaaaaabb', 'aAaaaaaaaabb', 'aAaaaaaaaabb', 'aAaaaaaaaabb', 'aAaaaaaaaabb', 'aaaaaaaaaabb', 'aaaaaaaaabbb', '222222222222'];
const ESCUDO_ARMA = ['.NnnnnnN.', 'NnMMMMMnN', 'nM44744Mn', 'nM47774Mn', 'nM44744Mn', 'nM44744Mn', 'nM45555Mn', '.nM555Mn.', '.nnM5Mnn.', '..nnMnn..', '...NNN...'];
const TRONCO_GOLEM = ['...nnMMMMnn...', '..nMMoMMMMMn..', '.nMMoMMMMMMMn.', 'nMMMMMcMMMMMnN', 'nMMMMcMMMMMnNN', 'nMMMMcMMcMMnNN', 'nnMMMMMMcMnnNN', '.nnMMMMMMnnNN.', '.NnnnMMMnnnNN.', '..NNnnnnnnNN..', '...NNNNNNNN...'];
const ALJAVA = ['O.O.', 'rOr.', 'WWW.', 'wwx.', 'wwx.', 'wwx.', 'wwx.', 'wwx.', '.x..'];
const CABECA_GOLEM = ['.NnnnnN.', 'NnMMMMnN', 'NMCnnCMN', 'NnMMMMnN', '.NnccnN.', '..NNNN..'];

/* ---- definições dos bonecos (classes, campeões, chefes e invocações) ---- */
const METAL_PADRAO = ['#f6f8fa', '#cdd5de', '#8c97a6', '#5a6272'];
const BONECOS = {
  guardiao: { capacete: 'elmo', torso: 'placa', ombreiras: true, capa: true, arma: 'espada', escudo: true, manga: 'metal', mao: 'metal', cores: { a: '#9aa6b8', b: '#6c778a', c: '#5aa7e6', calca: '#5d6779', bota: '#3d4350' } },
  machadeiro: { capacete: 'chifres', barba: true, torso: 'couro', arma: 'machado', manga: 'pele', cores: { a: '#8c4a2f', b: '#5e2e1c', c: '#ffb36b', calca: '#5b3a2a', bota: '#3a2418' } },
  lanceira: { capacete: 'asas', cabeloLongo: true, torso: 'escamas', arma: 'lanca', manga: 'a', cores: { a: '#e0745a', b: '#a8503d', c: '#ffd27a', calca: '#7a3a3a', bota: '#4a2a20' } },
  arqueira: { capacete: 'capuz', torso: 'alca', aljava: true, arma: 'arco', manga: 'a', cores: { a: '#5b8c3e', b: '#3d6129', c: '#c8e6a0', calca: '#4a3a2a', bota: '#3a2a1a' } },
  piromante: { capacete: 'chapeu', torso: 'manto', saia: true, arma: 'cajado', orbe: 'fogo', manga: 'a', cores: { a: '#c0392b', b: '#f0c24b', c: '#ff8c1a', calca: '#5a2020', bota: '#3a1a14' } },
  criomante: { capacete: 'capuzGelo', torso: 'manto', saia: true, arma: 'cajado', orbe: 'cristal', manga: 'a', cores: { a: '#3a6fb0', b: '#e8f1ff', c: '#7fd6ff', calca: '#2a3a5a', bota: '#1e2a40' } },
  clerica: { capacete: 'capuzSol', aureola: true, torso: 'manto', saia: true, arma: 'cajado', orbe: 'sol', manga: 'a', cores: { a: '#f2ede0', b: '#f0c24b', c: '#ffd23f', calca: '#c9bfa8', bota: '#8a7a5a' } },
  lamina: { capacete: 'capuzSombra', mascara: true, olho: true, cachecol: true, torso: 'sombra', arma: 'adagas', manga: 'a', cores: { a: '#3b3150', b: '#241d33', c: '#c48bff', calca: '#2a2338', bota: '#1a1424' } },
  bardo: { capacete: 'boina', torso: 'gibao', arma: 'alaude', manga: 'a', mangaGrossa: true, cores: { a: '#2f8f83', b: '#1f6058', c: '#5fe0c8', calca: '#3a2f4a', bota: '#3a2418' } },
  invocador: { capacete: 'capuzOsso', olho: true, torso: 'manto', colar: true, saia: true, arma: 'cajado', orbe: 'caveira', manga: 'a', cores: { a: '#2e3240', b: '#55606e', c: '#7dff9a', calca: '#22252e', bota: '#16181e' } },
  esqueleto: { cabeca: 'caveira', semCabelo: true, torso: 'ossos', arma: 'espada', manga: 'osso', perna: 'osso', mao: 'osso', metal: ['#d8c8a8', '#b09a7a', '#7d6a50', '#4e4030'], cores: { a: '#e8e2cf', b: '#bdb3a0', c: '#7dff9a', calca: '#e8e2cf', bota: '#bdb3a0' } },
  golem: { golem: true, cores: { a: '#7a7480', b: '#4a4652', c: '#ff8a3c' }, metal: ['#b8b2c0', '#8a8494', '#5e5868', '#3e3a46'] },
  // Campeões Lendários
  gorm: { capacete: 'chifres', barba: true, cabeloCor: '#e3ddd2', torso: 'placa', ombreiras: true, capa: true, arma: 'martelo', manga: 'metal', mao: 'metal', metal: ['#e8e2d8', '#b8b0a4', '#857c70', '#544c42'], cores: { a: '#8a8278', b: '#5e574f', c: '#ffb36b', calca: '#4a443e', bota: '#2e2a26' } },
  nayla: { capacete: 'pena', cabeloLongo: true, cabeloCor: '#e8f4f8', torso: 'alca', aljava: true, arma: 'arco', manga: 'a', cores: { a: '#2f9c9a', b: '#e8f4f8', c: '#9ff0e8', calca: '#2a5a5a', bota: '#1e3a3a' } },
  okon: { cabeca: 'careca', semCabelo: true, faixa: true, torso: 'monge', arma: 'punho', manga: 'pele', mao: 'faixa', cores: { a: '#e8963b', b: '#a85c1e', c: '#ffd27a', calca: '#a85c1e', bota: '#5e3a1e' } },
  aurelia: { capacete: 'coroaSol', cabeloLongo: true, cabeloCor: '#f0c75e', torso: 'placa', ombreiras: true, capa: true, arma: 'cajado', orbe: 'sol', manga: 'metal', mao: 'metal', metal: ['#fffaf0', '#f2e6c8', '#cdb88a', '#8e7a50'], cores: { a: '#f2ede0', b: '#f0c24b', c: '#fff4c2', calca: '#c9bfa8', bota: '#8a7a5a' } },
  ravik: { capacete: 'capuzLua', mascara: true, olho: true, torso: 'sombra', capa: true, arma: 'adagas', manga: 'a', cores: { a: '#1e1830', b: '#3b2f5c', c: '#b06cff', calca: '#16121f', bota: '#0e0b14' } },
  // Líderes de Copa
  barao: { capacete: 'elmo', torso: 'placa', ombreiras: true, capa: true, arma: 'espada', escudo: true, manga: 'metal', mao: 'metal', metal: ['#f0b48a', '#c8763e', '#8e4a22', '#5a2a14'], cores: { a: '#b5642f', b: '#7a3d1c', c: '#ff9a3c', calca: '#5a2a14', bota: '#3a1a0c' } },
  corvina: { capacete: 'corvo', cachecol: true, torso: 'sombra', arma: 'adagas', manga: 'a', cores: { a: '#2a2238', b: '#7d2219', c: '#e0574f', calca: '#1e1828', bota: '#120e18' } },
  colosso: { golem: true, grande: true, cores: { a: '#5e5868', b: '#3e3a46', c: '#ff7a2f' }, metal: ['#a8a2b0', '#7a7484', '#524c5c', '#34303c'] },
  selene_fogo: { capacete: 'chapeu', torso: 'manto', saia: true, arma: 'cajado', orbe: 'fogo', manga: 'a', cabeloCor: '#e3ddd2', cores: { a: '#d8d2e8', b: '#8e7cc3', c: '#ff8c1a', calca: '#5e5480', bota: '#3a3450' } },
  selene_gelo: { capacete: 'chapeu', torso: 'manto', saia: true, arma: 'cajado', orbe: 'cristal', manga: 'a', cabeloCor: '#e3ddd2', cores: { a: '#d8d2e8', b: '#8e7cc3', c: '#7fd6ff', calca: '#5e5480', bota: '#3a3450' } },
  selene_raio: { capacete: 'chapeu', torso: 'manto', saia: true, arma: 'cajado', orbe: 'raio', manga: 'a', cabeloCor: '#e3ddd2', cores: { a: '#d8d2e8', b: '#8e7cc3', c: '#ffe14a', calca: '#5e5480', bota: '#3a3450' } },
  rei: { capacete: 'elmoCoroa', torso: 'placa', ombreiras: true, capa: true, arma: 'espadao', manga: 'metal', mao: 'metal', metal: ['#9a90b0', '#5e5672', '#3e384e', '#24202e'], cores: { a: '#3a3346', b: '#7d2219', c: '#b06cff', calca: '#24202e', bota: '#16121c' } },
};


