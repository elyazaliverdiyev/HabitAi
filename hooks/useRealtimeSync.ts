import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';

export type RealtimeEventType = 'HABITS_UPDATE' | 'SETTINGS_UPDATE' | 'VAULT_UPDATE' | 'GOALS_UPDATE';

interface RealtimePayload {
    type: RealtimeEventType;
    senderId: string;
    data: any;
    timestamp: number;
}

// Generate a unique client ID per tab/device to ignore self-broadcasts
const CLIENT_ID = Math.random().toString(36).substring(2, 9);

export const useRealtimeSync = (
    user: User | null,
    onRemoteUpdate?: (type: RealtimeEventType, data: any) => void
) => {
    const channelRef = useRef<any>(null);
    const callbackRef = useRef(onRemoteUpdate);

    useEffect(() => {
        callbackRef.current = onRemoteUpdate;
    }, [onRemoteUpdate]);

    useEffect(() => {
        if (!user) return;

        const roomName = `user_sync_${user.id}`;
        const channel = supabase.channel(roomName, {
            config: {
                broadcast: { self: false } // Do not receive own broadcasts
            }
        });

        channel
            .on('broadcast', { event: 'SYNC_EVENT' }, (payload) => {
                const msg = payload.payload as RealtimePayload;
                if (msg && msg.senderId !== CLIENT_ID && callbackRef.current) {
                    callbackRef.current(msg.type, msg.data);
                }
            })
            .subscribe();

        channelRef.current = channel;

        return () => {
            supabase.removeChannel(channel);
            channelRef.current = null;
        };
    }, [user?.id]);

    const broadcast = useCallback((type: RealtimeEventType, data: any) => {
        if (channelRef.current && user) {
            channelRef.current.send({
                type: 'broadcast',
                event: 'SYNC_EVENT',
                payload: {
                    type,
                    senderId: CLIENT_ID,
                    data,
                    timestamp: Date.now()
                }
            });
        }
    }, [user]);

    return { broadcast };
};
