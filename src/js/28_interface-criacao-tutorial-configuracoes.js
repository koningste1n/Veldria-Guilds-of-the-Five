/* ============================ INTERFACE: CRIAÇÃO, TUTORIAL, CONFIGURAÇÕES ============================ */
function mostrarCriacao() {
  $('#app').hidden = true; $('#abas').hidden = true; $('#criacao').hidden = false;
  UI.criacao = UI.criacao || { nome: nomeGuildaAleatorio(), ...brasaoAleatorio() };
  renderCriacao();
}
function renderCriacao() {
  const c = UI.criacao;
  const cores = (campo) => CORES_BRASAO.map((cor) => `<button class="cor ${c[campo] === cor ? 'on' : ''}" style="--c:${cor}" data-act="cor" data-campo="${campo}" data-v="${cor}" aria-label="Cor ${cor}"></button>`).join('');
  const vitrine = ['guardiao', 'piromante', 'lamina', 'arqueira'].map((cls) => canvasLook(`${cls}|${cls === 'lamina' ? 2 : 0}|${CABELO_PADRAO[cls] ?? 1}|${c.cor1}|${c.cor2}`, 72)).join('');
  $('#criacao').innerHTML = `<div class="criacao">
    <p class="eyebrow">Cidades Livres de Vellmora</p>
    <h1 class="titulo-jogo">Liga das<br>Lâminas</h1>
    <div class="vitrine">${vitrine}</div>
    <p class="muted">Funde sua guilda de mercenários e dispute o Torneio das Lâminas.</p>
    <div class="painel">
      <div class="brasao-preview">${canvasBrasao(c, 104)}</div>
      <label for="nome-guilda">Nome da guilda</label>
      <div class="linha-input"><input id="nome-guilda" type="text" maxlength="24" value="${esc(c.nome)}" autocomplete="off"><button class="btn pequeno" data-act="nome-aleatorio">Sortear</button></div>
      <span class="rot">Cor principal</span><div class="cores">${cores('cor1')}</div>
      <span class="rot">Cor secundária</span><div class="cores">${cores('cor2')}</div>
      <span class="rot">Símbolo</span><div class="simbolos">${SIMBOLOS.map((s) => `<button class="simb ${c.simbolo === s ? 'on' : ''}" data-act="simbolo" data-v="${s}" aria-label="Símbolo ${s}">${canvasBrasao({ ...c, simbolo: s }, 40)}</button>`).join('')}</div>
      <button class="btn primario enorme" data-act="criar-guilda">Fundar guilda</button>
      <p class="dica">Você começa com 3 mercenários, 300 de ouro e uma Poção de Fúria.</p>
    </div></div>`;
  hidratar($('#criacao'));
  $('#nome-guilda').addEventListener('input', (e) => { c.nome = e.target.value; });
}
function abrirApp() {
  $('#criacao').hidden = true; $('#app').hidden = false; $('#abas').hidden = false;
  render();
  if (tutorialAtivo()) mostrarTutorial();
  else if (temNovidades()) mostrarNovidades();
}

