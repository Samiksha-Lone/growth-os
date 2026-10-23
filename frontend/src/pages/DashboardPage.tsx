import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { fetchDashboardStats, fetchGoals, fetchTasks, updateTask } from '../api/growthos';
import { dashboardStatsQueryKey, taskQueryKey } from '../api/queryKeys';
import { useAuth } from '../hooks/useAuth';
import { localDateKey } from '../lib/dateUtils';
import type { DashboardStats, Goal, Task } from '../lib/types';

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

  const localDate = useMemo(() => localDateKey(), []);

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
  const goalsQuery = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const todayTasks = useMemo(() => tasksQuery.data?.slice(0, 5) ?? [], [tasksQuery.data]);
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
  });

  return (
    <div className="page-stack">
      <div className="mb-2">
        <h1 className="title-main">{greeting.text}</h1>
        <p className="title-sub !text-secondary/60 italic">{greeting.sub}</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
        <Card className="primary p-4 md:p-5">
          <span className="label-sub uppercase">Tasks</span>
          {statsQuery.isLoading ? (
            <div className="mt-3"><Skeleton height="36px" /></div>
          ) : statsQuery.isError || !statsQuery.data ? (
            <div className="mt-3 flex flex-col items-start gap-2">
              <p className="text-xs text-red-300">Task counts unavailable.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-[0.6rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-2xl font-black text-white">
                {statsQuery.data.tasksToday} <span className="text-secondary/50">/ {statsQuery.data.tasksTotal}</span>
              </p>
              <p className="mt-1 text-xs text-secondary/50">completed / scheduled today</p>
            </>
          )}
        </Card>

        <Card className="primary p-4 md:p-5">
          <span className="label-sub uppercase">Habits</span>
          {statsQuery.isLoading ? (
            <div className="mt-3"><Skeleton height="36px" /></div>
          ) : statsQuery.isError || !statsQuery.data ? (
            <div className="mt-3 flex flex-col items-start gap-2">
              <p className="text-xs text-red-300">Habit counts unavailable.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-[0.6rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-2xl font-black text-white">
                {statsQuery.data.habitsDone} <span className="text-secondary/50">/ {statsQuery.data.habitsTotal}</span>
              </p>
              <p className="mt-1 text-xs text-secondary/50">completed today</p>
            </>
          )}
        </Card>

        <Card className="primary p-4 md:p-5">
          <span className="label-sub uppercase">Today's Plan</span>
          {statsQuery.isLoading ? (
            <div className="mt-3"><Skeleton height="36px" /></div>
          ) : statsQuery.isError || !statsQuery.data ? (
            <div className="mt-3 flex flex-col items-start gap-2">
              <p className="text-xs text-red-300">Today's plan unavailable.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-[0.6rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-2xl font-black text-white">{statsQuery.data.tasksTotal}</p>
              <p className="mt-1 text-xs text-secondary/50">tasks scheduled today</p>
            </>
          )}
        </Card>

        <Card className="primary p-4 md:p-5">
          <span className="label-sub uppercase">Goals &amp; Affirmations</span>
          {goalsQuery.isLoading ? (
            <div className="mt-3"><Skeleton height="36px" /></div>
          ) : goalsQuery.isError || !goalsQuery.data ? (
            <div className="mt-3 flex flex-col items-start gap-2">
              <p className="text-xs text-red-300">Goal counts unavailable.</p>
              <button
                type="button"
                onClick={() => goalsQuery.refetch()}
                className="text-[0.6rem] font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : (
            <>
              <p className="mt-2 text-2xl font-black text-white">{goalsCount + affirmationsCount}</p>
              <p className="mt-1 text-xs text-secondary/50">
                {goalsCount} goals · {affirmationsCount} affirmations
              </p>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-8">
        <Card className="primary !p-0 overflow-hidden">
          <div className="px-4 md:px-6 py-3 bg-[#050505] border-b border-border flex justify-between items-center gap-3">
            <span className="text-[0.65rem] font-black text-secondary/50 uppercase tracking-[2px]">Today's Tasks</span>
            <Link to="/planner" className="text-[0.65rem] font-black text-accent uppercase tracking-widest hover:text-white transition-colors">
              Open Planner
            </Link>
          </div>

          <div className="px-4 md:px-6">
            {statsQuery.isLoading ? (
              <div className="py-5"><Skeleton height="48px" /></div>
            ) : statsQuery.isError ? (
              <div className="py-5 flex flex-col items-start gap-3">
                <p className="text-sm text-red-300">Today's task summary couldn't be loaded.</p>
                <button
                  type="button"
                  onClick={() => statsQuery.refetch()}
                  className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry summary
                </button>
              </div>
            ) : !statsQuery.data ? (
              <div className="py-5 flex flex-col items-start gap-3">
                <p className="text-sm text-red-300">Today's task summary is unavailable.</p>
                <button
                  type="button"
                  onClick={() => statsQuery.refetch()}
                  className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry summary
                </button>
              </div>
            ) : statsQuery.data.tasksTotal === 0 && (tasksQuery.data?.length ?? 0) > 0 ? (
              <div className="py-5 flex flex-col items-start gap-3">
                <p className="text-sm text-red-300">The task summary doesn't match today's task list.</p>
                <button
                  type="button"
                  onClick={() => {
                    statsQuery.refetch();
                    tasksQuery.refetch();
                  }}
                  className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                >
                  Retry task data
                </button>
              </div>
            ) : statsQuery.data.tasksTotal === 0 ? (
              null
            ) : (
              <div className="py-5 flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{statsQuery.data.tasksToday}</span>
                <span className="text-sm text-secondary/60">of {statsQuery.data.tasksTotal} tasks completed</span>
              </div>
            )}

            <div className="border-t border-border/50">
              {tasksQuery.isLoading ? (
                <div className="py-4"><Skeleton height="150px" /></div>
              ) : tasksQuery.isError ? (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-red-300">Today's task list couldn't be loaded.</p>
                  <button
                    type="button"
                    onClick={() => tasksQuery.refetch()}
                    className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry task list
                  </button>
                </div>
              ) : todayTasks.length === 0 && (statsQuery.isError || (statsQuery.data?.tasksTotal ?? 0) > 0) ? (
                <div className="py-6 flex flex-col items-center gap-3 text-center">
                  <p className="text-sm text-red-300">
                    {statsQuery.isError
                      ? "Today's task summary couldn't be verified."
                      : "Tasks are scheduled, but today's list couldn't be loaded."}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      statsQuery.refetch();
                      tasksQuery.refetch();
                    }}
                    className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry task data
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
                  <div key={task._id} className="flex justify-between items-center py-3 md:py-4 px-2 md:px-3 border-b border-[#0a0a0a] last:border-0 gap-3 rounded-lg hover:bg-[#1a1a1a]/40 transition-colors">
                    <div className="flex items-center flex-1 min-w-0 gap-3">
                      <button
                        type="button"
                        aria-label={task.status === 'Completed' ? `Mark ${task.title} pending` : `Mark ${task.title} completed`}
                        disabled={updateTaskMutation.isPending}
                        onClick={() => updateTaskMutation.mutate({
                          id: task._id,
                          updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' },
                        })}
                        className="task-checkbox transition-all duration-200 flex-shrink-0 disabled:opacity-50"
                        style={{
                          backgroundColor: task.status === 'Completed' ? '#00bfff' : 'transparent',
                          borderColor: task.status === 'Completed' ? '#00bfff' : '#666',
                        }}
                      >
                        {task.status === 'Completed' && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className={`${task.status === 'Completed' ? 'text-secondary/40 line-through' : 'text-white'} font-bold text-sm leading-tight break-words`}>
                          {task.title}
                        </div>
                        <div className="mt-1 flex items-center gap-2">
                          {task.startTime && <span className="text-[0.65rem] text-secondary/40 font-bold">{task.startTime}</span>}
                          {task.status === 'In Progress' && <span className="text-[0.6rem] text-accent font-black uppercase tracking-wider">In progress</span>}
                        </div>
                      </div>
                    </div>
                    <span className="flex-shrink-0 text-[0.6rem] font-black px-2 py-1 rounded-lg uppercase tracking-wider text-secondary/60 bg-[#1a1a1a] border border-border/20">
                      {task.category}
                    </span>
                  </div>
                ))
              )}
            </div>

            {updateTaskMutation.isError && (
              <div role="alert" className="py-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-red-300">Couldn't update the task.</p>
                {updateTaskMutation.variables && (
                  <button
                    type="button"
                    onClick={() => updateTaskMutation.mutate(updateTaskMutation.variables)}
                    className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
                  >
                    Retry update
                  </button>
                )}
              </div>
            )}

            {tasksQuery.data && tasksQuery.data.length > todayTasks.length && (
              <div className="py-3 border-t border-border/50 text-center">
                <Link to="/planner" className="text-xs font-bold text-accent hover:text-white transition-colors">
                  View all today's tasks
                </Link>
              </div>
            )}
          </div>
        </Card>

        <Card className="primary p-5 md:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="label-sub uppercase">Today's Habits</h2>
              <p className="mt-2 text-xs text-secondary/50">A quick check-in on your daily routine.</p>
            </div>
            <Link to="/habits" className="text-[0.65rem] font-black text-accent uppercase tracking-widest hover:text-white transition-colors">
              Open Habits
            </Link>
          </div>

          {statsQuery.isLoading ? (
            <div className="mt-6"><Skeleton height="56px" /></div>
          ) : statsQuery.isError ? (
            <div className="mt-6 flex flex-col items-start gap-3">
              <p className="text-sm text-red-300">Today's habit summary couldn't be loaded.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry summary
              </button>
            </div>
          ) : !statsQuery.data ? (
            <div className="mt-6 flex flex-col items-start gap-3">
              <p className="text-sm text-red-300">Today's habit summary is unavailable.</p>
              <button
                type="button"
                onClick={() => statsQuery.refetch()}
                className="text-xs font-black text-accent uppercase tracking-widest hover:text-white"
              >
                Retry summary
              </button>
            </div>
          ) : statsQuery.data.habitsTotal === 0 ? (
            <p className="mt-6 text-sm text-secondary/60">
              No habits yet. <Link to="/habits" className="font-bold text-accent hover:text-white">Create one</Link> to start a routine.
            </p>
          ) : (
            <div className="mt-6 flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{statsQuery.data.habitsDone}</span>
              <span className="text-sm text-secondary/60">of {statsQuery.data.habitsTotal} habits checked in</span>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
