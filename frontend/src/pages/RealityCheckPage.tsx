import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAllTasks } from '../api/growthos';
import { taskQueryKey } from '../api/queryKeys';
import { localDateKey } from '../lib/dateUtils';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { Task } from '../lib/types';

function shiftDateKey(dateKey: string, days: number): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + days);
  return localDateKey(date);
}

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function dateOnly(value?: string | null): string | null {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : localDateKey(parsed);
}

function TaskStatus({ status }: { status: Task['status'] }) {
  const colors: Record<Task['status'], string> = {
    Pending: 'bg-white/5 text-zinc-300',
    'In Progress': 'bg-accent/10 text-accent',
    Completed: 'bg-emerald-500/10 text-emerald-300',
    Missed: 'bg-rose-500/10 text-rose-300',
  };
  const label = status === 'Pending' ? 'Not started' : status;

  return (
    <span className={`rounded-md px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider ${colors[status]}`}>
      {label}
    </span>
  );
}

function SummaryItem({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-black/10 p-4">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="mt-2 text-2xl font-black leading-none text-white">{value}</p>
      {detail && <p className="mt-2 text-xs text-zinc-500">{detail}</p>}
    </div>
  );
}

export default function RealityCheckPage() {
  const today = localDateKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const tasksQuery = useQuery<Task[]>({
    queryKey: taskQueryKey(selectedDate, 100),
    queryFn: () => fetchAllTasks(selectedDate, 100),
  });

  const tasks = tasksQuery.data ?? [];
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const pendingTasks = tasks.filter(task => task.status === 'Pending').length;
  const inProgressTasks = tasks.filter(task => task.status === 'In Progress').length;
  const missedTasks = tasks.filter(task => task.status === 'Missed').length;
  const overdueTasks = tasks.filter(task => {
    const dueDate = dateOnly(task.dueDate);
    return dueDate !== null && dueDate < today && task.status !== 'Completed';
  }).length;
  const completionRate = tasks.length ? Math.round(completedTasks / tasks.length * 100) : null;
  const nextDate = shiftDateKey(selectedDate, 1);
  const isToday = selectedDate === today;
  const hasUnfinishedTasks = pendingTasks + inProgressTasks > 0;

  return (
    <div className="page-stack min-w-0">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="title-main">Reality Check</h1>
          <p className="title-sub text-zinc-400">Review what was planned and what its current status shows.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            aria-label="Previous day"
            onClick={() => setSelectedDate(shiftDateKey(selectedDate, -1))}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#09090b] text-lg text-zinc-300 hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-accent"
          >
            ‹
          </button>
          <label className="flex min-h-10 min-w-0 items-center gap-2 rounded-xl border border-white/10 bg-[#09090b] px-3">
            <span className="sr-only">Review date</span>
            <input
              aria-label="Review date"
              type="date"
              value={selectedDate}
              max={today}
              onChange={event => {
                if (event.target.value && event.target.value <= today) setSelectedDate(event.target.value);
              }}
              className="min-w-0 bg-transparent text-sm font-semibold text-white focus:ring-2 focus:ring-accent"
            />
          </label>
          <button
            type="button"
            aria-label="Next day"
            disabled={isToday}
            onClick={() => setSelectedDate(nextDate > today ? today : nextDate)}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#09090b] text-lg text-zinc-300 hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-accent disabled:cursor-not-allowed disabled:opacity-40"
          >
            ›
          </button>
        </div>
      </div>

      <p className="text-sm font-semibold text-zinc-300">{formatDate(selectedDate)}{isToday ? ' · Today' : ''}</p>

      {tasksQuery.isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
          {Array.from({ length: 5 }, (_, index) => <Skeleton key={index} height="102px" />)}
        </div>
      ) : tasksQuery.isError ? (
        <Card className="border-l-4 border-rose-500 bg-rose-950/20 p-5 primary">
          <h2 className="font-bold text-rose-300">This day’s review could not be loaded</h2>
          <p className="mt-1 text-sm text-rose-200/80">{tasksQuery.error.message}</p>
          <button
            type="button"
            onClick={() => tasksQuery.refetch()}
            className="mt-3 text-xs font-black uppercase tracking-widest text-accent hover:text-white"
          >
            Retry
          </button>
        </Card>
      ) : (
        <>
          <section aria-label="Daily performance summary">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <SummaryItem label="Planned" value={tasks.length} />
              <SummaryItem label="Completed" value={completedTasks} />
              <SummaryItem label="Not started" value={pendingTasks} />
              <SummaryItem label="In progress" value={inProgressTasks} />
              <SummaryItem label="Completion rate" value={completionRate === null ? '—' : `${completionRate}%`} detail={tasks.length ? `${completedTasks} of ${tasks.length} planned` : 'No tasks planned'} />
            </div>
            {(missedTasks > 0 || overdueTasks > 0) && (
              <p className="mt-3 text-xs text-zinc-400">
                {missedTasks > 0 && <>{missedTasks} {missedTasks === 1 ? 'task is' : 'tasks are'} explicitly marked missed.</>}
                {missedTasks > 0 && overdueTasks > 0 && ' '}
                {overdueTasks > 0 && `${overdueTasks} unfinished ${overdueTasks === 1 ? 'task has' : 'tasks have'} a due date before today; this may overlap with missed tasks.`}
              </p>
            )}
          </section>

          {tasks.length === 0 ? (
            <Card className="p-6 text-center primary">
              <h2 className="text-base font-bold text-white">No tasks were planned for this day</h2>
              <p className="mx-auto mt-2 max-w-lg text-sm text-zinc-400">
                There is no completion rate to judge. Use the Planner to decide what matters for your next day.
              </p>
              <Link to="/planner" className="mt-4 inline-flex min-h-10 self-center items-center rounded-lg bg-accent px-4 text-sm font-bold text-white hover:bg-accent/90">
                Plan tasks
              </Link>
            </Card>
          ) : (
            <>
              <Card className="p-4 sm:p-5 primary">
                <h2 className="text-base font-bold text-white">What the task data shows</h2>
                <p className="mt-2 text-sm text-zinc-300">
                  {completedTasks > 0
                    ? `${completedTasks} of ${tasks.length} planned ${tasks.length === 1 ? 'task is' : 'tasks are'} currently marked completed.`
                    : 'No planned tasks are currently marked completed.'}
                </p>
                {(hasUnfinishedTasks || missedTasks > 0) && (
                  <p className="mt-2 text-sm text-zinc-300">
                    {pendingTasks > 0 && `${pendingTasks} not started`}
                    {pendingTasks > 0 && inProgressTasks > 0 && ' · '}
                    {inProgressTasks > 0 && `${inProgressTasks} in progress`}
                    {(pendingTasks > 0 || inProgressTasks > 0) && missedTasks > 0 && ' · '}
                    {missedTasks > 0 && `${missedTasks} marked missed`}
                    {(hasUnfinishedTasks || missedTasks > 0) && '. '}
                    {hasUnfinishedTasks && 'Review unfinished tasks in Planner to decide whether to reschedule or revise the plan. '}
                    {missedTasks > 0 && 'The app does not record why a task was missed.'}
                  </p>
                )}
              </Card>

              <Card className="p-4 sm:p-5 primary">
                <div className="mb-3 flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-base font-bold text-white">Tasks for this day</h2>
                    <p className="mt-1 text-xs text-zinc-400">Statuses below are the tasks’ current saved statuses, not a historical status snapshot.</p>
                  </div>
                  <Link to="/planner" className="min-h-9 self-start rounded-lg border border-white/10 px-3 py-2 text-xs font-bold text-accent hover:bg-white/5 sm:self-auto">
                    Review in Planner
                  </Link>
                </div>
                <ul className="divide-y divide-white/5">
                  {tasks.map(task => {
                    const dueDate = dateOnly(task.dueDate);
                    const overdue = dueDate !== null && dueDate < today && task.status !== 'Completed';
                    return (
                      <li key={task._id} className="flex min-w-0 flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <h3 className={`break-words text-sm font-bold ${task.status === 'Completed' ? 'text-zinc-400 line-through' : 'text-white'}`}>
                            {task.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <TaskStatus status={task.status} />
                            {task.category && <span className="text-xs text-zinc-400">Category · {task.category}</span>}
                            {dueDate && <span className="text-xs text-zinc-400">Due · {formatDate(dueDate)}</span>}
                            {overdue && <span className="text-xs font-semibold text-rose-300">Overdue</span>}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Card>
            </>
          )}
        </>
      )}
    </div>
  );
}
