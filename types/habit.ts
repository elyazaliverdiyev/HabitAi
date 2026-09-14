// ===== HABIT CORE TYPE =====

import type { SubItem, PhotoEntry } from './items';
import type { Book, Supplement, SkincareProduct } from './extensions';

export interface Habit {
  id: string;
  type?: 'habit' | 'task';
  name: string;
  description?: string;
  color: string;
  icon: string;
  completedDates: string[];
  createdAt: string;
  category?: string;
  archived?: boolean;

  // Habit Specific
  frequency?: 'daily' | 'weekly' | 'monthly' | 'specific_days';
  frequencyDays?: number[];
  targetCount?: number;

  // Adaptive Goals System
  ultimateTarget?: number;
  adaptiveLevel?: number;

  // Task Specific
  date?: string;

  // Eisenhower Matrix (for tasks)
  quadrant?: 'do' | 'schedule' | 'delegate' | 'delete';

  // Common Scheduling
  time?: string;
  duration?: number;
  reminderTime?: string;

  // Implementation Intentions (Atomic Habits)
  place?: string;

  // Expense Tracking
  cost?: number;
  currency?: string;

  // Rarity System
  difficulty?: 1 | 2 | 3 | 4 | 5;

  // Keystone Habits (Atomic Habits)
  isKeystone?: boolean;

  // --- EXTENSIONS ---
  extension?: {
    type: 'reading' | 'tracker' | 'supplements' | 'skincare';
    data: {
      books?: Book[];
      supplements?: Supplement[];
      skincare?: SkincareProduct[];
    }
  };

  // --- SUB-ITEMS ---
  items?: SubItem[];

  // --- KANBAN ---
  columnId?: string;

  // --- IDENTITY SYSTEM ---
  identityId?: string;

  // --- QUICK TAGS ---
  tags?: string[];

  // --- PHOTO JOURNAL ---
  photoJournal?: PhotoEntry[];
}

// ===== HABIT ANALYSIS (AI) =====

export interface HabitAnalysis {
  overallScore: number;
  streakAnalysis: string;
  motivationalMessage: string;
  suggestions: string[];
}

export interface FocusRecommendation {
  habitId: string | null;
  reasoning: string;
  estimatedDuration: number;
  matchScore: number;
  actionType: 'do' | 'rest' | 'plan';
  customTitle?: string;
}

export interface DeepAnalysis {
  id: string;
  date: string;
  insight: string;
  language: 'ru' | 'en';
}

// ===== USER SETTINGS =====

export interface UserSettings {
  themeId: string;
  language: 'ru' | 'en';
  accentColor: string | null;
  aiSuggestionCount: number;
  viewMode: 'grid' | 'compact' | 'kanban' | 'matrix' | 'list' | 'calendar' | 'graph';
  voiceId: string;
  isWakeWordEnabled: boolean;
  displayOptions: {
    showStreak: boolean;
    showPercentage: boolean;
    showTotal: boolean;
  };
  timeFocusMode?: boolean;
  notificationsEnabled?: boolean;
  dailyVisualizationEnabled?: boolean;
  avatarType?: 'emoji' | 'photo' | 'preset' | 'google';
  avatarValue?: string;
}
