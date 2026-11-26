import { createPortal } from 'react-dom';
import { getPageScroll, scrollPageTo } from '../lib/siteScroll';
import { useEffect, useRef, useState } from 'react';
import PitLoader from './PitLoader';
import './PitLaneIntro.css';

export default function PitLaneIntro({ isDark }) {
  const root = useRef(null), stage = useRef(null), canvas = useRef(null), photo = useRef(null), meter = useRef(null);
  const frameEl = useRef(null), backdrop = useRef(null);
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
      // Elevated three-quarter axis the hero frame is shot on.
      // Moving along this ray preserves pitch/yaw instead of dropping to door height.
      const aim = new T.Vector3(0, .75, 0);
      const approach = new T.Vector3(.4 / 8.6, 1.30 / 8.6, 1);
      const setDolly = distance => {
        camera.position.copy(aim).addScaledVector(approach, distance);
        camera.up.set(0, 1, 0);
        camera.lookAt(aim);
      };

      // One continuous camera rail: a crane shot that drifts down the pit lane,
      // sweeps around the nose and settles onto the hero axis. Centripetal
      // Catmull-Rom keeps the curvature even so the speed never hitches.
      const rail = new T.CatmullRomCurve3([
        new T.Vector3(17, 2.3, 4.6),
        new T.Vector3(12.4, 2.3, 6.2),
        new T.Vector3(7.4, 2.1, 8.6),
        new T.Vector3(3.1, 2.4, 11.2),
        aim.clone().addScaledVector(approach, 12.2),
      ], false, 'centripetal');
      // Where the lens is pointed early on: down the lane, ahead of the car.
      const lead = new T.Vector3(-2.4, 1.25, -1.4);
      const FINAL_FOV = 32;
      const orbitPos = new T.Vector3(), lockPos = new T.Vector3(), lookAt = new T.Vector3();
      const lock = { distance: 12.2, shiftX: 0, shiftY: 0 };
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
      const lerp = T.MathUtils.lerp;
      // Quintic smootherstep: zero velocity *and* acceleration at both ends, so
      // overlapping phases hand over without a visible jolt.
      const smoother = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * t * (t * (t * 6 - 15) + 10); };
      // CSS-style cubic-bezier easing (x1,y1,x2,y2) solved with Newton steps.
      const bezier = (x1, y1, x2, y2) => {
        const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
        const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
        const sx = t => ((ax * t + bx) * t + cx) * t, sy = t => ((ay * t + by) * t + cy) * t;
        const dx = t => (3 * ax * t + 2 * bx) * t + cx;
        return x => {
          if (x <= 0 || x >= 1) return clamp(x);
          let t = x;
          for (let i = 0; i < 6; i++) { const d = dx(t); if (Math.abs(d) < 1e-6) break; t -= (sx(t) - x) / d; }
          return sy(clamp(t));
        };
      };
      // Responsive start, then a long glide into the final frame.
      const cameraEase = bezier(.42, 0, .45, 1);

      // Frame the car exactly as it sits in the banner photograph inside `rect`:
      // dolly along the hero axis until the wheelbase matches, then shift the
      // lens (off-axis projection) so the hubs land on the photo's hubs.
      const solveLock = rect => {
        const measured = bannerCars[theme.current ? 'dark' : 'light'];
        const scale = Math.max(rect.width / measured.width, rect.height / measured.height);
        const offsetX = rect.left + (rect.width - measured.width * scale) / 2;
        const offsetY = rect.top + (rect.height - measured.height * scale) / 2;
        const photoWidth = (measured.hubs[1][0] - measured.hubs[0][0]) * scale;
        const photoCentreX = offsetX + (measured.hubs[0][0] + measured.hubs[1][0]) * scale / 2;
        const photoBottom = offsetY + Math.max(measured.hubs[0][1], measured.hubs[1][1]) * scale;
        camera.fov = FINAL_FOV;
        camera.updateProjectionMatrix();
        let near = 2.2, far = 60;
        for (let i = 0; i < 20; i++) {
          const mid = (near + far) / 2;
          setDolly(mid);
          const box = projectCar();
          if (box.right - box.left > photoWidth) near = mid; else far = mid;
        }
        lock.distance = (near + far) / 2;
        setDolly(lock.distance);
        const box = projectCar();
        lock.shiftX = 2 * (photoCentreX - (box.left + box.right) / 2) / width;
        lock.shiftY = 2 * (photoBottom - box.bottom) / height;
      };

      let warmupFrames = 0, eased = null, lastTime = performance.now();
      const draw = () => {
        if (dead) return;
        frame = requestAnimationFrame(draw);
        const now = performance.now(), dt = Math.min(.1, (now - lastTime) / 1000);
        lastTime = now;
        const bounds = root.current.getBoundingClientRect(), p = clamp(-bounds.top / root.current.offsetHeight);
        const gone = bounds.top + root.current.offsetHeight <= 0;
        stage.current.style.visibility = gone ? 'hidden' : 'visible';
        if (gone || document.hidden) { eased = p; return; }

        // Critically damped follow on top of the smooth scroller: the camera
        // carries a little weight instead of being bolted to the wheel.
        if (eased === null) eased = p;
        eased += (p - eased) * (1 - Math.exp(-dt / .14));
        if (Math.abs(p - eased) < 1e-4) eased = p;
        const s = eased;

        // Overlapping beats (scroll progress):
        //   camera  0 ──────────── .90  one eased move, never stops mid-way
        //   lock         ~.35 ─── .88  blend onto the photo-matched framing
        //   dock            .70 ───── 1  frame shrinks into the banner slot
        //   dissolve          .78 ── .93 3D melts into the photograph
        const u = cameraEase(clamp(s / .9));
        const dock = smoother(.70, 1, s);
        const dissolve = smoother(.78, .93, s);
        const hud = smoother(.60, .80, s);

        // Docking rect: centre glides linearly, size scales geometrically so
        // the shrink reads as an even zoom rather than slowing at the end.
        const rect = { left: 0, top: 0, width, height };
        const target = document.querySelector('[data-pit-banner]')?.getBoundingClientRect();
        if (target && dock > 0) {
          rect.width = width * Math.pow(target.width / width, dock);
          rect.height = height * Math.pow(target.height / height, dock);
          const cx = lerp(width / 2, target.left + target.width / 2, dock);
          const cy = lerp(height / 2, target.top + target.height / 2, dock);
          rect.left = cx - rect.width / 2;
          rect.top = cy - rect.height / 2;
        }
        const r = 16 * dock;
        frameEl.current.style.clipPath = `inset(${rect.top}px ${width - rect.left - rect.width}px ${height - rect.top - rect.height}px ${rect.left}px round ${r}px)`;
        Object.assign(photo.current.style, {
          left: `${rect.left}px`, top: `${rect.top}px`,
          width: `${rect.width}px`, height: `${rect.height}px`,
          opacity: String(dissolve),
        });
        // Surround eases from the pit's night tone to the page colour, then lifts away,
        // so the page arrives around the frame instead of popping in.
        const tone = smoother(.68, .9, s), page = theme.current ? [10, 10, 10] : [250, 250, 250];
        backdrop.current.style.backgroundColor = `rgb(${[9, 14, 21].map((c, i) => Math.round(lerp(c, page[i], tone))).join(',')})`;
        backdrop.current.style.opacity = String(1 - smoother(.8, 1, s));

        // Rail pose.
        orbitPos.copy(rail.getPointAt(u));
        if (width < 700) orbitPos.addScaledVector(approach, 4.6 * (1 - u));
        lookAt.lerpVectors(lead, aim, smoother(0, .7, u));
        const orbitFov = lerp(46, FINAL_FOV, smoother(.05, .95, u));

        // Hero pose, matched to the photograph in the current rect.
        let w = 0;
        if (wheelPoints.length === 2) {
          solveLock(rect);
          lockPos.copy(camera.position);
          w = smoother(.30, .97, u);
        }

        const t = now * .001;
        const life = 1 - w; // handheld breath fades out as the frame locks
        camera.position.lerpVectors(orbitPos, lockPos, w);
        camera.position.x += Math.sin(t * .61) * .045 * life + Math.sin(t * 1.37) * .012 * life;
        camera.position.y += Math.sin(t * .47 + 1.3) * .03 * life;
        lookAt.lerp(aim, w);
        camera.up.set(0, 1, 0);
        camera.lookAt(lookAt);
        // Gentle bank into the sweep, like a crane arm swinging round.
        camera.rotateZ((-.02 * Math.sin(Math.PI * u) + .0025 * Math.sin(t * .37)) * life);
        camera.fov = lerp(orbitFov, FINAL_FOV, w);
        camera.updateProjectionMatrix();
        camera.projectionMatrix.elements[8] -= lock.shiftX * w;
        camera.projectionMatrix.elements[9] += lock.shiftY * w;
        camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

        world.updateEffects?.(s, t, theme.current, reduced.matches);
        if (bloomPass) bloomPass.strength = theme.current ? 0.18 : 0.10;

        // As the photograph comes up, the render softens and warms into it.
        canvas.current.style.filter = dissolve > .002 ? `blur(${(3.5 * dissolve).toFixed(2)}px) brightness(${(1 + .18 * dissolve).toFixed(3)})` : '';
        meter.current.style.transform = `scaleX(${p})`;
        stage.current.style.setProperty('--intro-end', String(hud));

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
        <div ref={backdrop} className="pit-backdrop" />
        <div ref={frameEl} className="pit-frame">
          <canvas ref={canvas} aria-hidden="true" />
          <div className="pit-shade" />
          <img ref={photo} className="pit-photo" src={isDark ? '/banner_dark.jpg' : '/banner_light.jpg'} alt="" aria-hidden="true" />
        </div>
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
