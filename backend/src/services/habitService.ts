import Habit, { IHabit } from '../models/Habit';

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function dateFromLocalDateKey(key: string): Date | null {
  const parts = key.split('-');
  if (parts.length !== 3) return null;
  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);
  if (Number.isNaN(year) || Number.isNaN(month) || Number.isNaN(day)) return null;
  return new Date(year, month, day, 0, 0, 0, 0);
}

export class HabitService {
  static async createHabit(habitData: Partial<IHabit>): Promise<IHabit> {
    const habit = new Habit(habitData);
    return habit.save();
  }

  private static normalizeDateValue(value: any): Date | null {
    if (!value) return null;

    if (value instanceof Date && !isNaN(value.getTime())) {
      return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0);
    }

    if (typeof value === 'string') {
      const localDate = dateFromLocalDateKey(value);
      if (localDate) return localDate;

      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), 0, 0, 0, 0);
      }
    }

    return null;
  }

  static async markHabitComplete(habitId: string, userId: string, date: Date): Promise<IHabit | null> {
    try {
      const habit = await Habit.findOne({ _id: habitId, userId });
      if (!habit) return null;

      habit.completedDates = (habit.completedDates || [])
        .map((d) => this.normalizeDateValue(d))
        .filter((d): d is Date => d !== null);

      const normalizedDate = this.normalizeDateValue(date) ?? new Date();
      const dateKey = localDateKey(normalizedDate);

      const existingKeys = habit.completedDates.map((d) => localDateKey(d));
      if (!existingKeys.includes(dateKey)) {
        habit.completedDates.push(normalizedDate);
        habit.streak = this.calculateStreak(habit.completedDates);
        await habit.save();
      }

      return habit;
    } catch (e) {
      console.error('Error marking habit complete:', e);
      throw e;
    }
  }

  static async getHabitStats(habitId: string, userId: string): Promise<any> {
    const habit = await Habit.findOne({ _id: habitId, userId });
    if (!habit) return null;

    const today = new Date();
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      return localDateKey(date);
    });

    const normalizedDates = habit.completedDates
      .map((d) => this.normalizeDateValue(d))
      .filter((d): d is Date => d !== null)
      .map((d) => localDateKey(d));

    const completionRate = normalizedDates.length / 30 * 100;

    return {
      habit,
      completionRate: Math.round(completionRate * 100) / 100,
      last30Days: last30Days.map(date => ({
        date,
        completed: normalizedDates.includes(date),
      })),
    };
  }

  static async getHabits(userId: string, limit: number = 50, skip: number = 0): Promise<IHabit[]> {
    return Habit.find({ userId })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();
  }

  static async deleteHabit(habitId: string, userId: string): Promise<boolean> {
    const result = await Habit.findOneAndDelete({ _id: habitId, userId });
    return !!result;
  }

  private static calculateStreak(completedDates: Date[]): number {
    if (!completedDates?.length) return 0;

    const dateKeys = [...new Set(
      completedDates
        .map((d) => this.normalizeDateValue(d))
        .filter((d): d is Date => d !== null)
        .map((d) => localDateKey(d))
    )].sort().reverse();

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const key of dateKeys) {
      const completedDate = dateFromLocalDateKey(key);
      if (!completedDate) continue;

      const diff = Math.round((current.getTime() - completedDate.getTime()) / 86400000);
      if (diff === 0 || diff === 1) {
        streak += 1;
        current = completedDate;
      } else {
        break;
      }
    }
    return streak;
  }
}