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
  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const insightsQuery = useQuery<Insight[]>({ queryKey: ['insights'], queryFn: fetchInsights });
  const realityQuery = useQuery<RealitySummary>({ queryKey: ['reality', localDate], queryFn: () => fetchRealitySummary(localDate) });
  const habitsQuery = useQuery<Habit[]>({ queryKey: ['habits'], queryFn: fetchHabits });
  const tasksQuery = useQuery<Task[]>({ queryKey: ['tasks'], queryFn: () => fetchTasks() });

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
      <div className="flex items-center justify-between">
        <h1 className="title-main">Insights</h1>
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border">
          {(['Insights', 'Goals'] as const).map(tab => (
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

      {/* ── INSIGHTS TAB ── */}
      {activeTab === 'Insights' && (
        <div className="split-layout">
          {/* Left: AI + Pattern Insights */}
          <div className="stack-gap-lg">
            <div className="stack-gap-md">
              <span className="ml-1 uppercase label-sub">Patterns & Habits</span>

              {insightsQuery.isLoading ? (
                <Skeleton height="220px" />
              ) : !insightsQuery.data?.length ? (
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
                  {insightsQuery.data.map((insight) => (
                    <Card key={insight.id} className="p-5 border-l-2 primary border-accent">
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

            {/* Category breakdown from real tasks */}
            {!tasksQuery.isLoading && categoryBreakdown.length > 0 && (
              <div className="pt-4 stack-gap-md">
                <span className="ml-1 uppercase label-sub">Category Performance</span>
                <div className="stack-gap-sm">
                  {categoryBreakdown.map(row => (
                    <Card key={row.cat} className="p-4 transition-colors primary hover:border-gray-800">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-black text-white text-[0.95rem]">{row.cat}</span>
                        <span className={`text-[0.85rem] font-black ${(row.rate ?? 0) >= 70 ? 'text-[#06d6a0]' : (row.rate ?? 0) >= 40 ? 'text-accent' : 'text-[#ef476f]'}`}>
                          {row.rate !== null ? `${row.rate}% EFFICIENCY` : '—'}
                        </span>
                      </div>
                      <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${(row.rate ?? 0) >= 70 ? 'bg-[#06d6a0]' : 'bg-accent'}`} 
                          style={{ width: `${row.rate ?? 0}%` }} 
                        />
                      </div>
                      <div className="flex gap-4 mt-3 text-[0.65rem] font-black uppercase tracking-widest text-secondary/40">
                        <span>{row.planned} planned</span>
                        <span className="text-[#06d6a0]/60">{row.completed} done</span>
                        {row.missed > 0 && <span className="text-[#ef476f]/60">{row.missed} missed</span>}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Reliability & Summary */}
          <div className="stack-gap-lg">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Your Consistency</span>
              {realityQuery.isLoading ? <Skeleton height="80px" /> : (
                <div className="stack-gap-md">
                  <div className="flex items-center gap-5">
                    <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{completionPct}%</span>
                    <div className="flex-1">
                      <div className="h-1.5 bg-[#0a0a0a] rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-700 ${completionPct >= 70 ? 'bg-[#06d6a0]' : 'bg-[#ef476f]'}`}
                          style={{ width: `${completionPct}%` }} 
                        />
                      </div>
                      <div className="text-[0.65rem] font-black text-secondary uppercase tracking-[2px] mt-2">
                        {completionPct >= 80 ? 'Excellent Focus' : completionPct >= 50 ? 'Gaining Momentum' : 'Keep at it!'}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between border-t border-[#111] pt-4 mt-2">
                    <div className="flex flex-col">
                      <span className="text-[1.1rem] font-black text-[#06d6a0]">{reality?.completedTasks ?? 0}</span>
                      <span className="label-sub !text-[0.6rem]">Done</span>
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-[1.1rem] font-black text-[#ef476f]">{reality?.missedTasks ?? 0}</span>
                      <span className="label-sub !text-[0.6rem]">Missed</span>
                    </div>
                  </div>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Report Summary</span>
              {realityQuery.isLoading ? <Skeleton height="120px" /> : (
                <div className="stack-gap-sm">
                  {[
                    { label: 'Total Planned', value: reality?.plannedTasks ?? 0, color: 'text-white' },
                    { label: 'Completed', value: reality?.completedTasks ?? 0, color: 'text-[#06d6a0]' },
                    { label: 'Missed', value: reality?.missedTasks ?? 0, color: 'text-[#ef476f]' },
                    { label: "Today's Score", value: `${completionPct}%`, color: 'text-accent' },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2.5 border-b border-[#111] last:border-0">
                      <span className="text-[0.8rem] text-secondary font-bold">{row.label}</span>
                      <span className={`text-[0.95rem] font-black ${row.color}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {reality?.overPlanningIndicator && (
              <Card className="primary p-5 !border-l-4 !border-l-[#ef476f] bg-[#ef476f]/[0.02]">
                <div className="font-black text-[#ef476f] text-[0.85rem] uppercase tracking-widest mb-2">Planning Advice</div>
                <p className="m-0 text-secondary text-[0.8rem] font-bold leading-relaxed italic">
                  You've planned more than usual! Try limiting your daily tasks to 5–6 to stay focused and avoid burnout.
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
          <div className="stack-gap-lg">
            <span className="ml-1 uppercase label-sub">Habit Momentum</span>

            {habitsQuery.isLoading ? (
              <Skeleton height="200px" />
            ) : !habitsQuery.data?.length ? (
              <Card className="p-12 text-center primary">
                <div className="text-[2rem] mb-4">🎯</div>
                <div className="text-white font-[900] text-[1.2rem] mb-2">Awaiting your habits...</div>
                <p className="text-secondary text-[0.9rem] leading-relaxed max-w-xs mx-auto italic">
                  Add habits from your dashboard to track long-term progress goals here.
                </p>
              </Card>
            ) : (
              <div className="stack-gap-md">
                {habitsQuery.data.map(habit => {
                  const streak = calcStreak(habit.completedDates ?? []);
                  const total = habit.completedDates?.length ?? 0;
                  const today = new Date().toISOString().split('T')[0];
                  const doneToday = habit.completedDates?.some(d => d.startsWith(today));
                  const consistency = total > 0 ? Math.min(100, Math.round((total / 30) * 100)) : 0;

                  return (
                    <Card key={habit._id} className="p-5 transition-all primary hover:border-accent/20">
                      <div className="flex items-start justify-between mb-5">
                        <div>
                          <div className="font-black text-[1.1rem] text-white leading-none mb-2">{habit.name}</div>
                          <div className={`text-[0.65rem] font-bold uppercase tracking-widest ${doneToday ? 'text-[#06d6a0]' : 'text-secondary/40'}`}>
                            {doneToday ? 'Daily Objective Secured' : 'Awaiting Daily Confirmation'}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={`text-[1.8rem] font-black tracking-tighter leading-none ${streak > 0 ? 'text-white' : 'text-[#222]'}`}>
                            🔥 {streak}
                          </div>
                          <div className="text-[0.6rem] text-secondary font-black uppercase tracking-widest mt-1">day streak</div>
                        </div>
                      </div>

                      <div className="stack-gap-sm">
                        <div className="flex items-center justify-between px-1">
                          <span className="text-[0.65rem] text-secondary font-black uppercase tracking-widest">30-day consistency</span>
                          <span className={`text-[0.72rem] font-black ${consistency >= 70 ? 'text-[#06d6a0]' : 'text-accent'}`}>{consistency}%</span>
                        </div>
                        <div className="h-1 bg-[#111] rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-700 ${consistency >= 70 ? 'bg-[#06d6a0]' : 'bg-accent'}`} 
                            style={{ width: `${consistency}%` }} 
                          />
                        </div>
                      </div>

                      <div className="text-[0.6rem] text-secondary/30 font-black uppercase tracking-widest mt-4">
                        {total} total check-ins
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right: Summary stats */}
          <div className="stack-gap-lg">
            <Card className="primary compact-card">
              <span className="label-sub !mb-4">Active Habits</span>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{habitsQuery.data?.length ?? 0}</span>
                  <span className="label-sub uppercase !text-[0.7rem]">Active</span>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="label-sub !mb-4">Peak Momentum</span>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">
                    {habitsQuery.data?.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [])), 0) ?? 0}
                  </span>
                  <span className="label-sub uppercase !text-[0.7rem]">Days</span>
                </div>
              )}
            </Card>

            <Card className="primary compact-card">
              <span className="label-sub !mb-4">Today's Success</span>
              {habitsQuery.isLoading ? <Skeleton height="50px" /> : (() => {
                const todayStr = new Date().toISOString().split('T')[0];
                const done = habitsQuery.data?.filter(h => h.completedDates?.some(d => d.startsWith(todayStr))).length ?? 0;
                const total = habitsQuery.data?.length ?? 0;
                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                return (
                  <div className="stack-gap-sm">
                    <div className="flex items-baseline gap-2">
                      <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{done}</span>
                      <span className="label-sub uppercase !text-[0.7rem]">/ {total} Done</span>
                    </div>
                    <div className="h-1 bg-[#111] rounded-full overflow-hidden mt-2">
                      <div className={`h-full transition-all duration-700 ${pct === 100 ? 'bg-[#06d6a0]' : 'bg-accent'}`} style={{ width: `${pct}%` }} />
                    </div>
                    <div className="text-[0.65rem] font-black text-secondary/40 uppercase tracking-widest mt-1">{pct}% checklist done</div>
                  </div>
                );
              })()}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
