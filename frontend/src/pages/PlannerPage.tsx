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
  Pending: { heading: 'Pending Tasks', empty: 'No pending tasks found. All caught up!' },
  'In Progress': { heading: 'In Progress Tasks', empty: 'No tasks currently in progress.' },
  Completed: { heading: 'Completed Tasks', empty: 'No completed tasks yet for today.' },
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
      <div className="flex flex-col gap-1">
        <h1 className="title-main">My Planner</h1>
        <p className="title-sub text-zinc-400">Organize daily priorities and keep momentum high.</p>
      </div>

      <div className="split-layout !gap-5 md:!gap-8 xl:grid-cols-[minmax(0,1fr)_minmax(280px,340px)]">
        <div className="min-w-0 flex flex-col gap-5 md:gap-6">
          <Card className="primary p-4 sm:p-6">
            <div className="flex flex-col gap-4 sm:gap-5">
              <input
                className="field-input !h-12 !px-4 sm:!px-5 !text-sm sm:!text-base !bg-[#09090b] border border-white/10 hover:border-white/20 focus:border-accent text-white placeholder:text-zinc-500 rounded-xl"
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

              <div className="grid grid-cols-1 items-end gap-3.5 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Category</label>
                  <select
                    className="field-input !h-11 !text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl cursor-pointer"
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
                  <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Priority</label>
                  <select
                    className="field-input !h-11 !text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl cursor-pointer"
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
                  className="w-full !rounded-xl !bg-accent hover:!bg-accent/90 !px-7 !py-3 !text-xs sm:!text-sm !font-bold !text-white shadow-lg shadow-accent/25 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 lg:col-span-1 lg:w-auto uppercase tracking-wider"
                >
                  {addTaskMutation.isPending ? 'SAVING...' : 'ADD TASK'}
                </Button>
              </div>
            </div>
          </Card>

          <Card className="primary !p-0 overflow-hidden">
            {/* Status Tabs */}
            <div className="grid grid-cols-2 gap-1.5 border-b border-white/10 bg-[#09090b] p-2.5 sm:grid-cols-4 md:p-3">
              {statusOrder.map(tab => (
                <button
                  key={tab}
                  type="button"
                  aria-pressed={activeTab === tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex min-w-0 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition-all ${
                    activeTab === tab
                      ? 'bg-[#1c1c22] text-white shadow-md border border-white/10'
                      : 'text-zinc-400 hover:bg-white/5 hover:text-white border border-transparent'
                  }`}
                >
                  <span className="truncate">{tab}</span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded-full text-[0.7rem] font-bold ${
                    activeTab === tab ? 'bg-accent/20 text-accent' : 'bg-white/5 text-zinc-400'
                  }`}>
                    {tabCounts[tab]}
                  </span>
                </button>
              ))}
            </div>

            <div className="border-b border-white/10 bg-[#070709] px-4 py-3 sm:px-6 flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                {queueContent[activeTab].heading}
              </span>
              <span className="text-xs text-zinc-400 font-semibold">
                {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
              </span>
            </div>

            <div className="task-preview-list min-w-0 px-4 sm:px-6">
              {isLoading ? (
                <div className="py-6"><Skeleton height="160px" /></div>
              ) : isError ? (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <p className="text-sm text-rose-300">Tasks couldn't be loaded.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : filteredTasks.length === 0 ? (
                <div className="py-12 text-center text-sm font-medium text-zinc-400">
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

        {/* Sidebar: Top Priorities */}
        <div className="min-w-0">
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">
              Top Priorities
            </span>
            <div className="flex flex-col gap-3">
              {isLoading ? (
                <Skeleton height="140px" />
              ) : isError ? (
                <div className="rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 text-center">
                  <p className="mb-3 text-sm text-rose-300">Priorities couldn't be loaded.</p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
                  >
                    Retry
                  </button>
                </div>
              ) : topPriorities.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-[#0c0c0e] p-7 text-center text-sm font-medium text-zinc-400">
                  Define high-priority targets to focus on.
                </div>
              ) : topPriorities.map((t, i) => (
                <div
                  key={t._id}
                  className={`flex items-center gap-3.5 p-3.5 sm:p-4 bg-[#0c0c0e] rounded-xl border transition-all duration-200 ${
                    i === 0 ? 'border-accent/40 shadow-sm' : 'border-white/10'
                  }`}
                >
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs font-black shrink-0 border ${
                      i === 0
                        ? 'bg-accent/15 border-accent/50 text-accent'
                        : i === 1
                        ? 'bg-amber-500/15 border-amber-500/50 text-amber-300'
                        : 'bg-emerald-500/15 border-emerald-500/50 text-emerald-300'
                    }`}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm text-white truncate leading-tight mb-1">{t.title}</div>
                    <span className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-wider">{t.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Task Modal */}
      <Modal open={!!editingTask} onClose={() => setEditingTask(null)} title="Edit Task" className="!w-full !max-w-[560px]">
        {editingTask && (
          <div className="flex flex-col gap-5 pt-1">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Task Title</label>
              <input
                className="field-input !h-12 !px-4 !text-sm sm:!text-base !bg-[#09090b] border border-white/10 text-white rounded-xl"
                value={editingTask.title}
                onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                placeholder="Task title..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Category</label>
                <select
                  className="field-input !h-11 !px-3 text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  value={editingTask.category}
                  onChange={(e) => setEditingTask({ ...editingTask, category: e.target.value as Task['category'] })}
                >
                  <option value="Work">Work</option>
                  <option value="Study">Study</option>
                  <option value="Health">Health</option>
                  <option value="Personal">Personal</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Priority</label>
                <select
                  className="field-input !h-11 !px-3 text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl"
                  value={editingTask.priority}
                  onChange={(e) => setEditingTask({ ...editingTask, priority: e.target.value as Task['priority'] })}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button
                variant="secondary"
                onClick={() => setEditingTask(null)}
                className="w-full sm:w-auto !py-3"
              >
                Cancel
              </Button>
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
                className="w-full sm:w-auto !bg-accent hover:!bg-accent/90 !text-white !py-3 !px-7 !font-bold text-sm shadow-md"
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
