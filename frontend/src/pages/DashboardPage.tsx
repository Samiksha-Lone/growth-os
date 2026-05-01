import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/StatCard';
import { fetchDashboardStats, fetchTasks, fetchRealitySummary, fetchWeeklyChartData, updateTask } from '../api/growthos';
import { Skeleton } from '../components/ui/Skeleton';
import { TaskItem } from '../components/TaskItem';
import { useAuth } from '../hooks/useAuth';
import { useInvalidateDashboard } from '../hooks/useInvalidateCache';
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
  const queryClient = useQueryClient();
  const invalidateDashboard = useInvalidateDashboard();

  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const statsQuery = useQuery<DashboardStats>({ 
    queryKey: ['dashboard', 'stats', localDate], 
    queryFn: () => fetchDashboardStats(localDate),
    staleTime: 30 * 1000, // 30 seconds - shows fresh data quickly when mutations occur
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const tasksQuery = useQuery<Task[]>({ 
    queryKey: ['tasks'], 
    queryFn: () => fetchTasks(undefined, 20), // Limit to 20 initially
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const realityQuery = useQuery<RealitySummary>({ 
    queryKey: ['reality', localDate], 
    queryFn: () => fetchRealitySummary(localDate),
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const weeklyQuery = useQuery({ 
    queryKey: ['analytics', 'weekly-trend'], 
    queryFn: () => fetchWeeklyChartData(),
    staleTime: 30 * 60 * 1000, // 30 minutes for weekly data
    gcTime: 60 * 60 * 1000,
    retry: 1,
    enabled: false, // Disabled - now included in dashboard stats
  });

  const todayTasks = useMemo(() => {
    return tasksQuery.data?.filter(t => t.date?.startsWith(localDate)).slice(0, 5) ?? [];
  }, [tasksQuery.data, localDate]);

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: () => {
      // Invalidate dashboard stats immediately - backend cleared cache already
      invalidateDashboard();
      // Also refetch today's tasks
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const stats = statsQuery.data;
  const reality = realityQuery.data;
  const weeklyData = stats?.weeklyTrend || [];

  return (
    <div className="page-stack">
      {/* Greeting Section */}
      <div className="mb-2 stack-gap-md">
        <h1 className="title-main">{greeting.text}</h1>
        <p className="title-sub !text-secondary/60 italic">{greeting.sub}</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 mb-4 md:grid-cols-4 md:gap-8">
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-32 primary"><Skeleton height="100%" /></Card>
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
      <div className="grid items-start w-full grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        {/* Left Column */}
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <span className="uppercase label-sub">Today's Overview</span>
            <Card className="primary !p-0 overflow-hidden">
              <div className="px-4 md:px-6 py-2 bg-[#050505] border-b border-border flex flex-wrap justify-between items-center gap-2">
                 <span className="text-[0.6rem] font-black text-secondary/40 uppercase tracking-[2px]">Top Tasks for Today</span>
                 <span className="text-[0.6rem] font-black text-accent uppercase tracking-[2px]">{todayTasks.length} Active</span>
              </div>
              <div className="px-4 task-preview-list md:px-6">
                {tasksQuery.isLoading ? (
                  <Skeleton height="180px" />
                ) : todayTasks.length === 0 ? (
                  <div className="py-12 text-center text-secondary/40 text-[0.85rem] italic font-bold">
                    No tasks planned for today.
                  </div>
                ) : (
                  todayTasks.map((task, i) => (
                    <div key={task._id} className={`flex justify-between items-center py-3 md:py-4 px-3 md:px-4 border-b border-[#0a0a0a] last:border-0 gap-3 rounded-lg transition-all duration-200 hover:bg-[#1a1a1a]/40 group cursor-pointer`}>
                      <div className="flex items-center flex-1 min-w-0 gap-3">
                        <div 
                          className={`task-checkbox transition-all duration-200 flex-shrink-0`}
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTaskMutation.mutate({ id: task._id, updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' }});
                          }}
                          style={{
                            backgroundColor: task.status === 'Completed' ? '#00bfff' : 'transparent',
                            borderColor: task.status === 'Completed' ? '#00bfff' : '#666'
                          }}
                        >
                          {task.status === 'Completed' && (
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className={`${task.status === 'Completed' ? 'text-secondary/30 line-through' : 'text-white'} font-black text-[0.9rem] md:text-[0.95rem] leading-tight mb-1 break-words`}>{task.title}</div>
                          <div className="flex items-center gap-2">
                            {task.startTime && <div className="text-[0.6rem] md:text-[0.65rem] text-secondary/40 font-black uppercase tracking-widest leading-none">⏰ {task.startTime}</div>}
                            {task.status === 'In Progress' && <span className="text-[0.55rem] text-[#3a86ff] font-black uppercase tracking-wider bg-[#3a86ff]/10 px-1.5 py-0.5 rounded">ACTIVE</span>}
                          </div>
                        </div>
                      </div>
                      <span className={`flex-shrink-0 text-[0.5rem] md:text-[0.6rem] font-black px-2 py-1 rounded-lg uppercase tracking-wider whitespace-nowrap transition-opacity duration-200 ${task.status === 'Completed' ? 'opacity-40' : ''} ${
                        task.category === 'Work' ? 'bg-[#3a86ff]/10 text-[#3a86ff] border border-[#3a86ff]/30' :
                        task.category === 'Study' ? 'bg-[#06d6a0]/10 text-[#06d6a0] border border-[#06d6a0]/30' :
                        task.category === 'Health' ? 'bg-[#ffd166]/10 text-[#ffd166] border border-[#ffd166]/30' :
                        'bg-[#1a1a1a] text-secondary/60 border border-border/20'
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
              <div className="flex flex-col gap-8">
                <div className="flex flex-col gap-4 sm:flex-row sm:gap-10 sm:items-start">
                  <div className="flex items-center justify-between gap-1 sm:flex-col sm:items-start">
                    <span className="label-sub !text-secondary/20 !text-[0.65rem] md:!text-[0.6rem] uppercase tracking-[2px]">Planned</span>
                    <span className="text-white text-[1.6rem] md:text-[1.8rem] font-black tracking-tighter leading-none">{reality?.plannedTasks ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 sm:flex-col sm:items-start">
                    <span className="label-sub !text-[#06d6a0]/20 !text-[0.65rem] md:!text-[0.6rem] uppercase tracking-[2px]">Done</span>
                    <span className="text-[#06d6a0] text-[1.6rem] md:text-[1.8rem] font-black tracking-tighter leading-none">{reality?.completedTasks ?? '—'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1 sm:flex-col sm:items-start">
                    <span className="label-sub !text-[#ef476f]/20 !text-[0.65rem] md:!text-[0.6rem] uppercase tracking-[2px]">Missed</span>
                    <span className="text-[#ef476f] text-[1.6rem] md:text-[1.8rem] font-black tracking-tighter leading-none">{reality?.missedTasks ?? '—'}</span>
                  </div>
                </div>
                
                <div className="pt-6 border-t border-border/10 flex justify-between items-center bg-[#050505]/30 -mx-6 px-6 pb-2 rounded-b-2xl">
                  <div className="flex flex-col">
                    <div className="text-secondary/20 text-[0.55rem] font-black uppercase tracking-[3px] mb-1">Efficiency</div>
                    <div className={`${(reality?.completionPercentage ?? 0) >= 70 ? 'text-[#06d6a0]' : 'text-[#ef476f]'} text-[2.2rem] md:text-[2.6rem] font-black tracking-[-3px] leading-none`}>
                      {reality?.completionPercentage ?? 0}%
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                     <div className="bg-[#0a0a0a] px-3 py-1.5 rounded-lg border border-border/10 shadow-lg">
                        <span className="text-[0.55rem] text-secondary/40 font-black uppercase tracking-widest whitespace-nowrap">Daily Goal Reached</span>
                     </div>
                     <span className="text-[0.5rem] text-secondary/10 font-bold uppercase tracking-[1px] mr-1">Status Verified</span>
                  </div>
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
            <span className="invisible uppercase select-none label-sub">Spacer</span>
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
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
               <span className="uppercase label-sub">Weekly Activity</span>
               <div className="flex items-baseline gap-1">
                 <span className="text-white text-[1.2rem] font-black tracking-tight">{stats?.tasksToday ?? 0}</span>
                 <span className="text-secondary/40 text-[0.7rem] font-black uppercase">/ {stats?.tasksTotal ?? 0}</span>
               </div>
            </div>
            <div className="h-[200px] w-full mt-auto">
              {statsQuery.isLoading ? (
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
