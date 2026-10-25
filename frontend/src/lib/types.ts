export interface Task {
  _id: string;
  title: string;
  description?: string;
  category: 'Work' | 'Study' | 'Health' | 'Personal';
  priority: 'High' | 'Medium' | 'Low';
  priorityClassification?: EisenhowerQuadrant;
  status: 'Pending' | 'In Progress' | 'Completed' | 'Missed';
  date: string;
  dueDate?: string | null;
  estimatedDurationMinutes?: number | null;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  startTime?: string;
  skippedReason?: string;
}

export type EisenhowerQuadrant =
  | 'urgent-important'
  | 'important-not-urgent'
  | 'urgent-not-important'
  | 'neither';

export interface Habit {
  _id: string;
  name: string;
  streak: number;
  completedDates: string[];
  completedDateKeys?: string[];
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
  notes?: string;
  mood?: number | null;
  productivityScore?: number;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  title: string;
  detail: string;
}

export interface AdvancedAnalytics {
  insights: Insight[];
  scores: {
    consistency: string;
    goalAlignment: string | null;
  };
  summary: {
    total: number;
    highSeverity: number;
    actionable: number;
  };
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
  categoryBreakdown: Array<{
    category: string;
    plannedTasks: number;
    completedTasks: number;
    missedTasks: number;
    completionPercentage: number;
  }>;
  overPlanningIndicator: boolean;
  insights: string[];
}

export interface DashboardStats {
  tasksToday: number;
  tasksTotal: number;
  habitsDone: number;
  habitsTotal: number;
  score: number;
  weeklyTrend?: Array<{ day: string; value: number }>;
}

export interface ProductivityReport {
  range: { startDate: string; endDate: string };
  today: {
    plannedTasks: number;
    completedTasks: number;
    completionRate: number | null;
    missedTasks: number;
    unfinishedTasks: number;
    overdueTasks: number;
    dueHabits: number;
    completedHabits: number;
  };
  tasks: {
    planned: number;
    completed: number;
    completionRate: number | null;
    missed: number;
    unfinished: number;
    overdue: number;
  };
  habits: {
    completedHabitDays: number;
    eligibleHabitDays: number;
    completionRate: number | null;
    daily: Array<{ date: string; completed: number; eligible: number; completionRate: number | null }>;
    performance: Array<{
      id: string;
      name: string;
      completedDays: number;
      eligibleDays: number;
      completionRate: number | null;
      currentStreak: number;
      bestStreak: number;
      sufficientData: boolean;
    }>;
  };
  dailyTasks: Array<{
    date: string;
    planned: number;
    completed: number;
    completionRate: number | null;
    missed: number;
    unfinished: number;
    overdue: number;
  }>;
  categories: Array<{
    category: string;
    planned: number;
    completed: number;
    completionRate: number | null;
    missed: number;
    unfinished: number;
  }>;
  goals: {
    savedGoals: number;
    affirmations: number;
    createdInRange: number;
    tracksCompletion: false;
  };
  journal: {
    entries: number;
    moodAverage: number | null;
    moods: Array<{ date: string; mood: number }>;
  };
}

export type HistoryRecordType = 'task' | 'habit' | 'goal' | 'affirmation' | 'journal';
export type HistoryTaskStatus = 'Pending' | 'In Progress' | 'Completed' | 'Missed';

export interface HistoryEvent {
  id: string;
  type: HistoryRecordType;
  date: string;
  sortTimestamp: number;
  title: string;
  detail?: string;
  status?: HistoryTaskStatus;
  plannedDate?: string;
  dueDate?: string;
  category?: string;
  createdAt?: string;
  updatedAt?: string;
  mood?: number | null;
  goodThings?: string[];
  badThings?: string[];
  learnings?: string[];
  notes?: string;
}

export interface HistoryPageResult {
  events: HistoryEvent[];
  hasMore: boolean;
  nextSkip: number;
}

export interface UserProfile {
  name: string;
  email: string;
  githubUrl?: string;
  linkedinUrl?: string;
  portfolioUrl?: string;
}

export interface PasswordChangeResponse {
  token: string;
}
