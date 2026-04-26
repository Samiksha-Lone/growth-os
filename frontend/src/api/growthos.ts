import api from './axios';
import type { DashboardStats, Goal, Habit, AdvancedAnalytics, Reflection, RealitySummary, Task, UserProfile, PomodoroSession } from '../lib/types';

export async function fetchDashboardStats(date?: string): Promise<DashboardStats> {
  const dateStr = date || new Date().toLocaleDateString('en-CA');
  const [tasks, habits, focus] = await Promise.all([
    // Fetch only 50 tasks for the dashboard
    api.get('/tasks', { params: { date: dateStr, limit: 50, skip: 0 } }),
    // Fetch only 20 habits for the dashboard
    api.get('/habits', { params: { limit: 20, skip: 0 } }),
    api.get('/pomodoro/total-focus-time', { params: { startDate: dateStr, endDate: dateStr } }),
  ]);

  const tasksData = tasks.data.tasks || [];
  const habitsData = habits.data.habits || [];

  const completedTasks = tasksData.filter((t: Task) => t.status === 'Completed').length;
  const completedHabits = habitsData.filter((h: Habit) => h.completedDates?.some(d => d.startsWith(dateStr))).length;

  return {
    tasksToday: completedTasks,
    tasksTotal: tasksData.length,
    habitsDone: completedHabits,
    habitsTotal: habitsData.length,
    focusMinutes: focus.data.totalFocusTime || 0,
    score: Math.min(100, Math.round((completedTasks * 15) + (completedHabits * 5))),
  };
}

export async function fetchWeeklyChartData(): Promise<{ day: string; value: number }[]> {
  try {
    const response = await api.get('/analytics/weekly-trend');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch weekly trend:', error);
    return [];
  }
}

export async function fetchTasks(date?: string, limit: number = 20, skip: number = 0): Promise<Task[]> {
  const response = await api.get('/tasks', { params: { date, limit, skip } });
  return response.data.tasks || [];
}

export async function createTask(taskData: Partial<Task>): Promise<Task> {
  const payload = {
    title: taskData.title,
    description: taskData.description || '',
    category: taskData.category || 'Personal',
    priority: taskData.priority || 'Medium',
    status: taskData.status || 'Pending',
    date: taskData.date || new Date().toLocaleDateString('en-CA'),
    notes: taskData.notes || '',
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
  return response.data.habits || [];
}

export async function fetchReflections(limit: number = 30, skip: number = 0): Promise<Reflection[]> {
  const response = await api.get('/reflections', { params: { limit, skip } });
  return response.data.reflections || [];
}

export async function createReflection(reflection: Partial<Reflection>): Promise<Reflection> {
  const payload = {
    ...reflection,
    date: reflection.date || new Date().toISOString(),
  };

  const response = await api.post('/reflections', payload);
  return response.data.reflection;
}

export async function fetchInsights(): Promise<AdvancedAnalytics> {
  try {
    const response = await api.get('/insights/insights');
    
    console.log('Insights API Response:', response.data);
    
    // Handle the response from backend
    const data = response.data;
    
    // Ensure insights is an array
    let insightsArray = Array.isArray(data.insights) ? data.insights : [];
    
    // Format insights
    const formattedInsights = insightsArray.map((item: any, index: number) => ({
      id: item._id || `insight-${index}`,
      title: item.title || item.category || item.type || 'Insight',
      detail: item.message || item.detail || '',
    }));

    // Format scores as strings
    const scores = {
      consistency: String(data.scores?.consistency ?? '0'),
      goalAlignment: String(data.scores?.goalAlignment ?? '0'),
    };

    return {
      insights: formattedInsights,
      scores,
      summary: data.summary || { total: 0, highSeverity: 0, actionable: 0 }
    };
  } catch (error: any) {
    console.error('Error fetching insights:', error);
    // Don't throw - return empty insights so the UI shows the "learning patterns" message
    return {
      insights: [],
      scores: { consistency: '0', goalAlignment: '0' },
      summary: { total: 0, highSeverity: 0, actionable: 0 }
    };
  }
}

export async function fetchRealitySummary(date?: string): Promise<RealitySummary> {
  const dateStr = date || new Date().toLocaleDateString('en-CA');
  const response = await api.get('/reality-check', { params: { date: dateStr } });
  return response.data.realityCheck || response.data; // Handle both nested and flat responses
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
  const localDate = new Date().toLocaleDateString('en-CA');
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

export async function updateProfile(profile: UserProfile): Promise<UserProfile> {
  const response = await api.put('/auth/profile', profile);
  return response.data.user;
}

export async function deleteProfile(): Promise<void> {
  await api.delete('/auth/profile');
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const formData = new FormData();
  formData.append('avatar', file);
  
  const response = await api.post('/auth/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data.user;
}

export async function savePomodoroSession(session: PomodoroSession): Promise<PomodoroSession> {
  const response = await api.post('/pomodoro/sessions', session);
  return response.data.session;
}
