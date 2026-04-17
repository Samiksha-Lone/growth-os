import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReflection, fetchReflections } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useToast } from '../components/ui/ToastProvider';
import { Skeleton } from '../components/ui/Skeleton';
import type { Reflection } from '../lib/types';

export default function ReflectionPage() {
  const [goodThings, setGoodThings] = useState('');
  const [badThings, setBadThings] = useState('');
  const [learnings, setLearnings] = useState('');
  const [mood, setMood] = useState(2); // 1: 😞, 2: 😐, 3: 🙂
  const [productivityScore, setProductivityScore] = useState(8);
  
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Reflection[]>({
    queryKey: ['reflection', 'list'],
    queryFn: fetchReflections
  });
  const { pushToast } = useToast();

  const addMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflection', 'list'] });
      setGoodThings('');
      setBadThings('');
      setLearnings('');
      setMood(2);
      setProductivityScore(8);
      pushToast('Reflection saved');
    }
  });

  return (
    <div className="page-stack">
      <div className="section-header-row">
        <h2 className="section-title" style={{ margin: 0 }}>Daily Mirror</h2>
      </div>

      <div className="split-layout">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card className="primary" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
               <div className="reflection-section">
                 <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#555', textTransform: 'uppercase' }}>What went well?</h3>
                 <textarea
                   className="field-textarea"
                   value={goodThings}
                   onChange={(e) => setGoodThings(e.target.value)}
                   placeholder="Wins and positives..."
                   rows={2}
                   style={{ background: '#0a0a0a', fontSize: '0.9rem' }}
                 />
               </div>

               <div className="reflection-section">
                 <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#555', textTransform: 'uppercase' }}>What went wrong?</h3>
                 <textarea
                   className="field-textarea"
                   value={badThings}
                   onChange={(e) => setBadThings(e.target.value)}
                   placeholder="Obstacles encountered..."
                   rows={2}
                   style={{ background: '#0a0a0a', fontSize: '0.9rem' }}
                 />
               </div>

               <div className="reflection-section">
                 <h3 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: '#555', textTransform: 'uppercase' }}>Learnings</h3>
                 <textarea
                   className="field-textarea"
                   value={learnings}
                   onChange={(e) => setLearnings(e.target.value)}
                   placeholder="Lessons for tomorrow..."
                   rows={2}
                   style={{ background: '#0a0a0a', fontSize: '0.9rem' }}
                 />
               </div>

               <div style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '8px 0', borderTop: '1px solid #1a1a1a', paddingTop: '20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444' }}>MOOD</span>
                     <div className="emoji-selector" style={{ background: '#0a0a0a', padding: '4px', borderRadius: '10px', border: '1px solid #1a1a1a', display: 'flex', gap: '4px' }}>
                       <button className={`emoji-btn ${mood === 1 ? 'active' : ''}`} onClick={() => setMood(1)} style={{ fontSize: '1rem', padding: '6px', background: mood === 1 ? '#1a1a1a' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>😞</button>
                       <button className={`emoji-btn ${mood === 2 ? 'active' : ''}`} onClick={() => setMood(2)} style={{ fontSize: '1rem', padding: '6px', background: mood === 2 ? '#1a1a1a' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>😐</button>
                       <button className={`emoji-btn ${mood === 3 ? 'active' : ''}`} onClick={() => setMood(3)} style={{ fontSize: '1rem', padding: '6px', background: mood === 3 ? '#1a1a1a' : 'transparent', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>🙂</button>
                     </div>
                  </div>

                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#444' }}>PRODUCTIVITY SCORE</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#fff' }}>{productivityScore}/10</span>
                     </div>
                     <div style={{ width: '100%', height: '4px', background: '#0a0a0a', borderRadius: '2px', position: 'relative', marginTop: '4px' }}>
                        <div style={{ width: `${productivityScore * 10}%`, height: '100%', background: '#3a86ff', borderRadius: '2px', transition: 'width 0.3s ease' }} />
                        <input 
                           type="range" min="1" max="10" value={productivityScore} 
                           onChange={(e) => setProductivityScore(parseInt(e.target.value))}
                           style={{ position: 'absolute', top: '-8px', left: 0, width: '100%', opacity: 0, cursor: 'pointer' }} 
                        />
                     </div>
                  </div>
               </div>

               <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
                  <Button 
                    onClick={() => addMutation.mutate({ 
                      goodThings: [goodThings], 
                      badThings: [badThings], 
                      learnings: [learnings], 
                      mood, 
                      productivityScore, 
                      date: new Date().toISOString() 
                    })} 
                    style={{ background: '#3a86ff', color: '#fff', border: 'none', padding: '10px 24px', fontWeight: 700, fontSize: '0.9rem' }}
                  >
                    Save Reflection
                  </Button>
               </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Past Reflections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>Timeline</h3>
          <div className="reflection-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {isLoading ? (
               <Skeleton height="300px" />
            ) : data?.slice(0, 5).map((entry) => (
              <div key={entry._id} className="compact-card" style={{ border: '1px solid #1a1a1a', background: 'transparent', transition: 'all 0.2s ease', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>
                      {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                    <div style={{ color: '#555', fontSize: '0.75rem', fontWeight: 500 }}>
                      {entry.goodThings[0] ? entry.goodThings[0].substring(0, 35) + '...' : 'No notes recorded'}
                    </div>
                  </div>
                  <div style={{ color: '#222' }}>
                     <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
