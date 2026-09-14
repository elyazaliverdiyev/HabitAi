import { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { ReflectionEntry } from '../components/ReflectionHistoryModal';
import { ReflectionSession } from '../components/AIReflectionSession';
import { triggerHaptic } from '../utils/helpers';

export const useReflections = (user: User | null) => {
    const [reflectionEntries, setReflectionEntries] = useState<ReflectionEntry[]>([]);
    const [reflectionSessions, setReflectionSessions] = useState<ReflectionSession[]>([]);

    // Load reflections from Supabase
    useEffect(() => {
        if (!user) {
            setReflectionEntries([]);
            return;
        }

        const fetchReflections = async () => {
            const { data, error } = await supabase.from('reflections').select('*').eq('user_id', user.id).limit(100);
            if (data && !error) {
                setReflectionEntries(data as ReflectionEntry[]);
            }
        };

        fetchReflections();

        const channel = supabase
            .channel('public:reflections')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reflections', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setReflectionEntries((prev) => [...prev, payload.new as ReflectionEntry]);
                } else if (payload.eventType === 'UPDATE') {
                    setReflectionEntries((prev) => prev.map((e) => (e.id === payload.new.id ? (payload.new as ReflectionEntry) : e)));
                } else if (payload.eventType === 'DELETE') {
                    setReflectionEntries((prev) => prev.filter((e) => e.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Load full reflection sessions
    useEffect(() => {
        if (!user) {
            setReflectionSessions([]);
            return;
        }

        const fetchSessions = async () => {
            const { data, error } = await supabase.from('reflectionSessions').select('*').eq('user_id', user.id).limit(50);
            if (data && !error) {
                setReflectionSessions((data as ReflectionSession[]).sort((a, b) =>
                    new Date(b.date).getTime() - new Date(a.date).getTime()
                ));
            }
        };

        fetchSessions();

        const channel = supabase
            .channel('public:reflectionSessions')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'reflectionSessions', filter: `user_id=eq.${user.id}` }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setReflectionSessions((prev) => [...prev, payload.new as ReflectionSession].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else if (payload.eventType === 'UPDATE') {
                    setReflectionSessions((prev) => prev.map((s) => (s.id === payload.new.id ? (payload.new as ReflectionSession) : s)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
                } else if (payload.eventType === 'DELETE') {
                    setReflectionSessions((prev) => prev.filter((s) => s.id !== payload.old.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Save a reflection entry
    const saveReflection = async (question: string, answer: string, aiInsight?: string) => {
        if (!user) {
            console.error('Cannot save reflection: No user logged in');
            return;
        }

        const entry: Record<string, any> = {
            user_id: user.id,
            date: new Date().toISOString(),
            question,
            answer
        };

        if (aiInsight) {
            entry.aiInsight = aiInsight;
        }

        try {
            await supabase.from('reflections').insert(entry);
        } catch (error) {
            console.error('Error saving reflection:', error);
        }
    };

    // Save full AI reflection session
    const saveFullSession = async (session: ReflectionSession) => {
        if (!user) {
            console.error('Cannot save session: No user logged in');
            return;
        }

        try {
            await supabase.from('reflectionSessions').insert({
                user_id: user.id,
                id: session.id,
                date: session.date,
                messages: session.messages,
                insight: session.insight,
                messageCount: session.messages.length
            });
            triggerHaptic();
        } catch (error) {
            console.error('Error saving full reflection session:', error);
        }
    };

    return {
        reflectionEntries, setReflectionEntries,
        reflectionSessions, setReflectionSessions,
        saveReflection, saveFullSession
    };
};
