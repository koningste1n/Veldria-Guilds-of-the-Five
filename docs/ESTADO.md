# Estado do projeto — Veldria: Guilds of the Five (antes Liga das Lâminas)

**Repositório:** github.com/koningste1n/Veldria-Guilds-of-the-Five · **Jogar:** https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ (publica sozinho a cada envio para `main`).

**Como trabalhar:** `docs/PROMPT-MAE.md` (papéis, regras, roteiro das etapas com critérios de pronto, handoff).

_Atualizado em 15/10/2026 (E4 fechada em código: câmera, orientação em pé, partida melhor de 3)._

## O que existe (v0.10, E4: cérebro v2, formação 3×3 com tela, câmera de treinador, partidas melhor de 3)

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
| E4 | Motor novo: IA de utilidade, 3×3 + posturas, câmera, 3v3 melhor de 3; decisão de orientação de tela | 3–4 | **Fable 5.1** | ✅ **em código, 15/10** (3 conversas) — falta só o teste do Kevin no celular (critérios 3, 4 e 5) |
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

## E4 — em andamento (começou em 15/10/2026, Fable 5.1)

### Critério de pronto da E4 (seção 5 do prompt-mãe)

| # | Critério | Como medir |
|---|---|---|
| 1 | Cérebro novo vence o atual com as mesmas regras e os mesmos lutadores: **média ≥ 55 %** na matriz completa (IA nova com a classe da linha × IA atual com a classe da coluna, 100 pares) e, no espelho (mesma classe dos dois lados), **nenhuma classe abaixo de 42 %** — o cérebro novo não pode piorar classe nenhuma | `node sim/balanco.js --duelo` (linha = IA nova, coluna = IA atual) |
| 2 | Formação 3×3 + posturas (avançar, segurar, flanquear) configuradas no Preparo e lidas pelo cérebro novo | ✅ modelo, save v9, cérebro, `sim/formacao.js` (a escolha muda o resultado em até 74 pontos) e a grade 3×3 no Elenco (v0.8) |
| 3 | 3×3 roda a 30 passos/s no celular sem travar | `sim/` mede ms por passo (medido em Node: 6–16 µs por passo em 3v3 e 5v5, ~2.000× abaixo dos 33 ms); falta o teste no celular do Kevin |
| 4 | Câmera: afastada mostrando a formação, aproxima no embate | ✅ em código e no `testes/camera.py` (15/10); falta o olhar do Kevin no celular |
| 5 | 3v3 melhor de 3 (D7) | ✅ em código (v0.10, save v12): Liga e Copa em melhor de 3 com intervalo; `registro.py`, `formacao.py` e `camera.py` cobrem; falta o olhar do Kevin |
| 6 | Kevin aprovou a orientação de tela (em pé × deitada) depois do 1º teste 3×3 | ✅ **em pé** (Kevin, 15/10/2026, com os 4 mockups) |
| 7 | Save abre sem perda; fumaça e `registro.py` passam; reproduções antigas continuam idênticas | testes — (b): save v7 → v8 sem perda ✅; lutas de regras v1 avisam "versão anterior" em vez de reproduzir (previsto) ✅ |

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

## Próxima conversa começa por… (fechar a E4 com o Kevin e abrir a E5a, **Fable 5.1**)

0. Ler o veredito do Kevin no celular (ficou em branco em 15/10): (1) as 3 lutas do cérebro novo (recuo, invocador, cura); (2) a grade de formação — dá para mover com o dedão? (3) a câmera: a aproximação no primeiro embate dá a sensação de "o meu time entrou em campo"? (4) **a partida melhor de 3**: o intervalo é claro? mudar a formação entre lutas mudou alguma partida? ficou longa demais? Ajustar e **marcar os critérios 3, 4 e 5 da E4** aqui.
1. Abrir a **E5a** (seção 5 do prompt-mãe): escrever o critério de pronto no `ESTADO.md` e levar ao Kevin, na primeira mensagem, **os números da curva 1→100** (Ascensão I no nv. 30 libera até 60; Ascensão II no nv. 60 libera até 100) e **a proposta de evoluções A/B por classe** (seção 8).
2. Balanceamento da E5a parte da linha de base v2×v2 (`sim/resultados/*-v2.*`): Invocador 4 %/0 % e Guardião 44 %/22 % são decisões de desenho (esqueletos impondo presença; bloqueio físico do tanque), não só número.
