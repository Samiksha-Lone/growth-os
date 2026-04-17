import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInsights, fetchRealitySummary, fetchHabits, fetchTasks } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { Insight, RealitySummary, Habit, Task } from '../lib/types';

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

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'Insights' | 'Goals'>('Insights');

  const insightsQuery = useQuery<Insight[]>({ queryKey: ['insights', 'list'], queryFn: fetchInsights });
  const realityQuery = useQuery<RealitySummary>({ queryKey: ['insights', 'reality'], queryFn: fetchRealitySummary });
  const habitsQuery = useQuery<Habit[]>({ queryKey: ['insights', 'habits'], queryFn: fetchHabits });
  const tasksQuery = useQuery<Task[]>({ queryKey: ['insights', 'tasks'], queryFn: fetchTasks });

  const reality = realityQuery.data;
  const completionPct = reality?.completionPercentage ?? 0;

  const categoryBreakdown = useMemo(() => {
    const tasks = tasksQuery.data ?? [];
    const cats = ['Work', 'Study', 'Health', 'Personal'] as const;
    return cats.map(cat => {
      const planned = tasks.filter(t => t.category === cat).length;
      const completed = tasks.filter(t => t.category === cat && t.status === 'Completed').length;
      const missed = tasks.filter(t => t.category === cat && t.status === 'Missed').length;
      const rate = planned > 0 ? Math.round((completed / planned) * 100) : null;
      return { cat, planned, completed, missed, rate };
    }).filter(r => r.planned > 0);
  }, [tasksQuery.data]);

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Insights</h2>
        <div className="tab-group">
          {(['Insights', 'Goals'] as const).map(tab => (
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

      {/* ── INSIGHTS TAB ── */}
      {activeTab === 'Insights' && (
        <div className="split-layout">
          {/* Left: AI + Pattern Insights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Behavior Patterns
            </h3>

            {insightsQuery.isLoading ? (
              <Skeleton height="220px" />
            ) : !insightsQuery.data?.length ? (
              <Card className="primary" style={{ padding: '36px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>📊</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>No insights yet</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.7 }}>
                  Keep tracking your tasks and habits for a few days.<br />
                  Patterns will emerge here automatically.
                </p>
              </Card>
            ) : insightsQuery.data.map((insight) => (
              <Card key={insight.id} className="primary" style={{ padding: '16px 20px', borderLeft: '2px solid #222' }}>
                <div style={{ fontSize: '0.68rem', color: '#3a86ff', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  {insight.title}
                </div>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#c0c0c0', lineHeight: 1.6 }}>
                  {insight.detail}
                </p>
              </Card>
            ))}

            {/* Category breakdown from real tasks */}
            {!tasksQuery.isLoading && categoryBreakdown.length > 0 && (
              <>
                <h3 style={{ margin: '8px 0 0', fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Category Breakdown
                </h3>
                {categoryBreakdown.map(row => (
                  <Card key={row.cat} className="primary" style={{ padding: '14px 18px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{row.cat}</span>
                      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: (row.rate ?? 0) >= 70 ? '#06d6a0' : (row.rate ?? 0) >= 40 ? '#ffd166' : '#ef476f' }}>
                        {row.rate !== null ? `${row.rate}%` : '—'}
                      </span>
                    </div>
                    <div style={{ height: '4px', background: '#111', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${row.rate ?? 0}%`, background: (row.rate ?? 0) >= 70 ? '#06d6a0' : '#ffd166', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '14px', marginTop: '8px', fontSize: '0.72rem', color: '#444' }}>
                      <span>{row.planned} planned</span>
                      <span style={{ color: '#06d6a0' }}>{row.completed} done</span>
                      {row.missed > 0 && <span style={{ color: '#ef476f' }}>{row.missed} missed</span>}
                    </div>
                  </Card>
                ))}
              </>
            )}
          </div>

          {/* Right: Reliability & Summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>Reliability</div>
              {realityQuery.isLoading ? <Skeleton height="80px" /> : (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '12px' }}>
                    <span style={{ fontSize: '2.6rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{completionPct}%</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '4px', background: '#0a0a0a', borderRadius: '2px' }}>
                        <div style={{ width: `${completionPct}%`, height: '100%', background: completionPct >= 70 ? '#06d6a0' : '#ef476f', borderRadius: '2px', transition: 'width 0.5s' }} />
                      </div>
                      <div style={{ fontSize: '0.7rem', color: '#444', marginTop: '4px' }}>
                        {completionPct >= 80 ? 'Reliable executor' : completionPct >= 50 ? 'Moderate follow-through' : 'Needs consistency'}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1a1a1a', paddingTop: '12px' }}>
                    <span style={{ color: '#06d6a0', fontSize: '0.75rem', fontWeight: 700 }}>✓ {reality?.completedTasks ?? 0} completed</span>
                    <span style={{ color: '#ef476f', fontSize: '0.75rem', fontWeight: 700 }}>✗ {reality?.missedTasks ?? 0} missed</span>
                  </div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <h3 style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', margin: '0 0 14px' }}>Reality Breakdown</h3>
              {realityQuery.isLoading ? <Skeleton height="120px" /> : (
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <th style={{ padding: '6px 0', fontSize: '0.68rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', textAlign: 'left' }}>Metric</th>
                      <th style={{ padding: '6px 0', fontSize: '0.68rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: 'Planned', value: reality?.plannedTasks ?? 0, color: '#fff' },
                      { label: 'Completed', value: reality?.completedTasks ?? 0, color: '#06d6a0' },
                      { label: 'Missed', value: reality?.missedTasks ?? 0, color: '#ef476f' },
                      { label: 'Rate', value: `${completionPct}%`, color: completionPct >= 70 ? '#06d6a0' : '#ffd166' },
                    ].map((row, i, arr) => (
                      <tr key={i} style={{ borderBottom: i < arr.length - 1 ? '1px solid #0f0f0f' : 'none' }}>
                        <td style={{ padding: '10px 0', fontSize: '0.85rem', color: '#555' }}>{row.label}</td>
                        <td style={{ padding: '10px 0', fontSize: '0.9rem', color: row.color, fontWeight: 700, textAlign: 'right' }}>{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {reality?.overPlanningIndicator && (
              <Card className="primary compact-card" style={{ borderLeft: '3px solid #ef476f' }}>
                <div style={{ fontWeight: 700, color: '#ef476f', fontSize: '0.85rem', marginBottom: '6px' }}>Over-planning detected</div>
                <p style={{ margin: 0, fontSize: '0.82rem', color: '#7d7d7d', lineHeight: 1.5 }}>
                  You plan more than you complete. Cap daily tasks at 5–6 and prioritize ruthlessly.
                </p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'Goals' && (
        <div className="split-layout">
          {/* Left: Habit Goals with real streak data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Habit Goals
            </h3>

            {habitsQuery.isLoading ? (
              <Skeleton height="200px" />
            ) : !habitsQuery.data?.length ? (
              <Card className="primary" style={{ padding: '36px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>No habits yet</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.7 }}>
                  Add habits from the Habits page to track your long-term goals here.
                </p>
              </Card>
            ) : habitsQuery.data.map(habit => {
              const streak = calcStreak(habit.completedDates ?? []);
              const total = habit.completedDates?.length ?? 0;
              const today = new Date().toISOString().split('T')[0];
              const doneToday = habit.completedDates?.some(d => d.startsWith(today));
              const consistency = total > 0 ? Math.min(100, Math.round((total / 30) * 100)) : 0;

              return (
                <Card key={habit._id} className="primary" style={{ padding: '18px 20px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '3px' }}>{habit.name}</div>
                      <div style={{ fontSize: '0.72rem', color: doneToday ? '#06d6a0' : '#444', fontWeight: 600 }}>
                        {doneToday ? '✓ Done today' : 'Not done yet today'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: 800, color: streak > 0 ? '#fff' : '#333' }}>🔥 {streak}</div>
                      <div style={{ fontSize: '0.68rem', color: '#444', fontWeight: 600, textTransform: 'uppercase' }}>day streak</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#444', fontWeight: 600 }}>30-day consistency</span>
                      <span style={{ fontSize: '0.72rem', color: consistency >= 70 ? '#06d6a0' : '#ffd166', fontWeight: 700 }}>{consistency}%</span>
                    </div>
                    <div style={{ height: '4px', background: '#111', borderRadius: '2px' }}>
                      <div style={{ height: '100%', width: `${consistency}%`, background: consistency >= 70 ? '#06d6a0' : consistency >= 40 ? '#ffd166' : '#ef476f', borderRadius: '2px', transition: 'width 0.5s ease' }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '6px' }}>
                    {total} total check-ins logged
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Right: Summary stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Total Habits</div>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>{habitsQuery.data?.length ?? 0}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7d7d7d', marginTop: '6px' }}>being tracked</div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Best Streak</div>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <>
                  <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>
                    {habitsQuery.data?.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [])), 0) ?? 0}
                    <span style={{ fontSize: '0.9rem', color: '#333' }}> days</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#06d6a0', marginTop: '6px', fontWeight: 600 }}>current best streak</div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Done Today</div>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (() => {
                const today = new Date().toISOString().split('T')[0];
                const done = habitsQuery.data?.filter(h => h.completedDates?.some(d => d.startsWith(today))).length ?? 0;
                const total = habitsQuery.data?.length ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <>
                    <div style={{ fontSize: '2.4rem', fontWeight: 800 }}>{done}<span style={{ fontSize: '0.9rem', color: '#333' }}>/{total}</span></div>
                    <div style={{ height: '4px', background: '#111', borderRadius: '2px', marginTop: '10px' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: pct === 100 ? '#06d6a0' : '#3a86ff', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '6px' }}>{pct}% of habits done</div>
                  </>
                );
              })()}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
