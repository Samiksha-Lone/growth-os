import api from './axios';
import type { DashboardStats, Goal, Habit, AdvancedAnalytics, HistoryPageResult, HistoryRecordType, HistoryTaskStatus, Reflection, ProductivityReport, RealitySummary, Task, UserProfile, PasswordChangeResponse } from '../lib/types';
import { localDateKey } from '../lib/dateUtils';

export async function fetchDashboardStats(date?: string): Promise<DashboardStats> {
  const dateStr = date || new Date().toLocaleDateString('en-CA');
  // Use the optimized dashboard endpoint that returns all stats in one call
  const response = await api.get('/dashboard/stats', { params: { date: dateStr } });
  
  return {
    tasksToday: response.data.tasksToday,
    tasksTotal: response.data.tasksTotal,
    habitsDone: response.data.habitsDone,
    habitsTotal: response.data.habitsTotal,
    score: response.data.score,
    weeklyTrend: response.data.weeklyTrend,
  };
}

export async function fetchTasks(date?: string, limit: number = 20, skip: number = 0): Promise<Task[]> {
  const response = await api.get('/tasks', { params: { date, limit, skip } });
  return response.data.tasks || [];
}

export async function fetchAllTasks(date: string, pageSize: number = 100): Promise<Task[]> {
  const tasks: Task[] = [];

  for (let skip = 0; ; skip += pageSize) {
    const page = await fetchTasks(date, pageSize, skip);
    tasks.push(...page);
    if (page.length < pageSize) return tasks;
  }
}

export async function createTask(taskData: Partial<Task>): Promise<Task> {
  const payload = {
    title: taskData.title,
    description: taskData.description || '',
    category: taskData.category || 'Personal',
    priority: taskData.priority || 'Medium',
    priorityClassification: taskData.priorityClassification || 'important-not-urgent',
    status: taskData.status || 'Pending',
    date: taskData.date || new Date().toLocaleDateString('en-CA'),
    notes: taskData.notes || '',
    dueDate: taskData.dueDate || undefined,
    estimatedDurationMinutes: taskData.estimatedDurationMinutes || undefined,
  };

  try {
    const response = await api.post('/tasks', payload);
    return response.data.task;
  } catch (err: any) {
    if (err.response) {
      console.error('Backend validation error:', err.response.data);
    }
    throw err;
  }
}

export async function fetchHabits(limit: number = 50, skip: number = 0): Promise<Habit[]> {
  const response = await api.get('/habits', { params: { limit, skip } });
  const habits = response.data?.habits;
  if (
    !Array.isArray(habits) ||
    habits.some((habit: any) => !Array.isArray(habit.completedDateKeys))
  ) {
    throw new Error('Habits response was incomplete.');
  }
  return habits;
}

export async function fetchAllHabits(pageSize: number = 100): Promise<Habit[]> {
  const habits: Habit[] = [];

  for (let skip = 0; ; skip += pageSize) {
    const page = await fetchHabits(pageSize, skip);
    habits.push(...page);
    if (page.length < pageSize) return habits;
  }
}

export async function fetchReflections(limit: number = 30, skip: number = 0): Promise<Reflection[]> {
  const response = await api.get('/reflections', { params: { limit, skip } });
  return response.data.reflections || [];
}

export async function fetchAllReflections(pageSize: number = 100): Promise<Reflection[]> {
  const reflections: Reflection[] = [];

  for (let skip = 0; ; skip += pageSize) {
    const page = await fetchReflections(pageSize, skip);
    reflections.push(...page);
    if (page.length < pageSize) return reflections;
  }
}

export async function createReflection(reflection: Partial<Reflection>): Promise<Reflection> {
  const payload = {
    ...reflection,
    date: reflection.date || localDateKey(),
  };

  const response = await api.post('/reflections', payload);
  return response.data.reflection;
}

export async function updateReflection(reflectionId: string, updates: Partial<Reflection>): Promise<Reflection> {
  const response = await api.put(`/reflections/${reflectionId}`, updates);
  return response.data.reflection;
}

export async function deleteReflection(reflectionId: string): Promise<void> {
  await api.delete(`/reflections/${reflectionId}`);
}

export async function fetchInsights(date?: string): Promise<AdvancedAnalytics> {
  const response = await api.get('/insights/insights', { params: { date } });
  const data = response.data;
  if (
    !data ||
    !Array.isArray(data.insights) ||
    !Number.isFinite(data.scores?.consistency) ||
    !(data.scores?.goalAlignment === null || Number.isFinite(data.scores?.goalAlignment)) ||
    !Number.isFinite(data.summary?.total) ||
    !Number.isFinite(data.summary?.highSeverity) ||
    !Number.isFinite(data.summary?.actionable)
  ) {
    throw new Error('Insights response was incomplete.');
  }

  const insightsArray = data.insights;
  const formattedInsights = insightsArray.map((item: any, index: number) => ({
    id: item._id || `insight-${index}`,
    title: item.title || item.category || item.type || 'Insight',
    detail: item.message || item.detail || '',
  }));

  return {
    insights: formattedInsights,
    scores: {
      consistency: String(data.scores.consistency),
      goalAlignment: data.scores.goalAlignment === null
        ? null
        : String(data.scores.goalAlignment),
    },
    summary: data.summary,
  };
}

