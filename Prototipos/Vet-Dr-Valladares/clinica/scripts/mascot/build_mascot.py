"""Construye en Blender la mascota 3D de la Clínica Valladares: un beagle.

Todo el modelo sale de este archivo. No hay un .blend «maestro» retocado a mano:
el .blend que se guarda al final es una salida más, para abrirlo y mirarlo, y se
regenera en cada ejecución. Así cualquier ajuste queda escrito y revisable.

El proceso:

1. El cuerpo es un conjunto de metaballs (cabeza, mejillas, hocico, pecho, torso,
   grupa, patas y cola) que se funden en una sola superficie y se convierten en
   malla. Es lo que da el aire de peluche redondo del dibujo sin esculpir.
2. Los pesos del esqueleto no se calculan con el método de calor de Blender: se
   derivan del mismo campo de las metaballs. Cada elemento pertenece a un hueso,
   y el peso de un vértice es la parte del campo que aporta cada hueso en ese
   punto. Las juntas se reparten solas y el resultado no depende de heurísticas
   que fallan en modo sin interfaz.
3. El color va por vértice, con la paleta medida en el logo, y se pinta por
   regiones: máscara naranja, franja y hocico blancos, pecho, vientre y patas.
4. Orejas, ojos, nariz y lengua son piezas aparte, rígidas, cada una atada a su
   hueso. La oreja derecha va doblada como en el logo.
5. El contorno negro es un casco invertido: una copia de la malla inflada por
   sus normales y con las caras giradas. Se ve solo por el borde, como el trazo
   del dibujo, y se deforma con el esqueleto porque copia los pesos.
6. Cada animación se calcula fotograma a fotograma con una función y se graba
   como acción. Así los ciclos cierran exactos y cada gesto es un par de líneas.
7. La utilería (platos, charquito, caca) va en el mismo GLB, en el origen; la
   web la coloca y la muestra cuando toca.

Uso, desde la raíz del repositorio:

  npm run mascot:build                     exporta el GLB y guarda el .blend
  npm run mascot:build -- --preview DIR    además deja renders de control en DIR

Requiere Blender 4.3 o posterior (ruta en la variable BLENDER si no está en
/Applications).
"""

import math
import os
import sys

import bmesh
import bpy
from mathutils import Euler, Matrix, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
GLB_OUT = os.path.join(REPO, 'public', 'mascot', 'valladares-beagle.glb')
BLEND_OUT = os.path.join(HERE, 'valladares-beagle.blend')

FPS = 24
TAU = math.tau


def cli_preview_dir():
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    if '--preview' in argv:
        return os.path.abspath(argv[argv.index('--preview') + 1])
    return None


# ── Paleta ────────────────────────────────────────────────────────────────────
# Medida con cuentagotas sobre public/logo-512.webp. Los platos y la utilería
# usan los tonos de marca de la web (#D66215, #4C1D03).

def hex_rgba(value):
    value = value.lstrip('#')
    return tuple(int(value[i:i + 2], 16) / 255 for i in (0, 2, 4)) + (1.0,)


ORANGE = hex_rgba('#A94D24')
WHITE = hex_rgba('#F4E7D2')
EAR_PINK = hex_rgba('#C87878')
TONGUE = hex_rgba('#D56E82')
BLACK = hex_rgba('#24211F')
BROWN = hex_rgba('#8D3F21')
DARK_SADDLE = hex_rgba('#272421')
SHINE = hex_rgba('#FFFFFF')
BOWL = hex_rgba('#D66215')
BOWL_DARK = hex_rgba('#4C1D03')
KIBBLE = hex_rgba('#8A4A1C')
WATER_BOWL = hex_rgba('#2F8FD0')
WATER = hex_rgba('#9ADCF7')
PEE = hex_rgba('#F2D23C')
POOP = hex_rgba('#7A4A24')
# El chonete de paja con cinta roja que el logo llevaba superpuesto en el Mes
# Patrio hasta que llegó el logo de septiembre (sombrero blanco con bandera).
STRAW = hex_rgba('#F2DEA6')
STRAW_DARK = hex_rgba('#DCC08A')
HAT_BAND = hex_rgba('#B62938')
# La calabaza de Halloween: un naranja más amarillo que el del pelaje, para que
# traje y perro no se fundan en una sola mancha.
PUMPKIN = hex_rgba('#FF8A1C')
PUMPKIN_GROOVE = hex_rgba('#C24E0C')
PUMPKIN_STEM = hex_rgba('#7C8B2F')
PUMPKIN_LEAF = hex_rgba('#8CC63F')
# El sombrero de bruja del logo de octubre, medido sobre el PDF de diseño. El
# negro es carbón y no el del trazo: con el mismo negro, la copa sería una
# mancha sin borde.
WITCH_HAT = hex_rgba('#2B2A30')
WITCH_PURPLE = hex_rgba('#6E358A')
WITCH_PURPLE_DARK = hex_rgba('#4F2461')
WITCH_BUCKLE = hex_rgba('#FA9329')
WITCH_PUMPKIN = hex_rgba('#F06C0D')
WITCH_PUMPKIN_GROOVE = hex_rgba('#C9560B')
WITCH_STEM = hex_rgba('#6B3A16')
WITCH_LEAF = hex_rgba('#5E9A2A')

OUTLINE = 0.016          # grosor del trazo, en unidades de escena (el perro mide ~1)
OUTLINE_PROPS = 0.010


# ── Escena ────────────────────────────────────────────────────────────────────

def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.render.fps = FPS
    scene.frame_start = 0
    world = bpy.data.worlds.new('World')
    world.color = (0.98, 0.95, 0.9)
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

    Solo existe en el .blend y en los renders de control. El GLB no lo lleva: la
    web dibuja el mismo trazo en el sombreador reutilizando la geometría, lo que
    ahorra media malla de descarga y deja el grosor constante en píxeles.
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
# El perro mira hacia -Y con Z arriba; el suelo es z = 0. Los semiejes son los de
# cada pieza sola: al fundirse, las piezas vecinas engordan un poco la unión.

THRESHOLD = 0.6

BLOBS = [
    ('head', (0, -0.34, 0.73), (0.22, 0.22, 0.20), (0, 0, 0), 4, 'head'),
    ('cheek_L', (0.105, -0.45, 0.65), (0.10, 0.11, 0.085), (0, 0, 0), 4, 'head'),
    ('cheek_R', (-0.105, -0.45, 0.65), (0.10, 0.11, 0.085), (0, 0, 0), 4, 'head'),
    ('snout', (0, -0.57, 0.64), (0.09, 0.15, 0.07), (0, 0, 0), 4, 'head'),
    ('neck', (0, -0.21, 0.54), (0.135, 0.12, 0.15), (0, 0, 0), 4, 'neck'),
    ('ruff', (0, -0.19, 0.41), (0.15, 0.13, 0.17), (0, 0, 0), 4, 'chest'),
    ('torso', (0, 0.00, 0.39), (0.17, 0.24, 0.17), (0, 0, 0), 4, 'chest'),
    ('rump', (0, 0.24, 0.385), (0.175, 0.20, 0.165), (0, 0, 0), 4, 'hips'),
    ('tail_1', (0, 0.41, 0.47), (0.052, 0.06, 0.10), (-30, 0, 0), 3, 'tail_1'),
    ('tail_2', (0, 0.45, 0.58), (0.055, 0.055, 0.105), (-20, 0, 0), 3, 'tail_2'),
    ('tail_3', (0, 0.47, 0.69), (0.05, 0.05, 0.09), (-8, 0, 0), 3, 'tail_3'),
]

