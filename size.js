#!/usr/bin/env bun

import write from '@3-/write';
import zlib from 'node:zlib';
import { createGzip, createBrotliCompress } from 'node:zlib';
import { readdir, stat } from 'node:fs/promises';
import { createReadStream, createWriteStream } from 'node:fs';
import { join } from 'node:path';
import { compress as zstdCompress } from '@mongodb-js/zstd';
import { pipeline } from 'node:stream';
import { promisify } from 'node:util';

const pipe = promisify(pipeline);
const __dirname = import.meta.dirname;

const compressFile = async (inputPath, outputPath, compressStream) => {
  const source = createReadStream(inputPath);
  const destination = createWriteStream(outputPath);
  await pipe(source, compressStream, destination);
};

const compressZstd = async (inputPath, outputPath) => {
  const source = createReadStream(inputPath);
  const chunks = [];

  for await (const chunk of source) {
    chunks.push(chunk);
  }

  const compressedData = await zstdCompress(Buffer.concat(chunks), 19);
  const destination = createWriteStream(outputPath);
  await destination.write(compressedData);
  destination.end();
};

const getFileSize = async (filePath) => {
  const stats = await stat(filePath);
  return stats.size;
};

const main = async () => {
  const files = await readdir(__dirname);
  const bundles = files.filter(file => file.startsWith('bundle.') && file.endsWith('.js'));

  const results = [];
  let globalMinSize = Infinity;

  for (const file of bundles) {
    const inputPath = join(__dirname, file);
    const originalSize = await getFileSize(inputPath);

    // Gzip
    const gzipPath = `${inputPath}.gz`;
    await compressFile(inputPath, gzipPath, createGzip({ level: 9 }));
    const gzipSize = await getFileSize(gzipPath);

    // Brotli
    const brotliPath = `${inputPath}.br`;
    await compressFile(inputPath, brotliPath, createBrotliCompress({ params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }));
    const brotliSize = await getFileSize(brotliPath);

    // Zstd
    const zstdPath = `${inputPath}.zst`;
    await compressZstd(inputPath, zstdPath);
    const zstdSize = await getFileSize(zstdPath);

    const fileMinSize = Math.min(zstdSize, brotliSize, gzipSize);
    globalMinSize = Math.min(globalMinSize, fileMinSize);

    results.push({
      file,
      originalSize,
      sizes: {
        Zstd: { size: zstdSize },
        Brotli: { size: brotliSize },
        Gzip: { size: gzipSize }
      }
    });
  }

  // Generate Markdown table
  const markdownTable = ['| Filename | Size (bytes) | Zstd (bytes, %) | Brotli (bytes, %) | Gzip (bytes, %) |', '|----------|--------------|-----------------|-------------------|-----------------|'];

  results.forEach(({ file, originalSize, sizes }) => {
    markdownTable.push(
      `| [${file}](./${file}) | ${originalSize} | ${sizes.Zstd.size} (${((sizes.Zstd.size / globalMinSize) * 100).toFixed(2)}%) | ${sizes.Brotli.size} (${((sizes.Brotli.size / globalMinSize) * 100).toFixed(2)}%) | ${sizes.Gzip.size} (${((sizes.Gzip.size / globalMinSize) * 100).toFixed(2)}%) |`
    );
  });

  write(join(__dirname,"size.md"),markdownTable.join('\n'));
};

main();
