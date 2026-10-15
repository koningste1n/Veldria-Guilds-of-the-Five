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

| # | Etapa | Conversas | Status |
|---|---|---|---|
| E1 | Código recuperado, no GitHub e publicado | — | ✅ |
| E2 | Exportar/importar save, nome Veldria no jogo, tutorial progressivo nas 5 primeiras lutas | 1–2 | próxima |
| E3 | Registro de partidas, ficha de recordes + melhores da temporada, simulador de balanço em Node | 1–2 | |
| E4 | Motor novo: IA de utilidade, 3×3 + posturas, câmera, 3v3 melhor de 3; decisão de orientação de tela | 3–4 | |
| E5a | Curva 1→100, Ascensão como portão, maestrias 20/50, Rank S, A/B nv. 15, catálogo com raridades, pity | 2 | |
| E5b | Personalidades visíveis, rivais, identidade de build, relíquias 24+, renome, contrato diário, eventos semanais | 2 | |
| E6 | Classes novas em lotes de 2–4 | 1–2 | |

Critérios de pronto de cada etapa: `docs/PROMPT-MAE.md`, seção 5.

## Próxima conversa começa por… (E2, Opus 5.5)

Achados de 14/10 (noite) que reduzem a E2:
- **Exportar/Importar save já existe** (`exportarCodigo`/`importarCodigo` em `15_estado-e-save.js`, botões em Configurações, código `LDL1:`). Não refazer; só conferir que continua funcionando após a migração.
- Tutorial atual: `TUTORIAL` em `28_…` com 6 balões que passeiam pelas abas antes da 1ª luta. Será **substituído** pelo tutorial progressivo.
- Rótulo de versão: o jogo mostra `v0.4.1`, o README `v0.4`. A E2 fecha como **v0.5**, `VERSAO = 6`, nota de novidades `NOVIDADES[6]`.

Escopo final da E2:
1. Nome **Veldria: Guilds of the Five** em `src/shell.html` (title), rótulo de versão, nota de novidades, README. Chave do save não muda.
2. Tutorial progressivo nas 5 primeiras lutas. **Proposta de ordem para o Kevin aprovar na abertura da conversa:**

| Momento | Aba liberada | Por quê agora |
|---|---|---|
| Antes da 1ª luta | Só **Liga** (botão LUTAR em destaque) | O jogador precisa ver uma luta antes de qualquer menu |
| Após a 1ª luta | **Elenco** | Acabou de ver o time lutar; agora entende capitão, Frente/Trás |
| Após a 2ª luta | **Itens** | Ganhou um item ou poção e tem onde usar |
| Após a 3ª luta | **Mercado** | Tem ouro suficiente para o 1º recruta |
| Após a 4ª luta | **Guilda** | Cofre já encheu; expedições fazem sentido com reserva |
| Após a 5ª luta | **Torre** + engrenagem de Configurações; tutorial encerra | Já domina o ciclo básico |

Cada liberação: a aba aparece com um balão de uma frase (reaproveitar `#tutorial`), sem obrigar a entrar. Saves antigos (`tutorial = 99`) veem tudo liberado desde o início. `STATE.tutorial` passa a contar lutas concluídas (0–5); migração v5→v6: `tutorial >= 6 ? 99 : 99` para quem já jogava (ninguém com save antigo repete).

3. Critério de pronto: jogador novo chega à 1ª luta em < 60 s sem ver outro menu; após a 5ª luta todas as abas estão visíveis; save v5 real abre em v6 sem perda e sem tutorial; fumaça passa; novo teste `testes/tutorial.py` cobre as 5 lutas.
