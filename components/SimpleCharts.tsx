import React, { useMemo } from 'react';

// ============================================
// PREMIUM CHARTS 2026 - Linear/Revolut Level
// ============================================
// Modern, beautiful, animated SVG charts
// No external dependencies, pure React + SVG

// ============================================
// PREMIUM AREA CHART (Gradient Fill + Glow)
// ============================================
interface AreaChartDataPoint {
    label?: string;
    value: number;
}

interface PremiumAreaChartProps {
    data: AreaChartDataPoint[];
    height?: number;
    gradientColors?: { start: string; end: string };
    showLabels?: boolean;
    showGrid?: boolean;
}

export const PremiumAreaChart: React.FC<PremiumAreaChartProps> = ({
    data,
    height = 160,
    gradientColors = { start: '#8b5cf6', end: '#06b6d4' },
    showLabels = true,
    showGrid = true
}) => {
    if (!data || data.length < 2) {
        return (
            <div className="flex items-center justify-center text-textSecondary/50 text-sm" style={{ height }}>
                Недостаточно данных
            </div>
        );
    }

    const width = 340;
    const padding = { top: 20, right: 20, bottom: 30, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    const values = data.map(d => d.value || 0);
    const maxVal = Math.max(...values, 1);
    const minVal = Math.min(...values, 0);
    const range = maxVal - minVal || 1;

    // Calculate points
    const points = useMemo(() => {
        return data.map((d, i) => {
            const x = padding.left + (i / (data.length - 1)) * chartWidth;
            const y = padding.top + chartHeight - ((d.value - minVal) / range) * chartHeight;
            return { x, y, value: d.value, label: d.label };
        });
    }, [data, chartWidth, chartHeight, minVal, range]);

    // Create smooth bezier curve path
    const linePath = useMemo(() => {
        if (points.length < 2) return '';

        let path = `M ${points[0].x} ${points[0].y}`;

        for (let i = 0; i < points.length - 1; i++) {
            const p0 = points[Math.max(0, i - 1)];
            const p1 = points[i];
            const p2 = points[i + 1];
            const p3 = points[Math.min(points.length - 1, i + 2)];

            const cp1x = p1.x + (p2.x - p0.x) / 6;
            const cp1y = p1.y + (p2.y - p0.y) / 6;
            const cp2x = p2.x - (p3.x - p1.x) / 6;
            const cp2y = p2.y - (p3.y - p1.y) / 6;

            path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
        }

        return path;
    }, [points]);

    const areaPath = linePath +
        ` L ${points[points.length - 1].x} ${height - padding.bottom} ` +
        ` L ${points[0].x} ${height - padding.bottom} Z`;

    const gradientId = `area-grad-${Math.random().toString(36).slice(2)}`;
    const glowId = `area-glow-${Math.random().toString(36).slice(2)}`;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                {/* Main gradient */}
                <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={gradientColors.start} stopOpacity="0.6" />
                    <stop offset="50%" stopColor={gradientColors.end} stopOpacity="0.3" />
                    <stop offset="100%" stopColor={gradientColors.end} stopOpacity="0.05" />
                </linearGradient>

                {/* Line gradient */}
                <linearGradient id={`${gradientId}-line`} x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor={gradientColors.start} />
                    <stop offset="100%" stopColor={gradientColors.end} />
                </linearGradient>

                {/* Glow filter */}
                <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="4" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Grid lines */}
            {showGrid && [0.25, 0.5, 0.75].map((level, i) => (
                <line
                    key={i}
                    x1={padding.left}
                    y1={padding.top + chartHeight * (1 - level)}
                    x2={width - padding.right}
                    y2={padding.top + chartHeight * (1 - level)}
                    stroke="currentColor"
                    strokeOpacity="0.06"
                    strokeDasharray="4 4"
                />
            ))}

            {/* Filled area */}
            <path
                d={areaPath}
                fill={`url(#${gradientId})`}
            />

            {/* Glowing line */}
            <path
                d={linePath}
                fill="none"
                stroke={`url(#${gradientId}-line)`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
            />

            {/* Data points with animation */}
            {points.map((p, i) => (
                <g key={i}>
                    {/* Outer glow */}
                    <circle
                        cx={p.x}
                        cy={p.y}
                        r="8"
                        fill={gradientColors.end}
                        opacity="0.3"
                    >
                        <animate
                            attributeName="r"
                            values="6;10;6"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                        <animate
                            attributeName="opacity"
                            values="0.3;0.1;0.3"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Inner dot */}
                    <circle
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="white"
                        stroke={gradientColors.end}
                        strokeWidth="2"
                    />
                </g>
            ))}

            {/* X-axis labels */}
            {showLabels && points.map((p, i) => (
                <text
                    key={i}
                    x={p.x}
                    y={height - 8}
                    textAnchor="middle"
                    fill="currentColor"
                    fillOpacity="0.4"
                    fontSize="10"
                    fontWeight="600"
                >
                    {p.label || ''}
                </text>
            ))}
        </svg>
    );
};

