import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { parseLocalDate } from '../utils/dateUtils';
import { localDateKey } from '../utils/dateHelpers';
import { HistoryFilters, HistoryRecordType, HistoryService, HistoryTaskStatus } from '../services/historyService';

const recordTypes: HistoryRecordType[] = ['task', 'habit', 'goal', 'affirmation', 'journal'];
const taskStatuses: HistoryTaskStatus[] = ['Pending', 'In Progress', 'Completed', 'Missed'];

export class HistoryController {
  static async getHistory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const typeValue = req.query.types;
      const requestedTypes = typeof typeValue === 'string' && typeValue.length
        ? typeValue.split(',').filter(Boolean)
        : recordTypes;
      if (requestedTypes.some(type => !recordTypes.includes(type as HistoryRecordType))) {
        res.status(400).json({ message: 'One or more history types are invalid.' });
        return;
      }

      const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
      if (search.length > 100) {
        res.status(400).json({ message: 'Search text cannot exceed 100 characters.' });
        return;
      }

      const parseOptionalDate = (value: unknown): Date | undefined | null => {
        if (value === undefined) return undefined;
        if (typeof value !== 'string') return null;
        const date = parseLocalDate(value);
        return localDateKey(date) === value ? date : null;
      };
      const startDate = parseOptionalDate(req.query.startDate);
      const endDate = parseOptionalDate(req.query.endDate);
      if (startDate === null || endDate === null || (startDate && endDate && startDate > endDate)) {
        res.status(400).json({ message: 'Enter a valid local date range.' });
        return;
      }

      const taskStatusValue = req.query.taskStatus;
      if (
        taskStatusValue !== undefined &&
        (typeof taskStatusValue !== 'string' || !taskStatuses.includes(taskStatusValue as HistoryTaskStatus))
      ) {
        res.status(400).json({ message: 'Task status filter is invalid.' });
        return;
      }

      const limitValue = typeof req.query.limit === 'string' ? Number(req.query.limit) : 30;
      const skipValue = typeof req.query.skip === 'string' ? Number(req.query.skip) : 0;
      if (
        !Number.isInteger(limitValue) || limitValue < 1 || limitValue > 100 ||
        !Number.isSafeInteger(skipValue) || skipValue < 0
      ) {
        res.status(400).json({ message: 'History pagination values are invalid.' });
        return;
      }

      const filters: HistoryFilters = {
        types: [...new Set(requestedTypes as HistoryRecordType[])],
        search,
        startDate,
        endDate,
        taskStatus: taskStatusValue as HistoryTaskStatus | undefined,
        limit: limitValue,
        skip: skipValue,
      };
      const result = await HistoryService.getHistory(req.user._id, filters);
      res.json(result);
    } catch (error: any) {
      next(error);
    }
  }
}
