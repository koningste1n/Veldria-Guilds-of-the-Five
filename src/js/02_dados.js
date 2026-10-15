/* ============================ DADOS ============================ */
/* Tudo o que define o conteúdo do jogo fica aqui, para ser fácil de ajustar. */

// Alcances em pixels lógicos da arena (256×180)
const ALCANCE = { corpo: 18, medio: 54, longo: 100 };
const ALCANCE_NOME = { corpo: 'Corpo a corpo', medio: 'Médio', longo: 'Longo' };

/* Classes: base = nível 1 (VIDA, ATQ, DEF, AGI). cresc = faixa por nível.
   O Potencial decide em que ponto de cada faixa o mercenário cai. */
const CLASSES = {
  guardiao: {
    nome: 'Guardião de Ferro', papel: 'Tanque', papelId: 'tanque', alcance: 'corpo',
    base: [425, 10, 24, 10], cresc: [[36, 50], [1.5, 2.5], [2.3, 3.2], [0.5, 1.0]],
    skill: 'muralha', passiva: 'peleAco', proj: null,
  },
  machadeiro: {
    nome: 'Machadeiro Furioso', papel: 'Lutador', papelId: 'lutador', alcance: 'corpo',
    base: [375, 18, 12, 17], cresc: [[31, 42], [2.7, 3.7], [1.2, 2.0], [0.8, 1.4]],
    skill: 'redemoinho', passiva: 'furia', proj: null,
  },
  lanceira: {
    nome: 'Lanceira da Aurora', papel: 'Lutadora', papelId: 'lutador', alcance: 'medio',
    base: [330, 17, 14, 18], cresc: [[28, 37], [2.4, 3.2], [1.4, 2.0], [0.9, 1.4]],
    skill: 'investida', passiva: 'estocada', proj: null, alcanceCustom: 28,
  },
  arqueira: {
    nome: 'Arqueira do Vale', papel: 'Atiradora', papelId: 'atirador', alcance: 'longo',
    base: [230, 16, 6, 30], cresc: [[16, 23], [2.5, 3.3], [0.6, 1.0], [1.5, 2.2]],
    skill: 'chuva', passiva: 'olho', proj: 'flecha', crit: 0.05,
  },
  piromante: {
    nome: 'Piromante', papel: 'Mago', papelId: 'mago', alcance: 'longo',
    base: [200, 18, 5, 14], cresc: [[14, 22], [3.2, 4.3], [0.5, 0.9], [0.6, 1.0]],
    skill: 'bolaFogo', passiva: 'brasa', proj: 'fagulha',
  },
  criomante: {
    nome: 'Criomante', papel: 'Mago', papelId: 'mago', alcance: 'longo',
    base: [210, 17, 7, 16], cresc: [[16, 22], [2.8, 3.7], [0.7, 1.0], [0.7, 1.1]],
    skill: 'lancaGelo', passiva: 'inverno', proj: 'gelinho',
  },
  clerica: {
    nome: 'Clériga do Sol', papel: 'Curandeira', papelId: 'curandeira', alcance: 'medio',
    base: [240, 11, 8, 18], cresc: [[18, 25], [1.6, 2.4], [0.8, 1.2], [0.8, 1.2]],
    skill: 'luz', passiva: 'bencao', proj: 'luzinha',
  },
  lamina: {
    nome: 'Lâmina Sombria', papel: 'Assassino', papelId: 'assassino', alcance: 'corpo',
    base: [225, 18, 7, 34], cresc: [[16, 23], [2.8, 3.6], [0.6, 1.0], [1.8, 2.6]],
    skill: 'passo', passiva: 'golpeFatal', proj: null, crit: 0.10, critDmg: 0.40,
  },
  bardo: {
    nome: 'Bardo de Guerra', papel: 'Suporte', papelId: 'suporte', alcance: 'medio',
    base: [255, 12, 10, 22], cresc: [[20, 27], [1.8, 2.4], [1.0, 1.4], [1.0, 1.5]],
    skill: 'hino', passiva: 'ritmo', proj: 'nota',
  },
  invocador: {
    nome: 'Invocador de Ossos', papel: 'Invocador', papelId: 'invocador', alcance: 'longo',
    base: [210, 13, 8, 14], cresc: [[16, 22], [2.0, 2.8], [0.8, 1.1], [0.6, 1.0]],
    skill: 'esqueletos', passiva: 'colheita', proj: 'osso',
  },
};
const CLASSES_RECRUTAVEIS = Object.keys(CLASSES);
const CLASSES_FRENTE = ['guardiao', 'machadeiro', 'lanceira'];

