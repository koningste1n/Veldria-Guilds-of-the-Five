# Veldria: Guilds of the Five — instruções para o Claude

Jogo do Kevin (antes "Liga das Lâminas"): gestão de guilda de mercenários com batalhas automáticas, pixel art desenhada por código, celular em pé. HTML + CSS + JS puro, sem bibliotecas, sem nada externo. Kevin não programa: decida e justifique, fale em português do Brasil, respostas estruturadas com tabelas.

## Antes de começar
- Leia `docs/ESTADO.md`: o que existe, o que vem e a ordem combinada.
- Não carregue o código inteiro (6.200+ linhas). Abra só os módulos de `src/js/` que a tarefa toca; o mapa está no `README.md`.

## Montar, testar, publicar
1. Edite `src/js/NN_nome.js` (a ordem numérica é a ordem de execução) ou `src/shell.html` (HTML/CSS).
2. `python3 build.py` → `dist/index.html` (GitHub Pages) e `dist/liga-das-laminas.html` (artefato no Claude).
3. Extraia o `<script>` de `dist/index.html` e rode `node --check`.
4. `python3 testes/fumaca.py dist/index.html` (Playwright, tela 390 px): zero erros, sem rolagem lateral, save sobrevive ao recarregar. Crie testes novos em `testes/` conforme a fase.
5. Commit com autor `Claude <noreply@anthropic.com>` e push para `main`. O GitHub Actions publica em https://koningste1n.github.io/Veldria-Guilds-of-the-Five/ em ~30 s; confira o link depois.

## Regras
- **Nunca quebre um save.** Chave atual: `ligaDasLaminas.save.v1` (localStorage) e o save na nuvem do artefato. Toda mudança de formato leva número de versão e função de migração. Não troque a chave sem migrar.
- Toda fase começa com um critério de pronto escrito em `docs/ESTADO.md` e termina com ele marcado.
- Conteúdo (classes, habilidades, relíquias, chefes) fica em tabelas de dados (`02`–`04`), não espalhado na lógica.
- Combate determinístico: simulação separada do desenho, semente aleatória. O motor novo nasce isolado e testável em Node, sem tela.
- Proibido: `alert/confirm/prompt`, CDN, imagens ou fontes externas, hover como única forma de interação, botões menores que 44 px.
- Ao fim de cada fase: atualize `docs/ESTADO.md` (no repositório e no Projeto do claude.ai, `liga-das-laminas/ESTADO.md`) e a nota de novidades do jogo.

## Skills úteis
game-development, game-ai-behavior (motor/IA de utilidade), game-balancing (economia, curvas, simulações), pixel-art-sprites e pixel-art (arte e animação), frontend-design (interface).
