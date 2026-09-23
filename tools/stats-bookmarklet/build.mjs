// Builds the Carbon Stats bookmarklet.
//   npm run bookmarklet
// Outputs tools/stats-bookmarklet/dist/{bookmarklet.txt,install.html}
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(here, 'carbon-stats.js'), 'utf8');

let code = src;
try {
  const { minifySync } = await import('rolldown/experimental');
  code = minifySync('carbon-stats.js', src).code;
} catch (err) {
  console.warn('Minifier unavailable, using unminified source:', err.message);
}

const bookmarklet = `javascript:${encodeURIComponent(code.trim())}`;
const dist = join(here, 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'bookmarklet.txt'), bookmarklet);

const html = `<!doctype html>
<meta charset="utf-8" />
<title>Install Carbon Stats</title>
<style>
  body { font: 15px/1.6 system-ui, sans-serif; max-width: 620px; margin: 64px auto; padding: 0 20px; color: #1c1c1e; background: #fafafa; }
  a.bm { display: inline-block; padding: 12px 22px; border-radius: 999px; background: #1c1c1e; color: #fff; text-decoration: none; font-weight: 600; }
  code { background: #ecebe7; padding: 2px 6px; border-radius: 6px; }
  ol li { margin: 6px 0; }
</style>
<h1>Carbon Stats bookmarklet</h1>
<p>Drag this button onto your bookmarks bar:</p>
<p><a class="bm" href="${bookmarklet.replace(/"/g, '&quot;')}">Carbon Stats</a></p>
<ol>
  <li>Log in to your prop-firm dashboard as usual.</li>
  <li>Click <b>Carbon Stats</b> in your bookmarks bar. A panel opens top-right.</li>
  <li>Check each number. If one is wrong or missing, press <b>Pick</b> and click the value on the page — it's remembered next time.</li>
  <li>Press <b>Download stats.json</b>, then in the site folder run <code>npm run import-stats</code>.</li>
  <li>Calendar: open the month on the dashboard calendar, check the days listed under <b>Calendar</b> in the panel, press <b>Download calendar.json</b>, then run <code>npm run import-calendar</code>. Repeat per month — other months are kept.</li>
</ol>
<p>Clicking the bookmark again closes the panel. If your browser blocks bookmarklets on that site, paste the contents of <code>carbon-stats.js</code> into the DevTools console instead.</p>
`;
writeFileSync(join(dist, 'install.html'), html);

console.log(`Bookmarklet: ${bookmarklet.length.toLocaleString()} chars`);
console.log(`Open ${join(dist, 'install.html')} and drag the button to your bookmarks bar.`);
