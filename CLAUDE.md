# Red Hill Elementary PTA event site

Static pages in `site/` (plain HTML, CSS and vanilla JS, no build step),
served as Cloudflare Worker assets. Production is
<https://redhill-event.gmbuell.workers.dev>.

Changes come in through the PTA factory app, which pushes branches and deploys
previews. Only `main` deploys production. Never run `npm run deploy` or create
Cloudflare resources from here.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install from `package-lock.json`. Keep the lockfile; re-resolving needs `--legacy-peer-deps` |
| `npm run dev` | `wrangler dev` on http://localhost:8787 |
| `npm test` | Page basics, internal links and the cliché report |
| `npm run audit -- --url http://localhost:8787 --runs 3 --min 98` | The Lighthouse gate, mobile and desktop. `--page <slug>` narrows it; a slug is the URL path with `/` as `-`, and `home` for `/` |
| `npm run wcag -- --url http://localhost:8787` | The WCAG 2.2 gate, mobile and desktop |
| `npm run cliches` | Prints LLM clichés per page. Never fails |

Without `--url`, `audit` and `wcag` check production.

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

- Lighthouse 98 or higher in all four categories, mobile and desktop.
- The WCAG checks pass.
- Every page has `<html lang="en">`. A page that shows anything also has a
  title, a meta description (except `404.html`) and exactly one `<h1>`.
- No broken internal links.
- `site/` is served as written. Nothing from npm reaches the browser.

## Voice

People's words go on the page exactly as they wrote them. Don't polish,
punch up, or add a line after them. When a change needs wording nobody
gave, write the plainest short version that does the job.

Run `npm run cliches` and deal with every hit before handing a change on.

## Gotchas

- The cliché report knows only Simon Willison's patterns, so also read every
  change for wording nobody gave. A hit in words the PTA gave stays.
- A page with nothing in its body prints `empty page` in both gates instead of
  failing.
- There are no templates. A new page's link goes in the nav of every page that
  has one, `404.html` included.
- `_headers` caches `/fonts/*` as immutable, so a changed font needs a new file
  name.
- `wrangler.jsonc` has no `env` blocks on purpose; previews use the factory
  app's own config.
