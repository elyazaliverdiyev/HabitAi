
import React, { useMemo } from 'react';
import Modal from './Modal';
import { Habit } from '../types';
import { translations } from '../translations';
import { Clock, Calendar, Activity, Zap, TrendingUp } from 'lucide-react';

interface ActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  habits: Habit[];
  language?: 'ru' | 'en';
}

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, habits, language = 'ru' }) => {
  const t = translations[language].stats; // Reusing stats translations
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const stats = useMemo(() => {
    // --- 1. Hourly Distribution ---
    const hourlyCounts = new Array(24).fill(0);
    let totalTimedCompletions = 0;

    habits.forEach(h => {
      // If habit has a specific time, weight it heavily
      if (h.time) {
        const hour = parseInt(h.time.split(':')[0]);
        const completions = h.completedDates.length;
        hourlyCounts[hour] += completions;
        totalTimedCompletions += completions;
      }
    });
    
    // Normalize hourly for bar height (0 to 100%)
    const maxHourly = Math.max(...hourlyCounts, 1);
    
    // --- 2. Weekly Pattern ---
    const dayCounts = new Array(7).fill(0); // 0=Mon, 6=Sun
    habits.forEach(h => {
        h.completedDates.forEach(dateStr => {
            const date = new Date(dateStr);
            let day = date.getDay(); // 0=Sun
            day = day === 0 ? 6 : day - 1; // 0=Mon
            dayCounts[day]++;
        });
    });
    const maxDaily = Math.max(...dayCounts, 1);
    const weekDays = language === 'ru' ? ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'] : ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

    // --- 3. Heatmap (Last 90 Days) ---
    const today = new Date();
    const heatmapData = [];
    const dateMap: Record<string, number> = {};
    
    habits.forEach(h => {
        h.completedDates.forEach(d => {
            dateMap[d] = (dateMap[d] || 0) + 1;
        });
    });

    const maxHeatmapCount = Math.max(...Object.values(dateMap), 1);

    for (let i = 89; i >= 0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        const dStr = d.toISOString().split('T')[0];
        heatmapData.push({
            date: dStr,
            count: dateMap[dStr] || 0,
            intensity: (dateMap[dStr] || 0) / maxHeatmapCount
        });
    }

    return { hourlyCounts, maxHourly, dayCounts, maxDaily, weekDays, heatmapData, totalTimedCompletions };
  }, [habits, language]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={language === 'ru' ? "Анализ Активности" : "Activity Analysis"}>
      <div className="space-y-6 pt-2">
        
        {/* HEATMAP SECTION */}
        <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
                <Activity size={18} className="text-brand" />
                <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{language === 'ru' ? "Карта активности (90 дней)" : "Activity Map (90 Days)"}</h3>
            </div>
            <div className="flex flex-wrap gap-1 justify-center">
                {stats.heatmapData.map((day, i) => (
                    <div 
                        key={day.date}
                        className={`w-2.5 h-2.5 rounded-[2px] transition-all hover:scale-150 hover:z-10 relative group`}
                        style={{
                            backgroundColor: day.count > 0 ? 'var(--brand)' : 'var(--surface-highlight)',
                            opacity: day.count > 0 ? 0.3 + (day.intensity * 0.7) : 1
                        }}
                    >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-black/80 text-white text-[9px] font-bold px-2 py-1 rounded whitespace-nowrap z-20 pointer-events-none">
                            {day.date}: {day.count}
                        </div>
                    </div>
                ))}
            </div>
            <div className="flex justify-between items-center mt-3 text-[9px] text-textSecondary font-medium px-2">
                <span>{language === 'ru' ? "Меньше" : "Less"}</span>
                <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-[1px] bg-surfaceHighlight"></div>
                    <div className="w-2 h-2 rounded-[1px] bg-brand/30"></div>
                    <div className="w-2 h-2 rounded-[1px] bg-brand/60"></div>
                    <div className="w-2 h-2 rounded-[1px] bg-brand"></div>
                </div>
                <span>{language === 'ru' ? "Больше" : "More"}</span>
            </div>
        </div>

        {/* TIME OF DAY CHART */}
        <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-4">
             <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Clock size={18} className="text-orange-500" />
                    <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{language === 'ru' ? "Продуктивное время" : "Peak Hours"}</h3>
                </div>
                {stats.totalTimedCompletions === 0 && (
                    <span className="text-[9px] bg-surface px-2 py-0.5 rounded text-textSecondary">
                        {language === 'ru' ? "Нужны привычки со временем" : "Add time to habits"}
                    </span>
                )}
            </div>
            
            <div className="flex items-end gap-[2px] h-24 w-full">
                {stats.hourlyCounts.map((count, hour) => {
                    const height = (count / stats.maxHourly) * 100;
                    const isPeak = height === 100 && count > 0;
                    
                    return (
                        <div key={hour} className="flex-1 flex flex-col justify-end group h-full relative">
                            <div 
                                className={`w-full rounded-t-sm transition-all duration-500 ${isPeak ? 'bg-orange-500' : 'bg-brand/30 group-hover:bg-brand'}`}
                                style={{ height: `${Math.max(count > 0 ? height : 5, 5)}%` }}
                            ></div>
                            {/* Hover info */}
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 hidden group-hover:block bg-surface border border-borderSubtle text-textPrimary text-[9px] font-bold px-1.5 py-0.5 rounded z-10 whitespace-nowrap shadow-sm">
                                {hour}:00 - {count}
                            </div>
                            {/* Axis Labels (every 6 hours) */}
                            {hour % 6 === 0 && (
                                <div className="absolute top-full mt-1 text-[8px] text-textSecondary font-medium left-0 -ml-1">
                                    {hour}
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>

        {/* WEEKLY PATTERN CHART */}
        <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-2xl p-4">
             <div className="flex items-center gap-2 mb-4">
                <Calendar size={18} className="text-green-500" />
                <h3 className="text-xs font-bold text-textPrimary uppercase tracking-wider">{language === 'ru' ? "Недельный ритм" : "Weekly Rhythm"}</h3>
            </div>
            
            <div className="flex items-end justify-between gap-2 h-24">
                {stats.dayCounts.map((count, i) => {
                    const height = (count / stats.maxDaily) * 100;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                            <div className="text-[9px] font-bold text-textPrimary opacity-0 group-hover:opacity-100 transition-opacity -mb-1">{count}</div>
                            <div 
                                className="w-full max-w-[20px] rounded-t-md bg-green-500/80 group-hover:bg-green-500 transition-all duration-500 relative overflow-hidden"
                                style={{ height: `${Math.max(height, 5)}%` }}
                            >
                                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100" />
                            </div>
                            <div className="text-[9px] font-bold text-textSecondary uppercase">{stats.weekDays[i]}</div>
                        </div>
                    )
                })}
            </div>
        </div>

        {/* Insight Text */}
        <div className="bg-brand/5 border border-brand/10 rounded-xl p-3 flex gap-3 items-start">
            <Zap size={16} className="text-brand shrink-0 mt-0.5" />
            <p className="text-xs text-textSecondary leading-relaxed">
                {language === 'ru' 
                    ? "Анализ показывает, что постоянство важнее интенсивности. Старайтесь заполнять пробелы в карте активности, чтобы поддерживать инерцию."
                    : "Analysis suggests consistency beats intensity. Try to fill the gaps in your activity map to maintain momentum."}
            </p>
        </div>

      </div>
    </Modal>
  );
};

export default ActivityModal;
