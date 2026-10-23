import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { patterns as vendored } from './vendor/llm-cliches.mjs';
import { patterns as house } from './voice-patterns.mjs';
import { listPages } from './pages.mjs';

// Report only: prints LLM clichés (Simon Willison's patterns, then the house list in voice-patterns.mjs) per page and always exits 0.
// Usage: node scripts/cliches.mjs [--site <dir>] [--json]

const BLOCK = /^(?:p|div|li|h[1-6]|br|section|header|footer|main|nav|td|th|tr|blockquote|figcaption|ul|ol|article|aside|dt|dd|details|summary|button|label|option|title|hr|form|table)$/;
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ',
  rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', mdash: '—', ndash: '–', hellip: '…',
};
// A tag, allowing ">" inside quoted attribute values.
const TAG = /<\/?[a-z][^>"']*(?:(?:"[^"]*"|'[^']*')[^>"']*)*>/gi;

// shortcut: only quoted attribute values are read, unquoted alt/title are ignored; upgrade if a page needs them.
const attr = (tag, name) => {
  const m = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)')`, 'i'));
  return m ? (m[1] ?? m[2]) : undefined;
};

// The text a reader (or a cliché pattern) sees on a page, one block per line.
export function pageText(html) {
  const text = html
    .replace(/<!--[\s\S]*?-->|<![^>]*>/g, '')
    .replace(/<(script|style|template|svg)\b[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/\s+/g, ' ') // source newlines are not line breaks; only block tags are
    .replace(TAG, (tag) => {
      const name = tag.match(/^<\/?([a-z][a-z0-9]*)/i)[1].toLowerCase();
      const lifted = [attr(tag, 'alt'), attr(tag, 'title'), name === 'meta' && attr(tag, 'name')?.toLowerCase() === 'description' ? attr(tag, 'content') : undefined]
        .filter(Boolean);
      return lifted.length ? `\n${lifted.join('\n')}\n` : BLOCK.test(name) ? '\n' : '';
    })
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (all, e) => {
      const code = e[0] !== '#' ? undefined : e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return code === undefined ? (ENTITIES[e] ?? all) : code <= 0x10ffff ? String.fromCodePoint(code) : all;
    });
  return text.split('\n').map((line) => line.replace(/\s+/g, ' ').trim()).filter(Boolean).join('\n');
}

export function findCliches(text) {
  return [...vendored, ...house].flatMap((p) =>
    p.find(text).map(({ start, end }) => ({ pattern: p.name, match: text.slice(start, end) })));
}

function main(argv) {
  const flag = (name) => argv.indexOf(name);
  const site = flag('--site') >= 0 ? argv[flag('--site') + 1] : undefined;
  const hits = listPages(site).flatMap((page) =>
    findCliches(pageText(readFileSync(page.file, 'utf8'))).map((hit) => ({ page: page.name, ...hit })));
  if (flag('--json') >= 0) console.log(JSON.stringify(hits, null, 2));
  else for (const h of hits) console.log(`${h.page}: ${h.pattern}: "${h.match.replace(/\s+/g, ' ')}"`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main(process.argv.slice(2));
