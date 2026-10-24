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
      existing.goodThings = reflectionData.goodThings ?? existing.goodThings;
      existing.badThings = reflectionData.badThings ?? existing.badThings;
      existing.learnings = reflectionData.learnings ?? existing.learnings;
      if (reflectionData.notes !== undefined) existing.notes = reflectionData.notes;
      if (reflectionData.mood !== undefined) existing.mood = reflectionData.mood;
      if (reflectionData.productivityScore !== undefined) existing.productivityScore = reflectionData.productivityScore;
      return existing.save();
    }

    const reflection = new Reflection({ ...reflectionData, date });
    try {
      return await reflection.save();
    } catch (error) {
      if (!error || typeof error !== 'object' || !('code' in error) || error.code !== 11000) {
        throw error;
      }

      const concurrentEntry = await Reflection.findOne({
        userId: reflectionData.userId,
        date: { $gte: startOfDay, $lt: endOfDay },
      });
      if (!concurrentEntry) throw error;

      concurrentEntry.goodThings = reflectionData.goodThings ?? concurrentEntry.goodThings;
      concurrentEntry.badThings = reflectionData.badThings ?? concurrentEntry.badThings;
      concurrentEntry.learnings = reflectionData.learnings ?? concurrentEntry.learnings;
      if (reflectionData.notes !== undefined) concurrentEntry.notes = reflectionData.notes;
      if (reflectionData.mood !== undefined) concurrentEntry.mood = reflectionData.mood;
      if (reflectionData.productivityScore !== undefined) {
        concurrentEntry.productivityScore = reflectionData.productivityScore;
      }
      return concurrentEntry.save();
    }
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

  static async deleteReflection(reflectionId: string, userId: string): Promise<boolean> {
    const result = await Reflection.findOneAndDelete({ _id: reflectionId, userId });
    return result !== null;
  }
}