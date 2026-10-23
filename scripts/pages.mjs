import { readdirSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

// Every page under siteDir (default: the repo's site/) as { name, path, file },
// sorted by URL path. 404.html is skipped: it is not a page to audit.
export function listPages(siteDir = new URL('../site/', import.meta.url)) {
  const root = siteDir instanceof URL ? fileURLToPath(siteDir) : resolve(siteDir);
  return readdirSync(root, { recursive: true })
    .filter((rel) => rel.endsWith('.html') && basename(rel) !== '404.html')
    .map((rel) => {
      const path = '/' + rel.slice(0, -'.html'.length).replace(/(^|\/)index$/, '$1');
      const name = path.replace(/^\/|\/$/g, '').replaceAll('/', '-') || 'home';
      return { name, path, file: join(root, rel) };
    })
    .sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));
}
