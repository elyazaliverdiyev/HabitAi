import React from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

// ============================================
// PREMIUM THEME CONFIG
// ============================================
const CHART_THEME = {
    tooltip: {
        theme: 'dark',
        style: {
            fontSize: '12px',
            fontFamily: 'Inter, system-ui, sans-serif',
        }
    },
    grid: {
        borderColor: 'rgba(255, 255, 255, 0.05)',
        strokeDashArray: 4,
    }
};

// ============================================
// APEX AREA CHART (Hyper Trend)
// ============================================
interface ApexAreaChartProps {
    data: { name: string; value: number }[];
    height?: number;
    color?: string;
    gradientColors?: { start: string; middle: string; end: string };
    showDots?: boolean;
}

export const ApexAreaChart: React.FC<ApexAreaChartProps> = ({
    data,
    height = 200,
    color = 'var(--brand)',
    gradientColors = { start: '#6366f1', middle: '#8b5cf6', end: '#ec4899' },
    showDots = true
}) => {
    if (!data || !data.length) return null;

    // Filter out invalid data points and ensure values are numbers
    const validData = data.filter(d => d && typeof d.value === 'number' && d.name !== undefined);
    if (!validData.length) return null;

    // Use a fallback color if CSS variable isn't ready
    const brandColor = color.includes('var') ? '#6366f1' : color;

    const options: ApexOptions = {
        chart: {
            type: 'area',
            toolbar: { show: false },
            animations: {
                enabled: true,
                speed: 1000,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 350 }
            },
            dropShadow: {
                enabled: true,
                top: 10,
                left: 0,
                blur: 15,
                color: brandColor,
                opacity: 0.15
            },
            background: 'transparent',
            fontFamily: 'Inter, system-ui, sans-serif'
        },
        colors: [brandColor],
        dataLabels: { enabled: false },
        stroke: {
            curve: 'smooth',
            width: 3,
            lineCap: 'round'
        },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.45,
                opacityTo: 0.02,
                stops: [0, 95, 100],
                colorStops: [
                    { offset: 0, color: brandColor, opacity: 0.5 },
                    { offset: 100, color: 'transparent', opacity: 0 }
                ]
            }
        },
        grid: {
            ...CHART_THEME.grid,
            padding: { top: 10, right: 10, bottom: 0, left: 10 }
        },
        xaxis: {
            categories: validData.map(d => String(d.name || '')),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: 'rgba(255,255,255,0.4)',
                    fontWeight: 500,
                    fontSize: '10px'
                }
            }
        },
        yaxis: {
            show: false,
            min: 0
        },
        tooltip: {
            ...CHART_THEME.tooltip,
            x: { show: false },
            y: {
                formatter: (val: number) => `${val} выполнений`
            },
            marker: { show: false }
        },
        markers: {
            size: showDots ? 5 : 0,
            colors: ['#fff'],
            strokeColors: brandColor,
            strokeWidth: 3,
            hover: { size: 7 }
        }
    };

    const series = [{
        name: 'Активность',
        data: validData.map(d => d.value || 0)
    }];

    return (
        <div className="w-full overflow-visible">
            <Chart
                options={options}
                series={series}
                type="area"
                height={height}
            />
        </div>
    );
};

// ============================================
// APEX BAR CHART (Glow Bars)
// ============================================
interface ApexBarChartProps {
    data: { label: string; value: number }[];
    height?: number;
    color?: string;
    orientation?: 'horizontal' | 'vertical';
}

