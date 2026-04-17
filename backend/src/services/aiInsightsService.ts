import Task from '../models/Task';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';

export class AIInsightsService {
  static async generateInsights(userId: string): Promise<any> {
    // Mock AI analysis - in real implementation, integrate with OpenAI or similar
    const tasks = await Task.find({ userId }).sort({ createdAt: -1 }).limit(50);
    const habits = await Habit.find({ userId });
    const reflections = await Reflection.find({ userId }).sort({ createdAt: -1 }).limit(30);

    const insights = {
      productivityPatterns: this.analyzeProductivityPatterns(tasks, reflections),
      missedTaskTrends: this.analyzeMissedTasks(tasks),
      habitConsistencyFeedback: this.analyzeHabitConsistency(habits),
      recommendations: this.generateRecommendations(tasks, habits, reflections),
    };

    return insights;
  }

  private static analyzeProductivityPatterns(tasks: any[], reflections: any[]): string[] {
    const patterns = [];

    if (tasks.length > 0) {
      const completedTasks = tasks.filter(t => t.status === 'Completed').length;
      const completionRate = (completedTasks / tasks.length) * 100;

      if (completionRate > 80) {
        patterns.push('You have excellent task completion rate. Keep up the great work!');
      } else if (completionRate > 50) {
        patterns.push('Your task completion is decent. Focus on completing more tasks daily.');
      } else {
        patterns.push('Task completion rate needs improvement. Try breaking tasks into smaller steps.');
      }
    }

    if (reflections.length > 0) {
      const avgMood = reflections.reduce((acc, r) => acc + r.mood, 0) / reflections.length;
      if (avgMood > 7) {
        patterns.push('Your mood has been consistently positive. Great job maintaining well-being!');
      } else if (avgMood < 5) {
        patterns.push('Consider activities that boost your mood and overall well-being.');
      }
    }

    return patterns;
  }

  private static analyzeMissedTasks(tasks: any[]): string[] {
    const missedTasks = tasks.filter(t => t.status === 'Missed');
    const trends = [];

    if (missedTasks.length > 0) {
      const categories = missedTasks.reduce((acc, task) => {
        acc[task.category] = (acc[task.category] || 0) + 1;
        return acc;
      }, {});

      const mostMissedCategory = Object.keys(categories).reduce((a, b) =>
        categories[a] > categories[b] ? a : b
      );

      trends.push(`You tend to miss tasks in the ${mostMissedCategory} category. Consider prioritizing these.`);
    }

    return trends;
  }

  private static analyzeHabitConsistency(habits: any[]): string[] {
    const feedback: string[] = [];

    habits.forEach(habit => {
      if (habit.streak > 10) {
        feedback.push(`Great consistency with "${habit.name}"! Your ${habit.streak}-day streak is impressive.`);
      } else if (habit.streak === 0) {
        feedback.push(`"${habit.name}" hasn't been completed recently. Try starting small to build momentum.`);
      }
    });

    return feedback;
  }

  private static generateRecommendations(tasks: any[], habits: any[], reflections: any[]): string[] {
    const recommendations = [];

    if (tasks.filter(t => t.priority === 'High' && t.status !== 'Completed').length > 3) {
      recommendations.push('You have several high-priority tasks pending. Focus on completing these first.');
    }

    if (habits.length < 3) {
      recommendations.push('Consider adding more habits to build better routines.');
    }

    if (reflections.length < 7) {
      recommendations.push('Daily reflections can help track your progress. Try reflecting more often.');
    }

    return recommendations;
  }
}