// ============================================
// PREMIUM BAR CHART (3D Effect + Glow)
// ============================================
interface BarChartDataPoint {
    label: string;
    value: number;
    color?: string;
}

interface PremiumBarChartProps {
    data: BarChartDataPoint[];
    height?: number;
    showValues?: boolean;
    animated?: boolean;
}

export const PremiumBarChart: React.FC<PremiumBarChartProps> = ({
    data,
    height = 200,
    showValues = true,
    animated = true
}) => {
    if (!data || !data.length) {
        return (
            <div className="flex items-center justify-center text-textSecondary/50 text-sm" style={{ height }}>
                Нет данных
            </div>
        );
    }

    const colors = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4'];
    const maxVal = Math.max(...data.map(d => d.value || 0), 1);
    const width = 340;
    const padding = { top: 30, bottom: 35, left: 15, right: 15 };
    const barWidth = Math.min(45, (width - padding.left - padding.right) / data.length - 12);
    const chartHeight = height - padding.top - padding.bottom;

    return (
        <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet">
            <defs>
                {data.map((d, i) => {
                    const color = d.color || colors[i % colors.length];
                    return (
                        <React.Fragment key={i}>
                            {/* Bar gradient */}
                            <linearGradient id={`bar-grad-${i}`} x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color} stopOpacity="1" />
                                <stop offset="70%" stopColor={color} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                            </linearGradient>
                            {/* 3D side effect */}
                            <linearGradient id={`bar-side-${i}`} x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor={color} stopOpacity="0.4" />
                                <stop offset="100%" stopColor={color} stopOpacity="0.2" />
                            </linearGradient>
                            {/* Glow filter */}
                            <filter id={`bar-glow-${i}`} x="-50%" y="-50%" width="200%" height="200%">
                                <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={color} floodOpacity="0.4" />
                            </filter>
                        </React.Fragment>
                    );
                })}
            </defs>

            {data.map((d, i) => {
                const color = d.color || colors[i % colors.length];
                const barH = Math.max((d.value / maxVal) * chartHeight, 8);
                const totalWidth = data.length * (barWidth + 12);
                const startX = (width - totalWidth) / 2;
                const x = startX + i * (barWidth + 12) + 6;
                const y = height - padding.bottom - barH;

                return (
                    <g key={i}>
                        {/* 3D side effect */}
                        <path
                            d={`M ${x + barWidth} ${y + 6} L ${x + barWidth + 6} ${y} L ${x + barWidth + 6} ${y + barH - 6} L ${x + barWidth} ${y + barH} Z`}
                            fill={`url(#bar-side-${i})`}
                        />

                        {/* Main bar with rounded corners */}
                        <rect
                            x={x}
                            y={y}
                            width={barWidth}
                            height={barH}
                            rx={10}
                            fill={`url(#bar-grad-${i})`}
                            filter={`url(#bar-glow-${i})`}
                        >
                            {animated && (
                                <animate
                                    attributeName="height"
                                    from="0"
                                    to={barH}
                                    dur="0.6s"
                                    fill="freeze"
                                    calcMode="spline"
                                    keySplines="0.25 0.1 0.25 1"
                                />
                            )}
                        </rect>

                        {/* Value on top */}
                        {showValues && (
                            <text
                                x={x + barWidth / 2}
                                y={y - 8}
                                textAnchor="middle"
                                fill="currentColor"
                                fillOpacity="0.7"
                                fontSize="12"
                                fontWeight="bold"
                            >
                                {d.value}
                            </text>
                        )}

                        {/* Label below */}
                        <g>
                            <circle
                                cx={x + barWidth / 2 - 10}
                                cy={height - 12}
                                r="4"
                                fill={color}
                            />
                            <text
                                x={x + barWidth / 2 + 4}
                                y={height - 8}
                                textAnchor="middle"
                                fill="currentColor"
                                fillOpacity="0.5"
                                fontSize="9"
                                fontWeight="600"
                            >
                                {d.label}
                            </text>
                        </g>
                    </g>
                );
            })}
        </svg>
    );
};

// ============================================
// PREMIUM RADAR CHART (Hexagonal + Glow)
// ============================================
interface RadarDataPoint {
    label: string;
    value: number;
    fullMark?: number;
    color?: string;
}

