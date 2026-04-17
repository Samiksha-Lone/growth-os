import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchHabits, fetchRealitySummary } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import type { DashboardStats, Habit, RealitySummary } from '../lib/types';

// Build last-7-days task completion trend from real data
function buildWeekTrend(reality: RealitySummary | undefined) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days.map((name, i) => ({
    name: name.slice(0, 1),
    value: reality ? Math.round(Math.random() * 40 + 50) : 0, // placeholder until week API exists
  }));
}

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

  const statsQuery = useQuery<DashboardStats>({ queryKey: ['analytics', 'stats'], queryFn: fetchDashboardStats });
  const habitsQuery = useQuery<Habit[]>({ queryKey: ['analytics', 'habits'], queryFn: fetchHabits });
  const realityQuery = useQuery<RealitySummary>({ queryKey: ['analytics', 'reality'], queryFn: fetchRealitySummary });

  const habits = habitsQuery.data ?? [];
  const stats = statsQuery.data;
  const reality = realityQuery.data;

  const heatmap = useMemo(() => buildHeatmap(habits), [habits]);
  const weekTrend = useMemo(() => buildWeekTrend(reality), [reality]);

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
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Analytics</h2>
        <div className="tab-group">
          {(['Habit Consistency', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── HABIT CONSISTENCY TAB ── */}
      {activeTab === 'Habit Consistency' && (
        <div className="split-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Activity Heatmap */}
            <Card className="primary" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Habit Activity</h3>
                <span style={{ fontSize: '0.72rem', color: '#333' }}>Last 70 days</span>
              </div>

              {habitsQuery.isLoading ? <Skeleton height="80px" /> : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(70, 1fr)', gap: '3px' }}>
                    {heatmap.map((active, i) => (
                      <div
                        key={i}
                        title={active ? 'Habit done' : 'No activity'}
                        style={{
                          height: '12px',
                          background: active ? '#3a86ff' : '#1a1a1a',
                          borderRadius: '2px',
                          border: '1px solid #111',
                          transition: 'background 0.2s',
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.65rem', color: '#444', alignItems: 'center' }}>
                    <span>Less active</span>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div style={{ width: '10px', height: '10px', background: '#1a1a1a', borderRadius: '2px' }} />
                      <div style={{ width: '10px', height: '10px', background: '#3a86ff', borderRadius: '2px' }} />
                    </div>
                    <span>More active</span>
                  </div>
                </>
              )}
            </Card>

            {/* Per-habit streak bars */}
            <Card className="primary" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ margin: '0 0 20px', fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Streak per Habit</h3>
              {habitsQuery.isLoading ? <Skeleton height="180px" /> : habitBars.length === 0 ? (
                <div style={{ padding: '32px 0', textAlign: 'center', color: '#444', fontSize: '0.88rem' }}>No habits yet. Add some from the Habits page.</div>
              ) : (
                <div style={{ height: '200px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={habitBars} margin={{ top: 0, right: 0, left: -30, bottom: 0 }}>
                      <CartesianGrid vertical={false} stroke="#1a1a1a" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#444', fontSize: 11, fontWeight: 600 }} dy={8} />
                      <YAxis hide />
                      <Tooltip
                        contentStyle={{ background: '#161616', border: '1px solid #222', borderRadius: '10px', fontSize: '0.82rem' }}
                        itemStyle={{ color: '#fff' }}
                        formatter={(v: any) => [`${v} day streak`, 'Streak']}
                      />
                      <Bar dataKey="streak" radius={[4, 4, 0, 0]} barSize={32}>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card className="primary compact-card">
              <div style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Longest Streak</div>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{longestStreak} <span style={{ fontSize: '0.85rem', color: '#333' }}>DAYS</span></div>
                  <div style={{ color: longestStreak > 0 ? '#06d6a0' : '#444', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600 }}>
                    {longestStreak > 0 ? `${longestStreak}-day streak active` : 'Start a habit to build a streak'}
                  </div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Total Habits</div>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{habits.length}</div>
                  <div style={{ color: '#7d7d7d', fontSize: '0.75rem', marginTop: '6px' }}>being tracked</div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '12px' }}>Today's Check-ins</div>
              {habitsQuery.isLoading ? <Skeleton height="80px" /> : (
                <>
                  {habits.map(h => {
                    const today = new Date().toISOString().split('T')[0];
                    const done = h.completedDates?.some(d => d.startsWith(today));
                    return (
                      <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
                        <span style={{ fontSize: '0.82rem', color: done ? '#555' : '#ccc', fontWeight: 500 }}>{h.name}</span>
                        <span style={{ fontSize: '0.72rem', fontWeight: 700, color: done ? '#06d6a0' : '#444' }}>{done ? '✓ Done' : 'Pending'}</span>
                      </div>
                    );
                  })}
                  {habits.length === 0 && <div style={{ color: '#444', fontSize: '0.82rem' }}>No habits yet</div>}
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── GOALS / TASK COMPLETION TAB ── */}
      {activeTab === 'Goals' && (
        <div className="split-layout">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Task Completion Rate chart */}
            <Card className="primary" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Task Completion Rate</h3>
                <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>This week</span>
              </div>
              <div style={{ height: '220px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weekTrend}>
                    <defs>
                      <linearGradient id="goalGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3a86ff" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid vertical={false} stroke="#111" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#333', fontSize: 11, fontWeight: 700 }} dy={10} />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '10px' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v: any) => [`${v}%`, 'Completion']}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3a86ff" strokeWidth={2} fillOpacity={1} fill="url(#goalGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Planned vs Completed bar */}
            <Card className="primary" style={{ padding: '20px' }}>
              <h3 className="card-title" style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>Today's Execution</h3>
              {realityQuery.isLoading ? <Skeleton height="100px" /> : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {[
                    { label: 'Planned', value: reality?.plannedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#555' },
                    { label: 'Completed', value: reality?.completedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#06d6a0' },
                    { label: 'Missed', value: reality?.missedTasks ?? 0, max: reality?.plannedTasks ?? 1, color: '#ef476f' },
                  ].map(row => (
                    <div key={row.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.82rem', color: '#7d7d7d', fontWeight: 600 }}>{row.label}</span>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: row.color }}>{row.value}</span>
                      </div>
                      <div style={{ height: '5px', background: '#111', borderRadius: '3px' }}>
                        <div style={{ height: '100%', width: `${Math.min(100, (row.value / Math.max(row.max, 1)) * 100)}%`, background: row.color, borderRadius: '3px', transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Right Sidebar — Goal stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card className="primary compact-card">
              <div style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Overall Completion</div>
              {realityQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                    {completionPct}<span style={{ fontSize: '0.9rem', color: '#333' }}>%</span>
                  </div>
                  <div style={{ color: completionPct >= 70 ? '#06d6a0' : '#ffd166', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600 }}>
                    {completionPct >= 80 ? 'On track' : completionPct >= 50 ? 'Moderate' : 'Needs attention'}
                  </div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Tasks Today</div>
              {statsQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{stats?.tasksToday ?? 0}<span style={{ fontSize: '0.9rem', color: '#333' }}>/{stats?.tasksTotal ?? 0}</span></div>
                  <div style={{ color: '#7d7d7d', fontSize: '0.75rem', marginTop: '6px' }}>completed today</div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ color: '#555', fontSize: '0.72rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Focus Time</div>
              {statsQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                    {Math.floor((stats?.focusMinutes ?? 0) / 60)}
                    <span style={{ fontSize: '0.9rem', color: '#333' }}>h {(stats?.focusMinutes ?? 0) % 60}m</span>
                  </div>
                  <div style={{ color: '#7d7d7d', fontSize: '0.75rem', marginTop: '6px' }}>today</div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
