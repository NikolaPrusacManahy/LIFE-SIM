"""Update 0.13 — pack the Kenney art we use into Pixi texture atlases (.webp + .json).

Run from the repo root:  py -3 game/tools/pack_iso.py
Reads ASSETS/ (raw packs, never shipped) and writes game/public/iso/<atlas>.webp + .json.
Frame names: city_072, bld_001, land_067, car_taxi_NE, car_red_sedan1_NE, farm_woodWall_S, lib_bookcaseBooks_E,
ani_dog, sky_cloud3, item_017 …

Rendered pieces (farm, library) are trimmed and halved; their frames keep the full (halved) canvas as sourceSize,
so an anchor of (0.5, 373/512) still lands on the floor diamond's top vertex.
"""
import glob
import json
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, 'ASSETS')
OUT = os.path.join(ROOT, 'game', 'public', 'iso')
PAD = 2
MAX_W = 2048
DIRS = ['NE', 'NW', 'SE', 'SW']
# civilian cars are 16 numbered rotation frames; matched to the named taxi frames by silhouette
CIVIL_FRAME = {'NE': '003', 'NW': '001', 'SE': '008', 'SW': '007'}
CIVIL_COLOURS = ['Black', 'Blue', 'Green', 'Red', 'Silver']
CIVIL_MODELS = ['Sedan 1', 'Sedan 2', 'Pick-up 1', 'Truck 1']
LOSSY = {'interior', 'animals'}


def num(path):
    return os.path.basename(path).rsplit('_', 1)[-1].split('.')[0]


def stem(path):
    return os.path.basename(path)[:-4]


def files(*parts):
    return sorted(glob.glob(os.path.join(SRC, *parts)))


def collect():
    """atlas name -> (items [(frame, path)], trim, scale)"""
    cars = []
    for kind in ['Taxi', 'Police', 'Ambulance', 'Garbage']:
        for d in DIRS:
            p = os.path.join(SRC, 'vehicles', 'PNG', kind, f'{kind.lower()}_{d}.png')
            if os.path.exists(p):
                cars.append((f'car_{kind.lower()}_{d}', p))
    for colour in CIVIL_COLOURS:
        for model in CIVIL_MODELS:
            for d, n in CIVIL_FRAME.items():
                hits = files('vehicles', 'PNG', 'Civilian', colour, model, f'*_{n}.png')
                if hits:
                    tag = model.lower().replace(' ', '').replace('-', '')
                    cars.append((f'car_{colour.lower()}_{tag}_{d}', hits[0]))
    interior = [(f'farm_{stem(p)}', p) for p in files('farm', 'Isometric', '*.png')]
    interior += [(f'lib_{stem(p)}', p) for p in files('library', 'Isometric', '*.png')]
    sky = [(f'sky_{stem(p)}', p) for p in files('background_pack', 'PNG', '*.png') if stem(p).startswith(('cloud', 'sun', 'moon'))]
    return {
        'city': ([(f'city_{num(p)}', p) for p in files('tiles_city', 'PNG', '*.png')], False, 1),
        'buildings': ([(f'bld_{num(p)}', p) for p in files('buildings', 'PNG', '*.png')], False, 1),
        'land': ([(f'land_{num(p)}', p) for p in files('tiles_landscape', 'PNG', '*.png')], False, 1),
        'cars': (cars, False, 1),
        # side-view trees, bushes, rocks and flowers (by season) stand on the iso tiles
        'foliage': ([(f'fol_{num(p)}', p) for p in files('foliage pack', 'PNG', 'Default size', '*.png')], False, 1),
        # rendered farm + library pieces (walls, floors, furniture, crops) for interiors and the farm
        'interior': (interior, True, 0.5),
        'animals': ([(f'ani_{stem(p)}', p) for p in files('pets & animals', 'PNG', 'Round', '*.png')], False, 0.5),
        'sky': (sky, False, 1),
        'items': ([(f'item_{num(p)}', p) for p in files('generic_items', 'PNG', 'Colored', '*.png')], False, 1),
    }


def load(path, trim, scale):
    im = Image.open(path).convert('RGBA')
    if scale != 1:
        im = im.resize((max(1, round(im.width * scale)), max(1, round(im.height * scale))), Image.LANCZOS)
    full = im.size
    box = im.getbbox() if trim else None
    if box:
        im = im.crop(box)
        return im, full, (box[0], box[1])
    return im, full, (0, 0)


def pack(name, items, trim, scale):
    imgs = []
    for key, path in items:
        im, full, off = load(path, trim, scale)
        imgs.append((key, im, full, off))
    imgs.sort(key=lambda t: -t[1].height)
    x = y = row_h = 0
    pos = {}
    width = 0
    for key, im, _, _ in imgs:
        if x + im.width + PAD > MAX_W:
            x, y, row_h = 0, y + row_h + PAD, 0
        pos[key] = (x, y)
        x += im.width + PAD
        row_h = max(row_h, im.height)
        width = max(width, x)
    height = y + row_h
    sheet = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    frames = {}
    for key, im, full, off in imgs:
        px, py = pos[key]
        sheet.paste(im, (px, py))
        frames[key] = {
            'frame': {'x': px, 'y': py, 'w': im.width, 'h': im.height},
            'rotated': False, 'trimmed': off != (0, 0) or full != im.size,
            'spriteSourceSize': {'x': off[0], 'y': off[1], 'w': im.width, 'h': im.height},
            'sourceSize': {'w': full[0], 'h': full[1]},
        }
    os.makedirs(OUT, exist_ok=True)
    # flat art stays lossless; rendered (textured) art is lossy at high quality — far smaller, no visible change
    if name in LOSSY:
        sheet.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', quality=88, method=6)
    else:
        sheet.save(os.path.join(OUT, f'{name}.webp'), 'WEBP', lossless=True, method=6)
    meta = {'frames': frames, 'meta': {'image': f'{name}.webp', 'format': 'RGBA8888', 'size': {'w': width, 'h': height}, 'scale': '1'}}
    with open(os.path.join(OUT, f'{name}.json'), 'w') as f:
        json.dump(meta, f, separators=(',', ':'))
    print(f'{name}: {len(imgs)} frames, {width}x{height}')


def export_icons():
    """Item icons as single small files for the DOM (bag, shops): public/items/item_017.webp, 64px."""
    out = os.path.join(ROOT, 'game', 'public', 'items')
    os.makedirs(out, exist_ok=True)
    for p in files('generic_items', 'PNG', 'Colored', '*.png'):
        im = Image.open(p).convert('RGBA')
        im.thumbnail((64, 64), Image.LANCZOS)
        im.save(os.path.join(out, f'item_{num(p)}.webp'), 'WEBP', lossless=True)
    print('items: icons exported')


if __name__ == '__main__':
    for atlas, (items, trim, scale) in collect().items():
        pack(atlas, items, trim, scale)
    export_icons()
