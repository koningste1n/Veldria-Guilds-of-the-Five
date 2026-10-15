/* ============================ DADOS DA FASE 2 ============================ */

// Habilidades exclusivas dos Campeões Lendários
Object.assign(SKILLS, {
  terremoto: { nome: 'Terremoto', cd: 15, fx: 'Controle + Escudo',
    desc: (s) => `Atordoa todos os inimigos por 2 s e dá escudo de 15% da VIDA máx. a todos os aliados (o seu: ${fmt(s.vida * 0.15)}).` },
  tempestadeFlechas: { nome: 'Tempestade de Flechas', cd: 14, fx: 'Dano em área',
    desc: (s) => `12 flechas em inimigos aleatórios, 70% ATQ cada (≈${fmt(s.atq * 0.7)}).` },
  milPalmas: { nome: 'Mil Palmas', cd: 12, fx: 'Dano + Controle',
    desc: (s) => `10 golpes rápidos de 45% ATQ (≈${fmt(s.atq * 0.45)}); o último atordoa por 1,5 s.` },
  juramento: { nome: 'Juramento Solar', cd: 18, fx: 'Cura + Ressurreição',
    desc: () => 'Revive o primeiro aliado caído com 50% da vida e cura todos os aliados em 30% da VIDA máx.' },
  eclipse: { nome: 'Eclipse', cd: 16, fx: 'Execução',
    desc: (s) => `Escurece a arena: executa inimigos abaixo de 25% de vida e causa 150% ATQ (≈${fmt(s.atq * 1.5)}) nos demais.` },
});

const CAMPEOES = {
  gorm: { nome: 'Gorm Casco-de-Pedra', classe: 'guardiao', visual: 'gorm', skill: 'terremoto', titulo: 'O Montanha que Anda' },
  nayla: { nome: 'Nayla Vento-Cortante', classe: 'arqueira', visual: 'nayla', skill: 'tempestadeFlechas', titulo: 'Flecha que Assobia' },
  okon: { nome: 'Mestre Okon', classe: 'machadeiro', visual: 'okon', skill: 'milPalmas', titulo: 'Punho do Mosteiro Partido' },
  aurelia: { nome: 'Aurélia da Chama Branca', classe: 'clerica', visual: 'aurelia', skill: 'juramento', titulo: 'Juramento do Amanhecer' },
  ravik: { nome: 'Ravik, o Eclipse', classe: 'lamina', visual: 'ravik', skill: 'eclipse', titulo: 'Sombra Sem Lua' },
};

// Líderes de Copa (um por divisão). razao = força relativa ao poder do time (as mecânicas pesam diferente)
const LIDERES = [
  { id: 'barao', nome: 'Barão Ferrugem', visual: 'barao', classe: 'guardiao', mult: 1.5, razao: 1.1, desc: 'Reflete 20% do dano recebido.' },
  { id: 'corvina', nome: 'Gêmeas Corvina', visual: 'corvina', classe: 'lamina', duplo: true, mult: 1.25, razao: 0.92, desc: 'Quando uma cai, a outra entra em fúria (+50% ATQ).' },
  { id: 'colosso', nome: 'Colosso de Basalto', visual: 'colosso', classe: 'guardiao', skill: 'redemoinho', mult: 1.5, razao: 0.93, desc: 'A cada 33% de vida perdida, invoca 2 golens.' },
  { id: 'selene', nome: 'Arquimaga Selene', visual: 'selene_fogo', classe: 'piromante', mult: 1.8, razao: 0.84, desc: 'Troca de elemento a cada 8 s: fogo queima, gelo deixa lento e raio salta para outro alvo.' },
  { id: 'rei', nome: 'Rei Sem Coroa', visual: 'rei', classe: 'machadeiro', mult: 2, razao: 0.92, desc: 'Copia a habilidade do inimigo com mais ATQ.' },
];

// Valor aproximado com os atributos do mercenário (ou nada, se for só a descrição geral)
const aprox = (s, f, k = 'atq') => (s ? ` (≈${fmt(s[k] * f)})` : '');

const MULT_CHEFE = Object.fromEntries(LIDERES.map((l) => [l.id, l.mult]));
// Rivais de divisões mais altas são mais bem treinados (multiplica todos os atributos)
const MULT_RIVAL = [1, 1.02, 1.05, 1.04, 1.1];

