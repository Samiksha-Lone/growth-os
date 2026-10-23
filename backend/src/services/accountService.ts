import fs from 'fs/promises';
import mongoose from 'mongoose';
import path from 'path';
import Goal from '../models/Goal';
import Habit from '../models/Habit';
import Insight from '../models/Insight';
import Reflection from '../models/Reflection';
import Task from '../models/Task';
import User from '../models/User';
import { HttpError } from './authService';
import { invalidateUserCache } from '../utils/cache';

const avatarUrlPrefix = '/uploads/avatars/';

function getLocalAvatarPath(avatarUrl?: string): string | null {
  if (!avatarUrl?.startsWith(avatarUrlPrefix)) {
    return null;
  }

  const filename = avatarUrl.slice(avatarUrlPrefix.length);
  if (!/^avatar-\d+-\d+(?:\.[a-z0-9]+)?$/i.test(filename)) {
    return null;
  }

  const avatarDirectory = path.resolve(process.cwd(), 'uploads', 'avatars');
  const avatarPath = path.resolve(avatarDirectory, filename);
  return path.dirname(avatarPath) === avatarDirectory ? avatarPath : null;
}

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
    let avatarPath: string | null = null;

    try {
      await session.withTransaction(async () => {
        avatarPath = null;
        const user = await User.findById(userId).select('avatarUrl').session(session);

        if (user?.avatarUrl) {
          const candidatePath = getLocalAvatarPath(user.avatarUrl);
          const sharedAvatar = candidatePath
            ? await User.exists({ _id: { $ne: user._id }, avatarUrl: user.avatarUrl }).session(session)
            : null;

          if (candidatePath && !sharedAvatar) {
            avatarPath = candidatePath;
          }
        }

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

    if (avatarPath) {
      try {
        await fs.unlink(avatarPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.error('[ACCOUNT DELETION] Avatar cleanup failed after account deletion:', error);
        }
      }
    }
  }
}
