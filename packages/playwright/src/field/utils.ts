import { getWeekNumber } from '@letsrunit/utils';

export function formatDateForInput(date: Date, type: string | null): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());

  switch (type) {
    case 'number':
      return date.getTime().toString();
    case 'datetime-local':
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
    case 'month':
      return `${yyyy}-${mm}`;
    case 'week': {
      const week = getWeekNumber(date);
      return `${yyyy}-W${pad(week)}`;
    }
    case 'time':
      return `${hh}:${min}`;
    case 'date':
    default:
      return `${yyyy}-${mm}-${dd}`;
  }
}

export function formatDate(d: Date, format: string): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = String(d.getFullYear());
  return format.replace('DD', dd).replace('MM', mm).replace('YYYY', yyyy);
}

export function getMonthNames(locale?: string): string[] {
  const formatter = new Intl.DateTimeFormat(locale, { month: 'long' });
  return Array.from({ length: 12 }, (_, i) => formatter.format(new Date(2024, i, 1)));
}
