// Dates are calendar values, never instants in the visitor's timezone.
export function isCalendarDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split('-').map(Number);
    if (year < 1 || month < 1 || month > 12 || day < 1) return false;
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    return day <= [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1];
}

export function localToday(now = new Date()) {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

// Reject corrupt catalogues rather than silently extending or shrinking coverage.
export function validateCatalog(rows) {
    if (!Array.isArray(rows) || rows.length === 0) throw new Error('empty_catalog');
    const ids = new Set();
    let previous = '';
    for (const row of rows) {
        if (!Number.isInteger(row.id) || ids.has(row.id) ||
            !isCalendarDate(row.cover_date) || row.cover_date <= previous ||
            !Number.isFinite(Number(row.issue_number))) throw new Error('invalid_catalog');
        ids.add(row.id);
        previous = row.cover_date;
    }
    return rows;
}

export function validateDate(value, catalog, today = localToday()) {
    if (value === null || value === undefined || value === '') return { valid: false, code: 'missing' };
    if (!isCalendarDate(value)) return { valid: false, code: 'invalid' };
    if (value > today) return { valid: false, code: 'future' };
    if (catalog) {
        if (!catalog.length) return { valid: false, code: 'unavailable' };
        if (value < catalog[0].cover_date) return { valid: false, code: 'early' };
        if (value > catalog.at(-1).cover_date) return { valid: false, code: 'late' };
    }
    return { valid: true, code: null };
}

// Latest recorded cover date <= target. Never extrapolate beyond the archive.
// Equal-date ties are rejected by validateCatalog so selection is deterministic.
export function findIssue(catalog, value, today = localToday()) {
    if (!catalog?.length || !validateDate(value, catalog, today).valid) return null;
    let low = 0, high = catalog.length - 1;
    while (low <= high) {
        const mid = (low + high) >>> 1;
        if (catalog[mid].cover_date <= value) low = mid + 1;
        else high = mid - 1;
    }
    return catalog[high] || null;
}

export function readDate(search) {
    const values = new URLSearchParams(search).getAll('date');
    // Duplicate parameters are ambiguous, even if one of them looks valid.
    return values.length > 1 ? '__ambiguous__' : values[0] ?? null;
}

export function resultURL(base, value, catalog) {
    if (!validateDate(value, catalog).valid) throw new Error('invalid_share_date');
    const url = new URL('results.html', base);
    url.search = new URLSearchParams({ date: value }).toString();
    url.hash = '';
    return url.href;
}
