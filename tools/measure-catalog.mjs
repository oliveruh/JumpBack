// Reproducible local HTTP fetch + JSON parsing benchmark, not a Neocities TTFB test.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { performance } from 'node:perf_hooks';
const files = [
    'data/wsj_info.json', 'data/wsj_issues.json', 'br/data/wsj_issues.json',
    'data/wsj_series.json', 'data/generated/catalog.json',
    'data/generated/issues/1968.json', 'data/generated/issues/2000.json', 'data/generated/issues/2021.json'
];
const buffers = new Map(await Promise.all(files.map(async file => [file, await readFile(new URL(`../src/${file}`, import.meta.url))])));
const server = http.createServer((req, res) => {
    const data = buffers.get(req.url.slice(1));
    res.writeHead(data ? 200 : 404, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(data);
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const median = values => values.sort((a, b) => a - b)[Math.floor(values.length / 2)];
console.log('| File | Bytes | Gzip bytes | Local fetch + parse median (ms) | Parse median (ms) |');
console.log('| --- | ---: | ---: | ---: | ---: |');
try {
    for (const [file, buffer] of buffers) {
        const total = [], parse = [], url = `http://127.0.0.1:${server.address().port}/${file}`;
        // Warm the local HTTP connection, then seven samples; no browser cache.
        await (await fetch(url)).arrayBuffer();
        for (let i = 0; i < 7; i++) {
            const start = performance.now();
            const response = await fetch(url);
            await response.json();
            total.push(performance.now() - start);
            const text = buffer.toString('utf8'), parseStart = performance.now();
            JSON.parse(text);
            parse.push(performance.now() - parseStart);
        }
        console.log(`| ${file} | ${buffer.length} | ${gzipSync(buffer).length} | ${median(total).toFixed(2)} | ${median(parse).toFixed(2)} |`);
    }
} finally { server.close(); }
