import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchTasks } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { Task } from '../lib/types';

export default function HistoryPage() {
  const { data, isLoading } = useQuery<Task[]>({
    queryKey: ['tasks', 'all'],
    queryFn: () => fetchTasks()
  });

  const groupedTasks = useMemo(() => {
    if (!data) return {};
    return data.reduce((acc: Record<string, Task[]>, task) => {
      // Backend returns task.date as ISO string ending in Z, but let's parse local date safely
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
      <div className="flex items-center justify-between">
        <h1 className="title-main">Task History</h1>
      </div>

      <div className="stack-gap-lg">
        {isLoading ? (
          <Skeleton height="300px" />
        ) : sortedDates.length === 0 ? (
          <Card className="p-10 border border-dashed border-border/10 text-center bg-[#000]">
            <div className="text-secondary/30 font-bold italic">No activity logs found.</div>
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
              <div key={dateStr} className="stack-gap-md">
                <span className="ml-1 uppercase label-sub mb-2">{displayDate}</span>
                <Card className="p-0 border border-border/10">
                  <div className="px-6 task-preview-list rounded-xl overflow-hidden bg-[#0a0a0a]/50">
                    {tasksList.map((task) => (
                      <div key={task._id} className="task-preview-item py-4 flex justify-between items-center border-b border-[#1a1a1a] last:border-0 hover:bg-[#111] transition-all duration-300">
                        <div className="flex flex-col">
                          <span className={`text-[0.95rem] font-semibold ${task.status === 'Completed' ? 'text-secondary/50 line-through' : 'text-white'}`}>
                            {task.title}
                          </span>
                          <div className="flex items-center gap-3 mt-1 text-[0.7rem] uppercase font-black tracking-wider text-secondary/40">
                             {task.status !== 'Completed' && task.status !== 'Pending' ? (
                               <span className={task.status === 'Missed' ? 'text-red-500' : 'text-[#3a86ff]'}>{task.status}</span>
                             ) : null}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <span className={`text-[0.65rem] px-2 py-0.5 rounded cursor-default uppercase font-black tracking-wider opacity-60 tag-${task.category?.toLowerCase() || 'personal'}`}>
                            {task.category || 'Personal'}
                          </span>
                          {task.status === 'Completed' && (
                            <span className="text-[#06d6a0] opacity-80">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                              </svg>
                            </span>
                          )}
                          {task.status === 'Pending' && (
                            <span className="text-secondary opacity-30">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <polyline points="12 6 12 12 16 14"></polyline>
                              </svg>
                            </span>
                          )}
                           {task.status === 'Missed' && (
                            <span className="text-red-500 opacity-60">
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
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
