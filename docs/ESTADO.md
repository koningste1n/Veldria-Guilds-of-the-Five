# Estado do projeto — Veldria: Guilds of the Five (antes Liga das Lâminas)

**Repositório:** github.com/koningste1n/Veldria-Guilds-of-the-Five · **Jogar:** https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ (publica sozinho a cada envio para `main`).

**Como trabalhar:** `docs/PROMPT-MAE.md` (papéis, regras, roteiro das etapas com critérios de pronto, handoff).

_Atualizado em 15/10/2026 (**E5a em andamento**: blocos 1 e 2 publicados — níveis até 100 e evoluções A/B; v0.12, save v14, regras de combate v4)._

## O que existe (v0.10.1, E4: cérebro v2, formação 3×3 com tela, câmera de treinador, partidas melhor de 3)

- 10 classes: guardião, machadeiro, lanceira, arqueira, piromante, criomante, clérica, lâmina, bardo e invocador.
- 5 divisões (Bronze → Lenda) em temporadas, Copa dos 4 primeiros com Líderes, cerca de 25 pergaminhos, cerca de 15 relíquias, consumíveis, Forja, Ascensão (2 níveis; teto de nível hoje = 30), Campeões.
- Sede ociosa, expedições, Acampamento, Torre Infinita com Guardiões a cada 10 andares, estatísticas, Modo Criador (7 toques na versão).
- Bonecos 32×40 com membros por cinemática inversa e 3 vistas, arena 384×216 com câmera, VFX direcionais, sons sintetizados, vibração e câmera lenta.
- Combate com passo fixo de 1/30 s e semente aleatória; "pular luta"; cérebro de utilidade por função (v2); formação 3×3 + posturas; Liga e Copa em partidas melhor de 3 com intervalo para ajustar a formação.
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
| E4 | Motor novo: IA de utilidade, 3×3 + posturas, câmera, 3v3 melhor de 3; decisão de orientação de tela | 3–4 | **Fable 5.1** | ✅ **15/10** (4 conversas; veredito do Kevin no celular: tudo aprovado) |
| E5a | Curva 1→100, Ascensão como portão, maestrias 20/50, Rank S, A/B nv. 15, catálogo com raridades, pity | 2 | **Fable 5.1** | 🟡 blocos 1 e 2 de 4 publicados (v0.12) |
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

## E4 — concluída em 15/10/2026 (v0.10.1, save v12)

### Critério de pronto da E4 (seção 5 do prompt-mãe)

| # | Critério | Como medir |
|---|---|---|
| 1 | Cérebro novo vence o atual com as mesmas regras e os mesmos lutadores: **média ≥ 55 %** na matriz completa (IA nova com a classe da linha × IA atual com a classe da coluna, 100 pares) e, no espelho (mesma classe dos dois lados), **nenhuma classe abaixo de 42 %** — o cérebro novo não pode piorar classe nenhuma | `node sim/balanco.js --duelo` (linha = IA nova, coluna = IA atual) |
| 2 | Formação 3×3 + posturas (avançar, segurar, flanquear) configuradas no Preparo e lidas pelo cérebro novo | ✅ modelo, save v9, cérebro, `sim/formacao.js` (a escolha muda o resultado em até 74 pontos) e a grade 3×3 no Elenco (v0.8) |
| 3 | 3×3 roda a 30 passos/s no celular sem travar | ✅ Node: 6–16 µs por passo (~2.000× abaixo dos 33 ms); **Kevin, 15/10: rodou sem travar no celular** |
| 4 | Câmera: afastada mostrando a formação, aproxima no embate | ✅ `testes/camera.py` + **Kevin, 15/10: a aproximação no 1º embate funciona** |
| 5 | 3v3 melhor de 3 (D7) | ✅ v0.10, save v12; **Kevin, 15/10: aprovada** (intervalo claro, duração ok) |
| 6 | Kevin aprovou a orientação de tela (em pé × deitada) depois do 1º teste 3×3 | ✅ **em pé** (Kevin, 15/10/2026, com os 4 mockups) |
| 7 | Save abre sem perda; fumaça e `registro.py` passam; reproduções antigas continuam idênticas | ✅ v6 → v12 sem perda; fumaça, `registro`, `formacao`, `camera` passam; `sim/replay.js` 300/300; lutas de regras v1 avisam "versão anterior" (previsto) |

### Ordem interna

| Passo | O quê | Status |
|---|---|---|
| (a) | Cérebro de utilidade em 1v1, isolado, medido no simulador contra a IA atual | ✅ 15/10 (critério 1 passou) |
| (b) | Ligar na interface (todas as lutas passam a usar o cérebro novo; `REGRAS_COMBATE` sobe) | ✅ 15/10 (v0.7, save v8, regras v2) |
| (c) | Formação 3×3 + posturas em simulação | ✅ 15/10 (regras v3, save v9) |
| (d) | Tela do Preparo (grade 3×3 + postura por mercenário) e câmera afastada → aproxima | ✅ 15/10 (tela: v0.8; câmera: v0.9, save v11) |
| (e) | 3v3 melhor de 3 | ✅ 15/10 (v0.10, save v12) |
| (f) | Ponto de decisão do Kevin: orientação da tela (levar dois mockups) | ✅ 15/10: **em pé**. O layout deitado provisório e a janela 384×216 saíram do código |

### Decisões técnicas da E4

