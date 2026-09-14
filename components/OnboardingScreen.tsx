import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles, Check } from 'lucide-react';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------
interface Identity {
  id: string;
  emoji: string;
  title_ru: string;
  title_en: string;
  desc_ru: string;
  desc_en: string;
  color: string;
  habits_ru: string[];
  habits_en: string[];
}

interface OnboardingScreenProps {
  language: 'ru' | 'en';
  accentColor: string;
  apiKey?: string;
  onComplete: (selectedIdentities: string[], selectedHabits: string[]) => void;
}

// ---------------------------------------------------------------
// Identity catalogue
// ---------------------------------------------------------------
const IDENTITIES: Identity[] = [
  {
    id: 'health',
    emoji: '💪',
    title_ru: 'Здоровый',
    title_en: 'Healthy',
    desc_ru: 'Сильное тело — крепкий фундамент',
    desc_en: 'Strong body, strong foundation',
    color: '#4ade80',
    habits_ru: ['Бег / тренировка 30 мин', 'Вода 2 литра', 'Сон 8 часов', 'Без сахара', 'Растяжка 10 мин'],
    habits_en: ['Run / workout 30 min', 'Drink 2L water', 'Sleep 8 hours', 'No sugar', 'Stretch 10 min'],
  },
  {
    id: 'mind',
    emoji: '🧠',
    title_ru: 'Продуктивный',
    title_en: 'Productive',
    desc_ru: 'Острый ум открывает возможности',
    desc_en: 'Sharp mind opens opportunities',
    color: '#60a5fa',
    habits_ru: ['Чтение 30 мин', 'Без соцсетей до 12:00', 'Планирование дня', 'Deep work 2 часа', 'Обучение / курс'],
    habits_en: ['Read 30 min', 'No social media until noon', 'Plan the day', 'Deep work 2 hours', 'Learning / course'],
  },
  {
    id: 'calm',
    emoji: '😌',
    title_ru: 'Спокойный',
    title_en: 'Calm',
    desc_ru: 'Внутренний мир — настоящая сила',
    desc_en: 'Inner peace is real strength',
    color: '#a78bfa',
    habits_ru: ['Медитация 10 мин', 'Дневник благодарности', 'Прогулка на воздухе', 'Цифровой детокс вечером', 'Дыхательные практики'],
    habits_en: ['Meditate 10 min', 'Gratitude journal', 'Walk outside', 'Evening digital detox', 'Breathing exercises'],
  },
  {
    id: 'wealth',
    emoji: '💰',
    title_ru: 'Финансово свободный',
    title_en: 'Financially free',
    desc_ru: 'Деньги — инструмент, а не цель',
    desc_en: 'Money is a tool, not a goal',
    color: '#fbbf24',
    habits_ru: ['Трекинг расходов', 'Учёба об инвестициях', 'Работа над побочным проектом', 'Сохранять X% дохода', 'Читать про финансы'],
    habits_en: ['Track expenses', 'Study investing', 'Work on side project', 'Save X% of income', 'Read about finance'],
  },
  {
    id: 'creator',
    emoji: '✍️',
    title_ru: 'Творец',
    title_en: 'Creator',
    desc_ru: 'Создавай — и мир узнает о тебе',
    desc_en: 'Create — and the world will know you',
    color: '#f97316',
    habits_ru: ['Писать 500 слов', 'Работа над проектом 1 час', 'Учиться новому навыку', 'Публиковать контент', 'Нетворкинг'],
    habits_en: ['Write 500 words', 'Work on project 1 hour', 'Learn new skill', 'Publish content', 'Network'],
  },
];

// ---------------------------------------------------------------
// Floating orb bg (reused from login)
// ---------------------------------------------------------------
const BgOrbs: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
    <motion.div
      animate={{ x: [0, 20, -15, 0], y: [0, -30, 20, 0] }}
      transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
      style={{
        position: 'absolute', top: '-15%', left: '-10%',
        width: 350, height: 350, borderRadius: '50%',
        background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
        filter: 'blur(50px)',
      }}
    />
    <motion.div
      animate={{ x: [0, -20, 30, 0], y: [0, 40, -20, 0] }}
      transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      style={{
        position: 'absolute', bottom: '10%', right: '-10%',
        width: 280, height: 280, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.25) 0%, transparent 70%)',
        filter: 'blur(40px)',
      }}
    />
  </div>
);

