import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchHabits, fetchRealitySummary, fetchGoals } from '../api/growthos';
import { dashboardStatsQueryKey, habitQueryKey } from '../api/queryKeys';
import { localDateKey } from '../lib/dateUtils';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { DashboardStats, Habit, RealitySummary, Goal } from '../lib/types';

// Calculate streak from completedDates
function calcStreak(completedDates: string[]): number {
  if (!completedDates?.length) return 0;
  const unique = [...new Set(completedDates.map(d => d.split('T')[0]))].sort().reverse();
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const ds of unique) {
    const d = new Date(ds);
    d.setHours(0, 0, 0, 0);
    if (Math.round((current.getTime() - d.getTime()) / 86400000) <= 1) { streak++; current = d; }
    else break;
  }
  return streak;
}

// Build heatmap data from habit completedDates
function buildHeatmap(habits: Habit[]): boolean[] {
  const today = new Date();
  return Array.from({ length: 70 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (69 - i));
    const ds = d.toISOString().split('T')[0];
    return habits.some(h => h.completedDates?.some(cd => cd.startsWith(ds)));
  });
}

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Trends'>('Overview');
  const localDate = useMemo(() => localDateKey(), []);

  const statsQuery = useQuery<DashboardStats>({ 
    queryKey: dashboardStatsQueryKey(localDate),
    queryFn: () => fetchDashboardStats(localDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const habitsQuery = useQuery<Habit[]>({ 
    queryKey: habitQueryKey(30),
    queryFn: () => fetchHabits(30),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const goalsQuery = useQuery<Goal[]>({ 
    queryKey: ['goals'], 
    queryFn: () => fetchGoals(),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const realityQuery = useQuery<RealitySummary>({ 
    queryKey: ['reality', localDate], 
    queryFn: () => fetchRealitySummary(localDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const habits = habitsQuery.data ?? [];
  const goals = goalsQuery.data ?? [];
  const stats = statsQuery.data;
  const reality = realityQuery.data;

  const heatmap = useMemo(() => buildHeatmap(habits), [habits]);
  const weekTrend = stats?.weeklyTrend ?? [];

  const longestStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [])), 0);
  }, [habits]);

  const completionPct = reality?.completionPercentage ?? 0;

  const habitBars = useMemo(() => habits.map(h => ({
    name: h.name.split(' ').slice(0, 2).join(' '),
    streak: calcStreak(h.completedDates ?? []),
    done: h.completedDates?.length ?? 0,
  })), [habits]);

  const goalStats = useMemo(() => ({
    total: goals.length,
    goals: goals.filter(g => g.type === 'goal').length,
    affirmations: goals.filter(g => g.type === 'affirmation').length,
  }), [goals]);

  const futureVision = useMemo(() => {
    const avgWeeklyTasks = weekTrend.length > 0 ? weekTrend.reduce((sum, d) => sum + d.value, 0) / weekTrend.length : 0;
    const projectedTasks = Math.round(avgWeeklyTasks * 4);
    const habitGrowth = longestStreak > 0 ? Math.min(longestStreak + 7, 30) : 7;
    const messages = [];
    if (completionPct >= 80) messages.push("You're executing with great consistency! Keep the momentum high.");
    else if (completionPct >= 50) messages.push("Solid daily progress. Focus on finishing high-priority items first.");
    else messages.push("Every completed task counts. Start with your top 2 priorities tomorrow.");
    if (longestStreak >= 7) messages.push(`Your ${longestStreak}-day streak is impressive. Target ${habitGrowth} days next!`);
    if (projectedTasks > 0) messages.push(`Projected output: ~${projectedTasks} tasks next month at this pace.`);
    return messages;
  }, [completionPct, longestStreak, weekTrend]);

  return (
    <div className="page-stack">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="title-main">My Progress</h1>
          <p className="title-sub text-zinc-400">Track long-term productivity trends and habit longevity.</p>
        </div>
        <div className="tab-group flex gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          {(['Overview', 'Trends'] as const).map(tab => (
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

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'Overview' && (
        <div className="stack-gap-lg">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Tasks Summary */}
            <Card className="primary compact-card bg-[#0c0c0e]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">Tasks Today</span>
              {statsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white leading-none">{stats?.tasksToday ?? 0}</span>
                    <span className="text-sm font-semibold text-zinc-400">/ {stats?.tasksTotal ?? 0} Done</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium mt-1">Completed today</div>
                </div>
              )}
            </Card>

            {/* Habits Summary */}
            <Card className="primary compact-card bg-[#0c0c0e]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">Habits</span>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white leading-none">{habits.length}</span>
                    <span className="text-sm font-semibold text-zinc-400">Active</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium mt-1">Longest streak: {longestStreak} days</div>
                </div>
              )}
            </Card>

            {/* Goals Summary */}
            <Card className="primary compact-card bg-[#0c0c0e]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">Goals</span>
              {goalsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white leading-none">{goalStats.total}</span>
                    <span className="text-sm font-semibold text-zinc-400">Total</span>
                  </div>
                  <div className="text-xs text-zinc-400 font-medium mt-1">{goalStats.goals} goals, {goalStats.affirmations} affirmations</div>
                </div>
              )}
            </Card>

            {/* Success Rate */}
            <Card className="primary compact-card bg-[#0c0c0e]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">Success Rate</span>
              {realityQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white leading-none">{completionPct}</span>
                    <span className="text-sm font-semibold text-zinc-400">%</span>
                  </div>
                  <div className={`text-xs font-bold uppercase tracking-wider mt-1 ${completionPct >= 80 ? 'text-emerald-400' : 'text-accent'}`}>
                    {completionPct >= 80 ? 'Optimal Output' : completionPct >= 50 ? 'Steady Progress' : 'Room for Growth'}
                  </div>
                </div>
              )}
            </Card>

            {/* Future Vision */}
            <Card className="primary compact-card bg-[#0c0c0e] sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">Trajectory & Projections</span>
              <div className="text-sm text-zinc-200 leading-relaxed font-normal space-y-1.5">
                {futureVision.length > 0 ? futureVision.map((msg, i) => <div key={i}>• {msg}</div>) : 'Keep logging to see your growth forecast!'}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── TRENDS TAB ── */}
      {activeTab === 'Trends' && (
        <div className="grid items-start w-full grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          <div className="flex flex-col gap-6">
            {/* Activity Heatmap */}
            <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Habit Consistency</span>
                <span className="text-xs text-zinc-400 font-semibold">Past 70 days</span>
              </div>

              {habitsQuery.isLoading ? <Skeleton height="80px" /> : (
                <div className="stack-gap-md">
                  <div className="grid grid-cols-[repeat(70,1fr)] gap-0.5 sm:gap-1">
                    {heatmap.map((active, i) => (
                      <div
                        key={i}
                        title={active ? 'Habit completed' : 'No completion'}
                        className={`h-3.5 sm:h-4 rounded-sm border border-black/40 transition-all duration-200 ${active ? 'bg-accent shadow-[0_0_8px_rgba(0,191,255,0.4)]' : 'bg-zinc-900'}`}
                      />
                    ))}
                  </div>
                  <div className="flex items-center justify-between px-1 mt-2">
                    <span className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-wider">Low</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2.5 h-2.5 bg-zinc-900 rounded-sm" />
                      <div className="w-2.5 h-2.5 bg-accent/40 rounded-sm" />
                      <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
                    </div>
                    <span className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-wider">High</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Task Completion Rate chart */}
            <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Weekly Progress</span>
                <span className="text-xs text-zinc-400 font-semibold">Tasks completed</span>
              </div>
              <div className="h-[220px] sm:h-[240px] mt-2">
                {statsQuery.isLoading ? <Skeleton height="220px" /> : statsQuery.isError ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
                    <p className="text-sm text-rose-300">Weekly trend couldn't be loaded.</p>
                    <button
                      type="button"
                      onClick={() => statsQuery.refetch()}
                      className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                    >
                      Retry
                    </button>
                  </div>
                ) : weekTrend.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-center text-sm text-zinc-400 font-medium">
                    Weekly trends will appear after activity is logged.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekTrend}>
                      <defs>
                        <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#00bfff" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#00bfff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#1f1f23" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} dy={10} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#00bfff" strokeWidth={2.5} fillOpacity={1} fill="url(#goalGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>
          </div>

          {/* Right Sidebar — Trends */}
          <div className="flex flex-col gap-6">
            {/* Per-habit streak bars */}
            <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-4">Individual Streaks</span>
              {habitsQuery.isLoading ? <Skeleton height="180px" /> : habitBars.length === 0 ? (
                <div className="py-10 text-center text-zinc-400 text-sm font-medium">Add some habits to view streaks!</div>
              ) : (
                <div className="h-[200px] sm:h-[220px] mt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitBars} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#1f1f23" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#71717a', fontSize: 11, fontWeight: 700 }} dy={8} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: '#09090b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '0.8rem', fontWeight: 700 }}
                        cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                      />
                      <Bar dataKey="streak" radius={[6, 6, 0, 0]} barSize={22}>
                        {habitBars.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? '#00bfff' : '#0284c7'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>

            {/* Task Breakdown */}
            <Card className="p-4 sm:p-6 primary bg-[#0c0c0e]">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-4">Task Breakdown</span>
              {realityQuery.isLoading ? <Skeleton height="100px" /> : (
                <div className="space-y-3.5">
                  {[
                    { label: 'Planned Tasks', value: reality?.plannedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#38bdf8' },
                    { label: 'Completed', value: reality?.completedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#10b981' },
                    { label: 'Missed', value: reality?.missedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#f43f5e' },
                  ].map(row => (
                    <div key={row.label} className="space-y-1">
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{row.label}</span>
                        <span className="text-base font-bold text-white">{row.value}</span>
                      </div>
                      <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-500 rounded-full" 
                          style={{ 
                            width: `${Math.min(100, (row.value / Math.max(row.max, 1)) * 100)}%`, 
                            backgroundColor: row.color 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