/* Pergaminhos de Habilidade: r = raridade (0 Comum … 4 Lendário).
   papeis 'todos' ou lista de papéis compatíveis. */
const PAPEIS_NOME = { tanque: 'Tanque', lutador: 'Lutador', atirador: 'Atirador', mago: 'Mago', curandeira: 'Curandeira', assassino: 'Assassino', suporte: 'Suporte', invocador: 'Invocador' };
const PERGAMINHOS = {
  golpeFirme: { nome: 'Golpe Firme', r: 0, tipo: 'ativa', cd: 10, papeis: 'todos', fx: 'Dano único', desc: (s) => `150% ATQ${aprox(s, 1.5)} no alvo.` },
  peleGrossa: { nome: 'Pele Grossa', r: 0, tipo: 'passiva', papeis: 'todos', mod: { defPct: 0.08 }, desc: () => '+8% DEF.' },
  primeirosSocorros: { nome: 'Primeiros Socorros', r: 0, tipo: 'ativa', cd: 12, papeis: 'todos', fx: 'Cura', desc: (s) => `Abaixo de 60% de vida, cura 15% da própria VIDA máx.${s ? ` (${fmt(s.vida * 0.15)})` : ''}.` },
  passoLigeiro: { nome: 'Passo Ligeiro', r: 0, tipo: 'passiva', papeis: 'todos', mod: { agiPct: 0.08 }, desc: () => '+8% AGI.' },
  gritoIntimidador: { nome: 'Grito Intimidador', r: 0, tipo: 'ativa', cd: 14, papeis: ['tanque', 'lutador'], fx: 'Penalidade', desc: () => 'Inimigos próximos causam −15% de dano por 4 s.' },
  flechaVenenosa: { nome: 'Flecha Venenosa', r: 1, tipo: 'ativa', cd: 10, papeis: ['atirador', 'assassino', 'mago'], fx: 'Dano contínuo', desc: (s) => `100% ATQ + veneno de ${s ? fmt1(s.atq * 0.2) : '20% ATQ'}/s por 4 s.` },
  gritoGuerra: { nome: 'Grito de Guerra', r: 1, tipo: 'ativa', cd: 15, papeis: 'todos', fx: 'Bônus', desc: () => 'Todos os aliados ganham +12% ATQ por 6 s.' },
  reflexos: { nome: 'Reflexos', r: 1, tipo: 'passiva', papeis: 'todos', mod: { esquiva: 0.08 }, desc: () => '+8% de esquiva.' },
  corteSangrento: { nome: 'Corte Sangrento', r: 1, tipo: 'ativa', cd: 10, papeis: ['tanque', 'lutador', 'assassino'], fx: 'Dano contínuo', desc: (s) => `120% ATQ + sangramento de ${s ? fmt1(s.atq * 0.15) : '15% ATQ'}/s por 5 s.` },
  bencaoMenor: { nome: 'Bênção Menor', r: 1, tipo: 'ativa', cd: 10, papeis: ['curandeira', 'suporte', 'mago', 'invocador'], fx: 'Cura', desc: (s) => `Cura o aliado mais ferido em 150% ATQ${aprox(s, 1.5)}.` },
  correnteEletrica: { nome: 'Corrente Elétrica', r: 2, tipo: 'ativa', cd: 10, papeis: ['mago', 'suporte', 'invocador'], fx: 'Dano em cadeia', desc: (s) => `Raio que salta entre 3 inimigos, 90% ATQ cada${aprox(s, 0.9)}.` },
  barreiraArcana: { nome: 'Barreira Arcana', r: 2, tipo: 'ativa', cd: 14, papeis: ['curandeira', 'suporte', 'mago'], fx: 'Escudo', desc: () => 'Escudo de 25% da VIDA máx. no aliado mais ferido por 6 s.' },
  laminaSedenta: { nome: 'Lâmina Sedenta', r: 2, tipo: 'passiva', papeis: 'todos', mod: { roubo: 0.08 }, desc: () => '8% de roubo de vida.' },
  golpeAtordoante: { nome: 'Golpe Atordoante', r: 2, tipo: 'ativa', cd: 12, papeis: ['tanque', 'lutador', 'assassino'], fx: 'Dano + Controle', desc: (s) => `130% ATQ${aprox(s, 1.3)} e atordoa por 1,2 s.` },
  olhosAguia: { nome: 'Olhos de Águia', r: 2, tipo: 'passiva', papeis: ['atirador', 'assassino', 'mago'], mod: { crit: 0.08, critDmg: 0.2 }, desc: () => '+8% de crítico e +20% de dano crítico.' },
  meteoro: { nome: 'Meteoro', r: 3, tipo: 'ativa', cd: 18, papeis: ['mago', 'invocador', 'suporte'], fx: 'Área + Controle', desc: (s) => `Área de 250% ATQ${aprox(s, 2.5)} e atordoa por 1 s.` },
  ceifador: { nome: 'Ceifador', r: 3, tipo: 'passiva', papeis: 'todos', flag: 'ceifador', desc: () => '+50% de dano em alvos abaixo de 30% de vida.' },
  tempoAcelerado: { nome: 'Tempo Acelerado', r: 3, tipo: 'passiva', papeis: 'todos', mod: { recarga: 0.2 }, desc: () => '−20% de recarga das habilidades.' },
  muralhaEspinhos: { nome: 'Muralha de Espinhos', r: 3, tipo: 'passiva', papeis: ['tanque', 'lutador'], flag: 'espinhos20', desc: () => 'Reflete 20% do dano corpo a corpo recebido.' },
  chuvaLaminas: { nome: 'Chuva de Lâminas', r: 3, tipo: 'ativa', cd: 16, papeis: ['assassino', 'atirador', 'lutador'], fx: 'Dano múltiplo', desc: (s) => `5 adagas em inimigos aleatórios, 80% ATQ cada${aprox(s, 0.8)}.` },
  furiaDragao: { nome: 'Fúria do Dragão', r: 4, tipo: 'ativa', cd: 25, papeis: 'todos', fx: 'Área + Dano contínuo', desc: (s) => `Cone de fogo: 400% ATQ${aprox(s, 4)} + queimadura de ${s ? fmt1(s.atq * 0.25) : '25% ATQ'}/s por 5 s.` },
  renascer: { nome: 'Renascer', r: 4, tipo: 'passiva', papeis: 'todos', flag: 'renascer', desc: () => 'Revive 1 vez por luta com 50% da vida.' },
  olhoTempestade: { nome: 'Olho da Tempestade', r: 4, tipo: 'ativa', cd: 24, papeis: 'todos', fx: 'Dano + Controle', desc: (s) => `6 raios em inimigos aleatórios, 120% ATQ cada${aprox(s, 1.2)}, com 20% de chance de atordoar.` },
  egideDivina: { nome: 'Égide Divina', r: 4, tipo: 'ativa', cd: 24, papeis: 'todos', fx: 'Escudo', desc: () => 'Todos os aliados ganham escudo de 20% da VIDA máx. por 6 s.' },
  luaSangue: { nome: 'Lua de Sangue', r: 4, tipo: 'passiva', papeis: 'todos', mod: { atqPct: 0.15, roubo: 0.10 }, flag: 'luaSangue', desc: () => '+15% ATQ e 10% de roubo de vida. Abaixo de 50% de vida, +15% AGI.' },
};
const pergaminhoServe = (pid, papel) => { const p = PERGAMINHOS[pid].papeis; return p === 'todos' || p.includes(papel); };
const txtPapeis = (pid) => { const p = PERGAMINHOS[pid].papeis; return p === 'todos' ? 'Todos os papéis' : p.map((x) => PAPEIS_NOME[x]).join(', '); };

