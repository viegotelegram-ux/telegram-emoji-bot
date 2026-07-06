// lib/packs.js
//
// Defines the emoji "packs" available in the Mini App. Each shape is an SVG
// template with {{PRIMARY}} and {{SECONDARY}} placeholders that get swapped
// for the user's chosen colors at generation time (see lib/recolor.js).
//
// PRIMARY = the shape's fill color (the main icon color).
// SECONDARY = a thin outline color drawn around the shape, giving the
// two-tone look shown in the Mini App's Customize screen. Shapes that are
// stroke-only (like "ring") use PRIMARY for their own stroke instead.
//
// To add a new pack: add an entry to PACKS with an id, name, description,
// price (in cents, stubbed for now), and a list of shapes (each shape has
// an id, label, and svg template).

const SIZE = 100; // Telegram custom emoji / sticker target size (100x100 px)

function svgWrap(inner) {
  // The outer <g> applies SECONDARY as a stroke to every child that doesn't
  // set its own stroke — giving each shape a thin outline in the secondary
  // color, while PRIMARY fills the shape itself.
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}"><g stroke="{{SECONDARY}}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round">${inner}</g></svg>`;
}

const SHAPES = {
  circle: svgWrap(`<circle cx="50" cy="50" r="40" fill="{{PRIMARY}}"/>`),
  square: svgWrap(`<rect x="12" y="12" width="76" height="76" rx="8" fill="{{PRIMARY}}"/>`),
  roundedSquare: svgWrap(`<rect x="10" y="10" width="80" height="80" rx="24" fill="{{PRIMARY}}"/>`),
  triangle: svgWrap(`<polygon points="50,10 90,86 10,86" fill="{{PRIMARY}}"/>`),
  star: svgWrap(`<polygon points="50,7 60,37 94,37 67,57 77,90 50,70 23,90 33,57 6,37 40,37" fill="{{PRIMARY}}"/>`),
  heart: svgWrap(`<path d="M50 86 C 17 64, 7 40, 23 23 C 35 11, 50 21, 50 33 C 50 21, 65 11, 77 23 C 93 40, 83 64, 50 86 Z" fill="{{PRIMARY}}"/>`),
  diamond: svgWrap(`<polygon points="50,8 88,50 50,92 12,50" fill="{{PRIMARY}}"/>`),
  hexagon: svgWrap(`<polygon points="50,8 88,28 88,72 50,92 12,72 12,28" fill="{{PRIMARY}}"/>`),
  pentagon: svgWrap(`<polygon points="50,8 90,37 74,88 26,88 10,37" fill="{{PRIMARY}}"/>`),
  drop: svgWrap(`<path d="M50 8 C 64 32, 86 55, 86 71 A 36 36 0 1 1 14 71 C 14 55, 36 32, 50 8 Z" fill="{{PRIMARY}}"/>`),
  moon: svgWrap(`<path d="M60 8 A 44 44 0 1 0 60 92 A 36 36 0 1 1 60 8 Z" fill="{{PRIMARY}}"/>`),
  cloud: svgWrap(`<path d="M26 68 A 17 17 0 0 1 26 35 A 21 21 0 0 1 67 27 A 17 17 0 0 1 71 68 Z" fill="{{PRIMARY}}"/>`),
  sparkle: svgWrap(`<path d="M50 4 C 52 34, 64 46, 96 50 C 64 54, 52 66, 50 96 C 48 66, 36 54, 4 50 C 36 46, 48 34, 50 4 Z" fill="{{PRIMARY}}"/>`),
  ring: svgWrap(`<circle cx="50" cy="50" r="36" fill="none" stroke="{{PRIMARY}}" stroke-width="13"/>`),
  dotSmall: svgWrap(`<circle cx="50" cy="50" r="17" fill="{{PRIMARY}}"/>`),
  dotLarge: svgWrap(`<circle cx="50" cy="50" r="44" fill="{{PRIMARY}}"/>`),
  crescentDot: svgWrap(`<circle cx="50" cy="50" r="29" fill="{{PRIMARY}}"/>`),
  flag: svgWrap(`<rect x="22" y="8" width="6" height="84" fill="{{PRIMARY}}"/><path d="M28 12 H84 L72 27 L84 42 H28 Z" fill="{{PRIMARY}}" opacity="0.85"/>`),
};

const CROSSEY_SHAPE_IDS = Array.from({ length: 132 }, (_, i) => `crossey-${i + 1}`);

const PACKS = [
  {
    id: "crossey-pack",
    name: "Crossey Pack",
    description: "132 animated emoji from the Crossey pack, recolored to any hex you like.",
    priceCents: 0,
    kind: "tgs",
    shapes: CROSSEY_SHAPE_IDS,
  },
  {
    id: "solid-shapes",
    name: "Solid Shapes",
    description: "The essential 8: circle, square, triangle, star, heart, diamond, hexagon, pentagon.",
    priceCents: 199,
    kind: "svg",
    shapes: ["circle", "square", "triangle", "star", "heart", "diamond", "hexagon", "pentagon"],
  },
  {
    id: "rounded-icons",
    name: "Rounded Icons",
    description: "Soft, friendly icon set: rounded square, blob-style drop, cloud, moon, and sparkle.",
    priceCents: 249,
    kind: "svg",
    shapes: ["roundedSquare", "drop", "cloud", "moon", "sparkle"],
  },
  {
    id: "status-dots",
    name: "Status Dots",
    description: "Minimal dots and rings for status indicators, tags, and reactions.",
    priceCents: 149,
    kind: "svg",
    shapes: ["dotSmall", "dotLarge", "ring", "crescentDot"],
  },
  {
    id: "flags-and-markers",
    name: "Flags & Markers",
    description: "Flag and marker glyphs, handy for pinning or labelling messages.",
    priceCents: 149,
    kind: "svg",
    shapes: ["flag", "diamond", "dotSmall"],
  },
];

const path = require("path");

function getTgsAssetPath(shapeId) {
  return path.join(__dirname, "..", "assets", "tgs", `${shapeId}.tgs`);
}

function getPack(packId) {
  return PACKS.find((p) => p.id === packId) || null;
}

function getShapeSvgTemplate(shapeId) {
  return SHAPES[shapeId] || null;
}

module.exports = { PACKS, SHAPES, getPack, getShapeSvgTemplate, getTgsAssetPath, SIZE };