| Decisão | Por quê |
|---|---|
| **As regras de combate não mudam na (a).** O "motor novo" é um **cérebro** novo (`src/js/10b_cerebro-v2.js`): escolha de alvo, movimento e hora de usar habilidade. Dano, habilidades, estados e projéteis continuam no `10_combate.js` | É o que o conselho decidiu (trocar o motor de decisão, não o jogo). E só assim dá para medir IA nova × IA atual com os mesmos lutadores e as mesmas regras |
| O cérebro é ligado por lado da luta (`lado.ia = 'v2'`); o `10_combate.js` ganha 4 ganchos (`u.cerebro`) e nada mais | Uma luta pode ter um lado com cada IA (é a medição). Como `ia` fica dentro do lado, o registro de partidas já guarda qual IA jogou |
| IA de utilidade: a cada 0,25 s a unidade pontua opções (alvos, manobras, habilidades) com considerações normalizadas 0–1 e pesos **por função** (D1); a opção vencedora vale até a próxima decisão (sem oscilar) | Padrão de IA de utilidade com curvas de resposta; pesos em tabela, para as posturas (c) e as personalidades (E5b) só mexerem em números |
| Recuar (kiting) é **só para trás** (±60° da direção oposta à ameaça) e pesa a letalidade de quem ameaça: encurralada na parede, a unidade para de fugir e luta; de um esqueleto ninguém foge | Testei primeiro um "fôlego" de recuo (gasta fugindo, recupera parado): a arqueira parava de fugir cedo demais e perdia para quem a IA atual vencia. Limitar pela arena é natural, visível e impede orbitar o inimigo por 2 minutos (a arqueira vence o Guardião, mas em ~60 s, com ele quase morto) |
| Habilidade sem regra própria no cérebro (pergaminhos, Campeões) usa a decisão atual | Nada regride; o cérebro cobre primeiro as 10 habilidades de classe |

### (a) concluída em 15/10/2026 — resultado do critério 1

`node sim/balanco.js --duelo --n 400` (40.000 lutas, 50 s em 2 núcleos; `sim/resultados/balanco-n10-t1-duelo.*`):

| Medida | Resultado | Meta |
|---|---|---|
| Média da matriz (cérebro v2 na linha × IA atual na coluna) | **59,5 %** | ≥ 55 % ✅ |
| Pior espelho (mesma classe, v2 × atual) | Piromante 45 % (ruído: a N = 2000 dá 49,5 %) | ≥ 42 % ✅ |
| Reprodução com lados v2 (`sim/replay.js`, metade dos lados com v2) | 300/300 idênticas | ✅ |
| Lutas que acabam no tempo / duração média | 0,4 % / 27 s (base: 0,4 % / 28 s) | sem lutas de 2 min ✅ |
| Fumaça + `registro.py` com o jogo montado | 0 erros | ✅ |

Onde o cérebro novo ganha (pontos sobre a linha de base, v2 × atual): Arqueira +22 na média (vence Guardião 100 %, Machadeiro 60 %, antes 0 % e 1 %), Criomante +15, Invocador +13, Piromante +12, Guardião +11, Lanceira +9, Clériga +9. Todo mundo ganha ~+60 a +100 contra o Invocador atual, porque o cérebro novo bate no invocador em vez de nos esqueletos. Machadeiro, Lâmina e Bardo ficam nos 50 % (o espelho de corpo a corpo é cara ou coroa: não há decisão a tomar).

O que mudou e por quê:

| Decisão do cérebro | Efeito medido |
|---|---|
| À distância recua **para trás** enquanto atira; na parede, luta | Arqueira × Guardião 0 % → 100 %; × Machadeiro 1 % → 60 % |
| Invocações valem 45 % de um alvo normal (80 % se estiverem em cima de mim) | Guardião/Lanceira/Clériga/Bardo × Invocador 0 % → 100 % / 82 % / 100 % / 66 % |
| Chuva de Flechas: vale 0,7 com o alvo parado, 0,45 andando, 0,9 preso/lento, 1 com 2+ na área | Corrigiu a primeira versão (que nunca atirava no espelho: 7 %) |
| Investida não é gasta em alvo já atordoado/congelado; vale mais contra quem foge | Lanceira +9 |
| Luz Restauradora: cura quando falta ≥ 60 % do valor da cura (não desperdiça), urgência se o ferido está sendo atacado | Clériga +9 |
| Habilidade de dano **não é guardada** quando o alvo morreria de um golpe normal (matar agora vale mais que a recarga) | Tinha tirado 20 pontos do Machadeiro na 1ª versão |
| Manobra "atacar" recalculada a cada passo (persegue se saiu do alcance, ronda se dentro); só as outras manobras duram 0,25 s | Tirava até 20 pontos do corpo a corpo contra quem foge (atraso de 1/4 s para perseguir) |

Achados de balanceamento para a E5a (não mexi): os esqueletos são fracos demais quando ignorados — o Invocador v2 perde para Piromante (14 %), Criomante (31 %) e Lâmina (0 %); Bardo e Clériga continuam sem chance em 1v1 (por desenho, dependem de aliados).

Ganchos no `10_combate.js` (4 linhas): `u.cerebro` criado em `novaUnidade` quando `lado.ia === 'v2'`; `pensar` + `escolherAlvoV2` na escolha de alvo; `querUsarV2` antes de `usarSkill` (normal e SUPREMO; o toque manual do jogador no SUPREMO continua mandando); `destinoV2` no `mover`. `REGRAS_COMBATE` continua 1: nenhuma luta do jogo usa v2 ainda, então toda reprodução antiga segue válida.

### (b) concluída em 15/10/2026 — cérebro v2 em todas as lutas (v0.7, save v8, regras v2)

| O que mudou | Onde |
|---|---|
| `IA_JOGO = 'v2'` e os dois construtores de lado do jogo (`ladoJogador`, `ladoDeGuilda`) marcam `ia: IA_JOGO` — Liga, amistoso, Copa, lutas simuladas entre rivais e Torre, todas | `10b`, `21_liga.js` |
| `REGRAS_COMBATE = 2`: o registro de cada luta grava `regras: 2` e `ia: 'v2'` nos dois lados; "Conferir" numa luta antiga avisa que é de outra versão (como previsto na E3) | `10_combate.js`, `30_…` |
| Save **v8** = mesmo formato do v7; só marca a nota de novidades "Fase 7 · Cérebro" para quem já lutou | `15_…`, `28_…` |
| `testes/registro.py` ganhou 2 verificações: toda luta nova tem regras v2 + cérebro v2 nos dois lados; luta com regras v1 devolve `regras` em vez de reproduzir (22/22 OK) | `testes/` |
| `sim/replay.js`: lado sem `ia` é v1 explícito (metade v1, metade v2): 300/300 idênticas | `sim/` |

