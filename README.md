# Telegram Emoji Recolor Bot

A Telegram bot + Mini App. Users open the Mini App, pick a hex color, browse
emoji packs (live-previewed in that color), and tap **Generate** to get the
recolored pack sent to them as files in their DM with the bot.

Payment is **stubbed** for now — Generate delivers the pack immediately, free.
See "Adding real payments" below for how to wire that in later.

## How it fits together

```
/start command  →  chat button opens the Mini App (web_app URL)
Mini App (miniapp/index.html)
  → GET  /api/packs      lists packs + shapes, rendered live in the chosen hex
  → POST /api/generate   { initData, packId, hex } → server verifies the
                          request really came from Telegram, rasterizes the
                          pack's SVG shapes in that hex, and DMs the PNGs to
                          the user via the bot
```

- `lib/packs.js` — pack + shape definitions (plain SVG templates with a
  `{{COLOR}}` placeholder). Add packs/shapes here.
- `lib/recolor.js` — swaps in the hex and rasterizes to PNG via `sharp`.
- `lib/verifyInitData.js` — validates the Mini App's `initData` per
  [Telegram's spec](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app),
  so nobody can fake a `user_id` and get packs DMed to someone else.
- `server.js` — Telegraf bot + Express server serving the Mini App and API.
- `miniapp/index.html` — the Mini App itself (vanilla JS, no build step).

## Setup

1. **Create the bot** — message [@BotFather](https://t.me/BotFather):
   - `/newbot` → follow prompts → copy the token it gives you.
   - `/setmenubutton` or just rely on `/start`'s inline button (already wired
     up in `server.js`) to open the Mini App.
   - Optionally `/mybots` → your bot → **Bot Settings → Menu Button** → set it
     to your `PUBLIC_URL/miniapp/` so the Mini App is reachable from the
     attach menu too.

2. **Install dependencies:**
   ```bash
   npm install
   ```
   (`sharp` will download a prebuilt binary for your platform — this needs
   network access.)

3. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Fill in:
   - `BOT_TOKEN` — from BotFather.
   - `PUBLIC_URL` — an HTTPS URL. Telegram Mini Apps **must** be served over
     HTTPS with a valid cert (not self-signed). For local dev, use a tunnel
     like `ngrok http 3000` and put the `https://...ngrok-free.app` URL here.
   - `USE_WEBHOOK` — `false` for local dev (long polling), `true` in
     production behind a stable HTTPS domain.

4. **Run it:**
   ```bash
   npm start
   ```
   Open Telegram, find your bot, send `/start`, tap **Open Emoji Shop**.

## Deploying to Render (free tier)

A `render.yaml` blueprint is included. Steps:

1. Push this project to a GitHub repo.
2. In Render: **New → Blueprint**, point it at the repo. It'll read
   `render.yaml` and create the web service on the free plan.
3. Before the first deploy finishes, set the env vars it left blank:
   - `BOT_TOKEN` → your token from BotFather.
   - `PUBLIC_URL` → `https://<your-service-name>.onrender.com` (Render shows
     you the exact URL once the service is created — you may need to save
     once, copy the URL, then edit this var and redeploy).
4. Once live, send `/start` to your bot. First message after any idle period
   takes ~30-60s (free-tier cold start) since Render spins the service down
   after 15 minutes of no traffic — this is expected and fine for a hobby
   project. Because we run in webhook mode (`USE_WEBHOOK=true`), Telegram's
   own incoming update is what wakes the service back up, no extra
   keep-alive needed.
5. If the cold-start delay becomes annoying once you have real users, the
   straightforward upgrade path is Render's paid Starter plan (~$7/mo,
   always warm) or moving to Railway's Hobby plan (~$5/mo, no free tier but
   no sleep either).

## Adding real payments

Right now the Mini App's Generate button calls `/api/generate` directly. To
charge for it, the cleanest path is **Telegram Stars** (or Telegram Payments
for fiat), since it keeps the whole flow inside Telegram with no external
payment page:

1. When Generate is tapped, instead of calling `/api/generate` right away,
   call `bot.telegram.sendInvoice(userId, {...})` with the pack's
   `priceCents` (already defined per-pack in `lib/packs.js`), either from a
   small `/api/checkout` endpoint the Mini App hits, or directly via
   `Telegram.WebApp.openInvoice()` in the frontend once you generate an
   invoice link server-side with `createInvoiceLink`.
2. Handle `bot.on("pre_checkout_query", ...)` — call
   `ctx.answerPreCheckoutQuery(true)` to approve it (add stock/fraud checks
   here if needed).
3. Handle `bot.on("message", ...)` filtering for `ctx.message.successful_payment`
   — **only here** do you call `generatePackImages` + `sendMediaGroup`. This
   guarantees delivery only happens after payment actually clears.
4. Remove/guard the current free path in `/api/generate` (or keep it behind
   an admin/testing flag) once real payment is wired up.

## Notes on the emoji packs themselves

The shapes are original geometric artwork (circles, hearts, stars, etc.),
not copies of Apple/Google/Twemoji emoji artwork — those are either
copyrighted or not straightforward to recolor wholesale since they're
multi-color by design. This keeps the packs fully yours to extend.

To turn a generated pack into an actual **Telegram custom emoji set** (so it
shows up in the emoji keyboard, not just as DM'd image files), the next step
is `bot.telegram.callApi("createNewStickerSet", { sticker_type:
"custom_emoji", ... })` with the generated PNGs — that requires a bit more
setup (sticker set naming rules, and the user needs to add the set), so this
build keeps it simple and DMs the files directly, as requested.

## Adding more shapes/packs

Add a shape to `SHAPES` in `lib/packs.js` (SVG with `fill="{{COLOR}}"`), then
reference its key in any pack's `shapes` array. Mirror the same shape
function in `miniapp/index.html`'s `SHAPES` object so the live preview stays
in sync (the frontend renders previews client-side for speed; the backend
`lib/packs.js` version is the source of truth for the actual generated
files).
