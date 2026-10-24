import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { isCalendarDate, validateCatalog, validateDate, findIssue, readDate, resultURL } from '../src/scripts/shared/catalog.js';
const read = async name => JSON.parse(await readFile(new URL(`../src/${name}`, import.meta.url)));
const [catalog, source, brSource] = await Promise.all([
    'data/generated/catalog.json', 'data/wsj_issues.json', 'br/data/wsj_issues.json'
].map(read));
const today = '2026-10-24';

test('calendar validation rejects rollover, ambiguous and non-ISO dates', () => {
    for (const value of ['2021-02-29', '2000-02-30', '1900-02-29', '2020-13-01', '2020-00-01', '2020-01-00', '0000-01-01', '2020-1-01', '01/02/2000', '2020-01-01T00:00:00Z', 'hello', ' 2000-01-01', null]) assert.equal(isCalendarDate(value), false, String(value));
    for (const value of ['2000-02-29', '2020-02-29', '1968-08-01']) assert.equal(isCalendarDate(value), true);
});
test('real archive bounds and exact endpoint matches', () => {
    validateCatalog(catalog);
    assert.equal(catalog.length, 2600);
    assert.equal(catalog[0].cover_date, '1968-08-01');
    assert.equal(catalog.at(-1).cover_date, '2021-05-24');
    assert.equal(findIssue(catalog, catalog[0].cover_date, today).id, 5);
    assert.equal(findIssue(catalog, catalog.at(-1).cover_date, today).id, 2604);
});
test('invalid, absent, early, uncovered and future dates never return stale issues', () => {
    for (const [value, code] of [[null, 'missing'], ['', 'missing'], ['1968-07-11', 'early'], ['1968-07-31', 'early'], ['2021-05-25', 'late'], ['2026-10-25', 'future'], ['2030-01-01', 'future'], ['2021-02-29', 'invalid'], ['potato', 'invalid']]) {
        assert.deepEqual(validateDate(value, catalog, today), { valid: false, code });
        assert.equal(findIssue(catalog, value, today), null);
    }
    assert.equal(findIssue([], '2000-01-01', today), null);
    assert.equal(findIssue(null, '2000-01-01', today), null);
});
test('leap day and gap lookup use most recent recorded cover date', () => {
    for (const date of ['2000-02-29', '1988-12-25', '1968-08-02', '2021-05-23']) {
        const expected = source.filter(row => row.cover_date <= date).sort((a,b) => b.cover_date.localeCompare(a.cover_date))[0];
        assert.equal(findIssue(catalog, date, today).id, expected.id);
    }
});
test('every source identity and date association is preserved in both locales', () => {
    for (const rows of [source, brSource]) for (const row of rows) {
        const match = findIssue(catalog, row.cover_date, today);
        assert.deepEqual([match.id, match.issue_number, match.cover_date], [row.id, row.issue_number, row.cover_date]);
    }
});
test('all generated issue details and cover candidates come from original rows', async () => {
    const info = await read('data/wsj_info.json');
    const years = [...new Set(catalog.map(row => row.cover_date.slice(0, 4)))];
    let count = 0;
    for (const year of years) for (const issue of await read(`data/generated/issues/${year}.json`)) {
        const index = source.findIndex(row => row.id === issue.id);
        assert.equal(issue.cover_date, source[index].cover_date);
        assert.deepEqual(issue.table_of_contents.map(({series_title, ...entry}) => entry), source[index].table_of_contents);
        assert.deepEqual(issue.trivia, info[index].trivia);
        for (const url of issue.cover_images) assert.ok([source[index].cover_image, brSource[index].cover_image, info[index].cover_image].includes(url));
        count++;
    }
    assert.equal(count, 2600);
});
test('corrupt, unordered, duplicate or empty catalogs are rejected', () => {
    for (const rows of [[], null, [{}], [...catalog].reverse(), [catalog[0], catalog[0]], [{...catalog[0],cover_date:'1968-02-30'}]]) assert.throws(() => validateCatalog(rows));
});
test('direct URLs reject duplicates and sharing preserves only a validated date', () => {
    assert.equal(readDate('?date=2000-01-01'), '2000-01-01');
    assert.equal(readDate(''), null);
    assert.equal(readDate('?date=2000-01-01&date=1999-01-01'), '__ambiguous__');
    assert.equal(resultURL('https://example.org/br/results.html?evil=1#hash', '2000-01-01', catalog), 'https://example.org/br/results.html?date=2000-01-01');
    assert.throws(() => resultURL('https://example.org/', '2021-05-25', catalog));
});
