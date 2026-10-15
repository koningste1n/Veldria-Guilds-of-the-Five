"""E5a (bloco 2): evoluções A/B no nível 15 — ficha mostra os dois caminhos, a escolha pede confirmação, é irreversível,
sobrevive ao recarregar, entra no registro da luta, e um save v13 abre com `evolucao: null`. Tela de 390 px, botões >= 44 px.
Uso: python3 testes/evolucoes.py dist/index.html"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
ARQ = pathlib.Path(sys.argv[1]).resolve()
PASTA = ARQ.parent.parent / 'testes'
SAVE = "JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))"
falhas = []
def checa(cond, msg):
    print(('OK   ' if cond else 'FALHA') + ' ' + msg)
    if not cond: falhas.append(msg)

async def fechar_modais(pg):
    for _ in range(8):
        btn = await pg.query_selector('#tutorial:not([hidden]) button, #modais [data-act="fechar-novidades"], #modais [data-act="fechar"], #modais .btn.primario')
        if not btn: break
        await btn.click(); await pg.wait_for_timeout(250)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and erros.append(m.text))
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1200)
        if await pg.query_selector('[data-act="criar-guilda"]'):
            await pg.click('[data-act="criar-guilda"]'); await pg.wait_for_timeout(600)
        await fechar_modais(pg)

        # 0) dados: todas as 10 classes têm A e B com nome e texto; mercenários nascem sem evolução
        d = await pg.evaluate("""() => ({ n: Object.keys(EVOLUCOES).length, ok: Object.values(EVOLUCOES).every((E) => E.a && E.b && E.a.nome && E.b.nome && E.a.desc && E.b.desc),
            nulos: STATE.mercs.every((m) => m.evolucao === null), nivel: NIVEL_EVOLUCAO, regras: REGRAS_COMBATE })""")
        checa(d['n'] == 10 and d['ok'], f'10 classes com caminhos A e B ({d["n"]})')
        checa(d['nulos'] and d['nivel'] == 15 and d['regras'] == 4, f'mercenários novos sem evolução; evolução no nível {d["nivel"]}; regras de combate v{d["regras"]}')

        # 1) abaixo do 15: ficha só avisa
        mid = await pg.evaluate("() => { const m = STATE.mercs[0]; m.nivel = 14; salvar(); render(); return m.id; }")
        await pg.click('[data-act="aba"][data-id="elenco"]'); await pg.wait_for_timeout(300)
        await pg.evaluate(f"document.querySelector('[data-act=\"abrir-merc\"][data-id=\"{mid}\"]').click()"); await pg.wait_for_timeout(400)
        checa(await pg.is_visible('#modais .evo') and not await pg.query_selector('#modais .evo-card'), 'nível 14: a ficha avisa da evolução no 15, sem botões')
        await pg.click('#modais [data-act="fechar-modal"]'); await pg.wait_for_timeout(300)

        # 2) no 15: dois cartões, com 44 px ou mais; toque abre a confirmação; "Pensar mais" não muda nada
        await pg.evaluate(f"() => {{ const m = mercPorId({mid}); m.nivel = 15; salvar(); render(); }}")
        await pg.evaluate(f"document.querySelector('[data-act=\"abrir-merc\"][data-id=\"{mid}\"]').click()"); await pg.wait_for_timeout(400)
        cards = await pg.query_selector_all('#modais .evo-card')
        alturas = [(await c.bounding_box())['height'] for c in cards]
        checa(len(cards) == 2 and all(h >= 44 for h in alturas), f'nível 15: 2 cartões de evolução com {[round(h) for h in alturas]} px')
        await pg.evaluate("document.querySelector('#modais .evo').scrollIntoView({ block: 'center' })"); await pg.wait_for_timeout(200)
        await pg.screenshot(path=str(PASTA / 'e5a-evolucao.png'))
        await cards[1].click(); await pg.wait_for_timeout(350)
        checa(await pg.is_visible('#modais [data-act="evoluir-sim"]'), 'toque no cartão abre a confirmação')
        await pg.click('#modais [data-act="fechar-modal"]:not(.modal-x)'); await pg.wait_for_timeout(300)
        checa(await pg.evaluate(f"mercPorId({mid}).evolucao") is None, '"Pensar mais" não evolui')
        # confirma o caminho B
        await pg.click('#modais .evo-card[data-v="b"]'); await pg.wait_for_timeout(350)
        await pg.click('#modais [data-act="evoluir-sim"]'); await pg.wait_for_timeout(500)
        evo = await pg.evaluate(f"mercPorId({mid}).evolucao")
        nome = await pg.evaluate(f"nomeEvo(mercPorId({mid}))")
        checa(evo == 'b' and nome, f'evoluiu pelo caminho B: {nome}')
        checa(await pg.is_visible('#modais .evo.feita') and not await pg.query_selector('#modais .evo-card'), 'ficha mostra a evolução feita, sem botões (irreversível)')
        checa(await pg.evaluate(f"evoluir(mercPorId({mid}), 'a')") is False, 'evoluir de novo é recusado')
        await pg.screenshot(path=str(PASTA / 'e5a-evolucao-feita.png'))
        await pg.click('#modais [data-act="fechar-modal"]'); await pg.wait_for_timeout(300)
        checa(await pg.is_visible(f'.card.merc[data-id="{mid}"] .chip.evo'), 'card do Elenco mostra o chip da evolução')

        # 3) sobrevive ao recarregar
        await pg.reload(); await pg.wait_for_timeout(1200); await fechar_modais(pg)
        checa(await pg.evaluate(f"mercPorId({mid}).evolucao") == 'b', 'evolução sobrevive ao recarregar')

        # 4) luta completa com a evolução e rivais evoluídos; registro guarda a evolução
        await pg.evaluate("() => { STATE.liga.nivelBase = 16; for (const g of STATE.liga.guildas.slice(1)) { for (const m of g.mercs) m.evolucao = null; ajustarRival(g, 0); } salvar(); }")
        riv = await pg.evaluate("STATE.liga.guildas[1].mercs.map((m) => m.evolucao)")
        checa(all(e in ('a', 'b') for e in riv), f'rivais da Liga no nível 16 ganham um caminho sorteado: {riv}')
        await pg.click('[data-act="aba"][data-id="liga"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(700)
        for _ in range(4):
            await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(500)
            if await pg.query_selector('[data-act="resultado-ok"]'): break
            if await pg.query_selector('[data-act="proxima-rodada"]'): await pg.click('[data-act="proxima-rodada"]'); await pg.wait_for_timeout(500)
        checa(await pg.query_selector('[data-act="resultado-ok"]') is not None, 'partida com evoluções chega ao fim')
        await pg.click('[data-act="resultado-ok"]'); await pg.wait_for_timeout(400)
        reg = await pg.evaluate(SAVE + ".partidas[0].replay.A.mercs.map((m) => m.evolucao)")
        regB = await pg.evaluate(SAVE + ".partidas[0].replay.B.mercs.map((m) => m.evolucao)")
        checa('b' in reg and all(e in ('a', 'b') for e in regB), f'registro guarda a evolução dos dois lados: {reg} × {regB}')
        res = await pg.evaluate(SAVE + ".partidas.map((p) => conferirPartida(p))")
        checa(all(r == 'igual' for r in res), f'a partida reproduz igual: {res}')

        # 5) cada uma das 20 evoluções roda numa luta sem erro (Node já mede o balanço; aqui é a tela)
        err = await pg.evaluate("""() => { let n = 0; for (const cls of Object.keys(EVOLUCOES)) for (const e of ['a', 'b']) {
            const mk = (c, ev) => { const m = gerarMerc(c, 15, 'B'); m.evolucao = ev; return m; };
            const A = { nome: 'A', cor1: 0, cor2: 0, simbolo: 0, mercs: [mk(cls, e), mk('guardiao', null), mk('clerica', null)], mult: 1, ia: 'v2' }; A.capitaoId = A.mercs[0].id;
            const B = { nome: 'B', cor1: 1, cor2: 1, simbolo: 0, mercs: [mk(cls, null), mk('arqueira', e), mk('bardo', e)], mult: 1, ia: 'v2' }; B.capitaoId = B.mercs[0].id;
            try { const bt = criarBatalha(A, B, { silencioso: true, seed: 3 }); simularAteFim(bt); if (!bt.fim) n++; } catch (x) { n++; console.error(cls, e, String(x)); } } return n; }""")
        checa(err == 0, f'as 20 evoluções lutam até o fim sem erro ({err} problemas)')

        # 6) save v13 (sem o campo) abre em v14 com evolucao null e mostra a novidade
        v13 = await pg.evaluate(SAVE); v13['versao'] = 13; v13['novidades'] = []
        for m in v13['mercs']: m.pop('evolucao', None)
        await pg.close(); pg = await ctx.new_page(); pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script("if (!sessionStorage.getItem('v13')) { sessionStorage.setItem('v13', '1'); localStorage.setItem('ligaDasLaminas.save.v1', " + json.dumps(json.dumps(v13)) + "); }")
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1500)
        st = await pg.evaluate(SAVE)
        checa(st['versao'] == 15 and all(m['evolucao'] is None for m in st['mercs']), 'save v13 abre como v15 com evolucao = null em todos')
        checa(14 in st['novidades'] or await pg.is_visible('[data-act="fechar-novidades"]'), 'mostra a novidade das evoluções')

        ov = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        checa(ov == 0, f'sem rolagem lateral ({ov})')
        checa(not erros, f'sem erros no console {erros[:3]}')
        await b.close()
    print('\nTUDO OK' if not falhas else f'\n{len(falhas)} FALHA(S)')
    sys.exit(1 if falhas else 0)

asyncio.run(main())
