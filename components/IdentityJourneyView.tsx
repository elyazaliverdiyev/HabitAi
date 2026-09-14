import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Zap, ChevronRight, Target } from 'lucide-react';
import { Habit, getCurrentStreak } from '../types';
import { getLocalDateString } from '../utils/helpers';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

// ---------------------------------------------------------------
// Identity definitions (matching OnboardingScreen)
// ---------------------------------------------------------------
interface IdentityDef {
  id: string;
  emoji: string;
  title_ru: string;
  title_en: string;
  color: string;
  keywords_ru: string[];
  keywords_en: string[];
}

const IDENTITY_DEFS: IdentityDef[] = [
  {
    id: 'health',
    emoji: '💪',
    title_ru: 'Здоровый',
    title_en: 'Healthy',
    color: '#4ade80',
    keywords_ru: ['бег', 'вода', 'сон', 'сахар', 'растяжка', 'тренировка', 'спорт', 'здоров'],
    keywords_en: ['run', 'water', 'sleep', 'sugar', 'stretch', 'workout', 'sport', 'health', 'gym'],
  },
  {
    id: 'mind',
    emoji: '🧠',
    title_ru: 'Продуктивный',
    title_en: 'Productive',
    color: '#60a5fa',
    keywords_ru: ['чтение', 'читать', 'соцсет', 'планирование', 'deep work', 'обучение', 'курс', 'работа', 'задач'],
    keywords_en: ['read', 'social', 'plan', 'deep work', 'learn', 'course', 'work', 'task', 'focus'],
  },
  {
    id: 'calm',
    emoji: '😌',
    title_ru: 'Спокойный',
    title_en: 'Calm',
    color: '#a78bfa',
    keywords_ru: ['медитац', 'дневник', 'прогулка', 'детокс', 'дыхан', 'благодарн'],
    keywords_en: ['meditat', 'journal', 'walk', 'detox', 'breath', 'gratitude'],
  },
  {
    id: 'wealth',
    emoji: '💰',
    title_ru: 'Финансово свободный',
    title_en: 'Financially free',
    color: '#fbbf24',
    keywords_ru: ['расход', 'инвестиц', 'проект', 'сохран', 'финанс', 'деньг'],
    keywords_en: ['expense', 'invest', 'project', 'save', 'financ', 'money', 'budget'],
  },
  {
    id: 'creator',
    emoji: '✍️',
    title_ru: 'Творец',
    title_en: 'Creator',
    color: '#f97316',
    keywords_ru: ['писать', 'писать', 'контент', 'нетворк', 'навык', 'публик', 'создав'],
    keywords_en: ['write', 'content', 'network', 'skill', 'publish', 'create', 'design'],
  },
];

// Match a habit to an identity by keyword
const matchIdentity = (habit: Habit, lang: 'ru' | 'en'): string | null => {
  const name = habit.name.toLowerCase();
  const category = (habit.category || '').toLowerCase();
  const text = `${name} ${category}`;
  const field = lang === 'ru' ? 'keywords_ru' : 'keywords_en';

  for (const id of IDENTITY_DEFS) {
    if (id[field].some(kw => text.includes(kw))) return id.id;
  }
  return null;
};

// ---------------------------------------------------------------
// IdentityCard
// ---------------------------------------------------------------
interface IdentityCardProps {
  def: IdentityDef;
  habits: Habit[];
  todayStr: string;
  language: 'ru' | 'en';
  accentColor: string;
  onToggle: (id: string, date: string) => void;
  onOpen: (h: Habit) => void;
}

