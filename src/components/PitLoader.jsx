import { useEffect, useRef, useState } from 'react';

// 5x7 pit-board LED glyph bitmaps (rows of 5 columns).
const GLYPHS = {
  '0': ['.###.', '#...#', '#..##', '#.#.#', '##..#', '#...#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '3': ['.###.', '#...#', '....#', '..##.', '....#', '#...#', '.###.'],
  '4': ['...#.', '..##.', '.#.#.', '#..#.', '#####', '...#.', '...#.'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#...#', '#....', '####.', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '#...#', '.###.'],
  '%': ['##..#', '##..#', '...#.', '..#..', '.#...', '#..##', '#..##'],
};

const COLS = 23;
const ROWS = 7;

function isLit(text, col, row) {
  const charIndex = Math.floor(col / 6);
  const localCol = col % 6;
  if (localCol === 5 || charIndex >= text.length) return false;
  return GLYPHS[text[charIndex]]?.[row]?.[localCol] === '#';
}

export default function PitLoader({ progress, stage, ready, isDark, onSkip, onDone }) {
  const [displayPct, setDisplayPct] = useState(0);
  const [exiting, setExiting] = useState(false);
  const targetRef = useRef(0);
  const readyRef = useRef(false);
  const onDoneRef = useRef(onDone);
  targetRef.current = progress;
  readyRef.current = ready;
  onDoneRef.current = onDone;

  useEffect(() => {
    let raf = 0;
    let holdTimer = 0;
    let doneTimer = 0;
    let current = 0;
    let finished = false;
    const started = performance.now();
    // Minimum 920ms ramp ensures 000% -> 100% reads smoothly instead of flashing on cached loads.
    const MIN_MS = 920;

    const tick = (now) => {
      const elapsed = now - started;
      const cap = readyRef.current ? 100 : Math.min(94, targetRef.current + (elapsed > 250 ? Math.min(18, (elapsed - 250) / 140) : 0));
      const timeCap = readyRef.current ? Math.min(100, (elapsed / MIN_MS) * 100) : cap;
      const goal = readyRef.current ? Math.max(current, Math.min(100, timeCap)) : Math.min(94, Math.max(targetRef.current, cap));

      current += (goal - current) * (readyRef.current ? 0.22 : 0.12);
      if (readyRef.current && elapsed >= MIN_MS && 100 - current < 0.6) {
        current = 100;
      }

      const rounded = Math.min(100, Math.round(current));
      setDisplayPct((prev) => (prev === rounded ? prev : rounded));

      if (rounded >= 100 && readyRef.current && !finished) {
        finished = true;
        holdTimer = window.setTimeout(() => {
          setExiting(true);
          doneTimer = window.setTimeout(() => onDoneRef.current?.(), 660);
        }, 180);
        return;
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(holdTimer);
      window.clearTimeout(doneTimer);
    };
  }, []);

  const text = `${String(displayPct).padStart(3, '0')}%`;
  const phase = displayPct >= 100 ? 'READY' : stage;

  return (
    <div
      className={`pit-loader ${isDark ? 'is-dark' : 'is-light'} ${exiting ? 'is-exiting' : ''}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading pit lane: ${displayPct}%`}
    >
      <div className="pit-loader-blade pit-loader-blade--top" aria-hidden="true" />
      <div className="pit-loader-blade pit-loader-blade--bottom" aria-hidden="true" />
      <div className="pit-loader-seam" aria-hidden="true" />

      <div className="pit-loader-top">
        <span className="pit-loader-brand">CARBON<span>SPLIT</span></span>
        <button type="button" className="pit-loader-skip" onClick={onSkip}>
          Skip intro ↗
        </button>
      </div>

      <div className="pit-loader-core">
        <svg className="pit-loader-matrix" viewBox="0 0 276 84" aria-hidden="true">
          {Array.from({ length: ROWS * COLS }, (_, idx) => {
            const col = idx % COLS;
            const row = Math.floor(idx / COLS);
            const lit = isLit(text, col, row);
            return (
              <circle
                key={idx}
                cx={col * 12 + 6}
                cy={row * 12 + 6}
                r={4.3}
                className={lit ? 'pit-dot is-on' : 'pit-dot'}
              />
            );
          })}
        </svg>

        <div className="pit-loader-rail" aria-hidden="true">
          <div className="pit-loader-rail-fill" style={{ transform: `scaleX(${displayPct / 100})` }} />
          <span className="pit-loader-rail-head" style={{ left: `${displayPct}%` }} />
        </div>

        <div className="pit-loader-meta">
          <span className="pit-loader-tag">
            PIT<i aria-hidden="true" />64
          </span>
          <span className="pit-loader-phase">{phase}</span>
        </div>
      </div>
    </div>
  );
}
