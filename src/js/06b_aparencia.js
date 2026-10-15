/* ============================ APARÊNCIA (EV2) ============================
   Cada mercenário tem raça, pele, penteado, cor de cabelo, barba e uma das roupas da classe.
   Só visual: nada aqui muda atributos. Vista 3/4 (estilo Eslabong): corpo de lado, rosto com os dois olhos.
   Look = "tipo|pele|cabelo|cor1|cor2|raca|penteado|barba|roupa|corRoupa|evo" (os 5 primeiros campos são os de antes;
   looks antigos, com 5 campos, continuam válidos e ganham a aparência padrão). */

const RACAS = {
  humano: { nome: 'Humano', peles: [0, 1, 2, 3, 4, 5] },
  elfo: { nome: 'Elfo', peles: [0, 1, 6, 3, 4], orelha: 'elfo' },
  anao: { nome: 'Anão', peles: [0, 1, 2, 3, 5], baixo: true, nariz: true, barbaChance: 0.85 },
  orc: { nome: 'Orc', peles: [7, 8, 9], orelha: 'curta', presas: 'orc', sobrancelha: true },
  ogro: { nome: 'Ogro', peles: [10, 11, 12], orelha: 'curta', presas: 'ogro', largo: true, sobrancelha: true, nariz: true },
  porcino: { nome: 'Porcino', peles: [13, 14, 15], focinho: 'porco', orelha: 'porco' },
  felino: { nome: 'Felino', peles: [16, 17, 18, 19], focinho: 'gato', orelha: 'gato', olhoCor: '#e8d84a' },
};
const RACAS_IDS = Object.keys(RACAS);
const PESO_RACA = { humano: 34, elfo: 15, anao: 11, orc: 13, ogro: 7, porcino: 10, felino: 10 };
// Tons de pele [brilho, base, sombra]. 0–3 são os de antes (saves antigos ficam com a mesma cor)
const PELES_TODAS = [
  ['#f6d2ae', '#e6b088', '#bf8562'], ['#e8b88c', '#cf9468', '#a06a48'], ['#b97c54', '#96603e', '#6e4430'], ['#7a4e36', '#5e3a28', '#3e2618'],
  ['#fbe1c8', '#f0c4a0', '#cf9a78'], ['#5a3a2a', '#45291c', '#2c1a12'], ['#e0c49a', '#c9a676', '#9c7c52'],
  ['#9fcf6a', '#7aae4a', '#4f7f32'], ['#8bb86e', '#6a9450', '#466a36'], ['#b6c46a', '#93a24a', '#66732f'],     // orc
  ['#a9b4b8', '#8a969c', '#5e6a72'], ['#b4a888', '#968a6a', '#6a6048'], ['#9aa8c4', '#7a88a6', '#55607c'],     // ogro
  ['#ffc8c8', '#f2a0a6', '#c8707e'], ['#e8b0a0', '#c98a7a', '#9a5e52'], ['#c49a8a', '#a07464', '#704c40'],     // porcino
  ['#ffcf8a', '#f0a04a', '#b8702e'], ['#d8d4d0', '#aaa4a0', '#77706c'], ['#5a5260', '#3e3846', '#26222c'], ['#fff4e4', '#ecdcc4', '#c0ac90'],   // felino
];
// Cores de cabelo. 0–5 são as de antes
const CABELOS_TODOS = ['#2b1d16', '#6b4a2b', '#c88b3a', '#d8b25a', '#9a3b2a', '#e3ddd2', '#232a45', '#c4562a', '#b83232', '#8d8f99', '#4a2a5a', '#2f5a4a'];
const NOMES_FEMININOS = new Set(['Bruna', 'Mirela', 'Kessa', 'Ilsa', 'Nadja', 'Yara', 'Luma', 'Selma', 'Zaira', 'Oriana', 'Lia', 'Mara', 'Nuna', 'Vesna', 'Iris', 'Edda', 'Petra', 'Brisa', 'Fiona', 'Helga', 'Jade', 'Lorena', 'Olga', 'Quitéria', 'Rosa', 'Tereza', 'Valquíria', 'Xica']);

