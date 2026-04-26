import mongoose, { Document, Schema } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  category: 'Work' | 'Study' | 'Health' | 'Personal';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Missed';
  date: Date;
  notes?: string;
  userId: mongoose.Types.ObjectId;
  startTime?: string;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  category: {
    type: String,
    enum: ['Work', 'Study', 'Health', 'Personal'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['High', 'Medium', 'Low'],
    required: true,
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Completed', 'Missed'],
    default: 'Pending',
  },
  date: {
    type: Date,
    required: true,
  },
  notes: {
    type: String,
    trim: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  startTime: {
    type: String,
    trim: true,
  },
}, {
  timestamps: true,
});

// Add indexes for common queries
taskSchema.index({ userId: 1, date: -1 });
taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ date: 1 });

export default mongoose.model<ITask>('Task', taskSchema);