Critério 1 re-medido depois do último ajuste (`--duelo --n 400`): **58,8 %**, pior espelho Piromante 45 % → PASSOU.

### Nova linha de base de balanceamento (v2 dos dois lados, nível 10) — é esta que a E5a corrige

`sim/resultados/balanco-n10-t1-v2.*` e `balanco-n10-t3-v2.*`.

| Formato | Ranking (taxa média de vitória) | Desvio |
|---|---|---|
| 1v1, 200 por par | Criomante 81 · Arqueira 73 · Machadeiro 73 · Lanceira 70 · Lâmina 57 · Piromante 51 · Guardião 44 · Clériga 39 · Bardo 7 · **Invocador 4** | 25,6 pontos (base v1: 22,3) |
| 3v3 mesma classe, 100 por par | **Arqueira 96** · Lanceira 76 · Criomante 71 · Machadeiro 63 · Piromante 60 · Bardo 45 · Lâmina 41 · Clériga 25 · Guardião 22 · **Invocador 0** | 27,5 pontos (base v1: 25,6) |

Leitura: o cérebro novo virou a mesa — de corpo a corpo dominante (Machadeiro 87/95) para distância dominante (Arqueira 96 no 3v3, Criomante 81 no 1v1), porque quem atira agora recua direito. Dois casos pedem decisão de desenho na E5a, não só número:

| Achado | Por quê | Proposta para a E5a |
|---|---|---|
| **Invocador cai para 4 % / 0 %** | O cérebro novo bate no invocador e ignora os esqueletos (36 % dos atributos, 168 de vida: não ameaçam ninguém). A classe só funcionava porque a IA antiga batia no inimigo mais perto. Já testei o invocador ficar atrás dos esqueletos em vez de fugir (ficou no código): não basta, o atacante passa por eles | Esqueletos precisam **impor** presença: provocar quem está perto (como a Muralha) e/ou bloquear o caminho de verdade (separação maior) e/ou serem mais fortes. Decisão do Kevin |
| Guardião 44 % / 22 % | Tanque sozinho não alcança quem recua; em 3 Guardiões × 3 Arqueiras ninguém chega perto | Esperado sem formação; reavaliar depois do passo (c) (posturas) antes de mexer em número |

### (c) concluída em simulação em 15/10/2026 — formação 3×3 e posturas (regras v3, save v9)

| O que mudou | Onde |
|---|---|
| `FORMACAO` (3 colunas × 3 fileiras; `x` por coluna 108/80/52 da borda, `y` por fileira 100/142/184) e `POSTURAS` (auto, avançar, segurar, flanquear) em tabela de dados | `02_dados.js` |
| Mercenário ganha `pos` (0–8 = coluna×3 + fileira) e `postura`; `linha` passa a ser derivada da coluna (os chips Frente/Trás da ficha mexem no `pos`) | `09`, `15` (save **v9**: quem era Frente vai para frente-centro, Trás para trás-centro, postura automática), `30` |
| `criarBatalha` posiciona pela grade; casas repetidas são resolvidas na ordem do time (`resolverFormacao`); o registro guarda `pos` e `postura` → `REGRAS_COMBATE = 3` | `10_combate.js` |
| Posturas viram multiplicadores na tabela `IA2.postura` (recuo, parada de quem atira, proteger, alvos da retaguarda, posto, flanco) — nada de código por postura | `10b` |
| Manobras novas: **posto** (Segurar: fica na casa até um inimigo chegar a 70 px; o raio cresce 15 px/s depois de 8 s para a luta não empacar) e **flanco lateral** (Flanquear: pela borda de cima/baixo até passar da altura do alvo) | `10b` |
| `sim/formacao.js`: 4 formações × 4 posturas × 2 adversários, imprime se a escolha importa (≥ 10 pontos) | `sim/` |
| `testes/registro.py` +3 verificações (pos/postura/linha, registro com casa e postura, migração v6 → v9); `sim/replay.js` sorteia casas e posturas | `testes/`, `sim/` |

Dois ajustes no cérebro foram necessários para a formação **valer alguma coisa** (antes, "tanque na frente" perdia para "tanque atrás"):

| Ajuste | Por quê | Efeito |
|---|---|---|
| Quem atira não passa da própria linha de frente (fica 22 px atrás do aliado corpo a corpo mais avançado), exceto na postura Avançar | A arqueira saía andando na frente do Guardião para alcançar 88 % do alcance e era a primeira a ser pega | Muralha × trio corpo a corpo: 53 % → 100 % |
| Corpo a corpo e tanque pesam o que está **perto** (0,6) e só consideram fraco/matar/ameaça/foco dentro de 150 px; nenhum peso para retaguarda | O Machadeiro inimigo mirava a arqueira a 224 px desde o 1º segundo e passava reto pelo tanque; buscar a retaguarda virou trabalho do assassino e da postura Flanquear | Critério 1 continua passando (59,2 %) |
| Tanque escolta desde cedo (põe-se entre o inimigo corpo a corpo e o aliado frágil que ele está indo buscar), não só quando o inimigo já chegou | Antes o `proteger` só disparava a 60 px, tarde demais para um Guardião de 24 px/s | — |

Resultado de `node sim/formacao.js --n 200` (Guardião + Arqueira + Clériga, nível 10):

| Formação \ postura | auto | avançar | segurar | flanquear |
|---|---|---|---|---|
| **contra Machadeiro + Lanceira + Piromante** | | | | |
| muralha (tanque na frente, duas atrás) | **100** | 100 | 100 | 51 |
| tudo na frente | 99 | 29 | 94 | 31 |
| invertida (tanque atrás) | 83 | 27 | 68 | 31 |
| em coluna | 100 | 100 | 100 | 50 |
| **contra Arqueira + Criomante + Lâmina** | | | | |
| muralha | 0 | 2 | 4 | 1 |
| tudo na frente | 8 | 7 | 20 | 6 |
| invertida | 4 | 12 | 4 | 25 |
| em coluna | 0 | 0 | 1 | 1 |

