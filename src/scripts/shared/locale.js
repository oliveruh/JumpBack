export const br = document.documentElement.lang === 'pt-BR';
export const locale = br ? 'pt-BR' : 'en-US';
export const text = (en, pt) => br ? pt : en;
export const formatDate = value => new Date(`${value}T12:00:00Z`).toLocaleDateString(locale, { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
export function dateError(code, catalog) {
    const first = catalog?.[0]?.cover_date, last = catalog?.at(-1)?.cover_date;
    return {
        missing: text('Choose a date to find your Jump.', 'Escolha uma data para encontrar sua Jump.'),
        invalid: text('Enter a real date in YYYY-MM-DD format.', 'Informe uma data existente no formato AAAA-MM-DD.'),
        future: text('Choose a date that is not in the future.', 'Escolha uma data que não esteja no futuro.'),
        early: first && text(`This archive starts on ${formatDate(first)}. Try a later date.`, `Este acervo começa em ${formatDate(first)}. Tente uma data posterior.`),
        late: last && text(`This archive ends on ${formatDate(last)}. Try an earlier date.`, `Este acervo termina em ${formatDate(last)}. Tente uma data anterior.`),
        unavailable: text('The archive could not be loaded. Please try again.', 'Não foi possível carregar o acervo. Tente novamente.')
    }[code] || text('No issue was found. Try another date.', 'Nenhuma edição encontrada. Tente outra data.');
}