/* ---- cabeças por raça: 12×11, rosto virado para a direita. S brilho · s pele · z sombra ---- */
const CABECA_BASE = [
  '...SSSSs....', '..SSSSssss..', '.SSssssssss.', '.Sssssssssss', 'zsssssssssss', 'zsssssssssss',
  'zsssssssssss', 'zzssssssssss', '.zssssssssss', '.zzssssssss.', '...zzzsss...'];
const CABECA_LARGA = [
  '...SSSSs....', '..SSSSssss..', '.SSssssssss.', '.Sssssssssss', 'zsssssssssss', 'zsssssssssss',
  'zsssssssssss', 'zzsssssssssss', '.zsssssssssss', '.zzsssssssss.', '..zzzzsssss..'];
// Traços do rosto: [x, y, código] relativos à cabeça
const ROSTO = {
  olhos: [[6, 6, 'e'], [6, 7, 'e'], [9, 6, 'e'], [9, 7, 'e']],
  olhosPequenos: [[6, 6, 'e'], [9, 6, 'e'], [6, 7, 'z'], [9, 7, 'z']],
  olhosGato: [[6, 6, 'Y'], [6, 7, 'e'], [9, 6, 'Y'], [9, 7, 'e']],
  boca: [[8, 9, 'm']],
  rubor: [[5, 8, 'B'], [10, 8, 'B']],
  orelha: [[2, 6, 'S'], [2, 7, 's'], [3, 7, 'z']],
  sobrancelha: [[5, 5, 'z'], [6, 5, 'z'], [7, 5, 'z'], [8, 5, 'z'], [9, 5, 'z'], [10, 5, 'z']],
  nariz: [[11, 6, 'S'], [12, 7, 's'], [11, 7, 's'], [11, 8, 'z']],
  presasOrc: [[7, 9, 'e'], [8, 9, 'e'], [9, 9, 'e'], [10, 9, 'e'], [7, 8, 'O'], [10, 8, 'O']],
  presasOgro: [[6, 9, 'e'], [7, 9, 'e'], [8, 9, 'e'], [9, 9, 'e'], [10, 9, 'e'], [11, 9, 'e'], [6, 8, 'O'], [11, 8, 'O'], [7, 10, 's'], [8, 10, 's'], [9, 10, 's'], [10, 10, 's'], [11, 10, 'z']],
  focinhoPorco: [[10, 7, 'S'], [11, 7, 'S'], [12, 7, 'S'], [10, 8, 's'], [11, 8, 'e'], [12, 8, 's'], [10, 9, 'z'], [11, 9, 'z'], [12, 9, 'z'], [9, 9, 'm']],
  focinhoGato: [[11, 7, 'B'], [10, 8, 'z'], [11, 8, 'm'], [12, 7, 'O'], [12, 8, 'O'], [13, 6, 'O'], [13, 8, 'O']],
};
// Orelhas que ficam POR CIMA do cabelo
const ORELHAS = {
  elfo: [[3, 7, 's'], [2, 6, 's'], [2, 7, 'z'], [1, 5, 'S'], [1, 6, 'B'], [0, 4, 'S'], [0, 5, 's'], [-1, 3, 'S']],
  curta: [[2, 6, 's'], [1, 5, 'S'], [2, 7, 'z'], [1, 6, 'z']],
  porco: [[1, -1, 'S'], [2, -1, 'S'], [2, 0, 's'], [3, 0, 'B'], [3, 1, 's'], [7, -1, 'S'], [8, -1, 'S'], [8, 0, 'B'], [9, 0, 's'], [9, 1, 'z']],
  gato: [[1, -3, 'S'], [1, -2, 'S'], [2, -2, 'B'], [1, -1, 's'], [2, -1, 'B'], [3, -1, 's'], [8, -3, 'S'], [8, -2, 'S'], [9, -2, 'B'], [7, -1, 's'], [8, -1, 'B'], [9, -1, 's'], [10, -1, 'z']],
};

