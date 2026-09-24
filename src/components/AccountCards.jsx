import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';
import { ArrowDownRight, BatteryCharging, Gauge, RefreshCcw, Sparkle } from 'lucide-react';

const SEGMENTS = 20;
const EASE = [0.22, 1, 0.36, 1];

// Literal class strings so Tailwind can see them
const TONES = {
  // P&L text only
  green: { text: 'text-[#1f9d3a] dark:text-[#58d65b]' },
  // Neon charge-bar tones
  yellow: {
    text: 'text-[#a98d00] dark:text-[#ffe94d]',
    fill: 'bg-[#f2d422] dark:bg-[#ffe94d]',
    neon: 'shadow-[0_0_5px_rgba(242,212,34,0.25)] dark:shadow-[0_0_6px_rgba(255,233,77,0.28)]',
    glow: 'bg-[radial-gradient(60%_55%_at_50%_115%,rgba(242,212,34,0.22),transparent)] dark:bg-[radial-gradient(60%_55%_at_50%_115%,rgba(255,233,77,0.24),transparent)]',
  },
  red: {
    text: 'text-[#d42a2a] dark:text-[#ff4d5e]',
    fill: 'bg-[#ef3b3b] dark:bg-[#ff4d5e]',
    neon: 'shadow-[0_0_5px_rgba(239,59,59,0.22)] dark:shadow-[0_0_6px_rgba(255,77,94,0.28)]',
    glow: 'bg-[radial-gradient(60%_55%_at_50%_115%,rgba(239,59,59,0.2),transparent)] dark:bg-[radial-gradient(60%_55%_at_50%_115%,rgba(255,77,94,0.24),transparent)]',
  },
};

