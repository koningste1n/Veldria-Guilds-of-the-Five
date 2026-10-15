/* ============================ TORRE INFINITA (Fase 3) ============================
   Nível dos inimigos sobe 0,6 por andar até 30; depois disso os atributos crescem 3% por andar. */
const TORRE = {
  nivel: (n) => clamp(Math.round(1 + 0.6 * (n - 1)), 1, 30),
  mult: (n) => 1 + Math.max(0, n - 49) * 0.03,
  tier: (n) => Math.min(4, Math.floor((n - 1) / 10)),
  ouro: (n) => Math.round(30 + 20 * n),
  guardiao: (n) => n % 10 === 0,
  bau: (n) => n % 5 === 0,
  emblemas: (n) => (n % 10 === 0 ? 2 + Math.floor(n / 50) : 0),
};
// Guardiões da Torre: ecos dos Campeões Lendários, um a cada 10 andares
const ECOS = ['gorm', 'nayla', 'okon', 'aurelia', 'ravik'];
const ecoDoAndar = (n) => ECOS[(Math.floor(n / 10) - 1) % ECOS.length];
MULT_CHEFE.eco = 1.2;
// Regras especiais de cada andar (todos = os dois times; aliados = só o seu; inimigos = só eles)
const MODS_ANDAR = [
  { id: 'nevoa', nome: 'Névoa', desc: 'Todos ganham +15% de esquiva.', todos: { esquiva: 0.15 } },
  { id: 'sangue', nome: 'Sangue Quente', desc: 'Todos ganham +30% ATQ.', todos: { atqPct: 0.3 } },
  { id: 'pedra', nome: 'Pele de Pedra', desc: 'Todos ganham +40% DEF.', todos: { defPct: 0.4 } },
  { id: 'ventania', nome: 'Ventania', desc: 'Todos ganham +40% AGI.', todos: { agiPct: 0.4 } },
  { id: 'eco', nome: 'Eco Arcano', desc: 'Todas as recargas ficam 30% mais rápidas.', todos: { recarga: 0.3 } },
  { id: 'lua', nome: 'Lua Cheia', desc: 'Os inimigos roubam 12% do dano como vida.', inimigos: { roubo: 0.12 } },
  { id: 'gigantes', nome: 'Gigantes', desc: 'Os inimigos têm +30% VIDA.', inimigos: { vidaPct: 0.3 } },
  { id: 'muralha', nome: 'Muralha', desc: 'Os inimigos começam com escudo de 15% da VIDA.', inimigos: { flags: ['estandarte'] } },
  { id: 'furia', nome: 'Fúria Precoce', desc: 'A Fúria começa aos 20 s, não aos 60 s.', furia: 20 },
  { id: 'seca', nome: 'Terra Seca', desc: 'Toda cura é 50% menor.', cura: 0.5 },
  { id: 'bencao', nome: 'Bênção da Torre', desc: 'Seu time ganha +15% ATQ e +15% DEF.', aliados: { atqPct: 0.15, defPct: 0.15 } },
];
// Regra de um andar: fixa para cada número (os 3 primeiros andares não têm regra; Guardiões sempre têm)
function modDoAndar(n) {
  if (n <= 3) return null;
  if (!TORRE.guardiao(n) && mulberry32(n * 7919 + 13)() < 0.3) return null;
  // passo 7 (primo com 11): andares seguidos nunca repetem a mesma regra
  return MODS_ANDAR[(n * 7 + Math.floor(n / MODS_ANDAR.length) * 3) % MODS_ANDAR.length];
}

