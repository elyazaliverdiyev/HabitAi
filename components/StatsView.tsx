
import React, { useMemo, useState } from 'react';
import { Habit, getCurrencySymbol, getAccentGradient, DeepAnalysis, IDENTITY_MAP, IDENTITY_MILESTONES } from '../types';
import { triggerHaptic } from '../utils/helpers';
import {
    BarChart3, CheckCircle2, Trophy, Flame, Grid, CalendarDays,
    Activity, ArrowUpRight, TrendingUp, PieChart, Zap, Clock, Target,
    X, ChevronRight, Sun, Moon, Sunset, Hexagon, Shield, Sword, BookOpen, Heart, Sparkles as SparklesIcon, Palette, Banknote, DollarSign, Copy
} from 'lucide-react';
import { GlowingRadarChart, GradientLineChart, GlowingBarChart, DonutChart, ApexRadialBar, WeeklyBarChart, TimeDistributionChart, RadarChart, HeatmapChart } from './SimpleCharts';
import { ApexHeatmap } from './ApexCharts';
import { translations } from '../translations';
import Modal from './Modal';
import Icon from './Icons';
import { AnimatedList } from './AnimatedList';
import ActivityChart from './ActivityChart';
import YearlyHeatmap from './YearlyHeatmap';
import { GeminiText } from './GeminiUI';
import { analyzeHabitCorrelations } from '../services/ai';
import { Sparkles, BrainCircuit } from 'lucide-react';
import IdentityDashboard from './IdentityDashboard';
import InvestmentAnalytics from './InvestmentAnalytics';
import FinancialIdentityTracker from './FinancialIdentityTracker';
import AIInsightsWidget from './AIInsightsWidget';
import CountUp from './CountUp';
import SmartSuggestions from './SmartSuggestions';
import StreakRisk from './StreakRisk';
import WeekdayAnalytics from './WeekdayAnalytics';
import ConsistencyTrend from './ConsistencyTrend';
import PersonalRecords from './PersonalRecords';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to get local date string YYYY-MM-DD (consistent with completion dates)
const getLocalDateString = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

interface StatsViewProps {
    habits: Habit[];
    language?: 'ru' | 'en';
    accentColor?: string | null;
    analysisHistory?: DeepAnalysis[];
    onSaveAnalysis?: (insight: string) => void;
}

// RPG Attributes Mapping
const ATTRIBUTE_MAP: Record<string, { attr: string, color: string, icon: any }> = {
    'Здоровье': { attr: 'VIT', color: '#ef4444', icon: Heart }, // Health
    'Спорт': { attr: 'STR', color: '#f97316', icon: Sword }, // Strength
    'Продуктивность': { attr: 'DEX', color: '#22c55e', icon: Activity }, // Dexterity
    'Карьера': { attr: 'INT', color: '#3b82f6', icon: BookOpen }, // Intellect
    'Финансы': { attr: 'INT', color: '#3b82f6', icon: BookOpen },
    'Обучение': { attr: 'WIS', color: '#8b5cf6', icon: SparklesIcon }, // Wisdom
    'Осознанность': { attr: 'WIS', color: '#8b5cf6', icon: SparklesIcon },
    'Социальное': { attr: 'CHA', color: '#eab308', icon: Sun }, // Charisma
    'Отношения': { attr: 'CHA', color: '#eab308', icon: Sun },
    'Творчество': { attr: 'DEX', color: '#d946ef', icon: Palette },
    'Health': { attr: 'VIT', color: '#ef4444', icon: Heart },
    'Fitness': { attr: 'STR', color: '#f97316', icon: Sword },
    'Productivity': { attr: 'DEX', color: '#22c55e', icon: Activity },
    'Career': { attr: 'INT', color: '#3b82f6', icon: BookOpen },
    'Finance': { attr: 'INT', color: '#3b82f6', icon: BookOpen },
    'Education': { attr: 'WIS', color: '#8b5cf6', icon: SparklesIcon },
    'Mindfulness': { attr: 'WIS', color: '#8b5cf6', icon: SparklesIcon },
    'Social': { attr: 'CHA', color: '#eab308', icon: Sun },
    'Relationships': { attr: 'CHA', color: '#eab308', icon: Sun },
    'Creative': { attr: 'DEX', color: '#d946ef', icon: Palette },
};

