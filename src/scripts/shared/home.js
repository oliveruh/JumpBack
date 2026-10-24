import { loadCatalog, fetchJSON } from './data.js';
import { validateDate, readDate, resultURL, localToday } from './catalog.js';
import { br, text, formatDate, dateError } from './locale.js';

export async function startHome() {
    const form = document.getElementById('dateForm');
    const picker = document.getElementById('birthdatePicker');
    const button = document.getElementById('findButton');
    const error = document.getElementById('errorMessage');
    const status = document.getElementById('formStatus');
    const coverage = document.getElementById('coverage');
    let catalog;
    const saved = readDate(location.search);
    if (validateDate(saved).valid) picker.value = saved;
    const showError = message => {
        error.textContent = message;
        error.hidden = !message;
        picker.setAttribute('aria-invalid', String(Boolean(message)));
    };
    async function prepare() {
        button.disabled = true;
        status.textContent = text('Opening the archive…', 'Abrindo o acervo…');
        try {
            catalog = await loadCatalog();
            picker.min = catalog[0].cover_date;
            picker.max = [catalog.at(-1).cover_date, localToday()].sort()[0];
            coverage.textContent = text('Archive: ', 'Acervo: ') + `${formatDate(catalog[0].cover_date)} – ${formatDate(catalog.at(-1).cover_date)}`;
            status.textContent = '';
            showError('');
        } catch {
            coverage.textContent = text('Archive unavailable.', 'Acervo indisponível.');
            showError(dateError('unavailable'));
            status.textContent = text('Press Find to retry.', 'Toque em Encontrar para tentar novamente.');
        } finally { button.disabled = false; }
    }
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (!catalog) await prepare();
        if (!catalog) return;
        const result = validateDate(picker.value, catalog);
        if (!result.valid) {
            showError(dateError(result.code, catalog));
            picker.focus();
            return;
        }
        showError('');
        button.disabled = true;
        status.textContent = text('Finding your Jump…', 'Encontrando sua Jump…');
        location.assign(resultURL(location.href, picker.value, catalog));
    });
    picker.addEventListener('input', () => showError(''));
    // Restore the form when returning through the browser's back/forward cache.
    window.addEventListener('pageshow', () => { button.disabled = false; status.textContent = ''; });
    void showMascots();
    await prepare();
}

async function showMascots() {
    try {
        const path = br ? '../../br/data/wsj_mascots.json' : '../../data/wsj_mascots.json';
        const pairs = await fetchJSON(new URL(path, import.meta.url));
        const pair = pairs[Math.floor(Math.random() * pairs.length)];
        for (const [index, character] of [pair.topCharacter, pair.bottomCharacter].entries()) {
            const image = document.getElementById(`mascot${index + 1}Image`);
            document.getElementById(`mascot${index + 1}SpeechBubble`).textContent = character.dialogue;
            image.setAttribute('aria-label', character.name);
            image.style.backgroundImage = `url("${character.image}")`;
        }
    } catch { /* Static localized dialogue and the form remain usable. */ }
}
