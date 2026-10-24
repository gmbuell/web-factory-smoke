import { describe, it, expect } from 'vitest';
import worker from '../worker/index.js';

function fakeEnv(rows = []) {
  return {
    GUESTBOOK: {
      prepare(sql) {
        return {
          args: [],
          bind(...a) {
            this.args = a;
            return this;
          },
          async run() {
            rows.unshift({ name: this.args[0], message: this.args[1] });
          },
          async all() {
            return { results: rows.slice(0, 10) };
          },
        };
      },
    },
  };
}

const post = (env, body) =>
  worker.fetch(
    new Request('http://x/api/guestbook', { method: 'POST', body: JSON.stringify(body) }),
    env
  );

describe('guestbook worker', () => {
  it('saves a message with the name, as written', async () => {
    const env = fakeEnv();
    const res = await post(env, { name: 'Ann', message: '<b>hi</b>  there' });
    expect(res.status).toBe(201);
    expect((await res.json()).names[0]).toEqual({ name: 'Ann', message: '<b>hi</b>  there' });
  });

  it('allows no message', async () => {
    const res = await post(fakeEnv(), { name: 'Ann' });
    expect((await res.json()).names[0]).toEqual({ name: 'Ann', message: null });
  });

  it('accepts 140 characters and rejects 141', async () => {
    expect((await post(fakeEnv(), { name: 'Ann', message: 'a'.repeat(140) })).status).toBe(201);
    expect((await post(fakeEnv(), { name: 'Ann', message: 'a'.repeat(141) })).status).toBe(400);
  });

  it('rejects a message of only whitespace', async () => {
    expect((await post(fakeEnv(), { name: 'Ann', message: '   ' })).status).toBe(400);
  });

  it('lists an old entry with no message as null', async () => {
    const env = fakeEnv([{ name: 'Old' }]);
    const res = await worker.fetch(new Request('http://x/api/guestbook'), env);
    expect((await res.json()).names).toEqual([{ name: 'Old', message: null }]);
  });

  it('still checks names', async () => {
    expect((await post(fakeEnv(), { name: '123', message: 'hi' })).status).toBe(400);
  });
});
