#!/usr/bin/env node
/* Audit every public page with Lighthouse and print a score table.
   Usage: node scripts/lighthouse.mjs [--url <base>] [--runs N] [--min S]
                                      [--form mobile|desktop|both] [--page <slug>]
   Defaults: http://localhost:8787 (`npm run dev`), one run, a minimum of
   98, both form factors, every page in site/ (listPages(): slug = URL
   path with "/" as "-", "home" for the root; the 404 is skipped).
   --runs N scores each page by the median of N runs (absorbs runner
   noise; the per-run scores print when they differ, and the saved report
   is the run at the performance median); --min S fails the process when
   any median lands below S, and --min 0 only reports. CI runs it against
   `wrangler dev` with --runs 3. A page that shows nothing (isEmptyPage():
   `<body>` holds nothing but whitespace and comments) paints no content,
   so Lighthouse cannot score it: its row reads "empty page" and it is
   not run. */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import lighthouse, { desktopConfig } from 'lighthouse';
import { launch } from 'chrome-launcher';
import { isEmptyPage, listPages } from './pages.mjs';

const { values: opts, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: 'http://localhost:8787' },
    runs: { type: 'string', default: '1' },
    min: { type: 'string', default: '98' },
    form: { type: 'string', default: 'both' },
    page: { type: 'string' },
  },
});
const base = (positionals[0] || opts.url).replace(/\/$/, '');
const runs = Number(opts.runs);
const min = Number(opts.min);
const forms = opts.form === 'both' ? ['mobile', 'desktop'] : [opts.form];

// The pages are the HTML files; the worker renders whatever is there.
const PAGES = listPages().filter(({ name }) => !opts.page || name === opts.page);
// Wide enough for the longest "<slug>-desktop" label, plus two spaces.
const LABEL_WIDTH = Math.max(0, ...PAGES.map((p) => p.name.length)) + '-desktop'.length + 2;
const CATEGORIES = ['performance', 'accessibility', 'best-practices', 'seo'];
const out = 'lighthouse-reports';
mkdirSync(out, { recursive: true });

const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const score = (lhr, c) => Math.round((lhr.categories[c].score ?? 0) * 100);

const chrome = await launch({
  chromeFlags: ['--headless=new', '--no-sandbox', '--no-zygote', '--disable-gpu', '--disable-dev-shm-usage'],
});
let failed = false;
try {
  for (const form of forms) {
    for (const { name, path, file } of PAGES) {
      if (isEmptyPage(readFileSync(file, 'utf8'))) {
        console.log(`${name}-${form}`.padEnd(LABEL_WIDTH) + 'empty page');
        continue;
      }
      const results = [];
      for (let i = 0; i < runs; i++) {
        const { lhr, report } = await lighthouse(`${base}${path}`, {
          port: chrome.port, output: ['html', 'json'], logLevel: 'error', onlyCategories: CATEGORIES,
        }, form === 'desktop' ? desktopConfig : undefined);
        results.push({ lhr, report });
      }
      // Performance is the only category that varies between runs, so
      // the saved report is the run at its median.
      const byPerf = [...results].sort((a, b) => score(a.lhr, 'performance') - score(b.lhr, 'performance'));
      const kept = byPerf[Math.floor(results.length / 2)];
      writeFileSync(`${out}/${name}-${form}.report.html`, kept.report[0]);
      writeFileSync(`${out}/${name}-${form}.report.json`, kept.report[1]);
      let bad = false;
      const cells = CATEGORIES.map((c) => {
        const all = results.map((r) => score(r.lhr, c));
        const m = median(all);
        if (m < min) bad = true;
        const spread = new Set(all).size > 1 ? ` (${all.join('/')})` : '';
        return `${c} ${m}${spread}`;
      });
      failed ||= bad;
      console.log(`${name}-${form}`.padEnd(LABEL_WIDTH) + cells.join('  ') + (bad ? '  FAIL' : ''));
    }
  }
} finally {
  await chrome.kill();
}
console.log(`HTML reports in ${out}/`);
if (failed) {
  console.error(`Lighthouse gate: a score is below ${min}.`);
  process.exit(1);
}
