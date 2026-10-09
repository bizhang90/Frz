# FriendZones → Cloudflare Workers: migration runbook

## Scope and status

- Public marketing website, 9 project pages, employee portal (`/login/`, `/nhan-vien/`) and all existing Vercel `/api/*` routes.
- GitHub repo: `bizhang90/Frz`.
- Original custom domain: `friendzonegroup.net`; current Vercel project: `friendzone`.
- **No production traffic, DNS, webhook endpoint, scheduled job or database is moved by this PR.**
- Test-only Worker: `friendzone-migration-staging`, with **workers.dev=false**, **preview_urls=false**, **routes=[]**, **no cron**.
- Existing images/videos remain on `media.friendzonegroup.net` (Cloudflare R2), not re-uploaded to GitHub.

## Design

- Cloudflare Workers Static Assets serves the HTML, JS, CSS, fonts and images.
- `cloudflare/worker.mjs` converts Workers requests to the existing Vercel CommonJS `api_src/router.js`; it intentionally preserves Supabase RLS, role permissions, Kiot/Viet notifications and route semantics.
- `/nhan-vien/config.js` and `/config.js` are **generated on request** from `SUPABASE_URL` and **public** `SUPABASE_ANON_KEY`. Do not include `SUPABASE_SERVICE_ROLE_KEY` in any public JS.
- `nodejs_compat` allows the unchanged backend to read Worker secrets from `process.env` at runtime on the configured compatibility date.
- Worker returns **503** for API routes without the essential backend secrets instead of silently proceeding.
- The Vercel cron at **14:35 UTC (21:35 Vietnam)** will later become a Cloudflare Cron Trigger, but both MUST NOT run concurrently.

## Prerequisites

1. Cloudflare account with Workers access for the zone `friendzonegroup.net`.
2. GitHub Actions secrets: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` (API token: narrowly scoped Workers edit, not a Global API Key).
3. Configure Worker runtime secrets in Cloudflare UI **after** uploading the unrouted staging Worker.
4. Confirm Supabase Auth redirect allowlist includes `https://friendzonegroup.net/login/` and `https://friendzonegroup.net/login/?setup=1`.
5. Backup current Vercel environment variable **names** and integration endpoints before cutover.
   Vercel lists **17 Sensitive** variables; it may not return their plaintext values. Retrieve/rotate them at the original service, not by committing to Git.

## Cloudflare runtime variables

**Required for employee login and protected API:**
- `SUPABASE_URL` (server-only but not secret)
- `SUPABASE_ANON_KEY` (publishable, used by the browser)
- `SUPABASE_SERVICE_ROLE_KEY` (**secret**, backend only)
- `FNB_AUTH_REDIRECT_URL=https://friendzonegroup.net/login/?setup=1` (verify against deployed flow)

**Integrations, only when actually in use:**
- `CRON_SECRET` (for old protected attendance endpoint)
- `FNB_META_VERIFY_TOKEN`, `META_APP_SECRET`
- `ZALO_GATEWAY_URL`, `ZALO_GATEWAY_SECRET`
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID_DATA_KHACH_HANG`
- `FNB_CUSTOMER_NOTIFY_ROUTE`
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_PUBLIC_URL`

**Check integration name mismatches before cutover:**
`api_src/notify.js` reads `TELEGRAM_CHAT_ID_FNB` or `TELEGRAM_CHAT_ID`, while the Vercel project lists `TELEGRAM_CHAT_ID_DATA_KHACH_HANG`. Confirm the intended group routing rather than blindly renaming it.
`api_src/kiotviet.js` expects `KIOTVIET_RETAILER`, `KIOTVIET_CLIENT_ID`, `KIOTVIET_CLIENT_SECRET`; those names do not appear in the 17 Vercel variables checked. Verify whether the KiotViet sync feature is intended to run in production.

## Build/test

On GitHub Actions use **FriendZones - Cloudflare staging**:
- default pushes/PRs: lint + build only + Wrangler dry-run; no Cloudflare credentials necessary.
- manual upload (after the secrets are set): choose `upload_unrouted=true`. Uploads an **unrouted** Worker only.

Do not enable a staging public workers.dev URL with live HR secrets unless access control and authorization are verified first. Prefer a restricted Cloudflare Access route/domain for end-to-end tests.

## Required pre-cutover smoke test

1. `GET /` and all 9 project URLs; audit layouts and image links.
2. `GET /login/` and `GET /nhan-vien/`; check Supabase public config and authenticated login.
3. STAFF cannot view Finance or HR without permission; ADMIN role can use approved functions.
4. Test check-in/out from an actual assigned site with GPS accuracy/boundary protection.
5. `GET /api/health` and 401/403 response to unauthorized staff operations.
6. Test `/api/meta-webhook` verification, KiotViet and Zalo/Telegram webhooks **without sending duplicate live events**.
7. Ensure media from `media.friendzonegroup.net` loads.
8. Set up Cloudflare Cron Trigger **only after** Vercel's 14:35 UTC Cron is disabled. Do not replay a live attendance report to test the cron.

## Go-live and rollback

- To cut over, replace staging-only Worker config with the reviewed production Worker name, domain route and `crons: ["35 14 * * *"]` only when cron ownership changes.
- Attach `friendzonegroup.net` in Cloudflare and adjust DNS deliberately; leave the `media.friendzonegroup.net` R2 mapping and email DNS untouched.
- Keep Vercel project until Cloudflare SSL, login, employee GPS attendance, all public pages and API integrations pass.
- If rollout fails, restore the previous DNS record and disable the new Worker route/Cron.
- Avoid simultaneous cron execution and webhook double-delivery; never assume DNS changes move third-party webhook registrations.

## Known preexisting concerns

- The current Vercel repository stores `nhan-vien/config.js` with empty Supabase variables. The Worker serves this dynamically, requiring `SUPABASE_ANON_KEY` be set in Cloudflare.
- The current `meta-webhook` and `kiot-webhook` handlers in `api_src/router.js` should be reviewed for webhook signature validation prior to any public Worker API cutover. This migration preserves their behavior but does not claim that behavior is secure.
