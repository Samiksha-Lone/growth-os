import Task from '../models/Task';

/**
 * Auto-mark incomplete tasks as missed at end of day
 * Runs daily to ensure tasks not completed by midnight are marked as missed
 */
export async function autoMarkMissedTasks(): Promise<void> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all tasks from yesterday and earlier that are still pending or in progress
    const incompleteTasks = await Task.updateMany(
      {
        date: { $lt: today },
        status: { $in: ['Pending', 'In Progress'] },
      },
      {
        $set: {
          status: 'Missed',
          skippedReason: 'Auto-marked: Task not completed by end of day',
          updatedAt: new Date(),
        },
      }
    );

    if (incompleteTasks.modifiedCount > 0) {
      console.log(`[AUTO-MARK MISSED] Marked ${incompleteTasks.modifiedCount} tasks as missed`);
    }
  } catch (error) {
    console.error('[AUTO-MARK MISSED ERROR]', error);
  }
}

/**
 * Initialize background jobs (runs on app startup and schedules recurring)
 */
export function initializeJobScheduler(): void {
  try {
    // Dynamically import node-cron
    const cron = require('node-cron');

    // Run immediately on startup
    console.log('[JOB SCHEDULER] Running initial auto-mark check...');
    autoMarkMissedTasks();

    // Schedule to run every day at 12:01 AM (00:01)
    cron.schedule('1 0 * * *', () => {
      console.log('[JOB SCHEDULER] Running scheduled auto-mark at 12:01 AM...');
      autoMarkMissedTasks();
    });

    console.log('[JOB SCHEDULER] Background job scheduler initialized');
  } catch (error) {
    console.error('[JOB SCHEDULER ERROR] Failed to initialize:', error);
  }
}
