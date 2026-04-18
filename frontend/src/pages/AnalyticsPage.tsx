import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchHabits, fetchRealitySummary, fetchWeeklyChartData } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { DashboardStats, Habit, RealitySummary } from '../lib/types';


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
  const [activeTab, setActiveTab] = useState<'Habit Consistency' | 'Goals'>('Habit Consistency');

  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const statsQuery = useQuery<DashboardStats>({ 
    queryKey: ['analytics', 'stats', localDate], 
    queryFn: () => fetchDashboardStats(localDate) 
  });
  const habitsQuery = useQuery<Habit[]>({ 
    queryKey: ['habits'], 
    queryFn: () => fetchHabits() 
  });
  const realityQuery = useQuery<RealitySummary>({ 
    queryKey: ['reality', localDate], 
    queryFn: () => fetchRealitySummary(localDate) 
  });
  const weeklyQuery = useQuery({ 
    queryKey: ['analytics', 'weekly-trend'], 
    queryFn: () => fetchWeeklyChartData() 
  });

  const habits = habitsQuery.data ?? [];
  const stats = statsQuery.data;
  const reality = realityQuery.data;

  const heatmap = useMemo(() => buildHeatmap(habits), [habits]);
  const weekTrend = weeklyQuery.data || [];

  const longestStreak = useMemo(() => {
    return habits.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [])), 0);
  }, [habits]);

  const completionPct = reality?.completionPercentage ?? 0;

  const habitBars = useMemo(() => habits.map(h => ({
    name: h.name.split(' ').slice(0, 2).join(' '),
    streak: calcStreak(h.completedDates ?? []),
    done: h.completedDates?.length ?? 0,
  })), [habits]);

  return (
    <div className="page-stack">
      <div className="flex items-center justify-between">
        <h1 className="title-main">My Progress</h1>
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border">
          {(['Habit Consistency', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${activeTab === tab ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-transparent text-secondary hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── HABIT CONSISTENCY TAB ── */}
      {activeTab === 'Habit Consistency' && (
        <div className="grid grid-cols-2 gap-8 w-full items-start">
          <div className="flex flex-col gap-8">
            {/* Activity Heatmap */}
            <Card className="primary p-6">
              <div className="flex justify-between items-center mb-6">
                <span className="uppercase label-sub">Habit Consistency</span>
                <span className="text-[0.65rem] text-secondary/40 font-black uppercase tracking-widest">Past 70 days</span>
              </div>

              {habitsQuery.isLoading ? <Skeleton height="80px" /> : (
                <div className="stack-gap-md">
                  <div className="grid grid-cols-[repeat(70,1fr)] gap-1">
                    {heatmap.map((active, i) => (
                      <div
                        key={i}
                        title={active ? 'Entry stored' : 'No data'}
                        className={`h-3.5 rounded-sm border border-[#000]/20 transition-all duration-300 ${active ? 'bg-accent shadow-[0_0_10px_rgba(58,134,255,0.2)]' : 'bg-[#0a0a0a]'}`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-4 px-1">
                    <span className="text-[0.6rem] text-secondary/30 font-black uppercase tracking-widest">Minimal Data</span>
                    <div className="flex gap-1.5 items-center">
                      <div className="w-2.5 h-2.5 bg-[#0a0a0a] rounded-sm" />
                      <div className="w-2.5 h-2.5 bg-accent/40 rounded-sm" />
                      <div className="w-2.5 h-2.5 bg-accent rounded-sm" />
                    </div>
                    <span className="text-[0.6rem] text-secondary/30 font-black uppercase tracking-widest">Peak Density</span>
                  </div>
                </div>
              )}
            </Card>

            {/* Per-habit streak bars */}
            <Card className="primary p-6">
              <span className="mb-8 uppercase label-sub">Individual Streaks</span>
              {habitsQuery.isLoading ? <Skeleton height="180px" /> : habitBars.length === 0 ? (
                <div className="py-12 text-center text-secondary/40 text-[0.85rem] font-bold italic">Add some habits to see your progress!</div>
              ) : (
                <div className="h-[220px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitBars} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#0a0a0a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 10, fontWeight: 800 }} dy={10} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)' }}
                        itemStyle={{ color: '#fff', fontSize: '0.75rem', fontWeight: 800 }}
                        cursor={{ fill: '#ffffff02' }}
                      />
                      <Bar dataKey="streak" radius={[6, 6, 0, 0]} barSize={24}>
                        {habitBars.map((_, i) => (
                          <Cell key={i} fill={i % 2 === 0 ? '#3a86ff' : '#1d2d44'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar — Habit Stats */}
          <div className="flex flex-col gap-8">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Best Streak</span>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="stack-gap-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{longestStreak}</span>
                    <span className="label-sub uppercase !text-[0.7rem] text-secondary/60">Days</span>
                  </div>
                  <div className={`text-[0.65rem] font-black uppercase tracking-widest mt-1 ${longestStreak > 0 ? 'text-[#06d6a0]' : 'text-secondary/40'}`}>
                    {longestStreak > 0 ? 'Great job staying consistent!' : 'Start a habit today!'}
                  </div>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Total Habits</span>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{habits.length}</span>
                  <span className="label-sub uppercase !text-[0.7rem] text-secondary/60">Habits</span>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Today's Status</span>
              {habitsQuery.isLoading ? <Skeleton height="80px" /> : (
                <div className="stack-gap-xs">
                  {habits.map(h => {
                    const todayStr = new Date().toISOString().split('T')[0];
                    const done = h.completedDates?.some(d => d.startsWith(todayStr));
                    return (
                      <div key={h._id} className="flex justify-between items-center py-2 border-b border-[#0f0f0f] last:border-0">
                        <span className={`text-[0.8rem] font-bold ${done ? 'text-secondary/30' : 'text-[#bbb]'}`}>{h.name}</span>
                        <span className={`text-[0.65rem] font-black uppercase tracking-widest ${done ? 'text-[#06d6a0]' : 'text-secondary/20'}`}>
                          {done ? 'DONE' : 'TBD'}
                        </span>
                      </div>
                    );
                  })}
                  {habits.length === 0 && <div className="text-secondary/30 text-[0.75rem] italic">No habits started.</div>}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── GOALS / TASK COMPLETION TAB ── */}
      {activeTab === 'Goals' && (
        <div className="grid grid-cols-2 gap-8 w-full items-start">
          <div className="flex flex-col gap-8">
            {/* Task Completion Rate chart */}
            <Card className="primary p-6">
              <div className="flex justify-between items-center mb-10">
                <span className="uppercase label-sub">Weekly Progress</span>
                <span className="text-[0.65rem] text-secondary/40 font-black uppercase tracking-widest">Tasks completed</span>
              </div>
              <div className="h-[240px] mt-4">
                {weeklyQuery.isLoading ? <Skeleton height="240px" /> : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weekTrend}>
                      <defs>
                        <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.2} />
                          <stop offset="95%" stopColor="#3a86ff" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid vertical={false} stroke="#0a0a0a" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#333', fontSize: 10, fontWeight: 800 }} dy={12} />
                      <YAxis hide domain={[0, 100]} />
                      <Tooltip
                        contentStyle={{ background: '#0a0a0a', border: '1px solid #1a1a1a', borderRadius: '12px' }}
                        itemStyle={{ color: '#fff', fontSize: '0.8rem', fontWeight: 800 }}
                      />
                      <Area type="monotone" dataKey="value" stroke="#3a86ff" strokeWidth={3} fillOpacity={1} fill="url(#goalGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </Card>

            {/* Planned vs Completed bar */}
            <Card className="primary p-6">
              <span className="mb-8 uppercase label-sub">Task Breakdown</span>
              {realityQuery.isLoading ? <Skeleton height="100px" /> : (
                <div className="stack-gap-md mt-4">
                  {[
                    { label: 'Planned Tasks', value: reality?.plannedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#333' },
                    { label: 'Completed', value: reality?.completedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#06d6a0' },
                    { label: 'Missed', value: reality?.missedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#ef476f' },
                  ].map(row => (
                    <div key={row.label} className="stack-gap-xs">
                      <div className="flex justify-between items-baseline">
                        <span className="text-[0.7rem] text-secondary font-black uppercase tracking-widest">{row.label}</span>
                        <span className="text-[1.1rem] font-black text-white">{row.value}</span>
                      </div>
                      <div className="h-1 bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div 
                          className="h-full transition-all duration-700" 
                          style={{ 
                            width: `${Math.min(100, (row.value / Math.max(row.max, 1)) * 100)}%`, 
                            background: row.color.startsWith('#') ? row.color : undefined 
                          }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar — Goal stats */}
          <div className="flex flex-col gap-8">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Success Rate</span>
              {realityQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="stack-gap-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{completionPct}</span>
                    <span className="label-sub uppercase !text-[0.7rem] text-secondary/60">%</span>
                  </div>
                  <div className={`text-[0.65rem] font-black uppercase tracking-widest mt-1 ${completionPct >= 80 ? 'text-[#06d6a0]' : 'text-accent'}`}>
                    {completionPct >= 80 ? 'Optimal Performance' : completionPct >= 50 ? 'Stable Output' : 'System Degraded'}
                  </div>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Completed Tasks</span>
              {statsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{stats?.tasksToday ?? 0}</span>
                  <span className="label-sub uppercase !text-[0.7rem] text-secondary/60">/ {stats?.tasksTotal ?? 0} Done</span>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Total Focus Time</span>
              {statsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="stack-gap-sm">
                  <div className="flex items-baseline gap-2">
                    <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{Math.floor((stats?.focusMinutes ?? 0) / 60)}</span>
                    <span className="label-sub uppercase !text-[0.75rem] text-secondary/60">H {(stats?.focusMinutes ?? 0) % 60}M</span>
                  </div>
                  <div className="text-[0.65rem] text-secondary/30 font-black uppercase tracking-widest">Time spent in focus</div>
                </div>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
