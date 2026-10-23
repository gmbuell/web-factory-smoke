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

// True when a page shows nothing: no text in the body (after dropping the
// head, comments, scripts and styles) and no media, frame or form control.
export function isEmptyPage(html) {
  const body = html.replace(/<head\b[\s\S]*?<\/head\s*>|<!--[\s\S]*?-->|<(script|style)\b[\s\S]*?<\/\1\s*>/gi, '');
  return body.replace(/<[^>]*>/g, '').trim() === ''
    && !/<(?:img|video|svg|canvas|iframe|input|button|select|textarea)\b/i.test(body);
}
