import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchTasks, deleteTask, updateTask } from '../api/growthos';
import { dashboardStatsQueryKey, taskQueryKey } from '../api/queryKeys';
import { localDateKey } from '../lib/dateUtils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { TaskItem } from '../components/TaskItem';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import type { Task } from '../lib/types';

const statusOrder = ['Pending', 'In Progress', 'Completed', 'Missed'] as const;

const queueContent: Record<(typeof statusOrder)[number], { heading: string; empty: string }> = {
  Pending: { heading: 'Pending Tasks', empty: 'No pending tasks found.' },
  'In Progress': { heading: 'In Progress Tasks', empty: 'No tasks in progress.' },
  Completed: { heading: 'Completed Tasks', empty: 'No completed tasks found.' },
  Missed: { heading: 'Missed Tasks', empty: 'No missed tasks found.' },
};

export default function PlannerPage() {
  const [activeTab, setActiveTab] = useState<(typeof statusOrder)[number]>('Pending');
  const [draft, setDraft] = useState('');
  const [category, setCategory] = useState<Task['category']>('Personal');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const queryClient = useQueryClient();
  const localDate = useMemo(() => localDateKey(), []);

  const { data, isLoading, isError, refetch } = useQuery<Task[]>({
    queryKey: taskQueryKey(localDate, 30),
    queryFn: () => fetchTasks(localDate, 30), // Limit to 30 per day
    staleTime: 0, // Always consider stale - refetch on invalidation
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 min
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const invalidateTaskViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: dashboardStatsQueryKey(localDate) }),
      queryClient.invalidateQueries({ queryKey: ['reality', localDate] }),
    ]);
  };

  const filteredTasks = useMemo(() => data?.filter(t => t.status === activeTab) ?? [], [data, activeTab]);
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    statusOrder.forEach(s => { counts[s] = data?.filter(t => t.status === s).length ?? 0; });
    return counts;
  }, [data]);

  const topPriorities = useMemo(() => data?.filter(t => t.priority === 'High' && t.status !== 'Completed').slice(0, 3) ?? [], [data]);

  const addTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await invalidateTaskViews();
      setDraft('');
      toast.success('Task saved');
    },
    onError: () => toast.error("Couldn't save the task. Please try again."),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string, updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: invalidateTaskViews,
    onError: () => toast.error("Couldn't update the task. Please try again."),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: invalidateTaskViews,
    onError: () => toast.error("Couldn't delete the task. Please try again."),
  });

  return (
    <div className="page-stack">
      <div className="flex min-h-[34px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="title-main">My Planner</h1>
      </div>

      <div className="split-layout !gap-5 md:!gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(260px,320px)]">
        <div className="min-w-0 flex flex-col gap-5 md:gap-6">
          <Card className="primary p-4 md:p-6">
            <div className="flex flex-col gap-4 md:gap-5">
              <input
                className="field-input !h-12 !px-4 !text-[1rem] !font-semibold md:!px-5"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="What do you want to achieve today?"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && draft.trim() && !addTaskMutation.isPending) {
                    e.preventDefault();
                    addTaskMutation.mutate({ title: draft, category, priority, status: 'Pending' });
                  }
                }}
              />

              <div className="grid grid-cols-1 items-end gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
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

                <Button
                  type="button"
                  disabled={!draft.trim() || addTaskMutation.isPending}
                  onClick={() => {
                    if (draft.trim() && !addTaskMutation.isPending) {
                      addTaskMutation.mutate({ title: draft, category, priority, status: 'Pending' });
                    }
                  }}
                  className="w-full !rounded-xl !bg-[#3a86ff] !px-6 !py-3 !text-[0.8rem] !font-black !text-white shadow-xl transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1 lg:w-auto"
                >
                  {addTaskMutation.isPending ? 'SAVING...' : 'ADD TASK'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="primary !p-0 overflow-hidden">
            <div className="grid grid-cols-2 gap-1 border-b border-border bg-[#050505] p-3 sm:grid-cols-4 md:p-4">
              {statusOrder.map(tab => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-bold transition-colors sm:px-3 sm:text-[0.8rem] ${activeTab === tab ? 'bg-[#1a1a1a] text-white' : 'text-secondary hover:bg-[#111] hover:text-white'}`}
                >
                  <span className="truncate">{tab}</span>
                  <span className={`shrink-0 text-[0.65rem] ${activeTab === tab ? 'text-accent' : 'text-secondary/50'}`}>
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-b border-border bg-[#050505] px-4 py-3 md:px-6">
              <span className="label-sub !mb-0 uppercase !text-[0.65rem] tracking-[1.5px]">
                {queueContent[activeTab].heading}
              </span>
            </div>

            <div className="task-preview-list min-w-0 px-4 md:px-6">
              {isLoading ? (
                <div className="py-4"><Skeleton height="160px" /></div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-red-300">Tasks couldn't be loaded.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-10 text-center text-sm italic text-secondary/40">
                  {queueContent[activeTab].empty}
                </div>
              ) : (
                filteredTasks.map((task) => (
                  <TaskItem
                    key={task._id}
                    task={task}
                    compactOnMobile
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

        <div className="min-w-0">
          <div className="flex flex-col gap-3">
            <span className="label-sub ml-1 uppercase">Top Priorities</span>
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <Skeleton height="140px" />
              ) : isError ? (
                <div className="rounded-2xl border border-border/20 bg-[#000] p-6 text-center">
                  <p className="mb-3 text-sm text-red-300">Priorities couldn't be loaded.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : topPriorities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border/20 bg-[#000] p-6 text-center text-sm font-bold italic text-secondary/40">
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
                    }, {
                      onSuccess: () => setEditingTask(null),
                    });
                  }}
                  disabled={updateTaskMutation.isPending}
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