export const ApexBarChart: React.FC<ApexBarChartProps> = ({
    data,
    height = 200,
    color = '#6366f1',
    orientation = 'vertical'
}) => {
    if (!data || !data.length) return null;

    // Filter out invalid data points
    const validData = data.filter(d => d && typeof d.value === 'number' && d.label !== undefined);
    if (!validData.length) return null;


    const options: ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            animations: { enabled: true, speed: 800 },
            dropShadow: {
                enabled: true,
                top: 4,
                left: 0,
                blur: 10,
                color: color,
                opacity: 0.3
            },
            background: 'transparent'
        },
        plotOptions: {
            bar: {
                horizontal: orientation === 'horizontal',
                borderRadius: 8,
                borderRadiusApplication: 'end',
                columnWidth: '55%',
                distributed: true,
                dataLabels: { position: 'top' }
            }
        },
        colors: [color, '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        dataLabels: {
            enabled: false
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'vertical',
                shadeIntensity: 0.5,
                opacityFrom: 1,
                opacityTo: 0.6,
                stops: [0, 100]
            }
        },
        grid: {
            ...CHART_THEME.grid,
            padding: { top: 0, right: 10, bottom: 0, left: 10 }
        },
        xaxis: {
            categories: validData.map(d => String(d.label || '')),
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: 'rgba(255,255,255,0.4)',
                    fontWeight: 600,
                    fontSize: '11px'
                }
            }
        },
        yaxis: {
            show: false
        },
        tooltip: {
            ...CHART_THEME.tooltip,
            y: {
                formatter: (val: number) => `${val}`
            }
        }
    };

    const series = [{
        name: 'Значение',
        data: validData.map(d => d.value || 0)
    }];

    return (
        <div className="w-full">
            <Chart
                options={options}
                series={series}
                type="bar"
                height={height}
            />
        </div>
    );
};

// ============================================
// APEX RADAR CHART (Cyber Radar)
// ============================================
interface ApexRadarChartProps {
    data: { subject: string; value: number; fullMark?: number }[];
    size?: number;
    color?: string;
}

export const ApexRadarChart: React.FC<ApexRadarChartProps> = ({
    data,
    size = 250,
    color = '#6366f1'
}) => {
    if (!data || !data.length) return null;

    // Filter out invalid data points
    const validData = data.filter(d => d && typeof d.value === 'number' && d.subject !== undefined);
    if (!validData.length) return null;


    const options: ApexOptions = {
        chart: {
            type: 'radar',
            toolbar: { show: false },
            animations: { enabled: true, speed: 800 },
            dropShadow: {
                enabled: true,
                blur: 15,
                color: color,
                opacity: 0.4
            },
            background: 'transparent'
        },
        colors: [color],
        stroke: { width: 3, curve: 'smooth' },
        fill: {
            opacity: 0.25,
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0.1
            }
        },
        markers: {
            size: 5,
            colors: ['#fff'],
            strokeColors: color,
            strokeWidth: 3
        },
        xaxis: {
            categories: validData.map(d => String(d.subject || '')),
            labels: {
                style: {
                    colors: Array(data.length).fill('rgba(255,255,255,0.5)'),
                    fontSize: '11px',
                    fontWeight: 700,
                    fontFamily: 'Inter, system-ui, sans-serif'
                }
            }
        },
        yaxis: {
            show: false,
            min: 0,
            max: Math.max(...validData.map(d => d.fullMark || 100), 100)
        },
        plotOptions: {
            radar: {
                polygons: {
                    strokeColors: 'rgba(255,255,255,0.08)',
                    connectorColors: 'rgba(255,255,255,0.08)',
                    fill: {
                        colors: ['transparent', 'rgba(255,255,255,0.01)']
                    }
                }
            }
        },
        tooltip: {
            ...CHART_THEME.tooltip,
            y: {
                formatter: (val: number) => `${val}`
            }
        }
    };

    const series = [{
        name: 'Уровень',
        data: validData.map(d => d.value || 0)
    }];

    return (
        <div className="flex justify-center" style={{ width: size, height: size, margin: '0 auto' }}>
            <Chart
                options={options}
                series={series}
                type="radar"
                height={size}
                width={size}
            />
        </div>
    );
};

// ============================================
// APEX DONUT CHART (Glass Donut)
// ============================================
interface ApexDonutChartProps {
    data?: { name: string; value: number; color: string }[];
    segments?: { name: string; value: number; color: string }[];
    size?: number;
    showLabels?: boolean;
}

