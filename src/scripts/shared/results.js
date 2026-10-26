import { readDate, validateDate, findIssue, resultURL } from './catalog.js';
import { loadCatalog, loadIssue, loadSeries, loadHoroscope } from './data.js';
import { br, text, formatDate, dateError } from './locale.js';
import { shareOrCopy } from './share.js';

const byId = id => document.getElementById(id);
function node(tag, value, className) {
    const element = document.createElement(tag);
    if (value !== undefined) element.textContent = value;
    if (className) element.className = className;
    return element;
}
function empty(panel, message = text('No information is available for this issue.', 'Não há informações disponíveis para esta edição.')) {
    panel.replaceChildren(node('p', message));
}
// Source prose is not a translation. Clearly label it on the Portuguese interface.
function sourceText(panel, value) {
    if (br) panel.append(node('p', 'Texto do acervo em inglês.', 'source-note'));
    const prose = node('p', value);
    prose.lang = 'en';
    panel.append(prose);
}

export async function startResults() {
    const value = readDate(location.search);
    let catalog, issue;
    const shareButton = byId('shareButton');
    const main = byId('resultsMain');
    const home = new URL('index.html', location.href);
    if (validateDate(value).valid) home.searchParams.set('date', value);
    byId('backButton').href = home.href;
    byId('homeLink').href = home.href;
    byId('retryButton').addEventListener('click', () => location.reload());
    // Listeners exist even if loading fails. Never dereference a missing issue.
    shareButton.addEventListener('click', async () => {
        if (!issue || !catalog) return;
        shareButton.disabled = true;
        byId('manualShare').hidden = true;
        try {
            const url = resultURL(location.href, value, catalog);
            const outcome = await shareOrCopy({ title: 'JumpBack',
                text: text(`My JumpBack: Weekly Shonen Jump #${issue.issue_number}, recorded cover date ${formatDate(issue.cover_date)}. Find yours!`,
                    `Minha JumpBack: Weekly Shonen Jump #${issue.issue_number}, data de capa registrada ${formatDate(issue.cover_date)}. Encontre a sua!`), url });
            const messages = {
                shared: text('Shared!', 'Compartilhado!'),
                copied: text('Link copied! It includes your selected date.', 'Link copiado! Ele contém a data escolhida.'),
                cancelled: text('Sharing cancelled.', 'Compartilhamento cancelado.'),
                manual: text('Automatic copy failed. Select and copy the link below.', 'A cópia automática falhou. Selecione e copie o link abaixo.')
            };
            byId('shareStatus').textContent = messages[outcome];
            if (outcome === 'manual') {
                byId('manualShare').hidden = false;
                byId('shareURL').value = url;
                byId('shareURL').focus();
                byId('shareURL').select();
            }
        } catch {
            byId('shareStatus').textContent = text('Could not share this result. Please try again.', 'Não foi possível compartilhar. Tente novamente.');
        } finally { shareButton.disabled = false; }
    });
    function fail(message, retry = false) {
        byId('resultStatus').textContent = '';
        byId('errorPanel').hidden = false;
        byId('resultError').textContent = message;
        byId('retryButton').hidden = !retry;
        shareButton.hidden = true;
        document.querySelector('.share-note').hidden = true;
        document.title = text('JumpBack — Try another date', 'JumpBack — Tente outra data');
    }
    try {
        // Reject malformed/missing/future URL values without fetching any catalog.
        const initial = validateDate(value);
        if (!initial.valid) { fail(dateError(initial.code)); return; }
        catalog = await loadCatalog();
        const validation = validateDate(value, catalog);
        if (!validation.valid) { fail(dateError(validation.code, catalog)); return; }
        const row = findIssue(catalog, value);
        if (!row) { fail(dateError('no_result', catalog)); return; }
        issue = await loadIssue(row);
        byId('resultCard').hidden = false;
        byId('resultCard').classList.add('is-revealed');
        byId('issueNumber').textContent = `#${issue.issue_number}`;
        byId('coverDate').textContent = formatDate(issue.cover_date);
        byId('selectedDate').textContent = formatDate(value);
        document.title = `JumpBack — #${issue.issue_number} · ${formatDate(issue.cover_date)}`;
        const known = issue.table_of_contents.filter(entry => entry.series_id != null && entry.series_title);
        const unique = [...new Map(known.map(entry => [entry.series_id, entry])).values()].slice(0, 3);
        byId('featuredSeries').replaceChildren(...unique.map(entry => node('li', entry.series_title)));
        if (!unique.length) byId('featuredSeries').append(node('li', text('No identified series in the recorded contents.', 'Nenhuma série identificada no sumário registrado.')));
        byId('resultStatus').textContent = text('Your Jump is here.', 'Sua Jump está aqui.');
        shareButton.disabled = false;
        byId('explorePanel').hidden = false;
        const alternative = new URL(br ? '../results.html' : 'br/results.html', location.href);
        byId('languageLink').href = resultURL(alternative.href, value, catalog);
        setupCover(issue.cover_images);
        setupExplore(issue, value);
    } catch { fail(dateError('unavailable'), true); }
    finally { main.setAttribute('aria-busy', 'false'); }
}

