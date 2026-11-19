"""Constrói em Blender o emblema 3D artesanal otimizado da Clínica Veterinária Vale d'Álvaro (Bragança).

Identidade limpa, modesta e portuguesa (coerente com `ValeEmblem.tsx` e `valedalvaro-logo.svg`):
- `tile` : Arco / Azulejo em Azul Azulejo (#1e4d7b) com filete dourado (#df9a38) e cruz veterinária em porcelana.
- `vale` : Sol suave e duas encostas douradas encaixadas na curva inferior interna do filete em «V».
- `dog`  : Cão acolhedor em porcelana clara com orelhas caídas articuladas, focinho e sorriso (lado esquerdo).
- `cat`  : Gato sereno em porcelana clara com orelhas pontiagudas, interior dourado, nariz mel e bigodes dourados (lado direito).

Otimizações de malha e sombreamento:
- Z-layering exato (z_bot..z_top já considerando extrude + bevel_depth) -> zero Z-fighting ou peças enterradas.
- Tampas planas com sombreamento plano (`abs(normal.z) > 0.985`) e chanfros suaves -> zero artefactos de pillow-shading.
- Remoção de vértices duplicados via `bmesh`, contagens de segmentos eficientes, exportação GLB sem UVs/tangentes supérfluas.
- Metadados JSON minificados com pivôs exatos (`groupPivots`) e dobradiças (`hinge`) para orelhas e bigodes.

Uso: npm run logo3d:build
"""
import bpy
import bmesh
import math
import os
import json

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
OUT_GLB = os.path.join(REPO, "public", "models", "valedalvaro-logo-3d.glb")
OUT_META = os.path.join(REPO, "public", "models", "valedalvaro-logo-3d.json")
OUT_PREVIEW = os.path.join(HERE, "valedalvaro-logo-3d-preview.png")

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def srgb_to_linear(hex_color: str):
    hex_color = hex_color.lstrip("#")
    r, g, b = (int(hex_color[i : i + 2], 16) / 255.0 for i in (0, 2, 4))

    def conv(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

    return (conv(r), conv(g), conv(b), 1.0)


def make_material(name, hex_color, roughness=0.28, metallic=0.0, coat=0.55):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = srgb_to_linear(hex_color)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if "Coat Weight" in bsdf.inputs:
        bsdf.inputs["Coat Weight"].default_value = coat
        bsdf.inputs["Coat Roughness"].default_value = 0.18
    return mat


MAT_AZULEJO = make_material("Azulejo Azul", "#1e4d7b", roughness=0.24, metallic=0.04, coat=0.55)
MAT_AZULEJO_DEEP = make_material("Azulejo Profundo", "#133556", roughness=0.28, metallic=0.05, coat=0.5)
MAT_GOLD = make_material("Ouro Mel", "#df9a38", roughness=0.28, metallic=0.38, coat=0.45)
MAT_HONEY = make_material("Mel Quente", "#c67822", roughness=0.30, metallic=0.22, coat=0.4)
MAT_SUN = make_material("Sol Montesinho", "#f2c361", roughness=0.24, metallic=0.32, coat=0.45)
MAT_PORCELAIN = make_material("Porcelana Creme", "#fdfaf3", roughness=0.22, metallic=0.02, coat=0.55)
MAT_CREAM_SOFT = make_material("Creme Suave", "#f2e7d3", roughness=0.28, metallic=0.02, coat=0.4)
MAT_SLATE = make_material("Ardosia", "#18232e", roughness=0.32, metallic=0.05, coat=0.35)

PIECES_META = {}
GROUPS_META = {"tile": [], "vale": [], "dog": [], "cat": []}


def arch_points(w, h, top_r, bot_r, segs=22):
    hw = w / 2.0
    hh = h / 2.0
    pts = []
    for i in range(segs + 1):
        a = math.pi * (i / segs)
        pts.append((hw * math.cos(a), (hh - top_r) + top_r * math.sin(a)))
    corner_segs = max(6, segs // 3)
    cx_l, cy_l = -hw + bot_r, -hh + bot_r
    for i in range(1, corner_segs + 1):
        a = math.pi + (math.pi / 2.0) * (i / corner_segs)
        pts.append((cx_l + bot_r * math.cos(a), cy_l + bot_r * math.sin(a)))
    cx_r, cy_r = hw - bot_r, -hh + bot_r
    for i in range(corner_segs + 1):
        a = 1.5 * math.pi + (math.pi / 2.0) * (i / corner_segs)
        pts.append((cx_r + bot_r * math.cos(a), cy_r + bot_r * math.sin(a)))
    return pts


def ellipse_points(cx, cy, rx, ry, segs=22, rot=0.0):
    cr, sr = math.cos(rot), math.sin(rot)
    pts = []
    for i in range(segs):
        a = 2.0 * math.pi * i / segs
        lx, ly = rx * math.cos(a), ry * math.sin(a)
        pts.append((cx + lx * cr - ly * sr, cy + lx * sr + ly * cr))
    return pts


def cubic_bezier(p0, p1, p2, p3, steps=10):
    pts = []
    for i in range(steps + 1):
        t = i / steps
        u = 1 - t
        x = u**3 * p0[0] + 3 * u**2 * t * p1[0] + 3 * u * t**2 * p2[0] + t**3 * p3[0]
        y = u**3 * p0[1] + 3 * u**2 * t * p1[1] + 3 * u * t**2 * p2[1] + t**3 * p3[1]
        pts.append((x, y))
    return pts


def stroke_arc(points, half_w=0.018):
    """Espessura limpa ao longo de uma polilinha aberta (para sorrisos e bigodes)."""
    left, right = [], []
    n = len(points)
    for i, (x, y) in enumerate(points):
        if i == 0:
            dx, dy = points[1][0] - x, points[1][1] - y
        elif i == n - 1:
            dx, dy = x - points[i - 1][0], y - points[i - 1][1]
        else:
            dx, dy = points[i + 1][0] - points[i - 1][0], points[i + 1][1] - points[i - 1][1]
        ln = math.hypot(dx, dy) or 1e-6
        nx, ny = -dy / ln * half_w, dx / ln * half_w
        left.append((x + nx, y + ny))
        right.append((x - nx, y - ny))
    return left + list(reversed(right))


def rounded_poly(points, radius=0.05, segs=3):
    n = len(points)
    out = []
    for i in range(n):
        p0 = points[(i - 1) % n]
        p1 = points[i]
        p2 = points[(i + 1) % n]
        v1 = (p0[0] - p1[0], p0[1] - p1[1])
        v2 = (p2[0] - p1[0], p2[1] - p1[1])
        l1 = math.hypot(*v1) or 1e-6
        l2 = math.hypot(*v2) or 1e-6
        r = min(radius, l1 * 0.42, l2 * 0.42)
        a = (p1[0] + v1[0] / l1 * r, p1[1] + v1[1] / l1 * r)
        b = (p1[0] + v2[0] / l2 * r, p1[1] + v2[1] / l2 * r)
        for s in range(segs + 1):
            t = s / segs
            u = 1 - t
            out.append(
                (
                    u * u * a[0] + 2 * u * t * p1[0] + t * t * b[0],
                    u * u * a[1] + 2 * u * t * p1[1] + t * t * b[1],
                )
            )
    return out


def sample_outline(pts, max_pts=24):
    if len(pts) <= max_pts:
        return [[round(x, 3), round(y, 3)] for x, y in pts]
    step = len(pts) / max_pts
    return [[round(pts[int(i * step)][0], 3), round(pts[int(i * step)][1], 3)] for i in range(max_pts)]


def add_extruded(
    piece_id,
    group_id,
    role,
    loops,
    z_bot,
    z_top,
    material,
    bevel=0.016,
    bevel_res=2,
    include_outline=False,
    outline_pts=24,
    hinge=None,
):
    """Extrude uma curva 2D com altura exata `[z_bot, z_top]` (já incluindo `bevel`)."""
    total_thick = max(0.01, z_top - z_bot)
    safe_bevel = min(bevel, total_thick * 0.42)
    extrude_half = max(0.001, (total_thick - 2.0 * safe_bevel) / 2.0)
    cz = (z_bot + z_top) / 2.0

    curve = bpy.data.curves.new(name=piece_id + "_curve", type="CURVE")
    curve.dimensions = "2D"
    curve.fill_mode = "BOTH"
    curve.extrude = extrude_half
    curve.bevel_depth = safe_bevel
    curve.bevel_resolution = bevel_res

    for loop in loops:
        # Remove pontos consecutivos idênticos para evitar faces degeneradas
        cleaned = []
        for x, y in loop:
            if not cleaned or math.hypot(x - cleaned[-1][0], y - cleaned[-1][1]) > 1e-4:
                cleaned.append((x, y))
        if len(cleaned) > 2 and math.hypot(cleaned[0][0] - cleaned[-1][0], cleaned[0][1] - cleaned[-1][1]) < 1e-4:
            cleaned.pop()
        spline = curve.splines.new("POLY")
        spline.points.add(len(cleaned) - 1)
        for idx, (x, y) in enumerate(cleaned):
            spline.points[idx].co = (x, y, 0.0, 1.0)
        spline.use_cyclic_u = True

    obj = bpy.data.objects.new(piece_id, curve)
    scene.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.convert(target="MESH")
    obj = bpy.context.active_object
    obj.name = piece_id

    # Fundir vértices duplicados e recalcular normais consistentes
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=2e-4)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(obj.data)
    bm.free()

    xs = [v.co.x for v in obj.data.vertices]
    ys = [v.co.y for v in obj.data.vertices]
    zs = [v.co.z for v in obj.data.vertices]
    cx = (min(xs) + max(xs)) / 2.0
    cy = (min(ys) + max(ys)) / 2.0

    for v in obj.data.vertices:
        v.co.x -= cx
        v.co.y -= cy
    obj.location = (cx, cy, cz)
    obj.data.materials.append(material)

    # Tampas planas (frente e verso) com sombreamento plano perfeito; chanfros suaves!
    # Isso elimina por completo o efeito de "almofada/mancha" nas faces planas.
    obj.data.update()
    for poly in obj.data.polygons:
        poly.use_smooth = abs(poly.normal.z) <= 0.985

    obj.select_set(False)

    actual_z_top = round(cz + max(zs), 4)
    box = [round(min(xs), 4), round(min(ys), 4), round(max(xs), 4), round(max(ys), 4)]
    entry = {
        "id": piece_id,
        "group": group_id,
        "role": role,
        "center": [round(cx, 4), round(cy, 4), round(cz, 4)],
        "zTop": actual_z_top,
        "box": box,
    }
    if include_outline:
        entry["outline"] = sample_outline(loops[0], max_pts=outline_pts)
    if hinge is not None:
        entry["hinge"] = [round(hinge[0], 4), round(hinge[1], 4)]

    PIECES_META[piece_id] = entry
    GROUPS_META[group_id].append(piece_id)
    return obj


# ---------------------------------------------------------------------------
# 1. GRUPO `tile` — Arco Azulejo de Bragança + Filete Dourado + Cruz Vet
# ---------------------------------------------------------------------------
outer_arch = arch_points(2.68, 2.94, top_r=1.22, bot_r=0.44, segs=22)
add_extruded(
    "tile-body",
    "tile",
    "body",
    [outer_arch],
    z_bot=0.000,
    z_top=0.220,
    material=MAT_AZULEJO,
    bevel=0.036,
    bevel_res=2,
    include_outline=True,
    outline_pts=28,
)

rim_outer = arch_points(2.44, 2.70, top_r=1.10, bot_r=0.35, segs=22)
rim_inner = arch_points(2.30, 2.56, top_r=1.03, bot_r=0.29, segs=22)
add_extruded(
    "tile-rim",
    "tile",
    "rim",
    [rim_outer, list(reversed(rim_inner))],
    z_bot=0.198,
    z_top=0.282,
    material=MAT_GOLD,
    bevel=0.012,
    bevel_res=2,
)

# Cruz veterinária centrada no topo, com folga limpa para o arco e para o sol
cw, cl = 0.064, 0.182
cy_cross = 0.995
cross_poly = rounded_poly(
    [
        (-cw, cy_cross + cl),
        (cw, cy_cross + cl),
        (cw, cy_cross + cw),
        (cl, cy_cross + cw),
        (cl, cy_cross - cw),
        (cw, cy_cross - cw),
        (cw, cy_cross - cl),
        (-cw, cy_cross - cl),
        (-cw, cy_cross - cw),
        (-cl, cy_cross - cw),
        (-cl, cy_cross + cw),
        (-cw, cy_cross + cw),
    ],
    radius=0.020,
    segs=2,
)
add_extruded(
    "tile-cross",
    "tile",
    "cross",
    [cross_poly],
    z_bot=0.204,
    z_top=0.304,
    material=MAT_PORCELAIN,
    bevel=0.012,
    bevel_res=2,
)

# ---------------------------------------------------------------------------
# 2. GRUPO `vale` — Sol quente e Encostas encaixadas no arco inferior (em «V»)
# ---------------------------------------------------------------------------
sun_pts = ellipse_points(0.0, 0.48, 0.215, 0.215, segs=24)
add_extruded(
    "vale-sun",
    "vale",
    "sun",
    [sun_pts],
    z_bot=0.204,
    z_top=0.296,
    material=MAT_SUN,
    bevel=0.014,
    bevel_res=2,
)

# Curva inferior interna alinhada com o interior real de `tile-rim` (encaixe sem fresta!)
hw_i, hh_i, br_i = 1.142, 1.272, 0.282
corner_n = 7
bot_left_arc = [
    (
        -hw_i + br_i + br_i * math.cos(math.pi + (math.pi / 2.0) * (i / corner_n)),
        -hh_i + br_i + br_i * math.sin(math.pi + (math.pi / 2.0) * (i / corner_n)),
    )
    for i in range(corner_n + 1)
]
bot_right_arc = [
    (
        hw_i - br_i + br_i * math.cos(1.5 * math.pi + (math.pi / 2.0) * (i / corner_n)),
        -hh_i + br_i + br_i * math.sin(1.5 * math.pi + (math.pi / 2.0) * (i / corner_n)),
    )
    for i in range(corner_n + 1)
]

# Encosta esquerda: desce em «V» com folga confortável sob o cão
ridge_l = cubic_bezier((-hw_i, -0.52), (-0.58, -0.44), (-0.18, -0.66), (0.28, -1.04), steps=12)
hill_l = ridge_l + [(0.22, -hh_i)] + list(reversed(bot_left_arc))
add_extruded(
    "vale-hill-left",
    "vale",
    "hill-left",
    [hill_l],
    z_bot=0.204,
    z_top=0.272,
    material=MAT_HONEY,
    bevel=0.010,
    bevel_res=2,
    include_outline=True,
    outline_pts=22,
)

# Encosta direita: sobe à direita em «V» com relevo ligeiramente à frente da esquerda
ridge_r = cubic_bezier((-0.32, -hh_i), (0.08, -0.74), (0.58, -0.45), (hw_i, -0.54), steps=12)
hill_r = ridge_r + list(reversed(bot_right_arc))
add_extruded(
    "vale-hill-right",
    "vale",
    "hill-right",
    [hill_r],
    z_bot=0.224,
    z_top=0.302,
    material=MAT_GOLD,
    bevel=0.010,
    bevel_res=2,
    include_outline=True,
    outline_pts=22,
)

# ---------------------------------------------------------------------------
# 3. GRUPO `dog` — Cão simpático à esquerda (orelhas articuladas + focinho + sorriso)
# ---------------------------------------------------------------------------
dx, dy = -0.50, -0.04

ear_l = (
    cubic_bezier((dx - 0.14, dy + 0.25), (dx - 0.34, dy + 0.22), (dx - 0.41, dy - 0.03), (dx - 0.33, dy - 0.21), 8)
    + cubic_bezier((dx - 0.33, dy - 0.21), (dx - 0.25, dy - 0.28), (dx - 0.14, dy - 0.19), (dx - 0.13, dy - 0.01), 7)[1:]
)
ear_r = [((2 * dx) - x, y) for x, y in reversed(ear_l)]

add_extruded(
    "dog-ear-l",
    "dog",
    "ear-l",
    [ear_l],
    z_bot=0.288,
    z_top=0.392,
    material=MAT_HONEY,
    bevel=0.015,
    bevel_res=2,
    hinge=(dx - 0.16, dy + 0.21),
)
add_extruded(
    "dog-ear-r",
    "dog",
    "ear-r",
    [ear_r],
    z_bot=0.288,
    z_top=0.392,
    material=MAT_HONEY,
    bevel=0.015,
    bevel_res=2,
    hinge=(dx + 0.16, dy + 0.21),
)

dog_head = (
    cubic_bezier((dx, dy + 0.30), (dx + 0.20, dy + 0.30), (dx + 0.27, dy + 0.14), (dx + 0.26, dy - 0.04), 8)
    + cubic_bezier((dx + 0.26, dy - 0.04), (dx + 0.26, dy - 0.21), (dx + 0.15, dy - 0.295), (dx, dy - 0.295), 8)[1:]
    + cubic_bezier((dx, dy - 0.295), (dx - 0.15, dy - 0.295), (dx - 0.26, dy - 0.21), (dx - 0.26, dy - 0.04), 8)[1:]
    + cubic_bezier((dx - 0.26, dy - 0.04), (dx - 0.27, dy + 0.14), (dx - 0.20, dy + 0.30), (dx, dy + 0.30), 8)[1:]
)
add_extruded(
    "dog-head",
    "dog",
    "head",
    [dog_head],
    z_bot=0.312,
    z_top=0.436,
    material=MAT_PORCELAIN,
    bevel=0.024,
    bevel_res=2,
    include_outline=True,
    outline_pts=22,
)

dog_snout = ellipse_points(dx, dy - 0.105, 0.158, 0.128, segs=18)
add_extruded(
    "dog-snout",
    "dog",
    "snout",
    [dog_snout],
    z_bot=0.422,
    z_top=0.472,
    material=MAT_CREAM_SOFT,
    bevel=0.010,
    bevel_res=1,
)

add_extruded(
    "dog-eye-l",
    "dog",
    "eye-l",
    [ellipse_points(dx - 0.098, dy + 0.072, 0.034, 0.044, segs=14)],
    z_bot=0.426,
    z_top=0.482,
    material=MAT_SLATE,
    bevel=0.008,
    bevel_res=1,
)
add_extruded(
    "dog-eye-r",
    "dog",
    "eye-r",
    [ellipse_points(dx + 0.098, dy + 0.072, 0.034, 0.044, segs=14)],
    z_bot=0.426,
    z_top=0.482,
    material=MAT_SLATE,
    bevel=0.008,
    bevel_res=1,
)

dog_nose = rounded_poly([(dx - 0.066, dy - 0.026), (dx + 0.066, dy - 0.026), (dx, dy - 0.102)], radius=0.024, segs=3)
add_extruded(
    "dog-muzzle",
    "dog",
    "muzzle",
    [dog_nose],
    z_bot=0.462,
    z_top=0.514,
    material=MAT_SLATE,
    bevel=0.009,
    bevel_res=1,
)

smile_pts = cubic_bezier((dx - 0.088, dy - 0.146), (dx - 0.04, dy - 0.200), (dx + 0.04, dy - 0.200), (dx + 0.088, dy - 0.146), steps=8)
add_extruded(
    "dog-smile",
    "dog",
    "smile",
    [stroke_arc(smile_pts, half_w=0.015)],
    z_bot=0.464,
    z_top=0.498,
    material=MAT_SLATE,
    bevel=0.005,
    bevel_res=1,
)

# ---------------------------------------------------------------------------
# 4. GRUPO `cat` — Gato acolhedor à direita (simétrico, sem tocar no sol)
# ---------------------------------------------------------------------------
cx, cy = 0.50, -0.05

cat_ear_l = rounded_poly([(cx - 0.245, cy + 0.04), (cx - 0.24, cy + 0.335), (cx - 0.035, cy + 0.19)], radius=0.038, segs=3)
cat_ear_r = rounded_poly([(cx + 0.035, cy + 0.19), (cx + 0.24, cy + 0.335), (cx + 0.245, cy + 0.04)], radius=0.038, segs=3)
add_extruded(
    "cat-ear-l",
    "cat",
    "ear-l",
    [cat_ear_l],
    z_bot=0.302,
    z_top=0.412,
    material=MAT_PORCELAIN,
    bevel=0.015,
    bevel_res=2,
)
add_extruded(
    "cat-ear-r",
    "cat",
    "ear-r",
    [cat_ear_r],
    z_bot=0.302,
    z_top=0.412,
    material=MAT_PORCELAIN,
    bevel=0.015,
    bevel_res=2,
)

# Interior dourado das orelhas posicionado claramente acima da borda da cabeça
in_ear_l = rounded_poly([(cx - 0.205, cy + 0.148), (cx - 0.205, cy + 0.272), (cx - 0.098, cy + 0.195)], radius=0.018, segs=2)
in_ear_r = rounded_poly([(cx + 0.098, cy + 0.195), (cx + 0.205, cy + 0.272), (cx + 0.205, cy + 0.148)], radius=0.018, segs=2)
add_extruded(
    "cat-ear-in-l",
    "cat",
    "ear-in-l",
    [in_ear_l],
    z_bot=0.402,
    z_top=0.446,
    material=MAT_GOLD,
    bevel=0.007,
    bevel_res=1,
)
add_extruded(
    "cat-ear-in-r",
    "cat",
    "ear-in-r",
    [in_ear_r],
    z_bot=0.402,
    z_top=0.446,
    material=MAT_GOLD,
    bevel=0.007,
    bevel_res=1,
)

cat_head_pts = ellipse_points(cx, cy, 0.275, 0.242, segs=22)
add_extruded(
    "cat-head",
    "cat",
    "head",
    [cat_head_pts],
    z_bot=0.314,
    z_top=0.440,
    material=MAT_PORCELAIN,
    bevel=0.024,
    bevel_res=2,
    include_outline=True,
    outline_pts=22,
)

add_extruded(
    "cat-eye-l",
    "cat",
    "eye-l",
    [ellipse_points(cx - 0.092, cy + 0.036, 0.033, 0.043, segs=14)],
    z_bot=0.430,
    z_top=0.484,
    material=MAT_SLATE,
    bevel=0.008,
    bevel_res=1,
)
add_extruded(
    "cat-eye-r",
    "cat",
    "eye-r",
    [ellipse_points(cx + 0.092, cy + 0.036, 0.033, 0.043, segs=14)],
    z_bot=0.430,
    z_top=0.484,
    material=MAT_SLATE,
    bevel=0.008,
    bevel_res=1,
)

cat_nose = rounded_poly([(cx - 0.046, cy - 0.024), (cx + 0.046, cy - 0.024), (cx, cy - 0.080)], radius=0.016, segs=2)
add_extruded(
    "cat-muzzle",
    "cat",
    "muzzle",
    [cat_nose],
    z_bot=0.432,
    z_top=0.488,
    material=MAT_HONEY,
    bevel=0.008,
    bevel_res=1,
)

# Bigodes dourados nítidos, saindo por trás do chanfro da bochecha sem marcar a face
add_extruded(
    "cat-whisker-l1",
    "cat",
    "whisker-l",
    [stroke_arc([(cx - 0.235, cy - 0.018), (cx - 0.368, cy + 0.004)], 0.0105)],
    z_bot=0.360,
    z_top=0.402,
    material=MAT_GOLD,
    bevel=0.005,
    bevel_res=1,
    hinge=(cx - 0.255, cy - 0.015),
)
add_extruded(
    "cat-whisker-l2",
    "cat",
    "whisker-l",
    [stroke_arc([(cx - 0.232, cy - 0.070), (cx - 0.362, cy - 0.100)], 0.0105)],
    z_bot=0.360,
    z_top=0.402,
    material=MAT_GOLD,
    bevel=0.005,
    bevel_res=1,
    hinge=(cx - 0.250, cy - 0.074),
)
add_extruded(
    "cat-whisker-r1",
    "cat",
    "whisker-r",
    [stroke_arc([(cx + 0.235, cy - 0.018), (cx + 0.368, cy + 0.004)], 0.0105)],
    z_bot=0.360,
    z_top=0.402,
    material=MAT_GOLD,
    bevel=0.005,
    bevel_res=1,
    hinge=(cx + 0.255, cy - 0.015),
)
add_extruded(
    "cat-whisker-r2",
    "cat",
    "whisker-r",
    [stroke_arc([(cx + 0.232, cy - 0.070), (cx + 0.362, cy - 0.100)], 0.0105)],
    z_bot=0.360,
    z_top=0.402,
    material=MAT_GOLD,
    bevel=0.005,
    bevel_res=1,
    hinge=(cx + 0.250, cy - 0.074),
)

# ---------------------------------------------------------------------------
# Exportação GLB + JSON minificado
# ---------------------------------------------------------------------------
all_boxes = [p["box"] for p in PIECES_META.values()]
bounds = [
    round(min(b[0] for b in all_boxes), 4),
    round(min(b[1] for b in all_boxes), 4),
    round(max(b[2] for b in all_boxes), 4),
    round(max(b[3] for b in all_boxes), 4),
]
relief_top = round(max(p["zTop"] for p in PIECES_META.values()), 4)

meta = {
    "version": 3,
    "bounds": bounds,
    "reliefTop": relief_top,
    "groupPivots": {
        "tile": [0.0, 0.0],
        "vale": [0.0, -0.42],
        "dog": [dx, dy],
        "cat": [cx, cy],
    },
    "groups": GROUPS_META,
    "pieces": PIECES_META,
}
with open(OUT_META, "w", encoding="utf-8") as f:
    json.dump(meta, f, ensure_ascii=False, separators=(",", ":"))

bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=False,
    export_materials="EXPORT",
    export_texcoords=False,
    export_tangents=False,
    export_normals=True,
    export_yup=False,
)

