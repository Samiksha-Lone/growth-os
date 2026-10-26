import mongoose, { Document, Schema } from 'mongoose';

export interface IReflection extends Document {
  date: Date;
  goodThings: string[];
  badThings: string[];
  learnings: string[];
  notes?: string;
  mood?: number | null; // Current values are 1-3; legacy records may contain 1-10.
  productivityScore?: number; // 1-10; retained for legacy analytics records
  userId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const reflectionSchema = new Schema<IReflection>({
  date: {
    type: Date,
    required: true,
  },
  goodThings: [{
    type: String,
  }],
  badThings: [{
    type: String,
  }],
  learnings: [{
    type: String,
  }],
  notes: {
    type: String,
    default: '',
  },
  mood: {
    type: Number,
    min: 1,
    max: 10,
  },
  productivityScore: {
    type: Number,
    min: 1,
    max: 10,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Ensure one reflection per user per date
reflectionSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IReflection>('Reflection', reflectionSchema);