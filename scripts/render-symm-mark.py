"""Render AlgoGym's compact Symm tile mark with Blender 4.1."""

import bpy
from mathutils import Vector
from pathlib import Path


bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete(use_global=False)


def material(name, color, metallic=0.0):
    item = bpy.data.materials.new(name)
    item.diffuse_color = (*color, 1)
    item.use_nodes = True
    shader = item.node_tree.nodes.get("Principled BSDF")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = 0.36
    return item


lavender = material("ceramic lavender", (0.47, 0.34, 0.72))
pearl = material("warm ceramic", (0.79, 0.76, 0.85))


def tile(name, x, y, z, top):
    bpy.ops.mesh.primitive_cube_add(size=1, location=(x, y, z))
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = (1.22, 1.22, 0.42)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(top)
    bevel = obj.modifiers.new("soft machined edge", "BEVEL")
    bevel.width = 0.095
    bevel.segments = 3
    obj.modifiers.new("weighted corner normals", "WEIGHTED_NORMAL")
    return obj


# Four interlocking blocks echo the existing Symm mark; slight height differences
# give the symbol real dimensionality without a generic sparkle or robot motif.
tile("north west", -0.68, 0.68, 0.32, pearl)
tile("north east", 0.68, 0.68, 0.16, lavender)
tile("south west", -0.68, -0.68, 0.16, lavender)
tile("south east", 0.68, -0.68, 0.32, pearl)

bpy.ops.object.camera_add(location=(4.6, -6.3, 7.8))
camera = bpy.context.object
direction = Vector((0, 0, 0.2)) - camera.location
camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 4.4
bpy.context.scene.camera = camera

for name, location, power, size in (
    ("key", (-3, -2, 7), 900, 5),
    ("rim", (3, 3, 5), 650, 4),
):
    bpy.ops.object.light_add(type="AREA", location=location)
    light = bpy.context.object
    light.name = name
    light.data.energy = power
    light.data.shape = "DISK"
    light.data.size = size

scene = bpy.context.scene
scene.render.engine = "CYCLES"
scene.cycles.samples = 48
scene.render.resolution_x = 256
scene.render.resolution_y = 256
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = "PNG"
scene.render.image_settings.color_mode = "RGBA"
scene.render.filepath = str(Path.cwd() / "public" / "symm-mark-3d.png")
scene.render.image_settings.color_depth = "8"
bpy.ops.render.render(write_still=True)
