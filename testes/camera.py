"""E4 passo (d): câmera afastada mostrando as duas formações, que aproxima no primeiro embate.
Tela em pé (390×844; decisão do Kevin em 15/10/2026). Salva testes/e4-cam-pe-{formacao,embate}.png.
Uso: python3 testes/camera.py dist/index.html"""
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
ARQ = pathlib.Path(sys.argv[1]).resolve(); PASTA = pathlib.Path(__file__).resolve().parent
ok = 0; falhas = []
def checa(cond, msg):
    global ok
    if cond: ok += 1; print('  ok ', msg)
    else: falhas.append(msg); print('  ERRO', msg)
async def fechar_modais(pg):
    for _ in range(8):
        btn = await pg.query_selector('#tutorial:not([hidden]) button, #modais button')
        if not btn: break
        await btn.click(); await pg.wait_for_timeout(250)
async def rodar(p, nome, w, h):
    print(f'-- {nome} ({w}×{h})')
    b = await p.chromium.launch()
    ctx = await b.new_context(viewport={'width': w, 'height': h}, device_scale_factor=2, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    pg.on('console', lambda m: m.type == 'error' and erros.append(m.text))
    await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1200)
    if await pg.query_selector('[data-act="criar-guilda"]'):
        await pg.click('[data-act="criar-guilda"]'); await pg.wait_for_timeout(600)
    await fechar_modais(pg)
    await pg.evaluate("STATE.config.vel = 1; salvar()")
    await pg.click('[data-act="aba"][data-id="liga"]'); await pg.wait_for_timeout(300)
    await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(900)   # ainda na contagem 3-2-1
    cam0 = await pg.evaluate("({ modo: Arena.camModo, zoom: Arena.cam.zoom, total: zoomTotal(), vista: [VISTA.w, VISTA.h] })")
    await pg.screenshot(path=str(PASTA / f'e4-cam-{nome}-formacao.png'))
    checa(cam0['modo'] == 'formacao' and abs(cam0['zoom'] - cam0['total']) < 1e-6, f'começa afastada mostrando a arena inteira (zoom {cam0["zoom"]:.3f}, janela {cam0["vista"]})')
    vis = await pg.evaluate("""(() => { const j = Arena.janela; const vivos = Arena.b.units.filter((u) => u.vivo);
        return vivos.every((u) => u.x - 16 >= j.x && u.x + 16 <= j.x + VISTA.w / j.z && u.y - 52 >= j.y && u.y + 6 <= j.y + VISTA.h / j.z); })()""")
    checa(vis, 'os 6 lutadores (as duas formações) estão inteiros dentro da janela')
    # espera o primeiro embate (até 25 s de luta a 1×)
    t = 0
    while t < 25000:
        await pg.wait_for_timeout(250); t += 250
        if await pg.evaluate("Arena.camModo === 'embate' || (Luta && Luta.b && Luta.b.fim)"): break
    modo = await pg.evaluate("Arena.camModo")
    checa(modo == 'embate', f'câmera passou para o modo embate após {t/1000:.1f} s')
    await pg.wait_for_timeout(1500)   # a aproximação leva ~1,6 s
    cam1 = await pg.evaluate("({ zoom: Arena.cam.zoom, quentes: Arena.b.units.filter((u) => u.vivo && u.camQuente > 0).length, fim: !!Arena.b.fim })")
    await pg.screenshot(path=str(PASTA / f'e4-cam-{nome}-embate.png'))
    checa(cam1['zoom'] > cam0['zoom'] * 1.25, f'aproximou no embate (zoom {cam0["zoom"]:.2f} → {cam1["zoom"]:.2f}, {cam1["quentes"]} lutadores no embate)')
    dentro = await pg.evaluate("""(() => { const j = Arena.janela; const q = Arena.b.units.filter((u) => u.vivo && u.camQuente > 0);
        return q.every((u) => u.x >= j.x - 4 && u.x <= j.x + VISTA.w / j.z + 4); })()""")
    checa(dentro, 'quem está no embate aparece na janela')
    ov = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
    checa(ov <= 0, f'sem rolagem lateral (sobra {ov} px)')
    pequenos = await pg.evaluate("""[...document.querySelectorAll('#luta button')].filter((e) => !e.hidden && e.offsetParent && e.getBoundingClientRect().height < 44 && !e.classList.contains('btn-som')).length""")
    checa(pequenos == 0, f'botões da luta com pelo menos 44 px ({pequenos} abaixo)')
    alt = await pg.evaluate("[document.querySelector('#luta').scrollHeight, innerHeight]")
    print(f'  info altura da tela de luta {alt[0]} px numa janela de {alt[1]} px' + (' (cabe sem rolar)' if alt[0] <= alt[1] + 1 else ' (rola)'))
    # E4 (e): a partida é melhor de 3 — a 2ª rodada também tem de começar afastada
    await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(500)
    checa(await pg.is_visible('[data-act="proxima-rodada"]'), 'intervalo entre lutas')
    await pg.click('[data-act="proxima-rodada"]'); await pg.wait_for_timeout(900)
    cam2 = await pg.evaluate("({ modo: Arena.camModo, zoom: Arena.cam.zoom, total: zoomTotal() })")
    checa(cam2['modo'] == 'formacao' and abs(cam2['zoom'] - cam2['total']) < 1e-6, f'a luta 2 recomeça afastada (zoom {cam2["zoom"]:.3f})')
    for _ in range(3):
        await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(500)
        if await pg.query_selector('[data-act="resultado-ok"]'): break
        await pg.click('[data-act="proxima-rodada"]'); await pg.wait_for_timeout(500)
    await pg.click('[data-act="resultado-ok"]'); await pg.wait_for_timeout(300)
    res = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1')).partidas.map((p) => conferirPartida(p))")
    checa(len(res) >= 2 and all(r == 'igual' for r in res), f'as rodadas registradas reproduzem igual: {res}')
    checa(not erros, f'sem erros de console: {erros[:3]}')
    await b.close()
async def main():
    async with async_playwright() as p:
        await rodar(p, 'pe', 390, 844)
    print(f'\n{ok} verificações OK, {len(falhas)} falhas'); [print(' -', f) for f in falhas]
    sys.exit(1 if falhas else 0)
asyncio.run(main())
