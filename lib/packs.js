// lib/packs.js
//
// Defines the emoji "packs" available in the Mini App. Each shape is an SVG
// template with a {{COLOR}} placeholder that gets swapped for the user's
// chosen hex code at generation time (see lib/recolor.js).
//
// To add a new pack: add an entry to PACKS with an id, name, description,
// price (in cents, stubbed for now), and a list of shapes (each shape has
// an id, label, and svg template).

const SIZE = 100; // Telegram custom emoji / sticker target size (100x100 px)

function svgWrap(inner) {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">${inner}</svg>`;
}

const SHAPES = {
  circle: svgWrap(`<circle cx="50" cy="50" r="42" fill="{{COLOR}}"/>`),
  square: svgWrap(`<rect x="10" y="10" width="80" height="80" rx="8" fill="{{COLOR}}"/>`),
  roundedSquare: svgWrap(`<rect x="8" y="8" width="84" height="84" rx="24" fill="{{COLOR}}"/>`),
  triangle: svgWrap(`<polygon points="50,8 92,88 8,88" fill="{{COLOR}}"/>`),
  star: svgWrap(`<polygon points="50,5 61,37 96,37 68,58 79,91 50,71 21,91 32,58 4,37 39,37" fill="{{COLOR}}"/>`),
  heart: svgWrap(`<path d="M50 88 C 15 65, 5 40, 22 22 C 35 9, 50 20, 50 32 C 50 20, 65 9, 78 22 C 95 40, 85 65, 50 88 Z" fill="{{COLOR}}"/>`),
  diamond: svgWrap(`<polygon points="50,5 90,50 50,95 10,50" fill="{{COLOR}}"/>`),
  hexagon: svgWrap(`<polygon points="50,5 90,27 90,73 50,95 10,73 10,27" fill="{{COLOR}}"/>`),
  pentagon: svgWrap(`<polygon points="50,5 92,37 76,90 24,90 8,37" fill="{{COLOR}}"/>`),
  drop: svgWrap(`<path d="M50 5 C 65 30, 88 55, 88 72 A 38 38 0 1 1 12 72 C 12 55, 35 30, 50 5 Z" fill="{{COLOR}}"/>`),
  moon: svgWrap(`<path d="M62 6 A 46 46 0 1 0 62 94 A 38 38 0 1 1 62 6 Z" fill="{{COLOR}}"/>`),
  cloud: svgWrap(`<path d="M25 70 A 18 18 0 0 1 25 34 A 22 22 0 0 1 68 26 A 18 18 0 0 1 72 70 Z" fill="{{COLOR}}"/>`),
  sparkle: svgWrap(`<path d="M50 2 C 52 35, 65 48, 98 50 C 65 52, 52 65, 50 98 C 48 65, 35 52, 2 50 C 35 48, 48 35, 50 2 Z" fill="{{COLOR}}"/>`),
  ring: svgWrap(`<circle cx="50" cy="50" r="38" fill="none" stroke="{{COLOR}}" stroke-width="14"/>`),
  dotSmall: svgWrap(`<circle cx="50" cy="50" r="18" fill="{{COLOR}}"/>`),
  dotLarge: svgWrap(`<circle cx="50" cy="50" r="46" fill="{{COLOR}}"/>`),
  crescentDot: svgWrap(`<circle cx="50" cy="50" r="30" fill="{{COLOR}}"/><circle cx="62" cy="38" r="10" fill="white" opacity="0.001"/>`),
  flag: svgWrap(`<rect x="20" y="6" width="6" height="88" fill="{{COLOR}}"/><path d="M26 10 H86 L74 26 L86 42 H26 Z" fill="{{COLOR}}" opacity="0.85"/>`),
};

const PACKS = [
  {
    id: "solid-shapes",
    name: "Solid Shapes",
    description: "The essential 8: circle, square, triangle, star, heart, diamond, hexagon, pentagon.",
    priceCents: 199,
    shapes: ["circle", "square", "triangle", "star", "heart", "diamond", "hexagon", "pentagon"],
  },
  {
    id: "rounded-icons",
    name: "Rounded Icons",
    description: "Soft, friendly icon set: rounded square, blob-style drop, cloud, moon, and sparkle.",
    priceCents: 249,
    shapes: ["roundedSquare", "drop", "cloud", "moon", "sparkle"],
  },
  {
    id: "status-dots",
    name: "Status Dots",
    description: "Minimal dots and rings for status indicators, tags, and reactions.",
    priceCents: 149,
    shapes: ["dotSmall", "dotLarge", "ring", "crescentDot"],
  },
  {
    id: "flags-and-markers",
    name: "Flags & Markers",
    description: "Flag and marker glyphs, handy for pinning or labelling messages.",
    priceCents: 149,
    shapes: ["flag", "diamond", "dotSmall"],
  },
];

function getPack(packId) {
  return PACKS.find((p) => p.id === packId) || null;
}

function getShapeSvgTemplate(shapeId) {
  return SHAPES[shapeId] || null;
}

module.exports = { PACKS, SHAPES, getPack, getShapeSvgTemplate, SIZE };
