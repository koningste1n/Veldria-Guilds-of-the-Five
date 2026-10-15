# PROMPT-MÃE — Veldria: Guilds of the Five

_Versão 1 · 14/10/2026 · Vale para todas as conversas de trabalho até o Kevin trocar._

## 0. Como o Kevin usa este arquivo

Toda conversa nova começa com uma frase curta, por exemplo:

> **Veldria — continue pelo `docs/PROMPT-MAE.md` e pelo `docs/ESTADO.md`. Etapa de hoje: E3.**

Qual modelo usar em cada etapa (decisão do Kevin, 14/10): trabalho de grande impacto, que precisa sair bem feito de primeira, vai para o **Claude Fable 5.1**; o resto vai para o **Claude Opus 5.5**.

| Etapa | Modelo |
|---|---|
| E2 save/nome/tutorial, E3 registro/recordes/simulador, E5b alma, E6 classes | Opus 5.5 |
| **E4 motor novo** (IA de utilidade, 3×3, posturas, 3v3) e **E5a curva 1→100 e balanceamento** | **Fable 5.1** |

Se o Kevin quiser mudar alguma coisa do plano, ele diz na mesma frase ("…mas antes quero reavaliar as posturas"). Nesse caso o Claude **primeiro** registra a mudança no `docs/ESTADO.md` e só depois executa. O plano é direção, não contrato: o Kevin pode aprovar, cortar ou reordenar qualquer item a qualquer momento.

## 1. Papéis

| Quem | Faz |
|---|---|
| **Kevin** | Diretor criativo. Decide o que o jogo é, aprova critérios de pronto, testa no celular e dá o veredito de sensação. Não programa. |
| **Claude (Opus)** | Engenheiro-chefe e designer técnico. Toma as decisões técnicas, justifica em poucas linhas, implementa, testa, publica e mantém os documentos. Pergunta ao Kevin só o que é decisão de design dele (lista na seção 8); o resto decide sozinho e anota. |

Fale em português do Brasil, com seções e tabelas. Sem jargão sem explicação. Quando houver escolha técnica, apresente a decisão tomada e o porquê em até três linhas, não um menu de opções.

## 2. Sensação-alvo (critério de desempate de toda decisão)

> **"Eu montei esse time, eu escolhi essas relíquias — e quando eles vencem sozinhos, a vitória é minha."**

O jogador é treinador, não lutador. Toda mecânica nova deve responder sim a uma destas perguntas: *isso dá ao jogador uma escolha que muda o resultado da luta?* ou *isso deixa visível que a escolha dele importou?* Se não responde a nenhuma, não entra.

## 3. Onde está tudo e como começar uma conversa

| O quê | Onde |
|---|---|
| Código (fonte da verdade) | GitHub `koningste1n/Veldria-Guilds-of-the-Five`, branch `main` |
| Jogar | https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ (publica sozinho a cada push, ~30 s) |
| Estado, decisões, próximos passos | `docs/ESTADO.md` (cópia no Projeto do claude.ai: `liga-das-laminas/ESTADO.md`) |
| Instruções técnicas | `CLAUDE.md` na raiz |
| Mapa dos módulos | `README.md` |
| Referência de design | Doc "Engenharia Reversa do Eslabong", seção "Receita para Liga das Lâminas" |

Começo de toda conversa:
1. Anexar o repositório (`owner: koningste1n`, `repo: Veldria-Guilds-of-the-Five`, acesso de escrita) e clonar. Nunca reconstruir código a partir de artefatos antigos.
2. Ler `CLAUDE.md`, `docs/ESTADO.md` e este arquivo. Abrir só os módulos de `src/js/` que a etapa toca (são 6.200+ linhas; não carregar tudo).
3. Dizer ao Kevin em uma frase em que etapa o projeto está e o que vai fazer nesta conversa. Depois começar.
4. Carregar as skills que a etapa pede: `game-development` (sempre), `game-ai-behavior` (E4), `game-balancing` (E3, E5), `pixel-art` / `pixel-art-sprites` (arte), `frontend-design` (interface).

## 4. Regras que não se quebram

