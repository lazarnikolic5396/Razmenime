import { format } from 'date-fns';

// Format date in Serbian format: DD.MM.YYYY
export function formatDate(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd.MM.yyyy.');
}

// Format date with time
export function formatDateTime(date: string | Date): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return format(dateObj, 'dd.MM.yyyy. HH:mm');
}

