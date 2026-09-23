import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';
import PillNav from './PillNav';

/*
 * To use a real screenshot for a script, add `image: './indicators/<file>.png'`
 * (file in /public/indicators). Scripts without an image get a generated chart.
 * `url` adds an "Open on TradingView" link (`urlLabel` overrides the text);
 * `imagePosition` sets the crop focus; `imageFit: 'contain'` shows the whole image.
 */
const SCRIPTS = [
  {
    name: 'Carbon Sessions',
    blurb:
      'ICT sessions and killzones on one chart—Asia, London and New York ranges with their highs, lows and killzone windows marked as they form.',
    url: 'https://in.tradingview.com/script/6x4XYT8O-Sessions-ICT-Killzones-0xCryptoVince/',
    image: './indicators/carbon-sessions.png',
    imagePosition: '72% center',
    seed: 21,
  },
  {
    name: 'Carbon SMT',
    blurb:
      'Smart Money Technique: when correlated indices like NQ, ES and YM disagree at a swing—one makes a new high or low, the other fails to—it hints the move is losing strength.',
    url: 'https://www.tradingview.com/script/WKnr2qvv-SMT/',
    image: './indicators/carbon-smt.png',
    imagePosition: '46% center',
    seed: 42,
  },
  {
    name: 'Carbon FractalPro',
    blurb:
      'Maps the fractal model: a higher-timeframe candle (C2) sweeps the prior candle’s high or low, a lower-timeframe CISD confirms, and C3 delivers—with the T-Spot, HTF candles and deviation projections for targets.',
    url: 'https://pastebin.com/HfYxBZg4',
    urlLabel: 'Open script',
    image: './indicators/carbon-fractalpro.png',
    imageFit: 'contain',
    seed: 7,
  },
];

const pad = (n) => String(n).padStart(2, '0');

const TAB_ITEMS = SCRIPTS.map((s, i) => ({ label: s.name, number: pad(i + 1) }));

