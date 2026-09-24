/*
 * Carbon Stats — bookmarklet for copying account numbers off a prop-firm
 * dashboard you are already logged in to (you pass any login / Cloudflare
 * check yourself; this only reads what is on screen).
 *
 * 1. Finds values by nearby label text ("Balance", "Daily loss", ...).
 *    Loss "levels" are balance thresholds; amounts left = equity − level.
 * 2. Any field can be re-targeted with "Pick" → click the number on the page.
 *    Picks are remembered per site, so later runs are one click.
 * 3. Review/edit the numbers, then "Download stats.json".
 * 4. Calendar: reads the month currently shown in the dashboard calendar
 *    (day number + P&L per cell) → "Download calendar.json".
 *
 * Build with `npm run bookmarklet` (see build.mjs).
 */
(() => {
  const APP_ID = 'carbon-stats-panel';
  const PICKS_KEY = 'carbonStats.picks.v1';
  const EXTRAS_KEY = 'carbonStats.extras.v1';

  const existing = document.getElementById(APP_ID);
  if (existing) {
    existing.remove();
    return;
  }

  /* ---------- fields ---------- */

  // Read off the page. The two "levels" are account-balance thresholds
  // (e.g. daily loss level 50,537.36) — not amounts left.
  const FIELDS = [
    { key: 'currentBalance', label: 'Balance', match: [/^(current |account )?balance$/i] },
    { key: 'currentEquity', label: 'Equity', match: [/^(current )?equity$/i, /^net liq/i] },
    {
      key: 'startingBalance',
      label: 'Starting balance',
      match: [/^(starting|initial|start) balance/i, /^account size/i],
    },
    {
      key: 'dailyDrawdownLimit',
      label: 'Daily loss level',
      level: true,
      match: [/daily (loss|drawdown|dd)/i],
    },
    {
      key: 'maxDrawdownLimit',
      label: 'Max loss level',
      level: true,
      match: [
        /(max(imum)?|overall|total|trailing) (loss|drawdown|dd)/i,
        /(liquidation|drawdown|loss) (threshold|level|floor)/i,
        /trailing (threshold|floor|level)/i,
      ],
      exclude: /daily/i,
    },
  ];

  // Fixed rules + manual extras; remembered between runs
  const SETTINGS = [
    { key: 'dailyLossLimit', label: 'Daily loss limit', hint: 'resets daily', def: 1500 },
    { key: 'maxLossLimit', label: 'Max loss limit', hint: 'fixed', def: 2500 },
    { key: 'change30d', label: '30d change', hint: 'optional' },
    { key: 'dailyResetLabel', label: 'Daily reset', hint: 'reset time', def: '2:30 AM IST, daily', text: true },
  ];

  // Calculated as equity − level
  const COMPUTED = [
    { key: 'dailyDrawdownLeft', label: 'Daily loss left', level: 'dailyDrawdownLimit', limit: 'dailyLossLimit' },
    { key: 'maxDrawdownLeft', label: 'Max loss left', level: 'maxDrawdownLimit', limit: 'maxLossLimit' },
  ];

  /* ---------- storage ---------- */

  const load = (k) => {
    try {
      return JSON.parse(localStorage.getItem(k)) || {};
    } catch {
      return {};
    }
  };
  const save = (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch {
      /* storage blocked — picks just won't persist */
    }
  };

  /* ---------- number parsing ---------- */

  const MONEY =
    /\(?[-−–]?\s*\$\s*[-−–]?\s*\d[\d,]*(?:\.\d+)?\)?|[-−–]?\d{1,3}(?:,\d{3})+(?:\.\d+)?|[-−–]?\d+\.\d{1,2}(?!\d)/;

  const parseMoney = (s) => {
    if (!s) return null;
    const m = String(s).match(MONEY);
    if (!m) return null;
    const raw = m[0];
    const neg = /[-−–(]/.test(raw);
    const n = parseFloat(raw.replace(/[^\d.]/g, ''));
    if (!isFinite(n)) return null;
    return neg ? -n : n;
  };

  const esc = (v) =>
    String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

  const ownText = (el) => (el?.innerText ?? el?.textContent ?? '').trim();

  const isOurs = (el) => !!el?.closest?.(`#${APP_ID}`);

  /* ---------- find by label ---------- */

  function leafWithMoney(container, exclude) {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
    let best = null;
    for (let el = walker.currentNode; el; el = walker.nextNode()) {
      if (el === exclude || exclude?.contains(el) || isOurs(el)) continue;
      const t = ownText(el);
      if (t.length > 40 || !MONEY.test(t)) continue;
      // Prefer the deepest element that still holds the whole number
      // (split markup like <span>$52,007</span><span>.70</span> keeps the parent)
      if (!best) best = el;
      else if (best.contains(el) && parseMoney(t) === parseMoney(ownText(best))) best = el;
    }
    return best;
  }

  function findByLabel(patterns, exclude) {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.nodeValue.trim().replace(/[:\s]+$/, '');
      if (!text || text.length > 60) continue;
      if (!patterns.some((re) => re.test(text)) || exclude?.test(text)) continue;
      const labelEl = node.parentElement;
      if (!labelEl || isOurs(labelEl) || !labelEl.offsetParent) continue;

      // Walk up a few levels looking for a sibling value
      let box = labelEl;
      for (let depth = 0; depth < 4 && box; depth++, box = box.parentElement) {
        const el = leafWithMoney(box, labelEl);
        if (el) return el;
      }
    }
    return null;
  }

  /* ---------- picks (CSS path) ---------- */

  function cssPath(el) {
    const parts = [];
    for (; el && el.nodeType === 1 && el !== document.body; el = el.parentElement) {
      if (el.id && !/\d{3,}/.test(el.id)) {
        parts.unshift(`#${CSS.escape(el.id)}`);
        break;
      }
      let i = 1;
      for (let s = el.previousElementSibling; s; s = s.previousElementSibling) {
        if (s.tagName === el.tagName) i++;
      }
      parts.unshift(`${el.tagName.toLowerCase()}:nth-of-type(${i})`);
    }
    return parts.join(' > ');
  }

  const picks = load(PICKS_KEY);
  const settings = load(EXTRAS_KEY);

  // v1 stored the picked levels under the "left" keys — move them over
  for (const [from, to] of [
    ['dailyDrawdownLeft', 'dailyDrawdownLimit'],
    ['maxDrawdownLeft', 'maxDrawdownLimit'],
  ]) {
    if (picks[from]) {
      if (!picks[to]) picks[to] = picks[from];
      delete picks[from];
      save(PICKS_KEY, picks);
    }
  }

  function resolve(field) {
    const sel = picks[field.key];
    if (sel) {
      try {
        const el = document.querySelector(sel);
        const v = parseMoney(ownText(el));
        if (v != null) return { value: v, source: 'picked', el };
      } catch {
        /* stale selector — fall through */
      }
    }
    const el = findByLabel(field.match, field.exclude);
    const v = el ? parseMoney(ownText(el)) : null;
    return v != null ? { value: v, source: 'auto', el } : { value: null, source: 'missing' };
  }

  /* ---------- UI ---------- */

  const host = document.createElement('div');
  host.id = APP_ID;
  host.style.cssText = 'position:fixed;top:16px;right:16px;z-index:2147483647;';
  const root = host.attachShadow({ mode: 'open' });
  document.documentElement.appendChild(host);

  root.innerHTML = `
    <style>
      :host { all: initial; }
      * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
      .panel { width: 360px; max-height: calc(100vh - 32px); overflow: auto; background: #1c1c1e; color: #eeece8;
        border: 1px solid rgba(255,255,255,.08); border-radius: 20px; padding: 18px; box-shadow: 0 20px 60px rgba(0,0,0,.45); font-size: 13px; }
      header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px; }
      h1 { font-size: 15px; font-weight: 600; margin: 0; }
      .sub { color: #8e8e93; font-size: 12px; margin: 0 0 14px; line-height: 1.45; }
      .row { display: grid; grid-template-columns: 1fr 118px 46px; gap: 6px; align-items: center; padding: 5px 0; }
      .row label { color: #c7c5c0; }
      .tag { display: block; font-size: 10.5px; margin-top: 2px; color: #6e6e73; }
      .tag.auto { color: #58d65b; } .tag.picked { color: #8ab4ff; } .tag.missing { color: #ff6b61; } .tag.derived { color: #f3e03b; } .tag.calc { color: #c7c5c0; } .tag.check { color: #ff6b61; }
      input[readonly] { background: transparent; border-color: rgba(255,255,255,.08); color: #eeece8; }
      h2 { font-size: 11px; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; color: #6e6e73; margin: 4px 0 2px; }
      input { width: 100%; background: #2a2a2c; color: #fff; border: 1px solid transparent; border-radius: 8px; padding: 7px 8px;
        font-size: 13px; font-variant-numeric: tabular-nums; outline: none; }
      input:focus { border-color: rgba(255,255,255,.25); }
      button { background: #2a2a2c; color: #eeece8; border: 0; border-radius: 8px; padding: 7px 0; font-size: 12px; cursor: pointer; }
      button:hover { background: #3a3a3c; }
      .x { width: 28px; height: 28px; padding: 0; border-radius: 50%; font-size: 15px; }
      hr { border: 0; border-top: 1px solid rgba(255,255,255,.07); margin: 10px 0; }
      .actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 14px; }
      .primary { background: #eeece8; color: #1c1c1e; font-weight: 600; padding: 10px 0; }
      .primary:hover { background: #fff; }
      .ghost { padding: 10px 0; }
      .status { min-height: 16px; margin-top: 10px; color: #8e8e93; font-size: 12px; }
      .cal-row { display: grid; grid-template-columns: 1fr 118px 46px; gap: 6px; align-items: center; padding: 5px 0; }
      .cal-row label { color: #c7c5c0; }
      input[type=month] { color-scheme: dark; }
      .cal-sum { color: #c7c5c0; margin: 6px 0; font-size: 12.5px; }
      .cal-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 4px; max-height: 128px; overflow: auto; }
      .cal-day { background: #2a2a2c; border-radius: 6px; padding: 5px 7px; font-size: 11.5px; display: flex; justify-content: space-between; font-variant-numeric: tabular-nums; }
      .cal-day .d { color: #8e8e93; } .pos { color: #58d65b; } .neg { color: #ff6b61; }
      .reset { background: none; color: #6e6e73; padding: 0; font-size: 11.5px; text-decoration: underline; margin-top: 6px; }
    </style>
    <div class="panel" role="dialog" aria-label="Carbon stats export">
      <header><h1>Carbon Stats</h1><button class="x" data-act="close" aria-label="Close">×</button></header>
      <p class="sub">Check the numbers, fix any with <b>Pick</b> (then click the value on the page), then download.</p>
      <h2>From the page</h2>
      <div id="fields"></div>
      <hr />
      <h2>Calculated</h2>
      <div id="computed"></div>
      <hr />
      <h2>Rules</h2>
      <div id="extras"></div>
      <div class="actions">
        <button class="ghost" data-act="copy">Copy JSON</button>
        <button class="primary" data-act="download">Download stats.json</button>
      </div>
      <hr />
      <h2>Calendar</h2>
      <div class="cal-row">
        <label>Month<span class="tag" id="calTag"></span></label>
        <input type="month" id="calMonth" />
        <button data-act="pick-cal" title="Click the calendar on the page">Pick</button>
      </div>
      <div class="cal-sum" id="calSum"></div>
      <div class="cal-list" id="calList"></div>
      <div class="actions">
        <button class="ghost" data-act="cal-rescan">Rescan</button>
        <button class="primary" data-act="cal-download">Download calendar.json</button>
      </div>
      <div class="status" id="status"></div>
      <button class="reset" data-act="reset">Forget picks for this site</button>
    </div>`;

  const $ = (s) => root.querySelector(s);
  const status = (msg) => ($('#status').textContent = msg);

  const state = {};

  const TAGS = {
    auto: 'found',
    picked: 'picked',
    derived: 'converted',
    calc: 'equity − level',
    check: 'check: below zero',
  };

  function renderRow(container, f, value, source, mode) {
    const row = document.createElement('div');
    row.className = 'row';
    const tag =
      source === 'missing' ? f.hint || 'not found' : source === 'manual' ? f.hint || '' : TAGS[source];
    const attrs = [
      `data-key="${f.key}"`,
      f.text ? '' : 'inputmode="decimal"',
      mode === 'computed' ? 'readonly tabindex="-1"' : '',
    ].join(' ');
    row.innerHTML = `
      <label>${f.label}<span class="tag ${source}">${esc(tag)}</span></label>
      <input ${attrs} value="${esc(value)}" />
      ${mode === 'pick' ? `<button data-pick="${f.key}">Pick</button>` : '<span></span>'}`;
    container.appendChild(row);
  }

  const num = (key) => {
    const raw = root.querySelector(`input[data-key="${key}"]`)?.value.trim();
    if (!raw) return null;
    const n = parseMoney(raw) ?? parseFloat(raw);
    return isFinite(n) ? n : null;
  };
  const round2 = (n) => Math.round(n * 100) / 100;

  // "Left" amounts follow whatever is currently in the inputs
  function recompute() {
    const equity = num('currentEquity') ?? num('currentBalance');
    for (const c of COMPUTED) {
      const level = num(c.level);
      const limit = num(c.limit);
      const inp = root.querySelector(`input[data-key="${c.key}"]`);
      const tag = inp.closest('.row').querySelector('.tag');
      if (equity == null || level == null) {
        inp.value = '';
        tag.className = 'tag missing';
        tag.textContent = 'needs equity + level';
        continue;
      }
      const left = round2(equity - level);
      // Above the limit is normal after a profitable day; only a negative amount is suspicious
      const bad = left < 0;
      const above = !bad && limit != null && left > limit;
      inp.value = left;
      tag.className = `tag ${bad ? 'check' : 'calc'}`;
      tag.textContent = bad ? TAGS.check : above ? 'above limit (profit)' : TAGS.calc;
    }
  }

  function render() {
    for (const f of FIELDS) {
      const r = resolve(f);
      state[f.key] = { value: r.value, source: r.source };
    }

    const v = (k) => state[k].value;
    if (v('currentEquity') == null && v('currentBalance') != null) {
      state.currentEquity = { value: v('currentBalance'), source: 'derived' };
    }
    if (v('currentBalance') == null && v('currentEquity') != null) {
      state.currentBalance = { value: v('currentEquity'), source: 'derived' };
    }

    // A "level" that is tiny next to equity is really an amount left — convert it
    const equity = v('currentEquity');
    for (const f of FIELDS) {
      if (!f.level || v(f.key) == null || equity == null) continue;
      if (Math.abs(v(f.key)) < equity / 2) {
        state[f.key] = { value: round2(equity - Math.abs(v(f.key))), source: 'derived' };
      }
    }

    const fieldsEl = $('#fields');
    fieldsEl.innerHTML = '';
    for (const f of FIELDS) renderRow(fieldsEl, f, v(f.key), state[f.key].source, 'pick');

    const computedEl = $('#computed');
    computedEl.innerHTML = '';
    for (const c of COMPUTED) renderRow(computedEl, c, '', 'calc', 'computed');

    const extrasEl = $('#extras');
    extrasEl.innerHTML = '';
    for (const f of SETTINGS) renderRow(extrasEl, f, settings[f.key] ?? f.def ?? '', 'manual', 'setting');

    recompute();
    const found = FIELDS.filter((f) => state[f.key].value != null).length;
    status(`${found}/${FIELDS.length} page values filled.`);
  }

  root.addEventListener('input', recompute);

  function collect() {
    recompute();
    const out = {};
    root.querySelectorAll('input[data-key]').forEach((inp) => {
      const key = inp.dataset.key;
      const raw = inp.value.trim();
      if (!raw) return;
      if (SETTINGS.find((e) => e.key === key)?.text) out[key] = raw;
      else {
        const n = parseMoney(raw) ?? parseFloat(raw);
        if (isFinite(n)) out[key] = n;
      }
    });
    // Remember rules / extras for next time
    const keep = {};
    for (const e of SETTINGS) if (out[e.key] != null) keep[e.key] = out[e.key];
    save(EXTRAS_KEY, keep);

    out.lastUpdated = new Date().toISOString();
    out.source = location.hostname;
    return out;
  }

  /* ---------- calendar ---------- */

  const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  const MONTH_RE =
    /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|june?|july?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\.?,?\s+(\d{4})\b/i;
  const CAL_PICK = '__calendar';

  const lines = (el) =>
    (el.innerText || '')
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);

  const isReddish = (el) => {
    const m = getComputedStyle(el).color.match(/\d+(\.\d+)?/g);
    if (!m) return false;
    const [r, g, b] = m.map(Number);
    return r > g + 50 && r > b + 50;
  };

  // Checks whole elements (not single text nodes) so split markup like
  // <button><span>September</span> <span>2026</span></button> still matches,
  // plus form values / aria-labels for header controls.
  function monthIn(where) {
    const candidates = [where, ...where.querySelectorAll('*')];
    for (const el of candidates) {
      if (isOurs(el) || !el.offsetParent) continue;
      if ((el.textContent || '').length > 60 && !el.matches('input,select')) continue;
      const texts = [
        el.innerText,
        el.value,
        el.matches('select') ? el.selectedOptions?.[0]?.text : '',
        el.getAttribute('aria-label'),
      ];
      for (const t of texts) {
        const m = String(t || '').replace(/\s+/g, ' ').trim().match(MONTH_RE);
        if (m) return { y: +m[2], m: MONTHS.indexOf(m[1].slice(0, 3).toLowerCase()) };
      }
    }
    return null;
  }

  // Month/year label closest to the calendar grid ("September 2026") — walk out
  // from the first day cell so unrelated dates elsewhere ("Joined Jan 2026") lose
  function detectMonth(scope, cells) {
    for (let box = cells[0]?.el; box && box !== document.documentElement; box = box.parentElement) {
      const found = monthIn(box);
      if (found) return found;
    }
    return monthIn(scope) || monthIn(document.body);
  }

  // Cells = smallest elements holding a day number (1–31) on its own line plus a P&L
  function scanCells(scope) {
    const found = [];
    const walker = document.createTreeWalker(scope, NodeFilter.SHOW_ELEMENT);
    for (let el = walker.nextNode(); el; el = walker.nextNode()) {
      if ((el.textContent || '').length > 200 || isOurs(el) || !el.offsetParent) continue;
      const text = el.innerText || '';
      if (text.length > 90) continue;
      const ls = lines(el);
      if (ls.length < 2 || ls.length > 6) continue;
      const dayLine = ls.find((l) => /^\d{1,2}$/.test(l) && +l >= 1 && +l <= 31);
      const moneyLine = ls.find((l) => l !== dayLine && !/%/.test(l) && MONEY.test(l));
      if (!dayLine || !moneyLine) continue;
      found.push({ el, day: +dayLine, moneyLine, loss: /loss/i.test(text) });
    }
    // keep only the innermost candidates
    return found.filter((c) => !found.some((o) => o !== c && c.el.contains(o.el)));
  }

  let calState = { events: [], month: null, source: 'missing' };

  function scanCalendar() {
    let scope = document.body;
    let source = 'auto';
    if (picks[CAL_PICK]) {
      try {
        const el = document.querySelector(picks[CAL_PICK]);
        if (el) {
          scope = el;
          source = 'picked';
        }
      } catch {
        /* stale — use whole page */
      }
    }

    const cells = scanCells(scope);
    const monthInput = $('#calMonth');
    let ym = null;
    if (monthInput.dataset.manual && monthInput.value) {
      const [y, m] = monthInput.value.split('-').map(Number);
      ym = { y, m: m - 1 };
    } else {
      ym = detectMonth(scope, cells);
      if (ym) monthInput.value = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}`;
    }

    // Leading/trailing cells from neighbouring months: a drop in day number = next month
    const wraps = cells.filter((c, i) => i > 0 && c.day < cells[i - 1].day).length;
    let offset = wraps >= 2 || (wraps === 1 && cells[0]?.day > 15) ? -1 : 0;

    const events = [];
    cells.forEach((c, i) => {
      if (i > 0 && c.day < cells[i - 1].day) offset++;
      if (offset !== 0 || !ym) return; // only the displayed month
      let pnl = parseMoney(c.moneyLine);
      if (pnl == null) return;
      if (pnl > 0 && !/[+]/.test(c.moneyLine)) {
        const moneyEl = [...c.el.querySelectorAll('*')].find((e) => (e.innerText || '').trim() === c.moneyLine) || c.el;
        if (c.loss || isReddish(moneyEl)) pnl = -pnl;
      }
      const date = `${ym.y}-${String(ym.m + 1).padStart(2, '0')}-${String(c.day).padStart(2, '0')}`;
      if (events.some((e) => e.date === date)) return;
      events.push({ date, pnl: Math.round(pnl * 100) / 100 });
    });

    calState = { events, month: ym, source: events.length ? source : 'missing' };
    renderCalendar();
  }

  function renderCalendar() {
    const { events, month, source } = calState;
    const tag = $('#calTag');
    tag.className = `tag ${source}`;
    tag.textContent = { auto: 'found', picked: 'picked', missing: 'not found' }[source];

    const net = events.reduce((a, e) => a + e.pnl, 0);
    const money = (n) => `${n >= 0 ? '+' : '−'}$${Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    $('#calSum').innerHTML = !month
      ? 'Month not detected — set it above.'
      : events.length
        ? `${events.length} trading day${events.length === 1 ? '' : 's'} · net <span class="${net >= 0 ? 'pos' : 'neg'}">${money(net)}</span>`
        : 'No P&L days found. Open the calendar on the page, or Pick it.';

    $('#calList').innerHTML = events
      .map(
        (e) =>
          `<div class="cal-day"><span class="d">${+e.date.slice(8)}</span><span class="${e.pnl >= 0 ? 'pos' : 'neg'}">${money(e.pnl)}</span></div>`
      )
      .join('');
  }

  function calendarJSON() {
    const { events, month } = calState;
    return {
      month: month ? `${month.y}-${String(month.m + 1).padStart(2, '0')}` : null,
      capturedAt: new Date().toISOString(),
      source: location.hostname,
      events: events.map((e) => ({
        id: `gff-${e.date}`,
        title: e.pnl >= 0 ? `Profit +$${e.pnl.toFixed(2)}` : `Loss -$${Math.abs(e.pnl).toFixed(2)}`,
        startTime: `${e.date}T00:00:00Z`,
        endTime: `${e.date}T23:59:59Z`,
        color: e.pnl >= 0 ? 'green' : 'red',
        category: 'Trading',
        pnl: e.pnl,
      })),
    };
  }

  function downloadJSON(name, data) {
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  root.addEventListener('change', (e) => {
    if (e.target.id === 'calMonth') {
      e.target.dataset.manual = '1';
      scanCalendar();
    }
  });

  /* ---------- pick mode ---------- */

  let picking = null;
  const hl = document.createElement('div');
  hl.style.cssText =
    'position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #8ab4ff;border-radius:6px;background:rgba(138,180,255,.12);transition:all .06s;display:none;';
  document.documentElement.appendChild(hl);

  function onMove(e) {
    const el = e.target;
    if (isOurs(el) || el === host) return (hl.style.display = 'none');
    const r = el.getBoundingClientRect();
    Object.assign(hl.style, {
      display: 'block',
      left: `${r.left - 2}px`,
      top: `${r.top - 2}px`,
      width: `${r.width + 4}px`,
      height: `${r.height + 4}px`,
    });
  }

  function onClick(e) {
    if (e.composedPath().includes(host)) return;
    e.preventDefault();
    e.stopPropagation();
    const el = e.target;
    if (picking === CAL_PICK) {
      // choose the smallest ancestor that contains several day cells
      let box = el;
      while (box && box !== document.body && scanCells(box).length < 2) box = box.parentElement;
      if (!box || box === document.body) {
        status('No calendar days found there — click inside the calendar grid.');
        return;
      }
      picks[CAL_PICK] = cssPath(box);
      save(PICKS_KEY, picks);
      stopPicking();
      scanCalendar();
      status('Calendar picked. Remembered for next time.');
      return;
    }
    const v = parseMoney(ownText(el));
    if (v == null) {
      status('That element has no number in it — try clicking right on the value.');
      return;
    }
    picks[picking] = cssPath(el);
    save(PICKS_KEY, picks);
    const label = FIELDS.find((f) => f.key === picking)?.label;
    stopPicking();
    render();
    status(`${label} set to ${v}. Remembered for next time.`);
  }

  function onKey(e) {
    if (e.key === 'Escape') {
      stopPicking();
      status('Pick cancelled.');
    }
  }

  function startPicking(key) {
    picking = key;
    document.addEventListener('mousemove', onMove, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('keydown', onKey, true);
    status(
      key === CAL_PICK
        ? 'Click anywhere inside the calendar grid (Esc to cancel).'
        : `Click the "${FIELDS.find((f) => f.key === key).label}" number on the page (Esc to cancel).`
    );
  }

  function stopPicking() {
    picking = null;
    hl.style.display = 'none';
    document.removeEventListener('mousemove', onMove, true);
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('keydown', onKey, true);
  }

  /* ---------- actions ---------- */

  root.addEventListener('click', async (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.dataset.pick) return startPicking(btn.dataset.pick);

    switch (btn.dataset.act) {
      case 'close':
        stopPicking();
        hl.remove();
        host.remove();
        break;
      case 'reset':
        for (const k of Object.keys(picks)) delete picks[k];
        save(PICKS_KEY, {});
        render();
        scanCalendar();
        status('Picks cleared.');
        break;
      case 'copy': {
        const json = JSON.stringify(collect(), null, 2);
        try {
          await navigator.clipboard.writeText(json);
          status('Copied to clipboard.');
        } catch {
          status('Clipboard blocked — use Download instead.');
        }
        break;
      }
      case 'download':
        downloadJSON('carbon-stats.json', collect());
        status('Saved carbon-stats.json — now run: npm run import-stats');
        break;
      case 'pick-cal':
        startPicking(CAL_PICK);
        break;
      case 'cal-rescan':
        delete $('#calMonth').dataset.manual;
        scanCalendar();
        status('Calendar rescanned.');
        break;
      case 'cal-download':
        if (!calState.events.length || !calState.month) {
          status('Nothing to download — no calendar days found.');
          break;
        }
        downloadJSON('carbon-calendar.json', calendarJSON());
        status('Saved carbon-calendar.json — now run: npm run import-calendar');
        break;
    }
  });

  render();
  scanCalendar();
})();
