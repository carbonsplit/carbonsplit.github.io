import { useState, useEffect } from 'react';
import SolvingOrb from './SolvingOrb';


export default function TradingPerformance() {
  const [stats, setStats] = useState({
    accountName: 'MOHIT71208',
    accountType: 'Instant 50K - Funded',
    status: 'Active',
    platform: 'Tradovate',
    startingBalance: 50000.00,
    currentBalance: 52062.41,
    currentEquity: 52062.41,
    dailyDrawdownLeft: 3562.41,
    dailyDrawdownLimit: 48500.00,
    maxDrawdownLeft: 2154.90,
    maxDrawdownLimit: 49907.51,
    consistency: 32.93,
    consistencyMax: 20.00,
    lastUpdated: '2026-07-28T07:00:00Z'
  });

  useEffect(() => {
    fetch('/data/stats.json')
      .then((res) => {
        if (res.ok) return res.json();
        throw new Error('Failed to fetch stats');
      })
      .then((data) => setStats(data))
      .catch((err) => console.log('Using default stats snapshot:', err));
  }, []);

  if (!stats) return null;

  const profit = stats.currentEquity - stats.startingBalance;
  const profitPercentage = ((profit / stats.startingBalance) * 100).toFixed(2);

  return (
    <div className="w-full mt-10 pt-8 border-t border-black/[0.06] dark:border-white/[0.08] transition-colors duration-500">
      {/* Section Title & Header */}
      <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <span className="text-emerald-500 dark:text-emerald-400">
            <SolvingOrb size={18} />
          </span>
          <h3 className="text-[0.85rem] font-semibold tracking-wider uppercase text-neutral-900 dark:text-white transition-colors duration-500">
            Prop Firm Live Stats
          </h3>
          <span className="text-[0.7rem] font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            {stats.status} • {stats.accountType}
          </span>
        </div>

        <span className="text-[0.75rem] text-neutral-400 dark:text-neutral-500">
          Account #{stats.accountName}
        </span>
      </div>

      {/* Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Equity & Profit Card */}
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] transition-all duration-300 hover:border-black/10 dark:hover:border-white/10">
          <div className="text-[0.75rem] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Current Equity / Balance
          </div>
          <div className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">
            ${stats.currentEquity.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[0.75rem] font-medium text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
              <path d="M13 7h-2v4H7v2h4v4h2v-4h4v-2h-4z"/>
            </svg>
            +${profit.toLocaleString('en-US', { minimumFractionDigits: 2 })} ({profitPercentage}%)
          </div>
        </div>

        {/* Daily Drawdown Left */}
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] transition-all duration-300 hover:border-black/10 dark:hover:border-white/10">
          <div className="text-[0.75rem] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Daily Drawdown Buffer
          </div>
          <div className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">
            ${stats.dailyDrawdownLeft.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[0.75rem] text-neutral-400 dark:text-neutral-500">
            Limit Floor: ${stats.dailyDrawdownLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>

        {/* Max Drawdown Left */}
        <div className="p-4 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.06] transition-all duration-300 hover:border-black/10 dark:hover:border-white/10 sm:col-span-2 lg:col-span-1">
          <div className="text-[0.75rem] font-medium text-neutral-500 dark:text-neutral-400 mb-1">
            Max Drawdown Buffer
          </div>
          <div className="text-xl font-semibold text-neutral-900 dark:text-white tracking-tight">
            ${stats.maxDrawdownLeft.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[0.75rem] text-neutral-400 dark:text-neutral-500">
            Limit Floor: ${stats.maxDrawdownLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Footer Info / Badge */}
      <div className="mt-3 flex items-center justify-between text-[0.75rem] text-neutral-500 dark:text-neutral-400">
        <span>Verified via <strong className="font-medium text-neutral-700 dark:text-neutral-300">Goat Funded Futures</strong> ({stats.platform})</span>
        <span>Consistency: <strong className="font-medium text-neutral-700 dark:text-neutral-300">{stats.consistency}%</strong></span>
      </div>
    </div>
  );
}
