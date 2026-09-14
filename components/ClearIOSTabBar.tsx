import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Target, TrendingUp, Trophy, Menu } from 'lucide-react';

// ============================================
// CLEAR iOS TAB BAR
// Premium navigation with spring animations
// Inspired by Telegram / iOS 26 Liquid Glass
// THEME-ADAPTIVE: Uses CSS variables
// ============================================

export type TabId = 'home' | 'calendar' | 'stats' | 'community';

interface ClearIOSTabBarProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
    onFocusPress: () => void;
    onMenuPress: () => void;
    isPro?: boolean;
    language?: 'ru' | 'en';
}

interface TabItem {
    id: TabId;
    icon: React.ComponentType<{ size: number; className?: string }>;
    label: { ru: string; en: string };
}

const tabs: TabItem[] = [
    { id: 'home', icon: Home, label: { ru: 'Главная', en: 'Home' } },
    { id: 'calendar', icon: Calendar, label: { ru: 'Календарь', en: 'Calendar' } },
    { id: 'stats', icon: TrendingUp, label: { ru: 'Статистика', en: 'Stats' } },
    { id: 'community', icon: Trophy, label: { ru: 'Рейтинг', en: 'Leaderboard' } },
];

// Spring configuration matching iOS feel (motionControl token values)
const springConfig = {
    type: "spring" as const,
    stiffness: 450,
    damping: 32,
    mass: 0.6
};

// Detect if current theme is light
const useIsLightTheme = () => {
    const LIGHT_THEMES = ['daylight', 'ios-light', 'frosted-glass'];
    const [isLight, setIsLight] = React.useState(() => {
        if (typeof document !== 'undefined') {
            const theme = document.documentElement.getAttribute('data-theme') || '';
            return LIGHT_THEMES.includes(theme);
        }
        return false;
    });

    React.useEffect(() => {
        const observer = new MutationObserver(() => {
            const theme = document.documentElement.getAttribute('data-theme') || '';
            setIsLight(LIGHT_THEMES.includes(theme));
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });

        return () => observer.disconnect();
    }, []);

    return isLight;
};

const ClearIOSTabBar: React.FC<ClearIOSTabBarProps> = ({
    activeTab,
    onTabChange,
    onFocusPress,
    onMenuPress,
    isPro = false,
    language = 'en'
}) => {
    const isLight = useIsLightTheme();

    // Theme-adaptive glass styles
    const glassStyles = isLight ? {
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        boxShadow: `
            0 18px 40px rgba(0, 0, 0, 0.12),
            0 0 0 0.5px rgba(0, 0, 0, 0.05) inset,
            0 1px 0 rgba(255, 255, 255, 0.8) inset
        `
    } : {
        background: 'rgba(255, 255, 255, 0.08)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        border: '1px solid rgba(255, 255, 255, 0.25)',
        boxShadow: `
            0 18px 40px rgba(0, 0, 0, 0.35),
            0 0 0 0.5px rgba(255, 255, 255, 0.1) inset,
            0 1px 0 rgba(255, 255, 255, 0.15) inset
        `
    };

    return (
        <motion.div
            className="fixed bottom-6 left-1/2 z-50"
            initial={{ y: 100, x: '-50%' }}
            animate={{ y: 0, x: '-50%' }}
            transition={{ ...springConfig, delay: 0.2 }}
        >
            {/* Glass Container */}
            <div
                className="relative rounded-[28px] px-3 py-2.5 flex items-center gap-1"
                style={glassStyles}
            >
                {/* Left tabs */}
                {tabs.slice(0, 2).map((tab) => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        language={language}
                        isLight={isLight}
                    />
                ))}

                {/* Central Focus Button */}
                <motion.button
                    onClick={onFocusPress}
                    className="relative mx-1"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    transition={springConfig}
                >
                    <motion.div
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-brand to-purple-500 flex items-center justify-center shadow-xl -mt-5"
                        style={{
                            boxShadow: '0 8px 25px var(--brand), 0 0 50px rgba(var(--brand-rgb), 0.3)'
                        }}
                        animate={{
                            boxShadow: [
                                '0 8px 25px var(--brand), 0 0 30px rgba(var(--brand-rgb), 0.2)',
                                '0 8px 30px var(--brand), 0 0 50px rgba(var(--brand-rgb), 0.4)',
                                '0 8px 25px var(--brand), 0 0 30px rgba(var(--brand-rgb), 0.2)'
                            ]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Target size={22} className="text-white" strokeWidth={2.5} />
                    </motion.div>

                    {/* Ring pulse effect */}
                    <motion.div
                        className="absolute inset-0 -mt-5 rounded-full border-2 border-brand/50"
                        animate={{
                            scale: [1, 1.4, 1.4],
                            opacity: [0.5, 0, 0]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeOut"
                        }}
                    />
                </motion.button>

                {/* Right tabs */}
                {tabs.slice(2).map((tab) => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        language={language}
                        isLight={isLight}
                    />
                ))}

                {/* Menu button */}
                <motion.button
                    onClick={onMenuPress}
                    className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isLight ? 'text-black/40 hover:text-black' : 'text-white/60 hover:text-white'
                        }`}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springConfig}
                >
                    <Menu size={20} />
                    {!isPro && (
                        <motion.div
                            className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                        />
                    )}
                </motion.button>
            </div>
        </motion.div>
    );
};

// Individual Tab Button Component
interface TabButtonProps {
    tab: TabItem;
    isActive: boolean;
    onClick: () => void;
    language: 'ru' | 'en';
    isLight: boolean;
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onClick, language, isLight }) => {
    const Icon = tab.icon;

    // Theme-adaptive colors
    const inactiveColor = isLight ? 'rgba(0, 0, 0, 0.35)' : 'rgba(255, 255, 255, 0.5)';
    const activeTextClass = 'text-brand';
    const inactiveTextClass = isLight ? 'text-black/35' : 'text-white/50';

    return (
        <motion.button
            onClick={onClick}
            className="relative w-12 h-10 rounded-xl flex items-center justify-center"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.9 }}
            transition={springConfig}
        >
            {/* Active indicator background */}
            <AnimatePresence>
                {isActive && (
                    <motion.div
                        className="absolute inset-0 rounded-xl"
                        style={{
                            background: 'linear-gradient(135deg, rgba(var(--brand-rgb), 0.25), rgba(var(--brand-rgb), 0.1))',
                            border: '1px solid rgba(var(--brand-rgb), 0.3)'
                        }}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={springConfig}
                        layoutId="activeTab"
                    />
                )}
            </AnimatePresence>

            {/* Icon */}
            <motion.div
                animate={{
                    scale: isActive ? 1.1 : 1,
                    color: isActive ? 'var(--brand)' : inactiveColor
                }}
                transition={springConfig}
                style={{
                    filter: isActive ? 'drop-shadow(0 0 8px var(--brand))' : 'none'
                }}
            >
                <Icon size={20} className={isActive ? activeTextClass : inactiveTextClass} />
            </motion.div>
        </motion.button>
    );
};

export default ClearIOSTabBar;
