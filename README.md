# Veldria: Guilds of the Five

> Antes "Liga das Lâminas". A chave do save (`ligaDasLaminas.save.v1`) e o arquivo `dist/liga-das-laminas.html` mantêm o nome antigo de propósito, para não perder progresso.

Jogo de gestão de guilda de mercenários com batalhas automáticas em arena, pixel art desenhada por código e feito para celular em pé. HTML + CSS + JavaScript puro, sem bibliotecas e sem nada externo.

**Versão atual:** v0.7 (etapa E4, passo b) · save versão 8 · regras de combate v2.

## Como montar

```
python3 build.py
```

Gera dois arquivos em `dist/`:

| Arquivo | Para quê |
|---|---|
| `dist/liga-das-laminas.html` | Conteúdo publicado como artefato no Claude (save na nuvem por conta, testers convidados) |
| `dist/index.html` | Página completa para abrir no navegador ou publicar no GitHub Pages (save no próprio aparelho) |

Testes (precisam de Playwright):

```
python3 testes/fumaca.py dist/index.html     # abre, cria guilda, sem erros, sem rolagem lateral, save sobrevive
python3 testes/tutorial.py dist/index.html   # tutorial das 5 lutas + migração de save v5 → v6 (pulado com o tutorial desligado)
python3 testes/registro.py dist/index.html   # registro de partidas, reprodução, recordes e migração v6 → v7
```

Simulador (Node, sem tela, usa o mesmo código de `src/js/`):

```
node sim/balanco.js            # matriz 10×10 de vitória por classe (1v1, nível 10, 200 lutas por par) em < 1 min
node sim/balanco.js --tam 3 --n 100 --salvar   # 3v3; grava sim/resultados/*.json e .csv
node sim/balanco.js --ia v2    # a mesma matriz com o cérebro v2 (10b) dos dois lados
node sim/balanco.js --duelo --n 400   # E4: cérebro v2 (linha) × IA atual (coluna), 100 pares; imprime se o critério 1 passou
node sim/replay.js             # 300 lutas variadas com toques do jogador (metade dos lados com o cérebro v2): reproduzir do registro dá o mesmo resultado
```

## Estrutura

- `src/shell.html` — HTML e CSS do jogo. `/*__JS__*/` marca onde entra o código e `/*__FONT:x__*/` onde entram as fontes.
- `src/fonts/` — fontes Silkscreen e Pixelify Sans (licença OFL).
- `src/js/NN_nome.js` — o código, em módulos concatenados na ordem numérica. **A ordem importa.**
- `src/js/10b_cerebro-v2.js` — cérebro de utilidade da E4 (alvo, manobra, hora da habilidade). Ligado por lado da luta (`lado.ia`); o jogo usa `IA_JOGO = 'v2'` em todos os lados; sem `ia` vale a IA antiga do `10_combate.js` (só o simulador usa isso, como linha de base).

### Módulos

| Arquivo | Linhas |
|---|---|
| `src/js/00_cabecalho.js` | 9 |
| `src/js/01_util.js` | 37 |
| `src/js/02_dados.js` | 240 |
| `src/js/03_dados-da-fase-2.js` | 113 |
| `src/js/04_dados-da-torre.js` | 37 |
| `src/js/05_pixel.js` | 119 |
| `src/js/06_bonecos-3240.js` | 109 |
| `src/js/07_motor-de-bonecos-v3.js` | 556 |
| `src/js/08_vistas-de-frente-e-de-costas.js` | 202 |
| `src/js/09_mercenarios-e-itens.js` | 225 |
| `src/js/10_combate.js` | 839 |
| `src/js/10b_cerebro-v2.js` | 336 |
| `src/js/11_arena.js` | 576 |
| `src/js/12_som-musica-e-vibracao.js` | 174 |
| `src/js/13_cenarios-da-arena.js` | 131 |
| `src/js/14_vfx-direcionais.js` | 176 |
| `src/js/15_estado-e-save.js` | 217 |
| `src/js/16_reliquias-e-preparo.js` | 70 |
| `src/js/17_ocioso.js` | 36 |
| `src/js/18_expedicoes.js` | 50 |
| `src/js/19_forja-pergaminhos-e-ascensao.js` | 38 |
| `src/js/20_mercado.js` | 55 |
| `src/js/21_liga.js` | 249 |
| `src/js/22_torre-infinita.js` | 59 |
| `src/js/23_estatisticas.js` | 114 |
| `src/js/24_save-na-conta.js` | 176 |
| `src/js/25_interface-base.js` | 186 |
| `src/js/26_interface-telas.js` | 516 |
| `src/js/27_interface-batalha.js` | 244 |
| `src/js/28_interface-criacao-tutorial-configuracoes.js` | 181 |
| `src/js/29_modo-criador.js` | 153 |
| `src/js/30_interface-acoes.js` | 385 |
| `src/js/31_interface-torre-infinita-e-estatisticas.js` | 130 |
| `src/js/32_inicio.js` | 56 |

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