export const ApexDonutChart: React.FC<ApexDonutChartProps> = ({
    data,
    segments,
    size = 200,
    showLabels = true
}) => {
    const chartData = data || segments || [];
    if (!chartData.length) return null;

    const options: ApexOptions = {
        chart: {
            type: 'donut',
            animations: { enabled: true, speed: 800 },
            dropShadow: {
                enabled: true,
                blur: 10,
                opacity: 0.15,
                top: 5
            },
            background: 'transparent'
        },
        colors: chartData.map(d => d.color),
        labels: chartData.map(d => d.name),
        stroke: {
            width: 0,
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '72%',
                    labels: {
                        show: showLabels,
                        name: {
                            show: true,
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.5)',
                            offsetY: -5
                        },
                        value: {
                            show: true,
                            fontSize: '22px',
                            fontWeight: 800,
                            color: '#fff',
                            offsetY: 5,
                            formatter: (val: string) => val
                        },
                        total: {
                            show: true,
                            label: 'Всего',
                            fontSize: '10px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.4)',
                            formatter: (w: any) => {
                                return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '11px',
            fontWeight: 500,
            labels: {
                colors: 'rgba(255,255,255,0.6)'
            },
            markers: {
                size: 8,
                strokeWidth: 0,
                offsetX: -4
            },
            itemMargin: { horizontal: 10, vertical: 5 }
        },
        tooltip: {
            ...CHART_THEME.tooltip,
            y: {
                formatter: (val: number) => `${val}`
            }
        }
    };

    const series = chartData.map(d => d.value);

    return (
        <div className="w-full flex justify-center">
            <Chart
                options={options}
                series={series}
                type="donut"
                height={size + 50}
            />
        </div>
    );
};

// ============================================
// APEX HEATMAP (Github Neo Style)
// ============================================
interface ApexHeatmapProps {
    data: { date: string; value: number }[];
    weeks?: number;
    color?: string;
    cellSize?: number;
    language?: 'ru' | 'en';
}

export const ApexHeatmap: React.FC<ApexHeatmapProps> = ({
    data,
    weeks = 12,
    color = '#10b981',
    cellSize = 12,
    language = 'ru'
}) => {
    if (!data || !data.length) return null;

    const dayLabels = language === 'ru'
        ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    const dateMap = new Map(data.map(d => [d.date, d.value]));
    const today = new Date();

    const seriesData = dayLabels.map((day, dayIndex) => {
        const dataPoints = [];
        for (let w = weeks - 1; w >= 0; w--) {
            const date = new Date(today);
            const diff = (w * 7) + (today.getDay() - dayIndex - 1);
            date.setDate(date.getDate() - diff);
            const dateStr = date.toISOString().split('T')[0];
            const value = dateMap.get(dateStr) || 0;
            dataPoints.push({
                x: `W${weeks - w}`,
                y: value,
                date: dateStr
            });
        }
        return {
            name: day,
            data: dataPoints
        };
    });

    const maxValue = Math.max(...data.map(d => d.value), 1);

    const options: ApexOptions = {
        chart: {
            type: 'heatmap',
            toolbar: { show: false },
            animations: { enabled: true, speed: 500 },
            background: 'transparent'
        },
        plotOptions: {
            heatmap: {
                shadeIntensity: 0.5,
                radius: 4,
                useFillColorAsStroke: false,
                colorScale: {
                    ranges: [
                        { from: 0, to: 0, color: 'rgba(255,255,255,0.05)', name: 'None' },
                        { from: 1, to: Math.ceil(maxValue * 0.2), color: color + '30', name: 'Low' },
                        { from: Math.ceil(maxValue * 0.2) + 1, to: Math.ceil(maxValue * 0.5), color: color + '60', name: 'Med' },
                        { from: Math.ceil(maxValue * 0.5) + 1, to: Math.ceil(maxValue * 0.8), color: color + '90', name: 'High' },
                        { from: Math.ceil(maxValue * 0.8) + 1, to: maxValue + 1000, color: color, name: 'Max' }
                    ]
                }
            }
        },
        dataLabels: { enabled: false },
        stroke: {
            width: 2,
            colors: ['rgba(0,0,0,0.2)']
        },
        grid: {
            show: false,
            padding: { top: 0, right: 0, bottom: 0, left: 0 }
        },
        xaxis: {
            labels: { show: false },
            axisBorder: { show: false },
            axisTicks: { show: false }
        },
        yaxis: {
            labels: {
                style: {
                    colors: 'rgba(255,255,255,0.4)',
                    fontSize: '10px',
                    fontWeight: 700
                }
            }
        },
        legend: { show: false },
        tooltip: {
            ...CHART_THEME.tooltip,
            custom: function ({ seriesIndex, dataPointIndex, w }) {
                const data = w.globals.initialSeries[seriesIndex].data[dataPointIndex];
                const countText = language === 'ru' ? 'выполнений' : 'completions';
                return `<div class="px-3 py-2 bg-black/90 border border-white/10 rounded-lg shadow-xl">
                    <div class="text-[10px] text-white/50 mb-1">${data.date}</div>
                    <div class="font-bold text-white">${data.y} ${countText}</div>
                </div>`;
            }
        }
    };

    return (
        <div className="w-full">
            <Chart
                options={options}
                series={seriesData}
                type="heatmap"
                height={cellSize * 10}
            />
        </div>
    );
};

// ============================================
// APEX RADIAL BAR (Progress Neo)
// ============================================
interface ApexRadialBarProps {
    value: number;
    maxValue?: number;
    label?: string;
    color?: string;
    size?: number;
}

export const ApexRadialBar: React.FC<ApexRadialBarProps> = ({
    value,
    maxValue = 100,
    label = '',
    color = '#10b981',
    size = 150
}) => {
    const percentage = Math.min((value / maxValue) * 100, 100);

    const options: ApexOptions = {
        chart: {
            type: 'radialBar',
            animations: { enabled: true, speed: 1000 },
            dropShadow: {
                enabled: true,
                blur: 15,
                color: color,
                opacity: 0.4
            },
            background: 'transparent'
        },
        colors: [color],
        plotOptions: {
            radialBar: {
                hollow: {
                    size: '70%',
                    background: 'transparent'
                },
                track: {
                    background: 'rgba(255,255,255,0.05)',
                    strokeWidth: '100%'
                },
                dataLabels: {
                    name: {
                        show: true,
                        fontSize: '12px',
                        fontWeight: 600,
                        color: 'rgba(255,255,255,0.5)',
                        offsetY: 20
                    },
                    value: {
                        show: true,
                        fontSize: '28px',
                        fontWeight: 900,
                        color: '#fff',
                        offsetY: -10,
                        formatter: () => `${value}`
                    }
                }
            }
        },
        labels: [label],
        stroke: {
            lineCap: 'round'
        }
    };

    const series = [percentage];

    return (
        <div className="flex justify-center">
            <Chart
                options={options}
                series={series}
                type="radialBar"
                height={size}
                width={size}
            />
        </div>
    );
};

// ============================================
// APEX SPARKLINE (Nano)
// ============================================
interface ApexSparklineProps {
    data: number[];
    color?: string;
    height?: number;
    type?: 'line' | 'area' | 'bar';
}

export const ApexSparkline: React.FC<ApexSparklineProps> = ({
    data,
    color = '#10b981',
    height = 50,
    type = 'area'
}) => {
    if (!data || !data.length) return null;

    const options: ApexOptions = {
        chart: {
            type: type as any,
            sparkline: { enabled: true },
            animations: { enabled: true, speed: 600 },
            dropShadow: {
                enabled: true,
                blur: 5,
                color: color,
                opacity: 0.3
            }
        },
        colors: [color],
        stroke: { curve: 'smooth', width: 2.5 },
        fill: {
            type: 'gradient',
            gradient: {
                shadeIntensity: 1,
                opacityFrom: 0.4,
                opacityTo: 0,
                stops: [0, 100]
            }
        },
        tooltip: {
            ...CHART_THEME.tooltip,
            fixed: { enabled: false },
            x: { show: false },
            marker: { show: false }
        }
    };

    const series = [{ data }];

    return (
        <Chart
            options={options}
            series={series}
            type={type}
            height={height}
        />
    );
};

// ============================================
// WEEKLY BAR CHART (Premium Picker)
// ============================================
interface WeeklyBarChartProps {
    data: number[];
    labels: string[];
    color?: string;
    height?: number;
    selectedIndex?: number | null;
    onSelect?: (index: number) => void;
}

export const WeeklyBarChart: React.FC<WeeklyBarChartProps> = ({
    data,
    labels,
    color = '#6366f1',
    height = 180,
    selectedIndex,
    onSelect
}) => {
    if (!data || !data.length) return null;

    const options: ApexOptions = {
        chart: {
            type: 'bar',
            toolbar: { show: false },
            animations: { enabled: true, speed: 800 },
            dropShadow: {
                enabled: true,
                top: 5,
                left: 0,
                blur: 10,
                color: color,
                opacity: 0.3
            },
            events: {
                dataPointSelection: (_event: any, _chart: any, opts: any) => {
                    if (onSelect) {
                        onSelect(opts.dataPointIndex);
                    }
                }
            },
            background: 'transparent'
        },
        plotOptions: {
            bar: {
                borderRadius: 8,
                columnWidth: '65%',
                distributed: true,
                dataLabels: { position: 'top' }
            }
        },
        colors: data.map((_, i) => i === selectedIndex ? color : 'rgba(255,255,255,0.15)'),
        dataLabels: { enabled: false },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'dark',
                type: 'vertical',
                shadeIntensity: 0.3,
                opacityFrom: 1,
                opacityTo: 0.8,
                stops: [0, 100]
            }
        },
        grid: {
            ...CHART_THEME.grid,
            padding: { top: 10, right: 10, bottom: 0, left: 10 }
        },
        xaxis: {
            categories: labels,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: {
                style: {
                    colors: 'rgba(255,255,255,0.4)',
                    fontWeight: 700,
                    fontSize: '11px'
                }
            }
        },
        yaxis: { show: false },
        legend: { show: false },
        tooltip: {
            ...CHART_THEME.tooltip,
            y: {
                formatter: (val: number) => `${val}`
            }
        },
        states: {
            active: {
                filter: { type: 'none' }
            },
            hover: {
                filter: { type: 'lighten' }
            }
        }
    };

    const series = [{
        name: 'Выполнено',
        data: data
    }];

    return (
        <div className="w-full overflow-visible">
            <Chart
                options={options}
                series={series}
                type="bar"
                height={height}
            />
        </div>
    );
};

