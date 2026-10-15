"""E2: tutorial progressivo (5 primeiras lutas) e migração de save v5 -> v6.
Uso: python3 testes/tutorial.py dist/index.html"""
import asyncio, sys, pathlib, json, time
from playwright.async_api import async_playwright
ARQ = pathlib.Path(sys.argv[1]).resolve()
ESPERADO = [['liga'], ['liga','elenco'], ['liga','elenco','inventario'], ['liga','elenco','mercado','inventario'],
            ['guilda','elenco','mercado','liga','inventario'], ['guilda','elenco','mercado','liga','torre','inventario']]
falhas = []
def checa(cond, msg):
    print(('OK   ' if cond else 'FALHA') + ' ' + msg)
    if not cond: falhas.append(msg)

async def abas(pg): return await pg.eval_on_selector_all('#abas .aba', 'els => els.map(e => e.dataset.id)')
async def engrenagem(pg): return await pg.query_selector('#topo [data-act="config"]') is not None

async def novo_jogador(b):
    ctx = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    t0 = time.time()
    await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(800)
    await pg.click('[data-act="criar-guilda"]'); await pg.wait_for_timeout(600)
    a = await abas(pg)
    checa(sorted(a) == sorted(ESPERADO[0]), f'início: só Liga visível ({a})')
    checa(not await engrenagem(pg), 'início: engrenagem escondida')
    checa(await pg.is_visible('#tutorial .tut-balao'), 'início: balão de boas-vindas aparece')
    await pg.click('#tutorial [data-act="tutorial-prox"]'); await pg.wait_for_timeout(300)
    for n in range(1, 6):
        await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(600)
        if n == 1: checa(time.time() - t0 < 60, f'1ª luta em {time.time()-t0:.1f} s (< 60 s)')
        await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(600)
        await pg.click('[data-act="resultado-ok"]'); await pg.wait_for_timeout(600)
        a = await abas(pg)
        checa(sorted(a) == sorted(ESPERADO[n]), f'após luta {n}: abas {a}')
        ativa = await pg.eval_on_selector('#abas .aba.ativa', 'e => e.dataset.id')
        checa(await pg.is_visible('#tutorial .tut-balao'), f'após luta {n}: balão do menu novo')
        await pg.click('#tutorial [data-act="tutorial-prox"]'); await pg.wait_for_timeout(300)
        await pg.click('[data-act="aba"][data-id="liga"]'); await pg.wait_for_timeout(300)
    checa(await engrenagem(pg), 'fim: engrenagem visível')
    st = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))")
    checa(st['tutorial'] == 99 and st['versao'] == 6, f"fim: tutorial={st['tutorial']} versao={st['versao']}")
    await pg.reload(); await pg.wait_for_timeout(1000)
    checa(len(await abas(pg)) == 6 and not await pg.is_visible('#tutorial .tut-balao'), 'recarregar: tudo liberado, sem balão')
    checa(not erros, f'sem erros de página {erros}')
    await ctx.close()
    return st

async def save_antigo(b, base):
    # simula um save v5 de quem já jogava: tutorial antigo concluído, lutas > 0
    v5 = dict(base); v5['versao'] = 5; v5['tutorial'] = 6; v5.pop('tutorialVisto', None); v5['novidades'] = []
    v5['stats'] = dict(base['stats'], lutas=42)
    ctx = await b.new_context(viewport={'width':390,'height':844}, is_mobile=True, has_touch=True)
    await ctx.add_init_script(f"localStorage.setItem('ligaDasLaminas.save.v1', {json.dumps(json.dumps(v5))})")
    pg = await ctx.new_page(); erros = []
    pg.on('pageerror', lambda e: erros.append(str(e)))
    await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1200)
    checa(len(await abas(pg)) == 6 and await engrenagem(pg), 'save v5: todas as abas e engrenagem')
    checa(not await pg.is_visible('#tutorial .tut-balao'), 'save v5: sem tutorial')
    txt = await pg.inner_text('#modais')
    checa('Veldria' in txt, 'save v5: novidades da v0.5 aparecem')
    st = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))")
    checa(st['versao'] == 6 and st['tutorial'] == 99 and st['stats']['lutas'] == 42 and len(st['mercs']) == len(v5['mercs']) and st['ouro'] == v5['ouro'],
          'save v5: migrado para v6 sem perda (lutas, mercs, ouro)')
    checa(not erros, f'save v5: sem erros {erros}')
    await ctx.close()

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        st = await novo_jogador(b)
        await save_antigo(b, st)
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)
asyncio.run(main())
