import React, { useRef, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Target, TrendingUp, Trophy, Menu, Gift, Sparkles, Mic } from 'lucide-react';
import { dockSpring, iconPop, motionControl, motionPress } from '../utils/motionPresets';

// ===========================================
// LIQUID DOCK — iOS 26 Liquid Glass Navigation
// Interactive shimmer, light refraction, grow effects
// Mouse-tracking specular highlights
// ===========================================

export type TabId = 'home' | 'calendar' | 'focus' | 'stats' | 'community';

interface LiquidDockProps {
    activeTab: TabId;
    setActiveTab: (tab: TabId) => void;
    onFocusPress: () => void;
    setIsSettingsOpen: (open: boolean) => void;
    onRewardsOpen: () => void;
    onMindMovieOpen: () => void;
    onVoiceAssistantOpen: () => void;
    isPro?: boolean;
    language?: 'ru' | 'en';
}

const tabs = [
    { id: 'home' as TabId, icon: Home, label: { ru: 'Главная', en: 'Home' } },
    { id: 'calendar' as TabId, icon: Calendar, label: { ru: 'План', en: 'Plan' } },
    { id: 'focus' as TabId, icon: Target, label: { ru: 'Фокус', en: 'Focus' } },
    { id: 'stats' as TabId, icon: TrendingUp, label: { ru: 'Стата', en: 'Stats' } },
    { id: 'community' as TabId, icon: Trophy, label: { ru: 'Топ', en: 'Top' } }
];

const LIGHT_THEMES = ['daylight', 'ios-light', 'frosted-glass'];

// Spring for the entire dock entrance with materialise effect (motionContainer)
const dockEntrance = {
    type: "spring" as const,
    bounce: 0.05,
    duration: 0.32
};

// Glass interactive spring (iOS 26 grow) — motionControl values
const glassGrow = {
    type: "spring" as const,
    stiffness: 450,
    damping: 32,
    mass: 0.6
};