/* ---- tutorial progressivo (v0.5): cada uma das 5 primeiras lutas libera um menu ---- */
const TUTORIAL = [
  { libera: ['liga'], aba: 'liga', txt: 'Bem-vindo, mestre! Seus mercenários lutam sozinhos: você monta o time, eles executam. Toque em LUTAR e veja como cada um age conforme a sua função.' },
  { libera: ['elenco'], aba: 'elenco', txt: 'Novo menu: Elenco. Toque num mercenário para ver os números, escolher Frente ou Trás e definir o capitão, que solta o SUPREMO.' },
  { libera: ['inventario'], aba: 'inventario', txt: 'Novo menu: Itens. O que você ganha nas lutas fica aqui. Equipe pelo Elenco e o time fica mais forte na próxima.' },
  { libera: ['mercado'], aba: 'mercado', txt: 'Novo menu: Mercado. Já dá para recrutar o primeiro reforço na Taverna. O Potencial (F a S) diz quanto cada atributo cresce por nível.' },
  { libera: ['guilda'], aba: 'guilda', txt: 'Novo menu: Guilda. A sede trabalha por você: o cofre enche até com o jogo fechado e quem fica na reserva pode sair em expedição.' },
  { libera: ['torre', 'config'], aba: 'torre', txt: 'Novo menu: Torre Infinita, com Guardiões a cada 10 andares. As configurações estão na engrenagem lá em cima. A guilda agora é toda sua!' },
];
const TUT_FIM = TUTORIAL.length - 1;   // 5: depois da 5ª luta
// Desligado em 15/10/2026 a pedido do Kevin: volta quando o jogo estiver mais completo (ver docs/ESTADO.md, Pendências).
const TUTORIAL_LIGADO = false;
const tutorialAtivo = () => TUTORIAL_LIGADO && !!STATE && STATE.tutorial < 99;
function liberado(id) {
  if (!tutorialAtivo()) return true;
  for (let i = 0; i <= STATE.tutorial; i++) if (TUTORIAL[i].libera.includes(id)) return true;
  return false;
}
function mostrarTutorial() {
  const p = STATE.tutorial, el = $('#tutorial');
  if (!tutorialAtivo() || STATE.tutorialVisto >= p) { el.hidden = true; return; }
  const T = TUTORIAL[p];
  if (UI.aba !== T.aba) UI.aba = T.aba;
  render();
  const lutar = p === 0 && $('[data-act="lutar-liga"]');
  if (lutar) lutar.scrollIntoView({ block: 'center' }); else window.scrollTo(0, 0);
  el.hidden = false;
  el.innerHTML = `<div class="tut-balao"><small>${p === 0 ? 'Primeiros passos' : `Luta ${p} de ${TUT_FIM} · menu liberado`}</small><p>${T.txt}</p><button class="btn primario pequeno" data-act="tutorial-prox">${p === TUT_FIM ? 'Começar' : 'Entendi'}</button></div>`;
}
const NOVIDADES = {
  14: [
    ['estrela', 'Evoluções no nível 15', 'Cada classe agora escolhe um de dois caminhos no nível 15, para sempre: o Guardião vira Bastião ou Égide, a Arqueira vira Atiradora de Elite ou Batedora, e assim por diante. A escolha muda a habilidade (e às vezes a passiva). Abra a ficha de quem já passou do 15.'],
    ['liga', 'Rivais evoluídos', 'Os rivais a partir do nível 15 também vêm com um caminho sorteado. Repare no que muda na luta.'],
  ],
  13: [
    ['emblema', 'Rumo ao nível 100', 'O nível máximo agora vai até 100. Sem Ascensão o teto é 30; a 1ª Ascensão (no nível 30) libera até 60 e a 2ª (no nível 60) libera até 100. Quem já tinha Ascensões ficou com elas e ganhou o teto novo.'],
    ['estrela', 'Níveis altos', 'Até o 30 tudo continua igual. Do 30 ao 60 os atributos sobem pela metade, e do 60 ao 100 quase não sobem: o que vem lá em cima são escolhas novas para o seu time.'],
  ],
  12: [
    ['liga', 'Partidas em melhor de 3', 'Na Liga e na Copa, cada partida agora tem até 3 lutas: vence quem ganhar 2. Todos voltam com a vida cheia a cada luta. Amistoso e Torre continuam com uma luta só.'],
    ['estrela', 'Intervalo de treinador', 'Entre uma luta e outra você vê o placar e pode mover a formação e trocar as posturas antes de voltar à arena. As recompensas (ouro, XP, baú) vêm no fim da partida.'],
  ],
  11: [
    ['estrela', 'Câmera de treinador', 'A luta começa com a câmera afastada, mostrando as duas formações inteiras. No primeiro embate ela aproxima e passa a seguir o centro da ação; o SUPREMO e o golpe final continuam em close.'],
  ],
  10: [
    ['estrela', 'Formação 3×3', 'No Elenco, o time agora fica numa grade de 3×3 casas: toque num mercenário e depois numa casa para mover (ou trocar de lugar). A luta começa com cada um na sua casa — quem está na frente segura o inimigo, quem atira fica atrás da própria linha de frente.'],
    ['expedicao', 'Posturas', 'Cada mercenário tem uma postura: Automática, Avançar (vai para cima), Segurar (espera o inimigo vir e protege os aliados) ou Flanquear (contorna pelas laterais até a retaguarda). A escolha muda o resultado: um trio corpo a corpo flanqueando vence uma muralha que parado não vence.'],
  ],
  8: [
    ['expedicao', 'Lutadores que pensam', 'Cada mercenário agora pontua o que fazer a cada instante, de acordo com a sua função: arqueiras e magos recuam atirando (até a parede — aí lutam), ninguém mais perde tempo batendo em esqueleto em vez de no Invocador, a Chuva de Flechas espera o alvo parar e a Clériga cura na hora certa. A tática escolhida na ficha continua mandando.'],
    ['pergaminho', 'Lutas antigas', 'As regras de combate mudaram de versão: o botão "Conferir" das lutas anteriores avisa que elas não podem mais ser reproduzidas. As novas, sim.'],
  ],
  7: [
    ['estatisticas', 'Recordes e melhores da temporada', 'Em Estatísticas: sequência de vitórias, Líder mais derrotado, tempo de jogo e os melhores da temporada (MVP, abates, KDA, dano e cura), com filtro por função e os heróis das guildas rivais para comparar.'],
    ['pergaminho', 'Registro de lutas', 'Cada luta fica registrada com a semente e os times. Nas Estatísticas, "Conferir" roda a luta de novo e confere se o resultado é idêntico.'],
  ],
  6: [
    ['coroa', 'Agora é Veldria: Guilds of the Five', 'O jogo ganhou nome novo. Seu save, seus mercenários e sua divisão continuam iguais.'],
    ['engrenagem', 'Exportar e importar save', 'Em Configurações: copie o código do save para guardar ou continuar em outro aparelho.'],
  ],
  2: [
    ['estrela', 'Personagens em 32×32', 'Todos redesenhados, com animações de respirar, andar, atacar, conjurar, levar dano e comemorar.'],
    ['pergaminho', 'Pergaminhos de habilidade', '25 habilidades extras (ativas e passivas). 1º espaço no nível 5, mais 1 por Ascensão.'],
    ['reliquia', 'Relíquias da guilda', '15 relíquias que valem para o time inteiro. De 3 a 5 espaços, conforme a divisão.'],
    ['pocaoV', 'Consumíveis', 'Poções, bomba, tônico de XP e mapa do tesouro. Compre no Boticário ou ache em baús.'],
    ['forja', 'Forja e Relógio', 'Aprimore equipamentos até +10 e aumente o limite offline até 16 h.'],
    ['expedicao', 'Expedições', 'Reservas exploram por 15 min a 8 h e voltam com ouro, XP, baús e Emblemas.'],
    ['emblema', 'Ascensão', 'Nos níveis 30 e 60: libera o nível máximo (60 e depois 100), +10% atributos. Custa ouro e Emblemas.'],
    ['liga', 'Divisões, Copa e Líderes', 'Bronze até Lenda. Os 4 primeiros jogam a Copa; a final é contra um Líder com mecânica própria.'],
    ['coroa', 'Campeões Lendários', '5 heróis únicos com habilidades exclusivas. Vencer a Copa pode trazer um para a guilda.'],
  ],
  3: [
    ['torre', 'Torre Infinita', 'Uma nova aba: andares sem fim, regras especiais por andar e Guardiões a cada 10 andares. Rende ouro, baús, Emblemas e um tributo diário.'],
    ['som', 'Sons e música', 'Golpes, magias, curas, moedas e fanfarras sintetizados na hora. Música chiptune opcional nas lutas.'],
    ['estrela', 'Câmera lenta', 'O golpe final de cada luta ganha zoom e câmera lenta.'],
    ['engrenagem', 'Vibração', 'Críticos, SUPREMO, quedas e vitórias vibram o celular (Android).'],
    ['estatisticas', 'Estatísticas', 'Recordes, melhores da temporada, totais da guilda, últimas lutas e histórico de temporadas.'],
  ],
  4: [
    ['estrela', 'Personagens 32×40 em 3 vistas', 'Corpos refeitos com joelhos, cotovelos, mãos e botas. Cada herói agora tem vista de lado, de frente e de costas: anda para cima, para baixo e para os lados, sempre virado para quem enfrenta.'],
    ['liga', 'Arena 50% mais larga', 'Campo de 384×216 com câmera cinematográfica que enquadra a ação, aproxima nos golpes pesados e foca o capitão no SUPREMO.'],
    ['torre', '5 cenários', 'Arena, Ruínas, Floresta, Vulcão e Torre, cada um com clima próprio (folhas, brasas, poeira).'],
    ['expedicao', 'Movimento tático', 'Lutadores cercam o alvo, assassinos flanqueiam, atiradores e magos recuam, curandeiras ficam atrás da linha de frente. Golpes fortes empurram.'],
    ['pergaminho', 'Habilidades mais vistosas', 'Cortes em meia-lua na direção do golpe, explosões, colunas de fogo, cristais de gelo, pilares de luz, raios, rastros de investida e marcações no chão antes dos ataques em área.'],
    ['coroa', 'SUPREMO com retrato', 'O capitão entra em cena com retrato, nome e habilidade antes do golpe.'],
    ['estrela', 'Heróis de frente na guilda', 'Guilda, Elenco, Mercado e fichas mostram os mercenários de frente.'],
  ],
  5: [
    ['expedicao', 'Acampamento', 'Nova construção: cada nível dá +1 vaga de expedição e +1 vaga no elenco (de 3 até 10 expedições, elenco de 8 até 15). O nível máximo sobe a cada divisão.'],
    ['expedicao', 'Vários heróis de uma vez', 'Escolha quantos heróis quiser (até as vagas livres) e mande todos para o mesmo destino. Quando dois ou mais voltam, use Coletar todas. A Masmorra aceita até 3 heróis ao mesmo tempo.'],
    ['engrenagem', 'Save na sua conta', 'Jogando dentro do Claude com a sua conta, o progresso também fica salvo nela e você continua de outro aparelho. Veja em Configurações onde o seu progresso está salvo.'],
  ],
};
const ROTULO_FASE = { 5: '4.1', 6: '5 · Veldria', 7: '6 · Recordes', 8: '7 · Cérebro', 10: '8 · Formação', 11: '9 · Câmera', 12: '10 · Melhor de 3', 13: '11 · Rumo ao 100', 14: '12 · Evoluções' };
function mostrarNovidades() {
  const fases = (STATE.novidades || []).slice().sort((a, b) => b - a);
  const bloco = (f) => `${fases.length > 1 ? `<span class="rot">Fase ${ROTULO_FASE[f] || f}</span>` : ''}<div class="lista novidades">${NOVIDADES[f].map(([ic, t, d]) => `<div class="card">${canvasIcone(ic, 28, ic === 'torre' ? { a: '#e9dfc9', b: '#a99bb8' } : null)}<div class="card-corpo"><b>${t}</b><small>${d}</small></div></div>`).join('')}</div>`;
  abrirModal(`<h2>Novidades${fases.length === 1 ? ` da Fase ${ROTULO_FASE[fases[0]] || fases[0]}` : ''}</h2>
    ${fases.map(bloco).join('')}
    <p class="dica">Seu progresso foi mantido. Você continua na Divisão ${divAtual().nome}.</p>
    <button class="btn primario enorme" data-act="fechar-novidades">Vamos lá</button>`, { dados: { novidades: true } });
}

