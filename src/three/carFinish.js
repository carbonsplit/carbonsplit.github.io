
// All attachment coordinates are in the normalized, unrotated car frame.
// The parking group owns the heading; neither effects nor camera add roll.
export function installCarFinish(T, car, model, originalHorseTexture) {
  const owned = [], rotors = [], lamps = [], uniforms = [];
  const group = new T.Group(); group.name = 'car-lighting'; car.add(group);
  const own = x => (owned.push(x), x);
  own(originalHorseTexture);
  const material = options => own(new T.MeshStandardMaterial(options));
  const localMatrix = new T.Matrix4().copy(car.matrixWorld).invert();
  const point = new T.Vector3();
  const localBounds = object => {
    const box = new T.Box3();
    const matrix = new T.Matrix4().multiplyMatrices(localMatrix, object.matrixWorld);
    const attr = object.geometry.attributes.position;
    for(let i=0;i<attr.count;i++) box.expandByPoint(point.fromBufferAttribute(attr,i).applyMatrix4(matrix));
    return box;
  };
  const addMesh = (geometry, mat, name, parent=group) => {
    own(geometry); const mesh = new T.Mesh(geometry,mat); mesh.name=name; parent.add(mesh); return mesh;
  };

  // Author decals in physical side-profile coordinates, not guessed atlas islands.
  // x=[-2.55,2.55], y=[0,1.6]; the same artwork reads forward on either flank.
  function artwork(emission=false,mirrorPlate=false) {
    const c=document.createElement('canvas');c.width=3072;c.height=1024;
    const ctx=c.getContext('2d'); ctx.fillStyle=emission?'black':'#122336';ctx.fillRect(0,0,c.width,c.height);
    const sx=c.width/5.1, sy=c.height/1.6;
    const ref=(x,y)=>[( (x-270)/167-1.29+2.55)*sx,(1.6-(.405+(548-y)/167))*sy];
    if(!emission){
      const g=ctx.createLinearGradient(0,0,0,c.height);g.addColorStop(0,'#173452');g.addColorStop(.55,'#0c1b2c');g.addColorStop(1,'#081321');ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle='#087dab';ctx.lineWidth=14;ctx.beginPath();[[130,565],[480,566],[625,561],[685,548]].forEach(([x,y],i)=>{const a=ref(x,y);i?ctx.lineTo(...a):ctx.moveTo(...a)});ctx.stroke();
    }
    const a=ref(534,478),b=ref(596,548),w=b[0]-a[0],h=b[1]-a[1];
    ctx.save();if(mirrorPlate){ctx.translate(2*(a[0]+w/2),0);ctx.scale(-1,1);}
    if(!emission){ctx.fillStyle='#591b25';ctx.fillRect(a[0],a[1],w,h);ctx.fillStyle='#d9dce1';ctx.fillRect(a[0],a[1],w,h*.17);ctx.fillStyle='#23242a';ctx.font=`bold ${h*.11}px Arial`;ctx.textAlign='center';ctx.fillText('WeatherTech',a[0]+w/2,a[1]+h*.13);ctx.strokeStyle='#b0adb0';ctx.lineWidth=1;ctx.strokeRect(a[0],a[1],w,h);}
    ctx.fillStyle='#f4fbff';ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`bold ${h*.64}px Arial`;ctx.fillText('64',a[0]+w*.5,a[1]+h*.54,w*.90);
    if(!emission){ctx.fillStyle='#cccccf';ctx.font=`bold ${h*.095}px Arial`;ctx.fillText('GTD PRO',a[0]+w*.5,a[1]+h*.91);}
    ctx.restore();
    const tex=own(new T.CanvasTexture(c));tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=8;return tex;
  }
  const paintMap=artwork(false), emitMap=artwork(true),leftPaint=artwork(false,true),leftEmission=artwork(true,true);
  for(const name of ['Object_46','Object_154']){const oldDecal=model.getObjectByName(name);if(oldDecal)oldDecal.visible=false;}
  const body=model.getObjectByName('Object_76');
  if(body){
    const matrix=new T.Matrix4().multiplyMatrices(localMatrix,body.matrixWorld);
    const pos=body.geometry.attributes.position, coords=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){point.fromBufferAttribute(pos,i).applyMatrix4(matrix);point.toArray(coords,i*3);}
    body.geometry.setAttribute('carPosition',new T.BufferAttribute(coords,3));
    body.geometry.setAttribute('sourceHorseUV',body.geometry.attributes.uv.clone());
    const m=own(body.material.clone());m.map=null;m.emissiveMap=null;m.color.set('#152d46');m.emissive.set(0);m.metalness=.22;m.roughness=.42;
    const emission={value:1.8};uniforms.push(emission);
    m.onBeforeCompile=shader=>{
      originalHorseTexture.updateMatrix();
      shader.uniforms.originalHorse={value:originalHorseTexture};
      shader.uniforms.horseTransform={value:originalHorseTexture.matrix};
      shader.uniforms.sidePaint={value:paintMap};shader.uniforms.sideEmission={value:emitMap};shader.uniforms.decalPower=emission;shader.uniforms.leftPaint={value:leftPaint};shader.uniforms.leftEmission={value:leftEmission};
      shader.vertexShader='attribute vec3 carPosition; attribute vec2 sourceHorseUV; varying vec2 vSourceHorseUV; varying vec3 vCarPosition;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvCarPosition=carPosition;vSourceHorseUV=sourceHorseUV;');
      shader.fragmentShader='uniform mat3 horseTransform; uniform sampler2D originalHorse; varying vec2 vSourceHorseUV; uniform sampler2D sidePaint; uniform sampler2D sideEmission; uniform sampler2D leftPaint; uniform sampler2D leftEmission; uniform float decalPower; varying vec3 vCarPosition;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec2 sideUV=vec2(vCarPosition.x/5.1+.5,vCarPosition.y/1.6);
        float flank=smoothstep(.42,.60,abs(vCarPosition.z))*(1.-smoothstep(.95,1.16,vCarPosition.y));
        vec4 sideInk=vCarPosition.z>0.?texture2D(sidePaint,sideUV):texture2D(leftPaint,sideUV);
        diffuseColor.rgb=mix(diffuseColor.rgb,sideInk.rgb,flank);
        float sourceHorse=texture2D(originalHorse,(horseTransform*vec3(vSourceHorseUV,1.)).xy).r;
        diffuseColor.rgb=mix(diffuseColor.rgb,vec3(.40,.76,.89),sourceHorse);
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        totalEmissiveRadiance += (vCarPosition.z>0.?texture2D(sideEmission,sideUV).rgb:texture2D(leftEmission,sideUV).rgb) * flank * decalPower;
        totalEmissiveRadiance += vec3(.48,.86,1.) * sourceHorse * decalPower * 1.65;
      `);
    };m.customProgramCacheKey=()=> 'car-side-original-horse-v3';m.userData.originalHorseUV=true;body.material=m;
    // The narrow door insert is a separate surface, not part of the body shell.
    const insert=model.getObjectByName('Object_94');
    if(insert){const transform=new T.Matrix4().multiplyMatrices(localMatrix,insert.matrixWorld),a=insert.geometry.attributes.position,data=new Float32Array(a.count*3);for(let i=0;i<a.count;i++){point.fromBufferAttribute(a,i).applyMatrix4(transform);point.toArray(data,i*3);}insert.geometry.setAttribute('carPosition',new T.BufferAttribute(data,3));insert.geometry.setAttribute('sourceHorseUV',new T.BufferAttribute(new Float32Array(a.count*2),2));insert.material=m;}

  }
  const wing=model.getObjectByName('Object_74');if(wing){wing.material=material({color:'#101822',roughness:.48,metalness:.35});}
  // The export includes two coincident radiator faces with pale baked paint.
  // Keep one dark radiator surface so it cannot compete with the lamps.
  const duplicateGrille=model.getObjectByName('Object_148');if(duplicateGrille)duplicateGrille.visible=false;
  const grille=model.getObjectByName('Object_30');if(grille){grille.material=material({color:'#10161d',roughness:.8,metalness:.2});}
  // Dark rubber stays dark. Verify geometry rather than trusting exported labels.
  model.traverse(o=>{if(!o.isMesh)return;
    if(o.material?.name==='Window'){const m=own(o.material.clone());m.color.set('#152c40');m.roughness=.14;m.metalness=.1;m.opacity=.45;m.side=T.FrontSide;o.material=m;}
    if(o.material?.name==='Light_grey_metallic_plastic'){const m=own(o.material.clone());m.color.set('#515b68');m.roughness=.4;o.material=m;}
    if(o.material?.name==='mat_572' && o.name==='Object_116'){const m=own(o.material.clone());m.color.set('#7c8a9d');m.roughness=.55;o.material=m;}
    if(o.material?.name==='mat_568'){const m=own(o.material.clone());m.emissive.set(0);m.emissiveIntensity=0;o.material=m;}
    if(o.material?.name==='mat_750'){const m=own(o.material.clone());m.emissive.set(0);m.color.set('#8b929c');m.roughness=.32;m.metalness=.78;o.material=m;}
  });
  for(const name of ['Object_124','Object_128','Object_134','Object_138']){
    const o=model.getObjectByName(name);if(!o)continue;
    const bounds=localBounds(o),c=bounds.getCenter(new T.Vector3());
    const rimName={Object_124:'Object_62',Object_128:'Object_60',Object_134:'Object_56',Object_138:'Object_54'}[name];
    const hub=localBounds(model.getObjectByName(rimName)).getCenter(new T.Vector3());c.x=hub.x;c.y=hub.y;
    const m=own(o.material.clone());m.color.set('#392219');m.emissive.set('#ff3505');m.emissiveMap=null;m.emissiveIntensity=.35;m.roughness=.66;m.metalness=.3;o.material=m;m.userData.rotorFace=true;rotors.push(m);
    // Thin incandescent swept surface just proud of the rotor, behind the wheel spokes.
    const radius=Math.min(bounds.max.x-bounds.min.x,bounds.max.y-bounds.min.y)*.48;
    const annulus=addMesh(new T.RingGeometry(radius*.84,radius,96),material({color:'#60200a',emissive:'#ff4508',emissiveIntensity:2,side:T.DoubleSide,roughness:.7}),`rotor-ring-${name}`);
    annulus.position.copy(c);annulus.position.z=c.z+(c.z>0?.033:-.033);rotors.push(annulus.material);
  }
  // Window outline runs along actual window surface; the far edge remains depth-occluded.
  const windowMat=material({color:'#ff6b0a',emissive:'#ff7a08',emissiveIntensity:4,roughness:.4});
  const win=[[-.73,.975,.780],[-.745,1.12,.697],[-.67,1.166,.673],[-.48,1.202,.66],[-.25,1.222,.661],[-.05,1.212,.675],[.15,1.175,.70],[.33,1.08,.75],[.38,.985,.79],[.12,.975,.793],[-.24,.970,.792],[-.56,.965,.785]];
  for(const side of [1,-1]){
    const curve=new T.CatmullRomCurve3(win.map(a=>new T.Vector3(a[0],a[1],a[2]*side)),true,'centripetal');
    addMesh(new T.TubeGeometry(curve,100,.0065,8,true),windowMat,`window-border-${side}`);
  }
  // Paint the original endplate faces themselves: no detached floating planes.
  // Bounds measured on outward-facing triangles of Object_74, not the whole wing.
  const fc=document.createElement('canvas');fc.width=768;fc.height=440;
  const fx=fc.getContext('2d');fx.fillStyle='#9b1727';fx.fillRect(0,0,768,440);
  fx.fillStyle='#f1e9eb';fx.font='italic 900 210px Arial';fx.textAlign='center';fx.textBaseline='middle';fx.fillText('FORD',384,213,660);
  const ft=own(new T.CanvasTexture(fc));ft.colorSpace=T.SRGBColorSpace;ft.anisotropy=8;
  if(wing){
    const transform=new T.Matrix4().multiplyMatrices(localMatrix,wing.matrixWorld),pos=wing.geometry.attributes.position,data=new Float32Array(pos.count*3);
    for(let i=0;i<pos.count;i++){point.fromBufferAttribute(pos,i).applyMatrix4(transform);point.toArray(data,i*3);}
    wing.geometry.setAttribute('endplatePosition',new T.BufferAttribute(data,3));
    const wm=wing.material;wm.userData.projectedEndplate=true;
    wm.onBeforeCompile=shader=>{
      shader.uniforms.endplatePaint={value:ft};
      shader.vertexShader='attribute vec3 endplatePosition; varying vec3 vEndplate;\n'+shader.vertexShader;
      shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvEndplate=endplatePosition;');
      shader.fragmentShader='uniform sampler2D endplatePaint; varying vec3 vEndplate;\n'+shader.fragmentShader;
      shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
        vec3 plateNormal=normalize(cross(dFdx(vEndplate),dFdy(vEndplate)));
        float plateFace=step(.87,abs(vEndplate.z))*step(.75,abs(plateNormal.z));
        vec2 plateUV=vec2((vEndplate.x+2.53745)/.41322,(vEndplate.y-1.0799)/.23744);
        if(vEndplate.z<0.)plateUV.x=1.-plateUV.x;
        diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(endplatePaint,plateUV).rgb,plateFace);
      `);
    };wm.customProgramCacheKey=()=> 'painted-red-endplate-v1';
  }

  const vertex=`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`;
  function ribbon(length,startWidth,endWidth,mat,name){
    const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute([0,-startWidth,0,length,-endWidth,0,length,endWidth,0,0,startWidth,0],3));g.setAttribute('uv',new T.Float32BufferAttribute([0,0,1,0,1,1,0,1],2));g.setIndex([0,1,2,0,2,3]);return addMesh(g,mat,name);
  }
  const lc=document.createElement('canvas');lc.width=256;lc.height=256;
  const lx=lc.getContext('2d'),lg=lx.createRadialGradient(128,128,0,128,128,128);
  lg.addColorStop(0,'rgba(225,243,255,0.9)');lg.addColorStop(.12,'rgba(183,221,255,0.48)');lg.addColorStop(.4,'rgba(115,181,255,0.12)');lg.addColorStop(1,'rgba(70,130,255,0)');lx.fillStyle=lg;lx.fillRect(0,0,256,256);
  const lensMap=own(new T.CanvasTexture(lc));lensMap.colorSpace=T.SRGBColorSpace;
  for(const [index,z] of [.60,-.65].entries()){
    const lensMaterial=own(new T.SpriteMaterial({map:lensMap,color:'#dbf0ff',transparent:true,opacity:.40,blending:T.AdditiveBlending,depthWrite:false,toneMapped:false}));
    const lens=new T.Sprite(lensMaterial);lens.name=`headlight-optic-${index}`;lens.position.set(2.31,.70,z);lens.scale.set(.54,.26,1);group.add(lens);

    const spot=new T.SpotLight('#dbefff',70,18,.23,.9,2);spot.position.set(2.27,.70,z);const target=new T.Object3D();target.position.set(10,-.1,z);group.add(target,spot);spot.target=target;owned.push(spot);lamps.push(spot);
    // A softly feathered ribbon rather than a hard polygonal cone shell.
    const haze=own(new T.ShaderMaterial({transparent:true,depthWrite:false,side:T.DoubleSide,blending:T.AdditiveBlending,uniforms:{power:{value:.035}},vertexShader:vertex,fragmentShader:`uniform float power;varying vec2 vUv;void main(){float edge=exp(-pow((vUv.y-.5)*5.,2.))*smoothstep(0.,.18,vUv.y)*(1.-smoothstep(.82,1.,vUv.y));float longitudinal=smoothstep(0.,.035,vUv.x)*pow(1.-vUv.x,1.3);gl_FragColor=vec4(.66,.83,1.,edge*longitudinal*power);}` }));
    const beam=ribbon(7,.09,.85,haze,`headlight-haze-${index}`);beam.position.set(2.30,.70,z);beam.rotation.z=-.065;
    // Soft pools come from the actual spotlight, not opaque geometry.
    const o=model.getObjectByName(index===0?'Object_168':'Object_170');if(o){const m=own(o.material.clone());m.emissive.set('#d7eeff');m.emissiveIntensity=5;o.material=m;}
  }
  // Incandescent steel at the side-exit nozzle, matching the red-hot banner tip.
  // No gas plume, blue spill or animated flame.
  const exhaust=new T.Group();exhaust.name='hot-exhaust';exhaust.position.set(-.45,.23,1.025);exhaust.scale.set(1.15,.82,1);group.add(exhaust);
  const hotMetal=material({color:'#48120b',emissive:'#ff2403',emissiveIntensity:1.8,metalness:.55,roughness:.52});
  const innerMetal=material({color:'#090504',emissive:'#ed1701',emissiveIntensity:1.05,metalness:.2,roughness:.9});
  const sleeve=addMesh(new T.CylinderGeometry(.039,.036,.065,48,1,true),hotMetal,'exhaust-hot-sleeve',exhaust);sleeve.rotation.x=Math.PI/2;sleeve.position.z=-.024;
  const lip=addMesh(new T.TorusGeometry(.035,.0065,12,64),hotMetal,'exhaust-hot-lip',exhaust);lip.position.z=.009;
  const cavity=addMesh(new T.CircleGeometry(.028,48),innerMetal,'exhaust-inner',exhaust);cavity.position.z=.004;
  const spill=new T.PointLight('#ff2905',.35,.45,2);spill.position.set(-.45,.23,1.10);group.add(spill);owned.push(spill);
  return {group,rotors,update(p,time,isDark,reduced){
    const t=T.MathUtils.smoothstep(p,.15,.7),strength=isDark?1:.28;
    for(const m of rotors)m.emissiveIntensity=(m.userData.rotorFace?.3:1.3+t*.5)*strength;
    for(const u of uniforms)u.value=(.85+t*.4)*strength;
    windowMat.emissiveIntensity=(3.2+t*2.0)*strength;
    hotMetal.emissiveIntensity=(1.15+t*.65)*strength;
    innerMetal.emissiveIntensity=(.8+t*.4)*strength;
    spill.intensity=.35*strength;
    for(const l of lamps)l.intensity=isDark?70:20;
  },dispose(){car.remove(group);for(const r of new Set(owned))r.dispose?.();}};
}
