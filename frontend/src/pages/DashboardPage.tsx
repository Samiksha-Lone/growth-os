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

  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const statsQuery = useQuery<DashboardStats>({ 
    queryKey: ['dashboard', 'stats', localDate], 
    queryFn: () => fetchDashboardStats(localDate) 
  });
  const tasksQuery = useQuery<Task[]>({ 
    queryKey: ['tasks'], 
    queryFn: () => fetchTasks() 
  });
  const realityQuery = useQuery<RealitySummary>({ 
    queryKey: ['reality', localDate], 
    queryFn: () => fetchRealitySummary(localDate) 
  });
  const weeklyQuery = useQuery({ 
    queryKey: ['analytics', 'weekly-trend'], 
    queryFn: () => fetchWeeklyChartData() 
  });

  const todayTasks = useMemo(() => {
    return tasksQuery.data?.filter(t => t.date?.startsWith(localDate)).slice(0, 5) ?? [];
  }, [tasksQuery.data, localDate]);

  const stats = statsQuery.data;
  const reality = realityQuery.data;
  const weeklyData = weeklyQuery.data || [];

  return (
    <div className="page-stack">
      {/* Greeting Section */}
      <div className="stack-gap-md mb-2">
        <h1 className="title-main">{greeting.text}</h1>
        <p className="title-sub !text-secondary/60 italic">{greeting.sub}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-8 mb-4">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="primary h-32"><Skeleton height="100%" /></Card>
          ))
        ) : (
          <>
            <StatCard
              title="Tasks"
              value={`${stats?.tasksToday ?? 0} / ${stats?.tasksTotal ?? 0}`}
              progress={stats?.tasksTotal ? Math.round((stats.tasksToday / stats.tasksTotal) * 100) : 0}
              color="#3a86ff"
            />
            <StatCard
              title="Habits"
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
              title="Today's Score"
              value={`${stats?.score ?? 0}`}
              progress={stats?.score ?? 0}
              color="#ef476f"
            />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-2 gap-8 w-full items-start">
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="uppercase label-sub">Today's Overview</span>
            <Card className="primary !p-0 overflow-hidden">
              <div className="px-6 py-2 bg-[#050505] border-b border-border flex justify-between items-center">
                 <span className="text-[0.6rem] font-black text-secondary/40 uppercase tracking-[2px]">Top Tasks for Today</span>
                 <span className="text-[0.6rem] font-black text-accent uppercase tracking-[2px]">{todayTasks.length} Active</span>
              </div>
              <div className="task-preview-list px-6">
                {tasksQuery.isLoading ? (
                  <Skeleton height="180px" />
                ) : todayTasks.length === 0 ? (
                  <div className="py-12 text-center text-secondary/40 text-[0.85rem] italic font-bold">
                    No tasks planned for today.
                  </div>
                ) : (
                  todayTasks.map((task, i) => (
                    <div key={task._id} className={`flex justify-between items-center py-4 border-b border-[#0a0a0a] last:border-0`}>
                      <div className="flex items-center gap-4">
                        <div className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''} w-[18px] h-[18px] transition-all`}>
                          {task.status === 'Completed' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                        </div>
                        <div>
                          <div className={`${task.status === 'Completed' ? 'text-secondary/30 line-through' : 'text-white'} font-black text-[1rem] leading-none mb-1`}>{task.title}</div>
                          {task.startTime && <div className="text-[0.65rem] text-secondary/40 font-black uppercase tracking-widest">⏰ {task.startTime}</div>}
                        </div>
                      </div>
                      <span className={`text-[0.65rem] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${
                        task.category === 'Work' ? 'bg-[#3a86ff]/10 text-[#3a86ff] border border-[#3a86ff]/20' :
                        task.category === 'Study' ? 'bg-[#06d6a0]/10 text-[#06d6a0] border border-[#06d6a0]/20' :
                        'bg-[#1a1a1a] text-secondary/60 border border-border/10'
                      }`}>{task.category}</span>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          <Card title="Quick Progress" className="p-6 primary compact-card">
            <span className="mb-6 uppercase label-sub">Daily Progress</span>
            {realityQuery.isLoading ? (
              <Skeleton height="60px" />
            ) : (
              <div className="flex justify-between items-center">
                <div className="flex gap-8">
                  <div className="flex flex-col">
                    <span className="label-sub !text-secondary/40 !text-[0.6rem] !mb-1 uppercase tracking-widest">Planned</span>
                    <span className="text-white text-[1.8rem] font-black tracking-tighter leading-none">{reality?.plannedTasks ?? '—'}</span>
                  </div>
                  <div className="w-px bg-[#0a0a0a] my-1" />
                  <div className="flex flex-col">
                    <span className="label-sub !text-[#06d6a0]/40 !text-[0.6rem] !mb-1 uppercase tracking-widest">Done</span>
                    <span className="text-[#06d6a0] text-[1.8rem] font-black tracking-tighter leading-none">{reality?.completedTasks ?? '—'}</span>
                  </div>
                  <div className="w-px bg-[#0a0a0a] my-1" />
                  <div className="flex flex-col">
                    <span className="label-sub !text-[#ef476f]/40 !text-[0.6rem] !mb-1 uppercase tracking-widest">Missed</span>
                    <span className="text-[#ef476f] text-[1.8rem] font-black tracking-tighter leading-none">{reality?.missedTasks ?? '—'}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`${(reality?.completionPercentage ?? 0) >= 70 ? 'text-[#06d6a0]' : 'text-[#ef476f]'} text-[2.4rem] font-black tracking-tighter leading-none`}>
                    {reality?.completionPercentage ?? 0}%
                  </div>
                  <div className="text-secondary/30 text-[0.6rem] font-black uppercase tracking-[3px] mt-1">Efficiency</div>
                </div>
              </div>
            )}
            {reality?.overPlanningIndicator && (
              <div className="mt-6 p-4 bg-[#ef476f]/[0.03] border border-[#ef476f]/10 rounded-xl text-[0.8rem] text-[#ef476f] font-bold italic leading-relaxed">
                ⚠ You've planned a lot for today! Try focusing on your top priorities to avoid feeling overwhelmed.
              </div>
            )}
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-8">
          {/* Invisible Spacer to align with "Today's Overview" label */}
          <div className="flex flex-col gap-4">
            <span className="uppercase label-sub invisible select-none">Spacer</span>
            {reality?.insights && reality.insights.length > 0 ? (
              <Card className="primary compact-card p-6 border-l-[3px] !border-l-accent bg-accent/[0.01]">
                <span className="mb-4 uppercase label-sub">Daily Tip</span>
                <p className="text-secondary text-[0.95rem] font-bold leading-relaxed italic opacity-80">
                  "{reality.insights[0]}"
                </p>
              </Card>
            ) : (
              <Card className="primary compact-card p-6 border-l-[3px] !border-l-accent">
                <span className="mb-4 uppercase label-sub">Learning...</span>
                <p className="text-secondary/40 text-[0.85rem] font-bold leading-relaxed italic">
                  Keep going! Complete more tasks to unlock personalized tips and insights.
                </p>
              </Card>
            )}
          </div>

          <Card className="primary compact-card !flex-1 p-6">
            <div className="flex justify-between items-center mb-8">
               <span className="uppercase label-sub">Weekly Activity</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-white text-[1.2rem] font-black tracking-tight">{stats?.tasksToday ?? 0}</span>
                 <span className="text-secondary/40 text-[0.7rem] font-black uppercase">/ {stats?.tasksTotal ?? 0}</span>
               </div>
            </div>
            <div className="h-[200px] w-full mt-auto">
              {weeklyQuery.isLoading ? (
                <div className="flex items-end justify-around h-full pb-5">
                  {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} height={`${Math.random() * 100 + 50}px`} width="24px" />
                  ))}
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#111" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#555', fontSize: 10, fontWeight: 900 }}
                      dy={15}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={24}>
                      {weeklyData.map((_e, i) => (
                        <Cell
                          key={`cell-${i}`}
                          fill={i === weeklyData.length - 1 ? '#3a86ff' : '#3a86ff55'}
                          stroke="transparent"
                        />
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
