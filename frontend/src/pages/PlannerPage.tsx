import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchTasks, deleteTask, updateTask, fetchHabits } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TaskItem } from '../components/TaskItem';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import type { Task, Habit } from '../lib/types';

const statusOrder = ['Pending', 'In Progress', 'Completed', 'Missed'] as const;

function calcStreak(completedDates: string[]): number {
  if (!completedDates?.length) return 0;
  const sorted = [...completedDates].map(d => d.split('T')[0]).sort().reverse();
  const unique = [...new Set(sorted)];
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const ds of unique) {
    const [y, m, dstr] = ds.split('-');
    const d = new Date(Number(y), Number(m) - 1, Number(dstr));
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((current.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 1) {
      streak++;
      current = d;
    } else {
      break;
    }
  }

  return streak;
}

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<(typeof statusOrder)[number]>('Pending');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<Task['category']>('Personal');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const queryClient = useQueryClient();
  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const { data, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', localDate],
    queryFn: () => fetchTasks(localDate, 30), // Limit to 30 per day
    staleTime: 3 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const habitsQuery = useQuery<Habit[]>({
    queryKey: ['habits'],
    queryFn: () => fetchHabits(20), // Limit to 20
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const filteredTasks = useMemo(() => data?.filter(t => t.status === activeTab) ?? [], [data, activeTab]);
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusOrder.forEach(s => { counts[s] = data?.filter(t => t.status === s).length ?? 0; });
    return counts;
  }, [data]);

  const topPriorities = useMemo(() => data?.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3) ?? [], [data]);
  const today = new Date().toISOString().split('T')[0];

  const addTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'stats'] });
      setDraft('');
      toast.success('Task saved');
    }
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'stats'] });
    }
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['analytics', 'stats'] });
    }
  });

  return (
    <div className="page-stack">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="title-main">My Planner</h1>
        <div className="tab-group flex gap-2 bg-[#000] p-1 rounded-xl border border-border overflow-x-auto">
          {statusOrder.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 md:flex-none whitespace-nowrap px-4 py-1.5 rounded-lg text-[0.8rem] font-bold transition-all ${activeTab === tab ? 'bg-[#1a1a1a] text-white shadow-lg' : 'bg-transparent text-secondary hover:text-white'}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="split-layout">
        {/* Main Column */}
        <div className="stack-gap-lg">

          {/* Add Task Form */}
          <Card className="p-6 primary">
            <div className="stack-gap-md">
              <input
                className="field-input !h-12 !text-[1rem] !font-semibold !px-5"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What do you want to achieve today?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim()) {
                    addTaskMutation.mutate({ title: draft, category, priority, status: 'Pending' });
                  }
                }}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="label-sub !mb-0 ml-1">Category</label>
                  <select
                    className="field-input !h-11 !text-[0.9rem]"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as Task['category'])}
                  >
                    <option value="Work">Work</option>
                    <option value="Study">Study</option>
                    <option value="Health">Health</option>
                    <option value="Personal">Personal</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="label-sub !mb-0 ml-1">Priority</label>
                  <select
                    className="field-input !h-11 !text-[0.9rem]"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task['priority'])}
                  >
                    <option value="High">High Priority</option>
                    <option value="Medium">Medium Priority</option>
                    <option value="Low">Low Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end mt-2">
                <Button
                  onClick={() => {
                    if (draft.trim()) {
                      addTaskMutation.mutate({ title: draft, category, priority, status: 'Pending' });
                    }
                  }}
                  className="!px-8 !py-3 !bg-[#3a86ff] !text-white !font-black !text-[0.85rem] !rounded-xl hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  ADD TASK
                </Button>
              </div>
            </div>
          </Card>

          {/* Task List */}
          <Card className="primary !p-0 overflow-hidden">
            <div className="px-6 py-3 bg-[#050505] border-b border-border flex justify-between items-center">
               <span className="label-sub uppercase !text-[0.6rem] tracking-[2px]">{activeTab} Queue</span>
               <div className="flex gap-2">
                  {statusOrder.map((tab) => (
                    tabCounts[tab] > 0 && (
                      <span key={tab} className={`text-[0.6rem] font-black px-2 py-0.5 rounded-lg uppercase tracking-widest ${activeTab === tab ? 'bg-accent text-white' : 'bg-[#111] text-secondary/30'}`}>
                        {tabCounts[tab]} {tab[0]}
                      </span>
                    )
                  ))}
               </div>
            </div>

            <div className="px-6 task-preview-list">
              {isLoading ? (
                <Skeleton height="200px" />
              ) : filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-[#444] text-[0.9rem] italic">
                  No {activeTab.toLowerCase()} tasks found.
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

        </div>

        {/* Sidebar */}
        <div className="stack-gap-lg">

          {/* Top 3 Priorities */}
          <div className="stack-gap-md">
            <span className="ml-1 uppercase label-sub">Top Priorities</span>
            <div className="flex flex-col gap-3 mt-4">
              {topPriorities.length === 0 ? (
                <div className="p-10 bg-[#000] rounded-2xl border border-dashed border-border/20 text-center text-secondary/20 text-[0.8rem] font-bold italic">
                  Define high-priority targets
                </div>
              ) : topPriorities.map((t, i) => (
                <div key={t._id} className={`flex items-center gap-4 p-4 bg-[#050505] rounded-2xl border transition-all duration-300 ${i === 0 ? 'border-accent/20 shadow-[0_0_20px_rgba(58,134,255,0.03)]' : 'border-border/10'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[0.7rem] font-black border-2 ${i === 0 ? 'bg-accent/10 border-accent/40 text-accent' : i === 1 ? 'bg-[#ffd166]/10 border-[#ffd166]/40 text-[#ffd166]' : 'bg-[#06d6a0]/10 border-[#06d6a0]/40 text-[#06d6a0]'}`}>
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-black text-[0.95rem] text-white truncate leading-none mb-1.5">{t.title}</div>
                    <span className="text-[0.6rem] text-secondary/40 font-black uppercase tracking-[2px]">{t.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Card className="p-5 primary stack-gap-md">
            <span className="label-sub !mb-0">Daily Habits</span>
            <div className="mt-6 stack-gap-md">
              {habitsQuery.isLoading ? (
                <Skeleton height="160px" />
              ) : !habitsQuery.data?.length ? (
                <div className="py-6 text-center text-secondary/20 text-[0.8rem] font-bold italic">No active habits.</div>
              ) : habitsQuery.data.map((habit, i) => {
                const isToday = habit.completedDates?.some(d => d.startsWith(today));
                const streak = calcStreak(habit.completedDates || []);
                return (
                  <div key={habit._id} className={`${i > 0 ? 'pt-5 border-t border-[#0a0a0a]' : ''}`}>
                    <div className="flex items-center justify-between mb-3">
                      <span className={`font-black text-[0.9rem] ${isToday ? 'text-secondary/30' : 'text-white'}`}>{habit.name}</span>
                      {streak > 0 && (
                        <span className="bg-[#06d6a0]/10 text-[#06d6a0] border border-[#06d6a0]/20 text-[0.6rem] font-black px-2 py-1 rounded-lg uppercase tracking-widest">
                          {streak}D STREAK
                        </span>
                      )}
                    </div>
                    <div className="h-1 bg-[#0a0a0a] rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ease-out ${isToday ? 'w-full bg-[#06d6a0]' : 'w-0'}`} />
                    </div>
                    <div className="text-[0.6rem] font-black uppercase tracking-[2px] text-secondary/30 mt-2">
                      {isToday ? 'SUCCESS TODAY' : 'PENDING'}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" className="!w-full !max-w-[600px]">
        {editingTask && (
          <div className="flex flex-col gap-6">
             <div className="flex flex-col gap-2">
                <label className="ml-1 uppercase label-sub">Task Title</label>
                <input
                  className="field-input !h-12 !px-5 !text-[1rem]"
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                  placeholder="Task name..."
                />
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                   <label className="ml-1 uppercase label-sub">Category</label>
                   <select className="field-input !h-12 !px-4 uppercase tracking-widest text-[0.8rem] font-black" value={editingTask.category} onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as Task['category'] })}>
                     <option value="Work">Work</option>
                     <option value="Study">Study</option>
                     <option value="Health">Health</option>
                     <option value="Personal">Personal</option>
                   </select>
                </div>
                <div className="flex flex-col gap-2">
                   <label className="ml-1 uppercase label-sub">Priority</label>
                   <select className="field-input !h-12 !px-4 uppercase tracking-widest text-[0.8rem] font-black" value={editingTask.priority} onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}>
                     <option value="High">High</option>
                     <option value="Medium">Medium</option>
                     <option value="Low">Low</option>
                   </select>
                </div>
             </div>

             <div className="flex justify-end gap-3 mt-4">
                <Button onClick={() => setEditingTask(null)} className="!bg-transparent !border !border-border !text-secondary !px-6 !py-2.5 !text-[0.75rem] !font-black !rounded-xl active:scale-95 transition-all uppercase tracking-widest">Cancel</Button>
                <Button
                  onClick={() => {
                    updateTaskMutation.mutate({
                      id: editingTask._id,
                      updates: { title: editingTask.title, category: editingTask.category, priority: editingTask.priority }
                    });
                    setEditingTask(null);
                  }}
                  className="!bg-accent !text-white !px-8 !py-2.5 !text-[0.75rem] !font-black !rounded-xl active:scale-95 transition-all shadow-xl uppercase tracking-widest"
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
