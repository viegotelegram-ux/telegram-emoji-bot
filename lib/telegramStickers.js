// lib/telegramStickers.js
//
// Creates an actual Telegram custom emoji sticker set (the kind shown in
// the "Share Emoji" panel) via the Bot API's createNewStickerSet, rather
// than just DMing image/tgs files. Uses Node's built-in fetch/FormData/Blob
// (Node 18+) to send the required multipart request directly, since this
// newer multi-sticker "InputSticker" shape isn't wrapped by every Telegram
// library version.
//
// Reference: https://core.telegram.org/bots/api#createnewstickerset

const BOT_API = "https://api.telegram.org/bot";

// A small rotation of generic unicode emoji used as the required
// "emoji_list" (1-20 emoji) Telegram uses to suggest each custom emoji in
// search/autocomplete. Since our packs are arbitrary illustrated designs
// without per-shape semantic meaning, we just rotate through a generic set.
const EMOJI_ROTATION = ["✨", "⭐", "❤️", "🔥", "🎉", "⚡", "🌟", "💎", "🎨", "🍀"];

function sanitizeBase(base) {
  const cleaned = base.replace(/[^a-zA-Z0-9_]/g, "");
  return cleaned || "pack";
}

/**
 * Build a valid, unique sticker set short name. Telegram requires:
 *  - only letters, digits, underscores
 *  - must end with "_by_<bot_username>" (case-insensitive)
 *  - max 64 characters total
 * We fold in the user's id and a timestamp so each generation gets its own
 * set (colors differ each time, and set names must be globally unique).
 */
function buildStickerSetName({ packId, userId, botUsername }) {
  const suffix = `_by_${botUsername}`;
  const base = sanitizeBase(`${packId}_${userId}_${Date.now()}`);
  const maxBaseLen = 64 - suffix.length;
  return `${base.slice(0, Math.max(1, maxBaseLen))}${suffix}`;
}

/**
 * Create a new custom emoji sticker set owned by the given Telegram user.
 * Telegram's createNewStickerSet only accepts the first batch (up to 50)
 * of stickers — for anything larger, call addStickerOne() afterward for
 * each remaining sticker.
 *
 * @param {object} opts
 * @param {string} opts.botToken
 * @param {number} opts.userId - must have started the bot at least once
 * @param {string} opts.name - from buildStickerSetName()
 * @param {string} opts.title - display title, max 64 chars
 * @param {Array<{buffer: Buffer, filename: string}>} opts.stickers - first batch, up to 50
 * @returns {Promise<object>} the Bot API result
 */
async function createCustomEmojiStickerSet({ botToken, userId, name, title, stickers }) {
  if (!stickers.length) throw new Error("No stickers provided");
  if (stickers.length > 50) throw new Error("Telegram allows at most 50 stickers in the initial createNewStickerSet call — use addStickerOne() for the rest");

  const form = new FormData();
  form.append("user_id", String(userId));
  form.append("name", name);
  form.append("title", title.slice(0, 64));
  form.append("sticker_type", "custom_emoji");

  const stickersMeta = stickers.map((s, i) => ({
    sticker: `attach://file${i}`,
    format: "animated",
    emoji_list: [EMOJI_ROTATION[i % EMOJI_ROTATION.length]],
  }));
  form.append("stickers", JSON.stringify(stickersMeta));

  stickers.forEach((s, i) => {
    form.append(`file${i}`, new Blob([s.buffer]), s.filename);
  });

  const res = await fetch(`${BOT_API}${botToken}/createNewStickerSet`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`createNewStickerSet failed: ${data.description || "unknown error"}`);
  }
  return data.result;
}

/**
 * Add one additional sticker to an existing set (used for everything past
 * the first 50 in a large pack). Uses a rotating index for the emoji_list
 * suggestion so every added sticker still gets one, matching the pattern
 * used for the initial batch.
 */
async function addStickerOne({ botToken, userId, name, buffer, filename, emojiIndex = 0 }) {
  const form = new FormData();
  form.append("user_id", String(userId));
  form.append("name", name);
  form.append(
    "sticker",
    JSON.stringify({
      sticker: "attach://file0",
      format: "animated",
      emoji_list: [EMOJI_ROTATION[emojiIndex % EMOJI_ROTATION.length]],
    })
  );
  form.append("file0", new Blob([buffer]), filename);

  const res = await fetch(`${BOT_API}${botToken}/addStickerToSet`, {
    method: "POST",
    body: form,
  });

  const data = await res.json();
  if (!data.ok) {
    throw new Error(`addStickerToSet failed for ${filename}: ${data.description || "unknown error"}`);
  }
  return data.result;
}

/**
 * The shareable deep link a user taps to add the pack to their own
 * custom emoji panel.
 */
function addEmojiPackLink(name) {
  return `https://t.me/addemoji/${name}`;
}

module.exports = { buildStickerSetName, createCustomEmojiStickerSet, addStickerOne, addEmojiPackLink };