// ============================================
// TIME DISTRIBUTION CHART (Cyber Donut)
// ============================================
interface TimeDistributionChartProps {
    data: number[];
    labels: string[];
    colors: string[];
    height?: number;
    selectedIndex?: number | null;
    onSelect?: (index: number) => void;
}

export const TimeDistributionChart: React.FC<TimeDistributionChartProps> = ({
    data,
    labels,
    colors,
    height = 200,
    selectedIndex,
    onSelect
}) => {
    if (!data || !data.length) return null;

    const options: ApexOptions = {
        chart: {
            type: 'donut',
            animations: { enabled: true, speed: 800 },
            dropShadow: {
                enabled: true,
                blur: 15,
                opacity: 0.2,
                top: 5
            },
            events: {
                dataPointSelection: (_event: any, _chart: any, opts: any) => {
                    if (onSelect) {
                        onSelect(opts.dataPointIndex);
                    }
                }
            },
            background: 'transparent'
        },
        colors: colors,
        labels: labels,
        stroke: {
            width: 0,
        },
        plotOptions: {
            pie: {
                donut: {
                    size: '68%',
                    labels: {
                        show: true,
                        name: {
                            show: true,
                            fontSize: '12px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.5)',
                            offsetY: -8
                        },
                        value: {
                            show: true,
                            fontSize: '24px',
                            fontWeight: 800,
                            color: '#fff',
                            offsetY: 8,
                            formatter: (val: string) => val
                        },
                        total: {
                            show: true,
                            label: labels[selectedIndex ?? 0] || 'Всего',
                            fontSize: '11px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.4)',
                            formatter: (w: any) => {
                                const idx = selectedIndex ?? 0;
                                return w.globals.series[idx] || w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                            }
                        }
                    }
                }
            }
        },
        dataLabels: { enabled: false },
        legend: {
            show: true,
            position: 'bottom',
            fontSize: '11px',
            fontWeight: 600,
            labels: {
                colors: 'rgba(255,255,255,0.5)'
            },
            markers: {
                size: 10,
                strokeWidth: 0,
                offsetY: 2,
                offsetX: -5
            },
            itemMargin: { horizontal: 10, vertical: 8 }
        },
        tooltip: {
            ...CHART_THEME.tooltip,
            y: {
                formatter: (val: number) => `${val}`
            }
        },
        states: {
            active: {
                filter: { type: 'none' }
            }
        }
    };

    const series = data;

    return (
        <div className="w-full flex justify-center mt-2">
            <Chart
                options={options}
                series={series}
                type="donut"
                height={height + 60}
            />
        </div>
    );
};

// ============================================
// ALIASES for backward compatibility
// ============================================
export const GlowingRadarChart = ApexRadarChart;
export const GradientLineChart = ApexAreaChart;
export const GlowingBarChart = ApexBarChart;
export const HeatmapChart = ApexHeatmap;
export const DonutChart = ApexDonutChart;
export const RadarChart = ApexRadarChart;
