import React, { Suspense } from 'react';
import { Share2 } from 'lucide-react';
import { Habit, Goal, DeepAnalysis, HabitConnection } from '../types';

// Lazy load heavy sub-components
const StatsView = React.lazy(() => import('./StatsView'));
const GoalPathNetwork = React.lazy(() => import('./GoalPathNetwork'));

interface StatsTabProps {
    habits: Habit[];
    activeHabits: Habit[];
    goals: Goal[];
    language: 'ru' | 'en';
    accentColor: string | null;
    deepAnalysisHistory: DeepAnalysis[];
    onSaveDeepAnalysis: (insight: string) => void;
    habitConnections: HabitConnection[];
    setHabitConnections: (c: HabitConnection[]) => void;
    graphPositions: Record<string, { x: number; y: number }>;
    setGraphPositions: (p: Record<string, { x: number; y: number }>) => void;
    onHabitClick: (h: Habit) => void;
    onGoalClick: () => void;
}

const StatsTab: React.FC<StatsTabProps> = ({
    habits,
    activeHabits,
    goals,
    language,
    accentColor,
    deepAnalysisHistory,
    onSaveDeepAnalysis,
    habitConnections,
    setHabitConnections,
    graphPositions,
    setGraphPositions,
    onHabitClick,
    onGoalClick,
}) => {
    return (
        <div key="tab-stats" className="space-y-6">
            <Suspense fallback={<div className="animate-pulse h-64 bg-surface rounded-2xl" />}>
                <StatsView
                    habits={habits}
                    language={language}
                    accentColor={accentColor}
                    analysisHistory={deepAnalysisHistory}
                    onSaveAnalysis={onSaveDeepAnalysis}
                />
            </Suspense>
        </div>
    );
};

export default StatsTab;
