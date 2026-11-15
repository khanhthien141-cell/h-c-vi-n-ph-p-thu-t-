import {Vector3} from '/vendor/three.module.js';

const TAU = Math.PI * 2;
const shapes = new WeakMap();

function describe(geometry) {
 let shape = shapes.get(geometry);
 if (shape) return shape;
 const data = geometry.parameters;
 if (geometry.type === 'TorusGeometry') {
  const points = Array.from({length:25}, (_, i) => {
   const angle = data.arc * i / 24;
   return new Vector3(Math.cos(angle)*data.radius, Math.sin(angle)*data.radius, 0);
  });
  shape = {points, width:data.tube*2};
 } else if (geometry.type === 'TubeGeometry') {
  shape = {points:data.path.getPoints(14), width:data.radius*2};
 } else if (geometry.type === 'BufferGeometry' && geometry.attributes.uv) {
  const positions = geometry.attributes.position;
  const points = [];
  for (let i=0; i<positions.count; i+=4) {
   const left = new Vector3().fromBufferAttribute(positions,i);
   const right = new Vector3().fromBufferAttribute(positions,i+1);
   points.push(left.lerp(right,.5));
  }
  shape = {points, width:.18};
 } else {
  if (!geometry.boundingBox) geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  shape = {size:bounds.getSize(new Vector3()).multiplyScalar(.5)};
 }
 shapes.set(geometry,shape);
 return shape;
}

// Project the live spell's meshes into the compatibility arena, retaining
// its own colors, silhouette, positions, and phase animation.
export function paintSpellCanvas(ctx, root, X, Y, scale) {
 const point = new Vector3(), position = new Vector3(), dimensions = new Vector3();
 ctx.save();
 ctx.lineCap = 'round';
 ctx.lineJoin = 'round';
 for (const spell of root.children) {
  if (spell.name !== 'hero-spell-sequence' || !spell.visible) continue;
  spell.updateMatrixWorld(true);
  spell.traverseVisible(mesh => {
   if (!mesh.isMesh) return;
   const material = mesh.material, uniforms = material.uniforms;
   const gain = uniforms?.gain?.value;
   const alpha = gain ?? uniforms?.fade?.value ?? material.opacity;
   if (alpha < .015) return;
   const color = material.color ?? uniforms?.light?.value ?? uniforms?.hot?.value;
   if (!color) return;
   const tint = '#' + color.getHexString();
   ctx.globalAlpha = Math.min(1,alpha);
   const matrix = mesh.matrixWorld;
   dimensions.setFromMatrixScale(matrix);
   position.setFromMatrixPosition(matrix);
   const x = X(position.x), y = Y(position.z)-position.y*scale*.68;
   if (gain !== undefined) {
    const radius = Math.max(1,dimensions.x*scale);
    const glow = ctx.createRadialGradient(x,y,0,x,y,radius);
    glow.addColorStop(0,tint+'bb');
    glow.addColorStop(1,tint+'00');
    ctx.fillStyle = glow;
    ctx.fillRect(x-radius,y-radius,2*radius,2*radius);
    return;
   }
   const shape = describe(mesh.geometry);
   if (shape.points) {
    ctx.beginPath();
    shape.points.forEach((vertex, i) => {
     point.copy(vertex).applyMatrix4(matrix);
     const px = X(point.x), py = Y(point.z)-point.y*scale*.68;
     if (i === 0) ctx.moveTo(px,py);
     else ctx.lineTo(px,py);
    });
    ctx.lineWidth = Math.max(.8,shape.width*scale*Math.max(dimensions.x,dimensions.y));
    ctx.strokeStyle = tint;
    ctx.stroke();
    return;
   }
   const rx = Math.max(.65,Math.max(shape.size.x*dimensions.x,shape.size.z*dimensions.z*.8)*scale);
   const ry = Math.max(.65,(shape.size.y*dimensions.y*.68+shape.size.z*dimensions.z*.4)*scale);
   ctx.fillStyle = tint;
   ctx.beginPath();
   if (mesh.geometry.type === 'BoxGeometry') {
    ctx.rect(x-rx,y-ry,2*rx,2*ry);
   } else if (mesh.geometry.type === 'OctahedronGeometry') {
    ctx.moveTo(x,y-ry);ctx.lineTo(x+rx,y);ctx.lineTo(x,y+ry);ctx.lineTo(x-rx,y);ctx.closePath();
   } else {
    ctx.ellipse(x,y,rx,ry,0,0,TAU);
   }
   ctx.fill();
  });
 }
 ctx.restore();
}
