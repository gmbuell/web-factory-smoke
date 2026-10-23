import { spawnSync } from 'node:child_process';
import { it, expect } from 'vitest';
import { pageText, findCliches } from '../scripts/cliches.mjs';

it('reads visible text, including alt, title and the meta description', () => {
  expect(pageText('<p>stands as a <em>testament</em></p>')).toContain('stands as a testament');
  expect(pageText('<p>A&amp;B it&rsquo;s</p><script>delve()</script><style>.x{}</style>')).toBe('A&B it’s');
  expect(pageText('<meta name="description" content="Desc"><img alt="Alt text">')).toContain('Desc');
  expect(pageText('<img alt="Alt text">')).toContain('Alt text');
  expect(pageText('<!doctype html><!-- note --><p>Hi</p>')).toBe('Hi');
  expect(pageText('<p>stands as a\ntestament</p>')).not.toContain('\n');
  expect(pageText('<dl><dt>Date</dt><dd>May 16</dd></dl>')).toBe('Date\nMay 16');
});

it('finds clichés and leaves plain event copy alone', () => {
  expect(findCliches('This event stands as a testament to our community.').map((h) => h.pattern))
    .toContain('“Stands as a testament”');
  expect(findCliches(pageText('<p>It is not a fair\nbut a celebration.</p>')).map((h) => h.pattern))
    .toContain('“Not X, but Y”');
  expect(findCliches(pageText('<p>If you\nlook, you will see.</p>'))).toEqual([]);
  expect(findCliches('The carnival is on Saturday, May 16, from 10am to 2pm.')).toEqual([]);
});

it('prints the hits and always exits 0', () => {
  const run = spawnSync('node', ['scripts/cliches.mjs', '--site', 'test/fixtures/sloppy-site']);
  expect(run.status).toBe(0);
  expect(String(run.stdout)).toContain('Stands as a testament');
  const json = spawnSync('node', ['scripts/cliches.mjs', '--site', 'test/fixtures/sloppy-site', '--json']);
  expect(JSON.parse(String(json.stdout))[0]).toMatchObject({ page: 'home', match: 'stands as a testament' });
});

it.each([
  ['An unforgettable night.', 'House: hype filler'],
  ['A fun-filled evening.', 'House: hype filler'],
  ['What an exciting opportunity.', 'House: hype filler'],
  ['Join us for a day of games.', 'House: hype filler'],
  ['There is something for everyone.', 'House: hype filler'],
  ['Buy now before we sell out.', 'House: scarcity'],
  ["Don't miss out.", 'House: scarcity'],
  ['Don’t miss out.', 'House: scarcity'],
  ['There are limited spots.', 'House: scarcity'],
  ['Tickets are selling fast.', 'House: scarcity'],
  ['Only 3 days left.', 'House: countdown wording'],
  ['Hurry to sign up.', 'House: countdown wording'],
  ['Games — and cake.', 'House: em dash'],
])('flags the voice guide phrase in %j', (text, name) => {
  expect(findCliches(text).map((h) => h.pattern)).toContain(name);
});

it('leaves a plain event line alone and keeps the real site clean', () => {
  expect(findCliches('The carnival is on Saturday, May 16, from 10am to 2pm.')).toEqual([]);
  const run = spawnSync('node', ['scripts/cliches.mjs']);
  expect(run.status).toBe(0);
  expect(String(run.stdout)).toBe('');
});