// Relíquias: efeito para o time todo
const RELIQUIAS = {
  moedaDourada: { nome: 'Moeda Dourada', r: 0, desc: '+20% de ouro ganho nas lutas.', ouro: 0.2 },
  ferradura: { nome: 'Ferradura', r: 0, desc: '+10 de Sorte para a guilda.', sorte: 10 },
  pedraAmolar: { nome: 'Pedra de Amolar', r: 0, desc: '+5% ATQ para o time.', atqPct: 0.05 },
  tamborAncestral: { nome: 'Tambor Ancestral', r: 1, desc: '+8% AGI para o time.', agiPct: 0.08 },
  escudoRachado: { nome: 'Escudo Rachado', r: 1, desc: '+8% DEF para o time.', defPct: 0.08 },
  livroGasto: { nome: 'Livro Gasto', r: 1, desc: '+20% de XP nas lutas e no ócio.', xp: 0.2 },
  ampulheta: { nome: 'Ampulheta Rachada', r: 2, desc: '−15% de recarga para o time.', recarga: 0.15 },
  olhoCiclope: { nome: 'Olho do Ciclope', r: 2, desc: '+8% de crítico para o time.', crit: 0.08 },
  coracaoBrasa: { nome: 'Coração de Brasa', r: 2, desc: 'Ataques básicos têm 10% de chance de queimar.', flag: 'brasaRel' },
  caliceVampirico: { nome: 'Cálice Vampírico', r: 3, desc: '10% de roubo de vida para o time.', roubo: 0.10 },
  trevo: { nome: 'Trevo de Quatro Folhas', r: 3, desc: '+40 de Sorte para a guilda.', sorte: 40 },
  estandarteLeao: { nome: 'Estandarte do Leão', r: 3, desc: 'Escudo de 15% da VIDA máx. para todos no início da luta.', flag: 'estandarte' },
  penaFenix: { nome: 'Pena de Fênix', r: 4, desc: 'O 1º aliado a cair revive com 40% da vida (1 vez por luta).', flag: 'fenix' },
  coroaTirano: { nome: 'Coroa do Tirano', r: 4, desc: '+20% ATQ e −10% VIDA para o time.', atqPct: 0.2, vidaPct: -0.1 },
  relogioEterno: { nome: 'Relógio Eterno', r: 4, desc: '+8 h no limite offline e +50% nos ganhos ociosos.', offline: 8, ocio: 0.5 },
};