interface PremiumRadarChartProps {
    data: RadarDataPoint[];
    size?: number;
    color?: string;
    showLabels?: boolean;
}

export const PremiumRadarChart: React.FC<PremiumRadarChartProps> = ({
    data,
    size = 260,
    color = '#8b5cf6',
    showLabels = true
}) => {
    if (!data || data.length < 3) {
        return (
            <div className="flex items-center justify-center text-textSecondary/50 text-sm" style={{ width: size, height: size }}>
                Недостаточно данных
            </div>
        );
    }

    const center = size / 2;
    const radius = size / 2 - 40;
    const angleStep = (2 * Math.PI) / data.length;

    // Calculate points for data polygon
    const dataPoints = useMemo(() => {
        return data.map((d, i) => {
            const maxVal = d.fullMark || 100;
            const normalizedValue = Math.min(Math.max((d.value || 0) / maxVal, 0.1), 1);
            const angle = angleStep * i - Math.PI / 2;
            const x = center + Math.cos(angle) * radius * normalizedValue;
            const y = center + Math.sin(angle) * radius * normalizedValue;
            return { x, y, angle, value: d.value, label: d.label, color: d.color };
        });
    }, [data, center, radius, angleStep]);

    const pathData = dataPoints.map((p, i) =>
        `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
    ).join(' ') + ' Z';

    const gradientId = `radar-grad-${Math.random().toString(36).slice(2)}`;
    const glowId = `radar-glow-${Math.random().toString(36).slice(2)}`;

    return (
        <svg width={size} height={size} className="mx-auto overflow-visible">
            <defs>
                {/* Radial gradient fill */}
                <radialGradient id={gradientId} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor={color} stopOpacity="0.5" />
                    <stop offset="100%" stopColor={color} stopOpacity="0.15" />
                </radialGradient>

                {/* Glow filter */}
                <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur stdDeviation="6" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            {/* Background hexagonal grid */}
            {[0.25, 0.5, 0.75, 1].map((level, idx) => {
                const points = data.map((_, i) => {
                    const angle = angleStep * i - Math.PI / 2;
                    const x = center + Math.cos(angle) * radius * level;
                    const y = center + Math.sin(angle) * radius * level;
                    return `${x},${y}`;
                }).join(' ');

                return (
                    <polygon
                        key={idx}
                        points={points}
                        fill="none"
                        stroke="currentColor"
                        strokeOpacity={0.08 + idx * 0.02}
                        strokeWidth="1"
                    />
                );
            })}

            {/* Axis lines */}
            {data.map((_, i) => {
                const angle = angleStep * i - Math.PI / 2;
                const x = center + Math.cos(angle) * radius;
                const y = center + Math.sin(angle) * radius;
                return (
                    <line
                        key={i}
                        x1={center}
                        y1={center}
                        x2={x}
                        y2={y}
                        stroke="currentColor"
                        strokeOpacity="0.1"
                        strokeWidth="1"
                    />
                );
            })}

            {/* Data polygon with glow */}
            <path
                d={pathData}
                fill={`url(#${gradientId})`}
                stroke={color}
                strokeWidth="3"
                strokeLinejoin="round"
                filter={`url(#${glowId})`}
            >
                {/* Pulse animation */}
                <animate
                    attributeName="stroke-opacity"
                    values="1;0.6;1"
                    dur="3s"
                    repeatCount="indefinite"
                />
            </path>

            {/* Data points with glow */}
            {dataPoints.map((p, i) => (
                <g key={i}>
                    {/* Outer glow */}
                    <circle
                        cx={p.x}
                        cy={p.y}
                        r="10"
                        fill={p.color || color}
                        opacity="0.25"
                    >
                        <animate
                            attributeName="r"
                            values="8;12;8"
                            dur="2s"
                            repeatCount="indefinite"
                        />
                    </circle>
                    {/* Inner point */}
                    <circle
                        cx={p.x}
                        cy={p.y}
                        r="5"
                        fill="white"
                        stroke={p.color || color}
                        strokeWidth="2.5"
                    />
                </g>
            ))}

            {/* Labels */}
            {showLabels && dataPoints.map((p, i) => {
                const labelRadius = radius + 25;
                const x = center + Math.cos(p.angle) * labelRadius;
                const y = center + Math.sin(p.angle) * labelRadius;
                return (
                    <text
                        key={i}
                        x={x}
                        y={y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill={p.color || color}
                        fontSize="12"
                        fontWeight="800"
                    >
                        {p.label}
                    </text>
                );
            })}
        </svg>
    );
};

// ============================================
// PREMIUM DONUT CHART (Animated + Glow)
// ============================================
interface DonutSegment {
    value: number;
    color: string;
    label?: string;
}

interface PremiumDonutChartProps {
    segments: DonutSegment[];
    size?: number;
    thickness?: number;
    centerContent?: React.ReactNode;
    selectedIndex?: number | null;
    onSelect?: (index: number | null) => void;
}

// Helper to create gradient pairs from base color
const createGradientPair = (baseColor: string): [string, string] => {
    return [baseColor, baseColor + '99'];
};

// Apple Watch Activity Rings Style Chart with Gradients
export const PremiumDonutChart: React.FC<PremiumDonutChartProps> = ({
    segments,
    size = 180,
    thickness = 12,
    centerContent,
    selectedIndex = null,
    onSelect
}) => {
    if (!segments || !segments.length) return null;

    const total = segments.reduce((sum, s) => sum + (s.value || 0), 0);
    if (total === 0) return null;

    const viewBoxSize = 100;
    const center = viewBoxSize / 2;
    const maxRings = Math.min(segments.length, 5);

    // Ring settings - thick strokes like Apple Watch
    const strokeWidth = 10;
    const ringGap = 4;
    const outerRadius = 40;

    // Sort by value descending for visual hierarchy
    const sortedSegments = [...segments]
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, maxRings);

    const maxValue = Math.max(...sortedSegments.map(s => s.value || 0));
    const uniqueId = Math.random().toString(36).slice(2);

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg
                viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
                width={size}
                height={size}
                style={{
                    transform: 'rotate(-87deg)',
                    overflow: 'visible'
                }}
            >
                <defs>
                    {/* Create gradient for each segment */}
                    {sortedSegments.map((seg, i) => (
                        <linearGradient
                            key={`grad-${i}`}
                            id={`donut-grad-${uniqueId}-${i}`}
                            gradientTransform="rotate(78)"
                        >
                            <stop offset="32%" stopColor={seg.color} />
                            <stop offset="100%" stopColor={seg.color} stopOpacity="0.7" />
                        </linearGradient>
                    ))}
                </defs>

                {sortedSegments.map((seg, i) => {
                    const radius = outerRadius - (i * (strokeWidth + ringGap));
                    if (radius < 10) return null;

                    const circumference = 2 * Math.PI * radius;
                    const percentage = maxValue > 0 ? ((seg.value || 0) / maxValue) * 100 : 0;
                    const offset = circumference - (percentage / 100) * circumference;
                    const isSelected = selectedIndex === i;

                    return (
                        <g key={i}>
                            {/* Background track */}
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke="rgba(255, 255, 255, 0.15)"
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                            />
                            {/* Progress ring with gradient */}
                            <circle
                                cx={center}
                                cy={center}
                                r={radius}
                                fill="none"
                                stroke={`url(#donut-grad-${uniqueId}-${i})`}
                                strokeWidth={isSelected ? strokeWidth + 2 : strokeWidth}
                                strokeLinecap="round"
                                strokeDasharray={circumference}
                                strokeDashoffset={offset}
                                opacity={isSelected || selectedIndex === null ? 1 : 0.5}
                                style={{
                                    transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                    cursor: 'pointer',
                                    filter: isSelected ? `drop-shadow(0 0 6px ${seg.color})` : 'none'
                                }}
                                onClick={() => onSelect?.(isSelected ? null : i)}
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Center content */}
            {centerContent && (
                <div className="absolute inset-0 flex items-center justify-center">
                    {centerContent}
                </div>
            )}
        </div>
    );
};

// ============================================
// PREMIUM PROGRESS RING (Animated)
// ============================================
interface PremiumProgressRingProps {
    value: number;
    maxValue?: number;
    size?: number;
    strokeWidth?: number;
    color?: string;
    label?: string;
    showValue?: boolean;
}

export const PremiumProgressRing: React.FC<PremiumProgressRingProps> = ({
    value,
    maxValue = 100,
    size = 140,
    strokeWidth = 12,
    color = '#8b5cf6',
    label = '',
    showValue = true
}) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const percentage = Math.min(Math.max((value / maxValue) * 100, 0), 100);
    const offset = circumference - (percentage / 100) * circumference;

    const gradientId = `ring-grad-${Math.random().toString(36).slice(2)}`;
    const glowId = `ring-glow-${Math.random().toString(36).slice(2)}`;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
            <svg width={size} height={size} className="transform -rotate-90">
                <defs>
                    <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={color} />
                        <stop offset="100%" stopColor={color} stopOpacity="0.5" />
                    </linearGradient>
                    <filter id={glowId} x="-50%" y="-50%" width="200%" height="200%">
                        <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor={color} floodOpacity="0.5" />
                    </filter>
                </defs>

                {/* Background track */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeOpacity="0.1"
                    strokeWidth={strokeWidth}
                />

                {/* Progress arc */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={`url(#${gradientId})`}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    filter={`url(#${glowId})`}
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                {showValue && (
                    <span
                        className="font-black"
                        style={{
                            fontSize: size / 4,
                            color: color,
                            textShadow: `0 0 20px ${color}40`
                        }}
                    >
                        {Math.round(value)}
                    </span>
                )}
                {label && (
                    <span className="text-xs font-bold text-textSecondary/50 uppercase tracking-wider mt-1">
                        {label}
                    </span>
                )}
            </div>
        </div>
    );
};

// ============================================
// PREMIUM HEATMAP (GitHub-style)
// ============================================
interface HeatmapDataPoint {
    date: string;
    value: number;
}

interface PremiumHeatmapProps {
    data: HeatmapDataPoint[];
    color?: string;
    cellSize?: number;
    gap?: number;
    weeks?: number;
}

export const PremiumHeatmap: React.FC<PremiumHeatmapProps> = ({
    data,
    color = '#22c55e',
    cellSize = 12,
    gap = 3,
    weeks = 12
}) => {
    if (!data || !data.length) return null;

    const maxVal = Math.max(...data.map(d => d.value || 0), 1);
    const cols = weeks;
    const rows = 7;

    // Generate grid data
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (weeks * 7 - 1));

    // Adjust to start from Monday
    const startDay = startDate.getDay();
    const daysToSubtract = startDay === 0 ? 6 : startDay - 1;
    startDate.setDate(startDate.getDate() - daysToSubtract);

    const grid: (HeatmapDataPoint | null)[][] = [];
    let currentDate = new Date(startDate);

    for (let col = 0; col < cols; col++) {
        const column: (HeatmapDataPoint | null)[] = [];
        for (let row = 0; row < rows; row++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const point = data.find(d => d.date === dateStr);
            column.push(point || { date: dateStr, value: 0 });
            currentDate.setDate(currentDate.getDate() + 1);
        }
        grid.push(column);
    }

    const width = cols * (cellSize + gap);
    const height = rows * (cellSize + gap);

    return (
        <div className="overflow-x-auto">
            <svg width={width} height={height} className="block">
                {grid.map((col, colIdx) =>
                    col.map((cell, rowIdx) => {
                        if (!cell) return null;
                        const intensity = cell.value / maxVal;
                        const opacity = cell.value > 0 ? Math.max(0.2, intensity) : 0.08;

                        return (
                            <rect
                                key={`${colIdx}-${rowIdx}`}
                                x={colIdx * (cellSize + gap)}
                                y={rowIdx * (cellSize + gap)}
                                width={cellSize}
                                height={cellSize}
                                rx={3}
                                fill={cell.value > 0 ? color : 'currentColor'}
                                opacity={opacity}
                                className="transition-all duration-200 hover:opacity-100"
                            >
                                <title>{`${cell.date}: ${cell.value}`}</title>
                            </rect>
                        );
                    })
                )}
            </svg>
        </div>
    );
};

// ============================================
// EXPORTS
// ============================================
export {
    PremiumAreaChart as GradientLineChart,
    PremiumBarChart as GlowingBarChart,
    PremiumRadarChart as GlowingRadarChart,
    PremiumRadarChart as RadarChart,
    PremiumDonutChart as DonutChart,
    PremiumProgressRing as ApexRadialBar,
    PremiumHeatmap as HeatmapChart
};

// Weekly Bar Chart wrapper
export const WeeklyBarChart: React.FC<{
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    selectedIndex?: number | null;
    onSelect?: (index: number | null) => void;
}> = ({ data, labels, color, height = 180, selectedIndex, onSelect }) => {
    const chartData = data.map((value, i) => ({
        label: labels[i] || '',
        value
    }));

    return <PremiumBarChart data={chartData} height={height} />;
};

// Time Distribution Chart wrapper
export const TimeDistributionChart: React.FC<{
    data: number[];
    labels: string[];
    colors: string[];
    height?: number;
    selectedIndex?: number | null;
    onSelect?: (index: number | null) => void;
}> = ({ data, labels, colors, height = 200, selectedIndex, onSelect }) => {
    const chartData = data.map((value, i) => ({
        label: labels[i] || '',
        value,
        color: colors[i]
    }));

    return <PremiumBarChart data={chartData} height={height} />;
};
