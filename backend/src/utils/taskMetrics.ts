import { calculateCompletionRate } from './dateHelpers';

export interface TaskSummary {
  plannedTasks: number;
  completedTasks: number;
  missedTasks: number;
  completionPercentage: number;
}

export function summarizeTasks(tasks: ReadonlyArray<{ status: string }>): TaskSummary {
  const plannedTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'Completed').length;
  const missedTasks = tasks.filter(task => task.status === 'Missed').length;

  return {
    plannedTasks,
    completedTasks,
    missedTasks,
    completionPercentage: calculateCompletionRate(completedTasks, plannedTasks),
  };
}