E um trio corpo a corpo (Machadeiro + Lanceira + Lâmina) contra a muralha: auto 76 % · avançar 76 % · **flanquear 92 %** · segurar 68 %. Leitura: formação e postura mudam o resultado em até 74 pontos (sensação-alvo ✅); contra o trio à distância nada salva — Arqueira (94 % no 3v3) e Criomante continuam fortes demais (E5a).

Linha de base v2×v2 refeita (`sim/resultados/*-v2.*`): 1v1 Crio 80 · Mach 75 · Arq 71 · Lanç 70 · Lâm 60 · Piro 51 · Guard 44 · Clér 39 · Bardo 7 · Invoc 4 · 3v3 Arq 94 · Lanç 76 · Mach 68 · Crio 66 · Piro 58 · Lâm 48 · Bardo 45 · Clér 24 · Guard 22 · Invoc 0.

**O jogo publicado já luta com a grade e as regras v3**, mas o jogador ainda não vê nem mexe na formação (todo mundo está na casa padrão da sua linha, postura automática). Candidato para a E5a/rules: bloqueio físico de verdade (hoje unidades se atravessam; a separação é só um empurrão de 16 px), que faria o tanque segurar a linha sem depender só do alvo do inimigo.

### Tela da formação — concluída em 15/10/2026 (v0.8, save v10)

| O que mudou | Onde |
|---|---|
| Aba **Elenco** abre com a grade 3×3 ("Formação"): mesma orientação da arena (inimigo vem da direita, coluna Frente à direita). 1º toque seleciona o mercenário, 2º toque numa casa move (ou troca de lugar com quem estava lá); toque de novo na mesma casa desseleciona | `26_interface-telas.js` (`casaFormacao`), `30_…` (ação `casa`), CSS `.formacao`/`.casa` |
| Com alguém selecionado: 4 chips de postura (≥ 44 px) com a descrição, e botões Ficha · Tornar capitão · Tirar do time | `26`, `30` (ação `postura`) |
| Ficha: os chips Frente/Trás viraram chips de **postura** + linha "Casa na formação: Frente · Centro (mova na grade do Elenco)" | `26` |
| Titulares sempre em casas únicas: `ajustarTime()` e a abertura do save aplicam o mesmo `resolverFormacao` da luta (antes a guilda nova nascia com Arqueira e Clériga na mesma casa) | `15_estado-e-save.js` |
| Save **v10** = formato do v9; só marca a nota "Fase 8 · Formação" (quem passou direto pelo v9 na última hora também recebe) | `15`, `28` |
| `testes/formacao.py` (18 verificações): grade, mover, trocar, postura, 44 px, sem rolagem, ficha, luta registrada com casa e postura, reprodução idêntica | `testes/` |

Capturas: `testes/e4-formacao.png` e `testes/e4-formacao-sel.png`.

### (d) câmera — concluída em 15/10/2026 (v0.9, save v11)

A câmera já existia (`11_arena.js`: o mundo 384×216 é desenhado num buffer e uma janela o enquadra). O que mudou foi **o que ela olha**:

| Momento | O que a câmera faz | Como decide |
|---|---|---|
| **Formação** (do preparo, pela contagem 3-2-1, até o primeiro embate) | Afastada ao máximo: a arena inteira, as duas formações 3×3 visíveis | `Arena.camModo = 'formacao'`, zoom = `zoomTotal()` (a arena cabe na janela; na tela em pé sobram faixas pretas em cima e embaixo, no estilo das faixas de cinema do golpe final) |
| **Primeiro embate** | Aproxima em ~1,6 s (mais devagar que o acompanhamento normal, para a aproximação ser vista) | Um lutador está "no embate" quando tem inimigo ao alcance (dele ou do inimigo), está golpeando, conjurando ou apanhando, ou atira / é alvo de um projétil em voo (`marcarEmbates`) |
| **Durante a luta** | Enquadra só quem está no embate e segue o centro desse grupo; quem ficou parado longe (Segurar, por exemplo) sai do quadro | Cada lutador guarda um "calor" de 1,2 s depois do último contato, para a câmera não pular entre grupos a cada golpe |
| **SUPREMO e golpe final** | Close, como antes | `camFoco`, inalterado |

| Decisão | Por quê |
|---|---|
| A janela depende da orientação da tela: **256×180 em pé** (como era) e **384×216 deitada** (a arena inteira, sem faixas) | A arena é 16:9; na tela deitada ela cabe inteira na janela sem faixa nenhuma. É isso que torna o mockup deitado honesto: é o jogo de verdade, não um desenho |
| Tela deitada = CSS provisório em `@media (orientation: landscape)`: arena à esquerda, time e comandos à direita, dica escondida | Só vale dentro de `#luta`; se o Kevin escolher "em pé", o CSS sai ou fica como bônus para quem virar o celular. A orientação é lida no início da luta (virar no meio não redimensiona a janela até a próxima luta) |
| `zoomTotal()` substitui o antigo `ZOOM_MIN` (que não deixava ver a arena inteira: 0,83 mostrava 307 dos 384 px) | O novo mínimo é "a arena inteira cabe"; a janela centra e desenha faixas quando é maior que a arena (`centrarJanela`) |
| Botões Auto · Pausar · Pular e 1× 2× 3× subiram de 36 para 44 px | Regra 5 do prompt-mãe; o `testes/camera.py` agora confere todos os botões da luta |
| Save **v11** = formato do v10; só marca a nota "Fase 9 · Câmera" para quem já lutou | Mesmo padrão dos v8 e v10 |

`testes/camera.py dist/index.html` (18 verificações, as duas orientações): começa afastada com os 6 lutadores inteiros na janela; passa a 'embate' aos ~2,8 s de luta; zoom sobe de 0,67 → 1,66 (em pé) e 1,00 → 1,73 (deitada); quem está no embate aparece; sem rolagem lateral; a tela de luta cabe sem rolar nas duas orientações; botões ≥ 44 px; a luta registrada reproduz igual. `fumaca`, `registro` (v6 → v11) e `formacao` continuam passando; `sim/replay.js` 300/300.

