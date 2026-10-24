import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, createHabit, deleteHabit, markHabitComplete, fetchGoals, createGoal, deleteGoal } from '../api/growthos';
import { habitQueryKey } from '../api/queryKeys';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Goal, Habit } from '../lib/types';

function toLocalDateKey(value: string | Date): string | null {
  if (!value) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(value)) {
    return value.slice(0, 10);
  }
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function calcStreak(completedDates: string[], todayKey: string): number {
  if (!completedDates?.length) return 0;

  const today = new Date(`${todayKey}T00:00:00`);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const todayOrYesterday = new Set([todayKey, toLocalDateKey(yesterday)!]);
  const uniqueKeys = [...new Set(
    completedDates
      .map(toLocalDateKey)
      .filter((key): key is string => Boolean(key))
      .filter(key => key <= todayKey)
  )].sort().reverse();

  let streak = 0;
  let current = todayOrYesterday.has(uniqueKeys[0]) ? new Date(`${uniqueKeys[0]}T00:00:00`) : null;
  if (!current) return 0;

  for (const key of uniqueKeys) {
    const expectedKey = toLocalDateKey(current);
    if (key === expectedKey) {
      streak++;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<'Habits' | 'Goals'>('Habits');
  const [draft, setDraft] = useState('');
  const [goalDraft, setGoalDraft] = useState('');
  const [goalType, setGoalType] = useState<'goal' | 'affirmation'>('goal');
  const queryClient = useQueryClient();

  const habitsQuery = useQuery<Habit[]>({
    queryKey: habitQueryKey(50),
    queryFn: () => fetchHabits(50), // Limit to 50
    staleTime: 0, // Always consider stale - refetch on invalidation
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  const habits = habitsQuery.data ?? [];
  const isLoading = habitsQuery.isLoading;

  const goalsQuery = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 0,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  
  const goals = goalsQuery.data ?? [];
  const isGoalsLoading = goalsQuery.isLoading;

  const invalidateHabitViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['habits'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
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

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalDraft('');
      toast.success('Goal saved');
    },
    onError: () => toast.error('Failed to add goal. Please try again.'),
  });

  const deleteGoalMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: async (_, goalId) => {
      queryClient.setQueryData<Goal[]>(['goals'], currentGoals =>
        currentGoals?.filter(goal => goal._id !== goalId)
      );
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
    onError: () => toast.error('Failed to delete goal. Please try again.'),
  });

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

  const goalStats = useMemo(() => ({
    total: goals.length,
    goals: goals.filter((goal) => goal.type === 'goal').length,
    affirmations: goals.filter((goal) => goal.type === 'affirmation').length,
  }), [goals]);

  const doneToday = useMemo(
    () => habits.filter(h => h.completedDates?.some(d => toLocalDateKey(d) === today)).length,
    [habits, today]
  );

  const bestStreak = useMemo(
    () => habits.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [], today)), 0),
    [habits, today]
  );

  const completionRate = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  return (
    <div className="page-stack">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="title-main">Habits & Routine</h1>
          <p className="title-sub text-zinc-400">Build automatic behaviors through consistent daily practice.</p>
        </div>
        <div className="tab-group flex gap-1.5 bg-[#09090b] p-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          {(['Habits', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                activeTab === tab
                  ? 'bg-[#1c1c22] text-white shadow-md border border-white/10'
                  : 'bg-transparent text-zinc-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── HABITS TAB ── */}
      {activeTab === 'Habits' && (
        <div className="split-layout">
          {/* Left: Habit manager */}
          <div className="stack-gap-lg min-w-0">
            <Card className="primary p-4 sm:p-6">
              {isLoading ? (
                <div className="mb-6"><Skeleton height="116px" /></div>
              ) : (
                <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
                  <div className="rounded-xl border border-white/10 bg-[#09090b] p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">Completed Today</span>
                    <div className="mt-1.5 text-2xl sm:text-3xl font-black text-white">{habitsQuery.isError ? '—' : doneToday}</div>
                    <div className="mt-1 text-xs text-zinc-400 font-medium">of {habitsQuery.isError ? '—' : habits.length} habits</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#09090b] p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">Completion Rate</span>
                    <div className="mt-1.5 text-2xl sm:text-3xl font-black text-white">{habitsQuery.isError ? '—' : `${completionRate}%`}</div>
                    <div className="mt-1 text-xs text-zinc-400 font-medium">Today's habits completed</div>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-[#09090b] p-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">Best Streak</span>
                    <div className="mt-1.5 text-2xl sm:text-3xl font-black text-white">{habitsQuery.isError ? '—' : bestStreak}</div>
                    <div className="mt-1 text-xs text-zinc-400 font-medium">Consecutive days</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="field-input !h-12 !text-sm sm:!text-base !px-4 !flex-1 !bg-[#09090b] border border-white/10 hover:border-white/20 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft.trim() && !createMutation.isPending && createMutation.mutate(draft.trim())}
                  placeholder="Add a new daily habit..."
                />
                <Button
                  disabled={!draft.trim() || createMutation.isPending}
                  onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
                  className="!h-12 !w-full sm:!w-auto !px-8 !bg-accent hover:!bg-accent/90 !text-white !text-xs sm:!text-sm !font-bold !rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50 uppercase tracking-wider shadow-lg shadow-accent/25"
                >
                  {createMutation.isPending ? 'ADDING...' : 'ADD HABIT'}
                </Button>
              </div>
            </Card>

            <Card className="primary !p-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-[#070709] px-4 py-3.5 sm:px-6">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Your Habit List</span>
                <span className="text-xs text-zinc-400 font-semibold">
                  {habitsQuery.isError ? '—' : habits.length} {habits.length === 1 ? 'item' : 'items'}
                </span>
              </div>
              <div className="p-4 sm:p-6">
                {isLoading ? (
                  <Skeleton height="200px" />
                ) : habitsQuery.isError ? (
                  <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="text-sm text-rose-300">Your habits couldn't be loaded.</p>
                    <button type="button" onClick={() => habitsQuery.refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white">
                      Retry
                    </button>
                  </div>
                ) : habits.length === 0 ? (
                  <div className="py-12 text-center text-sm font-medium text-zinc-400">
                    No habits yet. Add one above to start building a routine.
                  </div>
                ) : (
                  <div className="stack-gap-sm">
                    {habits.map((habit) => {
                      const isCheckedToday = habit.completedDates?.some((d: string) => toLocalDateKey(d) === today) ?? false;
                      const streak = calcStreak(habit.completedDates || [], today);

                      return (
                        <div
                          key={habit._id}
                          className={`flex min-w-0 flex-col gap-3 sm:gap-4 rounded-xl border p-4 transition-all duration-200 ${
                            isCheckedToday
                              ? 'border-emerald-500/30 bg-emerald-950/15'
                              : 'border-white/10 bg-[#09090b] hover:border-white/20'
                          }`}
                        >
                          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className={`break-words font-bold text-base sm:text-lg ${isCheckedToday ? 'text-emerald-300' : 'text-white'}`}>
                                {habit.name}
                              </div>
                              <div className="text-xs font-semibold text-zinc-400 mt-0.5">
                                {isCheckedToday ? 'Completed today' : 'Not completed today'}
                              </div>
                            </div>
                            {streak > 0 && (
                              <div className="w-fit rounded-full bg-emerald-500/15 border border-emerald-500/30 px-3 py-0.5 text-xs font-bold text-emerald-300">
                                {streak}d streak
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                            <button
                              onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                              disabled={isCheckedToday || checkInMutation.isPending}
                              className={`min-h-10 min-w-[120px] rounded-xl px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all ${
                                isCheckedToday
                                  ? 'cursor-default border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                                  : 'bg-accent hover:bg-accent/90 text-white shadow-md shadow-accent/20 active:scale-95 disabled:cursor-wait disabled:opacity-50'
                              }`}
                              aria-label={isCheckedToday ? `${habit.name} completed today` : `Check in ${habit.name}`}
                            >
                              {isCheckedToday ? 'DONE' : checkInMutation.isPending ? 'SAVING...' : 'CHECK IN'}
                            </button>
                            <button
                              onClick={() => deleteHabitMutation.mutate(habit._id)}
                              disabled={deleteHabitMutation.isPending}
                              className="flex min-h-10 min-w-10 items-center justify-center rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:cursor-wait disabled:opacity-50"
                              aria-label={`Delete ${habit.name}`}
                            >
                              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                              </svg>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right: habit momentum */}
          <div className="stack-gap-lg min-w-0">
            <Card className="primary compact-card">
              <span className="mb-2 uppercase text-xs font-bold tracking-wider text-zinc-300 block">Longest Current Streak</span>
              {habitsQuery.isLoading ? (
                <Skeleton height="44px" />
              ) : habitsQuery.isError ? (
                <p className="text-sm text-rose-300">Streak data unavailable.</p>
              ) : (
                <>
                  <div className="mb-1 text-2xl sm:text-3xl font-black text-white">{bestStreak} days</div>
                  <div className="text-xs text-zinc-400 font-medium">
                    {bestStreak > 0 ? 'Keep the streak alive' : 'Start building momentum'}
                  </div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'Goals' && (
        <div className="split-layout">
          <div className="stack-gap-lg min-w-0">
            <Card className="primary p-4 sm:p-6">
              <span className="mb-4 uppercase text-xs font-bold tracking-wider text-zinc-300 block">Goal Progress</span>

              <div className="mt-2 mb-6 stack-gap-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <input
                    className="field-input !h-12 !text-sm sm:!text-base !px-4 !flex-1 !bg-[#09090b] border border-white/10 hover:border-white/20 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goalDraft.trim() && !createGoalMutation.isPending && createGoalMutation.mutate({ text: goalDraft.trim(), type: goalType })}
                    placeholder="What is your main goal or affirmation?"
                  />
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as 'goal' | 'affirmation')}
                    className="field-input !h-12 !w-full !px-4 text-xs font-bold uppercase tracking-wider sm:!w-44 !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  >
                    <option value="goal">Goal</option>
                    <option value="affirmation">Affirmation</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => goalDraft.trim() && createGoalMutation.mutate({ text: goalDraft.trim(), type: goalType })}
                    disabled={!goalDraft.trim() || createGoalMutation.isPending}
                    className="w-full sm:w-auto !px-8 !py-3 !bg-accent hover:!bg-accent/90 !text-white !font-bold !text-xs sm:!text-sm !rounded-xl transition-all shadow-lg shadow-accent/25 active:scale-95 uppercase tracking-wider"
                  >
                    {createGoalMutation.isPending ? 'SAVING...' : 'SAVE GOAL'}
                  </Button>
                </div>
              </div>

              {isGoalsLoading ? (
                <Skeleton height="220px" />
              ) : goalsQuery.isError ? (
                <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-rose-300">Your goals couldn't be loaded.</p>
                  <button type="button" onClick={() => goalsQuery.refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white">
                    Retry
                  </button>
                </div>
              ) : goals.length === 0 ? (
                <div className="py-14 text-center text-zinc-400 text-sm font-medium">
                  No objectives defined yet. Add one above to get started.
                </div>
              ) : (
                <div className="stack-gap-sm">
                  {goals.map((goal) => (
                    <div key={goal._id} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#09090b] p-4 hover:border-white/20 transition-all">
                      <div className="flex min-w-0 flex-col gap-1">
                        <span className="break-words text-base font-bold text-white">{goal.text}</span>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${goal.type === 'goal' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{goal.type}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Delete this ${goal.type}?`)) {
                            deleteGoalMutation.mutate(goal._id);
                          }
                        }}
                        disabled={deleteGoalMutation.isPending}
                        aria-label={`Delete ${goal.type}: ${goal.text}`}
                        className="flex min-h-10 min-w-10 shrink-0 items-center justify-center rounded-lg p-2 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors disabled:cursor-wait disabled:opacity-50"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6"/>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="stack-gap-lg min-w-0">
            <Card className="primary compact-card">
              <span className="mb-2 uppercase text-xs font-bold tracking-wider text-zinc-300 block">Active Goals</span>
              <div className="text-2xl sm:text-3xl font-black text-white">{isGoalsLoading || goalsQuery.isError ? '—' : goalStats.goals}</div>
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mt-1">Working on these</div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-2 uppercase text-xs font-bold tracking-wider text-zinc-300 block">Daily Affirmations</span>
              <div className="text-2xl sm:text-3xl font-black text-white">{isGoalsLoading || goalsQuery.isError ? '—' : goalStats.affirmations}</div>
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mt-1">Positive Mindset</div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-2 uppercase text-xs font-bold tracking-wider text-zinc-300 block">Total Objectives</span>
              <div className="text-2xl sm:text-3xl font-black text-white">{isGoalsLoading || goalsQuery.isError ? '—' : goalStats.total}</div>
              <div className="text-xs font-semibold text-accent uppercase tracking-wider mt-1">Total items</div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
