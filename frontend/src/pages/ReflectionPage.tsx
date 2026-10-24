import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createReflection, fetchReflections, updateReflection } from '../api/growthos';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { localDateKey } from '../lib/dateUtils';
import toast from 'react-hot-toast';
import { Skeleton } from '../components/ui/Skeleton';
import { Modal } from '../components/ui/Modal';
import { FiFrown, FiMeh, FiSmile, FiEdit3 } from 'react-icons/fi';
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
    queryFn: () => fetchReflections(10, 0), // Fetch only 10 initially
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
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
      <div className="flex flex-col gap-1">
        <h1 className="title-main">Daily Reflection</h1>
        <p className="title-sub">Review today's wins, navigate obstacles, and recalibrate.</p>
      </div>

      <div className="split-layout">
        <div className="stack-gap-lg min-w-0">
          <Card className="primary p-4 sm:p-6">
            <div className="flex flex-col gap-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                  What went well?
                </label>
                <textarea
                  className="field-textarea !bg-[#09090b] border border-white/10 hover:border-white/20 focus:border-accent text-white placeholder:text-zinc-500 !p-3.5 sm:!p-4 !text-sm sm:!text-[0.95rem] min-h-[90px] sm:min-h-[105px] rounded-xl resize-y transition-all leading-relaxed"
                  aria-label="What went well?"
                  value={goodThings}
                  onChange={(e) => {
                    hasEditedForm.current = true;
                    setGoodThings(e.target.value);
                  }}
                  placeholder="Write down your wins and accomplishments for today..."
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                  Today's Challenges
                </label>
                <textarea
                  className="field-textarea !bg-[#09090b] border border-white/10 hover:border-white/20 focus:border-accent text-white placeholder:text-zinc-500 !p-3.5 sm:!p-4 !text-sm sm:!text-[0.95rem] min-h-[90px] sm:min-h-[105px] rounded-xl resize-y transition-all leading-relaxed"
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
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block mb-2">
                  Lessons Learned
                </label>
                <textarea
                  className="field-textarea !bg-[#09090b] border border-white/10 hover:border-white/20 focus:border-accent text-white placeholder:text-zinc-500 !p-3.5 sm:!p-4 !text-sm sm:!text-[0.95rem] min-h-[90px] sm:min-h-[105px] rounded-xl resize-y transition-all leading-relaxed"
                  aria-label="Lessons learned"
                  value={learnings}
                  onChange={(e) => {
                    hasEditedForm.current = true;
                    setLearnings(e.target.value);
                  }}
                  placeholder="Key takeaways to integrate into your next session..."
                />
              </div>

              {/* Mood & Productivity Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-5 sm:gap-8 py-4 px-4 sm:px-5 mt-1 bg-[#09090b] rounded-xl border border-white/10">
                {/* Mood Selector */}
                <div className="flex flex-col gap-2 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                    How are you feeling?
                  </span>
                  <div className="flex gap-2 bg-[#000] p-1.5 rounded-xl border border-white/10 w-fit">
                    <button
                      type="button"
                      aria-label="Challenging mood"
                      aria-pressed={mood === 1}
                      title="Challenging"
                      className={`min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 p-2 rounded-lg text-xl transition-all flex items-center justify-center border ${
                        mood === 1
                          ? 'bg-rose-500/20 border-rose-500/50 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => {
                        hasEditedForm.current = true;
                        setMood(1);
                      }}
                    >
                      <FiFrown />
                    </button>
                    <button
                      type="button"
                      aria-label="Steady mood"
                      aria-pressed={mood === 2}
                      title="Steady"
                      className={`min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 p-2 rounded-lg text-xl transition-all flex items-center justify-center border ${
                        mood === 2
                          ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => {
                        hasEditedForm.current = true;
                        setMood(2);
                      }}
                    >
                      <FiMeh />
                    </button>
                    <button
                      type="button"
                      aria-label="Flow mood"
                      aria-pressed={mood === 3}
                      title="Flow"
                      className={`min-h-10 min-w-10 sm:min-h-11 sm:min-w-11 p-2 rounded-lg text-xl transition-all flex items-center justify-center border ${
                        mood === 3
                          ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.3)]'
                          : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                      onClick={() => {
                        hasEditedForm.current = true;
                        setMood(3);
                      }}
                    >
                      <FiSmile />
                    </button>
                  </div>
                </div>

                {/* Productivity Slider */}
                <div className="flex-1 flex flex-col gap-2.5 w-full">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                      Productivity Yield
                    </span>
                    <span className="text-lg sm:text-xl font-black text-white leading-none">
                      {productivityScore} <span className="text-zinc-400 text-xs sm:text-sm font-semibold">/ 10</span>
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-800/90 rounded-full relative flex items-center border border-white/5">
                    <div
                      className="h-full transition-all duration-150 rounded-full bg-accent shadow-[0_0_8px_rgba(0,191,255,0.4)]"
                      style={{ width: `${productivityScore * 10}%` }}
                    />
                    <div
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white border-2 border-accent shadow-md pointer-events-none -ml-2"
                      style={{ left: `${productivityScore * 10}%` }}
                    />
                    <input
                      aria-label="Productivity score"
                      type="range"
                      min="1"
                      max="10"
                      value={productivityScore}
                      onChange={(e) => {
                        hasEditedForm.current = true;
                        setProductivityScore(parseInt(e.target.value));
                      }}
                      className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                    />
                  </div>
                </div>
              </div>

              {editingReflection && (
                <div className="flex items-center gap-2 p-3 bg-accent/10 border border-accent/20 rounded-xl text-xs text-accent font-semibold">
                  <FiEdit3 className="text-sm shrink-0" />
                  <span>Editing reflection for {formatReflectionDate(editingReflection.date, { month: 'long', day: 'numeric', year: 'numeric' })}.</span>
                </div>
              )}

              <div className="mt-2 flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3">
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
                    className="w-full sm:w-auto !py-3.5"
                  >
                    CANCEL EDIT
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={isSaving}
                  onClick={saveReflection}
                  className="w-full sm:w-auto !px-8 sm:!px-10 !py-3.5 !bg-accent hover:!bg-accent/90 !text-white !font-bold !text-sm !rounded-xl active:scale-95 transition-all uppercase tracking-wider disabled:cursor-wait disabled:opacity-50 shadow-lg shadow-accent/25"
                >
                  {isSaving ? 'SAVING...' : editingReflection || todayReflection ? 'UPDATE REFLECTION' : 'SAVE REFLECTION'}
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Sidebar: Your History */}
        <div className="stack-gap-lg min-w-0">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 ml-1">
            Your History
          </span>
          <div className="stack-gap-md">
            {isLoading ? (
              <Skeleton height="300px" />
            ) : isError ? (
              <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 text-center">
                <p className="text-sm text-rose-300">Reflection history couldn't be loaded.</p>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
                >
                  Retry
                </button>
              </div>
            ) : !data?.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0c0c0e] p-8 text-center text-sm font-medium text-zinc-400">
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
                className="group min-w-0 p-3.5 sm:p-4 bg-[#0c0c0e] hover:bg-[#141418] border border-white/10 hover:border-accent/40 rounded-xl flex justify-between items-center gap-3 cursor-pointer transition-all duration-200 shadow-sm"
                onClick={() => setSelectedReflection(entry)}
              >
                <div className="flex min-w-0 flex-col gap-1">
                  <div className="font-bold text-sm text-white uppercase tracking-tight">
                    {formatReflectionDate(entry.date, { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  <div className="truncate text-zinc-300 text-xs font-normal max-w-[200px] sm:max-w-[220px]">
                    {entry.goodThings?.[0] || 'Reflection logged'}
                  </div>
                </div>
                <div className="transition-all text-zinc-500 group-hover:text-accent group-hover:translate-x-0.5">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        open={!!selectedReflection}
        onClose={() => setSelectedReflection(null)}
        title={selectedReflection ? formatReflectionDate(selectedReflection.date, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }) : ''}
      >
        {selectedReflection && (
          <div className="flex flex-col gap-5 pt-1">
            {/* Mood & Productivity header card */}
            <div className="flex items-center justify-between p-4 sm:p-5 bg-[#121215] rounded-2xl border border-white/10">
              <div className="flex items-center gap-3.5 sm:gap-4">
                <div className="text-xl sm:text-2xl bg-[#1c1c22] p-3 rounded-xl border border-white/10 text-white flex items-center justify-center">
                  {selectedReflection.mood === 1 ? (
                    <FiFrown className="text-rose-400" />
                  ) : selectedReflection.mood === 2 ? (
                    <FiMeh className="text-amber-400" />
                  ) : (
                    <FiSmile className="text-emerald-400" />
                  )}
                </div>
                <div className="flex flex-col">
                  <span className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-wider mb-0.5">Mood</span>
                  <span className="font-bold text-white text-base sm:text-lg tracking-tight">
                    {selectedReflection.mood === 1 ? 'Challenging' : selectedReflection.mood === 2 ? 'Steady' : 'Flow'}
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl sm:text-3xl font-black text-accent tracking-tight leading-none">
                  {selectedReflection.productivityScore}<span className="text-sm font-semibold text-zinc-400">/10</span>
                </div>
                <div className="text-[0.65rem] text-zinc-400 font-bold uppercase tracking-wider mt-1">Productivity</div>
              </div>
            </div>

            {/* Reflection details cards */}
            <div className="flex flex-col gap-3.5">
              <div className="p-4 sm:p-5 bg-emerald-950/20 rounded-2xl border border-emerald-500/20">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400 block mb-2">
                  Wins & Positives
                </span>
                <p className="text-zinc-100 text-sm sm:text-base leading-relaxed font-normal">
                  <span className="whitespace-pre-wrap break-words">
                    {selectedReflection.goodThings?.filter(Boolean).join('\n') || 'No data recorded.'}
                  </span>
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-rose-950/20 rounded-2xl border border-rose-500/20">
                <span className="text-xs font-black uppercase tracking-wider text-rose-400 block mb-2">
                  Challenges
                </span>
                <p className="text-zinc-100 text-sm sm:text-base leading-relaxed font-normal">
                  <span className="whitespace-pre-wrap break-words">
                    {selectedReflection.badThings?.filter(Boolean).join('\n') || 'No data recorded.'}
                  </span>
                </p>
              </div>

              <div className="p-4 sm:p-5 bg-amber-950/20 rounded-2xl border border-amber-500/20">
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 block mb-2">
                  Lessons Learned
                </span>
                <p className="text-zinc-100 text-sm sm:text-base leading-relaxed font-normal">
                  <span className="whitespace-pre-wrap break-words">
                    {selectedReflection.learnings?.filter(Boolean).join('\n') || 'No data recorded.'}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:justify-end gap-3">
              <Button
                type="button"
                onClick={() => startEditing(selectedReflection)}
                className="w-full sm:w-auto !py-3.5 !px-6 !bg-accent hover:!bg-accent/90 !text-white !font-bold !rounded-xl uppercase tracking-wider text-sm shadow-md"
              >
                EDIT REFLECTION
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
