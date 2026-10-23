import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { listPages, isEmptyPage } from '../scripts/pages.mjs';
import { brokenLinks } from './site-checks.js';

const siteDir = new URL('../site/', import.meta.url);
const count = (html, re) => (html.match(re) ?? []).length;
const pages = listPages(siteDir);

const DESCRIPTION = /<meta name="description" content="[^"]*\S[^"]*"/;

// The checks every page shares. The 404 page has no description to check.
// An empty page may have no h1; any other page has exactly one.
function basics(html) {
  expect(html).toContain('<html lang="en">');
  expect(html).toMatch(/<title>\s*\S[^<]*<\/title>/);
  const h1s = count(html, /<h1[\s>]/g);
  expect(h1s).toBeLessThanOrEqual(1);
  if (!isEmptyPage(html)) expect(h1s).toBe(1);
}

it('has pages to check', () => {
  expect(pages.length).toBeGreaterThan(0);
});

describe.each(pages)('$path', ({ file }) => {
  const html = readFileSync(file, 'utf8');
  it('has a language, title and, unless empty, one h1', () => basics(html));
  it('has a description', () => {
    expect(html).toMatch(DESCRIPTION);
  });
});

it('404.html has a language, title, one h1 and a nav', () => {
  const html = readFileSync(new URL('404.html', siteDir), 'utf8');
  basics(html);
  expect(html).toMatch(/<nav[\s>]/);
});

it('isEmptyPage is true only for a page that shows nothing', () => {
  expect(isEmptyPage('<html><head><title>T</title></head><body></body></html>')).toBe(true);
  expect(isEmptyPage('<body>\n  <!-- <p>note</p> -->\n</body>')).toBe(true);
  expect(isEmptyPage('<body><p>Hi</p></body>')).toBe(false);
  expect(isEmptyPage('<body><img src=x alt=""></body>')).toBe(false);
});

it('a page with an empty body passes the basics', () => {
  const html = readFileSync(new URL('./fixtures/empty-site/index.html', import.meta.url), 'utf8');
  expect(isEmptyPage(html)).toBe(true);
  basics(html);
  expect(html).toMatch(DESCRIPTION);
});

it('a page with text and no h1 fails the basics', () => {
  expect(() => basics('<!doctype html><html lang="en"><title>T</title><body><p>Hi</p></body>')).toThrow();
});

it('every root-relative link resolves', () => {
  expect(brokenLinks(siteDir)).toEqual([]);
});

it('the link check reports a link to nowhere', () => {
  const fixture = new URL('./fixtures/broken-link-site/', import.meta.url);
  expect(brokenLinks(fixture)).toEqual(['/nowhere']);
});
