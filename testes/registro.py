"""E3: registro de partidas, reprodução, recordes/melhores da temporada e migração de save v6 -> v7 (-> v8 na E4).
E4 (b): toda luta do jogo usa o cérebro v2 (regras de combate v2); uma luta de regras antigas não reproduz mais.
Uso: python3 testes/registro.py dist/index.html"""
import asyncio, sys, pathlib, json, random
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

async def luta_assistida(pg):
    """Luta vista na tela a 3×, em modo Manual, tocando nos inimigos e no SUPREMO."""
    await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(2600)
    await pg.click('[data-act="luta-vel"][data-v="3"]')
    if (await pg.text_content('#btn-auto')).strip() == 'Auto': await pg.click('#btn-auto')
    cv = await pg.query_selector('#arena'); box = await cv.bounding_box()
    toques = 0
    for _ in range(400):
        if await pg.query_selector('[data-act="resultado-ok"]'): break
        alvo = await pg.evaluate("""() => { const b = Luta && Luta.b; if (!b) return null;
            const u = b.units.find((o) => o.vivo && o.team === 1); if (!u) return null;
            const cv = document.querySelector('#arena'), r = cv.getBoundingClientRect();
            // procura o ponto da tela que cai sobre o inimigo (inverte telaParaMundo por amostragem)
            let best = null, bd = 1e9;
            for (let i = 0; i <= 20; i++) for (let j = 0; j <= 12; j++) {
              const [x, y] = telaParaMundo(i / 20 * VISTA.w, j / 12 * VISTA.h), d = Math.hypot(u.x - x, u.y - 19 - y);
              if (d < bd) { bd = d; best = [r.left + i / 20 * r.width, r.top + j / 12 * r.height]; } }
            return best; }""")
        if alvo and random.random() < 0.3:
            await pg.mouse.click(alvo[0], alvo[1]); toques += 1
        sup = await pg.query_selector('#btn-supremo:not([disabled])')
        if sup and random.random() < 0.5: await sup.click(); toques += 1
        if random.random() < 0.03: await pg.click('#btn-auto'); await pg.click('#btn-auto')
        await pg.wait_for_timeout(150)
    entradas = await pg.evaluate('Luta ? Luta.b.entradas.length : -1')
    await pg.click('[data-act="resultado-ok"]'); await pg.wait_for_timeout(500)
    return toques, entradas

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch()
        ctx = await b.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        pg = await ctx.new_page(); erros = []
        pg.on('pageerror', lambda e: erros.append(str(e)))
        pg.on('console', lambda m: m.type == 'error' and erros.append(m.text))
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1200)
        await pg.click('[data-act="criar-guilda"]'); await pg.wait_for_timeout(800)
        await fechar_modais(pg)
        await pg.click('[data-act="aba"][data-id="liga"]'); await pg.wait_for_timeout(300)

        # 1) duas lutas assistidas com toques manuais + três puladas
        for k in range(2):
            toques, entradas = await luta_assistida(pg)
            checa(entradas > 0, f'luta assistida {k+1}: {toques} toques, {entradas} entradas registradas')
        for k in range(3):
            await pg.click('[data-act="lutar-liga"]'); await pg.wait_for_timeout(700)
            await pg.click('[data-act="luta-pular"]'); await pg.wait_for_timeout(500)
            await pg.click('[data-act="resultado-ok"]'); await pg.wait_for_timeout(400)
        st = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))")
        checa(st['versao'] == 10, f"save na versão 10 ({st['versao']})")
        # E4 (c): todo mercenário tem casa na formação 3×3 e postura; linha derivada da coluna
        checa(all(isinstance(m.get('pos'), int) and 0 <= m['pos'] <= 8 and m.get('postura') in ('auto', 'avancar', 'segurar', 'flanquear') and m['linha'] == ('frente' if m['pos'] < 3 else 'tras') for m in st['mercs']), 'mercenários com pos (0–8), postura e linha derivada da coluna')
        P = st['partidas']
        checa(len(P) == 5, f'5 partidas registradas ({len(P)})')
        campos = all(all(k in p for k in ('seed', 'regras', 'times', 'vencedor', 'tempo', 'passos', 'replay')) for p in P)
        checa(campos, 'cada registro tem semente, regras, times, vencedor, duração e dados de reprodução')
        lut = P[0]['times'][0][0]
        checa(all(k in lut for k in ('id', 'nv', 'itens', 'dano', 'cura', 'rec', 'ab', 'mo')), f'por lutador: id, nível, itens, dano, recebido, abates, mortes, curas')

        # 2) reprodução a partir do registro salvo (como se viesse do save)
        res = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1')).partidas.map((p) => conferirPartida(p))")
        checa(res == ['igual'] * 5, f'reproduzir do registro dá o mesmo resultado: {res}')
        # E4 (b): as lutas do jogo usam o cérebro v2 e as regras v2; uma luta de regras antigas avisa em vez de reproduzir
        ia = [(p['regras'], p['replay']['A'].get('ia'), p['replay']['B'].get('ia')) for p in P]
        checa(all(x == (3, 'v2', 'v2') for x in ia), f'toda luta com regras v3 e cérebro v2 nos dois lados: {ia[0]}')
        checa(all('pos' in m and 'postura' in m for p in P for t in (p['replay']['A'], p['replay']['B']) for m in t['mercs']), 'o registro guarda casa e postura de cada lutador')
        antiga = await pg.evaluate("(() => { const p = JSON.parse(JSON.stringify(JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1')).partidas[0])); p.regras = 1; return conferirPartida(p); })()")
        checa(antiga == 'regras', f'luta de regras antigas não reproduz (avisa "{antiga}")')
        # e o botão Conferir na tela
        await pg.click('[data-act="config"]'); await pg.wait_for_timeout(300)
        await pg.click('#modais [data-act="estatisticas"]'); await pg.wait_for_timeout(500)
        await pg.click('[data-act="conferir-partida"]'); await pg.wait_for_timeout(300)
        t = await pg.text_content('#toasts')
        checa('idêntica' in t, f'botão Conferir: "{t.strip()[:60]}"')

        # 3) recordes e melhores da temporada
        cats = await pg.eval_on_selector_all('.rec-cat', 'els => els.map(e => e.dataset.cat)')
        checa(cats == ['mvp', 'abates', 'kda', 'dano', 'cura'], f'5 melhores da temporada: {cats}')
        rivais = await pg.eval_on_selector_all('.rec-linha:not(.meu)', 'els => els.length')
        meus = await pg.eval_on_selector_all('.rec-linha.meu', 'els => els.length')
        checa(rivais > 0 and meus > 0, f'heróis rivais ({rivais}) e meus ({meus}) lado a lado')
        rot = await pg.eval_on_selector_all('.kpi .rot', 'els => els.map(e => e.textContent)')
        checa(all(x in rot for x in ['Sequência de vitórias', 'Melhor andar da Torre', 'Líder mais derrotado', 'Tempo de jogo']), 'ficha de rastro com os 4 recordes')
        await pg.screenshot(path=str(PASTA / 'e3-estatisticas.png'), full_page=False)
        await pg.click('[data-act="rec-funcao"][data-id="suporte"]'); await pg.wait_for_timeout(300)
        on = await pg.eval_on_selector('.chip-btn.on[data-act="rec-funcao"]', 'e => e.dataset.id')
        txts = await pg.eval_on_selector_all('.rec-linha small', 'els => els.map(e => e.textContent)')
        checa(on == 'suporte' and all('Suporte' in x for x in txts), f'filtro por função (Suporte): {len(txts)} linhas')
        await pg.evaluate("document.querySelector('.melhores').scrollIntoView()")
        await pg.screenshot(path=str(PASTA / 'e3-melhores.png'), full_page=False)
        ov = await pg.evaluate('document.documentElement.scrollWidth - innerWidth')
        checa(ov == 0, f'sem rolagem lateral ({ov})')
        pequenos = await pg.evaluate("""[...document.querySelectorAll('#modais [data-act="rec-funcao"], #modais [data-act="conferir-partida"]')].filter((e) => e.getBoundingClientRect().height < 44).length""")
        checa(pequenos == 0, f'botões novos com 44 px ou mais ({pequenos} menores)')

        # 4) migração: save v6 (sem os campos novos) abre em v7 sem perda
        v6 = dict(st); v6['versao'] = 6
        for k in ('partidas', 'temporadaRec'): v6.pop(k, None)
        for k in ('seqAtual', 'seqRecorde', 'tempoJogo', 'lideresVencidos', 'partidasN'): v6['stats'].pop(k, None)
        for m in v6['mercs']: m.pop('pos', None); m.pop('postura', None)   # v6 não tinha formação
        v6['novidades'] = []
        # página nova (a antiga grava o próprio save ao sair, por isso não dá para trocar o save por baixo dela)
        await pg.close()
        pg = await ctx.new_page()
        pg.on('pageerror', lambda e: erros.append(str(e)))
        await pg.add_init_script(
            "if (!sessionStorage.getItem('v6')) { sessionStorage.setItem('v6', '1'); localStorage.setItem('ligaDasLaminas.save.v1', " + json.dumps(json.dumps(v6)) + "); }")
        await pg.goto(ARQ.as_uri()); await pg.wait_for_timeout(1500)
        st2 = await pg.evaluate("JSON.parse(localStorage.getItem('ligaDasLaminas.save.v1'))")
        checa(st2['versao'] == 10, 'save v6 abre como v10')
        checa([m['id'] for m in st2['mercs']] == [m['id'] for m in v6['mercs']] and st2['ouro'] >= v6['ouro'] and st2['stats']['lutas'] == v6['stats']['lutas'], 'mercenários, ouro e lutas preservados')
        checa(st2['partidas'] == [] and st2['stats']['seqRecorde'] == 0, 'campos novos criados vazios')
        checa(all((m['pos'] // 3 == 0) == (v['linha'] == 'frente') and m['postura'] == 'auto' for m, v in zip(st2['mercs'], v6['mercs'])), 'migração: linha Frente → coluna da frente, Trás → coluna de trás, postura automática')
        tit = [m for m in st2['mercs'] if m['id'] in st2['time']]
        checa(len({m['pos'] for m in tit}) == len(tit) and all(m['pos'] in (1, 7) for m in st2['mercs'] if m['id'] not in st2['time']), 'titulares em casas únicas; reservas no centro da sua coluna')
        checa((7 in st2['novidades'] and 8 in st2['novidades']) or await pg.is_visible('[data-act="fechar-novidades"]'), 'mostra as novidades da v0.6 e da v0.7')
        await pg.screenshot(path=str(PASTA / 'e3-novidades.png'))

        checa(not erros, f'sem erros no console {erros[:3]}')
        tam = len(json.dumps(st))
        print(f'tamanho do save com 5 partidas: {tam/1024:.1f} KB')
        com = sum(len(json.dumps(x)) for x in P) / len(P); sem = sum(len(json.dumps({k: v for k, v in x.items() if k != 'replay'})) for x in P) / len(P)
        rec = len(json.dumps(st.get('temporadaRec')))
        est = tam - len(json.dumps(P)) + 10 * com + 40 * sem
        print(f'partida: {com/1024:.1f} KB com reprodução, {sem/1024:.1f} KB sem · temporada: {rec/1024:.1f} KB · save estimado com 50 partidas: {est/1024:.0f} KB (limite da nuvem: 234 KB)')
        checa(est < 160 * 1024, 'save com 50 partidas cabe com folga no limite da nuvem')
        await b.close()
    print('\n' + ('TUDO OK' if not falhas else f'{len(falhas)} FALHA(S)'))
    sys.exit(1 if falhas else 0)
asyncio.run(main())
