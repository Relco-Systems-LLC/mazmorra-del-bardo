#!/usr/bin/env bash
# Genera:
#  - dist/mazmorra.html : un único archivo autocontenido para uso local (file://)
#  - docs/              : sitio PWA para GitHub Pages (index.html + sw + manifest + íconos)
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p dist docs

# Íconos PWA (solo si faltan; son determinísticos)
[ -f pwa/icon-192.png ] && [ -f pwa/icon-512.png ] || python3 pwa/make_icons.py

python3 - <<'EOF'
import re, time

html = open('index.html', encoding='utf-8').read()

def inline(m):
    code = open(m.group(1), encoding='utf-8').read()
    return '<script>\n' + code + '\n</script>'

html = re.sub(r'<script src="([^"]+)"></script>', inline, html)
open('dist/mazmorra.html', 'w', encoding='utf-8').write(html)
open('docs/index.html', 'w', encoding='utf-8').write(html)

build = time.strftime('%Y%m%d%H%M%S')
sw = open('pwa/sw.js', encoding='utf-8').read().replace('__BUILD__', build)
open('docs/sw.js', 'w', encoding='utf-8').write(sw)
print(f'dist/mazmorra.html y docs/: {len(html)//1024} KB (build {build})')
EOF

cp pwa/manifest.webmanifest pwa/icon-192.png pwa/icon-512.png docs/
echo "docs/ listo para GitHub Pages"
