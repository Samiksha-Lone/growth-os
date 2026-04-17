import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchDashboardStats, fetchRealitySummary } from '../api/growthos';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { DashboardStats, RealitySummary } from '../lib/types';

export default function InsightsPage() {
  const [activeTab, setActiveTab] = useState<'Insights' | 'Goals'>('Insights');
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({ 
    queryKey: ['insights', 'stats'], 
    queryFn: fetchDashboardStats 
  });
  const { data: reality, isLoading: realityLoading } = useQuery<RealitySummary>({ 
    queryKey: ['insights', 'reality'], 
    queryFn: fetchRealitySummary 
  });

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Insights</h2>
        <div className="tab-group">
          {(['Insights', 'Goals'] as const).map(tab => (
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
        {/* Left: Insight List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { text: 'You tend to miss tasks after 6 PM.', highlight: 'after 6 PM' },
            { text: 'You complete more tasks in the morning.', highlight: 'in the morning' },
            { text: 'Long tasks are harder for you to complete.', highlight: 'harder' },
          ].map((insight, i) => (
            <Card key={i} className="primary" style={{ padding: '16px 20px' }}>
              <p style={{ margin: 0, fontSize: '0.95rem', color: '#fff', fontWeight: 500 }}>
                {insight.text.split(insight.highlight)[0]}
                <span style={{ color: '#3a86ff' }}>{insight.highlight}</span>
                {insight.text.split(insight.highlight)[1]}
              </p>
            </Card>
          ))}

          <Card className="primary" style={{ padding: '16px 20px', border: '1px solid rgba(255, 165, 0, 0.2)', background: 'linear-gradient(to right, rgba(255, 165, 0, 0.05), transparent)' }}>
             <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <div style={{ fontSize: '1.2rem' }}>💡</div>
                <div style={{ flex: 1 }}>
                   <p style={{ margin: 0, fontSize: '1rem', color: '#fff', fontWeight: 600 }}>Try scheduling difficult tasks earlier</p>
                   <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>in the day when your energy levels are higher.</p>
                </div>
             </div>
          </Card>
        </div>

        {/* Right: Consistency & Breakdown */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="RELIABILITY" className="primary compact-card">
             <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', marginBottom: '16px' }}>
                <span style={{ fontSize: '2.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>67%</span>
                <div style={{ flex: 1, height: '4px', background: '#0a0a0a', borderRadius: '2px', position: 'relative', marginBottom: '4px' }}>
                   <div style={{ width: '67%', height: '100%', background: '#06d6a0', borderRadius: '2px' }} />
                </div>
                <span style={{ fontSize: '0.75rem', color: '#333', fontWeight: 700 }}>82% AVG</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.75rem', borderTop: '1px solid #1a1a1a', paddingTop: '12px' }}>
                <span style={{ color: '#555', fontWeight: 600 }}>COMPLETED: 12</span>
                <span style={{ color: '#ef476f', fontWeight: 600 }}>MISSED: 4</span>
             </div>
          </Card>

          <Card className="primary compact-card" style={{ background: 'transparent' }}>
             <h3 className="card-title" style={{ fontSize: '0.85rem', color: '#555', textTransform: 'uppercase', marginBottom: '20px' }}>Reality Breakdown</h3>
             <table style={{ width: '100%', borderCollapse: 'collapse' }}>
               <thead>
                 <tr style={{ textAlign: 'left', borderBottom: '1px solid #1a1a1a' }}>
                   <th style={{ padding: '8px 0', fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase' }}>Cat</th>
                   <th style={{ padding: '8px 0', fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Plan</th>
                   <th style={{ padding: '8px 0', fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Miss</th>
                   <th style={{ padding: '8px 0', fontSize: '0.7rem', color: '#444', fontWeight: 700, textTransform: 'uppercase', textAlign: 'right' }}>Rate</th>
                 </tr>
               </thead>
               <tbody>
                 {[
                   { label: 'Work', planned: 5, missed: 2, total: '72%' },
                   { label: 'Study', planned: 3, missed: 1, total: '68%' },
                   { label: 'Health', planned: 2, missed: 0, total: '100%' },
                 ].map((row, i) => (
                   <tr key={i} style={{ borderBottom: i === 2 ? 'none' : '1px solid #0f0f0f' }}>
                     <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#444', fontWeight: 600 }}>{row.label}</td>
                     <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#fff', fontWeight: 700, textAlign: 'right' }}>{row.planned}</td>
                     <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#ef476f', fontWeight: 700, textAlign: 'right' }}>{row.missed}</td>
                     <td style={{ padding: '12px 0', fontSize: '0.9rem', color: '#fff', fontWeight: 700, textAlign: 'right' }}>{row.total}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </Card>
        </div>
      </div>
    </div>
  );
}