export async function fetchProductivityReport(startDate: string, endDate: string): Promise<ProductivityReport> {
  const response = await api.get('/analytics/report', { params: { startDate, endDate } });
  const report = response.data as ProductivityReport;
  if (
    report?.range?.startDate !== startDate ||
    report?.range?.endDate !== endDate ||
    !Array.isArray(report.dailyTasks) ||
    !Array.isArray(report.habits?.daily) ||
    !Array.isArray(report.habits?.performance) ||
    !Array.isArray(report.categories) ||
    !Array.isArray(report.goals?.items) ||
    !Array.isArray(report.journal?.items)
  ) {
    throw new Error('Insights report response was incomplete.');
  }
  return report;
}

export async function fetchHistoryPage(filters: {
  types: HistoryRecordType[];
  search: string;
  startDate?: string;
  endDate?: string;
  taskStatus?: HistoryTaskStatus;
  limit?: number;
  skip: number;
}): Promise<HistoryPageResult> {
  const response = await api.get('/history', {
    params: {
      ...filters,
      types: filters.types.join(','),
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined,
      taskStatus: filters.taskStatus || undefined,
      limit: filters.limit ?? 30,
    },
  });
  const result = response.data as HistoryPageResult;
  if (
    !Array.isArray(result?.events) ||
    typeof result.hasMore !== 'boolean' ||
    !Number.isInteger(result.nextSkip) ||
    result.events.some(event =>
      typeof event.id !== 'string' ||
      typeof event.date !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}$/.test(event.date) ||
      typeof event.title !== 'string'
    )
  ) {
    throw new Error('History response was incomplete.');
  }
  return result;
}

export async function fetchRealitySummary(date?: string): Promise<RealitySummary> {
  const dateStr = date || new Date().toLocaleDateString('en-CA');
  const response = await api.get('/reality-check', { params: { date: dateStr } });
  const summary = response.data?.realityCheck || response.data;
  if (
    !summary ||
    !Number.isFinite(summary.plannedTasks) ||
    !Number.isFinite(summary.completedTasks) ||
    !Number.isFinite(summary.missedTasks) ||
    !Number.isFinite(summary.completionPercentage) ||
    !Array.isArray(summary.categoryBreakdown) ||
    summary.categoryBreakdown.some((category: any) =>
      typeof category.category !== 'string' ||
      !Number.isFinite(category.plannedTasks) ||
      !Number.isFinite(category.completedTasks) ||
      !Number.isFinite(category.missedTasks) ||
      !Number.isFinite(category.completionPercentage)
    )
  ) {
    throw new Error('Daily task summary was incomplete.');
  }

  return summary;
}

export async function createHabit(name: string): Promise<Habit> {
  const response = await api.post('/habits', { name });
  return response.data.habit;
}

export async function deleteHabit(habitId: string): Promise<void> {
  await api.delete(`/habits/${habitId}`);
}

export async function fetchGoals(): Promise<Goal[]> {
  const response = await api.get('/goals');
  return response.data.goals || [];
}

export async function createGoal(goalData: Partial<Goal>): Promise<Goal> {
  const response = await api.post('/goals', goalData);
  return response.data.goal;
}

export async function deleteGoal(goalId: string): Promise<void> {
  await api.delete(`/goals/${goalId}`);
}

export async function markHabitComplete(habitId: string): Promise<Habit> {
  const localDate = localDateKey();
  const response = await api.post(`/habits/${habitId}/complete`, { date: localDate });
  return response.data.habit;
}

export async function updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
  const response = await api.put(`/tasks/${taskId}`, updates);
  return response.data.task;
}

export async function deleteTask(taskId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}`);
}

export async function fetchProfile(): Promise<UserProfile> {
  const response = await api.get('/auth/profile');
  return response.data.user;
}

export async function updateProfile(profile: Pick<UserProfile, 'name' | 'email'>): Promise<UserProfile> {
  const response = await api.put('/auth/profile', profile);
  return response.data.user;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<PasswordChangeResponse> {
  const response = await api.post('/auth/change-password', { currentPassword, newPassword });
  return response.data;
}

export async function deleteProfile(): Promise<void> {
  await api.delete('/auth/profile');
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('avatar', file);
  const response = await api.post('/auth/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data.user;
}