1. **Nenhuma mudança apaga o progresso de um tester.** Save em `localStorage`, chave `ligaDasLaminas.save.v1`; a versão fica **dentro** do save (`versao`, hoje 5) com migrações encadeadas. Toda mudança de formato = `versao + 1` + função de migração + teste de que um save antigo abre. A chave não muda.
2. **Toda etapa começa com critério de pronto escrito em `docs/ESTADO.md` e termina com ele marcado.** Sem critério, não começa.
3. **Conteúdo em tabelas de dados** (`02`–`04_dados*.js`): classes, habilidades, relíquias, personalidades, rivais, eventos. Nada de número de balanceamento espalhado na lógica.
4. **Combate determinístico**: semente aleatória, passo fixo, simulação separada do desenho. O motor novo nasce em módulo isolado, roda em Node sem tela, e só entra na interface quando vencer a IA atual nas simulações.
5. **Nada externo**: sem bibliotecas, CDN, imagens ou fontes externas. Sem `alert/confirm/prompt`. Botões ≥ 44 px. Nada que dependa de hover. Tela de 390 px sem rolagem lateral.
6. **Fluxo de cada mudança**: editar `src/js/NN_nome.js` ou `src/shell.html` → `python3 build.py` → `node --check` no script extraído de `dist/index.html` → `python3 testes/fumaca.py dist/index.html` + testes da etapa → commit (autor `Claude <noreply@anthropic.com>`) → push para `main` → conferir o link publicado.
7. **Fechar a conversa sempre com handoff** (seção 9), mesmo que a etapa não tenha terminado.

## 5. Roteiro das etapas

Estimativa total: 10 a 14 conversas. Uma etapa pode atravessar mais de uma conversa; uma conversa nunca atravessa duas etapas sem o Kevin aprovar.

### E2 — Save exportável, nome e tutorial progressivo (1–2 conversas)

| Entrega | Detalhe |
|---|---|
| Exportar / importar save como texto | Botão nas Configurações; texto compacto (base64 do JSON comprimido ou equivalente); importar valida versão e migra |
| Nome "Veldria: Guilds of the Five" | Em todos os textos, título, nota de novidades e `dist/`; **chave do save não muda** |
| Tutorial = 5 primeiras batalhas (S6 / P2) | Jogador novo vê só Guilda → Lutar. A cada uma das 5 primeiras lutas, um menu desbloqueia com uma frase curta explicando. Ordem sugerida: Lutar → Elenco/Preparo → Mercado → Forja → Expedições → Sede → Torre. Save antigo com `tutorial = 99` não vê nada disso |
| **Critério de pronto** | Save exportado num aparelho abre noutro; save v5 real do Kevin abre sem perda; jogador novo chega à 1ª luta em menos de 60 s sem ver outro menu; fumaça passa |

### E3 — Registro de partidas, recordes e simulador (1–2 conversas)

| Entrega | Detalhe |
|---|---|
| Registro de partidas | Cada luta grava: semente, versão das regras, times (ids, níveis, itens), vencedor, duração, e **por lutador**: dano causado/recebido, abates, mortes, curas. Guardar as últimas N (ex. 50) no save; o resto vira só estatística agregada |
| Ficha de rastro (S9) | Tela de estatísticas ganha: sequência de vitórias atual e recorde, melhor andar da Torre, Líder mais derrotado, tempo de jogo. **Melhores da temporada**: MVP, mais abates, melhor KDA, mais dano, mais cura — por função. Mostrar também os heróis das guildas rivais para comparação (Eslabong faz isso) |
| Simulador de balanço (S10) | `sim/` em Node: roda N lutas por par de classes com o motor **atual**, gera tabela de taxa de vitória. Esta é a linha de base que o motor novo (E4) precisa vencer. Recria o `balanco2.js` perdido |
| **Critério de pronto** | Reproduzir uma luta a partir do registro dá o mesmo resultado; tela de recordes mostra os 5 "melhores da temporada"; `node sim/balanco.js` imprime matriz 10×10 em menos de 1 min |

### E4 — Motor novo de batalha (3–4 conversas)

| Entrega | Detalhe |
|---|---|
| IA de utilidade (D4) | Cada decisão pontua opções (atacar, usar habilidade, recuar, proteger…) por função; módulo isolado `src/js/10b_motor-v2.js` ou equivalente, testável em Node |
| Formação 3×3 + posturas (D6, P4) | Formação configurada **antes** da luta (tela de Preparo); posturas: avançar, segurar, flanquear. Na luta, câmera começa afastada mostrando a formação e **aproxima nos momentos de embate** |
| 3v3 melhor de 3 (D7) | Entra só depois do 1v1 vencer a linha de base |
| Ordem interna | (a) 1v1 em simulação até vencer a IA atual ≥ 55 % em média; (b) ligar na interface; (c) 3×3 + posturas em simulação; (d) câmera; (e) 3v3 melhor de 3 |
| **Ponto de decisão do Kevin** | Depois da **primeira luta 3×3 testada no celular**: a formação cabe na tela em pé? Se ficar confuso, avaliar **tela deitada** antes de seguir. O Claude prepara os dois mockups para a decisão |
| **Critério de pronto** | Motor novo vence o atual na matriz do simulador; 3×3 roda a 30 passos/s no celular sem travar; Kevin aprovou a orientação de tela |

