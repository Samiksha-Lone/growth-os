import Goal, { IGoal } from '../models/Goal';

export class GoalService {
  static async addGoal(goalData: Partial<IGoal>): Promise<IGoal> {
    const goal = new Goal(goalData);
    return goal.save();
  }

  static async getGoals(userId: string): Promise<IGoal[]> {
    return Goal.find({ userId }).sort({ createdAt: -1 });
  }

  static async deleteGoal(goalId: string, userId: string): Promise<boolean> {
    const result = await Goal.findOneAndDelete({ _id: goalId, userId });
    return !!result;
  }
}