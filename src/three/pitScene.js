import * as T from 'three';
import { createPitEquipment } from './pitEquipment.js';
import { installCarFinish } from './carFinish.js';
import { fitBannerProportions } from './bannerProportions.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export function buildPitScene() {
  const scene = new T.Scene();
  scene.background = new T.Color('#090e15');
  scene.fog = new T.FogExp2('#111925', .018);
  const materials = [];
  const geometries = [];
  const textures = [];
  const lights = [];

  const mat = (color, roughness = .5, metalness = 0) => {
    const m = new T.MeshStandardMaterial({ color, roughness, metalness });
    materials.push(m);
    return m;
  };
  const concrete = mat('#343b43', .85), metal = mat('#626e79', .3, .8), dark = mat('#10151d', .65), blue = mat('#073979', .26, .65), paint = mat('#10243f', .24, .7), rubber = mat('#0a0b0d', .88), glass = mat('#080f1b', .14, .55);
  const glow = (color, strength = 3) => {
    const m = mat(color);
    m.emissive.set(color);
    m.emissiveIntensity = strength;
    return m;
  };
  const white = glow('#dceaff', 2.5), amber = glow('#ff7b17', 4), red = glow('#f42b37', 3);

  function mesh(g, m, parent = scene, x = 0, y = 0, z = 0) {
    geometries.push(g);
    const o = new T.Mesh(g, m);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }
  const box = (w, h, d, m, p, x, y, z) => mesh(new T.BoxGeometry(w, h, d), m, p, x, y, z);
  function beam(a, b, r = .035, m = metal, parent = scene) {
    const av = new T.Vector3(...a), bv = new T.Vector3(...b), d = bv.clone().sub(av);
    const g = new T.CylinderGeometry(r, r, d.length(), 6);
    geometries.push(g);
    const o = new T.Mesh(g, m);
    o.position.copy(av.add(bv).multiplyScalar(.5));
    o.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize());
    parent.add(o);
    return o;
  }
  function label(text, w, h, color = '#dce7ed', bg = '#111923') {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = Math.round(1024 * h / w);
    const x = c.getContext('2d');
    x.fillStyle = bg;
    x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = color;
    x.textAlign = 'center';
    x.textBaseline = 'middle';
    x.font = `600 ${Math.round(c.height * .57)}px Arial`;
    x.fillText(text, c.width / 2, c.height / 2);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    textures.push(tex);
    const m = new T.MeshBasicMaterial({ map: tex });
    materials.push(m);
    const g = new T.PlaneGeometry(w, h);
    geometries.push(g);
    return new T.Mesh(g, m);
  }

  const equipment=createPitEquipment(T,scene,{materials,geometries,textures});

  // Longitudinal pit lane is X; garages sit beyond the car at negative Z.
  box(150, .15, 32, mat('#202831', .55, .15), scene, 0, -.075, 5);
  box(150, .02, .14, mat('#d5d6cc'), scene, 0, .003, 5.8);
  box(150, .021, 1.3, mat('#8d3136'), scene, 0, .003, 6.55);
  for (let i = -6; i <= 6; i++) {
    const x = i * 9;
    box(8.7, 4.8, .3, concrete, scene, x, 2.4, -7.5);
    box(.28, 5, 7, concrete, scene, x - 4.4, 2.5, -4.2);
    box(9, .3, 7, concrete, scene, x, 5, -4.2);
    box(8.4, .8, .18, dark, scene, x, 4.15, -.7);
    if(i===0){
      const sign=label('64   /   CARBONSPLIT',7.8,.52);
      sign.position.set(x,4.2,-.59);sign.userData={pitKind:'garage-board',number:'64',driver:'CARBONSPLIT',team:'carbon'};scene.add(sign);
    }else equipment.board(i);
    equipment.bay(i);
    box(7.8, .07, .25, white, scene, x, 3.65, -1);
    box(7.5, .05, .2, white, scene, x, 4.6, -5);
    const light = new T.PointLight('#b8d6ff', 35, 13, 2);
    light.position.set(x, 3.2, -3);
    scene.add(light);
    lights.push(light);
    for (let j = 0; j < 3; j++) {
      box(1.6, 1.2, .75, dark, scene, x - 2.7 + j * 2.6, .6, -6.7);
      box(1.5, .025, .8, metal, scene, x - 2.7 + j * 2.6, 1.22, -6.7);
    }
    // Telemetry monitors replace the former decorative amber wall panel.
    for (const z of [-.2, 2.8]) {
      beam([x - 4, 4.8, z], [x + 4, 4.8, z]);
      beam([x - 4, 4.4, z], [x + 4, 4.4, z]);
      for (let k = 0; k < 8; k++) beam([x - 4 + k, 4.4, z], [x - 3 + k, 4.8, z], .018);
    }
    beam([x - 4, 4.8, -.2], [x - 4, 4.8, 2.8]);
    box(1.9, .06, .5, white, scene, x, 4.5, 2.4);
  }

  const hemi = new T.HemisphereLight('#accbff', '#39352e', 1.5);
  scene.add(hemi);
  lights.push(hemi);
  const key = new T.DirectionalLight('#e0edff', 3.5);
  key.position.set(3, 8, 5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -9, right: 9, top: 9, bottom: -9, near: .5, far: 30 });
  key.shadow.bias = -.001;
  scene.add(key);
  lights.push(key);
  const rim = new T.PointLight('#ff8b36', 45, 10);
  rim.position.set(-1, 2, -2);
  scene.add(rim);
  lights.push(rim);

  const parking = new T.Group();
  parking.name = "parking-heading";
  scene.add(parking);
  parking.rotation.y = -0.10;

  // Painted parking box lines on floor
  for (const z of [-1.6, 1.6]) box(6, .015, .045, mat('#d2b879'), parking, 0, .006, z);
  box(.045, .015, 3.2, mat('#d2b879'), parking, -3, .006, 0);
  box(.045, .015, 3.2, mat('#d2b879'), parking, 3, .006, 0);

  const car = new T.Group();
  parking.add(car);
  let finish;

  let disposed = false;
  let carModel = null;
  const releaseModel = object => {
    const geometries = new Set(), materials = new Set(), textures = new Set();
    object?.traverse(o => {
      if(o.geometry) geometries.add(o.geometry);
      for(const m of (Array.isArray(o.material)?o.material:[o.material]).filter(Boolean)) {
        materials.add(m); for(const v of Object.values(m)) if(v?.isTexture && !v.isRenderTargetTexture) textures.add(v);
      }
    });
    geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());
  };
  const sourceMaterials=new Set(), sourceTextures=new Set();
  const decoder = new DRACOLoader().setWorkerLimit(2);
  const ready = new GLTFLoader().setDRACOLoader(decoder).loadAsync(`${import.meta.env.BASE_URL}models/mustang-web-v2.glb`).then(async gltf => {
    if(disposed){releaseModel(gltf.scene);return;}
    const model=gltf.scene;carModel=model;
    model.rotation.y=Math.PI/2;
    model.updateMatrixWorld(true);
    let bounds=new T.Box3().setFromObject(model,true),size=bounds.getSize(new T.Vector3());
    model.scale.multiplyScalar(5.1/size.x);
    model.updateMatrixWorld(true);bounds=new T.Box3().setFromObject(model,true);
    const centre=bounds.getCenter(new T.Vector3());
    model.position.add(new T.Vector3(-centre.x,-bounds.min.y+.015,-centre.z));
    model.traverse(o=>{
      if(!o.isMesh)return;
      for(const m of (Array.isArray(o.material)?o.material:[o.material])){sourceMaterials.add(m);for(const v of Object.values(m))if(v?.isTexture)sourceTextures.add(v);if(m.transparent)m.depthWrite=false;}
      if(o.material?.name==='mat_804'||(o.material?.name==='mat_330'&&o.geometry.attributes.position.count===4))o.visible=false;
      o.castShadow=true;o.receiveShadow=true;
    });
    car.add(model);model.name='mustang-model';car.updateMatrixWorld(true);
    const horseTexture=await new T.TextureLoader().loadAsync(`${import.meta.env.BASE_URL}textures/original-horse-neon.png`);
    if(disposed){horseTexture.dispose();return;}
    horseTexture.flipY=false;
    horseTexture.wrapS=horseTexture.wrapT=T.RepeatWrapping;
    // Banner: muzzle just behind #64, tail above the rear arch.
    // Both original flank islands share the same longitudinal U direction.
    horseTexture.repeat.x=.88;
    horseTexture.offset.x=.12;
    horseTexture.anisotropy=8;
    finish=installCarFinish(T,car,model,horseTexture);
    fitBannerProportions(T,car,model,finish);
    car.rotation.z=.0056;car.rotation.x=.011;car.position.y=-.042;car.updateMatrixWorld(true);
  });

  function updateEffects(p, time, isDark, reducedMotion) {
    finish?.update(p, time, isDark, reducedMotion);
  }

  if (typeof window !== 'undefined' && import.meta.env.DEV) {
    window.__PIT_WORLD__ = { scene, car, parking, ready, get model(){return carModel;}, get finish(){return finish;} };
  }

  return {
    scene,
    car,
    ready,
    get model(){return carModel;},
    updateEffects,
    dispose() {
      disposed=true;
      decoder.dispose();
      finish?.dispose();
      releaseModel(carModel);
      sourceTextures.forEach(t=>t.dispose());sourceMaterials.forEach(m=>m.dispose());
      geometries.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());
      materials.forEach(m=>m.dispose());lights.forEach(l=>l.dispose?.());
      if(import.meta.env.DEV && window.__PIT_WORLD__?.scene===scene)delete window.__PIT_WORLD__;
    }
  };
}
