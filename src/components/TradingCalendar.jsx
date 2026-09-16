import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function TradingCalendar({ events = [] }) {
  // Normalize events and map by YYYY-MM-DD
  const { eventMap, defaultMonth } = useMemo(() => {
    const map = {};
    let latestDate = null;

    events.forEach((ev) => {
      const d = ev.startTime instanceof Date ? ev.startTime : new Date(ev.startTime);
      if (isNaN(d.getTime())) return;
      const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(ev);

      if (!latestDate || d > latestDate) {
        latestDate = d;
      }
    });

    return {
      eventMap: map,
      defaultMonth: latestDate ? new Date(latestDate.getUTCFullYear(), latestDate.getUTCMonth(), 1) : new Date(),
    };
  }, [events]);

  const [currentDate, setCurrentDate] = useState(() => defaultMonth);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  };
  const resetToLatest = () => {
    setCurrentDate(new Date(defaultMonth.getFullYear(), defaultMonth.getMonth(), 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Leading days from previous month
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        day: daysInPrevMonth - i,
        isCurrentMonth: false,
        dateKey: null,
      });
    }

    // Days of current month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        day,
        isCurrentMonth: true,
        dateKey,
        events: eventMap[dateKey] || [],
      });
    }

    // Trailing days from next month to fill grid
    const totalSlots = Math.ceil(days.length / 7) * 7;
    let nextMonthDay = 1;
    while (days.length < totalSlots) {
      days.push({
        day: nextMonthDay++,
        isCurrentMonth: false,
        dateKey: null,
      });
    }

    return days;
  }, [year, month, eventMap]);

  // Month stats calculation
  const monthStats = useMemo(() => {
    let totalPnl = 0;
    let profitDays = 0;
    let lossDays = 0;

    calendarDays.forEach((slot) => {
      if (!slot.isCurrentMonth || !slot.events) return;
      slot.events.forEach((ev) => {
        const isLoss = ev.color === 'red' || (ev.title && ev.title.toLowerCase().includes('loss')) || (ev.title && ev.title.includes('-'));
        const match = ev.title?.match(/([+-])\$([\d,]+(?:\.\d+)?)/);
        const amount = match ? parseFloat(match[2].replace(/,/g, '')) * (match[1] === '-' ? -1 : 1) : 0;
        totalPnl += amount;
        if (isLoss) lossDays++;
        else profitDays++;
      });
    });

    return { totalPnl, profitDays, lossDays };
  }, [calendarDays]);

  const monthLabel = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h3 className="text-[1.1rem] font-semibold text-neutral-900 dark:text-white tracking-tight">
            {monthLabel}
          </h3>
          {(monthStats.profitDays > 0 || monthStats.lossDays > 0) && (
            <span
              className={`text-[0.75rem] font-medium px-2 py-0.5 rounded ${
                monthStats.totalPnl >= 0
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                  : 'bg-[#f0e8fa] dark:bg-[#231d2e] text-[#6b21a8] dark:text-[#c7b7df]'
              }`}
            >
              {monthStats.totalPnl >= 0 ? '+' : '-'}${Math.abs(monthStats.totalPnl).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={resetToLatest}
            type="button"
            className="px-2.5 py-1 text-[0.75rem] font-medium rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            Today
          </button>
          <button
            onClick={prevMonth}
            aria-label="Previous month"
            type="button"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            aria-label="Next month"
            type="button"
            className="p-1.5 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-black/[0.01] dark:bg-white/[0.02] overflow-hidden transition-colors duration-500">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-black/[0.06] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2.5 text-center text-[0.72rem] font-medium uppercase tracking-wider text-neutral-400 dark:text-neutral-500"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-black/[0.05] dark:divide-white/[0.05]">
          {calendarDays.map((slot, index) => {
            return (
              <div
                key={index}
                className={`min-h-[72px] sm:min-h-[82px] p-2 flex flex-col justify-between transition-colors ${
                  slot.isCurrentMonth
                    ? 'bg-transparent hover:bg-black/[0.015] dark:hover:bg-white/[0.02]'
                    : 'bg-black/[0.01] dark:bg-white/[0.01] opacity-35'
                }`}
              >
                {/* Day number */}
                <div className="text-right">
                  <span
                    className={`text-[0.75rem] font-medium ${
                      slot.isCurrentMonth
                        ? 'text-neutral-700 dark:text-neutral-300'
                        : 'text-neutral-400 dark:text-neutral-600'
                    }`}
                  >
                    {slot.day}
                  </span>
                </div>

                {/* Day event / PnL badge */}
                <div className="flex flex-col gap-1 mt-1">
                  {slot.events?.map((ev, evIdx) => {
                    const isLoss =
                      ev.color === 'red' ||
                      (ev.title && ev.title.toLowerCase().includes('loss')) ||
                      (ev.title && ev.title.includes('-'));

                    // Extract the amount or short title (e.g. "+$193.80")
                    const match = ev.title?.match(/([+-]\$[\d,]+(?:\.\d+)?)/);
                    const displayLabel = match ? match[1] : ev.title;

                    return (
                      <div
                        key={evIdx}
                        title={ev.title}
                        className={`text-[0.72rem] font-semibold py-1 px-1.5 rounded-[4px] text-center tracking-tight truncate border ${
                          isLoss
                            ? 'bg-[#f0e8fa] dark:bg-[#231d2e] text-[#6b21a8] dark:text-[#c7b7df] border-[#6b21a8]/15 dark:border-[#c7b7df]/20'
                            : 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                        }`}
                      >
                        {displayLabel}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
