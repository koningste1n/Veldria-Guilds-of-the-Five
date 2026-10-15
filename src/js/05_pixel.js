/* ============================ PIXEL (utilitários) ============================
   Brasões, ícones e a fonte bitmap. Os personagens 32×32 ficam em 02b_boneco.js. */

const CONTORNO = '#120a18';
const PELES = [['#f6d2ae', '#e6b088', '#bf8562'], ['#e8b88c', '#cf9468', '#a06a48'], ['#b97c54', '#96603e', '#6e4430'], ['#7a4e36', '#5e3a28', '#3e2618']];
const CABELOS = ['#2b1d16', '#6b4a2b', '#c88b3a', '#d8b25a', '#9a3b2a', '#e3ddd2'];

function gradeVazia(w, h) { return Array.from({ length: h }, () => Array(w).fill('.')); }
// Desenha uma grade (com 1 px de borda para o contorno) num canvas
function gradeParaCanvas(g, pal, modo) {
  const H = g.length, W = g[0].length;
  const cv = document.createElement('canvas'); cv.width = W + 2; cv.height = H + 2;
  const ctx = cv.getContext('2d');
  const opaco = (x, y) => x >= 0 && y >= 0 && x < W && y < H && g[y][x] !== '.';
  for (let y = -1; y <= H; y++) for (let x = -1; x <= W; x++) {
    if (opaco(x, y)) {
      ctx.fillStyle = modo === 'branco' ? '#ffffff' : (pal[g[y][x]] || '#ff00ff');
      ctx.fillRect(x + 1, y + 1, 1, 1);
    } else if (opaco(x - 1, y) || opaco(x + 1, y) || opaco(x, y - 1) || opaco(x, y + 1)) {
      ctx.fillStyle = CONTORNO; ctx.fillRect(x + 1, y + 1, 1, 1);
    }
  }
  return cv;
}

