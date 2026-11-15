"""Blender --background --python tools/render-hero-preview.py -- luna"""
import bpy
import math
import sys
from mathutils import Vector

hero = sys.argv[sys.argv.index('--') + 1] if '--' in sys.argv else 'luna'
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath='/tmp/arcana-' + hero + '.glb')

def material(name, color):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    return m

# A photographic-style studio light rig gives a fair visual reference without
# altering production meshes, materials, or loading any 2D face overlays.
bpy.context.scene.world.color = (0.17, 0.16, 0.22)
bpy.ops.object.light_add(type='AREA', location=(3, -4, 7))
bpy.context.object.data.energy = 850
bpy.context.object.data.shape = 'DISK'
bpy.context.object.data.size = 5
bpy.ops.object.light_add(type='AREA', location=(-4, 2, 5))
bpy.context.object.data.energy = 600
bpy.context.object.data.size = 5
bpy.ops.object.camera_add(location=(3.5, -7.0, 4.3))
camera = bpy.context.object
target = Vector((0, 0, 1.55))
camera.rotation_euler = (target - camera.location).to_track_quat('-Z', 'Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 4.1
bpy.context.scene.camera = camera
bpy.context.scene.render.engine = 'CYCLES'
bpy.context.scene.cycles.samples = 80
bpy.context.scene.cycles.use_denoising = False
bpy.context.scene.render.resolution_x = 600
bpy.context.scene.render.resolution_y = 750
bpy.context.scene.render.resolution_percentage = 100
bpy.context.scene.render.film_transparent = True
bpy.context.scene.render.image_settings.file_format = 'PNG'
bpy.context.scene.render.filepath = '/tmp/arcana-' + hero + '-preview.png'
bpy.ops.render.render(write_still=True)
