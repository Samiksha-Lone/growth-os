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
    staleTime: 0, // Always consider stale - refetch on invalidation
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
    onError: () => toast.error("Couldn't add the habit. Please try again."),
  });

  const deleteHabitMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: async () => {
      await invalidateHabitViews();
      toast.success('Habit deleted');
    },
    onError: (error) => {
      console.error('Habit delete failed:', error);
      toast.error('Failed to delete habit. Please try again.');
    }
  });

  const checkInMutation = useMutation({
    mutationFn: markHabitComplete,
    onSuccess: async () => {
      await invalidateHabitViews();
      toast.success('Checked in! 🔥');
    },
    onError: (error) => {
      console.error('Check in failed:', error);
      toast.error('Failed to check in. Please try again.');
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: async (goal) => {
      queryClient.setQueryData<Goal[]>(['goals'], currentGoals =>
        currentGoals ? [goal, ...currentGoals] : [goal]
      );
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      setGoalDraft('');
      toast.success('Goal added');
    },
    onError: (error) => {
      console.error('Goal create failed:', error);
      toast.error('Failed to add goal. Please try again.');
    }
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
    onError: (error) => {
      console.error('Goal delete failed:', error);
      toast.error('Failed to delete goal. Please try again.');
    }
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
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <h1 className="title-main">Habits & Routine</h1>
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border">
          {(['Habits', 'Goals'] as const).map(tab => (
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

      {/* ── HABITS TAB ── */}
      {activeTab === 'Habits' && (
        <div className="split-layout">
          {/* Left: Habit manager */}
          <div className="stack-gap-lg">
            <Card className="primary p-4 md:p-6">
              {isLoading ? (
                <div className="mb-6"><Skeleton height="116px" /></div>
              ) : (
                <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="rounded-2xl border border-border bg-[#090909] p-4">
                    <span className="label-sub text-[0.65rem] uppercase tracking-[2px] text-secondary/50">Completed Today</span>
                    <div className="mt-2 text-[2rem] font-black text-white">{habitsQuery.isError ? '—' : doneToday}</div>
                    <div className="mt-2 text-[0.75rem] text-secondary/40">of {habitsQuery.isError ? '—' : habits.length} habits</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-[#090909] p-4">
                    <span className="label-sub text-[0.65rem] uppercase tracking-[2px] text-secondary/50">Completion Rate</span>
                    <div className="mt-2 text-[2rem] font-black text-white">{habitsQuery.isError ? '—' : `${completionRate}%`}</div>
                    <div className="mt-2 text-[0.75rem] text-secondary/40">Today's habits completed</div>
                  </div>
                  <div className="rounded-2xl border border-border bg-[#090909] p-4">
                    <span className="label-sub text-[0.65rem] uppercase tracking-[2px] text-secondary/50">Best Streak</span>
                    <div className="mt-2 text-[2rem] font-black text-white">{habitsQuery.isError ? '—' : bestStreak}</div>
                    <div className="mt-2 text-[0.75rem] text-secondary/40">Consecutive days</div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="field-input !h-12 !text-[0.95rem] !px-4 !flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft.trim() && !createMutation.isPending && createMutation.mutate(draft.trim())}
                  placeholder="Add a new daily habit..."
                />
                <Button
                  disabled={!draft.trim() || createMutation.isPending}
                  onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
                  className="!h-12 !w-full sm:!w-auto !px-8 !bg-accent !text-white !text-[0.8rem] !font-black !rounded-xl transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {createMutation.isPending ? 'ADDING...' : 'ADD HABIT'}
                </Button>
              </div>
            </Card>

            <Card className="primary !p-0 overflow-hidden">
              <div className="flex items-center justify-between gap-3 border-b border-border bg-[#050505] px-4 py-4 md:px-6">
                <span className="label-sub uppercase !text-[0.65rem] tracking-[2px]">Your Habit List</span>
                <span className="text-[0.75rem] text-secondary/40 uppercase tracking-[2px]">
                  {habitsQuery.isError ? '—' : habits.length} items
                </span>
              </div>
              <div className="p-4 md:p-6">
                {isLoading ? (
                  <Skeleton height="200px" />
                ) : habitsQuery.isError ? (
                  <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
                    <p className="text-sm text-red-300">Your habits couldn't be loaded.</p>
                    <button type="button" onClick={() => habitsQuery.refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white">
                      Retry
                    </button>
                  </div>
                ) : habits.length === 0 ? (
                  <div className="py-10 text-center text-sm font-medium text-secondary/60">
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
                          className={`flex min-w-0 flex-col gap-4 rounded-2xl border p-4 md:p-5 ${isCheckedToday ? 'border-[#06d6a0]/20 bg-[#06120e]' : 'border-[#111] bg-[#050505]/90'}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div className="min-w-0">
                              <div className={`break-words font-black text-[1rem] ${isCheckedToday ? 'text-[#06d6a0]' : 'text-white'}`}>
                                {habit.name}
                              </div>
                              <div className="text-[0.75rem] uppercase tracking-[2px] text-secondary/40 mt-1">
                                {isCheckedToday ? 'Completed today' : 'Not completed today'}
                              </div>
                            </div>
                            {streak > 0 && (
                              <div className="rounded-full bg-[#1a1a1a] px-3 py-1 text-[0.7rem] font-black uppercase tracking-[2px] text-[#06d6a0]">
                                {streak}d streak
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                              disabled={isCheckedToday || checkInMutation.isPending}
                              className={`min-h-11 min-w-[120px] rounded-xl px-5 py-3 text-[0.8rem] font-black uppercase tracking-widest ${isCheckedToday ? 'cursor-default border border-[#06d6a0]/20 bg-[#06d6a0]/10 text-[#06d6a0]' : 'bg-[#3a86ff] text-white hover:bg-[#2886ff] disabled:cursor-wait disabled:opacity-50'}`}
                              aria-label={isCheckedToday ? `${habit.name} completed today` : `Check in ${habit.name}`}
                            >
                              {isCheckedToday ? 'DONE' : checkInMutation.isPending ? 'SAVING...' : 'CHECK IN'}
                            </button>
                            <button
                              onClick={() => deleteHabitMutation.mutate(habit._id)}
                              disabled={deleteHabitMutation.isPending}
                              className="flex min-h-11 min-w-11 items-center justify-center rounded-lg text-secondary/60 hover:text-[#ef476f] disabled:cursor-wait disabled:opacity-50"
                              aria-label={`Delete ${habit.name}`}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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
          <div className="stack-gap-lg">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Longest Current Streak</span>
              {habitsQuery.isLoading ? (
                <Skeleton height="44px" />
              ) : habitsQuery.isError ? (
                <p className="text-sm text-red-300">Streak data unavailable.</p>
              ) : (
                <>
                  <div className="mb-2 text-[2rem] font-black text-white">{bestStreak} days</div>
                  <div className="text-[0.75rem] text-secondary/60">
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
          <div className="stack-gap-lg">
            <Card className="primary p-4 md:p-6">
              <span className="mb-4 uppercase label-sub">Goal Progress</span>

              <div className="mt-4 mb-8 stack-gap-md">
                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                  <input
                    className="field-input !h-12 !text-[0.95rem] !px-4 !flex-1"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goalDraft.trim() && !createGoalMutation.isPending && createGoalMutation.mutate({ text: goalDraft.trim(), type: goalType })}
                    placeholder="What is your main goal?"
                  />
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as 'goal' | 'affirmation')}
                    className="field-input !h-12 !w-full !px-4 !text-[0.8rem] !font-black uppercase tracking-widest sm:!w-40"
                  >
                    <option value="goal">Goal</option>
                    <option value="affirmation">Affirmation</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => goalDraft.trim() && createGoalMutation.mutate({ text: goalDraft.trim(), type: goalType })}
                    disabled={!goalDraft.trim() || createGoalMutation.isPending}
                    className="!px-10 !py-3 !bg-accent !text-white !font-black !text-[0.8rem] !rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                  >
                    {createGoalMutation.isPending ? 'SAVING...' : 'SAVE GOAL'}
                  </Button>
                </div>
              </div>

              {isGoalsLoading ? (
                <Skeleton height="220px" />
              ) : goalsQuery.isError ? (
                <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
                  <p className="text-sm text-red-300">Your goals couldn't be loaded.</p>
                  <button type="button" onClick={() => goalsQuery.refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white">
                    Retry
                  </button>
                </div>
              ) : goals.length === 0 ? (
                <div className="py-16 text-center text-secondary/40 text-[0.9rem] font-bold italic">
                  No objectives defined.
                </div>
              ) : (
                <div className="stack-gap-sm">
                  {goals.map((goal) => (
                    <div key={goal._id} className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-[#111] bg-[#000] p-4 md:p-5">
                      <div className="flex min-w-0 flex-col gap-1.5">
                        <span className="break-words text-[1.05rem] font-black leading-tight text-white">{goal.text}</span>
                        <div className="flex items-center gap-2">
                           <span className={`w-1.5 h-1.5 rounded-full ${goal.type === 'goal' ? 'bg-[#06d6a0]' : 'bg-[#ffd166]'}`} />
                           <span className="text-[0.6rem] text-secondary font-black uppercase tracking-[2px]">{goal.type}</span>
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
                        className="flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-lg p-2 text-secondary/60 hover:text-[#ef476f] disabled:cursor-wait disabled:opacity-50"
                      >
                         <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="stack-gap-lg">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Active Goals</span>
              <div className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{isGoalsLoading || goalsQuery.isError ? '—' : goalStats.goals}</div>
              <div className="text-[0.65rem] font-black text-[#06d6a0] uppercase tracking-widest mt-2">Working on these</div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Daily Affirmations</span>
              <div className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{isGoalsLoading || goalsQuery.isError ? '—' : goalStats.affirmations}</div>
              <div className="text-[0.65rem] font-black text-[#ffd166] uppercase tracking-widest mt-2">Positive Mindset</div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Total Objectives</span>
              <div className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{isGoalsLoading || goalsQuery.isError ? '—' : goalStats.total}</div>
              <div className="text-[0.65rem] font-black text-accent uppercase tracking-widest mt-2">Total items</div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
