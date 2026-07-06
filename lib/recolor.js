// lib/recolor.js
//
// Turns an SVG template + primary/secondary hex colors into a rasterized
// PNG buffer, and helpers for building a full recolored emoji pack.

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
 * Recolor a single shape template to the given primary/secondary hex pair
 * and rasterize it to PNG. Returns a Buffer.
 */
async function recolorShapeToPng(shapeId, primaryHex, secondaryHex, size = SIZE) {
  const template = getShapeSvgTemplate(shapeId);
  if (!template) throw new Error(`Unknown shape: ${shapeId}`);

  const primary = normalizeHex(primaryHex);
  if (!primary) throw new Error(`Invalid primary hex color: ${primaryHex}`);

  const secondary = normalizeHex(secondaryHex) || "#000000";

  const svg = template
    .replaceAll("{{PRIMARY}}", primary)
    .replaceAll("{{SECONDARY}}", secondary);

  const png = await sharp(Buffer.from(svg))
    .resize(size, size)
    .png()
    .toBuffer();

  return png;
}

/**
 * Generate every shape in a pack, recolored to the given primary/secondary
 * hex pair. Returns an array of { shapeId, filename, buffer }.
 */
async function generatePackImages(packId, primaryHex, secondaryHex) {
  const pack = getPack(packId);
  if (!pack) throw new Error(`Unknown pack: ${packId}`);

  const primary = normalizeHex(primaryHex);
  if (!primary) throw new Error(`Invalid primary hex color: ${primaryHex}`);

  const secondary = normalizeHex(secondaryHex) || "#000000";

  const images = await Promise.all(
    pack.shapes.map(async (shapeId) => {
      const buffer = await recolorShapeToPng(shapeId, primary, secondary);
      return {
        shapeId,
        filename: `${pack.id}-${shapeId}-${primary.replace("#", "")}-${secondary.replace("#", "")}.png`,
        buffer,
      };
    })
  );

  return { pack, primary, secondary, images };
}

module.exports = { normalizeHex, recolorShapeToPng, generatePackImages };
