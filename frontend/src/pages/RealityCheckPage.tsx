import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRealitySummary, fetchTasks } from '../api/growthos';
import { taskQueryKey } from '../api/queryKeys';
import { localDateKey } from '../lib/dateUtils';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { RealitySummary, Task } from '../lib/types';

export default function RealityCheckPage() {
  const localDate = useMemo(() => localDateKey(), []);
  const [selectedDate, setSelectedDate] = useState(localDate);

  const { data, isLoading } = useQuery<RealitySummary>({
    queryKey: ['reality', selectedDate],
    queryFn: () => fetchRealitySummary(selectedDate),
  });
  const tasksQuery = useQuery<Task[]>({
    queryKey: taskQueryKey(selectedDate),
    queryFn: () => fetchTasks(selectedDate),
  });

  const missedTasks = tasksQuery.data?.filter(t => t.status === 'Missed') ?? [];

  const completionPct = data?.completionPercentage ?? 0;
  const scoreColor = completionPct >= 80 ? '#06d6a0' : completionPct >= 50 ? '#ffd166' : '#ef476f';

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-main">Reality Check</h1>
          <p className="title-sub text-zinc-400">Evaluate planned vs completed execution by date.</p>
        </div>
        <div className="flex items-center gap-3 self-start sm:self-auto bg-[#09090b] px-3.5 py-2 rounded-xl border border-white/10">
          <label className="text-xs font-bold uppercase tracking-wider text-zinc-300">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-transparent border-none text-white text-sm font-semibold cursor-pointer outline-none"
          />
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={i} className="primary h-24"><Skeleton height="100%" /></Card>)
        ) : (
          <>
            <Card className="primary p-4 sm:p-5">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-1">Total Planned</span>
              <div className="text-2xl sm:text-3xl font-black text-white leading-none">{data?.plannedTasks ?? 0}</div>
              <div className="text-xs text-zinc-400 font-medium mt-1.5">Daily Target</div>
            </Card>
            <Card className="primary p-4 sm:p-5 border-emerald-500/20 bg-emerald-950/10">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">Completed</span>
              <div className="text-2xl sm:text-3xl font-black text-emerald-400 leading-none">{data?.completedTasks ?? 0}</div>
              <div className="text-xs text-emerald-400/80 font-medium mt-1.5">Success Items</div>
            </Card>
            <Card className="primary p-4 sm:p-5 border-rose-500/20 bg-rose-950/10">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-400 block mb-1">Missed Tasks</span>
              <div className="text-2xl sm:text-3xl font-black text-rose-400 leading-none">{data?.missedTasks ?? 0}</div>
              <div className="text-xs text-rose-400/80 font-medium mt-1.5">To Review</div>
            </Card>
          </>
        )}
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg min-w-0">
          {/* Completion bar */}
          <Card className="p-5 sm:p-6 primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">Completion Rate</span>
              <span className="text-2xl sm:text-3xl font-black tracking-tight" style={{ color: scoreColor }}>{completionPct}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <div className="h-full transition-all duration-700 ease-out rounded-full" style={{ width: `${completionPct}%`, background: scoreColor }} />
            </div>
            <div className="flex justify-between mt-3 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              <span>0%</span>
              <span className="font-bold" style={{ color: scoreColor }}>{completionPct >= 80 ? 'Excellent' : completionPct >= 50 ? 'Good' : 'Needs Focus'}</span>
              <span>100%</span>
            </div>
          </Card>

          {/* Over-planning warning */}
          {data?.overPlanningIndicator && (
            <Card className="primary p-4 sm:p-5 !border-l-4 !border-l-rose-500 bg-rose-500/[0.04]">
              <div className="font-bold text-rose-400 text-xs sm:text-sm uppercase tracking-wider mb-1.5">Planning Advice</div>
              <p className="m-0 text-zinc-200 text-xs sm:text-sm leading-relaxed">
                You've planned more tasks than usual! Try limiting your daily tasks to 5–6 to stay focused and avoid burnout.
              </p>
            </Card>
          )}

          {/* Missed tasks list */}
          {missedTasks.length > 0 && (
            <div className="pt-2 stack-gap-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Missed Tasks</span>
              <div className="stack-gap-sm max-h-[300px] overflow-y-auto pr-1">
                {missedTasks.map(t => (
                  <div key={t._id} className="group flex items-center gap-3 px-4 py-3 bg-rose-500/[0.04] border border-rose-500/20 rounded-xl hover:bg-rose-500/[0.08] transition-all">
                    <span className="text-rose-400 font-black text-lg">✕</span>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-sm truncate leading-tight mb-0.5">{t.title}</div>
                      <div className="text-xs text-zinc-400 font-medium">{t.category} · {t.priority} Priority</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="stack-gap-lg min-w-0">
          {/* Insights */}
          {data?.insights && data.insights.length > 0 && (
            <div className="stack-gap-sm">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">Insights</span>
              <div className="stack-gap-sm">
                {data.insights.map((insight, i) => (
                  <Card key={i} className="primary p-4 border-l-2 border-accent/40 bg-[#0c0c0e]">
                    <p className="m-0 text-sm text-zinc-200 leading-relaxed font-medium">"{insight}"</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Summary stat */}
          <Card className="primary compact-card">
            <span className="mb-3 uppercase text-xs font-bold tracking-wider text-zinc-300 block">
              Summary for {new Date(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <div className="divide-y divide-white/5">
              {[
                { label: 'Completion rate', value: `${completionPct}%`, color: scoreColor },
                { label: 'Total items', value: data?.plannedTasks ?? 0, color: 'text-white' },
                { label: 'Finished', value: data?.completedTasks ?? 0, color: 'text-emerald-400' },
                { label: 'Unfinished', value: data?.missedTasks ?? 0, color: 'text-rose-400' },
              ].map((row, i) => (
                <div key={i} className="flex justify-between items-center py-2.5 gap-2">
                  <span className="text-xs text-zinc-400 font-semibold uppercase tracking-wider">{row.label}</span>
                  <span className={`text-sm font-bold ${row.color.startsWith('#') ? '' : row.color}`} style={row.color.startsWith('#') ? { color: row.color } : {}}>
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