function setupCover(urls) {
    const image = byId('magazineCover'), placeholder = byId('coverPlaceholder');
    const retry = byId('retryCoverButton'), status = byId('coverStatus');
    // Bounded attempts; page content and sharing never wait for remote covers.
    let attempt = 0, timer, generation = 0;
    function next() {
        clearTimeout(timer);
        const current = ++generation;
        const url = urls[attempt++];
        if (!url || !/^https:\/\//.test(url)) {
            image.hidden = true;
            placeholder.hidden = false;
            placeholder.textContent = text('Cover unavailable', 'Capa indisponível');
            status.textContent = text('The issue details are still available below.', 'Os dados da edição continuam disponíveis abaixo.');
            retry.hidden = false;
            return;
        }
        image.onload = () => {
            if (current !== generation) return;
            clearTimeout(timer);
            image.hidden = false;
            placeholder.hidden = true;
            status.textContent = '';
        };
        image.onerror = () => { if (current === generation) next(); };
        image.alt = text('Weekly Shonen Jump cover', 'Capa da Weekly Shonen Jump');
        image.referrerPolicy = 'no-referrer';
        image.src = url;
        // A network timeout is a failure boundary, never a presentation delay.
        // The original source can be a multi-megabyte scan: allow more time on
        // the preferred original rather than rejecting an accessible large image.
        timer = setTimeout(() => { if (current === generation) next(); }, attempt === 1 ? 20000 : 5000);
    }
    retry.addEventListener('click', () => {
        attempt = 0;
        retry.hidden = true;
        status.textContent = '';
        placeholder.textContent = text('Opening the cover…', 'Abrindo a capa…');
        next();
    });
    next();
}

