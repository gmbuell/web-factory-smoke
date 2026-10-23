import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { listPages } from '../scripts/pages.mjs';

// Root-relative hrefs (/x, never //host) in any page under siteDir that
// match neither a page path nor a file under siteDir.
export function brokenLinks(siteDir = new URL('../site/', import.meta.url)) {
  const root = siteDir instanceof URL ? fileURLToPath(siteDir) : resolve(siteDir);
  const paths = new Set(listPages(siteDir).map((page) => page.path));
  const broken = new Set();
  for (const rel of readdirSync(root, { recursive: true }).filter((f) => f.endsWith('.html'))) {
    const html = readFileSync(join(root, rel), 'utf8');
    for (const [, , href] of html.matchAll(/\shref=(["'])(.*?)\1/g)) {
      const target = href.split(/[?#]/)[0];
      if (!target.startsWith('/') || target.startsWith('//')) continue;
      if (!paths.has(target) && !statSync(join(root, target), { throwIfNoEntry: false })?.isFile()) {
        broken.add(target);
      }
    }
  }
  return [...broken];
}
