import PomodoroSession, { IPomodoroSession } from '../models/PomodoroSession';

export class PomodoroService {
  static async createSession(sessionData: Partial<IPomodoroSession>): Promise<IPomodoroSession> {
    const session = new PomodoroSession(sessionData);
    return session.save();
  }

  static async getSessions(userId: string, date?: Date): Promise<IPomodoroSession[]> {
    const query: any = { userId };

    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(endOfDay.getDate() + 1);
      query.date = { $gte: startOfDay, $lt: endOfDay };
    }

    return PomodoroSession.find(query)
      .sort({ createdAt: -1 })
      .lean();
  }

  static async getTotalFocusTime(userId: string, startDate?: Date, endDate?: Date): Promise<number> {
    const query: any = { userId };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lt: endDate };
    }

    // Use aggregation pipeline for better performance
    const result = await PomodoroSession.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          total: { $sum: '$duration' }
        }
      }
    ]);

    return result[0]?.total || 0;
  }
}