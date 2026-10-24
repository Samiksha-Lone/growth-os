import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '../api/growthos';
import { taskQueryKey } from '../api/queryKeys';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { Task } from '../lib/types';

export default function HistoryPage() {
  const { data, isLoading } = useQuery<Task[]>({
    queryKey: taskQueryKey(),
    queryFn: () => fetchTasks()
  });

  const groupedTasks = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc: Record<string, Task[]>, task) => {
      const taskDate = task.date.split('T')[0]; 
      if (!acc[taskDate]) acc[taskDate] = [];
      acc[taskDate].push(task);
      return acc;
    }, {});
  }, [data]);

  const sortedDates = useMemo(() => {
    return Object.keys(groupedTasks).sort((a, b) => b.localeCompare(a));
  }, [groupedTasks]);

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">Task History</h1>
        <p className="title-sub text-zinc-400">Review your past task completions and performance logs.</p>
      </div>

      <div className="stack-gap-lg">
        {isLoading ? (
          <Skeleton height="300px" />
        ) : sortedDates.length === 0 ? (
          <Card className="p-8 sm:p-12 border border-dashed border-white/10 text-center bg-[#0c0c0e]">
            <div className="text-zinc-400 font-medium text-sm">No activity logs recorded yet.</div>
          </Card>
        ) : (
          sortedDates.map((dateStr) => {
            const displayDate = new Date(dateStr).toLocaleDateString(undefined, {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const tasksList = groupedTasks[dateStr];

            return (
              <div key={dateStr} className="stack-gap-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">{displayDate}</span>
                <Card className="p-0 border border-white/10 bg-[#0c0c0e]">
                  <div className="px-4 sm:px-6 task-preview-list rounded-xl overflow-hidden">
                    {tasksList.map((task) => (
                      <div key={task._id} className="task-preview-item py-3.5 sm:py-4 flex justify-between items-center border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-all duration-200 gap-3">
                        <div className="flex flex-col min-w-0">
                          <span className={`text-sm sm:text-base font-semibold truncate ${task.status === 'Completed' ? 'text-zinc-500 line-through' : 'text-white'}`}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-xs uppercase font-bold tracking-wider text-zinc-400">
                             {task.status !== 'Completed' && task.status !== 'Pending' ? (
                               <span className={task.status === 'Missed' ? 'text-rose-400' : 'text-accent'}>{task.status}</span>
                             ) : null}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                          <span className={`text-[0.65rem] px-2 py-0.5 rounded-md cursor-default uppercase font-bold tracking-wider tag-${task.category?.toLowerCase() || 'personal'}`}>
                            {task.category || 'Personal'}
                          </span>
                          {task.status === 'Completed' && (
                            <span className="text-emerald-400">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </span>
                          )}
                          {task.status === 'Pending' && (
                            <span className="text-zinc-500">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </span>
                          )}
                           {task.status === 'Missed' && (
                            <span className="text-rose-400">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                              </svg>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