# Patas de beagle: más largas, finas y atléticas.
for side, sx in (('L', 1), ('R', -1)):
    BLOBS += [
        (f'leg_F{side}_upper', (0.095 * sx, -0.15, 0.27), (0.052, 0.058, 0.11), (0, 0, 0), 5, f'leg_F{side}_upper'),
        (f'leg_F{side}_lower', (0.095 * sx, -0.16, 0.125), (0.043, 0.048, 0.085), (0, 0, 0), 5, f'leg_F{side}_lower'),
        (f'paw_F{side}', (0.105 * sx, -0.19, 0.038), (0.064, 0.085, 0.038), (0, 0, 0), 5, f'paw_F{side}'),
        (f'leg_H{side}_upper', (0.105 * sx, 0.27, 0.27), (0.06, 0.075, 0.115), (0, 0, 0), 5, f'leg_H{side}_upper'),
        (f'leg_H{side}_lower', (0.105 * sx, 0.275, 0.125), (0.043, 0.048, 0.085), (0, 0, 0), 5, f'leg_H{side}_lower'),
        (f'paw_H{side}', (0.115 * sx, 0.21, 0.038), (0.064, 0.085, 0.038), (0, 0, 0), 5, f'paw_H{side}'),
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
    mball = bpy.data.metaballs.new('PVP_Body')
    mball.resolution = 0.016
    mball.render_resolution = 0.016
    mball.threshold = THRESHOLD
    obj = link(bpy.data.objects.new('PVP_Body', mball))
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
    body.name = 'PVP_Body'

    decimate = body.modifiers.new('Decimate', 'DECIMATE')
    decimate.ratio = min(1.0, 3200 / max(1, len(body.data.polygons)))
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


HEAD_CENTER = Vector((0, -0.34, 0.73))


def body_color(co):
    x, y, z = co
    if y < -0.53:
        return WHITE                                   # hocico crema
    h = co - HEAD_CENTER
    if z > 0.52 and y < -0.12:
        blaze = 0.025 + 0.22 * max(0.0, 0.16 - h.z)
        if abs(h.x) < blaze and h.y < 0.03:
            return WHITE                               # lista facial del beagle
        return BROWN                                   # cabeza color avellana
    if y < -0.12 and z < 0.53:
        return WHITE                                   # garganta y pecho
    if z < 0.21:
        return WHITE                                   # calcetines blancos
    if y > 0.43 and z > 0.64:
        return WHITE                                   # punta blanca de la cola
    if -0.08 < y < 0.39 and z > 0.31:
        return DARK_SADDLE                             # silla negra tricolor
    return BROWN


# ── Piezas ────────────────────────────────────────────────────────────────────

def surface_hit(body, origin, direction):
    bpy.context.view_layer.update()
    hit, location, normal, _ = body.ray_cast(Vector(origin), Vector(direction).normalized())
    if not hit:
        raise RuntimeError(f'La superficie no aparece desde {origin}')
    return location, normal


def build_ear(side, base, folded, toon, detail):
    """Oreja larga y caída de beagle, con extremo redondeado."""
    sx = 1 if side == 'L' else -1
    height = 0.34

    def flap(scale=1.0):
        bm = ellipsoid((0.105 * scale, 0.035 * scale, height * 0.52 * scale), segments=(18, 12))
        bmesh.ops.translate(bm, vec=Vector((0.035 * sx, -0.015, -height * 0.43)), verts=bm.verts)
        return bm

    placement = Matrix.Translation(base) @ Euler((math.radians(8), math.radians(-18 * sx), math.radians(-12 * sx))).to_matrix().to_4x4()
    outer = flap()
    inner = flap(0.72)
    bmesh.ops.translate(inner, vec=Vector((0, -0.024, 0.008)), verts=inner.verts)
    bmesh.ops.transform(outer, matrix=placement, verts=outer.verts)
    bmesh.ops.transform(inner, matrix=placement, verts=inner.verts)
    ear = mesh_from_bmesh(f'ear_{side}', outer, toon, BROWN, f'ear_{side}')
    lining = mesh_from_bmesh(f'ear_{side}_lining', inner, detail, EAR_PINK, f'ear_{side}')
    tip = placement @ Vector((0.035 * sx, 0, -height * 0.86))
    return ear, lining, tip


def build_face(body, toon, detail):
    """Ojos, brillos, nariz y lengua, colocados sobre la superficie real de la cabeza."""
    parts = []
    eyes = {}
    for side, sx in (('L', 1), ('R', -1)):
        location, normal = surface_hit(body, (0.092 * sx, -2, 0.755), (0, 1, 0))
        center = location + normal * 0.004
        m = frame_along(center, -normal)
        parts.append(mesh_from_bmesh(f'eye_{side}', ellipsoid((0.034, 0.042, 0.02), m), detail, BLACK, f'eye_{side}'))
        shine_at = center + Vector((0.011 * sx, -0.012, 0.015)) + normal * 0.012
        parts.append(mesh_from_bmesh(f'eye_{side}_shine', ellipsoid((0.0105,) * 3, Matrix.Translation(shine_at), (8, 6)), detail, SHINE, f'eye_{side}'))
        eyes[side] = center

    location, normal = surface_hit(body, (0, -2, 0.665), (0, 1, 0))
    nose_at = location + normal * 0.006
    parts.append(mesh_from_bmesh('nose', ellipsoid((0.046, 0.032, 0.03), frame_along(nose_at, -normal)), detail, BLACK, 'head'))
    shine_at = nose_at + Vector((0.012, -0.018, 0.016))
    parts.append(mesh_from_bmesh('nose_shine', ellipsoid((0.011, 0.006, 0.007), Matrix.Translation(shine_at), (8, 6)), detail, SHINE, 'head'))

    under, _ = surface_hit(body, (0.03, -0.5, -1), (0, 0, 1))
    tongue_root = under + Vector((0, 0.02, 0.02))
    tongue_tip = under + Vector((0.012, -0.03, -0.075))
    mid = (tongue_root + tongue_tip) / 2 + Vector((0, -0.004, -0.006))
    tongue = mesh_from_bmesh('tongue', ellipsoid((0.036, 0.014, 0.058), frame_along(mid, tongue_tip - tongue_root)), toon, TONGUE, 'tongue')
    return parts, tongue, eyes, tongue_root, tongue_tip


# ── Esqueleto ─────────────────────────────────────────────────────────────────

def bone_specs(ear_bases, ear_tips, eyes, tongue_root, tongue_tip):
    specs = [
        # (nombre, cabeza, cola, padre, deforma)
        ('root', (0, 0, 0), (0, 0, 0.12), None, False),
        ('pivot', (0, 0.02, 0.32), (0, 0.02, 0.42), 'root', False),
        ('hips', (0, 0.27, 0.40), (0, 0.02, 0.41), 'pivot', True),
        ('chest', (0, 0.02, 0.41), (0, -0.20, 0.48), 'hips', True),
        ('neck', (0, -0.20, 0.48), (0, -0.30, 0.60), 'chest', True),
        ('head', (0, -0.30, 0.60), (0, -0.32, 0.88), 'neck', True),
        ('tongue', tuple(tongue_root), tuple(tongue_tip), 'head', True),
        ('tail_1', (0, 0.35, 0.37), (0, 0.40, 0.45), 'hips', True),
        ('tail_2', (0, 0.40, 0.45), (0, 0.435, 0.54), 'tail_1', True),
        ('tail_3', (0, 0.435, 0.54), (0, 0.45, 0.63), 'tail_2', True),
    ]
    for side in ('L', 'R'):
        specs.append((f'ear_{side}', tuple(ear_bases[side]), tuple(ear_tips[side]), 'head', True))
        specs.append((f'eye_{side}', tuple(eyes[side]), tuple(eyes[side] + Vector((0, -0.03, 0))), 'head', True))
    for side, sx in (('L', 1), ('R', -1)):
        fx, hx = 0.095 * sx, 0.105 * sx
        specs += [
            (f'leg_F{side}_upper', (fx, -0.14, 0.35), (fx, -0.15, 0.20), 'chest', True),
            (f'leg_F{side}_lower', (fx, -0.15, 0.20), (fx, -0.16, 0.05), f'leg_F{side}_upper', True),
            (f'paw_F{side}', (fx, -0.16, 0.05), (fx, -0.23, 0.025), f'leg_F{side}_lower', True),
            (f'leg_H{side}_upper', (hx, 0.26, 0.35), (hx, 0.275, 0.20), 'hips', True),
            (f'leg_H{side}_lower', (hx, 0.275, 0.20), (hx, 0.275, 0.05), f'leg_H{side}_upper', True),
            (f'paw_H{side}', (hx, 0.245, 0.05), (hx, 0.175, 0.025), f'leg_H{side}_lower', True),
        ]
    return specs


def build_rig(specs):
    data = bpy.data.armatures.new('PVP_Rig')
    rig = link(bpy.data.objects.new('PVP_Rig', data))
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
#           del hueso: l[1] es altura y l[2] es avance.
#   cola    rz la mueve de lado a lado.

LEGS = ('FL', 'FR', 'HL', 'HR')


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


def pose_sit():
    p = Pose()
    p.add('pivot', r=(-27, 0, 0), l=(0, -0.055, 0.02))
    p.add('head', r=(16, 0, 0))
    p.add('neck', r=(8, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(27, 0, 0))
        p.add(f'paw_F{side}', r=(0, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-62, 0, 0))
        p.add(f'leg_H{side}_lower', r=(92, 0, 0))
        p.add(f'paw_H{side}', r=(-28, 0, 0))
    return p


def pose_head_down(depth=1.0):
    p = Pose()
    p.add('pivot', r=(9 * depth, 0, 0), l=(0, -0.01 * depth, 0))
    p.add('chest', r=(5 * depth, 0, 0))
    p.add('neck', r=(34 * depth, 0, 0))
    p.add('head', r=(30 * depth, 0, 0))
    for leg in LEGS:
        p.add(f'leg_{leg}_upper', r=(-9 * depth, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-5 * depth, 0, 0))
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


def pose_crouch():
    p = Pose()
    p.add('root', l=(0, -0.05, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-18, 0, 0))
        p.add(f'leg_F{side}_lower', r=(30, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-28, 0, 0))
        p.add(f'leg_H{side}_lower', r=(48, 0, 0))
        p.add(f'paw_H{side}', r=(-18, 0, 0))
    p.add('head', r=(8, 0, 0))
    return p


def walk_legs(p, t, amount=1.0, stride=26):
    for leg, phase in (('FL', 0), ('HR', 0), ('FR', math.pi), ('HL', math.pi)):
        a = t + phase
        lift = max(0.0, math.cos(a))
        p.add(f'leg_{leg}_upper', r=(-stride * math.sin(a) * amount, 0, 0))
        p.add(f'leg_{leg}_lower', r=(34 * lift * amount, 0, 0))
        p.add(f'paw_{leg}', r=(-18 * lift * amount, 0, 0))


def blink(p, f, at, length=6):
    closed = hump(f, at, at + length)
    if closed:
        for side in 'LR':
            p.add(f'eye_{side}', s=(1, 1, 1 - 0.9 * closed))


def act_idle(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('chest', r=(1.4 * math.sin(6 * t), 0, 0))
    p.add('pivot', l=(0, 0.003 * math.sin(6 * t), 0))
    p.add('tongue', r=(7 * math.sin(6 * t), 0, 0))
    p.add('neck', r=(1.5 * math.sin(t), 0, 0))
    p.add('head', r=(2 * math.sin(t), 9 * math.sin(t + 0.4), 6 * math.sin(t + 1.1)))
    p.add('ear_L', r=(-14 * hump(f, 52, 58), 0, 0))
    blink(p, f, 38)
    return p


def act_walk(f, n):
    t = TAU * f / n
    p = Pose()
    walk_legs(p, t)
    p.add('pivot', r=(0, 0, 2.5 * math.sin(t)), l=(0, 0.009 * math.cos(2 * t), 0))
    p.add('head', r=(3 * math.cos(2 * t), 0, 0))
    p.add('tongue', r=(9 * math.cos(2 * t), 0, 0))
    for side in 'LR':
        p.add(f'ear_{side}', r=(5 * math.cos(2 * t), 0, 0))
    return p


def act_sit(f, n):
    t = TAU * f / n
    p = pose_sit()
    p.add('chest', r=(1.4 * math.sin(4 * t), 0, 0))
    p.add('tongue', r=(7 * math.sin(4 * t), 0, 0))
    p.add('head', r=(0, 10 * math.sin(t), 5 * math.sin(t + 0.8)))
    blink(p, f, 30)
    return p


def act_wave(f, n):
    t = TAU * f / n
    p = pose_sit()
    p.add('pivot', r=(-5, 0, 3))
    p.add('leg_FL_upper', r=(-128, 0, -12))
    p.add('leg_FL_lower', r=(35 + 28 * math.sin(3 * t), 0, 0))
    p.add('paw_FL', r=(18 * math.sin(3 * t + 0.8), 0, 0))
    p.add('head', r=(-4, 0, -12 + 3 * math.sin(3 * t)))
    p.add('tongue', r=(6 * math.sin(6 * t), 0, 0))
    return p


def act_wag(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('tail_1', r=(-12, 0, 30 * math.sin(t)))
    p.add('tail_2', r=(0, 0, 22 * math.sin(t - 0.7)))
    p.add('tail_3', r=(0, 0, 18 * math.sin(t - 1.4)))
    return p


def act_pee(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('pivot', r=(-3, 0, 9), l=(0.012, -0.012, 0))
    p.add('leg_HL_upper', r=(-12, 0, -78))
    p.add('leg_HL_lower', r=(28, 0, 0))
    p.add('paw_HL', r=(-22, 0, 0))
    p.add('leg_HR_upper', r=(0, 0, 6))
    p.add('leg_FR_upper', r=(0, 0, 5))
    p.add('head', r=(4, -14, 8))
    p.add('pivot', l=(0.0025 * math.sin(8 * t), 0, 0))
    for side in 'LR':
        p.add(f'eye_{side}', s=(1, 1, 0.55))
    return p


def act_poop(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('pivot', r=(-16, 0, 1.6 * math.sin(12 * t)), l=(0, -0.05, 0))
    p.add('hips', r=(-8, 0, 0))
    p.add('chest', r=(14, 0, 0))
    p.add('neck', r=(-6, 0, 0))
    p.add('head', r=(-4, 0, 0))
    for side in 'LR':
        p.add(f'leg_H{side}_upper', r=(-38, 0, 0))
        p.add(f'leg_H{side}_lower', r=(62, 0, 0))
        p.add(f'paw_H{side}', r=(-20, 0, 0))
        p.add(f'leg_F{side}_upper', r=(8, 0, 0))
        p.add(f'eye_{side}', s=(1, 1, 0.4))
    return p


def act_scratch(f, n):
    t = TAU * f / n
    p = Pose()
    p.add('pivot', r=(7, 0, 0), l=(0, -0.01, 0))
    p.add('head', r=(4, 22, 6))
    for side, phase in (('L', 0), ('R', math.pi)):
        kick = max(0.0, math.sin(t + phase))
        p.add(f'leg_H{side}_upper', r=(-8 + 50 * kick, 0, 0))
        p.add(f'leg_H{side}_lower', r=(-26 * kick, 0, 0))
        p.add(f'paw_H{side}', r=(34 * kick, 0, 0))
        p.add(f'leg_F{side}_upper', r=(-7, 0, 0))
    return p


def act_eat(f, n):
    t = TAU * f / n
    p = pose_head_down(0.82)
    p.add('head', r=(9 * math.sin(2 * t), 0, 4 * math.sin(t)))
    p.add('tongue', s=(1, 0.25, 1))
    for side in 'LR':
        p.add(f'ear_{side}', r=(5 * math.sin(2 * t), 0, 0))
    return p


def act_drink(f, n):
    """Dos lengüetazos por ciclo, a unos 2,4 por segundo: más rápido, a este
    tamaño, se lee como un temblor y no como un perro bebiendo."""
    t = TAU * f / n
    p = pose_head_down(0.9)
    p.add('head', r=(4 * math.sin(2 * t + 0.6), 0, 0))
    p.add('tongue', r=(20 * math.sin(2 * t), 0, 0), s=(1, 1.15, 1))
    for side in 'LR':
        p.add(f'eye_{side}', s=(1, 1, 0.7))
    return p


def act_roll(f, n):
    down = span(f, 0, 10) - span(f, 36, 46)
    roll = span(f, 10, 36)
    p = Pose().mix(pose_tuck(), down)
    p.add('pivot', r=(0, 0, 360 * roll))
    p.add('neck', r=(30 * down, 0, 0))
    p.add('head', r=(10 * down, 0, 0))
    for side in 'LR':
        p.add(f'ear_{side}', r=(-45 * down, 0, 0))
    blink(p, f, 16, 16)
    return p


def act_backflip(f, n):
    crouch = hump(f, 0, 12) if f < 6 else hump(f, 26, 36) if f > 26 else 0.0
    air = min(1.0, max(0.0, (f - 6) / 20))
    flying = 0.0 < air < 1.0
    p = Pose().mix(pose_crouch(), crouch)
    if flying:
        p.mix(pose_tuck(), hump(f, 6, 26) ** 0.5)
        p.add('root', l=(0, 0.52 * 4 * air * (1 - air), 0))
    p.add('pivot', r=(-360 * ease(air), 0, 0))
    return p


def act_spin(f, n):
    turn = span(f, 2, 44)
    p = Pose()
    walk_legs(p, TAU * f / 12, amount=hump(f, 0, 48) ** 0.3, stride=22)
    p.add('root', r=(0, 720 * turn, 0))
    p.add('neck', r=(0, 16, 0))
    p.add('head', r=(0, 28, 10))
    p.add('hips', r=(0, -14, 0))
    return p


def act_play_dead(f, n):
    fall = span(f, 0, 12)
    back = span(f, 54, 70)
    lying = fall * (1 - back)
    p = Pose()
    p.add('pivot', r=(0, 0, 90 * lying))
    p.add('root', l=(0, 0, 0))
    for side, sx in (('L', 1), ('R', -1)):
        p.add(f'leg_F{side}_upper', r=(-20 * lying, 0, -12 * sx * lying))
        p.add(f'leg_H{side}_upper', r=(18 * lying, 0, -12 * sx * lying))
        p.add(f'eye_{side}', s=(1, 1, 1 - 0.9 * hump(f, 8, 58) ** 0.2))
    twitch = hump(f, 36, 42)
    p.add('leg_FL_lower', r=(25 * twitch, 0, 0))
    p.add('tongue', r=(-20 * lying, 0, -30 * lying), s=(1, 1 + 0.35 * lying, 1))
    p.add('head', r=(-10 * lying, 0, -18 * lying))
    return p


def act_beg(f, n):
    t = TAU * f / n
    p = pose_sit()
    p.add('pivot', r=(-30, 0, 0), l=(0, 0.02 + 0.008 * math.sin(2 * t), 0.04))
    p.add('head', r=(30, 0, 8 * math.sin(t)))
    p.add('neck', r=(8, 0, 0))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-38, 0, 0))
        p.add(f'leg_F{side}_lower', r=(88 + 12 * math.sin(2 * t), 0, 0))
        p.add(f'paw_F{side}', r=(35, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-18, 0, 0))
        p.add(f'leg_H{side}_lower', r=(8, 0, 0))
    p.add('tongue', r=(8 * math.sin(4 * t), 0, 0))
    return p


def act_jump(f, n):
    crouch = hump(f, 0, 10) if f < 5 else hump(f, 17, 24) if f > 17 else 0.0
    air = min(1.0, max(0.0, (f - 5) / 13))
    p = Pose().mix(pose_crouch(), crouch)
    if 0.0 < air < 1.0:
        p.add('root', l=(0, 0.4 * 4 * air * (1 - air), 0))
        p.add('pivot', r=(-18 * math.sin(math.pi * air), 0, 0))
        stretch = math.sin(math.pi * air)
        for side in 'LR':
            p.add(f'leg_F{side}_upper', r=(-40 * stretch, 0, 0))
            p.add(f'leg_H{side}_upper', r=(35 * stretch, 0, 0))
        p.add('head', r=(-10 * stretch, 0, 0))
    return p


def act_sleep(f, n):
    """Tumbado como una esfinge, la cabeza apoyada y ladeada, respirando despacio."""
    t = TAU * f / n
    p = Pose()
    p.add('pivot', r=(3, 0, 0))
    p.add('chest', r=(1.8 * math.sin(t), 0, 0))
    p.add('neck', r=(26 + 2 * math.sin(t), 0, 0))
    p.add('head', r=(14, 0, 12))
    p.add('tongue', s=(1, 0.3, 1))
    for side in 'LR':
        p.add(f'leg_F{side}_upper', r=(-78, 0, 0))
        p.add(f'leg_F{side}_lower', r=(-6, 0, 0))
        p.add(f'paw_F{side}', r=(62, 0, 0))
        p.add(f'leg_H{side}_upper', r=(-68, 0, 0))
        p.add(f'leg_H{side}_lower', r=(112, 0, 0))
        p.add(f'paw_H{side}', r=(-30, 0, 0))
        p.add(f'eye_{side}', s=(1, 1, 0.1))
        p.add(f'ear_{side}', r=(-38, 0, 0))
    return p


def act_run(f, n):
    """Galope de carrera loca: manos juntas, patas juntas, el cuerpo ondulando."""
    t = TAU * f / n
    p = Pose()
    for side, lag in (('L', 0.0), ('R', 0.35)):
        front = t + lag
        hind = t + math.pi + lag
        p.add(f'leg_F{side}_upper', r=(-38 * math.sin(front), 0, 0))
        p.add(f'leg_F{side}_lower', r=(40 * max(0.0, math.cos(front)), 0, 0))
        p.add(f'leg_H{side}_upper', r=(-36 * math.sin(hind), 0, 0))
        p.add(f'leg_H{side}_lower', r=(44 * max(0.0, math.cos(hind)), 0, 0))
    p.add('pivot', r=(7 * math.sin(t + 1.2), 0, 0), l=(0, 0.025 * max(0.0, math.sin(t + 0.4)), 0))
    p.add('head', r=(-6 * math.sin(t + 1.2), 0, 0))
    p.add('tongue', r=(18 * math.sin(t), 0, 12))
    for side in 'LR':
        p.add(f'ear_{side}', r=(-28 + 8 * math.sin(t), 0, 0))
    return p


# (nombre, fotogramas, función, en bucle, suelo)
#
# El suelo lo resuelve el script, no cada pose: después de colocar los huesos de
# un fotograma se mide el punto más bajo de la malla deformada y se sube o baja
# la raíz. `snap` apoya siempre al perro en la pastilla (sentarse, rodar...);
# `lift` solo impide que la atraviese, para que los saltos puedan despegar;
# `None` deja el clip sin raíz, como la cola, que se superpone a todo.
ACTIONS = [
    ('idle', 72, act_idle, True, 'snap'),
    ('walk', 16, act_walk, True, 'snap'),
    ('sit', 48, act_sit, True, 'snap'),
    ('wave', 48, act_wave, True, 'snap'),
    ('wag', 12, act_wag, True, None),
    ('pee', 48, act_pee, True, 'snap'),
    ('poop', 48, act_poop, True, 'snap'),
    ('scratch', 16, act_scratch, True, 'snap'),
    ('eat', 16, act_eat, True, 'snap'),
    ('drink', 20, act_drink, True, 'snap'),
    ('roll', 48, act_roll, False, 'snap'),
    ('backflip', 36, act_backflip, False, 'lift'),
    ('spin', 48, act_spin, False, 'snap'),
    ('play_dead', 72, act_play_dead, False, 'snap'),
    ('beg', 48, act_beg, True, 'snap'),
    ('jump', 24, act_jump, False, 'lift'),
    ('sleep', 48, act_sleep, True, 'snap'),
    ('run', 12, act_run, True, 'snap'),
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


def settle(rig, dog, frame, mode):
    """Corrige la altura de la raíz para que el punto más bajo quede en el suelo."""
    apply_frame(rig, frame)
    lowest = lowest_point(dog)
    lift = -lowest if mode == 'snap' else max(0.0, -lowest)
    x, up, z = frame['root']['l']
    frame['root']['l'] = (x, up + lift, z)


def reset_pose(rig):
    for pbone in rig.pose.bones:
        pbone.location = (0, 0, 0)
        pbone.rotation_euler = (0, 0, 0)
        pbone.scale = (1, 1, 1)


def bake_action(rig, dog, name, length, fn, loop, ground):
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
            settle(rig, dog, frame, ground)
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


# ── Chonete ───────────────────────────────────────────────────────────────────

def build_chonete(dog, rig, toon):
    """El sombrero típico para el Mes Patrio, atado al hueso de la cabeza.

    Paja clara, cinta roja y la copa hundida por el centro, como el que viste el
    logo. Va ladeado igual que aquel y se apoya entre las orejas, que asoman por
    el ala. El GLB lo lleva siempre; la web lo muestra solo en septiembre.
    """
    size = 1.3

    def profile(points):
        return [(r * size, z * size) for r, z in points]

    def crown_dent(bm):
        # La copa se hunde de delante atrás: deja dos lomos, como el del logo.
        for vert in bm.verts:
            rise = min(1.0, max(0.0, (vert.co.z - 0.06 * size) / (0.06 * size)))
            vert.co.z -= 0.03 * size * rise * math.exp(-((vert.co.x / (0.034 * size)) ** 2))
        return bm

    brim = lathe(profile([(0.075, 0.0), (0.16, -0.004), (0.2, 0.01), (0.207, 0.022), (0.197, 0.025), (0.16, 0.011), (0.075, 0.014)]), 32, closed=True)
    crown = crown_dent(lathe(profile([(0.001, 0.0), (0.095, 0.0), (0.094, 0.04), (0.089, 0.085), (0.081, 0.103), (0.067, 0.114),
                                      (0.047, 0.12), (0.024, 0.124), (0.001, 0.125)]), 32))
    band = lathe(profile([(0.093, 0.004), (0.104, 0.004), (0.103, 0.05), (0.091, 0.05)]), 32, closed=True)
    parts = [
        mesh_from_bmesh('acc_chonete', crown, toon, STRAW),
        mesh_from_bmesh('acc_chonete_brim', brim, toon, STRAW_DARK),
        mesh_from_bmesh('acc_chonete_band', band, toon, HAT_BAND),
    ]
    hat = join(parts, 'acc_chonete')

    # Algo adelantado hacia la frente, para que se vea de frente, y ladeado hacia
    # la oreja doblada: por el otro lado la oreja erguida lo empujaría.
    top, _ = surface_hit(dog, (-0.02, -0.33, 2), (0, 0, -1))
    world = Matrix.Translation(top - Vector((0, 0, 0.04))) @ Euler((math.radians(-14), math.radians(-12), math.radians(-6))).to_matrix().to_4x4()
    hat.matrix_world = world
    hat.parent = rig
    hat.parent_type = 'BONE'
    hat.parent_bone = 'head'
    bpy.context.view_layer.update()
    hat.matrix_world = world
    return hat


# ── Disfraz de Halloween: calabaza ───────────────────────────────────────────────
#
# Un traje de calabaza hecho a la medida del perro, no una pieza apoyada encima.
# Envuelve pecho, lomo y grupa; la cabeza, las patas y la cola salen por donde
# saldrían de un disfraz de verdad; y cada vértice lleva los huesos del pecho y
# de la grupa en la misma proporción que el cuerpo que tiene debajo, así que se
# dobla con él en todas las animaciones (sentarse, rodar, la voltereta...).

PUMPKIN_CENTER = Vector((0, 0.035, 0.335))
PUMPKIN_RADII = (0.27, 0.375, 0.225, 0.20)   # ancho, largo, alto hacia arriba y hacia abajo
# Más de 2 cuadra la elipse. De perfil aplana arriba y abajo, como una calabaza;
# en planta llena las esquinas, donde asomaban el pecho y los muslos.
PUMPKIN_PROFILE = 2.5
PUMPKIN_PLAN = 2.4
PUMPKIN_LOBES = 8
PUMPKIN_LOBE_DEPTH = 0.075


def pumpkin_lobe(phi):
    """0 en el centro de cada gajo, 1 en el surco."""
    return 1 - abs(math.cos(PUMPKIN_LOBES * phi / 2))


def build_pumpkin_shell():
    cx, cy, cz = PUMPKIN_CENTER
    rx, ry, up, down = PUMPKIN_RADII
    exp = 2 / PUMPKIN_PROFILE

    def squared(value):
        return math.copysign(abs(value) ** (2 / PUMPKIN_PLAN), value)

    around, rings = PUMPKIN_LOBES * 6, 16
    bm = bmesh.new()
    rows = []
    for j in range(1, rings):
        theta = -math.pi / 2 + math.pi * j / rings
        h = math.cos(theta) ** exp
        v = math.copysign(abs(math.sin(theta)) ** exp, theta)
        z = cz + v * (up if v > 0 else down)
        if v > 0:
            z -= 0.035 * (1 - h) ** 3             # el hoyuelo donde nace el tallo
        row = []
        for i in range(around):
            phi = TAU * i / around
            r = h * (1 - PUMPKIN_LOBE_DEPTH * pumpkin_lobe(phi) ** 0.7)
            row.append(bm.verts.new((cx + rx * r * squared(math.cos(phi)), cy + ry * r * squared(math.sin(phi)), z)))
        rows.append(row)
    bottom = bm.verts.new((cx, cy, cz - down))
    top = bm.verts.new((cx, cy, cz + up - 0.035))
    for lower, upper in zip(rows, rows[1:]):
        for i in range(around):
            k = (i + 1) % around
            bm.faces.new((lower[i], lower[k], upper[k], upper[i]))
    for i in range(around):
        k = (i + 1) % around
        bm.faces.new((rows[0][k], rows[0][i], bottom))
        bm.faces.new((rows[-1][i], rows[-1][k], top))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def pumpkin_color(co):
    def unsquared(value):
        return math.copysign(abs(value) ** (PUMPKIN_PLAN / 2), value)

    phi = math.atan2(unsquared((co.y - PUMPKIN_CENTER.y) / PUMPKIN_RADII[1]), unsquared(co.x / PUMPKIN_RADII[0]))
    groove = ease((pumpkin_lobe(phi) - 0.55) / 0.4)
    return tuple(a + (b - a) * groove for a, b in zip(PUMPKIN, PUMPKIN_GROOVE))


def torso_weights(co):
    """Pecho y grupa en la misma proporción que el cuerpo a esa altura del lomo."""
    spine = Vector((0, co.y, 0.32))
    share = {'chest': 0.0, 'hips': 0.0}
    for blob in BLOBS:
        if blob[5] in share:
            share[blob[5]] += blob_field(blob, spine)
    total = sum(share.values())
    if not total:
        return {'chest': 1.0} if co.y < 0.08 else {'hips': 1.0}
    return {bone: value / total for bone, value in share.items() if value > 0}


def skin_to_torso(obj):
    groups = {}
    for vert in obj.data.vertices:
        for bone, weight in torso_weights(vert.co).items():
            if bone not in groups:
                groups[bone] = obj.vertex_groups.get(bone) or obj.vertex_groups.new(name=bone)
            groups[bone].add([vert.index], weight, 'REPLACE')


def leaf(length, width, thick, lift):
    """Hoja en punta que nace en el origen y se alarga por +Y, con la punta algo levantada."""
    bm = ellipsoid((width / 2, length / 2, thick / 2), Matrix.Translation((0, length / 2, 0)), (8, 5))
    for vert in bm.verts:
        t = max(0.0, vert.co.y / length)
        vert.co.x *= 1 - 0.8 * max(0.0, t - 0.45) / 0.55
        vert.co.z += lift * t * t
    return bm


def surface_frame(origin, normal, outward):
    """Matriz con Z sobre la normal e Y hacia `outward`, pegada a la superficie."""
    z = Vector(normal).normalized()
    y = (Vector(outward) - z * Vector(outward).dot(z)).normalized()
    x = y.cross(z)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m.translation = Vector(origin)
    return m


def build_pumpkin_suit(dog, toon):
    shell = mesh_from_bmesh('acc_halloween', build_pumpkin_shell(), toon, PUMPKIN)
    paint(shell, pumpkin_color)
    bpy.context.view_layer.update()

    def on_shell(origin, direction):
        hit, location, normal, _ = shell.ray_cast(Vector(origin), Vector(direction).normalized())
        if not hit:
            raise RuntimeError(f'La calabaza no aparece desde {origin}')
        return location, normal

    parts = [shell]

    # El tallo, en el hoyuelo del lomo, curvado hacia la cola.
    top, _ = on_shell(PUMPKIN_CENTER + Vector((0, 0, 1)), (0, 0, -1))
    stem = lathe([(0.001, -0.03), (0.044, -0.03), (0.042, 0.0), (0.035, 0.055), (0.03, 0.095),
                  (0.039, 0.112), (0.034, 0.125), (0.001, 0.13)], 7)
    for vert in stem.verts:
        vert.co.y += 3.2 * max(0.0, vert.co.z) ** 2
    bmesh.ops.transform(stem, matrix=Matrix.Translation(top), verts=stem.verts)
    parts.append(mesh_from_bmesh('acc_halloween_stem', stem, toon, PUMPKIN_STEM))

    # Una hoja junto al tallo, tendida sobre el lomo.
    at, normal = on_shell(top + Vector((0.035, -0.03, 0.3)), (0, 0, -1))
    stem_leaf = mesh_from_bmesh('acc_halloween_leaf', leaf(0.13, 0.085, 0.014, 0.02), toon, PUMPKIN_LEAF)
    stem_leaf.data.transform(surface_frame(at + normal * 0.004, normal, (1, -0.6, 0)))
    parts.append(stem_leaf)

    # El cuello de hojas: tapa la costura entre el traje y el cuello, y separa
    # el naranja de la cabeza del de la calabaza.
    neck_base = Vector((0, -0.20, 0.415))
    neck_axis = Vector((0, -0.08, 0.12)).normalized()
    center, _ = on_shell(neck_base + neck_axis, -neck_axis)
    side = Vector((1, 0, 0))
    ahead = neck_axis.cross(side)
    for k in range(11):
        a = TAU * k / 11
        radial = side * math.cos(a) + ahead * math.sin(a)
        hit, location, _, _ = dog.ray_cast(center, radial)
        reach = (location - center).length if hit else 0.14
        at, normal = on_shell(center + radial * (reach - 0.025) + neck_axis * 0.4, -neck_axis)
        length = 0.125 if k % 2 else 0.105
        piece = mesh_from_bmesh(f'acc_halloween_collar_{k}', leaf(length, 0.105, 0.016, 0.03), toon, PUMPKIN_LEAF)
        piece.data.transform(surface_frame(at + normal * 0.006, normal, radial))
        parts.append(piece)

    suit = join(parts, 'acc_halloween')
    skin_to_torso(suit)
    return suit


# ── Disfraz de Halloween: sombrero de bruja ─────────────────────────────────────
#
# El del logo de octubre: copa de carbón que se dobla hacia atrás y acaba en
# punta, ala ancha negra por encima y morada por debajo, cinta morada con hebilla
# naranja y, en la cinta, una calabacita con carita, tallo y hoja. Va con el
# traje de calabaza: el GLB lo lleva siempre y la web lo viste en octubre.

WITCH_BRIM = (0.125, 0.29)          # radio interior y exterior del ala
WITCH_CROWN_RADIUS = 0.135          # radio de la copa en la base
WITCH_CROWN_LENGTH = 0.52           # largo de la copa medido por su eje
# Hacia dónde se dobla la punta, en planta: atrás y hacia la oreja erguida. De
# frente así se ve el gancho, como en el logo; doblada solo hacia atrás, el
# perrito (que casi siempre mira a quien lo ve) parecería llevar un cucurucho.
WITCH_TIP_HEADING = math.radians(50)
WITCH_BAND = (0.004, 0.052)         # alturas de la cinta sobre el ala


def sweep(points, radii, segments=20):
    """Tubo a lo largo de una curva, con un anillo por punto perpendicular a ella.

    Los anillos se orientan por transporte paralelo, así que el tubo no se
    retuerce al doblarse. Si el último radio es cero, acaba en punta.
    """
    pts = [Vector(p) for p in points]
    tangents = [(pts[min(len(pts) - 1, i + 1)] - pts[max(0, i - 1)]).normalized() for i in range(len(pts))]
    normal = Vector((1, 0, 0))
    bm = bmesh.new()
    rings = []
    for p, t, r in zip(pts, tangents, radii):
        normal = (normal - t * normal.dot(t)).normalized()
        if r <= 1e-5:
            rings.append([bm.verts.new(p)])
            continue
        binormal = t.cross(normal)
        rings.append([bm.verts.new(p + (normal * math.cos(TAU * s / segments) + binormal * math.sin(TAU * s / segments)) * r)
                      for s in range(segments)])
    for lower, upper in zip(rings, rings[1:]):
        if len(upper) == 1:
            for s in range(segments):
                bm.faces.new((lower[s], lower[(s + 1) % segments], upper[0]))
        else:
            for s in range(segments):
                k = (s + 1) % segments
                bm.faces.new((lower[s], lower[k], upper[k], upper[s]))
    if len(rings[0]) > 1:
        bm.faces.new(list(reversed(rings[0])))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return bm


def witch_crown_spine(steps=22):
    """El eje de la copa: sube recto, se dobla hacia atrás y de lado, y cae en punta."""
    points, radii = [], []
    p = Vector((0, 0, -0.02))
    ds = WITCH_CROWN_LENGTH / steps
    side, back = math.sin(WITCH_TIP_HEADING), math.cos(WITCH_TIP_HEADING)
    for i in range(steps + 1):
        t = i / steps
        points.append(p.copy())
        radii.append(WITCH_CROWN_RADIUS * (1 - t) ** 0.85)
        u = min(1.0, max(0.0, (t - 0.36) / 0.62))
        angle = math.radians(122) * u * u * (3 - 2 * u)
        p += Vector((side * math.sin(angle), back * math.sin(angle), math.cos(angle))) * ds
    return points, radii


def witch_crown_radius(z):
    """Radio de la copa a la altura `z`, en su tramo recto (el de la cinta)."""
    t = (z + 0.02) / WITCH_CROWN_LENGTH
    return WITCH_CROWN_RADIUS * (1 - t) ** 0.85


def witch_brim_mid(r):
    """Línea media del ala: cae un poco hacia fuera y levanta el canto."""
    ri, ro = WITCH_BRIM
    u = (r - ri) / (ro - ri)
    return -0.022 * u * u + 0.012 * max(0.0, (u - 0.82) / 0.18) ** 2


def build_witch_brim():
    ri, ro = WITCH_BRIM
    steps = 5
    radii = [ri + (ro - ri) * i / steps for i in range(steps + 1)]
    thickness = [0.017 - 0.006 * i / steps for i in range(steps + 1)]
    under = [(r, witch_brim_mid(r) - h / 2) for r, h in zip(radii, thickness)]
    over = [(r, witch_brim_mid(r) + h / 2) for r, h in zip(radii, thickness)]
    return lathe(under + [(ro + 0.005, witch_brim_mid(ro))] + list(reversed(over)), 30, closed=True)


def witch_brim_color(co):
    r = math.hypot(co.x, co.y)
    return WITCH_PURPLE_DARK if co.z < witch_brim_mid(r) - 1e-4 else WITCH_HAT


def band_point(azimuth, z, out=0.0):
    """Punto de la cinta en el azimut dado (0 = +X, hacia la izquierda del perro) y su normal."""
    r = witch_crown_radius(z) + 0.009 + out
    radial = Vector((math.cos(azimuth), math.sin(azimuth), 0))
    slope = (witch_crown_radius(z) - witch_crown_radius(z + 0.01)) / 0.01
    return radial * r + Vector((0, 0, z)), (radial + Vector((0, 0, slope))).normalized()


def build_mini_pumpkin(center, outward, toon, detail):
    """La calabacita de la cinta: seis gajos, tallo, hoja y carita mirando afuera."""
    radius = 0.052
    lobes = 6
    bm = ellipsoid((radius, radius, radius * 0.8), Matrix.Translation(center), (18, 8))
    for vert in bm.verts:
        local = vert.co - center
        phi = math.atan2(local.y, local.x)
        k = 1 - 0.13 * (1 - abs(math.cos(lobes * phi / 2))) ** 0.7
        local.x *= k
        local.y *= k
        local.z -= 0.012 * max(0.0, local.z / (radius * 0.8)) ** 6   # hoyuelo del tallo
        vert.co = center + local
    body = mesh_from_bmesh('acc_witch_hat_pumpkin', bm, toon, WITCH_PUMPKIN)

    def groove(co):
        phi = math.atan2(co.y - center.y, co.x - center.x)
        g = ease((1 - abs(math.cos(lobes * phi / 2)) - 0.6) / 0.35)
        return tuple(a + (b - a) * g for a, b in zip(WITCH_PUMPKIN, WITCH_PUMPKIN_GROOVE))

    paint(body, groove)
    parts = [body]

    top = center + Vector((0, 0, radius * 0.8 - 0.012))
    stem = lathe([(0.001, -0.006), (0.011, -0.006), (0.01, 0.012), (0.008, 0.026), (0.001, 0.028)], 7)
    for vert in stem.verts:
        vert.co.x += 0.25 * max(0.0, vert.co.z) * 3
    bmesh.ops.transform(stem, matrix=Matrix.Translation(top), verts=stem.verts)
    parts.append(mesh_from_bmesh('acc_witch_hat_stem', stem, toon, WITCH_STEM))

    side = Vector((0, 0, 1)).cross(outward).normalized()
    pumpkin_leaf = mesh_from_bmesh('acc_witch_hat_leaf', leaf(0.06, 0.04, 0.008, 0.012), toon, WITCH_LEAF)
    pumpkin_leaf.data.transform(surface_frame(top + side * 0.012 + Vector((0, 0, 0.002)), Vector((0, 0.15, 1)) - outward * 0.2, side + outward * 0.35))
    parts.append(pumpkin_leaf)

    # La carita va sobre el gajo que mira afuera: dos ojos y una sonrisa.
    face = []
    for sx in (-1, 1):
        d = (outward * math.cos(0.42) + side * sx * math.sin(0.42) + Vector((0, 0, 0.18))).normalized()
        at = center + Vector((d.x * radius * 0.9, d.y * radius * 0.9, d.z * radius * 0.8 * 0.9))
        face.append(mesh_from_bmesh('acc_witch_hat_eye', ellipsoid((0.0055, 0.0075, 0.004), frame_along(at, d), (8, 5)), detail, BLACK))
    smile = []
    for k in range(7):
        a = -0.35 + 0.7 * k / 6
        d = (outward * math.cos(a) + side * math.sin(a) + Vector((0, 0, -0.22 - 0.12 * math.cos(a * 4.5)))).normalized()
        smile.append(center + Vector((d.x * radius * 0.93, d.y * radius * 0.93, d.z * radius * 0.8 * 0.93)))
    face.append(mesh_from_bmesh('acc_witch_hat_smile', sweep(smile, [0.0028] * 7, 4), detail, BLACK))
    return parts, face


def build_witch_hat(dog, rig, toon, detail, outline_mat):
    """El sombrero de bruja del logo de octubre, atado al hueso de la cabeza."""
    points, radii = witch_crown_spine()
    crown = mesh_from_bmesh('acc_witch_hat', sweep(points, radii, 20), toon, WITCH_HAT)
    brim = mesh_from_bmesh('acc_witch_hat_brim', build_witch_brim(), toon, WITCH_HAT)
    paint(brim, witch_brim_color)

    z0, z1 = WITCH_BAND
    band = lathe([(witch_crown_radius(z0) - 0.004, z0), (witch_crown_radius(z0) + 0.009, z0),
                  (witch_crown_radius(z1) + 0.009, z1), (witch_crown_radius(z1) - 0.004, z1)], 20, closed=True)
    parts = [crown, brim, mesh_from_bmesh('acc_witch_hat_band', band, toon, WITCH_PURPLE)]

    # La hebilla, al frente y algo hacia la oreja doblada, como en el logo.
    at, normal = band_point(math.radians(-104), (z0 + z1) / 2)
    buckle = lathe([(0.021, 0), (0.038, 0), (0.038, 0.009), (0.021, 0.009)], 4, closed=True)
    bmesh.ops.rotate(buckle, cent=Vector(), matrix=Matrix.Rotation(math.radians(45), 3, 'Z'), verts=buckle.verts)
    bmesh.ops.transform(buckle, matrix=surface_frame(at - normal * 0.003, normal, (0, 0, 1)), verts=buckle.verts)
    parts.append(mesh_from_bmesh('acc_witch_hat_buckle', buckle, toon, WITCH_BUCKLE))

    # La calabacita, del lado de la oreja erguida y mirando hacia delante.
    azimuth = math.radians(-42)
    at, normal = band_point(azimuth, 0.04, out=0.03)
    outward = Vector((math.cos(azimuth), math.sin(azimuth), 0))
    pumpkin, face = build_mini_pumpkin(at, outward, toon, detail)
    parts += pumpkin

    # El trazo rodea el sombrero, no la carita (va en PVP_Detail, como los ojos
    # del perro): por eso el casco se saca antes de unirla.
    hat = join(parts, 'acc_witch_hat')
    shell = outline_shell(hat, OUTLINE, outline_mat)
    hat = join([hat] + face, 'acc_witch_hat')
    shell.parent = hat
    shell.parent_type = 'OBJECT'
    shell.matrix_parent_inverse = Matrix()
    shell.matrix_basis = Matrix()

    # Adelantado hacia la frente y ladeado atrás y hacia la oreja doblada, igual
    # que el chonete: por el otro lado la oreja erguida lo empujaría.
    top, _ = surface_hit(dog, (-0.03, -0.32, 2), (0, 0, -1))
    world = Matrix.Translation(top - Vector((0, 0, 0.045))) @ Euler((math.radians(-14), math.radians(-11), math.radians(-8))).to_matrix().to_4x4()
    hat.matrix_world = world
    hat.parent = rig
    hat.parent_type = 'BONE'
    hat.parent_bone = 'head'
    bpy.context.view_layer.update()
    hat.matrix_world = world
    return hat


# ── Utilería ──────────────────────────────────────────────────────────────────

def bowl_profile(radius=0.12, height=0.065):
    return [
        (0.0, 0.0), (radius * 0.82, 0.0), (radius, height * 0.8), (radius * 1.04, height),
        (radius * 0.93, height), (radius * 0.8, height * 0.35), (0.0, height * 0.35),
    ]


def build_props(toon, detail, outline_mat):
    """Los platos y la caca llevan trazo (material PVP_Toon); el resto es color plano."""
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

    puddle = bmesh.new()
    rim = []
    for i in range(20):
        angle = TAU * i / 20
        radius = 0.075 * (1 + 0.18 * math.sin(3 * angle) + 0.1 * math.cos(5 * angle + 1))
        rim.append(puddle.verts.new((radius * math.cos(angle), radius * 0.8 * math.sin(angle), 0.002)))
    puddle.faces.new(rim)
    puddle.faces.ensure_lookup_table()
    puddle.normal_update()
    if puddle.faces[0].normal.z < 0:
        bmesh.ops.reverse_faces(puddle, faces=puddle.faces)
    props.append(mesh_from_bmesh('prop_puddle', puddle, detail, PEE))

    poop = bmesh.new()
    for major, minor, height in ((0.042, 0.021, 0.021), (0.03, 0.018, 0.052), (0.017, 0.015, 0.078)):
        ring = lathe([(major + minor * math.cos(a), height + minor * math.sin(a)) for a in (TAU * k / 10 for k in range(10))], 18, closed=True)
        me = bpy.data.meshes.new('tmp')
        ring.to_mesh(me)
        ring.free()
        poop.from_mesh(me)
        bpy.data.meshes.remove(me)
    tip = lathe([(0.0, 0.085), (0.016, 0.088), (0.0, 0.112)], 12)
    me = bpy.data.meshes.new('tmp')
    tip.to_mesh(me)
    tip.free()
    poop.from_mesh(me)
    bpy.data.meshes.remove(me)
    finish(mesh_from_bmesh('prop_poop', poop, toon, POOP))

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
        # Sin normales: la web las recalcula al cargar (son suaves en toda la
        # malla) y así el archivo pesa unos 60 KB menos.
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
        # Solo los canales con curva propia. Así cada clip trae únicamente los
        # huesos que mueve y la web puede superponer la cola (`wag`) sobre
        # cualquier otro sin que el reposo de un clip pise al otro.
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
    ('idle', 'idle', 40, 'three_quarter'), ('walk_a', 'walk', 4, 'side'), ('walk_b', 'walk', 12, 'side'),
    ('sit', 'sit', 0, 'three_quarter'), ('wave', 'wave', 8, 'front'), ('wag', 'wag', 3, 'back'),
    ('pee', 'pee', 10, 'front'), ('poop', 'poop', 10, 'side'), ('scratch', 'scratch', 4, 'side'),
    ('eat', 'eat', 4, 'three_quarter'), ('drink', 'drink', 3, 'three_quarter'),
    ('roll', 'roll', 22, 'three_quarter'), ('backflip', 'backflip', 16, 'side'),
    ('spin', 'spin', 20, 'three_quarter'), ('play_dead', 'play_dead', 30, 'three_quarter'),
    ('beg', 'beg', 6, 'three_quarter'), ('jump', 'jump', 11, 'side'),
    ('sleep', 'sleep', 10, 'three_quarter'), ('sleep_side', 'sleep', 10, 'side'),
    ('run_a', 'run', 2, 'side'), ('run_b', 'run', 8, 'side'),
    ('chonete', None, 0, 'three_quarter'), ('chonete_front', None, 0, 'front'), ('chonete_side', None, 0, 'side'),
    ('chonete_walk', 'walk', 4, 'three_quarter'), ('chonete_eat', 'eat', 4, 'three_quarter'), ('chonete_sleep', 'sleep', 10, 'three_quarter'),
    ('pumpkin', None, 0, 'three_quarter'), ('pumpkin_front', None, 0, 'front'), ('pumpkin_side', None, 0, 'side'),
    ('pumpkin_back', None, 0, 'back'), ('pumpkin_walk', 'walk', 4, 'three_quarter'), ('pumpkin_run', 'run', 8, 'side'),
    ('pumpkin_sit', 'sit', 0, 'three_quarter'), ('pumpkin_eat', 'eat', 4, 'three_quarter'), ('pumpkin_drink', 'drink', 3, 'side'),
    ('pumpkin_sleep', 'sleep', 10, 'three_quarter'), ('pumpkin_pee', 'pee', 10, 'front'), ('pumpkin_poop', 'poop', 10, 'side'),
    ('pumpkin_beg', 'beg', 6, 'three_quarter'), ('pumpkin_wave', 'wave', 8, 'front'), ('pumpkin_roll', 'roll', 22, 'three_quarter'),
    ('pumpkin_play_dead', 'play_dead', 30, 'three_quarter'), ('pumpkin_jump', 'jump', 11, 'side'), ('pumpkin_backflip', 'backflip', 16, 'side'),
    ('pumpkin_spin', 'spin', 20, 'three_quarter'), ('pumpkin_scratch', 'scratch', 4, 'side'), ('pumpkin_idle', 'idle', 40, 'three_quarter'),
    ('pumpkin_head', None, 0, 'head'), ('pumpkin_head_front', None, 0, 'head_front'), ('pumpkin_head_left', None, 0, 'head_left'),
]

VIEWS = {
    'three_quarter': ((-1.9, -2.5, 1.35), (0, -0.05, 0.42)),
    'front': ((0, -3.1, 0.9), (0, -0.1, 0.45)),
    'side': ((-3.1, -0.05, 0.75), (0, -0.05, 0.45)),
    'back': ((1.2, 2.8, 1.3), (0, 0.1, 0.45)),
    'head': ((-1.2, -1.6, 1.15), (0, -0.3, 0.85)),
    'head_front': ((0.0, -1.9, 1.15), (0, -0.25, 0.85)),
    'head_left': ((0.55, -0.95, 1.05), (0.06, -0.42, 0.9)),
}

PROP_SPOTS = {
    'eat': {'prop_food_bowl': (0, -0.66, 0), 'prop_kibble': (0, -0.66, 0)},
    'drink': {'prop_water_bowl': (0, -0.7, 0), 'prop_water': (0, -0.7, 0.04)},
    'pee': {'prop_puddle': (0.2, 0.3, 0)},
    'poop': {'prop_poop': (0, 0.52, 0)},
    'scratch': {'prop_poop': (0, 0.62, 0)},
}


def render_previews(rig, dog, props, hat, costume, out_dir):
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
    rig.animation_data.use_nla = False
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
        hat.hide_render = not label.startswith('chonete')
        for child in hat.children:
            child.hide_render = hat.hide_render
        for piece in costume:
            piece.hide_render = not label.startswith('pumpkin')
            for child in piece.children:
                child.hide_render = piece.hide_render
        scene.frame_set(frame)
        print(f'PVP · {label}: punto más bajo {lowest_point(dog):+.3f}')
        scene.render.filepath = os.path.join(out_dir, f'{label}.png')
        bpy.ops.render.render(write_still=True)

    rig.animation_data.action = None
    rig.animation_data.use_nla = True
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
    toon = make_material('PVP_Toon', WHITE)
    detail = make_material('PVP_Detail', WHITE)
    outline_mat = make_material('PVP_Outline', BLACK, vertex_color=False)

    body = build_body(toon)

    ear_bases, ear_tips, ear_parts = {}, {}, []
    for side, sx in (('L', 1), ('R', -1)):
        top, _ = surface_hit(body, (0.145 * sx, -0.29, 2), (0, 0, -1))
        base = top - Vector((0, 0, 0.045))
        ear, lining, tip = build_ear(side, base, folded=(side == 'R'), toon=toon, detail=detail)
        ear_bases[side], ear_tips[side] = base, tip
        ear_parts += [ear, lining]

    face_parts, tongue, eyes, tongue_root, tongue_tip = build_face(body, toon, detail)

    # El trazo solo rodea el cuerpo, las orejas y la lengua (material PVP_Toon).
    # Los ojos, la nariz y el interior rosa de las orejas (PVP_Detail) ya son
    # planos de color, como en el logo: con trazo, el brillo del ojo saldría
    # rodeado de un aro negro.
    linings = [p for p in ear_parts if p.name.endswith('_lining')]
    outlined = join([body] + [p for p in ear_parts if p not in linings] + [tongue], 'PVP_Dog')
    shell = outline_shell(outlined, OUTLINE, outline_mat)
    dog = join([outlined] + linings + face_parts, 'PVP_Dog')

    rig = build_rig(bone_specs(ear_bases, ear_tips, eyes, tongue_root, tongue_tip))
    for skinned in (dog, shell):
        skinned.parent = rig
        modifier = skinned.modifiers.new('Armature', 'ARMATURE')
        modifier.object = rig

    # En reposo, antes de las animaciones: el sombrero se ata a la cabeza tal
    # como queda en esta pose.
    hat = build_chonete(dog, rig, toon)
    hat_shell = outline_shell(hat, OUTLINE, outline_mat)
    hat_shell.parent = hat
    hat_shell.parent_type = 'OBJECT'
    hat_shell.matrix_parent_inverse = Matrix()
    hat_shell.matrix_basis = Matrix()

    # El disfraz de Halloween: el GLB lo lleva siempre, la web lo viste en octubre.
    # El sombrero de bruja se ata a la cabeza en reposo, igual que el chonete.
    witch_hat = build_witch_hat(dog, rig, toon, detail, outline_mat)
    suit = build_pumpkin_suit(dog, toon)
    costume = (suit, outline_shell(suit, OUTLINE, outline_mat))
    for skinned in costume:
        skinned.parent = rig
        modifier = skinned.modifiers.new('Armature', 'ARMATURE')
        modifier.object = rig
    costume += (witch_hat,)

    rig.animation_data_create()
    for name, length, fn, loop, ground in ACTIONS:
        bake_action(rig, dog, name, length, fn, loop, ground)

    props = build_props(toon, detail, outline_mat)

    print(f'PVP · malla: {len(dog.data.vertices)} vértices, {len(dog.data.polygons)} caras')
    if preview_dir:
        render_previews(rig, dog, props, hat, costume, preview_dir)
    export(rig)
    print(f'PVP · GLB: {GLB_OUT} ({os.path.getsize(GLB_OUT) / 1024:.0f} KB)')


main()
