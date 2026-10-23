import { it, expect } from 'vitest';
import { listPages } from '../scripts/pages.mjs';
const fixture = new URL('./fixtures/nested-site/', import.meta.url);
it('lists nested pages with their URL paths, skipping 404s', () => {
  expect(listPages(fixture).map(({ name, path }) => [name, path])).toEqual([
    ['home', '/'], ['about', '/about'], ['events', '/events/'], ['events-carnival', '/events/carnival'],
  ]);
});
