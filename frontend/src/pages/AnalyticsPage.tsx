import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRealitySummary } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { DashboardStats, RealitySummary } from '../lib/types';

const trendData = [
  { name: 'S', value: 30 },
  { name: 'M', value: 45 },
  { name: 'T', value: 40 },
  { name: 'W', value: 55 },
  { name: 'T', value: 65 },
  { name: 'F', value: 75 },
  { name: 'S', value: 87 },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState<'Habit Consistency' | 'Goals'>('Habit Consistency');
  const { data, isLoading } = useQuery<DashboardStats>({ 
    queryKey: ['analytics', 'stats'], 
    queryFn: fetchDashboardStats 
  });

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Analytics</h2>
        <div className="tab-group">
          {(['Habit Consistency', 'Goals'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="split-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Habit Consistency Heatmap */}
          <Card className="primary" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
               <h3 className="card-title" style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>HABIT CONSISTENCY</h3>
               <span style={{ fontSize: '0.75rem', color: '#333' }}>Last 70 days</span>
            </div>

            <div className="heatmap-container" style={{ display: 'grid', gridTemplateColumns: '20px repeat(14, 1fr)', gap: '4px' }}>
               <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '0.6rem', color: '#444', paddingRight: '4px' }}>
                  {['M', 'W', 'F', 'S'].map(d => <span key={d} style={{ height: '12px' }}>{d}</span>)}
               </div>
               {Array.from({ length: 70 }).map((_, i) => (
                 <div 
                   key={i} 
                   style={{ 
                     height: '12px', 
                     background: i % 7 === 0 ? '#0f0f0f' : i % 5 === 0 ? '#3a86ff' : i % 3 === 0 ? '#1a1a1a' : '#222', 
                     borderRadius: '3px',
                     border: '1px solid #111'
                   }} 
                 />
               ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.65rem', color: '#444' }}>
               <span>Less active</span>
               <div style={{ display: 'flex', gap: '4px' }}>
                  <div style={{ width: '10px', height: '10px', background: '#0f0f0f', borderRadius: '2px' }} />
                  <div style={{ width: '10px', height: '10px', background: '#222', borderRadius: '2px' }} />
                  <div style={{ width: '10px', height: '10px', background: '#1a1a1a', borderRadius: '2px' }} />
                  <div style={{ width: '10px', height: '10px', background: '#3a86ff', borderRadius: '2px' }} />
               </div>
               <span>More active</span>
            </div>
          </Card>

          {/* Task Completion Rate */}
          <Card className="primary" style={{ padding: '20px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 className="card-title" style={{ margin: 0, fontSize: '0.9rem', color: '#555' }}>COMPLETION RATE</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                   <div style={{ background: '#0a0a0a', padding: '2px 10px', borderRadius: '4px', border: '1px solid #1a1a1a', fontSize: '0.7rem', color: '#555', cursor: 'pointer' }}>WEEK</div>
                   <div style={{ background: '#1a1a1a', padding: '2px 10px', borderRadius: '4px', border: '1px solid #222', fontSize: '0.7rem', color: '#fff', cursor: 'pointer' }}>MONTH</div>
                </div>
             </div>

             <div style={{ height: '220px', width: '100%' }}>
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={trendData}>
                   <defs>
                     <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#3a86ff" stopOpacity={0.2}/>
                       <stop offset="95%" stopColor="#3a86ff" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <CartesianGrid vertical={false} stroke="#111" />
                   <XAxis 
                     dataKey="name" 
                     axisLine={false} 
                     tickLine={false} 
                     tick={{ fill: '#333', fontSize: 11, fontWeight: 700 }}
                     dy={10}
                   />
                   <YAxis hide domain={[0, 100]} />
                   <Tooltip 
                     contentStyle={{ background: '#0f0f0f', border: '1px solid #1a1a1a', borderRadius: '10px' }}
                     itemStyle={{ color: '#fff' }}
                   />
                   <Area 
                     type="monotone" 
                     dataKey="value" 
                     stroke="#3a86ff" 
                     strokeWidth={2} 
                     fillOpacity={1} 
                     fill="url(#colorValue)" 
                   />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          </Card>
        </div>

        {/* Right Sidebar Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
           <Card className="secondary compact-card" style={{ background: 'transparent', border: '1px solid #1a1a1a' }}>
              <div style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Longest Streak</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>14 <span style={{ fontSize: '0.9rem', color: '#333' }}>DAYS</span></div>
              <div style={{ color: '#06d6a0', fontSize: '0.75rem', marginTop: '6px', fontWeight: 600 }}>Active since March 24</div>
           </Card>

           <Card className="secondary compact-card" style={{ background: 'transparent', border: '1px solid #1a1a1a' }}>
              <div style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Overall Completion</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>82.4 <span style={{ fontSize: '0.9rem', color: '#333' }}>%</span></div>
              <div style={{ color: '#7d7d7d', fontSize: '0.75rem', marginTop: '6px' }}>+4.2% from last month</div>
           </Card>

           <Card className="secondary compact-card" style={{ background: 'transparent', border: '1px solid #1a1a1a' }}>
              <div style={{ color: '#555', fontSize: '0.75rem', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Tasks per hour</div>
              <div style={{ fontSize: '2rem', fontWeight: 800 }}>3.2</div>
              <div style={{ color: '#7d7d7d', fontSize: '0.75rem', marginTop: '6px' }}>During peak focus windows</div>
           </Card>
        </div>
      </div>
    </div>
  );
}