/* ---- configurações e save ---- */
function abrirConfig() {
  const C = STATE.config, S = STATE.stats;
  abrirModal(`
    <h2>Configurações</h2>
    <div class="chips-grupo"><span class="rot">Velocidade padrão da luta</span>${[1, 2, 3].map((v) => `<button class="chip-btn ${C.vel === v ? 'on' : ''}" data-act="cfg" data-k="vel" data-v="${v}">${v}×</button>`).join('')}</div>
    <div class="chips-grupo"><span class="rot">Modo de luta</span>${[['auto', 'Auto'], ['manual', 'Manual']].map(([v, n]) => `<button class="chip-btn ${(C.auto ? 'auto' : 'manual') === v ? 'on' : ''}" data-act="cfg" data-k="auto" data-v="${v}">${n}</button>`).join('')}</div>
    <div class="chips-grupo"><span class="rot">Dificuldade</span>${Object.entries(DIFICULDADES).map(([k, d]) => `<button class="chip-btn ${C.dif === k ? 'on' : ''}" data-act="cfg" data-k="dif" data-v="${k}">${d.nome}</button>`).join('')}</div>
    <p class="dica">A dificuldade multiplica os atributos dos rivais: Fácil ×0,85 · Normal ×1 · Difícil ×1,2 · Pesadelo ×1,45 (com +50% de ouro).</p>
    <div class="chips-grupo"><span class="rot">Volume dos efeitos</span>${[[0, 'Mudo'], [0.35, 'Baixo'], [0.7, 'Médio'], [1, 'Alto']].map(([v, n]) => `<button class="chip-btn ${Math.abs((C.som ?? 0.7) - v) < 0.01 ? 'on' : ''}" data-act="cfg" data-k="som" data-v="${v}">${n}</button>`).join('')}</div>
    <div class="chips-grupo"><span class="rot">Música nas lutas</span>${[['sim', 'Ligada'], ['nao', 'Desligada']].map(([v, n]) => `<button class="chip-btn ${(C.musica ? 'sim' : 'nao') === v ? 'on' : ''}" data-act="cfg" data-k="musica" data-v="${v}">${n}</button>`).join('')}</div>
    <div class="chips-grupo"><span class="rot">Vibração</span>${[['sim', 'Ligada'], ['nao', 'Desligada']].map(([v, n]) => `<button class="chip-btn ${(C.vibrar !== false ? 'sim' : 'nao') === v ? 'on' : ''}" data-act="cfg" data-k="vibrar" data-v="${v}">${n}</button>`).join('')}</div>
    <div class="chips-grupo"><span class="rot">Câmera lenta no golpe final</span>${[['sim', 'Ligada'], ['nao', 'Desligada']].map(([v, n]) => `<button class="chip-btn ${(C.lenta !== false ? 'sim' : 'nao') === v ? 'on' : ''}" data-act="cfg" data-k="lenta" data-v="${v}">${n}</button>`).join('')}</div>
    <p class="dica">A vibração funciona em celulares Android; o iPhone não permite vibrar pelo navegador. O som começa depois do primeiro toque na tela.</p>
    <span class="rot">Progresso</span>
    <p class="dica" id="status-nuvem">${textoStatusNuvem()}</p>
    <div class="acoes"><button class="btn" data-act="exportar">Exportar save</button><button class="btn" data-act="importar">Importar save</button></div>
    <button class="btn" id="btn-nuvem" data-act="nuvem-salvar" ${Nuvem.estado === 'ativa' ? '' : 'hidden'}>Salvar na conta agora</button>
    <div class="derivados">
      <span>Lutas <b>${fmt(S.lutas)}</b></span><span>Vitórias <b>${fmt(S.vitorias)}</b></span>
      <span>Temporadas <b>${fmt(S.temporadas)}</b></span><span>Copas <b>${fmt(S.copas)}</b></span>
      <span>Promoções <b>${fmt(S.promocoes)}</b></span><span>Expedições <b>${fmt(S.expedicoes)}</b></span>
      <span>Lendários <b>${fmt(S.lendarios)}</b></span><span>Maior golpe <b>${fmt(S.maiorGolpe)}</b></span>
    </div>
    <button class="btn" data-act="estatisticas">${canvasIcone('estatisticas', 16)} Ver estatísticas completas</button>
    ${STATE.criador.liberado ? `<button class="btn criador-btn" data-act="criador">${canvasIcone('criador', 16)} Modo Criador</button>` : ''}
    <button class="btn perigo" data-act="reiniciar">Reiniciar jogo</button>
    <button class="versao" data-act="versao">Veldria: Guilds of the Five · v0.12.1 (EV1)</button>`, { dados: { config: true } });
}
function mostrarResumoOffline(r) {
  if (!r || r.minutos < 1) return;
  const prontas = expedicoesProntas().length;
  abrirModal(`<h2>Enquanto você esteve fora</h2>
    <p class="muted">Você ficou fora por ${fmtDuracao(r.minutos)}${r.minutos >= capOfflineMin() ? ` (limite de ${fmt1(capOfflineMin() / 60)} h)` : ''}.</p>
    <div class="lista">
      <div class="card">${canvasIcone('moeda', 32)}<div class="card-corpo"><b>+${fmt(r.ouro)} ouro no cofre</b><small>Bilheteria · ${fmt1(taxaBilheteria())} ouro/min${STATE.cofre >= capCofre() ? ' · cofre cheio' : ''}</small></div></div>
      <div class="card">${canvasIcone('campo', 32)}<div class="card-corpo"><b>+${fmt(r.xp)} XP para cada mercenário</b><small>Campo de Treino · ${fmt1(xpCampoMin())} XP/min${r.sabedoria ? ' · com Tônico de Sabedoria' : ''}</small></div></div>
      ${prontas ? `<div class="card">${canvasIcone('expedicao', 32)}<div class="card-corpo"><b>${prontas} ${prontas === 1 ? 'expedição voltou' : 'expedições voltaram'}</b><small>Colete as recompensas na Guilda.</small></div></div>` : ''}
    </div>
    ${r.subidas.length ? `<div class="subidas">${r.subidas.map((s) => `<div class="subida"><b>${esc(s.m.nome)}: nível ${s.de} → ${s.para}</b><small>${txtGanhos(s.ganhos)}</small></div>`).join('')}</div>` : ''}
    <button class="btn primario enorme" data-act="fechar-modal">Ótimo!</button>`);
}
function mostrarExpedicao(r) {
  const X = EXPEDICOES[r.tipo];
  UI.ultimoDrop = r.drop;
  abrirModal(`<h2>${canvasIcone('expedicao', 20)} ${esc(r.m.nome)} voltou ${X.da}</h2>
    <div class="mvp">${canvasLook(lookMeu(r.m), 54)}<div><b>${esc(r.m.nome)}</b><small>${CLASSES[r.m.classe].nome} · nv. ${r.m.nivel}</small></div></div>
    <div class="recompensas"><span>${canvasIcone('moeda', 18)} +${fmt(r.ouro)} ouro</span><span>+${fmt(r.xp)} XP</span>${r.emblemas ? `<span>${canvasIcone('emblema', 18)} +${r.emblemas}</span>` : ''}</div>
    ${r.sub ? `<div class="subida"><b><span class="tag ouro nivel-up">Nível!</span>${esc(r.m.nome)}: ${r.sub.de} → ${r.sub.para}</b><small>${txtGanhos(r.sub.ganhos)}</small></div>` : ''}
    ${r.drop ? blocoBau(r.mapa ? 'O mapa levou a um tesouro! Toque para abrir' : 'Achou um baú! Toque para abrir') : '<p class="dica centro">Desta vez, nenhum baú pelo caminho.</p>'}
    <button class="btn primario enorme" data-act="fechar-modal">Ótimo!</button>`);
}

