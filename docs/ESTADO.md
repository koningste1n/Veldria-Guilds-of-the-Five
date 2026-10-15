# Estado do projeto — Veldria: Guilds of the Five (antes Liga das Lâminas)

**Repositório:** github.com/koningste1n/Veldria-Guilds-of-the-Five · **Jogar:** https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ (publica sozinho a cada envio para `main`).

**Como trabalhar:** `docs/PROMPT-MAE.md` (papéis, regras, roteiro das etapas com critérios de pronto, handoff).

_Atualizado em 15/10/2026 (E3)._

## O que existe (v0.4, Fase 4.1)

- 10 classes: guardião, machadeiro, lanceira, arqueira, piromante, criomante, clérica, lâmina, bardo e invocador.
- 5 divisões (Bronze → Lenda) em temporadas, Copa dos 4 primeiros com Líderes, cerca de 25 pergaminhos, cerca de 15 relíquias, consumíveis, Forja, Ascensão (2 níveis; teto de nível hoje = 30), Campeões.
- Sede ociosa, expedições, Acampamento, Torre Infinita com Guardiões a cada 10 andares, estatísticas, Modo Criador (7 toques na versão).
- Bonecos 32×40 com membros por cinemática inversa e 3 vistas, arena 384×216 com câmera, VFX direcionais, sons sintetizados, vibração e câmera lenta.
- Combate com passo fixo de 1/30 s e semente aleatória; "pular luta"; IA por função.
- Save em `localStorage` (`ligaDasLaminas.save.v1`) com **versão dentro do save (v5) e migrações encadeadas**; save na nuvem por conta no artefato do Claude, com resolução de conflito entre aparelhos.

## Perdido na migração

Os testes Playwright antigos (`luta.py`, `lideres.py`, `nuvem.py`, `perf.py`…) e as simulações de balanceamento (`balanco2.js`, `jornada.js`) ficaram em pastas temporárias de conversas antigas. Só o teste de fumaça foi refeito. O simulador volta na E3.

## Decisões de 14/10/2026

**Conselho (tarde):** evoluir, não reescrever. Trocar só o motor de batalha; arte, sons, nuvem, Torre, Forja e expedições ficam.

**Kevin (noite), itens numerados do recap:**

| Item | Decisão |
|---|---|
| E2–E5 | Aprovadas; E5 dividida em E5a (progressão) e E5b (alma); E6 (classes novas) adicionada |
| D1 | Funções (tanque, corpo a corpo, assassino, distância, controle, suporte) são etiquetas sobre as classes; haverá mais classes |
| D2 | 2 habilidades garantidas + catálogo de 6 com raridades comum / incomum / rara / lendária |
| D3 | 24+ relíquias com padrões de efeito |
| D4–D8 | Aprovados |
| D9 | Maestrias nv. 20 e nv. 50; **teto de nível 100 = Aventureiro Rank S**; campeões não aposentam |
| D10, D11 | Aprovados |
| P1 | Sensação-alvo: "Eu montei esse time, eu escolhi essas relíquias — e quando eles vencem sozinhos, a vitória é minha." |
| P2 / S6 | Tutorial = 5 primeiras batalhas; os 7 menus liberam um por vez |
| P4 | Formação 3×3 configurada antes da luta; câmera afastada mostra a formação e aproxima no embate; orientação (em pé × deitada) decidida após o 1º teste |
| P5 | Personalidade aparece como bônus/penalidade visível na ficha |
| S1 rivais, S2 contrato diário, S5 identidade de build, S9 recordes e melhores da temporada, S10 simulador | Aprovados |
| S7 eventos semanais | Aprovado, só a partir do nv. 10 |
| S3 narração, S4 dica pós-derrota, S8 campeão aposentado, nível de guilda | Não entram |
| Formato de trabalho | Prompt-mãe único (`docs/PROMPT-MAE.md`), com liberdade de mudar o plano a cada etapa |

## Ordem combinada

| # | Etapa | Conversas | Modelo | Status |
|---|---|---|---|---|
| E1 | Código recuperado, no GitHub e publicado | — | — | ✅ |
| E2 | Nome Veldria no jogo, save v6 (tutorial progressivo feito e **desligado** — ver Pendências) | 1 | Opus 5.5 | ✅ 15/10 |
| E3 | Registro de partidas, ficha de recordes + melhores da temporada, simulador de balanço em Node | 1 | Opus 5.5 | ✅ 15/10 (aguarda teste do Kevin no celular) |
| E4 | Motor novo: IA de utilidade, 3×3 + posturas, câmera, 3v3 melhor de 3; decisão de orientação de tela | 3–4 | **Fable 5.1** | **próxima** |
| E5a | Curva 1→100, Ascensão como portão, maestrias 20/50, Rank S, A/B nv. 15, catálogo com raridades, pity | 2 | **Fable 5.1** | |
| E5b | Personalidades visíveis, rivais, identidade de build, relíquias 24+, renome, contrato diário, eventos semanais | 2 | Opus 5.5 | |
| E6 | Classes novas em lotes de 2–4 | 1–2 | Opus 5.5 | |

