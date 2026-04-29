import Task from '../models/Task';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';
import Goal from '../models/Goal';
import Insight from '../models/Insight';

interface InsightMetrics {
  currentCompletionRate: number;
  historicalAverage: number;
  percentChange: number;
  trend: 'improving' | 'declining' | 'stable';
}

export class InsightsService {
  static async generateInsights(userId: string): Promise<any> {
    // Fetch data across different time periods for comparison
    const now = new Date();
    
    // Current period (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    // Previous period (7-14 days ago) for comparison
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    
    // Historical data (last 90 days for baseline)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    // Fetch all data in parallel
    const [
      currentTasks,
      previousTasks,
      allTasks,
      habits,
      currentReflections,
      allReflections,
      goals,
    ] = await Promise.all([
      Task.find({ 
        userId, 
        createdAt: { $gte: sevenDaysAgo } 
      }).sort({ createdAt: -1 }).lean(),
      
      Task.find({ 
        userId, 
        createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo }
      }).sort({ createdAt: -1 }).lean(),
      
      Task.find({ 
        userId, 
        createdAt: { $gte: ninetyDaysAgo }
      }).sort({ createdAt: -1 }).lean(),
      
      Habit.find({ userId }).sort({ createdAt: -1 }).lean(),
      
      Reflection.find({ 
        userId, 
        createdAt: { $gte: sevenDaysAgo }
      }).sort({ createdAt: -1 }).lean(),
      
      Reflection.find({ userId }).sort({ createdAt: -1 }).lean(),
      
      Goal.find({ userId }).sort({ createdAt: -1 }).lean(),
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
        const unique = [...new Set(completedDates.map((d: any) => 
          typeof d === 'string' ? d.split('T')[0] : new Date(d).toLocaleDateString('en-CA')
        ))].sort().reverse();
        
        let currentStreak = 0;
        let current = new Date();
        current.setHours(0, 0, 0, 0);
        
        for (const ds of unique) {
          const d = new Date(ds);
          d.setHours(0, 0, 0, 0);
          const dayDiff = Math.round((current.getTime() - d.getTime()) / 86400000);
          if (dayDiff <= 1) { 
            currentStreak++; 
            current = d; 
          } else break;
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
        } else if (currentStreak === 1 && unique.length > 0) {
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

    // Mood Trend Analysis - More lenient thresholds for early data
    if (currentReflections.length > 0) {
      const moods = currentReflections.map((r: any) => r.mood || 0);
      const avgMood = moods.reduce((a: number, b: number) => a + b, 0) / moods.length;
      
      if (avgMood >= 7.5) {
        insights.push({
          type: 'mood',
          title: 'Great Mental State',
          message: `Your mood average is ${avgMood.toFixed(1)}/10. You're feeling positive - great time to tackle ambitious goals!`,
          category: 'Mood & Wellness',
          severity: 'low',
        });
      } else if (avgMood <= 4) {
        insights.push({
          type: 'mood',
          title: 'Wellness Check-in',
          message: `Your mood average is ${avgMood.toFixed(1)}/10. Consider taking a break or reaching out to someone you trust.`,
          category: 'Mood & Wellness',
          severity: 'high',
        });
      } else if (avgMood >= 5 && avgMood < 6.5) {
        // Middle ground - provide supportive insight
        insights.push({
          type: 'mood',
          title: 'Building Momentum',
          message: `Your mood is at ${avgMood.toFixed(1)}/10. Small wins today can lift your spirits higher!`,
          category: 'Mood & Wellness',
          severity: 'low',
        });
      }
    }

    // Productivity Pattern Analysis - Lowered threshold from 3+ to 2+
    if (currentReflections.length >= 2) {
      const productivityScores = currentReflections.map((r: any) => r.productivity || 0).filter((p: number) => p > 0);
      if (productivityScores.length > 0) {
        const avgProductivity = productivityScores.reduce((a: number, b: number) => a + b, 0) / productivityScores.length;
        
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
    }

    // Goal Progress Analysis - Adjusted for early-stage goals
    for (const goal of goals) {
      const goalCreated = new Date(goal.createdAt);
      const daysSinceCreation = Math.floor((now.getTime() - goalCreated.getTime()) / (1000 * 60 * 60 * 24));
      
      // Show insights for all active goals
      if (daysSinceCreation > 30) {
        insights.push({
          type: 'goal',
          title: 'Goal Progress Check',
          message: `"${goal.text}" has been active for ${daysSinceCreation} days. Review your progress and adjust if needed.`,
          category: 'Goal Tracking',
          severity: 'medium',
        });
      } else if (daysSinceCreation > 0) {
        // Show encouragement for new goals
        insights.push({
          type: 'goal',
          title: 'Goal Tracking Started',
          message: `You're tracking "${goal.text}". Keep breaking it down into daily tasks!`,
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
        consistency: Math.round((currentTasksCompleted / (currentTasks.length || 1)) * 100),
        goalAlignment: goals.filter((g: any) => !g.completed).length || 0,
      },
      summary: {
        total: insights.length,
        highSeverity: insights.filter((i: any) => i.severity === 'high').length,
        actionable: insights.length,
      },
    };
  }

  static async dismissInsight(insightId: string): Promise<any> {
    return Insight.findByIdAndUpdate(
      insightId,
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