export default function CarbonScripts() {
  const [active, setActive] = useState(0);
  const script = SCRIPTS[active];

  return (
    <div className="w-full mt-12 pt-10 border-t border-black/[0.06] dark:border-white/[0.08] transition-colors duration-500">
      {/* Heading row */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 lg:gap-10 mb-8">
        <h2 className="font-display font-normal text-[2.75rem] sm:text-[3.5rem] md:text-[4.5rem] leading-[0.95] tracking-[-0.025em] text-neutral-900 dark:text-white max-w-[640px] transition-colors duration-500">
          Three scripts, built as one system.
        </h2>

        <div className="lg:max-w-[380px] lg:pt-2">
          <p className="font-display text-[1.3rem] leading-[1.45] tracking-[-0.005em] text-neutral-600 dark:text-neutral-300 transition-colors duration-500">
            Sessions, SMT and the fractal model—three focused tools that read the
            same chart together, so each one confirms what the others see.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="rounded-full border border-black/[0.05] dark:border-white/[0.06] bg-white/60 dark:bg-white/[0.02] p-1 transition-colors duration-500">
        <PillNav
          items={TAB_ITEMS}
          activeIndex={active}
          onChange={setActive}
          ariaLabel="Carbon indicators"
          idPrefix="carbon"
          panelId="carbon-panel"
        />
      </div>

      {/* Panel */}
      <div
        id="carbon-panel"
        role="tabpanel"
        aria-labelledby={`carbon-tab-${active}`}
        className="mt-3 grid grid-cols-1 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] overflow-hidden rounded-2xl border border-black/[0.07] dark:border-white/[0.08] bg-white dark:bg-[#111] transition-colors duration-500"
      >
        <div className="relative min-w-0 aspect-[16/10] md:aspect-auto md:min-h-[420px] bg-[#e7e5e0] dark:bg-[#161616] transition-colors duration-500">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0"
            >
              {script.image ? (
                <img
                  src={script.image}
                  alt={`${script.name} on a TradingView chart`}
                  className={`h-full w-full bg-white ${script.imageFit === 'contain' ? 'object-contain' : 'object-cover'}`}
                  style={{ objectPosition: script.imagePosition || 'center' }}
                />
              ) : (
                <CandleChart seed={script.seed} label={script.name} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="flex flex-col justify-start px-7 py-8 md:px-12 md:py-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="font-mono text-[0.7rem] tracking-[0.08em] text-neutral-400 dark:text-neutral-500">
                {pad(active + 1)} / {pad(SCRIPTS.length)}
              </div>
              <h3 className="mt-5 font-editorial italic font-normal text-[2.4rem] md:text-[3rem] leading-[1] tracking-[-0.02em] [word-spacing:-0.12em] text-neutral-900 dark:text-white">
                {script.name}
              </h3>
              <p className="mt-5 font-display text-[1.3rem] leading-[1.45] tracking-[-0.005em] text-neutral-600 dark:text-neutral-300">
                {script.blurb}
              </p>
              {script.url && (
                <a
                  href={script.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group mt-7 inline-flex items-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] px-4 py-2 text-[0.82rem] font-medium text-neutral-800 dark:text-neutral-200 transition-colors duration-300 hover:bg-neutral-900 hover:text-white hover:border-neutral-900 dark:hover:bg-white dark:hover:text-neutral-900 dark:hover:border-white"
                >
                  {script.urlLabel || 'Open on TradingView'}
                  <ArrowUpRight
                    className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    strokeWidth={2}
                  />
                </a>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

/* ---------- Generated placeholder chart ---------- */

function mulberry32(a) {
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const W = 640;
const H = 400;
const N = 72;
const TOP = 18;
const BOTTOM = H - 30;

function buildChart(seed) {
  const rand = mulberry32(seed);
  const phase = rand() * Math.PI * 2;
  let price = 100;
  const candles = [];
  for (let i = 0; i < N; i++) {
    const trend = Math.sin((i / N) * Math.PI * 2.2 + phase) * 0.9;
    const open = price;
    const close = open + (rand() - 0.5) * 2.4 + trend;
    const high = Math.max(open, close) + rand() * 1.1;
    const low = Math.min(open, close) - rand() * 1.1;
    candles.push({ open, close, high, low });
    price = close;
  }

  const max = Math.max(...candles.map((c) => c.high));
  const min = Math.min(...candles.map((c) => c.low));
  const y = (v) => TOP + ((max - v) / (max - min)) * (BOTTOM - TOP);
  const step = W / N;

  // Imbalance zones anchored on a few candles and extended to the right
  const zones = [0, 1, 2].map((k) => {
    const i = 6 + Math.floor(rand() * (N - 30));
    const c = candles[i];
    const len = 10 + Math.floor(rand() * 18);
    return {
      x: i * step,
      w: len * step,
      y: y(c.high),
      h: Math.max(8, y(c.low) - y(c.high)),
      tone: k % 2 === 0 ? 'red' : 'blue',
    };
  });

  // One highlighted "macro window"
  const winStart = 20 + Math.floor(rand() * 30);
  const win = [winStart, winStart + 6];

  return { candles, y, step, zones, win };
}

function CandleChart({ seed, label }) {
  const { candles, y, step, zones, win } = useMemo(() => buildChart(seed), [seed]);
  const bodyW = step * 0.55;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-full w-full"
      role="img"
      aria-label={`Illustrative chart for ${label}`}
    >
      {/* Grid */}
      {Array.from({ length: 6 }, (_, k) => (
        <line
          key={k}
          x1={(k + 1) * step * 12}
          x2={(k + 1) * step * 12}
          y1={0}
          y2={BOTTOM}
          className="stroke-black/[0.06] dark:stroke-white/[0.06]"
        />
      ))}

      {/* Macro window */}
      <rect
        x={win[0] * step}
        width={(win[1] - win[0]) * step}
        y={0}
        height={BOTTOM}
        className="fill-amber-400/[0.08]"
      />

      {/* Zones */}
      {zones.map((z, k) => (
        <rect
          key={k}
          x={z.x}
          y={z.y}
          width={z.w}
          height={z.h}
          className={
            z.tone === 'red'
              ? 'fill-[#c98b8b]/25 stroke-[#b36b6b]/50'
              : 'fill-[#8ea3c4]/30 stroke-[#6d84a8]/50'
          }
          strokeWidth={0.75}
        />
      ))}

      {/* Candles */}
      {candles.map((c, i) => {
        const cx = i * step + step / 2;
        const up = c.close >= c.open;
        const inWin = i >= win[0] && i < win[1];
        const top = y(Math.max(c.open, c.close));
        const h = Math.max(1, Math.abs(y(c.open) - y(c.close)));
        const tone = inWin
          ? 'fill-amber-400 stroke-amber-500'
          : up
            ? 'fill-[#b7c9b5] stroke-neutral-700 dark:fill-[#4f6b53] dark:stroke-neutral-400'
            : 'fill-neutral-900 stroke-neutral-900 dark:fill-neutral-200 dark:stroke-neutral-200';
        return (
          <g key={i}>
            <line
              x1={cx}
              x2={cx}
              y1={y(c.high)}
              y2={y(c.low)}
              strokeWidth={1}
              className="stroke-neutral-800 dark:stroke-neutral-300"
            />
            <rect x={cx - bodyW / 2} y={top} width={bodyW} height={h} strokeWidth={0.75} className={tone} />
          </g>
        );
      })}

      {/* Time axis */}
      <line x1={0} x2={W} y1={BOTTOM} y2={BOTTOM} className="stroke-black/10 dark:stroke-white/10" />
      {Array.from({ length: 5 }, (_, k) => {
        const minutes = 9 * 60 + 30 + (k + 1) * 15;
        const hh = Math.floor(minutes / 60);
        const mm = minutes % 60;
        return (
          <text
            key={k}
            x={(k + 1) * step * 12}
            y={H - 12}
            textAnchor="middle"
            className="fill-neutral-500 font-mono"
            fontSize="10"
          >
            {`${pad(hh > 12 ? hh - 12 : hh)}:${pad(mm)} ${hh >= 12 ? 'PM' : 'AM'}`}
          </text>
        );
      })}
    </svg>
  );
}
