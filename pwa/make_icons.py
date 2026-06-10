#!/usr/bin/env python3
"""Genera icon-192.png e icon-512.png (diamante cian glow sobre negro) sin PIL."""
import struct, zlib, os

def make_icon(size, path):
    cx = cy = size / 2
    half = size * 0.32          # semidiagonal del diamante
    glow_r = size * 0.46        # radio del halo
    rows = []
    for y in range(size):
        row = bytearray([0])    # filtro 0 por scanline
        for x in range(size):
            dx, dy = x - cx, y - cy
            man = abs(dx) / half + abs(dy) / half   # distancia "diamante"
            dist = (dx * dx + dy * dy) ** 0.5
            r, g, b = 2, 2, 8
            if dist < glow_r:   # halo cian que decae
                k = (1 - dist / glow_r) ** 2 * 0.55
                r += int(0 * k); g += int(229 * k); b += int(255 * k)
            if man <= 1.0:      # cuerpo del diamante
                edge = min(1.0, (1.0 - man) * 8)    # borde suave
                r = int(r + (140 - r) * edge * 0.4)
                g = int(g + (240 - g) * edge)
                b = int(b + (255 - b) * edge)
                if man < 0.45:  # brillo interno
                    r = min(255, r + 60); g = min(255, g + 15); b = min(255, b + 0)
            row += bytes((min(r, 255), min(g, 255), min(b, 255)))
        rows.append(bytes(row))

    def chunk(tag, data):
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data))

    ihdr = struct.pack('>IIBBBBB', size, size, 8, 2, 0, 0, 0)
    png = (b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr)
           + chunk(b'IDAT', zlib.compress(b''.join(rows), 9)) + chunk(b'IEND', b''))
    with open(path, 'wb') as f:
        f.write(png)
    print(f'{path}: {os.path.getsize(path)} bytes')

here = os.path.dirname(os.path.abspath(__file__))
make_icon(192, os.path.join(here, 'icon-192.png'))
make_icon(512, os.path.join(here, 'icon-512.png'))
