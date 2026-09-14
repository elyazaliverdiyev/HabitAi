
import React, { useState } from 'react';

interface ChartProps {
  data: number[];
  labels: string[];
  color: string;
  height?: number;
  selectedIndex?: number | null;
  onSelect?: (index: number) => void;
  interactive?: boolean;
}

export const SimpleLineChart: React.FC<ChartProps> = ({ 
  data, labels, color, height = 120, selectedIndex, onSelect, interactive = false 
}) => {
  if (data.length < 2) return null;

  const max = Math.max(...data, 1);
  const width = 300; 
  
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - (val / max) * (height * 0.8); 
    return `${x},${y}`;
  }).join(' ');

  const fillPath = `${points} ${width},${height} 0,${height}`;

  return (
    <div className="w-full relative group" style={{ height: `${height}px` }}>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible" preserveAspectRatio="none">
        <defs>
          <linearGradient id={`gradient-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        <path d={`M${points.split(' ')[0]} L${fillPath} Z`} fill={`url(#gradient-${color.replace('#','')})`} stroke="none" className="transition-all duration-500 ease-out" />

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          filter="url(#glow)"
          className="drop-shadow-sm"
        />
        
        {data.map((val, idx) => {
           const x = (idx / (data.length - 1)) * width;
           const y = height - (val / max) * (height * 0.8);
           const isSelected = selectedIndex === idx;
           
           return (
             <g key={idx} onClick={(e) => { e.stopPropagation(); interactive && onSelect?.(idx); }}>
                 {/* Hit area for easier clicking */}
                 <circle cx={x} cy={y} r="15" fill="transparent" className={interactive ? "cursor-pointer" : ""} />
                 
                 {/* Visible Dot */}
                 <circle 
                    cx={x} cy={y} r={isSelected ? 6 : 3} 
                    fill="var(--surface)" stroke={color} strokeWidth={isSelected ? 3 : 2} 
                    vectorEffect="non-scaling-stroke"
                    className={`transition-all duration-300 ${interactive ? 'cursor-pointer hover:r-5' : ''}`}
                 />
                 
                 {/* Tooltip on selection */}
                 {isSelected && (
                    <g transform={`translate(${x}, ${y - 20})`}>
                        <rect x="-15" y="-18" width="30" height="18" rx="4" fill={color} />
                        <text x="0" y="-6" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">{val}</text>
                    </g>
                 )}
             </g>
           )
        })}
      </svg>
      
      <div className="flex justify-between mt-2 text-[10px] text-textSecondary font-medium uppercase px-1">
        {labels.map((label, i) => (
          <span key={i} className={`${selectedIndex === i ? 'text-brand font-bold scale-110' : ''} transition-all`}>
            {label}
          </span>
        ))}
      </div>
    </div>
  );
};

export const SimpleBarChart: React.FC<ChartProps> = ({ 
  data, labels, color, height = 120, selectedIndex, onSelect, interactive = false 
}) => {
    const max = Math.max(...data, 1);
    
    return (
        <div className="w-full flex flex-col justify-end" style={{ height: `${height + 25}px` }}>
            <div className="flex items-end justify-between flex-1 gap-2">
                {data.map((val, i) => {
                    const hPercent = (val / max) * 100;
                    const isSelected = selectedIndex === i;
                    
                    return (
                        <div 
                            key={i} 
                            onClick={(e) => { e.stopPropagation(); interactive && onSelect?.(i); }}
                            className={`flex-1 flex flex-col items-center gap-1 group relative h-full justify-end ${interactive ? 'cursor-pointer' : ''}`}
                        >
                            <div className={`
                                text-[10px] font-bold text-textPrimary absolute -top-5 transition-all duration-300
                                ${isSelected ? 'opacity-100 -translate-y-1' : 'opacity-0 group-hover:opacity-100'}
                            `}>
                                {val}
                            </div>
                            <div 
                                className={`
                                    w-full rounded-t-lg transition-all duration-500 ease-out relative overflow-hidden
                                    ${isSelected ? 'opacity-100' : 'opacity-60 hover:opacity-90'}
                                `}
                                style={{ 
                                    height: `${Math.max(hPercent, 4)}%`, 
                                    backgroundColor: color 
                                }}
                            >
                                {isSelected && <div className="absolute inset-0 bg-white/20 animate-pulse" />}
                            </div>
                        </div>
                    )
                })}
            </div>
            <div className="flex justify-between mt-2 gap-2 border-t border-borderSubtle/50 pt-2">
                {labels.map((label, i) => (
                    <div 
                        key={i} 
                        className={`
                            flex-1 text-center text-[9px] font-bold uppercase truncate transition-colors
                            ${selectedIndex === i ? 'text-textPrimary' : 'text-textSecondary'}
                        `}
                    >
                        {label}
                    </div>
                ))}
            </div>
        </div>
    )
}

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
  label?: string;
  subLabel?: string;
  onClick?: () => void;
}

