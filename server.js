// server.js
//
// Telegram bot + Mini App server.
//
//  - Telegraf bot: replies to /start with a button that opens the Mini App.
//  - Express: serves the Mini App's static files, and an API the Mini App
//    calls to "purchase" (currently just a Generate button, no real payment)
//    and receive their recolored emoji pack via DM.

require("dotenv").config();
const path = require("path");
const express = require("express");
const { Telegraf } = require("telegraf");

const { PACKS } = require("./lib/packs");
const { generatePackImages, normalizeHex } = require("./lib/recolor");
const { verifyInitData } = require("./lib/verifyInitData");

const BOT_TOKEN = process.env.BOT_TOKEN;
const PUBLIC_URL = process.env.PUBLIC_URL;
const PORT = process.env.PORT || 3000;
const USE_WEBHOOK = process.env.USE_WEBHOOK === "true";

if (!BOT_TOKEN) {
  console.error("Missing BOT_TOKEN in .env — get one from @BotFather.");
  process.exit(1);
}

const bot = new Telegraf(BOT_TOKEN);
const app = express();
app.use(express.json());

// ---------------------------------------------------------------------------
// Bot commands
// ---------------------------------------------------------------------------

bot.start((ctx) => {
  const webAppUrl = `${PUBLIC_URL}/miniapp/`;
  return ctx.reply(
    "Welcome! Pick a hex color and grab a matching emoji pack — tap below to open the shop.",
    {
      reply_markup: {
        inline_keyboard: [[{ text: "🎨 Open Emoji Shop", web_app: { url: webAppUrl } }]],
      },
    }
  );
});

bot.help((ctx) =>
  ctx.reply("Use /start to open the emoji shop Mini App and grab a recolored emoji pack.")
);

// ---------------------------------------------------------------------------
// Static Mini App files
// ---------------------------------------------------------------------------

app.use("/miniapp", express.static(path.join(__dirname, "miniapp")));

// ---------------------------------------------------------------------------
// API: list packs (with a color-swatch preview using a default color)
// ---------------------------------------------------------------------------

app.get("/api/packs", (req, res) => {
  res.json({
    packs: PACKS.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      priceCents: p.priceCents,
      shapeCount: p.shapes.length,
      shapes: p.shapes,
    })),
  });
});

// ---------------------------------------------------------------------------
// API: generate + deliver a pack
//
// NOTE: this is the stubbed "payment" step. Right now the Mini App's
// Generate button calls this directly — no charge happens. To add real
// payments, swap this for Telegram Payments / Telegram Stars
// (bot.telegram.sendInvoice + handling `pre_checkout_query` and
// `successful_payment`), and only call the delivery logic below once
// `successful_payment` fires.
// ---------------------------------------------------------------------------

app.post("/api/generate", async (req, res) => {
  try {
    const { initData, packId, hex, secondaryHex, packName } = req.body || {};

    const verified = verifyInitData(initData, BOT_TOKEN);
    if (!verified.ok) {
      return res.status(401).json({ error: "unauthorized", reason: verified.reason });
    }

    const primary = normalizeHex(hex);
    if (!primary) {
      return res.status(400).json({ error: "invalid_hex" });
    }
    // secondaryHex is optional — generatePackImages falls back to black.
    const secondary = secondaryHex ? normalizeHex(secondaryHex) : null;
    if (secondaryHex && !secondary) {
      return res.status(400).json({ error: "invalid_secondary_hex" });
    }

    const userId = verified.user?.id;
    if (!userId) {
      return res.status(400).json({ error: "missing_user" });
    }

    const { pack, images } = await generatePackImages(packId, primary, secondary);
    const displayName = (packName && String(packName).trim()) || pack.name;

    // Telegram allows up to 10 items per sendMediaGroup call, so chunk it.
    const chunkSize = 10;
    for (let i = 0; i < images.length; i += chunkSize) {
      const chunk = images.slice(i, i + chunkSize);
      const media = chunk.map((img, idx) => ({
        type: "document",
        media: { source: img.buffer, filename: img.filename },
        caption: i === 0 && idx === 0 ? `${displayName} — recolored to ${primary}` : undefined,
      }));
      await bot.telegram.sendMediaGroup(userId, media);
    }

    await bot.telegram.sendMessage(
      userId,
      `Your "${displayName}" pack in ${primary} is above ⬆️ — save the files to use them, or add them as custom emoji.`
    );

    res.json({ ok: true, delivered: images.length });
  } catch (err) {
    console.error("generate error:", err);
    res.status(500).json({ error: "generation_failed", message: err.message });
  }
});

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------

async function main() {
  if (USE_WEBHOOK) {
    if (!PUBLIC_URL) {
      console.error("USE_WEBHOOK=true requires PUBLIC_URL to be set in .env");
      process.exit(1);
    }
    const webhookPath = `/telegraf/${bot.secretPathComponent()}`;
    app.use(bot.webhookCallback(webhookPath));
    await bot.telegram.setWebhook(`${PUBLIC_URL}${webhookPath}`);
    console.log(`Webhook set to ${PUBLIC_URL}${webhookPath}`);
  } else {
    await bot.launch();
    console.log("Bot launched with long polling.");
  }

  app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
    console.log(`Mini App available at ${PUBLIC_URL || `http://localhost:${PORT}`}/miniapp/`);
  });
}

main();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));
