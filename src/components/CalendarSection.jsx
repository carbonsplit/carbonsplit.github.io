import { useState, useEffect } from 'react';
import { EventManager } from './ui/event-manager';

export default function CalendarSection() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    let alive = true;
    fetch('./data/calendar.json')
      .then((res) => {
        if (!res.ok) throw new Error('no calendar');
        return res.json();
      })
      .then((data) => {
        if (!alive) return;
        const list = Array.isArray(data) ? data : data.events || [];
        setEvents(
          list.map((e) => ({
            ...e,
            startTime: new Date(e.startTime),
            endTime: new Date(e.endTime),
          })),
        );
      })
      .catch(() => {
        /* backend file not present — calendar renders empty */
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="w-full mt-12 pt-8 border-t border-black/[0.06] dark:border-white/[0.08] transition-colors duration-500">
      <EventManager events={events} readOnly defaultView="month" />
    </div>
  );
}
