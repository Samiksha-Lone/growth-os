import api from './axios';
import type { DashboardStats, Habit, Insight, Reflection, RealitySummary, Task, UserProfile, PomodoroSession } from '../lib/types';

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const today = new Date().toISOString().split('T')[0];
  const [tasks, habits, focus] = await Promise.all([
    api.get('/tasks', { params: { date: today } }),
    api.get('/habits'),
    api.get('/pomodoro/total-focus-time', { params: { startDate: today, endDate: today } }),
  ]);

  const tasksData = tasks.data.tasks || [];
  const habitsData = habits.data.habits || [];

  return {
    tasksToday: tasksData.filter((t: Task) => t.status === 'Completed').length,
    tasksTotal: tasksData.length,
    habitsDone: habitsData.filter((h: Habit) => h.completedDates?.some(d => d.startsWith(today))).length,
    habitsTotal: habitsData.length,
    focusMinutes: focus.data.totalFocusTime || 0,
    score: Math.min(100, Math.round((tasksData.length ?? 0) * 10 + (habitsData.length ?? 0) * 2)),
  };
}

export async function fetchTasks(): Promise<Task[]> {
  const response = await api.get('/tasks');
  return response.data.tasks || [];
}

export async function createTask(taskData: Partial<Task>): Promise<Task> {
  const payload = {
    title: taskData.title,
    description: taskData.description || '',
    category: taskData.category || 'Personal',
    priority: taskData.priority || 'Medium',
    status: taskData.status || 'Pending',
    date: taskData.date || new Date().toISOString(),
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

export async function fetchHabits(): Promise<Habit[]> {
  const response = await api.get('/habits');
  return response.data.habits || [];
}

export async function fetchReflections(): Promise<Reflection[]> {
  const response = await api.get('/reflections');
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

export async function fetchInsights(): Promise<Insight[]> {
  const response = await api.get('/ai/insights');
  const data = response.data.insights || {};

  const insights: Insight[] = [];
  let id = 1;

  Object.entries(data).forEach(([category, items]: [string, any]) => {
    if (Array.isArray(items)) {
      items.forEach((detail: string) => {
        insights.push({
          id: id.toString(),
          title: category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
          detail,
        });
        id++;
      });
    }
  });

  return insights;
}

export async function fetchRealitySummary(): Promise<RealitySummary> {
  const response = await api.get('/reality-check');
  return response.data;
}

export async function createHabit(name: string): Promise<Habit> {
  const response = await api.post('/habits', { name });
  return response.data.habit;
}

export async function markHabitComplete(habitId: string): Promise<Habit> {
  const response = await api.post(`/habits/${habitId}/complete`);
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
