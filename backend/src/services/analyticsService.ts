import Task from '../models/Task';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';
import { buildDateRange, calculateCompletionRate } from '../utils/dateHelpers';
import { normalizeMoodScore } from '../utils/reflectionMetrics';
import mongoose from 'mongoose';
import Goal from '../models/Goal';
import { localDateKey, normalizeDateValue } from '../utils/dateHelpers';

export interface ProductivityReport {
  range: { startDate: string; endDate: string };
  today: {
    plannedTasks: number;
    completedTasks: number;
    completionRate: number | null;
    missedTasks: number;
    unfinishedTasks: number;
    overdueTasks: number;
    dueHabits: number;
    completedHabits: number;
  };
  tasks: {
    planned: number;
    completed: number;
    completionRate: number | null;
    missed: number;
    unfinished: number;
    overdue: number;
  };
  habits: {
    completedHabitDays: number;
    eligibleHabitDays: number;
    completionRate: number | null;
    daily: Array<{ date: string; completed: number; eligible: number; completionRate: number | null }>;
    performance: Array<{
      id: string;
      name: string;
      completedDays: number;
      eligibleDays: number;
      completionRate: number | null;
      currentStreak: number;
      bestStreak: number;
      sufficientData: boolean;
    }>;
  };
  dailyTasks: Array<{
    date: string;
    planned: number;
    completed: number;
    completionRate: number | null;
    missed: number;
    unfinished: number;
    overdue: number;
  }>;
  categories: Array<{
    category: string;
    planned: number;
    completed: number;
    completionRate: number | null;
    missed: number;
    unfinished: number;
  }>;
  goals: {
    savedGoals: number;
    affirmations: number;
    createdInRange: number;
    items: Array<{ id: string; text: string; type: 'goal' | 'affirmation'; createdAt: string }>;
    tracksCompletion: false;
  };
  journal: {
    entries: number;
    moodAverage: number | null;
    moods: Array<{ date: string; mood: number }>;
    items: Array<{ date: string; mood: number | null; goodThings: string[]; badThings: string[]; learnings: string[]; notes?: string }>;
  };
}

