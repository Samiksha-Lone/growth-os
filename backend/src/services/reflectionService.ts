import Reflection, { IReflection } from '../models/Reflection';
import { buildDateRange } from '../utils/dateHelpers';

export class ReflectionService {
  static async createReflection(reflectionData: Partial<IReflection>): Promise<IReflection> {
    const reflection = new Reflection(reflectionData);
    return reflection.save();
  }

  static async getReflectionByDate(userId: string, date: string): Promise<IReflection | null> {
    const queryDate = new Date(date);
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
      .sort({ date: -1 })
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