### Mockups para a decisão de orientação (f) — prontos

Capturas reais do jogo (não desenhos), geradas pelo `testes/camera.py`:

| Arquivo | O quê |
|---|---|
| `testes/e4-cam-pe-formacao.png` | Em pé (390×844), vista afastada: as duas formações, com faixas pretas; bonecos a ~0,93 px de tela por px de arena |
| `testes/e4-cam-pe-embate.png` | Em pé, câmera aproximada no embate |
| `testes/e4-cam-deitada-formacao.png` | Deitada (844×390), vista afastada: a arena inteira preenche a janela, sem faixas; bonecos ~30 % maiores (1,21 px por px) |
| `testes/e4-cam-deitada-embate.png` | Deitada, câmera aproximada; time e comandos à direita |

Leitura do Claude na hora: em pé a formação 3×3 é legível na vista afastada, mas pequena e com faixas pretas; deitada lê de longe e a arena ganha 30 %, ao custo de virar o celular só para a luta.

**Decisão do Kevin (15/10/2026): só em pé.** Consequências:

| Decisão | Por quê |
|---|---|
| Layout deitado, `ajustarJanela()` e a nota "Tela deitada" saíram do código; a janela é fixa em 256×180 | "Apenas em pé": nada de meio caminho para manter |
| A janela **continua 256×180** (não virou 16:9): a vista afastada tem faixas pretas em cima e embaixo por ~3 s; depois do primeiro embate a arena ocupa a janela inteira, como sempre | A luta em si (95 % do tempo) fica com o enquadramento que o Kevin já aprovou; a alternativa 256×144 encurtaria a arena a luta inteira para poupar 3 s de faixas. As faixas usam a mesma linguagem das faixas de cinema do golpe final |

### (e) partida melhor de 3 — concluída em 15/10/2026 (v0.10, save v12)

Vocabulário: **partida** = o confronto da Liga/Copa; **luta** = cada uma das até 3 lutas dentro dela (no código, `serie.rodada`; "Rodada" na tela continua sendo a rodada da Liga, para não confundir).

| Decisão | Por quê |
|---|---|
| Formato em tabela de dados: `FORMATO_PARTIDA = { liga: 3, copa: 3, amistoso: 1, torre: 1 }` (`02_dados.js`); vence quem ganhar `metaDe()` = 2 | Amistoso é teste rápido; a Torre já é uma sequência de lutas e os Guardiões são únicos — melhor de 3 triplicaria a subida. Mudar é trocar um número |
| Cada luta da partida é uma luta inteira: semente nova, vida e recargas cheias, invocações zeradas; a mesma formação e posturas do Elenco, **salvo o que o jogador mudar no intervalo** | É o coração do D7 na sensação-alvo: o jogador reage ("flanquearam a minha arqueira: vou pô-la atrás e mandar o tanque Segurar"). Sem isso melhor de 3 seria só menos sorte |
| Intervalo = modal sobre a arena: título "Luta N: vencida!/perdida", placar grande, dano/cura da luta, a grade 3×3 com os chips de postura (mesmos `casaFormacao`/ações `casa`/`postura` do Elenco), botão "Luta N+1" | Reaproveita a tela da formação; `atualizarModais()` redesenha o intervalo a cada toque |
| O rival **não** ajusta a formação entre lutas | Fica para a E5b (rivais com personalidade); hoje seria aleatório |
| Recompensas (ouro, XP, baú, taverna, tutorial, sequência de vitórias, Líder mais derrotado) **uma vez por partida**; `stats.lutas`/`vitorias` contam partidas; novo `stats.rodadas` conta lutas (migração v12: `rodadas = lutas`) | Senão a economia triplicaria. As estatísticas por mercenário (`m.stats.lutas`, MVP, abates) e os "melhores da temporada" continuam por luta, que é o que aconteceu de verdade |
| Registro: cada luta é um registro próprio (semente, reprodução) com `serie: { id, rodada, de, placar }`; MVP e barras do resultado somam as lutas (`somarRodadas`) | A reprodução por luta continua idêntica (300/300 no `sim/replay.js`; `registro.py` com partidas inteiras). As 10 reproduções guardadas cobrem ~3–4 partidas |
| Consumíveis do Preparo: consumidos uma vez, valem para a partida inteira | Senão o jogador pagaria 3× |
| Rivais entre si na Liga também jogam melhor de 3 (`registrarRodada`), somando abates para o saldo | Classificação justa com o mesmo formato |
| "Vencer agora" (Modo Criador) fecha a partida inteira; "Pular" pula só a luta atual e cai no intervalo | O intervalo é a decisão do jogador; pular a partida inteira seria pular a decisão |
| Save **v12**: `stats.rodadas` + nota "Fase 10 · Melhor de 3"; rótulo v0.10 | Padrão das fases anteriores |

Testes: `registro.py` (2 partidas assistidas com toques + 3 puladas = 12 lutas; placares terminam 2×; formação mudada no intervalo; reprodução idêntica; v6 → v12), `formacao.py` (intervalo com grade; captura `testes/e4-intervalo.png`), `camera.py` (a luta 2 recomeça afastada), fumaça. Captura do resultado: `testes/e4-resultado-serie.png`.

### Veredito do Kevin no celular (15/10/2026) e o ajuste que saiu dele

| Item | Veredito | Ação |
|---|---|---|
| Cérebro novo (recuo da arqueira, invocador, cura) | Aprovado | — |
| Grade 3×3 com o dedão | Confortável, **mas falta um botão para confirmar a formação** | ✅ feito (v0.10.1) |
| Câmera e desempenho | Aproxima no 1º embate; rodou sem travar | — |
| Partida melhor de 3 | Aprovada | — |

