import { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createTask, fetchAllTasks, deleteTask, updateTask } from '../api/growthos';
import { productivityReportQueryKey, taskQueryKey } from '../api/queryKeys';
import { localDateKey } from '../lib/dateUtils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useConfirm } from '../components/ui/ConfirmProvider';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import type { EisenhowerQuadrant, Task } from '../lib/types';
import type { RefObject } from 'react';

const defaultQuadrant: EisenhowerQuadrant = 'important-not-urgent';
const legacyPriority: Record<EisenhowerQuadrant, Task['priority']> = {
  'urgent-important': 'High',
  'important-not-urgent': 'Medium',
  'urgent-not-important': 'Medium',
  neither: 'Low',
};

const quadrants: Array<{
  id: EisenhowerQuadrant;
  title: string;
  action: string;
  description: string;
  border: string;
  badge: string;
}> = [
  {
    id: 'urgent-important',
    title: 'Urgent & Important',
    action: 'Do First',
    description: 'Time-sensitive work that needs your attention now.',
    border: 'border-rose-500/30',
    badge: 'bg-rose-500/10 text-rose-300',
  },
  {
    id: 'important-not-urgent',
    title: 'Important, Not Urgent',
    action: 'Schedule',
    description: 'Meaningful work to plan before it becomes urgent.',
    border: 'border-accent/30',
    badge: 'bg-accent/10 text-accent',
  },
  {
    id: 'urgent-not-important',
    title: 'Urgent, Not Important',
    action: 'Delegate / Handle Quickly',
    description: 'Interruptions or requests to handle briefly or delegate.',
    border: 'border-amber-500/30',
    badge: 'bg-amber-500/10 text-amber-300',
  },
  {
    id: 'neither',
    title: 'Neither Urgent Nor Important',
    action: 'Reduce / Do Later',
    description: 'Low-value work to defer, reduce, or remove.',
    border: 'border-white/15',
    badge: 'bg-white/5 text-zinc-300',
  },
];

interface TaskDraft {
  title: string;
  description: string;
  category: Task['category'];
  priorityClassification: EisenhowerQuadrant;
  date: string;
  dueDate: string;
}

function emptyDraft(): TaskDraft {
  return {
    title: '',
    description: '',
    category: 'Personal',
    priorityClassification: defaultQuadrant,
    date: localDateKey(),
    dueDate: '',
  };
}

function dateInputValue(value?: string | null): string {
  if (!value) return '';
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return value.slice(0, 10);
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? '' : localDateKey(parsed);
}