/* ---- penteados: f = frente (por cima da cabeça), t = trás (atrás do corpo). H brilho · h cabelo · j sombra ---- */
const PENTEADOS = {
  curto: { nome: 'Curto', x: -1, y: -1, f: [
    '....hhhhhh....', '..hhHHHhhhh...', '.hhHHhhhhhhhh.', '.hHhhhhhhhhhhh', 'hhhhhhhhhhhhhh', 'hhhhhhjhhjhjhh', 'jhhhj.........', 'jjhh..........', '.jj...........'] },
  espetado: { nome: 'Espetado', x: -2, y: -4, f: [
    '.....h...h.....', '....hh..hh..h..', '..h.hHh.hHhhh..', '..hhHHhhHhhhh..', '.hhHHhhhhhhhhhh', 'hhhHhhhhhhhhhhh', '.hhhhhhhhhhhhhh', 'hhhhhhhhhjhhjhh', '.hhhhhhjj.hj.j.', 'hhhhhj.........', '.jhhj..........', '..jj...........'] },
  franja: { nome: 'Franja', x: -1, y: -3, f: [
    '.....h..h.....', '...hhhhhhhh...', '.hhHHHhhhhhhh.', 'hhHHhhhhhhhhhh', 'hHhhhhhhhhhhhh', 'hhhhhhhhhhhhhh', 'hhhhhhhhhhhhhh', 'jhhhhjhhhjhhhhh', 'jhhhj......hhhh', 'jjhh.......hhj.', '.jj........hh..', '...........j...'] },
  longo: { nome: 'Longo', x: -1, y: -1, f: [
    '....hhhhhh....', '..hhHHHhhhh...', '.hhHHhhhhhhhh.', '.hHhhhhhhhhhhh', 'hhhhhhhhhhhhhh', 'hhhhhhjhhjhjhh', 'hhhhj.......hh', 'hhhh........hj', 'hhhh........hj', 'jhhh.........j', 'jhhj..........', '.jj...........'],
    t: { x: -2, y: 7, rows: ['hhhhh.', 'hHhhh.', 'hhhhhh', 'hhhhhh', 'hhhhhj', '.hhhhj', '.hhhjj', '..hhj.', '..jj..'] } },
  cacheado: { nome: 'Cacheado', x: -3, y: -3, f: [
    '....hh.hhh.hh.....', '..hhhhhhhhhhhhh...', '.hhHHhhjhhhhjhhh..', 'hhHHhhhhhhhhhhhhh.', '.hHhhjhhhhjhhhhhhh', 'hhhhhhhhhhhhhhhjhh', 'hhhjhhhhhhhhhhhhh.', '.hhhhhhhjhhjhhjhhh', 'hhhhhhh........hh.',
    '.hhjhhh........jh.', 'hhhhhj.........hh.', '.jhhhh..........j.', 'hhhhj.............', '.jhj..............'],
    t: { x: -4, y: 6, rows: ['.hh.hhh..', 'hhhHhhhh.', 'hHhhjhhhh', 'hhhhhhhhj', 'jhhjhhhjj', '.hhhhhhj.', '.jhhjhhj.', '..jhhj...', '...jj....'] } },
  rabo: { nome: 'Rabo de cavalo', x: -1, y: -1, f: [
    '....hhhhhh....', '..hhHHHhhhh...', '.hhHHhhhhhhhh.', '.hHhhhhhhhhhhh', 'hhhhhhhhhhhhhh', 'hhhhhhhjhhhjhh', 'jhhhj.........', 'jjhh..........'],
    t: { x: -4, y: 2, rows: ['..hh..', '.hHhj.', 'hhhhj.', 'hhhj..', 'hhhj..', '.hhj..', '.hhj..', '..hj..', '..j...'] } },
  coque: { nome: 'Coque', x: -2, y: -4, f: [
    '..hhhh.........', '.hHHhhj........', '.hhhhhj........', '..jhhhhhhh.....', '...hHHHhhhh....', '..hhHhhhhhhhh..', '..hHhhhhhhhhhh.', '.hhhhhhhhhhhhhh', '.hhhhhhhjhhjhhh', '.jhhhj.........', '.jjhh..........'] },
  moicano: { nome: 'Moicano', x: 0, y: -5, f: [
    '..h...h.....', '..hh.hh.h...', '...hhhhhh...', '..hHhhhhh...', '..hHhhhhj...', '...jhhhj....'] },
  careca: { nome: 'Careca', x: 0, y: 0, f: [] },
  tranca: { nome: 'Trança', x: -1, y: -1, f: [
    '....hhhhhh....', '..hhHHHhhhh...', '.hhHHhhhhhhhh.', '.hHhhhhhhhhhhh', 'hhhhhhhhhhhhhh', 'hhhhhhjhhhjhhh', 'jhhhj.........', 'jhhh..........', '.jhh..........'],
    t: { x: -1, y: 8, rows: ['hhj', 'jhh', 'hhj', 'jhh', 'hhj', '.h.', 'gyg'] } },
};
const PENTEADOS_IDS = Object.keys(PENTEADOS);
const PENTEADOS_FEM = ['longo', 'cacheado', 'rabo', 'coque', 'tranca', 'franja', 'curto', 'espetado'];
const PENTEADOS_MASC = ['curto', 'espetado', 'franja', 'moicano', 'careca', 'rabo', 'longo', 'cacheado'];
const BARBAS = {
  curta: { x: 4, y: 8, rows: ['hh....hh', 'hhhhhhhh', '.hhhhhh.'] },
  longa: { x: 3, y: 7, rows: ['h......hh', 'hh.....hhh', 'hhhhhhhhhh', 'hhhhhhhhhh', '.hHhhhhhhj', '..hhhhhhj.', '...hhhhj..', '....jj....'] },
  bigode: { x: 6, y: 8, rows: ['hhhhhh', 'h....h'] },
};
const BARBAS_IDS = ['', 'curta', 'longa', 'bigode'];

