import Task, { ITask } from '../models/Task';
import { parseLocalDate } from '../utils/dateUtils';

export class TaskService {
  static async createTask(taskData: Partial<ITask>): Promise<ITask> {
    const normalizedDate = parseLocalDate(taskData.date);
    const payload: Partial<ITask> = { ...taskData, date: normalizedDate };
    if (typeof payload.startTime === 'string' && !payload.startTime.trim()) {
      delete payload.startTime;
    }
    const task = new Task(payload);
    return task.save();
  }

  static async getTasks(userId: string, filters: any = {}, limit: number = 20, skip: number = 0): Promise<ITask[]> {
    const query: any = { userId };

    if (filters.date) {
      const date = parseLocalDate(filters.date);
      query.date = {
        $gte: date,
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      };
    }

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;

    return Task.find(query)
      .sort({ date: -1, createdAt: -1 })
      .limit(limit)
      .skip(skip)
      .lean(); // Use lean() for read-only queries
  }

  static async updateTask(taskId: string, userId: string, updates: Partial<ITask>): Promise<ITask | null> {
    const normalizedUpdates = { ...updates } as Partial<ITask>;
    if (updates.date) {
      normalizedUpdates.date = parseLocalDate(updates.date);
    }
    return Task.findOneAndUpdate(
      { _id: taskId, userId },
      normalizedUpdates,
      { new: true, runValidators: true }
    );
  }

  static async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const result = await Task.findOneAndDelete({ _id: taskId, userId });
    return !!result;
  }
}