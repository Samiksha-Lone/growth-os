import Reflection, { IReflection } from '../models/Reflection';

export class ReflectionService {
  static async createReflection(reflectionData: Partial<IReflection>): Promise<IReflection> {
    const reflection = new Reflection(reflectionData);
    return reflection.save();
  }

  static async getReflectionByDate(userId: string, date: string): Promise<IReflection | null> {
    const queryDate = new Date(date);
    return Reflection.findOne({
      userId,
      date: {
        $gte: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate()),
        $lt: new Date(queryDate.getFullYear(), queryDate.getMonth(), queryDate.getDate() + 1),
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