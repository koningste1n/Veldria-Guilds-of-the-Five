# Estado do projeto — Veldria: Guilds of the Five (antes Liga das Lâminas)

**Repositório:** github.com/koningste1n/Veldria-Guilds-of-the-Five · **Jogar:** https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ (publica sozinho a cada envio para `main`).

**Como trabalhar:** `docs/PROMPT-MAE.md` (papéis, regras, roteiro das etapas com critérios de pronto, handoff).

_Atualizado em 14/10/2026 (noite)._

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
| E3 | Registro de partidas, ficha de recordes + melhores da temporada, simulador de balanço em Node | 1–2 | Opus 5.5 | **próxima** |
| E4 | Motor novo: IA de utilidade, 3×3 + posturas, câmera, 3v3 melhor de 3; decisão de orientação de tela | 3–4 | **Fable 5.1** | |
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

## Próxima conversa começa por… (E3, Opus 5.5)

1. Ler `10_combate.js` (`resumoBatalha`) e `23_estatisticas.js` / `31_…` para ver o que já é medido por lutador (dano, cura, abates, MVP já existem em `statsMercPadrao`).
2. Escrever no `ESTADO.md` o critério de pronto da E3 (seção 5 do prompt-mãe) e começar pelo **simulador em Node** (`sim/balanco.js`), porque ele exige isolar o combate do desenho — o mesmo corte que o registro de partidas precisa.
