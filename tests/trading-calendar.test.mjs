import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const load = (path) => JSON.parse(readFileSync(new URL(path, import.meta.url), 'utf8')).events;

test('November 2026 trading entries are in both source and served calendars', () => {
  const source = load('../data/calendar.json');
  const served = load('../public/data/calendar.json');
  assert.deepEqual(source, served);
  const expected = { '2026-11-06': -312, '2026-11-10': 596, '2026-11-18': -344 };
  for (const [date, pnl] of Object.entries(expected)) {
    const entries = served.filter((e) => e.startTime.slice(0, 10) === date);
    assert.equal(entries.length, 1, `exactly one entry on ${date}`);
    assert.equal(entries[0].pnl, pnl);
    assert.equal(entries[0].color, pnl < 0 ? 'red' : 'green');
    assert.equal(entries[0].title, `${pnl < 0 ? 'Loss' : 'Profit'} ${pnl < 0 ? '-' : '+'}$${Math.abs(pnl).toFixed(2)}`);
  }
  assert.equal(served.filter((e) => e.startTime.startsWith('2026-11')).reduce((sum, e) => sum + e.pnl, 0), -390);
});
