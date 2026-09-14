import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Goal } from '../types';
import { triggerHaptic, removeUndefined } from '../utils/helpers';
import { useRealtimeSync } from './useRealtimeSync';

export const useGoals = (user: User | null) => {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [isGoalsModalOpen, setIsGoalsModalOpen] = useState(false);

    // Realtime Sync Hook
    const { broadcast } = useRealtimeSync(user, useCallback((type, data) => {
        if (type === 'GOALS_UPDATE' && Array.isArray(data)) {
            setGoals(data);
        }
    }, []));

    // Load goals from Supabase
    useEffect(() => {
        if (!user) {
            setGoals([]);
            return;
        }

        const fetchGoals = async () => {
            const { data, error } = await supabase.from('goals').select('*').eq('user_id', user.id);
            if (data && !error) {
                setGoals(data as Goal[]);
            }
        };

        fetchGoals();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('public:goals')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setGoals((prev) => [...prev, payload.new as Goal]);
                } else if (payload.eventType === 'UPDATE') {
                    setGoals((prev) => prev.map((g) => (g.id === payload.new.id ? (payload.new as Goal) : g)));
                } else if (payload.eventType === 'DELETE') {
                    setGoals((prev) => prev.filter((g) => g.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Save goal to Supabase
    const saveGoal = async (goal: Goal) => {
        if (!user) return;

        setGoals((prev) => {
            const exists = prev.some(g => g.id === goal.id);
            const next = exists ? prev.map(g => g.id === goal.id ? goal : g) : [...prev, goal];
            broadcast('GOALS_UPDATE', next);
            return next;
        });

        try {
            const cleanGoal = removeUndefined({
                id: goal.id,
                user_id: user.id,
                title: goal.title,
                emoji: goal.emoji,
                color: goal.color,
                milestones: goal.milestones,
                linkedHabitIds: goal.linkedHabitIds || [],
                createdAt: goal.createdAt,
                description: goal.description,
                targetDate: goal.targetDate,
                completedAt: goal.completedAt,
                archived: goal.archived
            });

            const { error } = await supabase.from('goals').upsert(cleanGoal);
            if (error) throw error;
            triggerHaptic();
        } catch (error) {
            console.error('Error saving goal:', error);
        }
    };

    // Delete goal
    const deleteGoal = async (goalId: string) => {
        if (!user) return;

        setGoals((prev) => {
            const next = prev.filter(g => g.id !== goalId);
            broadcast('GOALS_UPDATE', next);
            return next;
        });

        try {
            const { error } = await supabase.from('goals').delete().eq('id', goalId).eq('user_id', user.id);
            if (error) throw error;
            triggerHaptic();
        } catch (error) {
            console.error('Error deleting goal:', error);
        }
    };

    return {
        goals, setGoals,
        isGoalsModalOpen, setIsGoalsModalOpen,
        saveGoal, deleteGoal
    };
};
