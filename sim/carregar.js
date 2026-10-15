// Carrega o combate do jogo em Node, sem tela: dados (00–04), mercenários (09), combate (10) e cérebro v2 (10b).
// O mesmo código que roda no celular, lido direto de src/js/. Nada é copiado.
'use strict';
const fs = require('fs');
const path = require('path');

const MODULOS = ['00_', '01_', '02_', '03_', '04_', '09_', '10_', '10b'];

function carregarJogo({ semente = 12345 } = {}) {
  const dir = path.join(__dirname, '..', 'src', 'js');
  const arquivos = fs.readdirSync(dir).filter((f) => MODULOS.some((p) => f.startsWith(p))).sort();
  let codigo = arquivos.map((f) => fs.readFileSync(path.join(dir, f), 'utf8')).join('\n');
  // aparência: no jogo vem do motor de bonecos (07); aqui só precisa existir
  codigo += '\nfunction lookDe(m, c1, c2) { return `${m.visual || m.classe}|${m.pele ?? 0}|${m.cabelo ?? 1}|${c1}|${c2}`; }\n';
  codigo += `
    return {
      CLASSES, SKILLS, PERGAMINHOS, ascPorNivel, nivelEf, NIVEL_TETO, TRACOS, POT_INFO, CAMPEOES, REGRAS_COMBATE, IA2, POSTURAS, FORMACAO, posDe,
      criarBatalha, passo, simularAteFim, resumoBatalha, atributos, gerarMerc, gerarItem, gerarPergaminho,
      mercParaRegistro, ladoParaRegistro, assinaturaLuta, reproduzirPartida, mesmaAssinatura, entradaJogador,
      setState: (s) => { STATE = s; }, getState: () => STATE,
    };`;
  // Math.random com semente: as gerações de mercenários do simulador ficam repetíveis.
  // (Roda no próprio Node, sem vm: dentro de um vm cada acesso a Math fica ~10× mais lento.)
  let a = semente >>> 0;
  Math.random = () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const J = new Function(codigo)();
  J.setState({ nextId: 1, mercs: [], taverna: { ofertas: [] }, pity: { semEpico: 0, semLendario: 0 }, stats: { lendarios: 0 }, criador: {} });
  return J;
}
module.exports = { carregarJogo };