function displayDate(value?: string | null): string {
  const key = dateInputValue(value);
  if (!key) return '';
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function getClassification(task: Task): EisenhowerQuadrant {
  return task.priorityClassification ?? defaultQuadrant;
}

function draftFromTask(task: Task): TaskDraft {
  return {
    title: task.title,
    description: task.description ?? '',
    category: task.category ?? 'Personal',
    priorityClassification: getClassification(task),
    date: dateInputValue(task.date) || localDateKey(),
    dueDate: dateInputValue(task.dueDate),
  };
}

function taskUpdates(draft: TaskDraft): Partial<Task> {
  return {
    title: draft.title.trim(),
    description: draft.description.trim(),
    category: draft.category,
    priority: legacyPriority[draft.priorityClassification],
    priorityClassification: draft.priorityClassification,
    date: draft.date,
    dueDate: draft.dueDate || null,
  };
}

function TaskFields({
  value,
  onChange,
  showPlanDate = false,
  titleInputRef,
}: {
  value: TaskDraft;
  onChange: (next: TaskDraft) => void;
  showPlanDate?: boolean;
  titleInputRef?: RefObject<HTMLInputElement>;
}) {
  const fieldClass = 'field-input !h-11 !w-full !px-3 !text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl focus:ring-2 focus:ring-accent';
  const textareaClass = 'field-textarea !w-full !px-3 !py-2.5 !text-sm !bg-[#09090b] border border-white/10 text-white rounded-xl resize-y focus:ring-2 focus:ring-accent';

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2">
      <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Task title <span className="text-rose-300">*</span></span>
        <input
          ref={titleInputRef}
          className={fieldClass}
          value={value.title}
          onChange={event => onChange({ ...value, title: event.target.value })}
          placeholder="What needs to get done?"
          maxLength={200}
          required
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Description <span className="font-normal normal-case text-zinc-500">Optional</span></span>
        <textarea
          className={`${textareaClass} min-h-[76px]`}
          value={value.description}
          onChange={event => onChange({ ...value, description: event.target.value })}
          placeholder="Add context or a useful next step"
          rows={2}
          maxLength={2000}
        />
      </label>

      <label className="flex min-w-0 flex-col gap-1.5 sm:col-span-2">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Priority classification</span>
        <select
          className={fieldClass}
          value={value.priorityClassification}
          onChange={event => onChange({ ...value, priorityClassification: event.target.value as EisenhowerQuadrant })}
        >
          {quadrants.map(quadrant => (
            <option key={quadrant.id} value={quadrant.id}>
              {quadrant.title} — {quadrant.action}
            </option>
          ))}
        </select>
        <span className="text-xs leading-relaxed text-zinc-400">
          {quadrants.find(quadrant => quadrant.id === value.priorityClassification)?.description}
        </span>
      </label>

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Category</span>
        <select
          className={fieldClass}
          value={value.category}
          onChange={event => onChange({ ...value, category: event.target.value as Task['category'] })}
        >
          <option value="Work">Work</option>
          <option value="Study">Study</option>
          <option value="Health">Health</option>
          <option value="Personal">Personal</option>
        </select>
      </label>

      {showPlanDate && (
        <label className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Plan date</span>
          <input
            className={fieldClass}
            type="date"
            value={value.date}
            onChange={event => onChange({ ...value, date: event.target.value })}
            required
          />
        </label>
      )}

      <label className="flex min-w-0 flex-col gap-1.5">
        <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Due date <span className="font-normal normal-case text-zinc-500">Optional</span></span>
        <input
          className={fieldClass}
          type="date"
          value={value.dueDate}
          onChange={event => onChange({ ...value, dueDate: event.target.value })}
        />
      </label>

    </div>
  );
}

