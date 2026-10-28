/** Calendario legal fail-closed: sin feriados oficiales no inventa vencimientos. */

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function resolveLegalDueDate({ nominalDate, country, timeZone, holidays = null } = {}) {
  if (!ISO_DATE.test(String(nominalDate))) throw new Error('nominalDate debe ser YYYY-MM-DD');
  if (!/^[A-Z]{2}$/.test(String(country))) throw new Error('country debe ser ISO 3166-1 alfa-2');
  try { new Intl.DateTimeFormat('en', { timeZone }).format(new Date()); } catch { throw new Error('timeZone debe ser IANA'); }
  if (!Array.isArray(holidays)) {
    return { state: 'REQUIRES_HUMAN_REVIEW', dueDate: null, nominalDate, country, timeZone, reason: 'Falta calendario oficial de feriados para esta jurisdicción y vigencia.' };
  }
  if (holidays.some(value => !ISO_DATE.test(String(value)))) throw new Error('Cada feriado debe ser YYYY-MM-DD');
  const closed = new Set(holidays);
  const date = new Date(`${nominalDate}T12:00:00Z`);
  let shifts = 0;
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6 || closed.has(date.toISOString().slice(0, 10))) {
    date.setUTCDate(date.getUTCDate() + 1);
    shifts += 1;
  }
  return { state: 'COMPUTED_FROM_APPROVED_CALENDAR', dueDate: date.toISOString().slice(0, 10), nominalDate, country, timeZone, shifts };
}

