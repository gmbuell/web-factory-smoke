const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

async function lastNames(env) {
  const { results } = await env.GUESTBOOK.prepare(
    'SELECT name FROM names ORDER BY id DESC LIMIT 10'
  ).all();
  return results.map((r) => r.name);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== '/api/guestbook') {
      return new Response('Not found', { status: 404 });
    }
    if (request.method === 'GET') {
      return json({ names: await lastNames(env) });
    }
    if (request.method === 'POST') {
      let data;
      try {
        data = await request.json();
      } catch {
        return json({ error: 'Bad request' }, 400);
      }
      const name = typeof data?.name === 'string' ? data.name.trim() : '';
      if (!name || name.length > 100) {
        return json({ error: 'Name must be 1 to 100 characters' }, 400);
      }
      await env.GUESTBOOK.prepare('INSERT INTO names (name) VALUES (?)').bind(name).run();
      return json({ names: await lastNames(env) }, 201);
    }
    return new Response('Method not allowed', { status: 405, headers: { allow: 'GET, POST' } });
  },
};
