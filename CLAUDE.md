# picklog-automation — operating guide

This repository runs picklog.kr (WordPress, Astra theme) without manual work by the owner.
Everything committed to `main` reaches the live site automatically:

- `plugin/picklog-interactive-lab/` — the WordPress plugin (calculators, tests, REST API, updater, SEO/ads hooks).
  After changing it: bump `VERSION` (and the `Version:` header) in `picklog-interactive-pro.php`, then run `./build.sh`
  and commit `dist/`. The publisher calls `/picklog/v1/self-update` when `dist/plugin.json` is newer than the site.
- `content/pages/*.json + .html` — pages, kept in sync on every run (keys are stable; never rename a key).
- `content/posts/*.json + .html` — posts. Existing posts sync immediately; NEW posts are drip-published
  (`DAILY_POST_LIMIT`, default 2 per KST day, only between `PUBLISH_HOURS` 8–21 KST) in `order`.
- `content/site.json` — categories, menus (Astra locations: primary, mobile_menu, footer_menu), plugin options,
  front page, old post IDs to keep private. Applied only when the file changes.
- `publisher/run.py` — runs hourly as the Render cron job `picklog-publisher` (workspace `tea-d0c65fbuibrs73drugg0`).

## Checking what happened on the live site
The site itself is not reachable from Claude's workspace. Read the cron job's logs with the Render MCP tool
(`list_logs`, resource = the cron job id). Each run ends with a line `PICKLOG_STATE {...}` listing managed items
(id, status, key, text length), unmanaged public items, options and category counts. Errors start with `ERROR`.
`WAITING:` means the plugin v2.1+ is not active yet.

## Content rules (AdSense was rejected twice for "low value content")
- Site topic is ONLY 사주·운세 and 성격 심리 (Big Five / IPIP). Do not add unrelated lifestyle/shopping posts.
- Every post: 2,500+ Korean characters of substance, a worked example or table, a CTA to a tool page
  (`/saju/`, `/gunghap/`, `/big-five-test/`), and internal links to related posts using `href="/slug/"`.
  Links to posts that are not live yet are unlinked automatically and restored when the target publishes.
- Never duplicate an existing topic; extend or edit the existing post instead.
- Facts: compute saju examples with `plugin/picklog-interactive-lab/assets/saju-core.js` (+ `solar-terms.json`,
  `saju-data.json`) instead of writing them from memory. Psychology claims need a real citation in `.pk-src`.
- Fortune = entertainment/self-reflection; personality tests = self-report, not diagnosis. Keep that framing.
- Wrap article HTML in `<div class="pk-article">…</div>`. Available helpers: `.pk-box`, `.pk-cta`, `.pk-src`, tables.
- Post JSON fields: key (`post-<slug>`), order, title, slug (english, kebab), excerpt, meta_description,
  categories `[{"name","slug"}]` (saju-guide | psychology | fortune), tags, status `publish`, optional `not_before` (YYYY-MM-DD).
- Keep the queue at least 10 posts ahead of what is published. Backlog: `content/PLAN.md`.

## Never
- Never commit secrets. The application password lives only in Render env `WP_APP_PASSWORD`.
- Never touch posts listed in `site.json` `hide_ids` except to keep them private.
- Do not publish more than 3 new posts per day.
