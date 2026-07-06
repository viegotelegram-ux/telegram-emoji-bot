// lib/lottieRecolor.js
//
// Recolors a real .tgs (gzip-compressed Lottie JSON) animation to a chosen
// primary/secondary hex pair, preserving the original shading/highlights.
//
// Unlike lib/recolor.js (which swaps a single flat {{COLOR}} in a simple
// SVG template), real illustrated stickers use several shades of one base
// color plus black outlines and white highlights. Flattening those to one
// color would destroy the shading, so instead we classify each color found
// in the animation:
//
//   - near-black  -> replaced with the SECONDARY color (outlines/shading)
//   - near-white  -> left untouched (highlights/shine stay white)
//   - everything else (the chromatic base color + its shaded variants)
//        -> hue-rotated to the PRIMARY color's hue, keeping each color's
//           own saturation and lightness so the shading relationship
//           between the base color and its shadow tone is preserved.

const zlib = require("zlib");

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(hex) {
  if (typeof hex !== "string") return null;
  const trimmed = hex.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

function hexToRgb01(hex) {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

function rgbToHsl(r, g, b) {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h, s;
  const l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h, s, l) {
  if (s === 0) return [l, l, l];
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [hue2rgb(p, q, h + 1 / 3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1 / 3)];
}

/**
 * Given an [r,g,b,(a)] array in 0-1 floats, return a recolored copy.
 */
function recolorRgbaArray(rgba, primaryHsl, secondaryRgb) {
  const [r, g, b] = rgba;
  const [, , l] = rgbToHsl(r, g, b);
  const alpha = rgba.length > 3 ? rgba[3] : 1;

  // Near-black -> secondary
  if (l < 0.12) {
    return [...secondaryRgb, alpha];
  }
  // Near-white -> leave untouched (keep highlights white)
  if (l > 0.88) {
    return [...rgba];
  }
  // Chromatic mid-tone -> hue-rotate to primary's hue, keep own S/L
  const [, s] = rgbToHsl(r, g, b);
  const [nr, ng, nb] = hslToRgb(primaryHsl[0], s, l);
  return [nr, ng, nb, alpha];
}

function isColorArray(k) {
  return Array.isArray(k) && k.length >= 3 && k.length <= 4 && k.every((x) => typeof x === "number");
}

/**
 * Recursively walk a Lottie JSON tree, recoloring any fill ("fl") or
 * stroke ("st") color property found, including animated color keyframes.
 */
function walkAndRecolor(node, primaryHsl, secondaryRgb) {
  if (Array.isArray(node)) {
    for (const item of node) walkAndRecolor(item, primaryHsl, secondaryRgb);
    return;
  }
  if (node && typeof node === "object") {
    if ((node.ty === "fl" || node.ty === "st") && node.c && "k" in node.c) {
      const k = node.c.k;
      if (isColorArray(k)) {
        node.c.k = recolorRgbaArray(k, primaryHsl, secondaryRgb);
      } else if (Array.isArray(k)) {
        // Animated color: array of keyframe objects, each with s/e color arrays
        for (const frame of k) {
          if (frame && isColorArray(frame.s)) frame.s = recolorRgbaArray(frame.s, primaryHsl, secondaryRgb);
          if (frame && isColorArray(frame.e)) frame.e = recolorRgbaArray(frame.e, primaryHsl, secondaryRgb);
        }
      }
    }
    for (const key of Object.keys(node)) {
      walkAndRecolor(node[key], primaryHsl, secondaryRgb);
    }
  }
}

/**
 * Recolor a parsed Lottie JSON object in place and return it.
 */
function recolorLottieJson(data, primaryHex, secondaryHex) {
  const primary = normalizeHex(primaryHex);
  const secondary = normalizeHex(secondaryHex) || "#000000";
  if (!primary) throw new Error(`Invalid primary hex: ${primaryHex}`);

  const primaryRgb = hexToRgb01(primary);
  const primaryHsl = rgbToHsl(...primaryRgb);
  const secondaryRgb = hexToRgb01(secondary);

  walkAndRecolor(data, primaryHsl, secondaryRgb);
  return data;
}

/**
 * Decompress a .tgs Buffer into its parsed Lottie JSON object (no recolor).
 */
function tgsBufferToJson(buffer) {
  const raw = zlib.gunzipSync(buffer);
  return JSON.parse(raw.toString("utf8"));
}

/**
 * Decompress + recolor a .tgs Buffer, returning the plain (uncompressed)
 * Lottie JSON object — used for live preview in the Mini App, where the
 * browser plays the animation directly via lottie-web.
 */
function tgsBufferToRecoloredJson(buffer, primaryHex, secondaryHex) {
  const data = tgsBufferToJson(buffer);
  return recolorLottieJson(data, primaryHex, secondaryHex);
}

/**
 * Decompress + recolor a .tgs Buffer, returning a new gzip-compressed
 * .tgs Buffer — used when actually delivering the file to the user.
 */
function tgsBufferToRecoloredTgsBuffer(buffer, primaryHex, secondaryHex) {
  const data = tgsBufferToRecoloredJson(buffer, primaryHex, secondaryHex);
  const json = JSON.stringify(data);
  return zlib.gzipSync(Buffer.from(json, "utf8"), { level: 9 });
}

module.exports = {
  normalizeHex,
  recolorLottieJson,
  tgsBufferToJson,
  tgsBufferToRecoloredJson,
  tgsBufferToRecoloredTgsBuffer,
};
