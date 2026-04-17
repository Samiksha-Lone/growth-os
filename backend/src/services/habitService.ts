import Habit, { IHabit } from '../models/Habit';

export class HabitService {
  static async createHabit(habitData: Partial<IHabit>): Promise<IHabit> {
    const habit = new Habit(habitData);
    return habit.save();
  }

  static async markHabitComplete(habitId: string, userId: string, date: Date): Promise<IHabit | null> {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) return null;

    const dateStr = date.toISOString().split('T')[0];
    const completedDate = new Date(dateStr);

    if (!habit.completedDates.some(d => d.toISOString().split('T')[0] === dateStr)) {
      habit.completedDates.push(completedDate);
      habit.streak = this.calculateStreak(habit.completedDates);
      await habit.save();
    }

    return habit;
  }

  static async getHabitStats(habitId: string, userId: string): Promise<any> {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) return null;

    const today = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return date.toISOString().split('T')[0];
    });

    const completionRate = habit.completedDates.length / 30 * 100;

    return {
      habit,
      completionRate: Math.round(completionRate * 100) / 100,
      last30Days: last30Days.map(date => ({
        date,
        completed: habit.completedDates.some(d => d.toISOString().split('T')[0] === date),
      })),
    };
  }

  static async getHabits(userId: string): Promise<IHabit[]> {
    return Habit.find({ userId }).sort({ updatedAt: -1 }).exec();
  }

  static async deleteHabit(habitId: string, userId: string): Promise<boolean> {
    const result = await Habit.findOneAndDelete({ _id: habitId, userId });
    return !!result;
  }

  private static calculateStreak(completedDates: Date[]): number {
    if (completedDates.length === 0) return 0;

    const sortedDates = completedDates.sort((a, b) => b.getTime() - a.getTime());
    let streak = 0;
    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < sortedDates.length; i++) {
      const dateStr = sortedDates[i].toISOString().split('T')[0];
      if (i === 0 && dateStr === today) {
        streak++;
      } else if (i === 0) {
        break;
      } else {
        const prevDate = new Date(sortedDates[i - 1]);
        prevDate.setDate(prevDate.getDate() - 1);
        if (dateStr === prevDate.toISOString().split('T')[0]) {
          streak++;
        } else {
          break;
        }
      }
    }

    return streak;
  }
}