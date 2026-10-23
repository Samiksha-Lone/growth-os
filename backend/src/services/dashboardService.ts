import mongoose from 'mongoose';
import Task from '../models/Task';
import Habit from '../models/Habit';
import { buildDateRange, localDateKey } from '../utils/dateHelpers';
import { summarizeTasks } from '../utils/taskMetrics';

interface DashboardStats {
  tasksToday: number;
  tasksTotal: number;
  habitsDone: number;
  habitsTotal: number;
  score: number;
  weeklyTrend: Array<{ day: string; value: number }>;
}

export class DashboardService {
  static async getDashboardStats(userId: string, date: Date): Promise<DashboardStats> {
    const { startOfDay, endOfDay } = buildDateRange(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - 6);
    const weekEnd = new Date(today);
    weekEnd.setDate(today.getDate() + 1);
    const canReuseWeeklyTasks = startOfDay >= weekStart && endOfDay <= weekEnd;

    const [weeklyTasks, habitStats, datedTaskStats] = await Promise.all([
      Task.find({
        userId,
        date: { $gte: weekStart, $lt: weekEnd },
      }).select('date status').lean(),
      this.getHabitStats(userId, date),
      canReuseWeeklyTasks
        ? Promise.resolve(null)
        : this.getTaskStats(userId, startOfDay, endOfDay),
    ]);

    const dailySummary = summarizeTasks(
      weeklyTasks.filter(task => task.date >= startOfDay && task.date < endOfDay)
    );
    const taskStats = datedTaskStats ?? {
      total: dailySummary.plannedTasks,
      completed: dailySummary.completedTasks,
    };
    const weeklyTrend = this.buildWeeklyTrend(weeklyTasks, today);
    const score = Math.min(
      100,
      Math.round(taskStats.completed * 15 + habitStats.completed * 5)
    );

    return {
      tasksToday: taskStats.completed,
      tasksTotal: taskStats.total,
      habitsDone: habitStats.completed,
      habitsTotal: habitStats.total,
      score,
      weeklyTrend,
    };
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

  private static async getTaskStats(
    userId: string,
    startOfDay: Date,
    endOfDay: Date
  ): Promise<{ total: number; completed: number }> {
    const summary = await Task.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfDay, $lt: endOfDay },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] },
          },
        },
      },
    ]);

    return {
      total: summary[0]?.total ?? 0,
      completed: summary[0]?.completed ?? 0,
    };
  }

  private static buildWeeklyTrend(
    tasks: Array<{ date: Date; status: string }>,
    today: Date
  ): Array<{ day: string; value: number }> {
    const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStart = new Date(d);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(d);
      dayEnd.setDate(dayEnd.getDate() + 1);

      const dayTasks = tasks.filter(t => t.date >= dayStart && t.date < dayEnd);
      const rate = summarizeTasks(dayTasks).completionPercentage;

      trend.push({
        day: shortDays[d.getDay()],
        value: rate,
      });
    }

    return trend;
  }
}
