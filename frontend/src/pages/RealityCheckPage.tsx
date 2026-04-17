import { useQuery } from '@tanstack/react-query';
import { fetchRealitySummary, fetchTasks } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { RealitySummary, Task } from '../lib/types';

export default function RealityCheckPage() {
  const { data, isLoading } = useQuery<RealitySummary>({ queryKey: ['reality', 'summary'], queryFn: fetchRealitySummary });
  const tasksQuery = useQuery<Task[]>({ queryKey: ['reality', 'tasks'], queryFn: fetchTasks });

  const missedTasks = tasksQuery.data?.filter(t => t.status === 'Missed') ?? [];

  const completionPct = data?.completionPercentage ?? 0;
  const scoreColor = completionPct >= 80 ? '#06d6a0' : completionPct >= 50 ? '#ffd166' : '#ef476f';

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Reality Check</h2>
        <span style={{ fontSize: '0.8rem', color: '#444', fontWeight: 600 }}>Truth over illusion</span>
      </div>

      {/* Top stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => <Card key={i} className="primary"><Skeleton height="100px" /></Card>)
        ) : (
          <>
            <Card className="primary" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Planned</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff' }}>{data?.plannedTasks ?? 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#444', marginTop: '6px' }}>tasks for today</div>
            </Card>
            <Card className="primary" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', color: '#06d6a0', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Completed</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#06d6a0' }}>{data?.completedTasks ?? 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#444', marginTop: '6px' }}>tasks done</div>
            </Card>
            <Card className="primary" style={{ padding: '20px 24px' }}>
              <div style={{ fontSize: '0.75rem', color: '#ef476f', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>Missed</div>
              <div style={{ fontSize: '2.4rem', fontWeight: 800, color: '#ef476f' }}>{data?.missedTasks ?? 0}</div>
              <div style={{ fontSize: '0.75rem', color: '#444', marginTop: '6px' }}>tasks not done</div>
            </Card>
          </>
        )}
      </div>

      <div className="split-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Completion bar */}
          <Card className="primary" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Completion Rate</h3>
              <span style={{ fontSize: '1.8rem', fontWeight: 800, color: scoreColor }}>{completionPct}%</span>
            </div>
            <div style={{ height: '6px', background: '#111', borderRadius: '3px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${completionPct}%`, background: scoreColor, borderRadius: '3px', transition: 'width 0.6s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.72rem', color: '#444' }}>
              <span>0%</span>
              <span style={{ color: scoreColor, fontWeight: 700 }}>{completionPct >= 80 ? 'On track' : completionPct >= 50 ? 'Moderate' : 'Needs attention'}</span>
              <span>100%</span>
            </div>
          </Card>

          {/* Over-planning warning */}
          {data?.overPlanningIndicator && (
            <Card className="primary" style={{ padding: '20px 24px', border: '1px solid rgba(239,71,111,0.2)', borderLeft: '3px solid #ef476f' }}>
              <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#ef476f', marginBottom: '6px' }}>⚠ Over-Planning Detected</div>
              <p style={{ margin: 0, color: '#7d7d7d', fontSize: '0.85rem', lineHeight: 1.6 }}>
                You planned more tasks than you could complete. Consider setting a maximum of 5–7 tasks per day and marking top priorities clearly.
              </p>
            </Card>
          )}

          {/* Missed tasks list */}
          {missedTasks.length > 0 && (
            <Card className="primary" style={{ padding: '20px 24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '0.85rem', fontWeight: 700, color: '#555', textTransform: 'uppercase' }}>Missed Tasks</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {missedTasks.map(t => (
                  <div key={t._id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px', background: 'rgba(239,71,111,0.04)', border: '1px solid rgba(239,71,111,0.1)', borderRadius: '10px' }}>
                    <span style={{ color: '#ef476f', fontSize: '1rem' }}>✗</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{t.title}</div>
                      <div style={{ fontSize: '0.72rem', color: '#444', marginTop: '1px' }}>{t.category} · {t.priority} priority</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Insights */}
          {data?.insights && data.insights.length > 0 && (
            <div>
              <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: '0 0 14px' }}>Observations</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {data.insights.map((insight, i) => (
                  <Card key={i} className="primary" style={{ padding: '14px 18px' }}>
                    <p style={{ margin: 0, fontSize: '0.88rem', color: '#a0a0a0', lineHeight: 1.6 }}>{insight}</p>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Summary stat */}
          <Card className="primary" style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: '0.75rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', marginBottom: '12px' }}>Summary</div>
            {[
              { label: 'Completion', value: `${completionPct}%`, color: scoreColor },
              { label: 'Planned', value: data?.plannedTasks ?? 0, color: '#fff' },
              { label: 'Completed', value: data?.completedTasks ?? 0, color: '#06d6a0' },
              { label: 'Missed', value: data?.missedTasks ?? 0, color: '#ef476f' },
            ].map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: i < 3 ? '1px solid #111' : 'none' }}>
                <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 600 }}>{row.label}</span>
                <span style={{ fontSize: '0.9rem', fontWeight: 700, color: row.color }}>{row.value}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  );
}