// Várias expedições coletadas de uma vez: um resumo só, com os baús já abertos
function mostrarColetaTodas(rs) {
  const ouro = rs.reduce((a, r) => a + r.ouro, 0), emb = rs.reduce((a, r) => a + r.emblemas, 0), drops = rs.filter((r) => r.drop);
  abrirModal(`<h2>${canvasIcone('expedicao', 20)} ${rs.length} expedições voltaram</h2>
    <div class="recompensas"><span>${canvasIcone('moeda', 18)} +${fmt(ouro)} ouro</span>${emb ? `<span>${canvasIcone('emblema', 18)} +${emb}</span>` : ''}<span>${canvasIcone('bau', 18)} ${drops.length} ${drops.length === 1 ? 'baú' : 'baús'}</span></div>
    <div class="lista">${rs.map((r) => `<div class="card">${canvasLook(lookMeu(r.m), 32)}<div class="card-corpo"><b>${esc(r.m.nome)} · ${EXPEDICOES[r.tipo].nome}</b>
      <small>+${fmt(r.ouro)} ouro · +${fmt(r.xp)} XP${r.emblemas ? ` · +${r.emblemas} Emblema` : ''}</small>
      ${r.sub ? `<small class="ok">Nível ${r.sub.de} → ${r.sub.para}</small>` : ''}</div></div>`).join('')}</div>
    ${drops.length ? `<span class="rot">Baús abertos</span><div class="lista">${drops.map((r) => cardItem(r.drop) + (r.drop.vendido ? `<p class="dica">Inventário cheio: vendido por ${fmt(r.drop.vendido)} ouro.</p>` : '')).join('')}</div>` : ''}
    <button class="btn primario enorme" data-act="fechar-modal">Ótimo!</button>`);
}