| Decisão (botão Confirmar formação) | Por quê |
|---|---|
| Botão dourado "✓ Confirmar formação" no Elenco, logo abaixo das posturas (com alguém selecionado) ou da dica (sem seleção) | Mover e trocar deixava o mercenário selecionado e não havia um "terminei". Abaixo das posturas fica onde o dedão já está, sem rolar |
| No Elenco: tira a seleção, salva e leva à aba **Liga**, com toast "Formação confirmada. Pronto para lutar!" | O passo seguinte natural é lutar; a mudança já era salva a cada toque, o botão deixa isso visível |
| No intervalo da partida: aparece só com alguém selecionado e só tira a seleção | Quem começa a próxima luta continua sendo o botão "Luta N" |
| Sem mudança de formato do save (continua v12); rótulo v0.10.1; sem nota de novidades | Ajuste de interface, não fase nova |

`testes/formacao.py` ganhou 5 verificações (botão ≥ 44 px, leva à Liga, tira a seleção, não muda casas/posturas, no intervalo só desseleciona). Captura: `testes/e4-formacao-sel.png`.

## E5a — em andamento (começou em 15/10/2026)

> Começou no Opus 5.5 (o prompt-mãe indica Fable 5.1). Esta conversa só faz a proposta, as medições e o critério; a implementação espera a aprovação do Kevin.

### Critério de pronto (aprovado pelo Kevin em 15/10/2026)

| # | Critério | Como medir |
|---|---|---|
| 1 | Curva 1→100: `xpProx(n) = 50·n^1,5` mantida (1–29 idêntica à de hoje); teto 30 → Ascensão I → 60 → Ascensão II → 100 | ✅ `testes/nivel100.py` |
| 2 | Save antigo abre no lugar certo: nível, XP e Ascensões preservados; ninguém perde nível nem teto | ✅ `nivel100.py`: nv. 10/20/30 com 0/1/2 Ascensões abrem com tetos 30/60/100, XP intacto, o nv. 30 sobe para 31 |
| 3 | **Opção A**: nv. 100 com Rank S não vence nv. 60 por mais de 70 % | 🟡 `node sim/nivel.js`: sem Rank S 49 % / 47 %; com +2 % (Rank S simulado) 65 % / 68 % (1v1 / 3v3). Fecha quando o Rank S existir |
| 4 | Evoluções A/B no nv. 15 (irreversíveis), maestria de função no nv. 20 e de classe no nv. 50, Rank S no nv. 100: tudo visível na ficha | 🟡 evoluções ✅ (`testes/evolucoes.py`, capturas `e5a-evolucao*.png`); faltam maestrias e Rank S |
| 5 | Catálogo: 2 habilidades garantidas + 6 com raridades comum / incomum / rara / lendária; pergaminhos atuais migrados | Save com pergaminhos abre com eles no catálogo |
| 6 | Proteção contra azar com contador visível e salvo no save | Teste: N aberturas sem lendário → a seguinte é lendária |
| 7 | Balanço 3v3 (v2 × v2, nível 10): nenhuma classe abaixo de 20 % nem acima de 80 % (hoje: Invocador 0, Guardião 22, Arqueira 94) | `node sim/balanco.js --ia v2 --tam 3 [--evo a\|b\|mix]`; cada evolução medida em time real com `node sim/evolucoes.js` (todas entre 42 % e 78 % contra a base) |

### Curva 1→100 proposta (mesma fórmula de hoje, estendida)

Ritmo de referência: 10 partidas por dia (70 % de vitórias) + 8 h de Campo de Treino nv. 10. Rivais da Liga acompanham o nível do jogador (já é assim; o teto 30 dos rivais sobe para 100).

| Nível | XP do nível | XP total | Vitórias por nível | Dias até aqui |
|---|---|---|---|---|
| 10 | 1.350 | 5.552 | 6 | ~0,5 |
| 30 (Ascensão I) | 7.808 | 94.514 | 13 | ~7 |
| 60 (Ascensão II) | 22.659 | 546.137 | 19 | ~33 |
| 100 (Rank S) | 49.252 | 1.975.061 | 24 | ~94 |

Os últimos 10 níveis levam ~19 % do tempo total (limite saudável: 40 %).

### Achado: o combate é muito sensível a atributo (medido 15/10, `gap.js`, cérebro v2, espelho de classe)

| Vantagem do lado A | Vitórias de A (1v1 / 3v3) |
|---|---|
| +2 % em VIDA/ATQ/DEF | 65 % / 74 % |
| +4 % | 78 % / 84 % |
| +8 % | 91 % / 97 % |
| 1 nível a mais (nv. 21 × 20) | 74 % (1v1) |
| nv. 100 × nv. 60 com o crescimento de hoje | 100 % |

Consequência: "nv. 100 não vence nv. 60 por mais de 70 %" só é possível se do 60 ao 100 os atributos subirem ~2 % no total. Decisão do Kevin:

| Opção | Atributos | Critério 3 |
|---|---|---|
| **A** (sugestão do Claude) | Crescem cheio até 30, metade de 30 a 60, quase nada de 60 a 100. Do 60 ao 100 o que se ganha são **escolhas**: uma a cada 10 níveis (vaga do catálogo, habilidade lendária) e o Rank S | nv. 100 × nv. 60 ≤ 70 %, como está no prompt-mãe |
| B | Continuam crescendo (cada vez menos) até 100; a Torre é onde o nível alto aparece | Troca para: um nv. 60 com formação/contra-classe certa vence um nv. 70 em ≥ 30 % |

### Evoluções A/B no nv. 15 (aprovadas pelo Kevin em 15/10/2026, todas como propostas)

