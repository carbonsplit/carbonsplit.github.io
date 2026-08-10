import React, { useState, useEffect } from 'react';
import { ThinkingOrb } from 'thinking-orbs';

const PerformanceModule = () => {
  const [stats, setStats] = useState({
    accountName: "MOHIT71208",
    accountType: "Instant 50K - Funded",
    status: "Active",
    platform: "Tradovate",
    startingBalance: 50000.00,
    currentBalance: 51926.21,
    currentEquity: 51926.21,
    dailyDrawdownLeft: 3426.21,
    dailyDrawdownLimit: 48500.00,
    maxDrawdownLeft: 2018.70,
    maxDrawdownLimit: 49907.51,
    consistency: 35.25,
    consistencyMax: 20.00,
    lastUpdated: "2026-07-23T12:00:00Z"
  });

  useEffect(() => {
    fetch('/data/stats.json')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error("Error fetching stats:", err));
  }, []);

  const netPnL = stats.currentBalance - stats.startingBalance;
  const returnPct = (netPnL / stats.startingBalance) * 100;

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return "Updated daily";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const calculateBufferPct = (left) => {
    // Arbitrary scaling for visual purposes based on typical prop firm parameters
    const maxTypicalBuffer = 2500; 
    const pct = (left / maxTypicalBuffer) * 100;
    return Math.min(100, Math.max(0, pct));
  };

  const getBufferColor = (pct) => {
    if (pct > 50) return 'bg-emerald-500';
    if (pct > 20) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const dailyPct = calculateBufferPct(stats.dailyDrawdownLeft);
  const maxPct = calculateBufferPct(stats.maxDrawdownLeft);

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900/50 dark:md:bg-white/[0.03] rounded-2xl border border-neutral-200 dark:border-white/[0.06] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-5 h-5">
            <ThinkingOrb state="listening" size={18} />
          </div>
          <div>
            <h2 className="text-[0.7rem] font-semibold tracking-[0.15em] uppercase text-neutral-500 dark:text-neutral-400">
              LIVE PROP-FIRM PERFORMANCE
            </h2>
            <p className="text-[0.75rem] text-neutral-500 dark:text-neutral-500">
              $50K Instant Funded · Tradovate
            </p>
          </div>
        </div>
        <div className="text-[0.75rem] text-neutral-400 dark:text-neutral-500">
          {formatDate(stats.lastUpdated)}
        </div>
      </div>
      
      <div className="flex items-center gap-1 text-[0.65rem] text-neutral-400 dark:text-neutral-600 mb-6 uppercase tracking-wider">
        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"></path></svg>
        Verified source: Goat Funded Futures
      </div>

      {/* Primary P&L */}
      <div className="mt-6">
        <div className="text-xs uppercase tracking-wider text-neutral-500 mb-1">Net P&amp;L</div>
        <div className={`text-4xl md:text-5xl font-bold tracking-tight ${netPnL >= 0 ? 'text-neutral-900 dark:text-white' : 'text-red-500'}`}>
          {netPnL >= 0 ? '+' : '-'}${Math.abs(netPnL).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </div>
        <div className={`text-sm font-medium mt-2 ${netPnL >= 0 ? 'text-emerald-500 dark:text-emerald-400' : 'text-red-500'}`}>
          {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}% since starting balance
        </div>
      </div>

      {/* Metrics Row */}
      <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4 border border-neutral-200 dark:border-white/[0.04]">
          <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Net P&amp;L</div>
          <div className="text-lg font-semibold text-emerald-500 dark:text-emerald-400">
            {netPnL >= 0 ? '+' : '-'}${Math.abs(netPnL).toLocaleString()}
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4 border border-neutral-200 dark:border-white/[0.04]">
          <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Return</div>
          <div className="text-lg font-semibold text-emerald-500 dark:text-emerald-400">
            {returnPct >= 0 ? '+' : ''}{returnPct.toFixed(2)}%
          </div>
        </div>
        <div className="bg-white dark:bg-white/[0.02] rounded-xl p-4 border border-neutral-200 dark:border-white/[0.04]">
          <div className="text-xs text-neutral-500 mb-1 uppercase tracking-wider">Account Status</div>
          <div className="text-lg font-semibold text-emerald-500 dark:text-emerald-400 flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block"></span>
            {stats.status}
          </div>
        </div>
      </div>

      {/* Drawdown Buffers */}
      <div className="mt-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-500 w-36">Daily loss buffer</div>
          <div className="flex-1 h-2 bg-neutral-200 dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${getBufferColor(dailyPct)}`} 
              style={{ width: `${dailyPct}%` }}
            ></div>
          </div>
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-28 text-right">
            ${stats.dailyDrawdownLeft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="text-xs text-neutral-500 w-36">Max loss buffer</div>
          <div className="flex-1 h-2 bg-neutral-200 dark:bg-white/[0.04] rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-700 ${getBufferColor(maxPct)}`} 
              style={{ width: `${maxPct}%` }}
            ></div>
          </div>
          <div className="text-xs font-medium text-neutral-700 dark:text-neutral-300 w-28 text-right">
            ${stats.maxDrawdownLeft.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} left
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-neutral-200 dark:border-white/[0.06] text-right">
        <span className="text-[0.65rem] text-neutral-400 dark:text-neutral-600">
          Account ···{stats.accountName.slice(-4)}
        </span>
      </div>
    </div>
  );
};

export default PerformanceModule;