/* ---- roupas: 3 por classe. Cada uma troca peças do boneco base (BONECOS da classe) ---- */
const ROUPAS = {
  guardiao: [{ nome: 'Placa e elmo' }, { nome: 'Placa e capa', capacete: null }, { nome: 'Cota e tabardo', capacete: 'aro', torso: 'tabardo', ombreiras: false }],
  machadeiro: [{ nome: 'Couro e chifres' }, { nome: 'Peito nu', capacete: null, torso: 'tiras', ombreiras: 'pelo' }, { nome: 'Bandana', capacete: 'bandana', torso: 'couro' }],
  lanceira: [{ nome: 'Elmo alado' }, { nome: 'Escamas', capacete: null, capa: true }, { nome: 'Tiara', capacete: 'aro', torso: 'placa', ombreiras: true }],
  arqueira: [{ nome: 'Capuz' }, { nome: 'Gibão', capacete: 'pena', torso: 'couro' }, { nome: 'Bandana', capacete: 'bandana' }],
  piromante: [{ nome: 'Chapéu de mago' }, { nome: 'Manto', capacete: null, colar: true }, { nome: 'Diadema', capacete: 'aro' }],
  criomante: [{ nome: 'Capuz de gelo' }, { nome: 'Diadema', capacete: 'aro' }, { nome: 'Chapéu', capacete: 'chapeu' }],
  clerica: [{ nome: 'Capuz do sol' }, { nome: 'Auréola', capacete: null }, { nome: 'Coroa do sol', capacete: 'coroaSol' }],
  lamina: [{ nome: 'Capuz sombrio' }, { nome: 'Rosto à mostra', capacete: null }, { nome: 'Bandana', capacete: 'bandana' }],
  bardo: [{ nome: 'Boina' }, { nome: 'Chapéu de pena', capacete: 'chapeuPena' }, { nome: 'Sem chapéu', capacete: null }],
  invocador: [{ nome: 'Capuz de ossos' }, { nome: 'Rosto à mostra', capacete: null }, { nome: 'Capuz', capacete: 'capuzSombra' }],
};
// Cor principal da roupa: opções por classe (a primeira é a de sempre)
const CORES_ROUPA = {
  guardiao: ['#9aa6b8', '#a8946a', '#7d8aa8', '#8e9c8a'],
  machadeiro: ['#8c4a2f', '#6a5a3a', '#7a3a4a', '#4a5a3a'],
  lanceira: ['#e0745a', '#5a8ac0', '#c0a040', '#8a5ab0'],
  arqueira: ['#5b8c3e', '#8a6a3a', '#3a7a6a', '#6a7a3a'],
  piromante: ['#c0392b', '#8a2a5a', '#d06a2a', '#4a2a3a'],
  criomante: ['#3a6fb0', '#4a8aa8', '#6a5ab0', '#2a5a7a'],
  clerica: ['#f2ede0', '#e8dcc0', '#dfe8f0', '#f0e0e8'],
  lamina: ['#3b3150', '#2a3a3a', '#4a2a2a', '#2a2a3a'],
  bardo: ['#2f8f83', '#a03a5a', '#c08a2a', '#3a5aa0'],
  invocador: ['#2e3240', '#3a2e40', '#2e4032', '#40342e'],
};

