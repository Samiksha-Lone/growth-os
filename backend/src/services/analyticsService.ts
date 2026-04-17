import Task from '../models/Task';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';

export class AnalyticsService {
  static async getDailyCompletionRate(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const tasks = await Task.find({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (tasks.length === 0) return 0;

    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    return Math.round((completedTasks / tasks.length) * 100);
  }

  static async getWeeklyStats(userId: string, startDate: Date): Promise<any> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    const tasks = await Task.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    });

    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const habits = await Habit.find({ userId });
    const habitCompletionRate = habits.length > 0
      ? habits.reduce((acc, habit) => acc + (habit.completedDates.length / 7 * 100), 0) / habits.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      habitCompletionRate: Math.round(habitCompletionRate),
    };
  }

  static async getMonthlyStats(userId: string, month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    const tasks = await Task.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    });

    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const totalTasks = tasks.length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const reflections = await Reflection.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    });

    const avgMood = reflections.length > 0
      ? reflections.reduce((acc, r) => acc + r.mood, 0) / reflections.length
      : 0;

    const avgProductivity = reflections.length > 0
      ? reflections.reduce((acc, r) => acc + r.productivityScore, 0) / reflections.length
      : 0;

    return {
      totalTasks,
      completedTasks,
      completionRate,
      avgMood: Math.round(avgMood * 100) / 100,
      avgProductivity: Math.round(avgProductivity * 100) / 100,
    };
  }

  static async getHabitConsistency(userId: string): Promise<number> {
    const habits = await Habit.find({ userId });
    if (habits.length === 0) return 0;

    const totalConsistency = habits.reduce((acc, habit) => {
      const daysSinceCreation = Math.floor((Date.now() - habit.createdAt.getTime()) / (1000 * 60 * 60 * 24));
      const expectedCompletions = Math.min(daysSinceCreation, 30); // last 30 days
      const actualCompletions = habit.completedDates.filter(date => {
        const diff = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24);
        return diff <= 30;
      }).length;
      return acc + (expectedCompletions > 0 ? actualCompletions / expectedCompletions : 0);
    }, 0);

    return Math.round((totalConsistency / habits.length) * 100);
  }

  static async getMoodTrends(userId: string, days: number = 30): Promise<any[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const reflections = await Reflection.find({
      userId,
      date: { $gte: startDate },
    }).sort({ date: 1 });

    return reflections.map(r => ({
      date: r.date.toISOString().split('T')[0],
      mood: r.mood,
      productivity: r.productivityScore,
    }));
  }
}