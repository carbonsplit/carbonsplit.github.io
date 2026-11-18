const DAY_MS = 24 * 60 * 60 * 1000;

function eventPnl(event) {
  if (typeof event.pnl === 'number') return event.pnl;
  const match = String(event.title || '').match(/([+-])\$([\d,]+(?:\.\d+)?)/);
  return match ? (match[1] === '-' ? -1 : 1) * Number(match[2].replace(/,/g, '')) : 0;
}

// Calendar changes are measured through the latest recorded trading day,
// independently of the timestamp on a separately imported account snapshot.
export function rollingCalendarChange(events, snapshotDate) {
  const snapshot = snapshotDate instanceof Date && !Number.isNaN(snapshotDate.getTime())
    ? snapshotDate.getTime() : 0;
  const latestEvent = events.reduce((latest, event) => {
    const time = new Date(event.endTime || event.startTime).getTime();
    return Number.isFinite(time) ? Math.max(latest, time) : latest;
  }, 0);
  const end = Math.max(snapshot, latestEvent);
  if (!end) return { change: 0, through: null };
  const cents = events.reduce((sum, event) => {
    const time = new Date(event.startTime).getTime();
    return time > end - 30 * DAY_MS && time <= end
      ? sum + Math.round(eventPnl(event) * 100) : sum;
  }, 0);
  return { change: cents / 100, through: new Date(end) };
}

export function canUseSnapshotForCalendarPercent(calendarThrough, snapshotDate) {
  return calendarThrough instanceof Date && !Number.isNaN(calendarThrough.getTime())
    && snapshotDate instanceof Date && !Number.isNaN(snapshotDate.getTime())
    && snapshotDate.getTime() >= calendarThrough.getTime();
}
