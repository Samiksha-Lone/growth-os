import Task from '../models/Task';
import { buildDateRange, localDateKey } from '../utils/dateHelpers';
import { summarizeTasks } from '../utils/taskMetrics';

export class RealityCheckService {
  static async getRealityCheck(userId: string, date: Date): Promise<any> {
    const { startOfDay, endOfDay } = buildDateRange(date);

    const tasks = await Task.find({
      userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    const { plannedTasks, completedTasks, missedTasks, completionPercentage } = summarizeTasks(tasks);
    const tasksByCategory = new Map<string, typeof tasks>();
    tasks.forEach(task => {
      const categoryTasks = tasksByCategory.get(task.category) ?? [];
      categoryTasks.push(task);
      tasksByCategory.set(task.category, categoryTasks);
    });
    const categoryBreakdown = [...tasksByCategory]
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([category, categoryTasks]) => {
        const summary = summarizeTasks(categoryTasks);
        return {
          category,
          plannedTasks: summary.plannedTasks,
          completedTasks: summary.completedTasks,
          missedTasks: summary.missedTasks,
          completionPercentage: summary.completionPercentage,
        };
      });

    let overPlanningIndicator = false;
    if (plannedTasks > 10) {
      overPlanningIndicator = true;
    }

    return {
      date: localDateKey(date),
      plannedTasks,
      completedTasks,
      missedTasks,
      completionPercentage,
      categoryBreakdown,
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