export default function PlannerPage() {
  const [selectedDate, setSelectedDate] = useState(() => localDateKey());
  const [newTask, setNewTask] = useState<TaskDraft>(() => emptyDraft());
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editDraft, setEditDraft] = useState<TaskDraft | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const confirm = useConfirm();

  const { data, isLoading, isError, refetch } = useQuery<Task[]>({
    queryKey: taskQueryKey(selectedDate, 100),
    queryFn: () => fetchAllTasks(selectedDate),
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const invalidateTaskViews = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['tasks'] }),
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'stats'] }),
      queryClient.invalidateQueries({ queryKey: ['reality'] }),
      queryClient.invalidateQueries({ queryKey: ['insights'] }),
      queryClient.invalidateQueries({ queryKey: productivityReportQueryKey }),
      queryClient.resetQueries({ queryKey: ['history'] }),
    ]);
  };

  const addTaskMutation = useMutation({
    mutationFn: createTask,
    onSuccess: async () => {
      await invalidateTaskViews();
      setNewTask(emptyDraft());
      toast.success('Task saved');
    },
    onError: () => toast.error("Couldn't save the task. Please try again."),
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Task> }) => updateTask(id, updates),
    onSuccess: invalidateTaskViews,
    onError: () => toast.error("Couldn't update the task. Please try again."),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: invalidateTaskViews,
    onError: () => toast.error("Couldn't delete the task. Please try again."),
  });

  const tasksByQuadrant = useMemo(() => {
    const grouped: Record<EisenhowerQuadrant, Task[]> = {
      'urgent-important': [],
      'important-not-urgent': [],
      'urgent-not-important': [],
      neither: [],
    };
    (data ?? []).forEach(task => grouped[getClassification(task)].push(task));
    return grouped;
  }, [data]);

  const focusTitle = () => {
    titleInputRef.current?.focus();
    titleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const submitNewTask = (event: React.FormEvent) => {
    event.preventDefault();
    if (!newTask.title.trim() || addTaskMutation.isPending) return;
    addTaskMutation.mutate({
      ...taskUpdates({ ...newTask, date: selectedDate }),
      date: selectedDate,
      dueDate: newTask.dueDate || undefined,
      status: 'Pending',
    });
  };

  const openEditor = (task: Task) => {
    setEditingTask(task);
    setEditDraft(draftFromTask(task));
  };

  const submitEdit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingTask || !editDraft?.title.trim() || updateTaskMutation.isPending) return;
    updateTaskMutation.mutate(
      { id: editingTask._id, updates: taskUpdates(editDraft) },
      {
        onSuccess: () => {
          setEditingTask(null);
          setEditDraft(null);
          toast.success('Task updated');
        },
      }
    );
  };

  const toggleComplete = (task: Task) => {
    updateTaskMutation.mutate({
      id: task._id,
      updates: { status: task.status === 'Completed' ? 'Pending' : 'Completed' },
    });
  };

  return (
    <div className="page-stack">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="title-main">My Planner</h1>
          <p className="title-sub text-zinc-400">Choose what matters and plan a focused day.</p>
        </div>
        <label className="flex w-fit items-center gap-3 rounded-xl border border-white/10 bg-[#09090b] px-3.5 py-2">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Planning for</span>
          <input
            aria-label="Planning date"
            type="date"
            value={selectedDate}
            onChange={event => {
              if (event.target.value) setSelectedDate(event.target.value);
            }}
            required
            className="min-w-0 bg-transparent text-sm font-semibold text-white focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      <Card className="primary p-4 sm:p-6">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-base font-bold text-white">Add a task</h2>
            <p className="mt-1 text-sm text-zinc-400">Optional details can be left blank. New tasks are planned for {displayDate(selectedDate)}.</p>
          </div>
        </div>
        <form onSubmit={submitNewTask}>
          <TaskFields
            value={newTask}
            onChange={setNewTask}
            titleInputRef={titleInputRef}
          />
          <div className="mt-4 flex justify-end">
            <Button
              type="submit"
              disabled={!newTask.title.trim() || addTaskMutation.isPending}
              className="w-full !rounded-xl !bg-accent !px-7 !py-3 !text-xs !font-bold !text-white hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:!text-sm"
            >
              {addTaskMutation.isPending ? 'SAVING...' : 'ADD TASK'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Eisenhower Matrix</h2>
          <p className="mt-1 text-sm text-zinc-400">Sort tasks by urgency and importance.</p>
        </div>
        <button
          type="button"
          onClick={focusTitle}
          className="min-h-10 self-start text-xs font-bold uppercase tracking-wider text-accent hover:text-white focus:ring-2 focus:ring-accent sm:self-auto"
        >
          + Add a task
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {quadrants.map(quadrant => <Skeleton key={quadrant.id} height="240px" />)}
        </div>
      ) : isError ? (
        <Card className="primary p-6 text-center">
          <p role="alert" className="text-sm text-rose-300">Tasks couldn't be loaded.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="mt-3 text-xs font-black uppercase tracking-widest text-accent hover:text-white focus:ring-2 focus:ring-accent"
          >
            Retry
          </button>
        </Card>
      ) : (
        <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2">
          {quadrants.map(quadrant => {
            const tasks = tasksByQuadrant[quadrant.id];
            return (
              <Card key={quadrant.id} className={`primary min-w-0 overflow-hidden !p-0 border ${quadrant.border}`}>
                <div className="flex items-start justify-between gap-3 border-b border-white/10 bg-[#09090b] px-4 py-4 sm:px-5">
                  <div className="min-w-0">
                    <h3 className="break-words text-sm font-bold text-white">{quadrant.title}</h3>
                    <span className={`mt-1 inline-flex rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${quadrant.badge}`}>
                      {quadrant.action}
                    </span>
                    <p className="mt-2 text-xs leading-relaxed text-zinc-400">{quadrant.description}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-white/5 px-2 py-1 text-xs font-bold text-zinc-300">
                    {tasks.length}
                  </span>
                </div>

                {tasks.length === 0 ? (
                  <div className="flex min-h-32 flex-col items-center justify-center gap-2 p-5 text-center">
                    <p className="text-sm text-zinc-400">No tasks in this section.</p>
                    <button
                      type="button"
                      onClick={focusTitle}
                      className="text-xs font-bold text-accent hover:text-white focus:ring-2 focus:ring-accent"
                    >
                      Add a task
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {tasks.map(task => {
                      const dueKey = dateInputValue(task.dueDate);
                      const overdue = Boolean(dueKey && dueKey < localDateKey() && task.status !== 'Completed');
                      const statusClass = task.status === 'Completed'
                        ? 'bg-emerald-500/10 text-emerald-300'
                        : task.status === 'Missed'
                        ? 'bg-rose-500/10 text-rose-300'
                        : task.status === 'In Progress'
                        ? 'bg-accent/10 text-accent'
                        : 'bg-white/5 text-zinc-300';
                      return (
                        <li key={task._id} className="min-w-0 p-4 sm:p-5">
                          <div className="flex min-w-0 items-start gap-3">
                            <button
                              type="button"
                              aria-label={task.status === 'Completed' ? `Reopen ${task.title}` : `Complete ${task.title}`}
                              disabled={updateTaskMutation.isPending}
                              onClick={() => toggleComplete(task)}
                              className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors focus:ring-2 focus:ring-accent disabled:opacity-50 ${
                                task.status === 'Completed'
                                  ? 'border-emerald-400 bg-emerald-500 text-white'
                                  : 'border-zinc-500 hover:border-accent'
                              }`}
                            >
                              {task.status === 'Completed' && <span aria-hidden="true" className="text-xs font-black">✓</span>}
                            </button>
                            <div className="min-w-0 flex-1">
                              <h4 className={`break-words text-sm font-bold leading-relaxed ${task.status === 'Completed' ? 'text-zinc-500 line-through' : 'text-white'}`}>
                                {task.title}
                              </h4>
                              {task.description && <p className="mt-1 break-words whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{task.description}</p>}
                              <div className="mt-2 flex min-w-0 flex-wrap items-center gap-2">
                                <span className={`rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider tag-${task.category?.toLowerCase() || 'personal'}`}>
                                  Category · {task.category || 'Personal'}
                                </span>
                                <span className={`rounded-md px-2 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider ${statusClass}`}>
                                  Status · {task.status === 'Pending' ? 'Not started' : task.status}
                                </span>
                                {overdue && (
                                  <span className="rounded-md bg-rose-500/10 px-2 py-0.5 text-[0.65rem] font-bold text-rose-300">Overdue</span>
                                )}
                                {dueKey && (
                                  <span className={`text-xs font-medium ${overdue ? 'text-rose-300' : 'text-zinc-400'}`}>
                                    Due {displayDate(task.dueDate)}
                                  </span>
                                )}
                                {task.estimatedDurationMinutes && (
                                  <span className="text-xs font-medium text-zinc-400">{task.estimatedDurationMinutes} min</span>
                                )}
                              </div>
                              {task.notes && <p className="mt-2 break-words whitespace-pre-wrap text-xs text-zinc-500">{task.notes}</p>}
                              {task.status === 'Pending' && (
                                <button
                                  type="button"
                                  disabled={updateTaskMutation.isPending}
                                  onClick={() => updateTaskMutation.mutate({ id: task._id, updates: { status: 'In Progress' } })}
                                  className="mt-3 min-h-9 rounded-lg border border-white/10 px-3 text-xs font-bold text-zinc-300 hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-accent disabled:opacity-50"
                                >
                                  Start task
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => openEditor(task)}
                              className="min-h-9 rounded-lg border border-white/10 px-3 text-xs font-bold text-zinc-300 hover:bg-white/5 hover:text-white focus:ring-2 focus:ring-accent"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              disabled={deleteTaskMutation.isPending}
                              onClick={() => {
                                void confirm({
                                  title: 'Delete task?',
                                  message: `Delete "${task.title}"? This action cannot be undone.`,
                                  confirmLabel: 'Delete task',
                                  variant: 'danger',
                                }).then(confirmed => {
                                  if (confirmed) deleteTaskMutation.mutate(task._id);
                                });
                              }}
                              className="min-h-9 rounded-lg border border-rose-500/20 px-3 text-xs font-bold text-rose-300 hover:bg-rose-500/10 focus:ring-2 focus:ring-rose-400 disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Modal
        open={!!editingTask && !!editDraft}
        onClose={() => {
          setEditingTask(null);
          setEditDraft(null);
        }}
        title="Edit Task"
        className="!w-full !max-w-[640px]"
      >
        {editDraft && (
          <form onSubmit={submitEdit} className="flex flex-col gap-5">
            <TaskFields value={editDraft} onChange={setEditDraft} showPlanDate />
            <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setEditingTask(null);
                  setEditDraft(null);
                }}
                className="w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!editDraft.title.trim() || updateTaskMutation.isPending}
                className="w-full !bg-accent !px-5 !py-2.5 !text-white hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
              >
                {updateTaskMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