# ---------------------------------------------------------------------------
# Render de controlo visual (PNG)
# ---------------------------------------------------------------------------
cam_data = bpy.data.cameras.new("Cam")
cam_obj = bpy.data.objects.new("Cam", cam_data)
scene.collection.objects.link(cam_obj)
cam_obj.location = (0.0, -0.05, 6.2)
cam_obj.rotation_euler = (0.01, 0.0, 0.0)
scene.camera = cam_obj

key_data = bpy.data.lights.new("Key", type="AREA")
key_data.energy = 240
key_data.size = 4.5
key_obj = bpy.data.objects.new("Key", key_data)
scene.collection.objects.link(key_obj)
key_obj.location = (-2.6, 3.2, 5.2)
key_obj.rotation_euler = (0.55, -0.45, 0.0)

fill_data = bpy.data.lights.new("Fill", type="AREA")
fill_data.energy = 115
fill_data.size = 5.5
fill_obj = bpy.data.objects.new("Fill", fill_data)
scene.collection.objects.link(fill_obj)
fill_obj.location = (3.0, -2.0, 4.8)
fill_obj.rotation_euler = (-0.35, 0.5, 0.0)

world = bpy.data.worlds.new("World")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes.get("Background")
bg.inputs["Color"].default_value = srgb_to_linear("#f6f2ea")
bg.inputs["Strength"].default_value = 0.88

scene.render.engine = (
    "BLENDER_EEVEE_NEXT"
    if "BLENDER_EEVEE_NEXT" in bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items
    else "BLENDER_EEVEE"
)
scene.render.resolution_x = 640
scene.render.resolution_y = 640
scene.render.filepath = OUT_PREVIEW
bpy.ops.render.render(write_still=True)
print("OK:", OUT_GLB, OUT_META)
