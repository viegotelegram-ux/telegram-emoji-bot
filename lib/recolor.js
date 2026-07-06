// lib/recolor.js
//
// Turns an SVG template + a hex color into a rasterized PNG buffer, and
// helpers for building a full recolored emoji pack.

const sharp = require("sharp");
const { getPack, getShapeSvgTemplate, SIZE } = require("./packs");

const HEX_RE = /^#?[0-9a-fA-F]{6}$/;

function normalizeHex(hex) {
  if (typeof hex !== "string") return null;
  const trimmed = hex.trim();
  if (!HEX_RE.test(trimmed)) return null;
  return trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
}

/**
 * Recolor a single shape template to the given hex and rasterize it to PNG.
 * Returns a Buffer.
 */
async function recolorShapeToPng(shapeId, hex, size = SIZE) {
  const template = getShapeSvgTemplate(shapeId);
  if (!template) throw new Error(`Unknown shape: ${shapeId}`);

  const color = normalizeHex(hex);
  if (!color) throw new Error(`Invalid hex color: ${hex}`);

  const svg = template.replaceAll("{{COLOR}}", color);

  const png = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();

  return png;
}

/**
 * Generate every shape in a pack, recolored to the given hex.
 * Returns an array of { shapeId, filename, buffer }.
 */
async function generatePackImages(packId, hex) {
  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown pack: ${packId}`);

  const color = normalizeHex(hex);
  if (!color) throw new Error(`Invalid hex color: ${hex}`);

  const images = await Promise.all(
    pack.shapes.map(async (shapeId) => {
      const buffer = await recolorShapeToPng(shapeId, color);
      return {
        shapeId,
        filename: `${pack.id}-${shapeId}-${color.replace("#", "")}.png`,
        buffer,
      };
    })
  );

  return { pack, color, images };
}

module.exports = { normalizeHex, recolorShapeToPng, generatePackImages };
