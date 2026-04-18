import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReflection, fetchReflections } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { FiFrown, FiMeh, FiSmile } from 'react-icons/fi';
import type { Reflection } from '../lib/types';

export default function ReflectionPage() {
  const [goodThings, setGoodThings] = useState('');
  const [badThings, setBadThings] = useState('');
  const [learnings, setLearnings] = useState('');
  const [mood, setMood] = useState(2); // 1: 😞, 2: 😐, 3: 🙂
  const [productivityScore, setProductivityScore] = useState(8);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);

  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery<Reflection[]>({
    queryKey: ['reflections'],
    queryFn: fetchReflections
  });

  const addMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reflections'] });
      setGoodThings('');
      setBadThings('');
      setLearnings('');
      setMood(2);
      setProductivityScore(8);
      toast.success('Reflection saved');
    }
  });

  return (
    <div className="page-stack">
      <div className="flex items-center justify-between">
        <h1 className="title-main">Daily Reflection</h1>
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg">
          <Card className="p-5 primary">
            <div className="flex flex-col gap-3">
              <div>
                <span className="mb-2 uppercase label-sub">What went well?</span>
                <textarea
                  className="field-textarea !bg-[#050505] !text-[0.9rem] !p-4 !h-20 !min-h-0"
                  value={goodThings}
                  onChange={(e) => setGoodThings(e.target.value)}
                  placeholder="Write down your wins for today..."
                />
              </div>

              <div>
                <span className="mb-2 uppercase label-sub">Today's Challenges</span>
                <textarea
                  className="field-textarea !bg-[#050505] !text-[0.9rem] !p-4 !h-20 !min-h-0"
                  value={badThings}
                  onChange={(e) => setBadThings(e.target.value)}
                  placeholder="What was difficult or disrupted your flow?"
                />
              </div>

              <div>
                <span className="mb-2 uppercase label-sub">Lessons Learned</span>
                <textarea
                  className="field-textarea !bg-[#050505] !text-[0.9rem] !p-4 !h-20 !min-h-0"
                  value={learnings}
                  onChange={(e) => setLearnings(e.target.value)}
                  placeholder="Lessons to integrate into next session..."
                />
              </div>

              <div className="flex items-center gap-8 py-4 mt-1 border-t border-border/10">
                <div className="flex flex-col gap-2">
                  <span className="label-sub uppercase !mb-0 opacity-40">Feeling?</span>
                  <div className="flex gap-1.5 bg-[#000] p-1 rounded-xl border border-border/20">
                    <button className={`p-2 rounded-lg text-lg transition-all flex items-center justify-center ${mood === 1 ? 'bg-[#1a1a1a] shadow-lg grayscale-0 text-white' : 'bg-transparent grayscale opacity-20 hover:opacity-100 text-white'}`} onClick={() => setMood(1)}><FiFrown /></button>
                    <button className={`p-2 rounded-lg text-lg transition-all flex items-center justify-center ${mood === 2 ? 'bg-[#1a1a1a] shadow-lg grayscale-0 text-white' : 'bg-transparent grayscale opacity-20 hover:opacity-100 text-white'}`} onClick={() => setMood(2)}><FiMeh /></button>
                    <button className={`p-2 rounded-lg text-lg transition-all flex items-center justify-center ${mood === 3 ? 'bg-[#1a1a1a] shadow-lg grayscale-0 text-white' : 'bg-transparent grayscale opacity-20 hover:opacity-100 text-white'}`} onClick={() => setMood(3)}><FiSmile /></button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="label-sub uppercase !mb-0 opacity-40">Productivity Yield</span>
                    <span className="text-[1.1rem] font-black text-white">{productivityScore} <span className="text-secondary/20 text-[0.75rem] uppercase ml-1">/ 10</span></span>
                  </div>
                  <div className="w-full h-1 bg-[#0a0a0a] rounded-full relative group">
                    <div className="h-full transition-all duration-300 rounded-full bg-accent" style={{ width: `${productivityScore * 10}%`, filter: 'drop-shadow(0 0 5px rgba(58,134,255,0.4))' }} />
                    <input
                      type="range" min="1" max="10" value={productivityScore}
                      onChange={(e) => setProductivityScore(parseInt(e.target.value))}
                      className="absolute top-1/2 left-0 w-full opacity-0 cursor-pointer -translate-y-1/2 !h-8"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => addMutation.mutate({
                    goodThings: [goodThings],
                    badThings: [badThings],
                    learnings: [learnings],
                    mood,
                    productivityScore,
                    date: new Date().toISOString()
                  })}
                  className="!px-10 !py-3 !bg-accent !text-white !font-black !text-[0.8rem] !rounded-xl active:scale-95 transition-all shadow-xl uppercase tracking-widest"
                >
                  SAVE REFLECTION
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Your History */}
        <div className="stack-gap-lg">
          <span className="ml-1 uppercase label-sub">Your History</span>
          <div className="stack-gap-md">
            {isLoading ? (
              <Skeleton height="300px" />
            ) : data?.length === 0 ? (
              <div className="p-10 bg-[#000] rounded-2xl border border-dashed border-border/10 text-center text-secondary/20 text-[0.85rem] font-bold italic">
                Logs will appear here.
              </div>
            ) : data?.slice(0, 5).map((entry) => (
              <div
                key={entry._id}
                className="group p-5 bg-[#000] border border-border/10 rounded-2xl flex justify-between items-center cursor-pointer transition-all hover:border-border/30"
                onClick={() => setSelectedReflection(entry)}
              >
                <div className="flex flex-col gap-1.5">
                  <div className="font-black text-[0.95rem] text-white uppercase tracking-tight">
                    {new Date(entry.date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="text-secondary/40 text-[0.75rem] font-bold italic truncate w-[160px]">
                    {entry.goodThings[0] || 'Metadata logged.'}
                  </div>
                </div>
                <div className="transition-colors text-secondary/20 group-hover:text-white">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={!!selectedReflection}
        onClose={() => setSelectedReflection(null)}
        title={selectedReflection ? new Date(selectedReflection.date).toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
      >
        {selectedReflection && (
          <div className="pb-6 stack-gap-lg">
            <div className="flex items-center justify-between p-6 bg-[#000] rounded-3xl border border-border/10">
              <div className="flex items-center gap-5">
                <div className="text-2xl bg-[#0a0a0a] p-4 rounded-2xl border border-border/10 shadow-inner text-white flex items-center justify-center">
                  {selectedReflection.mood === 1 ? <FiFrown /> : selectedReflection.mood === 2 ? <FiMeh /> : <FiSmile />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.6rem] text-secondary/20 font-black uppercase tracking-[3px] mb-1">Mood</span>
                  <span className="font-black text-white text-[1.1rem] tracking-tight">{selectedReflection.mood === 1 ? 'Challenging' : selectedReflection.mood === 2 ? 'Steady' : 'Flow'}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[2.2rem] font-black text-accent tracking-tighter leading-none">{selectedReflection.productivityScore}/10</div>
                <div className="text-[0.6rem] text-secondary/20 font-black uppercase tracking-[3px] mt-2">Score</div>
              </div>
            </div>

            <div className="mt-2 stack-gap-md">
              <div className="stack-gap-md p-6 bg-[#050505]/40 rounded-3xl border border-border/10">
                <span className="text-[0.65rem] text-[#06d6a0] font-black uppercase tracking-[2px]">Wins & Positives</span>
                <p className="text-secondary/60 text-[0.9rem] font-bold leading-relaxed italic">
                  {selectedReflection.goodThings.join('\n') || 'No data recorded.'}
                </p>
              </div>

              <div className="stack-gap-md p-6 bg-[#050505]/40 rounded-3xl border border-border/10">
                <span className="text-[0.65rem] text-[#ef476f] font-black uppercase tracking-[2px]">Challenges</span>
                <p className="text-secondary/60 text-[0.9rem] font-bold leading-relaxed italic">
                  {selectedReflection.badThings.join('\n') || 'No data recorded.'}
                </p>
              </div>

              <div className="stack-gap-md p-6 bg-[#050505]/40 rounded-3xl border border-border/10">
                <span className="text-[0.65rem] text-[#ffd166] font-black uppercase tracking-[2px]">Lessons Learned</span>
                <p className="text-secondary/60 text-[0.9rem] font-bold leading-relaxed italic">
                  {selectedReflection.learnings.join('\n') || 'No data recorded.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
