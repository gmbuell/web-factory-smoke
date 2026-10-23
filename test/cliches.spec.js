import { spawnSync } from 'node:child_process';
import { it, expect } from 'vitest';
import { pageText, findCliches } from '../scripts/cliches.mjs';

it('reads visible text, including alt, title and the meta description', () => {
  expect(pageText('<p>stands as a <em>testament</em></p>')).toContain('stands as a testament');
  expect(pageText('<p>A&amp;B it&rsquo;s</p><script>delve()</script><style>.x{}</style>')).toBe('A&B it’s');
  expect(pageText('<meta name="description" content="Desc"><img alt="Alt text">')).toContain('Desc');
  expect(pageText('<img alt="Alt text">')).toContain('Alt text');
  expect(pageText('<!doctype html><!-- note --><p>Hi</p>')).toBe('Hi');
});

it('finds clichés and leaves plain event copy alone', () => {
  expect(findCliches('This event stands as a testament to our community.').map((h) => h.pattern))
    .toContain('“Stands as a testament”');
  expect(findCliches('The carnival is on Saturday, May 16, from 10am to 2pm.')).toEqual([]);
});

it('prints the hits and always exits 0', () => {
  const run = spawnSync('node', ['scripts/cliches.mjs', '--site', 'test/fixtures/sloppy-site']);
  expect(run.status).toBe(0);
  expect(String(run.stdout)).toContain('Stands as a testament');
  const json = spawnSync('node', ['scripts/cliches.mjs', '--site', 'test/fixtures/sloppy-site', '--json']);
  expect(JSON.parse(String(json.stdout))[0]).toMatchObject({ page: 'home', match: 'stands as a testament' });
});
