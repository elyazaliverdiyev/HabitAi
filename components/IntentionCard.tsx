/**
 * IntentionCard — карточка ежедневного намерения (Ниятъ).
 *
 * Утром: инпут «Что намереваешься сделать сегодня?»
 * Вечером: рефлексия «Ты сделал то, что намеревался?»
 * Если намерение уже поставлено: показывает его красиво
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PenLine, Check, ChevronDown, ChevronUp, Sparkles, Compass, Brain } from 'lucide-react';
import type { DailyIntention } from '../services/engines/types';
import type { IntentionStatus } from '../services/engines';
import IntentionTransformationModal from './IntentionTransformationModal';

interface IntentionCardProps {
  intention: DailyIntention | null;
  status: IntentionStatus;
  language: 'ru' | 'en';
  onSave: (text: string) => Promise<void>;
  onReflect: (note: string) => Promise<void>;
  /** Supabase-пользователь для облачной синхронизации журнала */
  user?: import('@supabase/supabase-js').User | null;
}

const IntentionCard: React.FC<IntentionCardProps> = ({
  intention,
  status,
  language,
  onSave,
  onReflect,
  user = null,
}) => {
  const [inputText, setInputText] = useState('');
  const [reflectionText, setReflectionText] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [isTransformationModalOpen, setIsTransformationModalOpen] = useState(false);

  const isEvening = new Date().getHours() >= 19;

  const t = {
    title: language === 'ru' ? 'Намерение дня' : 'Today\'s Intention',
    placeholder: language === 'ru'
      ? 'Сегодня я намереваюсь...'
      : 'Today I intend to...',
    save: language === 'ru' ? 'Поставить намерение' : 'Set Intention',
    saved: language === 'ru' ? 'Намерение поставлено' : 'Intention Set',
    transformBtn: language === 'ru' ? 'Трансформация' : 'Transformation',
    reflectTitle: language === 'ru' ? 'Вечерняя рефлексия' : 'Evening Reflection',
    reflectQ: language === 'ru'
      ? 'Ты сделал то, что намеревался?'
      : 'Did you do what you intended?',
    reflectPlaceholder: language === 'ru'
      ? 'Что получилось, что нет...'
      : 'What worked, what didn\'t...',
    saveReflect: language === 'ru' ? 'Сохранить' : 'Save',
    quote: language === 'ru'
      ? '«Поистине, дела оцениваются по намерениям»'
      : '"Indeed, actions are judged by intentions"',
    missed: language === 'ru' ? 'Намерение не поставлено' : 'Intention not set',
  };

  const handleSave = async () => {
    if (!inputText.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onSave(inputText.trim());
      setInputText('');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReflect = async () => {
    if (!reflectionText.trim() || isSaving) return;
    setIsSaving(true);
    try {
      await onReflect(reflectionText.trim());
      setReflectionText('');
      setExpanded(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <IntentionTransformationModal
        isOpen={isTransformationModalOpen}
        onClose={() => setIsTransformationModalOpen(false)}
        onApplyIntention={async (text) => {
          await onSave(text);
        }}
        language={language}
        user={user}
      />

      {/* Состояние: намерения ещё нет → показываем инпут + кнопку алгоритма трансформации */}
      {(status === 'not_set' || status === 'missed') ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl p-5 mb-3 relative overflow-hidden transition-all duration-300"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(245,158,11,0.25)',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-amber-500/15 flex items-center justify-center text-amber-500">
                <PenLine size={13} />
              </div>
              <span className="text-[11px] font-bold tracking-wider text-amber-500 uppercase">
                {t.title}
              </span>
            </div>

            <button
              id="btn-open-transformation"
              onClick={() => setIsTransformationModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 text-[11px] font-black transition-all active:scale-95 shadow-sm"
            >
              <Compass size={13} />
              <span>{t.transformBtn}</span>
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder={t.placeholder}
            rows={2}
            className="w-full resize-none rounded-2xl p-3 text-sm outline-none transition-all bg-surfaceHighlight/50 border border-borderSubtle text-textPrimary placeholder:text-textSecondary/50 focus:border-amber-500/50"
            onKeyDown={e => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSave();
              }
            }}
          />

          <div className="flex items-center justify-between mt-3">
            <p className="text-[10px] italic text-textSecondary">
              {t.quote}
            </p>
            <button
              onClick={handleSave}
              disabled={!inputText.trim() || isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 bg-amber-500 text-white shadow-md hover:bg-amber-600"
            >
              {isSaving
                ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Check size={13} />
              }
              {t.save}
            </button>
          </div>
        </motion.div>
      ) : (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 mb-3 relative overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: status === 'reflected'
          ? '1px solid rgba(16, 185, 129, 0.3)'
          : '1px solid rgba(245, 158, 11, 0.25)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Ambient background glow */}
      <div
        className="absolute top-0 right-0 w-36 h-36 pointer-events-none opacity-10"
        style={{
          background: status === 'reflected'
            ? 'radial-gradient(circle, #10B981 0%, transparent 70%)'
            : 'radial-gradient(circle, #F59E0B 0%, transparent 70%)'
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Sparkles
            size={13}
            style={{ color: status === 'reflected' ? '#10B981' : '#F59E0B' }}
          />
          <span
            className="text-[11px] font-semibold tracking-wider uppercase"
            style={{ color: status === 'reflected' ? '#10B981' : '#F59E0B' }}
          >
            {status === 'reflected' ? t.saved : t.title}
          </span>
        </div>

        {/* Кнопка свернуть/развернуть */}
        {isEvening && status === 'set' && (
          <button
            onClick={() => setExpanded(e => !e)}
            className="p-1 rounded-lg transition-all"
            style={{ color: 'var(--text-secondary)' }}
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </div>

      {/* Текст намерения */}
      <p
        className="text-base font-bold leading-relaxed mb-2"
        style={{ color: 'var(--text-primary)' }}
      >
        "{intention?.text}"
      </p>

      {/* Quote / Wisdom */}
      <p className="text-[10px] text-textSecondary italic">
        {t.quote}
      </p>

      {/* Трансформация намерения — доступна всегда (не только при not_set) */}
      <button
        id="btn-open-transformation-set"
        onClick={() => setIsTransformationModalOpen(true)}
        className="mt-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 text-[10px] font-black transition-all active:scale-95"
      >
        <Compass size={12} />
        <span>{language === 'ru' ? 'Трансформация намерения (5 Стадий)' : 'Transform intention (5 Stages)'}</span>
      </button>

      {/* Рефлексия (если уже есть) */}
      {status === 'reflected' && intention?.reflectionNote && (
        <div className="mt-3 p-3 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle">
          <p className="text-xs text-textSecondary">
            💬 {intention.reflectionNote}
          </p>
        </div>
      )}

      {/* Вечерний инпут рефлексии */}
      <AnimatePresence>
        {isEvening && status === 'set' && expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-3 pt-3 border-t border-borderSubtle">
              <p className="text-xs font-semibold mb-2 text-textSecondary">
                {t.reflectQ}
              </p>
              <textarea
                value={reflectionText}
                onChange={e => setReflectionText(e.target.value)}
                placeholder={t.reflectPlaceholder}
                rows={2}
                className="w-full resize-none rounded-2xl p-3 text-sm outline-none bg-surfaceHighlight/50 border border-borderSubtle text-textPrimary"
              />
              <button
                onClick={handleReflect}
                disabled={!reflectionText.trim() || isSaving}
                className="mt-2 w-full py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-40 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400"
              >
                {t.saveReflect}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Намёк вечером: нажми чтобы добавить рефлексию */}
      {isEvening && status === 'set' && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-2 text-[10px] transition-all"
          style={{ color: 'rgba(251,191,36,0.6)' }}
        >
          + {language === 'ru' ? 'Добавить вечернюю рефлексию' : 'Add evening reflection'}
        </button>
      )}
    </motion.div>
      )}
    </>
  );
};

export default IntentionCard;