export class AnalyticsService {
  static async getProductivityReport(
    userId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ProductivityReport> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { startOfDay: start, endOfDay: end } = buildDateRange(startDate);
    const { endOfDay: endExclusive } = buildDateRange(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = localDateKey(today);
    const startKey = localDateKey(startDate);
    const endKey = localDateKey(endDate);

    const [tasks, habits, goals, reflections] = await Promise.all([
      Task.find({ userId: userObjectId, date: { $gte: start, $lt: endExclusive } }).lean(),
      Habit.find({ userId: userObjectId }).lean(),
      Goal.find({ userId: userObjectId }).sort({ createdAt: -1 }).lean(),
      Reflection.find({ userId: userObjectId, date: { $gte: start, $lt: endExclusive } })
        .sort({ date: -1 })
        .lean(),
    ]);

    const dateKeys: string[] = [];
    const cursor = new Date(startDate);
    while (cursor <= endDate) {
      dateKeys.push(localDateKey(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }

    const getTaskCounts = (periodTasks: typeof tasks) => {
      const planned = periodTasks.length;
      const completed = periodTasks.filter(task => task.status === 'Completed').length;
      const missed = periodTasks.filter(task => task.status === 'Missed').length;
      const unfinished = periodTasks.filter(task =>
        task.status === 'Pending' || task.status === 'In Progress'
      ).length;
      const overdue = periodTasks.filter(task => {
        if (task.status === 'Completed' || !task.dueDate) return false;
        const dueDate = normalizeDateValue(task.dueDate);
        return dueDate !== null && localDateKey(dueDate) < todayKey;
      }).length;

      return {
        planned,
        completed,
        completionRate: planned ? Math.round(completed / planned * 100) : null,
        missed,
        unfinished,
        overdue,
      };
    };

    const dailyTasks = dateKeys.map(dateKey => ({
      date: dateKey,
      ...getTaskCounts(tasks.filter(task => localDateKey(task.date) === dateKey)),
    }));
    const taskCounts = getTaskCounts(tasks);
    const categoryMap = new Map<string, typeof tasks>();
    tasks.forEach(task => {
      const grouped = categoryMap.get(task.category) ?? [];
      grouped.push(task);
      categoryMap.set(task.category, grouped);
    });
    const categories = [...categoryMap.entries()]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, categoryTasks]) => {
        const summary = getTaskCounts(categoryTasks);
        return {
          category,
          planned: summary.planned,
          completed: summary.completed,
          completionRate: summary.completionRate,
          missed: summary.missed,
          unfinished: summary.unfinished,
        };
      });

    const habitDaily = dateKeys.map(dateKey => ({ date: dateKey, completed: 0, eligible: 0 }));
    const habitDailyByDate = new Map(habitDaily.map(day => [day.date, day]));
    const performance = habits.map(habit => {
      const createdDate = normalizeDateValue(habit.createdAt);
      const createdKey = createdDate ? localDateKey(createdDate) : startKey;
      const completedKeys = new Set(
        habit.completedDates
          .map(date => normalizeDateValue(date))
          .filter((date): date is Date => date !== null)
          .map(date => localDateKey(date))
      );
      const eligibleKeys = dateKeys.filter(dateKey => dateKey >= createdKey);
      const completedKeysInRange = eligibleKeys.filter(dateKey => completedKeys.has(dateKey));

      eligibleKeys.forEach(dateKey => {
        const day = habitDailyByDate.get(dateKey);
        if (day) {
          day.eligible += 1;
          if (completedKeys.has(dateKey)) day.completed += 1;
        }
      });

      let bestStreak = 0;
      let currentRun = 0;
      eligibleKeys.forEach(dateKey => {
        if (completedKeys.has(dateKey)) {
          currentRun += 1;
          bestStreak = Math.max(bestStreak, currentRun);
        } else {
          currentRun = 0;
        }
      });

      let currentStreak = 0;
      const streakStart = completedKeys.has(todayKey)
        ? today
        : (() => {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return completedKeys.has(localDateKey(yesterday)) ? yesterday : null;
          })();
      if (streakStart) {
        const streakCursor = new Date(streakStart);
        while (completedKeys.has(localDateKey(streakCursor))) {
          currentStreak += 1;
          streakCursor.setDate(streakCursor.getDate() - 1);
        }
      }

      return {
        id: habit._id.toString(),
        name: habit.name,
        completedDays: completedKeysInRange.length,
        eligibleDays: eligibleKeys.length,
        completionRate: eligibleKeys.length
          ? Math.round(completedKeysInRange.length / eligibleKeys.length * 100)
          : null,
        currentStreak,
        bestStreak,
        sufficientData: eligibleKeys.length >= 7,
      };
    });
    const completedHabitDays = performance.reduce((total, habit) => total + habit.completedDays, 0);
    const eligibleHabitDays = performance.reduce((total, habit) => total + habit.eligibleDays, 0);
    const dailyHabits = habitDaily.map(day => ({
      ...day,
      completionRate: day.eligible ? Math.round(day.completed / day.eligible * 100) : null,
    }));

    const todayTasks = localDateKey(startDate) <= todayKey && todayKey <= localDateKey(endDate)
      ? tasks.filter(task => localDateKey(task.date) === todayKey)
      : await Task.find({
          userId: userObjectId,
          date: { $gte: buildDateRange(today).startOfDay, $lt: buildDateRange(today).endOfDay },
        }).lean();
    const todayCounts = getTaskCounts(todayTasks);
    const todayHabits = habits.filter(habit => {
      const createdDate = normalizeDateValue(habit.createdAt);
      return createdDate !== null && localDateKey(createdDate) <= todayKey;
    });
    const todayCompletedHabits = todayHabits.filter(habit =>
      habit.completedDates.some(date => {
        const normalized = normalizeDateValue(date);
        return normalized !== null && localDateKey(normalized) === todayKey;
      })
    ).length;

    const goalItems = goals.map(goal => ({
      id: goal._id.toString(),
      text: goal.text,
      type: goal.type,
      createdAt: goal.createdAt.toISOString(),
    }));
    const moodItems = reflections.flatMap(reflection => {
      const mood = normalizeMoodScore(reflection.mood);
      return mood === null ? [] : [{ date: localDateKey(reflection.date), mood }];
    });
    const moodAverage = moodItems.length
      ? Math.round(moodItems.reduce((total, item) => total + item.mood, 0) / moodItems.length * 100) / 100
      : null;

    return {
      range: { startDate: startKey, endDate: endKey },
      today: {
        plannedTasks: todayCounts.planned,
        completedTasks: todayCounts.completed,
        completionRate: todayCounts.completionRate,
        missedTasks: todayCounts.missed,
        unfinishedTasks: todayCounts.unfinished,
        overdueTasks: todayCounts.overdue,
        dueHabits: todayHabits.length,
        completedHabits: todayCompletedHabits,
      },
      tasks: {
        planned: taskCounts.planned,
        completed: taskCounts.completed,
        completionRate: taskCounts.completionRate,
        missed: taskCounts.missed,
        unfinished: taskCounts.unfinished,
        overdue: taskCounts.overdue,
      },
      habits: {
        completedHabitDays,
        eligibleHabitDays,
        completionRate: eligibleHabitDays
          ? Math.round(completedHabitDays / eligibleHabitDays * 100)
          : null,
        daily: dailyHabits,
        performance,
      },
      dailyTasks,
      categories,
      goals: {
        savedGoals: goals.filter(goal => goal.type === 'goal').length,
        affirmations: goals.filter(goal => goal.type === 'affirmation').length,
        createdInRange: goals.filter(goal => {
          if (goal.type !== 'goal') return false;
          const createdKey = localDateKey(goal.createdAt);
          return createdKey >= startKey && createdKey <= endKey;
        }).length,
        items: goalItems,
        tracksCompletion: false,
      },
      journal: {
        entries: reflections.length,
        moodAverage,
        moods: moodItems.sort((left, right) => left.date.localeCompare(right.date)),
        items: reflections.map(reflection => ({
          date: localDateKey(reflection.date),
          mood: normalizeMoodScore(reflection.mood),
          goodThings: reflection.goodThings ?? [],
          badThings: reflection.badThings ?? [],
          learnings: reflection.learnings ?? [],
          notes: reflection.notes,
        })),
      },
    };
  }