Critérios de pronto de cada etapa: `docs/PROMPT-MAE.md`, seção 5.

## E2 — concluída em 15/10/2026 (v0.5, save v6)

| Critério de pronto | Resultado |
|---|---|
| Jogador novo chega à 1ª luta em < 60 s sem ver outro menu | ✅ 3,5 s no teste; só a aba Liga e sem engrenagem |
| Após a 5ª luta todas as abas visíveis | ✅ Liga → Elenco → Itens → Mercado → Guilda → Torre + engrenagem (ordem aprovada pelo Kevin) |
| Save v5 abre em v6 sem perda e sem tutorial | ✅ lutas, mercenários e ouro preservados; mostra "Novidades da Fase 5 · Veldria" |
| Exportar/importar save | ✅ já existia (código `LDL1:`); ida e volta testada em v6 |
| Fumaça + `testes/tutorial.py` | ✅ 0 erros, 23/23 verificações |

O que mudou no código:
- `28_…`: `TUTORIAL` virou 6 passos com `libera` (abas), `TUT_FIM = 5`, `tutorialAtivo()`, `liberado(id)`; nota `NOVIDADES[6]`; rótulo "Veldria: Guilds of the Five · v0.5".
- `15_…`: `VERSAO = 6`, campo `tutorialVisto`; migração: quem já lutou ou tinha o tutorial antigo ≥ 4 → `tutorial = 99`.
- `25_…`: abas e engrenagem filtradas por `liberado()`.
- `27_…`: cada luta do tutorial avança `STATE.tutorial`.
- `30_…`: `resultado-ok` chama `encerrarLuta()` por último, para o tutorial levar à aba recém-liberada.
- `src/shell.html`: título novo. Chave do save inalterada.

## E3 — concluída em 15/10/2026 (v0.6, save v7)

| # | Critério de pronto | Resultado |
|---|---|---|
| 1 | Reproduzir uma luta a partir do registro dá o mesmo resultado | ✅ `node sim/replay.js`: 300/300 lutas variadas (itens, pergaminhos, Campeões, fênix, bomba, toques do jogador) idênticas. `testes/registro.py`: 2 lutas assistidas com toques manuais + 3 puladas, todas idênticas ao reproduzir do save; botão "Conferir" confirma na tela |
| 2 | Tela de recordes mostra os 5 melhores da temporada | ✅ MVP, Mais abates, Melhor KDA, Mais dano, Mais cura; filtro por função; heróis rivais lado a lado com os seus (destacados) |
| 3 | `node sim/balanco.js` imprime matriz 10×10 em < 1 min | ✅ 43 s (11.000 lutas, 2 núcleos) |
| 4 | Save v6 abre em v7 sem perda; fumaça passa | ✅ mercs, ouro e lutas preservados; mostra "Novidades da Fase 6 · Recordes"; fumaça 0 erros |

### O que mudou no código

| Arquivo | Mudança |
|---|---|
| `10_combate.js` | `REGRAS_COMBATE = 1` (versão das regras); contador de passos `b.n`; `mortes` por lutador; toques do jogador viram entradas com o número do passo (`entradaJogador`); `ladoParaRegistro`, `reproduzirPartida`, `assinaturaLuta`. Nenhuma regra de luta mudou |
| `23_estatisticas.js` | `registrarPartida` (registro + sequência + Líderes vencidos + melhores da temporada), `conferirPartida`, `rankingTemporada` |
| `15_…` | `VERSAO = 7`; `partidas`, `temporadaRec`; stats `seqAtual`, `seqRecorde`, `tempoJogo`, `lideresVencidos` |
| `27_…`, `30_…` | semente sorteada antes da luta e retrato dos lados; Auto/Manual, alvo e SUPREMO passam por `entradaJogador` |
| `21_liga.js` | lutas entre rivais (simuladas na rodada) entram nos melhores da temporada |
| `31_…` | Estatísticas: Recordes, Melhores da temporada, Totais, Mercenários, Últimas lutas (com Conferir), Temporadas |
| `02_dados.js` | `FUNCOES` e `FUNCAO_CLASSE` (as 6 funções do D1) |
| `sim/` | `carregar.js` (lê `src/js/` direto, sem cópia), `balanco.js`, `replay.js`, `resultados/` (linha de base) |

### Decisões técnicas da E3

