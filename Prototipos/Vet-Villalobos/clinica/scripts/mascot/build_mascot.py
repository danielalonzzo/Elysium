"""Construye en Blender la mascota 3D de Veterinaria Villalobos: un Maine Coon gris.

Hasta octubre de 2026 la mascota era el border collie de Pura Vida Pets. El
rediseño premium de Villalobos la cambió por el gato del panel rojo de su logo:
un Maine Coon atigrado plata, con las orejas de mechón de lince, la gorguera,
las «calzas» y la cola larga y tupida de la raza. Vive sobre el botón de
atención directa de la web, que es su planeta (ver `src/ui/mascotEngine.js`).

Todo el modelo sale de este archivo. El .blend que se guarda al final es una
salida más, para abrirlo y mirarlo, y se regenera en cada ejecución.

El proceso:

1. El cuerpo es un conjunto de metaballs (cabeza, carrillos, almohadillas de
   los bigotes, gorguera, torso, vientre, grupa, calzas, patas y cuatro tramos
   de cola) que se funden en una sola superficie y se convierten en malla.
2. Los pesos del esqueleto se derivan del mismo campo de las metaballs: cada
   elemento pertenece a un hueso, y el peso de un vértice es la parte del campo
   que aporta cada hueso en ese punto.
3. El color va por vértice y se pinta por regiones: el gris plata de la capa,
   las rayas caballa del lomo y de las patas, la «M» de la frente, los anillos
   de la cola, y el blanco roto de hocico, barbilla, pechera y vientre.
4. Orejas (con su mechón), ojos ámbar de pupila vertical, nariz y lengua son
   piezas aparte, rígidas, cada una atada a su hueso. La lengua vive dentro de
   la boca y solo asoma al beber y al asearse.
5. El contorno negro es un casco invertido, como el trazo de un dibujo. Solo
   existe en el .blend: la web lo dibuja en el sombreador.
6. Cada animación se calcula fotograma a fotograma con una función y se graba
   como acción. Así los ciclos cierran exactos y cada gesto es un par de líneas.
   Son gestos de gato: parpadeo lento, asearse, perseguirse la cola, acecho y
   salto, estirarse; nada de necesidades a la vista.
7. La utilería (los dos platos) va en el mismo GLB, en el origen; la web la
   coloca y la muestra cuando toca.

Uso, desde la carpeta de la app:

  npm run mascot:build                     exporta el GLB y guarda el .blend
  npm run mascot:build -- --preview DIR    además deja renders de control en DIR

Requiere Blender 4.3 o posterior.
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
GLB_OUT = os.path.join(REPO, 'public', 'mascot', 'villalobos-coon.glb')
BLEND_OUT = os.path.join(HERE, 'villalobos-coon.blend')

FPS = 24
TAU = math.tau


def cli_preview_dir():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if '--preview' in argv:
        return os.path.abspath(argv[argv.index('--preview') + 1])
    return None


# ── Paleta ────────────────────────────────────────────────────────────────────
# Plata atigrado: gris frío con rayas grafito, y blanco roto donde el Maine Coon
# plata aclara. Los platos llevan el rojo y el grafito de los paneles del logo.

def hex_rgba(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


COAT = hex_rgba('#8E9198')
STRIPE = hex_rgba('#585B63')
PALE = hex_rgba('#BEC0C5')
LIGHT = hex_rgba('#E9E7E3')
EAR_PINK = hex_rgba('#D1A3A6')
NOSE = hex_rgba('#C9858C')
TONGUE = hex_rgba('#DB8492')
# Ámbar dorado: con la capa gris es el contraste que más se lee a este tamaño.
EYE = hex_rgba('#D4A532')
PUPIL = hex_rgba('#141316')
BLACK = hex_rgba('#141316')
SHINE = hex_rgba('#FFFFFF')
BOWL = hex_rgba('#B60000')
BOWL_DARK = hex_rgba('#6E0000')
KIBBLE = hex_rgba('#8A4A1C')
WATER_BOWL = hex_rgba('#555559')
WATER = hex_rgba('#A9D9F0')

OUTLINE = 0.016          # grosor del trazo, en unidades de escena (el gato mide ~1)
OUTLINE_PROPS = 0.010


# ── Escena ────────────────────────────────────────────────────────────────────

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 0
    world = bpy.data.worlds.new('World')
    world.color = (0.96, 0.94, 0.92)
    scene.world = world
    return scene


def link(obj):
    bpy.context.scene.collection.objects.link(obj)
    return obj


def activate(obj):
    for other in bpy.context.view_layer.objects:
        other.select_set(False)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)


def make_material(name, color, backface=True, vertex_color=True):
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes['Principled BSDF']
    bsdf.inputs['Base Color'].default_value = color
    bsdf.inputs['Roughness'].default_value = 1.0
    if vertex_color:
        attr = mat.node_tree.nodes.new('ShaderNodeVertexColor')
        attr.layer_name = 'Col'
        mat.node_tree.links.new(attr.outputs['Color'], bsdf.inputs['Base Color'])
    mat.use_backface_culling = backface
    mat.diffuse_color = color
    return mat


# ── Mallas auxiliares ─────────────────────────────────────────────────────────

def mesh_from_bmesh(name, bm, material, color, bone=None):
    """Crea un objeto de malla con un color por vértice y, si se da, un hueso rígido."""
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for poly in me.polygons:
        poly.use_smooth = True
    obj = link(bpy.data.objects.new(name, me))
    me.materials.append(material)
    paint(obj, lambda _co: color)
    if bone:
        group = obj.vertex_groups.new(name=bone)
        group.add(list(range(len(me.vertices))), 1.0, 'REPLACE')
    return obj


def paint(obj, color_fn):
    me = obj.data
    attr = me.color_attributes.get('Col') or me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
    for i, vert in enumerate(me.vertices):
        attr.data[i].color_srgb = color_fn(vert.co)
    me.color_attributes.active_color = attr
    me.color_attributes.render_color_index = me.color_attributes.active_color_index


def ellipsoid(radii, matrix=Matrix(), segments=(16, 10)):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=segments[0], v_segments=segments[1], radius=1.0)
    bmesh.ops.scale(bm, vec=Vector(radii), verts=bm.verts)
    bmesh.ops.transform(bm, matrix=matrix, verts=bm.verts)
    return bm


def lathe(profile, segments=28, closed=False):
    """Revoluciona un perfil (radio, altura) alrededor de Z."""
    bm = bmesh.new()
    rings = []
    for radius, height in profile:
        ring = []
        for s in range(segments):
            angle = TAU * s / segments
            ring.append(bm.verts.new((max(radius, 1e-4) * math.cos(angle), max(radius, 1e-4) * math.sin(angle), height)))
        rings.append(ring)
    pairs = list(zip(rings, rings[1:]))
    if closed:
        pairs.append((rings[-1], rings[0]))
    for lower, upper in pairs:
        for s in range(segments):
            t = (s + 1) % segments
            bm.faces.new((lower[s], lower[t], upper[t], upper[s]))
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def frame_along(origin, direction):
    """Matriz con Z sobre `direction` y X lo más cerca posible del X del mundo."""
    z = Vector(direction).normalized()
    x = Vector((1, 0, 0))
    x = (x - z * x.dot(z)).normalized()
    y = z.cross(x)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = Vector(origin)
    return m


def join(objects, name):
    activate(objects[0])
    for obj in objects[1:]:
        obj.select_set(True)
    bpy.ops.object.join()
    joined = bpy.context.active_object
    joined.name = name
    joined.data.name = name
    return joined


def outline_shell(obj, thickness, material):
    """Casco invertido: la copia inflada y con las caras vueltas hacia dentro.

    Solo existe en el .blend y en los renders de control: la web dibuja el mismo
    trazo en el sombreador reutilizando la geometría.
    """
    shell = obj.copy()
    shell.data = obj.data.copy()
    shell.name = shell.data.name = f'{obj.name}_outline'
    link(shell)
    bm = bmesh.new()
    bm.from_mesh(shell.data)
    bm.normal_update()
    offsets = [v.normal.copy() * thickness for v in bm.verts]
    for vert, offset in zip(bm.verts, offsets):
        vert.co += offset
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(shell.data)
    bm.free()
    shell.data.materials.clear()
    shell.data.materials.append(material)
    for poly in shell.data.polygons:
        poly.material_index = 0
    paint(shell, lambda _co: BLACK)
    return shell


# ── Cuerpo por metaballs ──────────────────────────────────────────────────────
#
# (nombre, centro, semiejes visibles, rotación en grados, rigidez, hueso)
# El gato mira hacia -Y con Z arriba; el suelo es z = 0.

THRESHOLD = 0.6
HEAD_CENTER = Vector((0, -0.36, 0.70))
TAIL_BASE = Vector((0, 0.37, 0.42))

BLOBS = [
    ('head', tuple(HEAD_CENTER), (0.21, 0.195, 0.18), (0, 0, 0), 4, 'head'),
    # Los carrillos anchos y peludos del Maine Coon enmarcan la cara.
    ('cheek_L', (0.118, -0.42, 0.64), (0.1, 0.09, 0.08), (0, 0, 0), 4, 'head'),
    ('cheek_R', (-0.118, -0.42, 0.64), (0.1, 0.09, 0.08), (0, 0, 0), 4, 'head'),
    # Hocico corto y cuadrado: dos almohadillas de bigotes y la barbilla.
    ('pad_L', (0.038, -0.528, 0.624), (0.046, 0.042, 0.038), (0, 0, 0), 4, 'head'),
    ('pad_R', (-0.038, -0.528, 0.624), (0.046, 0.042, 0.038), (0, 0, 0), 4, 'head'),
    ('chin', (0, -0.5, 0.588), (0.036, 0.032, 0.024), (0, 0, 0), 4, 'head'),
    ('neck', (0, -0.23, 0.55), (0.13, 0.11, 0.13), (0, 0, 0), 4, 'neck'),
    # La gorguera: la melena del pecho y los lados del cuello.
    ('ruff', (0, -0.27, 0.465), (0.17, 0.13, 0.175), (0, 0, 0), 4, 'chest'),
    ('ruff_L', (0.13, -0.25, 0.52), (0.09, 0.09, 0.115), (0, 0, 0), 4, 'neck'),
    ('ruff_R', (-0.13, -0.25, 0.52), (0.09, 0.09, 0.115), (0, 0, 0), 4, 'neck'),
    ('torso', (0, -0.02, 0.40), (0.155, 0.25, 0.15), (0, 0, 0), 4, 'chest'),
    ('belly', (0, 0.03, 0.305), (0.12, 0.2, 0.075), (0, 0, 0), 4, 'chest'),
    ('rump', (0, 0.24, 0.40), (0.16, 0.18, 0.155), (0, 0, 0), 4, 'hips'),
    # La cola, larga y tupida, sube hacia atrás en reposo.
    ('tail_1', (0, 0.42, 0.47), (0.07, 0.07, 0.085), (-45, 0, 0), 3, 'tail_1'),
    ('tail_2', (0, 0.495, 0.565), (0.08, 0.08, 0.095), (-35, 0, 0), 3, 'tail_2'),
    ('tail_3', (0, 0.55, 0.68), (0.083, 0.083, 0.10), (-20, 0, 0), 3, 'tail_3'),
    ('tail_4', (0, 0.575, 0.80), (0.074, 0.074, 0.088), (-8, 0, 0), 3, 'tail_4'),
]

for side, sx in (('L', 1), ('R', -1)):
    BLOBS += [
        (f'leg_F{side}_upper', (0.085 * sx, -0.15, 0.26), (0.05, 0.055, 0.11), (0, 0, 0), 5, f'leg_F{side}_upper'),
        (f'leg_F{side}_lower', (0.085 * sx, -0.165, 0.125), (0.042, 0.046, 0.08), (0, 0, 0), 5, f'leg_F{side}_lower'),
        (f'paw_F{side}', (0.09 * sx, -0.195, 0.036), (0.058, 0.072, 0.036), (0, 0, 0), 5, f'paw_F{side}'),
        (f'leg_H{side}_upper', (0.10 * sx, 0.25, 0.28), (0.066, 0.088, 0.12), (0, 0, 0), 5, f'leg_H{side}_upper'),
        # Las calzas: el pelo largo de detrás de los muslos.
        (f'britches_{side}', (0.10 * sx, 0.31, 0.26), (0.058, 0.066, 0.09), (0, 0, 0), 5, f'leg_H{side}_upper'),
        (f'leg_H{side}_lower', (0.10 * sx, 0.285, 0.125), (0.042, 0.046, 0.085), (0, 0, 0), 5, f'leg_H{side}_lower'),
        (f'paw_H{side}', (0.105 * sx, 0.235, 0.036), (0.058, 0.072, 0.036), (0, 0, 0), 5, f'paw_H{side}'),
    ]


def reach(stiffness):
    """Fracción del radio de influencia a la que el campo de un elemento solo vale el umbral."""
    return math.sqrt(1 - (THRESHOLD / stiffness) ** (1 / 3))


def blob_field(blob, point):
    _, center, radii, rot, stiffness, _ = blob
    local = Euler([math.radians(a) for a in rot]).to_matrix().inverted() @ (Vector(point) - Vector(center))
    u = Vector((local.x / radii[0], local.y / radii[1], local.z / radii[2])).length * reach(stiffness)
    return stiffness * (1 - u * u) ** 3 if u < 1 else 0.0


def build_body(material):
    mball = bpy.data.metaballs.new('Mascot_Body')
    mball.resolution = 0.014
    mball.render_resolution = 0.014
    mball.threshold = THRESHOLD
    obj = link(bpy.data.objects.new('Mascot_Body', mball))
    for _, center, radii, rot, stiffness, _ in BLOBS:
        element = mball.elements.new(type='ELLIPSOID')
        element.co = center
        element.radius = 1 / reach(stiffness)
        element.stiffness = stiffness
        element.size_x, element.size_y, element.size_z = radii
        element.rotation = Euler([math.radians(a) for a in rot]).to_quaternion()
    bpy.context.view_layer.update()
    activate(obj)
    bpy.ops.object.convert(target='MESH')
    body = bpy.context.active_object
    body.name = 'Mascot_Body'

    # Algo más denso que el collie: las rayas del atigrado necesitan vértices.
    decimate = body.modifiers.new('Decimate', 'DECIMATE')
    decimate.ratio = min(1.0, 4400 / max(1, len(body.data.polygons)))
    bpy.ops.object.modifier_apply(modifier=decimate.name)

    body.data.materials.clear()
    body.data.materials.append(material)
    for poly in body.data.polygons:
        poly.use_smooth = True

    skin_from_field(body)
    paint(body, body_color)
    return body


def skin_from_field(obj):
    """El peso de cada hueso es la parte del campo de metaballs que aporta en el vértice."""
    groups = {}
    for vert in obj.data.vertices:
        per_bone = {}
        for blob in BLOBS:
            value = blob_field(blob, vert.co)
            if value > 0:
                per_bone[blob[5]] = per_bone.get(blob[5], 0.0) + value
        if not per_bone:
            nearest = min(BLOBS, key=lambda b: (Vector(b[1]) - vert.co).length)
            per_bone = {nearest[5]: 1.0}
        top = sorted(per_bone.items(), key=lambda kv: -kv[1])[:4]
        total = sum(v for _, v in top)
        for bone, value in top:
            if bone not in groups:
                groups[bone] = obj.vertex_groups.new(name=bone)
            groups[bone].add([vert.index], value / total, 'REPLACE')


def body_color(co):
    x, y, z = co
    ax = abs(x)
    h = co - HEAD_CENTER
    # Cola: anillos grafito a lo largo, y la punta oscura.
    if y > 0.4 and z > 0.42:
        if z > 0.83:
            return STRIPE
        along = (co - TAIL_BASE).length
        return STRIPE if math.sin(along * 34 - 1.2) > 0.45 else COAT
    # Hocico, barbilla y pechera en blanco roto.
    if y < -0.49 and z < 0.655:
        return LIGHT
    if y < -0.31 and 0.36 < z < 0.585 and ax < 0.15:
        return LIGHT
    # Cabeza: la «M» de la frente y una raya en cada carrillo.
    if z > 0.55 and y < -0.24:
        if h.z > 0.04 and h.y < -0.06:
            for cx in (0.0, 0.05, -0.05):
                if abs(x - cx - 0.12 * h.z * (1 if cx > 0 else -1 if cx < 0 else 0)) < 0.011 + 0.03 * max(0.0, h.z - 0.1):
                    return STRIPE
        if ax > 0.15 and y < -0.36 and abs(z - 0.668 + 0.32 * (ax - 0.15)) < 0.012:
            return STRIPE
        return COAT
    # Vientre y el interior de las patas, claros.
    if z < 0.27 and -0.12 < y < 0.2 and ax < 0.06:
        return LIGHT
    # Patas: barras horizontales por fuera, y los pies con mechones claros.
    if z < 0.075:
        return PALE
    if z < 0.29:
        return STRIPE if ax > 0.07 and math.sin(z * 62) > 0.62 else COAT
    # Lomo: la raya dorsal y las rayas caballa que bajan por los costados.
    if ax < 0.032 and z > 0.5:
        return STRIPE
    if -0.14 < y < 0.36 and ax > 0.05:
        wobble = 0.018 * math.sin(z * 22)
        if math.sin((y + wobble) * 38) > 0.5:
            return STRIPE
    return COAT


# ── Piezas ────────────────────────────────────────────────────────────────────

def surface_hit(body, origin, direction):
    bpy.context.view_layer.update()
    hit, location, normal, _ = body.ray_cast(Vector(origin), Vector(direction).normalized())
    if not hit:
        raise RuntimeError(f'La superficie no aparece desde {origin}')
    return location, normal


def cone(radii, keep, flat=0.55, segments=(18, 12)):
    """Un elipsoide que se afila hacia arriba hasta una punta, con la base en z ≈ 0."""
    rx, ry, rz = radii
    bm = ellipsoid(radii, segments=segments)
    for vert in bm.verts:
        u = min(1.0, max(0.0, (vert.co.z + rz) / (2 * rz)))
        vert.co.x *= 1 - (1 - keep) * u ** 0.85
        vert.co.y *= 1 - (1 - flat) * u
    bmesh.ops.translate(bm, vec=Vector((0, 0, rz * 0.82)), verts=bm.verts)
    return bm


def build_ear(side, base, toon, detail):
    """Oreja de Maine Coon: grande, alta, de punta, con el mechón de lince arriba."""
    sx = 1 if side == 'L' else -1
    placement = Matrix.Translation(base) @ Euler((math.radians(-8), math.radians(17 * sx), math.radians(-12 * sx))).to_matrix().to_4x4()
    outer = cone((0.074, 0.03, 0.10), keep=0.08)
    inner = cone((0.05, 0.016, 0.074), keep=0.1)
    bmesh.ops.translate(inner, vec=Vector((0, -0.02, 0.012)), verts=inner.verts)
    tuft = cone((0.016, 0.012, 0.045), keep=0.04, flat=0.8, segments=(10, 8))
    bmesh.ops.transform(tuft, matrix=Matrix.Translation((0, 0.002, 0.15)) @ Euler((math.radians(-6), 0, 0)).to_matrix().to_4x4(), verts=tuft.verts)
    for bm in (outer, inner, tuft):
        bmesh.ops.transform(bm, matrix=placement, verts=bm.verts)
    ear = join([mesh_from_bmesh(f'ear_{side}', outer, toon, COAT, f'ear_{side}'),
                mesh_from_bmesh(f'ear_{side}_tuft', tuft, toon, STRIPE, f'ear_{side}')], f'ear_{side}')
    lining = mesh_from_bmesh(f'ear_{side}_lining', inner, detail, EAR_PINK, f'ear_{side}')
    tip = placement @ Vector((0, 0, 0.21))
    return ear, lining, tip


def build_face(body, detail):
    """Ojos ámbar de pupila vertical, nariz rosa y lengua, sobre la superficie real de la cabeza."""
    parts = []
    eyes = {}
    for side, sx in (('L', 1), ('R', -1)):
        location, normal = surface_hit(body, (0.079 * sx, -2, 0.716), (0, 1, 0))
        center = location + normal * 0.003
        # Almendrados y con la punta de fuera un poco más alta.
        m = frame_along(center, -normal) @ Matrix.Rotation(math.radians(13 * sx), 4, 'Z')
        parts.append(mesh_from_bmesh(f'eye_{side}', ellipsoid((0.048, 0.038, 0.016), m), detail, EYE, f'eye_{side}'))
        pupil = frame_along(center + normal * 0.006, -normal)
        parts.append(mesh_from_bmesh(f'eye_{side}_pupil', ellipsoid((0.0105, 0.031, 0.012), pupil), detail, PUPIL, f'eye_{side}'))
        shine_at = center + Vector((0.012 * sx, -0.014, 0.012)) + normal * 0.012
        parts.append(mesh_from_bmesh(f'eye_{side}_shine', ellipsoid((0.008,) * 3, Matrix.Translation(shine_at), (8, 6)), detail, SHINE, f'eye_{side}'))
        eyes[side] = center

    location, normal = surface_hit(body, (0, -2, 0.652), (0, 1, 0))
    nose_at = location + normal * 0.004
    nose = ellipsoid((0.027, 0.018, 0.014), frame_along(nose_at, -normal), (12, 8))
    # Triangular, con la punta hacia abajo, como la nariz de un gato.
    for vert in nose.verts:
        below = max(0.0, nose_at.z - vert.co.z)
        vert.co.x = nose_at.x + (vert.co.x - nose_at.x) * (1 - 9 * below)
    parts.append(mesh_from_bmesh('nose', nose, detail, NOSE, 'head'))

    under, _ = surface_hit(body, (0, -0.5, -1), (0, 0, 1))
    tongue_root = under + Vector((0, 0.035, 0.035))
    tongue_tip = under + Vector((0, -0.015, 0.016))
    mid = (tongue_root + tongue_tip) / 2
    tongue = mesh_from_bmesh('tongue', ellipsoid((0.022, 0.009, 0.03), frame_along(mid, tongue_tip - tongue_root)), detail, TONGUE, 'tongue')
    parts.append(tongue)
    return parts, eyes, tongue_root, tongue_tip


# ── Esqueleto ─────────────────────────────────────────────────────────────────

def bone_specs(ear_bases, ear_tips, eyes, tongue_root, tongue_tip):
    specs = [
        # (nombre, cabeza, cola, padre, deforma)
        ('root', (0, 0, 0), (0, 0, 0.12), None, False),
        ('pivot', (0, 0.02, 0.32), (0, 0.02, 0.42), 'root', False),
        ('hips', (0, 0.27, 0.40), (0, 0.02, 0.41), 'pivot', True),
        ('chest', (0, 0.02, 0.41), (0, -0.22, 0.47), 'hips', True),
        ('neck', (0, -0.22, 0.47), (0, -0.32, 0.58), 'chest', True),
        ('head', (0, -0.32, 0.58), (0, -0.34, 0.86), 'neck', True),
        ('tongue', tuple(tongue_root), tuple(tongue_tip), 'head', True),
        ('tail_1', (0, 0.36, 0.40), (0, 0.45, 0.50), 'hips', True),
        ('tail_2', (0, 0.45, 0.50), (0, 0.525, 0.61), 'tail_1', True),
        ('tail_3', (0, 0.525, 0.61), (0, 0.57, 0.73), 'tail_2', True),
        ('tail_4', (0, 0.57, 0.73), (0, 0.585, 0.87), 'tail_3', True),
    ]
    for side in ('L', 'R'):
        specs.append((f'ear_{side}', tuple(ear_bases[side]), tuple(ear_tips[side]), 'head', True))
        specs.append((f'eye_{side}', tuple(eyes[side]), tuple(eyes[side] + Vector((0, -0.03, 0))), 'head', True))
    for side, sx in (('L', 1), ('R', -1)):
        fx, hx = 0.085 * sx, 0.10 * sx
        specs += [
            (f'leg_F{side}_upper', (fx, -0.14, 0.35), (fx, -0.15, 0.20), 'chest', True),
            (f'leg_F{side}_lower', (fx, -0.15, 0.20), (fx, -0.165, 0.05), f'leg_F{side}_upper', True),
            (f'paw_F{side}', (fx, -0.165, 0.05), (fx, -0.23, 0.025), f'leg_F{side}_lower', True),
            (f'leg_H{side}_upper', (hx, 0.25, 0.36), (hx, 0.285, 0.20), 'hips', True),
            (f'leg_H{side}_lower', (hx, 0.285, 0.20), (hx, 0.285, 0.05), f'leg_H{side}_upper', True),
            (f'paw_H{side}', (hx, 0.255, 0.05), (hx, 0.19, 0.025), f'leg_H{side}_lower', True),
        ]
    return specs


def build_rig(specs):
    data = bpy.data.armatures.new('Mascot_Rig')
    rig = link(bpy.data.objects.new('Mascot_Rig', data))
    activate(rig)
    bpy.ops.object.mode_set(mode='EDIT')
    for name, head, tail, parent, deform in specs:
        bone = data.edit_bones.new(name)
        bone.head, bone.tail = head, tail
        # Todos los huesos comparten el eje X del mundo: así, en cualquier
        # hueso, X es cabeceo, Y es giro sobre sí mismo y Z es lateral.
        bone.align_roll(Vector((1, 0, 0)).cross((Vector(tail) - Vector(head)).normalized()))
        bone.use_deform = deform
        if parent:
            bone.parent = data.edit_bones[parent]
    bpy.ops.object.mode_set(mode='OBJECT')
    for pbone in rig.pose.bones:
        pbone.rotation_mode = 'XYZ'
    return rig


# ── Animaciones ───────────────────────────────────────────────────────────────
#
# Convenciones (todas en grados, relativas al reposo):
#   patas   rx < 0 adelanta la pata, rx > 0 la lleva atrás; rz separa del cuerpo
#           (negativo en el lado L, positivo en el R).
#   cabeza  rx > 0 baja el morro, ry gira, rz ladea.
#   pivot   hueso en el centro del cuerpo. rx < 0 levanta el morro, ry gira sobre
#           la vertical, rz rueda sobre el eje largo. Su posición (l) va en ejes
#           del hueso: l[1] es altura y l[2] es retroceso.
#   cola    rx > 0 la levanta y la curva hacia delante, rx < 0 la baja; rz la
#           lleva de lado.
#
# La cola de reposo la pone `wag` (arriba, con la punta en signo de
# interrogación y un vaivén lento) y se superpone a todo. Los gestos que la
# quieren en otro sitio (sentado, dormido, comiendo) la mueven ellos y el motor
# baja el peso de `wag` en esos pasos (`LIMP_TAIL`).

LEGS = ('FL', 'FR', 'HL', 'HR')
TAIL = ('tail_1', 'tail_2', 'tail_3', 'tail_4')


def ease(u):
    u = min(1.0, max(0.0, u))
    return u * u * (3 - 2 * u)


def span(f, start, end):
    return ease((f - start) / (end - start))


def hump(f, start, end):
    """0 → 1 → 0 entre start y end, suave."""
    if f <= start or f >= end:
        return 0.0
    return math.sin(math.pi * (f - start) / (end - start)) ** 2


class Pose(dict):
    def add(self, bone, r=None, l=None, s=None):
        ch = self.setdefault(bone, {})
        if r is not None:
            ch['r'] = tuple(a + b for a, b in zip(ch.get('r', (0, 0, 0)), r))
        if l is not None:
            ch['l'] = tuple(a + b for a, b in zip(ch.get('l', (0, 0, 0)), l))
        if s is not None:
            ch['s'] = tuple(a * b for a, b in zip(ch.get('s', (1, 1, 1)), s))
        return self

    def mix(self, other, amount):
        """Suma `other` escalado por amount (rotaciones y posiciones), y escala interpolada."""
        for bone, ch in other.items():
            if 'r' in ch:
                self.add(bone, r=tuple(v * amount for v in ch['r']))
            if 'l' in ch:
                self.add(bone, l=tuple(v * amount for v in ch['l']))
            if 's' in ch:
                self.add(bone, s=tuple(1 + (v - 1) * amount for v in ch['s']))
        return self


def tail_wrap(p, amount=1.0, side=1):
    """La cola baja y rodea el costado, apoyada en el suelo, como al sentarse."""
    p.add('tail_1', r=(-44 * amount, 0, 22 * side * amount))
    p.add('tail_2', r=(16 * amount, 0, 44 * side * amount))
    p.add('tail_3', r=(14 * amount, 0, 46 * side * amount))
    p.add('tail_4', r=(10 * amount, 0, 40 * side * amount))
    return p


def pose_sit():
    p = Pose()
    p.add('pivot', r=(-34, 0, 0), l=(0, -0.06, 0.03))
    p.add('neck', r=(12, 0, 0))
    p.add('head', r=(20, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(34, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-72, 0, 0))
        p.add(f'leg_H{side}_lower', r=(102, 0, 0))
        p.add(f'paw_H{side}', r=(-32, 0, 0))
    return tail_wrap(p)


def pose_loaf():
    """Echado como un pan: las cuatro patas recogidas debajo."""
    p = Pose()
    p.add('pivot', r=(2, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-80, 0, 0))
        p.add(f'leg_F{side}_lower', r=(-4, 0, 0))
        p.add(f'paw_F{side}', r=(66, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-70, 0, 0))
        p.add(f'leg_H{side}_lower', r=(114, 0, 0))
        p.add(f'paw_H{side}', r=(-30, 0, 0))
    return p


def pose_head_down(depth=1.0):
    p = Pose()
    p.add('pivot', r=(8 * depth, 0, 0), l=(0, -0.01 * depth, 0))
    p.add('chest', r=(5 * depth, 0, 0))
    p.add('neck', r=(34 * depth, 0, 0))
    p.add('head', r=(28 * depth, 0, 0))
    for leg in LEGS:
        p.add(f'leg_{leg}_upper', r=(-9 * depth, 0, 0))
    return p


def pose_crouch(depth=1.0):
    p = Pose()
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-30 * depth, 0, 0))
        p.add(f'leg_F{side}_lower', r=(52 * depth, 0, 0))
        p.add(f'paw_F{side}', r=(-18 * depth, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-34 * depth, 0, 0))
        p.add(f'leg_H{side}_lower', r=(58 * depth, 0, 0))
        p.add(f'paw_H{side}', r=(-22 * depth, 0, 0))
    p.add('head', r=(-6 * depth, 0, 0))
    return p


def pose_tuck():
    p = Pose()
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-55, 0, 0))
        p.add(f'leg_F{side}_lower', r=(75, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-45, 0, 0))
        p.add(f'leg_H{side}_lower', r=(85, 0, 0))
    p.add('head', r=(12, 0, 0))
    return p


def walk_legs(p, t, amount=1.0, stride=24):
    for leg, phase in (('FL', 0), ('HR', 0.25), ('FR', math.pi), ('HL', math.pi + 0.25)):
        a = t + phase
        lift = max(0.0, math.cos(a))
        p.add(f'leg_{leg}_upper', r=(-stride * math.sin(a) * amount, 0, 0))
        p.add(f'leg_{leg}_lower', r=(30 * lift * amount, 0, 0))
        p.add(f'paw_{leg}', r=(-16 * lift * amount, 0, 0))


def eyes_closed(p, amount):
    if amount:
        for side in 'LR':
            p.add(f'eye_{side}', s=(1, 1 - 0.92 * amount, 1))


def blink(p, f, at, length=6):
    eyes_closed(p, hump(f, at, at + length))


def slow_blink(p, f, at, length=22):
    """El parpadeo lento del gato que se fía: cierra despacio, espera, abre."""
    if at <= f <= at + length:
        u = (f - at) / length
        eyes_closed(p, min(1.0, math.sin(math.pi * u) * 1.6) * 0.85)


def act_idle(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('chest', r=(1.2 * math.sin(4 * t), 0, 0))
    p.add('pivot', l=(0, 0.002 * math.sin(4 * t), 0))
    p.add('neck', r=(1.5 * math.sin(t), 0, 0))
    p.add('head', r=(2 * math.sin(t), 9 * math.sin(t + 0.4), 5 * math.sin(t + 1.1)))
    p.add('ear_L', r=(0, 0, 22 * hump(f, 30, 35)))
    p.add('ear_R', r=(0, 0, -18 * hump(f, 74, 79)))
    slow_blink(p, f, 50)
    return p


def act_walk(f, n):
    t = TAU * f / n
    p = Pose()
    walk_legs(p, t)
    p.add('pivot', r=(0, 0, 2 * math.sin(t)), l=(0, 0.006 * math.cos(2 * t), 0))
    p.add('hips', r=(0, 0, -2.5 * math.sin(t)))
    # El gato lleva la cabeza quieta al andar: el cuerpo ondula por debajo.
    p.add('head', r=(1.5 * math.cos(2 * t), 0, -1.5 * math.sin(t)))
    return p


def act_run(f, n):
    """Galope: manos juntas, patas juntas, el lomo se recoge y se estira."""
    t = TAU * f / n
    p = Pose()
    for side, lag in (('L', 0.0), ('R', 0.3)):
        front = t + lag
        hind = t + math.pi + lag
        p.add(f'leg_F{side}_upper', r=(-40 * math.sin(front), 0, 0))
        p.add(f'leg_F{side}_lower', r=(42 * max(0.0, math.cos(front)), 0, 0))
        p.add(f'leg_H{side}_upper', r=(-38 * math.sin(hind), 0, 0))
        p.add(f'leg_H{side}_lower', r=(46 * max(0.0, math.cos(hind)), 0, 0))
    p.add('pivot', r=(8 * math.sin(t + 1.2), 0, 0), l=(0, 0.028 * max(0.0, math.sin(t + 0.4)), 0))
    p.add('chest', r=(-5 * math.sin(t), 0, 0))
    p.add('head', r=(-7 * math.sin(t + 1.2), 0, 0))
    for side in 'LR':
        p.add(f'ear_{side}', r=(-22, 0, 0))
    return p


def act_sit(f, n):
    t = TAU * f / n
    p = pose_sit()
    p.add('chest', r=(1.2 * math.sin(2 * t), 0, 0))
    p.add('head', r=(0, 10 * math.sin(t), 5 * math.sin(t + 0.8)))
    p.add('tail_4', r=(0, 0, 10 * math.sin(t)))
    blink(p, f, 30)
    return p


def act_wave(f, n):
    """Sentado, levanta una mano y da toquecitos al aire."""
    t = TAU * f / n
    p = pose_sit()
    p.add('pivot', r=(-4, 0, 3))
    p.add('leg_FL_upper', r=(-118, 0, -10))
    p.add('leg_FL_lower', r=(46 + 26 * math.sin(3 * t), 0, 0))
    p.add('paw_FL', r=(38 + 16 * math.sin(3 * t + 0.8), 0, 0))
    p.add('head', r=(-4, 0, -12 + 3 * math.sin(3 * t)))
    return p


def act_wag(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('tail_1', r=(36, 0, 8 * math.sin(t)))
    p.add('tail_2', r=(6, 0, 12 * math.sin(t - 0.6)))
    p.add('tail_3', r=(20, 0, 16 * math.sin(t - 1.2)))
    p.add('tail_4', r=(30 + 6 * math.sin(t - 2.2), 0, 20 * math.sin(t - 1.8)))
    return p


def act_eat(f, n):
    t = TAU * f / n
    p = pose_head_down(0.86)
    p.mix(pose_crouch(), 0.35)
    p.add('head', r=(7 * math.sin(2 * t), 0, 5 * math.sin(t)))
    for side in 'LR':
        p.add(f'ear_{side}', r=(4 * math.sin(2 * t), 0, 0))
    tail_wrap(p, 0.7, -1)
    return p


def act_drink(f, n):
    """Agachado y lamiendo: la lengua entra y sale unas dos veces por segundo."""
    t = TAU * f / n
    p = pose_head_down(0.95)
    p.mix(pose_crouch(), 0.6)
    lap = max(0.0, math.sin(2 * t))
    p.add('tongue', r=(34 * lap, 0, 0), s=(1, 1 + 1.4 * lap, 1))
    p.add('head', r=(3 * math.sin(2 * t + 0.6), 0, 0))
    eyes_closed(p, 0.45)
    tail_wrap(p, 0.7, -1)
    return p


def act_groom(f, n):
    """Se asea: lame la mano y se la pasa por la cara, de oreja a bigote."""
    t = TAU * f / n
    p = pose_sit()
    lick = span(f, 0, 6) - span(f, n - 6, n)
    wash = hump(f, n * 0.5, n)
    p.add('leg_FL_upper', r=(-128 * lick - 16 * wash, 0, 10 * lick))
    p.add('leg_FL_lower', r=(118 * lick - 20 * wash, 0, 0))
    p.add('paw_FL', r=(46 * lick, 0, 0))
    p.add('neck', r=(14 * lick, 0, 0))
    p.add('head', r=(22 * lick - 22 * wash, -20 * lick, -10 * lick - 16 * wash))
    licking = max(0.0, math.sin(4 * t)) * lick * (1 - wash)
    p.add('tongue', r=(18 * licking, 0, 0), s=(1, 1 + 1.3 * licking, 1))
    eyes_closed(p, 0.6 * lick)
    p.add('ear_L', r=(0, 0, 18 * wash))
    return p


def act_sleep(f, n):
    """Echado como un pan, la cabeza recogida y la cola rodeándolo; respira despacio."""
    t = TAU * f / n
    p = pose_loaf()
    p.add('chest', r=(1.8 * math.sin(t), 0, 0))
    p.add('neck', r=(30 + 2 * math.sin(t), 0, 0))
    p.add('head', r=(16, 0, 14))
    eyes_closed(p, 1.0)
    for side in 'LR':
        p.add(f'ear_{side}', r=(-16, 0, 0))
    tail_wrap(p, 1.0, -1)
    p.add('tail_4', r=(0, 0, 6 * math.sin(t)))
    return p


def act_beg(f, n):
    """De pie sobre las patas de atrás, curioso, con las manos recogidas."""
    t = TAU * f / n
    p = pose_sit()
    p.add('pivot', r=(-34, 0, 0), l=(0, 0.03 + 0.008 * math.sin(2 * t), 0.05))
    p.add('head', r=(32, 0, 8 * math.sin(t)))
    p.add('neck', r=(6, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-42, 0, 0))
        p.add(f'leg_F{side}_lower', r=(96 + 10 * math.sin(2 * t), 0, 0))
        p.add(f'paw_F{side}', r=(42, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-16, 0, 0))
        p.add(f'leg_H{side}_lower', r=(6, 0, 0))
        p.add(f'ear_{side}', r=(-8, 0, 0))
    return p


def act_roll(f, n):
    down = span(f, 0, 10) - span(f, 36, 46)
    roll = span(f, 10, 36)
    p = Pose().mix(pose_tuck(), down)
    p.add('pivot', r=(0, 0, 360 * roll))
    p.add('neck', r=(30 * down, 0, 0))
    p.add('head', r=(10 * down, 0, 0))
    for side in 'LR':
        p.add(f'ear_{side}', r=(-35 * down, 0, 0))
    eyes_closed(p, 0.8 * hump(f, 12, 34))
    return p


def act_pounce(f, n):
    """Acecha agazapado meneando la grupa, salta hacia delante y vuelve a su sitio."""
    crouch = span(f, 0, 6) * (1 - span(f, 16, 19)) + hump(f, 26, 34) * 0.8
    air = min(1.0, max(0.0, (f - 18) / 9))
    p = Pose().mix(pose_crouch(1.9), crouch)
    p.add('pivot', r=(4 * crouch, 0, 0))
    p.add('neck', r=(-16 * crouch, 0, 0))
    p.add('head', r=(14 * crouch, 0, 0))
    wiggle = hump(f, 5, 17) ** 0.5
    p.add('hips', r=(0, 0, 9 * wiggle * math.sin(f * 1.6)))
    for side in 'LR':
        p.add(f'ear_{side}', r=(-14 * crouch, 0, 0))
    if 0.0 < air < 1.0:
        stretch = math.sin(math.pi * air)
        p.add('root', l=(0, 0.26 * 4 * air * (1 - air), -0.2 * ease(air)))
        p.add('pivot', r=(-16 * stretch, 0, 0))
        for side in 'LR':
            p.add(f'leg_F{side}_upper', r=(-62 * stretch, 0, 0))
            p.add(f'leg_H{side}_upper', r=(42 * stretch, 0, 0))
    elif f >= 27:
        p.add('root', l=(0, 0, -0.2 * (1 - span(f, 30, n))))
        p.add('leg_FL_upper', r=(-24 * hump(f, 27, 36), 0, 0))
        p.add('leg_FR_upper', r=(-24 * hump(f, 27, 36), 0, 0))
    return p


def act_spin(f, n):
    """Se persigue la cola: dos vueltas con la cabeza buscándola."""
    turn = span(f, 2, 44)
    chase = hump(f, 0, 48) ** 0.3
    p = Pose()
    walk_legs(p, TAU * f / 10, amount=chase, stride=20)
    p.add('root', r=(0, 720 * turn, 0))
    p.add('neck', r=(0, 22 * chase, 0))
    p.add('head', r=(4, 34 * chase, 12 * chase))
    p.add('hips', r=(0, -18 * chase, 0))
    p.add('tail_1', r=(10, 0, -30 * chase))
    p.add('tail_2', r=(0, 0, -24 * chase))
    return p


def act_stretch(f, n):
    """El estiramiento de gato: las manos adelante, el pecho al suelo, la grupa arriba."""
    hold = span(f, 2, 18) - span(f, 40, 54)
    p = Pose()
    p.add('pivot', r=(22 * hold, 0, 0), l=(0, -0.05 * hold, 0))
    p.add('chest', r=(10 * hold, 0, 0))
    p.add('neck', r=(-18 * hold, 0, 0))
    p.add('head', r=(-12 * hold, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-84 * hold, 0, 0))
        p.add(f'leg_F{side}_lower', r=(-8 * hold, 0, 0))
        p.add(f'paw_F{side}', r=(40 * hold, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-18 * hold, 0, 0))
        p.add(f'ear_{side}', r=(-20 * hold, 0, 0))
    eyes_closed(p, 0.95 * hump(f, 10, 44) ** 0.4)
    return p


def act_jump(f, n):
    crouch = hump(f, 0, 10) if f < 5 else hump(f, 17, 24) if f > 17 else 0.0
    air = min(1.0, max(0.0, (f - 5) / 13))
    p = Pose().mix(pose_crouch(), crouch)
    if 0.0 < air < 1.0:
        p.add('root', l=(0, 0.42 * 4 * air * (1 - air), 0))
        p.add('pivot', r=(-16 * math.sin(math.pi * air), 0, 0))
        stretch = math.sin(math.pi * air)
        for side in 'LR':
            p.add(f'leg_F{side}_upper', r=(-40 * stretch, 0, 0))
            p.add(f'leg_H{side}_upper', r=(35 * stretch, 0, 0))
        p.add('head', r=(-10 * stretch, 0, 0))
    return p


# (nombre, fotogramas, función, en bucle, suelo)
#
# El suelo lo resuelve el script, no cada pose: después de colocar los huesos de
# un fotograma se mide el punto más bajo de la malla deformada y se sube o baja
# la raíz. `snap` apoya siempre al gato en el botón; `hop` lo apoya y le suma
# la altura del salto que pide la pose; `None` deja el clip sin raíz, como la
# cola, que se superpone a todo.
ACTIONS = [
    ('idle', 96, act_idle, True, 'snap'),
    ('walk', 16, act_walk, True, 'snap'),
    ('run', 12, act_run, True, 'snap'),
    ('sit', 48, act_sit, True, 'snap'),
    ('wave', 48, act_wave, True, 'snap'),
    ('wag', 48, act_wag, True, None),
    ('eat', 16, act_eat, True, 'snap'),
    ('drink', 20, act_drink, True, 'snap'),
    ('groom', 48, act_groom, True, 'snap'),
    ('sleep', 48, act_sleep, True, 'snap'),
    ('beg', 48, act_beg, True, 'snap'),
    ('roll', 48, act_roll, False, 'snap'),
    ('pounce', 40, act_pounce, False, 'hop'),
    ('spin', 48, act_spin, False, 'snap'),
    ('stretch', 56, act_stretch, False, 'snap'),
    ('jump', 24, act_jump, False, 'hop'),
]


def lowest_point(obj):
    depsgraph = bpy.context.evaluated_depsgraph_get()
    evaluated = obj.evaluated_get(depsgraph)
    mesh = evaluated.to_mesh()
    lowest = min((evaluated.matrix_world @ v.co).z for v in mesh.vertices)
    evaluated.to_mesh_clear()
    return lowest


def apply_frame(rig, frame):
    reset_pose(rig)
    for bone, ch in frame.items():
        pbone = rig.pose.bones[bone]
        pbone.rotation_euler = Euler([math.radians(v) for v in ch.get('r', (0, 0, 0))], 'XYZ')
        pbone.location = ch.get('l', (0, 0, 0))
        pbone.scale = ch.get('s', (1, 1, 1))


def settle(rig, cat, frame, mode):
    """Corrige la altura de la raíz para que el punto más bajo quede en el suelo.

    `hop` apoya primero el gato en el suelo, sin la altura del salto que pide
    la pose, y luego se la suma: así agazaparse baja de verdad el cuerpo y el
    salto despega desde ahí.
    """
    x, up, z = frame['root']['l']
    if mode == 'hop':
        frame['root']['l'] = (x, 0.0, z)
    apply_frame(rig, frame)
    lowest = lowest_point(cat)
    if mode == 'snap':
        frame['root']['l'] = (x, up - lowest, z)
    elif mode == 'hop':
        frame['root']['l'] = (x, up - lowest, z)
    else:
        frame['root']['l'] = (x, up + max(0.0, -lowest), z)


def reset_pose(rig):
    for pbone in rig.pose.bones:
        pbone.location = (0, 0, 0)
        pbone.rotation_euler = (0, 0, 0)
        pbone.scale = (1, 1, 1)


def bake_action(rig, cat, name, length, fn, loop, ground):
    frames = [fn(f, length) for f in range(length + 1)]
    if ground:
        for frame in frames:
            frame.setdefault('root', {}).setdefault('l', (0, 0, 0))
    used = {}
    for frame in frames:
        for bone, ch in frame.items():
            used.setdefault(bone, set()).update(ch.keys())

    action = bpy.data.actions.new(name)
    action.use_fake_user = True
    action.use_frame_range = True
    action.frame_start, action.frame_end = 0, length
    action.use_cyclic = loop
    rig.animation_data.action = action
    reset_pose(rig)

    for f, frame in enumerate(frames):
        if ground:
            settle(rig, cat, frame, ground)
        for bone, channels in used.items():
            pbone = rig.pose.bones[bone]
            ch = frame.get(bone, {})
            if 'r' in channels:
                pbone.rotation_euler = Euler([math.radians(v) for v in ch.get('r', (0, 0, 0))], 'XYZ')
                pbone.keyframe_insert('rotation_euler', frame=f, group=bone)
            if 'l' in channels:
                pbone.location = ch.get('l', (0, 0, 0))
                pbone.keyframe_insert('location', frame=f, group=bone)
            if 's' in channels:
                pbone.scale = ch.get('s', (1, 1, 1))
                pbone.keyframe_insert('scale', frame=f, group=bone)
    for curve in action.fcurves:
        for point in curve.keyframe_points:
            point.interpolation = 'LINEAR'

    track = rig.animation_data.nla_tracks.new()
    track.name = name
    track.strips.new(name, 0, action)
    track.mute = True
    rig.animation_data.action = None
    reset_pose(rig)
    return action


# ── Utilería ──────────────────────────────────────────────────────────────────

def bowl_profile(radius=0.12, height=0.065):
    return [
        (0.0, 0.0), (radius * 0.82, 0.0), (radius, height * 0.8), (radius * 1.04, height),
        (radius * 0.93, height), (radius * 0.8, height * 0.35), (0.0, height * 0.35),
    ]


def build_props(toon, detail, outline_mat):
    """Los dos platos llevan trazo (material Mascot_Toon); el pienso y el agua, color plano."""
    props = []

    def finish(obj):
        shell = outline_shell(obj, OUTLINE_PROPS, outline_mat)
        shell.parent = obj
        props.append(obj)
        return obj

    food = mesh_from_bmesh('prop_food_bowl', lathe(bowl_profile()), toon, BOWL)
    paint(food, lambda co: BOWL_DARK if co.z < 0.03 and Vector((co.x, co.y)).length < 0.09 else BOWL)
    finish(food)

    kibble = bmesh.new()
    for i in range(9):
        angle = i * 2.4
        radius = 0.025 + 0.045 * ((i * 7) % 5) / 4
        piece = ellipsoid((0.02, 0.017, 0.014), Matrix.Translation((radius * math.cos(angle), radius * math.sin(angle), 0.036 + 0.008 * (i % 3))), (8, 6))
        me = bpy.data.meshes.new('tmp')
        piece.to_mesh(me)
        piece.free()
        kibble.from_mesh(me)
        bpy.data.meshes.remove(me)
    props.append(mesh_from_bmesh('prop_kibble', kibble, detail, KIBBLE))

    water_bowl = mesh_from_bmesh('prop_water_bowl', lathe(bowl_profile()), toon, WATER_BOWL)
    finish(water_bowl)
    water = mesh_from_bmesh('prop_water', lathe([(0.0, 0.0), (0.1, 0.0), (0.1, 0.004), (0.0, 0.004)], 28), detail, WATER)
    water.location.z = 0.04
    props.append(water)
    return props


# ── Exportación y renders de control ─────────────────────────────────────────

def export(rig):
    rig.animation_data.action = None
    reset_pose(rig)
    os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)
    # Sin copia `.blend1`: el .blend se regenera entero en cada ejecución.
    bpy.context.preferences.filepaths.save_version = 0
    bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT, compress=True)

    for obj in [o for o in bpy.data.objects if o.name.endswith('_outline')]:
        bpy.data.objects.remove(obj)
    os.makedirs(os.path.dirname(GLB_OUT), exist_ok=True)
    bpy.ops.export_scene.gltf(
        filepath=GLB_OUT,
        export_format='GLB',
        export_texcoords=False,
        # Sin normales: la web las recalcula al cargar.
        export_normals=False,
        export_vertex_color='ACTIVE',
        export_all_vertex_colors=False,
        export_apply=True,
        export_skins=True,
        export_all_influences=False,
        export_def_bones=False,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=True,
        export_frame_step=1,
        export_optimize_animation_size=True,
        # Solo los canales con curva propia: así la web puede superponer la cola
        # (`wag`) sobre cualquier otro clip sin que el reposo de uno pise al otro.
        export_optimize_animation_keep_anim_armature=False,
        export_anim_single_armature=True,
        export_reset_pose_bones=True,
        export_morph=False,
        export_lights=False,
        export_cameras=False,
        export_yup=True,
    )


PREVIEWS = [
    ('rest', None, 0, 'three_quarter'), ('rest_front', None, 0, 'front'), ('rest_side', None, 0, 'side'),
    ('rest_head', None, 0, 'head_front'), ('idle', 'idle', 60, 'three_quarter'),
    ('walk_a', 'walk', 4, 'side'), ('walk_b', 'walk', 12, 'side'), ('walk_tail', 'walk', 4, 'three_quarter'),
    ('sit', 'sit', 0, 'three_quarter'), ('sit_side', 'sit', 0, 'side'), ('sit_back', 'sit', 0, 'back'), ('wave', 'wave', 8, 'front'),
    ('rest_back', None, 0, 'back'), ('groom_side', 'groom', 12, 'side'),
    ('eat', 'eat', 4, 'three_quarter'), ('drink', 'drink', 5, 'side'), ('groom_a', 'groom', 12, 'front'),
    ('groom_b', 'groom', 36, 'front'), ('sleep', 'sleep', 10, 'three_quarter'), ('beg', 'beg', 6, 'three_quarter'),
    ('roll', 'roll', 22, 'three_quarter'), ('pounce_a', 'pounce', 12, 'side'), ('pounce_b', 'pounce', 22, 'side'),
    ('spin', 'spin', 20, 'three_quarter'), ('stretch', 'stretch', 28, 'side'), ('jump', 'jump', 11, 'side'),
    ('run_a', 'run', 2, 'side'), ('run_b', 'run', 8, 'side'),
]

VIEWS = {
    'three_quarter': ((-1.9, -2.5, 1.35), (0, -0.02, 0.45)),
    'front': ((0, -3.1, 0.9), (0, -0.1, 0.47)),
    'side': ((-3.1, -0.05, 0.75), (0, 0.0, 0.47)),
    'back': ((1.2, 2.8, 1.3), (0, 0.1, 0.45)),
    'head_front': ((0.0, -1.8, 0.82), (0, -0.3, 0.7)),
}

PROP_SPOTS = {
    'eat': {'prop_food_bowl': (0, -0.58, 0), 'prop_kibble': (0, -0.58, 0)},
    'drink': {'prop_water_bowl': (0, -0.6, 0), 'prop_water': (0, -0.6, 0.04)},
}


def render_previews(rig, cat, props, out_dir):
    os.makedirs(out_dir, exist_ok=True)
    scene = bpy.context.scene
    scene.render.engine = 'BLENDER_WORKBENCH'
    scene.render.resolution_x = scene.render.resolution_y = 420
    scene.display.shading.light = 'STUDIO'
    scene.display.shading.color_type = 'VERTEX'
    scene.display.shading.show_backface_culling = True
    scene.display.shading.show_cavity = False
    scene.view_settings.view_transform = 'Standard'

    camera = link(bpy.data.objects.new('PreviewCam', bpy.data.cameras.new('PreviewCam')))
    camera.data.lens = 55
    scene.camera = camera
    # La cola de `wag` va debajo de cada clip, como en la web: su pista NLA suena
    # y la acción activa la reemplaza solo en los huesos que mueve.
    for track in rig.animation_data.nla_tracks:
        track.mute = track.name != 'wag'
    by_name = {p.name: p for p in props}

    for label, action, frame, view in PREVIEWS:
        eye, target = VIEWS[view]
        camera.location = eye
        camera.rotation_euler = (Vector(target) - Vector(eye)).to_track_quat('-Z', 'Y').to_euler()
        rig.animation_data.action = bpy.data.actions[action] if action else None
        reset_pose(rig)
        spots = PROP_SPOTS.get(action, {})
        for name, prop in by_name.items():
            prop.hide_render = name not in spots
            for child in prop.children:
                child.hide_render = prop.hide_render
            if name in spots:
                prop.location = spots[name]
        scene.frame_set(frame)
        print(f'Mascota · {label}: punto más bajo {lowest_point(cat):+.3f}')
        scene.render.filepath = os.path.join(out_dir, f'{label}.png')
        bpy.ops.render.render(write_still=True)

    rig.animation_data.action = None
    for track in rig.animation_data.nla_tracks:
        track.mute = True
    for prop in props:
        prop.location = (0, 0, prop.location.z if prop.name == 'prop_water' else 0)
        prop.hide_render = False
        for child in prop.children:
            child.hide_render = False
    bpy.data.objects.remove(camera)


# ── Montaje ───────────────────────────────────────────────────────────────────

def main():
    preview_dir = cli_preview_dir()
    reset_scene()
    toon = make_material('Mascot_Toon', COAT)
    detail = make_material('Mascot_Detail', COAT)
    outline_mat = make_material('Mascot_Outline', BLACK, vertex_color=False)

    body = build_body(toon)

    ear_bases, ear_tips, ear_parts = {}, {}, []
    for side, sx in (('L', 1), ('R', -1)):
        top, _ = surface_hit(body, (0.112 * sx, -0.335, 2), (0, 0, -1))
        base = top - Vector((0, 0, 0.05))
        ear, lining, tip = build_ear(side, base, toon, detail)
        ear_bases[side], ear_tips[side] = base, tip
        ear_parts += [ear, lining]

    face_parts, eyes, tongue_root, tongue_tip = build_face(body, detail)

    # El trazo solo rodea el cuerpo y las orejas (material Mascot_Toon). Ojos,
    # nariz, lengua y el interior rosa de las orejas (Mascot_Detail) son planos
    # de color: con trazo, el brillo del ojo saldría rodeado de un aro negro.
    linings = [p for p in ear_parts if p.name.endswith('_lining')]
    outlined = join([body] + [p for p in ear_parts if p not in linings], 'Mascot_Cat')
    shell = outline_shell(outlined, OUTLINE, outline_mat)
    cat = join([outlined] + linings + face_parts, 'Mascot_Cat')

    rig = build_rig(bone_specs(ear_bases, ear_tips, eyes, tongue_root, tongue_tip))
    for skinned in (cat, shell):
        skinned.parent = rig
        modifier = skinned.modifiers.new('Armature', 'ARMATURE')
        modifier.object = rig

    rig.animation_data_create()
    for name, length, fn, loop, ground in ACTIONS:
        bake_action(rig, cat, name, length, fn, loop, ground)

    props = build_props(toon, detail, outline_mat)

    print(f'Mascota · malla: {len(cat.data.vertices)} vértices, {len(cat.data.polygons)} caras')
    if preview_dir:
        render_previews(rig, cat, props, preview_dir)
    export(rig)
    print(f'Mascota · GLB: {GLB_OUT} ({os.path.getsize(GLB_OUT) / 1024:.0f} KB)')


main()
