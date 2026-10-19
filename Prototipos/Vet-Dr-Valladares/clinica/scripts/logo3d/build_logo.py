"""Construye el emblema 3D de la Clínica Valladares en Blender.

Las siluetas no se dibujan a mano: se calcan del logotipo original
(`public/images/logo.jpg`). Cada cuadrante se recorta, se separa el blanco de la
silueta, se rellenan los filetes verdes (oreja del perro, pico del loro) y se
traza el contorno con marching squares sobre el campo suavizado, así el relieve
sigue la curva del dibujo y no una aproximación poligonal.

Acabados: lacado cobalto y esmeralda con capa de barniz, porcelana cálida y
filetes de oro champán. La web recrea las luces y el entorno; aquí solo viajan
la geometría y los materiales.

Escribe:
- public/models/valladares-logo-3d.glb   geometría y materiales (eje Z hacia la cámara)
- public/models/valladares-logo-3d.json  contornos y anclas para los gestos de la web
- scripts/logo3d/valladares-logo-3d.blend y su render de control
"""
import bpy, math, os, json
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
SRC = os.path.join(REPO, 'public', 'images', 'logo.jpg')
OUT = os.path.join(REPO, 'public', 'models', 'valladares-logo-3d.glb')
META = os.path.join(REPO, 'public', 'models', 'valladares-logo-3d.json')
BLEND = os.path.join(HERE, 'valladares-logo-3d.blend')
PREVIEW = os.path.join(HERE, 'valladares-logo-3d-preview.png')

HALF = 1.0          # media arista de cada pieza
GAP = .16           # separación entre piezas: en el final se enciende ahí la cruz
STEP = HALF * 2 + GAP
INSET = .885        # la silueta vive dentro del marco dorado
TILES = {  # cuadrante del logo → color de la pieza
    'cat': ((0, 0), 'blue'), 'dog': ((0, 1), 'green'),
    'bird': ((1, 0), 'green'), 'horse': ((1, 1), 'blue'),
}
# Anclas a mano, en coordenadas locales de cada pieza (-1…1): dónde se abre el
# ojo de cada animal cuando la web lo despierta.
ANCHORS = {
    'cat': {'eye': (-.2, .4)},
    'dog': {'eye': (.33, .36)},
    'bird': {'eye': (-.07, .25)},
    'horse': {'eye': (.3, .3)},
}

# ---------------------------------------------------------------------------
# 1. Calco del logotipo
# ---------------------------------------------------------------------------
img = bpy.data.images.load(SRC)
W, H = img.size
px = np.empty(W * H * 4, dtype=np.float32)
img.pixels.foreach_get(px)
px = px.reshape(H, W, 4)[::-1, :, :3]          # filas de arriba abajo
mx, mn = px.max(2), px.min(2)
saturated = (mx - mn) > .28
white = mn > .80
greenish = (px[..., 1] > px[..., 0] + .12) & (px[..., 1] > px[..., 2] + .05)


def shift(m, dy, dx):
    out = np.zeros_like(m)
    h, w = m.shape
    ys, yd = (slice(0, h - dy), slice(dy, h)) if dy >= 0 else (slice(-dy, h), slice(0, h + dy))
    xs, xd = (slice(0, w - dx), slice(dx, w)) if dx >= 0 else (slice(-dx, w), slice(0, w + dx))
    out[yd, xd] = m[ys, xs]
    return out