const IdentityCard: React.FC<IdentityCardProps> = ({
  def, habits, todayStr, language, onToggle, onOpen,
}) => {
  const done = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const total = habits.length;
  const pct = total > 0 ? done / total : 0;
  const bestStreak = Math.max(0, ...habits.map(h => getCurrentStreak(h)));

  const barColor = pct === 1 ? '#4ade80' : pct >= 0.5 ? def.color : `${def.color}88`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        border: `1px solid ${pct === 1 ? def.color + '40' : 'rgba(255,255,255,0.08)'}`,
        boxShadow: pct === 1 ? `0 8px 32px ${def.color}20` : '0 4px 16px rgba(0,0,0,0.08)',
        marginBottom: 12,
        transition: 'border-color 0.4s, box-shadow 0.4s',
      }}
    >
      {/* Card header */}
      <div style={{
        padding: '14px 16px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <div style={{
          width: 38, height: 38, borderRadius: 11,
          background: `${def.color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, flexShrink: 0,
        }}>
          {def.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-primary)' }}>
            {language === 'ru'
              ? `Человек с ${def.id === 'health' ? 'крепким здоровьем' : def.id === 'mind' ? 'острым умом' : def.id === 'calm' ? 'внутренним миром' : def.id === 'wealth' ? 'финансовой свободой' : 'творческой душой'}`
              : `The ${language === 'ru' ? def.title_ru : def.title_en} Person`}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
            {done}/{total} {language === 'ru' ? 'сегодня' : 'today'}
            {bestStreak >= 3 && <span style={{ color: '#f97316', marginLeft: 6 }}>🔥 {bestStreak}</span>}
          </div>
        </div>

        {/* Circular mini-progress */}
        <div style={{ position: 'relative', width: 36, height: 36, flexShrink: 0 }}>
          <svg width={36} height={36} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={18} cy={18} r={14} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
            <motion.circle
              cx={18} cy={18} r={14} fill="none"
              stroke={barColor} strokeWidth={3} strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 14}
              animate={{ strokeDashoffset: 2 * Math.PI * 14 * (1 - pct) }}
              transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
              style={{ filter: pct > 0 ? `drop-shadow(0 0 4px ${def.color}88)` : 'none' }}
            />
          </svg>
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800,
            color: pct === 1 ? def.color : 'var(--text-secondary)',
          }}>
            {Math.round(pct * 100)}%
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: 'rgba(255,255,255,0.05)' }}>
        <motion.div
          animate={{ width: `${pct * 100}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          style={{
            height: '100%',
            background: `linear-gradient(90deg, ${def.color}cc, ${def.color})`,
            boxShadow: pct > 0 ? `0 0 8px ${def.color}88` : 'none',
          }}
        />
      </div>

      {/* Habits list */}
      <div style={{ padding: '8px 12px 12px' }}>
        {habits.map((habit, i) => {
          const isDone = habit.completedDates.includes(todayStr);
          const streak = getCurrentStreak(habit);
          return (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 4px',
                borderBottom: i < habits.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
              }}
            >
              {/* Toggle button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={() => onToggle(habit.id, todayStr)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: isDone ? def.color : 'rgba(255,255,255,0.06)',
                  border: `2px solid ${isDone ? def.color : 'rgba(255,255,255,0.12)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: isDone ? `0 2px 12px ${def.color}66` : 'none',
                  transition: 'all 0.2s',
                }}
              >
                <AnimatePresence>
                  {isDone && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={motionPress}
                    >
                      <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Habit info */}
              <button
                onClick={() => onOpen(habit)}
                style={{
                  flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', padding: 0,
                }}
              >
                <div style={{
                  fontSize: 13, fontWeight: 600,
                  color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
                  textDecoration: isDone ? 'line-through' : 'none',
                  transition: 'all 0.2s',
                }}>
                  {habit.icon && <span style={{ marginRight: 5 }}>{habit.icon}</span>}
                  {habit.name}
                </div>
              </button>

              {/* XP + streak */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {isDone && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    style={{
                      fontSize: 10, fontWeight: 800,
                      color: def.color,
                      background: `${def.color}18`,
                      padding: '2px 6px', borderRadius: 5,
                    }}
                  >
                    +{20 + (streak >= 7 ? 10 : streak >= 3 ? 5 : 0)} xp
                  </motion.span>
                )}
                {streak >= 3 && (
                  <span style={{ fontSize: 11, color: '#f97316' }}>🔥{streak}</span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* All done banner */}
      <AnimatePresence>
        {pct === 1 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{
              padding: '10px 16px',
              background: `linear-gradient(135deg, ${def.color}18, ${def.color}0a)`,
              borderTop: `1px solid ${def.color}20`,
              display: 'flex', alignItems: 'center', gap: 8,
              fontSize: 12, fontWeight: 700,
              color: def.color,
            }}
          >
            <span>{def.emoji}</span>
            {language === 'ru'
              ? `Идентичность "${def.title_ru}" выполнена сегодня!`
              : `"${def.title_en}" identity complete today!`}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------------------------------------------------------------
// Unmatched habits (Other)
// ---------------------------------------------------------------
const OtherHabitsCard: React.FC<{
  habits: Habit[];
  todayStr: string;
  language: 'ru' | 'en';
  accentColor: string;
  onToggle: (id: string, date: string) => void;
  onOpen: (h: Habit) => void;
}> = ({ habits, todayStr, language, accentColor, onToggle, onOpen }) => {
  if (habits.length === 0) return null;
  const done = habits.filter(h => h.completedDates.includes(todayStr)).length;

  return (
    <div style={{
      borderRadius: 20,
      padding: '12px 16px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      marginBottom: 12,
    }}>
      <div style={{
        fontSize: 10, fontWeight: 800,
        color: 'var(--text-secondary)',
        textTransform: 'uppercase', letterSpacing: '0.12em',
        marginBottom: 10,
      }}>
        📋 {language === 'ru' ? 'Остальные' : 'Other'} · {done}/{habits.length}
      </div>
      {habits.map((habit, i) => {
        const isDone = habit.completedDates.includes(todayStr);
        return (
          <div
            key={habit.id}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '7px 0',
              borderBottom: i < habits.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
            }}
          >
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={() => onToggle(habit.id, todayStr)}
              style={{
                width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                background: isDone ? accentColor : 'rgba(255,255,255,0.06)',
                border: `2px solid ${isDone ? accentColor : 'rgba(255,255,255,0.12)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {isDone && (
                <svg width={11} height={11} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </motion.button>
            <button
              onClick={() => onOpen(habit)}
              style={{ flex: 1, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}
            >
              <span style={{
                fontSize: 13, fontWeight: 600,
                color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)',
                textDecoration: isDone ? 'line-through' : 'none',
              }}>
                {habit.icon && <span style={{ marginRight: 5 }}>{habit.icon}</span>}
                {habit.name}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------
// Top identity summary bar
// ---------------------------------------------------------------
const IdentitySummaryBar: React.FC<{
  groups: { def: IdentityDef; habits: Habit[]; pct: number }[];
  language: 'ru' | 'en';
  accentColor: string;
  todayStr: string;
}> = ({ groups, language, accentColor }) => {
  const overallPct = groups.length > 0
    ? groups.reduce((s, g) => s + g.pct, 0) / groups.length
    : 0;

  return (
    <div style={{
      padding: '14px 16px',
      borderRadius: 20,
      background: 'rgba(255,255,255,0.04)',
      backdropFilter: 'blur(40px)',
      WebkitBackdropFilter: 'blur(40px)',
      border: '1px solid rgba(255,255,255,0.08)',
      marginBottom: 20,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-primary)' }}>
            {language === 'ru' ? '🧬 Путь становления' : '🧬 Identity Journey'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
            {language === 'ru'
              ? `${Math.round(overallPct * 100)}% выполнено сегодня`
              : `${Math.round(overallPct * 100)}% complete today`}
          </div>
        </div>
        <div style={{
          fontSize: 22, fontWeight: 900,
          color: overallPct === 1 ? '#4ade80' : accentColor,
        }}>
          {Math.round(overallPct * 100)}%
        </div>
      </div>

      {/* Identity mini-dots */}
      <div style={{ display: 'flex', gap: 6 }}>
        {groups.map(g => (
          <div
            key={g.def.id}
            title={language === 'ru' ? g.def.title_ru : g.def.title_en}
            style={{
              flex: 1, padding: '6px 4px',
              borderRadius: 8,
              background: g.pct === 1 ? `${g.def.color}20` : 'rgba(255,255,255,0.03)',
              border: `1px solid ${g.pct > 0 ? g.def.color + '30' : 'rgba(255,255,255,0.05)'}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 14 }}>{g.def.emoji}</div>
            <div style={{
              fontSize: 8, fontWeight: 700, marginTop: 2,
              color: g.pct > 0 ? g.def.color : 'rgba(255,255,255,0.2)',
            }}>
              {Math.round(g.pct * 100)}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Main IdentityJourneyView
// ---------------------------------------------------------------
interface IdentityJourneyViewProps {
  habits: Habit[];
  language: 'ru' | 'en';
  accentColor: string;
  onToggle: (habitId: string, dateStr: string) => void;
  onOpenHabit: (habit: Habit) => void;
  onAddHabit: () => void;
}

const IdentityJourneyView: React.FC<IdentityJourneyViewProps> = ({
  habits, language, accentColor, onToggle, onOpenHabit, onAddHabit,
}) => {
  const todayStr = getLocalDateString();

  // Group habits by identity
  const { groups, others } = useMemo(() => {
    const matched: Record<string, Habit[]> = {};
    const unmatched: Habit[] = [];

    for (const habit of habits) {
      const id = matchIdentity(habit, language);
      if (id) {
        if (!matched[id]) matched[id] = [];
        matched[id].push(habit);
      } else {
        unmatched.push(habit);
      }
    }

    const groups = IDENTITY_DEFS
      .filter(def => matched[def.id]?.length > 0)
      .map(def => ({
        def,
        habits: matched[def.id],
        pct: matched[def.id].filter(h => h.completedDates.includes(todayStr)).length / matched[def.id].length,
      }));

    return { groups, others: unmatched };
  }, [habits, todayStr, language]);

  // If no identities matched — show all as "Other"
  if (groups.length === 0) {
    return (
      <div style={{ padding: '8px 0' }}>
        <div style={{
          textAlign: 'center', padding: '32px 20px',
          color: 'var(--text-secondary)',
          fontSize: 13,
        }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🧬</div>
          <div style={{ fontWeight: 700, marginBottom: 8 }}>
            {language === 'ru' ? 'Добавь привычки под идентичность' : 'Add habits for your identity'}
          </div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>
            {language === 'ru'
              ? 'Например: "Бег 5км", "Медитация", "Чтение 30 мин"'
              : 'E.g. "Run 5km", "Meditate", "Read 30 min"'}
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAddHabit}
            style={{
              marginTop: 16,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '10px 20px',
              borderRadius: 12,
              background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
              color: '#fff', fontWeight: 700, fontSize: 13,
              border: 'none', cursor: 'pointer',
            }}
          >
            <Plus size={15} />
            {language === 'ru' ? 'Добавить привычку' : 'Add Habit'}
          </motion.button>
        </div>
        <OtherHabitsCard
          habits={others}
          todayStr={todayStr}
          language={language}
          accentColor={accentColor}
          onToggle={onToggle}
          onOpen={onOpenHabit}
        />
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: 20 }}>
      {/* Summary bar */}
      <IdentitySummaryBar
        groups={groups}
        language={language}
        accentColor={accentColor}
        todayStr={todayStr}
      />

      {/* Identity cards */}
      {groups.map((group, i) => (
        <motion.div
          key={group.def.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08, ...motionContainer }}
        >
          <IdentityCard
            def={group.def}
            habits={group.habits}
            todayStr={todayStr}
            language={language}
            accentColor={accentColor}
            onToggle={onToggle}
            onOpen={onOpenHabit}
          />
        </motion.div>
      ))}

      {/* Other habits */}
      <OtherHabitsCard
        habits={others}
        todayStr={todayStr}
        language={language}
        accentColor={accentColor}
        onToggle={onToggle}
        onOpen={onOpenHabit}
      />

      {/* Add button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={onAddHabit}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          padding: '13px',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,255,255,0.12)',
          color: 'var(--text-secondary)',
          fontWeight: 700, fontSize: 13,
          cursor: 'pointer',
          marginTop: 4,
        }}
      >
        <Plus size={16} />
        {language === 'ru' ? 'Добавить привычку' : 'Add Habit'}
      </motion.button>
    </div>
  );
};

export default IdentityJourneyView;
