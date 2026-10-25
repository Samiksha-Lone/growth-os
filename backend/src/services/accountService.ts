import mongoose from 'mongoose';
import Goal from '../models/Goal';
import Habit from '../models/Habit';
import Insight from '../models/Insight';
import Reflection from '../models/Reflection';
import Task from '../models/Task';
import User from '../models/User';
import { HttpError } from './authService';
import { invalidateUserCache } from '../utils/cache';

function isTransactionUnsupported(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const mongoError = error as { code?: number; message?: string };
  return mongoError.code === 20
    || mongoError.message?.includes('Transaction numbers are only allowed on a replica set member or mongos') === true;
}

export class AccountService {
  static async deleteAccount(userId: string): Promise<void> {
    const session = await mongoose.startSession();

    try {
      await session.withTransaction(async () => {
        await Task.deleteMany({ userId }, { session });
        await Habit.deleteMany({ userId }, { session });
        await Goal.deleteMany({ userId }, { session });
        await Reflection.deleteMany({ userId }, { session });
        await Insight.deleteMany({ userId }, { session });
        await User.deleteOne({ _id: userId }, { session });
      });
    } catch (error) {
      if (isTransactionUnsupported(error)) {
        throw new HttpError(
          'Account deletion requires a transaction-capable MongoDB deployment',
          503
        );
      }

      throw error;
    } finally {
      await session.endSession();
    }

    invalidateUserCache(userId);
  }
}
