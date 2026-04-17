import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask, fetchHabits } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { TaskItem } from '../components/TaskItem';
import type { Task, Habit } from '../lib/types';

const statusOrder = ['Pending', 'In Progress', 'Completed'] as const;

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'In Progress' | 'Completed'>('Pending');
  const queryClient = useQueryClient();
  const { pushToast } = useToast();
  
  const { data, isLoading } = useQuery<Task[]>({ queryKey: ['tracker', 'tasks'], queryFn: fetchTasks });
  const habitsQuery = useQuery<Habit[]>({ queryKey: ['tracker', 'habits'], queryFn: fetchHabits });

  const filteredTasks = useMemo(() => {
    return data?.filter(t => t.status === activeTab) ?? [];
  }, [data, activeTab]);

  const topPriorities = useMemo(() => {
    return data?.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3) ?? [];
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string, updates: Partial<Task> }) => 
      updateTask(taskId, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tracker', 'tasks'] });
      pushToast('Task updated');
    }
  });

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Tracker</h2>
        <div style={{ display: 'flex', gap: '8px', background: '#161616', padding: '4px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          {statusOrder.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '8px 16px',
                borderRadius: '8px',
                background: activeTab === tab ? '#1d1d1d' : 'transparent',
                color: activeTab === tab ? '#fff' : '#7d7d7d',
                border: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '28px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Today's Tasks */}
          <Card className="primary" style={{ padding: '0 24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '24px 0', borderBottom: '1px solid #222' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1.1rem' }}>Today's Tasks</h3>
              <div style={{ display: 'flex', gap: '12px', color: '#7d7d7d' }}>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                 <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </div>
            </div>
            
            <div className="task-preview-list">
              {isLoading ? (
                <Skeleton height="200px" />
              ) : filteredTasks.length === 0 ? (
                <div className="task-list-empty">No tasks in this category.</div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskItem 
                    key={task._id} 
                    task={task} 
                    onToggle={() => updateMutation.mutate({ taskId: task._id, updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' }})} 
                    onDelete={() => {}}
                  />
                ))
              )}
            </div>
          </Card>

          {/* Top 3 Priorities */}
          <Card title="Top 3 Priorities" className="primary" style={{ padding: '24px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                {topPriorities.length === 0 ? (
                  <div className="task-list-empty">No high priorities set.</div>
                ) : (
                  topPriorities.map(t => (
                    <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
                      <div className="task-checkbox" style={{ width: '18px', height: '18px' }} />
                      <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{t.title}</span>
                    </div>
                  ))
                )}
             </div>
             <div style={{ display: 'flex', gap: '12px' }}>
                <div style={{ flex: 1, position: 'relative' }}>
                   <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#555' }} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                   <input className="field-input" placeholder="Search or add priorities" style={{ paddingLeft: '40px', background: '#0f0f0f' }} />
                </div>
                <Button style={{ background: '#1d1d1d', border: '1px solid #2a2a2a', color: '#fff', fontSize: '0.85rem' }}>+ Add Name</Button>
             </div>
          </Card>
        </div>

        {/* Habits Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <h3 className="section-title" style={{ fontSize: '1rem', color: '#7d7d7d' }}>Habits <span style={{ fontWeight: 400, color: '#444' }}>Heftt</span></h3>
          <Card className="primary" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
             {habitsQuery.isLoading ? (
               <Skeleton height="150px" />
             ) : (
               <>
                 <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                       <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Learn DSA deeply</span>
                       <span style={{ color: '#00bfff', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#00bfff' }} /> 50K/hr</span>
                    </div>
                    <p style={{ color: '#7d7d7d', fontSize: '0.75rem', marginBottom: '12px' }}>70 digits of dhing your deale</p>
                    <div className="progress-container" style={{ background: '#0f0f0f', height: '4px' }}>
                       <div className="progress-fill" style={{ width: '40%', background: '#3a86ff' }}></div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#555' }}>
                       <span>Progre about it</span>
                       <span>Progress 72%</span>
                    </div>
                 </div>

                 <div style={{ borderTop: '1px solid #222', paddingTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                       <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Read 10 books</span>
                       <span style={{ color: '#ffa500', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem' }}><div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffa500' }} /> 602 d-p</span>
                    </div>
                    <p style={{ color: '#7d7d7d', fontSize: '0.75rem', marginBottom: '12px' }}>Doing this a let this sqii may doer</p>
                    <div className="progress-container" style={{ background: '#0f0f0f', height: '4px', position: 'relative' }}>
                       <div className="progress-fill" style={{ width: '30%', background: '#ffa500' }}></div>
                       <div style={{ position: 'absolute', left: '60%', top: 0, bottom: 0, width: '2px', background: '#333' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.7rem', color: '#555' }}>
                       <span>Progress aut-</span>
                       <span>Desek of 20 8</span>
                    </div>
                 </div>
               </>
             )}
          </Card>
        </div>
      </div>
    </div>
  );
}
