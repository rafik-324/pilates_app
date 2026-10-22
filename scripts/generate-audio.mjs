// Erzeugt Platzhalter-Audio (lizenzfrei, synthetisch): ruhige Hintergrundmusik als Schleife und
// einen kurzen Signalton für die letzten 3 Sekunden. Ersatz durch echte Dateien ohne Codeänderung.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RATE = 22050;

function wav(samples) {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((v, i) =>
    data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, v)) * 32767), i * 2),
  );
  const h = Buffer.alloc(44);
  h.write('RIFF', 0);
  h.writeUInt32LE(36 + data.length, 4);
  h.write('WAVE', 8);
  h.write('fmt ', 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(RATE, 24);
  h.writeUInt32LE(RATE * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write('data', 36);
  h.writeUInt32LE(data.length, 40);
  return Buffer.concat([h, data]);
}

// Musik: vier Akkorde à 4 s, weiche Hüllkurve, nahtlos wiederholbar (16 s)
const chords = [
  [220.0, 277.18, 329.63],
  [196.0, 246.94, 293.66],
  [174.61, 220.0, 261.63],
  [196.0, 246.94, 329.63],
];
const seg = 4 * RATE;
const music = new Float32Array(seg * chords.length);
chords.forEach((freqs, c) => {
  for (let i = 0; i < seg; i++) {
    const t = i / RATE;
    const env = Math.sin((Math.PI * i) / seg) ** 1.5;
    let v = 0;
    for (const f of freqs) v += Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t);
    music[c * seg + i] = (v / (freqs.length * 1.3)) * env * 0.35;
  }
});
writeFileSync(path.join(root, 'assets/audio/music.wav'), wav(music));

// Signalton: 880 Hz, 150 ms
const beepLen = Math.round(0.15 * RATE);
const beep = new Float32Array(beepLen);
for (let i = 0; i < beepLen; i++) {
  const env = Math.min(1, i / 200, (beepLen - i) / 400);
  beep[i] = Math.sin((2 * Math.PI * 880 * i) / RATE) * env * 0.6;
}
writeFileSync(path.join(root, 'assets/audio/beep.wav'), wav(beep));
console.log('assets/audio/music.wav und beep.wav erzeugt');
