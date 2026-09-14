/**
 * TadabburCard — Аят дня для размышления (Тадаббур).
 *
 * «Неужели они не размышляют над Кораном?» (4:82)
 * Компактная карточка на главном экране: аят (арабский + перевод),
 * вопрос для размышления и место для записи рефлексии.
 * Если на сегодня уже есть запись — показывает её с галочкой.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, ChevronDown, Check, Feather } from 'lucide-react';
import { motionContainer } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { getAyahOfDay, saveReflection, hasReflectionToday } from '../services/tadabbur';
import { journal } from '../services/unifiedJournal';

interface TadabburCardProps {
  language: 'ru' | 'en';
  /** Обновить счётчик записей (для родителя) */
  onSaved?: () => void;
  /** Supabase-пользователь для единого журнала */
  user?: import('@supabase/supabase-js').User | null;
}

export const TadabburCard: React.FC<TadabburCardProps> = ({
  language,
  onSaved,
  user = null,
}) => {
  const ayah = getAyahOfDay();
  const [expanded, setExpanded] = useState(false);
  const [answer, setAnswer] = useState('');
  const [saved, setSaved] = useState(() => hasReflectionToday(ayah.ref));
  const [justSaved, setJustSaved] = useState(false);

  const handleSave = () => {
    if (!answer.trim()) return;
    const question = language === 'ru' ? ayah.questionRu : ayah.questionEn;
    saveReflection(ayah.ref, question, answer);
    // Единый журнал (база знаний о человеке)
    journal(user, 'tadabbur', { ayah: ayah.ref, question, answer }, ayah.ref).catch(() => {});
    triggerStrongHaptic();
    setSaved(true);
    setJustSaved(true);
    setAnswer('');
    setTimeout(() => setJustSaved(false), 2500);
    onSaved?.();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionContainer}
      className="rounded-3xl mb-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(30,58,138,0.04) 100%)',
        border: '1px solid rgba(59,130,246,0.22)',
      }}
    >
      {/* Свечение */}
      <div
        className="breathe-glow absolute top-0 left-1/4 right-1/4 h-16 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, #3b82f6 0%, transparent 70%)' }}
      />

      <div className="p-4 relative">
        {/* Заголовок */}
        <button
          onClick={() => { setExpanded(!expanded); triggerHaptic(); }}
          className="w-full flex items-center justify-between text-left"
        >
          <div className="flex items-center gap-2">
            <BookOpen size={13} className="text-blue-400" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/80">
              {language === 'ru' ? 'Тадаббур · Аят дня' : 'Tadabbur · Ayah of the Day'}
            </span>
            {saved && (
              <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-500 text-[8px] font-black">
                <Check size={8} strokeWidth={4} />
                {language === 'ru' ? 'размышлял' : 'reflected'}
              </span>
            )}
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            className="text-textSecondary"
          >
            <ChevronDown size={14} />
          </motion.div>
        </button>

        {/* Аят (всегда виден) */}
        <div className="mt-2.5">
          <div
            className="text-2xl leading-relaxed text-right mb-1.5"
            style={{ fontFamily: "'Amiri', serif", color: '#93c5fd', textShadow: '0 0 20px rgba(147,197,253,0.2)' }}
            dir="rtl"
          >
            {ayah.arabic}
          </div>
          <p className="text-[11px] text-textSecondary leading-relaxed italic">
            {language === 'ru' ? ayah.translationRu : ayah.translationEn}
            <span className="not-italic font-black text-blue-400/70 ml-1.5">({ayah.ref})</span>
          </p>
        </div>

        {/* Раскрытие: вопрос + рефлексия */}
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-blue-500/15 space-y-3">
              {/* Вопрос */}
              <div className="p-3 rounded-xl" style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="flex items-start gap-2">
                  <Feather size={12} className="text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-textPrimary leading-relaxed font-medium">
                    {language === 'ru' ? ayah.questionRu : ayah.questionEn}
                  </p>
                </div>
              </div>

              {/* Поле рефлексии */}
              {!saved ? (
                <>
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder={language === 'ru'
                      ? 'Размышление сердца — своими словами…'
                      : 'The heart\'s reflection — in your own words…'}
                    className="w-full h-20 p-3 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs focus:outline-none focus:border-blue-500/50 transition-colors resize-none"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!answer.trim()}
                    className="w-full py-3 rounded-xl bg-blue-500 hover:bg-blue-600 disabled:opacity-40 text-white font-black text-xs shadow-lg transition-all"
                  >
                    {language === 'ru' ? 'Запечатлеть размышление' : 'Seal the reflection'}
                  </button>
                </>
              ) : (
                <motion.div
                  initial={justSaved ? { scale: 0.95 } : undefined}
                  animate={{ scale: 1 }}
                  className="p-3 rounded-xl bg-emerald-500/8 border border-emerald-500/25 text-center"
                >
                  <Check size={18} strokeWidth={3} className="text-emerald-500 mx-auto mb-1" />
                  <p className="text-[11px] text-textSecondary leading-relaxed">
                    {language === 'ru'
                      ? 'Размышление запечатлено. «Размышляющие над аятами — обладатели разума» (3:190-191)'
                      : 'Reflection sealed. "Those who reflect on the verses are people of understanding" (3:190-191)'}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default TadabburCard;
