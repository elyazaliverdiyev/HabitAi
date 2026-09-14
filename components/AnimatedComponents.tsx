import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

// Reusable animation variants for cards
export const cardVariants = {
    hidden: {
        opacity: 0,
        y: 20,
        scale: 0.95
    },
    visible: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: motionControl
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        transition: { duration: 0.2 }
    },
    tap: {
        scale: 0.98
    },
    hover: {
        scale: 1.02,
        transition: { duration: 0.2 }
    }
};

// Stagger children animation
export const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1
        }
    }
};

// Checkmark animation
export const checkVariants = {
    unchecked: {
        scale: 1,
        rotate: 0
    },
    checked: {
        scale: [1, 1.3, 1],
        rotate: [0, -10, 10, 0],
        transition: {
            duration: 0.4,
            ease: "easeOut"
        }
    }
};

// Success pulse animation
export const pulseVariants = {
    initial: { scale: 1, opacity: 0 },
    animate: {
        scale: [1, 1.5, 2],
        opacity: [0.5, 0.3, 0],
        transition: {
            duration: 0.6,
            ease: "easeOut"
        }
    }
};

interface AnimatedCardProps {
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
    delay?: number;
    layoutId?: string;
}

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
    children,
    className = '',
    onClick,
    delay = 0,
    layoutId
}) => {
    return (
        <motion.div
            className={className}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileTap={onClick ? "tap" : undefined}
            whileHover={onClick ? "hover" : undefined}
            transition={{ delay }}
            onClick={onClick}
            layoutId={layoutId}
            style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
            {children}
        </motion.div>
    );
};

interface AnimatedListProps {
    children: React.ReactNode;
    className?: string;
}

export const AnimatedListContainer: React.FC<AnimatedListProps> = ({
    children,
    className = ''
}) => {
    return (
        <motion.div
            className={className}
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {children}
        </motion.div>
    );
};

interface AnimatedCheckProps {
    isChecked: boolean;
    color?: string;
    size?: number;
    onToggle?: () => void;
}

export const AnimatedCheck: React.FC<AnimatedCheckProps> = ({
    isChecked,
    color = '#10B981',
    size = 24,
    onToggle
}) => {
    return (
        <motion.div
            className="relative flex items-center justify-center"
            onClick={(e) => {
                e.stopPropagation();
                onToggle?.();
            }}
            style={{ width: size, height: size, cursor: 'pointer' }}
        >
            {/* Pulse effect on check */}
            <AnimatePresence>
                {isChecked && (
                    <motion.div
                        className="absolute inset-0 rounded-full"
                        style={{ backgroundColor: color }}
                        variants={pulseVariants}
                        initial="initial"
                        animate="animate"
                        exit={{ opacity: 0 }}
                    />
                )}
            </AnimatePresence>

            {/* Checkbox */}
            <motion.div
                variants={checkVariants}
                animate={isChecked ? "checked" : "unchecked"}
            >
                {isChecked ? (
                    <CheckCircle2
                        size={size}
                        style={{ color }}
                        fill={color}
                        stroke="white"
                        strokeWidth={2}
                    />
                ) : (
                    <div
                        className="rounded-full border-2"
                        style={{
                            width: size,
                            height: size,
                            borderColor: 'rgba(255,255,255,0.2)'
                        }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};

// Skeleton loader with shimmer
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => {
    return (
        <div className={`relative overflow-hidden bg-white/5 rounded-xl ${className}`}>
            <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                animate={{
                    x: ['-100%', '100%']
                }}
                transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    ease: 'linear'
                }}
            />
        </div>
    );
};

// Card skeleton
export const CardSkeleton: React.FC = () => {
    return (
        <div className="glass-card p-4 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        </div>
    );
};

// Page transition wrapper
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
};

// Success animation overlay
export const SuccessOverlay: React.FC<{ show: boolean; message?: string }> = ({
    show,
    message = '✓'
}) => {
    return (
        <AnimatePresence>
            {show && (
                <motion.div
                    className="fixed inset-0 z-[9999] flex items-center justify-center pointer-events-none"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        className="bg-green-500/20 backdrop-blur-xl rounded-3xl p-8"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ type: "spring", damping: 20 }}
                    >
                        <span className="text-6xl">{message}</span>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default AnimatedCard;