const LiquidDock: React.FC<LiquidDockProps> = ({
    activeTab,
    setActiveTab,
    onFocusPress,
    setIsSettingsOpen,
    onRewardsOpen,
    onMindMovieOpen,
    onVoiceAssistantOpen,
    isPro = false,
    language = 'en'
}) => {
    const dockRef = useRef<HTMLDivElement>(null);
    const [isHovered, setIsHovered] = useState(false);

    // Reactive theme detection
    const [isLightTheme, setIsLightTheme] = React.useState(() => {
        if (typeof document === 'undefined') return false;
        return LIGHT_THEMES.some(theme => document.documentElement.getAttribute('data-theme') === theme);
    });

    React.useEffect(() => {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    setIsLightTheme(
                        LIGHT_THEMES.some(theme => document.documentElement.getAttribute('data-theme') === theme)
                    );
                }
            });
        });
        observer.observe(document.documentElement, { attributes: true });
        return () => observer.disconnect();
    }, []);

    // VisionOS Spatial-UI параметры (ui-ux-pro-max: blur 40px saturate 180%)
    const pillBg = isLightTheme ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.15)';
    const textActive = isLightTheme ? 'text-gray-900' : 'text-white';
    const textInactive = isLightTheme ? 'text-gray-400' : 'text-white/50';
    const dividerColor = isLightTheme ? 'bg-black/10' : 'bg-white/15';

    const glassStyles: React.CSSProperties = {
        background: isLightTheme ? 'rgba(255, 255, 255, 0.72)' : 'rgba(28, 28, 32, 0.68)',
        backdropFilter: 'blur(40px) saturate(180%)',
        WebkitBackdropFilter: 'blur(40px) saturate(180%)',
        boxShadow: isLightTheme
            ? '0 8px 32px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,0.5)'
            : '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        border: isLightTheme
            ? '1px solid rgba(255,255,255,0.6)'
            : '1px solid rgba(255,255,255,0.12)',
    };

    return (
        <div className="fixed left-1/2 -translate-x-1/2 z-50" style={{ bottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.25rem)' }}>
            <motion.nav
                ref={dockRef}
                initial={{ y: 100, opacity: 0, scale: 0.85 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={dockEntrance}
                className="relative flex items-center gap-1 px-2 py-2 rounded-[28px] max-w-[calc(100vw-1.5rem)] overflow-x-auto no-scrollbar"
                style={glassStyles}
            >

                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    const isFocus = tab.id === 'focus';
                    const Icon = tab.icon;

                    return (
                        <motion.button
                            key={tab.id}
                            onClick={() => isFocus ? onFocusPress() : setActiveTab(tab.id)}
                            className="relative px-2 sm:px-3 py-2 outline-none rounded-xl shrink-0"
                            style={{ zIndex: 5 }}
                            whileHover={!isFocus ? { scale: 1.06 } : undefined}
                            whileTap={{ scale: 0.93 }}
                            transition={motionPress}
                        >
                            {isActive && !isFocus && (
                                <motion.div
                                    layoutId="dock-active-pill"
                                    className="absolute inset-0 rounded-xl"
                                    style={{
                                        background: pillBg,
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    }}
                                    transition={motionControl}
                                />
                            )}
                            {isFocus ? (
                                <div className="relative -mt-4">
                                    <motion.div
                                        className="absolute rounded-full"
                                        style={{
                                            width: 48, height: 48, top: 0, left: -6,
                                            background: 'var(--brand)', opacity: 0.35, filter: 'blur(10px)',
                                        }}
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.3, 0.5, 0.3],
                                        }}
                                        transition={{
                                            duration: 3,
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                        }}
                                    />
                                    <motion.div
                                        className="relative bg-brand rounded-full p-3 z-10"
                                        style={{
                                            border: isLightTheme ? '5px solid rgba(255,255,255,0.9)' : '5px solid rgba(35,35,40,0.95)',
                                            boxShadow: '0 0 25px var(--brand), 0 6px 15px rgba(0,0,0,0.2)',
                                        }}
                                        whileHover={{ scale: 1.05, rotate: 10 }}
                                        whileTap={{ scale: 0.85 }}
                                        transition={dockSpring}
                                    >
                                        <Icon size={18} className="text-white" strokeWidth={2.5} />
                                    </motion.div>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-0.5 relative">
                                    <div>
                                        <Icon
                                            size={18}
                                            className={`transition-colors duration-200 ${isActive ? textActive : textInactive}`}
                                            strokeWidth={isActive ? 2.5 : 2}
                                        />
                                    </div>
                                    <motion.span
                                        className={`hidden sm:block text-[9px] font-bold uppercase tracking-tight transition-colors duration-300 ${isActive ? textActive : textInactive}`}
                                        animate={isActive ? { opacity: 1, y: 0 } : { opacity: 0.7, y: 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {tab.label[language]}
                                    </motion.span>


                                </div>
                            )}
                        </motion.button>
                    );
                })}

                <div className={`w-px h-5 ${dividerColor} mx-1`} style={{ zIndex: 5 }} />

                <div className="flex items-center gap-1">
                    <motion.button
                        onClick={onVoiceAssistantOpen}
                        className="relative p-2.5 mx-1 rounded-full bg-brand/10 text-brand border border-brand/20 transition-colors"
                        style={{ zIndex: 5, boxShadow: '0 0 10px rgba(99, 102, 241, 0.2)' }}
                        whileHover={{ scale: 1.1, backgroundColor: 'var(--brand)', color: 'white' }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Mic size={20} />
                    </motion.button>

                    <motion.button
                        onClick={() => setIsSettingsOpen(true)}
                        className={`p-2 ${textInactive} hover:${textActive} transition-colors`}
                        style={{ zIndex: 5 }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                    >
                        <Menu size={18} />
                    </motion.button>
                </div>
            </motion.nav>
        </div>
    );
};

export default LiquidDock;
