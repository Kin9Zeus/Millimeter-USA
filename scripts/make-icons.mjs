// Generates favicons, PWA icons and the Open Graph image from the official logo and the home hero still.
// Usage: node scripts/make-icons.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const svg = fs.readFileSync('logo/logo-blanco.svg', 'utf8');
const d = svg.match(/ d="([^"]+)"/)[1];
// First sub-path of the wordmark is the "M" glyph (roughly x 0–122, y 0–92).
const mPath = d.slice(0, d.indexOf('m124 0'));
const INK = '#12100d', COPPER = '#c8915a', BONE = '#edeae4';

const icon = (bg, fg, pad = 0.2, rounded = true) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" ${rounded ? 'rx="96"' : ''} fill="${bg}"/>
  <g transform="translate(${512 * pad} ${(512 - (512 * (1 - 2 * pad)) * (92 / 122)) / 2}) scale(${(512 * (1 - 2 * pad)) / 122})">
    <path fill="${fg}" fill-rule="evenodd" d="${mPath}"/>
  </g>
  <rect x="${512 * pad}" y="420" width="${512 * (1 - 2 * pad)}" height="6" fill="${COPPER}"/>
</svg>`;

fs.mkdirSync('public', { recursive: true });
fs.writeFileSync('public/favicon.svg', icon(INK, BONE).trim());
const base = Buffer.from(icon(INK, BONE));
await sharp(base).resize(32, 32).png().toFile('public/favicon-32.png');
await sharp(Buffer.from(icon(INK, BONE, 0.2, false))).resize(180, 180).png().toFile('public/apple-touch-icon.png');
await sharp(base).resize(192, 192).png().toFile('public/icon-192.png');
await sharp(base).resize(512, 512).png().toFile('public/icon-512.png');
await sharp(Buffer.from(icon(INK, BONE, 0.28, false))).resize(512, 512).png().toFile('public/icon-maskable.png');
// .ico (32px PNG inside an ICO container)
const png32 = await sharp(base).resize(32, 32).png().toBuffer();
const header = Buffer.alloc(22);
header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(1, 4);
header.writeUInt8(32, 6); header.writeUInt8(32, 7); header.writeUInt8(0, 8); header.writeUInt8(0, 9);
header.writeUInt16LE(1, 10); header.writeUInt16LE(32, 12); header.writeUInt32LE(png32.length, 14); header.writeUInt32LE(22, 18);
fs.writeFileSync('public/favicon.ico', Buffer.concat([header, png32]));

// Open Graph image 1200×630, split like the home hero: wordmark on ink + the (portrait) hero photo in a
// full-height column on the right, so a vertical photograph is never upscaled into a horizontal frame.
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 856 213" width="520" height="129"><path fill="${BONE}" fill-rule="evenodd" d="${d}"/></svg>`;
const PHOTO_W = 470;
const overlay = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630">
  <defs><linearGradient id="g" x1="0" x2="1"><stop offset="0" stop-color="${INK}" stop-opacity="1"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient></defs>
  <rect x="${1200 - PHOTO_W}" width="90" height="630" fill="url(#g)"/>
  <g stroke="${COPPER}" stroke-width="1.5">
    <line x1="72" y1="430" x2="592" y2="430"/>
    ${Array.from({ length: 27 }, (_, i) => `<line x1="${72 + i * 20}" y1="430" x2="${72 + i * 20}" y2="${i % 5 === 0 ? 444 : 437}"/>`).join('')}
  </g>
</svg>`;
fs.mkdirSync('public/og', { recursive: true });
const photo = await sharp('src/assets/heroes/home.jpg').resize(PHOTO_W, 630, { fit: 'cover', position: 'centre' }).toBuffer();
await sharp({ create: { width: 1200, height: 630, channels: 3, background: INK } })
  .composite([
    { input: photo, top: 0, left: 1200 - PHOTO_W },
    { input: Buffer.from(overlay), top: 0, left: 0 },
    { input: Buffer.from(logo), top: 250, left: 72 },
  ])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile('public/og/millimeter.jpg');
console.log('icons + og generated');
