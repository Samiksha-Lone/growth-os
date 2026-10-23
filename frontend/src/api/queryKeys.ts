export const taskQueryKey = (date?: string, limit = 20, skip = 0) =>
  ['tasks', { date: date ?? null, limit, skip }] as const;

export const habitQueryKey = (limit = 50, skip = 0) =>
  ['habits', { limit, skip }] as const;

export const dashboardStatsQueryKey = (date: string) =>
  ['dashboard', 'stats', date] as const;
