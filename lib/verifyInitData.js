// lib/verifyInitData.js
//
// Verifies the `initData` string that Telegram's Mini App JS SDK gives the
// frontend, using the algorithm described at:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
//
// This proves the request really came from Telegram for a specific user,
// and hasn't been tampered with — do this before trusting any user_id you
// get from the Mini App.

const crypto = require("crypto");

/**
 * @param {string} initData - the raw initData string from window.Telegram.WebApp.initData
 * @param {string} botToken - your bot token from BotFather
 * @param {number} maxAgeSeconds - reject initData older than this (default 24h)
 * @returns {{ok: true, user: object} | {ok: false, reason: string}}
 */
function verifyInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || typeof initData !== "string") {
    return { ok: false, reason: "missing_init_data" };
  }

  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash) return { ok: false, reason: "missing_hash" };

  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto
    .createHmac("sha256", "WebAppData")
    .update(botToken)
    .digest();

  const computedHash = crypto
    .createHmac("sha256", secretKey)
    .update(dataCheckString)
    .digest("hex");

  if (computedHash !== hash) {
    return { ok: false, reason: "bad_signature" };
  }

  const authDate = Number(params.get("auth_date"));
  if (authDate && Date.now() / 1000 - authDate > maxAgeSeconds) {
    return { ok: false, reason: "expired" };
  }

  let user = null;
  try {
    user = JSON.parse(params.get("user"));
  } catch {
    return { ok: false, reason: "bad_user_payload" };
  }

  return { ok: true, user };
}

module.exports = { verifyInitData };