// Habilidades ativas (CD = recarga em segundos). desc recebe os atributos atuais.
const SKILLS = {
  muralha: { nome: 'Muralha Viva', cd: 12, fx: 'Escudo + Controle',
    desc: (s) => `Escudo de 20% da VIDA máx. (${fmt(s.vida * 0.2)}) por 5 s e provoca os inimigos próximos por 2 s.` },
  redemoinho: { nome: 'Redemoinho', cd: 9, fx: 'Área',
    desc: (s) => `Gira o machado: 140% ATQ (≈${fmt(s.atq * 1.4)}) em todos os inimigos adjacentes e os afasta.` },
  investida: { nome: 'Investida', cd: 10, fx: 'Mobilidade + Controle',
    desc: (s) => `Avança até o alvo: 150% ATQ (≈${fmt(s.atq * 1.5)}), empurra e atordoa por 1 s.` },
  chuva: { nome: 'Chuva de Flechas', cd: 11, fx: 'Área',
    desc: (s) => `3 ondas de flechas numa área, 60% ATQ cada (≈${fmt(s.atq * 0.6)}).` },
  bolaFogo: { nome: 'Bola de Fogo', cd: 8, fx: 'Dano + Dano contínuo',
    desc: (s) => `180% ATQ (≈${fmt(s.atq * 1.8)}) com pequena explosão + Queimadura de ${fmt1(s.atq * 0.1)}/s por 4 s.` },
  lancaGelo: { nome: 'Lança de Gelo', cd: 8, fx: 'Dano + Penalidade',
    desc: (s) => `200% ATQ (≈${fmt(s.atq * 2)}) + Lentidão de 40% por 3 s.` },
  luz: { nome: 'Luz Restauradora', cd: 6, fx: 'Cura',
    desc: (s) => `Cura o aliado com menor % de vida em 280% ATQ (≈${fmt(s.atq * 2.8)}).` },
  passo: { nome: 'Passo Sombrio', cd: 10, fx: 'Mobilidade + Dano',
    desc: (s) => `Teleporta até o inimigo mais fraco da retaguarda: 200% ATQ (≈${fmt(s.atq * 2)}).` },
  hino: { nome: 'Hino de Batalha', cd: 12, fx: 'Bônus',
    desc: () => `Todos os aliados ganham +30% ATQ e +30% AGI por 8 s.` },
  esqueletos: { nome: 'Erguer Esqueletos', cd: 15, fx: 'Invocação',
    desc: (s) => `Invoca 2 esqueletos (VIDA ${fmt(s.vida * 0.36)}, ATQ ${fmt(s.atq * 0.36)}) por 12 s. Máx. 4.` },
};

const PASSIVAS = {
  peleAco: { nome: 'Pele de Aço', desc: '−8% de dano recebido.' },
  furia: { nome: 'Fúria', desc: '+1% ATQ a cada 3% de vida perdida (máx. +30%).' },
  estocada: { nome: 'Estocada', desc: 'O ataque básico também atinge um 2º inimigo logo atrás do alvo.' },
  olho: { nome: 'Olho Treinado', desc: 'O 1º ataque da luta é crítico garantido. +5% de crítico.' },
  brasa: { nome: 'Brasa', desc: 'Alvos queimando recebem +10% de dano.' },
  inverno: { nome: 'Inverno', desc: '30% de chance de Congelar por 1,5 s alvos que estão lentos.' },
  bencao: { nome: 'Bênção', desc: 'Aliados próximos regeneram 1,2% da VIDA máx. por segundo.' },
  golpeFatal: { nome: 'Golpe Fatal', desc: '+10% de crítico e +40% de dano crítico.' },
  ritmo: { nome: 'Ritmo', desc: 'A cada 4º ataque, reduz em 0,75 s a recarga dos aliados.' },
  colheita: { nome: 'Colheita', desc: 'Cada inimigo abatido cura 5% da VIDA máx. de todos os aliados.' },
};

