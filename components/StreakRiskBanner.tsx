import React, { useState, useEffect } from 'react';
import { AlertTriangle, Flame, ChevronRight, X } from 'lucide-react';
import { StreakRiskData, generateStreakRiskAlert } from '../services/ai';
import { Habit } from '../types';

interface StreakRiskBannerProps {
    habits: Habit[];
    language: 'ru' | 'en';
    onHabitClick?: (habitName: string) => void;
}

const StreakRiskBanner: React.FC<StreakRiskBannerProps> = ({
    habits,
    language,
    onHabitClick,
}) => {
    const [riskData, setRiskData] = useState<StreakRiskData | null>(null);
    const [dismissed, setDismissed] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadRisk();
    }, []);

    const loadRisk = async () => {
        try {
            const data = await generateStreakRiskAlert(habits, language);
            setRiskData(data);
        } catch {
            // silent
        }
        setLoading(false);
    };

    if (loading || !riskData || dismissed) return null;

    return (
        <div className="rounded-2xl bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 overflow-hidden animate-fadeIn">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center animate-pulse">
                        <AlertTriangle size={16} className="text-red-500" />
                    </div>
                    <p className="font-bold text-sm text-red-500">{riskData.urgentMessage}</p>
                </div>
                <button onClick={() => setDismissed(true)} className="p-1.5 rounded-lg hover:bg-surface/50">
                    <X size={14} className="text-secondary" />
                </button>
            </div>

            {/* At-risk habits */}
            <div className="px-4 pb-3 space-y-1.5">
                {riskData.atRiskHabits.map((habit, i) => (
                    <div
                        key={i}
                        onClick={() => onHabitClick?.(habit.name)}
                        className="flex items-center gap-3 p-2.5 rounded-xl bg-surface/50 cursor-pointer hover:bg-surface transition-colors"
                    >
                        <div className="flex items-center gap-1.5 shrink-0">
                            <Flame size={14} className={habit.riskLevel === 'high' ? 'text-red-500' : 'text-orange-500'} />
                            <span className="text-xs font-bold text-primary">{habit.currentStreak}🔥</span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-primary truncate">{habit.name}</p>
                            <p className="text-xs text-secondary truncate">{habit.message}</p>
                        </div>
                        <ChevronRight size={14} className="text-secondary shrink-0" />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default StreakRiskBanner;