/* --- brasão 12×12 --- */
const ESCUDO = ['############', '############', '############', '############', '############', '############', '############', '.##########.', '.##########.', '..########..', '...######...', '.....##.....'];
const SIMB = {
  espada: ['..##..', '..##..', '..##..', '.####.', '..##..', '..##..'],
  coroa: ['#.##.#', '#.##.#', '######', '######', '......', '......'],
  estrela: ['..##..', '######', '.####.', '.####.', '##..##', '......'],
  lua: ['..###.', '.##...', '.##...', '.##...', '..###.', '......'],
  caveira: ['.####.', '######', '#..#.#', '######', '.#.#..', '......'],
  chama: ['..#...', '..##..', '.###.#', '.#####', '######', '.####.'],
  torre: ['#.##.#', '######', '.####.', '.#..#.', '.####.', '.####.'],
  folha: ['..##..', '.####.', '######', '.####.', '..##..', '..##..'],
};
function luminancia(hex) { const n = parseInt(hex.slice(1), 16); const r = n >> 16, g = (n >> 8) & 255, b = n & 255; return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
const cacheBrasao = new Map();
function brasaoCanvas(b) {
  const key = `${b.cor1}|${b.cor2}|${b.simbolo}`;
  if (cacheBrasao.has(key)) return cacheBrasao.get(key);
  const g = gradeVazia(12, 12);
  const dentro = (x, y) => x >= 0 && y >= 0 && x < 12 && y < 12 && ESCUDO[y][x] === '#';
  for (let y = 0; y < 12; y++) for (let x = 0; x < 12; x++) {
    if (!dentro(x, y)) continue;
    const borda = !dentro(x - 1, y) || !dentro(x + 1, y) || !dentro(x, y - 1) || !dentro(x, y + 1);
    g[y][x] = borda ? '2' : '1';
  }
  const simbCor = Math.abs(luminancia(b.cor1) - luminancia(b.cor2)) < 0.25 ? (luminancia(b.cor1) > 0.5 ? '3' : '4') : '2';
  (SIMB[b.simbolo] || SIMB.espada).forEach((row, j) => { for (let i = 0; i < 6; i++) if (row[i] === '#') g[2 + j][3 + i] = simbCor; });
  const cv = gradeParaCanvas(g, { 1: b.cor1, 2: b.cor2, 3: '#2b2233', 4: '#f4efe2' });
  cacheBrasao.set(key, cv); return cv;
}

/* --- ícones 12×12 (abas, itens, interface) --- */
const ICONES = {
  guilda: ['..r.....r...', '..rr....rr..', '..a......a..', '.aaa....aaa.', '.aaa.aa.aaa.', '.aaaaaaaaaa.', '.aaaaaaaaaa.', '.aa.aaaa.aa.', '.aaaa..aaaa.', '.aaa....aaa.', '.aaa....aaa.', '............'],
  elenco: ['............', '..aa....bb..', '.aaaa..bbbb.', '.aaaa..bbbb.', '..aa....bb..', '............', '.aaaa..bbbb.', 'aaaaaabbbbbb', 'aaaaaabbbbbb', 'aaaaaabbbbbb', '............', '............'],
  mercado: ['....aaaa....', '.....aa.....', '....aaaa....', '...aaaaaa...', '..aaaggaaa..', '..aagaaaaa..', '..aaaggaaa..', '..aaaaagaa..', '..aaaggaaa..', '...aaaaaa...', '............', '............'],
  liga: ['.aaaaaaaaaa.', 'aa.aaaaaa.aa', 'aa.aaaaaa.aa', '.a.aaaaaa.a.', '...aaaaaa...', '....aaaa....', '.....aa.....', '.....aa.....', '....aaaa....', '...aaaaaa...', '...aaaaaa...', '............'],
  inventario: ['............', '..aaaaaaaa..', '.aaaaaaaaaa.', '.abbbbbbbba.', '.aaaaggaaaa.', '.aaaaggaaaa.', '.aaaaaaaaaa.', '.aaaaaaaaaa.', '.aaaaaaaaaa.', '............', '............', '............'],
  espada: ['.........mo.', '........mom.', '.......mom..', '......mom...', '.....mom....', '..g.mom.....', '...gom......', '...xg.......', '..x..g......', '.x..........', 'x...........', '............'],
  machado: ['......mmm...', '.....mmmmm..', '....wmmmmo..', '....wmmmo...', '....w.mm....', '....w.......', '....w.......', '....w.......', '....w.......', '....x.......', '....x.......', '............'],
  lanca: ['..........o.', '.........mm.', '........mm..', '.......rw...', '......rw....', '.....w......', '....w.......', '...w........', '..w.........', '.w..........', 'x...........', '............'],
  arco: ['....xw......', '....oxw.....', '....o.w.....', '....o.xw....', '....o..w....', '....o..w....', '....o..w....', '....o.xw....', '....o.w.....', '....oxw.....', '....xw......', '............'],
  cajado: ['.........cc.', '........cddc', '........cddc', '.........cc.', '........w...', '.......w....', '......w.....', '.....w......', '....w.......', '...w........', '..x.........', '.x..........'],
  alaude: ['.........x..', '........x.x.', '.......x....', '......x.....', '.....x......', '...www......', '..wwwww.....', '.wwxwww.....', '.wwwwww.....', '..wwww......', '...ww.......', '............'],
  armadura: ['............', '..mm....mm..', '.mmmm..mmmm.', '.mmmmmmmmmm.', '..mmmmmmmm..', '..mmnmmnmm..', '..mmmmmmmm..', '..mmnmmnmm..', '..mmmmmmmm..', '...mmmmmm...', '............', '............'],
  manto: ['....rrrr....', '...rr..rr...', '..rrrrrrrr..', '.rrrrrrrrrr.', '.rr.rrrr.rr.', '....rrrr....', '....rggr....', '....rrrr....', '...rrrrrr...', '...rrrrrr...', '..rrrrrrrr..', '............'],
  amuleto: ['..g......g..', '...g....g...', '....g..g....', '.....gg.....', '....cccc....', '...ccddcc...', '...cddddc...', '...ccddcc...', '....cccc....', '............', '............', '............'],
  anel: ['............', '.....cc.....', '....cddc....', '.....cc.....', '....gggg....', '...g....g...', '...g....g...', '...g....g...', '....gggg....', '............', '............', '............'],
  bau: ['............', '..wwwwwwww..', '.wxxxxxxxxw.', 'wwwwwwwwwwww', 'wggggggggggw', 'wwwwwggwwwww', 'wxxxxgkgxxxw', 'wxxxxxggxxxw', 'wxxxxxxxxxxw', 'wggggggggggw', 'wwwwwwwwwwww', '............'],
  moeda: ['............', '....gggg....', '...gyyyyg...', '..gyygyyyg..', '..gyygyyyg..', '..gyygyyyg..', '..gyygyyyg..', '...gyyyyg...', '....gggg....', '............', '............', '............'],
  campo: ['.....o......', '....ooo.....', '.....o..r...', '....ooo.rr..', '...o.o.or...', '.....o..r...', '....o.o.....', '...o...o....', 'wwwwwwwwwwww', 'xxxxxxxxxxxx', '............', '............'],
  taverna: ['............', '..rrrrrrrr..', '.rrrrrrrrrr.', 'rrrrrrrrrrrr', '.wwwwwwwwww.', '.wyyw..wyyw.', '.wyyw..wyyw.', '.wwww..wwww.', '.wwwwxxwwww.', '.wwwwxxwwww.', '.wwwwxxwwww.', '............'],
  coroa: ['g.g.g', 'ggggg', 'gyygg'],
  engrenagem: ['....aa....', '.a.aaaa.a.', '..aaaaaa..', '.aaa..aaa.', 'aaa....aaa', 'aaa....aaa', '.aaa..aaa.', '..aaaaaa..', '.a.aaaa.a.', '....aa....'],
};
const ICONE_PAL = { a: '#e9dfc9', b: '#a99bb8', g: '#f0c24b', y: '#ffe9a8', r: '#e8743b', m: '#d2d9e0', n: '#7f8a97', o: '#f4efe2', w: '#9a6a3c', x: '#5e3d22', c: '#bd86f5', d: '#efdcff', k: '#170f1f' };
const cacheIcone = new Map();
function iconeCanvas(nome, cores) {
  const key = nome + '|' + (cores ? JSON.stringify(cores) : '');
  if (cacheIcone.has(key)) return cacheIcone.get(key);
  const g = ICONES[nome].map((r) => r.split(''));
  const cv = gradeParaCanvas(g, Object.assign({}, ICONE_PAL, ICONE_CORES[nome] || {}, cores || {}));
  cacheIcone.set(key, cv); return cv;
}

/* --- fonte bitmap 3×5 (números de dano e rótulos na arena) --- */
const FONTE = {};
(() => {
  const d = {
    0: '111101101101111', 1: '010110010010111', 2: '111001111100111', 3: '111001111001111', 4: '101101111001001',
    5: '111100111001111', 6: '111100111101111', 7: '111001010010010', 8: '111101111101111', 9: '111101111001111',
    '+': '000010111010000', '-': '000000111000000', '!': '010010010000010', '%': '101001010100101', ' ': '000000000000000',
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111',
  };
  for (const k in d) FONTE[k] = d[k];
})();
function larguraTexto(txt, esc = 1) { return txt.length * 4 * esc - esc; }
function textoPixel(ctx, txt, x, y, cor, esc = 1, contorno = CONTORNO) {
  txt = String(txt).toUpperCase();
  const desenha = (ox, oy, c) => {
    ctx.fillStyle = c;
    for (let i = 0; i < txt.length; i++) {
      const gl = FONTE[txt[i]] || FONTE[' '];
      for (let p = 0; p < 15; p++) if (gl[p] === '1') ctx.fillRect(Math.round(x + ox + (i * 4 + (p % 3)) * esc), Math.round(y + oy + Math.floor(p / 3) * esc), esc, esc);
    }
  };
  if (contorno) { desenha(-1, 0, contorno); desenha(1, 0, contorno); desenha(0, -1, contorno); desenha(0, 1, contorno); }
  desenha(0, 0, cor);
}