/* ---- peças novas (capacetes e troncos) usadas pelas roupas ---- */
Object.assign(CHAPEUS, {
  aro: { x: 0, y: 2, cobre: false, rows: ['..gggggggggg', '.gyyyGcGyyy.'] },
  bandana: { x: -1, y: 1, cobre: false, rows: ['...44444444..', '..4555555555.', '445555555555.', '56..........', '6...........'] },
  chapeuPena: { x: -3, y: -6, cobre: false, rows: ['..............O.', '.............Oi.', '....aaaaaa..Oi..', '...aAAAaaaaOi...', '...aAaaaaaaaa...', '...5555555555...', '.aaaaaaaaaaaaab.', 'bbbbbbbbbbbbbbbb'] },
});
for (const k of ['elmo', 'elmoCoroa', 'capuz', 'capuzGelo', 'capuzSol', 'capuzSombra', 'capuzOsso', 'capuzLua', 'corvo']) CHAPEUS[k].cobre = true;
Object.assign(TRONCOS, {
  tabardo: ['..MMMMMM..', '.Mo4444Mn.', 'MoM4774nnn', 'MMM4774Mnn', 'MMM4444Mnn', 'nMM4444MnN', 'lll4g44lll', 'MMM4444MnN', 'MMM5555nnN', '.nn5555nN.'],
  tiras: ['..SSSSSS..', '.SSSSSlsz.', 'SSSSSlsszz', 'SSsslsszzz', 'SsslSsszzz', 'sslssssszz', 'llllglllll', 'aaa5555abb', 'aaa5555abb', '.aa5555bb.'],
});
const OMBREIRAS_PELO = { x: -2, y: -2, rows: ['.UUUK.....UUK..', 'UUUUKK...UUUKK.', '.KKKK.....KKK..'] };

