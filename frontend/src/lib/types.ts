export interface Task {
  _id: string;
  title: string;
  description?: string;
  category: 'Work' | 'Study' | 'Health' | 'Personal';
  priority: 'High' | 'Medium' | 'Low';
  status: 'Pending' | 'In Progress' | 'Completed' | 'Missed';
  date: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startTime?: string;
  skippedReason?: string;
}

export interface Habit {
  _id: string;
  name: string;
  streak: number;
  completedDates: string[];
  userId: string;
  createdAt: string;
  updatedAt: string;
  target?: string;
  progress?: number;
}

export interface Reflection {
  _id: string;
  date: string;
  goodThings: string[];
  badThings: string[];
  learnings: string[];
  mood: number;
  productivityScore: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  title: string;
  detail: string;
}

export interface Goal {
  _id: string;
  text: string;
  type: 'goal' | 'affirmation';
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealitySummary {
  date: string;
  plannedTasks: number;
  completedTasks: number;
  missedTasks: number;
  completionPercentage: number;
  overPlanningIndicator: boolean;
  insights: string[];
}

export interface DashboardStats {
  tasksToday: number;
  tasksTotal: number;
  habitsDone: number;
  habitsTotal: number;
  focusMinutes: number;
  score: number;
}

export interface UserProfile {
  name: string;
  email: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
  avatarUrl?: string;
}

export interface PomodoroSession {
  _id?: string;
  duration: number;
  timestamp: string;
  taskId?: string;
}
