#!/usr/bin/env node
/**
 * Erzeugt Platzhalter-Medien und die Zuordnungsdatei src/data/content/media.generated.ts.
 *
 * - assets/content/thumbs/<id>.jpg: Graustufen-Fläche mit Übungsname (512 x 512), nur wenn noch keine Datei existiert
 *   (echte Thumbnails mit gleichem Namen bleiben erhalten). Mit --force werden Platzhalter neu erzeugt.
 * - assets/content/videos/placeholder.mp4: kleines gemeinsames Loop-Video (benötigt ffmpeg, nur wenn es fehlt)
 * - src/data/content/media.generated.ts: ID -> require(...). Bevorzugt videos/<id>.mp4, sonst den Platzhalter.
 *
 * Ersatz durch echte Videos: Datei als assets/content/videos/<id>.mp4 ablegen und dieses Skript erneut ausführen.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const force = process.argv.includes('--force');
const exercises = JSON.parse(readFileSync(join(root, 'assets/content/exercises.json'), 'utf8'));
const thumbsDir = join(root, 'assets/content/thumbs');
const videosDir = join(root, 'assets/content/videos');
mkdirSync(thumbsDir, { recursive: true });
mkdirSync(videosDir, { recursive: true });

const SIZE = 512;
const shades = ['#EDEDED', '#E4E4E4', '#DBDBDB', '#D2D2D2'];

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(text, max) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max && line) {
      lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines;
}

function svgFor(ex, index) {
  const lines = wrap(ex.name.de, 16);
  const lineHeight = 52;
  const startY = SIZE / 2 - ((lines.length - 1) * lineHeight) / 2 + 14;
  const text = lines
    .map((l, i) => `<tspan x="50%" y="${startY + i * lineHeight}">${escapeXml(l)}</tspan>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SIZE}" height="${SIZE}">
  <rect width="100%" height="100%" fill="${shades[index % shades.length]}"/>
  <text x="50%" y="56" text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-size="22" fill="#6B6B6B">${escapeXml(ex.id.slice(0, 4).toUpperCase())}</text>
  <text text-anchor="middle" font-family="Inter, Helvetica, Arial, sans-serif" font-weight="700" font-size="44" fill="#0A0A0A">${text}</text>
</svg>`;
}

let made = 0;
for (const [i, ex] of exercises.entries()) {
  const file = join(thumbsDir, `${ex.id}.jpg`);
  if (existsSync(file) && !force) continue;
  await sharp(Buffer.from(svgFor(ex, i)))
    .jpeg({ quality: 80 })
    .toFile(file);
  made++;
}
console.log(`Thumbnails: ${made} neu erzeugt, ${exercises.length - made} vorhanden`);

const placeholder = join(videosDir, 'placeholder.mp4');
if (!existsSync(placeholder)) {
  try {
    execFileSync(
      'ffmpeg',
      [
        '-y',
        '-f',
        'lavfi',
        '-i',
        'color=c=0xDBDBDB:s=360x360:r=15:d=4',
        '-vf',
        "geq=lum='128+60*sin(2*PI*T/4)+X/20':cb=128:cr=128",
        '-an',
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-crf',
        '32',
        '-movflags',
        '+faststart',
        placeholder,
      ],
      { stdio: 'ignore' },
    );
    console.log('Platzhalter-Video erzeugt');
  } catch {
    console.error(
      'ffmpeg nicht verfügbar: assets/content/videos/placeholder.mp4 manuell bereitstellen',
    );
    process.exit(1);
  }
}

const lines = [
  '// AUTOMATISCH ERZEUGT von scripts/generate-placeholders.mjs. Nicht von Hand ändern.',
  '// Metro bündelt nur statische require-Pfade, deshalb gibt es diese Zuordnung.',
  "import type { ImageSourcePropType } from 'react-native';",
  '',
  'export type ExerciseMedia = { thumbnail: ImageSourcePropType; video: number };',
  '',
  'export const exerciseMedia: Record<string, ExerciseMedia> = {',
];
let realVideos = 0;
for (const ex of exercises) {
  const hasVideo = existsSync(join(videosDir, `${ex.id}.mp4`));
  if (hasVideo) realVideos++;
  const video = hasVideo ? `${ex.id}.mp4` : 'placeholder.mp4';
  lines.push(
    `  ${ex.id}: {`,
    `    thumbnail: require('../../../assets/content/thumbs/${ex.id}.jpg'),`,
    `    video: require('../../../assets/content/videos/${video}'),`,
    '  },',
  );
}
lines.push('};', '');
writeFileSync(join(root, 'src/data/content/media.generated.ts'), lines.join('\n'));
console.log(`media.generated.ts: ${exercises.length} Einträge, ${realVideos} echte Videos`);
