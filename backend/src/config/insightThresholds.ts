/**
 * Smart Insight Thresholds
 * These are intelligent defaults that adapt based on user data
 * Rather than hardcoded global thresholds, these are starting points
 * The actual system calculates per-user baselines from historical data
 */

export const INSIGHT_THRESHOLDS = {
  // Anomaly detection
  anomaly: {
    standardDeviations: 2.0, // Z-score threshold for anomalies
    taskMissRate: 1.5, // Lower threshold for task miss rate detection
  },

  // Productivity patterns
  productivity: {
    excellentRate: 80, // Starting benchmark
    goodRate: 60,
    needsImprovementRate: 40,
    minDataPoints: 5, // Minimum tasks to calculate rate
    dayOfWeekThreshold: 15, // % diff to flag day-of-week pattern
    timeOfDayThreshold: 20, // % diff to flag time-of-day pattern
  },

  // Mood insights
  mood: {
    excellentMood: 8,
    positiveRange: 7,
    concerningRange: 5,
    criticalMood: 4,
    moodChangeThreshold: 1, // Significant mood change
  },

  // Habit consistency
  habits: {
    excellentStreak: 20,
    goodStreak: 10,
    buildingStreak: 5,
    minimumStreak: 1,
    consecutiveDaysRequired: 7,
  },

  // Task analysis
  tasks: {
    missRateCritical: 50, // > 50% miss rate = critical
    missRateWarning: 30, // > 30% miss rate = warning
    highPriorityThreshold: 3, // > 3 pending = action needed
    overdueDaysThreshold: 2, // > 2 days overdue = flag
  },

  // Goal alignment
  goals: {
    perfectAlignment: 90,
    goodAlignment: 75,
    needsAttention: 50,
    minDataPointsForScore: 3,
  },

  // Consistency scoring
  consistency: {
    excellentScore: 80,
    goodScore: 60,
    needsWorkScore: 40,
    criticalScore: 20,
  },

  // Correlation confidence thresholds
  correlation: {
    highConfidence: 0.8,
    mediumConfidence: 0.6,
    lowConfidence: 0.4,
    moodTasksCorrelationThreshold: 1, // 1 point mood difference
    productivityPatternMinDays: 7,
  },

  // Forecast/Prediction
  forecast: {
    minHistoricalWeeks: 2, // Minimum data for forecast
    completionTrendThreshold: 2, // Task difference to flag trend
    habitStreakVelocity: [2, 5, 7], // Expected growth at different stages
  },

  // Insights configuration
  insights: {
    maxInsightsPerGeneration: 15, // Avoid insight overload
    minConfidenceToDisplay: 0.5, // Don't show low-confidence insights
    severityWeights: {
      high: 3,
      medium: 2,
      low: 1,
    },
    refreshInterval: 24 * 60 * 60 * 1000, // Regenerate every 24 hours
  },
};

/**
 * Adaptive Thresholds: Personalized per user based on their patterns
 * This function adjusts thresholds based on user's historical baseline
 */
export function getPersonalizedThresholds(
  userHistoricalData: {
    avgCompletionRate: number;
    avgMood: number;
    avgStreakLength: number;
    taskVolume: number;
  }
) {
  const thresholds = { ...INSIGHT_THRESHOLDS };

  // Adjust productivity thresholds based on historical average
  if (userHistoricalData.avgCompletionRate > 0) {
    thresholds.productivity.excellentRate = userHistoricalData.avgCompletionRate + 15;
    thresholds.productivity.goodRate = userHistoricalData.avgCompletionRate;
    thresholds.productivity.needsImprovementRate = Math.max(
      20,
      userHistoricalData.avgCompletionRate - 20
    );
  }

  // Adjust mood thresholds based on baseline
  if (userHistoricalData.avgMood > 0) {
    thresholds.mood.excellentMood = userHistoricalData.avgMood + 2;
    thresholds.mood.positiveRange = userHistoricalData.avgMood + 1;
    thresholds.mood.concerningRange = Math.max(
      1,
      userHistoricalData.avgMood - 2
    );
  }

  // Adjust habit expectations based on past performance
  if (userHistoricalData.avgStreakLength > 0) {
    thresholds.habits.excellentStreak = Math.max(
      20,
      userHistoricalData.avgStreakLength * 2
    );
    thresholds.habits.goodStreak = userHistoricalData.avgStreakLength;
  }

  return thresholds;
}

/**
 * Risk Level Calculator: Determine severity based on multiple factors
 */
export function calculateRiskLevel(
  factors: {
    missRate?: number;
    overdueDays?: number;
    moodScore?: number;
    habitStreakDrop?: number;
  }
): 'low' | 'medium' | 'high' {
  let riskScore = 0;

  if (factors.missRate && factors.missRate > 40) riskScore += 3;
  else if (factors.missRate && factors.missRate > 20) riskScore += 1;

  if (factors.overdueDays && factors.overdueDays > 5) riskScore += 3;
  else if (factors.overdueDays && factors.overdueDays > 2) riskScore += 1;

  if (factors.moodScore && factors.moodScore < 4) riskScore += 3;
  else if (factors.moodScore && factors.moodScore < 5) riskScore += 1;

  if (factors.habitStreakDrop && factors.habitStreakDrop > 5) riskScore += 2;

  if (riskScore >= 4) return 'high';
  if (riskScore >= 2) return 'medium';
  return 'low';
}
