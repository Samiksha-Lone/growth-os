import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { createGoal, deleteGoal, fetchGoals } from '../api/growthos';
import { productivityReportQueryKey } from '../api/queryKeys';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useConfirm } from '../components/ui/ConfirmProvider';
import { Skeleton } from '../components/ui/Skeleton';
import type { Goal } from '../lib/types';

export default function GoalsPage() {
  const [goalDraft, setGoalDraft] = useState('');
  const [affirmationDraft, setAffirmationDraft] = useState('');
  const queryClient = useQueryClient();
  const confirm = useConfirm();
  const goalsQuery = useQuery<Goal[]>({
    queryKey: ['goals'],
    queryFn: fetchGoals,
    staleTime: 0,
    gcTime: 15 * 60 * 1000,
    retry: 2,
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  const goals = goalsQuery.data ?? [];
  const personalGoals = goals.filter(goal => goal.type === 'goal');
  const affirmations = goals.filter(goal => goal.type === 'affirmation');

  const createMutation = useMutation({
    mutationFn: createGoal,
    onSuccess: async savedGoal => {
      queryClient.setQueryData<Goal[]>(['goals'], currentGoals => [savedGoal, ...(currentGoals ?? [])]);
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      await queryClient.invalidateQueries({ queryKey: productivityReportQueryKey });
      await queryClient.resetQueries({ queryKey: ['history'] });
      if (savedGoal.type === 'goal') setGoalDraft('');
      else setAffirmationDraft('');
      toast.success(savedGoal.type === 'goal' ? 'Goal saved' : 'Affirmation saved');
    },
    onError: error => {
      console.error('Failed to save goal or affirmation:', error);
      toast.error('Could not save. Please try again.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGoal,
    onSuccess: async (_, goalId) => {
      queryClient.setQueryData<Goal[]>(['goals'], currentGoals =>
        currentGoals?.filter(goal => goal._id !== goalId)
      );
      await queryClient.invalidateQueries({ queryKey: ['goals'] });
      await queryClient.invalidateQueries({ queryKey: productivityReportQueryKey });
      await queryClient.resetQueries({ queryKey: ['history'] });
      toast.success('Item deleted');
    },
    onError: error => {
      console.error('Failed to delete goal or affirmation:', error);
      toast.error('Could not delete. Please try again.');
    },
  });

  const submit = (text: string, type: Goal['type']) => {
    if (text.trim() && !createMutation.isPending) {
      createMutation.mutate({ text: text.trim(), type });
    }
  };

  const renderItems = (items: Goal[], type: Goal['type']) => {
    if (goalsQuery.isLoading) return <Skeleton height="180px" />;
    if (goalsQuery.isError) {
      return (
        <div role="alert" className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-sm text-rose-300">Your {type === 'goal' ? 'goals' : 'affirmations'} couldn't be loaded.</p>
          <button
            type="button"
            onClick={() => goalsQuery.refetch()}
            className="text-xs font-black uppercase tracking-widest text-accent hover:text-white"
          >
            Retry
          </button>
        </div>
      );
    }
    if (items.length === 0) {
      return (
        <div className="py-8 text-center text-sm font-medium text-zinc-400">
          {type === 'goal'
            ? 'No goals yet. Add your first goal above.'
            : 'No daily affirmations yet. Add one above.'}
        </div>
      );
    }

    return (
      <div className="stack-gap-sm">
        {items.map(item => (
          <div
            key={item._id}
            className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-white/10 bg-[#09090b] px-3 py-2 transition-colors hover:border-white/20 sm:px-4 sm:py-2.5"
          >
            <span className="min-w-0 break-words text-sm font-bold text-white">{item.text}</span>
            <button
              type="button"
              onClick={() => {
                void confirm({
                  title: `Delete ${type}?`,
                  message: `Delete "${item.text}"? This action cannot be undone.`,
                  confirmLabel: `Delete ${type}`,
                  variant: 'danger',
                }).then(confirmed => {
                  if (confirmed) deleteMutation.mutate(item._id);
                });
              }}
              disabled={deleteMutation.isPending}
              aria-label={`Delete ${type}: ${item.text}`}
              className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-rose-500/10 hover:text-rose-400 disabled:cursor-wait disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderCreateForm = (type: Goal['type'], value: string, setValue: (value: string) => void) => (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <input
        aria-label={type === 'goal' ? 'New goal' : 'New daily affirmation'}
        className="field-input !h-12 !min-w-0 !flex-1 !bg-[#09090b] !px-4 !text-sm text-white placeholder:text-zinc-500 border border-white/10 rounded-xl hover:border-white/20 focus:border-accent sm:!text-base"
        value={value}
        onChange={event => setValue(event.target.value)}
        onKeyDown={event => event.key === 'Enter' && submit(value, type)}
        placeholder={type === 'goal' ? 'What do you want to work toward?' : 'What would you like to remind yourself today?'}
      />
      <Button
        type="button"
        disabled={!value.trim() || createMutation.isPending}
        onClick={() => submit(value, type)}
        className="!h-12 !w-full !bg-accent !px-7 !text-xs !font-bold !text-white uppercase tracking-wider hover:!bg-accent/90 disabled:cursor-not-allowed disabled:opacity-50 sm:!w-auto sm:!text-sm"
      >
        {createMutation.isPending
          ? 'SAVING...'
          : type === 'goal'
            ? 'ADD GOAL'
            : 'ADD AFFIRMATION'}
      </Button>
    </div>
  );

  return (
    <div className="page-stack">
      <div className="flex flex-col gap-1">
        <h1 className="title-main">Goals</h1>
        <p className="title-sub text-zinc-400">Keep your longer-term objectives and daily affirmations in view.</p>
      </div>

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        <Card className="primary compact-card">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">Active Goals</span>
          {goalsQuery.isLoading ? <Skeleton height="38px" /> : goalsQuery.isError ? (
            <div role="alert" className="text-sm text-rose-300">Goal data unavailable.</div>
          ) : (
            <>
              <div className="text-2xl font-black text-white sm:text-3xl">{personalGoals.length}</div>
              <div className="mt-1 text-xs font-medium text-zinc-400">saved goals</div>
            </>
          )}
        </Card>
        <Card className="primary compact-card">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">Total Objectives</span>
          {goalsQuery.isLoading ? <Skeleton height="38px" /> : goalsQuery.isError ? (
            <div role="alert" className="text-sm text-rose-300">Objective data unavailable.</div>
          ) : (
            <>
              <div className="text-2xl font-black text-white sm:text-3xl">{goals.length}</div>
              <div className="mt-1 text-xs font-medium text-zinc-400">goals and affirmations saved</div>
            </>
          )}
        </Card>
        <Card className="primary compact-card">
          <span className="mb-2 block text-xs font-bold uppercase tracking-wider text-zinc-300">Daily Affirmations</span>
          {goalsQuery.isLoading ? <Skeleton height="38px" /> : goalsQuery.isError ? (
            <div role="alert" className="text-sm text-rose-300">Affirmation data unavailable.</div>
          ) : (
            <>
              <div className="text-2xl font-black text-white sm:text-3xl">{affirmations.length}</div>
              <div className="mt-1 text-xs font-medium text-zinc-400">saved affirmations</div>
            </>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 lg:gap-6">
        <Card className="primary min-w-0 p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Your Goals</h2>
            <p className="mt-1 text-xs text-zinc-400">Objectives you want to work toward.</p>
          </div>
          <div className="mb-5">{renderCreateForm('goal', goalDraft, setGoalDraft)}</div>
          {renderItems(personalGoals, 'goal')}
        </Card>

        <Card className="primary min-w-0 p-4 sm:p-6">
          <div className="mb-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-300">Daily Affirmations</h2>
            <p className="mt-1 text-xs text-zinc-400">Positive reminders you choose to keep close.</p>
          </div>
          <div className="mb-5">{renderCreateForm('affirmation', affirmationDraft, setAffirmationDraft)}</div>
          {renderItems(affirmations, 'affirmation')}
        </Card>
      </div>
    </div>
  );
}
