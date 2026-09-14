import React from 'react';
import {
    Gift, Lock, Unlock, Crown, Flame, Trophy, Sparkles,
    ChevronRight, Star, Zap, Check, Shield
} from 'lucide-react';
import {
    UserRewards,
    STREAK_REWARDS,
    FREE_HABIT_LIMIT,
    getMaxHabits,
    getNextReward,
    getCurrentStreak,
    Habit,
    getXPProgress,
    getLevelTitle,
    canUseStreakSaver,
    getDaysUntilStreakSaver
} from '../types';
import Modal from './Modal';
import LevelBadge from './LevelBadge';

interface RewardsModalProps {
    isOpen: boolean;
    onClose: () => void;
    userRewards: UserRewards;
    habits: Habit[];
    language: 'ru' | 'en';
    onUseStreakSaver?: (habitId: string) => void;
}

const RewardsModal: React.FC<RewardsModalProps> = ({
    isOpen,
    onClose,
    userRewards,
    habits,
    language,
    onUseStreakSaver
}) => {
    const t = {
        title: language === 'ru' ? 'Награды за Streak' : 'Streak Rewards',
        subtitle: language === 'ru'
            ? 'Держи streak — получай бесплатные привычки!'
            : 'Maintain streaks — unlock free habits!',
        yourStatus: language === 'ru' ? 'Твой статус' : 'Your Status',
        level: language === 'ru' ? 'Уровень' : 'Level',
        habits: language === 'ru' ? 'привычек' : 'habits',
        free: language === 'ru' ? 'бесплатно' : 'free',
        unlocked: language === 'ru' ? 'Разблокировано' : 'Unlocked',
        locked: language === 'ru' ? 'Заблокировано' : 'Locked',
        nextReward: language === 'ru' ? 'Следующая награда' : 'Next Reward',
        daysLeft: language === 'ru' ? 'дней осталось' : 'days left',
        earnedBadges: language === 'ru' ? 'Заработанные бейджи' : 'Earned Badges',
        noBadges: language === 'ru' ? 'Пока нет бейджей' : 'No badges yet',
        keepGoing: language === 'ru' ? 'Продолжай — и они придут!' : 'Keep going — they\'ll come!',
        maxHabits: language === 'ru' ? 'Максимум привычек' : 'Max Habits',
        base: language === 'ru' ? 'Базовый' : 'Base',
        bonus: language === 'ru' ? 'Бонус' : 'Bonus',
    };

    // Calculate current best streak from all habits
    const currentBestStreak = Math.max(...habits.map(h => getCurrentStreak(h)), 0);
    const maxHabits = getMaxHabits(userRewards, false);
    const nextReward = getNextReward(currentBestStreak);
    const daysToNext = nextReward ? nextReward.streakDays - currentBestStreak : 0;

    // Streak Saver availability
    const streakSaverAvailable = canUseStreakSaver(userRewards.streakSaverUsedAt);
    const daysUntilSaver = getDaysUntilStreakSaver(userRewards.streakSaverUsedAt);

    // Find habits with broken streaks (had completions but streak is 0 now)
    const brokenStreakHabits = habits.filter(h => {
        if (h.archived || h.type === 'task') return false;
        const streak = getCurrentStreak(h);
        return streak === 0 && h.completedDates.length > 0;
    });

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <div className="p-6 max-h-[85vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                        <Gift size={24} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-textPrimary">{t.title}</h2>
                        <p className="text-sm text-textSecondary">{t.subtitle}</p>
                    </div>
                </div>

                {/* Status Card with Level Display */}
                <div className="mt-6 p-4 bg-gradient-to-br from-brand/10 to-purple-500/10 rounded-2xl border border-brand/20">
                    {/* Level Badge - New! */}
                    <div className="mb-4 pb-4 border-b border-white/10">
                        <LevelBadge
                            totalXP={userRewards.totalXP}
                            language={language}
                            size="lg"
                            showProgress={true}
                            showXP={true}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-surface/50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-black text-brand">{currentBestStreak}</div>
                            <div className="text-xs text-textSecondary flex items-center justify-center gap-1">
                                <Flame size={12} className="text-orange-500" />
                                Best Streak
                            </div>
                        </div>
                        <div className="bg-surface/50 rounded-xl p-3 text-center">
                            <div className="text-2xl font-black text-green-500">{maxHabits}</div>
                            <div className="text-xs text-textSecondary">{t.maxHabits}</div>
                        </div>
                    </div>

                    {/* Habit slots breakdown */}
                    <div className="mt-3 flex items-center justify-center gap-2 text-xs text-textSecondary">
                        <span>{t.base}: {FREE_HABIT_LIMIT}</span>
                        <span>+</span>
                        <span className="text-green-500 font-bold">{t.bonus}: {userRewards.bonusHabitSlots}</span>
                    </div>
                </div>

                {/* Next Reward Progress */}
                {nextReward && (
                    <div className="mt-4 p-4 bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles size={16} className="text-amber-500" />
                            <span className="font-bold text-sm text-textPrimary">{t.nextReward}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1">
                                <div className="font-medium text-textPrimary">{nextReward.label[language]}</div>
                                <div className="text-xs text-textSecondary">{nextReward.description[language]}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-lg font-black text-brand">{daysToNext}</div>
                                <div className="text-[10px] text-textSecondary">{t.daysLeft}</div>
                            </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3 h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-500"
                                style={{ width: `${(currentBestStreak / nextReward.streakDays) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Rewards List */}
                <div className="mt-6 space-y-3">
                    <h3 className="font-bold text-sm text-textSecondary uppercase tracking-wider">
                        Streak Milestones
                    </h3>

                    {STREAK_REWARDS.map((reward, idx) => {
                        const isUnlocked = currentBestStreak >= reward.streakDays;

                        return (
                            <div
                                key={idx}
                                className={`p-4 rounded-2xl border transition-all ${isUnlocked
                                    ? 'bg-green-500/10 border-green-500/30'
                                    : 'bg-surface border-borderSubtle opacity-60'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isUnlocked
                                        ? 'bg-green-500 text-white'
                                        : 'bg-surfaceHighlight text-textSecondary'
                                        }`}>
                                        {isUnlocked ? <Check size={20} /> : <Lock size={16} />}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            {reward.badge && (
                                                <span className="text-lg">{reward.badge.emoji}</span>
                                            )}
                                            <span className={`font-bold text-sm ${isUnlocked ? 'text-green-600' : 'text-textPrimary'}`}>
                                                {reward.streakDays} {language === 'ru' ? 'дней' : 'days'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-textSecondary truncate">
                                            {reward.description[language]}
                                        </div>
                                    </div>

                                    {/* Slots earned */}
                                    <div className="text-right">
                                        <div className="text-lg font-black text-brand">+{reward.habitSlots}</div>
                                        <div className="text-[10px] text-textSecondary">{t.habits}</div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Earned Badges */}
                {userRewards.unlockedBadges.length > 0 ? (
                    <div className="mt-6">
                        <h3 className="font-bold text-sm text-textSecondary uppercase tracking-wider mb-3">
                            {t.earnedBadges}
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {userRewards.unlockedBadges.map(badgeId => {
                                const reward = STREAK_REWARDS.find(r => r.badge?.id === badgeId);
                                if (!reward?.badge) return null;
                                return (
                                    <div
                                        key={badgeId}
                                        className="px-3 py-2 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl border border-amber-500/30 flex items-center gap-2"
                                    >
                                        <span className="text-xl">{reward.badge.emoji}</span>
                                        <span className="text-xs font-bold text-amber-600">
                                            {reward.badge.label[language]}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="mt-6 p-4 bg-surfaceHighlight/30 rounded-2xl text-center">
                        <Trophy size={32} className="text-textSecondary mx-auto mb-2 opacity-50" />
                        <p className="text-sm text-textSecondary">{t.noBadges}</p>
                        <p className="text-xs text-textSecondary/70 mt-1">{t.keepGoing}</p>
                    </div>
                )}

                {/* Streak Saver Section */}
                <div className="mt-6 p-4 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-2xl border border-blue-500/20">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow">
                            <Shield size={20} className="text-white" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-sm text-textPrimary">
                                {language === 'ru' ? 'Спасатель Стрика' : 'Streak Saver'}
                            </h3>
                            <p className="text-[10px] text-textSecondary">
                                {language === 'ru' ? 'Спаси сломанный streak раз в месяц' : 'Save a broken streak once per month'}
                            </p>
                        </div>
                        {streakSaverAvailable ? (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-green-500/20 text-green-500">
                                {language === 'ru' ? 'Доступен' : 'Available'}
                            </span>
                        ) : (
                            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-surfaceHighlight text-textSecondary">
                                {daysUntilSaver} {language === 'ru' ? 'дн.' : 'days'}
                            </span>
                        )}
                    </div>

                    {/* Broken streaks list */}
                    {streakSaverAvailable && brokenStreakHabits.length > 0 && onUseStreakSaver ? (
                        <div className="space-y-2">
                            <p className="text-[10px] text-textSecondary uppercase font-bold mb-2">
                                {language === 'ru' ? 'Выбери привычку для спасения:' : 'Choose habit to save:'}
                            </p>
                            {brokenStreakHabits.slice(0, 3).map(habit => {
                                // Check if icon is emoji
                                const isEmoji = habit.icon && /[\p{Emoji_Presentation}\p{Extended_Pictographic}]/u.test(habit.icon);
                                const displayIcon = isEmoji ? habit.icon : '⚡';
                                return (
                                    <button
                                        key={habit.id}
                                        onClick={() => onUseStreakSaver(habit.id)}
                                        className="w-full flex items-center gap-3 p-3 bg-surface rounded-xl border border-borderSubtle hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                                    >
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-lg" style={{ backgroundColor: habit.color + '30' }}>
                                            {displayIcon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="text-sm font-medium text-textPrimary">{habit.name}</p>
                                            <p className="text-[10px] text-textSecondary">
                                                {habit.completedDates.length} {language === 'ru' ? 'выполнений' : 'completions'}
                                            </p>
                                        </div>
                                        <Shield size={16} className="text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                );
                            })}
                        </div>
                    ) : streakSaverAvailable ? (
                        <p className="text-xs text-textSecondary text-center py-2">
                            {language === 'ru' ? 'Все streak-и в порядке! 🎉' : 'All streaks are healthy! 🎉'}
                        </p>
                    ) : (
                        <p className="text-xs text-textSecondary text-center py-2">
                            {language === 'ru' ? `Следующий Спасатель через ${daysUntilSaver} дней` : `Next Saver available in ${daysUntilSaver} days`}
                        </p>
                    )}
                </div>
            </div>
        </Modal>
    );
};

export default RewardsModal;