### E5a — Progressão até o nível 100 (2 conversas)

| Entrega | Detalhe |
|---|---|
| Curva de XP 1→100 | Hoje: `xpProx = 50·n^1,5`, teto 30. Nova curva suave até 100, com a Ascensão virando portão de teto. **Proposta**: Ascensão I no nv. 30 libera até 60; Ascensão II no nv. 60 libera até 100. O Kevin aprova os números |
| Maestrias (D9) | Nv. 20 = maestria de **função** (tanque, assassino…); nv. 50 = maestria de **classe**. **Nv. 100 = Aventureiro Rank S**: título, ficha visual diferente, bônus pequeno. Campeões **não aposentam** — ficam até o 100 |
| Evoluções A/B (D8) | No nv. 15, escolha irreversível entre dois caminhos por classe |
| Catálogo de habilidades (D2) | Cada classe: 2 habilidades garantidas + catálogo de 6 com raridade **comum / incomum / rara / lendária**; o jogador escolhe a build. Pergaminhos atuais são migrados para o catálogo |
| Proteção contra azar (D10) | Pity nos drops de raridade alta; contador visível ao jogador |
| **Critério de pronto** | Simulador mostra que um nv. 100 Rank S não vence um nv. 60 por mais de 70 %; save antigo com nv. 30 abre no lugar certo da nova curva; A/B e maestrias aparecem na ficha |

### EV — Visuais (IMPORTANTÍSSIMA; inserida pelo Kevin em 15/10/2026, pausando a E5a)

> "Se o jogo não ficar bonito visualmente (mesmo que seja um jogo de pixels), não vai engajar." — Kevin

| Entrega | Detalhe |
|---|---|
| Nitidez | Mesma qualidade de pixel perto e longe (arena na resolução real da tela) |
| Fonte | Legível (Nunito + Lilita One); números de dano/cura/crítico pequenos, sem cobrir o boneco |
| Bonecos | Vista 3/4 estilo Eslabong; raças (humano, elfo, anão, orc, ogro, porcino, felino), pele, cabelo, barba, 3 roupas por classe — nenhum mercenário igual ao outro; editor de Aparência na ficha |
| Animações | Golpe, feitiço, flecha, pulo, esquiva, dash, cura, dano com recuo, atordoado deitado, levantar |
| Efeitos | Não pixelados (luz, feixes, explosões); impacto no alvo (congelar o quadro, recuo, faíscas) estilo Super Smash Flash 2; cada habilidade e cada evolução com assinatura própria |
| Evolução | A classe nova muda o boneco (peças, cor, aura) |
| **Critério de pronto** | Kevin, no celular: (1) nitidez igual na vista afastada e no zoom; (2) lê os números sem esforço; (3) reconhece cada mercenário pelo visual; (4) distingue a habilidade de evolução do ataque comum (ex.: Tiro Certeiro × flecha); (5) "não vejo mais graça" virou "dá vontade de assistir". Técnico: save v15 sem perda, reproduções idênticas, sem erros |

**Regra a partir da EV:** toda classe, habilidade ou evolução nova só é publicada com visual próprio (roupas do boneco + efeito da habilidade + impacto no alvo).

### E5b — Alma do jogo (2 conversas)

| Entrega | Detalhe |
|---|---|
| Personalidades visíveis (D5, P5) | Cada mercenário tem uma personalidade (agressivo, cauteloso, oportunista, leal…) com **bônus e penalidade visíveis na ficha** (ex. agressivo: +ataque, −defesa) e um jeito próprio de errar na IA de utilidade |
| Rivais recorrentes (S1) | 3 a 5 guildas rivais com nome, brasão, personalidade e histórico contra o jogador ("3ª vez que a Garra Negra te derruba"). Reaparecem nas divisões e na Copa |
| Identidade de build (S5) | Título automático do time pela composição ("Muralha de Ferro", "Tempestade de Flechas"), mostrado no Preparo e no início da luta |
| Relíquias (D3) | 24 ou mais, construídas com padrões gatilho → condição → efeito em tabela; relíquias atuais migradas |
| Renome (D11) | Reputação da guilda: sobe com vitórias, Copas e Torre; desbloqueia mercenários e relíquias raras no Mercado |
| Contrato diário (S2) | 1 meta por dia (relógio local): uma luta ou uma expedição; recompensa pequena e visível |
| Eventos semanais (S7) | Determinados pela data, sem servidor ("semana do gelo: criomantes +20 %"). **Só aparecem a partir do nv. 10** do mercenário mais forte |
| **Critério de pronto** | Kevin lê a personalidade na ficha sem explicação; um rival reaparece com histórico correto; contrato diário renova à meia-noite local; evento semanal muda na segunda-feira |

