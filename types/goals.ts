// ===== GOALS & MILESTONES =====

export interface Milestone {
  id: string;
  title: string;
  targetDate?: string;
  isCompleted: boolean;
  completedAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  description?: string;
  emoji: string;
  color: string;
  targetDate?: string;
  milestones: Milestone[];
  linkedHabitIds: string[];
  createdAt: string;
  completedAt?: string;
  archived?: boolean;
}

// Goal progress calculation helper
export const calculateGoalProgress = (goal: Goal, habits: { id: string; completedDates: string[] }[]): number => {
  const totalItems = goal.milestones.length + goal.linkedHabitIds.length;
  if (totalItems === 0) return 0;

  const completedMilestones = goal.milestones.filter(m => m.isCompleted).length;

  const habitsWithStreak = goal.linkedHabitIds.filter(hid => {
    const habit = habits.find(h => h.id === hid);
    return habit && habit.completedDates.length >= 7;
  }).length;

  const completedItems = completedMilestones + habitsWithStreak;
  return Math.round((completedItems / totalItems) * 100);
};

export const GOAL_EMOJIS = ['🎯', '🏆', '💪', '📚', '💰', '🏃', '🧘', '✍️', '🎨', '🚀', '⭐', '🌟', '💎', '🔥', '🌱', '🏅'];

export const GOAL_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4',
  '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F',
];
