import mongoose, { Document, Schema } from 'mongoose';

export interface IPomodoroSession extends Document {
  duration: number; // in minutes
  date: Date;
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const pomodoroSchema = new Schema<IPomodoroSession>({
  duration: {
    type: Number,
    required: true,
    min: 1,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
pomodoroSchema.index({ userId: 1, date: -1 });
pomodoroSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IPomodoroSession>('PomodoroSession', pomodoroSchema);