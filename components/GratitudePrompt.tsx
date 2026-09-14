/**
 * GratitudePrompt — Вечерний Шукр (Благодарность).
 * Показывается после 19:00 если запись благодарности ещё не сделана.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X, Check } from 'lucide-react';

interface GratitudePromptProps {
  show: boolean;
  language: 'ru' | 'en';
  onSave: (items: string[], mood?: 1 | 2 | 3 | 4 | 5) => Promise<void>;
  onDismiss: () => void;
}

const MOODS: { value: 1 | 2 | 3 | 4 | 5; emoji: string }[] = [
  { value: 1, emoji: '😔' },
  { value: 2, emoji: '😐' },
  { value: 3, emoji: '🙂' },
  { value: 4, emoji: '😊' },
  { value: 5, emoji: '😄' },
];

const GratitudePrompt: React.FC<GratitudePromptProps> = ({
  show, language, onSave, onDismiss,
}) => {
  const [items, setItems] = useState(['', '', '']);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const t = {
    title:   language === 'ru' ? 'Вечерний Шукр' : 'Evening Gratitude',
    quote:   language === 'ru'
      ? '«Если будете благодарны — Я прибавлю вам» (14:7)'
      : '"If you are grateful — I will give you more" (14:7)',
    q:       language === 'ru' ? 'За что ты благодарен сегодня?' : 'What are you grateful for today?',
    ph:      (n: number) => language === 'ru' ? `${n}. Благодарю за...` : `${n}. I'm grateful for...`,
    mood:    language === 'ru' ? 'Как ты себя чувствуешь?' : 'How do you feel?',
    save:    language === 'ru' ? 'Сохранить' : 'Save',
    skip:    language === 'ru' ? 'Позже' : 'Later',
    done:    language === 'ru' ? 'Шукр принят' : 'Gratitude saved',
    doneMsg: language === 'ru' ? 'Пусть твои блага приумножатся' : 'May your blessings multiply',
  };

  const filledItems = items.filter(i => i.trim());
  const canSave = filledItems.length >= 1;

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      await onSave(filledItems, mood ?? undefined);
      setDone(true);
      setTimeout(onDismiss, 2000);
    } finally {
      setSaving(false);
    }
  };

  const updateItem = (idx: number, val: string) => {
    setItems(prev => prev.map((item, i) => i === idx ? val : item));
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="rounded-2xl p-5 mb-3"
          style={{
            background: 'linear-gradient(135deg, rgba(251,191,36,0.07), rgba(245,158,11,0.04))',
            border: '1px solid rgba(251,191,36,0.2)',
            boxShadow: '0 4px 30px rgba(251,191,36,0.05)',
          }}
        >
          {done ? (
            /* Состояние: сохранено */
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={motionCelebrate}
              className="text-center py-4"
            >
              <Star size={32} className="mx-auto mb-2 text-amber-400" fill="currentColor" />
              <p className="text-sm font-black" style={{ color: '#f59e0b' }}>{t.done}</p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{t.doneMsg}</p>
            </motion.div>
          ) : (
            <>
              {/* Заголовок */}
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Star size={14} style={{ color: '#f59e0b' }} />
                  <span className="text-sm font-black" style={{ color: '#f59e0b' }}>{t.title}</span>
                </div>
                <button onClick={onDismiss} className="p-1" style={{ color: 'var(--text-secondary)' }}>
                  <X size={14} />
                </button>
              </div>

              <p className="text-[10px] italic mb-3" style={{ color: 'rgba(251,191,36,0.6)' }}>
                {t.quote}
              </p>

              <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                {t.q}
              </p>

              {/* 3 инпута */}
              <div className="flex flex-col gap-2 mb-3">
                {items.map((item, idx) => (
                  <input
                    key={idx}
                    value={item}
                    onChange={e => updateItem(idx, e.target.value)}
                    placeholder={t.ph(idx + 1)}
                    className="w-full rounded-xl px-3 py-2.5 text-sm outline-none"
                    style={{
                      background: 'rgba(0,0,0,0.2)',
                      border: '1px solid rgba(251,191,36,0.12)',
                      color: 'var(--text-primary)',
                      caretColor: '#f59e0b',
                    }}
                    onFocus={e => { e.target.style.borderColor = 'rgba(251,191,36,0.4)'; }}
                    onBlur={e => { e.target.style.borderColor = 'rgba(251,191,36,0.12)'; }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && idx < 2) {
                        const next = e.currentTarget.parentElement?.parentElement
                          ?.querySelectorAll('input')[idx + 1] as HTMLInputElement;
                        next?.focus();
                      }
                    }}
                  />
                ))}
              </div>

              {/* Настроение */}
              <div className="mb-4">
                <p className="text-[10px] font-bold mb-2" style={{ color: 'var(--text-secondary)' }}>
                  {t.mood}
                </p>
                <div className="flex gap-2">
                  {MOODS.map(m => (
                    <button
                      key={m.value}
                      onClick={() => setMood(prev => prev === m.value ? null : m.value)}
                      className="flex-1 py-1.5 rounded-xl text-lg transition-all"
                      style={{
                        background: mood === m.value ? 'rgba(251,191,36,0.2)' : 'rgba(255,255,255,0.04)',
                        border: mood === m.value ? '1px solid rgba(251,191,36,0.4)' : '1px solid transparent',
                        transform: mood === m.value ? 'scale(1.1)' : 'scale(1)',
                        transition: 'all 100ms var(--spring-snappy)',
                      }}
                    >
                      {m.emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопки */}
              <div className="flex gap-2">
                <button
                  onClick={onDismiss}
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold"
                  style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}
                >
                  {t.skip}
                </button>
                <button
                  onClick={handleSave}
                  disabled={!canSave || saving}
                  className="flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 disabled:opacity-40"
                  style={{
                    background: canSave ? 'linear-gradient(135deg, rgba(251,191,36,0.25), rgba(245,158,11,0.2))' : 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(251,191,36,0.3)',
                    color: '#f59e0b',
                  }}
                >
                  {saving
                    ? <div className="w-3 h-3 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    : <Check size={13} />
                  }
                  {t.save}
                </button>
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GratitudePrompt;
