// Reversible, fixed geometry adjustment; never animated during the transition.
// Keep the wheelbase/cabin intact and lengthen only the nose beyond the front tyre.
export const bannerProportions = Object.freeze({ enabled: true, startX: 1.92, endX: 2.55, extension: .47 });
export function fitBannerProportions(T, car, model, finish) {
  const fit=bannerProportions;
  if(!fit.enabled)return;
  const span=fit.endX-fit.startX;
  const amount=x=>T.MathUtils.clamp((x-fit.startX)/span,0,1);
  const shift=x=>{const t=amount(x);return fit.extension*t*t*(3-2*t);};
  car.updateMatrixWorld(true);
  const inverse=car.matrixWorld.clone().invert(), point=new T.Vector3(), normal=new T.Vector3();
  const originals=new Set();
  model.traverse(mesh=>{
    if(!mesh.isMesh)return;
    const old=mesh.geometry, geometry=old.clone();originals.add(old);mesh.geometry=geometry;
    const toCar=new T.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld),fromCar=toCar.clone().invert();
    const toNormal=new T.Matrix3().getNormalMatrix(toCar),fromNormal=new T.Matrix3().getNormalMatrix(fromCar);
    const position=geometry.attributes.position,normals=geometry.attributes.normal;
    for(let i=0;i<position.count;i++){
      point.fromBufferAttribute(position,i).applyMatrix4(toCar);
      const t=amount(point.x),jacobian=1+fit.extension*6*t*(1-t)/span;
      point.x+=shift(point.x);point.applyMatrix4(fromCar);
      position.setXYZ(i,point.x,point.y,point.z);
      if(normals){
        normal.fromBufferAttribute(normals,i).applyMatrix3(toNormal);
        normal.x/=jacobian;
        normal.applyMatrix3(fromNormal).normalize();normals.setXYZ(i,normal.x,normal.y,normal.z);
      }
    }
    position.needsUpdate=true;if(normals)normals.needsUpdate=true;
    geometry.computeBoundingBox();geometry.computeBoundingSphere();
  });
  originals.forEach(g=>g.dispose());
  // Lens glows, light origins, targets and beam ribbons follow their body sockets.
  // Wheels, window trim, exhaust and rear wing lie outside the affected region.
  for(const attachment of finish.group.children)attachment.position.x+=shift(attachment.position.x);
  model.userData.bannerProportions={...fit};
}
