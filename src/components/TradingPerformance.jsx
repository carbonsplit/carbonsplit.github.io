import { useState, useEffect } from 'react';
import { ThinkingOrb } from 'thinking-orbs';
import { TrendingDown, TrendingUp } from 'lucide-react';

export default function TradingPerformance() {
  const [stats, setStats] = useState({
    accountName: '4571',
    accountType: 'Instant 50K - Funded',
    status: 'Active',
    platform: 'Tradovate',
    startingBalance: 50000.00,
    currentBalance: 52007.70,
    currentEquity: 52007.70,
    dailyDrawdownLeft: 1362.60,
    dailyDrawdownLimit: 50645.10,
    maxDrawdownLeft: 2100.19,
    maxDrawdownLimit: 49907.51,
    consistency: 32.93,
    consistencyMax: 20.00,
    lastUpdated: '2026-09-12T16:05:00Z'
  });
  const [lastTrade, setLastTrade] = useState({
    pnl: -137.40,
    date: 'Sep 10',
  });

  useEffect(() => {
    fetch('./data/stats.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch stats');
      })
      .then((data) => setStats(data))
      .catch((err) => console.log('Using default stats snapshot:', err));

    fetch('./data/calendar.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch calendar');
      })
      .then((data) => {
        const list = Array.isArray(data) ? data : data.events || [];
        const sorted = [...list].sort(
          (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
        );
        if (sorted.length > 0) {
          const latest = sorted[sorted.length - 1];
          let pnl = 0;
          if (latest.pnl !== undefined) {
            pnl = Number(latest.pnl);
          } else if (latest.title) {
            const match = latest.title.match(/([+-])\$([\d,]+(?:\.\d+)?)/);
            if (match) {
              const sign = match[1] === '-' ? -1 : 1;
              pnl = sign * parseFloat(match[2].replace(/,/g, ''));
            }
          }
          const tradeDate = new Date(latest.startTime);
          const formattedDate = !isNaN(tradeDate.getTime())
            ? tradeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            : '';

          setLastTrade({
            pnl,
            date: formattedDate,
            rawDate: latest.startTime,
          });
        }
      })
      .catch((err) => console.log('No calendar events found:', err));
  }, []);

  if (!stats) return null;

  const currentEquity = stats.currentEquity ?? 52007.70;
  const startingBalance = stats.startingBalance ?? 50000.00;
  const tradePnl = lastTrade?.pnl ?? -137.40;
  const prevBalance = currentEquity - tradePnl;
  const prevTradePct = prevBalance !== 0 ? (tradePnl / prevBalance) * 100 : 0;

  return (
    <div className="w-full mt-10 pt-8 border-t border-black/[0.06] dark:border-white/[0.08] transition-colors duration-500">
      {/* Section Title & Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <ThinkingOrb state="solving" size={20} />
          <h3 className="text-[0.82rem] font-semibold tracking-wider uppercase text-neutral-900 dark:text-white transition-colors duration-500">
            Prop Firm Live Stats:
          </h3>
          <div
            style={{ fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif' }}
            className="px-2 py-0.5 rounded-[2px] bg-[#f0e8fa] dark:bg-[#231d2e] text-[#6b21a8] dark:text-[#c7b7df] text-[0.72rem] font-medium tracking-[0.08em] uppercase transition-colors duration-500"
          >
            Funded // Instant 50K
          </div>
        </div>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Equity & Balance Card */}
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] transition-all duration-300 hover:border-black/10 dark:hover:border-white/10">
          <div className="text-[0.75rem] font-medium text-neutral-500 dark:text-neutral-400 mb-1 leading-5">
            Current Equity / Balance
          </div>
          <div className="flex items-baseline gap-2 leading-7">
            <span className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight tabular-nums">
              ${currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
            <span
              className={`inline-flex items-center gap-1 text-[0.78rem] font-medium tracking-tight ${
                tradePnl >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-[#6b21a8] dark:text-[#c7b7df]'
              }`}
              title={`Previous trade: ${tradePnl >= 0 ? '+' : '-'}$${Math.abs(tradePnl).toFixed(2)} (${tradePnl >= 0 ? '+' : ''}{prevTradePct.toFixed(2)}%) from previous balance $${prevBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
            >
              {tradePnl >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 shrink-0 stroke-[2.2]" />
              )}
              <span>{tradePnl >= 0 ? '+' : '-'}${Math.abs(tradePnl).toFixed(2)}</span>
              <span className="opacity-70">({tradePnl >= 0 ? '+' : ''}{prevTradePct.toFixed(2)}%)</span>
            </span>
          </div>
        </div>

        {/* Daily Drawdown Left */}
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] transition-all duration-300 hover:border-black/10 dark:hover:border-white/10">
          <div className="text-[0.75rem] font-medium text-neutral-500 dark:text-neutral-400 mb-1 leading-5">
            Daily Drawdown Buffer
          </div>
          <div className="flex items-baseline gap-2 leading-7">
            <span className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight tabular-nums">
              ${stats.dailyDrawdownLeft.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[0.75rem] text-neutral-400 dark:text-neutral-500 leading-5">
            (Maximum permitted daily loss)
          </div>
        </div>

        {/* Max Drawdown Left */}
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] transition-all duration-300 hover:border-black/10 dark:hover:border-white/10 sm:col-span-2 lg:col-span-1">
          <div className="text-[0.75rem] font-medium text-neutral-500 dark:text-neutral-400 mb-1 leading-5">
            Max Drawdown Buffer
          </div>
          <div className="flex items-baseline gap-2 leading-7">
            <span className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight tabular-nums">
              ${stats.maxDrawdownLeft.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="mt-1 text-[0.75rem] text-neutral-400 dark:text-neutral-500 leading-5">
            (Total permitted loss)
          </div>
        </div>
      </div>

    </div>
  );
}
