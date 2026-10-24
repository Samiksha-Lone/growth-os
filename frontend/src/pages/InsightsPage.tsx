import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fetchProductivityReport } from '../api/growthos';
import { productivityReportQueryKey } from '../api/queryKeys';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { localDateKey } from '../lib/dateUtils';

type RangePreset = '7d' | '30d' | 'custom';

const chartTooltipStyle = {
  background: '#09090b',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '12px',
  color: '#fff',
};

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function formatDate(dateKey: string, options?: Intl.DateTimeFormatOptions): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) return '—';
  const [, yearValue, monthValue, dayValue] = match;
  const year = Number(yearValue);
  const month = Number(monthValue);
  const day = Number(dayValue);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, options ?? {
    month: 'short',
    day: 'numeric',
  });
}

function weekStartKey(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() - (date.getDay() + 6) % 7);
  return localDateKey(date);
}

function percentage(value: number | null): string {
  return value === null ? '—' : `${value}%`;
}

function MetricCard({
  title,
  count,
  rate,
  rateLabel,
  detail,
}: {
  title: string;
  count: string;
  rate: string;
  rateLabel: string;
  detail: string;
}) {
  return (
    <Card className="primary compact-card bg-[#0c0c0e]">
      <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-300">{title}</h3>
      <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-3xl font-black leading-none text-white sm:text-4xl">{count}</span>
        <span className="text-right">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-zinc-500">{rateLabel}</span>
          <span className="text-sm font-bold text-accent">{rate}</span>
        </span>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-zinc-400">{detail}</p>
    </Card>
  );
}

function EmptyState({ children }: { children: string }) {
  return (
    <div className="flex min-h-28 items-center justify-center rounded-xl border border-white/10 bg-black/10 px-4 py-6 text-center text-sm text-zinc-400">
      {children}
    </div>
  );
}

