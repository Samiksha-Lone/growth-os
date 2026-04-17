import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, createHabit, markHabitComplete } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import type { Habit } from '../lib/types';

function calcStreak(completedDates: string[]): number {
  if (!completedDates?.length) return 0;
  const unique = [...new Set(completedDates.map(d => d.split('T')[0]))].sort().reverse();
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const ds of unique) {
    const d = new Date(ds);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((current.getTime() - d.getTime()) / 86400000);
    if (diff <= 1) { streak++; current = d; } else break;
  }
  return streak;
}

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<'Habits' | 'Goals'>('Habits');
  const [draft, setDraft] = useState('');
  const queryClient = useQueryClient();

  const { data: habits = [], isLoading } = useQuery<Habit[]>({
    queryKey: ['habits', 'list'],
    queryFn: fetchHabits
  });

  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', 'list'] });
      setDraft('');
      toast.success('Habit added');
    }
  });

  const checkInMutation = useMutation({
    mutationFn: markHabitComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', 'list'] });
      toast.success('Checked in! 🔥');
    }
  });

  const today = new Date().toISOString().split('T')[0];

  const doneToday = useMemo(() => habits.filter(h => h.completedDates?.some(d => d.startsWith(today))).length, [habits, today]);
  const bestStreak = useMemo(() => habits.reduce((max, h) => Math.max(max, calcStreak(h.completedDates ?? [])), 0), [habits]);

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Habits</h2>
        <div className="tab-group">
          {(['Habits', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Card className="primary" style={{ padding: '20px 24px' }}>
              <h3 className="card-title" style={{ margin: '0 0 16px', fontSize: '0.85rem', color: '#555', textTransform: 'uppercase' }}>
                Daily Practice
              </h3>

              {/* Add habit */}
              <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
                <input
                  className="field-input"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && draft.trim() && createMutation.mutate(draft.trim())}
                  placeholder="Add a new habit..."
                  style={{ height: '42px', fontSize: '0.9rem', padding: '0 16px', flex: 1 }}
                />
                <Button
                  onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
                  style={{ height: '42px', padding: '0 20px', background: '#1d1d1d', border: '1px solid #2a2a2a', color: '#fff', fontSize: '0.85rem', fontWeight: 600, whiteSpace: 'nowrap' }}
                >
                  + Add Habit
                </Button>
              </div>

              {/* Habit list */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {isLoading ? (
                  <Skeleton height="200px" />
                ) : habits.length === 0 ? (
                  <div style={{ padding: '32px 0', textAlign: 'center', color: '#444', fontSize: '0.88rem' }}>
                    No habits yet. Add one above to start tracking.
                  </div>
                ) : habits.map((habit) => {
                  const isCheckedToday = habit.completedDates?.some((d: string) => d.startsWith(today));
                  const streak = calcStreak(habit.completedDates || []);

                  return (
                    <div
                      key={habit._id}
                      style={{
                        border: `1px solid ${isCheckedToday ? 'rgba(6,214,160,0.15)' : '#1a1a1a'}`,
                        background: isCheckedToday ? 'rgba(6,214,160,0.03)' : 'transparent',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.25s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div
                          className={`task-checkbox ${isCheckedToday ? 'checked' : ''}`}
                          style={{ width: '20px', height: '20px', cursor: isCheckedToday ? 'default' : 'pointer', flexShrink: 0 }}
                          onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                        >
                          {isCheckedToday && (
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isCheckedToday ? '#555' : '#fff' }}>
                            {habit.name}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: isCheckedToday ? '#06d6a0' : '#444', marginTop: '2px', fontWeight: 600 }}>
                            {isCheckedToday ? '✓ Done today' : 'Not done yet'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          background: streak > 0 ? 'rgba(6,214,160,0.1)' : '#111',
                          color: streak > 0 ? '#06d6a0' : '#444',
                          border: `1px solid ${streak > 0 ? 'rgba(6,214,160,0.2)' : '#222'}`,
                          padding: '3px 10px', borderRadius: '6px',
                          fontSize: '0.72rem', fontWeight: 700
                        }}>
                          {streak > 0 ? `🔥 ${streak}d` : 'No streak'}
                        </div>
                        <button
                          onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                          disabled={isCheckedToday}
                          title={isCheckedToday ? 'Already checked in today' : 'Mark as done today'}
                          style={{
                            background: isCheckedToday ? 'rgba(6,214,160,0.12)' : '#1a1a1a',
                            color: isCheckedToday ? '#06d6a0' : '#777',
                            border: `1px solid ${isCheckedToday ? 'rgba(6,214,160,0.25)' : '#2a2a2a'}`,
                            borderRadius: '8px',
                            padding: '6px 14px',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            cursor: isCheckedToday ? 'default' : 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {isCheckedToday ? '✔ Done' : 'Check In'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* Right: Daily summary */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Today's Progress</h3>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Done Today</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                {doneToday}<span style={{ fontSize: '0.9rem', color: '#444' }}>/{habits.length}</span>
              </div>
              <div style={{ height: '4px', background: '#111', borderRadius: '2px', marginTop: '12px' }}>
                <div style={{
                  height: '100%',
                  width: habits.length > 0 ? `${Math.round((doneToday / habits.length) * 100)}%` : '0%',
                  background: doneToday === habits.length && habits.length > 0 ? '#06d6a0' : '#3a86ff',
                  borderRadius: '2px',
                  transition: 'width 0.4s ease'
                }} />
              </div>
              <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '6px' }}>
                {habits.length > 0 ? `${Math.round((doneToday / habits.length) * 100)}% complete` : 'No habits yet'}
              </div>
            </Card>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Best Streak</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                {bestStreak}<span style={{ fontSize: '0.9rem', color: '#444' }}> days</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: bestStreak > 0 ? '#06d6a0' : '#444', marginTop: '6px', fontWeight: 600 }}>
                {bestStreak > 0 ? 'Keep it going!' : 'Start checking in daily'}
              </div>
            </Card>

            {habits.length > 0 && (
              <Card className="primary compact-card">
                <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '14px' }}>Quick View</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {habits.map(h => {
                    const done = h.completedDates?.some(d => d.startsWith(today));
                    const streak = calcStreak(h.completedDates ?? []);
                    return (
                      <div key={h._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #111' }}>
                        <span style={{ fontSize: '0.85rem', color: done ? '#555' : '#ccc', fontWeight: 500 }}>{h.name}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {streak > 0 && <span style={{ fontSize: '0.68rem', color: '#06d6a0', fontWeight: 700 }}>🔥{streak}</span>}
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: done ? '#06d6a0' : '#444' }}>{done ? '✓' : '—'}</span>
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
          {/* Left: Habits as long-term goals with consistency */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Long-term Consistency
            </h3>

            {isLoading ? (
              <Skeleton height="200px" />
            ) : habits.length === 0 ? (
              <Card className="primary" style={{ padding: '36px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: '1.8rem', marginBottom: '12px' }}>🎯</div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff', marginBottom: '8px' }}>No habits to track</div>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#555', lineHeight: 1.7 }}>
                  Switch to the Habits tab to add your daily practices.
                </p>
              </Card>
            ) : habits.map(habit => {
              const streak = calcStreak(habit.completedDates ?? []);
              const total = habit.completedDates?.length ?? 0;
              const consistency30 = Math.min(100, Math.round((total / 30) * 100));
              const done = habit.completedDates?.some(d => d.startsWith(today));

              return (
                <Card key={habit._id} className="primary" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#fff', marginBottom: '3px' }}>{habit.name}</div>
                      <div style={{ fontSize: '0.72rem', color: done ? '#06d6a0' : '#444', fontWeight: 600 }}>
                        {done ? '✓ Completed today' : 'Not done yet today'}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: streak > 0 ? '#fff' : '#333', lineHeight: 1 }}>
                        🔥 {streak}
                      </div>
                      <div style={{ fontSize: '0.65rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', marginTop: '2px' }}>day streak</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#555', fontWeight: 600 }}>30-day consistency</span>
                      <span style={{ fontSize: '0.78rem', fontWeight: 700, color: consistency30 >= 70 ? '#06d6a0' : consistency30 >= 40 ? '#ffd166' : '#ef476f' }}>
                        {consistency30}%
                      </span>
                    </div>
                    <div style={{ height: '5px', background: '#111', borderRadius: '3px' }}>
                      <div style={{
                        height: '100%',
                        width: `${consistency30}%`,
                        background: consistency30 >= 70 ? '#06d6a0' : consistency30 >= 40 ? '#ffd166' : '#ef476f',
                        borderRadius: '3px',
                        transition: 'width 0.6s ease'
                      }} />
                    </div>
                  </div>

                  <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '8px' }}>
                    {total} total check-ins · {streak} day current streak
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Right: Goals summary stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Overview</h3>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Total Habits</div>
              {isLoading ? <Skeleton height="48px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>{habits.length}</div>
                  <div style={{ fontSize: '0.75rem', color: '#7d7d7d', marginTop: '4px' }}>being tracked</div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Best Streak</div>
              {isLoading ? <Skeleton height="48px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                    {bestStreak}<span style={{ fontSize: '0.9rem', color: '#444' }}> days</span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: bestStreak > 0 ? '#06d6a0' : '#444', marginTop: '4px', fontWeight: 600 }}>
                    {bestStreak > 0 ? 'current best' : 'Start checking in!'}
                  </div>
                </>
              )}
            </Card>

            <Card className="primary compact-card">
              <div style={{ fontSize: '0.72rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Total Check-ins</div>
              {isLoading ? <Skeleton height="48px" /> : (
                <>
                  <div style={{ fontSize: '2.2rem', fontWeight: 800 }}>
                    {habits.reduce((sum, h) => sum + (h.completedDates?.length ?? 0), 0)}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#7d7d7d', marginTop: '4px' }}>all time</div>
                </>
              )}
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
