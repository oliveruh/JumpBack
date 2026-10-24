import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const src = new URL('../src/', import.meta.url);

test('published pages use only the shared tested module graph, without analytics or optional CDN scripts', async () => {
    const visited = new Set();
    async function walk(path) {
        const url = new URL(path, src);
        if (visited.has(url.href)) return;
        visited.add(url.href);
        const code = await readFile(url, 'utf8');
        assert.ok(!/umami|\.identify\(|new Chart\(/.test(code), path);
        assert.ok(!/\/br\/scripts\/(core|services|pages|ui)\//.test(url.pathname), url.pathname);
        for (const match of code.matchAll(/from\s+['"]([^'"]+)['"]/g)) {
            assert.ok(match[1].endsWith('.js'), match[1]);
            await walk(new URL(match[1], url));
        }
    }
    for (const locale of ['', 'br/']) for (const page of ['index', 'results']) {
        const html = await readFile(new URL(`${locale}${page}.html`, src), 'utf8');
        assert.ok(html.includes(`<html lang="${locale ? 'pt-BR' : 'en'}">`));
        assert.ok(html.includes('name="referrer" content="no-referrer"'));
        assert.ok(!/onclick=|onerror=|umami|chart\.js/i.test(html));
        const scripts = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)];
        assert.equal(scripts.length, 1);
        assert.ok(scripts[0][0].includes('type="module"'));
        await walk(`${locale}scripts/${page}.js`);
    }
    assert.ok(visited.size >= 8);
});
