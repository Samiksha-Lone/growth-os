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
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 15 * 60 * 1000, // 15 minutes
    enabled: true
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
    .map(habit => ({ habit, streak: calcStreak(habit.completedDateKeys ?? [], localDate) }))
    .filter(({ streak }) => streak > 0), [habitsQuery.data, localDate]);

  return (
    <div className="page-stack">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="title-main">Insights</h1>
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border">
          {(['Insights', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none px-6 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${activeTab === tab ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-transparent text-secondary hover:text-white'}`}
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
          <div className="stack-gap-lg">
            <div className="stack-gap-md">
              <span className="ml-1 uppercase label-sub">Patterns & Trends</span>

              {insightsQuery.isLoading ? (
                <Skeleton height="220px" />
              ) : insightsQuery.isError ? (
                <Card className="p-6 border-l-4 border-red-500 primary bg-red-950/20">
                  <div className="mb-2 font-bold text-red-400">❌ Error loading insights</div>
                  <p className="text-sm text-red-300">{insightsQuery.error?.message || 'Unable to fetch insights'}</p>
                  <button
                    type="button"
                    onClick={() => insightsQuery.refetch()}
                    className="mt-3 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry
                  </button>
                </Card>
              ) : !insightsQuery.data?.insights?.length ? (
                <Card className="p-12 text-center primary">
                  <div className="text-[2rem] mb-4">📊</div>
                  <div className="text-white font-[900] text-[1.2rem] mb-2">Learning your patterns...</div>
                  <p className="text-secondary text-[0.9rem] leading-relaxed max-w-xs mx-auto italic">
                    Keep tracking your habits and tasks! 
                    Insights will appear here as you build your history.
                  </p>
                </Card>
              ) : (
                <div className="stack-gap-sm">
                  {insightsQuery.data.insights.map((insight, idx) => (
                    <Card key={insight.id || idx} className="p-5 border-l-2 primary border-accent">
                      <div className="text-[0.65rem] text-accent font-black uppercase tracking-widest mb-1.5">
                        {insight.title}
                      </div>
                      <p className="text-[0.95rem] text-[#ccc] font-bold leading-relaxed">
                        {insight.detail}
                      </p>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <div className="stack-gap-md">
              <span className="ml-1 uppercase label-sub">Today's Task Categories</span>
              {realityQuery.isLoading ? (
                <Skeleton height="100px" />
              ) : realityQuery.isError ? (
                <Card className="p-4 primary bg-red-950/20">
                  <p className="text-sm text-red-300">Today's task categories are unavailable.</p>
                  <button
                    type="button"
                    onClick={() => realityQuery.refetch()}
                    className="mt-3 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry
                  </button>
                </Card>
              ) : categoryBreakdown.length === 0 ? (
                <Card className="p-5 primary">
                  <p className="text-sm text-secondary">No tasks planned for today.</p>
                </Card>
              ) : (
                <div className="stack-gap-sm">
                  {categoryBreakdown.map(({ category, plannedTasks, completedTasks, missedTasks, completionPercentage }) => (
                    <Card key={category} className="p-4 primary">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-[0.75rem] text-accent font-black uppercase tracking-wider mb-2">
                            {category}
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-2xl font-black text-white">{completedTasks}/{plannedTasks}</div>
                            <div className="text-[0.85rem] text-secondary">
                              {completionPercentage}% complete
                            </div>
                          </div>
                          <p className="mt-1 text-xs text-secondary/70">{missedTasks} missed</p>
                        </div>
                        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-border">
                          <span className="text-lg font-black">{completionPercentage}%</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Daily Reality Check */}
          <div className="stack-gap-lg">
            {realityQuery.isLoading ? (
              <Skeleton height="120px" />
            ) : realityQuery.isError ? (
              <Card className="p-6 border-l-4 border-red-500 primary bg-red-950/20">
                <div className="font-bold text-red-400">❌ Error loading reality check</div>
                <div className="mt-2 text-sm text-red-300">{realityQuery.error?.message}</div>
                <button
                  type="button"
                  onClick={() => realityQuery.refetch()}
                  className="mt-3 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry
                </button>
              </Card>
            ) : (
              <Card className="p-6 border-l-4 primary border-cyan-400">
                <div className="text-[0.7rem] text-cyan-400 font-black uppercase tracking-widest mb-2">
                  Today's Reality
                </div>
                {reality && reality.plannedTasks > 0 ? (
                  <>
                    <div className="mb-4">
                      <div className="text-[2.5rem] font-black text-white mb-2">{completionPct}%</div>
                      <p className="text-secondary text-[0.9rem] font-bold">
                        {reality.completedTasks} of {reality.plannedTasks} tasks completed · {reality.missedTasks} missed
                      </p>
                    </div>
                    <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all bg-gradient-to-r from-cyan-500 to-cyan-400"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-sm font-bold text-secondary">No tasks planned for today.</p>
                )}
              </Card>
            )}

            {/* Habit Streaks */}
            <div className="stack-gap-md">
              <span className="ml-1 uppercase label-sub">Active Streaks</span>
              {habitsQuery.isLoading ? (
                <Skeleton height="100px" />
              ) : habitsQuery.isError ? (
                <Card className="p-4 primary bg-red-950/20">
                  <p className="text-sm text-red-300">❌ Error loading habits: {habitsQuery.error?.message}</p>
                  <button
                    type="button"
                    onClick={() => habitsQuery.refetch()}
                    className="mt-3 text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry
                  </button>
                </Card>
              ) : !habitsQuery.data?.length ? (
                <Card className="p-6 text-center primary">
                  <p className="text-secondary text-[0.9rem]">No habits tracked yet.</p>
                </Card>
              ) : activeStreaks.length > 0 ? (
                <div className="stack-gap-sm">
                  {activeStreaks.map(({ habit, streak }) => (
                    <Card key={habit._id} className="p-4 primary">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="break-words text-[0.9rem] font-bold text-white mb-1">
                            {habit.name}
                          </div>
                          <div className="text-[0.8rem] text-secondary">
                            {streak} day streak
                          </div>
                        </div>
                        <div className="shrink-0 text-[1.5rem]">🔥</div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="p-6 text-center primary">
                  <p className="text-secondary text-[0.9rem]">No active streaks yet</p>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'Goals' && (
        <div className="stack-gap-md">
          <span className="ml-1 uppercase label-sub">Personal Objectives</span>
          <Card className="p-8 text-center primary">
            <div className="text-[2rem] mb-4">🎯</div>
            <div className="text-white font-[900] text-[1.1rem] mb-2">Manage your goals</div>
            <p className="text-secondary text-[0.9rem] leading-relaxed">
              Goals and affirmations are managed in Habits &amp; Routine.
            </p>
            <Link to="/habits" className="mt-4 inline-block text-sm font-bold text-accent transition-colors hover:text-white">
              Open Habits &amp; Routine
            </Link>
          </Card>
        </div>
      )}
    </div>
  );
}
