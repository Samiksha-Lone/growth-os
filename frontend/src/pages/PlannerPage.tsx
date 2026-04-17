import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchTasks, deleteTask, updateTask, fetchReflections } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TaskItem } from '../components/TaskItem';
import { useToast } from '../components/ui/ToastProvider';
import { Skeleton } from '../components/ui/Skeleton';
import type { Task, Reflection } from '../lib/types';

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'In Progress' | 'Completed' | 'Missed'>('Pending');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<Task['category']>('Personal');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Task[]>({
    queryKey: ['planner', 'tasks'],
    queryFn: fetchTasks
  });

  const reflectionsQuery = useQuery<Reflection[]>({
    queryKey: ['planner', 'reflections'],
    queryFn: fetchReflections
  });

  const { pushToast } = useToast();

  const filteredTasks = useMemo(() => {
    return data?.filter(t => t.status === activeTab) ?? [];
  }, [data, activeTab]);

  const addTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner', 'tasks'] });
      setDraft('');
      pushToast('Task saved');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planner', 'tasks'] })
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['planner', 'tasks'] })
  });

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Planner</h2>
        <div className="tab-group">
          {(['Pending', 'In Progress', 'Completed', 'Missed'] as const).map(tab => (
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
          {/* Today's Tasks */}
          <Card className="primary" style={{ padding: '0 20px' }}>
            <div style={{ display: 'flex', gap: '12px', padding: '16px 0', borderBottom: '1px solid #1a1a1a' }}>
              <input
                className="field-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add new task..."
                style={{ flex: 1, height: '40px', fontSize: '0.9rem' }}
              />
              <Button 
                onClick={() => draft.trim() && addTaskMutation.mutate({ title: draft, category, priority, status: 'Pending' })}
                style={{ height: '40px', padding: '0 20px' }}
              >
                Add
              </Button>
            </div>

            <div className="task-preview-list">
              {isLoading ? (
                <Skeleton height="200px" />
              ) : filteredTasks.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: '0.9rem' }}>No tasks in this category.</div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskItem 
                    key={task._id} 
                    task={task} 
                    onToggle={() => updateTaskMutation.mutate({ id: task._id, updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' }})} 
                    onDelete={() => deleteTaskMutation.mutate(task._id)}
                  />
                ))
              )}
            </div>
          </Card>

          {activeTab === 'Missed' && (
            <Card title="Accountability" className="primary compact-card" style={{ borderLeft: '3px solid #ef476f' }}>
               <p style={{ color: '#7d7d7d', fontSize: '0.85rem', marginBottom: '12px' }}>What held you back from completing these tasks today?</p>
               <textarea 
                 className="field-textarea"
                 placeholder="Got held up with an urgent issue..."
                 rows={2}
                 style={{ background: '#0a0a0a', fontSize: '0.9rem' }}
               />
               <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                 <Button style={{ background: '#1d1d1d', border: '1px solid #2a2a2a', color: '#fff', fontSize: '0.75rem', padding: '6px 12px' }}>Save Note</Button>
               </div>
            </Card>
          )}
        </div>

        {/* Sidebar: Past Reflections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Past Reflections</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reflectionsQuery.isLoading ? (
              <Skeleton height="300px" />
            ) : reflectionsQuery.data?.slice(0, 4).map(ref => (
              <Card key={ref._id} className="secondary compact-card" style={{ border: '1px solid #1a1a1a' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                   <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{new Date(ref.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                   <span style={{ fontSize: '0.7rem', color: '#444' }}>72% focus</span>
                </div>
                <p style={{ color: '#7d7d7d', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>{ref.goodThings[0]?.substring(0, 70)}...</p>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
