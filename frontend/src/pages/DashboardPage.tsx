import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/StatCard';
import { fetchDashboardStats, fetchTasks, fetchRealitySummary, fetchWeeklyChartData } from '../api/growthos';
import { Skeleton } from '../components/ui/Skeleton';
import { TaskItem } from '../components/TaskItem';
import { useAuth } from '../hooks/useAuth';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import type { DashboardStats, RealitySummary, Task } from '../lib/types';

function getGreeting(name: string | null): { text: string; sub: string } {
  const hour = new Date().getHours();
  const first = name ? name.split(' ')[0] : 'there';
  if (hour < 12) return { text: `Good morning, ${first} 👋`, sub: 'Start strong. What matters most today?' };
  if (hour < 17) return { text: `Good afternoon, ${first}`, sub: 'Keep the momentum going.' };
  return { text: `Good evening, ${first}`, sub: 'Review your day before winding down.' };
}

export default function DashboardPage() {
  const { userName } = useAuth();
  const greeting = useMemo(() => getGreeting(userName), [userName]);

  const statsQuery = useQuery<DashboardStats>({ queryKey: ['dashboard', 'stats'], queryFn: fetchDashboardStats });
  const tasksQuery = useQuery<Task[]>({ queryKey: ['dashboard', 'tasks'], queryFn: fetchTasks });
  const realityQuery = useQuery<RealitySummary>({ queryKey: ['dashboard', 'reality'], queryFn: fetchRealitySummary });
  const weeklyQuery = useQuery({ queryKey: ['dashboard', 'weekly'], queryFn: fetchWeeklyChartData });

  const todayTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return tasksQuery.data?.filter(t => t.date?.startsWith(today)).slice(0, 5) ?? [];
  }, [tasksQuery.data]);

  const stats = statsQuery.data;
  const reality = realityQuery.data;
  const weeklyData = weeklyQuery.data || [];

  return (
    <div className="page-stack">
      {/* Greeting Section */}
      <div className="greeting-block">
        <h1 style={{ fontSize: '1.75rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.5px', marginBottom: '2px' }}>{greeting.text}</h1>
        <p style={{ color: '#7d7d7d', fontSize: '0.9rem', fontWeight: 400 }}>{greeting.sub}</p>
      </div>

      {/* KPI Row */}
      <div className="section-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="primary"><Skeleton height="120px" /></Card>
          ))
        ) : (
          <>
            <StatCard
              title="Tasks Completed"
              value={`${stats?.tasksToday ?? 0} / ${stats?.tasksTotal ?? 0}`}
              progress={stats?.tasksTotal ? Math.round((stats.tasksToday / stats.tasksTotal) * 100) : 0}
              color="#3a86ff"
            />
            <StatCard
              title="Habits Done"
              value={`${stats?.habitsDone ?? 0} / ${stats?.habitsTotal ?? 0}`}
              progress={stats?.habitsTotal ? Math.round((stats.habitsDone / stats.habitsTotal) * 100) : 0}
              color="#06d6a0"
            />
            <StatCard
              title="Focus Time"
              value={`${Math.floor((stats?.focusMinutes ?? 0) / 60)}h ${(stats?.focusMinutes ?? 0) % 60}m`}
              progress={Math.min(100, Math.round(((stats?.focusMinutes ?? 0) / 120) * 100))}
              color="#ffd166"
            />
            <StatCard
              title="Daily Score"
              value={`${stats?.score ?? 0}`}
              progress={stats?.score ?? 0}
              color="#ef476f"
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="split-layout">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '0.8rem', marginBottom: '8px', color: '#7d7d7d' }}>Today's Tasks</h2>
            <Card className="primary" style={{ padding: '0 20px' }}>
              <div className="task-preview-list">
                {tasksQuery.isLoading ? (
                  <Skeleton height="180px" />
                ) : todayTasks.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: '#444', fontSize: '0.9rem' }}>
                    No tasks yet today — head to the Planner to add some.
                  </div>
                ) : (
                  todayTasks.map((task, i) => (
                    <div key={task._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: i < todayTasks.length - 1 ? '1px solid #1a1a1a' : 'none' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`} style={{ width: '18px', height: '18px', flexShrink: 0 }}>
                          {task.status === 'Completed' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div>
                          <span style={{ color: task.status === 'Completed' ? '#555' : '#fff', fontWeight: 500, fontSize: '0.95rem', textDecoration: task.status === 'Completed' ? 'line-through' : 'none' }}>{task.title}</span>
                          {task.startTime && <span style={{ display: 'block', fontSize: '0.72rem', color: '#444', marginTop: '2px' }}>⏰ {task.startTime}</span>}
                        </div>
                      </div>
                      <span className={`task-tag tag-${task.category?.toLowerCase()}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>{task.category}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card title="Reality Check" className="primary compact-card">
            {realityQuery.isLoading ? (
              <Skeleton height="60px" />
            ) : (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#555', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Planned</span>
                    <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>{reality?.plannedTasks ?? '—'}</span>
                  </div>
                  <div style={{ width: '1px', background: '#222', margin: '4px 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#555', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Done</span>
                    <span style={{ color: '#fff', fontSize: '1.4rem', fontWeight: 700 }}>{reality?.completedTasks ?? '—'}</span>
                  </div>
                  <div style={{ width: '1px', background: '#222', margin: '4px 0' }} />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ color: '#555', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Missed</span>
                    <span style={{ color: '#ef476f', fontSize: '1.4rem', fontWeight: 700 }}>{reality?.missedTasks ?? '—'}</span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ color: (reality?.completionPercentage ?? 0) >= 70 ? '#06d6a0' : '#ef476f', fontSize: '1.6rem', fontWeight: 800 }}>
                    {reality?.completionPercentage ?? 0}%
                  </span>
                  <div style={{ color: '#555', fontSize: '0.7rem' }}>Completion</div>
                </div>
              </div>
            )}
            {reality?.overPlanningIndicator && (
              <div style={{ marginTop: '12px', padding: '8px 12px', background: 'rgba(239,71,111,0.06)', border: '1px solid rgba(239,71,111,0.15)', borderRadius: '8px', fontSize: '0.8rem', color: '#ef476f' }}>
                ⚠ You planned a lot today. Consider focusing on fewer high-priority tasks.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {reality?.insights && reality.insights.length > 0 && (
            <Card title="Daily Insight" className="primary compact-card" style={{ borderLeft: '3px solid #3a86ff' }}>
              <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                {reality.insights[0]}
              </p>
            </Card>
          )}

          {!reality?.insights?.length && !realityQuery.isLoading && (
            <Card title="Daily Insight" className="primary compact-card" style={{ borderLeft: '3px solid #3a86ff' }}>
              <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: 1.6, margin: 0 }}>
                Start tracking your tasks and habits to unlock personalized daily insights.
              </p>
            </Card>
          )}

          <Card className="primary compact-card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>This Week</h3>
              <strong style={{ fontSize: '1rem', color: '#fff', fontWeight: 700 }}>
                {stats ? `${stats.tasksToday}/${stats.tasksTotal} tasks` : '—'}
              </strong>
            </div>
            <div style={{ height: '180px', width: '100%' }}>
              {weeklyQuery.isLoading ? (
                <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-around', height: '100%', paddingBottom: '20px' }}>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} height={`${Math.random() * 100 + 50}px`} width="24px" />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#1a1a1a" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#444', fontSize: 12, fontWeight: 600 }}
                      dy={10}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={24}>
                      {weeklyData.map((_e, i) => (
                        <Cell key={`cell-${i}`} fill={i === weeklyData.length - 1 ? '#3a86ff' : '#1d1d1d'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
