import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { FiFrown, FiMeh, FiSmile } from 'react-icons/fi';
import { createReflection, deleteReflection, fetchAllReflections, updateReflection } from '../api/growthos';
import { productivityReportQueryKey } from '../api/queryKeys';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useConfirm } from '../components/ui/ConfirmProvider';
import { Skeleton } from '../components/ui/Skeleton';
import { localDateKey } from '../lib/dateUtils';
import type { Reflection } from '../lib/types';

type JournalDraft = {
  goodThings: string;
  badThings: string;
  learnings: string;
  notes: string;
  mood: number | null;
};

const emptyDraft: JournalDraft = {
  goodThings: '',
  badThings: '',
  learnings: '',
  notes: '',
  mood: null,
};

const moodOptions = [
  { value: 1, label: 'Challenging', Icon: FiFrown, style: 'text-rose-300 border-rose-500/40 bg-rose-500/10' },
  { value: 2, label: 'Steady', Icon: FiMeh, style: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
  { value: 3, label: 'Good', Icon: FiSmile, style: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' },
];

const journalFields: Array<{
  key: 'goodThings' | 'badThings' | 'learnings' | 'notes';
  label: string;
  placeholder: string;
  rows: number;
}> = [
  { key: 'goodThings', label: 'What felt good today?', placeholder: 'A moment, small win, or something you appreciated.', rows: 3 },
  { key: 'badThings', label: 'What felt difficult?', placeholder: 'Anything you want to acknowledge or revisit.', rows: 3 },
  { key: 'learnings', label: 'Anything you learned?', placeholder: 'A thought or lesson worth remembering.', rows: 3 },
];

function journalDateKey(value: string): string | null {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  if (/^\d{4}-\d{2}-\d{2}T00:00:00(?:\.000)?Z$/.test(value)) return value.slice(0, 10);
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : localDateKey(date);
}

function formatJournalDate(value: string, options: Intl.DateTimeFormatOptions): string {
  const key = journalDateKey(value) ?? value;
  const [year, month, day] = key.split('-').map(Number);
  if (!year || !month || !day) return 'Date unavailable';
  return new Date(year, month - 1, day).toLocaleDateString([], options);
}

function draftFromEntry(entry?: Reflection): JournalDraft {
  if (!entry) return { ...emptyDraft };
  return {
    goodThings: entry.goodThings?.join('\n') ?? '',
    badThings: entry.badThings?.join('\n') ?? '',
    learnings: entry.learnings?.join('\n') ?? '',
    notes: entry.notes ?? '',
    mood: entry.mood ?? null,
  };
}

function storedText(value: string): string[] {
  return value.length ? [value] : [];
}

function hasOptionalReflection(entry?: Reflection): boolean {
  return Boolean(
    entry?.goodThings?.some(Boolean) ||
    entry?.badThings?.some(Boolean) ||
    entry?.learnings?.some(Boolean) ||
    entry?.mood !== undefined && entry.mood !== null
  );
}

function moodLabel(mood: number): string {
  return moodOptions.find(option => option.value === mood)?.label ?? `Earlier mood (${mood})`;
}

export default function JournalPage() {
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const [today, setToday] = useState(() => localDateKey());
  const [activeDate, setActiveDate] = useState(today);
  const [draft, setDraft] = useState<JournalDraft>({ ...emptyDraft });
  const [optionalReflectionOpen, setOptionalReflectionOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const initialized = useRef(false);
  const writingAreaRef = useRef<HTMLTextAreaElement>(null);

  const { data, isLoading, isError, refetch } = useQuery<Reflection[]>({
    queryKey: ['reflections'],
    queryFn: () => fetchAllReflections(),
    staleTime: 0,
    gcTime: 10 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const entriesByDate = useMemo(() => {
    const entries = new Map<string, Reflection>();
    for (const entry of data ?? []) {
      const date = journalDateKey(entry.date);
      if (date && !entries.has(date)) entries.set(date, entry);
    }
    return entries;
  }, [data]);

  const activeEntry = entriesByDate.get(activeDate);
  const hasDraftContent = Boolean(
    draft.goodThings.length ||
    draft.badThings.length ||
    draft.learnings.length ||
    draft.notes.length ||
    draft.mood !== null
  );

  const loadEntry = useCallback((entry?: Reflection) => {
    setDraft(draftFromEntry(entry));
    setOptionalReflectionOpen(hasOptionalReflection(entry));
    setIsDirty(false);
    setSaveError(false);
  }, []);

  useEffect(() => {
    const textarea = writingAreaRef.current;
    if (!textarea) return;
    const maximumHeight = window.innerHeight * 0.7;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, maximumHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight > maximumHeight ? 'auto' : 'hidden';
  }, [draft.notes, activeDate]);

  useEffect(() => {
    if (initialized.current || isLoading || !data) return;
    initialized.current = true;
    loadEntry(entriesByDate.get(activeDate));
  }, [activeDate, data, entriesByDate, isLoading, loadEntry]);

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setHours(24, 0, 0, 0);
    const timeoutId = window.setTimeout(() => {
      const nextToday = localDateKey();
      setToday(nextToday);
      if (activeDate === today && !isDirty) {
        const entries = queryClient.getQueryData<Reflection[]>(['reflections']) ?? [];
        const entry = entries.find(item => journalDateKey(item.date) === nextToday);
        loadEntry(entry);
        setActiveDate(nextToday);
      }
    }, nextMidnight.getTime() - now.getTime());
    return () => window.clearTimeout(timeoutId);
  }, [activeDate, isDirty, loadEntry, queryClient, today]);

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      entryId?: string;
      updates: Partial<Pick<Reflection, 'goodThings' | 'badThings' | 'learnings' | 'notes' | 'mood'>>;
    }) => {
      const entry = payload.entryId
        ? await updateReflection(payload.entryId, payload.updates)
        : await createReflection({ ...payload.updates, date: payload.date });
      return { entry, wasUpdate: Boolean(payload.entryId) };
    },
    onSuccess: async ({ entry: savedEntry, wasUpdate }) => {
      queryClient.setQueryData<Reflection[]>(['reflections'], currentEntries => {
        const entries = currentEntries ?? [];
        return [savedEntry, ...entries.filter(entry => entry._id !== savedEntry._id)]
          .sort((left, right) => (journalDateKey(right.date) ?? '').localeCompare(journalDateKey(left.date) ?? ''));
      });
      setIsDirty(false);
      setSaveError(false);
      await queryClient.invalidateQueries({ queryKey: ['reflections'] });
      await queryClient.invalidateQueries({ queryKey: productivityReportQueryKey });
      await queryClient.resetQueries({ queryKey: ['history'] });
      toast.success(wasUpdate ? 'Journal entry updated' : 'Journal entry saved');
    },
    onError: () => {
      setSaveError(true);
      toast.error('Journal entry could not be saved. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteReflection,
    onSuccess: async (_, deletedId) => {
      queryClient.setQueryData<Reflection[]>(['reflections'], currentEntries =>
        currentEntries?.filter(entry => entry._id !== deletedId)
      );
      loadEntry();
      await queryClient.invalidateQueries({ queryKey: ['reflections'] });
      await queryClient.invalidateQueries({ queryKey: productivityReportQueryKey });
      await queryClient.resetQueries({ queryKey: ['history'] });
      toast.success('Journal entry deleted');
    },
    onError: () => toast.error("Couldn't delete the journal entry. Please try again."),
  });

  const updateDraft = <Key extends keyof JournalDraft>(key: Key, value: JournalDraft[Key]) => {
    setDraft(current => ({ ...current, [key]: value }));
    setIsDirty(true);
    setSaveError(false);
  };

  const selectEntry = async (entry: Reflection) => {
    const date = journalDateKey(entry.date);
    if (!date) return;
    if (isDirty && !await confirm({
      title: 'Discard unsaved changes?',
      message: 'Your latest journal edits have not been saved. Discard them and open this entry?',
      confirmLabel: 'Discard changes',
      variant: 'danger',
    })) return;
    setActiveDate(date);
    loadEntry(entry);
  };

  const startToday = async () => {
    if (isDirty && !await confirm({
      title: 'Discard unsaved changes?',
      message: "Your latest journal edits have not been saved. Discard them and open today's entry?",
      confirmLabel: 'Discard changes',
      variant: 'danger',
    })) return;
    setActiveDate(today);
    loadEntry(entriesByDate.get(today));
  };

  const removeActiveEntry = async () => {
    if (!activeEntry || deleteMutation.isPending || saveMutation.isPending) return;
    const confirmed = await confirm({
      title: 'Delete journal entry?',
      message: `Delete the entry for ${formatJournalDate(activeEntry.date, { month: 'long', day: 'numeric', year: 'numeric' })}?${isDirty ? ' Your unsaved edits will also be discarded.' : ''} This action cannot be undone.`,
      confirmLabel: 'Delete entry',
      variant: 'danger',
    });
    if (confirmed) deleteMutation.mutate(activeEntry._id);
  };

  const saveLabel = saveMutation.isPending
    ? 'SAVING...'
    : activeEntry
      ? 'UPDATE ENTRY'
      : 'SAVE ENTRY';

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">{activeDate === today ? "Today's Journal" : 'Journal'}</h1>
        <p className="title-sub text-zinc-400">A quiet space to put the day into your own words.</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:gap-6">
        <Card className="primary min-w-0 p-4 sm:p-6">
          <div className="mb-4 flex flex-col gap-3 border-b border-white/10 pb-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-white">
                {formatJournalDate(activeDate, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                {activeEntry ? 'Your saved entry · ready to edit' : 'New entry · write as much or as little as you like'}
              </p>
            </div>
            {activeDate !== today && (
              <Button type="button" variant="secondary" disabled={saveMutation.isPending || deleteMutation.isPending} onClick={() => void startToday()} className="w-full sm:w-auto">
                TODAY'S ENTRY
              </Button>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            {isLoading ? (
              <Skeleton height="360px" />
            ) : isError ? (
              <div role="alert" className="flex min-h-72 flex-col items-center justify-center gap-3 text-center">
                <p className="text-sm text-rose-300">Your Journal entries couldn't be loaded.</p>
                <button type="button" onClick={() => refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                  Retry
                </button>
              </div>
            ) : (
              <>
                <label htmlFor="journal-notes" className="sr-only">What's on your mind?</label>
                <textarea
                  ref={writingAreaRef}
                  id="journal-notes"
                  value={draft.notes}
                  disabled={saveMutation.isPending || deleteMutation.isPending}
                  onChange={event => updateDraft('notes', event.target.value)}
                  placeholder={"What's on your mind?\n\nStart anywhere. You don't need to make sense of it all at once."}
                  maxLength={10000}
                  rows={12}
                  className="field-textarea min-h-[45vh] w-full resize-y border-0 !bg-transparent !px-1 !py-3 text-base leading-8 text-zinc-100 placeholder:text-zinc-600 focus:!border-0 focus:!outline-none focus:!shadow-none focus-visible:ring-1 focus-visible:ring-white/30 sm:!px-2 sm:text-lg sm:leading-9"
                />

                <details
                  open={optionalReflectionOpen}
                  onToggle={event => setOptionalReflectionOpen(event.currentTarget.open)}
                  className="mt-4 border-t border-white/10 pt-4"
                >
                  <summary className="min-h-10 cursor-pointer list-none text-sm font-medium text-zinc-400 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden">
                    <span className="inline-flex items-center gap-2">
                      <span aria-hidden="true">{optionalReflectionOpen ? '−' : '+'}</span>
                      Optional reflection
                      <span className="text-xs font-normal text-zinc-500">Mood, moments, or lessons</span>
                    </span>
                  </summary>
                  <div className="mt-5 flex flex-col gap-5">
                    <fieldset>
                      <legend className="mb-2 text-xs font-semibold text-zinc-400">How did today feel?</legend>
                      <div className="flex flex-wrap gap-2">
                        {moodOptions.map(({ value, label, Icon, style }) => (
                          <button
                            key={value}
                            type="button"
                            disabled={saveMutation.isPending || deleteMutation.isPending}
                            aria-pressed={draft.mood === value}
                            onClick={() => updateDraft('mood', draft.mood === value ? null : value)}
                            className={`flex min-h-10 items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                              draft.mood === value ? style : 'border-white/10 bg-[#09090b] text-zinc-400 hover:border-white/20 hover:text-white'
                            }`}
                          >
                            <Icon aria-hidden="true" />
                            {label}
                          </button>
                        ))}
                      </div>
                      {activeEntry?.mood != null && activeEntry.mood > 3 && draft.mood === activeEntry.mood && (
                        <p className="mt-2 text-xs text-zinc-500">Earlier mood record ({activeEntry.mood}) is preserved as saved. Choose a current mood only if you want to replace it.</p>
                      )}
                    </fieldset>

                    {journalFields.map(({ key, label, placeholder, rows }) => (
                      <div key={key}>
                        <label htmlFor={`journal-${key}`} className="mb-2 block text-xs font-semibold text-zinc-400">
                          {label} <span className="font-normal text-zinc-500">· optional</span>
                        </label>
                        <textarea
                          id={`journal-${key}`}
                          value={draft[key]}
                          disabled={saveMutation.isPending || deleteMutation.isPending}
                          onChange={event => updateDraft(key, event.target.value)}
                          placeholder={placeholder}
                          rows={rows}
                          className="field-textarea min-h-[76px] w-full resize-y rounded-xl border border-white/10 !bg-[#09090b] !p-3.5 text-sm leading-relaxed text-white placeholder:text-zinc-500 transition-colors hover:border-white/20 focus:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:!p-4"
                        />
                      </div>
                    ))}
                  </div>
                </details>
              </>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p aria-live="polite" className={`text-xs ${saveError ? 'text-rose-300' : 'text-zinc-400'}`}>
                {deleteMutation.isPending
                  ? 'Deleting your entry...'
                  : saveError
                  ? 'Save failed. Your writing is still here; try again.'
                  : saveMutation.isPending
                    ? 'Saving your entry...'
                    : isDirty
                      ? 'Unsaved changes'
                      : activeEntry
                        ? 'Saved'
                        : 'Not saved yet'}
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                {activeEntry && (
                  <Button
                    type="button"
                    disabled={saveMutation.isPending || deleteMutation.isPending}
                    onClick={() => void removeActiveEntry()}
                    className="w-full !border !border-rose-500/30 !bg-rose-500/10 !px-5 !py-3 !text-rose-300 hover:!bg-rose-500/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {deleteMutation.isPending ? 'DELETING...' : 'DELETE ENTRY'}
                  </Button>
                )}
                <Button
                  type="button"
                  disabled={isLoading || isError || saveMutation.isPending || deleteMutation.isPending || !isDirty || (!activeEntry && !hasDraftContent)}
                  onClick={() => saveMutation.mutate({
                    date: activeDate,
                    entryId: activeEntry?._id,
                    updates: {
                      goodThings: storedText(draft.goodThings),
                      badThings: storedText(draft.badThings),
                      learnings: storedText(draft.learnings),
                      notes: draft.notes,
                      ...(activeEntry && draft.mood === (activeEntry.mood ?? null) ? {} : { mood: draft.mood }),
                    },
                  })}
                  className="w-full !bg-accent !px-6 !py-3 !text-white hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {saveLabel}
                </Button>
              </div>
            </div>
          </div>
        </Card>

        <section className="min-w-0" aria-labelledby="journal-history-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 id="journal-history-heading" className="text-xs font-bold uppercase tracking-wider text-zinc-300">Past entries</h2>
            {data?.length ? <span className="text-xs text-zinc-500">{data.length} saved</span> : null}
          </div>
          <div className="flex flex-col gap-2">
            {isLoading ? (
              <Skeleton height="260px" />
            ) : isError ? (
              <div role="alert" className="flex flex-col items-center gap-3 rounded-2xl border border-white/10 bg-[#0c0c0e] p-6 text-center">
                <p className="text-sm text-rose-300">Journal history couldn't be loaded.</p>
                <button type="button" onClick={() => refetch()} className="text-xs font-black uppercase tracking-widest text-accent hover:text-white">
                  Retry
                </button>
              </div>
            ) : !data?.length ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-[#0c0c0e] p-7 text-center text-sm text-zinc-400">
                Your entries will find a home here as you write.
              </div>
            ) : (
              data.map(entry => {
                const entryDate = journalDateKey(entry.date);
                const isSelected = entryDate === activeDate;
                const notes = entry.notes ?? '';
                const goodThings = entry.goodThings?.join('\n') ?? '';
                const badThings = entry.badThings?.join('\n') ?? '';
                const learnings = entry.learnings?.join('\n') ?? '';
                const preview = notes || goodThings || badThings || learnings || 'Journal entry';
                const structuredFields = [
                  { label: 'What felt good today?', value: goodThings },
                  { label: 'What felt difficult?', value: badThings },
                  { label: 'Anything you learned?', value: learnings },
                ].filter(field => field.value.trim());
                return (
                  <button
                    key={entry._id}
                    type="button"
                    disabled={saveMutation.isPending || deleteMutation.isPending}
                    aria-current={isSelected ? 'date' : undefined}
                    onClick={() => void selectEntry(entry)}
                    className={`w-full min-w-0 rounded-xl border p-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent sm:p-4 ${
                      isSelected
                        ? 'border-accent/40 bg-accent/5'
                        : 'border-white/10 bg-[#0c0c0e] hover:border-white/20 hover:bg-[#141418]'
                    }`}
                  >
                    <span className="block text-sm font-bold text-white">
                      {entryDate ? formatJournalDate(entryDate, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : 'Date unavailable'}
                    </span>
                    {entry.mood != null && (
                      <span className="mt-1 block text-xs font-medium text-accent">{moodLabel(entry.mood)}</span>
                    )}
                    <span className="mt-1 line-clamp-3 block break-words whitespace-pre-wrap text-xs leading-relaxed text-zinc-400">{preview}</span>
                    {structuredFields.map(field => (
                      <span key={field.label} className="mt-2 block break-words text-xs leading-relaxed text-zinc-400">
                        <span className="font-semibold text-zinc-300">{field.label}</span>
                        <span className="mt-0.5 block whitespace-pre-wrap">{field.value}</span>
                      </span>
                    ))}
                  </button>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
