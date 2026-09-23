// Imports files saved by the Carbon Stats bookmarklet into public/data/.
//   npm run import-stats                 newest carbon-stats*.json (Downloads or dist/)→ stats.json (merge)
//   npm run import-calendar              newest carbon-calendar*.json (Downloads or dist/) → calendar.json
//   node tools/stats-bookmarklet/import.mjs <stats|calendar> <file>   explicit file
//
// Calendar imports replace every event in the imported month and keep other months.
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const dataDir = resolve(here, '../../public/data');

const [kind = 'stats', explicit] = process.argv.slice(2);
if (!['stats', 'calendar'].includes(kind)) {
  console.error('Usage: import.mjs <stats|calendar> [file]');
  process.exit(1);
}

// Looks in ~/Downloads and this tool's dist/ folder; newest file wins
const SEARCH_DIRS = [join(homedir(), 'Downloads'), join(here, 'dist')];

function newestDownload(prefix) {
  const re = new RegExp(`^${prefix}.*\\.json$`, 'i');
  const files = SEARCH_DIRS.filter((dir) => existsSync(dir))
    .flatMap((dir) => readdirSync(dir).filter((f) => re.test(f)).map((f) => join(dir, f)))
    .map((f) => ({ f, t: statSync(f).mtimeMs }))
    .sort((a, b) => b.t - a.t);
  if (!files.length) throw new Error(`No ${prefix}*.json found in ${SEARCH_DIRS.join(' or ')}`);
  return files[0].f;
}

const readJSON = (f, fallback) => (existsSync(f) ? JSON.parse(readFileSync(f, 'utf8')) : fallback);
const writeJSON = (f, data) => writeFileSync(f, `${JSON.stringify(data, null, 2)}\n`);

/* ---------- stats ---------- */

function importStats(input) {
  const target = join(dataDir, 'stats.json');
  const incoming = readJSON(input);

  const NUMERIC = [
    'currentBalance',
    'currentEquity',
    'startingBalance',
    'dailyDrawdownLeft',
    'dailyDrawdownLimit',
    'dailyLossLimit',
    'maxDrawdownLeft',
    'maxLossLimit',
    'maxDrawdownLimit',
    'change30d',
  ];
  for (const k of NUMERIC) {
    if (k in incoming && typeof incoming[k] !== 'number') {
      throw new Error(`${k} should be a number, got ${JSON.stringify(incoming[k])}`);
    }
  }

  const current = readJSON(target, {});
  const merged = { ...current, ...incoming };

  console.log(`From ${input}\n`);
  for (const k of Object.keys(merged)) {
    if (current[k] === merged[k]) continue;
    console.log(`  ${k.padEnd(18)} ${String(current[k] ?? '—').padStart(22)}  →  ${merged[k]}`);
  }
  writeJSON(target, merged);
  console.log(`\nUpdated ${target}`);
}

/* ---------- calendar ---------- */

function importCalendar(input) {
  const target = join(dataDir, 'calendar.json');
  const incoming = readJSON(input);
  const month = incoming.month;
  if (!/^\d{4}-\d{2}$/.test(month || '') || !Array.isArray(incoming.events)) {
    throw new Error('Not a carbon-calendar file (needs "month" and "events").');
  }
  for (const e of incoming.events) {
    if (!e.startTime?.startsWith(month) || typeof e.pnl !== 'number') {
      throw new Error(`Bad event: ${JSON.stringify(e)}`);
    }
  }

  const current = readJSON(target, { events: [] });
  const list = Array.isArray(current) ? current : current.events || [];
  const kept = list.filter((e) => !String(e.startTime).startsWith(month));
  const replaced = list.length - kept.length;
  const events = [...kept, ...incoming.events].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const net = incoming.events.reduce((a, e) => a + e.pnl, 0);
  console.log(`From ${input}\n`);
  console.log(`  ${month}: ${incoming.events.length} trading days (replacing ${replaced}), net ${net >= 0 ? '+' : '-'}$${Math.abs(net).toFixed(2)}`);
  for (const e of incoming.events) console.log(`    ${e.startTime.slice(0, 10)}  ${e.title}`);

  writeJSON(target, Array.isArray(current) ? events : { ...current, events });
  console.log(`\nUpdated ${target}`);
}

const input = explicit ? resolve(explicit) : newestDownload(kind === 'stats' ? 'carbon-stats' : 'carbon-calendar');
(kind === 'stats' ? importStats : importCalendar)(input);
