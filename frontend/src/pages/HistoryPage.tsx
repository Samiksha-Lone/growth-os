import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchHistoryPage } from '../api/growthos';
import { historyQueryKey } from '../api/queryKeys';
import { Card } from '../components/ui/Card';
import { Skeleton } from '../components/ui/Skeleton';
import type { HistoryEvent, HistoryRecordType, HistoryTaskStatus } from '../lib/types';

const recordTypes: Array<{ value: HistoryRecordType; label: string }> = [
  { value: 'task', label: 'Tasks' },
  { value: 'habit', label: 'Habits' },
  { value: 'goal', label: 'Goals' },
  { value: 'affirmation', label: 'Affirmations' },
  { value: 'journal', label: 'Journal' },
];
const taskStatuses: Array<HistoryTaskStatus | ''> = ['', 'Pending', 'In Progress', 'Completed', 'Missed'];
const pageSize = 30;

const destination: Record<HistoryRecordType, { label: string; to: string }> = {
  task: { label: 'Open Planner', to: '/planner' },
  habit: { label: 'Open Habits', to: '/habits' },
  goal: { label: 'Open Goals', to: '/goals' },
  affirmation: { label: 'Open Goals', to: '/goals' },
  journal: { label: 'Open Journal', to: '/journal' },
};

const typeLabel: Record<HistoryRecordType, string> = {
  task: 'Task',
  habit: 'Habit check-in',
  goal: 'Goal',
  affirmation: 'Affirmation',
  journal: 'Journal',
};