/* ---- sorteio da aparência ---- */
function sortearAparencia(cls, nome, R = Math.random) {
  const ri = (n) => Math.floor(R() * n);
  const pesos = RACAS_IDS.map((r) => PESO_RACA[r]), tot = pesos.reduce((a, b) => a + b, 0);
  let x = R() * tot, raca = RACAS_IDS[0];
  for (let i = 0; i < pesos.length; i++) { x -= pesos[i]; if (x < 0) { raca = RACAS_IDS[i]; break; } }
  const Rc = RACAS[raca], fem = NOMES_FEMININOS.has(nome);
  const estilos = fem ? PENTEADOS_FEM : PENTEADOS_MASC;
  const barbaChance = fem ? 0 : Rc.barbaChance ?? (raca === 'humano' ? 0.35 : raca === 'orc' || raca === 'ogro' ? 0.2 : raca === 'elfo' || raca === 'felino' || raca === 'porcino' ? 0.05 : 0.3);
  return {
    raca, pele: ri(Rc.peles.length), cabelo: ri(CABELOS_TODOS.length), penteado: estilos[ri(estilos.length)],
    barba: R() < barbaChance ? 1 + ri(3) : 0, roupa: ri(3), corRoupa: R() < 0.4 ? 0 : ri(4),
  };
}
// Aparência estável a partir do id (migração do save e lutadores sem aparência salva)
function aparenciaPadrao(m) {
  const R = mulberry32(((m.id || 7) * 2654435761) ^ 0x5eed);
  return sortearAparencia(m.classe, m.nome, R);
}
function garantirAparencia(m) {
  if (m.campeao || m.chefe || m.visual || m.ap) return m;
  const ap = aparenciaPadrao(m);
  // quem já existia mantém a cor do cabelo e, se for humano, o tom de pele de antes
  if (typeof m.cabelo === 'number') ap.cabelo = m.cabelo;
  if (ap.raca === 'humano' && typeof m.pele === 'number') ap.pele = Math.min(m.pele, RACAS.humano.peles.length - 1);
  m.ap = ap;
  return m;
}

function misturar(a, b2, f) { const x = hexRgb(a), y = hexRgb(b2); return rgbHex(...x.map((v, i) => v + (y[i] - v) * f)); }
/* ---- EV5: a evolução muda o boneco. cor = tom da evolução (olhos que brilham, orbe, metal da arma e da armadura
   puxam para ela) · peças = o que o boneco ganha · aura = brilho na luta ---- */
const EVO_VISUAL = {
  guardiao: { a: { cor: '#ff6a5a', pecas: { ombreiras: true, capa: true } }, b: { cor: '#ffd23f', pecas: { ombreiras: true, capa: true, aureola: true } } },
  machadeiro: { a: { cor: '#ff3a2a', pecas: { olho: true, pintura: true } }, b: { cor: '#b03a6a', pecas: { capa: true, olho: true } } },
  lanceira: { a: { cor: '#ffd23f', pecas: { capa: true, ombreiras: true } }, b: { cor: '#5aa7e6', pecas: { ombreiras: true } } },
  arqueira: { a: { cor: '#ffd84a', pecas: { capa: true } }, b: { cor: '#6cd07a', pecas: { capa: true, cachecol: true } } },
  piromante: { a: { cor: '#ff8c1a', pecas: { olho: true } }, b: { cor: '#ff3a2a', pecas: { olho: true, capa: true } } },
  criomante: { a: { cor: '#7fe6ff', pecas: { ombreiras: true } }, b: { cor: '#e8f4ff', pecas: { capa: true, olho: true } } },
  clerica: { a: { cor: '#ffe48a', pecas: { capa: true } }, b: { cor: '#ff7a4a', pecas: { ombreiras: true, olho: true } } },
  lamina: { a: { cor: '#ff3a4a', pecas: { olho: true } }, b: { cor: '#a06aff', pecas: { capa: true, olho: true } } },
  bardo: { a: { cor: '#ffd23f', pecas: { capa: true } }, b: { cor: '#a06aff', pecas: { olho: true, capa: true } } },
  invocador: { a: { cor: '#7dff9a', pecas: { olho: true, colar: true } }, b: { cor: '#b06cff', pecas: { capa: true, ombreiras: true, olho: true } } },
};
const evoVisual = (cls, evo) => (EVO_VISUAL[cls] && evo && EVO_VISUAL[cls][evo]) || null;
const PINTURA_GUERRA = [[5, 6, 'X'], [5, 7, 'X'], [10, 6, 'X'], [10, 8, 'X'], [7, 8, 'X'], [8, 8, 'X']];