// Traços: multiplicadores e bônus
const TRACOS = {
  prodigio: { nome: 'Prodígio', desc: '+25% XP', pos: true, xp: 1.25 },
  robusto: { nome: 'Robusto', desc: '+10% VIDA', pos: true, vida: 1.10 },
  brutamontes: { nome: 'Brutamontes', desc: '+10% ATQ', pos: true, atq: 1.10 },
  couracado: { nome: 'Couraçado', desc: '+10% DEF', pos: true, def: 1.10 },
  veloz: { nome: 'Veloz', desc: '+10% AGI', pos: true, agi: 1.10 },
  sortudo: { nome: 'Sortudo', desc: '+10 Sorte e +3% crítico', pos: true, sorte: 10, crit: 0.03 },
  vampiro: { nome: 'Vampiro', desc: '5% de roubo de vida', pos: true, roubo: 0.05 },
  preguicoso: { nome: 'Preguiçoso', desc: '−15% XP', pos: false, xp: 0.85 },
  fragil: { nome: 'Frágil', desc: '−10% VIDA', pos: false, vida: 0.90 },
  desastrado: { nome: 'Desastrado', desc: '−3% crítico', pos: false, crit: -0.03 },
};
const TRACOS_POS = Object.keys(TRACOS).filter((k) => TRACOS[k].pos);
const TRACOS_NEG = Object.keys(TRACOS).filter((k) => !TRACOS[k].pos);

// Potencial: chance base (Taverna nv. 1), faixa de crescimento e preço base
const POTS = ['F', 'D', 'C', 'B', 'A', 'S'];
const POT_INFO = {
  F: { peso: 10, faixa: [0, 0.20], preco: 60, cor: '#8f879b' },
  D: { peso: 20, faixa: [0.15, 0.35], preco: 90, cor: '#c98f5e' },
  C: { peso: 30, faixa: [0.30, 0.55], preco: 140, cor: '#7bcf6f' },
  B: { peso: 22, faixa: [0.50, 0.75], preco: 220, cor: '#63aef0' },
  A: { peso: 13, faixa: [0.70, 0.90], preco: 350, cor: '#bd86f5' },
  S: { peso: 5, faixa: [0.85, 1.0], preco: 600, cor: '#f3c64f' },
};

// Raridades de itens
const RARIDADES = [
  { nome: 'Comum', cor: '#aaa4b3', peso: 55, mult: 1.0, nb: 1, preco: 1 },
  { nome: 'Incomum', cor: '#7bcf6f', peso: 27, mult: 1.25, nb: 2, preco: 2 },
  { nome: 'Raro', cor: '#63aef0', peso: 12, mult: 1.6, nb: 2, preco: 4 },
  { nome: 'Épico', cor: '#bd86f5', peso: 5, mult: 2.0, nb: 3, preco: 9 },
  { nome: 'Lendário', cor: '#f3c64f', peso: 1, mult: 2.6, nb: 3, preco: 20 },
];
const GARANTIA = { epico: 10, lendario: 50 }; // drops seguidos sem Épico+ / sem Lendário

