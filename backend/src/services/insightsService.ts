import Task from '../models/Task';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';
import Goal from '../models/Goal';
import Insight from '../models/Insight';
import { normalizeMoodScore } from '../utils/reflectionMetrics';
import { dateFromLocalDateKey, localDateKey, normalizeDateValue } from '../utils/dateHelpers';
import { parseLocalDate } from '../utils/dateUtils';

export class InsightsService {
  static async generateInsights(userId: string, date?: string): Promise<any> {
    const today = parseLocalDate(date ?? new Date());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const currentPeriodStart = new Date(today);
    currentPeriodStart.setDate(currentPeriodStart.getDate() - 6);
    const previousPeriodStart = new Date(currentPeriodStart);
    previousPeriodStart.setDate(previousPeriodStart.getDate() - 7);
    const historicalStart = new Date(today);
    historicalStart.setDate(historicalStart.getDate() - 89);
    
    // Fetch all data in parallel
    const [
      currentTasks,
      previousTasks,
      allTasks,
      habits,
      currentReflections,
      goals,
    ] = await Promise.all([
      Task.find({ 
        userId, 
        date: { $gte: currentPeriodStart, $lt: tomorrow }
      }).sort({ createdAt: -1 }).lean(),
      
      Task.find({ 
        userId, 
        date: { $gte: previousPeriodStart, $lt: currentPeriodStart }
      }).sort({ createdAt: -1 }).lean(),
      
      Task.find({ 
        userId, 
        date: { $gte: historicalStart, $lt: tomorrow }
      }).sort({ createdAt: -1 }).lean(),
      
      Habit.find({ userId }).sort({ createdAt: -1 }).lean(),
      
      Reflection.find({ 
        userId, 
        date: { $gte: currentPeriodStart, $lt: tomorrow }
      }).sort({ createdAt: -1 }).lean(),
      
      Goal.find({ userId, type: 'goal' }).sort({ createdAt: -1 }).lean(),
    ]);

    const insights: any[] = [];

    // Task Completion Analysis
    const currentTasksCompleted = currentTasks.filter((t: any) => t.status === 'Completed').length;
    const previousTasksCompleted = previousTasks.filter((t: any) => t.status === 'Completed').length;
    
    if (currentTasks.length > 0) {
      const currentCompletionRate = (currentTasksCompleted / currentTasks.length) * 100;
      const previousCompletionRate = previousTasks.length > 0 
        ? (previousTasksCompleted / previousTasks.length) * 100 
        : 0;
      
      if (previousTasks.length > 0 && currentCompletionRate > previousCompletionRate + 10) {
        insights.push({
          type: 'task',
          title: 'Great Task Momentum',
          message: `You're completing tasks at a higher rate this week (${Math.round(currentCompletionRate)}% vs ${Math.round(previousCompletionRate)}% last week). Keep it up!`,
          category: 'Task Completion',
          severity: 'low',
        });
      } else if (previousTasks.length > 0 && currentCompletionRate < previousCompletionRate - 10) {
        insights.push({
          type: 'task',
          title: 'Task Completion Dip',
          message: `Your task completion rate has decreased (${Math.round(currentCompletionRate)}% vs ${Math.round(previousCompletionRate)}% last week). Consider breaking tasks into smaller steps.`,
          category: 'Task Completion',
          severity: 'medium',
        });
      } else if (previousTasks.length === 0) {
        // Early-stage insight: Show completion rate progress
        insights.push({
          type: 'task',
          title: 'Your Progress So Far',
          message: `You've completed ${currentTasksCompleted} out of ${currentTasks.length} tasks (${Math.round(currentCompletionRate)}%). Keep tracking your work!`,
          category: 'Task Completion',
          severity: 'low',
        });
      }
    }

    // Habit Streak Analysis - Lowered thresholds for early-stage users
    for (const habit of habits) {
      const completedDates = habit.completedDates || [];
      if (completedDates.length > 0) {
        const todayKey = localDateKey(today);
        const completedKeys = new Set(completedDates
          .map((date: any) => normalizeDateValue(date))
          .filter((date: Date | null): date is Date => date !== null)
          .map((date: Date) => localDateKey(date))
          .filter((key: string) => key <= todayKey));
        let cursor = dateFromLocalDateKey(todayKey);
        let currentStreak = 0;

        if (cursor && !completedKeys.has(todayKey)) {
          cursor.setDate(cursor.getDate() - 1);
          if (!completedKeys.has(localDateKey(cursor))) cursor = null;
        }

        while (cursor && completedKeys.has(localDateKey(cursor))) {
          currentStreak++;
          cursor.setDate(cursor.getDate() - 1);
        }
        
        // Show streak if 3+ days (lowered from 7+ for early users)
        if (currentStreak >= 3) {
          insights.push({
            type: 'habit',
            title: `${currentStreak}-Day ${habit.name} Streak!`,
            message: `You've maintained "${habit.name}" for ${currentStreak} consecutive days. This consistency will create lasting change!`,
            category: 'Habit Building',
            severity: 'low',
          });
        } else if (currentStreak === 1) {
          // Encourage early starters
          insights.push({
            type: 'habit',
            title: `Started "${habit.name}"`,
            message: `Great start with "${habit.name}"! Complete it again tomorrow to build momentum.`,
            category: 'Habit Building',
            severity: 'low',
          });
        }
      }
    }

    // Values above 3 come from historical records that used a 1-10 mood scale.
    const moods = currentReflections
      .map((reflection: any) => normalizeMoodScore(reflection.mood))
      .filter((mood: number | null): mood is number => mood !== null);

    if (moods.length >= 2) {
      const avgMood = moods.reduce((total: number, mood: number) => total + mood, 0) / moods.length;

      if (avgMood >= 2.4) {
        insights.push({
          type: 'mood',
          title: 'Great Mental State',
          message: `Your mood average is ${avgMood.toFixed(1)}/3. You're feeling positive - great time to tackle ambitious goals!`,
          category: 'Mood & Wellness',
          severity: 'low',
        });
      } else if (avgMood <= 1.7) {
        insights.push({
          type: 'mood',
          title: 'Wellness Check-in',
          message: `Your mood average is ${avgMood.toFixed(1)}/3. Consider taking a break or reaching out to someone you trust.`,
          category: 'Mood & Wellness',
          severity: 'high',
        });
      } else if (avgMood >= 1.8 && avgMood < 2.3) {
        // Middle ground - provide supportive insight
        insights.push({
          type: 'mood',
          title: 'Building Momentum',
          message: `Your mood is at ${avgMood.toFixed(1)}/3. Small wins today can lift your spirits higher!`,
          category: 'Mood & Wellness',
          severity: 'low',
        });
      }
    }

    // Productivity Pattern Analysis requires at least two valid persisted scores.
    const productivityScores = currentReflections
      .map((reflection: any) => reflection.productivityScore)
      .filter((score: any): score is number =>
        typeof score === 'number' && Number.isFinite(score) && score >= 1 && score <= 10
      );

    if (productivityScores.length >= 2) {
      const avgProductivity = productivityScores.reduce((total: number, score: number) => total + score, 0) / productivityScores.length;

      if (avgProductivity >= 6.5) {
        insights.push({
          type: 'productivity',
          title: 'Strong Productivity',
          message: `You're maintaining a solid productivity average (${avgProductivity.toFixed(1)}/10). Identify what's working and maintain these habits.`,
          category: 'Productivity',
          severity: 'low',
        });
      }
    }

    // Goals store no completion or progress state, so only encourage recently added goals.
    for (const goal of goals) {
      const createdKey = localDateKey(new Date(goal.createdAt));
      const createdDate = dateFromLocalDateKey(createdKey);
      const todayDate = dateFromLocalDateKey(localDateKey(today));
      const daysSinceCreation = createdDate && todayDate
        ? Math.round((todayDate.getTime() - createdDate.getTime()) / 86400000)
        : -1;

      if (daysSinceCreation >= 0 && daysSinceCreation <= 30) {
        insights.push({
          type: 'goal',
          title: 'Goal Tracking Started',
          message: `You're tracking "${goal.text}". Consider breaking it into smaller steps.`,
          category: 'Goal Tracking',
          severity: 'low',
        });
      }
    }

    // Category-wise Task Breakdown
    const categories: { [key: string]: { total: number; completed: number } } = {};
    currentTasks.forEach((task: any) => {
      const cat = task.category || 'Other';
      if (!categories[cat]) categories[cat] = { total: 0, completed: 0 };
      categories[cat].total++;
      if (task.status === 'Completed') categories[cat].completed++;
    });

    for (const [cat, data] of Object.entries(categories)) {
      const rate = Math.round((data.completed / data.total) * 100);
      if (rate < 40) {
        insights.push({
          type: 'task',
          title: `Low Completion: ${cat}`,
          message: `Only ${rate}% of "${cat}" tasks are completed. Break these tasks down or reassess priorities.`,
          category: 'Task Categories',
          severity: 'medium',
        });
      }
    }

    // Ensure at least one insight exists - show data summary for new users
    if (insights.length === 0) {
      insights.push({
        type: 'task',
        title: 'Your GrowthOS Dashboard',
        message: `You have ${allTasks.length} tasks tracked and ${habits.length} habits. Keep logging your activities to see personalized insights!`,
        category: 'Getting Started',
        severity: 'low',
      });
    }

    // Return formatted insights
    return {
      insights: insights.slice(0, 10), // Limit to 10 most relevant insights
      scores: {
        consistency: currentTasks.length
          ? Math.round((currentTasksCompleted / currentTasks.length) * 100)
          : 0,
        goalAlignment: null,
      },
      summary: {
        total: insights.length,
        highSeverity: insights.filter((i: any) => i.severity === 'high').length,
        actionable: insights.length,
      },
    };
  }

  static async dismissInsight(insightId: string, userId: string): Promise<any> {
    return Insight.findOneAndUpdate(
      { _id: insightId, userId },
      {
        dismissed: true,
        dismissedAt: new Date(),
      },
      { new: true }
    );
  }

  static async getInsightHistory(userId: string, limit = 50, type?: string, metric?: string): Promise<any[]> {
    const query: any = { userId };
    if (type) query.type = type;
    if (metric) query.category = metric;

    return Insight.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  static async getInsightStats(userId: string): Promise<any> {
    const insights = await Insight.find({ userId }).lean();
    const total = insights.length;
    const byType = {
      task: insights.filter((i: any) => i.type === 'task').length,
      habit: insights.filter((i: any) => i.type === 'habit').length,
      mood: insights.filter((i: any) => i.type === 'mood').length,
      productivity: insights.filter((i: any) => i.type === 'productivity').length,
      goal: insights.filter((i: any) => i.type === 'goal').length,
    };

    return { total, byType };
  }
}
