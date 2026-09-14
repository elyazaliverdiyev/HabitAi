
import React from 'react';
import { Habit, getCurrencySymbol, getRarity } from '../types';
import Icon from './Icons';
import { Check, Banknote, Clock, MapPin } from 'lucide-react';
import ClickSpark from './ClickSpark';

interface HabitRowProps {
  habit: Habit;
  selectedDate: Date;
  onToggleDate: (date: string, e?: React.MouseEvent | React.TouchEvent) => void;
  onClick: () => void;
  currentTime?: string;  // HH:MM format
  timeFocusMode?: boolean;
  accentColor?: string;
  justCompleted?: boolean; // True for 1.2s after completion for success animation
}

// Helper to get local date string YYYY-MM-DD
const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to determine time status: 'now' | 'soon' | 'later' | null
const getTimeStatus = (habitTime?: string, currentTime?: string): 'now' | 'soon' | 'later' | null => {
  if (!habitTime || !currentTime) return null;

  const [habitH, habitM] = habitTime.split(':').map(Number);
  const [currH, currM] = currentTime.split(':').map(Number);

  const habitMinutes = habitH * 60 + habitM;
  const currentMinutes = currH * 60 + currM;
  const diff = habitMinutes - currentMinutes;

  if (diff >= -30 && diff <= 30) return 'now';  // ±30 minutes
  if (diff > 30 && diff <= 90) return 'soon';   // Next hour
  return 'later';
};