| Decisão | Por quê |
|---|---|
| Guardar 50 partidas; só as 10 mais recentes levam os dados completos de reprodução; teto de 90 KB para o registro | O save na conta aceita ~234 KB. Medido: 1,1 KB por partida resumida, 3,7 KB com reprodução → save estimado de ~100 KB com 50 partidas |
| O registro guarda só os campos do mercenário que afetam o combate | O teste confere que os atributos calculados do retrato são idênticos aos do mercenário real (0 divergências em 1.500 mercenários) |
| Toques do jogador gravados com o número do passo | Sem isso, uma luta em modo Manual não seria reproduzível |
| Luta encerrada pelo "Vencer agora" (Modo Criador) não guarda reprodução | Ela mata inimigos fora da simulação |
| "Melhores da temporada" contam todas as lutas da temporada; rivais entram pelas lutas da liga (inclusive as simuladas entre eles); Líderes e Torre não entram como rivais | Comparação justa entre heróis de guildas |
| KDA = abates ÷ quedas, mínimo de 3 lutas | O combate não tem assistências |
| Sequência de vitórias, Líder mais derrotado e tempo de jogo contam a partir da v0.6 | O save antigo não tinha esses dados |
| Simulador em paralelo (um processo por núcleo) e cada par de classes rodado uma vez só (o inverso é o complemento) | Ficou em 43 s sem mexer em nenhuma conta do combate |

### Linha de base do motor atual (para a E4 vencer)

Mercenário padrão da classe (crescimento no meio da faixa, sem traços e sem itens), nível 10. Arquivos em `sim/resultados/`.

| Formato | Ranking (taxa média de vitória) | Desvio em relação a 50% |
|---|---|---|
| 1v1, 200 lutas por par | Machadeiro 87 · Criomante 64 · Lanceira 61 · Guardião 60 · Lâmina 58 · Invocador 56 · Arqueira 48 · Piromante 38 · Clériga 28 · Bardo 0 | 22,3 pontos |
| 3v3 da mesma classe, 100 por par | Machadeiro 95 · Lanceira 84 · Bardo 68 · Lâmina 56 · Invocador 54 · Arqueira 42 · Guardião 39 · Criomante 33 · Clériga 15 · Piromante 13 | 25,6 pontos |

Leitura: o Machadeiro domina nos dois formatos; Piromante e Clériga ficam no fundo. Times de uma classe só são artificiais (Clériga e Bardo dependem de aliados), mas o Machadeiro já é um sinal claro. Não mexi em balanceamento: isso fica para depois do motor novo (E4), comparando com esta linha de base.

### A confirmar com o Kevin

| Item | Proposta do Claude |
|---|---|
| Função principal de cada classe (D1) | Guardião = Tanque · Machadeiro e Lanceira = Corpo a corpo · Arqueira e Piromante = Distância · Criomante e Invocador = Controle · Clériga e Bardo = Suporte · Lâmina = Assassino |

## Pendências (adiadas pelo Kevin)

### Tutorial do jogador novo — desligado em 15/10/2026

O tutorial progressivo foi publicado e o Kevin testou no celular. Veredito: **adiar** até o jogo ter mais sistemas (motor novo, personalidades, rivais), quando o tutorial passar a ser relevante.

| Retorno do Kevin | O que fazer quando voltar ao assunto |
|---|---|
| "Parece engessado" | Ensinar fazendo, não com balão de texto: o jogador aprende a luta lutando |
| "Não direciona onde o iniciante deve clicar" | Destacar o botão exato (anel pulsante ou seta sobre LUTAR, sobre o mercenário etc.), não só a aba |
| "Os avisos não sumiram com o botão Entendi" | **Bug não reproduzido no teste automático** (no Playwright o balão some). Investigar no celular real antes de religar |

Como está agora: `TUTORIAL_LIGADO = false` em `28_…`. Todo jogador (novo ou antigo) vê os 6 menus e a engrenagem desde o início e nenhum balão. O código do tutorial (`TUTORIAL`, `liberado()`, `mostrarTutorial()`) e o `testes/tutorial.py` ficaram guardados; o teste se pula sozinho enquanto o tutorial estiver desligado. Saves com `tutorial` entre 0 e 5 são normalizados para 99 ao abrir. **Antes de religar:** decidir o que fazer com quem já passou da fase inicial (não pode travar menus de quem já jogou).

Hoje, quem começa do zero não tem tutorial nenhum (o tutorial antigo de 6 dicas foi substituído). A confirmar com o Kevin se isso basta por enquanto ou se volta o tour antigo de 6 dicas.

## Próxima conversa começa por… (E4, **Fable 5.1**)

1. Ler `10_combate.js` inteiro (o motor atual, ~840 linhas) e `sim/balanco.js` / `sim/carregar.js`.
2. Escrever no `ESTADO.md` o critério de pronto da E4 (seção 5 do prompt-mãe) e a ordem interna (a)–(e).
3. Começar o motor novo isolado (`src/js/10b_…` ou equivalente), com IA de utilidade em 1v1, e acrescentar ao simulador um modo "motor novo × motor atual" para medir contra a linha de base acima (meta: vencer ≥ 55 % em média).
4. Ao mudar qualquer regra de combate, subir `REGRAS_COMBATE` (as reproduções antigas passam a avisar que são de outra versão).
