// Reference-inspired pit hardware. Shared geometry/materials keep repeated bays light.
export function createPitEquipment(T, scene, resources) {
  const {materials,geometries,textures}=resources;
  const palettes={
    carbon:{number:'64',driver:'CARBONSPLIT',team:'carbon',base:'#101b28',accent:'#70d8ef',secondary:'#dce7ed'},
    redbull:{number:'1',driver:'Max Verstappen',team:'redbull',base:'#07142e',accent:'#ee2439',secondary:'#ffd52c'},
    mercedes:{number:'63',driver:'George Russel',team:'mercedes',base:'#071c20',accent:'#28d9c4',secondary:'#bcc6ce'},
    ferrari:{number:'44',driver:'Lewis Hamilton',team:'ferrari',base:'#ac1226',accent:'#ff3441',secondary:'#ffe159'},
  };
  const teamFor=i=>i===0?palettes.carbon:palettes[['redbull','mercedes','ferrari'][((i>0?i-1:-i+1)%3)]];
  const mat=(color,roughness=.55,metalness=.15,emission=0)=>{
    const m=new T.MeshStandardMaterial({color,roughness,metalness});if(emission){m.emissive.set(color);m.emissiveIntensity=emission;}materials.push(m);return m;
  };
  const black=mat('#11161c',.88),rubber=mat('#13161b',.95),steel=mat('#89939a',.3,.8),alloy=mat('#46535c',.38,.65),brass=mat('#ba9250',.38,.7),white=mat('#d4eeff',.4,.1,2.3);
  const cube=new T.BoxGeometry(1,1,1),cylinder=new T.CylinderGeometry(1,1,1,16),ring=new T.TorusGeometry(1,.035,5,32);
  geometries.push(cube,cylinder,ring);
  function mesh(g,m,parent,name,x=0,y=0,z=0){const o=new T.Mesh(g,m);o.name=name;o.position.set(x,y,z);o.receiveShadow=true;parent.add(o);return o;}
  function box(parent,w,h,d,m,x,y,z,name='hardware'){const o=mesh(cube,m,parent,name,x,y,z);o.scale.set(w,h,d);return o;}
  function cyl(parent,r,h,m,x,y,z,name='coupling'){const o=mesh(cylinder,m,parent,name,x,y,z);o.scale.set(r,h,r);return o;}
  function line(parent,points,r,m,name){const curve=new T.CatmullRomCurve3(points.map(v=>new T.Vector3(...v)));const sample=curve.getPoint.bind(curve);curve.getPoint=(t,target)=>{const p=sample(t,target);p.y=Math.max(r+.006,p.y);return p;};const g=new T.TubeGeometry(curve,Math.max(16,points.length*8),r,6,false);geometries.push(g);return mesh(g,m,parent,name);}
  function textureCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const tex=new T.CanvasTexture(c);tex.colorSpace=T.SRGBColorSpace;tex.anisotropy=4;textures.push(tex);return tex;}
  function panel(tex,w,h,parent,x,y,z,name,emission=.25){const m=new T.MeshStandardMaterial({map:tex,emissiveMap:tex,emissive:'#ffffff',emissiveIntensity:emission,roughness:.6});materials.push(m);const g=new T.PlaneGeometry(w,h);geometries.push(g);return mesh(g,m,parent,name,x,y,z);}
  const boardTextures=new Map();
  function board(i){const c=teamFor(i);if(!boardTextures.has(c.team))boardTextures.set(c.team,textureCanvas(1536,132,(ctx,w,h)=>{
    ctx.fillStyle=c.base;ctx.fillRect(0,0,w,h);ctx.fillStyle=c.accent;ctx.fillRect(0,h-10,w,10);ctx.fillStyle=c.secondary;ctx.fillRect(0,0,185,h);
    ctx.fillStyle=c.team==='mercedes'?'#071c20':'#101827';ctx.font='italic 900 94px Arial';ctx.textAlign='center';ctx.fillText(c.number,92,99);
    ctx.textAlign='left';ctx.fillStyle='#f6f7fa';ctx.font='700 70px Arial';ctx.fillText(c.driver.toUpperCase(),225,88);
    ctx.fillStyle=c.accent;for(let j=0;j<3;j++){ctx.beginPath();ctx.moveTo(w-150+j*40,12);ctx.lineTo(w-126+j*40,12);ctx.lineTo(w-152+j*40,98);ctx.lineTo(w-176+j*40,98);ctx.fill();}
  }));const o=panel(boardTextures.get(c.team),7.8,.67,scene,i*9,4.2,-.585,`garage-board-${i}`,.45);o.userData={pitKind:'garage-board',...c};return o;}
  const screenTexture=textureCanvas(768,448,(ctx,w,h)=>{
    ctx.fillStyle='#06121c';ctx.fillRect(0,0,w,h);ctx.fillStyle='#81d6df';ctx.font='bold 24px monospace';ctx.fillText('PIT TELEMETRY / LIVE',28,38);
    ctx.strokeStyle='#19333f';ctx.lineWidth=1;for(let x=25;x<w;x+=45){ctx.beginPath();ctx.moveTo(x,65);ctx.lineTo(x,310);ctx.stroke();}for(let y=65;y<=310;y+=35){ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(w-25,y);ctx.stroke();}
    ['#39dfc6','#ffc45e','#4a9cfa'].forEach((col,j)=>{ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();for(let x=25;x<740;x+=3){const y=125+j*65+Math.sin(x*.022+j)*18+Math.sin(x*.067)*8;x===25?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.stroke();});
    ctx.font='20px monospace';ctx.fillStyle='#b9c9d7';ctx.fillText('TYRE TEMP       BRAKE TEMP       PRESSURE',28,355);ctx.font='bold 30px monospace';ctx.fillStyle='#74efd5';ctx.fillText('  82.4            476              21.6',28,400);
  });
  const sidewall=textureCanvas(256,256,(ctx,w,h)=>{
    ctx.clearRect(0,0,w,h);ctx.strokeStyle='#a98e48';ctx.lineWidth=3;ctx.beginPath();ctx.arc(128,128,111,.25,1.4);ctx.stroke();ctx.beginPath();ctx.arc(128,128,111,3.4,4.55);ctx.stroke();
    ctx.fillStyle='#b6a46d';ctx.font='bold 25px Arial';ctx.textAlign='center';ctx.fillText('SLICK',128,40);ctx.font='18px monospace';ctx.fillText('18 / DRY',128,227);
  });
  const tyreProfile=[[.225,-.13],[.29,-.15],[.35,-.12],[.38,-.07],[.385,.07],[.35,.12],[.29,.15],[.225,.13],[.225,-.13]].map(v=>new T.Vector2(...v));
  const tyreGeometry=new T.LatheGeometry(tyreProfile,32);geometries.push(tyreGeometry);
  const sideMat=new T.MeshStandardMaterial({map:sidewall,transparent:true,depthWrite:false,roughness:.95});materials.push(sideMat);const sideGeom=new T.RingGeometry(.23,.374,32);geometries.push(sideGeom);
  // Ring UVs already cover the full square sidewall artwork.
  function tyreStack(parent,x,z,id){const g=new T.Group();g.name=id;g.position.set(x,0,z);g.userData={pitKind:'tyre-stack'};parent.add(g);
    box(g,.88,.08,.88,black,0,.04,0,'tyre-dolly');
    for(let j=0;j<4;j++){mesh(tyreGeometry,rubber,g,'slick-tyre',0,.24+j*.30,0);const face=mesh(sideGeom,sideMat,g,'tyre-sidewall',0,.39+j*.30,0);face.rotation.x=-Math.PI/2;face.rotation.z=j*.65;}
  }
  function workstation(parent,x,z,id){const g=new T.Group();g.position.set(x,0,z);g.name=id;g.userData={pitKind:'workstation'};parent.add(g);
    box(g,1.85,.065,.86,steel,0,1.23,0,'worktop');box(g,1.65,1.12,.7,black,0,.61,0,'drawer-cabinet');
    for(let j=0;j<5;j++){box(g,1.57,.012,.012,alloy,0,.30+j*.18,.36,'drawer-seam');box(g,.27,.022,.03,steel,.4,.36+j*.18,.38,'drawer-handle');}
    box(g,.38,.035,.22,alloy,0,1.28,-.12,'monitor-foot');box(g,.06,.28,.06,steel,0,1.42,-.16,'monitor-stand');box(g,1.46,.85,.085,black,0,1.93,-.18,'monitor-bezel');panel(screenTexture,1.37,.76,g,0,1.93,-.132,'telemetry-screen',.75);
    box(g,.65,.035,.22,alloy,-.12,1.285,.21,'keyboard');for(let j=0;j<4;j++)box(g,.56,.006,.006,black,-.12,1.306,.14+j*.04,'keyboard-row');box(g,.08,.035,.12,black,.43,1.29,.23,'mouse');
  }
  function profileLight(parent,c){const g=new T.Group();g.name='suspended-profile-light';g.userData={pitKind:'profile-light'};g.position.set(0,3.48,-3.95);parent.add(g);
    for(const z of [-2.15,2.15]){box(g,6.3,.13,.18,alloy,0,0,z,'light-housing');box(g,6.15,.03,.105,white,0,-.077,z,'light-diffuser');}
    for(const x of [-3.1,3.1]){box(g,.18,.13,4.3,alloy,x,0,0,'light-housing');box(g,.105,.03,4.2,white,x,-.077,0,'light-diffuser');}
    for(const x of [-2.7,2.7])for(const z of [-1.8,1.8])cyl(g,.014,1.35,steel,x,.73,z,'ceiling-suspension');
    const accent=mat(c.accent,.4,.2,.8);box(parent,7.6,.035,.04,accent,0,2.82,-7.23,'garage-accent');
  }
  function boom(parent,c,id){const g=new T.Group();g.name=`pit-boom-${id}`;g.userData={pitKind:'pit-boom'};parent.add(g);
    const shell=mat(c.base,.36,.55),accent=mat(c.accent,.4,.3,.9),cap=mat(c.secondary,.35,.3);
    box(g,.7,.09,.68,alloy,-3.6,.045,-1.18,'tower-foot');box(g,.20,3.45,.23,shell,-3.6,1.77,-1.18,'tower-mast');box(g,.07,2.9,.025,accent,-3.6,1.8,-1.05,'mast-stripe');
    box(g,.33,.34,5.6,shell,-3.6,3.53,1.5,'service-boom');box(g,.342,.075,4.75,accent,-3.6,3.54,1.65,'boom-stripe');
    const nose=cyl(g,.17,.32,cap,-3.6,3.53,4.35,'boom-cap');nose.rotation.x=Math.PI/2;
    line(g,[[-3.6,2.52,-1.18],[-3.6,3.4,.6]],.035,alloy,'mast-brace');
    box(g,.20,.035,4.65,white,-3.6,3.34,1.7,'boom-underside-light');
    const text=textureCanvas(1024,100,(ctx,w,h)=>{ctx.fillStyle=c.base;ctx.fillRect(0,0,w,h);ctx.fillStyle=c.secondary;ctx.font='bold 52px Arial';ctx.textAlign='center';ctx.fillText(`${c.number}  /  ${c.driver.toUpperCase()}`,w/2,69);});
    for(const side of [-1,1]){const label=panel(text,3.6,.25,g,-3.6+side*.173,3.55,1.5,'boom-lettering',.3);label.rotation.y=side*Math.PI/2;}
    for(let j=0;j<4;j++){cyl(g,.043,.10,steel,-3.6,3.30,-.55+j*.85,'air-outlet');cyl(g,.033,.06,brass,-3.6,3.23,-.55+j*.85,'quick-coupling');}
    return g;
  }
  function wheelGun(parent,x,z,angle,id){const g=new T.Group();g.name=id;g.userData={pitKind:'wheel-gun',id};g.position.set(x,.105,z);g.rotation.y=angle;parent.add(g);
    const motor=cyl(g,.085,.25,alloy,0,0,0,'gun-motor');motor.rotation.z=Math.PI/2;
    const rear=cyl(g,.09,.045,black,-.145,0,0,'gun-rear-cap');rear.rotation.z=Math.PI/2;
    const barrel=cyl(g,.052,.19,steel,.21,0,0,'gun-drive');barrel.rotation.z=Math.PI/2;
    const socket=cyl(g,.065,.07,brass,.33,0,0,'wheel-socket');socket.rotation.z=Math.PI/2;
    box(g,.10,.075,.24,black,-.065,-.02,.14,'gun-handle');box(g,.035,.04,.07,steel,.012,-.015,.10,'gun-trigger');
    const fitting=cyl(g,.031,.095,steel,-.065,-.02,.30,'hose-fitting');fitting.rotation.x=Math.PI/2;
    const knob=cyl(g,.029,.022,brass,-.02,.085,0,'selector-ring');cyl(g,.019,.025,alloy,-.02,.091,0,'selector');
    g.updateMatrixWorld(true);return g;
  }
  function serviceGuns(parent){
    const stations=[[-1.55,-1.95,.6],[1.65,-1.95,2.6],[-1.6,1.96,-.65],[1.8,1.98,2.45]];
    stations.forEach(([x,z,angle],i)=>{
      const id=`wheel-gun-${i}`,gun=wheelGun(parent,x,z,angle,id),end=new T.Vector3(-.065,-.02,.345).applyMatrix4(gun.matrix);
      const dropX=i%2===0?-3.35:3.5,dropZ=z<0?-2.16:2.30;
      const points=[[-3.6,3.20,-.55+i*.85],[-3.45,3.0,-.35+i*.7],[dropX,2.9,dropZ],[dropX+.12,1.5,dropZ+.10],[dropX,.055,dropZ],[dropX*.72,.045,dropZ+.25],[x+.2,.04,z+.4],[end.x,end.y,end.z]];
      const hose=line(parent,points,.018,rubber,`hose-${id}`);hose.userData={pitKind:'gun-hose',gun:id};
      // Flat slack loop around the tool, not a taut straight line.
      for(let j=0;j<2;j++){const ferrule=cyl(parent,.027,.055,steel,end.x,end.y,end.z+j*.05);ferrule.rotation.x=Math.PI/2;}
    });
  }
  function bay(i){if(Math.abs(i)>3)return;const c=teamFor(i),g=new T.Group();g.name=`equipped-bay-${i}`;g.position.x=i*9;scene.add(g);
    profileLight(g,c);workstation(g,-1.7,-6.25,`workstation-${i}-a`);workstation(g,1.25,-6.25,`workstation-${i}-b`);
    tyreStack(g,-3.35,-4.6,`tyres-${i}-a`);tyreStack(g,3.25,-5.45,`tyres-${i}-b`);
    const service=new T.Group();g.add(service);if(i===0)service.rotation.y=-.1;boom(service,c,i);if(i===0)serviceGuns(service);
  }
  // Two timing banks under one shell, with six stools facing the circuit.
  const trim=mat('#8c99a3',.38,.55),pad=mat('#343c46',.82),base=mat('#58636b',.9);
  const bankTexture=textureCanvas(1024,320,(c,w,h)=>{
    c.fillStyle='#090f16';c.fillRect(0,0,w,h);
    for(let j=0;j<6;j++){const x=(j%3)*342+4,y=Math.floor(j/3)*160+4;
      if(j%3===1){c.drawImage(screenTexture.image,x,y,332,151);continue;}
      c.fillStyle=j%3===2?'#173749':'#12222b';c.fillRect(x,y,332,151);c.fillStyle='#d1e6ef';c.font='bold 15px monospace';c.fillText(j%3===2?'SECTOR MAP':'LIVE TIMING',x+12,y+20);
      if(j%3===2){c.beginPath();[[24,103],[80,60],[144,84],[229,39],[296,64],[265,110],[191,115],[127,96],[63,125],[24,103]].forEach(([u,v],i)=>i?c.lineTo(x+u,y+v):c.moveTo(x+u,y+v));c.strokeStyle='#6fcdb8';c.lineWidth=4;c.stroke();}
      else for(let k=0;k<5;k++){c.fillStyle=['#68d5c4','#e0bd64','#9eade0'][k%3];c.fillRect(x+12,y+32+k*21,12,9);c.font='13px monospace';c.fillText(['64   CAR','01   VER','63   RUS','44   HAM','--   PIT'][k]+'       S1     S2     S3',x+34,y+42+k*21);}
    }
  });
  for(const [i,x] of [[0,-5.8],[1,-15],[2,-24.2]]){
    const g=new T.Group();g.name=`strategy-cabin-${i}`;g.position.set(x,0,i===0?8.9:9.4);scene.add(g);
    const team=[['CARBONSPLIT','#204559','#83dce8'],['PIT ENGINEERING','#18426a','#85bded'],['RACE STRATEGY','#ad2436','#ffd5c8']][i];
    const shell=mat(team[1],.32,.42),stripe=mat(team[2],.5,.15,.4);
    box(g,6.65,.22,2.05,base,0,.11,0);box(g,6.15,.12,1.85,shell,0,.28,0);
    box(g,6.30,.18,2.0,shell,0,2.38,0);box(g,6.25,.024,.07,stripe,0,2.29,-.97);
    box(g,6.03,1.95,.13,shell,0,1.31,.84);box(g,5.92,.035,.05,white,0,2.25,.14);
    for(const dx of [-3.02,3.02]){box(g,.12,1.93,1.45,shell,dx,1.31,.16);box(g,.13,.34,.46,shell,dx,2.2,-.75);}
    box(g,5.94,.09,.74,alloy,0,1.14,.31);box(g,5.94,.68,.09,black,0,.78,.59);
    for(const dx of [-1.48,1.48]){box(g,2.89,1.02,.09,black,dx,1.74,.62);panel(bankTexture,2.78,.92,g,dx,1.74,.568,'timing-bank',.95).rotation.y=Math.PI;}
    const nameplate=textureCanvas(1024,64,(c,w,h)=>{c.fillStyle=team[1];c.fillRect(0,0,w,h);c.fillStyle='#e4edf1';c.font='bold 44px Arial';c.fillText(team[0],24,47);});
    panel(nameplate,5.98,.22,g,0,2.39,-1.01,'fascia',.4).rotation.y=Math.PI;
    for(const dx of [-2.40,-1.44,-.48,.48,1.44,2.40]){
      cyl(g,.18,.035,steel,dx,.36,-.35);cyl(g,.045,.47,steel,dx,.59,-.35);cyl(g,.17,.024,alloy,dx,.52,-.35);
      cyl(g,.27,.10,pad,dx,.84,-.35,'seat');const back=box(g,.51,.33,.09,pad,dx,1.02,-.57);back.rotation.x=-.14;box(g,.43,.022,.14,black,dx,1.2,.1);
    }
    box(g,.47,.84,.69,trim,3.46,.65,.22);for(let j=0;j<6;j++)box(g,.35,.035,.016,black,3.46,.47+j*.079,-.133);
  }
  return {board,bay};
}
