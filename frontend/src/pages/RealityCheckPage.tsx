import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchRealitySummary, fetchTasks } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { RealitySummary, Task } from '../lib/types';

export default function RealityCheckPage() {
  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  const [selectedDate, setSelectedDate] = useState(localDate);

  const { data, isLoading } = useQuery<RealitySummary>({
    queryKey: ['reality', selectedDate],
    queryFn: () => fetchRealitySummary(selectedDate),
  });
  const tasksQuery = useQuery<Task[]>({
    queryKey: ['tasks', selectedDate],
    queryFn: () => fetchTasks(selectedDate),
  });

  const missedTasks = tasksQuery.data?.filter(t => t.status === 'Missed') ?? [];

  const completionPct = data?.completionPercentage ?? 0;
  const scoreColor = completionPct >= 80 ? '#06d6a0' : completionPct >= 50 ? '#ffd166' : '#ef476f';

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="title-main">Reality Check</h1>
          <span className="label-sub uppercase tracking-[3px] !text-[0.6rem] text-secondary/40">Track daily status by date</span>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-[0.75rem] font-black uppercase tracking-[3px] text-secondary/50">Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="field-input !h-11 !px-3 !text-sm !font-semibold"
          />
        </div>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={i} className="primary h-24"><Skeleton height="100%" /></Card>)
        ) : (
          <>
            <Card className="primary p-5">
              <span className="mb-2 uppercase opacity-60 label-sub !text-[0.65rem]">Total Planned</span>
              <div className="text-[2.2rem] font-black text-white tracking-tighter leading-none">{data?.plannedTasks ?? 0}</div>
              <div className="text-[0.6rem] text-secondary/30 font-black uppercase tracking-widest mt-1">Daily Target</div>
            </Card>
            <Card className="primary p-5">
              <span className="mb-2 uppercase opacity-60 label-sub !text-[0.65rem] !text-[#06d6a0]">Completed</span>
              <div className="text-[2.2rem] font-black text-[#06d6a0] tracking-tighter leading-none">{data?.completedTasks ?? 0}</div>
              <div className="text-[0.6rem] text-[#06d6a0]/30 font-black uppercase tracking-widest mt-1">Success Items</div>
            </Card>
            <Card className="primary p-5">
              <span className="mb-2 uppercase opacity-60 label-sub !text-[0.65rem] !text-[#ef476f]">Missed Tasks</span>
              <div className="text-[2.2rem] font-black text-[#ef476f] tracking-tighter leading-none">{data?.missedTasks ?? 0}</div>
              <div className="text-[0.6rem] text-[#ef476f]/30 font-black uppercase tracking-widest mt-1">To Review</div>
            </Card>
          </>
        )}
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg">

          {/* Completion bar */}
          <Card className="p-6 primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-6">
              <span className="uppercase label-sub">Completion Rate</span>
              <span className="text-[2.2rem] sm:text-[2.4rem] font-black tracking-tighter" style={{ color: scoreColor }}>{completionPct}%</span>
            </div>
            <div className="h-1 bg-[#0a0a0a] rounded-full overflow-hidden">
              <div className="h-full transition-all duration-700 ease-out" style={{ width: `${completionPct}%`, background: scoreColor }} />
            </div>
            <div className="flex justify-between mt-4 text-[0.65rem] font-black uppercase tracking-widest text-secondary/40">
              <span>0%</span>
              <span className="font-black" style={{ color: scoreColor }}>{completionPct >= 80 ? 'Excellent' : completionPct >= 50 ? 'Good' : 'Needs Focus'}</span>
              <span>100%</span>
            </div>
          </Card>

          {/* Over-planning warning */}
          {data?.overPlanningIndicator && (
            <Card className="primary p-5 !border-l-4 !border-l-[#ef476f] bg-[#ef476f]/[0.02]">
              <div className="font-black text-[#ef476f] text-[0.85rem] uppercase tracking-widest mb-2 italic">Planning Advice</div>
              <p className="m-0 text-secondary text-[0.8rem] font-bold leading-relaxed italic opacity-80">
                You've planned more than usual! Try limiting your daily tasks to 5–6 to stay focused and avoid burnout.
              </p>
            </Card>
          )}

          {/* Missed tasks list */}
          {missedTasks.length > 0 && (
            <div className="pt-4 stack-gap-md">
              <span className="ml-1 uppercase label-sub">Missed Tasks</span>
              <div className="stack-gap-sm max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                {missedTasks.map(t => (
                  <div key={t._id} className="group flex items-center gap-3 px-4 py-3 bg-[#ef476f]/[0.03] border border-[#ef476f]/10 rounded-2xl hover:bg-[#ef476f]/[0.05] transition-all">
                    <span className="text-[#ef476f] font-black text-[1.2rem]">×</span>
                    <div className="flex-1">
                      <div className="font-black text-white text-[0.9rem] leading-none mb-1">{t.title}</div>
                      <div className="text-[0.6rem] text-secondary/30 font-black uppercase tracking-widest">{t.category} · {t.priority}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="stack-gap-lg">
          {/* Insights */}
          {data?.insights && data.insights.length > 0 && (
            <div className="stack-gap-md">
              <span className="uppercase label-sub">Insights</span>
              <div className="stack-gap-sm">
                {data.insights.map((insight, i) => (
                  <Card key={i} className="primary p-4 border-l-2 border-accent/20">
                    <p className="m-0 text-[0.85rem] text-secondary font-bold leading-relaxed italic">"{insight}"</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Summary stat */}
          <Card className="primary compact-card">
            <span className="mb-4 uppercase label-sub">Summary for {new Date(selectedDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <div className="stack-gap-xs">
              {[
                { label: 'Completion rate', value: `${completionPct}%`, color: scoreColor },
                { label: 'Total items', value: data?.plannedTasks ?? 0, color: 'text-white' },
                { label: 'Finished', value: data?.completedTasks ?? 0, color: 'text-[#06d6a0]' },
                { label: 'Unfinished', value: data?.missedTasks ?? 0, color: 'text-[#ef476f]' },
              ].map((row, i) => (
                <div key={i} className="flex flex-wrap justify-between items-center py-2 border-b border-[#0a0a0a] last:border-0 gap-2">
                  <span className="text-[0.75rem] text-secondary/40 font-black uppercase tracking-widest">{row.label}</span>
                  <span className={`text-[0.9rem] font-black ${row.color.startsWith('#') ? '' : row.color}`} style={row.color.startsWith('#') ? { color: row.color } : {}}>{row.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
