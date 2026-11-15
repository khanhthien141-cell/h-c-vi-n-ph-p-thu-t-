// Visual motion only. Server snapshots remain authoritative for damage, hits,
// movement bounds and scoring. Never write these predicted coordinates back.
const finite=n=>Number.isFinite(n)?n:0;
export function motionBlend(current,target,dt,rate=12,snapDistance=5){
 const x=finite(current?.x),z=finite(current?.z),tx=finite(target?.x),tz=finite(target?.z);
 const distance=Math.hypot(tx-x,tz-z);
 if(distance>snapDistance)return{x:tx,z:tz};
 const alpha=1-Math.exp(-Math.max(0,rate)*Math.max(0,Math.min(.1,dt)));
 return{x:x+(tx-x)*alpha,z:z+(tz-z)*alpha};
}
export function remoteLead(current,previous,age,speed,snapshotTime){
 const x=finite(current.x),z=finite(current.z);
 const span=snapshotTime-finite(previous?.time);
 if(!previous||previous.dead||!Number.isFinite(span)||span<.035)return{x,z};
 const dx=x-finite(previous.x),dz=z-finite(previous.z);
 const velocity=Math.hypot(dx,dz)/span;
 // Cap packet extrapolation: a delayed snapshot must never make opponents
 // fly across the map and then rubber-band back to their real positions.
 const lead=Math.max(0,Math.min(.075,age));
 const ratio=velocity>0?Math.min(1,Math.max(.1,finite(speed))*1.15/velocity):0;
 return{x:x+dx/span*ratio*lead,z:z+dz/span*ratio*lead};
}
export function predictedLocal(current,control,speed,age){
 const x=finite(control?.x),z=finite(control?.z),length=Math.max(1,Math.hypot(x,z));
 const lead=Math.max(0,Math.min(.16,age));
 return{x:finite(current.x)+x/length*finite(speed)*lead,z:finite(current.z)+z/length*finite(speed)*lead};
}
