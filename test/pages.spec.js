import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { listPages } from '../scripts/pages.mjs';
import { brokenLinks } from './site-checks.js';

const siteDir = new URL('../site/', import.meta.url);
const count = (html, re) => (html.match(re) ?? []).length;
const pages = listPages(siteDir);

// The checks every page shares. The 404 page has no description to check.
function basics(html) {
  expect(html).toContain('<html lang="en">');
  expect(html).toMatch(/<title>\s*\S[^<]*<\/title>/);
  expect(count(html, /<h1[\s>]/g)).toBe(1);
  expect(html).toMatch(/<nav[\s>]/);
}

it('has pages to check', () => {
  expect(pages.length).toBeGreaterThan(0);
});

describe.each(pages)('$path', ({ file }) => {
  const html = readFileSync(file, 'utf8');
  it('has a language, title, one h1 and a nav', () => basics(html));
  it('has a description', () => {
    expect(html).toMatch(/<meta name="description" content="[^"]*\S[^"]*"/);
  });
});

it('404.html has a language, title, one h1 and a nav', () => {
  basics(readFileSync(new URL('404.html', siteDir), 'utf8'));
});

it('every root-relative link resolves', () => {
  expect(brokenLinks(siteDir)).toEqual([]);
});

it('the link check reports a link to nowhere', () => {
  const fixture = new URL('./fixtures/broken-link-site/', import.meta.url);
  expect(brokenLinks(fixture)).toEqual(['/nowhere']);
});
