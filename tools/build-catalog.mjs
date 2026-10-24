// Optional maintenance command; generated files are committed and deploy as-is.
import { readFile, mkdir, writeFile, readdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { validateCatalog } from '../src/scripts/shared/catalog.js';
const root = new URL('../', import.meta.url);
const read = async path => JSON.parse(await readFile(new URL(path, root), 'utf8'));
const [issues, brIssues, info, brInfo, series, brSeries] = await Promise.all([
    'src/data/wsj_issues.json', 'src/br/data/wsj_issues.json',
    'src/data/wsj_info.json', 'src/br/data/wsj_info.json',
    'src/data/wsj_series.json', 'src/br/data/wsj_series.json'
].map(read));
const identity = row => [row.id, row.issue_number, row.cover_date];
if (JSON.stringify(series) !== JSON.stringify(brSeries)) throw new Error('Series locales diverge: review before generating');
const seriesById = new Map(series.map(row => [row.id, row]));
const byId = rows => new Map(rows.map(row => [row.id, row]));
const brById = byId(brIssues), infoById = byId(info), brInfoById = byId(brInfo);
if ([brIssues, info, brInfo].some(rows => rows.length !== issues.length)) throw new Error('Source counts diverge');
const years = new Map();
const catalog = issues.map(issue => {
    for (const map of [brById, infoById, brInfoById]) {
        const other = map.get(issue.id);
        if (!other || JSON.stringify(identity(issue)) !== JSON.stringify(identity(other))) throw new Error(`Identity mismatch: ${issue.id}`);
    }
    const brIssue = brById.get(issue.id), legacy = infoById.get(issue.id);
    if (JSON.stringify(issue.table_of_contents) !== JSON.stringify(brIssue.table_of_contents)) throw new Error(`Contents mismatch: ${issue.id}`);
    if (!Array.isArray(issue.table_of_contents)) throw new Error(`Missing contents: ${issue.id}`);
    const year = issue.cover_date.slice(0, 4);
    if (!years.has(year)) years.set(year, []);
    years.get(year).push({
        id: issue.id, issue_number: issue.issue_number, cover_date: issue.cover_date,
        // Only existing source URLs, in order. No constructed image/issue associations.
        cover_images: [...new Set([legacy.cover_image, issue.cover_image, brIssue.cover_image])].filter(url => typeof url === 'string' && /^https:\/\//.test(url)),
        table_of_contents: issue.table_of_contents.map(entry => ({ ...entry,
            ...(seriesById.has(entry.series_id) ? { series_title: seriesById.get(entry.series_id).title } : {})
        })),
        trivia: legacy.trivia || [],
        ...(legacy.facts_html ? { facts_html: legacy.facts_html } : {})
    });
    return { id: issue.id, issue_number: issue.issue_number, cover_date: issue.cover_date };
}).sort((a, b) => a.cover_date.localeCompare(b.cover_date));
validateCatalog(catalog);
const files = new Map([['catalog.json', catalog]]);
for (const [year, rows] of years) files.set(`issues/${year}.json`, rows);
const out = new URL('src/data/generated/', root);
const check = process.argv.includes('--check');
for (const [name, value] of files) {
    const target = new URL(name, out), contents = JSON.stringify(value) + '\n';
    if (check) {
        if (await readFile(target, 'utf8') !== contents) throw new Error(`Stale generated file: ${name}`);
    } else {
        await mkdir(new URL('.', target), { recursive: true });
        await writeFile(target, contents);
    }
}
if (check) {
    const actual = (await readdir(new URL('issues/', out))).map(name => `issues/${name}`);
    if (actual.some(name => !files.has(name))) throw new Error('Unexpected generated year file');
}
console.log(`${check ? 'Verified' : 'Generated'} ${catalog.length} issues, ${years.size} year files; ${catalog[0].cover_date} to ${catalog.at(-1).cover_date}`);
console.log(`Output: ${fileURLToPath(out)}`);