export const CircularProgress: React.FC<CircularProgressProps> = ({ 
  percentage, size = 120, strokeWidth = 10, color, label, subLabel, onClick 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (percentage / 100) * circumference;

  return (
    <div 
        className={`relative flex items-center justify-center transition-transform active:scale-95 ${onClick ? 'cursor-pointer' : ''}`} 
        style={{ width: size, height: size }}
        onClick={onClick}
    >
      <svg width={size} height={size} className="transform -rotate-90 drop-shadow-lg">
        <circle cx={size / 2} cy={size / 2} r={radius} stroke="var(--surface-highlight)" strokeWidth={strokeWidth} fill="none" />
        <circle
          cx={size / 2} cy={size / 2} r={radius} stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-all duration-500 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-3xl font-black text-textPrimary leading-none">{Math.round(percentage)}%</span>
        {label && <span className="text-[10px] font-bold text-textSecondary uppercase mt-1">{label}</span>}
        {subLabel && <span className="text-[9px] text-textSecondary opacity-60">{subLabel}</span>}
      </div>
    </div>
  );
};

interface DonutChartProps {
  data: { label: string; value: number; color: string }[];
  size?: number;
  onSelect?: (index: number) => void;
  selectedIndex?: number | null;
}

export const DonutChart: React.FC<DonutChartProps> = ({ data, size = 160, onSelect, selectedIndex }) => {
  const total = data.reduce((acc, item) => acc + item.value, 0);
  let currentAngle = 0;

  if (total === 0) return <div className="text-textSecondary text-xs">No data</div>;

  return (
    <div className="flex items-center gap-6">
        <div className="relative" style={{ width: size, height: size }}>
             <div 
                className="absolute inset-0 rounded-full" 
                style={{ 
                    background: `conic-gradient(${data.map((item, i, arr) => {
                        const prev = arr.slice(0, i).reduce((p, c) => p + (c.value/total)*100, 0);
                        return `${item.color} ${prev}% ${prev + (item.value/total)*100}%`;
                    }).join(', ')})`,
                    mask: 'radial-gradient(transparent 55%, black 56%)',
                    WebkitMask: 'radial-gradient(transparent 55%, black 56%)'
                }}
             />
             <div className="absolute inset-0 m-auto bg-transparent rounded-full flex items-center justify-center z-10 pointer-events-none">
                 <div className="text-center">
                     <span className="text-xs font-bold text-textSecondary uppercase block">
                        {selectedIndex !== null && selectedIndex !== undefined ? data[selectedIndex].label : 'Total'}
                     </span>
                     <div className="text-xl font-black text-textPrimary">
                        {selectedIndex !== null && selectedIndex !== undefined ? data[selectedIndex].value : total}
                     </div>
                 </div>
             </div>
        </div>
        
        <div className="flex flex-col gap-2 min-w-[100px]">
            {data.map((item, i) => (
                <div 
                    key={i} 
                    className={`flex items-center gap-2 cursor-pointer p-1 rounded-lg transition-colors ${selectedIndex === i ? 'bg-surfaceHighlight' : 'hover:bg-surfaceHighlight/50'}`}
                    onClick={(e) => { e.stopPropagation(); onSelect?.(i); }}
                >
                    <div className={`w-3 h-3 rounded-full shrink-0 transition-transform ${selectedIndex === i ? 'scale-125' : ''}`} style={{ backgroundColor: item.color }} />
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-textPrimary leading-none">{item.label}</span>
                        <span className="text-[10px] text-textSecondary">{Math.round((item.value / total) * 100)}%</span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};

// --- RPG Radar Chart ---
interface RadarChartProps {
    data: { label: string; value: number; color: string; fullMark: number }[];
    size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({ data, size = 200 }) => {
    const radius = size / 2;
    const centerX = size / 2;
    const centerY = size / 2;
    const angleStep = (Math.PI * 2) / data.length;

    // Helper to calculate point coordinates
    const getPoint = (value: number, index: number, max: number) => {
        const normalized = Math.min(value / max, 1);
        const angle = index * angleStep - Math.PI / 2; // Start from top
        const r = normalized * (radius - 20); // -20 padding
        return {
            x: centerX + r * Math.cos(angle),
            y: centerY + r * Math.sin(angle)
        };
    };

    const maxValue = 100; // Assume normalization to 100%
    const polyPoints = data.map((d, i) => {
        const p = getPoint(d.value, i, maxValue);
        return `${p.x},${p.y}`;
    }).join(' ');

    const bgPoints = data.map((_, i) => {
        const p = getPoint(maxValue, i, maxValue);
        return `${p.x},${p.y}`;
    }).join(' ');

    const bgPointsMid = data.map((_, i) => {
        const p = getPoint(maxValue * 0.5, i, maxValue);
        return `${p.x},${p.y}`;
    }).join(' ');

    return (
        <div className="relative flex justify-center items-center py-4" style={{ width: '100%' }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
                {/* Background Grid */}
                <polygon points={bgPoints} fill="var(--surface-highlight)" stroke="var(--border-subtle)" strokeWidth="1" className="opacity-30" />
                <polygon points={bgPointsMid} fill="none" stroke="var(--border-subtle)" strokeWidth="1" className="opacity-30" strokeDasharray="4 2" />
                
                {/* Axis Lines */}
                {data.map((_, i) => {
                    const p = getPoint(maxValue, i, maxValue);
                    return <line key={i} x1={centerX} y1={centerY} x2={p.x} y2={p.y} stroke="var(--border-subtle)" strokeWidth="1" className="opacity-20" />;
                })}

                {/* Data Blob */}
                <defs>
                    <linearGradient id="radarGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--brand)" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="var(--brand)" stopOpacity="0.1" />
                    </linearGradient>
                </defs>
                <polygon 
                    points={polyPoints} 
                    fill="url(#radarGradient)" 
                    stroke="var(--brand)" 
                    strokeWidth="2" 
                    className="drop-shadow-md transition-all duration-500 ease-out"
                />

                {/* Points & Labels */}
                {data.map((d, i) => {
                    const p = getPoint(maxValue + 15, i, maxValue); // Label pos
                    const dotP = getPoint(d.value, i, maxValue); // Dot pos
                    
                    return (
                        <g key={i}>
                            {/* Value Dot */}
                            <circle cx={dotP.x} cy={dotP.y} r="4" fill="var(--surface)" stroke={d.color} strokeWidth="2" />
                            
                            {/* Label */}
                            <foreignObject x={p.x - 30} y={p.y - 10} width="60" height="20">
                                <div className="text-[9px] font-bold text-center text-textSecondary uppercase leading-tight flex flex-col items-center justify-center h-full">
                                    <span style={{ color: d.color }}>{d.label}</span>
                                </div>
                            </foreignObject>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};
