import Task, { ITask } from '../models/Task';

export class TaskService {
  static async createTask(taskData: Partial<ITask>): Promise<ITask> {
    const task = new Task(taskData);
    return task.save();
  }

  static async getTasks(userId: string, filters: any = {}): Promise<ITask[]> {
    const query: any = { userId };

    if (filters.date) {
      const date = new Date(filters.date);
      query.date = {
        $gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()),
        $lt: new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1),
      };
    }

    if (filters.status) query.status = filters.status;
    if (filters.category) query.category = filters.category;
    if (filters.priority) query.priority = filters.priority;

    return Task.find(query).sort({ createdAt: -1 });
  }

  static async updateTask(taskId: string, userId: string, updates: Partial<ITask>): Promise<ITask | null> {
    return Task.findOneAndUpdate(
      { _id: taskId, userId },
      updates,
      { new: true, runValidators: true }
    );
  }

  static async deleteTask(taskId: string, userId: string): Promise<boolean> {
    const result = await Task.findOneAndDelete({ _id: taskId, userId });
    return !!result;
  }
}