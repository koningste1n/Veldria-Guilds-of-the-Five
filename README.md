# Veldria: Guilds of the Five

> Novo nome do jogo (antes "Liga das Lâminas"). Os textos dentro do jogo ainda usam o nome antigo; a troca entra numa próxima fase.

Jogo de gestão de guilda de mercenários com batalhas automáticas em arena, pixel art desenhada por código e feito para celular em pé. HTML + CSS + JavaScript puro, sem bibliotecas e sem nada externo.

**Versão atual:** Fase 4.1 · v0.4. É a mesma versão publicada no Claude, recuperada do HTML publicado em 14/10/2026 e conferida byte a byte.

## Como montar

```
python3 build.py
```

Gera dois arquivos em `dist/`:

| Arquivo | Para quê |
|---|---|
| `dist/liga-das-laminas.html` | Conteúdo publicado como artefato no Claude (save na nuvem por conta, testers convidados) |
| `dist/index.html` | Página completa para abrir no navegador ou publicar no GitHub Pages (save no próprio aparelho) |

Teste rápido (precisa de Playwright): `python3 testes/fumaca.py dist/index.html`

## Estrutura

- `src/shell.html` — HTML e CSS do jogo. `/*__JS__*/` marca onde entra o código e `/*__FONT:x__*/` onde entram as fontes.
- `src/fonts/` — fontes Silkscreen e Pixelify Sans (licença OFL).
- `src/js/NN_nome.js` — o código, em módulos concatenados na ordem numérica. **A ordem importa.**

### Módulos

| Arquivo | Linhas |
|---|---|
| `src/js/00_cabecalho.js` | 9 |
| `src/js/01_util.js` | 37 |
| `src/js/02_dados.js` | 232 |
| `src/js/03_dados-da-fase-2.js` | 113 |
| `src/js/04_dados-da-torre.js` | 37 |
| `src/js/05_pixel.js` | 119 |
| `src/js/06_bonecos-3240.js` | 109 |
| `src/js/07_motor-de-bonecos-v3.js` | 556 |
| `src/js/08_vistas-de-frente-e-de-costas.js` | 202 |
| `src/js/09_mercenarios-e-itens.js` | 225 |
| `src/js/10_combate.js` | 786 |
| `src/js/11_arena.js` | 576 |
| `src/js/12_som-musica-e-vibracao.js` | 174 |
| `src/js/13_cenarios-da-arena.js` | 131 |
| `src/js/14_vfx-direcionais.js` | 176 |
| `src/js/15_estado-e-save.js` | 199 |
| `src/js/16_reliquias-e-preparo.js` | 70 |
| `src/js/17_ocioso.js` | 36 |
| `src/js/18_expedicoes.js` | 50 |
| `src/js/19_forja-pergaminhos-e-ascensao.js` | 38 |
| `src/js/20_mercado.js` | 55 |
| `src/js/21_liga.js` | 248 |
| `src/js/22_torre-infinita.js` | 59 |
| `src/js/23_estatisticas.js` | 20 |
| `src/js/24_save-na-conta.js` | 176 |
| `src/js/25_interface-base.js` | 186 |
| `src/js/26_interface-telas.js` | 516 |
| `src/js/27_interface-batalha.js` | 239 |
| `src/js/28_interface-criacao-tutorial-configuracoes.js` | 161 |
| `src/js/29_modo-criador.js` | 153 |
| `src/js/30_interface-acoes.js` | 376 |
| `src/js/31_interface-torre-infinita-e-estatisticas.js` | 84 |
| `src/js/32_inicio.js` | 55 |

## Saves

| Onde roda | Onde o progresso fica |
|---|---|
| Artefato no Claude, tester convidado por e-mail | Na conta do tester (nuvem) |
| Artefato no Claude, link público | No navegador do aparelho |
| `dist/index.html` / GitHub Pages | No navegador do aparelho (`localStorage`, chave `ligaDasLaminas.save.v1`) |

## Regras do projeto

1. Nenhuma fase apaga um save existente sem converter os dados (migração por versão).
2. Toda fase tem um critério de pronto escrito antes de começar.
3. Depois de qualquer mudança: `python3 build.py`, `node --check` no JS e o teste de fumaça.
4. Todo o conteúdo (classes, habilidades, relíquias, chefes) fica em tabelas de dados nos módulos `02` a `04`.

Estado do projeto e próximos passos: [`docs/ESTADO.md`](docs/ESTADO.md).
