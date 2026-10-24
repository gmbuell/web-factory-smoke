const form = document.getElementById('guestbook-form');
const input = document.getElementById('name');
const messageInput = document.getElementById('message');
const list = document.getElementById('names');
const status = document.getElementById('status');

function show(names) {
  list.replaceChildren(
    ...names.map((n) => {
      const li = document.createElement('li');
      const name = document.createElement('strong');
      name.className = 'entry-name';
      name.textContent = n.name;
      li.append(name);
      if (n.message) {
        const span = document.createElement('span');
        span.className = 'message';
        span.textContent = n.message;
        li.append(span);
      }
      return li;
    })
  );
}

async function load() {
  try {
    const res = await fetch('/api/guestbook');
    if (!res.ok) throw new Error();
    show((await res.json()).names);
  } catch {
    status.textContent = 'Could not load the names.';
  }
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  status.textContent = '';
  try {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: input.value, message: messageInput.value }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(res.status === 400 ? body?.error : '');
    }
    show((await res.json()).names);
    input.value = '';
    messageInput.value = '';
  } catch (err) {
    status.textContent = err.message || 'Could not save your name.';
  }
});

load();
