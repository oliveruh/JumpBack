import { readDate, validateDate, findIssue, resultURL } from './catalog.js';
import { loadCatalog, loadIssue, loadSeries, loadHoroscope, loadTrivia } from './data.js';
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
function disclosure(label, ...children) {
    const details = node('details', undefined, 'data-note');
    details.append(node('summary', label), ...children);
    return details;
}

function artwork(url, alt, portrait = false) {
    const figure = node('figure', undefined, `extra-artwork${portrait ? ' character-artwork' : ''}`);
    const image = node('img');
    const fallback = node('span', text('Loading…', 'Carregando…'), 'artwork-fallback');
    image.alt = alt;
    image.width = 90;
    image.height = portrait ? 90 : 135;
    image.loading = 'lazy';
    image.decoding = 'async';
    image.referrerPolicy = 'no-referrer';
    const unavailable = () => { image.hidden = true; fallback.textContent = text('No image', 'Sem imagem'); fallback.hidden = false; };
    image.addEventListener('load', () => { fallback.hidden = true; }, { once: true });
    image.addEventListener('error', unavailable, { once: true });
    figure.append(image, fallback);
    if (typeof url === 'string' && /^https:\/\//.test(url)) image.src = url;
    else unavailable();
    return figure;
}

export async function startResults() {
    const value = readDate(location.search);
    let catalog, issue;
    setupDateInfo();
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
        main.append(document.querySelector('.result-toolbar'));
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
        const sameDate = value === issue.cover_date;
        byId('coverDateFact').hidden = sameDate;
        document.querySelector('.date-facts').classList.toggle('same-date', sameDate);
        if (sameDate) byId('selectedDateLabel').textContent = text('Birth date and cover date', 'Nascimento e data de capa');
        byId('contentsCount').textContent = text(`${issue.table_of_contents.length} archive entries`, `${issue.table_of_contents.length} entradas no acervo`);
        document.title = `JumpBack — #${issue.issue_number} · ${formatDate(issue.cover_date)}`;
        byId('resultStatus').textContent = text('Your Jump is here.', 'Sua Jump está aqui.');
        shareButton.disabled = false;
        byId('explorePanel').hidden = false;
        const alternative = new URL(br ? '../results.html' : 'br/results.html', location.href);
        byId('languageLink').href = resultURL(alternative.href, value, catalog);
        setupCover(issue.cover_images);
        byId('coverSpine').textContent = `JUMPBACK · #${issue.issue_number} · ${issue.cover_date.slice(0, 4)}`;
        setupContents(issue);
        setupExtras(issue, value);
        void setupEditorNote();
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
            status.textContent = text('The issue details are still available.', 'Os dados desta edição continuam disponíveis.');
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

const ICON_BY_SIGN = new Map([
    ['aries', 'aries'], ['touro', 'taurus'], ['taurus', 'taurus'], ['gemeos', 'gemini'], ['gemini', 'gemini'],
    ['cancer', 'cancer'], ['leao', 'leo'], ['leo', 'leo'], ['virgem', 'virgo'], ['virgo', 'virgo'],
    ['libra', 'libra'], ['escorpiao', 'scorpio'], ['scorpio', 'scorpio'], ['sagitario', 'sagittarius'], ['sagittarius', 'sagittarius'],
    ['capricornio', 'capricorn'], ['capricorn', 'capricorn'], ['aquario', 'aquarius'], ['aquarius', 'aquarius'], ['peixes', 'pisces'], ['pisces', 'pisces']
]);
const plain = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z]/g, '');
function signIcon(name) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    for (const [key, value] of Object.entries({ viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', 'stroke-width': '2', 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'aria-hidden': 'true', focusable: 'false' })) svg.setAttribute(key, value);
    const icon = ICON_BY_SIGN.get(plain(name));
    if (icon) {
        const use = document.createElementNS(svg.namespaceURI, 'use');
        use.setAttribute('href', `${new URL('../../assets/icons/zodiac.svg', import.meta.url).href}#${icon}`);
        svg.append(use);
    }
    return svg;
}

// The editorial note rotates through the whole trivia set, one per page load.
// A session bag keeps a reader from seeing the same note twice in a row.
function shuffled(count) {
    const values = Array.from({ length: count }, (_, index) => index);
    for (let i = values.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [values[i], values[j]] = [values[j], values[i]];
    }
    return values;
}
function nextNoteIndex(total) {
    let bag = [];
    try {
        const saved = JSON.parse(sessionStorage.getItem('jumpback-trivia-bag') ?? '[]');
        if (Array.isArray(saved)) bag = saved.filter(index => Number.isInteger(index) && index >= 0 && index < total);
    } catch { /* storage is optional */ }
    if (!bag.length) bag = shuffled(total);
    const index = bag.shift();
    try { sessionStorage.setItem('jumpback-trivia-bag', JSON.stringify(bag)); } catch { /* storage is optional */ }
    return index;
}
function signFor(signs, birthDate) {
    const monthDay = birthDate.slice(5);
    if (!Array.isArray(signs)) return undefined;
    return signs.find(sign => typeof sign.date_start === 'string' && typeof sign.date_end === 'string' &&
        (sign.date_start <= sign.date_end
            ? monthDay >= sign.date_start && monthDay <= sign.date_end
            : monthDay >= sign.date_start || monthDay <= sign.date_end));
}
function pickGem(series) {
    return series.filter(item => Number.isFinite(item.mu_votes) && item.mu_votes > 0)
        .sort((a, b) => a.mu_votes - b.mu_votes || (b.mu_rating || 0) - (a.mu_rating || 0))[0];
}

function setupDateInfo() {
    const button = byId('dateInfoButton'), tip = byId('dateInfo');
    if (!button || !tip) return;
    const show = open => {
        tip.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
    };
    // Native button activation covers clicks, Enter and Space without hover traps.
    button.addEventListener('click', () => show(tip.hidden));
    document.addEventListener('click', event => {
        if (!tip.hidden && !button.parentElement.contains(event.target)) show(false);
    });
    document.addEventListener('keydown', event => {
        if (event.key !== 'Escape' || tip.hidden) return;
        show(false);
    });
}

export function setupContents(issue) {
    const panel = byId('contentsPanel');
    if (!panel) return;
    panel.replaceChildren();
    const entries = issue.table_of_contents ?? [];
    if (!entries.length) { empty(panel); return; }
    const list = node('ol', undefined, 'contents-list');
    list.lang = 'en';
    list.setAttribute('aria-label', text('Table of contents', 'Sumário da edição'));
    for (const entry of entries) {
        const item = node('li');
        const row = node('div', undefined, 'contents-entry');
        let title = entry.series_title && entry.title.startsWith(entry.series_title) ? entry.series_title : entry.title;
        let chapter = entry.title.slice(title.length).replace(/^[:\-–—·\s]+/, '').trim();
        // Some entries ship the chapter inside the title with no series_title.
        if (!chapter) {
            const split = /^(.*?)\s+((?:Ch\.|Chapter)\s+\d+.*)$/i.exec(title);
            if (split) { title = split[1]; chapter = split[2]; }
        }
        row.append(node('span', title, 'contents-series'));
        if (chapter) row.append(node('span', chapter, 'contents-chapter'));
        item.append(row);
        list.append(item);
    }
    panel.append(list);
}

function setupExtras(issue, birthDate) {
    const signCard = byId('horoscopeCard'), gemCard = byId('hiddenGemCard');
    if (!signCard || !gemCard) return;
    const cards = [signCard, gemCard];
    const heading = byId('extrasTitle');
    const horoscopeHeading = heading.textContent;
    const panelOf = card => byId(card.getAttribute('aria-controls'));
    const started = new Set();
    let seriesRequest;
    const seriesDetails = async () => {
        seriesRequest ??= loadSeries().catch(error => { seriesRequest = null; throw error; });
        const series = await seriesRequest;
        return [...new Set(issue.table_of_contents.map(entry => entry.series_id))].map(id => series.get(id)).filter(Boolean);
    };
    let signRequest;
    function signDetails() {
        if (!signRequest) {
            signCard.classList.add('is-loading');
            signCard.classList.remove('is-unavailable');
            signRequest = loadHoroscope(br).then(signs => {
                const sign = signFor(signs, birthDate);
                byId('horoscopeName').textContent = sign
                    ? [sign.correspondent_sign_name, sign.element].filter(Boolean).join(' · ')
                    : text('Horoscope unavailable', 'Horóscopo indisponível');
                if (sign) byId('horoscopeGlyph').replaceChildren(signIcon(sign.correspondent_sign_name));
                signCard.classList.remove('is-loading');
                return sign;
            }).catch(() => {
                signRequest = null;
                signCard.classList.remove('is-loading');
                signCard.classList.add('is-unavailable');
                byId('horoscopeName').textContent = text('Retry horoscope', 'Tentar horóscopo');
                throw new Error('horoscope_unavailable');
            });
        }
        return signRequest;
    }

    async function renderHoroscope(panel) {
        const sign = await signDetails();
        panel.replaceChildren();
        if (!sign) { empty(panel, text('No sign matches this birthday.', 'Nenhum signo corresponde a este aniversário.')); return; }
        const profile = node('div', undefined, 'extra-feature horoscope-profile');
        const copy = node('div', undefined, 'extra-feature-copy');
        const badge = node('p', undefined, 'sign-badge');
        const glyph = node('span', undefined, 'sign-glyph');
        glyph.append(signIcon(sign.correspondent_sign_name));
        badge.append(glyph, node('span', [sign.correspondent_sign_name, sign.element].filter(Boolean).join(' · ')));
        copy.append(badge, node('h3', sign.character_name, 'horoscope-character'),
            node('p', sign.horoscope_name, 'horoscope-subtitle'),
            node('p', sign.series, 'extra-byline'),
            node('p', sign.shonen_archetype, 'horoscope-archetype'));
        profile.append(artwork(sign.image_url, sign.character_name, true), copy);
        const facts = node('dl', undefined, 'sign-facts');
        for (const [label, value] of [[text('Ruled by', 'Regido por'), sign.ruling_planet], [text('Shonen power', 'Poder shonen'), sign.shonen_power_type]]) {
            if (!value) continue;
            const cell = node('div');
            cell.append(node('dt', label), node('dd', value));
            facts.append(cell);
        }
        panel.replaceChildren(profile, facts, node('p', sign.description, 'sign-description'),
            node('p', text('Your sign, shonen style. Just for fun.', 'Seu signo em versão shonen. Só por diversão.'), 'source-note'));
    }

    async function renderGem(panel) {
        const series = await seriesDetails();
        panel.replaceChildren();
        const gem = pickGem(series);
        if (!gem) { empty(panel, text('No series data for this issue.', 'Sem dados de séries para esta edição.')); return; }
        const feature = node('div', undefined, 'extra-feature gem-feature');
        const copy = node('div', undefined, 'extra-feature-copy');
        copy.append(node('p', text('The quietest title in this issue', 'O título mais discreto desta edição'), 'gem-kicker'),
            node('h3', gem.title));
        if (gem.genres?.length) {
            const genres = node('ul', undefined, 'genre-list');
            genres.lang = 'en';
            genres.setAttribute('aria-label', text('Genres', 'Gêneros'));
            for (const genre of new Set(gem.genres)) genres.append(node('li', genre));
            copy.append(genres);
        }
        feature.append(artwork(gem.mu_image_url, text(`Cover of ${gem.title}`, `Capa de ${gem.title}`)), copy);
        const score = node('p', undefined, 'gem-score');
        score.append(node('strong', String(gem.mu_votes), 'gem-score-value'),
            node('span', gem.mu_votes === 1 ? text(' vote in the saved archive', ' voto no acervo salvo') : text(' votes in the saved archive', ' votos no acervo salvo')));
        panel.append(feature, score);
        panel.append(disclosure(text('Why this pick?', 'Por que esta escolha?'), node('p', text(
            'The identified series with the fewest positive MangaUpdates votes in this dataset; saved rating breaks ties. This does not measure popularity at publication.',
            'A série identificada com menos votos positivos do MangaUpdates neste acervo; a nota salva desempata. Isso não mede a popularidade na época da publicação.'))));
        if (gem.mu_description) {
            const prose = node('p', gem.mu_description); prose.lang = 'en';
            panel.append(disclosure(text('Read the synopsis', 'Ler a sinopse em inglês'), prose));
        }
        if (gem.mu_url && /^https:\/\/www\.mangaupdates\.com\//.test(gem.mu_url)) {
            const link = node('a', text('More on MangaUpdates', 'Saiba mais no MangaUpdates'));
            link.href = gem.mu_url; link.target = '_blank'; link.rel = 'noopener noreferrer'; panel.append(link);
        }
    }

    async function open(card, scroll = true) {
        // Closing the gem restores the horoscope; the section never collapses.
        if (card === gemCard && card.getAttribute('aria-expanded') === 'true' && started.has(card)) card = signCard;
        heading.textContent = card === gemCard ? text('Hidden gem', 'Joia escondida') : horoscopeHeading;
        for (const other of cards) {
            const target = other === card;
            other.setAttribute('aria-expanded', String(target));
            panelOf(other).hidden = !target;
        }
        if (started.has(card)) return;
        started.add(card);
        const panel = panelOf(card);
        panel.setAttribute('aria-busy', 'true');
        empty(panel, text('Opening this page…', 'Abrindo esta página…'));
        try {
            await (card === signCard ? renderHoroscope(panel) : renderGem(panel));
        } catch {
            started.delete(card);
            empty(panel, text('Could not load this page. Click the option above again to retry.', 'Não foi possível carregar esta página. Clique novamente na opção acima para tentar.'));
        } finally { panel.setAttribute('aria-busy', 'false'); }
        if (!panel.childElementCount) empty(panel);
        // Never move the initial viewport or scroll to a panel hidden during loading.
        if (scroll && !panel.hidden) {
            const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            panel.scrollIntoView({ block: 'nearest', behavior: reduceMotion ? 'auto' : 'smooth' });
        }
    }
    for (const card of cards) card.addEventListener('click', () => { void open(card); });
    void open(signCard, false);
}

async function setupEditorNote() {
    const note = byId('editorNote'), title = byId('editorNoteTitle'), body = byId('editorNoteBody');
    const button = byId('editorNoteNext'), counter = byId('editorNoteIndex');
    if (!note || !button) return;
    let entries = [];
    try {
        const data = await loadTrivia(br);
        entries = Array.isArray(data) ? data.filter(item => typeof item?.wsj_trivia_title === 'string' && typeof item?.wsj_trivia_content === 'string') : [];
    } catch { entries = []; }
    if (!entries.length) return;
    const paint = () => {
        const index = nextNoteIndex(entries.length);
        title.textContent = entries[index].wsj_trivia_title;
        body.textContent = entries[index].wsj_trivia_content;
        counter.textContent = `${index + 1}/${entries.length}`;
        note.hidden = false;
        note.classList.remove('is-turning');
        requestAnimationFrame(() => note.classList.add('is-turning'));
    };
    button.addEventListener('click', paint);
    paint();
}
