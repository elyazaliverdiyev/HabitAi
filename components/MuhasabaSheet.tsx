/**
 * MuhasabaSheet — Еженедельный самоотчёт (воскресенье, 3 вопроса).
 * Показывается снизу как bottom-sheet когда isMuhasabaTime && !hasThisWeekMuhasaba
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, ChevronRight, Check } from 'lucide-react';
import { sheetUp } from '../utils/motionPresets';

interface MuhasabaSheetProps {
  isOpen: boolean;
  weekStats: { totalScheduled: number; totalCompleted: number; completionRate: number } | null;
  language: 'ru' | 'en';
  onSave: (q1: string, q2: string, q3: string) => Promise<void>;
  onClose: () => void;
}

const MuhasabaSheet: React.FC<MuhasabaSheetProps> = ({
  isOpen, weekStats, language, onSave, onClose,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 'done'>(1);
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');
  const [saving, setSaving] = useState(false);

  const t = {
    title:    language === 'ru' ? 'Еженедельная Мухасаба' : 'Weekly Muhasaba',
    subtitle: language === 'ru' ? 'Честный отчёт перед собой' : 'Honest self-audit',
    q1: language === 'ru' ? 'Что хорошо получилось на этой неделе?' : 'What went well this week?',
    q2: language === 'ru' ? 'Что мешало или сдерживало тебя?' : 'What blocked or held you back?',
    q3: language === 'ru' ? 'Что изменю на следующей неделе?' : 'What will I change next week?',
    next:   language === 'ru' ? 'Далее' : 'Next',
    save:   language === 'ru' ? 'Сохранить Мухасабу' : 'Save Muhasaba',
    done:   language === 'ru' ? 'Мухасаба завершена' : 'Muhasaba complete',
    doneMsg: language === 'ru'
      ? 'Джазакаллаху хайран за честность с собой'
      : 'JazakAllahu khayran for your honesty',
    close: language === 'ru' ? 'Закрыть' : 'Close',
    week:  language === 'ru' ? 'неделю' : 'week',
    of:    language === 'ru' ? 'из' : 'of',
  };

  const questions = [t.q1, t.q2, t.q3];
  const answers = [q1, q2, q3];
  const setters = [setQ1, setQ2, setQ3];
  const currentAnswer = answers[Number(step) - 1] ?? '';
  const currentSetter = setters[Number(step) - 1];

  const handleNext = async () => {
    if (!currentAnswer.trim()) return;
    if (step === 3) {
      setSaving(true);
      try {
        await onSave(q1, q2, q3);
        setStep('done');
      } finally {
        setSaving(false);
      }
    } else {
      setStep(s => (Number(s) + 1) as 1 | 2 | 3);
    }
  };

  const handleClose = () => {
    setStep(1); setQ1(''); setQ2(''); setQ3('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={handleClose}
          />

          {/* Sheet */}
          <motion.div
            variants={sheetUp}
            initial="hidden" animate="visible" exit="hidden"
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl p-6 pb-10"
            style={{
              background: 'linear-gradient(180deg, rgba(20,20,40,0.99), rgba(15,15,30,0.99))',
              border: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '0 -20px 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Drag indicator */}
            <div className="w-10 h-1 rounded-full mx-auto mb-5" style={{ background: 'rgba(255,255,255,0.15)' }} />

            {step !== 'done' ? (
              <>
                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <BookOpen size={16} style={{ color: '#a78bfa' }} />
                      <h2 className="text-base font-black" style={{ color: 'var(--text-primary)' }}>
                        {t.title}
                      </h2>
                    </div>
                    {weekStats && (
                      <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                        {language === 'ru' ? 'За неделю' : 'This week'}: {weekStats.totalCompleted} {t.of} {weekStats.totalScheduled} ({Math.round(weekStats.completionRate)}%)
                      </p>
                    )}
                  </div>
                  <button onClick={handleClose} className="p-1.5 rounded-xl" style={{ color: 'var(--text-secondary)' }}>
                    <X size={18} />
                  </button>
                </div>

                {/* Step indicator */}
                <div className="flex gap-2 mb-5">
                  {[1, 2, 3].map(n => (
                    <div
                      key={n}
                      className="h-1 flex-1 rounded-full transition-all"
                      style={{
                        background: Number(step) >= n ? '#a78bfa' : 'rgba(255,255,255,0.1)',
                        transition: 'background 250ms var(--spring-gentle)',
                      }}
                    />
                  ))}
                </div>

                {/* Question */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <p className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                      {questions[Number(step) - 1]}
                    </p>
                    <textarea
                      value={currentAnswer}
                      onChange={e => currentSetter?.(e.target.value)}
                      placeholder={language === 'ru' ? 'Твой ответ...' : 'Your answer...'}
                      rows={4}
                      autoFocus
                      className="w-full resize-none rounded-2xl px-4 py-3 text-sm outline-none"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(167,139,250,0.2)',
                        color: 'var(--text-primary)',
                        caretColor: '#a78bfa',
                        transition: 'border-color var(--dur-instant) var(--spring-gentle)',
                      }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(167,139,250,0.5)'; }}
                      onBlur={e => { e.target.style.borderColor = 'rgba(167,139,250,0.2)'; }}
                    />
                  </motion.div>
                </AnimatePresence>

                {/* Action button */}
                <button
                  onClick={handleNext}
                  disabled={!currentAnswer.trim() || saving}
                  className="mt-4 w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 text-sm font-black transition-all disabled:opacity-40"
                  style={{
                    background: currentAnswer.trim()
                      ? 'linear-gradient(135deg, #8b5cf6, #6d28d9)'
                      : 'rgba(255,255,255,0.06)',
                    color: 'white',
                    boxShadow: currentAnswer.trim() ? '0 4px 20px rgba(139,92,246,0.4)' : 'none',
                  }}
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : step === 3 ? (
                    <><Check size={16} /> {t.save}</>
                  ) : (
                    <>{t.next} <ChevronRight size={16} /></>
                  )}
                </button>
              </>
            ) : (
              /* Done state */
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="text-center py-6"
              >
                <div className="text-5xl mb-4">🤲</div>
                <h3 className="text-lg font-black mb-2" style={{ color: 'var(--text-primary)' }}>
                  {t.done}
                </h3>
                <p className="text-sm mb-6" style={{ color: 'var(--text-secondary)' }}>
                  {t.doneMsg}
                </p>
                <button
                  onClick={handleClose}
                  className="px-8 py-3 rounded-2xl text-sm font-bold"
                  style={{ background: 'rgba(167,139,250,0.15)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.25)' }}
                >
                  {t.close}
                </button>
              </motion.div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MuhasabaSheet;