const usd = (n) =>
  `$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const signed = (n) => `${n >= 0 ? '+' : '−'}${usd(n)}`;
const signedPct = (n) => `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(2)}%`;

const CARD =
  'relative flex flex-col overflow-hidden rounded-[26px] p-6 min-h-[300px] bg-[#f1f0ed] dark:bg-[#0e0e0e] border border-black/[0.04] dark:border-white/[0.07] transition-colors duration-500';
const PILL =
  'inline-flex items-center gap-1.5 rounded-full bg-black/[0.05] dark:bg-white/[0.07] px-3 py-1.5 text-[0.8rem] leading-none text-neutral-700 dark:text-neutral-200 whitespace-nowrap';
const BIG =
  'text-[2.1rem] sm:text-[2.3rem] font-normal leading-none tracking-[-0.035em] tabular-nums text-neutral-900 dark:text-white';

function Pill({ icon: Icon, children }) {
  return (
    <span className={PILL}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-neutral-500 dark:text-neutral-400" strokeWidth={1.8} />
      {children}
    </span>
  );
}

/* ---------- Charging level bar ---------- */

// Lit segments sit on an overlay that is revealed left → right (clip-path),
// so the charge sweeps across horizontally instead of each bar rising.
function ChargeBar({ pct, tone }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const [charged, setCharged] = useState(false);
  const clamped = Math.max(0, Math.min(100, pct));
  const lit = Math.round((clamped / 100) * SEGMENTS);
  const sweep = 0.35 + 1.1 * (lit / SEGMENTS); // seconds

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => setCharged(true), sweep * 1000 + 100);
    return () => clearTimeout(t);
  }, [inView, sweep]);

  // Right inset lands in the gap after the last lit segment
  const openTo = 100 - (lit / SEGMENTS) * 100;

  return (
    <div ref={ref} className="mt-6">
      {/* Scale */}
      <div className="relative mb-2 h-4 text-[0.75rem] font-medium tabular-nums">
        {[0, 50, 100].map((mark) => (
          <span
            key={mark}
            className={`absolute top-0 transition-colors duration-500 ${
              mark === 0 ? 'left-0' : mark === 50 ? 'left-1/2 -translate-x-1/2' : 'right-0'
            } ${clamped >= mark && inView ? tone.text : 'text-neutral-400 dark:text-neutral-600'}`}
            style={{ transitionDelay: inView ? `${(mark / 100) * sweep}s` : '0s' }}
          >
            {mark}
          </span>
        ))}
      </div>

      <div
        className="relative h-16"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(clamped)}
        aria-label={`${Math.round(clamped)}% of buffer remaining`}
      >
        {/* Empty track */}
        <div className="absolute inset-0 flex gap-[7px]">
          {Array.from({ length: SEGMENTS }, (_, i) => (
            <span key={i} className="block h-full flex-1 rounded-full bg-black/[0.07] dark:bg-white/[0.07]" />
          ))}
        </div>

        {/* Charge, revealed horizontally */}
        <motion.div
          className="absolute inset-0 flex gap-[7px]"
          initial={{ clipPath: 'inset(-16px 100% -16px -16px)' }}
          animate={{ clipPath: `inset(-16px ${inView ? openTo : 100}% -16px -16px)` }}
          transition={{ duration: sweep, ease: EASE }}
        >
          {Array.from({ length: SEGMENTS }, (_, i) => {
            const on = i < lit;
            const isTip = on && i === lit - 1;
            return (
              <span
                key={i}
                className={`block h-full flex-1 rounded-full ${on ? `${tone.fill} ${tone.neon}` : 'invisible'} ${
                  isTip && charged ? 'animate-[charge-pulse_1.8s_ease-in-out_infinite]' : ''
                }`}
              />
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}

/* ---------- Cards ---------- */

function SummaryCard({ starting, balance, allTime, allTimePct, change30d, pct30d, updated }) {
  const tone = (n) => (n >= 0 ? TONES.green.text : TONES.red.text);
  return (
    <div className={CARD}>
      <div className="flex items-center justify-between text-[0.85rem]">
        <span className="text-neutral-800 dark:text-neutral-200">Summary</span>
        {updated && <span className="text-neutral-500 dark:text-neutral-400">Updated {updated}</span>}
      </div>

      {starting != null && (
        <div className="mt-auto pt-8">
          <div className="text-[0.85rem] text-neutral-500 dark:text-neutral-400">Starting balance</div>
          <div className={`mt-3 ${BIG}`}>{usd(starting)}</div>
        </div>
      )}

      <div className={starting != null ? 'mt-6' : 'mt-auto pt-10'}>
        <div className="text-[0.85rem] text-neutral-500 dark:text-neutral-400">Current balance</div>
        <div className={`mt-3 ${BIG}`}>{usd(balance)}</div>
        <div className="mt-5 flex flex-col items-start gap-2">
          <Pill icon={RefreshCcw}>
            All-time change
            <span className={`${tone(allTime)} tabular-nums`}>
              {signed(allTime)} ({signedPct(allTimePct)})
            </span>
          </Pill>
          <Pill icon={Sparkle}>
            30d change
            <span className={`${tone(change30d)} tabular-nums`}>
              {signed(change30d)} ({signedPct(pct30d)})
            </span>
          </Pill>
        </div>
      </div>
    </div>
  );
}

function BufferCard({ label, left, limit, footLabel, footValue, tone: toneName = 'yellow' }) {
  const pct = limit > 0 ? (left / limit) * 100 : 0;
  const used = Math.max(0, limit - left);
  const tone = TONES[toneName];

  return (
    <div className={CARD}>
      <div className={`pointer-events-none absolute inset-0 ${tone.glow}`} aria-hidden />

      <div className="relative">
        <div className="text-[0.85rem] text-neutral-500 dark:text-neutral-400">{label}</div>
        <div className={`mt-3 ${BIG}`}>{usd(left)}</div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Pill icon={Gauge}>limit {usd(limit)}</Pill>
          <Pill icon={ArrowDownRight}>used {usd(used)}</Pill>
        </div>
      </div>

      <div className="relative">
        <ChargeBar pct={pct} tone={tone} />
      </div>

      <div className={`relative mt-auto flex items-end justify-between gap-3 pt-5 text-[0.85rem] ${tone.text}`}>
        <div className="leading-6">
          <div className="opacity-80">{footLabel}</div>
          <div className="font-medium">{footValue}</div>
        </div>
        <div className="flex items-center gap-1.5 font-medium">
          {Math.round(pct)}% left
          <BatteryCharging className="h-4 w-4" strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

export default function AccountCards({ summary, daily, max }) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      <SummaryCard {...summary} />
      <BufferCard label="Daily drawdown buffer" tone="yellow" {...daily} />
      <div className="md:col-span-2 lg:col-span-1 [&>*]:h-full">
        <BufferCard label="Max drawdown buffer" tone="red" {...max} />
      </div>
    </div>
  );
}
