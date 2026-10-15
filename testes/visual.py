"""EV (Visuais): aparência no save (v15), editor de aparência, arena na resolução da tela, animações e efeitos sem erro.
Salva testes/ev-*.png. Uso: python3 testes/visual.py dist/index.html"""
import asyncio, sys, pathlib, json
from playwright.async_api import async_playwright
ARQ = pathlib.Path(sys.argv[1]).resolve(); PASTA = pathlib.Path(__file__).resolve().parent
falhas = []
def checa(cond, msg):
    print(('OK   ' if cond else 'ERRO ') + ' ' + msg)
    if not cond: falhas.append(msg)
async def fechar_modais(pg):
    for _ in range(8):
        btn = await pg.query_selector('#tutorial:not([hidden]) button, #modais button')
        if not btn: break
        await btn.click(); await pg.wait_for_timeout(200)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=3, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e))); pg.on('console', lambda m: m.type == 'error' and erros.append(m.text))
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1000)
        await pg.click('[data-act="criar-guilda"]'); await pg.wait_for_timeout(500); await fechar_modais(pg)
        # 1) todo mercenário tem aparência válida; looks diferentes entre si
        d = await pg.evaluate("""() => ({ ok: STATE.mercs.every((m) => m.ap && RACAS[m.ap.raca] && PENTEADOS[m.ap.penteado]), looks: new Set(STATE.mercs.map(lookMeu)).size, n: STATE.mercs.length })""")
        checa(d['ok'], 'todo mercenário tem aparência válida (raça, penteado)')
        checa(d['looks'] == d['n'], f'cada mercenário tem um visual próprio ({d["looks"]} looks para {d["n"]})')
        # 2) save v14 (sem aparência) abre em v15: ganha aparência estável, mantém a cor do cabelo e o resto
        st = await pg.evaluate("""() => { const s = JSON.parse(JSON.stringify(STATE)); s.versao = 14; s.mercs.forEach((m) => { delete m.ap; m.cabelo = 4; }); return s; }""")
        await pg.evaluate("(s) => { salvar = () => {}; localStorage.setItem('ligaDasLaminas.save.v1', JSON.stringify(s)); }", st)   # o jogo salva ao sair: desliga para não sobrescrever o save antigo
        await pg.reload(); await pg.wait_for_timeout(900); await fechar_modais(pg)
        st2 = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))")
        checa(st2['versao'] == 15, f'save v14 abre como v15 ({st2["versao"]})')
        checa(all(m.get('ap') and m['ap']['cabelo'] == 4 for m in st2['mercs']), 'quem não tinha aparência ganhou uma e manteve a cor do cabelo')
        checa([m['nivel'] for m in st2['mercs']] == [m['nivel'] for m in st['mercs']] and st2['ouro'] == st['ouro'], 'níveis e ouro preservados')
        mesma = await pg.evaluate("() => { const m = STATE.mercs[0]; const a = JSON.stringify(m.ap); delete m.ap; garantirAparencia(m); return a === JSON.stringify(m.ap); }")
        checa(mesma, 'a aparência gerada pelo id é estável (a mesma sempre)')
        # 3) editor de aparência
        mid = await pg.evaluate("STATE.mercs[0].id")
        await pg.click('[data-act="aba"][data-id="elenco"]'); await pg.wait_for_timeout(300)
        await pg.evaluate(f"abrirFicha(mercPorId({mid}))"); await pg.wait_for_timeout(300)
        checa(await pg.is_visible('[data-act="aparencia"]'), 'ficha tem o botão Aparência')
        await pg.click('[data-act="aparencia"]')
        await pg.wait_for_timeout(300)
        antes = await pg.evaluate(f"lookMeu(mercPorId({mid}))")
        await pg.click('[data-act="ap-set"][data-k="raca"][data-v="orc"]'); await pg.wait_for_timeout(200)
        await pg.click('[data-act="ap-set"][data-k="penteado"][data-v="moicano"]'); await pg.wait_for_timeout(200)
        depois = await pg.evaluate(f"lookMeu(mercPorId({mid}))")
        checa(antes != depois and '|orc|moicano|' in depois, f'editor muda raça e cabelo ({depois.split("|")[5:7]})')
        pequenos = await pg.evaluate("""[...document.querySelectorAll('[data-act="ap-set"], [data-act="ap-sortear"]')].filter((e) => e.getBoundingClientRect().height < 44).length""")
        checa(pequenos == 0, f'botões do editor com pelo menos 44 px ({pequenos} abaixo)')
        await pg.screenshot(path=str(PASTA / 'ev-aparencia.png'))
        salvo = await pg.evaluate(f"JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1')).mercs.find((m) => m.id === {mid}).ap")
        checa(salvo['raca'] == 'orc', 'aparência salva no save')
        await pg.click('#modais .modal-fundo:last-child .confirmar [data-act="fechar-modal"]'); await pg.wait_for_timeout(200); await fechar_modais(pg)
        # 4) luta: canvas na resolução da tela, sem erros, efeitos e animações aparecem
        await pg.evaluate("STATE.config.vel = 2; salvar()")
        await pg.click('[data-act="aba"][data-id="liga"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(1200)
        res = await pg.evaluate("({ w: Arena.cv.width, css: Arena.cv.clientWidth, dpr: Arena.dpr })")
        checa(abs(res['w'] - res['css'] * res['dpr']) <= 1, f'arena na resolução real ({res["w"]} px = {res["css"]} CSS × {res["dpr"]})')
        await pg.screenshot(path=str(PASTA / 'ev-luta-formacao.png'))
        vistos = set(); fx = 0
        for i in range(60):
            await pg.wait_for_timeout(200)
            r = await pg.evaluate("""() => ({ a: Arena.b.units.filter((u) => u.vivo || u.anim.morteT < 1.3).map((u) => quadroDe(u)[0]), fx: (Arena.vx || []).length, fim: !!Arena.b.fim })""")
            vistos.update(r['a']); fx = max(fx, r['fx'])
            if i == 18: await pg.screenshot(path=str(PASTA / 'ev-luta-embate.png'))
            if r['fim']: break
        checa(fx > 0, f'efeitos vetoriais na tela (pico de {fx})')
        checa({'atk', 'idle'} <= vistos or {'atk', 'walk'} <= vistos, f'animações vistas: {sorted(vistos)}')
        checa(not erros, f'sem erros no console {erros[:3]}')
        await b.close()
    print('\nTUDO OK' if not falhas else f'\n{len(falhas)} FALHA(S)')
    sys.exit(1 if falhas else 0)
asyncio.run(main())
