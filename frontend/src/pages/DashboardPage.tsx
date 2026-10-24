import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchDashboardStats, fetchGoals, fetchTasks, updateTask, fetchHabits, markHabitComplete } from '../api/growthos';
import { dashboardStatsQueryKey, taskQueryKey, habitQueryKey } from '../api/queryKeys';
import { useAuth } from '../hooks/useAuth';
import { localDateKey } from '../lib/dateUtils';
import { fireCelebration } from '../lib/rewards';
import toast from 'react-hot-toast';
import type { DashboardStats, Goal, Task, Habit } from '../lib/types';

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

  const statsQuery = useQuery<DashboardStats>({
    queryKey: dashboardStatsQueryKey(localDate),
    queryFn: () => fetchDashboardStats(localDate),
    staleTime: 5 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const tasksQuery = useQuery<Task[]>({
    queryKey: taskQueryKey(localDate, 20),
    queryFn: () => fetchTasks(localDate, 20),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const habitsQuery = useQuery<Habit[]>({
    queryKey: habitQueryKey(50),
    queryFn: () => fetchHabits(50),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const todayTasks = useMemo(() => tasksQuery.data?.slice(0, 5) ?? [], [tasksQuery.data]);
  const todayHabits = useMemo(() => habitsQuery.data?.slice(0, 5) ?? [], [habitsQuery.data]);
  const goalsCount = goalsQuery.data?.filter(goal => goal.type === 'goal').length ?? 0;
  const affirmationsCount = goalsQuery.data?.filter(goal => goal.type === 'affirmation').length ?? 0;

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: (updatedTask) => {
      queryClient.setQueryData<Task[]>(taskQueryKey(localDate, 20), currentTasks =>
        currentTasks?.map(task => task._id === updatedTask._id ? updatedTask : task)
      );
      queryClient.invalidateQueries({ queryKey: dashboardStatsQueryKey(localDate) });
    },
    onError: () => toast.error("Couldn't update the task. Please try again."),
  });

  const markHabitMutation = useMutation({
    mutationFn: (habitId: string) => markHabitComplete(habitId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: habitQueryKey(50) });
      queryClient.invalidateQueries({ queryKey: dashboardStatsQueryKey(localDate) });
      toast.success('Habit checked in!');
    },
    onError: () => toast.error("Couldn't check in habit. Please try again."),
  });

  const isHabitDoneToday = (habit: Habit) => {
    return (
      habit.completedDateKeys?.includes(localDate) ||
      habit.completedDates?.some(d => d.startsWith(localDate)) ||
      false
    );
  };

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">{greeting.text}</h1>
        <p className="title-sub text-zinc-400">{greeting.sub}</p>
      </div>

      {/* Top 3 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 md:gap-4">
        <Card className="primary p-4 sm:p-5 bg-[#0c0c0e]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">Tasks</span>
          {statsQuery.isLoading ? (
            <div className="mt-2"><Skeleton height="36px" /></div>
          ) : statsQuery.isError || !statsQuery.data ? (
            <div className="mt-2 flex flex-col items-start gap-2">
              <p className="text-xs text-rose-300">Task counts unavailable.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-[0.65rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-white">
                {statsQuery.data.tasksToday} <span className="text-zinc-400 text-sm font-semibold">/ {statsQuery.data.tasksTotal}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-400 font-medium">completed / scheduled today</p>
            </>
          )}
        </Card>

        <Card className="primary p-4 sm:p-5 bg-[#0c0c0e]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">Habits</span>
          {statsQuery.isLoading ? (
            <div className="mt-2"><Skeleton height="36px" /></div>
          ) : statsQuery.isError || !statsQuery.data ? (
            <div className="mt-2 flex flex-col items-start gap-2">
              <p className="text-xs text-rose-300">Habit counts unavailable.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-[0.65rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-white">
                {statsQuery.data.habitsDone} <span className="text-zinc-400 text-sm font-semibold">/ {statsQuery.data.habitsTotal}</span>
              </p>
              <p className="mt-1 text-xs text-zinc-400 font-medium">completed today</p>
            </>
          )}
        </Card>

        <Card className="primary p-4 sm:p-5 sm:col-span-2 md:col-span-1 bg-[#0c0c0e]">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">Goals &amp; Affirmations</span>
          {goalsQuery.isLoading ? (
            <div className="mt-2"><Skeleton height="36px" /></div>
          ) : goalsQuery.isError || !goalsQuery.data ? (
            <div className="mt-2 flex flex-col items-start gap-2">
              <p className="text-xs text-rose-300">Goal counts unavailable.</p>
              <button
                type="button"
                onClick={() => goalsQuery.refetch()}
                className="text-[0.65rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-1 text-2xl sm:text-3xl font-black text-white">{goalsCount + affirmationsCount}</p>
              <p className="mt-1 text-xs text-zinc-400 font-medium">
                {goalsCount} goals · {affirmationsCount} affirmations
              </p>
            </>
          )}
        </Card>
      </div>

      {/* Main 2 Column Grid: Today's Tasks & Today's Habits */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6">
        {/* ── CARD 1: TODAY'S TASKS ── */}
        <Card className="primary !p-0 overflow-hidden bg-[#0c0c0e]">
          <div className="px-4 md:px-6 py-3.5 bg-[#070709] border-b border-white/10 flex justify-between items-center gap-3">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Today's Tasks</span>
            <Link to="/planner" className="text-xs font-bold text-accent uppercase tracking-wider hover:text-white transition-colors">
              Open Planner
            </Link>
          </div>

          <div className="px-4 md:px-6">
            {tasksQuery.isLoading ? (
              <div className="py-6"><Skeleton height="150px" /></div>
            ) : tasksQuery.isError ? (
              <div className="py-6 flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-rose-300">Today's task list couldn't be loaded.</p>
                <button
                  type="button"
                  onClick={() => tasksQuery.refetch()}
                  className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry
                </button>
              </div>
            ) : todayTasks.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-bold text-white">Nothing planned for today</p>
                <Link to="/planner" className="mt-2 inline-block text-xs font-bold text-accent hover:text-white transition-colors">
                  Plan a task
                </Link>
              </div>
            ) : (
              todayTasks.map((task) => (
                <div key={task._id} className="flex justify-between items-center py-3 md:py-3.5 px-2 md:px-3 border-b border-white/5 last:border-0 gap-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center flex-1 min-w-0 gap-3">
                    <button
                      type="button"
                      aria-label={task.status === 'Completed' ? `Mark ${task.title} pending` : `Mark ${task.title} completed`}
                      disabled={updateTaskMutation.isPending}
                      onClick={(e) => {
                        if (task.status !== 'Completed') {
                          fireCelebration(e.clientX, e.clientY);
                        }
                        updateTaskMutation.mutate({
                          id: task._id,
                          updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' },
                        });
                      }}
                      className="task-checkbox transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                      style={{
                        backgroundColor: task.status === 'Completed' ? '#00bfff' : 'transparent',
                        borderColor: task.status === 'Completed' ? '#00bfff' : '#71717a',
                      }}
                    >
                      {task.status === 'Completed' && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className={`${task.status === 'Completed' ? 'text-zinc-500 line-through' : 'text-white'} font-bold text-sm leading-tight break-words`}>
                        {task.title}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        {task.startTime && <span className="text-[0.72rem] text-zinc-400 font-medium">{task.startTime}</span>}
                        {task.status === 'In Progress' && <span className="text-[0.65rem] text-accent font-black uppercase tracking-wider">In progress</span>}
                        {task.status === 'Missed' && <span className="text-[0.65rem] text-rose-400 font-black uppercase tracking-wider">Missed</span>}
                      </div>
                    </div>
                  </div>
                  <span className={`flex-shrink-0 text-[0.65rem] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider tag-${task.category?.toLowerCase() || 'personal'}`}>
                    {task.category}
                  </span>
                </div>
              ))
            )}

            {tasksQuery.data && tasksQuery.data.length > todayTasks.length && (
              <div className="py-3 border-t border-white/5 text-center">
                <Link to="/planner" className="text-xs font-bold text-accent hover:text-white transition-colors">
                  View all today's tasks
                </Link>
              </div>
            )}
          </div>
        </Card>

        {/* ── CARD 2: TODAY'S HABITS (Exact same structure, styling & consistency) ── */}
        <Card className="primary !p-0 overflow-hidden bg-[#0c0c0e]">
          <div className="px-4 md:px-6 py-3.5 bg-[#070709] border-b border-white/10 flex justify-between items-center gap-3">
            <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">Today's Habits</span>
            <Link to="/habits" className="text-xs font-bold text-accent uppercase tracking-wider hover:text-white transition-colors">
              Open Habits
            </Link>
          </div>

          <div className="px-4 md:px-6">
            {habitsQuery.isLoading ? (
              <div className="py-6"><Skeleton height="150px" /></div>
            ) : habitsQuery.isError ? (
              <div className="py-6 flex flex-col items-center gap-3 text-center">
                <p className="text-sm text-rose-300">Today's habits couldn't be loaded.</p>
                <button
                  type="button"
                  onClick={() => habitsQuery.refetch()}
                  className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry
                </button>
              </div>
            ) : todayHabits.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-sm font-bold text-white">No habits tracked for today</p>
                <Link to="/habits" className="mt-2 inline-block text-xs font-bold text-accent hover:text-white transition-colors">
                  Add a habit
                </Link>
              </div>
            ) : (
              todayHabits.map((habit) => {
                const isDone = isHabitDoneToday(habit);
                return (
                  <div key={habit._id} className="flex justify-between items-center py-3 md:py-3.5 px-2 md:px-3 border-b border-white/5 last:border-0 gap-3 rounded-lg hover:bg-white/[0.03] transition-colors">
                    <div className="flex items-center flex-1 min-w-0 gap-3">
                      <button
                        type="button"
                        aria-label={isDone ? `Habit ${habit.name} completed today` : `Check in habit ${habit.name}`}
                        disabled={markHabitMutation.isPending}
                        onClick={(e) => {
                          if (!isDone) {
                            fireCelebration(e.clientX, e.clientY);
                            markHabitMutation.mutate(habit._id);
                          }
                        }}
                        className="task-checkbox transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                        style={{
                          backgroundColor: isDone ? '#00bfff' : 'transparent',
                          borderColor: isDone ? '#00bfff' : '#71717a',
                        }}
                      >
                        {isDone && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`${isDone ? 'text-zinc-500 line-through' : 'text-white'} font-bold text-sm leading-tight break-words`}>
                          {habit.name}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`text-[0.65rem] font-bold uppercase tracking-wider ${isDone ? 'text-emerald-400' : 'text-zinc-400'}`}>
                            {isDone ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {habit.streak > 0 ? (
                      <span className="flex-shrink-0 text-[0.65rem] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                        {habit.streak}d streak
                      </span>
                    ) : (
                      <span className="flex-shrink-0 text-[0.65rem] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider bg-white/5 border border-white/10 text-zinc-400">
                        Daily
                      </span>
                    )}
                  </div>
                );
              })
            )}

            {habitsQuery.data && habitsQuery.data.length > todayHabits.length && (
              <div className="py-3 border-t border-white/5 text-center">
                <Link to="/habits" className="text-xs font-bold text-accent hover:text-white transition-colors">
                  View all habits
                </Link>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
