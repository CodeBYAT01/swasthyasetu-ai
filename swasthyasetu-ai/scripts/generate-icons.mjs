// Generates simple PNG app icons without external dependencies (Node zlib only).
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n += 1) {
    let c = n;
    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i += 1) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])));
  return Buffer.concat([len, typeBuf, data, crc]);
}

function rounded(x, y, w, h, r) {
  const cx = Math.min(Math.max(x, r), w - r);
  const cy = Math.min(Math.max(y, r), h - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

function makePng(size) {
  const radius = Math.round(size * 0.22);
  const raw = Buffer.alloc(size * (size * 4 + 1));
  let p = 0;
  for (let y = 0; y < size; y += 1) {
    raw[p++] = 0;
    for (let x = 0; x < size; x += 1) {
      let r = 15, g = 118, b = 110; // #0F766E
      if (!rounded(x, y, size, size, radius)) {
        r = 248; g = 250; b = 252;
      } else {
        const vBar = x > size * 0.44 && x < size * 0.56 && y > size * 0.26 && y < size * 0.74;
        const hBar = y > size * 0.44 && y < size * 0.56 && x > size * 0.26 && x < size * 0.74;
        if (vBar || hBar) { r = 255; g = 255; b = 255; }
        const dx = x - size * 0.78;
        const dy = y - size * 0.26;
        if (dx * dx + dy * dy < (size * 0.052) ** 2) { r = 56; g = 189; b = 248; }
      }
      raw[p++] = r; raw[p++] = g; raw[p++] = b; raw[p++] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = resolve('public/icons');
mkdirSync(outDir, { recursive: true });
for (const size of [192, 512]) {
  const target = resolve(outDir, `icon-${size}.png`);
  writeFileSync(target, makePng(size));
  console.log(`wrote ${target}`);
}
