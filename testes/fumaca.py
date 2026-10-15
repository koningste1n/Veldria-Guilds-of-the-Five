import asyncio, sys, pathlib
from playwright.async_api import async_playwright
ARQ = pathlib.Path(sys.argv[1]).resolve()
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width':390,'height':844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); erros=[]
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.on('console', lambda m: m.type=='error' and erros.append(m.text))
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1500)
        await pg.screenshot(path=str(ARQ.parent.parent/"testes"/'s1.png'))
        await pg.click('[data-act="criar-guilda"]'); await pg.wait_for_timeout(1000)
        for _ in range(8):
            btn = await pg.query_selector('#tutorial:not([hidden]) button, #modais button')
            if not btn: break
            await btn.click(); await pg.wait_for_timeout(300)
        await pg.screenshot(path=str(ARQ.parent.parent/"testes"/'s2.png'))
        keys = await pg.evaluate('Object.keys(localStorage)')
        ov = await pg.evaluate('document.documentElement.scrollWidth-innerWidth')
        await pg.reload(); await pg.wait_for_timeout(1500)
        voltou = await pg.evaluate("document.querySelector('#app') && !document.querySelector('#app').hidden")
        print('erros', erros[:5]); print('localStorage', keys, 'overflow', ov, 'save_sobrevive_reload', voltou)
        await b.close()
asyncio.run(main())
