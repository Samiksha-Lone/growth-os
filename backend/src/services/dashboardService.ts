import Task from '../models/Task';
import Habit from '../models/Habit';
import PomodoroSession from '../models/PomodoroSession';
import { appCache, getDashboardCacheKey } from '../utils/cache';
import { buildDateRange, localDateKey } from '../utils/dateHelpers';
import mongoose from 'mongoose';

interface DashboardStats {
  tasksToday: number;
  tasksTotal: number;
  habitsDone: number;
  habitsTotal: number;
  focusMinutes: number;
  score: number;
  weeklyTrend: Array<{ day: string; value: number }>;
}

export class DashboardService {
  static async getDashboardStats(userId: string, date: Date): Promise<DashboardStats> {
    const { startOfDay, endOfDay } = buildDateRange(date);

    // Get all data with optimized parallel queries - No caching for real-time accuracy
    const [taskStats, habitStats, focusTime, weeklyTrend] = await Promise.all([
      this.getTaskStats(userId, startOfDay, endOfDay),
      this.getHabitStats(userId, date),
      this.getFocusTime(userId, startOfDay, endOfDay),
      this.getWeeklyTrend(userId),
    ]);

    const score = Math.min(
      100,
      Math.round(taskStats.completed * 15 + habitStats.completed * 5)
    );

    return {
      tasksToday: taskStats.completed,
      tasksTotal: taskStats.total,
      habitsDone: habitStats.completed,
      habitsTotal: habitStats.total,
      focusMinutes: focusTime,
      score,
      weeklyTrend,
    };
  }

  private static async getTaskStats(
    userId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<{ total: number; completed: number }> {
    const query = {
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    };

    const [total, completed] = await Promise.all([
      Task.countDocuments(query),
      Task.countDocuments({ ...query, status: 'Completed' }),
    ]);

    return { total, completed };
  }

  private static async getHabitStats(
    userId: string,
    date: Date
  ): Promise<{ total: number; completed: number }> {
    const habits = await Habit.find({ userId }).lean();
    const dateKey = localDateKey(date);

    let completed = 0;
    habits.forEach(habit => {
      const completedKeys = (habit.completedDates || [])
        .map(d => localDateKey(new Date(d)))
        .filter((key: string | null): key is string => key !== null);

      if (completedKeys.includes(dateKey)) {
        completed++;
      }
    });

    return { total: habits.length, completed };
  }

  private static async getFocusTime(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<number> {
    const sessions = await PomodoroSession.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    }).lean();

    return sessions.reduce((acc, session) => acc + (session.duration || 0), 0);
  }

  private static async getWeeklyTrend(userId: string): Promise<Array<{ day: string; value: number }>> {
    const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);

    // Single query to get all tasks for the week
    const tasks = await Task.find({
      userId,
      date: { $gte: sixDaysAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    }).lean();

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTasks = tasks.filter(t => t.date >= dayStart && t.date < dayEnd);
      const completed = dayTasks.filter(t => t.status === 'Completed').length;
      const rate = dayTasks.length === 0 ? 0 : Math.round((completed / dayTasks.length) * 100);

      trend.push({
        day: shortDays[d.getDay()],
        value: rate,
      });
    }

    return trend;
  }
  private static localDateKey(date: Date): string {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }
}
