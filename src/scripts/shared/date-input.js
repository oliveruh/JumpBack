import { isCalendarDate } from './catalog.js';

export function formatDateInput(value, br) {
    const [year, month, day] = value.split('-');
    return br ? `${day}/${month}/${year}` : `${month}/${day}/${year}`;
}

// The page language determines the order, independently of the browser locale.
export function parseDateInput(value, br) {
    const input = value.trim();
    if (!input) return '';
    const parts = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(input)
        || /^(\d{2})(\d{2})(\d{4})$/.exec(input);
    if (!parts) return null;
    const [, first, second, year] = parts;
    const day = (br ? first : second).padStart(2, '0');
    const month = (br ? second : first).padStart(2, '0');
    const date = `${year}-${month}-${day}`;
    return isCalendarDate(date) ? date : null;
}
