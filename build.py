#!/usr/bin/env python3
"""Monta o jogo a partir de src/.

Saídas em dist/:
  liga-das-laminas.html  -> conteúdo publicado no Claude (artefato)
  index.html             -> página completa para abrir no navegador / GitHub Pages
"""
import base64, pathlib, re

RAIZ = pathlib.Path(__file__).parent
SRC = RAIZ / 'src'
DIST = RAIZ / 'dist'

def montar():
    js = ''.join(p.read_text(encoding='utf-8') for p in sorted((SRC / 'js').glob('*.js')))
    shell = (SRC / 'shell.html').read_text(encoding='utf-8')
    def fonte(m):
        dados = (SRC / 'fonts' / m.group(1)).read_bytes()
        return 'url(data:font/woff2;base64,' + base64.b64encode(dados).decode() + ')'
    shell = re.sub(r'url\(/\*__FONT:([\w.-]+)__\*/\)', fonte, shell)
    assert shell.count('/*__JS__*/') == 1
    return shell.replace('/*__JS__*/', js)

def main():
    corpo = montar()
    DIST.mkdir(exist_ok=True)
    (DIST / 'liga-das-laminas.html').write_text(corpo, encoding='utf-8')
    pagina = ('<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">'
              '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
              '<meta name="theme-color" content="#16111f">'
              '<style>html,body{margin:0;padding:0;background:#16111f}</style></head><body>'
              + corpo + '</body></html>')
    (DIST / 'index.html').write_text(pagina, encoding='utf-8')
    print('ok:', len(corpo) // 1024, 'KB')

if __name__ == '__main__':
    main()
