import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchInsights, fetchRealitySummary, fetchHabits, fetchTasks } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { AdvancedAnalytics, RealitySummary, Habit, Task } from '../lib/types';

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

  const insightsQuery = useQuery<AdvancedAnalytics>({ 
    queryKey: ['insights'], 
    queryFn: fetchInsights,
    retry: 2,
    enabled: true
  });
  const realityQuery = useQuery<RealitySummary>({ 
    queryKey: ['reality', localDate], 
    queryFn: () => fetchRealitySummary(localDate),
    retry: 1
  });
  const habitsQuery = useQuery<Habit[]>({ 
    queryKey: ['habits'], 
    queryFn: () => fetchHabits(),
    retry: 1
  });
  const tasksQuery = useQuery<Task[]>({ 
    queryKey: ['tasks'], 
    queryFn: () => fetchTasks(),
    retry: 1
  });

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

            {/* Category breakdown from real tasks */}
            {!tasksQuery.isLoading && categoryBreakdown.length > 0 && (
              <div className="stack-gap-md">
                <span className="ml-1 uppercase label-sub">Category Breakdown</span>
                <div className="stack-gap-sm">
                  {categoryBreakdown.map(({ cat, planned, completed, rate }) => (
                    <Card key={cat} className="p-4 primary">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="text-[0.75rem] text-accent font-black uppercase tracking-wider mb-2">
                            {cat}
                          </div>
                          <div className="flex items-center gap-6">
                            <div className="text-2xl font-black text-white">{completed}/{planned}</div>
                            <div className="text-[0.85rem] text-secondary">
                              {rate}% complete
                            </div>
                          </div>
                        </div>
                        <div className="w-16 h-16 flex items-center justify-center rounded-full bg-[#1a1a1a] border border-border">
                          <span className="text-lg font-black">{rate}%</span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Daily Reality Check */}
          <div className="stack-gap-lg">
            {realityQuery.isLoading ? (
              <Skeleton height="120px" />
            ) : realityQuery.isError ? (
              <Card className="p-6 border-l-4 border-red-500 primary bg-red-950/20">
                <div className="font-bold text-red-400">❌ Error loading reality check</div>
                <div className="mt-2 text-sm text-red-300">{realityQuery.error?.message}</div>
              </Card>
            ) : (
              <Card className="p-6 border-l-4 primary border-cyan-400">
                <div className="text-[0.7rem] text-cyan-400 font-black uppercase tracking-widest mb-2">
                  Today's Reality
                </div>
                <div className="mb-4">
                  <div className="text-[2.5rem] font-black text-white mb-2">{completionPct}%</div>
                  <p className="text-secondary text-[0.9rem] font-bold">
                    {reality?.completedTasks || 0} of {reality?.plannedTasks || 0} tasks completed
                  </p>
                </div>
                <div className="w-full h-2 bg-[#1a1a1a] rounded-full overflow-hidden">
                  <div 
                    className="h-full transition-all bg-gradient-to-r from-cyan-500 to-cyan-400" 
                    style={{ width: `${completionPct}%` }}
                  />
                </div>
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
                </Card>
              ) : habitsQuery.data?.length ? (
                <div className="stack-gap-sm">
                  {habitsQuery.data.map((habit, idx) => {
                    const streak = calcStreak(habit.completedDates || []);
                    return streak > 0 ? (
                      <Card key={habit._id || idx} className="p-4 primary">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-[0.9rem] font-bold text-white mb-1">
                              {habit.name}
                            </div>
                            <div className="text-[0.8rem] text-secondary">
                              {streak} day streak
                            </div>
                          </div>
                          <div className="text-[1.5rem]">🔥</div>
                        </div>
                      </Card>
                    ) : null;
                  })}
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
            <div className="text-white font-[900] text-[1.1rem] mb-2">Goals Section</div>
            <p className="text-secondary text-[0.9rem] leading-relaxed">
              View and track your personal goals and affirmations here.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