const TIPOS_ITEM = { arma: 'Arma', armadura: 'Armadura', amuleto: 'Amuleto' };
const ITEM_BASES = {
  arma: [['Espada', 'espada'], ['Machado', 'machado'], ['Lança', 'lanca'], ['Arco', 'arco'], ['Cajado', 'cajado'], ['Adagas', 'espada'], ['Maça', 'machado'], ['Alaúde', 'alaude']],
  armadura: [['Cota de Malha', 'armadura'], ['Couraça', 'armadura'], ['Gibão', 'armadura'], ['Manto', 'manto'], ['Túnica', 'manto']],
  amuleto: [['Amuleto', 'amuleto'], ['Anel', 'anel'], ['Talismã', 'amuleto'], ['Broche', 'anel']],
};
const ITEM_SUFIXOS = [
  ['de Treino', 'do Recruta', 'de Ferro Velho', 'da Feira'],
  ['de Aço', 'do Caçador', 'da Guarda', 'do Viajante'],
  ['das Brumas', 'do Falcão', 'da Aurora', 'do Vale'],
  ['do Dragão Jovem', 'da Tempestade', 'do Eclipse', 'do Inverno Eterno'],
  ['do Último Rei', 'da Chama Branca', 'do Pacto Partido', 'das Mil Luas', 'de Vellmora'],
];
const ITEM_FLAVOR = [
  ['Já viu dias melhores.', 'Cheira a taverna.', 'Veio de brinde com uma sopa.', 'Funciona. Na maioria das vezes.'],
  ['Afiado o suficiente.', 'Um ferreiro honesto fez isto.', 'Leve, firme e sem frescura.'],
  ['Brilha um pouco no escuro.', 'Um bardo já cantou sobre isto.', 'Pesa menos do que parece.'],
  ['Zune baixinho quando há perigo.', 'Dizem que pertenceu a uma lenda menor.', 'Quente ao toque, mesmo no inverno.'],
  ['Os rivais engolem seco quando veem isto.', 'Forjado antes do Torneio existir.', 'Tem nome próprio e opinião também.'],
];
// Efeitos únicos de itens Lendários
const UNICOS = {
  chama: { tipo: 'arma', nome: 'Lâmina Ardente', desc: 'Ataques básicos têm 15% de chance de queimar (8% ATQ/s por 3 s).' },
  eco: { tipo: 'arma', nome: 'Eco', desc: 'A cada 5º ataque básico, golpeia duas vezes.' },
  executor: { tipo: 'arma', nome: 'Executor', desc: '+40% de dano em alvos abaixo de 30% de vida.' },
  baluarte: { tipo: 'armadura', nome: 'Baluarte', desc: 'Começa a luta com escudo de 15% da VIDA máx.' },
  espinhos: { tipo: 'armadura', nome: 'Espinhos', desc: 'Reflete 15% do dano corpo a corpo recebido.' },
  folego: { tipo: 'armadura', nome: 'Segundo Fôlego', desc: 'Abaixo de 30% de vida, cura 20% uma vez por luta.' },
  pressa: { tipo: 'amuleto', nome: 'Pressa', desc: '+30% AGI nos primeiros 6 s de luta.' },
  energia: { tipo: 'amuleto', nome: 'Fonte de Energia', desc: 'Se for o capitão, a Energia enche 30% mais rápido.' },
  trevo: { tipo: 'amuleto', nome: 'Sorte Grande', desc: '+25 de Sorte para a guilda.' },
};
const STAT_NOME = { vida: 'VIDA', atq: 'ATQ', def: 'DEF', agi: 'AGI', crit: 'Crítico', critDmg: 'Dano crítico', esquiva: 'Esquiva', roubo: 'Roubo de vida', sorte: 'Sorte', recarga: 'Recarga' };
const STAT_PCT = { crit: 1, critDmg: 1, esquiva: 1, roubo: 1, recarga: 1 };

const NOMES = ['Bruna', 'Tavio', 'Mirela', 'Odran', 'Kessa', 'Davi', 'Ilsa', 'Rurik', 'Nadja', 'Ciro', 'Yara', 'Teodor', 'Luma', 'Garrik', 'Selma', 'Ivo', 'Zaira', 'Bento', 'Oriana', 'Fausto', 'Lia', 'Tobias', 'Mara', 'Heitor', 'Nuna', 'Caio', 'Vesna', 'Otto', 'Iris', 'Ramon', 'Edda', 'Joca', 'Petra', 'Anselmo', 'Brisa', 'Darian', 'Elói', 'Fiona', 'Gaspar', 'Helga', 'Inácio', 'Jade', 'Lorena', 'Matias', 'Nilo', 'Olga', 'Pietro', 'Quitéria', 'Rosa', 'Saulo', 'Tereza', 'Ubaldo', 'Valquíria', 'Wendel', 'Xica', 'Zeca'];
const GUILD_A = ['Corvos', 'Martelos', 'Serpentes', 'Lobos', 'Leões', 'Vespas', 'Javalis', 'Falcões', 'Ursos', 'Raposas', 'Touros', 'Escorpiões', 'Gárgulas', 'Texugos', 'Cabras', 'Mariposas'];
const GUILD_B = ['de Cinza', 'de Bronze', 'do Pântano', 'da Geada', 'de Areia', 'do Norte', 'da Colina', 'de Ferro', 'do Porto', 'da Névoa', 'do Abismo', 'de Prata Velha', 'da Taverna Torta', 'do Moinho', 'do Brejo', 'da Ponte Quebrada'];
const CORES_BRASAO = ['#c0392b', '#e8743b', '#f0c24b', '#6cc76a', '#1f8a70', '#3b82c4', '#2c3e8f', '#8e44ad', '#d35d8e', '#f4efe2', '#7f8c8d', '#2b2233'];
const SIMBOLOS = ['espada', 'coroa', 'estrela', 'lua', 'caveira', 'chama', 'torre', 'folha'];

