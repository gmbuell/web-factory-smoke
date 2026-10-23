# Red Hill Elementary PTA event site

## What this is

A Cloudflare Worker serving static pages from `site/`. The pages are plain
HTML, CSS and vanilla JS with no build step. There is no Worker code, only
assets (see `wrangler.jsonc`). Production is
<https://redhill-event.gmbuell.workers.dev> until the event has a domain.

Board members ask for changes in the PTA factory chat and read the answers
there, so say what changed in plain words. The factory app pushes each change
as a branch and deploys its preview. Only `main` deploys production, through
Workers Builds. Never run `npm run deploy` or create Cloudflare resources from
here. The README is a short pointer; this file is the operating manual.

## Commands

| Command | What it does |
|---|---|
| `npm ci` | Install exactly what `package-lock.json` says. Use it instead of `npm install` |
| `npm run dev` | `wrangler dev` on http://localhost:8787 |
| `npm test` | vitest, about a second. It covers per-page basics, internal links, the page list and the cliché report |
| `npm run audit` | Lighthouse on every page, mobile and desktop (needs Chrome). With no `--url` it audits production. The gate is `npm run audit -- --url http://localhost:8787 --runs 3 --min 98`. `--form mobile` and `--page <slug>` narrow it. Reports go to `lighthouse-reports/` (gitignored) |
| `npm run wcag` | WCAG 2.2 checks on every page, mobile and desktop (needs Chrome). With no `--url` it checks production. The gate is `npm run wcag -- --url http://localhost:8787`. Each cell shows how many elements the check examined |
| `npm run cliches` | Prints LLM clichés per page. Always exits 0. `-- --json` for JSON, `-- --site <dir>` for another folder |
| `npm run deploy` | **Ships to production.** Don't run it. Workers Builds runs it for `main`; `predeploy` runs the tests first |

Start `npm run dev` in one terminal and run the two gates from another.

## Layout

- `site/` is the pages. Each is a plain HTML file that carries its own header,
  nav and footer. A page's URL is its path without the extension, and
  an `index` file stands for its folder. So `about.html` is served at `/about`
  and `events/index.html` at `/events/`. `404.html` answers any missing path.
  - `css/styles.css` is the one stylesheet. The brand tokens sit under `:root`.
  - `fonts/` holds the self-hosted fonts and their license, and `_headers`
    sets the security headers and the font cache rule.
- `scripts/` holds the gates, one file per command, and `listPages()` in
  `pages.mjs`. Simon Willison's cliché patterns sit unedited in `vendor/`.
- `docs/design-system/` is the brand. Read its `readme.md` first, then
  `guidelines/brand-guide.html`.
- `test/` is vitest. The link checker is `site-checks.js`, and `fixtures/`
  holds small sites for the tests to run against.

Pages are found by `listPages()`. It is recursive and skips `404.html`. The page
tests, Lighthouse, the WCAG gate and the cliché report all use it, so a new
page, in a subfolder too, is covered with no list to update. `404.html` is the
exception. The tests check its basics, but Lighthouse, WCAG and the cliché
report never see it.

## Invariants the tests and CI pin

- Lighthouse is 98 or higher in all four categories, on mobile and desktop,
  for every page (the median of 3 runs).
- The WCAG checks pass on every page. They cover text contrast, target size,
  non-text contrast, focus rings, body line-height of 1.5 or more, body text of
  16px or more, and labels and captions of 13px or more.
- Every page has `<html lang="en">`, a title, a meta description, one `<h1>`
  and a `<nav>`. `404.html` needs no description.
- No broken internal links. Every root-relative `href` is a page path or a file
  under `site/`.
- `site/` has no build step and ships no runtime dependencies. No bundler,
  framework or npm package reaches the browser.

## Voice

People's words go on the page exactly as they wrote them. Don't polish,
punch up, or add a line after them. When a change needs wording nobody
gave, write the plainest short version that does the job.

How Red Hill sounds (from the brand guide, the board can change these):
- Lead with thanks. Open every ask with appreciation; name and celebrate
  helpers. Announcements may lead with the news, but the community heart
  comes before the call to action.
- "Our," never "the": our students, our school, our community.
- Every bit counts: no pressure, no scarcity, no "before we sell out", no
  countdown clocks.
- Exclamation points are welcome, one per sentence at most, and only when
  the enthusiasm is real.

Never write:
- Hype filler: "unforgettable", "fun-filled", "exciting opportunity",
  "join us for a day of", "something for everyone".
- Lists of three for rhythm, and colons that introduce one.
- Stacked dashes, or em dashes doing the work of commas.
- "Not just X, but Y" and "It's not X, it's Y".
- A closing line that restates the page.
- Words like delve, tapestry, testament, vibrant, seamless, elevate.

Run `npm run cliches` and deal with every hit before handing a change on.

## Gotchas

- The cliché report never fails CI, but a reviewer must deal with every hit.
  Fix the wording. If the hit is in words the PTA gave, those words stay, and
  the reviewer says so. The report reads visible text, `alt`, `title` and the
  meta description.
- Non-text contrast may examine zero elements: a page with no button, `.btn`
  link or field has nothing to check, and that is fine. Every other WCAG check
  fails when it examines nothing.
- Body text is `p`, `li`, `td`, `dd`, `dt` and `blockquote`, at 16px or more.
  Everything else is a label or caption at 13px or more. Fine print inside
  body copy goes in a `<small>`.
- Fonts are self-hosted latin subsets in `site/fonts/` (Oswald, Nunito Sans and
  Kaushan Script). Don't link a font host. Only the body font (Nunito Sans) is
  preloaded; copy that one `<link rel="preload">` from `index.html` into a new
  page and add no others. `_headers` caches `/fonts/*` for a year as immutable,
  so a changed font needs a new file name.
- Install with `npm ci` and keep `package-lock.json` in git. A fresh resolve
  without the lockfile crashes npm 10.9.8's arborist unless
  `--legacy-peer-deps` is passed.
- There is no include or template. A new page needs its link added to the nav
  of every other page, `404.html` too, and `aria-current="page"` on its own
  link. No test checks this.
- `wrangler.jsonc` has no `env` blocks on purpose: the factory app deploys
  previews with its own config. Don't add branch builds or previews here.
