// Browser tests use tiny image fixtures for deterministic network success/failure.
// They do not assert historical image pixels; live cover verification is separate.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../src');
const mime = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.ico': 'image/x-icon' };
const fixture = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aFooAAAAASUVORK5CYII=', 'base64');
const server = http.createServer((req, res) => {
    let name;
    try { name = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); } catch { res.writeHead(400).end(); return; }
    const target = path.resolve(root, '.' + (name.endsWith('/') ? name + 'index.html' : name));
    if (!target.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
    fs.readFile(target, (error, data) => {
        if (error) { res.writeHead(404).end(); return; }
        res.writeHead(200, { 'Content-Type': mime[path.extname(target)] || 'application/octet-stream' });
        res.end(data);
    });
});
let checks = 0;
const ok = message => { checks++; console.log('PASS ' + message); };
(async () => {
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const origin = `http://127.0.0.1:${server.address().port}`;
    const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE, args: ['--no-sandbox', '--disable-dev-shm-usage', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] } : {}) });
    async function scenario(label, options, run) {
        const context = await browser.newContext({ viewport: options.mobile ? { width: 390, height: 844 } : { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
        const page = await context.newPage();
        const errors = [], requests = [];
        page.on('pageerror', error => errors.push(error.message));
        page.on('request', req => requests.push(req.url()));
        await page.route('**/*', route => {
            const url = route.request().url();
            if (options.fail && url.includes(options.fail)) return route.fulfill({ status: 503, body: 'unavailable' });
            if (options.badCatalog && url.endsWith('/generated/catalog.json')) return route.fulfill({ contentType: 'application/json', body: '[{}]' });
            if (options.noResult && /generated\/issues\//.test(url)) return route.fulfill({ contentType: 'application/json', body: '[]' });
            if (url.startsWith(origin)) return route.continue();
            if (route.request().resourceType() === 'image') {
                if (options.slowCover) {
                    if (!url.includes('comicvine.gamespot.com')) return route.abort();
                    return new Promise(resolve => setTimeout(async () => {
                        await route.fulfill({ contentType: 'image/png', body: fixture });
                        resolve();
                    }, 6000));
                }
                return options.brokenCover ? route.abort() : route.fulfill({ contentType: 'image/png', body: fixture });
            }
            return route.abort(); // Analytics, fonts and optional CDNs unavailable.
        });
        await page.addInitScript(() => {
            Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
            Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async value => { window.copied = value; } } });
            // Even an installed analytics implementation throwing must be irrelevant.
            window.umami = { track() { throw new Error('analytics blocked'); }, identify() { throw new Error('DOB tracking forbidden'); } };
        });
        try {
            await run(page, origin, requests);
            assert.deepEqual(errors, [], `${label}: uncaught exceptions`);
            assert.ok(!requests.some(url => /analytics\.veramonte/.test(url)), 'No analytics requests');
            const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
            assert.equal(overflow, false, `${label}: horizontal overflow`);
            ok(label);
        } finally { await context.close(); }
    }
    try {
        for (const br of [false, true]) for (const mobile of [false, true]) {
            const prefix = br ? '/br' : '', name = `${br ? 'PT-BR' : 'EN'} ${mobile ? 'mobile' : 'desktop'}`;
            await scenario(`${name}: form, cover, series, extras, clipboard, language, back`, { mobile }, async (page, origin, requests) => {
                await page.goto(`${origin}${prefix}/index.html`);
                await page.waitForFunction(() => !document.getElementById('findButton').disabled);
                assert.equal(await page.locator('html').getAttribute('lang'), br ? 'pt-BR' : 'en');
                const submitBox = await page.locator('#findButton').boundingBox();
                assert.ok(submitBox.y + submitBox.height < (mobile ? 844 : 1000), 'Search is visible without scrolling');
                await page.locator('#findButton').click();
                assert.equal(await page.locator('#birthdatePicker').getAttribute('aria-invalid'), 'true');
                assert.equal(await page.locator('#birthdatePicker').getAttribute('min'), '1968-08-01');
                assert.equal(await page.locator('#birthdatePicker').getAttribute('max'), '2021-05-24');
                await page.locator('#birthdatePicker').fill('1968-08-01');
                await Promise.all([page.waitForURL('**/results.html?date=1968-08-01'), page.locator('#findButton').click()]);
                await page.waitForFunction(() => document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false' && document.getElementById('resultCard')?.hidden === false);
                assert.equal(await page.locator('#issueNumber').textContent(), '#1');
                assert.equal(await page.locator('#featuredSeries li').count(), 3);
                await page.waitForFunction(() => !document.getElementById('magazineCover').hidden && document.getElementById('magazineCover').naturalWidth > 0);
                assert.ok(!requests.some(url => url.endsWith('wsj_series.json')), 'Series data is lazy');
                assert.equal(await page.locator('#resultCard').evaluate(el => getComputedStyle(el).animationName), 'none');
                await page.locator('#shareButton').click();
                await page.waitForFunction(() => window.copied);
                assert.equal(await page.evaluate(() => new URL(window.copied).search), '?date=1968-08-01');
                for (const tab of ['stats', 'trivia', 'horoscope', 'hiddenGem']) {
                    await page.locator(`#${tab}TabButton`).click();
                    await page.waitForFunction(id => document.getElementById(id + 'TabPanel').getAttribute('aria-busy') === 'false', tab);
                    assert.ok((await page.locator(`#${tab}TabPanel`).textContent()).length > 10);
                }
                assert.ok((await page.locator('#horoscopeTabPanel').textContent()).includes('Monkey D. Luffy'));
                assert.equal(requests.filter(url => url.endsWith('wsj_series.json')).length, 1);
                await page.locator('#contentsTabButton').focus();
                await page.keyboard.press('End');
                assert.equal(await page.locator('#hiddenGemTabButton').getAttribute('aria-selected'), 'true');
                await page.locator('#backButton').click();
                await page.waitForFunction(() => !!document.getElementById('birthdatePicker') && !document.getElementById('findButton').disabled);
                assert.equal(await page.locator('#birthdatePicker').inputValue(), '1968-08-01');
                await page.waitForFunction(() => !document.getElementById('findButton').disabled);
                await page.locator('#birthdatePicker').fill('2021-05-24');
                await Promise.all([page.waitForURL('**/results.html?date=2021-05-24'), page.locator('#birthdatePicker').press('Enter')]);
                await page.waitForFunction(() => document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false' && document.getElementById('resultCard')?.hidden === false);
                assert.equal(await page.locator('#issueNumber').textContent(), '#2600');
                await Promise.all([page.waitForURL(origin + (br ? '' : '/br') + '/results.html?date=2021-05-24'), page.locator('#languageLink').click()]);
                await page.waitForFunction(() => document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false' && document.getElementById('resultCard')?.hidden === false);
                assert.equal(await page.locator('html').getAttribute('lang'), br ? 'en' : 'pt-BR');
                assert.equal(new URL(page.url()).search, '?date=2021-05-24');
            });
        }
        for (const prefix of ['', '/br']) {
            for (const query of ['', '?date=', '?date=nonsense', '?date=2001-02-29', '?date=1968-07-31', '?date=2021-05-25', '?date=2999-01-01', '?date=2000-01-01&date=2001-01-01']) {
                await scenario(`${prefix || 'EN'} rejects ${query || 'absent date'}`, {}, async (page, origin) => {
                    await page.goto(`${origin}${prefix}/results.html${query}`);
                    await page.locator('#errorPanel').waitFor({ state: 'visible' });
                    assert.equal(await page.locator('#resultCard').isVisible(), false);
                    assert.equal(await page.locator('#shareButton').isDisabled(), true);
                    assert.equal(await page.locator('#resultsMain').getAttribute('aria-busy'), 'false');
                    await page.locator('#backButton').click();
                    await page.locator('#birthdatePicker').waitFor();
                });
            }
            for (const options of [{ fail: 'generated/catalog.json' }, { fail: 'generated/issues/2000.json' }, { badCatalog: true }, { noResult: true }]) {
                await scenario(`${prefix || 'EN'} dataset failure ${JSON.stringify(options)}`, options, async (page, origin) => {
                    await page.goto(`${origin}${prefix}/results.html?date=2000-02-29`);
                    await page.locator('#errorPanel').waitFor({ state: 'visible' });
                    assert.equal(await page.locator('#retryButton').isVisible(), true);
                });
            }
            await scenario(`${prefix || 'EN'} all cover candidates fail; issue remains usable`, { brokenCover: true }, async (page, origin) => {
                await page.goto(`${origin}${prefix}/results.html?date=2000-01-01`);
                await page.locator('#retryCoverButton').waitFor({ state: 'visible' });
                assert.equal(await page.locator('#resultCard').isVisible(), true);
                assert.equal(await page.locator('#shareButton').isEnabled(), true);
                assert.equal(await page.locator('#magazineCover').isVisible(), false);
                await page.locator('#retryCoverButton').click();
                await page.locator('#retryCoverButton').waitFor({ state: 'visible' });
            });
            await scenario(`${prefix || 'EN'} optional series failure preserves reveal and horoscope`, { fail: 'wsj_series.json' }, async (page, origin) => {
                await page.goto(`${origin}${prefix}/results.html?date=2000-01-01`);
                await page.waitForFunction(() => document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false' && document.getElementById('resultCard')?.hidden === false);
                await page.locator('#statsTabButton').click();
                await page.waitForFunction(() => document.getElementById('statsTabPanel').getAttribute('aria-busy') === 'false');
                await page.locator('#horoscopeTabButton').click();
                await page.waitForFunction(() => document.getElementById('horoscopeTabPanel').getAttribute('aria-busy') === 'false');
                assert.ok((await page.locator('#horoscopeTabPanel').textContent()).includes('Seto Kaiba'));
                assert.equal(await page.locator('#resultCard').isVisible(), true);
            });
        }
        for (const prefix of ['', '/br']) {
            const homeOptions = { fail: 'generated/catalog.json' };
            await scenario(`${prefix || 'EN'} home archive failure and recovery`, homeOptions, async (page, origin) => {
                await page.goto(origin + prefix + '/index.html');
                await page.locator('#errorMessage').waitFor({ state: 'visible' });
                await page.waitForFunction(() => !document.getElementById('findButton').disabled);
                homeOptions.fail = null;
                await page.locator('#birthdatePicker').fill('2000-01-01');
                await page.locator('#findButton').click();
                await page.waitForFunction(() => document.getElementById('resultCard')?.hidden === false && document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false');
            });
            await scenario(`${prefix || 'EN'} cover falls back to another source URL`, { fail: 'comicvine.gamespot.com' }, async (page, origin, requests) => {
                await page.goto(origin + prefix + '/results.html?date=1968-08-01');
                await page.waitForFunction(() => !document.getElementById('magazineCover').hidden && document.getElementById('magazineCover').naturalWidth > 0);
                assert.ok(requests.some(url => url.includes('cdn.veramonte.org')));
            });
            await scenario(`${prefix || 'EN'} horoscope failure does not affect the edition`, { fail: 'wsj_horoscope.json' }, async (page, origin) => {
                await page.goto(origin + prefix + '/results.html?date=2000-01-01');
                await page.waitForFunction(() => document.getElementById('resultCard')?.hidden === false && document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false');
                await page.locator('#horoscopeTabButton').click();
                await page.waitForFunction(() => document.getElementById('horoscopeTabPanel').getAttribute('aria-busy') === 'false');
                assert.ok((await page.locator('#horoscopeTabPanel').textContent()).length > 20);
                assert.equal(await page.locator('#shareButton').isEnabled(), true);
            });
        }
        await scenario('slow original cover remains eligible after five seconds', { slowCover: true }, async (page, origin) => {
            await page.goto(origin + '/results.html?date=1968-08-01');
            await page.waitForFunction(() => document.getElementById('resultCard')?.hidden === false && document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false');
            assert.equal(await page.locator('#shareButton').isEnabled(), true);
            await page.waitForFunction(() => !document.getElementById('magazineCover').hidden && document.getElementById('magazineCover').naturalWidth > 0);
            assert.equal(await page.locator('#retryCoverButton').isVisible(), false);
        });
        for (const prefix of ['', '/br']) {
            await scenario(`${prefix || 'EN'} compact contents expand and collapse with keyboard`, {}, async (page, origin) => {
                await page.goto(origin + prefix + '/results.html?date=2000-01-01');
                const toggle = page.locator('.contents-toggle');
                await toggle.waitFor({ state: 'visible' });
                const rows = page.locator('#recordedContents li');
                const total = await rows.count();
                assert.ok(total > 4, 'The complete source contents remain in the document');
                assert.equal(await page.locator('#recordedContents li:visible').count(), 4);
                assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
                await toggle.focus();
                await page.keyboard.press('Enter');
                assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
                assert.equal(await page.locator('#recordedContents li:visible').count(), total);
                await page.locator('#statsTabButton').click();
                await page.locator('#contentsTabButton').click();
                assert.equal(await page.locator('#recordedContents li:visible').count(), total, 'Reopening the tab preserves expansion');
                await toggle.focus();
                await page.keyboard.press('Space');
                assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
                assert.equal(await page.locator('#recordedContents li:visible').count(), 4);
                assert.equal(await page.locator('#shareButton').isEnabled(), true);
            });
        }
        for (const mode of ['native', 'cancel', 'native-failure', 'legacy-copy', 'manual-copy']) {
            await scenario(`sharing: ${mode}`, {}, async (page, origin) => {
                await page.goto(`${origin}/br/results.html?date=2000-01-01&junk=discard#hash`);
                await page.waitForFunction(() => document.getElementById('resultsMain')?.getAttribute('aria-busy') === 'false' && document.getElementById('resultCard')?.hidden === false);
                await page.evaluate(mode => {
                    if (mode === 'native') Object.defineProperty(navigator, 'share', { value: async payload => { window.shared = payload; } });
                    if (mode === 'cancel') Object.defineProperty(navigator, 'share', { value: async () => { throw new DOMException('cancel', 'AbortError'); } });
                    if (mode === 'native-failure') Object.defineProperty(navigator, 'share', { value: async () => { throw new Error('permission'); } });
                    if (['legacy-copy', 'manual-copy'].includes(mode)) {
                        Object.defineProperty(navigator, 'clipboard', { value: { writeText: async () => { throw new Error('denied'); } } });
                        document.execCommand = () => mode === 'legacy-copy';
                    }
                }, mode);
                await page.locator('#shareButton').click();
                await page.waitForFunction(() => document.getElementById('shareStatus').textContent.length > 0);
                if (mode === 'native') assert.equal(await page.evaluate(() => new URL(window.shared.url).search), '?date=2000-01-01');
                if (mode === 'native-failure') assert.ok(await page.evaluate(() => window.copied));
                if (mode === 'cancel') assert.ok((await page.locator('#shareStatus').textContent()).includes('cancelado'));
                if (mode === 'manual-copy') {
                    assert.equal(await page.locator('#manualShare').isVisible(), true);
                    assert.equal(new URL(await page.locator('#shareURL').inputValue()).search, '?date=2000-01-01');
                }
                if (mode === 'legacy-copy') assert.ok((await page.locator('#shareStatus').textContent()).includes('copiado'));
            });
        }
        console.log(`${checks} browser scenarios passed; no uncaught page errors or horizontal overflow.`);
    } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
