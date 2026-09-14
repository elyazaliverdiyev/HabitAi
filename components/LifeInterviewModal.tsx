/**
 * LifeInterviewModal — Интервью о жизни → персональные трансформации (PRO).
 *
 * Пользователь рассказывает свою жизнь (4 темы: детство, деньги,
 * отношения, идентичность) → ИИ находит корневые паттерны и пишет
 * 5-7 персональных трансформаций через Прекрасные Имена Аллаха.
 * Результат сохраняется в «Мои трансформации».
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Heart, Sparkles, Loader2, Check, BookOpen } from 'lucide-react';
import { motionContainer, motionControl } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { INTERVIEW_THEMES, generatePersonalTransformations, type PersonalTransformation } from '../services/ai/aiLifeInterview';
import { getJournalHistory, journal } from '../services/unifiedJournal';
import { saveCustomTransformation } from '../services/transformationGenerator';
import type { User } from '@supabase/supabase-js';

interface LifeInterviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
  user?: User | null;
  isPro?: boolean;
}

type Phase = 'intro' | 'interview' | 'generating' | 'result';

export const LifeInterviewModal: React.FC<LifeInterviewModalProps> = ({
  isOpen,
  onClose,
  language = 'ru',
  user = null,
  isPro = false,
}) => {
  const [phase, setPhase] = useState<Phase>('intro');
  const [themeIdx, setThemeIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [patterns, setPatterns] = useState<string[]>([]);
  const [results, setResults] = useState<PersonalTransformation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  React.useEffect(() => {
    if (!isOpen) {
      setPhase('intro'); setThemeIdx(0); setAnswers({});
      setPatterns([]); setResults([]); setError(null); setSavedCount(0);
    }
  }, [isOpen]);

  const theme = INTERVIEW_THEMES[themeIdx];
  const answeredCount = Object.values(answers).filter(a => a.trim().length > 3).length;
  const totalQuestions = INTERVIEW_THEMES.reduce((s, t) => s + t.questionsRu.length, 0);

  const runGeneration = async () => {
    setPhase('generating');
    setError(null);
    try {
      const history = await getJournalHistory(user, 60);
      const result = await generatePersonalTransformations(answers, history, language);
      setPatterns(result.patterns);
      setResults(result.transformations);
      setPhase('result');
      triggerStrongHaptic();
    } catch (e: any) {
      console.warn('[LifeInterview] failed:', e);
      setError(language === 'ru'
        ? 'ИИ недоступен. Проверь соединение и попробуй ещё раз.'
        : 'AI unavailable. Check connection and try again.');
      setPhase('interview');
    }
  };

  const saveAll = async () => {
    for (const t of results) {
      saveCustomTransformation({
        title: t.title,
        formula: t.formula,
        checkQuestion: t.checkQuestion,
        arabic: t.arabic,
        translit: t.translit,
        meaning: t.meaning,
      });
      await journal(user, 'heart_answer', {
        transformation: t.title, pattern: t.pattern, source: 'life_interview',
      }, `interview-${t.title}`);
    }
    setSavedCount(results.length);
    triggerStrongHaptic();
  };

  if (!isOpen) return null;

  const R = (ru: string, en: string) => (language === 'ru' ? ru : en);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={motionContainer}
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-borderSubtle shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-rose-500/15 flex items-center justify-center shrink-0" style={{ border: '1px solid rgba(244,63,94,0.3)' }}>
              <Heart size={17} className="text-rose-400" />
            </div>
            <div>
              <h3 className="text-sm font-black text-textPrimary leading-tight">
                {R('Интервью о жизни', 'Life Interview')}
              </h3>
              <span className="text-[10px] text-textSecondary">
                {R('Персональные трансформации от ИИ', 'Personal AI transformations')}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors shrink-0">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 pt-4">
          <AnimatePresence mode="wait">
            {/* ── ФАЗА: Интро ── */}
            {phase === 'intro' && (
              <motion.div key="intro" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                <div className="p-4 rounded-2xl bg-rose-500/8 border border-rose-500/25">
                  <p className="text-xs text-textSecondary leading-relaxed">
                    {R(
                      'Расскажи о своей жизни — 8 вопросов о детстве, деньгах, отношениях и мечтах. ИИ найдёт корневые установки твоего подсознания и напишет персональные трансформации через Прекрасные Имена Аллаха — именно под твою историю.',
                      'Tell your life story — 8 questions. AI will find your root patterns and write personal transformations through the Beautiful Names of Allah.'
                    )}
                  </p>
                </div>
                <div className="space-y-2">
                  {INTERVIEW_THEMES.map((t, i) => (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-surfaceHighlight/40 border border-borderSubtle">
                      <span className="w-6 h-6 rounded-lg bg-rose-500/15 text-rose-400 text-xs font-black flex items-center justify-center shrink-0">{i + 1}</span>
                      <span className="text-xs font-bold text-textPrimary">{t.titleRu}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-textSecondary opacity-70 italic text-center leading-relaxed px-4">
                  {R('Отвечай честно — это только для тебя. Записи шифруются политиками RLS.', 'Answer honestly — only you can read this.')}
                </p>
                <button
                  onClick={() => { setPhase('interview'); triggerHaptic(); }}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black shadow-xl transition-all text-sm"
                >
                  {R('Начать интервью', 'Start interview')}
                </button>
              </motion.div>
            )}

            {/* ── ФАЗА: Вопросы ── */}
            {phase === 'interview' && theme && (
              <motion.div key={`theme-${themeIdx}`} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                    {R('Тема', 'Theme')} {themeIdx + 1}/{INTERVIEW_THEMES.length}: {theme.titleRu}
                  </span>
                  <span className="text-[10px] text-textSecondary tabular-nums">{answeredCount}/{totalQuestions}</span>
                </div>

                {theme.questionsRu.map((q, qi) => {
                  const key = `${theme.id}_${qi}`;
                  return (
                    <div key={key}>
                      <label className="text-xs font-bold text-textPrimary block mb-1.5 leading-relaxed">{q}</label>
                      <textarea
                        value={answers[key] || ''}
                        onChange={(e) => setAnswers(prev => ({ ...prev, [key]: e.target.value }))}
                        placeholder={R('Свободно, как есть...', 'Freely, as it is...')}
                        className="w-full h-24 p-3 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs leading-relaxed focus:outline-none focus:border-rose-500/50 transition-colors resize-none"
                        dir="auto"
                      />
                    </div>
                  );
                })}

                {error && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600">{error}</div>
                )}

                <div className="flex gap-2">
                  {themeIdx > 0 && (
                    <button onClick={() => { setThemeIdx(i => i - 1); triggerHaptic(); }} className="px-4 py-3 rounded-2xl bg-surfaceHighlight text-textPrimary font-bold text-xs transition-all">
                      ←
                    </button>
                  )}
                  {themeIdx < INTERVIEW_THEMES.length - 1 ? (
                    <button
                      onClick={() => { setThemeIdx(i => i + 1); triggerHaptic(); }}
                      className="flex-1 py-3 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      {R('Дальше', 'Next')} <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={runGeneration}
                      disabled={answeredCount < 3}
                      className="flex-1 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 disabled:opacity-40 text-white font-black shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                    >
                      <Sparkles size={14} />
                      {R('ИИ пишет трансформации', 'AI writes transformations')}
                    </button>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── ФАЗА: Генерация ── */}
            {phase === 'generating' && (
              <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-16">
                <Loader2 size={32} className="animate-spin text-rose-400 mb-4" />
                <p className="text-sm font-black text-textPrimary mb-1">
                  {R('ИИ всматривается в твою жизнь...', 'AI is reading your story...')}
                </p>
                <p className="text-[11px] text-textSecondary text-center px-8 leading-relaxed">
                  {R('Находит корневые установки и подбирает Имена Аллаха для каждой', 'Finding root patterns and matching Divine Names')}
                </p>
              </motion.div>
            )}

            {/* ── ФАЗА: Результат ── */}
            {phase === 'result' && (
              <motion.div key="result" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                {/* Паттерны */}
                {patterns.length > 0 && (
                  <div className="p-3.5 rounded-2xl bg-rose-500/8 border border-rose-500/25">
                    <span className="text-[9px] font-black uppercase tracking-wider text-rose-400 block mb-2">
                      {R('Найденные паттерны', 'Detected patterns')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {patterns.map(p => (
                        <span key={p} className="px-2 py-1 rounded-lg text-[10px] font-bold bg-rose-500/12 text-rose-400">{p}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Трансформации */}
                <span className="text-[9px] font-black uppercase tracking-wider text-textSecondary block">
                  {R(`Твои трансформации (${results.length})`, `Your transformations (${results.length})`)}
                </span>
                <div className="space-y-2">
                  {results.map((t, i) => (
                    <div key={i} className="p-3.5 rounded-2xl bg-surfaceHighlight/40 border border-borderSubtle">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="min-w-0">
                          <span className="text-[9px] font-black text-rose-400 uppercase block">{t.pattern}</span>
                          <span className="text-xs font-black text-textPrimary">{t.title}</span>
                        </div>
                        <span className="text-xl leading-none shrink-0" style={{ fontFamily: "'Amiri', serif", color: '#fb7185' }} dir="rtl">{t.arabic}</span>
                      </div>
                      <p className="text-[10px] text-textSecondary leading-relaxed">{t.formula}</p>
                    </div>
                  ))}
                </div>

                {savedCount > 0 ? (
                  <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center">
                    <Check size={18} strokeWidth={3} className="text-emerald-500 mx-auto mb-1" />
                    <p className="text-xs font-bold text-emerald-600">
                      {R(`${savedCount} трансформаций сохранено в «Мои»`, `${savedCount} saved to "Mine"`)}
                    </p>
                    <p className="text-[10px] text-textSecondary mt-1">
                      <BookOpen size={10} className="inline mr-1" />
                      {R('Открой Библиотеку Трансформаций → вкладка «Мои»', 'Open Transformation Library → "Mine" tab')}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={saveAll}
                    className="w-full py-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-black shadow-xl transition-all text-sm"
                  >
                    {R('Сохранить все в «Мои трансформации»', 'Save all to "My transformations"')}
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default LifeInterviewModal;
