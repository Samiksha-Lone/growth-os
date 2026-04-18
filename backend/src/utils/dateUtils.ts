export function parseLocalDate(value: any): Date {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
  }

  if (typeof value === 'string') {
    const dateOnly = value.split('T')[0].trim();
    const parts = dateOnly.split('-').map(part => Number(part));

    if (parts.length === 3 && parts.every(part => !Number.isNaN(part))) {
      const [year, month, day] = parts;
      return new Date(year, month - 1, day, 0, 0, 0, 0);
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
    }
  }

  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
}

export function buildLocalDateRange(startValue?: any, endValue?: any) {
  const startDate = startValue ? parseLocalDate(startValue) : undefined;
  const endDate = endValue ? parseLocalDate(endValue) : undefined;

  if (startDate && endDate) {
    const normalizedEnd = new Date(endDate);
    normalizedEnd.setDate(normalizedEnd.getDate() + 1);
    return { startDate, endDate: normalizedEnd };
  }

  return { startDate, endDate };
}
