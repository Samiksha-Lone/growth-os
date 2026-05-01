import Task from '../models/Task';
import { buildDateRange, calculateCompletionRate } from '../utils/dateHelpers';

export class RealityCheckService {
  static async getRealityCheck(userId: string, date: Date): Promise<any> {
    const { startOfDay, endOfDay } = buildDateRange(date);

    const tasks = await Task.find({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    const plannedTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'Completed').length;
    const missedTasks = tasks.filter(task => task.status === 'Missed').length;

    const completionPercentage = calculateCompletionRate(completedTasks, plannedTasks);

    let overPlanningIndicator = false;
    if (plannedTasks > 10) {
      overPlanningIndicator = true;
    }

    return {
      date: date.toISOString().split('T')[0],
      plannedTasks,
      completedTasks,
      missedTasks,
      completionPercentage,
      overPlanningIndicator,
      insights: this.generateInsights(completionPercentage, missedTasks, overPlanningIndicator),
    };
  }

  private static generateInsights(completionPercentage: number, missedTasks: number, overPlanning: boolean): string[] {
    const insights = [];

    if (completionPercentage >= 80) {
      insights.push('Excellent completion rate! You\'re effectively managing your tasks.');
    } else if (completionPercentage >= 50) {
      insights.push('Decent completion rate. Consider reviewing why some tasks weren\'t completed.');
    } else {
      insights.push('Low completion rate. Try setting more realistic goals or breaking tasks into smaller steps.');
    }

    if (missedTasks > 3) {
      insights.push('Several tasks were missed. Review your planning and time management strategies.');
    }

    if (overPlanning) {
      insights.push('You planned many tasks for today. Consider if this is sustainable or if you need to prioritize.');
    }

    return insights;
  }
}