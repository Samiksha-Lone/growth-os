import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchHabits, createHabit, markHabitComplete } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useToast } from '../components/ui/ToastProvider';
import type { Habit } from '../lib/types';

export default function HabitsPage() {
  const [activeTab, setActiveTab] = useState<'Habits' | 'Goals'>('Habits');
  const [draft, setDraft] = useState('');
  const queryClient = useQueryClient();
  const { pushToast } = useToast();

  const { data, isLoading } = useQuery<Habit[]>({ queryKey: ['habits', 'list'], queryFn: fetchHabits });

  const createMutation = useMutation({
    mutationFn: createHabit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', 'list'] });
      setDraft('');
      pushToast('Habit tracked');
    }
  });

  const checkInMutation = useMutation({
    mutationFn: markHabitComplete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits', 'list'] });
      pushToast('Checked in!');
    }
  });

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

      <div className="split-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card className="primary" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1rem', color: '#555' }}>DAILY PRACTICE</h3>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
               <input
                 className="field-input"
                 value={draft}
                 onChange={(e) => setDraft(e.target.value)}
                 placeholder="Search or add habit"
                 style={{ height: '40px', fontSize: '0.9rem', background: '#0a0a0a' }}
               />
               <Button 
                 onClick={() => draft.trim() && createMutation.mutate(draft.trim())}
                 style={{ background: '#1d1d1d', border: '1px solid #2a2a2a', color: '#fff', padding: '0 20px', height: '40px', fontSize: '0.85rem' }}
               >
                 Add Habit
               </Button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {isLoading ? (
                <Skeleton height="200px" />
              ) : data?.map((habit) => {
                const today = new Date().toISOString().split('T')[0];
                const isCheckedToday = habit.completedDates?.some((d: string) => d.startsWith(today));

                return (
                  <div key={habit._id} style={{ border: '1px solid #1a1a1a', background: 'transparent', padding: '12px 16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={`task-checkbox ${isCheckedToday ? 'checked' : ''}`} style={{ width: '18px', height: '18px' }} />
                      <div style={{ fontWeight: 600, fontSize: '0.95rem', color: isCheckedToday ? '#555' : '#fff' }}>{habit.name}</div>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="task-tag" style={{ background: '#06d6a010', color: '#06d6a0', border: '1px solid #06d6a020', padding: '2px 8px', fontSize: '0.7rem', fontWeight: 700 }}>
                         STREAK 7
                      </div>
                      <button 
                        onClick={() => !isCheckedToday && checkInMutation.mutate(habit._id)}
                        disabled={isCheckedToday}
                        style={{ background: '#1a1a1a', color: isCheckedToday ? '#06d6a0' : '#444', border: '1px solid #2a2a2a', borderRadius: '6px', padding: '4px 10px', fontSize: '0.9rem', cursor: 'pointer' }}
                      >
                        ✔
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Right: Goals Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>ACTIVE GOALS</h3>
          <Card className="primary compact-card" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
             <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                   <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Learn DSA deeply</span>
                   <span style={{ color: '#3a86ff', fontWeight: 700, fontSize: '0.85rem' }}>40%</span>
                </div>
                <div style={{ background: '#0a0a0a', height: '4px', borderRadius: '2px' }}>
                   <div style={{ width: '40%', height: '100%', background: '#3a86ff', borderRadius: '2px' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#444', fontWeight: 600 }}>
                   <span>70 pages read</span>
                   <span>30d left</span>
                </div>
             </div>

             <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                   <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>Read 10 books</span>
                   <span style={{ color: '#ef476f', fontWeight: 700, fontSize: '0.85rem' }}>20%</span>
                </div>
                <div style={{ background: '#0a0a0a', height: '4px', borderRadius: '2px' }}>
                   <div style={{ width: '20%', height: '100%', background: '#ef476f', borderRadius: '2px' }}></div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#444', fontWeight: 600 }}>
                   <span>2 books done</span>
                   <span>60d left</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
