import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import FloatingMenu from '@/components/ui/liquid-morph-floating-menu';
import AccountCards from './AccountCards';

/*
 * Accounts shown in the "Live Accounts" menu. The first entry is the default.
 * `live: true` merges fresh numbers from ./data/stats.json over `stats`.
 * `sample: true` shows a "Sample data" tag.
 *
 * The 30d change is summed from the live calendar (last 30 days up to lastUpdated)
 * unless stats.json provides change30d. Loss limits are the account rules;
 * stats.json (via the Carbon Stats bookmarklet) overrides all of these.
 */
const ACCOUNTS = [
  {
    id: 'instant-50k',
    label: 'Instant 50K',
    meta: 'Funded · Tradovate',
    live: true,
    stats: {
      startingBalance: 50000.0,
      currentEquity: 52007.7,
      dailyDrawdownLeft: 1362.6,
      maxDrawdownLeft: 2100.19,
      maxDrawdownLimit: 49907.51,
      lastUpdated: '2026-09-12T16:05:00Z',
      dailyLossLimit: 1500.0, // fixed, resets every day
      maxLossLimit: 2500.0, // fixed
      dailyResetLabel: '2:30 AM IST, daily',
    },
  },
];

const MENU_ITEMS = ACCOUNTS.map((a) => ({ label: a.label }));

const pctOf = (change, base) => (base ? (change / base) * 100 : 0);

const DAY_MS = 24 * 60 * 60 * 1000;

// P&L of a calendar event: explicit `pnl`, else parsed from "Profit +$12.55" / "Loss -$6.52"
function eventPnl(e) {
  if (typeof e.pnl === 'number') return e.pnl;
  const m = String(e.title || '').match(/([+-])\$([\d,]+(?:\.\d+)?)/);
  return m ? (m[1] === '-' ? -1 : 1) * parseFloat(m[2].replace(/,/g, '')) : 0;
}

function sumLast30Days(events, endDate) {
  const end = endDate && !isNaN(endDate) ? endDate.getTime() : Date.now();
  return events.reduce((sum, e) => {
    const t = new Date(e.startTime).getTime();
    return t > end - 30 * DAY_MS && t <= end ? sum + eventPnl(e) : sum;
  }, 0);
}

export default function TradingPerformance() {
  const [selected, setSelected] = useState(0);
  const [liveStats, setLiveStats] = useState(null);
  const [calendarEvents, setCalendarEvents] = useState(null);

  useEffect(() => {
    fetch('./data/stats.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch stats');
      })
      .then((data) => setLiveStats(data))
      .catch((err) => console.log('Using default stats snapshot:', err));

    fetch('./data/calendar.json')
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed to fetch calendar'))))
      .then((data) => setCalendarEvents(Array.isArray(data) ? data : data.events || []))
      .catch((err) => console.log('No calendar for 30d change:', err));
  }, []);

  const account = ACCOUNTS[selected];
  const stats = { ...account.stats, ...(account.live ? liveStats : null) };

  const balance = stats.currentEquity ?? stats.currentBalance ?? 0;
  const allTime = balance - (stats.startingBalance ?? balance);
  const updatedDate = stats.lastUpdated ? new Date(stats.lastUpdated) : null;
  const change30d =
    stats.change30d ?? (account.live && calendarEvents ? sumLast30Days(calendarEvents, updatedDate) : 0);

  const summary = {
    starting: stats.startingBalance ?? null,
    balance,
    allTime,
    allTimePct: pctOf(allTime, stats.startingBalance),
    change30d,
    pct30d: pctOf(change30d, balance - change30d),
    updated:
      updatedDate && !isNaN(updatedDate)
        ? updatedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : null,
  };

  const daily = {
    left: stats.dailyDrawdownLeft ?? 0,
    limit: stats.dailyLossLimit ?? 0,
    footLabel: 'Resets at',
    footValue: stats.dailyResetLabel ?? 'Session close',
  };

  const max = {
    left: stats.maxDrawdownLeft ?? 0,
    limit: stats.maxLossLimit ?? 0,
    footLabel: 'Trailing floor',
    footValue:
      stats.maxDrawdownLimit != null
        ? `$${stats.maxDrawdownLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
        : '—',
  };

  return (
    <div className="w-full mt-10 pt-8 border-t border-black/[0.06] dark:border-white/[0.08] transition-colors duration-500">
      {/* Section Title & Header */}
      <div className="relative z-20 flex items-center flex-wrap gap-x-5 gap-y-3 mb-5">
        <FloatingMenu
          label="Live Accounts"
          items={MENU_ITEMS}
          selectedIndex={selected}
          onSelect={setSelected}
        />
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={account.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="flex items-baseline flex-wrap gap-x-3 gap-y-1"
            aria-live="polite"
          >
            <span className="font-display font-normal text-[1.5rem] sm:text-[1.75rem] leading-[1.2] tracking-[-0.01em] text-neutral-900 dark:text-white transition-colors duration-500">
              {account.label}
            </span>
            <span className="text-[0.8rem] text-neutral-500 dark:text-neutral-400">{account.meta}</span>
            {account.sample && (
              <span className="rounded-full border border-black/10 dark:border-white/15 px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Sample data
              </span>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Account cards — keyed so the charge bars replay on account switch */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={account.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <AccountCards summary={summary} daily={daily} max={max} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
