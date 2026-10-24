import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createHabit, deleteHabit, fetchAllHabits, markHabitComplete } from '../api/growthos';
import { habitQueryKey, productivityReportQueryKey } from '../api/queryKeys';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useConfirm } from '../components/ui/ConfirmProvider';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Habit } from '../lib/types';

function toLocalDateKey(value: string | Date): string | null {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(value)) {
    return value.slice(0, 10);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function completionKeys(completedDates: string[], todayKey: string): string[] {
  return [...new Set(
    (completedDates ?? [])
      .map(toLocalDateKey)
      .filter((key): key is string => Boolean(key) && key! <= todayKey)
  )].sort();
}

function calcBestStreak(keys: string[]): number {
  let best = 0;
  let current = 0;
  let previousDate: Date | null = null;

  for (const key of keys) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    const consecutive = previousDate !== null && date.getTime() - previousDate.getTime() === 86400000;
    current = consecutive ? current + 1 : 1;
    best = Math.max(best, current);
    previousDate = date;
  }
  return best;
}

export default function HabitsPage() {
  const [draft, setDraft] = useState('');
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const habitsQuery = useQuery<Habit[]>({
    queryKey: habitQueryKey(100),
    queryFn: () => fetchAllHabits(),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const habits = habitsQuery.data ?? [];
  const [today, setToday] = useState(() => toLocalDateKey(new Date())!);

  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);
    const timeoutId = window.setTimeout(
      () => setToday(toLocalDateKey(new Date())!),
      nextDay.getTime() - now.getTime()
    );
    return () => window.clearTimeout(timeoutId);
  }, [today]);

  const invalidateHabitViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['habits'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      queryClient.invalidateQueries({ queryKey: productivityReportQueryKey }),
      queryClient.resetQueries({ queryKey: ['history'] }),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: async () => {
      await invalidateHabitViews();
      setDraft('');
      toast.success('Habit added');
    },
    onError: () => toast.error("Couldn't add habit. Please try again."),
  });

  const checkInMutation = useMutation({
    mutationFn: markHabitComplete,
    onSuccess: invalidateHabitViews,
    onError: () => toast.error("Couldn't check in habit. Please try again."),
  });

  const deleteHabitMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: invalidateHabitViews,
    onError: () => toast.error("Couldn't delete habit. Please try again."),
  });

  const habitStreaks = useMemo(() => habits.map(habit => {
    const keys = completionKeys(habit.completedDateKeys ?? habit.completedDates ?? [], today);
    return {
      habit,
      keys,
      completedToday: keys.includes(today),
      bestStreak: calcBestStreak(keys),
    };
  }), [habits, today]);

  const doneToday = habitStreaks.filter(item => item.completedToday).length;
  const completionRate = habits.length ? Math.round((doneToday / habits.length) * 100) : 0;
  const bestStreak = habitStreaks.reduce((longest, item) => Math.max(longest, item.bestStreak), 0);

  const handleCreate = () => {
    if (draft.trim() && !createMutation.isPending) createMutation.mutate(draft.trim());
  };

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">Habits</h1>
        <p className="title-sub text-zinc-400">Build routines through consistent daily practice.</p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Card className="primary compact-card">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">Completed Today</span>
          {habitsQuery.isLoading ? <Skeleton height="38px" /> : habitsQuery.isError ? (
            <div role="alert" className="text-sm text-rose-300">Habit data unavailable.</div>
          ) : (
            <>
              <div className="text-2xl font-black text-white sm:text-3xl">{doneToday} / {habits.length}</div>
              <div className="mt-1 text-xs font-medium text-zinc-400">habits checked in</div>
            </>
          )}
        </Card>
        <Card className="primary compact-card">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">Completion Rate</span>
          {habitsQuery.isLoading ? <Skeleton height="38px" /> : habitsQuery.isError ? (
            <div role="alert" className="text-sm text-rose-300">Habit data unavailable.</div>
          ) : (
            <>
              <div className="text-2xl font-black text-white sm:text-3xl">{completionRate}%</div>
              <div className="mt-1 text-xs font-medium text-zinc-400">of today's habits completed</div>
            </>
          )}
        </Card>
        <Card className="primary compact-card">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">Best Streak</span>
          {habitsQuery.isLoading ? <Skeleton height="38px" /> : habitsQuery.isError ? (
            <div role="alert" className="text-sm text-rose-300">Streak data unavailable.</div>
          ) : (
            <>
              <div className="text-2xl font-black text-white sm:text-3xl">{bestStreak} {bestStreak === 1 ? 'day' : 'days'}</div>
              <div className="mt-1 text-xs font-medium text-zinc-400">longest recorded consecutive run</div>
            </>
          )}
        </Card>
      </div>

      <Card className="primary p-4 sm:p-6">
        <label htmlFor="new-habit" className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">
          Add a daily habit
        </label>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            id="new-habit"
            className="field-input !h-12 !flex-1 !bg-[#09090b] !px-4 !text-sm text-white placeholder:text-zinc-500 border border-white/10 rounded-xl hover:border-white/20 focus:border-accent sm:!text-base"
            value={draft}
            onChange={event => setDraft(event.target.value)}
            onKeyDown={event => event.key === 'Enter' && handleCreate()}
            placeholder="Add a new daily habit..."
          />
          <Button
            type="button"
            disabled={!draft.trim() || createMutation.isPending}
            onClick={handleCreate}
            className="!h-12 !w-full !bg-accent !px-8 !text-xs !font-bold !text-white uppercase tracking-wider hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:!w-auto sm:!text-sm"
          >
            {createMutation.isPending ? 'ADDING...' : 'ADD HABIT'}
          </Button>
        </div>
      </Card>

      <Card className="primary !p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#070709] px-4 py-3.5 sm:px-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Your Habit List</h2>
          <span className="text-xs font-semibold text-zinc-400">
            {habitsQuery.isError ? '—' : habits.length} {habits.length === 1 ? 'habit' : 'habits'}
          </span>
        </div>
        <div className="p-4 sm:p-6">
          {habitsQuery.isLoading ? (
            <Skeleton height="200px" />
          ) : habitsQuery.isError ? (
            <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
              <p className="text-sm text-rose-300">Your habits couldn't be loaded.</p>
              <button
                type="button"
                onClick={() => habitsQuery.refetch()}
                className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
              >
                Retry
              </button>
            </div>
          ) : habitStreaks.length === 0 ? (
            <div className="py-12 text-center text-sm font-medium text-zinc-400">
              You don't have any habits yet. Add your first habit above to start building a routine.
            </div>
          ) : (
            <div className="stack-gap-sm">
              {habitStreaks.map(({ habit, completedToday }) => (
                <div
                  key={habit._id}
                  className={`flex min-w-0 flex-col gap-3 rounded-xl border p-4 transition-colors sm:gap-4 ${
                    completedToday
                      ? 'border-emerald-500/30 bg-emerald-950/15'
                      : 'border-white/10 bg-[#09090b] hover:border-white/20'
                  }`}
                >
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className={`break-words text-base font-bold sm:text-lg ${completedToday ? 'text-emerald-300' : 'text-white'}`}>
                        {habit.name}
                      </div>
                      <div className="mt-0.5 text-xs font-semibold text-zinc-400">
                        {completedToday ? 'Completed today' : 'Not completed today'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => !completedToday && checkInMutation.mutate(habit._id)}
                      disabled={completedToday || checkInMutation.isPending}
                      className={`min-h-10 min-w-[120px] rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                        completedToday
                          ? 'cursor-default border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                          : 'bg-accent text-white shadow-md shadow-accent/20 hover:bg-accent/90 active:scale-95 disabled:cursor-wait disabled:opacity-50'
                      }`}
                      aria-label={completedToday ? `${habit.name} completed today` : `Check in ${habit.name}`}
                    >
                      {completedToday ? 'DONE' : checkInMutation.isPending ? 'SAVING...' : 'CHECK IN'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        void confirm({
                          title: 'Delete habit?',
                          message: `Delete "${habit.name}"? This will permanently remove this habit and its check-in history.`,
                          confirmLabel: 'Delete habit',
                          variant: 'danger',
                        }).then(confirmed => {
                          if (confirmed) deleteHabitMutation.mutate(habit._id);
                        });
                      }}
                      disabled={deleteHabitMutation.isPending}
                      className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-wait disabled:opacity-50"
                      aria-label={`Delete ${habit.name}`}
                    >
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
