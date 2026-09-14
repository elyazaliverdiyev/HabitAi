import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { Habit, HabitAnalysis } from '../types';
import { analyzeHabits } from '../services/ai';

export const useAI = (user: User | null, isPro: boolean, language: 'ru' | 'en') => {
    const [analysis, setAnalysis] = useState<HabitAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [insightSaved, setInsightSaved] = useState(false);

    // Load from local storage on mount/user change
    useEffect(() => {
        const saved = localStorage.getItem(`analysis_${user?.uid || 'guest'}`);
        if (saved) {
            try {
                setAnalysis(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved analysis", e);
            }
        }
    }, [user]);

    // Reset saved state when analysis changes
    useEffect(() => {
        setInsightSaved(false);
    }, [analysis]);

    const handleAnalyze = async (activeHabits: Habit[], aiSuggestionCount: number) => {
        if (!isPro) return null;

        setIsAnalyzing(true);
        setInsightSaved(false);  // Reset saved state on new analysis
        try {
            const result = await analyzeHabits(activeHabits, aiSuggestionCount, language);
            setAnalysis(result);
            localStorage.setItem(`analysis_${user?.uid || 'guest'}`, JSON.stringify(result));
            setIsAnalyzing(false);
            return result;
        } catch (e) {
            console.error("Analysis failed", e);
            setIsAnalyzing(false);
            return null;
        }
    };

    return {
        analysis,
        setAnalysis,
        isAnalyzing,
        setIsAnalyzing,
        handleAnalyze,
        insightSaved,
        setInsightSaved
    };
};
