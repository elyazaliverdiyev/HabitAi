import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { VaultData, EMPTY_VAULT } from '../types/vault';
import { removeUndefined } from '../utils/helpers';
import { useRealtimeSync } from './useRealtimeSync';

export const useVault = (user: User | null) => {
    const [isVaultOpen, setIsVaultOpen] = useState(false);
    const [vaultData, setVaultData] = useState<VaultData>(EMPTY_VAULT);

    // Realtime Sync Hook
    const { broadcast } = useRealtimeSync(user, useCallback((type, data) => {
        if (type === 'VAULT_UPDATE' && data && typeof data === 'object') {
            setVaultData({ ...EMPTY_VAULT, ...data });
        }
    }, []));

    // Load Vault data from Supabase
    useEffect(() => {
        if (!user) {
            setVaultData(EMPTY_VAULT);
            return;
        }

        const fetchVault = async () => {
            const { data, error } = await supabase.from('users').select('vault_data').eq('id', user.id).single();
            if (data?.vault_data && Object.keys(data.vault_data).length > 0 && !error) {
                setVaultData({ ...EMPTY_VAULT, ...(data.vault_data as Partial<VaultData>) });
            } else {
                setVaultData(EMPTY_VAULT);
            }
        };

        fetchVault();

        const channel = supabase
            .channel('public:users:vault')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${user.id}` }, (payload) => {
                const data = payload.new as any;
                if (data && data.vault_data && Object.keys(data.vault_data).length > 0) {
                    setVaultData({ ...EMPTY_VAULT, ...data.vault_data });
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    // Save Vault data
    const updateVault = async (data: VaultData) => {
        setVaultData(data);
        broadcast('VAULT_UPDATE', data);
        if (user) {
            try {
                await supabase.from('users').update({ vault_data: removeUndefined(data) }).eq('id', user.id);
            } catch (error) {
                console.error('Error saving vault:', error);
            }
        }
    };

    return {
        isVaultOpen, setIsVaultOpen,
        vaultData, updateVault
    };
};