def dilate(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy <= r * r:
                out |= shift(m, dy, dx)
    return out


def erode(m, r):
    return ~dilate(~m, r)


def blur(f, sigma):
    r = int(sigma * 3)
    k = np.exp(-np.arange(-r, r + 1) ** 2 / (2 * sigma * sigma)); k /= k.sum()
    g = np.pad(f, r, mode='edge')
    g = sum(k[i] * g[:, i:i + g.shape[1] - 2 * r] for i in range(2 * r + 1))
    g = sum(k[i] * g[i:i + g.shape[0] - 2 * r, :] for i in range(2 * r + 1))
    return g


def components(m, min_px):
    """Etiquetado 4-conexo sencillo; devuelve máscaras de tamaño suficiente."""
    lab = np.zeros(m.shape, np.int32); n = 0; found = []
    ys, xs = np.nonzero(m)
    for y0, x0 in zip(ys, xs):
        if lab[y0, x0]:
            continue
        n += 1; stack = [(y0, x0)]; lab[y0, x0] = n; cnt = 0
        while stack:
            y, x = stack.pop(); cnt += 1
            for yy, xx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
                if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n; stack.append((yy, xx))
        if cnt >= min_px:
            found.append(lab == n)
    return found


# Marching squares: segmentos entre puntos medios interpolados de las aristas.
CASES = {1: [('L', 'B')], 2: [('B', 'R')], 3: [('L', 'R')], 4: [('T', 'R')], 6: [('T', 'B')],
         7: [('L', 'T')], 8: [('L', 'T')], 9: [('T', 'B')], 11: [('T', 'R')], 12: [('L', 'R')],
         13: [('B', 'R')], 14: [('L', 'B')]}


def contours(f, iso=.5, min_area=60):
    f = np.pad(f, 1)
    inside = f >= iso
    code = inside[:-1, :-1] * 8 + inside[:-1, 1:] * 4 + inside[1:, 1:] * 2 + inside[1:, :-1] * 1
    adj = {}

    def eid(i, j, side):
        return {'T': ('h', i, j), 'B': ('h', i + 1, j), 'L': ('v', i, j), 'R': ('v', i, j + 1)}[side]

    for i, j in zip(*np.nonzero((code > 0) & (code < 15))):
        c = int(code[i, j])
        if c in (5, 10):
            centre = f[i:i + 2, j:j + 2].mean() >= iso
            segs = ([('L', 'T'), ('B', 'R')] if centre else [('L', 'B'), ('T', 'R')]) if c == 5 else \
                   ([('T', 'R'), ('L', 'B')] if centre else [('L', 'T'), ('B', 'R')])
        else:
            segs = CASES[c]
        for a, b in segs:
            ea, eb = eid(i, j, a), eid(i, j, b)
            adj.setdefault(ea, []).append(eb); adj.setdefault(eb, []).append(ea)

    def point(e):
        k, i, j = e
        if k == 'h':
            a, b = f[i, j], f[i, j + 1]; t = (iso - a) / (b - a) if b != a else .5
            return (j + t - 1, i - 1)
        a, b = f[i, j], f[i + 1, j]; t = (iso - a) / (b - a) if b != a else .5
        return (j - 1, i + t - 1)

    seen, loops = set(), []
    for start in adj:
        if start in seen:
            continue
        loop, prev, cur = [], None, start
        while cur not in seen:
            seen.add(cur); loop.append(point(cur))
            nxt = [e for e in adj[cur] if e != prev and e not in seen]
            if not nxt:
                break
            prev, cur = cur, nxt[0]
        if len(loop) > 8 and abs(area(loop)) >= min_area:
            loops.append(loop)
    return loops


def area(loop):
    return .5 * sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(loop, loop[1:] + loop[:1]))


def resample(loop, step=None, count=None):
    pts = np.array(list(loop) + [loop[0]], dtype=np.float64)
    seg = np.hypot(*np.diff(pts, axis=0).T); s = np.concatenate([[0], np.cumsum(seg)])
    n = count or max(12, int(s[-1] / step))
    t = np.linspace(0, s[-1], n, endpoint=False)
    return list(zip(np.interp(t, s, pts[:, 0]), np.interp(t, s, pts[:, 1])))


def bands(counts):
    """Las dos franjas largas de píxeles de color: filas o columnas de las piezas."""
    idx = np.nonzero(counts > 40)[0]
    runs, start = [], idx[0]
    for a, b in zip(idx, idx[1:]):
        if b != a + 1:
            runs.append((start, a)); start = b
    runs.append((start, idx[-1]))
    return sorted(sorted(runs, key=lambda r: r[1] - r[0])[-2:])


ROWS, COLS = bands(saturated.sum(1)), bands(saturated.sum(0))


