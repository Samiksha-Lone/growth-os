import mongoose from 'mongoose';
import Goal from '../models/Goal';
import Habit from '../models/Habit';
import Reflection from '../models/Reflection';
import Task from '../models/Task';
import { buildDateRange, localDateKey } from '../utils/dateHelpers';

export type HistoryRecordType = 'task' | 'habit' | 'goal' | 'affirmation' | 'journal';
export type HistoryTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Missed';

export interface HistoryFilters {
  types: HistoryRecordType[];
  search: string;
  startDate?: Date;
  endDate?: Date;
  taskStatus?: HistoryTaskStatus;
  limit: number;
  skip: number;
}

export interface HistoryEvent {
  id: string;
  type: HistoryRecordType;
  date: string;
  sortTimestamp: number;
  title: string;
  detail?: string;
  status?: HistoryTaskStatus;
  plannedDate?: string;
  dueDate?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  mood?: number | null;
  goodThings?: string[];
  badThings?: string[];
  learnings?: string[];
  notes?: string;
}

const typeOrder: Record<HistoryRecordType, number> = {
  task: 0,
  habit: 1,
  goal: 2,
  affirmation: 3,
  journal: 4,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function eventCompare(left: HistoryEvent, right: HistoryEvent): number {
  return right.date.localeCompare(left.date) ||
    right.sortTimestamp - left.sortTimestamp ||
    typeOrder[left.type] - typeOrder[right.type] ||
    left.id.localeCompare(right.id);
}

function validStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

export class HistoryService {
  static async getHistory(userId: string, filters: HistoryFilters): Promise<{
    events: HistoryEvent[];
    hasMore: boolean;
    nextSkip: number;
  }> {
    const userObjectId = new mongoose.Types.ObjectId(userId);
    const { types, search, startDate, endDate, taskStatus, limit, skip } = filters;
    const candidatesLimit = skip + limit + 1;
    const dateRange = startDate && endDate
      ? { $gte: buildDateRange(startDate).startOfDay, $lt: buildDateRange(endDate).endOfDay }
      : startDate
        ? { $gte: buildDateRange(startDate).startOfDay }
        : endDate
          ? { $lt: buildDateRange(endDate).endOfDay }
          : undefined;
    const searchExpression = search ? new RegExp(escapeRegExp(search), 'i') : undefined;
    const localTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

    const eventGroups = await Promise.all([
      types.includes('task')
        ? Task.find({
            userId: userObjectId,
            ...(dateRange ? { date: dateRange } : {}),
            ...(taskStatus ? { status: taskStatus } : {}),
            ...(searchExpression ? {
              $or: [
                { title: searchExpression },
                { description: searchExpression },
                { notes: searchExpression },
              ],
            } : {}),
          })
          .sort({ date: -1, createdAt: -1, _id: -1 })
          .limit(candidatesLimit)
          .lean()
        : [],
      types.includes('habit')
        ? Habit.aggregate([
            {
              $match: {
                userId: userObjectId,
                ...(searchExpression ? { name: searchExpression } : {}),
                ...(dateRange ? { completedDates: dateRange } : {}),
              },
            },
            { $unwind: '$completedDates' },
            ...(dateRange ? [{ $match: { completedDates: dateRange } }] : []),
            {
              $project: {
                name: 1,
                habitId: '$_id',
                date: {
                  $dateToString: {
                    format: '%Y-%m-%d',
                    date: '$completedDates',
                    timezone: localTimeZone,
                  },
                },
              },
            },
            { $group: { _id: { habitId: '$habitId', date: '$date' }, name: { $first: '$name' } } },
            { $sort: { '_id.date': -1, '_id.habitId': 1 } },
            { $limit: candidatesLimit },
          ])
        : [],
      types.includes('goal') || types.includes('affirmation')
        ? Goal.find({
            userId: userObjectId,
            type: { $in: types.filter((type): type is 'goal' | 'affirmation' =>
              type === 'goal' || type === 'affirmation'
            ) },
            ...(dateRange ? { createdAt: dateRange } : {}),
            ...(searchExpression ? { text: searchExpression } : {}),
          })
          .sort({ createdAt: -1, _id: -1 })
          .limit(candidatesLimit)
          .lean()
        : [],
      types.includes('journal')
        ? Reflection.find({
            userId: userObjectId,
            ...(dateRange ? { date: dateRange } : {}),
            ...(searchExpression ? {
              $or: [
                { goodThings: searchExpression },
                { badThings: searchExpression },
                { learnings: searchExpression },
                { notes: searchExpression },
              ],
            } : {}),
          })
          .sort({ date: -1, createdAt: -1, _id: -1 })
          .limit(candidatesLimit)
          .lean()
        : [],
    ]);

    const [tasks, habits, goals, reflections] = eventGroups;
    const events: HistoryEvent[] = [];

    tasks.forEach(task => {
      const plannedDate = localDateKey(task.date);
      events.push({
        id: `task:${task._id.toString()}`,
        type: 'task',
        date: plannedDate,
        sortTimestamp: task.createdAt.getTime(),
        title: task.title,
        detail: task.description || undefined,
        status: task.status,
        plannedDate,
        dueDate: task.dueDate ? localDateKey(task.dueDate) : undefined,
        category: task.category,
        createdAt: task.createdAt.toISOString(),
        updatedAt: task.updatedAt.toISOString(),
      });
    });

    habits.forEach(habit => {
      const date = habit._id.date;
      const habitId = habit._id.habitId.toString();
      events.push({
        id: `habit:${habitId}:${date}`,
        type: 'habit',
        date,
        sortTimestamp: 0,
        title: habit.name,
        detail: 'Habit check-in recorded',
      });
    });

    goals.forEach(goal => {
      const type = goal.type;
      const date = localDateKey(goal.createdAt);
      events.push({
        id: `${type}:${goal._id.toString()}`,
        type,
        date,
        sortTimestamp: goal.createdAt.getTime(),
        title: goal.text,
        detail: type === 'goal' ? 'Goal created' : 'Affirmation created',
        createdAt: goal.createdAt.toISOString(),
      });
    });

    reflections.forEach(reflection => {
      const date = localDateKey(reflection.date);
      const goodThings = validStringArray(reflection.goodThings);
      const badThings = validStringArray(reflection.badThings);
      const learnings = validStringArray(reflection.learnings);
      const notes = typeof reflection.notes === 'string' ? reflection.notes : undefined;
      events.push({
        id: `journal:${reflection._id.toString()}`,
        type: 'journal',
        date,
        sortTimestamp: reflection.createdAt.getTime(),
        title: 'Journal entry',
        detail: notes || goodThings[0] || learnings[0] || undefined,
        createdAt: reflection.createdAt.toISOString(),
        updatedAt: reflection.updatedAt.toISOString(),
        mood: typeof reflection.mood === 'number' && Number.isFinite(reflection.mood)
          ? reflection.mood
          : null,
        goodThings,
        badThings,
        learnings,
        notes,
      });
    });

    events.sort(eventCompare);
    const page = events.slice(skip, skip + limit + 1);
    const hasMore = page.length > limit;
    const visibleEvents = page.slice(0, limit);
    return {
      events: visibleEvents,
      hasMore,
      nextSkip: skip + visibleEvents.length,
    };
  }
}
