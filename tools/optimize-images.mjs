#!/usr/bin/env node
// Gera as imagens otimizadas que vão para o deploy a partir dos originais em
// assets-src/images (fora de src/, portanto nunca enviados ao Neocities).
//
// Uso:  npm run optimize:images
//
// Referências que dependem desta saída (mantenha em sincronia ao renomear):
//   src/index.html, src/results.html, src/br/index.html, src/br/results.html -> logo.webp, og_thumb.jpg
//   src/data/wsj_mascots.json, src/br/data/wsj_mascots.json                  -> mascots/*.webp
//   src/css/style.css, src/css/reveal.css                                    -> bg.webp
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINALS = join(ROOT, 'assets-src', 'images');
const TREES = ['src/assets/images', 'src/br/assets/images'].map((dir) => join(ROOT, dir));

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

// O fundo é usado como background-size: 820px (src/css/style.css) — 1100px cobre
// telas 1x com folga e continua aceitável em 2x, sem os 3000px originais.
const jobs = [
  {
    id: 'bg.webp',
    from: 'bg.webp',
    to: 'bg.webp',
    encode: (img) => img.resize({ width: 1100, withoutEnlargement: true }).webp({ quality: 70, effort: 6 }),
  },
  {
    // O logo é renderizado com height: 120px (src/css/style.css:99), então 240px
    // cobre 2x. O original é 500x500 com 300 KB.
    id: 'logo.webp',
    from: 'logo.png',
    to: 'logo.webp',
    encode: (img) => img.resize({ width: 240, height: 240, fit: 'inside' }).webp({ quality: 88, effort: 6 }),
  },
  {
    // Open Graph: JPEG progressivo em vez de PNG 835 KB; formato aceito por todos
    // os crawlers que leem og:image / twitter:image.
    id: 'og_thumb.jpg',
    from: 'og_thumb.png',
    to: 'og_thumb.jpg',
    encode: (img) => img.resize({ width: 1200, height: 630, fit: 'cover' }).jpeg({ quality: 80, mozjpeg: true, progressive: true }),
  },
];

async function sizeOf(file) {
  return existsSync(file) ? (await stat(file)).size : 0;
}

// Tamanho de antes é sempre o do original em assets-src: rodar o script de novo
// não deve inflar a coluna "antes" com a própria saída anterior.
async function sizeBefore(original) {
  return sizeOf(original);
}

const rows = [];

for (const job of jobs) {
  const input = join(ORIGINALS, job.from);
  if (!existsSync(input)) throw new Error(`original ausente: ${relative(ROOT, input)}`);
  const digest = await job.encode(sharp(input)).toBuffer();
  for (const tree of TREES) {
    const out = join(tree, job.to);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, digest);
    rows.push({ file: relative(ROOT, out), before: await sizeBefore(input), after: digest.length });
  }
}

const mascotDir = join(ORIGINALS, 'mascots');
const mascots = (await readdir(mascotDir)).filter((name) => name.endsWith('.png')).sort();

for (const name of mascots) {
  const input = join(mascotDir, name);
  const digest = await sharp(input)
    .resize({ width: 420, height: 420, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80, effort: 6 })
    .toBuffer();
  const outName = `${name.replace(/\.png$/, '')}.webp`;
  for (const tree of TREES) {
    const out = join(tree, 'mascots', outName);
    await mkdir(dirname(out), { recursive: true });
    await writeFile(out, digest);
    rows.push({ file: relative(ROOT, out), before: await sizeBefore(input), after: digest.length });
  }
}

const width = Math.max(...rows.map((row) => row.file.length));
const before = rows.reduce((sum, row) => sum + row.before, 0);
const after = rows.reduce((sum, row) => sum + row.after, 0);

for (const row of rows) {
  const delta = row.before ? `-${Math.round((1 - row.after / row.before) * 100)}%` : 'novo';
  console.log(`${row.file.padEnd(width)}  ${kb(row.before).padStart(9)} -> ${kb(row.after).padStart(9)}  ${delta}`);
}
console.log(`\n${rows.length} arquivos  ${kb(before)} -> ${kb(after)}  (-${Math.round((1 - after / before) * 100)}%)`);