def tile_box(qy, qx):
    (y0, y1), (x0, x1) = ROWS[qy], COLS[qx]
    s = max(y1 - y0, x1 - x0) + 1
    return int((y0 + y1) / 2 - s / 2), int((x0 + x1) / 2 - s / 2), int(s)


def rounded_inside(S, half, radius):
    c = (np.arange(S) + .5) / S * 2 - 1
    u, v = np.meshgrid(c, c)
    qx, qy = np.abs(u) - (half - radius), np.abs(v) - (half - radius)
    d = np.hypot(np.maximum(qx, 0), np.maximum(qy, 0)) + np.minimum(np.maximum(qx, qy), 0) - radius
    return d < 0


traced = {}
for key, ((qy, qx), _) in TILES.items():
    y0, x0, S = tile_box(qy, qx)
    pad = lambda a: np.pad(a, ((max(0, -y0), 0), (max(0, -x0), 0)))[max(0, y0):max(0, y0) + S, max(0, x0):max(0, x0) + S]
    w, g = pad(white), pad(greenish)
    closed = erode(dilate(w, 6), 6)
    sil = closed & rounded_inside(S, INSET, .1)
    sil = max(components(sil, 2000), key=lambda m: m.sum())
    lines = sil & ~w & g & erode(sil, 3)
    lines = [m for m in components(lines, 60)]
    to_local = lambda p, S=S: ((p[0] + .5) / S * 2 - 1, -((p[1] + .5) / S * 2 - 1))
    sil_loops = contours(blur(sil.astype(np.float32), 1.6), min_area=S * S * .002)
    line_loops = [l for m in lines for l in contours(blur(m.astype(np.float32), .9), min_area=8)]
    traced[key] = {
        'silhouette': [[to_local(p) for p in resample(l, 4.6)] for l in sil_loops],
        'inlay': [[to_local(p) for p in resample(l, 2.6)] for l in line_loops],
    }
    print(key, 'box', (y0, x0, S), 'loops', len(sil_loops), 'inlay', len(line_loops))

# ---------------------------------------------------------------------------
# 2. Escena Blender
# ---------------------------------------------------------------------------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT'
scene.render.resolution_x = scene.render.resolution_y = 1100
scene.render.image_settings.file_format = 'PNG'; scene.render.filepath = PREVIEW
scene.view_settings.view_transform = 'AgX'; scene.view_settings.look = 'AgX - Medium High Contrast'
world = bpy.data.worlds.new('Estudio'); scene.world = world; world.use_nodes = True
world.node_tree.nodes['Background'].inputs['Color'].default_value = (.012, .022, .04, 1)
world.node_tree.nodes['Background'].inputs['Strength'].default_value = .6


def mat(name, color, metal=0., rough=.3, coat=0., coat_rough=.05, emission=None):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.diffuse_color = (*color, 1)
    p = m.node_tree.nodes['Principled BSDF']
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal; p.inputs['Roughness'].default_value = rough
    p.inputs['Coat Weight'].default_value = coat; p.inputs['Coat Roughness'].default_value = coat_rough
    if emission:
        p.inputs['Emission Color'].default_value = (*emission, 1); p.inputs['Emission Strength'].default_value = 1
    return m


MATS = {
    'blue': mat('Lacado cobalto', (.006, .045, .32), .1, .32, 1., .04),
    'green': mat('Lacado esmeralda', (.004, .19, .055), .1, .32, 1., .04),
    'porcelain': mat('Porcelana', (.86, .84, .80), 0., .38, .55, .12),
    'gold': mat('Oro champán', (.92, .68, .36), 1., .2),
}


def poly_curve(name, loops, depth, bevel, material, z, res=4, par=None):
    cu = bpy.data.curves.new(name, 'CURVE'); cu.dimensions = '2D'; cu.fill_mode = 'BOTH'
    cu.extrude = depth; cu.bevel_depth = bevel; cu.bevel_resolution = res; cu.resolution_u = 1
    for loop in loops:
        sp = cu.splines.new('POLY'); sp.points.add(len(loop) - 1); sp.use_cyclic_u = True
        for p, (x, y) in zip(sp.points, loop):
            p.co = (x, y, 0, 1)
    o = bpy.data.objects.new(name, cu); bpy.context.collection.objects.link(o)
    o.location = (0, 0, z); o.data.materials.append(material); o.parent = par
    return o


