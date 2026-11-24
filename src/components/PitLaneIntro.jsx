import { createPortal } from 'react-dom';
import { getPageScroll, scrollPageTo } from '../lib/siteScroll';
import { useEffect, useRef, useState } from 'react';
import PitLoader from './PitLoader';
import './PitLaneIntro.css';

export default function PitLaneIntro({ isDark }) {
  const root = useRef(null), stage = useRef(null), canvas = useRef(null), photo = useRef(null), meter = useRef(null);
  const [unavailable, setUnavailable] = useState(false);
  const [showLoader, setShowLoader] = useState(true);
  const [loadProgress, setLoadProgress] = useState(6);
  const [loadStage, setLoadStage] = useState('MODULES');
  const [sceneReady, setSceneReady] = useState(false);
  const theme = useRef(isDark);
  theme.current = isDark;

  useEffect(() => {
    if (unavailable) return;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) { setUnavailable(true); return; }
    let dead = false, renderer, composer, bloomPass, renderPass, outputPass, world, frame, environment;
    const cleanup = [];

    Promise.all([
      import('three'),
      import('../three/pitScene'),
      import('three/addons/postprocessing/EffectComposer.js'),
      import('three/addons/postprocessing/RenderPass.js'),
      import('three/addons/postprocessing/UnrealBloomPass.js'),
      import('three/addons/postprocessing/OutputPass.js'),
      import('three/addons/environments/RoomEnvironment.js')
    ]).then(([T, { buildPitScene }, { EffectComposer }, { RenderPass }, { UnrealBloomPass }, { OutputPass }, { RoomEnvironment }]) => {
      if (dead) return;
      setLoadProgress(18);
      setLoadStage('CHASSIS');
      try {
        renderer = new T.WebGLRenderer({ canvas: canvas.current, antialias: true, powerPreference: 'high-performance' });
      } catch {
        setUnavailable(true);
        return;
      }
      renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = T.PCFShadowMap;
      renderer.toneMapping = T.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;

      // Wheel-centre landmarks measured in the reference images (not effect bounds).
      const bannerCars = {
        dark: { hubs: [[270,547],[738,549]], width: 1200, height: 812, left: 65, right: 990, top: 322, bottom: 616 },
        light: { hubs: [[282,571],[771,573]], width: 1253, height: 848, left: 68, right: 1034, top: 336, bottom: 644 },
      };

      let wheelPoints = [];
      world = buildPitScene((p) => {
        if (dead) return;
        setLoadProgress(Math.round(18 + p * 67));
        if (p >= 0.99) setLoadStage('FINISH');
      });
      world.ready.then(() => {
        if (dead) return;
        setLoadProgress(88);
        setLoadStage('LIGHTING');
        const pmrem = new T.PMREMGenerator(renderer);
        const room = new RoomEnvironment();
        environment = pmrem.fromScene(room, .04);
        room.dispose(); pmrem.dispose();
        world.model.traverse(o => { if(o.isMesh) for(const m of (Array.isArray(o.material)?o.material:[o.material])) { if(m.isMeshStandardMaterial) {m.envMap=environment.texture; m.envMapIntensity=.06;m.needsUpdate=true;} } });
        world.car.updateMatrixWorld(true);
        wheelPoints = ['Object_62','Object_56'].map(name => new T.Box3().setFromObject(world.model.getObjectByName(name),true).getCenter(new T.Vector3()));
        if(import.meta.env.DEV) window.__PIT_ANCHORS__=wheelPoints;
        setLoadProgress(96);
        setLoadStage('IGNITION');
      }).catch(error => {
        console.error("Mustang model failed to load", error);
        if (!dead) setUnavailable(true);
      });

      const camera = new T.PerspectiveCamera(45, 1, .1, 180);
      if (import.meta.env.DEV) {
        window.__PIT_VIEW__ = {camera, renderer};
        cleanup.push(() => { if(window.__PIT_VIEW__?.camera===camera){delete window.__PIT_VIEW__;delete window.__PIT_ANCHORS__;} });
      }
      const path = new T.CatmullRomCurve3([
        new T.Vector3(17, 2.3, 4.6), new T.Vector3(10, 2, 6),
        new T.Vector3(3.4, 2.7, 11), new T.Vector3(.56744, 2.59419, 12.2),
      ]);

      // Fixed elevated three-quarter direction during the final dolly.
      // Moving along this ray preserves pitch/yaw instead of dropping to door height.
      const aim = new T.Vector3(0, .75, 0);
      const approach = new T.Vector3(.4 / 8.6, 1.30 / 8.6, 1);
      const setDolly = distance => {
        camera.position.copy(aim).addScaledVector(approach, distance);
        camera.up.set(0, 1, 0);
        camera.lookAt(aim);
      };
      const orbitOffset = new T.Vector3();
      const projected = new T.Vector3();
      const projectCar = () => {
        camera.updateMatrixWorld(true);
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        for (const point of wheelPoints) {
          projected.copy(point).project(camera);
          const x = (projected.x + 1) * width / 2, y = (1 - projected.y) * height / 2;
          left = Math.min(left, x); right = Math.max(right, x);
          top = Math.min(top, y); bottom = Math.max(bottom, y);
        }
        return { left, right, top, bottom };
      };

      let width = 0, height = 0;
      const fit = () => {
        width = innerWidth;
        height = innerHeight;
        renderer.setSize(width, height, false);
        composer?.setSize(width, height);
        if (bloomPass) bloomPass.resolution.set(width, height);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };

      // HDR-threshold bloom; one render path, no duplicate direct render.
      composer = new EffectComposer(renderer);
      composer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
      renderPass = new RenderPass(world.scene, camera);
      composer.addPass(renderPass);

      bloomPass = new UnrealBloomPass(
        new T.Vector2(innerWidth, innerHeight),
        isDark ? 0.18 : 0.10,
        0.23,
        1.35
      );
      composer.addPass(bloomPass);

      outputPass = new OutputPass();
      composer.addPass(outputPass);

      fit();
      addEventListener('resize', fit);
      cleanup.push(() => removeEventListener('resize', fit));

      const clamp = x => Math.max(0, Math.min(1, x));
      const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };



      let warmupFrames = 0;
      const draw = () => {
        if (dead) return;
        frame = requestAnimationFrame(draw);
        const bounds = root.current.getBoundingClientRect(), p = clamp(-bounds.top / root.current.offsetHeight);
        stage.current.style.visibility = bounds.top + root.current.offsetHeight <= 0 ? 'hidden' : 'visible';
        if (bounds.top + root.current.offsetHeight <= 0 || document.hidden) return;

        // Establish orientation during early approach/orbit (p <= 0.56) and hold it rock-solid throughout straight zoom.
        const travel = smooth(0, .56, p);
        camera.position.copy(path.getPointAt(travel));
        const sideDistance = width < 700 ? 16.8 : 12.2;
        if (width < 700) camera.position.addScaledVector(approach, 4.6);
        camera.lookAt(aim);
        camera.fov = T.MathUtils.lerp(45, 32, smooth(.20, .56, p));

        camera.updateProjectionMatrix();

        // Begin the push while the orbit is still moving; no stop/restart at side-on.
        const zoom = smooth(.34, .82, p);
        const end = smooth(.87, 1, p);
        const target = document.querySelector('[data-pit-banner]')?.getBoundingClientRect();
        const rect = { left: 0, top: 0, width, height };
        if (target) {
          rect.left = target.left * end;
          rect.top = target.top * end;
          rect.width = width + (target.width - width) * end;
          rect.height = height + (target.height - height) * end;
        }
        stage.current.style.clipPath = `inset(${Math.max(0, rect.top)}px ${width - rect.left - rect.width}px ${Math.max(0, height - rect.top - rect.height)}px ${rect.left}px round ${16 * end}px)`;
        Object.assign(photo.current.style, {
          left: `${rect.left}px`,
          top: `${rect.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        });

        if (p > .34 && wheelPoints.length === 2) {
          orbitOffset.copy(camera.position).sub(aim).addScaledVector(approach, -sideDistance);
          const measured = bannerCars[theme.current ? 'dark' : 'light'];
          const scale = Math.max(rect.width / measured.width, rect.height / measured.height);
          const offsetX = rect.left + (rect.width - measured.width * scale) / 2;
          const offsetY = rect.top + (rect.height - measured.height * scale) / 2;
          const photoWidth = (measured.hubs[1][0] - measured.hubs[0][0]) * scale;
          const photoCentreX = offsetX + (measured.hubs[0][0] + measured.hubs[1][0]) * scale / 2;
          const photoBottom = offsetY + Math.max(measured.hubs[0][1], measured.hubs[1][1]) * scale;

          setDolly(sideDistance);

          const start = projectCar();
          const desiredWidth = T.MathUtils.lerp(start.right - start.left, photoWidth, zoom);

          let near = 2.2, far = 60;
          for (let i = 0; i < 18; i++) {
            setDolly((near + far) / 2);
            const box = projectCar();
            if (box.right - box.left > desiredWidth) near = camera.position.z;
            else far = camera.position.z;
          }
          setDolly((near + far) / 2);

          // Frame on the calibrated axis; then restore the remaining orbital travel.
          const matchedDistance = camera.position.z;
          const box = projectCar();
          const desiredX = T.MathUtils.lerp((start.left + start.right) / 2, photoCentreX, zoom);
          const desiredBottom = T.MathUtils.lerp(start.bottom, photoBottom, zoom);

          // Off-axis framing moves the projected image without tilting the camera
          camera.projectionMatrix.elements[8] -= 2 * (desiredX - (box.left + box.right) / 2) / width;
          camera.projectionMatrix.elements[9] += 2 * (desiredBottom - box.bottom) / height;
          camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
          if(p < .56){
            setDolly(matchedDistance);
            camera.position.add(orbitOffset);
            camera.lookAt(aim);
          }

        }

        // Section B, F, G: Update dynamic lighting, rotor intensity, and exhaust flame animation
        world.updateEffects?.(p, performance.now() * 0.001, theme.current, reduced.matches);

        // Section H: Theme-sensitive restrained bloom
        if (bloomPass) {
          bloomPass.strength = theme.current ? 0.18 : 0.10;
        }

        // Short match dissolve at locked framing; then only the photograph docks.
        photo.current.style.opacity = smooth(.82, .855, p);
        meter.current.style.transform = `scaleX(${p})`;
        stage.current.style.setProperty('--intro-end', String(end));

        if (wheelPoints.length) {
          composer.render();
          if (warmupFrames < 2) {
            warmupFrames += 1;
            if (warmupFrames === 2) {
              setLoadProgress(100);
              setSceneReady(true);
            }
          }
        }
      };
      draw();

      const lost = e => { e.preventDefault(); setUnavailable(true); };
      canvas.current.addEventListener('webglcontextlost', lost);
      cleanup.push(() => canvas.current?.removeEventListener('webglcontextlost', lost));
    }).catch(() => setUnavailable(true));

    const motion = () => setUnavailable(reduced.matches);
    reduced.addEventListener('change', motion);
    cleanup.push(() => reduced.removeEventListener('change', motion));

    return () => {
      dead = true;
      cancelAnimationFrame(frame);
      cleanup.forEach(f => f());
      world?.dispose();
      composer?.dispose();
      bloomPass?.dispose();
      renderPass?.dispose();
      outputPass?.dispose();
      environment?.dispose();
      renderer?.dispose();
    };
  }, [unavailable]);

  const skip = () => {
    setShowLoader(false);
    const top = getPageScroll() + root.current.getBoundingClientRect().top + root.current.offsetHeight;
    scrollPageTo(top);
    document.getElementById('portfolio')?.focus({ preventScroll: true });
  };

  if (unavailable) return null;
  return (
    <>
    <section ref={root} className="pit-intro" aria-label="Scroll through the CarbonSplit pit lane" />
    {createPortal(
      <div ref={stage} className="pit-stage">
        <canvas ref={canvas} aria-hidden="true" />
        <div className="pit-shade" />
        <img ref={photo} className="pit-photo" src={isDark ? '/banner_dark.jpg' : '/banner_light.jpg'} alt="" aria-hidden="true" />
        <div className="pit-top">
          <a href="#portfolio" onClick={e => { e.preventDefault(); skip(); }}>CARBON<span>SPLIT</span></a>
          <span className="pit-live"><i /> AFTER HOURS / PIT 64</span>
          <button onClick={skip}>Skip intro ↗</button>
        </div>
        <div className="pit-footer">
          <span>SCROLL TO EXPLORE <b>↓</b></span>
          <span>01 — THE PIT LANE</span>
        </div>
        <div className="pit-progress"><div ref={meter} /></div>
        {showLoader && (
          <PitLoader
            progress={loadProgress}
            stage={loadStage}
            ready={sceneReady}
            isDark={isDark}
            onSkip={skip}
            onDone={() => setShowLoader(false)}
          />
        )}
      </div>,document.body)}
    </>
  );
}
