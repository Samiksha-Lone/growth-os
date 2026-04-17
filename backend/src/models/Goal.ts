import mongoose, { Document, Schema } from 'mongoose';

export interface IGoal extends Document {
  text: string;
  type: 'goal' | 'affirmation';
  createdAt: Date;
  userId: mongoose.Types.ObjectId;
}

const goalSchema = new Schema<IGoal>({
  text: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['goal', 'affirmation'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
});

export default mongoose.model<IGoal>('Goal', goalSchema);