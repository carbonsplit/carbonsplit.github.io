import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rollingCalendarChange, canUseSnapshotForCalendarPercent } from '../src/lib/tradingStats.js';

const events = JSON.parse(readFileSync(new URL('../public/data/calendar.json', import.meta.url), 'utf8')).events;

test('30d change follows latest calendar trade rather than the stale account snapshot', () => {
  const { change, through } = rollingCalendarChange(events, new Date('2026-11-04T09:07:36Z'));
  assert.equal(through.toISOString(), '2026-11-18T23:59:59.000Z');
  assert.equal(change, 17);
});

test('account snapshot after the latest trade anchors the rolling window instead', () => {
  const { change, through } = rollingCalendarChange(events, new Date('2026-12-31T00:00:00Z'));
  assert.equal(through.toISOString(), '2026-12-31T00:00:00.000Z');
  assert.equal(change, 0);
});

test('a stale account snapshot cannot justify a current calendar percentage', () => {
  assert.equal(canUseSnapshotForCalendarPercent(new Date('2026-11-18T23:59:59Z'), new Date('2026-11-04T09:07:36Z')), false);
  assert.equal(canUseSnapshotForCalendarPercent(new Date('2026-11-18T23:59:59Z'), new Date('2026-11-19T00:00:00Z')), true);
  assert.equal(canUseSnapshotForCalendarPercent(new Date('2026-11-18T23:59:59Z'), null), false);
});
