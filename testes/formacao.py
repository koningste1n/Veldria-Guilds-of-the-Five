"""E4 (c/d): grade de formação 3×3 e posturas na tela do Elenco.
Mover um mercenário para uma casa livre, trocar dois de lugar, mudar a postura, lutar e conferir que o registro
da luta guarda a casa e a postura escolhidas. Tela de 390 px, botões >= 44 px, sem rolagem lateral.
Uso: python3 testes/formacao.py dist/index.html"""
import asyncio, sys, pathlib
from playwright.async_api import async_playwright
ARQ = pathlib.Path(sys.argv[1]).resolve()
PASTA = ARQ.parent.parent / 'testes'
falhas = []
def checa(cond, msg):
    print(('OK   ' if cond else 'FALHA') + ' ' + msg)
    if not cond: falhas.append(msg)

async def fechar_modais(pg):
    for _ in range(8):
        btn = await pg.query_selector('#tutorial:not([hidden]) button, #modais [data-act="fechar-novidades"], #modais [data-act="fechar"], #modais .btn.primario')
        if not btn: break
        await btn.click(); await pg.wait_for_timeout(250)

SAVE = "JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))"
async def time(pg):
    return await pg.evaluate(SAVE + ".time.map((id) => { const m = JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1')).mercs.find((x) => x.id === id); return { id: m.id, pos: m.pos, postura: m.postura, linha: m.linha }; })")

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
        await pg.click('[data-act="aba"][data-id="elenco"]'); await pg.wait_for_timeout(400)

        # 1) grade com 9 casas, titulares em casas únicas
        casas = await pg.eval_on_selector_all('.casa', 'els => els.map(e => +e.dataset.pos)')
        checa(sorted(casas) == list(range(9)), f'grade com 9 casas (0–8): {sorted(casas)}')
        t0 = await time(pg)
        checa(len(set(m['pos'] for m in t0)) == len(t0) and len(t0) >= 3, f'{len(t0)} titulares em casas únicas: {[m["pos"] for m in t0]}')
        checa(all(m['linha'] == ('frente' if m['pos'] // 3 == 0 else 'tras') for m in t0), 'linha derivada da coluna')
        await pg.screenshot(path=str(PASTA / 'e4-formacao.png'))

        # 2) selecionar e mover para uma casa livre
        ocupadas = {m['pos'] for m in t0}
        livre = next(p for p in range(9) if p not in ocupadas)
        alvo = t0[0]
        await pg.click(f'.casa[data-pos="{alvo["pos"]}"]'); await pg.wait_for_timeout(250)
        checa(await pg.is_visible('.casa.sel') and await pg.is_visible('[data-act="postura"]'), 'toque seleciona e mostra as posturas')
        await pg.click(f'.casa[data-pos="{livre}"]'); await pg.wait_for_timeout(300)
        t1 = await time(pg)
        checa(next(m for m in t1 if m['id'] == alvo['id'])['pos'] == livre, f'mover para casa livre: {alvo["pos"]} → {livre}')
        checa(await pg.eval_on_selector('.casa.sel', 'e => +e.dataset.pos') == livre, 'seleção acompanha o mercenário movido')

        # 3) trocar de lugar com outro
        outro = t1[1]
        await pg.click(f'.casa[data-pos="{outro["pos"]}"]'); await pg.wait_for_timeout(300)
        t2 = await time(pg)
        a = next(m for m in t2 if m['id'] == alvo['id']); o = next(m for m in t2 if m['id'] == outro['id'])
        checa(a['pos'] == outro['pos'] and o['pos'] == livre, f'trocar de lugar: {alvo["id"]}↔{outro["id"]}')
        checa(a['linha'] == ('frente' if a['pos'] // 3 == 0 else 'tras'), 'linha atualizada ao mover')

        # 4) postura
        await pg.click('[data-act="postura"][data-v="segurar"]'); await pg.wait_for_timeout(300)
        t3 = await time(pg)
        checa(next(m for m in t3 if m['id'] == alvo['id'])['postura'] == 'segurar', 'postura Segurar gravada')
        checa(await pg.is_visible('.casa.sel .postura-tag'), 'casa mostra a postura escolhida')
        pequenos = await pg.evaluate("""[...document.querySelectorAll('.casa, [data-act="postura"], .form-acoes .btn')].filter((e) => e.getBoundingClientRect().height < 44).length""")
        checa(pequenos == 0, f'botões da grade com 44 px ou mais ({pequenos} menores)')
        ov = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        checa(ov == 0, f'sem rolagem lateral ({ov})')
        await pg.screenshot(path=str(PASTA / 'e4-formacao-sel.png'))
        # desselecionar tocando de novo
        await pg.click('.casa.sel'); await pg.wait_for_timeout(250)
        checa(not await pg.query_selector('.casa.sel'), 'segundo toque na mesma casa desseleciona')

        # 5) ficha mostra postura e casa
        await pg.click(f'.casa[data-pos="{a["pos"]}"]'); await pg.wait_for_timeout(250)
        await pg.click('.form-acoes [data-act="abrir-merc"]'); await pg.wait_for_timeout(400)
        on = await pg.eval_on_selector('#modais .chip-btn.on[data-act="postura"]', 'e => e.dataset.v')
        checa(on == 'segurar', f'ficha mostra a postura ({on})')
        await pg.click('#modais [data-act="fechar-modal"]'); await pg.wait_for_timeout(300)

        # 5b) botão Confirmar formação (pedido do Kevin, 15/10): tira a seleção, salva e leva à Liga
        await pg.click(f'.casa[data-pos="{a["pos"]}"]'); await pg.wait_for_timeout(250)
        bt = await pg.query_selector('[data-act="confirmar-formacao"]')
        checa(bt is not None and (await bt.bounding_box())['height'] >= 44, 'Elenco tem o botão Confirmar formação (≥ 44 px)')
        await bt.click(); await pg.wait_for_timeout(400)
        aba = await pg.eval_on_selector('.aba.ativa', 'e => e.dataset.id')
        checa(aba == 'liga' and await pg.is_visible('[data-act="lutar-liga"]'), f'confirmar leva à Liga, com o LUTAR à vista ({aba})')
        checa(await pg.evaluate('UI.casaSel') is None, 'confirmar tira a seleção da grade')
        t4 = await time(pg)
        checa({m['id']: (m['pos'], m['postura']) for m in t4} == {m['id']: (m['pos'], m['postura']) for m in t3}, 'confirmar não muda casas nem posturas')

        # 6) luta: o registro guarda casa e postura
        await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(700)
        await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(500)   # E4 (e): melhor de 3 — pula a 1ª rodada e para no intervalo
        checa(await pg.is_visible('[data-act="proxima-rodada"]'), 'intervalo entre lutas com a grade de formação')
        await pg.screenshot(path=str(PASTA / 'e4-intervalo.png'))
        # no intervalo, com alguém selecionado, Confirmar formação só tira a seleção (a luta não começa)
        await pg.click('#modais .casa:not(.vazia)'); await pg.wait_for_timeout(250)
        await pg.click('#modais [data-act="confirmar-formacao"]'); await pg.wait_for_timeout(300)
        checa(not await pg.query_selector('#modais .casa.sel') and await pg.is_visible('[data-act="proxima-rodada"]'), 'no intervalo, Confirmar tira a seleção e o intervalo continua aberto')
        for _ in range(3):
            await pg.click('[data-act="proxima-rodada"]'); await pg.wait_for_timeout(500)
            await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(500)
            if await pg.query_selector('[data-act="resultado-ok"]'): break
        await pg.click('[data-act="resultado-ok"]'); await pg.wait_for_timeout(400)
        reg = await pg.evaluate(SAVE + ".partidas[0].replay.A.mercs.map((m) => [m.id, m.pos, m.postura])")
        esperado = {m['id']: (m['pos'], m['postura']) for m in t3}
        checa(all(esperado.get(i) == (pos, post) for i, pos, post in reg), f'registro da luta com as casas e posturas escolhidas: {reg}')
        res = await pg.evaluate(SAVE + ".partidas.map((p) => conferirPartida(p))")
        checa(len(res) >= 2 and all(r == 'igual' for r in res), f'reproduzir as rodadas dá o mesmo resultado: {res}')

        checa(not erros, f'sem erros no console {erros[:3]}')
        await b.close()
    print('\nTUDO OK' if not falhas else f'\n{len(falhas)} FALHA(S)')
    sys.exit(1 if falhas else 0)

asyncio.run(main())