// Construções da sede (progresso ocioso)
const CONSTRUCOES = {
  bilheteria: { nome: 'Bilheteria', base: 150, fator: 1.55, max: 10, icone: 'moeda',
    efeito: (n) => `${fmt1(n * divAtual().mult * multOcio())} ouro/min no cofre` },
  campo: { nome: 'Campo de Treino', base: 200, fator: 1.55, max: 10, icone: 'campo',
    efeito: (n) => `${fmt1(2 * n * multOcio())} XP/min para todos os mercenários` },
  taverna: { nome: 'Taverna', base: 300, fator: 1.55, max: 10, icone: 'taverna',
    efeito: (n) => `${4 + Math.floor((n - 1) / 2)} vagas · S ${potPesos(n)[5]}% · A ${potPesos(n)[4]}%` },
  // Acampamento (Fase 4.1): mais expedições simultâneas e elenco maior. O nível máximo depende da divisão.
  acampamento: { nome: 'Acampamento', base: 400, fator: 1.7, max: 8, icone: 'expedicao', maxDiv: [2, 4, 6, 7, 8],
    efeito: (n) => `${slotsExpedicao(n)} expedições ao mesmo tempo · elenco de até ${elencoDoAcampamento(n)}` },
  forja: { nome: 'Forja', base: 250, fator: 1.55, max: 10, icone: 'forja',
    efeito: (n) => `aprimora itens até +${n}` },
  relogio: { nome: 'Relógio da Guilda', base: 500, fator: 2, max: 4, icone: 'relogio', inicial: 0,
    efeito: (n) => `limite offline de ${8 + 2 * n} h` },
};
const slotsExpedicao = (n) => 2 + n;                       // nv. 1 = 3 vagas … nv. 8 = 10 vagas
const elencoDoAcampamento = (n) => ECO.elencoMax + n - 1;   // nv. 1 = 8 mercenários … nv. 8 = 15
const DIVISOES = [
  { id: 'bronze', nome: 'Bronze', base: 1, mult: 1, time: 3, reliquias: 3, cor: '#c98f5e' },
  { id: 'prata', nome: 'Prata', base: 6, mult: 1.5, time: 3, reliquias: 3, cor: '#c9cdd8' },
  { id: 'ouro', nome: 'Ouro', base: 12, mult: 2.2, time: 4, reliquias: 4, cor: '#f0c24b' },
  { id: 'diamante', nome: 'Diamante', base: 18, mult: 3, time: 4, reliquias: 4, cor: '#7fd6ff' },
  { id: 'lenda', nome: 'Lenda', base: 24, mult: 4, time: 5, reliquias: 5, cor: '#bd86f5' },
];
const DIFICULDADES = {
  facil: { nome: 'Fácil', mult: 0.85, rec: 1 },
  normal: { nome: 'Normal', mult: 1.0, rec: 1 },
  dificil: { nome: 'Difícil', mult: 1.2, rec: 1 },
  pesadelo: { nome: 'Pesadelo', mult: 1.45, rec: 1.5 },
};
const ECO = {
  xpBase: 40, xpPorNivel: 20, xpDerrota: 0.4,
  ouroBase: 60, ouroPorNivel: 15, ouroDerrota: 0.3,
  chanceBau: 0.35, capOfflineMin: 8 * 60,
  elencoMax: 8, invMax: 40,
  lutasRenovar: 3, minutosRenovar: 30, custoRenovar: 50,
  amistosoRec: 0.5, vendaMerc: 0.4, vendaItem: 0.3,
};
const PREMIOS_TEMPORADA = [800, 500, 350, 250, 150, 120, 100, 80];
const ASCENSOES = [{ nivel: 10, ouro: 1000, emblemas: 5 }, { nivel: 20, ouro: 5000, emblemas: 15 }];
function divAtual() { return DIVISOES[(typeof STATE !== 'undefined' && STATE && STATE.divisao) || 0]; }

// Pesos de potencial conforme o nível da Taverna (move 2 pontos de F/D para A/S por nível)
function potPesos(nivelTaverna) {
  const sh = nivelTaverna - 1;
  const w = POTS.map((p) => POT_INFO[p].peso);
  const tiraF = Math.min(w[0], sh), tiraD = Math.min(w[1], sh);
  w[0] -= tiraF; w[1] -= tiraD;
  w[4] += Math.floor((tiraF + tiraD) / 2); w[5] += Math.ceil((tiraF + tiraD) / 2);
  return w;
}