def rounded_rect(half, radius, seg=14):
    pts = []
    for cx, cy, a0 in ((half - radius, half - radius, 0), (-half + radius, half - radius, 90),
                       (-half + radius, -half + radius, 180), (half - radius, -half + radius, 270)):
        for i in range(seg + 1):
            a = math.radians(a0 + 90 * i / seg)
            pts.append((cx + radius * math.cos(a), cy + radius * math.sin(a)))
    return pts


meta = {'half': HALF, 'step': STEP, 'reliefTop': .135, 'animals': {}}
for key, ((qy, qx), color) in TILES.items():
    cx, cy = (qx - .5) * STEP, (.5 - qy) * STEP
    root = bpy.data.objects.new('Animal_' + key, None); bpy.context.collection.objects.link(root)
    root.location = (cx, cy, 0)
    # Pieza lacada: el bisel de la curva crece hacia fuera, así que se descuenta.
    poly_curve('Tile_' + key, [rounded_rect(HALF - .05, .15)], .1, .05, MATS[color], -.15, 6, root)
    ring = [rounded_rect(.955, .13), rounded_rect(.925, .105)[::-1]]
    poly_curve('Bezel_' + key, ring, .006, .006, MATS['gold'], .012, 2, root)
    t = traced[key]
    poly_curve('Relief_' + key, t['silhouette'], .035, .026, MATS['porcelain'], .072, 4, root)
    if t['inlay']:
        poly_curve('Inlay_' + key, t['inlay'], .004, .005, MATS['gold'], .132, 2, root)
    main = max(t['silhouette'], key=lambda l: abs(area(l)))
    meta['animals'][key] = {
        'center': [round(cx, 4), round(cy, 4)],
        'outline': [[round(x, 4), round(y, 4)] for x, y in resample(main, count=360)],
        **{k: list(v) for k, v in ANCHORS[key].items()},
    }

# Luces y cámara solo para el render de control: no se exportan.
for loc, energy, color, size in (((-5, 4, 7), 1400, (1, .93, .82), 6), ((5, -3, 4), 600, (.5, .7, 1), 5),
                                 ((0, 6, 2), 500, (1, .85, .6), 3)):
    bpy.ops.object.light_add(type='AREA', location=loc); L = bpy.context.object
    L.data.energy = energy; L.data.color = color; L.data.size = size
    L.rotation_euler = (math.atan2(math.hypot(loc[0], loc[1]), loc[2]), 0, math.atan2(loc[0], -loc[1]))
    L.rotation_mode = 'XYZ'
    direction = -np.array(loc, dtype=float); direction /= np.linalg.norm(direction)
    L.rotation_euler = __import__('mathutils').Vector(direction).to_track_quat('-Z', 'Y').to_euler()
bpy.ops.object.camera_add(location=(0, 0, 11)); cam = bpy.context.object; scene.camera = cam
cam.data.lens = 50
bpy.ops.render.render(write_still=True)

# glTF no conserva el relleno de las curvas 2D: se convierten a malla.
for o in list(scene.objects):
    if o.type == 'CURVE':
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True)
        bpy.context.view_layer.objects.active = o; bpy.ops.object.convert(target='MESH')
        bpy.ops.object.shade_smooth_by_angle(angle=math.radians(40))
bpy.ops.wm.save_as_mainfile(filepath=BLEND)

os.makedirs(os.path.dirname(OUT), exist_ok=True)
bpy.ops.object.select_all(action='DESELECT')
for o in scene.objects:
    o.select_set(o.type in {'MESH', 'EMPTY'})
bpy.ops.export_scene.gltf(filepath=OUT, export_format='GLB', use_selection=True, export_apply=True,
                          export_materials='EXPORT', export_yup=False)
with open(META, 'w') as fh:
    json.dump(meta, fh, separators=(',', ':'))
print('WROTE', OUT); print('WROTE', META); print('WROTE', PREVIEW)