  static async getDailyCompletionRate(userId: string, date: Date): Promise<number> {
    const { startOfDay, endOfDay } = buildDateRange(date);
    const userObjectId = new mongoose.Types.ObjectId(userId);

    const result = await Task.aggregate([
      {
        $match: {
          userId: userObjectId,
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

    return calculateCompletionRate(completedCount, totalCount);
  }

  static async getWeeklyCompletionTrend(userId: string): Promise<any[]> {
    const shortDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Calculate date range
    const sixDaysAgo = new Date(today);
    sixDaysAgo.setDate(today.getDate() - 6);
    
    const userObjectId = new mongoose.Types.ObjectId(userId);

    // Fetch all tasks for the week in ONE query
    const tasks = await Task.find({
      userId: userObjectId,
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
      const rate = calculateCompletionRate(completed, dayTasks.length);

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
    const completionRate = calculateCompletionRate(stats.completedTasks, stats.totalTasks);

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
    const completionRate = calculateCompletionRate(stats.completedTasks, stats.totalTasks);

    const reflections = await Reflection.find({
      userId,
      date: { $gte: startDate, $lt: endDate },
    });

    const moodScores = reflections
      .map(reflection => normalizeMoodScore(reflection.mood))
      .filter((mood): mood is number => mood !== null);

    const avgMood = moodScores.length > 0
      ? moodScores.reduce((acc, mood) => acc + mood, 0) / moodScores.length
      : 0;

    const productivityScores = reflections
      .map(reflection => reflection.productivityScore)
      .filter((score): score is number => typeof score === 'number' && Number.isFinite(score));
    const avgProductivity = productivityScores.length > 0
      ? productivityScores.reduce((acc, score) => acc + score, 0) / productivityScores.length
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

    return reflections.flatMap(reflection => {
      const mood = normalizeMoodScore(reflection.mood);
      return mood === null
        ? []
        : [{
            date: reflection.date.toISOString().split('T')[0],
            mood,
            productivity: typeof reflection.productivityScore === 'number'
              ? reflection.productivityScore
              : null,
          }];
    });
  }
}