export default function InsightsPage() {
  const today = localDateKey();
  const [preset, setPreset] = useState<RangePreset>('7d');
  const [customStart, setCustomStart] = useState(() => shiftDateKey(localDateKey(), -6));
  const [customEnd, setCustomEnd] = useState(today);
  const startDate = preset === '7d'
    ? shiftDateKey(today, -6)
    : preset === '30d'
      ? shiftDateKey(today, -29)
      : customStart;
  const endDate = preset === 'custom' ? customEnd : today;
  const customDayCount = customStart && customEnd
    ? Math.round((Date.parse(`${customEnd}T00:00:00`) - Date.parse(`${customStart}T00:00:00`)) / 86400000) + 1
    : 0;
  const rangeIsValid = Boolean(startDate && endDate) && startDate <= endDate && endDate <= today &&
    (preset !== 'custom' || customDayCount <= 366);
  const reportQuery = useQuery({
    queryKey: [...productivityReportQueryKey, startDate, endDate],
    queryFn: () => fetchProductivityReport(startDate, endDate),
    enabled: rangeIsValid,
    staleTime: 0,
  });
  const rangeLabel = useMemo(
    () => `${formatDate(startDate, { month: 'short', day: 'numeric', year: 'numeric' })} – ${formatDate(endDate, { month: 'short', day: 'numeric', year: 'numeric' })}`,
    [startDate, endDate],
  );

  const report = reportQuery.data;
  const aggregateWeekly = (report?.dailyTasks.length ?? 0) > 31;
  const taskTrend = useMemo(() => {
    if (!report || !aggregateWeekly) return report?.dailyTasks ?? [];
    const weeks = new Map<string, { date: string; planned: number; completed: number }>();
    report.dailyTasks.forEach(day => {
      const date = weekStartKey(day.date);
      const current = weeks.get(date) ?? { date, planned: 0, completed: 0 };
      current.planned += day.planned;
      current.completed += day.completed;
      weeks.set(date, current);
    });
    return [...weeks.values()];
  }, [aggregateWeekly, report]);
  const habitTrend = useMemo(() => {
    if (!report || !aggregateWeekly) return report?.habits.daily ?? [];
    const weeks = new Map<string, { date: string; completed: number; eligible: number; completionRate: number | null }>();
    report.habits.daily.forEach(day => {
      const date = weekStartKey(day.date);
      const current = weeks.get(date) ?? { date, completed: 0, eligible: 0, completionRate: null };
      current.completed += day.completed;
      current.eligible += day.eligible;
      current.completionRate = current.eligible
        ? Math.round(current.completed / current.eligible * 100)
        : null;
      weeks.set(date, current);
    });
    return [...weeks.values()];
  }, [aggregateWeekly, report]);
  const moodTrend = useMemo(() => {
    if (!report) return [];
    if (!aggregateWeekly) {
      return report.journal.moods.map(item => ({ date: item.date, mood: item.mood }));
    }
    const weeks = new Map<string, { date: string; moodTotal: number; entries: number; mood: number }>();
    report.journal.moods.forEach(item => {
      const date = weekStartKey(item.date);
      const current = weeks.get(date) ?? { date, moodTotal: 0, entries: 0, mood: 0 };
      current.moodTotal += item.mood;
      current.entries += 1;
      current.mood = Math.round(current.moodTotal / current.entries * 100) / 100;
      weeks.set(date, current);
    });
    return [...weeks.values()];
  }, [aggregateWeekly, report]);

  const comparableHabits = report?.habits.performance
    .filter(habit => habit.sufficientData && habit.completionRate !== null)
    .sort((left, right) => (left.completionRate ?? 0) - (right.completionRate ?? 0)) ?? [];
  const categoryComparison = report?.categories
    .filter(category => category.planned >= 3 && category.completionRate !== null) ?? [];
  const moodTrendHasEnoughData = moodTrend.length > 1;

  return (
    <div className="page-stack min-w-0">
      <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
        <div>
          <h1 className="title-main">Insights</h1>
          <p className="title-sub text-zinc-400">See how your task follow-through and habits change over time.</p>
        </div>
        <div className="flex flex-col gap-2 self-start sm:flex-row sm:items-center xl:self-auto">
          <div className="flex flex-wrap gap-1.5 rounded-xl border border-white/10 bg-[#09090b] p-1.5">
            {([
              { value: '7d', label: 'Last 7 days' },
              { value: '30d', label: 'Last 30 days' },
              { value: 'custom', label: 'Custom' },
            ] as const).map(option => (
              <button
                key={option.value}
                type="button"
                onClick={() => setPreset(option.value)}
                aria-pressed={preset === option.value}
                className={`rounded-lg px-3 py-2 text-xs font-bold transition-colors ${preset === option.value ? 'border border-white/10 bg-[#1c1c22] text-white' : 'text-zinc-400 hover:text-white'}`}
              >
                {option.label}
              </button>
            ))}
          </div>
          {preset === 'custom' && (
            <div className="flex flex-wrap items-center gap-2">
              <label className="sr-only" htmlFor="insights-start-date">Start date</label>
              <input
                id="insights-start-date"
                type="date"
                max={today}
                value={customStart}
                onChange={event => setCustomStart(event.target.value)}
                className="min-w-0 rounded-lg border border-white/10 bg-[#0c0c0e] px-2.5 py-2 text-xs text-white"
              />
              <span className="text-xs text-zinc-500">to</span>
              <label className="sr-only" htmlFor="insights-end-date">End date</label>
              <input
                id="insights-end-date"
                type="date"
                max={today}
                value={customEnd}
                onChange={event => setCustomEnd(event.target.value)}
                className="min-w-0 rounded-lg border border-white/10 bg-[#0c0c0e] px-2.5 py-2 text-xs text-white"
              />
            </div>
          )}
        </div>
      </div>

      <p className="text-xs font-semibold text-zinc-400">Selected period: {rangeLabel}</p>

      {!rangeIsValid ? (
        <Card className="p-5 border-l-4 border-rose-500 primary bg-rose-950/20">
          <p className="text-sm font-semibold text-rose-300">Choose a valid date range ending today or earlier. Custom ranges are limited to 366 days.</p>
        </Card>
      ) : reportQuery.isLoading ? (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Skeleton height="118px" />
            <Skeleton height="118px" />
          </div>
          <Skeleton height="320px" />
        </div>
      ) : reportQuery.isError ? (
        <Card className="p-5 border-l-4 border-rose-500 primary bg-rose-950/20">
          <div className="font-bold text-rose-300">Insights could not be loaded</div>
          <p className="mt-1 text-sm text-rose-200/80">{reportQuery.error.message}</p>
          <button type="button" onClick={() => reportQuery.refetch()} className="mt-3 text-xs font-black uppercase tracking-widest text-accent hover:text-white">Retry</button>
        </Card>
      ) : report ? (
        <div className="page-stack">
          <section className="page-stack">
            <h2 className="text-base font-bold text-white">Overview</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <MetricCard
                title="Task completion"
                count={`${report.tasks.completed} / ${report.tasks.planned}`}
                rate={percentage(report.tasks.completionRate)}
                rateLabel="Completion rate"
                detail="Completed / scheduled tasks in this period. Rate is completed tasks divided by scheduled tasks."
              />
              <MetricCard
                title="Habit consistency"
                count={`${report.habits.completedHabitDays} / ${report.habits.eligibleHabitDays}`}
                rate={percentage(report.habits.completionRate)}
                rateLabel="Consistency rate"
                detail="Recorded check-ins / eligible habit-days. The current model assumes each habit is due daily."
              />
            </div>

            <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-white">Task trend</h3>
                <p className="mt-1 text-xs text-zinc-400">
                  {aggregateWeekly ? 'Weekly totals starting Monday, using dates in this period.' : 'Daily counts grouped by planned date.'}
                  {' '}Completed bars use each task's current saved status, not its actual completion date.
                </p>
              </div>
              {report.tasks.planned === 0 ? (
                <EmptyState>No tasks were scheduled in this period.</EmptyState>
              ) : (
                <div className="h-64 min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={taskTrend} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                      <CartesianGrid stroke="#27272a" vertical={false} />
                      <XAxis dataKey="date" interval="preserveStartEnd" tickFormatter={date => formatDate(String(date))} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fill: '#a1a1aa', fontSize: 11 }} label={{ value: 'Tasks', angle: -90, position: 'insideLeft', fill: '#a1a1aa', fontSize: 11 }} />
                      <Tooltip labelFormatter={date => formatDate(String(date), { weekday: 'short', month: 'short', day: 'numeric' })} contentStyle={chartTooltipStyle} />
                      <Legend />
                      <Bar dataKey="planned" name="Scheduled" fill="#52525b" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="completed" name="Currently completed" fill="#00bfff" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {(report.tasks.unfinished > 0 || report.tasks.missed > 0) && (
              <p className="text-xs text-zinc-400">
                Among tasks scheduled in this period: {report.tasks.unfinished} are currently pending or in progress; {report.tasks.missed} are marked missed.
              </p>
            )}
          </section>

          <section className="page-stack">
            <h2 className="text-base font-bold text-white">Patterns</h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              <Card className="p-4 sm:p-6 primary bg-[#0c0c0e] xl:col-span-2">
                <div className="mb-4">
                  <h3 className="text-sm font-bold text-white">Habit consistency trend</h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Check-ins / eligible habit-days by {aggregateWeekly ? 'week' : 'day'}; assumes each habit is due daily.
                  </p>
                </div>
                {report.habits.eligibleHabitDays === 0 ? (
                  <EmptyState>No habits were eligible during this period.</EmptyState>
                ) : habitTrend.filter(point => point.completionRate !== null).length < 2 ? (
                  <EmptyState>More eligible days are needed to show a trend.</EmptyState>
                ) : (
                  <div className="h-56 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={habitTrend} margin={{ top: 8, right: 12, bottom: 4, left: -18 }}>
                        <CartesianGrid stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" interval="preserveStartEnd" tickFormatter={date => formatDate(String(date))} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                        <YAxis domain={[0, 100]} unit="%" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={date => formatDate(String(date), { weekday: 'short', month: 'short', day: 'numeric' })}
                          formatter={(value, _name, item) => [`${value}% (${item.payload.completed}/${item.payload.eligible})`, 'Habit consistency']}
                          contentStyle={chartTooltipStyle}
                        />
                        <Line type="monotone" dataKey="completionRate" name="Habit consistency" stroke="#00bfff" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {comparableHabits.length >= 2 && comparableHabits[0].completionRate !== comparableHabits[comparableHabits.length - 1].completionRate && (
                  <div className="mt-4 grid grid-cols-1 gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                    <p className="text-sm text-zinc-300">
                      <span className="font-semibold text-white">Highest in range:</span> {comparableHabits[comparableHabits.length - 1].name}
                      {' '}({percentage(comparableHabits[comparableHabits.length - 1].completionRate)}, {comparableHabits[comparableHabits.length - 1].completedDays}/{comparableHabits[comparableHabits.length - 1].eligibleDays} days)
                    </p>
                    <p className="text-sm text-zinc-300">
                      <span className="font-semibold text-white">Lowest in range:</span> {comparableHabits[0].name}
                      {' '}({percentage(comparableHabits[0].completionRate)}, {comparableHabits[0].completedDays}/{comparableHabits[0].eligibleDays} days)
                    </p>
                    <p className="text-xs text-zinc-500 sm:col-span-2">Comparison includes habits with at least 7 eligible days in this period.</p>
                  </div>
                )}
              </Card>

              {moodTrendHasEnoughData && (
                <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
                  <h3 className="text-sm font-bold text-white">Mood pattern</h3>
                  <p className="mt-1 text-xs text-zinc-400">
                    Saved mood values normalized to 1–3 (Challenging to Good), shown by {aggregateWeekly ? 'week' : 'entry date'}.
                    {aggregateWeekly ? ' Each bar is the average for that week.' : ' Gaps mean no mood was recorded.'}
                  </p>
                  <div className="mt-4 h-48 min-w-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={moodTrend} margin={{ top: 8, right: 8, bottom: 4, left: 4 }}>
                        <CartesianGrid stroke="#27272a" vertical={false} />
                        <XAxis dataKey="date" interval="preserveStartEnd" tickFormatter={date => formatDate(String(date))} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                        <YAxis domain={[1, 3]} ticks={[1, 2, 3]} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                        <Tooltip
                          labelFormatter={date => formatDate(String(date), { weekday: 'short', month: 'short', day: 'numeric' })}
                          formatter={(value, _name, item) => [`${value} / 3${aggregateWeekly ? ` (${item.payload.entries} entries)` : ''}`, aggregateWeekly ? 'Weekly average' : 'Saved mood']}
                          contentStyle={chartTooltipStyle}
                        />
                        <Bar dataKey="mood" name={aggregateWeekly ? 'Weekly average mood' : 'Saved mood'} fill="#00bfff" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              )}

              {categoryComparison.length >= 2 && (
                <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
                  <h3 className="text-sm font-bold text-white">Task categories</h3>
                  <p className="mb-4 mt-1 text-xs text-zinc-400">Completion by category; only categories with at least 3 scheduled tasks.</p>
                  <div className="space-y-4">
                    {categoryComparison.map(category => (
                      <div key={category.category}>
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-semibold text-white">{category.category}</span>
                          <span className="shrink-0 text-accent">{percentage(category.completionRate)} · {category.completed}/{category.planned}</span>
                        </div>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-accent" style={{ width: `${category.completionRate ?? 0}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
