"""Update 0.13 — draw a dumped isometric scene from the real atlases (same anchors, trims, shapes and draw order as Pixi).
py -3 game/tools/iso_preview.py scene.json out.png [paths|stage]
`stage` draws only what the stage window shows (822x560, as IsoView.ts places it)."""
import json
import os
import sys
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ISO = os.path.join(ROOT, 'public', 'iso')
atlas = {}
for name in ['city', 'buildings', 'land', 'cars', 'foliage', 'interior', 'animals', 'sky', 'items']:
    meta = json.load(open(os.path.join(ISO, f'{name}.json')))
    sheet = Image.open(os.path.join(ISO, f'{name}.webp')).convert('RGBA')
    for key, fr in meta['frames'].items():
        f = fr['frame']
        atlas[key] = (sheet.crop((f['x'], f['y'], f['x'] + f['w'], f['y'] + f['h'])), fr['spriteSourceSize'], fr['sourceSize'])

scene = json.load(open(sys.argv[1], encoding='utf-8'))
MODE = sys.argv[3] if len(sys.argv) > 3 else ''
draws = sorted(scene['draws'], key=lambda d: d['z'])
pts = [(d['x'], d['y']) for d in draws if not d.get('prims')]
for d in draws:
    for p in d.get('prims') or []:
        if p['kind'] == 'poly':
            pts += [(p['pts'][i], p['pts'][i + 1]) for i in range(0, len(p['pts']), 2)]
        else:
            pts.append((p['x'], p['y']))
pad = 420
minx = min(p[0] for p in pts); maxx = max(p[0] for p in pts)
miny = min(p[1] for p in pts); maxy = max(p[1] for p in pts)
ox, oy = -minx + pad // 2, -miny + pad
img = Image.new('RGBA', (int(maxx - minx + pad), int(maxy - miny + pad * 1.4)), (120, 170, 220, 0 if MODE == 'stage' else 255))
def poly_layer(fn):
    lay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    fn(ImageDraw.Draw(lay, 'RGBA'))
    img.alpha_composite(lay)


def rgba(c, a=1.0):
    return ((c >> 16) & 255, (c >> 8) & 255, c & 255, int(255 * a))


for d in draws:
    if d.get('prims'):
        def draw_all(dr, prims=d['prims']):
            for p in prims:
                if p['kind'] == 'poly':
                    q = p['pts']
                    dr.polygon([(q[i] + ox, q[i + 1] + oy) for i in range(0, len(q), 2)], fill=rgba(p['color'], p.get('alpha', 1)))
                else:
                    dr.ellipse((p['x'] - p['r'] + ox, p['y'] - p['r'] + oy, p['x'] + p['r'] + ox, p['y'] + p['r'] + oy), fill=rgba(p['color'], p.get('alpha', 1)))
        poly_layer(draw_all)
        continue
    im, trim, src = atlas[d['frame']]
    s = d.get('scale', 1)
    sw, sh = src['w'] * s, src['h'] * s
    if s != 1:
        im = im.resize((max(1, round(im.width * s)), max(1, round(im.height * s))))
    tx, ty = trim['x'] * s, trim['y'] * s
    if d.get('flip'):
        im = im.transpose(Image.FLIP_LEFT_RIGHT)
        tx = sw - tx - im.width
    x = d['x'] + ox - d['ax'] * sw + tx
    y = d['y'] + oy - d['ay'] * sh + ty
    img.alpha_composite(im, (int(round(x)), int(round(y))))

if MODE == 'stage':
    S = scene.get('view', {}).get('scale', 0.6)
    cy_ = scene.get('view', {}).get('centreY', 330)
    cx, cy = (scene['cols'] / 2 - scene['rows'] / 2) * 66, (scene['cols'] / 2 + scene['rows'] / 2) * 33
    wx, wy = 740 - cx * S - 328, cy_ - cy * S - 16
    bg = scene.get('backdrop')
    win = Image.new('RGBA', (822, 560), (0, 0, 0, 255))
    for y in range(560):
        t = y / 560
        col = rgba(bg[0]) if bg else (int(47 + 160 * t), int(120 + 90 * t), int(232 - 10 * t), 255)
        if bg:
            a, b = rgba(bg[0]), rgba(bg[1])
            col = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)
        win.paste(col, (0, y, 822, y + 1))
    big = img.resize((int(img.width * S), int(img.height * S)))
    win.alpha_composite(big, (int(wx - ox * S), int(wy - oy * S)))
    ImageDraw.Draw(win).rectangle((950 - 328 - 40, 558 - 16 - 250, 950 - 328 + 40, 558 - 16), outline=(255, 80, 120), width=3)
    img = win
elif MODE == 'paths':
    dr = ImageDraw.Draw(img)
    for p in scene['paths']:
        col = (255, 60, 60) if p['kind'] == 'car' else (255, 255, 0) if p['kind'] == 'walk' else (255, 0, 255)
        q = [((a['u'] - a['v']) * 66 + ox, (a['u'] + a['v']) * 33 + oy) for a in p['points']]
        if len(q) > 1:
            dr.line(q, fill=col, width=3)
        else:
            dr.ellipse((q[0][0] - 5, q[0][1] - 5, q[0][0] + 5, q[0][1] + 5), fill=col)
img.convert('RGB').save(sys.argv[2])
print(img.size)