| Classe | Caminho A | Caminho B |
|---|---|---|
| Guardião | **Bastião**: Muralha provoca por 4 s numa área maior; escudo 15 % | **Égide**: escudo de 30 % que também cobre o aliado mais ferido; provoca 1 s |
| Machadeiro | **Berserker**: Fúria até +50 % ATQ, −10 % DEF | **Ceifador**: Redemoinho puxa em vez de afastar e cura 20 % do dano causado |
| Lanceira | **Cavaleira**: Investida com −40 % de recarga, atordoa 0,5 s | **Sentinela**: não avança; empurra e atordoa por 1,5 s quem chegar perto da retaguarda |
| Arqueira | **Atiradora de Elite**: Chuva vira Tiro Certeiro (250 %, crítico garantido, 1 alvo) | **Batedora**: +20 % de velocidade no recuo; a Chuva deixa Lentidão de 20 % |
| Piromante | **Incendiária**: explosão com o dobro da área e queimadura dobrada; dano direto 120 % | **Pira**: 260 % num alvo, sem área |
| Criomante | **Geleira**: Congela garantido por 1,5 s; dano 120 % | **Nevasca**: a Lança atravessa e atinge todos na linha; Lentidão de 25 % |
| Clériga | **Sacerdotisa**: Luz cura todos os aliados (120 %) | **Inquisidora**: cura 200 % e causa 150 % ATQ ao inimigo mais perto do curado |
| Lâmina | **Assassina**: se o alvo do Passo morrer, a recarga zera | **Sombra**: depois do Passo, 2 s sem poder ser alvo |
| Bardo | **Maestro**: Hino dura 12 s; Ritmo a cada 3º ataque | **Dissonante**: o Hino vira maldição: inimigos próximos −25 % ATQ e AGI por 6 s |
| Invocador | **Legião**: 3 esqueletos (30 %), máx. 6, que **provocam** quem estiver perto | **Necromante**: 1 Cavaleiro de Ossos (VIDA 90 %, ATQ 60 %) que fica até morrer |

Bastião e Legião/Necromante também atacam os dois problemas da linha de base (tanque que não segura, esqueletos ignorados).

### Ascensões (aprovadas)

| Ascensão | Nível | Custo | Efeito (igual ao de hoje) |
|---|---|---|---|
| I | 30 (libera até 60) | 5.000 ouro + 15 emblemas | +10 % atributos, +1 vaga |
| II | 60 (libera até 100) | 20.000 ouro + 40 emblemas | +10 % atributos, +1 vaga |

Migração: quem já tem Ascensões fica com elas e o teto novo correspondente (asc 0 → teto 30; asc 1 → 60; asc 2 → 100). Ninguém perde nada; os testers ficam adiantados. Os rivais da Liga já se ajustam pelo poder do time, então isso não desequilibra a Liga.

### Decisões do Kevin (15/10/2026)

| Item | Decisão |
|---|---|
| Curva 1→100 e Ascensões no 30 e no 60 | Aprovadas como propostas (~3 meses até o 100 no ritmo de referência) |
| Atributos depois do 60 | **Opção A**: crescem cheio até 30, metade até 60, nada do 60 ao 100; o topo dá escolhas |
| Evoluções A/B | As 10 aprovadas como estão na tabela |

### Bloco 1 concluído em 15/10/2026 (v0.11, save v13): curva, Ascensões e níveis até 100

| O que mudou | Onde |
|---|---|
| `NIVEL_TETO = 100`, `TETO_POR_ASCENSAO = [30, 60, 100]`, `ASCENSOES` no 30 (5.000 ouro + 15 emblemas) e no 60 (20.000 + 40), `ascPorNivel(L)` | `02_dados.js` |
| `CRESC_FAIXAS` (1 / 0,5 / 0) e `nivelEf(L)`: os atributos usam o nível efetivo (igual ao nível até 30); `crescEfetivo` mostra o crescimento da faixa atual | `02`, `09` |
| Itens novos também usam o nível efetivo no bônus (senão um item nv. 100 furaria a opção A); itens já existentes não mudam | `09` (`gerarItem`) |
| Rivais, Copa, Torre, Mercado e Modo Criador até o nível 100; Ascensões dos rivais por `ascPorNivel`. Só a **Lenda** acompanha o time acima do 30 (faixa 22–100); as outras divisões têm a faixa de sempre. Torre: nível 100 no andar 166 | `21`, `22`, `20`, `29`, `04` |
| Save **v13**: mesmo formato; o teto vem das Ascensões que o mercenário já tem (asc 0 → 30, 1 → 60, 2 → 100). Nota "Fase 11 · Rumo ao 100" | `15`, `28` |
| **Bug corrigido**: a lista de novidades tinha um teto fixo (≤ 12) que descartaria toda nota nova; agora aceita qualquer fase que tenha nota | `15` |
| `sim/nivel.js` (critério 3); `sim/balanco.js` usa `ascPorNivel` | `sim/` |
| `testes/nivel100.py` (16 verificações); `registro.py` espera v13 | `testes/` |

| Decisão técnica | Por quê |
|---|---|
| Ninguém perde nada na migração; quem já tinha Ascensão fica adiantado | Regra 1 do prompt-mãe. Os rivais da Liga se ajustam pelo poder do time, então a vantagem não desequilibra a Liga |
| `REGRAS_COMBATE` não sobe | Até o nível 30 os atributos são idênticos (o teste confere nível a nível) e nenhuma luta registrada passou do 30: as reproduções seguem idênticas (300/300) |
| Rank S terá **no máximo +2 %** de atributos | `sim/nivel.js`: +2 % dá 65 % / 68 %; mais que isso fura os 70 % |
| A economia (ouro e preços acima do 30) ainda não foi conferida | Fica para o bloco de balanço, com o simulador |

### Bloco 2 concluído em 15/10/2026 (v0.12, save v14, regras v4): evoluções A/B no nível 15

| O que mudou | Onde |
|---|---|
| `EVOLUCOES` (nome, mote, texto de cada caminho) e `NIVEL_EVOLUCAO = 15` | `02_dados.js` |
| `m.evolucao` (`null`/`'a'`/`'b'`), `evoDe`, `podeEvoluir`, `evoluir`, `nomeEvo`; Campeões não evoluem | `09` |
| Efeitos dos 20 caminhos (busca por `u.evo`); `st.slowLeve` (Lentidão leve, 20 %), `esquivaEf` (buff de esquiva), debuff de AGI, invocações com `provoca`/`cavaleiro`, `sk.resetar` (recarga zerada) | `10_combate.js` |
| Cérebro: Sentinela só usa a Investida em quem chegou perto; Tiro Certeiro vale como golpe único; Dissonante canta quando a luta já começou; Legião/Necromante com seus limites | `10b` |
| Ficha: bloco "Hora de evoluir!" logo abaixo das habilidades, com dois cartões → confirmação ("para sempre") → bloco "feita"; chip da evolução no card do Elenco | `26`, `30`, `shell.html` |
| Rivais da Liga, Copa e Torre a partir do nv. 15 vêm com caminho sorteado; recrutas do Mercado vêm sem (a escolha é do jogador) | `21`, `22` |
| Registro da luta guarda `evolucao`; **regras v4**, mas registros v3 reproduzem iguais (`REGRAS_COMPATIVEIS = [3, 4]`): 200 lutas gravadas pelo código v3 reproduziram 200/200 no v4 | `10`, `sim/replay.js --gravar/--conferir` |
| Save **v14**: só o campo novo; nota "Fase 12 · Evoluções" | `15`, `28` |
| `sim/evolucoes.js` (valor de cada caminho em time de 3), `sim/balanco.js --evo`, `testes/evolucoes.py` (21 verificações) | `sim/`, `testes/` |

