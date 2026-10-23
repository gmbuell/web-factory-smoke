# Red Hill Elementary PTA event site

Static pages in `site/` (plain HTML, CSS and vanilla JS, no build step),
served as Cloudflare Worker assets.

Commit to your branch. The factory app pushes it, deploys a preview, merges to
`main` and deploys production. This sandbox has no GitHub or Cloudflare
credentials.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install from `package-lock.json` |
| `npm run dev` | `wrangler dev` on http://localhost:8787 |
| `npm test` | Page basics and internal links |
| `npm run audit -- --runs 3` | The Lighthouse gate, mobile and desktop, run with `npm run dev` going. `--page <slug>` narrows it; a slug is the URL path with `/` as `-`, and `home` for `/` |
| `npm run wcag` | The WCAG 2.2 gate, mobile and desktop, also run with `npm run dev` going |
| `npm run cliches` | Prints LLM clichés per page. Never fails |

## Layout

- `site/` is the pages. `about.html` serves `/about` and `events/index.html`
  serves `/events/`. `404.html` answers missing paths. `css/styles.css` holds
  the brand tokens under `:root`, and `fonts/` the self-hosted fonts.
- `docs/design-system/` is the brand guide. It's the default starting point.
  When the board wants a different look, rework it (the guide, the tokens, the
  fonts) as part of the change, and keep the guide and the tokens in step.
- `scripts/` is the gates and `listPages()` in `pages.mjs`. `vendor/` is
  third-party; don't edit it.
- `test/` is vitest.

Every page `listPages()` finds (recursive, skipping `404.html`) is covered by
the tests, both gates and the cliché report, so a new page needs no list
updated.

## Invariants

- `site/` is served as written. Nothing from npm reaches the browser.

## Voice

People's words go on the page exactly as they wrote them. Don't polish,
punch up, or add a line after them. When a change needs wording nobody
gave, write the plainest short version that does the job.

Run `npm run cliches`; reword a hit only in wording nobody gave.

## Gotchas

- A page whose `<body>` is empty prints `empty page` in both gates instead of
  failing. Anything in the body, a script included, makes it a page.
- There are no templates. A new page's link goes in the nav of every page that
  has one, `404.html` included.
- `_headers` caches `/fonts/*` as immutable, so a changed font needs a new file
  name.
- `wrangler.jsonc` has no `env` blocks on purpose; previews use the factory
  app's own config.
