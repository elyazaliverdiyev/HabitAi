import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { HabitAnalysis, DeepAnalysis } from '../types';
import { triggerHaptic } from '../utils/helpers';

export const useAIInsights = (user: User | null, language: 'ru' | 'en') => {
    const [savedAiInsights, setSavedAiInsights] = useState<any[]>([]);
    const [deepAnalysisHistory, setDeepAnalysisHistory] = useState<DeepAnalysis[]>([]);
    const [aiSectionTab, setAiSectionTab] = useState<'analytics' | 'history'>('analytics');

    // Load AI Insights history
    useEffect(() => {
        if (!user) {
            setSavedAiInsights([]);
            return;
        }

        const fetchInsights = async () => {
            const { data, error } = await supabase.from('aiInsights').select('*').eq('user_id', user.id).limit(50);
            if (data && !error) {
                setSavedAiInsights(data.sort((a: any, b: any) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                ));
            }
        };

        fetchInsights();

        const channel = supabase
            .channel('public:aiInsights')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'aiInsights', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setSavedAiInsights((prev) => [...prev, payload.new].sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else if (payload.eventType === 'UPDATE') {
                    setSavedAiInsights((prev) => prev.map((s) => (s.id === payload.new.id ? payload.new : s)).sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else if (payload.eventType === 'DELETE') {
                    setSavedAiInsights((prev) => prev.filter((s) => s.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Load deep analysis history
    useEffect(() => {
        if (!user) {
            setDeepAnalysisHistory([]);
            return;
        }

        const fetchDeepAnalysis = async () => {
            const { data, error } = await supabase.from('deepAnalysis').select('*').eq('user_id', user.id).limit(50);
            if (data && !error) {
                setDeepAnalysisHistory((data as DeepAnalysis[]).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
            }
        };

        fetchDeepAnalysis();

        const channel = supabase
            .channel('public:deepAnalysis')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'deepAnalysis', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setDeepAnalysisHistory((prev) => [...prev, payload.new as DeepAnalysis].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else if (payload.eventType === 'UPDATE') {
                    setDeepAnalysisHistory((prev) => prev.map((s) => (s.id === payload.new.id ? payload.new as DeepAnalysis : s)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else if (payload.eventType === 'DELETE') {
                    setDeepAnalysisHistory((prev) => prev.filter((s) => s.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Save AI insight
    const saveAIInsight = async (analysisData: HabitAnalysis, setInsightSaved: (v: boolean) => void) => {
        if (!user) {
            console.error('Cannot save AI insight: No user logged in');
            return;
        }

        try {
            await supabase.from('aiInsights').insert({
                user_id: user.id,
                date: new Date().toISOString(),
                overallScore: analysisData.overallScore,
                motivationalMessage: analysisData.motivationalMessage,
                streakAnalysis: analysisData.streakAnalysis,
                suggestions: analysisData.suggestions,
                language
            });
            setInsightSaved(true);
            triggerHaptic();
        } catch (error) {
            console.error('Error saving AI insight:', error);
        }
    };

    // Save deep analysis
    const saveDeepAnalysis = async (insight: string) => {
        if (!user) return;
        const entry = {
            user_id: user.id,
            date: new Date().toISOString(),
            insight,
            language
        };
        try {
            await supabase.from('deepAnalysis').insert(entry);
            triggerHaptic();
        } catch (error) {
            console.error('Error saving deep analysis:', error);
        }
    };

    return {
        savedAiInsights, setSavedAiInsights,
        deepAnalysisHistory, setDeepAnalysisHistory,
        aiSectionTab, setAiSectionTab,
        saveAIInsight, saveDeepAnalysis
    };
};
