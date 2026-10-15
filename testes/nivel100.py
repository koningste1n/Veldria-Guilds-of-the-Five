"""E5a (bloco 1): curva até o nível 100, Ascensões como portão (30 → 60 → 100) e migração v12 → v13.
Uso: python3 testes/nivel100.py dist/index.html"""
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

        # 1) curva: 1–29 idêntica à de antes; tetos 30 / 60 / 100 pelas Ascensões
        r = await pg.evaluate("""() => ({
            curva: [1, 10, 29, 30, 60, 99].map((n) => xpProx(n)),
            tetos: [0, 1, 2].map((a) => nivelMax({ ascensoes: a })),
            asc: ASCENSOES.map((A) => A.nivel),
            ef: [1, 10, 30, 31, 60, 61, 100].map(nivelEf),
            porNivel: [10, 30, 31, 60, 61, 100].map(ascPorNivel) })""")
        checa(r['curva'] == [round(50 * n ** 1.5) for n in [1, 10, 29, 30, 60, 99]], f'xpProx = 50·n^1,5 em toda a curva: {r["curva"]}')
        checa(r['tetos'] == [30, 60, 100] and r['asc'] == [30, 60], f'tetos {r["tetos"]}, Ascensões nos níveis {r["asc"]}')
        checa(r['ef'] == [1, 10, 30, 30.5, 45, 45, 45], f'nível efetivo dos atributos (igual até 30, metade até 60, parado depois): {r["ef"]}')
        checa(r['porNivel'] == [0, 0, 1, 1, 2, 2], f'Ascensões exigidas por nível (rivais e Mercado): {r["porNivel"]}')

        # 2) atributos até o 30 não mudam (fórmula antiga, calculada aqui à mão)
        dif = await pg.evaluate("""() => { let n = 0; for (const m of STATE.mercs) for (let L = 1; L <= 30; L++) {
            const c = CLASSES[m.classe], k = multExtra(m), v = c.base.map((b, i) => (b + m.cresc[i] * (L - 1)) * k); v[0] *= 1 + ACEL_VIDA * (L - 1);
            const a = atributosBase(m, L);
            if (a.atq !== Math.round(v[1] * multTraco(m, 'atq')) || a.vida !== Math.round(v[0] * multTraco(m, 'vida')) + ((m.bonusCriador || {}).vida || 0)) n++; } return n; }""")
        checa(dif == 0, f'atributos do nível 1 ao 30 idênticos aos de antes ({dif} diferenças)')

        # 3) subir de nível: sem Ascensão para no 30; com Ascensão II vai até 100 e não passa
        sub = await pg.evaluate("""() => { const m = STATE.mercs[0]; const a0 = m.ascensoes;
            m.nivel = 1; m.xp = 0; m.ascensoes = 0; darXp(m, 1e9, 1); const sem = m.nivel;
            m.ascensoes = 1; darXp(m, 1e9, 1); const um = m.nivel;
            m.ascensoes = 2; darXp(m, 1e9, 1); const dois = m.nivel;
            const s60 = atributosBase(m, 60), s100 = atributosBase(m, 100), s30 = atributosBase(m, 30);
            m.nivel = 1; m.xp = 0; m.ascensoes = a0;
            return { sem, um, dois, atq30: s30.atq, atq60: s60.atq, atq100: s100.atq }; }""")
        checa((sub['sem'], sub['um'], sub['dois']) == (30, 60, 100), f'darXp para em 30 / 60 / 100 conforme as Ascensões: {sub}')
        checa(sub['atq30'] < sub['atq60'] and sub['atq100'] == sub['atq60'], 'atributos sobem até o 60 e param do 60 ao 100 (opção A)')

        # 4) ficha: a Ascensão aparece no nível 30 e fala do teto 60
        await pg.evaluate("() => { const m = STATE.mercs[0]; m.nivel = 30; m.ascensoes = 0; m.xp = 0; salvar(); render(); }")
        await pg.click('[data-act="aba"][data-id="elenco"]'); await pg.wait_for_timeout(300)
        mid = await pg.evaluate('STATE.mercs[0].id')
        await pg.evaluate(f"document.querySelector('[data-act=\"abrir-merc\"][data-id=\"{mid}\"]').click()"); await pg.wait_for_timeout(400)
        txt = await pg.text_content('#modais .asc')
        checa('no nível 30' in txt and '30 → 60' in txt, f'ficha: 1ª Ascensão no nível 30, teto 30 → 60 ({txt.strip()[:90]}…)')
        await pg.screenshot(path=str(PASTA / 'e5a-ascensao.png'))

        # 5) migração v12 → v13: três mercenários antigos (nv. 10 sem Ascensão, nv. 20 com 1, nv. 30 com 2)
        v12 = await pg.evaluate(SAVE)
        v12['versao'] = 12; v12['novidades'] = [n for n in v12.get('novidades', []) if n < 13]
        v12['stats']['lutas'] = max(1, v12['stats'].get('lutas', 0))
        antigos = [(10, 0, 1350), (20, 1, 300), (30, 2, 8000)]   # o nv. 30 a 216 XP do próximo nível (8.216)
        for m, (L, a, xp) in zip(v12['mercs'], antigos): m['nivel'] = L; m['ascensoes'] = a; m['xp'] = xp
        await pg.close()
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script(
            "if (!sessionStorage.getItem('v12')) { sessionStorage.setItem('v12', '1'); localStorage.setItem('ligaDasLaminas.save.v1', " + json.dumps(json.dumps(v12)) + "); }")
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1500)
        st = await pg.evaluate(SAVE)
        checa(st['versao'] == 15, f'save v12 abre como v15 ({st["versao"]})')
        lidos = [(m['nivel'], m['ascensoes'], int(m['xp'])) for m in st['mercs'][:3]]   # + migalhas do Campo de Treino ocioso
        checa(lidos == antigos, f'nível, Ascensões e XP preservados: {lidos}')
        tetos = await pg.evaluate("STATE.mercs.slice(0, 3).map((m) => nivelMax(m))")
        checa(tetos == [30, 60, 100], f'teto novo de cada um: {tetos} (antes: 10, 20, 30)')
        sobe = await pg.evaluate("() => { const m = STATE.mercs[2]; darXp(m, 300, 1); return m.nivel; }")
        checa(sobe == 31, f'o nv. 30 antigo continua de onde parou: com +300 XP sobe para {sobe}')
        checa(13 in st['novidades'] or await pg.is_visible('[data-act="fechar-novidades"]'), 'mostra a novidade "Rumo ao nível 100"')
        await pg.screenshot(path=str(PASTA / 'e5a-novidades.png'))

        # 6) rivais da Lenda acompanham o time acima do 30; das outras divisões, não
        fx = await pg.evaluate("() => [faixaDivisao(DIVISOES[0]), faixaDivisao(DIVISOES[4]), TORRE.nivel(200)]")
        checa(fx[0] == [1, 6] and fx[1] == [22, 100] and fx[2] == 100, f'faixa Bronze {fx[0]}, Lenda {fx[1]}, Torre até nv. {fx[2]}')

        ov = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        checa(ov == 0, f'sem rolagem lateral ({ov})')
        checa(not erros, f'sem erros no console {erros[:3]}')
        await b.close()
    print('\nTUDO OK' if not falhas else f'\n{len(falhas)} FALHA(S)')
    sys.exit(1 if falhas else 0)

asyncio.run(main())
