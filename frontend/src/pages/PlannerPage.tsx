import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchTasks, deleteTask, updateTask, fetchReflections } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TaskItem } from '../components/TaskItem';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import type { Task, Reflection } from '../lib/types';

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'In Progress' | 'Completed' | 'Missed'>('Pending');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<Task['category']>('Personal');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [startTime, setStartTime] = useState('');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Task[]>({
    queryKey: ['planner', 'tasks'],
    queryFn: fetchTasks
  });

  const reflectionsQuery = useQuery<Reflection[]>({
    queryKey: ['planner', 'reflections'],
    queryFn: fetchReflections
  });

  const filteredTasks = useMemo(() => {
    return data?.filter(t => t.status === activeTab) ?? [];
  }, [data, activeTab]);

  const top3 = useMemo(() => {
    return data?.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3) ?? [];
  }, [data]);

  const addTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['planner', 'tasks'] });
      setDraft('');
      setStartTime('');
      toast.success('Task saved');
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
        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          {/* Add Task Form */}
          <Card className="primary" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <input
                className="field-input"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What do you want to accomplish today?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) {
                    addTaskMutation.mutate({ title: draft, category, priority, startTime: startTime || undefined, status: 'Pending' });
                  }
                }}
                style={{ height: '44px', fontSize: '0.95rem', fontWeight: 500, padding: '0 18px' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 110px', gap: '12px', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Category</label>
                  <select
                    className="field-input"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Task['category'])}
                    style={{ height: '40px', fontSize: '0.88rem', padding: '0 36px 0 14px' }}
                  >
                    <option value="Work">💼 Work</option>
                    <option value="Study">📚 Study</option>
                    <option value="Health">🏃 Health</option>
                    <option value="Personal">👤 Personal</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</label>
                  <select
                    className="field-input"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task['priority'])}
                    style={{ height: '40px', fontSize: '0.88rem', padding: '0 36px 0 14px' }}
                  >
                    <option value="High">🔴 High</option>
                    <option value="Medium">🟡 Medium</option>
                    <option value="Low">🟢 Low</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '0.7rem', fontWeight: 700, color: '#444', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</label>
                  <input
                    type="time"
                    className="field-input"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    style={{ height: '40px', fontSize: '0.88rem', padding: '0 10px', colorScheme: 'dark' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  onClick={() => {
                    if (draft.trim()) {
                      addTaskMutation.mutate({ title: draft, category, priority, startTime: startTime || undefined, status: 'Pending' });
                    }
                  }}
                  style={{ height: '38px', padding: '0 24px', background: '#3a86ff', color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}
                >
                  + Add Task
                </Button>
              </div>
            </div>
          </Card>

          {/* Task List */}
          <Card className="primary" style={{ padding: '0 20px' }}>
            <div className="task-preview-list">
              {isLoading ? (
                <Skeleton height="200px" />
              ) : filteredTasks.length === 0 ? (
                <div style={{ padding: '40px 0', textAlign: 'center', color: '#444', fontSize: '0.9rem' }}>
                  {activeTab === 'Pending' ? 'No tasks yet — add one above!' : `No ${activeTab.toLowerCase()} tasks.`}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => updateTaskMutation.mutate({ id: task._id, updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' }})}
                    onStart={() => updateTaskMutation.mutate({ id: task._id, updates: { status: 'In Progress' }})}
                    onEdit={() => setEditingTask(task)}
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

        {/* Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

          {/* Top 3 Priorities */}
          <div>
            <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px 0' }}>🎯 Top 3 Priorities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {top3.length === 0 ? (
                <div style={{ padding: '24px', background: '#0a0a0a', borderRadius: '14px', border: '1px dashed #222', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
                  Add high-priority tasks to see them here
                </div>
              ) : top3.map((t, i) => (
                <div key={t._id} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 16px', background: '#0a0a0a', borderRadius: '12px',
                  border: `1px solid ${i === 0 ? '#ef476f22' : '#1a1a1a'}`,
                  transition: 'all 0.2s ease'
                }}>
                  <div style={{
                    width: '26px', height: '26px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'rgba(239,71,111,0.12)' : i === 1 ? 'rgba(255,166,0,0.08)' : 'rgba(58,134,255,0.08)',
                    border: `1.5px solid ${i === 0 ? '#ef476f55' : i === 1 ? '#ffa50055' : '#3a86ff55'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800,
                    color: i === 0 ? '#ef476f' : i === 1 ? '#ffa500' : '#3a86ff',
                  }}>
                    {i + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#e0e0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                      <span style={{ fontSize: '0.72rem', color: '#444' }}>{t.category}</span>
                      {t.startTime && <span style={{ fontSize: '0.72rem', color: '#555' }}>⏰ {t.startTime}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past Reflections */}
          <div>
            <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px 0' }}>Past Reflections</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {reflectionsQuery.isLoading ? (
                <Skeleton height="200px" />
              ) : !reflectionsQuery.data?.length ? (
                <div style={{ padding: '20px', background: '#0a0a0a', borderRadius: '14px', border: '1px dashed #222', textAlign: 'center', color: '#444', fontSize: '0.85rem' }}>
                  No reflections yet
                </div>
              ) : reflectionsQuery.data?.slice(0, 4).map(ref => (
                <Card key={ref._id} className="secondary compact-card" style={{ border: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', alignItems: 'center' }}>
                     <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff' }}>{new Date(ref.date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                     <span style={{ fontSize: '0.72rem', fontWeight: 700, color: ref.productivityScore >= 7 ? '#06d6a0' : ref.productivityScore >= 4 ? '#ffd166' : '#ef476f' }}>{ref.productivityScore}/10</span>
                  </div>
                  <p style={{ color: '#7d7d7d', fontSize: '0.8rem', lineHeight: 1.4, margin: 0 }}>
                    {ref.goodThings[0]?.substring(0, 65)}{(ref.goodThings[0]?.length ?? 0) > 65 ? '...' : ''}
                  </p>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Task Title</label>
                <input
                  className="field-input"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Task name..."
                />
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                   <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Category</label>
                   <select className="field-input" value={editingTask.category} onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as Task['category'] })} style={{ appearance: 'none' }}>
                     <option value="Work">💼 Work</option>
                     <option value="Study">📚 Study</option>
                     <option value="Health">🏃 Health</option>
                     <option value="Personal">👤 Personal</option>
                   </select>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                   <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Priority</label>
                   <select className="field-input" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })} style={{ appearance: 'none' }}>
                     <option value="High">🔴 High</option>
                     <option value="Medium">🟡 Medium</option>
                     <option value="Low">🟢 Low</option>
                   </select>
                </div>
             </div>

             <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Planned Time (optional)</label>
                <input
                  type="time"
                  className="field-input"
                  value={editingTask.startTime || ''}
                  onChange={(e) => setEditingTask({ ...editingTask, startTime: e.target.value })}
                  style={{ colorScheme: 'dark' }}
                />
             </div>

             <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
                <Button onClick={() => setEditingTask(null)} style={{ background: 'transparent', border: '1px solid #222', color: '#555' }}>Cancel</Button>
                <Button
                  onClick={() => {
                    updateTaskMutation.mutate({
                      id: editingTask._id,
                      updates: { title: editingTask.title, category: editingTask.category, priority: editingTask.priority, startTime: editingTask.startTime }
                    });
                    setEditingTask(null);
                  }}
                  style={{ background: '#3a86ff', color: '#fff' }}
                >
                  Save Changes
                </Button>
             </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
