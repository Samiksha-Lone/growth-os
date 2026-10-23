import Reflection, { IReflection } from '../models/Reflection';
import { buildDateRange, localDateKey } from '../utils/dateHelpers';
import { parseLocalDate } from '../utils/dateUtils';

export class ReflectionService {
  static async createReflection(reflectionData: Partial<IReflection>): Promise<IReflection> {
    const date = parseLocalDate(reflectionData.date);
    const { startOfDay, endOfDay } = buildDateRange(date);
    const existing = await Reflection.findOne({
      userId: reflectionData.userId,
      date: { $gte: startOfDay, $lt: endOfDay },
    });

    if (existing) {
      existing.date = date;
      existing.goodThings = reflectionData.goodThings ?? [];
      existing.badThings = reflectionData.badThings ?? [];
      existing.learnings = reflectionData.learnings ?? [];
      existing.mood = reflectionData.mood!;
      existing.productivityScore = reflectionData.productivityScore!;
      return existing.save();
    }

    const reflection = new Reflection({ ...reflectionData, date });
    return reflection.save();
  }

  static async getReflectionByDate(userId: string, date: string): Promise<IReflection | null> {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const queryDate = parseLocalDate(date);
    if (localDateKey(queryDate) !== date) return null;
    const { startOfDay, endOfDay } = buildDateRange(queryDate);
    return Reflection.findOne({
      userId,
      date: {
        $gte: startOfDay,
        $lt: endOfDay,
      },
    });
  }

  static async getReflections(userId: string, limit: number = 30, skip: number = 0): Promise<IReflection[]> {
    return Reflection.find({ userId })
      .sort({ date: -1, updatedAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean()
      .exec();
  }

  static async updateReflection(reflectionId: string, userId: string, updates: Partial<IReflection>): Promise<IReflection | null> {
    return Reflection.findOneAndUpdate(
      { _id: reflectionId, userId },
      updates,
      { new: true, runValidators: true }
    );
  }
}