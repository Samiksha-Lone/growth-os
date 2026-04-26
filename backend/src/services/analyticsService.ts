import Task from '../models/Task';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';

export class AnalyticsService {
  static async getDailyCompletionRate(userId: string, date: Date): Promise<number> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const result = await Task.aggregate([
      {
        $match: {
          userId: { $eq: userId },
          date: { $gte: startOfDay, $lt: endOfDay },
        },
      },
      {
        $facet: {
          total: [{ $count: 'count' }],
          completed: [
            { $match: { status: 'Completed' } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const totalCount = result[0].total[0]?.count || 0;
    const completedCount = result[0].completed[0]?.count || 0;

    if (totalCount === 0) return 0;
    return Math.round((completedCount / totalCount) * 100);
  }

  static async getWeeklyCompletionTrend(userId: string): Promise<any[]> {
    const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date range
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);

    // Fetch all tasks for the week in ONE query
    const tasks = await Task.find({
      userId,
      date: { $gte: sixDaysAgo, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) },
    });

    // Group and calculate in memory
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTasks = tasks.filter(
        t => t.date >= dayStart && t.date < dayEnd
      );
      const completed = dayTasks.filter(t => t.status === 'Completed').length;
      const rate = dayTasks.length === 0 ? 0 : Math.round((completed / dayTasks.length) * 100);

      trend.push({
        day: shortDays[d.getDay()],
        value: rate,
      });
    }
    return trend;
  }

  static async getWeeklyStats(userId: string, startDate: Date): Promise<any> {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);

    // Use aggregation pipeline for better performance
    const result = await Task.aggregate([
      {
        $match: {
          userId: { $eq: userId },
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const stats = result[0].stats[0] || { totalTasks: 0, completedTasks: 0 };
    const completionRate = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

    // Get habit stats
    const habits = await Habit.find({ userId });
    const habitCompletionRate = habits.length > 0
      ? habits.reduce((acc, habit) => acc + (habit.completedDates.length / 7 * 100), 0) / habits.length
      : 0;

    return {
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
      completionRate,
      habitCompletionRate: Math.round(habitCompletionRate),
    };
  }

  static async getMonthlyStats(userId: string, month: number, year: number): Promise<any> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 1);

    // Use aggregation pipeline
    const result = await Task.aggregate([
      {
        $match: {
          userId: { $eq: userId },
          date: { $gte: startDate, $lt: endDate },
        },
      },
      {
        $facet: {
          stats: [
            {
              $group: {
                _id: null,
                totalTasks: { $sum: 1 },
                completedTasks: {
                  $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
                },
              },
            },
          ],
        },
      },
    ]);

    const stats = result[0].stats[0] || { totalTasks: 0, completedTasks: 0 };
    const completionRate = stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

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
      totalTasks: stats.totalTasks,
      completedTasks: stats.completedTasks,
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
    }).sort({ date: 1 }).lean(); // Use lean() for read-only queries

    return reflections.map(r => ({
      date: r.date.toISOString().split('T')[0],
      mood: r.mood,
      productivity: r.productivityScore,
    }));
  }
}