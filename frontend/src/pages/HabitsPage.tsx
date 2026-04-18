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

  return (
    <div className="page-stack">
      <div className="flex items-center justify-between">
        <h1 className="title-main">Habits & Routine</h1>
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border">
          {(['Habits', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${activeTab === tab ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-transparent text-secondary hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── HABITS TAB ── */}
      {activeTab === 'Habits' && (
        <div className="split-layout">
          {/* Left: Daily habit list */}
          <div className="stack-gap-lg">
            <Card className="primary p-6">
              <span className="mb-6 uppercase label-sub">Today's Checklist</span>

              {/* Add habit */}
              <div className="flex gap-3 mt-4 mb-8">
                <input
                  className="field-input !h-12 !text-[0.95rem] !px-4 !flex-1"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft.trim() && createMutation.mutate(draft.trim())}
                  placeholder="Add a new daily habit..."
                />
                <Button
                  onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
                  className="!h-12 !px-8 !bg-accent !text-white !text-[0.8rem] !font-black !rounded-xl transition-all shadow-xl hover:scale-105 active:scale-95"
                >
                  ADD HABIT
                </Button>
              </div>

              {/* Habit list */}
              <div className="stack-gap-md">
                {isLoading ? (
                  <Skeleton height="200px" />
                ) : habits.length === 0 ? (
                  <div className="py-16 text-center text-secondary/40 text-[0.9rem] italic font-bold">
                    No active habits. Begin your first streak above.
                  </div>
                ) : (
                  <div className="stack-gap-sm">
                    {habits.map((habit) => {
                      const isCheckedToday = habit.completedDates?.some((d: string) => toLocalDateKey(d) === today);
                      const streak = calcStreak(habit.completedDates || []);

                      return (
                        <div
                          key={habit._id}
                          className={`group flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 ${isCheckedToday ? 'border-[#06d6a0]/20 bg-[#06d6a0]/[0.02]' : 'border-[#111] bg-transparent hover:border-[#222]'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`task-checkbox ${isCheckedToday ? 'checked' : ''} w-5 h-5 transition-all duration-300`}
                              onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                            >
                              {isCheckedToday && (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                            </div>
                            <div>
                              <div className={`font-black text-[1rem] transition-colors duration-300 ${isCheckedToday ? 'text-secondary/30' : 'text-white'}`}>
                                {habit.name}
                              </div>
                              <div className={`text-[0.65rem] font-black uppercase tracking-[2px] mt-0.5 ${isCheckedToday ? 'text-[#06d6a0]' : 'text-secondary/40'}`}>
                                {isCheckedToday ? 'Habit completed' : 'Daily target'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {streak > 0 && (
                              <div className="bg-[#06d6a0]/10 text-[#06d6a0] border border-[#06d6a0]/20 px-2 py-1 rounded text-[0.65rem] font-black uppercase tracking-widest leading-none">
                                🔥 {streak}D STREAK
                              </div>
                            )}
                            <button
                              onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                              disabled={isCheckedToday}
                              className={`px-5 py-2 rounded-xl text-[0.7rem] font-black uppercase tracking-widest transition-all border ${isCheckedToday ? 'bg-[#06d6a0]/10 text-[#06d6a0] border-[#06d6a0]/20' : 'bg-[#0f0f0f] text-secondary border-[#1a1a1a] hover:text-white hover:border-gray-700'}`}
                            >
                              {isCheckedToday ? 'SECURED' : 'CHECK IN'}
                            </button>
                            <button
                              onClick={() => deleteHabitMutation.mutate(habit._id)}
                              className="p-2 text-secondary/20 hover:text-[#ef476f] transition-colors opacity-0 group-hover:opacity-100"
                            >
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
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

          {/* Right: Daily summary */}
          <div className="stack-gap-lg">
            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Daily Progress</span>
              <div className="stack-gap-sm">
                <div className="flex items-baseline gap-2">
                  <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{doneToday}</span>
                  <span className="label-sub uppercase !text-[0.7rem] text-secondary/60">/ {habits.length} Secured</span>
                </div>
                <div className="h-1 bg-[#0a0a0a] rounded-full mt-3 overflow-hidden">
                  <div className={`h-full transition-all duration-700 ${doneToday === habits.length && habits.length > 0 ? 'bg-[#06d6a0]' : 'bg-accent'}`} style={{ width: habits.length > 0 ? `${Math.round((doneToday / habits.length) * 100)}%` : '0%' }} />
                </div>
                <div className="text-[0.65rem] font-black text-secondary/30 uppercase tracking-widest mt-2 text-right">
                  {habits.length > 0 ? `${Math.round((doneToday / habits.length) * 100)}% Success Rate` : 'No habits yet'}
                </div>
              </div>
            </Card>

            <Card className="primary compact-card">
              <span className="mb-4 uppercase label-sub">Best Streak</span>
              <div className="flex items-baseline gap-2">
                <span className="text-[2.8rem] font-black text-white tracking-tighter leading-none">{bestStreak}</span>
                <span className="label-sub uppercase !text-[0.7rem] text-secondary/60">Days Streak</span>
              </div>
              <div className={`text-[0.65rem] font-black uppercase tracking-widest mt-2 ${bestStreak > 0 ? 'text-[#06d6a0]' : 'text-secondary/20'}`}>
                {bestStreak > 0 ? 'STAYING CONSISTENT' : 'STARTING FRESH'}
              </div>
            </Card>

            {habits.length > 0 && (
              <Card className="primary !p-6">
                <span className="mb-5 uppercase label-sub">All Habits</span>
                <div className="stack-gap-xs">
                  {habits.map(h => {
                    const done = h.completedDates?.some(d => toLocalDateKey(d) === today);
                    const streak = calcStreak(h.completedDates ?? []);
                    return (
                      <div key={h._id} className="flex justify-between items-center py-2.5 border-b border-[#0a0a0a] last:border-0">
                        <span className={`text-[0.85rem] font-bold ${done ? 'text-secondary/30' : 'text-[#bbb]'}`}>{h.name}</span>
                        <div className="flex items-center gap-4">
                          {streak > 0 && <span className="text-[0.65rem] text-[#06d6a0] font-black">🔥{streak}</span>}
                          <span className={`text-[1rem] font-black ${done ? 'text-[#06d6a0]' : 'text-[#1a1a1a]'}`}>{done ? '✓' : '—'}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* ── GOALS TAB ── */}
      {activeTab === 'Goals' && (
        <div className="split-layout">
          <div className="stack-gap-lg">
            <Card className="p-6 primary">
              <span className="mb-4 uppercase label-sub">Goal Progress</span>

              <div className="stack-gap-md mb-8 mt-4">
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
