import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReflection, fetchReflections, updateReflection } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { localDateKey } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { FiFrown, FiMeh, FiSmile } from 'react-icons/fi';
import type { Reflection } from '../lib/types';

function reflectionDateKey(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : localDateKey(date);
}

function formatReflectionDate(value: string, options: Intl.DateTimeFormatOptions): string {
  const key = reflectionDateKey(value);
  if (!key) return 'Date unavailable';
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString([], options);
}

export default function ReflectionPage() {
  const [goodThings, setGoodThings] = useState('');
  const [badThings, setBadThings] = useState('');
  const [learnings, setLearnings] = useState('');
  const [mood, setMood] = useState(2); // 1: 😞, 2: 😐, 3: 🙂
  const [productivityScore, setProductivityScore] = useState(8);
  const [selectedReflection, setSelectedReflection] = useState<Reflection | null>(null);
  const [editingReflection, setEditingReflection] = useState<Reflection | null>(null);
  const hasEditedForm = useRef(false);

  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<Reflection[]>({
    queryKey: ['reflections'],
    queryFn: () => fetchReflections(10, 0), // Fetch only 10 initially, not 30
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  const loadReflection = useCallback((entry: Reflection) => {
    setEditingReflection(entry);
    setGoodThings(entry.goodThings?.join('\n') ?? '');
    setBadThings(entry.badThings?.join('\n') ?? '');
    setLearnings(entry.learnings?.join('\n') ?? '');
    setMood(entry.mood);
    setProductivityScore(entry.productivityScore);
  }, []);

  const addMutation = useMutation({
    mutationFn: createReflection,
    onSuccess: async (reflection) => {
      await queryClient.invalidateQueries({ queryKey: ['reflections'] });
      hasEditedForm.current = true;
      loadReflection(reflection);
      toast.success('Reflection saved');
    },
    onError: () => toast.error("Couldn't save the reflection. Please try again."),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Reflection> }) =>
      updateReflection(id, updates),
    onSuccess: async (reflection) => {
      await queryClient.invalidateQueries({ queryKey: ['reflections'] });
      hasEditedForm.current = true;
      loadReflection(reflection);
      toast.success('Reflection updated');
    },
    onError: () => toast.error("Couldn't update the reflection. Please try again."),
  });

  const [today, setToday] = useState(() => localDateKey());
  useEffect(() => {
    const now = new Date();
    const nextDay = new Date(now);
    nextDay.setHours(24, 0, 0, 0);
    const timeoutId = window.setTimeout(() => setToday(localDateKey()), nextDay.getTime() - now.getTime());
    return () => window.clearTimeout(timeoutId);
  }, [today]);

  const todayReflection = data?.find(entry => reflectionDateKey(entry.date) === today);

  useEffect(() => {
    if (!todayReflection || editingReflection || hasEditedForm.current) return;
    loadReflection(todayReflection);
  }, [todayReflection, editingReflection, loadReflection]);

  const startEditing = (entry: Reflection) => {
    hasEditedForm.current = true;
    loadReflection(entry);
    setSelectedReflection(null);
  };

  const saveReflection = () => {
    const updates = {
      goodThings: goodThings.split('\n'),
      badThings: badThings.split('\n'),
      learnings: learnings.split('\n'),
      mood,
      productivityScore,
    };

    const reflectionToUpdate = editingReflection ?? todayReflection;
    if (reflectionToUpdate) {
      updateMutation.mutate({ id: reflectionToUpdate._id, updates });
      return;
    }

    addMutation.mutate({ ...updates, date: today });
  };

  const isSaving = addMutation.isPending || updateMutation.isPending;

  return (
    <div className="page-stack">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="title-main">Daily Reflection</h1>
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg">
          <Card className="p-5 primary">
            <div className="flex flex-col gap-4">
              <div>
                <span className="mb-2 uppercase label-sub">What went well?</span>
                <textarea
                  className="field-textarea !bg-[#050505] !text-[0.9rem] !p-4 !h-20 !min-h-0"
                  aria-label="What went well?"
                  value={goodThings}
                  onChange={(e) => {
                    hasEditedForm.current = true;
                    setGoodThings(e.target.value);
                  }}
                  placeholder="Write down your wins for today..."
                />
              </div>

              <div>
                <span className="mb-2 uppercase label-sub">Today's Challenges</span>
                <textarea
                  className="field-textarea !bg-[#050505] !text-[0.9rem] !p-4 !h-20 !min-h-0"
                  aria-label="Today's challenges"
                  value={badThings}
                  onChange={(e) => {
                    hasEditedForm.current = true;
                    setBadThings(e.target.value);
                  }}
                  placeholder="What was difficult or disrupted your flow?"
                />
              </div>

              <div>
                <span className="mb-2 uppercase label-sub">Lessons Learned</span>
                <textarea
                  className="field-textarea !bg-[#050505] !text-[0.9rem] !p-4 !h-20 !min-h-0"
                  aria-label="Lessons learned"
                  value={learnings}
                  onChange={(e) => {
                    hasEditedForm.current = true;
                    setLearnings(e.target.value);
                  }}
                  placeholder="Lessons to integrate into next session..."
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-6 md:gap-8 py-6 mt-2 border-t border-border/10">
                <div className="flex flex-col gap-2.5">
                  <span className="label-sub uppercase !mb-0 opacity-40 text-[0.65rem] tracking-[2px]">How are you feeling?</span>
                  <div className="flex gap-2 bg-[#000] p-1.5 rounded-2xl border border-border/20 w-fit">
                    <button type="button" aria-label="Challenging mood" aria-pressed={mood === 1} className={`min-h-11 min-w-11 p-2.5 rounded-xl text-xl transition-all flex items-center justify-center ${mood === 1 ? 'bg-[#1a1a1a] shadow-lg grayscale-0 text-white' : 'bg-transparent grayscale opacity-20 hover:opacity-100 text-white'}`} onClick={() => {
                      hasEditedForm.current = true;
                      setMood(1);
                    }}><FiFrown /></button>
                    <button type="button" aria-label="Steady mood" aria-pressed={mood === 2} className={`min-h-11 min-w-11 p-2.5 rounded-xl text-xl transition-all flex items-center justify-center ${mood === 2 ? 'bg-[#1a1a1a] shadow-lg grayscale-0 text-white' : 'bg-transparent grayscale opacity-20 hover:opacity-100 text-white'}`} onClick={() => {
                      hasEditedForm.current = true;
                      setMood(2);
                    }}><FiMeh /></button>
                    <button type="button" aria-label="Flow mood" aria-pressed={mood === 3} className={`min-h-11 min-w-11 p-2.5 rounded-xl text-xl transition-all flex items-center justify-center ${mood === 3 ? 'bg-[#1a1a1a] shadow-lg grayscale-0 text-white' : 'bg-transparent grayscale opacity-20 hover:opacity-100 text-white'}`} onClick={() => {
                      hasEditedForm.current = true;
                      setMood(3);
                    }}><FiSmile /></button>
                  </div>
                </div>

                <div className="flex-1 flex flex-col gap-3 w-full">
                  <div className="flex items-center justify-between">
                    <span className="label-sub uppercase !mb-0 opacity-40 text-[0.65rem] tracking-[2px]">Productivity Yield</span>
                    <span className="text-[1.2rem] font-black text-white leading-none">{productivityScore} <span className="text-secondary/20 text-[0.8rem] uppercase ml-1">/ 10</span></span>
                  </div>
                  <div className="w-full h-1.5 bg-[#0a0a0a] rounded-full relative group">
                    <div className="h-full transition-all duration-300 rounded-full bg-accent" style={{ width: `${productivityScore * 10}%`, filter: 'drop-shadow(0 0 5px rgba(58,134,255,0.4))' }} />
                    <input
                      aria-label="Productivity score"
                      type="range" min="1" max="10" value={productivityScore}
                      onChange={(e) => {
                        hasEditedForm.current = true;
                        setProductivityScore(parseInt(e.target.value));
                      }}
                      className="absolute top-1/2 left-0 w-full opacity-0 cursor-pointer -translate-y-1/2 !h-8"
                    />
                  </div>
                </div>
              </div>

              {editingReflection && (
                <p className="text-xs text-secondary/60">
                  Editing reflection for {formatReflectionDate(editingReflection.date, { month: 'long', day: 'numeric', year: 'numeric' })}.
                </p>
              )}

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={saveReflection}
                  className="w-full sm:w-auto !px-8 sm:!px-12 !py-4 !bg-accent !text-white !font-black !text-[0.85rem] !rounded-2xl active:scale-95 transition-all uppercase tracking-[2px] disabled:cursor-wait disabled:opacity-50"
                >
                  {isSaving ? 'SAVING...' : editingReflection || todayReflection ? 'UPDATE REFLECTION' : 'SAVE REFLECTION'}
                </Button>
                {editingReflection && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSaving}
                    onClick={() => {
                      if (todayReflection) {
                        startEditing(todayReflection);
                      } else {
                        hasEditedForm.current = true;
                        setEditingReflection(null);
                        setGoodThings('');
                        setBadThings('');
                        setLearnings('');
                        setMood(2);
                        setProductivityScore(8);
                      }
                    }}
                    className="w-full sm:w-auto"
                  >
                    CANCEL EDIT
                  </Button>
                )}
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
            ) : isError ? (
              <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-border/20 bg-[#000] p-6 text-center">
                <p className="text-sm text-red-300">Reflection history couldn't be loaded.</p>
                <button type="button" onClick={() => refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white">
                  Retry
                </button>
              </div>
            ) : !data?.length ? (
              <div className="rounded-2xl border border-dashed border-border/10 bg-[#000] p-8 text-center text-sm font-medium text-secondary/60">
                Logs will appear here.
              </div>
            ) : data?.slice(0, 5).map((entry) => (
              <div
                key={entry._id}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    setSelectedReflection(entry);
                  }
                }}
                className="group min-w-0 p-4 sm:p-5 bg-[#000] border border-border/10 rounded-2xl flex justify-between items-center gap-3 cursor-pointer transition-all hover:border-border/30"
                onClick={() => setSelectedReflection(entry)}
              >
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="font-black text-[0.95rem] text-white uppercase tracking-tight">
                    {formatReflectionDate(entry.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="max-w-full truncate text-secondary/40 text-[0.75rem] font-bold italic sm:w-[160px]">
                    {entry.goodThings?.[0] || 'Metadata logged.'}
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
        title={selectedReflection ? formatReflectionDate(selectedReflection.date, { weekday: 'long', month: 'long', day: 'numeric' }) : ''}
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
                  <span className="whitespace-pre-wrap break-words">{selectedReflection.goodThings?.join('\n') || 'No data recorded.'}</span>
                </p>
              </div>

              <div className="stack-gap-md p-6 bg-[#050505]/40 rounded-3xl border border-border/10">
                <span className="text-[0.65rem] text-[#ef476f] font-black uppercase tracking-[2px]">Challenges</span>
                <p className="text-secondary/60 text-[0.9rem] font-bold leading-relaxed italic">
                  <span className="whitespace-pre-wrap break-words">{selectedReflection.badThings?.join('\n') || 'No data recorded.'}</span>
                </p>
              </div>

              <div className="stack-gap-md p-6 bg-[#050505]/40 rounded-3xl border border-border/10">
                <span className="text-[0.65rem] text-[#ffd166] font-black uppercase tracking-[2px]">Lessons Learned</span>
                <p className="text-secondary/60 text-[0.9rem] font-bold leading-relaxed italic">
                  <span className="whitespace-pre-wrap break-words">{selectedReflection.learnings?.join('\n') || 'No data recorded.'}</span>
                </p>
              </div>
            </div>
            <Button type="button" onClick={() => startEditing(selectedReflection)} className="w-full sm:w-auto">
              EDIT REFLECTION
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
