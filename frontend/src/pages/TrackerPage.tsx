import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchTasks, updateTask, deleteTask, fetchHabits } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';
import { TaskItem } from '../components/TaskItem';
import { Modal } from '../components/ui/Modal';
import type { Task, Habit } from '../lib/types';

const statusOrder = ['Pending', 'In Progress', 'Completed', 'Missed'] as const;
type Status = typeof statusOrder[number];

// Calculate real habit streak from completedDates
function calcStreak(completedDates: string[]): number {
  if (!completedDates?.length) return 0;
  const sorted = [...completedDates].map(d => d.split('T')[0]).sort().reverse();
  const unique = [...new Set(sorted)];
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const dateStr of unique) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) { streak++; current = d; }
    else break;
  }
  return streak;
}

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<Status>('Pending');
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<Task[]>({ queryKey: ['tracker', 'tasks'], queryFn: fetchTasks });
  const habitsQuery = useQuery<Habit[]>({ queryKey: ['tracker', 'habits'], queryFn: fetchHabits });

  const filteredTasks = useMemo(() => data?.filter(t => t.status === activeTab) ?? [], [data, activeTab]);
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusOrder.forEach(s => { counts[s] = data?.filter(t => t.status === s).length ?? 0; });
    return counts;
  }, [data]);

  const topPriorities = useMemo(() => data?.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3) ?? [], [data]);

  const updateMutation = useMutation({
    mutationFn: ({ taskId, updates }: { taskId: string, updates: Partial<Task> }) => updateTask(taskId, updates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracker', 'tasks'] }); toast.success('Task updated'); }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['tracker', 'tasks'] }); toast.success('Task deleted'); }
  });

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="page-stack">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 className="section-title">Tracker</h2>
        <div style={{ display: 'flex', gap: '6px', background: '#161616', padding: '4px', borderRadius: '12px', border: '1px solid #2a2a2a' }}>
          {statusOrder.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '7px 14px', borderRadius: '8px',
                background: activeTab === tab ? '#1d1d1d' : 'transparent',
                color: activeTab === tab ? '#fff' : '#7d7d7d',
                border: 'none', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: '6px'
              }}
            >
              {tab}
              {tabCounts[tab] > 0 && (
                <span style={{
                  background: tab === 'Missed' ? 'rgba(239,71,111,0.2)' : tab === 'Completed' ? 'rgba(6,214,160,0.15)' : '#222',
                  color: tab === 'Missed' ? '#ef476f' : tab === 'Completed' ? '#06d6a0' : '#555',
                  fontSize: '0.68rem', fontWeight: 800, padding: '1px 6px', borderRadius: '10px', minWidth: '18px', textAlign: 'center'
                }}>
                  {tabCounts[tab]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '28px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Task List */}
          <Card className="primary" style={{ padding: '0 24px' }}>
            <div style={{ padding: '20px 0 16px', borderBottom: '1px solid #222' }}>
              <h3 className="card-title" style={{ margin: 0, fontSize: '1rem' }}>
                {activeTab} Tasks
                <span style={{ marginLeft: '8px', fontSize: '0.75rem', color: '#444', fontWeight: 600 }}>
                  ({tabCounts[activeTab]})
                </span>
              </h3>
            </div>
            <div className="task-preview-list">
              {isLoading ? (
                <Skeleton height="200px" />
              ) : filteredTasks.length === 0 ? (
                <div className="task-list-empty">
                  {activeTab === 'Pending' ? 'No pending tasks. Great job!' :
                   activeTab === 'In Progress' ? 'No tasks in progress. Start one from Pending.' :
                   activeTab === 'Completed' ? 'No completed tasks yet today.' :
                   'No missed tasks. Keep it up!'}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    onToggle={() => updateMutation.mutate({ taskId: task._id, updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' }})}
                    onStart={() => updateMutation.mutate({ taskId: task._id, updates: { status: 'In Progress' }})}
                    onEdit={() => setEditingTask(task)}
                    onDelete={() => deleteMutation.mutate(task._id)}
                  />
                ))
              )}
            </div>
          </Card>

          {/* Top 3 Priorities */}
          <Card className="primary" style={{ padding: '20px 24px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 700, color: '#555', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🎯 Top 3 Priorities</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {topPriorities.length === 0 ? (
                <div className="task-list-empty">No high-priority pending tasks.</div>
              ) : topPriorities.map((t, i) => (
                <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 14px', background: '#0a0a0a', borderRadius: '12px', border: `1px solid ${i === 0 ? '#ef476f22' : '#1a1a1a'}` }}>
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                    background: i === 0 ? 'rgba(239,71,111,0.12)' : i === 1 ? 'rgba(255,166,0,0.08)' : 'rgba(58,134,255,0.08)',
                    border: `1.5px solid ${i === 0 ? '#ef476f55' : i === 1 ? '#ffa50055' : '#3a86ff55'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.68rem', fontWeight: 800,
                    color: i === 0 ? '#ef476f' : i === 1 ? '#ffa500' : '#3a86ff',
                  }}>{i + 1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.88rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.title}</div>
                    <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '2px' }}>{t.category}{t.startTime ? ` · ⏰ ${t.startTime}` : ''}</div>
                  </div>
                  <button
                    onClick={() => updateMutation.mutate({ taskId: t._id, updates: { status: 'In Progress' }})}
                    style={{ background: 'transparent', color: '#3a86ff', padding: '4px', cursor: 'pointer', opacity: t.status === 'In Progress' ? 0.3 : 1 }}
                    disabled={t.status === 'In Progress'}
                    title="Start this task"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"/></svg>
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Habits Sidebar — Real Data */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Today's Habits</h3>
          <Card className="primary" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {habitsQuery.isLoading ? (
              <Skeleton height="150px" />
            ) : !habitsQuery.data?.length ? (
              <div className="task-list-empty">No habits tracked yet. Add some in Habits.</div>
            ) : habitsQuery.data.map((habit, i) => {
              const isToday = habit.completedDates?.some(d => d.startsWith(today));
              const streak = calcStreak(habit.completedDates || []);
              return (
                <div key={habit._id} style={{ paddingTop: i > 0 ? '16px' : 0, borderTop: i > 0 ? '1px solid #1a1a1a' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.9rem', color: isToday ? '#555' : '#fff' }}>{habit.name}</span>
                    <span style={{ background: streak > 0 ? 'rgba(6,214,160,0.1)' : '#111', color: streak > 0 ? '#06d6a0' : '#444', border: `1px solid ${streak > 0 ? 'rgba(6,214,160,0.2)' : '#222'}`, fontSize: '0.68rem', fontWeight: 700, padding: '2px 8px', borderRadius: '6px' }}>
                      {streak > 0 ? `🔥 ${streak}d` : 'No streak'}
                    </span>
                  </div>
                  <div style={{ height: '3px', background: '#111', borderRadius: '2px' }}>
                    <div style={{ height: '100%', width: isToday ? '100%' : '0%', background: '#06d6a0', borderRadius: '2px', transition: 'width 0.4s ease' }} />
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '6px' }}>{isToday ? '✓ Done today' : 'Not yet done'}</div>
                </div>
              );
            })}
          </Card>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task">
        {editingTask && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Task Title</label>
              <input className="field-input" value={editingTask.title} onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Category</label>
                <select className="field-input" value={editingTask.category} onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as any })} style={{ appearance: 'none' }}>
                  <option value="Work">💼 Work</option>
                  <option value="Study">📚 Study</option>
                  <option value="Health">🏃 Health</option>
                  <option value="Personal">👤 Personal</option>
                </select>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Priority</label>
                <select className="field-input" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as any })} style={{ appearance: 'none' }}>
                  <option value="High">🔴 High</option>
                  <option value="Medium">🟡 Medium</option>
                  <option value="Low">🟢 Low</option>
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <Button onClick={() => setEditingTask(null)} style={{ background: 'transparent', border: '1px solid #222', color: '#555' }}>Cancel</Button>
              <Button onClick={() => { updateMutation.mutate({ taskId: editingTask._id, updates: { title: editingTask.title, category: editingTask.category, priority: editingTask.priority }}); setEditingTask(null); }} style={{ background: '#3a86ff', color: '#fff' }}>Save Changes</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