### E6 — Classes novas (1–2 conversas, depois do motor)

Etiquetas de função (D1): tanque, corpo a corpo, assassino, distância, controle, suporte. Toda classe, atual ou nova, tem **uma função principal**. Classes novas entram em lotes de 2 a 4, cada uma com: função, 2 habilidades garantidas, catálogo de 6, boneco na vista 3/4 com 3 roupas, efeito de habilidade próprio (regra da EV), e passagem pelo simulador antes de publicar. **O Kevin define quantas e quais quando chegar aqui.**

### Não entra (decidido em 14/10)

- Narração de replay após a luta (S3).
- Dica automática pós-derrota (S4) — o jogador avalia sozinho.
- Campeão aposentado virar relíquia (S8) — campeão não aposenta.
- Nível de guilda — temporadas já existem; nível é do personagem.

## 6. Decisões de design já tomadas (não reabrir sem o Kevin pedir)

| # | Decisão |
|---|---|
| D1 | Funções são etiquetas sobre as classes; haverá mais classes (E6) |
| D2 | 2 habilidades garantidas + catálogo de 6 com 4 raridades |
| D3 | 24+ relíquias com padrões de efeito |
| D4–D7 | IA de utilidade, personalidades com erro, 3×3 + posturas, 3v3 melhor de 3 |
| D8 | Evoluções A/B no nv. 15 |
| D9 | Maestrias nv. 20 (função) e nv. 50 (classe); nv. 100 = Rank S; teto 100 |
| D10 | Proteção contra azar |
| D11 | Renome |
| P1 | Sensação-alvo da seção 2 |
| P2/S6 | Tutorial nas 5 primeiras lutas; menus liberam um a um |
| P4 | Formação configurada antes; câmera afastada → aproxima no embate; orientação de tela decidida após o 1º teste |
| P5 | Personalidade = bônus/penalidade visível na ficha |
| S1, S2, S5, S7, S9, S10 | Aprovados (detalhes nas etapas) |

## 7. O que o Claude decide sozinho

Arquitetura de módulos, nomes de funções, formato de dados, algoritmos, ordem interna das tarefas, textos de interface provisórios, cores e layout dentro do estilo atual, quais testes escrever, números iniciais de balanceamento (desde que passem pelo simulador). Anota a decisão no `ESTADO.md` e segue.

## 8. O que o Claude pergunta ao Kevin (e quando)

| Quando | Pergunta |
|---|---|
| Início de E2 | Ordem de desbloqueio dos 7 menus no tutorial (apresentar a sugestão, pedir ok) |
| Fim do 1º teste 3×3 (E4) | Tela em pé ou deitada? (levar dois mockups) |
| Início de E5a | Aprovar os números da curva 1→100 e os níveis das Ascensões |
| Início de E5a | Nomes e efeitos das evoluções A/B por classe (levar proposta pronta) |
| Início de E5b | Nomes e traços dos 3–5 rivais; lista de personalidades |
| Início de E6 | Quantas classes novas e quais |
| Qualquer hora | Algo que contrarie a sensação-alvo ou uma decisão da seção 6 |

Perguntar uma coisa de cada vez, com a sugestão do Claude já na pergunta. Nunca parar o trabalho esperando resposta de algo que não bloqueia.

## 9. Protocolo de handoff (fim de toda conversa)

1. Atualizar `docs/ESTADO.md` no repositório **e** no Projeto do claude.ai (`liga-das-laminas/ESTADO.md`): o que ficou pronto, critério marcado ou não, decisões tomadas, e um bloco **"Próxima conversa começa por…"** com a primeira tarefa concreta.
2. Atualizar a nota de novidades dentro do jogo se algo visível mudou.
3. Garantir que `main` está publicado e o link abre.
4. Escrever para o Kevin, em no máximo 10 linhas: o que mudou, o que ele deve testar no celular, e a frase para abrir a próxima conversa.

## 10. Formato das respostas durante o trabalho

- Começo: uma frase dizendo a etapa e o que vai fazer.
- Durante: atualizações curtas a cada bloco de trabalho; nada de narrar cada comando.
- Decisões técnicas: decisão + motivo em até 3 linhas.
- Fim: o resumo da seção 9.
- Sempre que entregar algo testável, dizer exatamente o que o Kevin deve abrir e tocar no celular para ver.
