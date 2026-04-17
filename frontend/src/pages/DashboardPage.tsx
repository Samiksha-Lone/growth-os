import { useQuery } from '@tanstack/react-query';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/StatCard';
import { fetchDashboardStats, fetchTasks, fetchRealitySummary } from '../api/growthos';
import { Skeleton } from '../components/ui/Skeleton';
import { BarChart, Bar, XAxis, ResponsiveContainer, Cell } from 'recharts';
import type { DashboardStats, RealitySummary, Task } from '../lib/types';
import { CartesianGrid } from 'recharts';

const weeklyData = [
  { day: 'S', value: 30 },
  { day: 'M', value: 45 },
  { day: 'T', value: 40 },
  { day: 'W', value: 55 },
  { day: 'T', value: 65 },
  { day: 'F', value: 80 },
  { day: 'S', value: 85 },
  { day: 'S', value: 87 },
];

export default function DashboardPage() {
  const statsQuery = useQuery<DashboardStats>({ queryKey: ['dashboard', 'stats'], queryFn: fetchDashboardStats });
  const tasksQuery = useQuery<Task[]>({ queryKey: ['dashboard', 'tasks'], queryFn: fetchTasks });
  const realityQuery = useQuery<RealitySummary>({ queryKey: ['dashboard', 'reality'], queryFn: fetchRealitySummary });

  return (
    <div className="page-stack">
      {/* Greeting Section */}
      <div className="greeting-block">
        <h1 style={{ fontSize: '2.2rem', color: '#fff', fontWeight: 700, letterSpacing: '-0.8px' }}>Good Morning, Samiksha 👋</h1>
        <p style={{ color: '#7d7d7d', fontSize: '1rem', fontWeight: 500 }}>You seem more <strong>productive</strong> in the mornings.</p>
      </div>

      {/* KPI Row */}
      <div className="section-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {statsQuery.isLoading ? (
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="primary"><Skeleton height="120px" /></Card>
          ))
        ) : (
          <>
            <StatCard title="Tasks Completed" value="7 / 10" progress={70} color="linear-gradient(90deg, #ff512f, #f09819)" />
            <StatCard title="Habits Done" value="4 / 5" progress={80} color="#3a86ff" />
            <StatCard title="Focus Time" value="2h 30m" progress={60} color="#06d6a0" />
            <StatCard title="Productivity Score" value="8.2 / 10" progress={82} color="#ef476f" />
          </>
        )}
      </div>

      {/* Content Grid */}
      <div className="split-layout">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div>
            <h2 className="section-title" style={{ fontSize: '1rem', marginBottom: '12px', color: '#7d7d7d' }}>Today's Tasks</h2>
            <Card className="primary" style={{ padding: '0 20px' }}>
              <div className="task-preview-list">
                {[
                  { title: 'Finish report', category: 'Work', status: 'Completed', colorClass: 'tag-work' },
                  { title: 'Go to the gym', category: 'Health', status: 'Pending', colorClass: 'tag-health' },
                  { title: 'Read a book', category: 'Personal', status: 'Pending', colorClass: 'tag-personal' },
                  { title: 'Prepare for meeting', category: 'Work', status: 'Pending', colorClass: 'tag-work' }
                ].map((task, i) => (
                  <div key={i} className="task-preview-item" style={{ borderBottom: i === 3 ? 'none' : '1px solid #1a1a1a', padding: '14px 0', border: 'none', background: 'transparent' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className={`task-checkbox ${task.status === 'Completed' ? 'checked' : ''}`} style={{ width: '18px', height: '18px' }}>
                        {task.status === 'Completed' && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><polyline points="20 6 9 17 4 12"/></svg>}
                      </div>
                      <span style={{ color: task.status === 'Completed' ? '#555' : '#fff', fontWeight: 500, fontSize: '0.95rem' }}>{task.title}</span>
                    </div>
                    <div className={`task-tag ${task.colorClass}`} style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: '4px' }}>{task.category}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <Card title="Reality Check" className="primary compact-card">
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '12px' }}>
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#555', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Planned</span>
                      <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>8</span>
                   </div>
                   <div style={{ width: '1px', background: '#222', margin: '4px 0' }} />
                   <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ color: '#555', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Done</span>
                      <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 700 }}>7</span>
                   </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                   <span style={{ color: '#3a86ff', fontSize: '1.5rem', fontWeight: 800 }}>87%</span>
                   <div style={{ color: '#555', fontSize: '0.7rem' }}>Consistency</div>
                </div>
             </div>
          </Card>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Daily Insight" className="primary compact-card" style={{ borderLeft: '3px solid #3a86ff' }}>
            <p style={{ color: '#a0a0a0', fontSize: '0.9rem', lineHeight: 1.4, margin: 0 }}>
              Morning focus boosts your efficiency. <span style={{ color: '#3a86ff', fontWeight: 600 }}>Tip:</span> Clear deepest work before 11 AM.
            </p>
          </Card>

          <Card className="primary compact-card" style={{ flex: 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
               <h3 className="card-title" style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#555' }}>CONSISTENCY CHART</h3>
               <strong style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 700 }}>87%</strong>
            </div>
            <div style={{ height: '180px', width: '100%' }}>
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 0, right: 0, left: -40, bottom: 0 }}>
                    <CartesianGrid vertical={false} stroke="#1a1a1a" strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="day" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: '#444', fontSize: 12, fontWeight: 600 }} 
                      dy={10}
                    />
                    <Bar dataKey="value" radius={[3, 3, 0, 0]} barSize={24}>
                      {weeklyData.map((_e, i) => (
                        <Cell key={`cell-${i}`} fill={i === weeklyData.length - 1 ? '#3a86ff' : '#222'} />
                      ))}
                    </Bar>
                  </BarChart>
               </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
