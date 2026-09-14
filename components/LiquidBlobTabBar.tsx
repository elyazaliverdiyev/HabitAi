import React, { useState, useEffect, useRef } from 'react';
import { motion, useSpring, useTransform, AnimatePresence } from 'framer-motion';
import { Home, Calendar, Target, TrendingUp, Trophy, Menu } from 'lucide-react';

// ============================================
// LIQUID BLOB TAB BAR
// Zerion / Telegram style живая капля
// Морфинговая SVG анимация между табами
// ============================================

export type TabId = 'home' | 'calendar' | 'stats' | 'community';

interface LiquidBlobTabBarProps {
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

// Spring config for liquid feel (motionContainer token values)
const liquidSpring = {
    type: "spring" as const,
    stiffness: 450,
    damping: 32,
    mass: 0.6
};

// Blob morph paths for different positions
const blobPaths = [
    "M45,25 C55,8 70,5 75,25 C80,45 65,55 45,50 C25,45 35,42 45,25",
    "M42,22 C58,5 72,8 78,28 C82,48 62,58 42,52 C22,48 32,42 42,22",
    "M48,20 C60,3 75,10 80,30 C85,50 68,58 48,55 C28,50 38,45 48,20",
    "M44,23 C56,6 73,6 77,26 C81,46 64,56 44,52 C24,46 34,43 44,23",
];

const LiquidBlobTabBar: React.FC<LiquidBlobTabBarProps> = ({
    activeTab,
    onTabChange,
    onFocusPress,
    onMenuPress,
    isPro = false,
    language = 'en'
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [blobPosition, setBlobPosition] = useState({ x: 0, width: 60 });
    const [currentPath, setCurrentPath] = useState(0);

    // Spring animation for blob position
    const springX = useSpring(0, liquidSpring);

    // Calculate tab positions
    useEffect(() => {
        if (!containerRef.current) return;

        const tabIndex = tabs.findIndex(t => t.id === activeTab);
        if (tabIndex === -1) return;

        // Calculate position based on tab index
        // Account for the center Focus button
        const baseOffset = 16; // padding
        const tabWidth = 52;
        const gap = 4;

        let xPos = baseOffset;
        if (tabIndex < 2) {
            // Left side tabs
            xPos = baseOffset + tabIndex * (tabWidth + gap);
        } else {
            // Right side tabs (after Focus button)
            const focusWidth = 56;
            const focusGap = 12;
            xPos = baseOffset + 2 * (tabWidth + gap) + focusWidth + focusGap + (tabIndex - 2) * (tabWidth + gap);
        }

        springX.set(xPos);
        setBlobPosition({ x: xPos, width: tabWidth });

        // Cycle through blob paths for organic feel
        setCurrentPath((prev) => (prev + 1) % blobPaths.length);
    }, [activeTab, springX]);

    // Animate blob path continuously
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentPath((prev) => (prev + 1) % blobPaths.length);
        }, 2000);
        return () => clearInterval(interval);
    }, []);

    const blobX = useTransform(springX, (x) => x);

    return (
        <div
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
        >
            {/* Glass Container */}
            <div
                ref={containerRef}
                className="relative rounded-[28px] px-3 py-2.5 flex items-center gap-1"
                style={{
                    background: 'rgba(30, 30, 35, 0.85)',
                    backdropFilter: 'blur(30px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(30px) saturate(180%)',
                    border: '1px solid rgba(255, 255, 255, 0.12)',
                    boxShadow: '0 18px 40px rgba(0, 0, 0, 0.4)'
                }}
            >
                {/* Animated Liquid Blob */}
                <motion.div
                    className="absolute top-1/2 -translate-y-1/2 pointer-events-none"
                    style={{
                        x: blobX,
                        width: blobPosition.width,
                        height: 48,
                    }}
                >
                    {/* SVG Blob with morphing animation */}
                    <svg
                        viewBox="0 0 100 60"
                        className="w-full h-full overflow-visible"
                        style={{ filter: 'url(#goo)' }}
                    >
                        {/* Goo filter for liquid effect */}
                        <defs>
                            <filter id="goo">
                                <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
                                <feColorMatrix
                                    in="blur"
                                    mode="matrix"
                                    values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 25 -10"
                                    result="goo"
                                />
                                <feComposite in="SourceGraphic" in2="goo" operator="atop" />
                            </filter>

                            {/* Holographic gradient */}
                            <linearGradient id="holoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%">
                                    <animate
                                        attributeName="stop-color"
                                        values="#ff6b9d;#c44cff;#6b9dff;#ff6b9d"
                                        dur="3s"
                                        repeatCount="indefinite"
                                    />
                                </stop>
                                <stop offset="50%">
                                    <animate
                                        attributeName="stop-color"
                                        values="#c44cff;#6b9dff;#ff6b9d;#c44cff"
                                        dur="3s"
                                        repeatCount="indefinite"
                                    />
                                </stop>
                                <stop offset="100%">
                                    <animate
                                        attributeName="stop-color"
                                        values="#6b9dff;#ff6b9d;#c44cff;#6b9dff"
                                        dur="3s"
                                        repeatCount="indefinite"
                                    />
                                </stop>
                            </linearGradient>

                            {/* Glow effect */}
                            <filter id="blobGlow" x="-50%" y="-50%" width="200%" height="200%">
                                <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                                <feMerge>
                                    <feMergeNode in="coloredBlur" />
                                    <feMergeNode in="SourceGraphic" />
                                </feMerge>
                            </filter>
                        </defs>

                        {/* Main blob */}
                        <motion.path
                            d={blobPaths[currentPath]}
                            fill="url(#holoGradient)"
                            filter="url(#blobGlow)"
                            animate={{
                                d: blobPaths[(currentPath + 1) % blobPaths.length],
                            }}
                            transition={{
                                duration: 2,
                                ease: "easeInOut",
                                repeat: Infinity,
                                repeatType: "reverse"
                            }}
                        />

                        {/* Inner highlight */}
                        <motion.ellipse
                            cx="50"
                            cy="25"
                            rx="15"
                            ry="8"
                            fill="rgba(255, 255, 255, 0.3)"
                            animate={{
                                rx: [15, 18, 15],
                                ry: [8, 10, 8],
                                cy: [22, 28, 22]
                            }}
                            transition={{
                                duration: 2,
                                ease: "easeInOut",
                                repeat: Infinity
                            }}
                        />
                    </svg>
                </motion.div>

                {/* Left tabs */}
                {tabs.slice(0, 2).map((tab) => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        language={language}
                    />
                ))}

                {/* Central Focus Button */}
                <motion.button
                    onClick={onFocusPress}
                    className="relative mx-2"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    transition={liquidSpring}
                >
                    <motion.div
                        className="w-14 h-14 rounded-full bg-gradient-to-br from-brand via-purple-500 to-pink-500 flex items-center justify-center shadow-xl -mt-6"
                        animate={{
                            boxShadow: [
                                '0 8px 25px rgba(139, 92, 246, 0.4)',
                                '0 12px 35px rgba(139, 92, 246, 0.6)',
                                '0 8px 25px rgba(139, 92, 246, 0.4)'
                            ]
                        }}
                        transition={{
                            duration: 2,
                            repeat: Infinity,
                            ease: "easeInOut"
                        }}
                    >
                        <Target size={24} className="text-white" strokeWidth={2.5} />
                    </motion.div>
                </motion.button>

                {/* Right tabs */}
                {tabs.slice(2).map((tab) => (
                    <TabButton
                        key={tab.id}
                        tab={tab}
                        isActive={activeTab === tab.id}
                        onClick={() => onTabChange(tab.id)}
                        language={language}
                    />
                ))}

                {/* Menu button */}
                <motion.button
                    onClick={onMenuPress}
                    className="relative w-12 h-12 rounded-xl flex items-center justify-center text-white/50 hover:text-white"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={liquidSpring}
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
        </div>
    );
};

