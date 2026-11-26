
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
  // Every shape below is traced in banner_dark.jpg pixel space and placed with
  // `ref`, the same calibration the camera uses to land the hubs on the photo.
  const LIVERY={
    // Running pony: back/tail stroke, then mane-head-chest stroke, plus the hoof notch and hind leg.
    horse:[
      [[241.7,481.7],[232,477],[215,474],[200,471],[194,465],[193.3,458.3],[198.3,455.3],[220,460],[260,459.3],[263.3,472.7],[280,471.7],[296.7,467.3],[320,463.3],[340,465.3],[360,470],[375,472.7]],
      [[380,472.7],[398.3,471.7],[388.3,465],[393.3,461.7],[385,456],[413.3,455],[415,459.3],[426.7,456],[433.3,460.7],[441.7,454],[446.7,460.7],[465,463.3],[466.7,456.7],[475,463.3],[486.7,476.7],[500,496.7],[511,512],[509,519],[501,523],[493,518],[481,508],[469,503],[459,498],[447,501],[437,506],[432,513],[429,526],[430,538],[436,548],[434,554],[425,557],[406,556]],
    ],
    horseClosed:[
      // Front hoof notch.
      [[418,533],[419,547],[407,547]],
      // Folded hind leg: long shin down to the hoof, back up and out to the notched heel.
      [[334,510],[341,530],[349,542],[362,549],[375,549],[365,540],[357,531],[379,533],[381,541],[385,540],[385,530],[371,526],[349,518]],
    ],
    sunset:[[104,442],[150,437],[214,440],[246,452],[233,480],[216,508],[207,556],[203,602],[100,602]],
    doorBlue:[[603,474],[652,467],[666,503],[642,521],[606,521]],
    fenderBlue:[[612,462,38,12],[655,460,44,14],[704,461,40,13],[748,467,18,9]],
    chin:[[795,578],[828,553],[868,532],[935,516]],
  };
  function artwork(emission=false,mirror=false) {
    const c=document.createElement('canvas');c.width=3072;c.height=964; // uniform px/m on both axes
    const ctx=c.getContext('2d');
    const s=c.width/5.1, k=s/167; // canvas px per photo px
    const ref=(x,y)=>[((x-270)/167-1.29+2.55)*s,(1.6-(.405+(548-y)/167))*s];
    const trace=(pts,close=false)=>{ctx.beginPath();pts.forEach(([x,y],i)=>{const a=ref(x,y);if(i)ctx.lineTo(...a);else ctx.moveTo(...a);});if(close)ctx.closePath();};
    const flipText=(cx,draw)=>{ctx.save();if(mirror){ctx.translate(2*cx,0);ctx.scale(-1,1);}draw();ctx.restore();};
    const horse=(color,width)=>{
      ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineJoin='round';ctx.lineCap='round';
      for(const p of LIVERY.horse){trace(p);ctx.stroke();}
      for(const p of LIVERY.horseClosed){trace(p,true);ctx.stroke();}
    };
    ctx.fillStyle='black';ctx.fillRect(0,0,c.width,c.height);
    if(emission){
      // Neon tube: a wide soft bloom under a hot white-blue core.
      ctx.filter=`blur(${(4*k).toFixed(1)}px)`;horse('rgba(120,200,255,.28)',7*k);
      ctx.filter='none';horse('#cfe9fb',3.2*k);
    }else{
      // Gloss black with a faint navy cast, darker toward the sills.
      const g=ctx.createLinearGradient(0,0,0,c.height);g.addColorStop(0,'#121a25');g.addColorStop(.5,'#0b1018');g.addColorStop(1,'#06080c');
      ctx.fillStyle=g;ctx.fillRect(0,0,c.width,c.height);

      // Rear-quarter sunset fade cut by black speed stripes.
      ctx.save();trace(LIVERY.sunset,true);ctx.clip();
      const [x0,y0]=ref(128,596),[x1,y1]=ref(228,446),sun=ctx.createLinearGradient(x0,y0,x1,y1);
      sun.addColorStop(0,'#c8141f');sun.addColorStop(.28,'#ea3d1f');sun.addColorStop(.52,'#f47b22');sun.addColorStop(.76,'#f3bb3c');sun.addColorStop(1,'#efe1a4');
      ctx.fillStyle=sun;ctx.fillRect(0,0,c.width,c.height);
      ctx.strokeStyle='rgba(8,10,13,.88)';
      for(let i=0;i<24;i++){const x=112+i*6.2;ctx.lineWidth=(1.4+i*.09)*k;ctx.beginPath();ctx.moveTo(...ref(x,430));ctx.lineTo(...ref(x+46,604));ctx.stroke();}
      // Feather the leading edge back into the black.
      const [fx]=ref(196,0),[fe]=ref(236,0),fade=ctx.createLinearGradient(fx,0,fe,0);fade.addColorStop(0,'rgba(10,14,20,0)');fade.addColorStop(1,'rgba(10,14,20,1)');
      ctx.fillStyle=fade;ctx.fillRect(0,0,c.width,c.height);
      ctx.restore();
      // Stripes trail forward over the black above the tail.
      for(let i=0;i<14;i++){const x=200+i*5.4;ctx.strokeStyle=`rgba(150,160,170,${.30-i*.019})`;ctx.lineWidth=1.3*k;ctx.beginPath();ctx.moveTo(...ref(x,430));ctx.lineTo(...ref(x+12,470));ctx.stroke();}

      // Blue block graphic on the door front and front fender, pixel-dissolving rearward.
      const [bx0,by0]=ref(600,520),[bx1,by1]=ref(670,466),blue=ctx.createLinearGradient(bx0,by0,bx1,by1);
      blue.addColorStop(0,'#0b2f6e');blue.addColorStop(.55,'#1662c4');blue.addColorStop(1,'#2d93ea');
      ctx.fillStyle=blue;trace(LIVERY.doorBlue,true);ctx.fill();
      for(let gy=468;gy<522;gy+=6)for(let gx=572;gx<604;gx+=6){
        const keep=(gx-572)/32, hash=Math.abs(Math.sin(gx*12.9898+gy*78.233)*43758.5453)%1;
        if(hash<keep){ctx.fillStyle=hash<.5?'#1352a8':'#0d3b80';const [px,py]=ref(gx,gy);ctx.fillRect(px,py,5*k,5*k);}
      }
      for(const [x,y,w,h] of LIVERY.fenderBlue){
        const fb=ctx.createLinearGradient(...ref(x,y+h),...ref(x+w,y));fb.addColorStop(0,'#1a7fe0');fb.addColorStop(1,'#59c3ff');ctx.fillStyle=fb;
        ctx.beginPath();ctx.moveTo(...ref(x+5,y));ctx.lineTo(...ref(x+w+5,y));ctx.lineTo(...ref(x+w,y+h));ctx.lineTo(...ref(x,y+h));ctx.closePath();ctx.fill();
      }

      // Lower door strip.
      const [sx0,sy0]=ref(407,549),[sx1,sy1]=ref(604,563);
      ctx.fillStyle='#dfe3e8';ctx.fillRect(sx0,sy0,sx1-sx0,sy1-sy0);
      flipText((sx0+sx1)/2,()=>{ctx.fillStyle='#141820';ctx.font=`italic 800 ${(sy1-sy0)*.74}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('FORDPERFORMANCE',(sx0+sx1)/2,(sy0+sy1)/2+1,(sx1-sx0)*.8);});

      // White chin stripe sweeping up the front bumper.
      ctx.strokeStyle='#e9edf2';ctx.lineWidth=5*k;ctx.lineCap='round';trace(LIVERY.chin);ctx.stroke();

      horse('#e8eef4',3.2*k);
    }
    // Number panel.
    const a=ref(534,478),b=ref(596,548),w=b[0]-a[0],h=b[1]-a[1];
    flipText(a[0]+w/2,()=>{
      if(!emission){
        ctx.fillStyle='#c41f2d';ctx.fillRect(a[0],a[1],w,h);
        ctx.fillStyle='#eef0f3';ctx.fillRect(a[0],a[1],w,h*.17);ctx.fillRect(a[0],a[1]+h*.80,w,h*.20);
        ctx.fillStyle='#1d1f25';ctx.font=`bold ${h*.11}px Arial`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('WeatherTech',a[0]+w/2,a[1]+h*.09);
        ctx.font=`bold ${h*.085}px Arial`;ctx.fillText('GTD PRO',a[0]+w/2,a[1]+h*.90);
        ctx.fillStyle='#f6f8fa';ctx.font=`bold ${h*.58}px Arial`;ctx.fillText('64',a[0]+w*.5,a[1]+h*.50,w*.86);
      }
    });
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
    const m=own(body.material.clone());m.map=null;m.emissiveMap=null;m.color.set('#0e141c');m.emissive.set(0);m.metalness=.38;m.roughness=.3;
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
      `);
      shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`#include <emissivemap_fragment>
        // Traced neon pony; the model's own UV-island horse is no longer sampled.
        totalEmissiveRadiance += (vCarPosition.z>0.?texture2D(sideEmission,sideUV).rgb:texture2D(leftEmission,sideUV).rgb) * flank * decalPower * 1.05;
      `);
    };m.customProgramCacheKey=()=> 'car-side-traced-livery-v5';m.userData.originalHorseUV=true;body.material=m;
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
    if(o.material?.name==='mat_568'){const m=own(o.material.clone());m.emissive.set(0);m.emissiveIntensity=0;m.map=null;m.color.set('#17181b');m.roughness=.86;m.metalness=0;o.material=m;} // banner tyres are plain slicks, no sidewall lettering
    if(o.material?.name==='mat_750'){const m=own(o.material.clone());m.emissive.set(0);m.color.set('#8b929c');m.roughness=.32;m.metalness=.78;o.material=m;}
  });
  // Glowing rotor: a heat-graded swept band (hot yellow core, red edges) with
  // vented slots, drawn once and shared. Inner hat stays clear so the dark
  // rotor face reads through, exactly like the banner's ring-through-spokes look.
  const rc=document.createElement('canvas');rc.width=rc.height=512;
  const rx=rc.getContext('2d'),R=256;
  const heat=rx.createRadialGradient(R,R,R*.5,R,R,R*.99);
  heat.addColorStop(0,'rgba(90,12,3,0)');heat.addColorStop(.08,'rgba(150,24,4,.85)');heat.addColorStop(.36,'rgba(255,92,14,1)');
  heat.addColorStop(.58,'rgba(255,190,72,1)');heat.addColorStop(.8,'rgba(255,96,16,1)');heat.addColorStop(.96,'rgba(160,26,4,.8)');heat.addColorStop(1,'rgba(90,12,3,0)');
  rx.fillStyle=heat;rx.beginPath();rx.arc(R,R,R*.99,0,Math.PI*2);rx.arc(R,R,R*.5,0,Math.PI*2,true);rx.fill();
  rx.globalCompositeOperation='destination-out';rx.lineCap='round';
  for(let i=0;i<30;i++){const a=i/30*Math.PI*2;rx.strokeStyle='rgba(0,0,0,.55)';rx.lineWidth=4;rx.beginPath();rx.arc(R+Math.cos(a)*R*.42,R+Math.sin(a)*R*.42,R*.4,a+1.15,a+1.6);rx.stroke();}
  rx.globalCompositeOperation='source-over';
  const rotorMap=own(new T.CanvasTexture(rc));rotorMap.colorSpace=T.SRGBColorSpace;rotorMap.anisotropy=8;
  const discs=[];
  for(const name of ['Object_124','Object_128','Object_134','Object_138']){
    const o=model.getObjectByName(name);if(!o)continue;
    const bounds=localBounds(o),c=bounds.getCenter(new T.Vector3());
    const rimName={Object_124:'Object_62',Object_128:'Object_60',Object_134:'Object_56',Object_138:'Object_54'}[name];
    const hub=localBounds(model.getObjectByName(rimName)).getCenter(new T.Vector3());c.x=hub.x;c.y=hub.y;
    const m=own(o.material.clone());m.color.set('#392219');m.emissive.set('#ff3505');m.emissiveMap=null;m.emissiveIntensity=.35;m.roughness=.66;m.metalness=.3;o.material=m;m.userData.rotorFace=true;rotors.push(m);
    // Incandescent swept face just proud of the rotor, behind the wheel spokes.
    const radius=Math.min(bounds.max.x-bounds.min.x,bounds.max.y-bounds.min.y)*.5;
    const front=c.x>0;
    // Front discs work hardest: hotter, yellower. Rears sit at a duller cherry red.
    const tint=front?[1,1,1]:[1,.62,.5];
    const discMat=own(new T.MeshBasicMaterial({map:rotorMap,transparent:true,depthWrite:false,side:T.DoubleSide}));discMat.userData={tint,heat:front?1:.7};
    const disc=addMesh(new T.CircleGeometry(radius,96),discMat,`rotor-glow-${name}`);
    disc.position.copy(c);disc.position.z=c.z+(c.z>0?.033:-.033);disc.rotation.z=front?.4:1.3;discs.push(discMat);
  }
  // Window neon, as in the banner: an L-shaped light bar running down the
  // rear edge of the door glass and along its header, with a soft halo and
  // a warm cabin glow spilling through the glass.
  const windowMat=material({color:'#ff8a1e',emissive:'#ff9426',emissiveIntensity:4,roughness:.4});
  const haloMat=own(new T.MeshBasicMaterial({color:'#ff6a12',transparent:true,opacity:.2,blending:T.AdditiveBlending,depthWrite:false}));
  const bar=[[-.57,.99,.787],[-.575,1.10,.716],[-.55,1.185,.666],[-.42,1.207,.661],[-.25,1.222,.661],[-.05,1.212,.675],[.12,1.183,.697]];
  const cabin=[];
  for(const side of [1,-1]){
    const curve=new T.CatmullRomCurve3(bar.map(a=>new T.Vector3(a[0],a[1],a[2]*side)),false,'centripetal');
    addMesh(new T.TubeGeometry(curve,120,.0095,10,false),windowMat,`window-neon-${side}`);
    addMesh(new T.TubeGeometry(curve,120,.032,10,false),haloMat,`window-neon-halo-${side}`);
    const glow=new T.PointLight('#ff7a1c',2.4,1.7,2);glow.position.set(-.25,1.04,.42*side);group.add(glow);owned.push(glow);cabin.push(glow);
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
    for(const m of rotors)m.emissiveIntensity=.3*strength;
    for(const m of discs){const k=(1.5+t*.9)*m.userData.heat*(isDark?1:.06),[r,g,b]=m.userData.tint;m.color.setRGB(k*r,k*g,k*b);}
    haloMat.opacity=(.16+t*.08)*strength;
    for(const l of cabin)l.intensity=(1.8+t*1.2)*strength;
    for(const u of uniforms)u.value=(.85+t*.4)*strength;
    windowMat.emissiveIntensity=(3.2+t*2.0)*strength;
    hotMetal.emissiveIntensity=(1.15+t*.65)*strength;
    innerMetal.emissiveIntensity=(.8+t*.4)*strength;
    spill.intensity=.35*strength;
    for(const l of lamps)l.intensity=isDark?70:20;
  },dispose(){car.remove(group);for(const r of new Set(owned))r.dispose?.();}};
}