// ---------------------------------------------------------------
// Step 1: Choose identities
// ---------------------------------------------------------------
const Step1: React.FC<{
  language: 'ru' | 'en';
  selected: string[];
  onToggle: (id: string) => void;
  onNext: () => void;
}> = ({ language, selected, onToggle, onNext }) => (
  <div>
    <div style={{ textAlign: 'center', marginBottom: 28 }}>
      <div style={{ fontSize: 32, marginBottom: 12 }}>🧬</div>
      <h2 style={{ fontSize: 24, fontWeight: 900, color: '#fff', margin: '0 0 8px' }}>
        {language === 'ru' ? 'Кем ты хочешь стать?' : 'Who do you want to become?'}
      </h2>
      <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', margin: 0 }}>
        {language === 'ru'
          ? 'Выбери одну или несколько идентичностей'
          : 'Choose one or more identities'}
      </p>
    </div>

    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
      {IDENTITIES.map((id, i) => {
        const isSelected = selected.includes(id.id);
        return (
          <motion.button
            key={id.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07, ...motionContainer }}
            whileHover={{ scale: 1.02, x: 4 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onToggle(id.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 16px',
              borderRadius: 16,
              background: isSelected
                ? `linear-gradient(135deg, ${id.color}20, ${id.color}0a)`
                : 'rgba(255,255,255,0.04)',
              border: `1.5px solid ${isSelected ? id.color + '60' : 'rgba(255,255,255,0.08)'}`,
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${id.color}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22, flexShrink: 0,
            }}>
              {id.emoji}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{
                fontSize: 15, fontWeight: 800,
                color: isSelected ? '#fff' : 'rgba(255,255,255,0.85)',
              }}>
                {language === 'ru' ? id.title_ru : id.title_en}
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                {language === 'ru' ? id.desc_ru : id.desc_en}
              </div>
            </div>
            <div style={{
              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
              background: isSelected ? id.color : 'rgba(255,255,255,0.08)',
              border: `2px solid ${isSelected ? id.color : 'rgba(255,255,255,0.15)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.2s',
            }}>
              {isSelected && <Check size={12} color="#fff" strokeWidth={3} />}
            </div>
          </motion.button>
        );
      })}
    </div>

    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onNext}
      disabled={selected.length === 0}
      style={{
        width: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        padding: '15px',
        borderRadius: 16,
        background: selected.length > 0
          ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
          : 'rgba(255,255,255,0.06)',
        color: selected.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
        fontWeight: 800, fontSize: 15,
        border: 'none', cursor: selected.length > 0 ? 'pointer' : 'not-allowed',
        boxShadow: selected.length > 0 ? '0 8px 24px rgba(124,58,237,0.4)' : 'none',
      }}
    >
      {language === 'ru' ? 'Далее' : 'Next'}
      <ArrowRight size={18} />
    </motion.button>
  </div>
);

// ---------------------------------------------------------------
// Step 2: Confirm habits
// ---------------------------------------------------------------
const Step2: React.FC<{
  language: 'ru' | 'en';
  selectedIdentities: string[];
  selectedHabits: string[];
  onToggleHabit: (habit: string) => void;
  onNext: () => void;
  onBack: () => void;
}> = ({ language, selectedIdentities, selectedHabits, onToggleHabit, onNext, onBack }) => {
  const myIdentities = IDENTITIES.filter(id => selectedIdentities.includes(id.id));

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 32, marginBottom: 10 }}>⚡</div>
        <h2 style={{ fontSize: 22, fontWeight: 900, color: '#fff', margin: '0 0 6px' }}>
          {language === 'ru' ? 'Твои привычки' : 'Your habits'}
        </h2>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', margin: 0 }}>
          {language === 'ru'
            ? 'Убери лишнее или оставь всё — решать тебе'
            : 'Remove extras or keep all — it\'s your choice'}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
        {myIdentities.map(id => {
          const habits = language === 'ru' ? id.habits_ru : id.habits_en;
          return (
            <div key={id.id}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 10,
              }}>
                <span style={{ fontSize: 16 }}>{id.emoji}</span>
                <span style={{
                  fontSize: 11, fontWeight: 800,
                  color: id.color,
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                }}>
                  {language === 'ru' ? id.title_ru : id.title_en}
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {habits.map(habit => {
                  const isSelected = selectedHabits.includes(habit);
                  return (
                    <motion.button
                      key={habit}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => onToggleHabit(habit)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '11px 14px',
                        borderRadius: 12,
                        background: isSelected ? `${id.color}15` : 'rgba(255,255,255,0.03)',
                        border: `1px solid ${isSelected ? id.color + '40' : 'rgba(255,255,255,0.06)'}`,
                        cursor: 'pointer', textAlign: 'left',
                        transition: 'all 0.15s',
                      }}
                    >
                      <div style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        background: isSelected ? id.color : 'rgba(255,255,255,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all 0.15s',
                      }}>
                        {isSelected && <Check size={11} color="#fff" strokeWidth={3} />}
                      </div>
                      <span style={{
                        fontSize: 13, fontWeight: 600,
                        color: isSelected ? '#fff' : 'rgba(255,255,255,0.5)',
                      }}>
                        {habit}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={onBack}
          style={{
            flex: '0 0 auto',
            padding: '14px 20px',
            borderRadius: 14,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.5)',
            fontWeight: 700, fontSize: 14, cursor: 'pointer',
          }}
        >
          ←
        </button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNext}
          disabled={selectedHabits.length === 0}
          style={{
            flex: 1,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            padding: '14px',
            borderRadius: 14,
            background: selectedHabits.length > 0
              ? 'linear-gradient(135deg, #7c3aed, #a855f7)'
              : 'rgba(255,255,255,0.06)',
            color: selectedHabits.length > 0 ? '#fff' : 'rgba(255,255,255,0.3)',
            fontWeight: 800, fontSize: 14,
            border: 'none', cursor: selectedHabits.length > 0 ? 'pointer' : 'not-allowed',
            boxShadow: selectedHabits.length > 0 ? '0 8px 24px rgba(124,58,237,0.4)' : 'none',
          }}
        >
          {language === 'ru'
            ? `Добавить ${selectedHabits.length} привычек`
            : `Add ${selectedHabits.length} habits`}
          <ArrowRight size={16} />
        </motion.button>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Step 3: Launch screen
// ---------------------------------------------------------------
const Step3: React.FC<{
  language: 'ru' | 'en';
  accentColor: string;
  habitCount: number;
  onComplete: () => void;
}> = ({ language, accentColor, habitCount, onComplete }) => {
  const phrases_ru = [
    'Ты уже сделал первый шаг.',
    'Каждая привычка — голос за нового тебя.',
    'Последовательность важнее интенсивности.',
  ];
  const phrases_en = [
    'You\'ve already taken the first step.',
    'Every habit is a vote for the new you.',
    'Consistency beats intensity every time.',
  ];

  return (
    <div style={{ textAlign: 'center' }}>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={motionContainer}
        style={{
          width: 80, height: 80, borderRadius: 24,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 24px',
          boxShadow: '0 16px 50px rgba(124,58,237,0.5)',
          fontSize: 36,
        }}
      >
        🚀
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        style={{ fontSize: 26, fontWeight: 900, color: '#fff', margin: '0 0 10px' }}
      >
        {language === 'ru' ? 'Всё готово!' : 'You\'re all set!'}
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        style={{ fontSize: 14, color: 'rgba(255,255,255,0.45)', marginBottom: 32, lineHeight: 1.5 }}
      >
        {language === 'ru'
          ? `${habitCount} привычек добавлено в твой путь становления`
          : `${habitCount} habits added to your growth journey`}
      </motion.p>

      {/* Motivational phrases */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 32 }}>
        {(language === 'ru' ? phrases_ru : phrases_en).map((phrase, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 + i * 0.12 }}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '11px 14px',
              borderRadius: 12,
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.07)',
              textAlign: 'left',
            }}
          >
            <span style={{ fontSize: 16 }}>{['✨', '🎯', '🔥'][i]}</span>
            <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.65)', fontWeight: 600 }}>
              {phrase}
            </span>
          </motion.div>
        ))}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75, ...motionContainer }}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        onClick={onComplete}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
          padding: '16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
          color: '#fff', fontWeight: 900, fontSize: 16,
          border: 'none', cursor: 'pointer',
          boxShadow: '0 12px 32px rgba(124,58,237,0.5)',
        }}
      >
        <Sparkles size={18} />
        {language === 'ru' ? 'Начать путь' : 'Start my journey'}
      </motion.button>
    </div>
  );
};

// ---------------------------------------------------------------
// Progress dots
// ---------------------------------------------------------------
const ProgressDots: React.FC<{ step: number; total: number; accent: string }> = ({ step, total, accent }) => (
  <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 24 }}>
    {Array.from({ length: total }, (_, i) => (
      <motion.div
        key={i}
        animate={{
          width: i === step ? 24 : 6,
          background: i === step ? accent : 'rgba(255,255,255,0.2)',
        }}
        transition={{ duration: 0.3 }}
        style={{ height: 6, borderRadius: 3 }}
      />
    ))}
  </div>
);

// ---------------------------------------------------------------
// Main OnboardingScreen
// ---------------------------------------------------------------
const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  language,
  accentColor,
  onComplete,
}) => {
  const [step, setStep] = useState(0);
  const [selectedIdentities, setSelectedIdentities] = useState<string[]>([]);
  const [selectedHabits, setSelectedHabits] = useState<string[]>([]);

  // Pre-select all habits for chosen identities when moving to step 2
  const handleStep1Next = useCallback(() => {
    const allHabits = IDENTITIES
      .filter(id => selectedIdentities.includes(id.id))
      .flatMap(id => language === 'ru' ? id.habits_ru : id.habits_en);
    setSelectedHabits(allHabits);
    setStep(1);
  }, [selectedIdentities, language]);

  const handleToggleIdentity = useCallback((id: string) => {
    setSelectedIdentities(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  }, []);

  const handleToggleHabit = useCallback((habit: string) => {
    setSelectedHabits(prev =>
      prev.includes(habit) ? prev.filter(x => x !== habit) : [...prev, habit]
    );
  }, []);

  const accent = accentColor || '#7c3aed';

  return (
    <div style={{
      minHeight: '100svh',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'flex-start',
      position: 'relative',
      background: '#0c0a09',
      padding: '40px 20px 32px',
      overflow: 'hidden',
    }}>
      <BgOrbs color={accent} />

      <div style={{
        position: 'relative', zIndex: 1,
        width: '100%', maxWidth: 380,
      }}>
        <ProgressDots step={step} total={3} accent={accent} />

        {/* Card */}
        <div style={{
          borderRadius: 28,
          padding: '28px 24px',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(60px) saturate(1.8)',
          WebkitBackdropFilter: 'blur(60px) saturate(1.8)',
          border: '1px solid rgba(255,255,255,0.1)',
          boxShadow: '0 40px 120px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="step0"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <Step1
                  language={language}
                  selected={selectedIdentities}
                  onToggle={handleToggleIdentity}
                  onNext={handleStep1Next}
                />
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="step1"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <Step2
                  language={language}
                  selectedIdentities={selectedIdentities}
                  selectedHabits={selectedHabits}
                  onToggleHabit={handleToggleHabit}
                  onNext={() => setStep(2)}
                  onBack={() => setStep(0)}
                />
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="step2"
                initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                <Step3
                  language={language}
                  accentColor={accent}
                  habitCount={selectedHabits.length}
                  onComplete={() => onComplete(selectedIdentities, selectedHabits)}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Skip */}
        {step < 2 && (
          <button
            onClick={() => onComplete([], [])}
            style={{
              display: 'block', margin: '16px auto 0',
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, color: 'rgba(255,255,255,0.2)',
              fontWeight: 600,
            }}
          >
            {language === 'ru' ? 'Пропустить' : 'Skip'}
          </button>
        )}
      </div>
    </div>
  );
};

export default OnboardingScreen;
