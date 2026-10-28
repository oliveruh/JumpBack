import { loadCatalog, fetchJSON } from './data.js';
import { validateDate, readDate, resultURL } from './catalog.js';
import { br, text, dateError } from './locale.js';
import { formatDateInput, parseDateInput } from './date-input.js';

export async function startHome() {
    const form = document.getElementById('dateForm');
    const picker = document.getElementById('birthdatePicker');
    const button = document.getElementById('findButton');
    const error = document.getElementById('errorMessage');
    const status = document.getElementById('formStatus');
    const coverage = document.getElementById('coverage');
    let catalog;
    const saved = readDate(location.search);
    if (validateDate(saved).valid) picker.value = formatDateInput(saved, br);
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
            const shortDate = date => new Date(`${date}T12:00:00Z`).toLocaleDateString(br ? 'pt-BR' : 'en-US', { timeZone: 'UTC' });
            coverage.textContent = text('Available archive: ', 'Acervo disponível: ') + `${shortDate(catalog[0].cover_date)} — ${shortDate(catalog.at(-1).cover_date)}`;
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
        const value = parseDateInput(picker.value, br);
        const result = validateDate(value === null ? '__invalid__' : value, catalog);
        if (!result.valid) {
            showError(result.code === 'invalid' ? text('Enter a real date in MM/DD/YYYY format.', 'Informe uma data existente no formato DD/MM/AAAA.') : dateError(result.code, catalog));
            picker.focus();
            return;
        }
        showError('');
        button.disabled = true;
        status.textContent = text('Finding your Jump…', 'Encontrando sua Jump…');
        location.assign(resultURL(location.href, value, catalog));
    });
    const normalizeInput = () => {
        const value = parseDateInput(picker.value, br);
        if (value) picker.value = formatDateInput(value, br);
    };
    picker.addEventListener('input', () => {
        showError('');
        if (/^\d{8}$/.test(picker.value)) normalizeInput();
    });
    picker.addEventListener('blur', normalizeInput);
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
        document.querySelectorAll('.mascot-series').forEach(label => { label.textContent = pair.series; });
        for (const [index, character] of [pair.topCharacter, pair.bottomCharacter].entries()) {
            const image = document.getElementById(`mascot${index + 1}Image`);
            const name = document.getElementById(`mascot${index + 1}Name`);
            document.getElementById(`mascot${index + 1}SpeechBubble`).textContent = character.dialogue;
            image.setAttribute('aria-label', character.name);
            image.style.backgroundImage = `url("${character.image}")`;
            name.textContent = character.name;
            name.hidden = false;
        }
    } catch { /* Static localized dialogue and the form remain usable. */ }
}
