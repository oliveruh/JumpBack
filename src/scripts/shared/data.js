import { validateCatalog } from './catalog.js';
const root = new URL('../../data/', import.meta.url);
const requests = new Map();

export function fetchJSON(url) {
    const key = String(url);
    if (!requests.has(key)) {
        requests.set(key, (async () => {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);
            try {
                const response = await fetch(url, { signal: controller.signal, referrerPolicy: 'no-referrer' });
                if (!response.ok) throw new Error('dataset_unavailable');
                return await response.json();
            } finally { clearTimeout(timeout); }
        })().catch(error => { requests.delete(key); throw error; }));
    }
    return requests.get(key);
}
export async function loadCatalog() {
    return validateCatalog(await fetchJSON(new URL('generated/catalog.json', root)));
}
export async function loadIssue(row) {
    const rows = await fetchJSON(new URL(`generated/issues/${row.cover_date.slice(0, 4)}.json`, root));
    const issue = Array.isArray(rows) && rows.find(issue => issue.id === row.id);
    if (!issue || issue.cover_date !== row.cover_date || issue.issue_number !== row.issue_number ||
        !Array.isArray(issue.table_of_contents) || !Array.isArray(issue.cover_images)) throw new Error('invalid_issue');
    return issue;
}
export async function loadSeries() {
    const rows = await fetchJSON(new URL('wsj_series.json', root));
    if (!Array.isArray(rows)) throw new Error('invalid_series');
    return new Map(rows.map(row => [row.id, row]));
}
export async function loadHoroscope(br) {
    const url = br ? new URL('../../br/data/wsj_horoscope.json', import.meta.url) : new URL('wsj_horoscope.json', root);
    return fetchJSON(url);
}
export async function loadTrivia(br) {
    const url = br ? new URL('../../br/data/wsj_trivia.json', import.meta.url) : new URL('wsj_trivia.json', root);
    return fetchJSON(url);
}
