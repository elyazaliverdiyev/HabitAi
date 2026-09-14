import React from 'react';

interface SkeletonProps {
    className?: string;
    variant?: 'text' | 'circle' | 'rect';
    width?: string | number;
    height?: string | number;
    count?: number;
}

/**
 * Skeleton loading component for premium loading states
 */
const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    variant = 'rect',
    width,
    height,
    count = 1
}) => {
    const getVariantClass = () => {
        switch (variant) {
            case 'text': return 'skeleton skeleton-text';
            case 'circle': return 'skeleton skeleton-circle';
            default: return 'skeleton';
        }
    };

    const style: React.CSSProperties = {
        width: width ?? (variant === 'text' ? '100%' : undefined),
        height: height ?? (variant === 'text' ? 14 : variant === 'circle' ? width : undefined),
    };

    if (count === 1) {
        return <div className={`${getVariantClass()} ${className}`} style={style} />;
    }

    return (
        <div className="flex flex-col gap-2">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i} className={`${getVariantClass()} ${className}`} style={style} />
            ))}
        </div>
    );
};

/**
 * Skeleton Card - mimics habit card loading state
 */
export const SkeletonCard: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
    <div className={`bg-surface/80 border border-borderSubtle rounded-xl ${compact ? 'p-3' : 'p-4'} animate-pulse`}>
        <div className="flex items-start gap-3">
            {/* Icon */}
            <Skeleton variant="circle" width={compact ? 36 : 44} height={compact ? 36 : 44} />

            {/* Content */}
            <div className="flex-1 min-w-0">
                <Skeleton variant="text" width="60%" className="mb-2" />
                <Skeleton variant="text" width="40%" height={10} />
            </div>

            {/* Checkbox */}
            <Skeleton variant="circle" width={24} height={24} />
        </div>

        {!compact && (
            <div className="mt-3 pt-3 border-t border-borderSubtle">
                <Skeleton variant="rect" height={8} className="rounded-full" />
            </div>
        )}
    </div>
);

/**
 * Skeleton List - multiple skeleton cards
 */
export const SkeletonList: React.FC<{ count?: number; compact?: boolean }> = ({
    count = 3,
    compact = false
}) => (
    <div className={`grid gap-3 ${compact ? 'grid-cols-1' : ''}`}>
        {Array.from({ length: count }).map((_, i) => (
            <div
                key={i}
                className="animate-fadeIn"
                style={{ animationDelay: `${i * 0.1}s` }}
            >
                <SkeletonCard compact={compact} />
            </div>
        ))}
    </div>
);

export default Skeleton;
