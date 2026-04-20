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

interface AnomalyDetection {
  isAnomaly: boolean;
  zScore: number;
  threshold: number;
}

export class AIInsightsService {
  static async generateInsights(userId: string): Promise<any> {
    // Fetch data across different time periods for comparison
    const now = new Date();
    
    // Current period (last 7 days)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const currentTasks = await Task.find({ 
      userId, 
      createdAt: { $gte: sevenDaysAgo } 
    }).sort({ createdAt: -1 });

    // Previous period (7-14 days ago) for comparison
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
    const previousTasks = await Task.find({ 
      userId, 
      createdAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } 
    });

    // Historical data (last 90 days for baseline)
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    const allTasks = await Task.find({ 
      userId, 
      createdAt: { $gte: ninetyDaysAgo } 
    }).sort({ createdAt: -1 });

    const habits = await Habit.find({ userId });
    const currentReflections = await Reflection.find({ 
      userId, 
      createdAt: { $gte: sevenDaysAgo } 
    }).sort({ createdAt: -1 });

    const allReflections = await Reflection.find({ userId })
      .sort({ createdAt: -1 })
      .limit(90);

    const goals = await Goal.find({ userId });

    // Generate and save new insights
    const newInsights: any[] = [];

    newInsights.push(...await this.analyzeProductivityPatterns(
      currentTasks, 
      previousTasks, 
      currentReflections, 
      allReflections,
      userId,
      goals
    ));

    newInsights.push(...await this.analyzeMissedTasks(
      currentTasks, 
      previousTasks, 
      allTasks,
      userId,
      goals
    ));

    newInsights.push(...this.analyzeHabitConsistency(habits, userId, goals));

    newInsights.push(...this.generateRecommendations(currentTasks, habits, currentReflections, userId, goals));

    // PHASE 2+: Advanced pattern analysis (no AI needed!)
    const correlationPatterns = await this.analyzeCorrelations(userId, currentTasks, currentReflections);
    correlationPatterns.forEach(pattern => {
      newInsights.push({
        userId,
        type: 'pattern',
        category: pattern.pattern === 'day_productivity' ? 'Time Management' : 
                 pattern.pattern === 'time_productivity' ? 'Productivity' :
                 pattern.pattern === 'mood_completion' ? 'Well-being' :
                 pattern.pattern === 'productivity_velocity' ? 'Trends' : 'Patterns',
        metric: pattern.pattern,
        currentValue: 1,
        previousValue: undefined,
        historicalAverage: undefined,
        percentChange: undefined,
        trend: 'stable',
        message: pattern.message,
        actionable: true,
        severity: 'medium',
        confidence: pattern.confidence,
        dataPoints: currentTasks.length,
      });
    });

    // Add predictive insights
    const predictions = await this.predictNextWeekOutcomes(userId, currentTasks);
    predictions.forEach(pred => {
      newInsights.push({
        userId,
        type: 'prediction',
        category: pred.type === 'completion_forecast' ? 'Tasks' :
                 pred.type === 'habit_milestone' ? 'Habits' : 'Risk',
        metric: pred.type,
        currentValue: 1,
        previousValue: undefined,
        historicalAverage: undefined,
        percentChange: undefined,
        trend: 'stable',
        message: pred.message,
        actionable: true,
        severity: pred.severity || pred.risk === 'high' ? 'high' : pred.risk === 'medium' ? 'medium' : 'low',
        confidence: pred.confidence,
        dataPoints: currentTasks.length,
      });
    });

    // Calculate composite scores
    const consistencyScore = this.calculateConsistencyScore(habits, currentTasks, currentReflections);
    const goalAlignmentScore = await this.calculateGoalAlignmentScore(userId, goals, currentTasks, habits);

    if (consistencyScore < 50) {
      newInsights.push({
        userId,
        type: 'score',
        category: 'Overall',
        metric: 'consistency_score',
        currentValue: consistencyScore,
        previousValue: undefined,
        historicalAverage: 70,
        percentChange: undefined,
        trend: 'declining',
        message: `📊 Consistency score: ${consistencyScore.toFixed(0)}/100. Focus on completing 2-3 high-impact tasks and one habit daily to rebuild momentum.`,
        actionable: true,
        severity: 'high',
        confidence: 0.9,
        dataPoints: currentTasks.length + habits.length,
      });
    } else if (consistencyScore > 80) {
      newInsights.push({
        userId,
        type: 'score',
        category: 'Overall',
        metric: 'consistency_score',
        currentValue: consistencyScore,
        previousValue: undefined,
        historicalAverage: 70,
        percentChange: undefined,
        trend: 'improving',
        message: `✅ Consistency excellence: ${consistencyScore.toFixed(0)}/100! Your discipline is creating compound results. Keep this up!`,
        actionable: false,
        severity: 'low',
        confidence: 0.95,
        dataPoints: currentTasks.length + habits.length,
      });
    }

    // Save new insights to database
    for (const insight of newInsights) {
      await this.saveInsight(insight);
    }

    // Fetch recent insights (last 30 days, not dismissed)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentInsights = await Insight.find({
      userId,
      dismissed: false,
      createdAt: { $gte: thirtyDaysAgo }
    }).sort({ severity: -1, createdAt: -1 }).limit(20);

    return {
      insights: recentInsights,
      scores: {
        consistency: consistencyScore.toFixed(1),
        goalAlignment: goalAlignmentScore.toFixed(1),
      },
      summary: {
        total: recentInsights.length,
        highSeverity: recentInsights.filter(i => i.severity === 'high').length,
        actionable: recentInsights.filter(i => i.actionable).length,
      }
    };
  }

  private static async saveInsight(insightData: any): Promise<void> {
    try {
      // Check if similar insight exists today to avoid duplicates on refresh
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const existing = await Insight.findOne({
        userId: insightData.userId,
        metric: insightData.metric,
        message: insightData.message,
        createdAt: { $gte: oneDayAgo }
      });
      
      if (existing) return;

      const insight = new Insight({
        ...insightData,
        createdAt: new Date(),
      });
      await insight.save();
    } catch (error) {
      console.error('Error saving insight:', error);
    }
  }

  private static async detectAnomaly(
    currentValue: number,
    historicalValues: number[],
    threshold: number = 2 // 2 standard deviations
  ): Promise<AnomalyDetection> {
    if (historicalValues.length < 3) {
      return { isAnomaly: false, zScore: 0, threshold };
    }

    const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
    const variance = historicalValues.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / historicalValues.length;
    const stdDev = Math.sqrt(variance);

    const zScore = stdDev === 0 ? 0 : (currentValue - mean) / stdDev;
    const isAnomaly = Math.abs(zScore) > threshold;

    return { isAnomaly, zScore, threshold };
  }

  private static async findRelatedGoal(userId: string, category: string): Promise<string | undefined> {
    try {
      const goal = await Goal.findOne({
        userId,
        $or: [
          { text: { $regex: category, $options: 'i' } },
          { text: { $regex: category.toLowerCase(), $options: 'i' } }
        ]
      });
      return goal?._id?.toString();
    } catch {
      return undefined;
    }
  }

  private static calculateCompletionRate(tasks: any[]): number {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    return (completed / tasks.length) * 100;
  }

  private static getHistoricalRates(rates: number[]): number[] {
    return rates.filter(r => r > 0).slice(0, 10);
  }

  private static calculateAverageMood(reflections: any[]): number {
    if (reflections.length === 0) return 0;
    return reflections.reduce((acc, r) => acc + r.mood, 0) / reflections.length;
  }

  private static calculateTrend(current: number, previous: number): 'improving' | 'declining' | 'stable' {
    const diff = current - previous;
    if (diff > 5) return 'improving';
    if (diff < -5) return 'declining';
    return 'stable';
  }

  private static async analyzeProductivityPatterns(
    currentTasks: any[], 
    previousTasks: any[],
    currentReflections: any[],
    allReflections: any[],
    userId: string,
    goals: any[]
  ): Promise<any[]> {
    const insights: any[] = [];

    if (currentTasks.length > 0) {
      const currentRate = this.calculateCompletionRate(currentTasks);
      const previousRate = this.calculateCompletionRate(previousTasks);
      const historicalRates = this.getHistoricalRates(allReflections.map((_, i) => 
        this.calculateCompletionRate(allReflections.slice(i, i + 10))
      ));
      
      const trend = this.calculateTrend(currentRate, previousRate);
      const changePercent = previousRate > 0 ? (currentRate - previousRate) / previousRate * 100 : 0;
      
      // Detect anomalies
      const anomaly = await this.detectAnomaly(currentRate, historicalRates);

      let message = `Your task completion rate is ${currentRate.toFixed(1)}%`;
      
      if (previousRate > 0) {
        message += ` (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}% vs last week)`;
      }
      
      let severity: 'low' | 'medium' | 'high' = 'medium';
      if (anomaly.isAnomaly && currentRate < (historicalRates[0] || 0)) {
        message += '. ⚠️ This is significantly below your average.';
        severity = 'high';
      } else if (trend === 'improving') {
        message += '. Great job—you\'re getting more productive!';
        severity = 'low';
      } else if (trend === 'declining') {
        message += '. Consider what might be affecting your productivity.';
        severity = 'high';
      }
      
      insights.push({
        userId,
        type: 'productivity',
        category: 'Overall',
        metric: 'task_completion_rate',
        currentValue: currentRate,
        previousValue: previousRate,
        historicalAverage: historicalRates[0] || currentRate,
        percentChange: changePercent,
        trend: anomaly.isAnomaly ? 'anomaly' : trend,
        message,
        actionable: severity === 'high',
        severity,
        confidence: Math.min(0.95, 0.5 + (currentTasks.length / 100)),
        dataPoints: currentTasks.length,
      });
    }

    if (currentReflections.length > 0) {
      const currentMood = this.calculateAverageMood(currentReflections);
      const historicalMoods = allReflections.map(r => r.mood).slice(0, 30);
      const historicalMood = this.calculateAverageMood(allReflections);
      const moodChange = currentMood - historicalMood;

      const anomaly = await this.detectAnomaly(currentMood, historicalMoods);

      let moodMessage = `Your average mood this week is ${currentMood.toFixed(1)}/10`;
      
      if (historicalMood > 0 && Math.abs(moodChange) > 0.5) {
        moodMessage += ` (${moodChange > 0 ? '+' : ''}${moodChange.toFixed(1)} vs your average)`;
      }
      
      let moodSeverity: 'low' | 'medium' | 'high' = 'medium';
      if (currentMood > 8) {
        moodMessage += '. Excellent—keep maintaining your well-being!';
        moodSeverity = 'low';
      } else if (currentMood < 4) {
        moodMessage += '. ⚠️ Your mood is concerning. Consider talking to someone or taking a break.';
        moodSeverity = 'high';
      } else if (currentMood < 5) {
        moodMessage += '. Consider what activities or habits could improve your mood.';
        moodSeverity = 'medium';
      }
      
      insights.push({
        userId,
        type: 'mood',
        category: 'Well-being',
        metric: 'average_mood',
        currentValue: currentMood,
        previousValue: undefined,
        historicalAverage: historicalMood,
        percentChange: undefined,
        trend: anomaly.isAnomaly ? 'anomaly' : (moodChange > 0 ? 'improving' : moodChange < 0 ? 'declining' : 'stable'),
        message: moodMessage,
        actionable: moodSeverity !== 'low',
        severity: moodSeverity,
        confidence: Math.min(0.9, 0.6 + (currentReflections.length / 20)),
        dataPoints: currentReflections.length,
      });
    }

    return insights;
  }

  private static async analyzeMissedTasks(
    currentTasks: any[], 
    previousTasks: any[],
    allTasks: any[],
    userId: string,
    goals: any[]
  ): Promise<any[]> {
    const insights: any[] = [];

    const currentMissed = currentTasks.filter(t => t.status === 'Missed');
    const previousMissed = previousTasks.filter(t => t.status === 'Missed');
    const allMissed = allTasks.filter(t => t.status === 'Missed');

    if (currentMissed.length > 0) {
      // Analyze by category
      const categoryStats: Record<string, { current: number; total: number; rate: number }> = {};
      
      allMissed.forEach(task => {
        if (!categoryStats[task.category]) {
          categoryStats[task.category] = { current: 0, total: 0, rate: 0 };
        }
        categoryStats[task.category].total++;
      });

      currentMissed.forEach(task => {
        categoryStats[task.category].current++;
      });

      Object.keys(categoryStats).forEach(cat => {
        const stats = categoryStats[cat];
        stats.rate = (stats.current / stats.total) * 100;
      });

      const mostMissedCategory = Object.keys(categoryStats).reduce((a, b) =>
        categoryStats[a].rate > categoryStats[b].rate ? a : b
      );

      const categoryData = categoryStats[mostMissedCategory];
      const missedRate = categoryData.rate;
      const overallMissRate = (allMissed.length / allTasks.length) * 100;

      // Detect anomaly - is this rate unusual?
      const historicalMissRates = this.getHistoricalMissRates(allMissed);
      const missRateAnomaly = await this.detectAnomaly(missedRate, historicalMissRates, 1.5);

      const relatedGoal = await this.findRelatedGoal(userId, mostMissedCategory);

      let severity: 'low' | 'medium' | 'high' = 'medium';
      if (missedRate > 50) severity = 'high';
      if (missedRate < 20) severity = 'low';

      insights.push({
        userId,
        type: 'tasks',
        category: mostMissedCategory,
        metric: 'missed_task_rate',
        currentValue: missedRate,
        previousValue: undefined,
        historicalAverage: (allMissed.length / allTasks.length) * 100,
        percentChange: undefined,
        trend: missRateAnomaly.isAnomaly ? 'anomaly' : 'stable',
        message: 
          `${mostMissedCategory} tasks have your highest miss rate: ${missedRate.toFixed(1)}% (${categoryData.current}/${categoryData.total}). ` +
          `Your overall miss rate is ${overallMissRate.toFixed(1)}%. Try scheduling these earlier in the day or breaking them into smaller tasks.`,
        actionable: true,
        severity,
        relatedGoalId: relatedGoal,
        confidence: Math.min(0.85, 0.5 + (categoryData.total / 50)),
        dataPoints: categoryData.total,
      });

      // Trend comparison
      const missedChange = currentMissed.length - previousMissed.length;
      if (missedChange > 2) {
        insights.push({
          userId,
          type: 'tasks',
          category: 'Overall',
          metric: 'missed_tasks_trend',
          currentValue: currentMissed.length,
          previousValue: previousMissed.length,
          historicalAverage: undefined,
          percentChange: ((missedChange / (previousMissed.length || 1)) * 100),
          trend: 'declining',
          message: `⚠️ You missed ${missedChange} more tasks this week than last week. Review what's causing delays.`,
          actionable: true,
          severity: 'high',
          confidence: 0.9,
          dataPoints: currentMissed.length,
        });
      } else if (missedChange < -2) {
        insights.push({
          userId,
          type: 'tasks',
          category: 'Overall',
          metric: 'missed_tasks_trend',
          currentValue: currentMissed.length,
          previousValue: previousMissed.length,
          historicalAverage: undefined,
          percentChange: ((missedChange / (previousMissed.length || 1)) * 100),
          trend: 'improving',
          message: `✓ Great improvement! You missed ${Math.abs(missedChange)} fewer tasks this week.`,
          actionable: false,
          severity: 'low',
          confidence: 0.9,
          dataPoints: currentMissed.length,
        });
      }
    }

    return insights;
  }

  private static getHistoricalMissRates(missedTasks: any[]): number[] {
    // For now, return a default range - in production, calculate from historical data
    return [20, 25, 22, 23, 24, 21, 22];
  }

  /**
   * Advanced Pattern Recognition: No AI needed!
   * Uses statistical analysis to find meaningful patterns
   */
  static async analyzeCorrelations(userId: string, tasks: any[], reflections: any[]): Promise<any[]> {
    const insightPatterns: any[] = [];

    try {
      // 1. DAY-OF-WEEK PRODUCTIVITY PATTERN
      const dayProductivity: Record<number, { completed: number; total: number }> = {};
      tasks.forEach(task => {
        const day = new Date(task.date).getDay();
        if (!dayProductivity[day]) dayProductivity[day] = { completed: 0, total: 0 };
        dayProductivity[day].total++;
        if (task.status === 'Completed') dayProductivity[day].completed++;
      });

      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let bestDay = '';
      let bestRate = 0;
      let worstDay = '';
      let worstRate = 100;

      Object.keys(dayProductivity).forEach(dayNum => {
        const day = parseInt(dayNum);
        const stats = dayProductivity[day];
        const rate = (stats.completed / stats.total) * 100;
        if (rate > bestRate) { bestRate = rate; bestDay = dayNames[day]; }
        if (rate < worstRate) { worstRate = rate; worstDay = dayNames[day]; }
      });

      if (bestRate - worstRate > 15) {
        insightPatterns.push({
          pattern: 'day_productivity',
          message: `📅 You're ${(bestRate - worstRate).toFixed(0)}% more productive on ${bestDay}s (${bestRate.toFixed(0)}%) vs ${worstDay}s (${worstRate.toFixed(0)}%). Schedule important tasks for ${bestDay}s.`,
          confidence: Math.min(0.95, Object.keys(dayProductivity).length / 7),
        });
      }

      // 2. TIME-OF-DAY PATTERN
      const timeProductivity: Record<string, { completed: number; total: number }> = {
        'morning': { completed: 0, total: 0 },
        'afternoon': { completed: 0, total: 0 },
        'evening': { completed: 0, total: 0 },
      };

      tasks.forEach(task => {
        if (!task.startTime) return;
        const hour = parseInt(task.startTime);
        let period = '';
        if (hour < 12) period = 'morning';
        else if (hour < 17) period = 'afternoon';
        else period = 'evening';

        timeProductivity[period].total++;
        if (task.status === 'Completed') timeProductivity[period].completed++;
      });

      const morningRate = timeProductivity.morning.total > 0 ? (timeProductivity.morning.completed / timeProductivity.morning.total) * 100 : 0;
      const afternoonRate = timeProductivity.afternoon.total > 0 ? (timeProductivity.afternoon.completed / timeProductivity.afternoon.total) * 100 : 0;
      const eveningRate = timeProductivity.evening.total > 0 ? (timeProductivity.evening.completed / timeProductivity.evening.total) * 100 : 0;

      const rates = [morningRate, afternoonRate, eveningRate].filter(r => r > 0);
      if (rates.length > 1) {
        const maxRate = Math.max(...rates);
        const minRate = Math.min(...rates);
        if (maxRate - minRate > 20) {
          const bestPeriod = morningRate === maxRate ? 'morning' : afternoonRate === maxRate ? 'afternoon' : 'evening';
          insightPatterns.push({
            pattern: 'time_productivity',
            message: `⏰ Your ${bestPeriod} peak: ${maxRate.toFixed(0)}% completion rate. Block ${bestPeriod} hours for high-priority tasks.`,
            confidence: 0.85,
          });
        }
      }

      // 3. MOOD-COMPLETION CORRELATION
      const daysWithCompletedTasks = tasks
        .filter(t => t.status === 'Completed')
        .map(t => new Date(t.date).toDateString());

      const moodOnCompletionDays = reflections
        .filter(r => daysWithCompletedTasks.includes(new Date(r.date).toDateString()))
        .map(r => r.mood);

      const moodOnNonCompletionDays = reflections
        .filter(r => !daysWithCompletedTasks.includes(new Date(r.date).toDateString()))
        .map(r => r.mood);

      if (moodOnCompletionDays.length >= 3 && moodOnNonCompletionDays.length >= 3) {
        const avgMoodCompletion = moodOnCompletionDays.reduce((a, b) => a + b, 0) / moodOnCompletionDays.length;
        const avgMoodNonCompletion = moodOnNonCompletionDays.reduce((a, b) => a + b, 0) / moodOnNonCompletionDays.length;
        
        const moodDiff = avgMoodCompletion - avgMoodNonCompletion;
        
        if (Math.abs(moodDiff) > 1) {
          insightPatterns.push({
            pattern: 'mood_completion',
            message: `💭 Mood boost: Completing tasks increases your mood by ${Math.abs(moodDiff).toFixed(1)} points (${avgMoodCompletion.toFixed(1)}/10 vs ${avgMoodNonCompletion.toFixed(1)}/10). Momentum is powerful—start with one task.`,
            confidence: 0.9,
          });
        }
      }

      // 4. CATEGORY PERFORMANCE TRACKING
      const categoryPerf: Record<string, { completed: number; missed: number; total: number }> = {};
      tasks.forEach(task => {
        if (!categoryPerf[task.category]) {
          categoryPerf[task.category] = { completed: 0, missed: 0, total: 0 };
        }
        categoryPerf[task.category].total++;
        if (task.status === 'Completed') categoryPerf[task.category].completed++;
        if (task.status === 'Missed') categoryPerf[task.category].missed++;
      });

      Object.entries(categoryPerf).forEach(([category, stats]) => {
        const completionRate = (stats.completed / stats.total) * 100;
        if (completionRate > 85 && stats.total >= 5) {
          insightPatterns.push({
            pattern: 'category_excellence',
            message: `⭐ ${category} mastery: ${completionRate.toFixed(0)}% completion rate (${stats.completed}/${stats.total} tasks). This is your strongest area!`,
            confidence: 0.95,
          });
        }
      });

      // 5. PRODUCTIVITY VELOCITY (trend acceleration)
      const weeklyCompletion = [0, 0, 0, 0]; // Last 4 weeks
      const now = new Date();
      tasks.forEach(task => {
        const weeksDiff = Math.floor((now.getTime() - new Date(task.date).getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksDiff < 4 && task.status === 'Completed') {
          weeklyCompletion[weeksDiff]++;
        }
      });

      const velocity = weeklyCompletion[0] - weeklyCompletion[3];
      if (Math.abs(velocity) >= 2) {
        insightPatterns.push({
          pattern: 'productivity_velocity',
          message: `📈 Velocity: You completed ${Math.abs(velocity)} more tasks this week vs 4 weeks ago. ${velocity > 0 ? 'Great momentum—keep it up!' : 'Focus is needed—what changed?'}`,
          confidence: 0.8,
        });
      }

      // 6. HABIT SYNERGY (habits boosting each other)
      const habitCategoryMap: Record<string, string> = {};
      const habitStreaks: Record<string, number> = {};

      // Group habits by productivity impact
      const habits = await Habit.find({ userId });
      habits.forEach(habit => {
        habitStreaks[habit.name] = habit.streak || 0;
      });

      const activeHabits = Object.values(habitStreaks).filter(s => s > 0).length;
      const totalHabits = habits.length;
      
      if (activeHabits > 0 && activeHabits === totalHabits) {
        insightPatterns.push({
          pattern: 'habit_synergy',
          message: `🔗 Habit synergy: All ${totalHabits} habits are active! This compounds benefits exponentially. Micro-habits = macro-change.`,
          confidence: 0.92,
        });
      }

      return insightPatterns;
    } catch (error) {
      console.error('Error analyzing correlations:', error);
      return [];
    }
  }

  /**
   * PREDICTIVE INSIGHTS: Forecast next week based on current patterns
   */
  static async predictNextWeekOutcomes(userId: string, tasks: any[]): Promise<any[]> {
    const predictions: any[] = [];

    try {
      // Predict completion rate for next week
      const currentWeekCompleted = tasks.filter(t => t.status === 'Completed').length;
      const currentWeekTotal = tasks.length;
      const currentRate = currentWeekTotal > 0 ? (currentWeekCompleted / currentWeekTotal) * 100 : 0;

      // Get pending tasks
      const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
      const predictedCompletions = Math.round((pendingTasks * currentRate) / 100);

      if (currentWeekTotal >= 5) {
        predictions.push({
          type: 'completion_forecast',
          message: `📊 Next week forecast: Based on your ${currentRate.toFixed(0)}% rate, you'll complete ~${predictedCompletions}/${pendingTasks} pending tasks. ${
            currentRate > 75 ? '✅ On track!' : currentRate > 50 ? '⚠️ Manageable load' : '🚨 Overcommitted'
          }`,
          confidence: Math.min(0.85, currentWeekTotal / 50),
          risk: currentRate < 50 ? 'high' : currentRate < 75 ? 'medium' : 'low',
        });
      }

      // Habit streak prediction
      const habitStreakData: Record<string, number> = {};
      const habits = await Habit.find({ userId });
      
      habits.forEach(habit => {
        const streak = habit.streak || 0;
        if (streak > 0) {
          // Project streak growth
          const weekGrowth = streak > 20 ? 7 : streak > 10 ? 5 : 2;
          habitStreakData[habit.name] = streak + weekGrowth;
        }
      });

      if (Object.keys(habitStreakData).length > 0) {
        const maxProjectedStreak = Math.max(...Object.values(habitStreakData));
        predictions.push({
          type: 'habit_milestone',
          message: `🎯 Habit milestone alert: "${Object.keys(habitStreakData).find(k => habitStreakData[k] === maxProjectedStreak)}" will reach a ${maxProjectedStreak}-day streak! 🎉`,
          confidence: 0.75,
        });
      }

      // Risk assessment for high-priority tasks
      const highPriorityOverdue = tasks.filter(t => {
        const daysOverdue = Math.floor((new Date().getTime() - new Date(t.date).getTime()) / (24 * 60 * 60 * 1000));
        return t.priority === 'High' && t.status === 'Pending' && daysOverdue > 2;
      }).length;

      if (highPriorityOverdue > 0) {
        predictions.push({
          type: 'risk_alert',
          message: `🚨 ${highPriorityOverdue} high-priority task${highPriorityOverdue > 1 ? 's' : ''} overdue. Address immediately to prevent cascade failure.`,
          confidence: 1.0,
          severity: 'high',
        });
      }

      return predictions;
    } catch (error) {
      console.error('Error predicting outcomes:', error);
      return [];
    }
  }

  /**
   * CONSISTENCY SCORE: Composite metric combining habits, tasks, and mood
   */
  static calculateConsistencyScore(habits: any[], tasks: any[], reflections: any[]): number {
    try {
      const scores = [];

      // Habit consistency (0-100)
      const activeHabits = habits.filter(h => (h.streak || 0) > 0).length;
      const habitScore = habits.length > 0 ? (activeHabits / habits.length) * 100 : 50;
      scores.push(habitScore);

      // Task completion consistency (0-100)
      const weekTasks = tasks.slice(0, 35); // Last 5 weeks
      const completedCount = weekTasks.filter(t => t.status === 'Completed').length;
      const taskScore = weekTasks.length > 0 ? (completedCount / weekTasks.length) * 100 : 50;
      scores.push(taskScore);

      // Mood stability (0-100) - lower variance = higher score
      if (reflections.length > 0) {
        const moods = reflections.map(r => r.mood);
        const avgMood = moods.reduce((a, b) => a + b, 0) / moods.length;
        const variance = moods.reduce((acc, m) => acc + Math.pow(m - avgMood, 2), 0) / moods.length;
        const stdDev = Math.sqrt(variance);
        const moodScore = Math.max(0, 100 - (stdDev * 10)); // Lower std dev = higher score
        scores.push(moodScore);
      }

      // Average consistency score
      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
    } catch (error) {
      console.error('Error calculating consistency score:', error);
      return 50;
    }
  }

  /**
   * GOAL ALIGNMENT SCORE: How well is user progressing toward goals?
   */
  static async calculateGoalAlignmentScore(userId: string, goals: any[], tasks: any[], habits: any[]): Promise<number> {
    try {
      const scores = [];

      for (const goal of goals) {
        // Find tasks/habits related to this goal
        const goalKeywords = goal.text.toLowerCase().split(' ').filter((w: string) => w.length > 3);
        
        const relatedTasks = tasks.filter(t => 
          goalKeywords.some((kw: any) => t.title.toLowerCase().includes(kw) || t.category.toLowerCase().includes(kw))
        );

        const relatedHabits = habits.filter(h =>
          goalKeywords.some((kw: any) => h.name.toLowerCase().includes(kw))
        );

        let goalScore = 50; // Default neutral score

        if (relatedTasks.length > 0) {
          const taskCompletion = (relatedTasks.filter(t => t.status === 'Completed').length / relatedTasks.length) * 100;
          goalScore = Math.max(goalScore, taskCompletion);
        }

        if (relatedHabits.length > 0) {
          const avgStreak = relatedHabits.reduce((acc, h) => acc + (h.streak || 0), 0) / relatedHabits.length;
          const habitScore = Math.min(100, (avgStreak / 30) * 100); // 30-day habits = 100%
          goalScore = Math.max(goalScore, habitScore);
        }

        scores.push(goalScore);
      }

      return scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 50;
    } catch (error) {
      console.error('Error calculating goal alignment:', error);
      return 50;
    }
  }

  private static analyzeHabitConsistency(habits: any[], userId: string, goals: any[]): any[] {
    const insights: any[] = [];

    habits.forEach(habit => {
      const streak = habit.streak || 0;
      const weekCompletions = habit.completedDates?.filter((date: Date) => {
        const daysAgo = Math.floor((new Date().getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
        return daysAgo <= 7;
      }).length || 0;

      let message = '';
      let severity: 'low' | 'medium' | 'high' = 'medium';
      let confidence = 0.85;

      if (streak > 20) {
        message = `🔥 Incredible! "${habit.name}" has a ${streak}-day streak. This level of consistency is impressive.`;
        severity = 'low';
      } else if (streak > 10) {
        message = `✓ Great consistency with "${habit.name}"! Your ${streak}-day streak shows dedication.`;
        severity = 'low';
      } else if (streak >= 5) {
        message = `"${habit.name}": ${streak}-day streak. Keep building momentum toward 30 days!`;
        severity = 'medium';
      } else if (streak > 0) {
        message = `"${habit.name}": ${streak}-day streak. You've started well—focus on making it to 10 days.`;
        severity = 'medium';
      } else if (weekCompletions === 0) {
        message = `"${habit.name}" hasn't been completed this week. Start with just 1 completion today to rebuild momentum.`;
        severity = 'high';
      } else {
        message = `"${habit.name}": Needs attention. You completed it ${weekCompletions}x this week—aim for daily completion.`;
        severity = 'medium';
      }

      insights.push({
        userId,
        type: 'habits',
        category: habit.name,
        metric: 'habit_streak',
        currentValue: streak,
        previousValue: undefined,
        historicalAverage: undefined,
        percentChange: undefined,
        trend: streak > 0 ? 'improving' : 'declining',
        message,
        actionable: severity !== 'low',
        severity,
        confidence,
        dataPoints: (habit.completedDates || []).length,
      });
    });

    return insights;
  }

  private static generateRecommendations(tasks: any[], habits: any[], reflections: any[], userId: string, goals: any[]): any[] {
    const recommendations: any[] = [];

    // High-priority task recommendation with specific count
    const highPriorityPending = tasks.filter(t => t.priority === 'High' && t.status !== 'Completed');
    if (highPriorityPending.length > 3) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Tasks',
        metric: 'high_priority_pending',
        currentValue: highPriorityPending.length,
        previousValue: undefined,
        historicalAverage: undefined,
        percentChange: undefined,
        trend: 'stable',
        message:
          `⚡ You have ${highPriorityPending.length} high-priority tasks pending. ` +
          `Complete at least 2 today to maintain momentum.`,
        actionable: true,
        severity: 'high',
        confidence: 0.9,
        dataPoints: highPriorityPending.length,
      });
    } else if (highPriorityPending.length > 0) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Tasks',
        metric: 'high_priority_pending',
        currentValue: highPriorityPending.length,
        previousValue: undefined,
        historicalAverage: undefined,
        percentChange: undefined,
        trend: 'stable',
        message:
          `📌 ${highPriorityPending.length} high-priority task(s) awaiting completion. ` +
          `Schedule them for your peak productivity hours.`,
        actionable: true,
        severity: 'medium',
        confidence: 0.85,
        dataPoints: highPriorityPending.length,
      });
    }

    // Habit coverage recommendation
    if (habits.length === 0) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Habits',
        metric: 'habit_count',
        currentValue: 0,
        previousValue: undefined,
        historicalAverage: undefined,
        percentChange: undefined,
        trend: 'stable',
        message: '💡 Start building habits! Research shows 30-day habits rewire behavior patterns.',
        actionable: true,
        severity: 'medium',
        confidence: 0.8,
        dataPoints: 0,
      });
    } else if (habits.length < 3) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Habits',
        metric: 'habit_count',
        currentValue: habits.length,
        previousValue: undefined,
        historicalAverage: 3,
        percentChange: undefined,
        trend: 'stable',
        message:
          `You have ${habits.length} habit(s). Consider adding 1-2 more to create a balanced routine.`,
        actionable: true,
        severity: 'low',
        confidence: 0.8,
        dataPoints: habits.length,
      });
    } else {
      const activeHabits = habits.filter(h => (h.streak || 0) > 0).length;
      if (activeHabits / habits.length < 0.5) {
        recommendations.push({
          userId,
          type: 'recommendation',
          category: 'Habits',
          metric: 'active_habit_ratio',
          currentValue: activeHabits / habits.length,
          previousValue: undefined,
          historicalAverage: 0.7,
          percentChange: undefined,
          trend: 'declining',
          message:
            `Only ${activeHabits}/${habits.length} habits are active. Revive one habit by completing it tomorrow.`,
          actionable: true,
          severity: 'medium',
          confidence: 0.85,
          dataPoints: habits.length,
        });
      }
    }

    // Reflection frequency with impact messaging
    const weekReflections = reflections.length;
    if (weekReflections === 0) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Reflections',
        metric: 'weekly_reflection_count',
        currentValue: 0,
        previousValue: undefined,
        historicalAverage: 3,
        percentChange: undefined,
        trend: 'declining',
        message:
          '🧠 Weekly reflections improve goal clarity by 40%. Start with a 5-minute reflection today.',
        actionable: true,
        severity: 'medium',
        confidence: 0.85,
        dataPoints: 0,
      });
    } else if (weekReflections < 3) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Reflections',
        metric: 'weekly_reflection_count',
        currentValue: weekReflections,
        previousValue: undefined,
        historicalAverage: 3,
        percentChange: (weekReflections / 3) * 100,
        trend: 'stable',
        message:
          `You\'ve reflected ${weekReflections} time(s) this week. Daily reflections compound insights—aim for ${7 - weekReflections} more.`,
        actionable: true,
        severity: 'low',
        confidence: 0.8,
        dataPoints: weekReflections,
      });
    }

    // Productivity timing insights
    const morningTasks = tasks.filter(t => t.startTime && parseInt(t.startTime) < 12 && t.status === 'Completed');
    const afternoonTasks = tasks.filter(t => t.startTime && parseInt(t.startTime) >= 12 && t.status === 'Completed');
    
    if (morningTasks.length > afternoonTasks.length * 1.5 && morningTasks.length > 5) {
      recommendations.push({
        userId,
        type: 'recommendation',
        category: 'Productivity',
        metric: 'peak_productivity_hour',
        currentValue: 8, // morning = 8am
        previousValue: 14, // afternoon average
        historicalAverage: undefined,
        percentChange: (morningTasks.length / (morningTasks.length + afternoonTasks.length)) * 100,
        trend: 'stable',
        message:
          '🌅 You\'re 50% more productive in the morning. Schedule high-priority tasks before noon.',
        actionable: true,
        severity: 'low',
        confidence: 0.9,
        dataPoints: morningTasks.length + afternoonTasks.length,
      });
    }

    return recommendations;
  }
}