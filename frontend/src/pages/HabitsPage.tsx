import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, createHabit, deleteHabit, markHabitComplete, fetchGoals, createGoal, deleteGoal } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Goal, Habit } from '../lib/types';

function toLocalDateKey(value: string): string | null {
  if (!value) return null;

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toLocaleDateString('en-CA');
}

function calcStreak(completedDates: string[]): number {
  if (!completedDates?.length) return 0;

  const uniqueKeys = [...new Set(
    completedDates
      .map(toLocalDateKey)
      .filter((key): key is string => Boolean(key))
  )].sort().reverse();

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const key of uniqueKeys) {
    const [y, m, dstr] = key.split('-');
    const d = new Date(Number(y), Number(m) - 1, Number(dstr));
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((current.getTime() - d.getTime()) / 86400000);

    if (diff === 0 || diff === 1) {
      streak++;
      current = d;
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

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: fetchHabits
  });

  const { data: goals = [], isLoading: isGoalsLoading } = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals
  });

  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      setDraft('');
      toast.success('Habit added');
    }
  });

  const deleteHabitMutation = useMutation({
    mutationFn: deleteHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Habit deleted');
    },
    onError: (error) => {
      console.error('Habit delete failed:', error);
      toast.error('Failed to delete habit. Please try again.');
    }
  });

  const checkInMutation = useMutation({
    mutationFn: markHabitComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      toast.success('Checked in! 🔥');
    },
    onError: (error) => {
      console.error('Check in failed:', error);
      toast.error('Failed to check in. Please try again.');
    }
  });

  const createGoalMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    },
    onError: (error) => {
      console.error('Goal delete failed:', error);
      toast.error('Failed to delete goal. Please try again.');
    }
  });

  const today = new Date().toLocaleDateString('en-CA');

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
    () => habits.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [])), 0),
    [habits]
  );

  const completionRate = habits.length > 0 ? Math.round((doneToday / habits.length) * 100) : 0;

  return (
    <div className="page-stack">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
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
            <Card className="p-6 primary">
              <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
                <div className="rounded-3xl border border-border p-4 bg-[#090909]">
                  <span className="uppercase label-sub text-[0.65rem] text-secondary/50 tracking-[2px]">Completed Today</span>
                  <div className="text-[2rem] font-black text-white mt-2">{doneToday}</div>
                  <div className="text-[0.75rem] text-secondary/40 mt-2">of {habits.length} habits</div>
                </div>
                <div className="rounded-3xl border border-border p-4 bg-[#090909]">
                  <span className="uppercase label-sub text-[0.65rem] text-secondary/50 tracking-[2px]">Completion Rate</span>
                  <div className="text-[2rem] font-black text-white mt-2">{completionRate}%</div>
                  <div className="text-[0.75rem] text-secondary/40 mt-2">Goal progress today</div>
                </div>
                <div className="rounded-3xl border border-border p-4 bg-[#090909]">
                  <span className="uppercase label-sub text-[0.65rem] text-secondary/50 tracking-[2px]">Best Streak</span>
                  <div className="text-[2rem] font-black text-white mt-2">{bestStreak}</div>
                  <div className="text-[0.75rem] text-secondary/40 mt-2">Days in a row</div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <input
                  className="field-input !h-12 !text-[0.95rem] !px-4 !flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft.trim() && createMutation.mutate(draft.trim())}
                  placeholder="Add a new daily habit..."
                />
                <Button
                  onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
                  className="!h-12 !w-full sm:!w-auto !px-8 !bg-accent !text-white !text-[0.8rem] !font-black !rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  ADD HABIT
                </Button>
              </div>
            </Card>

            <Card className="primary !p-0 overflow-hidden">
              <div className="px-6 py-4 bg-[#050505] border-b border-border flex items-center justify-between">
                <span className="label-sub uppercase !text-[0.65rem] tracking-[2px]">Your Habit List</span>
                <span className="text-[0.75rem] text-secondary/40 uppercase tracking-[2px]">{habits.length} items</span>
              </div>
              <div className="p-6 stack-gap-sm">
                {isLoading ? (
                  <Skeleton height="200px" />
                ) : habits.length === 0 ? (
                  <div className="py-16 text-center text-secondary/40 text-[0.9rem] italic font-bold">
                    No active habits yet. Start one above.
                  </div>
                ) : (
                  <div className="stack-gap-sm">
                    {habits.map((habit) => {
                      const isCheckedToday = habit.completedDates?.some((d: string) => toLocalDateKey(d) === today);
                      const streak = calcStreak(habit.completedDates || []);

                      return (
                        <div
                          key={habit._id}
                          className={`group flex flex-col gap-4 p-5 rounded-3xl border transition-all duration-300 ${isCheckedToday ? 'border-[#06d6a0]/20 bg-[#06120e]' : 'border-[#111] bg-[#050505]/90 hover:border-[#222]'}`}
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                              <div className={`font-black text-[1rem] ${isCheckedToday ? 'text-[#06d6a0]' : 'text-white'}`}>
                                {habit.name}
                              </div>
                              <div className="text-[0.75rem] uppercase tracking-[2px] text-secondary/40 mt-1">
                                {isCheckedToday ? 'Completed today' : 'Pending target'}
                              </div>
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                              <div className={`rounded-full px-3 py-1 text-[0.7rem] font-black uppercase tracking-[2px] ${isCheckedToday ? 'bg-[#06d6a0]/10 text-[#06d6a0]' : 'bg-[#111] text-secondary'}`}>
                                {isCheckedToday ? 'SECURED' : 'CHECK IN'}
                              </div>
                              {streak > 0 && (
                                <div className="rounded-full px-3 py-1 bg-[#1a1a1a] text-[0.7rem] font-black uppercase tracking-[2px] text-[#06d6a0]">
                                  🔥 {streak}d streak
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <button
                              onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                              disabled={isCheckedToday}
                              className={`min-w-[120px] px-5 py-3 rounded-2xl text-[0.8rem] font-black uppercase tracking-widest transition-all ${isCheckedToday ? 'bg-[#06d6a0]/10 text-[#06d6a0] border border-[#06d6a0]/20 cursor-default' : 'bg-[#3a86ff] text-white hover:bg-[#2886ff]'}`}
                            >
                              {isCheckedToday ? 'DONE' : 'CHECK IN'}
                            </button>
                            <button
                              onClick={() => deleteHabitMutation.mutate(habit._id)}
                              className="text-secondary/40 hover:text-[#ef476f] transition-colors"
                              aria-label="Delete habit"
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

          {/* Right: habit summary */}
          <div className="stack-gap-lg">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Habit Summary</span>
              <div className="stack-gap-4">
                <div className="flex items-center justify-between">
                  <span className="text-secondary/40 uppercase text-[0.7rem] tracking-[2px]">Total Habits</span>
                  <span className="font-black text-white">{habits.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary/40 uppercase text-[0.7rem] tracking-[2px]">Done Today</span>
                  <span className="font-black text-accent">{doneToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-secondary/40 uppercase text-[0.7rem] tracking-[2px]">Success Rate</span>
                  <span className="font-black text-[#06d6a0]">{completionRate}%</span>
                </div>
              </div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Momentum</span>
              <div className="text-[2.2rem] font-black text-white mb-2">{bestStreak} days</div>
              <div className="h-3 bg-[#0a0a0a] rounded-full overflow-hidden">
                <div className="h-full bg-[#06d6a0] transition-all" style={{ width: `${Math.min(100, bestStreak * 10)}%` }} />
              </div>
              <div className="text-[0.75rem] text-secondary/40 uppercase tracking-[2px] mt-3">
                {bestStreak > 0 ? 'Keep the streak alive' : 'Start building momentum'}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'Goals' && (
        <div className="split-layout">
          <div className="stack-gap-lg">
            <Card className="p-6 primary">
              <span className="mb-4 uppercase label-sub">Goal Progress</span>

              <div className="mt-4 mb-8 stack-gap-md">
                <div className="flex gap-4">
                  <input
                    className="field-input !h-12 !text-[0.95rem] !px-4 !flex-1"
                    value={goalDraft}
                    onChange={(e) => setGoalDraft(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && goalDraft.trim() && createGoalMutation.mutate({ text: goalDraft.trim(), type: goalType })}
                    placeholder="What is your main goal?"
                  />
                  <select
                    value={goalType}
                    onChange={(e) => setGoalType(e.target.value as 'goal' | 'affirmation')}
                    className="field-input !h-12 !w-40 !text-[0.8rem] !font-black !px-4 uppercase tracking-widest"
                  >
                    <option value="goal">Goal</option>
                    <option value="affirmation">Affirmation</option>
                  </select>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={() => goalDraft.trim() && createGoalMutation.mutate({ text: goalDraft.trim(), type: goalType })}
                    disabled={createGoalMutation.status === 'pending'}
                    className="!px-10 !py-3 !bg-accent !text-white !font-black !text-[0.8rem] !rounded-xl transition-all shadow-xl active:scale-95 uppercase tracking-widest"
                  >
                    SAVE GOAL
                  </Button>
                </div>
              </div>

              {isGoalsLoading ? (
                <Skeleton height="220px" />
              ) : goals.length === 0 ? (
                <div className="py-16 text-center text-secondary/40 text-[0.9rem] font-bold italic">
                  No objectives defined.
                </div>
              ) : (
                <div className="stack-gap-sm">
                  {goals.map((goal) => (
                    <div key={goal._id} className="group p-5 bg-[#000] border border-[#111] rounded-2xl flex justify-between items-center transition-all hover:border-[#222]">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-[1.05rem] font-black text-white leading-tight">{goal.text}</span>
                        <div className="flex items-center gap-2">
                           <span className={`w-1.5 h-1.5 rounded-full ${goal.type === 'goal' ? 'bg-[#06d6a0]' : 'bg-[#ffd166]'}`} />
                           <span className="text-[0.6rem] text-secondary font-black uppercase tracking-[2px]">{goal.type}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteGoalMutation.mutate(goal._id)}
                        className="p-2 text-secondary/20 hover:text-[#ef476f] transition-colors opacity-0 group-hover:opacity-100"
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
              <div className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{goalStats.goals}</div>
              <div className="text-[0.65rem] font-black text-[#06d6a0] uppercase tracking-widest mt-2">Working on these</div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Daily Affirmations</span>
              <div className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{goalStats.affirmations}</div>
              <div className="text-[0.65rem] font-black text-[#ffd166] uppercase tracking-widest mt-2">Positive Mindset</div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Total Objectives</span>
              <div className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{goalStats.total}</div>
              <div className="text-[0.65rem] font-black text-accent uppercase tracking-widest mt-2">Total items</div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
