import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { fetchInsights, fetchRealitySummary, fetchHabits } from '../api/growthos';
import { habitQueryKey } from '../api/queryKeys';
import { localDateKey } from '../lib/dateUtils';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { AdvancedAnalytics, RealitySummary, Habit } from '../lib/types';

function calcStreak(completedDates: string[], todayKey: string): number {
  if (!completedDates?.length) return 0;
  const unique = new Set(completedDates
    .map(date => date.slice(0, 10))
    .filter(dateKey => /^\d{4}-\d{2}-\d{2}$/.test(dateKey) && dateKey <= todayKey));
  const [year, month, day] = todayKey.split('-').map(Number);
  let current = new Date(year, month - 1, day);
  let streak = 0;

  if (!unique.has(todayKey)) {
    current.setDate(current.getDate() - 1);
    const yesterdayKey = localDateKey(current);
    if (!unique.has(yesterdayKey)) return 0;
  }

  while (unique.has(localDateKey(current))) {
    streak++;
    current.setDate(current.getDate() - 1);
  }
  return streak;
}

async function fetchAllHabits(): Promise<Habit[]> {
  const habits: Habit[] = [];
  const pageSize = 100;

  for (let skip = 0; ; skip += pageSize) {
    const page = await fetchHabits(pageSize, skip);
    habits.push(...page);
    if (page.length < pageSize) return habits;
  }
}

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'Insights' | 'Goals'>('Insights');
  const [localDate, setLocalDate] = useState(() => localDateKey());

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);
    const timeoutId = window.setTimeout(
      () => setLocalDate(localDateKey()),
      nextDay.getTime() - now.getTime()
    );

    return () => window.clearTimeout(timeoutId);
  }, [localDate]);

  const insightsQuery = useQuery<AdvancedAnalytics>({ 
    queryKey: ['insights', localDate],
    queryFn: () => fetchInsights(localDate),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
  });
  const realityQuery = useQuery<RealitySummary>({ 
    queryKey: ['reality', localDate], 
    queryFn: () => fetchRealitySummary(localDate),
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
  const habitsQuery = useQuery<Habit[]>({
    queryKey: habitQueryKey(100),
    queryFn: fetchAllHabits,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const reality = realityQuery.data;
  const completionPct = reality?.completionPercentage ?? 0;
  const categoryBreakdown = reality?.categoryBreakdown ?? [];
  const activeStreaks = useMemo(() => (habitsQuery.data ?? [])
    .map(habit => ({ habit, streak: calcStreak(habit.completedDates ?? [], localDate) }))
    .filter(({ streak }) => streak > 0), [habitsQuery.data, localDate]);

  return (
    <div className="page-stack">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="title-main">Insights</h1>
          <p className="title-sub text-zinc-400">Discover behavioral trends, productivity patterns, and execution velocity.</p>
        </div>
        <div className="tab-group flex gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          {(['Insights', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-[#1c1c22] text-white shadow-md border border-white/10'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── INSIGHTS TAB ── */}
      {activeTab === 'Insights' && (
        <div className="split-layout">
          {/* Left: Pattern Insights */}
          <div className="stack-gap-lg min-w-0">
            <div className="stack-gap-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Patterns & Trends</span>

              {insightsQuery.isLoading ? (
                <Skeleton height="220px" />
              ) : insightsQuery.isError ? (
                <Card className="p-5 border-l-4 border-rose-500 primary bg-rose-950/20">
                  <div className="mb-1 font-bold text-rose-400 text-sm">Error loading insights</div>
                  <p className="text-xs text-rose-300">{insightsQuery.error?.message || 'Unable to fetch insights'}</p>
                  <button
                    type="button"
                    onClick={() => insightsQuery.refetch()}
                    className="mt-3 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry
                  </button>
                </Card>
              ) : !insightsQuery.data?.insights?.length ? (
                <Card className="p-8 sm:p-12 text-center primary bg-[#0c0c0e]">
                  <div className="text-3xl mb-3">📊</div>
                  <div className="text-white font-bold text-base sm:text-lg mb-1.5">Learning your patterns...</div>
                  <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
                    Keep logging your habits and daily reflections. Smart insights will generate automatically as history builds.
                  </p>
                </Card>
              ) : (
                <div className="stack-gap-sm">
                  {insightsQuery.data.insights.map((insight, idx) => (
                    <Card key={insight.id || idx} className="p-4 sm:p-5 border-l-4 primary border-accent bg-[#0c0c0e]">
                      <div className="text-xs text-accent font-bold uppercase tracking-wider mb-1.5">
                        {insight.title}
                      </div>
                      <p className="text-sm sm:text-base text-zinc-200 font-normal leading-relaxed">
                        {insight.detail}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="stack-gap-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Today's Task Categories</span>
              {realityQuery.isLoading ? (
                <Skeleton height="100px" />
              ) : realityQuery.isError ? (
                <Card className="p-4 primary bg-rose-950/20">
                  <p className="text-sm text-rose-300">Today's task categories are unavailable.</p>
                  <button
                    type="button"
                    onClick={() => realityQuery.refetch()}
                    className="mt-2 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry
                  </button>
                </Card>
              ) : categoryBreakdown.length === 0 ? (
                <Card className="p-6 text-center primary bg-[#0c0c0e]">
                  <p className="text-sm text-zinc-400 font-medium">No tasks scheduled for today.</p>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {categoryBreakdown.map(({ category, plannedTasks, completedTasks, missedTasks, completionPercentage }) => (
                    <Card key={category} className="p-4 primary bg-[#0c0c0e]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <span className={`text-[0.65rem] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider tag-${category.toLowerCase() || 'personal'}`}>
                            {category}
                          </span>
                          <div className="flex items-baseline gap-2 mt-2">
                            <span className="text-xl font-bold text-white">{completedTasks}/{plannedTasks}</span>
                            <span className="text-xs text-zinc-400 font-semibold">{completionPercentage}% done</span>
                          </div>
                          {missedTasks > 0 && (
                            <p className="mt-1 text-xs text-rose-400 font-medium">{missedTasks} missed</p>
                          )}
                        </div>
                        <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-white/5 border border-white/10 shrink-0">
                          <span className="text-sm font-black text-white">{completionPercentage}%</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Daily Reality Check */}
          <div className="stack-gap-lg min-w-0">
            {realityQuery.isLoading ? (
              <Skeleton height="120px" />
            ) : realityQuery.isError ? (
              <Card className="p-5 border-l-4 border-rose-500 primary bg-rose-950/20">
                <div className="font-bold text-rose-400 text-sm">Error loading reality check</div>
                <div className="mt-1 text-xs text-rose-300">{realityQuery.error?.message}</div>
                <button
                  type="button"
                  onClick={() => realityQuery.refetch()}
                  className="mt-3 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry
                </button>
              </Card>
            ) : (
              <Card className="p-5 border-l-4 primary border-accent bg-[#0c0c0e]">
                <div className="text-xs text-accent font-bold uppercase tracking-wider mb-2">
                  Today's Execution
                </div>
                {reality && reality.plannedTasks > 0 ? (
                  <>
                    <div className="mb-3">
                      <div className="text-3xl font-black text-white mb-1">{completionPct}%</div>
                      <p className="text-zinc-300 text-xs sm:text-sm font-medium">
                        {reality.completedTasks} of {reality.plannedTasks} tasks completed · {reality.missedTasks} missed
                      </p>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 bg-accent rounded-full"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-zinc-400 font-medium">No tasks planned for today.</p>
                )}
              </Card>
            )}

            {/* Habit Streaks */}
            <div className="stack-gap-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Active Streaks</span>
              {habitsQuery.isLoading ? (
                <Skeleton height="100px" />
              ) : habitsQuery.isError ? (
                <Card className="p-4 primary bg-rose-950/20">
                  <p className="text-xs text-rose-300">Error loading habits</p>
                </Card>
              ) : !habitsQuery.data?.length ? (
                <Card className="p-5 text-center primary bg-[#0c0c0e]">
                  <p className="text-zinc-400 text-sm font-medium">No habits tracked yet.</p>
                </Card>
              ) : activeStreaks.length > 0 ? (
                <div className="stack-gap-sm">
                  {activeStreaks.map(({ habit, streak }) => (
                    <Card key={habit._id} className="p-3.5 sm:p-4 primary bg-[#0c0c0e]">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="break-words text-sm sm:text-base font-bold text-white mb-0.5">
                            {habit.name}
                          </div>
                          <div className="text-xs text-emerald-400 font-semibold">
                            {streak} day streak
                          </div>
                        </div>
                        <div className="shrink-0 text-xl">🔥</div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-5 text-center primary bg-[#0c0c0e]">
                  <p className="text-zinc-400 text-sm font-medium">No active streaks yet.</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'Goals' && (
        <div className="stack-gap-md min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Personal Objectives</span>
          <Card className="p-8 sm:p-12 text-center primary bg-[#0c0c0e]">
            <div className="text-3xl mb-3">🎯</div>
            <div className="text-white font-bold text-base sm:text-lg mb-1.5">Manage your objectives</div>
            <p className="text-zinc-400 text-sm leading-relaxed max-w-sm mx-auto">
              Goals and daily affirmations can be viewed and updated in Habits &amp; Routine.
            </p>
            <Link to="/habits" className="mt-4 inline-block px-6 py-2.5 bg-accent hover:bg-accent/90 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-md">
              Open Habits &amp; Routine
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