#### Como ficaram os 20 caminhos (medido: time de 3 com a classe evoluída × mesmo time sem evolução, 60 lutas, nv. 15)

| Classe | A | vence a base | B | vence a base |
|---|---|---|---|---|
| Guardião | **Bastião** — Muralha provoca 4 s (6 no SUPREMO), raio maior | 45 % | **Égide** — Muralha também dá escudo de 15 % ao aliado mais ferido; provoca 1 s | 45 % |
| Machadeiro | **Berserker** — Fúria até +50 % ATQ; −10 % DEF | 70 % | **Ceifador** — Redemoinho puxa e cura 20 % do dano | 57 % |
| Lanceira | **Cavaleira** — Investida recarrega 40 % mais rápido; atordoa 0,5 s | 58 % | **Sentinela** — não avança; quem chega perto leva 130 %, empurrão e 1,2 s de atordoamento | 65 % |
| Arqueira | **Atiradora de Elite** — Tiro Certeiro: 150 % num alvo, crítico garantido | 70 % | **Batedora** — recua 20 % mais rápido; cada onda da Chuva deixa Lentidão leve 2 s | 48 % |
| Piromante | **Incendiária** — área e queimadura dobradas; dano direto 120 % | 72 % | **Pira** — 240 % num alvo, sem explosão | 78 % |
| Criomante | **Geleira** — congela 1,5 s sempre; dano 160 % | 53 % | **Nevasca** — atravessa a linha (140 % nos demais), Lentidão leve 3 s | 62 % |
| Clériga | **Sacerdotisa** — Luz cura todos: 280 % no mais ferido, 100 % nos outros | 42 % | **Inquisidora** — cura 200 % e causa 150 % ao inimigo mais perto do curado | 47 % |
| Lâmina | **Assassina** — se o alvo do Passo morrer, a recarga zera | 48 % | **Sombra** — 2 s com +40 % de esquiva depois do Passo | 72 % |
| Bardo | **Maestro** — Hino dura 10 s | 75 % | **Dissonante** — Hino vira maldição: todos os inimigos −30 % ATQ e AGI por 8 s | 62 % |
| Invocador | **Legião** — 3 esqueletos (25 %), até 6, que provocam | 75 % | **Necromante** — 1 Cavaleiro de Ossos (VIDA 90 %, ATQ 70 %) permanente; SUPREMO cura e enfurece | 53 % |

| Decisão | Por quê |
|---|---|
| Os números da tabela aprovada foram **calibrados** (Tiro Certeiro 250 → 150 % crítico; Pira 260 → 240; Geleira 120 → 160; Sentinela 1,5 → 1,2 s; Legião 30 → 25 %; Necromante ATQ 60 → 70 %; Maestro 12 → 10 s e sem mudar o Ritmo; Dissonante alcança a arena inteira; Sacerdotisa mantém os 280 % no mais ferido; Sombra virou +40 % de esquiva em vez de "sem poder ser alvo") | Primeira medição tinha 0 % e 100 % (Bastião 0, Égide 97, Elite 98, Sacerdotisa 0, Sombra 98, Maestro 100, Dissonante 0). O combate é sensível a atributo (achado do bloco 1), então as evoluções precisam ser **laterais**, não verticais. Nomes e espírito de cada caminho são os aprovados |
| Alvo de balanço: cada caminho entre 40 % e 80 % contra a base, em time de 3 | Evoluir deve ser recompensa visível, mas o jogador que escolher "errado" não pode ficar fora do jogo. Nenhum caminho fica abaixo de 42 % |
| Suportes (Clériga, Bardo) medidos num time com dano (tanque + arqueira) | Com dois times de cura a luta ia ao relógio (120 s) e a medida virava moeda |
| A escolha é irreversível e pede confirmação ("Pensar mais" / "Evoluir") | Regra do prompt-mãe; o toque errado no celular não pode custar a escolha |
| Regras v4 compatíveis com v3 | Sem evolução, nenhuma conta mudou; reproduções antigas continuam válidas, então não há "versão anterior" para quem já jogava |

Pendente de balanço geral (não é das evoluções): Arqueira ainda domina (88–95 % no 3v3 espelho), Guardião e Clériga fracos no teste espelho (mas o espelho de 3 iguais pune tanques e curas). Fica para o passo de balanço do fim da E5a, com o `sim/evolucoes.js` como medida de time real.

## Próxima conversa começa por… (E5a bloco 3, **Fable 5.1**)

1. **Maestrias e Rank S**: maestria de função no nv. 20 (bônus pequeno ligado ao papel: tanque, atirador, mago…) e de classe no nv. 50 (um toque na habilidade); Rank S no nv. 100 com **no máximo +2 % de atributos** (fecha o critério 3 com `node sim/nivel.js --bonus 0.02`). Tudo em tabelas de dados (`02`), visível na ficha, save v15.
2. Depois: catálogo de habilidades com raridades (critério 5) → pity visível (critério 6) → economia acima do 30 → balanço geral (Arqueira, Guardião, Clériga) com `sim/evolucoes.js` e `sim/balanco.js --tam 3`.
3. A confirmar com o Kevin (sem pressa): função principal de cada classe (D1) e se o jogador novo precisa de algum tour.
