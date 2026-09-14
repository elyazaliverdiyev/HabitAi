import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { User } from '@supabase/supabase-js';
import { Trophy, Globe, Lock, AlertTriangle, RefreshCw } from 'lucide-react';
import { translations } from '../translations';
import { AnimatedList } from './AnimatedList';
import { PRESET_AVATARS } from '../services/avatarService';
import ShinyText from './ShinyText';

interface LeaderboardUser {
    uid: string;
    displayName: string;
    photoURL?: string;
    totalCompletions: number;
    isPro?: boolean;
    settings?: {
        avatarType?: 'emoji' | 'photo' | 'preset' | 'google';
        avatarValue?: string;
    };
}

interface LeaderboardViewProps {
    currentUser: User | null;
    isPublic: boolean;
    onTogglePublic: (isPublic: boolean) => void;
    language?: 'ru' | 'en';
}

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ currentUser, isPublic, onTogglePublic, language = 'ru' }) => {
    const t = translations[language].leaderboard;
    const [users, setUsers] = useState<LeaderboardUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLeaderboard = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, "displayName", "photoBase64", settings, rewards, "isPro", "totalCompletions"')
                .eq('"isPublic"', true)
                .limit(20);

            if (error) throw error;

            if (data) {
                // Calculate totalCompletions from column or rewards XP or default to 0
                const mappedData = data.map(doc => ({
                    uid: doc.id,
                    displayName: (doc as any).displayName || 'Anonymous',
                    photoURL: (doc as any).photoBase64,
                    totalCompletions: (doc as any).totalCompletions || (doc as any).rewards?.totalCompletions || (doc as any).rewards?.xp || 0,
                    isPro: (doc as any).isPro,
                    settings: (doc as any).settings as any
                }));
                // Sort by totalCompletions
                mappedData.sort((a, b) => b.totalCompletions - a.totalCompletions);
                setUsers(mappedData);
            }
        } catch (err: any) {
            console.error("Error fetching leaderboard:", err);
            setError(language === 'ru' ? `Ошибка загрузки: ${err.message}` : `Error loading: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchLeaderboard();
    }, [isPublic]);

    const handleJoin = async () => {
        if (!currentUser) return;
        onTogglePublic(true);
        setTimeout(fetchLeaderboard, 1500);
    };

    const handleLeave = async () => {
        if (!currentUser) return;
        onTogglePublic(false);
        setTimeout(fetchLeaderboard, 1000);
    };

    const renderAvatar = (user: LeaderboardUser, fallbackSize: string) => {
        const bg = user.settings?.avatarType === 'preset' && user.settings?.avatarValue
            ? PRESET_AVATARS.find(p => p.id === user.settings?.avatarValue)?.gradient || 'var(--surfaceHighlight)'
            : 'var(--surfaceHighlight)';

        if (user.settings?.avatarType === 'emoji' && user.settings?.avatarValue) {
            return <div className="w-full h-full flex items-center justify-center bg-surfaceHighlight"><span className={fallbackSize}>{user.settings.avatarValue}</span></div>;
        } else if (user.settings?.avatarType === 'photo' && user.settings?.avatarValue) {
            return <img src={user.settings.avatarValue} alt={user.displayName} className="w-full h-full object-cover" />;
        } else if (user.settings?.avatarType === 'preset' && user.settings?.avatarValue) {
            return <div className="w-full h-full flex items-center justify-center" style={{ background: bg }}><span className={`text-white font-bold ${fallbackSize}`}>{(user.displayName || '?').charAt(0)}</span></div>;
        } else if (user.photoURL) {
            return <img src={user.photoURL} alt={user.displayName} className="w-full h-full object-cover" />;
        } else {
            return <div className="w-full h-full flex items-center justify-center bg-surfaceHighlight"><span className={`font-bold text-textSecondary ${fallbackSize}`}>{(user.displayName || '?').charAt(0).toUpperCase()}</span></div>;
        }
    };

    const indexLink = error && error.match(/https:\/\/console\.firebase\.google\.com[^\s]*/)?.[0];

    const u1 = users[0];
    const u2 = users[1];
    const u3 = users[2];
    const restUsers = users.slice(3);

    return (
        <div className="animate-fadeIn pb-24 space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-black text-textPrimary tracking-tight flex items-center gap-2">
                    <Trophy className="text-brand" /> {t.title}
                </h2>

                <div className="flex gap-2">
                    <button
                        onClick={fetchLeaderboard}
                        className="p-2 rounded-full bg-surface-highlight text-textSecondary hover:text-textPrimary transition-colors active:rotate-180"
                    >
                        <RefreshCw size={16} />
                    </button>
                    {currentUser && (
                        <button
                            onClick={isPublic ? handleLeave : handleJoin}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${isPublic ? 'bg-surfaceHighlight text-textSecondary hover:bg-red-500/10 hover:text-red-500' : 'bg-brand text-white shadow-lg shadow-brand/30'}`}
                        >
                            {isPublic ? <><Lock size={12} /> {t.leave}</> : <><Globe size={12} /> {t.join}</>}
                        </button>
                    )}
                </div>
            </div>

            {/* Error Banner */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl text-xs text-red-600">
                    <div className="flex items-center gap-2 font-bold mb-1">
                        <AlertTriangle size={16} />
                        {language === 'ru' ? 'Ошибка базы данных' : 'Database Error'}
                    </div>
                    <p className="opacity-80 mb-2 break-words">
                        {error}
                    </p>
                    {indexLink && (
                        <a
                            href={indexLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block bg-red-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-red-600 transition-colors mt-2"
                        >
                            {language === 'ru' ? 'Создать индекс (Auto)' : 'Create Index (Auto)'}
                        </a>
                    )}
                </div>
            )}

            {!isPublic && !error && !loading && (
                <div className="bg-gradient-to-br from-brand/10 to-purple-500/10 border border-brand/20 rounded-3xl p-6 text-center shadow-lg">
                    <Globe size={48} className="mx-auto text-brand mb-3 opacity-80" />
                    <h3 className="font-bold text-lg text-textPrimary mb-2">{t.joinPromo}</h3>
                    <p className="text-sm text-textSecondary mb-4 max-w-xs mx-auto">{t.desc}</p>
                    <button
                        onClick={handleJoin}
                        className="bg-brand text-white font-bold py-3 px-8 rounded-full shadow-xl shadow-brand/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        {t.join}
                    </button>
                </div>
            )}

            {loading ? (
                <div className="space-y-4 pt-4">
                    <div className="flex items-end justify-center w-full min-h-[140px] px-2 gap-1 mb-8">
                        <div className="w-1/3 h-24 bg-surfaceHighlight/30 rounded-t-2xl animate-pulse" />
                        <div className="w-1/3 h-32 bg-surfaceHighlight/30 rounded-t-2xl animate-pulse" />
                        <div className="w-1/3 h-20 bg-surfaceHighlight/30 rounded-t-2xl animate-pulse" />
                    </div>
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-16 bg-surfaceHighlight/30 rounded-2xl animate-pulse" />
                    ))}
                </div>
            ) : (
                <>
                    {/* Podium Section */}
                    {!error && users.length > 0 && isPublic && (
                        <section className="mt-6 mb-8 flex flex-col items-center animate-slideUp">
                            <div className="flex items-end justify-center w-full min-h-[140px] px-2 gap-1">
                                {/* 2nd Place */}
                                <div className="flex flex-col items-center flex-1">
                                    {u2 ? (
                                        <>
                                            <div className="relative mb-2">
                                                <div className="size-14 md:size-16 rounded-full border-2 border-surface bg-surfaceHighlight overflow-hidden shrink-0 shadow-sm relative z-10">
                                                    {renderAvatar(u2, 'text-xl')}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-surfaceHighlight text-textPrimary border-2 border-surface rounded-full size-6 flex items-center justify-center shadow-sm z-20">
                                                    <span className="text-[10px] font-bold">2</span>
                                                </div>
                                            </div>
                                            <div className="bg-surface border border-borderSubtle w-full h-[80px] md:h-[90px] rounded-t-2xl flex flex-col items-center justify-start pt-3 px-1 text-center shadow-sm relative -mt-3">
                                                <span className="text-[11px] font-bold text-textPrimary truncate w-full">{u2.displayName}</span>
                                                <span className="text-[10px] text-brand font-bold">{u2.totalCompletions} pt</span>
                                            </div>
                                        </>
                                    ) : <div className="w-full h-[80px]" />}
                                </div>

                                {/* 1st Place */}
                                <div className="flex flex-col items-center flex-[1.2] z-20 -mx-1">
                                    {u1 ? (
                                        <>
                                            <div className="relative mb-3">
                                                <div className="size-16 md:size-[4.5rem] rounded-full border-[3px] border-brand bg-surfaceHighlight shadow-[0_0_15px_rgba(124,58,237,0.4)] overflow-hidden shrink-0 relative z-10">
                                                    {renderAvatar(u1, 'text-2xl')}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-brand text-white border-2 border-surface rounded-full size-7 flex items-center justify-center shadow-md z-20">
                                                    <span className="text-xs font-bold">1</span>
                                                </div>
                                            </div>
                                            <div className="bg-gradient-to-t from-brand/20 to-brand/5 border border-brand/20 w-full h-[100px] md:h-[120px] rounded-t-2xl flex flex-col items-center justify-start pt-4 px-1 text-center shadow-md relative -mt-4">
                                                <span className="text-sm font-bold text-textPrimary truncate w-full">{u1.displayName}</span>
                                                <span className="text-[11px] text-brand font-bold">{u1.totalCompletions} pt</span>
                                            </div>
                                        </>
                                    ) : <div className="w-full h-[100px]" />}
                                </div>

                                {/* 3rd Place */}
                                <div className="flex flex-col items-center flex-1">
                                    {u3 ? (
                                        <>
                                            <div className="relative mb-2">
                                                <div className="size-12 md:size-14 rounded-full border-2 border-surface bg-surfaceHighlight overflow-hidden shrink-0 shadow-sm relative z-10">
                                                    {renderAvatar(u3, 'text-lg')}
                                                </div>
                                                <div className="absolute -bottom-1 -right-1 bg-surfaceHighlight text-textPrimary border-2 border-surface rounded-full size-5 flex items-center justify-center shadow-sm z-20">
                                                    <span className="text-[9px] font-bold">3</span>
                                                </div>
                                            </div>
                                            <div className="bg-surface border border-borderSubtle w-full h-[65px] md:h-[75px] rounded-t-2xl flex flex-col items-center justify-start pt-2 px-1 text-center shadow-sm relative -mt-3">
                                                <span className="text-[10px] font-bold text-textPrimary truncate w-full">{u3.displayName}</span>
                                                <span className="text-[9px] text-brand font-bold">{u3.totalCompletions} pt</span>
                                            </div>
                                        </>
                                    ) : <div className="w-full h-[65px]" />}
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Leaderboard List */}
                    {!error && isPublic && (
                        <div className="space-y-2">
                            <AnimatedList className="flex flex-col gap-2 relative z-20">
                                {restUsers.length === 0 && users.length <= 3 ? (
                                    <div className="text-center py-6 text-textSecondary text-sm">{t.empty}</div>
                                ) : (
                                    restUsers.map((user, index) => {
                                        const globalRank = index + 4;
                                        const isMe = currentUser?.uid === user.uid;

                                        return (
                                            <div key={user.uid} className={`bg-surface border border-borderSubtle rounded-[1.25rem] p-3 flex items-center gap-3 transition-all ${isMe ? 'ring-2 ring-brand bg-brand/5 border-brand/30 z-10' : ''}`}>
                                                <div className="w-7 flex justify-center shrink-0">
                                                    <span className={`text-base font-bold ${isMe ? 'text-brand' : 'text-textSecondary/70'}`}>
                                                        {globalRank}
                                                    </span>
                                                </div>

                                                <div className="size-11 rounded-full overflow-hidden border border-borderSubtle bg-surfaceHighlight shrink-0">
                                                    {renderAvatar(user, 'text-base')}
                                                </div>

                                                <div className="flex-1 min-w-0 pr-2">
                                                    <h3 className="text-sm font-bold text-textPrimary truncate flex items-center gap-1.5">
                                                        {user.displayName}
                                                        {user.isPro && (
                                                            <span className="bg-gradient-to-r from-brand to-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold uppercase">
                                                                <ShinyText speed={2.5} shineColor="rgba(255,255,255,0.5)">PRO</ShinyText>
                                                            </span>
                                                        )}
                                                        {isMe && <span className="text-[9px] bg-brand text-white px-1.5 rounded-full font-bold ml-1">{language === 'ru' ? 'Вы' : 'You'}</span>}
                                                    </h3>
                                                </div>

                                                <div className="text-right shrink-0">
                                                    <span className="text-base font-black text-textPrimary leading-tight block">{user.totalCompletions}</span>
                                                    <p className="text-[10px] text-textSecondary uppercase font-bold">{t.score}</p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </AnimatedList>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default LeaderboardView;
