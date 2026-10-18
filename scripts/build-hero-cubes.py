"""Reproducible original AlgoGym hero asset. Run using Blender's bundled Python."""
import bpy
import math
import os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'public', 'hero')
os.makedirs(OUT, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)

def material(name, color, metallic=0.8, roughness=0.26, emission=0):
    result = bpy.data.materials.new(name)
    result.use_nodes = True
    shader = result.node_tree.nodes.get('Principled BSDF')
    shader.inputs['Base Color'].default_value = (*color, 1)
    shader.inputs['Metallic'].default_value = metallic
    shader.inputs['Roughness'].default_value = roughness
    shader.inputs['Coat Weight'].default_value = 0.35
    if emission:
        shader.inputs['Emission Color'].default_value = (*color, 1)
        shader.inputs['Emission Strength'].default_value = emission
    return result

body = material('Obsidian anodized alloy', (0.018, 0.022, 0.03), 0.96, 0.23)
rim = material('Polished titanium edges', (0.28, 0.31, 0.36), 0.95, 0.17)
lilac = material('Chakra lilac', (0.47, 0.19, 0.83), 0.65, 0.23, 0.12)
pearl = material('Pearlescent face', (0.85, 0.62, 0.9), 0.76, 0.24)
blue = material('Cobalt reflection', (0.045, 0.12, 0.6), 0.8, 0.24)
mint = material('Mint reflection', (0.035, 0.43, 0.31), 0.8, 0.24)
gold = material('Warm edge reflection', (0.62, 0.32, 0.065), 0.88, 0.24)
mesh_metal = material('Micro-perforated alloy', (0.19, 0.22, 0.25), 0.85, 0.34)

# The perforation texture is authored here, embedded in the exported GLB.
texture = bpy.data.images.new('AlgoGym perforated alloy', width=512, height=512)
pixels=[]
for y in range(512):
    for x in range(512):
        dx=(x%4)-1.5;dy=(y%4)-1.5
        hole=dx*dx+dy*dy<1.3
        color=(0.012,0.015,0.02) if hole else (0.27,0.30,0.32)
        pixels.extend((*color,1))
texture.pixels=pixels
texture.pack()
nodes=mesh_metal.node_tree.nodes
image=nodes.new('ShaderNodeTexImage');image.image=texture
mesh_metal.node_tree.links.new(image.outputs['Color'],nodes.get('Principled BSDF').inputs['Base Color'])

def box(name, size, location, mat, bevel=0.035):
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj=bpy.context.object;obj.name=name;obj.dimensions=size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(mat)
    modifier=obj.modifiers.new('Machined soft corners','BEVEL');modifier.width=bevel;modifier.segments=4
    obj.modifiers.new('Weighted face normals','WEIGHTED_NORMAL')
    for polygon in obj.data.polygons:polygon.use_smooth=True
    return obj

parts=[box('Cube chassis',(1,1,1),(0,0,0),rim,0.045)]
for axis,sign,mat in [(0,1,mesh_metal),(0,-1,body),(1,1,lilac),(1,-1,mint),(2,1,pearl),(2,-1,blue)]:
    size=[0.918,0.918,0.918];size[axis]=0.026
    location=[0,0,0];location[axis]=sign*0.497
    parts.append(box(f'Face {axis} {sign}',size,location,mat,0.022))
parts.append(box('Violet light seam',(0.018,0.91,0.022),(0.47,0,0.493),lilac,0.007))
parts.append(box('Champagne light seam',(0.018,0.91,0.022),(-0.47,0,0.493),gold,0.007))
bpy.ops.object.select_all(action='DESELECT')
for part in parts:part.select_set(True)
bpy.context.view_layer.objects.active=parts[0]
bpy.ops.object.convert(target='MESH')
bpy.ops.object.join()
cube=bpy.context.object;cube.name='AlgoGymMetalCube'
bpy.ops.export_scene.gltf(filepath=os.path.join(OUT,'algogym-cube.glb'),export_format='GLB',use_selection=True,export_yup=True,export_animations=False)

positions=[(-1.05,0.5,0.2),(0.25,1.6,-0.25),(1.15,0.4,0.2),(0.95,-1.05,-0.3),(-0.55,-1.25,0.3),(-0.55,0.0,-1.0)]
for index,position in enumerate(positions):
    obj=cube if index==0 else cube.copy()
    if index:bpy.context.collection.objects.link(obj)
    obj.location=(position[0],-position[2],position[1])
    obj.rotation_euler=(0.28+index*.19,-0.35+index*.29,0.15-index*.11)

def area(name,location,color,power,size,target=(0,0,0)):
    data=bpy.data.lights.new(name,'AREA');data.energy=power;data.color=color;data.shape='DISK';data.size=size
    obj=bpy.data.objects.new(name,data);bpy.context.collection.objects.link(obj);obj.location=location
    obj.rotation_euler=(Vector(target)-obj.location).to_track_quat('-Z','Y').to_euler()

area('Pearl softbox',(-3,-4,6),(0.91,0.87,1),1100,5)
area('Lilac reflection',(4,1,3),(0.48,0.21,1),950,3)
area('Cyan edge',(-4,3,1),(0.06,0.55,0.65),850,3)
area('Warm edge',(1,-3,-2),(1,0.47,0.1),550,2)
bpy.ops.object.camera_add(location=(0,-9,0.6))
camera=bpy.context.object;camera.rotation_euler=(Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type='ORTHO';camera.data.ortho_scale=5.6
scene=bpy.context.scene;scene.camera=camera
scene.render.engine='CYCLES';scene.cycles.samples=32;scene.cycles.use_denoising=True
scene.world.color=(0.12,0.12,0.12)
scene.render.film_transparent=True
scene.render.resolution_x=1200;scene.render.resolution_y=1200;scene.render.resolution_percentage=100
scene.render.image_settings.file_format='WEBP';scene.render.image_settings.color_mode='RGBA';scene.render.image_settings.quality=90
scene.render.filepath=os.path.join(OUT,'algogym-cubes-poster.webp')
scene.view_settings.view_transform='AgX'
bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT,'.local-backups','algogym-hero.blend'))
bpy.ops.render.render(write_still=True)
print('ALGOGYM_HERO_ASSETS_READY')
