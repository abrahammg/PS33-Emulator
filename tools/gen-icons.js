/* Generates the PS·33 app icons as PNGs, with zero dependencies.
 * A framed cartographic cross-hair on paper — the same ⌖ mark as the splash.
 *
 *   node tools/gen-icons.js
 *
 * Emits icon-192.png, icon-512.png, icon-maskable-512.png, apple-touch-icon.png
 * into the repository root. Re-run if you restyle the mark.
 */
'use strict';
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const PAPER = [0xE6, 0xE2, 0xD6];
const INK   = [0x23, 0x25, 0x1F];
const ACC   = [0xBC, 0x3A, 0x18];
const SS = 4; // supersampling factor → antialiasing

function render(size, { frame = true, scale = 1 } = {}) {
  const N = size * SS;
  const px = Buffer.alloc(N * N * 4);
  const c = N / 2;
  const r   = 0.30 * N * scale;
  const ring = Math.max(SS, 0.015 * N);
  const barW = Math.max(SS, 0.013 * N);
  const barL = 0.44 * N * scale;
  const dotR = 0.055 * N * scale;
  const m  = 0.075 * N;                 // frame margin
  const fw = Math.max(SS, 0.016 * N);   // frame thickness

  const put = (i, rgb) => { px[i] = rgb[0]; px[i+1] = rgb[1]; px[i+2] = rgb[2]; px[i+3] = 255; };

  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const i = (y * N + x) * 4;
      let col = PAPER;

      if (frame) {
        const onV = (x >= m && x < m + fw) || (x >= N - m - fw && x < N - m);
        const onH = (y >= m && y < m + fw) || (y >= N - m - fw && y < N - m);
        const inside = x >= m && x <= N - m && y >= m && y <= N - m;
        if (inside && (onV || onH)) col = INK;
      }

      const dx = x + 0.5 - c, dy = y + 0.5 - c;
      const dist = Math.hypot(dx, dy);
      if (Math.abs(dist - r) <= ring) col = INK;
      if (Math.abs(dy) <= barW && Math.abs(dx) <= barL) col = INK;
      if (Math.abs(dx) <= barW && Math.abs(dy) <= barL) col = INK;
      if (dist <= dotR) col = ACC;

      put(i, col);
    }
  }
  return downsample(px, N, size);
}

function downsample(px, N, size) {
  const out = Buffer.alloc(size * size * 4);
  for (let oy = 0; oy < size; oy++) {
    for (let ox = 0; ox < size; ox++) {
      let r = 0, g = 0, b = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          const i = (((oy * SS + sy) * N) + (ox * SS + sx)) * 4;
          r += px[i]; g += px[i+1]; b += px[i+2];
        }
      }
      const n = SS * SS, o = (oy * size + ox) * 4;
      out[o] = Math.round(r / n); out[o+1] = Math.round(g / n);
      out[o+2] = Math.round(b / n); out[o+3] = 255;
    }
  }
  return out;
}

/* ── minimal PNG encoder ── */
const CRC = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, size) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit, RGBA
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const ROOT = path.join(__dirname, '..');
const jobs = [
  ['icon-192.png',          192, {}],
  ['icon-512.png',          512, {}],
  ['icon-maskable-512.png', 512, { frame: false, scale: 0.78 }],
  ['apple-touch-icon.png',  180, {}],
];
for (const [name, size, opts] of jobs) {
  fs.writeFileSync(path.join(ROOT, name), encodePNG(render(size, opts), size));
  console.log('wrote', name);
}
