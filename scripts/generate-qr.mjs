#!/usr/bin/env node
/**
 * Regenerate QR codes in /public/qr/ from the URLs below.
 * Run with:  node scripts/generate-qr.mjs
 *
 * The QRs are deliberately Branded: maroon ink on ivory, with a saffron/gold
 * centre badge. Error-correction is H (30%) so the badge doesn't break scans.
 *
 * Edit DOMAIN below or set QR_DOMAIN=https://... when running.
 */
import { writeFile, mkdir } from 'node:fs/promises';
import QRCode from 'qrcode';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DOMAIN = process.env.QR_DOMAIN ?? 'https://somayagna.unityindivinity.com';

const TARGETS = {
  'site-qr':   `${DOMAIN}/`,
  'donate-qr': `${DOMAIN}/donate`
};

const COLOURS = {
  dark:  '#561414', // maroon
  light: '#FFFCF6'  // ivory
};

const root = path.dirname(fileURLToPath(import.meta.url));
const out  = path.join(root, '..', 'public', 'qr');
await mkdir(out, { recursive: true });

for (const [name, url] of Object.entries(TARGETS)) {
  // PNG (1024px, high error correction so a centre logo doesn't break it)
  const png = await QRCode.toBuffer(url, {
    errorCorrectionLevel: 'H',
    margin: 4,
    width: 1024,
    color: COLOURS
  });
  await writeFile(path.join(out, `${name}.png`), png);

  // SVG (vector — scales perfectly for print)
  const svg = await QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'H',
    margin: 4,
    color: COLOURS
  });
  await writeFile(path.join(out, `${name}.svg`), svg);

  console.log(`✓ ${name}: ${url}`);
}

const manifest = {
  generated: new Date().toISOString(),
  domain: DOMAIN,
  codes: [
    { key: 'site-qr',   url: TARGETS['site-qr'],   png: '/qr/site-qr.png',   svg: '/qr/site-qr.svg',
      purpose: 'Display on other websites / printed materials to open the SomaYagna London homepage.' },
    { key: 'donate-qr', url: TARGETS['donate-qr'], png: '/qr/donate-qr.png', svg: '/qr/donate-qr.svg',
      purpose: 'Share / print so devotees can scan to open the Donate page directly.' }
  ]
};
await writeFile(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 2));
console.log(`✓ manifest.json written`);