// Consumíveis (ficam numa bolsa separada, empilháveis)
const CONSUMIVEIS = {
  pocaoFuria: { nome: 'Poção de Fúria', desc: '+25% ATQ para o time na próxima luta.', preco: 90, luta: { atqPct: 0.25 }, icone: 'pocaoV' },
  elixirPedra: { nome: 'Elixir de Pedra', desc: '+25% DEF para o time na próxima luta.', preco: 90, luta: { defPct: 0.25 }, icone: 'pocaoA' },
  tonicoPressa: { nome: 'Tônico de Pressa', desc: '+25% AGI para o time na próxima luta.', preco: 90, luta: { agiPct: 0.25 }, icone: 'pocaoE' },
  bombaPolvora: { nome: 'Bomba de Pólvora', desc: 'No início da luta, causa 20 × nível médio do time de dano em todos os inimigos.', preco: 120, luta: { bomba: 1 }, icone: 'bomba' },
  tonicoSabedoria: { nome: 'Tônico de Sabedoria', desc: '+50% de XP por 1 h, inclusive no ócio.', preco: 160, uso: 'sabedoria', icone: 'pocaoR' },
  mapaTesouro: { nome: 'Mapa do Tesouro', desc: 'A próxima expedição garante um item Raro ou melhor.', preco: 220, uso: 'mapa', icone: 'mapa' },
};
const CONSUMIVEIS_LUTA = ['pocaoFuria', 'elixirPedra', 'tonicoPressa', 'bombaPolvora'];

// Expedições
const EXPEDICOES = [
  { min: 15, nome: 'Patrulha', da: 'da Patrulha', chance: 0.2 },
  { min: 60, nome: 'Caçada', da: 'da Caçada', chance: 0.5 },
  { min: 240, nome: 'Ruínas', da: 'das Ruínas', chance: 1 },
  { min: 480, nome: 'Masmorra', da: 'da Masmorra', chance: 1, garantia: 1, emblema: 1, limite: 3 },   // limite: no máx. 3 ao mesmo tempo
];
// chanceCampeao: chance de um Campeão Lendário entrar na guilda ao vencer a Copa, por divisão
const COPA = { semiOuro: 300, semiEmblemas: 1, finalEmblemas: 3, chanceCampeao: [0.25, 0.35, 0.5, 0.6, 0.75] };