function formatDate(dateKey: string): string {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function formatTimestamp(timestamp?: string): string | null {
  if (!timestamp) return null;
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function EventContent({ event }: { event: HistoryEvent }) {
  const journalLines = [
    ...(event.goodThings ?? []).map(text => ({ label: 'Went well', text })),
    ...(event.badThings ?? []).map(text => ({ label: 'Could improve', text })),
    ...(event.learnings ?? []).map(text => ({ label: 'Learned', text })),
    ...(event.notes ? [{ label: 'Notes', text: event.notes }] : []),
  ];

  return (
    <Card className="p-4 sm:p-5 primary bg-[#0c0c0e]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-md border border-white/10 bg-white/5 px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider text-zinc-300">
              {typeLabel[event.type]}
            </span>
            {event.category && (
              <span className={`rounded-md px-2 py-1 text-[0.65rem] font-bold uppercase tracking-wider tag-${event.category.toLowerCase()}`}>
                {event.category}
              </span>
            )}
            {event.status && (
              <span className={`text-xs font-bold ${event.status === 'Completed' ? 'text-emerald-400' : event.status === 'Missed' ? 'text-rose-400' : 'text-zinc-400'}`}>
                {event.status}
              </span>
            )}
            {event.mood !== undefined && event.mood !== null && (
              <span className="text-xs font-semibold text-accent">Recorded mood: {event.mood} / 3</span>
            )}
          </div>
          <h3 className="break-words text-sm font-bold text-white sm:text-base">{event.title}</h3>
          {event.detail && event.type !== 'journal' && (
            <p className="mt-1 break-words text-sm leading-relaxed text-zinc-400">{event.detail}</p>
          )}

          {event.type === 'task' && (
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
              {event.plannedDate && <span>Planned: {formatDate(event.plannedDate)}</span>}
              {event.dueDate && <span>Due: {formatDate(event.dueDate)}</span>}
            </div>
          )}

          {event.type === 'journal' && journalLines.length > 0 && (
            <ul className="mt-3 space-y-2">
              {journalLines.map((line, index) => (
                <li key={`${event.id}-${index}`} className="break-words text-sm leading-relaxed text-zinc-300">
                  <span className="mr-2 text-[0.65rem] font-bold uppercase tracking-wider text-zinc-500">{line.label}</span>
                  {line.text}
                </li>
              ))}
            </ul>
          )}
          {event.type === 'journal' && journalLines.length === 0 && (
            <p className="mt-1 text-sm text-zinc-500">Journal entry saved.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
          {event.type === 'habit' ? (
            <span className="text-xs text-zinc-500">Date-only check-in</span>
          ) : (
            <span className="text-xs text-zinc-500">
              {event.type === 'task' ? 'Planned date' : event.type === 'journal' ? 'Entry date' : 'Created'}
            </span>
          )}
          {event.type !== 'habit' && event.type !== 'task' && formatTimestamp(event.createdAt) && (
            <span className="text-xs text-zinc-500">Saved {formatTimestamp(event.createdAt)}</span>
          )}
          {event.updatedAt && event.updatedAt !== event.createdAt && (
            <span className="text-xs text-zinc-500">Updated {formatTimestamp(event.updatedAt)}</span>
          )}
          <Link to={destination[event.type].to} className="text-xs font-bold text-accent hover:text-white">
            {destination[event.type].label} →
          </Link>
        </div>
      </div>
    </Card>
  );
}

export default function HistoryPage() {
  const [selectedTypes, setSelectedTypes] = useState<HistoryRecordType[]>(recordTypes.map(type => type.value));
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [taskStatus, setTaskStatus] = useState<HistoryTaskStatus | ''>('');

  useEffect(() => {
    const timeout = window.setTimeout(() => setSearch(searchInput.trim()), 250);
    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  const filters = useMemo(() => ({
    types: [...selectedTypes].sort(),
    search,
    startDate,
    endDate,
    taskStatus,
  }), [selectedTypes, search, startDate, endDate, taskStatus]);
  const dateRangeInvalid = Boolean(startDate && endDate && startDate > endDate);
  const query = useInfiniteQuery({
    queryKey: historyQueryKey(filters),
    queryFn: ({ pageParam }) => fetchHistoryPage({
      types: selectedTypes,
      search,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      taskStatus: taskStatus || undefined,
      limit: pageSize,
      skip: pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: lastPage => lastPage.hasMore ? lastPage.nextSkip : undefined,
    enabled: selectedTypes.length > 0 && !dateRangeInvalid,
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
  const fetchNextHistoryPage = query.fetchNextPage;

  const events = useMemo(() => query.data?.pages.flatMap(page => page.events) ?? [], [query.data]);
  const groupedEvents = useMemo(() => {
    const groups = new Map<string, HistoryEvent[]>();
    events.forEach(event => {
      const group = groups.get(event.date) ?? [];
      group.push(event);
      groups.set(event.date, group);
    });
    return [...groups.entries()].sort(([left], [right]) => right.localeCompare(left));
  }, [events]);
  const hasActiveFilters = Boolean(
    search || startDate || endDate || taskStatus ||
    selectedTypes.length !== recordTypes.length
  );

  const toggleType = (type: HistoryRecordType) => {
    setSelectedTypes(current => current.includes(type)
      ? current.filter(selected => selected !== type)
      : [...current, type]);
  };

  const resetFilters = () => {
    setSelectedTypes(recordTypes.map(type => type.value));
    setSearchInput('');
    setSearch('');
    setStartDate('');
    setEndDate('');
    setTaskStatus('');
  };

  return (
    <div className="page-stack min-w-0">
      <div>
        <h1 className="title-main">History</h1>
        <p className="title-sub text-zinc-400">
          Browse saved tasks, recorded habit check-ins, goals, affirmations, and Journal entries. Task dates show when they were planned, not when they were completed.
        </p>
      </div>

      <Card className="p-4 sm:p-5 primary bg-[#0c0c0e]">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <label className="min-w-0 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Search history
            <input
              type="search"
              value={searchInput}
              onChange={event => setSearchInput(event.target.value)}
              placeholder="Search titles or saved journal text"
              maxLength={100}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white placeholder:text-zinc-600 focus:border-accent focus:outline-none"
            />
          </label>
          <label className="min-w-0 text-xs font-bold uppercase tracking-wider text-zinc-400">
            From
            <input
              type="date"
              value={startDate}
              onChange={event => setStartDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2.5 text-sm font-normal text-white focus:border-accent focus:outline-none"
            />
          </label>
          <label className="min-w-0 text-xs font-bold uppercase tracking-wider text-zinc-400">
            To
            <input
              type="date"
              value={endDate}
              onChange={event => setEndDate(event.target.value)}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2.5 text-sm font-normal text-white focus:border-accent focus:outline-none"
            />
          </label>
          <label className="min-w-0 text-xs font-bold uppercase tracking-wider text-zinc-400">
            Task status
            <select
              value={taskStatus}
              onChange={event => setTaskStatus(event.target.value as HistoryTaskStatus | '')}
              className="mt-2 w-full rounded-lg border border-white/10 bg-[#09090b] px-3 py-2.5 text-sm font-normal normal-case tracking-normal text-white focus:border-accent focus:outline-none"
            >
              {taskStatuses.map(status => <option key={status || 'all'} value={status}>{status || 'All statuses'}</option>)}
            </select>
          </label>
        </div>
        <fieldset className="mt-4">
          <legend className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">Record types</legend>
          <div className="flex flex-wrap gap-2">
            {recordTypes.map(type => {
              const checked = selectedTypes.includes(type.value);
              return (
                <label key={type.value} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${checked ? 'border-accent/50 bg-accent/10 text-white' : 'border-white/10 bg-black/10 text-zinc-400'}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleType(type.value)} className="accent-cyan-400" />
                  {type.label}
                </label>
              );
            })}
          </div>
        </fieldset>
        <div className="mt-3 flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p className="text-zinc-500">Task status applies to task records; other selected record types remain visible.</p>
          {hasActiveFilters && <button type="button" onClick={resetFilters} className="self-start font-bold text-accent hover:text-white">Clear filters</button>}
        </div>
        {dateRangeInvalid && <p role="alert" className="mt-3 text-sm text-rose-300">The start date must be on or before the end date.</p>}
      </Card>

      {selectedTypes.length === 0 ? (
        <Card className="p-8 text-center primary bg-[#0c0c0e]">
          <p className="text-sm text-zinc-300">Select at least one record type to view history.</p>
        </Card>
      ) : query.isLoading ? (
        <div className="stack-gap-sm"><Skeleton height="120px" /><Skeleton height="120px" /></div>
      ) : query.isError ? (
        <Card className="p-5 border-l-4 border-rose-500 primary bg-rose-950/20">
          <p className="font-bold text-rose-300">History could not be loaded.</p>
          <p className="mt-1 text-sm text-rose-200/80">{query.error.message}</p>
          <button type="button" onClick={() => query.refetch()} className="mt-3 text-xs font-black uppercase tracking-widest text-accent hover:text-white">Retry</button>
        </Card>
      ) : groupedEvents.length === 0 ? (
        <Card className="p-8 text-center primary bg-[#0c0c0e] sm:p-12">
          <p className="text-sm font-medium text-zinc-300">
            {hasActiveFilters ? 'No history records match these filters.' : 'No saved history records yet.'}
          </p>
          <p className="mt-2 text-xs text-zinc-500">
            {hasActiveFilters
              ? 'Try changing the search, dates, status, or selected record types.'
              : 'Tasks, habit check-ins, goals, affirmations, and Journal entries will appear here when recorded.'}
          </p>
        </Card>
      ) : (
        <div className="stack-gap-lg">
          {groupedEvents.map(([date, dateEvents]) => (
            <section key={date} className="stack-gap-sm">
              <h2 className="ml-1 text-xs font-bold uppercase tracking-wider text-zinc-300">{formatDate(date)}</h2>
              <div className="stack-gap-sm">
                {dateEvents.map(event => <EventContent key={event.id} event={event} />)}
              </div>
            </section>
          ))}
          {query.hasNextPage && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fetchNextHistoryPage()}
                disabled={query.isFetchingNextPage}
                className="rounded-xl border border-white/10 bg-[#0c0c0e] px-5 py-3 text-sm font-bold text-white transition-colors hover:border-accent/40 hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
              >
                {query.isFetchingNextPage ? 'Loading history…' : 'Load more'}
              </button>
            </div>
          )}
          {query.isFetchNextPageError && (
            <Card className="p-4 text-center primary bg-rose-950/20">
              <p className="text-sm text-rose-300">More history could not be loaded.</p>
              <button type="button" onClick={() => fetchNextHistoryPage()} className="mt-2 text-xs font-bold text-accent">Retry</button>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
