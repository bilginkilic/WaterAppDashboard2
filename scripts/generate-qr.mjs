// Generates the QR codes used on /download. Run: node scripts/generate-qr.mjs
// Output is committed under public/qr, so the site needs no runtime QR dependency.
import QRCode from 'qrcode';
import { mkdir } from 'fs/promises';

const SITE = process.env.SITE_URL || 'https://waterappdaily.netlify.app';
const targets = {
  ios: 'https://apps.apple.com/tr/app/waterapp-v2/id6745251786',
  android: `${SITE}/download#android`,
  download: `${SITE}/download`,
};

const opts = { errorCorrectionLevel: 'M', margin: 2, color: { dark: '#0f172a', light: '#ffffff' } };

await mkdir('public/qr', { recursive: true });
for (const [name, url] of Object.entries(targets)) {
  await QRCode.toFile(`public/qr/${name}.svg`, url, { ...opts, type: 'svg' });
  console.log(`public/qr/${name}.svg -> ${url}`);
}
// High-resolution PNG of the page QR for posters and slides.
await QRCode.toFile('public/qr/download.png', targets.download, { ...opts, type: 'png', width: 1200 });
console.log('public/qr/download.png (1200px)');