const StatsView: React.FC<StatsViewProps> = ({ habits, language = 'ru', accentColor, analysisHistory = [], onSaveAnalysis }) => {
    const t = translations[language].stats;
    const locale = language === 'ru' ? 'ru-RU' : 'en-US';
    const accent = getAccentGradient(accentColor);

    // --- Interactive State ---
    const [detailView, setDetailView] = useState<'weekly' | 'monthly' | 'categories' | 'streak' | 'time' | 'radar' | 'expenses' | 'activity' | null>(null);
    const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [selectedHistoryItem, setSelectedHistoryItem] = useState<any | null>(null);
    const [statsTab, setStatsTab] = useState<'overview' | 'profile'>('overview');


    const handleGenerateAIInsight = async () => {
        setIsAnalyzing(true);
        try {
            const result = await analyzeHabitCorrelations(habits, language as 'ru' | 'en');
            setAiInsight(result);
            if (onSaveAnalysis) {
                onSaveAnalysis(result);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Helper to translate category
    const getCategoryLabel = (cat: string) => {
        const cats = translations[language].categories as Record<string, string>;
        return cats[cat] || cat;
    };

    // --- Data Calculation ---
    const stats = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 1. Completion Rate
        let totalOpportunities = 0;
        let totalSuccesses = 0;
        const past30DaysStr: string[] = [];
        for (let i = 0; i < 30; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() - i);
            past30DaysStr.push(getLocalDateString(d));
        }

        habits.forEach(h => {
            const createdAt = new Date(h.createdAt);
            past30DaysStr.forEach(dStr => {
                if (new Date(dStr) >= createdAt) {
                    totalOpportunities++;
                    if (h.completedDates.includes(dStr)) totalSuccesses++;
                }
            });
        });
        const completionRate = totalOpportunities > 0 ? (totalSuccesses / totalOpportunities) * 100 : 0;

        // Today's completion rate (same as Home page)
        const todayDateStr = getLocalDateString(today);
        const activeHabits = habits.filter(h => !h.archived);
        const completedToday = activeHabits.filter(h => h.completedDates.includes(todayDateStr)).length;
        const todayCompletionRate = activeHabits.length > 0 ? (completedToday / activeHabits.length) * 100 : 0;

        // 2. Streaks Logic (Current & Best)
        let currentStreak = 0;
        const globalCountMap: Record<string, number> = {};
        const habitStreakMap: Record<string, number> = {}; // Best streak per habit

        habits.forEach(h => {
            h.completedDates.forEach(d => {
                globalCountMap[d] = (globalCountMap[d] || 0) + 1;
            });

            // Calc best streak for individual habit
            const dates = [...h.completedDates].sort();
            let best = 0;
            let curr = 0;
            if (dates.length > 0) {
                curr = 1; best = 1;
                for (let i = 1; i < dates.length; i++) {
                    const diff = (new Date(dates[i]).getTime() - new Date(dates[i - 1]).getTime()) / 86400000;
                    if (Math.round(diff) === 1) curr++;
                    else curr = 1;
                    if (curr > best) best = curr;
                }
            }
            habitStreakMap[h.id] = best;
        });

        const todayStr = getLocalDateString(today);
        const yestStr = getLocalDateString(new Date(today.getTime() - 86400000));
        const hasActivityToday = (globalCountMap[todayStr] || 0) > 0;

        let checkDate = new Date(today);
        if (!hasActivityToday) checkDate.setDate(checkDate.getDate() - 1);

        if (hasActivityToday || (globalCountMap[yestStr] || 0) > 0) {
            while (true) {
                const dStr = getLocalDateString(checkDate);
                if ((globalCountMap[dStr] || 0) > 0) {
                    currentStreak++;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    break;
                }
            }
        }

        // 3. Monthly Trend
        const monthlyData = [];
        const monthlyLabels = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
            const key = d.toLocaleString(locale, { month: 'short' });
            monthlyLabels.push(key);
            const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            let count = 0;
            habits.forEach(h => count += h.completedDates.filter(date => date.startsWith(prefix)).length);
            monthlyData.push(count);
        }

        // 4. Day of Week
        const dayOfWeekStats = [0, 0, 0, 0, 0, 0, 0];
        const dayOfWeekHabits: Habit[][] = [[], [], [], [], [], [], []]; // Habits done on this day

        habits.forEach(h => {
            h.completedDates.forEach(dStr => {
                const date = new Date(dStr);
                let day = date.getDay();
                day = day === 0 ? 6 : day - 1;
                dayOfWeekStats[day]++;
                if (!dayOfWeekHabits[day].includes(h)) dayOfWeekHabits[day].push(h);
            });
        });
        const daysLabels = language === 'ru' ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

        // 5. Time of Day (Based on scheduled time)
        // 05-11 Morning, 12-17 Afternoon, 18-04 Evening
        const timeDist = [0, 0, 0]; // Morning, Afternoon, Evening
        const timeLabels = language === 'ru' ? ['Утро', 'День', 'Вечер'] : ['Morning', 'Afternoon', 'Evening'];
        const timeHabits: Habit[][] = [[], [], []];

        habits.forEach(h => {
            if (h.time) {
                const hour = parseInt(h.time.split(':')[0]);
                if (hour >= 5 && hour < 12) { timeDist[0]++; timeHabits[0].push(h); }
                else if (hour >= 12 && hour < 18) { timeDist[1]++; timeHabits[1].push(h); }
                else { timeDist[2]++; timeHabits[2].push(h); }
            }
        });

        // 6. Categories
        const categoryCounts: Record<string, number> = {};
        const categoryColors: Record<string, string> = {};
        const categoryHabits: Record<string, Habit[]> = {};

        habits.forEach(h => {
            const originalCat = h.category || (language === 'ru' ? 'Другое' : 'Other');
            const translatedCat = getCategoryLabel(originalCat);

            categoryCounts[translatedCat] = (categoryCounts[translatedCat] || 0) + 1;
            categoryColors[translatedCat] = h.color;
            if (!categoryHabits[translatedCat]) categoryHabits[translatedCat] = [];
            categoryHabits[translatedCat].push(h);
        });
        const categoryData = Object.entries(categoryCounts)
            .map(([label, value]) => ({ label, value, color: categoryColors[label] || '#94a3b8' }))
            .sort((a, b) => b.value - a.value);

        // 7. Streak Histogram (How many habits have streak X)
        const streakRanges = [0, 0, 0, 0]; // 0-2, 3-7, 7-21, 21+
        const streakLabels = ['0-2', '3-7', '7-21', '21+'];
        const streakHabitsList: Habit[][] = [[], [], [], []];

        Object.entries(habitStreakMap).forEach(([id, streak]) => {
            const h = habits.find(x => x.id === id);
            if (!h) return;
            if (streak < 3) { streakRanges[0]++; streakHabitsList[0].push(h); }
            else if (streak < 7) { streakRanges[1]++; streakHabitsList[1].push(h); }
            else if (streak < 21) { streakRanges[2]++; streakHabitsList[2].push(h); }
            else { streakRanges[3]++; streakHabitsList[3].push(h); }
        });

        // 7.5. Identity Momentum - Group habits by identity with streak info
        interface IdentityMomentumItem {
            category: string;
            identity: { ru: string; en: string };
            emoji: string;
            habits: Array<{ habit: Habit; streak: number }>;
            totalStreak: number;
            maxStreak: number;
            avgStreak: number;
            momentumLevel: 'fire' | 'growing' | 'starting' | 'dormant';
        }

        const identityCategoryMap: Record<string, { habits: Array<{ habit: Habit; streak: number }>; totalStreak: number; maxStreak: number }> = {};

        habits.forEach(habit => {
            const cat = habit.category || 'Продуктивность';
            if (!identityCategoryMap[cat]) {
                identityCategoryMap[cat] = { habits: [], totalStreak: 0, maxStreak: 0 };
            }
            const streak = habitStreakMap[habit.id] || 0;
            identityCategoryMap[cat].habits.push({ habit, streak });
            identityCategoryMap[cat].totalStreak += streak;
            identityCategoryMap[cat].maxStreak = Math.max(identityCategoryMap[cat].maxStreak, streak);
        });

        const identityMomentum: IdentityMomentumItem[] = Object.entries(identityCategoryMap)
            .map(([category, data]) => {
                const identityInfo = IDENTITY_MAP[category] || { ru: 'дисциплинированный', en: 'disciplined', emoji: '🎯' };
                const avgStreak = data.habits.length > 0 ? Math.round(data.totalStreak / data.habits.length) : 0;

                // Determine momentum level based on max streak
                let momentumLevel: 'fire' | 'growing' | 'starting' | 'dormant';
                if (data.maxStreak >= 21) momentumLevel = 'fire';
                else if (data.maxStreak >= 7) momentumLevel = 'growing';
                else if (data.maxStreak >= 3) momentumLevel = 'starting';
                else momentumLevel = 'dormant';

                return {
                    category,
                    identity: { ru: identityInfo.ru, en: identityInfo.en },
                    emoji: identityInfo.emoji,
                    habits: data.habits.sort((a, b) => b.streak - a.streak),
                    totalStreak: data.totalStreak,
                    maxStreak: data.maxStreak,
                    avgStreak,
                    momentumLevel
                };
            })
            .sort((a, b) => b.maxStreak - a.maxStreak);

        // 8. Heatmap
        const heatmapDays = [];
        const oneYearAgo = new Date(today);
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const startDay = oneYearAgo.getDay();
        const daysSinceMonday = startDay === 0 ? 6 : startDay - 1;
        oneYearAgo.setDate(oneYearAgo.getDate() - daysSinceMonday);

        let ptr = new Date(oneYearAgo);
        let maxHeatmapVal = 1;
        const endDate = new Date(today);

        while (ptr <= endDate) {
            const dStr = getLocalDateString(ptr);
            const count = globalCountMap[dStr] || 0;
            if (count > maxHeatmapVal) maxHeatmapVal = count;
            heatmapDays.push({ date: dStr, count });
            ptr.setDate(ptr.getDate() + 1);
        }

        // 9. RPG Attributes (New)
        const rpgStats = {
            STR: { val: 0, color: '#f97316', label: 'STR' }, // Strength (Sport)
            VIT: { val: 0, color: '#ef4444', label: 'VIT' }, // Vitality (Health)
            DEX: { val: 0, color: '#22c55e', label: 'DEX' }, // Dexterity (Prod)
            INT: { val: 0, color: '#3b82f6', label: 'INT' }, // Intellect (Career)
            WIS: { val: 0, color: '#8b5cf6', label: 'WIS' }, // Wisdom (Mind)
            CHA: { val: 0, color: '#eab308', label: 'CHA' }, // Charisma (Social)
        };

        habits.forEach(h => {
            const cat = h.category || 'Other';
            // Simple mapping based on known categories or default to DEX
            const mapped = ATTRIBUTE_MAP[cat] || { attr: 'DEX' };
            // Points = completions * 5 (capped later)
            const points = h.completedDates.length * 2;
            if (rpgStats[mapped.attr as keyof typeof rpgStats]) {
                rpgStats[mapped.attr as keyof typeof rpgStats].val += points;
            }
        });

        // Normalize to 0-100 relative to max possible or fixed cap
        // Let's create a "Level" feeling. Cap at 100 for visual but maybe show level text.
        const radarData = Object.values(rpgStats).map(s => ({
            label: s.label,
            value: Math.min(100, Math.max(10, s.val)), // Min 10 for visual pop
            color: s.color,
            fullMark: 100
        }));

        // 10. Expense Statistics
        const expenseStats = (() => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // Daily expenses for last 7 days
            const dailyExpenses: number[] = [];
            const dailyLabels: string[] = [];

            for (let i = 6; i >= 0; i--) {
                const d = new Date(today);
                d.setDate(d.getDate() - i);
                const dStr = getLocalDateString(d);
                const dayLabel = d.toLocaleDateString(locale, { weekday: 'short' });
                dailyLabels.push(dayLabel);

                let dayTotal = 0;
                habits.forEach(h => {
                    const costNum = Number(h.cost);
                    if (!isNaN(costNum) && costNum > 0 && h.completedDates.includes(dStr)) {
                        dayTotal += costNum;
                    }
                });
                dailyExpenses.push(dayTotal);
            }

            // Monthly expenses
            const monthlyExpenses: number[] = [];
            const monthlyExpLabels: string[] = [];

            for (let i = 5; i >= 0; i--) {
                const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
                const key = d.toLocaleString(locale, { month: 'short' });
                monthlyExpLabels.push(key);
                const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

                let monthTotal = 0;
                habits.forEach(h => {
                    const costNum = Number(h.cost);
                    if (!isNaN(costNum) && costNum > 0) {
                        h.completedDates.filter(date => date.startsWith(prefix)).forEach(() => {
                            monthTotal += costNum;
                        });
                    }
                });
                monthlyExpenses.push(monthTotal);
            }

            // Category breakdown
            const categoryExpenses: Record<string, number> = {};
            const categoryColors: Record<string, string> = {};

            habits.forEach(h => {
                const costNum = Number(h.cost);
                if (!isNaN(costNum) && costNum > 0) {
                    const cat = getCategoryLabel(h.category || (language === 'ru' ? 'Другое' : 'Other'));
                    const total = h.completedDates.length * costNum;
                    categoryExpenses[cat] = (categoryExpenses[cat] || 0) + total;
                    categoryColors[cat] = h.color;
                }
            });

            const categoryExpData = Object.entries(categoryExpenses)
                .map(([label, value]) => ({ label, value, color: categoryColors[label] || '#94a3b8' }))
                .sort((a, b) => b.value - a.value);

            // Total expenses
            let totalExpenses = 0;
            let todayExpenses = 0;
            const todayStr = getLocalDateString(today);

            habits.forEach(h => {
                const costNum = Number(h.cost);
                if (!isNaN(costNum) && costNum > 0) {
                    totalExpenses += h.completedDates.length * costNum;
                    if (h.completedDates.includes(todayStr)) {
                        todayExpenses += costNum;
                    }
                }
            });

            // Currency (use first habit's currency or default)
            const defaultCurrency = habits.find(h => h.currency)?.currency || 'USD';

            return {
                dailyExpenses,
                dailyLabels,
                monthlyExpenses,
                monthlyExpLabels,
                categoryExpData,
                totalExpenses,
                todayExpenses,
                defaultCurrency
            };
        })();

        return {
            completionRate, todayCompletionRate, currentStreak, totalCompletions: habits.reduce((a, b) => a + b.completedDates.length, 0),
            monthlyData, monthlyLabels,
            dayOfWeekStats, daysLabels, dayOfWeekHabits,
            timeDist, timeLabels, timeHabits,
            categoryData, categoryHabits,
            streakRanges, streakLabels, streakHabitsList,
            identityMomentum,
            heatmapDays, maxHeatmapVal,
            radarData,
            expenseStats
        };
    }, [habits, language]);

    // --- Render Detail Modal Content ---
    const renderMarkdown = (text: string) => {
        if (!text) return null;
        return text.split(/(\*\*.*?\*\*)/g).map((part, i) =>
            part.startsWith('**') && part.endsWith('**')
                ? <strong key={i} className="font-black text-textPrimary">{part.slice(2, -2)}</strong>
                : part
        );
    };

    const renderDetailContent = () => {
        if (!detailView) return null;

        let title = '';
        let chart = null;
        let listTitle = '';
        let listHabits: Habit[] = [];

        if (detailView === 'weekly') {
            title = t.efficiencyDays;
            const idx = selectedItemIndex !== null ? selectedItemIndex : stats.dayOfWeekStats.indexOf(Math.max(...stats.dayOfWeekStats));
            chart = <WeeklyBarChart
                data={stats.dayOfWeekStats}
                labels={stats.daysLabels}
                color="var(--brand)"
                height={180}
                selectedIndex={selectedItemIndex}
                onSelect={setSelectedItemIndex}
            />;
            listTitle = selectedItemIndex !== null ? `${stats.daysLabels[selectedItemIndex]}` : 'Best Day';
            listHabits = stats.dayOfWeekHabits[idx] || [];
        }
        else if (detailView === 'activity') {
            title = language === 'ru' ? 'Активность' : 'Activity';
            // Show yearly heatmap for activity
            chart = <YearlyHeatmap habits={habits} language={language} />;
            listTitle = language === 'ru' ? 'Топ привычек' : 'Top Habits';
            // Get most completed habits
            listHabits = [...habits].sort((a, b) => b.completedDates.length - a.completedDates.length).slice(0, 10);
        }
        else if (detailView === 'monthly') {
            title = t.trends;
            const idx = selectedItemIndex !== null ? selectedItemIndex : stats.monthlyData.length - 1;
            chart = <GradientLineChart
                data={stats.monthlyData.map((val: number, i: number) => ({ name: stats.monthlyLabels?.[i] || `M${i + 1}`, value: val }))}
                height={180}
                showDots={true}
                gradientColors={{ start: '#22c55e', middle: '#eab308', end: '#ef4444' }}
            />;
            // Show habits with completions in selected month
            const selectedMonth = stats.monthlyLabels[idx];
            listTitle = selectedMonth || 'Current Month';
            // Get habits that had completions in that month period
            const monthIndex = stats.monthlyData.length - 1 - idx; // reverse index
            const targetDate = new Date();
            targetDate.setMonth(targetDate.getMonth() - monthIndex);
            const monthPrefix = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
            listHabits = habits.filter(h => h.completedDates.some(d => d.startsWith(monthPrefix)));
        }
        else if (detailView === 'categories') {
            title = t.lifeBalance;
            const idx = selectedItemIndex !== null ? selectedItemIndex : 0;
            chart = <DonutChart data={stats.categoryData} size={200} selectedIndex={selectedItemIndex} onSelect={setSelectedItemIndex} />;
            if (stats.categoryData.length > 0) {
                const catName = stats.categoryData[idx].label;
                listTitle = catName;
                listHabits = stats.categoryHabits[catName] || [];
            }
        }
        else if (detailView === 'time') {
            title = t.timeOfDay;
            const idx = selectedItemIndex !== null ? selectedItemIndex : stats.timeDist.indexOf(Math.max(...stats.timeDist));
            const timeColors = ['#f59e0b', '#f97316', '#6366f1']; // Morning=amber, Afternoon=orange, Evening=indigo
            chart = <TimeDistributionChart
                data={stats.timeDist}
                labels={stats.timeLabels}
                colors={timeColors}
                height={200}
                selectedIndex={selectedItemIndex}
                onSelect={setSelectedItemIndex}
            />;
            listTitle = stats.timeLabels[idx];
            listHabits = stats.timeHabits[idx];
        }
        else if (detailView === 'streak') {
            // Identity Momentum View - Redesigned
            title = language === 'ru' ? '🚀 Импульс Идентичности' : '🚀 Identity Momentum';

            // Get momentum level colors and icons
            const getMomentumStyle = (level: string) => {
                switch (level) {
                    case 'fire': return { emoji: '🔥', color: 'from-orange-500 to-red-500', bg: 'bg-orange-500/20', text: 'text-orange-500' };
                    case 'growing': return { emoji: '🌱', color: 'from-green-500 to-emerald-500', bg: 'bg-green-500/20', text: 'text-green-500' };
                    case 'starting': return { emoji: '✨', color: 'from-blue-500 to-cyan-500', bg: 'bg-blue-500/20', text: 'text-blue-500' };
                    default: return { emoji: '💤', color: 'from-gray-400 to-gray-500', bg: 'bg-gray-500/20', text: 'text-gray-400' };
                }
            };

            // Custom chart for Identity Momentum
            chart = (
                <div className="space-y-4">
                    {/* Explanation */}
                    <div className="bg-gradient-to-r from-brand/10 to-purple-500/10 rounded-2xl p-4 border border-brand/20">
                        <p className="text-sm text-textSecondary leading-relaxed">
                            {language === 'ru'
                                ? '💡 Импульс — это инерция твоего движения к новой идентичности. Чем выше стрик, тем сильнее импульс и легче продолжать!'
                                : '💡 Momentum is the inertia of your movement towards a new identity. Higher streaks = stronger momentum!'
                            }
                        </p>
                    </div>

                    {/* Identity Cards */}
                    <div className="space-y-3 max-h-[300px] overflow-y-auto">
                        {stats.identityMomentum.map((identity: any) => {
                            const style = getMomentumStyle(identity.momentumLevel);
                            return (
                                <div
                                    key={identity.category}
                                    className="relative overflow-hidden rounded-2xl p-4 border border-borderSubtle bg-surface"
                                >
                                    {/* Background gradient based on momentum */}
                                    <div className={`absolute inset-0 bg-gradient-to-r ${style.color} opacity-5`} />

                                    {/* Header */}
                                    <div className="relative flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{identity.emoji}</span>
                                            <div>
                                                <div className="font-bold text-textPrimary capitalize">
                                                    {identity.identity[language]}
                                                </div>
                                                <div className="text-xs text-textSecondary">
                                                    {identity.habits.length} {language === 'ru' ? 'привычек' : 'habits'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-black ${style.text}`}>
                                                {style.emoji} {identity.maxStreak}
                                            </div>
                                            <div className="text-xs text-textSecondary">
                                                {language === 'ru' ? 'макс. стрик' : 'max streak'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div className="relative h-2 bg-surfaceHighlight rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full bg-gradient-to-r ${style.color} transition-all duration-500`}
                                            style={{ width: `${Math.min(100, (identity.maxStreak / 21) * 100)}%` }}
                                        />
                                    </div>

                                    {/* Habits list */}
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {identity.habits.slice(0, 4).map(({ habit, streak }: { habit: Habit; streak: number }) => (
                                            <div
                                                key={habit.id}
                                                className="flex items-center gap-1.5 bg-surfaceHighlight/50 rounded-full px-2.5 py-1 text-xs"
                                            >
                                                <span><Icon name={habit.icon} size={14} /></span>
                                                <span className="text-textSecondary truncate max-w-[80px]">{habit.name}</span>
                                                <span className={`font-bold ${streak > 0 ? style.text : 'text-textSecondary'}`}>
                                                    {streak}
                                                </span>
                                            </div>
                                        ))}
                                        {identity.habits.length > 4 && (
                                            <div className="text-xs text-textSecondary self-center">
                                                +{identity.habits.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Momentum Legend */}
                    <div className="flex justify-center flex-wrap gap-3 text-xs text-textSecondary pt-2 bg-surfaceHighlight/50 rounded-xl p-2">
                        <span className="flex items-center gap-1"><span className="text-base">🔥</span> 21+ {language === 'ru' ? 'дн' : 'd'}</span>
                        <span className="flex items-center gap-1"><span className="text-base">🌱</span> 7-21 {language === 'ru' ? 'дн' : 'd'}</span>
                        <span className="flex items-center gap-1"><span className="text-base">✨</span> 3-7 {language === 'ru' ? 'дн' : 'd'}</span>
                        <span className="flex items-center gap-1"><span className="text-base">💤</span> 0-2 {language === 'ru' ? 'дн' : 'd'}</span>
                    </div>
                </div>
            );

            // No separate list needed - it's integrated into the cards
            listTitle = '';
            listHabits = [];
        }
        else if (detailView === 'radar') {
            title = t.charStats;
            chart = <RadarChart data={stats.radarData} size={260} />;
            listTitle = t.howToUpgrade;
            // Just generic advice logic
            listHabits = [];
        }
        else if (detailView === 'expenses') {
            title = language === 'ru' ? 'Инвестиции' : 'Investments';
            const exp = stats.expenseStats;
            const currSymbol = getCurrencySymbol(exp.defaultCurrency);

            // Calculate week total
            const weekTotal = exp.dailyExpenses.reduce((a: number, b: number) => a + b, 0);

            return (
                <div className="space-y-6">
                    {/* Summary Cards - Premium Grid */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-2xl p-4 text-center">
                            <div className="text-xl font-black text-green-600">
                                <CountUp to={exp.todayExpenses} duration={1200} prefix={currSymbol} decimals={0} easing="easeOut" />
                            </div>
                            <div className="text-[9px] text-green-600/70 font-bold uppercase">{language === 'ru' ? 'Сегодня' : 'Today'}</div>
                        </div>
                        <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20 rounded-2xl p-4 text-center">
                            <div className="text-xl font-black text-amber-600">
                                <CountUp to={weekTotal} duration={1200} prefix={currSymbol} decimals={0} easing="easeOut" delay={100} />
                            </div>
                            <div className="text-[9px] text-amber-600/70 font-bold uppercase">{language === 'ru' ? 'Неделя' : 'Week'}</div>
                        </div>
                        <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl p-4 text-center">
                            <div className="text-xl font-black text-blue-600">
                                <CountUp to={exp.totalExpenses} duration={1500} prefix={currSymbol} decimals={0} easing="easeOut" delay={200} />
                            </div>
                            <div className="text-[9px] text-blue-600/70 font-bold uppercase">{language === 'ru' ? 'Всего' : 'Total'}</div>
                        </div>
                    </div>

                    {/* Weekly Chart - GitHub Heatmap Style */}
                    <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-borderSubtle overflow-visible">
                        <div className="flex items-center justify-between mb-4">
                            <h4 className="text-xs font-bold text-textSecondary uppercase">{language === 'ru' ? 'За неделю' : 'This Week'}</h4>
                            <span className="text-sm font-bold text-green-600">{currSymbol}{weekTotal.toFixed(0)}</span>
                        </div>
                        <HeatmapChart
                            data={exp.dailyExpenses.map((val: number, i: number) => {
                                const d = new Date();
                                d.setDate(d.getDate() - (exp.dailyExpenses.length - i - 1));
                                return { date: d.toISOString().split('T')[0], value: val };
                            })}
                            color="#22c55e"
                            weeks={8}
                            cellSize={14}
                            language={language}
                        />
                    </div>

                    {/* Monthly Chart - Gradient Line */}
                    <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-borderSubtle">
                        <h4 className="text-xs font-bold text-textSecondary uppercase mb-4">{language === 'ru' ? 'По месяцам' : 'Monthly'}</h4>
                        <GradientLineChart
                            data={exp.monthlyExpenses.map((val: number, i: number) => ({
                                name: exp.monthlyExpLabels[i] || '',
                                value: val
                            }))}
                            height={160}
                            gradientColors={{ start: '#22c55e', middle: '#eab308', end: '#3b82f6' }}
                        />
                    </div>

                    {/* Category Breakdown - Premium Style */}
                    {exp.categoryExpData.length > 0 && (
                        <div className="bg-surfaceHighlight/20 p-5 rounded-2xl border border-borderSubtle">
                            <h4 className="text-xs font-bold text-textSecondary uppercase mb-4">{language === 'ru' ? 'По категориям' : 'By Category'}</h4>
                            <div className="space-y-4">
                                {exp.categoryExpData.map((cat: any, i: number) => {
                                    const maxVal = Math.max(...exp.categoryExpData.map((c: any) => c.value), 1);
                                    const percent = (cat.value / maxVal) * 100;
                                    return (
                                        <div key={i} className="space-y-1.5">
                                            <div className="flex justify-between items-center">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                                                    <span className="text-sm font-bold text-textPrimary">{cat.label}</span>
                                                </div>
                                                <span className="text-sm font-black text-green-600">{currSymbol}{cat.value.toFixed(0)}</span>
                                            </div>
                                            <div className="h-3 bg-surfaceHighlight rounded-full overflow-hidden relative">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${percent}%`,
                                                        background: `linear-gradient(90deg, ${cat.color}80 0%, ${cat.color} 100%)`,
                                                        boxShadow: `0 0 12px ${cat.color}60, 0 0 4px ${cat.color}`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <div className="space-y-6 overflow-visible">
                <div className="bg-surfaceHighlight/20 p-6 rounded-3xl border border-borderSubtle flex justify-center overflow-visible">
                    {chart}
                </div>

                <div className="animate-slideUp">
                    {detailView === 'radar' ? (
                        <div className="bg-surface p-4 rounded-xl border border-borderSubtle space-y-2">
                            <div className="flex items-center gap-2 mb-2">
                                <Zap size={16} className="text-yellow-500" />
                                <h4 className="font-bold text-sm text-textPrimary">{listTitle}</h4>
                            </div>
                            <p className="text-xs text-textSecondary">
                                {t.upgradeTip}
                            </p>
                        </div>
                    ) : (
                        <>
                            <h4 className="font-bold text-textSecondary uppercase tracking-wider text-xs mb-3 flex items-center gap-2">
                                <Target size={14} /> {listTitle} ({listHabits.length})
                            </h4>
                            <AnimatedList className="grid grid-cols-1 gap-2">
                                {listHabits.length > 0 ? listHabits.map(h => (
                                    <div key={h.id} className="flex items-center gap-3 bg-surface p-3 rounded-xl border border-borderSubtle">
                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs" style={{ backgroundColor: h.color }}>
                                            <Icon name={h.icon} size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-bold text-sm text-textPrimary truncate">{h.name}</div>
                                            <div className="text-[10px] text-textSecondary">{getCategoryLabel(h.category || '')}</div>
                                        </div>
                                        <div className="text-xs font-bold text-textPrimary bg-surfaceHighlight px-2 py-1 rounded">
                                            {h.completedDates.length}
                                        </div>
                                    </div>
                                )) : (
                                    <div className="text-center py-8 text-textSecondary text-sm italic">
                                        {language === 'ru' ? 'Нет привычек в этой категории' : 'No habits here'}
                                    </div>
                                )}
                            </AnimatedList>
                        </>
                    )}
                </div>
            </div>
        );
    };

    const ChartCard = ({ title, icon: Icon, colorClass, children, onClick, main = false }: any) => (
        <div
            onClick={onClick}
            className={`glass-card-light border border-borderSubtle rounded-2xl p-4 hover:border-brand/30 transition-all cursor-pointer group active:scale-[0.99] overflow-visible tilt-3d ${main ? 'md:col-span-2' : ''}`}
        >
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Icon size={16} className={colorClass} />
                    <h3 className="font-bold text-textPrimary text-xs uppercase tracking-wide group-hover:text-brand transition-colors">{title}</h3>
                </div>
                <ChevronRight size={14} className="text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <div className="overflow-visible">
                {children}
            </div>
        </div>
    );

    return (
        <div className="animate-fadeIn space-y-5 pb-24">

            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ background: accent.isGradient ? accent.gradient : accent.primary }}
                    >
                        <BarChart3 size={14} className="text-white" />
                    </div>
                    <GeminiText className="text-xl tracking-tight">{t.title}</GeminiText>
                </div>
                <div className="flex items-center gap-1.5">
                    <button
                        onClick={() => setIsHistoryOpen(true)}
                        className="p-2 rounded-lg bg-surfaceHighlight/50 text-textSecondary hover:text-brand transition-all active:scale-95"
                        title={language === 'ru' ? 'История анализов' : 'Analysis History'}
                    >
                        <Clock size={14} />
                    </button>
                    <button
                        onClick={handleGenerateAIInsight}
                        disabled={isAnalyzing}
                        className="gemini-glow-sm px-3.5 py-2 rounded-xl flex items-center gap-2 text-xs font-bold text-textPrimary hover:scale-105 transition-all disabled:opacity-50 bg-surface"
                    >
                        {isAnalyzing ? (
                            <div className="w-4 h-4 border-2 border-brand/30 border-t-brand rounded-full animate-spin" />
                        ) : (
                            <Sparkles size={14} className="text-brand" />
                        )}
                        {language === 'ru' ? 'AI Аналитик' : 'AI Analyst'}
                    </button>
                </div>
            </div>

            {/* === TAB BAR === */}
            <div className="flex gap-1 p-1 rounded-xl bg-surfaceHighlight/30 border border-borderSubtle relative">
                {[
                    { key: 'overview' as const, label: language === 'ru' ? 'Обзор' : 'Overview', emoji: '📊' },
                    { key: 'profile' as const, label: language === 'ru' ? 'Аналитика' : 'Analytics', emoji: '📈' },
                ].map((tab) => {
                    const isActive = statsTab === tab.key;
                    return (
                        <button
                            key={tab.key}
                            onClick={() => { setStatsTab(tab.key); triggerHaptic(); }}
                            className={`flex-1 py-2.5 px-3 rounded-lg text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1.5 relative z-10 ${isActive
                                ? 'text-textPrimary'
                                : 'text-textSecondary hover:text-textPrimary'
                                }`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="statsTabSelector"
                                    className="absolute inset-0 bg-surface shadow-sm border border-borderSubtle rounded-lg"
                                    initial={false}
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    style={{ zIndex: -1 }}
                                />
                            )}
                            <span>{tab.emoji}</span>
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* ========== TAB 1: OVERVIEW ========== */}
            {statsTab === 'overview' && (
                <div className="space-y-5 animate-fadeIn">

                    {/* === IDENTITY TRANSFORMATION DASHBOARD === */}
                    <IdentityDashboard
                        habits={habits}
                        language={language}
                        accentColor={accentColor}
                    />


                    {/* === WEEKLY SCORE CARD === */}
                    {(() => {
                        const activeH = habits.filter(h => !h.archived);
                        if (activeH.length === 0) return null;

                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const dayOfWeek = today.getDay();
                        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;

                        // This week
                        let thisWeekDone = 0, thisWeekTotal = 0;
                        for (let i = 0; i < 7; i++) {
                            const d = new Date(today);
                            d.setDate(today.getDate() + mondayOffset + i);
                            if (d > today) break;
                            const ds = getLocalDateString(d);
                            activeH.forEach(h => {
                                if (new Date(h.createdAt) <= d) {
                                    thisWeekTotal++;
                                    if (h.completedDates.includes(ds)) thisWeekDone++;
                                }
                            });
                        }
                        const thisWeekPct = thisWeekTotal > 0 ? Math.round((thisWeekDone / thisWeekTotal) * 100) : 0;

                        // Last week
                        let lastWeekDone = 0, lastWeekTotal = 0;
                        for (let i = 0; i < 7; i++) {
                            const d = new Date(today);
                            d.setDate(today.getDate() + mondayOffset - 7 + i);
                            const ds = getLocalDateString(d);
                            activeH.forEach(h => {
                                if (new Date(h.createdAt) <= d) {
                                    lastWeekTotal++;
                                    if (h.completedDates.includes(ds)) lastWeekDone++;
                                }
                            });
                        }
                        const lastWeekPct = lastWeekTotal > 0 ? Math.round((lastWeekDone / lastWeekTotal) * 100) : 0;
                        const delta = thisWeekPct - lastWeekPct;

                        // MVP habit (most completions this week)
                        let mvpHabit: typeof activeH[0] | null = null;
                        let mvpCount = 0;
                        activeH.forEach(h => {
                            let count = 0;
                            for (let i = 0; i < 7; i++) {
                                const d = new Date(today);
                                d.setDate(today.getDate() + mondayOffset + i);
                                if (d > today) break;
                                if (h.completedDates.includes(getLocalDateString(d))) count++;
                            }
                            if (count > mvpCount) { mvpCount = count; mvpHabit = h; }
                        });

                        return (
                            <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                                <div className="flex items-center gap-2 mb-3">
                                    <span className="text-sm">📊</span>
                                    <span className="text-xs font-bold text-textPrimary uppercase tracking-wide">
                                        {language === 'ru' ? 'Недельный итог' : 'Weekly Score'}
                                    </span>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    {/* Score */}
                                    <div className="text-center">
                                        <div className={`text-2xl font-black ${thisWeekPct >= 70 ? 'text-green-500' : thisWeekPct >= 40 ? 'text-amber-500' : 'text-red-400'}`}>
                                            {thisWeekPct}%
                                        </div>
                                        <div className="text-[9px] text-textSecondary font-medium mt-0.5">
                                            {language === 'ru' ? 'Выполнено' : 'Done'}
                                        </div>
                                    </div>
                                    {/* Trend */}
                                    <div className="text-center">
                                        <div className={`text-2xl font-black ${delta > 0 ? 'text-green-500' : delta < 0 ? 'text-red-400' : 'text-textSecondary'}`}>
                                            {delta > 0 ? '+' : ''}{delta}%
                                        </div>
                                        <div className="text-[9px] text-textSecondary font-medium mt-0.5">
                                            {language === 'ru' ? 'vs прошлая' : 'vs last'}
                                        </div>
                                    </div>
                                    {/* MVP */}
                                    <div className="text-center">
                                        <div className="text-2xl">
                                            {mvpHabit ? (mvpHabit.icon?.length <= 2 ? mvpHabit.icon : '🏆') : '—'}
                                        </div>
                                        <div className="text-[9px] text-textSecondary font-medium mt-0.5 truncate">
                                            {mvpHabit
                                                ? (language === 'ru' ? 'MVP' : 'MVP')
                                                : (language === 'ru' ? 'Нет' : 'None')
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {/* --- Hero Section: Health Score & Streak --- */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {/* Weekly Progress - 7 day bars */}
                        <div
                            className="bg-surface rounded-2xl p-4 col-span-1 md:col-span-2 border border-borderSubtle"
                        >
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg flex items-center justify-center bg-gradient-to-br from-green-500 to-emerald-400">
                                        <CalendarDays size={14} className="text-white" />
                                    </div>
                                    <span className="text-xs font-bold uppercase tracking-wider text-green-500">
                                        {language === 'ru' ? 'Неделя' : 'This Week'}
                                    </span>
                                </div>
                                <span className="text-xs text-textSecondary">
                                    {(() => {
                                        const today = new Date();
                                        const todayStr = getLocalDateString(today);
                                        const activeHabits = habits.filter(h => !h.archived);
                                        const completed = activeHabits.filter(h => h.completedDates.includes(todayStr)).length;
                                        return `${completed}/${activeHabits.length} ${language === 'ru' ? 'сегодня' : 'today'}`;
                                    })()}
                                </span>
                            </div>
                            {/* 7-day bars */}
                            <div className="flex items-end justify-between gap-2 h-20 z-10 relative">
                                {(() => {
                                    const weekDays = language === 'ru'
                                        ? ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
                                        : ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
                                    const today = new Date();
                                    const currentDayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
                                    const mondayOffset = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;

                                    return weekDays.map((day, index) => {
                                        const date = new Date(today);
                                        date.setDate(today.getDate() + mondayOffset + index);
                                        const dateStr = getLocalDateString(date);
                                        const activeHabits = habits.filter(h => !h.archived);
                                        const completed = activeHabits.filter(h => h.completedDates.includes(dateStr)).length;
                                        const percent = activeHabits.length > 0 ? (completed / activeHabits.length) * 100 : 0;
                                        const isToday = getLocalDateString(today) === dateStr;
                                        const isFuture = date > today;

                                        return (
                                            <div key={index} className="flex-1 flex flex-col items-center gap-1">
                                                <div
                                                    className="w-full rounded-lg relative overflow-hidden"
                                                    style={{
                                                        height: '60px',
                                                        background: 'var(--surfaceHighlight)'
                                                    }}
                                                >
                                                    <div
                                                        className="absolute bottom-0 left-0 right-0 rounded-lg transition-all duration-500"
                                                        style={{
                                                            height: isFuture ? '0%' : `${Math.max(percent, 4)}%`,
                                                            background: isToday
                                                                ? 'linear-gradient(to top, #22c55e, #4ade80)'
                                                                : percent === 100
                                                                    ? 'linear-gradient(to top, #22c55e, #86efac)'
                                                                    : 'linear-gradient(to top, #3b82f6, #60a5fa)'
                                                        }}
                                                    />
                                                </div>
                                                <span className={`text-[10px] font-medium ${isToday ? 'text-green-500 font-bold' : 'text-textSecondary'}`}>
                                                    {day}
                                                </span>
                                            </div>
                                        );
                                    });
                                })()}
                            </div>
                        </div>

                        {/* Streak */}
                        <div
                            onClick={() => { setDetailView('streak'); setSelectedItemIndex(null); }}
                            className="bg-gradient-to-br from-orange-500/8 to-amber-500/5 border border-orange-500/15 rounded-2xl p-4 flex flex-col justify-center items-center text-center cursor-pointer hover:border-orange-500/30 transition-all active:scale-95"
                        >
                            <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center text-orange-600 mb-2">
                                <Flame size={22} fill="currentColor" className="fill-orange-500/20" />
                            </div>
                            <div className="text-3xl font-black text-textPrimary leading-none">
                                <CountUp to={stats.currentStreak} duration={1500} easing="easeOut" />
                            </div>
                            <div className="text-[9px] font-bold text-orange-600/80 uppercase tracking-wider mt-1">{t.currentStreak}</div>
                        </div>
                    </div>

                    {/* === AI INSIGHTS (Bottleneck + Suggestion) === */}
                    <AIInsightsWidget
                        habits={habits}
                        language={language}
                        analysisHistory={analysisHistory}
                        onSaveAnalysis={onSaveAnalysis}
                        onOpenHistory={() => setIsHistoryOpen(true)}
                    />

                    {/* === SMART SUGGESTIONS === */}
                    {habits.filter(h => !h.archived && h.type !== 'task').length >= 2 && (
                        <SmartSuggestions habits={habits} language={language} />
                    )}

                    {/* OLD CHARTS - KEPT FOR MODAL FUNCTIONALITY BUT HIDDEN */}
                    <div className="hidden">

                        {/* NEW: RPG Attributes Radar */}
                        <ChartCard
                            title={t.charStats}
                            icon={Hexagon}
                            colorClass="text-brand"
                            onClick={() => { setDetailView('radar'); }}
                            main={true}
                        >
                            <div className="flex justify-center -mt-2">
                                <GlowingRadarChart
                                    data={stats.radarData.map((d: any) => ({ subject: d.label, value: d.value, fullMark: d.maxValue || 100 }))}
                                    size={200}
                                    color="var(--brand)"
                                />
                            </div>
                            <div className="text-center text-[10px] text-textSecondary font-medium mt-2">
                                {language === 'ru' ? 'Баланс ваших сфер жизни' : 'Balance across life areas'}
                            </div>
                        </ChartCard>

                        {/* 1. Weekly Analysis */}
                        <ChartCard
                            title={t.efficiencyDays}
                            icon={BarChart3}
                            colorClass="text-blue-500"
                            onClick={() => { setDetailView('weekly'); setSelectedItemIndex(null); }}
                        >
                            <GlowingBarChart
                                data={stats.dayOfWeekStats.map((val: number, i: number) => ({ label: stats.daysLabels[i] || '', value: val }))}
                                height={120}
                                color="var(--brand)"
                                orientation="vertical"
                            />
                        </ChartCard>

                        {/* 2. Monthly Trend */}
                        <ChartCard
                            title={t.trends}
                            icon={TrendingUp}
                            colorClass="text-green-500"
                            onClick={() => { setDetailView('monthly'); setSelectedItemIndex(null); }}
                        >
                            <GradientLineChart
                                data={stats.monthlyData.map((val: number, i: number) => ({ name: stats.monthlyLabels?.[i] || `W${i + 1}`, value: val }))}
                                height={120}
                                showDots={true}
                                gradientColors={{ start: '#22c55e', middle: '#eab308', end: '#ef4444' }}
                            />
                        </ChartCard>

                        {/* 3. Time Distribution */}
                        <ChartCard
                            title={t.timeOfDay}
                            icon={Clock}
                            colorClass="text-yellow-500"
                            onClick={() => { setDetailView('time'); setSelectedItemIndex(null); }}
                        >
                            <div className="flex items-end gap-3 h-[120px] px-2">
                                {stats.timeDist.map((val: number, i: number) => {
                                    const max = Math.max(...stats.timeDist, 1);
                                    const h = (val / max) * 100;
                                    const colors = ['#f59e0b', '#f97316', '#6366f1']; // Morning=amber, Afternoon=orange, Evening=indigo
                                    const icon = i === 0 ? Sun : i === 1 ? Sunset : Moon;
                                    const IconC = icon;
                                    const timeLabels = language === 'ru' ? ['Утро', 'День', 'Вечер'] : ['Morning', 'Afternoon', 'Evening'];
                                    return (
                                        <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                                            {/* Value label */}
                                            <span className="text-xs font-bold text-textPrimary opacity-0 group-hover:opacity-100 transition-opacity">{val}</span>
                                            {/* Bar with gradient and glow */}
                                            <div
                                                className="w-full rounded-lg transition-all duration-300 group-hover:scale-105"
                                                style={{
                                                    height: `${Math.max(h, val > 0 ? 15 : 5)}%`,
                                                    background: val > 0
                                                        ? `linear-gradient(180deg, ${colors[i]} 0%, ${colors[i]}80 100%)`
                                                        : 'var(--surface-highlight)',
                                                    boxShadow: val > 0 ? `0 0 15px ${colors[i]}40, 0 4px 12px ${colors[i]}30` : 'none',
                                                    opacity: val > 0 ? 1 : 0.3
                                                }}
                                            />
                                            {/* Icon and label */}
                                            <div className="flex flex-col items-center gap-0.5">
                                                <IconC size={18} style={{ color: colors[i] }} className="opacity-80" />
                                                <span className="text-[10px] text-textSecondary font-medium">{timeLabels[i]}</span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </ChartCard>

                        {/* 4. Category Balance */}
                        <ChartCard
                            title={t.lifeBalance}
                            icon={PieChart}
                            colorClass="text-purple-500"
                            onClick={() => { setDetailView('categories'); setSelectedItemIndex(null); }}
                        >
                            <div className="flex items-center justify-center py-2">
                                {stats.categoryData && stats.categoryData.length > 0 ? (
                                    <DonutChart
                                        segments={stats.categoryData.map((c: any) => ({ value: c.value, color: c.color, label: c.label }))}
                                        size={100}
                                    />
                                ) : (
                                    <div className="text-textSecondary text-sm">
                                        {language === 'ru' ? 'Нет категорий' : 'No categories'}
                                    </div>
                                )}
                            </div>
                        </ChartCard>

                        {/* 5. Expense Tracking */}
                        <ChartCard
                            title={language === 'ru' ? 'Инвестиции' : 'Investments'}
                            icon={Banknote}
                            colorClass="text-green-500"
                            onClick={() => { setDetailView('expenses'); setSelectedItemIndex(null); }}
                            main={true}
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex flex-col">
                                    <span className="text-3xl font-black text-green-600">
                                        {getCurrencySymbol(stats.expenseStats.defaultCurrency)}{stats.expenseStats.totalExpenses.toFixed(0)}
                                    </span>
                                    <span className="text-[10px] text-textSecondary font-bold uppercase">{language === 'ru' ? 'Всего потрачено' : 'Total Spent'}</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-xl font-bold text-textPrimary">
                                        {getCurrencySymbol(stats.expenseStats.defaultCurrency)}{stats.expenseStats.todayExpenses.toFixed(0)}
                                    </span>
                                    <span className="text-[10px] text-textSecondary font-bold uppercase">{language === 'ru' ? 'Сегодня' : 'Today'}</span>
                                </div>
                            </div>
                            <GlowingBarChart
                                data={stats.expenseStats.dailyExpenses.map((val: number, i: number) => ({
                                    label: stats.expenseStats.dailyLabels[i] || '',
                                    value: val
                                }))}
                                height={100}
                                color="#22c55e"
                                orientation="vertical"
                            />
                        </ChartCard>
                    </div>

                </div> /* end TAB 1 overview */
            )}

            {/* ========== TAB 2: ANALYTICS ========== */}
            {statsTab === 'profile' && (
                <div className="space-y-5 animate-fadeIn">

                    {/* === STREAK RISK === */}
                    <StreakRisk habits={habits} language={language} />

                    {/* === CONSISTENCY TREND === */}
                    <ConsistencyTrend habits={habits} language={language} />

                    {/* === WEEKDAY ANALYTICS === */}
                    <WeekdayAnalytics habits={habits} language={language} />

                    {/* === PERSONAL RECORDS === */}
                    <PersonalRecords habits={habits} language={language} />

                    {/* === INVESTMENT ANALYTICS === */}
                    <InvestmentAnalytics
                        habits={habits}
                        language={language}
                        accentColor={accentColor}
                    />

                    {/* --- Yearly Heatmap (GitHub Style) --- */}
                    <div className="bg-surface border border-borderSubtle rounded-2xl p-4">
                        <YearlyHeatmap habits={habits} language={language} />
                    </div>

                </div> /* end TAB 2 analytics */
            )}

            {/* Detail Modal */}
            {
                detailView && (
                    <Modal
                        isOpen={!!detailView}
                        onClose={() => setDetailView(null)}
                        title={
                            detailView === 'weekly' ? t.efficiencyDays :
                                detailView === 'monthly' ? t.trends :
                                    detailView === 'categories' ? t.lifeBalance :
                                        detailView === 'time' ? t.timeOfDay :
                                            detailView === 'radar' ? t.charStats :
                                                detailView === 'expenses' ? (language === 'ru' ? 'Инвестиции' : 'Investments') :
                                                    (language === 'ru' ? 'Стрики' : 'Streaks')
                        }
                    >
                        {renderDetailContent()}
                    </Modal>
                )
            }

            {/* AI Insight Modal */}
            {
                aiInsight && (
                    <Modal
                        isOpen={!!aiInsight}
                        onClose={() => setAiInsight(null)}
                        title={language === 'ru' ? 'Глубокий Анализ' : 'Deep Analysis'}
                    >
                        <div className="p-2 space-y-4">
                            <div className="flex items-center gap-3 p-4 bg-brand/5 rounded-2xl border border-brand/10">
                                <BrainCircuit className="text-brand" size={24} />
                                <div className="text-xs font-bold text-brand uppercase tracking-widest">
                                    {language === 'ru' ? 'Инсайты от Gemini' : 'Insights by Gemini'}
                                </div>
                            </div>
                            <div className="text-sm text-textPrimary leading-relaxed whitespace-pre-line bg-surfaceHighlight/20 p-5 rounded-2xl border border-borderSubtle">
                                {renderMarkdown(aiInsight)}
                            </div>
                            <button
                                onClick={() => setAiInsight(null)}
                                className="w-full py-4 bg-brand text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand/20"
                            >
                                {language === 'ru' ? 'Понятно' : 'Understood'}
                            </button>
                        </div>
                    </Modal>
                )
            }



            {/* Analysis History List Modal */}
            <Modal
                isOpen={isHistoryOpen}
                onClose={() => setIsHistoryOpen(false)}
                title={language === 'ru' ? 'История Анализов' : 'Analysis History'}
            >
                <div className="space-y-4">
                    {analysisHistory.length === 0 ? (
                        <div className="py-12 text-center text-textSecondary italic text-sm">
                            {language === 'ru' ? 'История пуста' : 'History is empty'}
                        </div>
                    ) : (
                        <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            <AnimatedList className="space-y-3">
                                {analysisHistory.map((item, idx) => (
                                    <div
                                        key={item.id}
                                        onClick={() => { setSelectedHistoryItem(item); setIsHistoryOpen(false); }}
                                        className="p-4 bg-surfaceHighlight/30 rounded-2xl border border-borderSubtle hover:border-brand/50 transition-all cursor-pointer group active:scale-[0.98]"
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-[10px] font-black text-brand uppercase tracking-tighter">
                                                {new Date(item.date).toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </span>
                                            <ChevronRight size={14} className="text-textSecondary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="text-xs text-textSecondary line-clamp-2 leading-relaxed italic">
                                            "{item.insight}"
                                        </p>
                                    </div>
                                ))}
                            </AnimatedList>
                        </div>
                    )}
                </div>
            </Modal>

            {/* History Item Detail Modal */}
            {
                selectedHistoryItem && (
                    <Modal
                        isOpen={!!selectedHistoryItem}
                        onClose={() => setSelectedHistoryItem(null)}
                        title={language === 'ru' ? 'Прошлый Анализ' : 'Past Analysis'}
                    >
                        <div className="p-2 space-y-4">
                            <div onClick={() => { setSelectedHistoryItem(null); setIsHistoryOpen(true); }} className="flex items-center gap-2 text-brand font-bold text-[10px] uppercase tracking-wider cursor-pointer hover:underline mb-2 w-fit">
                                <ChevronRight className="rotate-180" size={12} strokeWidth={3} /> {language === 'ru' ? 'Назад к списку' : 'Back to list'}
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-brand/5 rounded-2xl border border-brand/10">
                                <BrainCircuit className="text-brand" size={24} />
                                <div className="text-xs font-bold text-brand uppercase tracking-[0.2em]">
                                    {new Date(selectedHistoryItem.date).toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' })}
                                </div>
                            </div>

                            <div className="text-sm text-textPrimary leading-relaxed whitespace-pre-line bg-surfaceHighlight/20 p-5 rounded-2xl border border-borderSubtle max-h-[50vh] overflow-y-auto custom-scrollbar">
                                {renderMarkdown(selectedHistoryItem.insight)}
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(selectedHistoryItem.insight);
                                        triggerHaptic();
                                    }}
                                    className="flex-1 py-3 bg-surfaceHighlight text-textPrimary font-bold rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-sm border border-borderSubtle"
                                >
                                    <Copy size={16} /> {language === 'ru' ? 'Копировать' : 'Copy'}
                                </button>
                                <button
                                    onClick={() => setSelectedHistoryItem(null)}
                                    className="flex-1 py-3 bg-brand text-white font-bold rounded-2xl active:scale-95 transition-all shadow-lg shadow-brand/20 text-sm"
                                >
                                    {language === 'ru' ? 'Закрыть' : 'Close'}
                                </button>
                            </div>
                        </div>
                    </Modal>
                )
            }


        </div >
    );
};

export default StatsView;