const HabitRow: React.FC<HabitRowProps> = ({ habit, selectedDate, onToggleDate, onClick, currentTime, timeFocusMode, accentColor, justCompleted }) => {
  const today = new Date();
  const dateStrings = [];

  // Last 5 days for the mini grid (Context)
  for (let i = 4; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dateStrings.push(getLocalDateString(d));
  }

  // Calculate target date string based on selectedDate prop
  const targetDateStr = getLocalDateString(selectedDate);

  const isCompletedTarget = habit.completedDates.includes(targetDateStr);
  const isTargetToday = targetDateStr === getLocalDateString(new Date());

  const getScheduleLabel = () => {
    if (habit.frequency === 'specific_days' && habit.frequencyDays && habit.frequencyDays.length > 0) {
      const days = habit.frequencyDays.sort().map(d => {
        // Map 0-6 to short names. 0=Sun.
        const map = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        return map[d];
      });
      return days.join(', ');
    }
    return habit.category || null;
  };

  const scheduleLabel = getScheduleLabel();

  // Time-Based Focus Mode
  const timeStatus = timeFocusMode ? getTimeStatus(habit.time, currentTime) : null;
  const isNow = timeStatus === 'now';
  const isLater = timeStatus === 'later' && !isCompletedTarget;

  // Get accent color for the glow
  const glowColor = accentColor || 'var(--brand)';

  // Rarity for important habits glow
  const rarity = getRarity(habit);
  const isRareHabit = rarity !== 'common' && !isCompletedTarget;
  const rarityRowGlowMap: Record<string, string> = {
    legendary: '#f59e0b',
    epic: '#a855f7',
    rare: '#3b82f6',
    uncommon: '#22c55e',
  };
  const rarityRowGlow = isRareHabit ? rarityRowGlowMap[rarity] : undefined;

  return (
    <div
      className={`
        relative rounded-2xl p-4 border flex items-center gap-4 group card-press shadow-sm
        dark:bg-white/[0.06] dark:border-white/10 dark:hover:bg-white/10 dark:hover:border-white/15
        bg-surface border-borderSubtle hover:border-brand/20
        ${justCompleted ? 'row-success-glow' : ''}
        ${isNow
          ? 'time-focus-now'
          : isLater
            ? 'opacity-50 hover:opacity-80'
            : 'hover-lift hover:shadow-lg'
        }
      `}
      style={{
        // Rarity glow for important habits
        ...(isRareHabit ? {
          boxShadow: `0 0 15px ${rarityRowGlow}30, inset 0 0 20px ${rarityRowGlow}10`,
          borderColor: `${rarityRowGlow}40`,
        } : {}),
        ...(isNow ? {
          '--glow-color': glowColor,
        } as React.CSSProperties : {}),
      }}
    >
      {/* Premium animated border for "NOW" state */}
      {isNow && (
        <>
          {/* Gradient border container */}
          <div
            className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden"
            style={{
              padding: '2px',
            }}
          >
            <div
              className="absolute inset-0 rounded-2xl"
              style={{
                background: `linear-gradient(90deg, transparent, ${glowColor}, transparent)`,
                animation: 'border-flow 2.5s linear infinite',
              }}
            />
          </div>

          {/* Soft outer glow */}
          <div
            className="absolute -inset-1 rounded-[1.1rem] pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, ${glowColor}15 0%, transparent 70%)`,
              animation: 'glow-pulse 3s ease-in-out infinite',
            }}
          />

          {/* "СЕЙЧАС" badge */}
          <div
            className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
            style={{
              background: glowColor,
              color: 'white',
              boxShadow: `0 2px 10px ${glowColor}60`,
            }}
          >
            СЕЙЧАС
          </div>
        </>
      )}

      {/* Icon Area — Apple SF Symbols style (single div, performant) */}
      <div
        className={`w-12 h-12 shrink-0 cursor-pointer transition-all duration-300 group-hover:scale-110 flex items-center justify-center ${isNow ? 'scale-105' : ''}`}
        style={{
          borderRadius: '27%',
          background: `linear-gradient(160deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0.05) 40%, transparent 50%), linear-gradient(145deg, ${habit.color}ee, ${habit.color}bb)`,
          boxShadow: isNow
            ? `0 4px 20px ${habit.color}80, 0 0 30px ${habit.color}40, inset 0 1px 0 rgba(255,255,255,0.3)`
            : `0 3px 10px ${habit.color}50, inset 0 1px 0 rgba(255,255,255,0.25)`,
        }}
        onClick={onClick}
      >
        <Icon name={habit.icon} size={22} className="text-white drop-shadow-sm" />
      </div>

      {/* Text Area */}
      <div className="flex-1 min-w-0 cursor-pointer" onClick={onClick}>
        <h3 className={`font-bold text-base truncate transition-colors duration-300 flex items-center gap-1.5 ${isNow ? 'text-brand' : 'text-textPrimary group-hover:text-brand'}`}>
          {habit.isKeystone && (
            <span className="text-amber-500" title="Ключевая привычка">🔑</span>
          )}
          {habit.name}
        </h3>
        <div className="flex items-center gap-2 flex-wrap">
          {habit.description ? (
            <p className="text-xs text-textSecondary truncate">{habit.description}</p>
          ) : scheduleLabel ? (
            <span className="text-[10px] text-textSecondary uppercase tracking-wider font-medium">{scheduleLabel}</span>
          ) : null}
          {habit.cost && habit.cost > 0 && (
            <div className="flex items-center gap-1.5 bg-gradient-to-r from-green-500/20 to-emerald-500/10 px-2 py-1 rounded-lg border border-green-500/20 shadow-sm dark:border-green-500/30">
              <Banknote size={12} className="text-green-500" />
              <span className="text-[10px] font-black text-green-600 dark:text-green-400">{getCurrencySymbol(habit.currency || 'USD')}{habit.cost}</span>
            </div>
          )}
          {/* Time Badge - premium styling for NOW mode */}
          {habit.time && (
            <div
              className={`flex items-center gap-1 px-2 py-1 rounded-lg border transition-all duration-300 ${isNow
                ? 'bg-gradient-to-r from-brand/30 to-brand/10 border-brand/40 shadow-sm'
                : 'bg-gradient-to-r from-blue-500/20 to-cyan-500/10 border-blue-500/20 dark:border-blue-500/30'
                }`}
              style={isNow ? { boxShadow: `0 0 10px ${glowColor}30` } : undefined}
            >
              <Clock size={10} className={isNow ? 'text-brand animate-pulse' : 'text-blue-500'} />
              <span className={`text-[10px] font-bold ${isNow ? 'text-brand' : 'text-blue-600 dark:text-blue-400'}`}>{habit.time}</span>
            </div>
          )}
          {/* Place Badge */}
          {habit.place && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-pink-500/10 px-2 py-1 rounded-lg border border-purple-500/20 dark:border-purple-500/30">
              <MapPin size={10} className="text-purple-500" />
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 truncate max-w-[80px]">{habit.place}</span>
            </div>
          )}
          {/* Adaptive Goal Progress */}
          {habit.ultimateTarget && habit.ultimateTarget > 1 && (
            <div className="flex items-center gap-1 bg-gradient-to-r from-purple-500/20 to-indigo-500/10 px-2 py-1 rounded-lg border border-purple-500/20 shadow-sm dark:border-purple-500/30">
              <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">
                {habit.targetCount || 1}→{habit.ultimateTarget}
              </span>
            </div>
          )}
          {/* Items & Checklist Progress Badge */}
          {habit.items && habit.items.length > 0 && (() => {
            // Calculate total checklist progress across all items
            let totalChecks = 0;
            let doneChecks = 0;
            habit.items.forEach(item => {
              if (item.checklist && item.checklist.length > 0) {
                totalChecks += item.checklist.length;
                doneChecks += item.checklist.filter(c => c.done).length;
              }
            });
            const hasChecklists = totalChecks > 0;
            const allDone = hasChecklists && doneChecks === totalChecks;

            return (
              <div className={`flex items-center gap-1 px-2 py-1 rounded-lg border shadow-sm ${allDone
                ? 'bg-gradient-to-r from-green-500/20 to-emerald-500/10 border-green-500/20 dark:border-green-500/30'
                : 'bg-gradient-to-r from-purple-500/20 to-pink-500/10 border-purple-500/20 dark:border-purple-500/30'
                }`}>
                <span className={`text-[10px] font-bold ${allDone ? 'text-green-600 dark:text-green-400' : 'text-purple-600 dark:text-purple-400'}`}>
                  {hasChecklists
                    ? `✓ ${doneChecks}/${totalChecks}`
                    : `${habit.items.length} 📋`
                  }
                </span>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Mini Grid (Last 5 days) & Action Button */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Mini History Dots */}
        <div className="hidden xs:flex gap-1.5 mr-1">
          {dateStrings.slice(0, 4).map(dateStr => {
            const isCompleted = habit.completedDates.includes(dateStr);
            return (
              <div
                key={dateStr}
                onClick={(e) => { e.stopPropagation(); onToggleDate(dateStr, e); }}
                className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[4px] transition-all duration-300 cursor-pointer ${isCompleted ? 'scale-100 shadow-sm' : 'dark:bg-white/10 dark:border-white/20 bg-surfaceHighlight border border-borderSubtle scale-90 hover:scale-100'}`}
                style={{
                  backgroundColor: isCompleted ? habit.color : undefined,
                  boxShadow: isCompleted ? `0 0 8px ${habit.color}60` : undefined,
                }}
                title={dateStr}
              />
            );
          })}
        </div>

        {/* Target Action Button - enhanced for NOW */}
        {(() => {
          const rarity = getRarity(habit);
          const rarityClass = rarity !== 'common' && !isCompletedTarget ? `rarity-${rarity}` : '';
          const isRare = rarity !== 'common' && !isCompletedTarget;

          // Rarity glow colors
          const rarityGlowMap: Record<string, string> = {
            legendary: '#f59e0b',
            epic: '#a855f7',
            rare: '#3b82f6',
            uncommon: '#22c55e',
          };
          const rarityGlow = isRare ? rarityGlowMap[rarity] : undefined;

          return (
            <ClickSpark
              sparkColor={habit.color}
              sparkCount={12}
              sparkRadius={40}
              duration={450}
              enabled={true}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onToggleDate(targetDateStr, e); }}
                className={`
                  w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center transition-all duration-300 active:scale-90 relative
                  ${isCompletedTarget
                    ? 'bg-brand text-white scale-100'
                    : 'dark:border-white/15 dark:hover:bg-white/15 border border-borderSubtle text-textSecondary hover:text-textPrimary checkbox-pulse'
                  }
                  ${rarityClass}
                  ${isNow && !isCompletedTarget ? 'now-action-btn' : ''}
                  ${justCompleted && isCompletedTarget ? 'checkbox-success' : ''}
                `}
                style={{
                  // Accent color background for uncompleted - stronger color
                  backgroundColor: isCompletedTarget
                    ? undefined
                    : `color-mix(in srgb, ${accentColor || 'var(--brand)'} 25%, transparent)`,
                  // Border color accent
                  borderColor: isCompletedTarget
                    ? undefined
                    : isRare
                      ? `${rarityGlow}60`
                      : `color-mix(in srgb, ${accentColor || 'var(--brand)'} 40%, transparent)`,
                  // CSS variable for animation
                  '--checkbox-accent': accentColor || 'var(--brand)',
                  '--checkbox-rarity-glow': rarityGlow || (accentColor || 'var(--brand)'),
                } as React.CSSProperties}
                title={targetDateStr}
              >
                <Check size={22} strokeWidth={3} className={isCompletedTarget ? 'opacity-100' : isNow ? 'opacity-30' : 'opacity-0 group-hover:opacity-20'} />

                {!isTargetToday && !isCompletedTarget && (
                  <span className="absolute -bottom-1 -right-1 text-[8px] font-bold bg-textPrimary text-background px-1 rounded-full opacity-50">
                    {selectedDate.getDate()}
                  </span>
                )}
              </button>
            </ClickSpark>
          );
        })()}
      </div>

      {/* Premium CSS animations */}
      <style>{`
        @keyframes border-flow {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes glow-pulse {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 0.8; }
        }
        
        @keyframes success-pop {
          0% { transform: scale(0.92); opacity: 0.8; }
          60% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); }
        }
        
        .time-focus-now {
          border-color: var(--glow-color, var(--brand));
          border-width: 2px;
          background: linear-gradient(
            135deg, 
            rgba(var(--brand-rgb, 99, 102, 241), 0.05) 0%, 
            transparent 50%
          );
        }
        
        .checkbox-success {
          animation: success-pop 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .row-success-glow {
          transition: box-shadow 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 0 20px rgba(52, 211, 153, 0.25) !important;
        }
      `}</style>
    </div>
  );
};

export default HabitRow;
