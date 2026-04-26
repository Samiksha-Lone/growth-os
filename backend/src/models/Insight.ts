import mongoose, { Document, Schema } from 'mongoose';

export interface IInsight extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'habit' | 'task' | 'mood' | 'productivity' | 'goal';
  title: string;
  message: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  dismissed: boolean;
  dismissedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const insightSchema = new Schema<IInsight>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  type: {
    type: String,
    enum: ['habit', 'task', 'mood', 'productivity', 'goal'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  dismissed: {
    type: Boolean,
    default: false,
  },
  dismissedAt: Date,
}, { timestamps: true });

insightSchema.index({ userId: 1, createdAt: -1 });
insightSchema.index({ userId: 1, dismissed: 1, createdAt: -1 });
insightSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.model<IInsight>('Insight', insightSchema);
