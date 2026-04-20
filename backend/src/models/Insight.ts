import mongoose, { Document, Schema } from 'mongoose';

export interface IInsight extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'productivity' | 'habits' | 'mood' | 'tasks' | 'recommendation' | 'anomaly';
  category: string; // 'Work', 'Study', 'Health', 'Personal', etc.
  metric: string; // e.g., 'completion_rate', 'missed_tasks', 'habit_streak'
  currentValue: number;
  previousValue?: number;
  historicalAverage?: number;
  percentChange?: number;
  trend: 'improving' | 'declining' | 'stable' | 'anomaly';
  message: string;
  actionable: boolean;
  severity: 'low' | 'medium' | 'high'; // how urgent/important
  relatedGoalId?: mongoose.Types.ObjectId;
  dismissed: boolean;
  dismissedAt?: Date;
  confidence: number; // 0-1, how confident we are in this insight
  dataPoints: number; // how many data points contributed to this insight
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
    enum: ['productivity', 'habits', 'mood', 'tasks', 'recommendation', 'anomaly'],
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  metric: {
    type: String,
    required: true,
  },
  currentValue: {
    type: Number,
    required: true,
  },
  previousValue: {
    type: Number,
  },
  historicalAverage: {
    type: Number,
  },
  percentChange: {
    type: Number,
  },
  trend: {
    type: String,
    enum: ['improving', 'declining', 'stable', 'anomaly'],
    required: true,
  },
  message: {
    type: String,
    required: true,
    trim: true,
  },
  actionable: {
    type: Boolean,
    default: true,
  },
  severity: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },
  relatedGoalId: {
    type: Schema.Types.ObjectId,
    ref: 'Goal',
  },
  dismissed: {
    type: Boolean,
    default: false,
    index: true,
  },
  dismissedAt: {
    type: Date,
  },
  confidence: {
    type: Number,
    min: 0,
    max: 1,
    default: 0.8,
  },
  dataPoints: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Index for efficient querying
insightSchema.index({ userId: 1, createdAt: -1 });
insightSchema.index({ userId: 1, dismissed: 1, createdAt: -1 });
insightSchema.index({ userId: 1, type: 1, createdAt: -1 });

export default mongoose.model<IInsight>('Insight', insightSchema);