// Individual Tab Button Component
interface TabButtonProps {
    tab: TabItem;
    isActive: boolean;
    onClick: () => void;
    language: 'ru' | 'en';
}

const TabButton: React.FC<TabButtonProps> = ({ tab, isActive, onClick, language }) => {
    const Icon = tab.icon;

    return (
        <motion.button
            onClick={onClick}
            className="relative w-[52px] h-12 rounded-xl flex flex-col items-center justify-center gap-0.5 z-10"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={liquidSpring}
        >
            {/* Icon */}
            <motion.div
                animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0
                }}
                transition={liquidSpring}
            >
                <Icon
                    size={22}
                    className={isActive ? 'text-white' : 'text-white/40'}
                    style={{
                        filter: isActive ? 'drop-shadow(0 0 8px rgba(255,255,255,0.5))' : 'none'
                    }}
                />
            </motion.div>

            {/* Label */}
            <motion.span
                className={`text-[9px] font-medium ${isActive ? 'text-white' : 'text-white/40'}`}
                animate={{
                    opacity: isActive ? 1 : 0.5,
                    y: isActive ? 0 : 2
                }}
                transition={liquidSpring}
            >
                {tab.label[language]}
            </motion.span>
        </motion.button>
    );
};

export default LiquidBlobTabBar;
