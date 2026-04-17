import mongoose, { Document, Schema } from 'mongoose';

export interface IReflection extends Document {
  date: Date;
  goodThings: string[];
  badThings: string[];
  learnings: string[];
  mood: number; // 1-10
  productivityScore: number; // 1-10
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
    trim: true,
  }],
  badThings: [{
    type: String,
    trim: true,
  }],
  learnings: [{
    type: String,
    trim: true,
  }],
  mood: {
    type: Number,
    min: 1,
    max: 10,
    required: true,
  },
  productivityScore: {
    type: Number,
    min: 1,
    max: 10,
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

// Ensure one reflection per user per date
reflectionSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model<IReflection>('Reflection', reflectionSchema);