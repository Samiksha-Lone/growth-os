import mongoose, { Document, Schema } from 'mongoose';

export interface IHabit extends Document {
  name: string;
  streak: number;
  completedDates: Date[];
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  streak: {
    type: Number,
    default: 0,
  },
  completedDates: [{
    type: Date,
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
habitSchema.index({ userId: 1 });
habitSchema.index({ userId: 1, createdAt: -1 });

export default mongoose.model<IHabit>('Habit', habitSchema);