function setupExplore(issue, birthDate) {
    const buttons = [...document.querySelectorAll('.explore-tab')];
    const loaded = new Map();
    let seriesRequest;
    const seriesDetails = async () => {
        seriesRequest ??= loadSeries().catch(error => { seriesRequest = null; throw error; });
        const series = await seriesRequest;
        return [...new Set(issue.table_of_contents.map(entry => entry.series_id))].map(id => series.get(id)).filter(Boolean);
    };
    const render = async id => {
        const panel = byId(`${id}TabPanel`);
        if (id === 'contents') {
            panel.replaceChildren();
            panel.append(node('h3', text('Recorded table of contents', 'Sumário registrado')));
            const list = node('ul');
            list.lang = 'en';
            for (const entry of issue.table_of_contents) list.append(node('li', entry.title));
            if (list.childElementCount > 4) {
                list.classList.add('contents-preview');
                const button = node('button', text(
                    `Show all ${list.childElementCount} entries`,
                    `Ver as ${list.childElementCount} entradas`), 'contents-toggle');
                list.id = 'recordedContents';
                button.setAttribute('aria-controls', list.id);
                button.setAttribute('aria-expanded', 'false');
                button.type = 'button';
                button.addEventListener('click', () => {
                    const expanded = button.getAttribute('aria-expanded') !== 'true';
                    button.setAttribute('aria-expanded', String(expanded));
                    list.classList.toggle('contents-preview', !expanded);
                    button.textContent = expanded ? text('Show fewer entries', 'Mostrar menos entradas')
                        : text(`Show all ${list.childElementCount} entries`, `Ver as ${list.childElementCount} entradas`);
                });
                panel.append(list, button);
            } else panel.append(list);
            if (!list.childElementCount) empty(panel);
            return;
        }
        if (id === 'horoscope') {
            const signs = await loadHoroscope(br);
            const md = birthDate.slice(5);
            const sign = Array.isArray(signs) && signs.find(sign => sign.date_start <= sign.date_end
                ? md >= sign.date_start && md <= sign.date_end
                : md >= sign.date_start || md <= sign.date_end);
            if (!sign) { empty(panel); return; }
            panel.replaceChildren(node('p', text('A playful bonus, not a historical fact.', 'Um bônus lúdico, sem significado histórico.'), 'source-note'),
                node('h3', sign.horoscope_name), node('p', `${sign.character_name} · ${sign.series}`),
                node('p', sign.shonen_archetype), node('p', sign.description), node('p', sign.shonen_power_type));
            return;
        }
        // Issue trivia remains available even if the optional series catalog fails.
        let series = [];
        try { series = await seriesDetails(); }
        catch (error) { if (id !== 'trivia') throw error; }
        panel.replaceChildren();
        if (id === 'stats') {
            panel.append(node('h3', text('Categories in identified series', 'Categorias nas séries identificadas')),
                node('p', text(`${series.length} identified series; these are catalog tags, not historical popularity.`, `${series.length} séries identificadas; estas são tags do acervo, não popularidade histórica.`)));
            const counts = new Map();
            for (const item of series) for (const tag of new Set(item.categories || [])) counts.set(tag, (counts.get(tag) || 0) + 1);
            const list = node('ul', undefined, 'tag-counts');
            list.lang = 'en';
            for (const [tag, count] of [...counts].sort((a, b) => b[1] - a[1]).slice(0, 5)) {
                const item = node('li', `${tag}: ${count} `);
                const meter = node('meter');
                meter.min = 0; meter.max = Math.max(series.length, 1); meter.value = count;
                meter.setAttribute('aria-label', `${tag}: ${count}/${series.length}`);
                item.append(meter); list.append(item);
            }
            panel.append(list);
            if (!counts.size) panel.append(node('p', text('No category data for this issue.', 'Sem dados de categorias para esta edição.')));
        } else if (id === 'trivia') {
            panel.append(node('h3', text('From the archive', 'Do acervo')));
            if (br) panel.append(node('p', 'Curiosidades do acervo em inglês.', 'source-note'));
            const entries = [...new Set([...(issue.trivia || []), ...series.flatMap(item => item.trivia || [])])].slice(0, 8);
            const list = node('ul'); list.lang = 'en';
            for (const entry of entries) list.append(node('li', entry));
            panel.append(list);
            if (!entries.length) empty(panel);
        } else if (id === 'hiddenGem') {
            const gem = series.filter(item => Number.isFinite(item.mu_votes) && item.mu_votes > 0)
                .sort((a, b) => a.mu_votes - b.mu_votes || (b.mu_rating || 0) - (a.mu_rating || 0))[0];
            if (!gem) { empty(panel); return; }
            panel.append(node('h3', gem.title), node('p', text(
                `Selected by the fewest MangaUpdates votes in the saved dataset (${gem.mu_votes}); ties use the saved rating. This is not a measure of popularity at publication.`,
                `Escolhida pelo menor número de votos do MangaUpdates no acervo salvo (${gem.mu_votes}); empates usam a nota salva. Isso não mede a popularidade na época da publicação.`)));
            if (gem.mu_description) sourceText(panel, gem.mu_description);
            if (gem.mu_url && /^https:\/\/www\.mangaupdates\.com\//.test(gem.mu_url)) {
                const link = node('a', text('More on MangaUpdates', 'Saiba mais no MangaUpdates'));
                link.href = gem.mu_url; link.target = '_blank'; link.rel = 'noopener noreferrer'; panel.append(link);
            }
        }
    };
    async function activate(button) {
        for (const tab of buttons) {
            const selected = tab === button;
            tab.setAttribute('aria-selected', String(selected));
            tab.tabIndex = selected ? 0 : -1;
            byId(tab.getAttribute('aria-controls')).hidden = !selected;
        }
        const id = button.dataset.tab, panel = byId(`${id}TabPanel`);
        if (!loaded.has(id)) {
            panel.setAttribute('aria-busy', 'true');
            empty(panel, text('Opening this page…', 'Abrindo esta página…'));
            const promise = (async () => {
                try { await render(id); }
                catch {
                    loaded.delete(id);
                    empty(panel, text('Could not load these extras. Reopen this tab to retry.', 'Não foi possível carregar os extras. Abra esta aba novamente para tentar.'));
                } finally { panel.setAttribute('aria-busy', 'false'); }
            })();
            loaded.set(id, promise);
            await promise;
        }
    }
    for (const [index, button] of buttons.entries()) {
        button.addEventListener('click', () => { void activate(button); });
        button.addEventListener('keydown', event => {
            let next;
            if (['ArrowRight', 'ArrowDown'].includes(event.key)) next = (index + 1) % buttons.length;
            if (['ArrowLeft', 'ArrowUp'].includes(event.key)) next = (index + buttons.length - 1) % buttons.length;
            if (event.key === 'Home') next = 0;
            if (event.key === 'End') next = buttons.length - 1;
            if (next !== undefined) { event.preventDefault(); buttons[next].focus(); void activate(buttons[next]); }
        });
    }
    void activate(buttons[0]);
}
