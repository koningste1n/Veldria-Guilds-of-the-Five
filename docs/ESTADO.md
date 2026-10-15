# Estado do projeto — Veldria: Guilds of the Five (antes Liga das Lâminas)

**Repositório:** github.com/koningste1n/Veldria-Guilds-of-the-Five · **Jogar:** https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ (publica sozinho a cada envio para `main`).

_Atualizado em 14/10/2026._

## O que existe (v0.4, Fase 4.1)

- 10 classes: guardião, machadeiro, lanceira, arqueira, piromante, criomante, clérica, lâmina, bardo e invocador.
- 5 divisões (Bronze → Lenda), Copa dos 4 primeiros com Líderes, cerca de 25 pergaminhos, cerca de 15 relíquias, consumíveis, Forja, Ascensão, Campeões.
- Sede ociosa, expedições, Acampamento, Torre Infinita com Guardiões a cada 10 andares, estatísticas, Modo Criador (7 toques na versão).
- Bonecos 32×40 com membros por cinemática inversa e 3 vistas, arena 384×216 com câmera, VFX direcionais, sons sintetizados, vibração e câmera lenta.
- Combate com passo fixo de 1/30 s e semente aleatória; "pular luta"; IA por função.
- Save na nuvem por conta (capacidades db/user do Claude), com resolução de conflito entre aparelhos.

## Perdido na migração

Os testes Playwright antigos (`luta.py`, `lideres.py`, `nuvem.py`, `perf.py`…) e as simulações de balanceamento (`balanco2.js`, `jornada.js`) ficaram em pastas temporárias de conversas antigas. Só o teste de fumaça foi refeito. Recriar os outros conforme as fases precisarem.

## Próxima versão (receita da "Engenharia Reversa do Eslabong")

Decisão do conselho de 14/10/2026: **evoluir, não reescrever.** Trocar só o motor de batalha e manter arte, sons, nuvem, Torre, Forja e expedições.

| Sistema | Destino |
|---|---|
| Arte, VFX, sons, nuvem, testers, Torre, Forja, expedições | Fica |
| 10 classes → 6 funções (tanque, corpo a corpo, assassino, distância, controle, suporte) | As funções viram etiquetas sobre as 10 classes |
| Pergaminhos → 2 habilidades garantidas + catálogo de 6 | Adapta |
| Relíquias → 24 com padrões de efeito | Adapta e amplia |
| IA de utilidade, personalidades com erro, formação 3×3, posturas, 3v3 melhor de 3 | Motor novo, em módulo isolado, testado sem tela |
| Evoluções A/B (nv. 15), maestrias (20/30), proteção contra azar, renome | Novo |
| Registro de partidas (semente, versão das regras, times, vencedor), save versionado, exportar/importar | Novo, e vem **primeiro** |

Estimativa: 8 a 12 conversas de trabalho.

## Ordem combinada

1. ✅ Código-fonte recuperado, versionado no GitHub e publicado no GitHub Pages.
2. Save com número de versão e migração, mais exportar/importar como texto.
3. Registro de partidas.
4. Motor novo de batalha, primeiro 1v1 e depois 3v3, ligado na interface só quando vencer a IA atual nas simulações.
5. Personalidades, relíquias com padrões de efeito, evoluções A/B.

## Pendências de ideia

- Trocar o nome dentro do jogo para Veldria sem mudar a chave do save (`ligaDasLaminas.save.v1`).

- Uma frase de sensação-alvo: o que deve prender o jogador.
- Os primeiros 3 minutos de um jogador novo (hoje ele vê 7 menus).
- Critério de pronto de cada fase.
- Verificar se a formação 3×3 e as posturas cabem na tela em pé.
- Testar barato se o jogador percebe personalidades e erros numa luta automática.
