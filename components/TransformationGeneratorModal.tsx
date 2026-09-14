/**
 * TransformationGeneratorModal — Конструктор собственных трансформаций.
 *
 * Реализация «🛠️ Генератора Трансформаций» (Obsidian): любой страх →
 * трансформация через Прекрасное Имя Аллаха за 4 шага:
 *   1. Ситуация и ложная установка («Почему я НЕ делаю то, что хочу?»)
 *   2. Подбор Имени из таблицы «ложь → Имя» (автоподсказка + ручной выбор)
 *   3. Готовая формула «Можно мне было думать…» (собирается автоматически)
 *   4. Проверочный вопрос + сохранение в пользовательскую библиотеку
 *
 * Созданные трансформации появляются в IntentionTransformationModal
 * (категория «Мои») и доступны для аудио-практик.
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowLeft, Wand2, Check, Trash2, Lightbulb, BookOpen, Sparkles, Loader2 } from 'lucide-react';
import { motionContainer, motionControl } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import {
  LIE_TO_NAME, buildFormula, buildCheckQuestion,
  getCustomTransformations, saveCustomTransformation, deleteCustomTransformation,
  type CustomTransformation,
} from '../services/transformationGenerator';
import { generateAITransformation } from '../services/ai/ai-transformation';

interface TransformationGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
  /** Созданную трансформацию сразу открыть в 5-стадийном ритуале */
  onStartRitual?: (t: CustomTransformation) => void;
}

type Step = 0 | 1 | 2 | 3 | 4;

export const TransformationGeneratorModal: React.FC<TransformationGeneratorModalProps> = ({
  isOpen,
  onClose,
  language = 'ru',
  onStartRitual,
}) => {
  const [step, setStep] = useState<Step>(0);
  const [situation, setSituation] = useState('');
  const [lie, setLie] = useState('');
  const [source, setSource] = useState('');
  const [selectedMatchIdx, setSelectedMatchIdx] = useState<number | null>(null);
  const [savedList, setSavedList] = useState<CustomTransformation[]>([]);

  // AI-режим (Шаг 0): свободное описание → автосборка
  const [aiDescription, setAiDescription] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  /** Имя от ИИ, если его нет в таблице LIE_TO_NAME — используем напрямую */
  const [aiCustomName, setAiCustomName] = useState<{ arabic: string; translit: string; meaning: string; truth?: string } | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setSavedList(getCustomTransformations());
    } else {
      setStep(0);
      setSituation('');
      setLie('');
      setSource('');
      setSelectedMatchIdx(null);
      setAiDescription('');
      setAiError(null);
    }
  }, [isOpen]);

  // Автоподсказка Имени по тексту установки
  const suggestions = useMemo(() => {
    if (!lie.trim()) return [];
    const q = lie.trim().toLowerCase();
    return LIE_TO_NAME
      .map((m, idx) => ({ m, idx, score: m.lie.toLowerCase().split(' ').filter(w => w.length > 3 && q.includes(w)).length }))
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.idx);
  }, [lie]);

  const selectedMatch = selectedMatchIdx !== null ? LIE_TO_NAME[selectedMatchIdx] : null;
  // Эффективное Имя: из таблицы или от ИИ (aiCustomName)
  const effectiveName = selectedMatch
    ? { arabic: selectedMatch.arabic, translit: selectedMatch.translit, meaning: selectedMatch.meaning }
    : aiCustomName;
  const formula = effectiveName ? buildFormula(situation || lie, lie) : '';
  // Проверочный вопрос: из таблицы (truth) или просто по Имени ИИ
  const checkQuestion = selectedMatch
    ? buildCheckQuestion(selectedMatch.truth)
    : aiCustomName
    ? `ВО ЧТО Я ВЕРЮ? ЕСЛИ ${aiCustomName.meaning.toUpperCase()}, то...`
    : '';

  const canNext = step === 1 ? situation.trim().length > 3 && lie.trim().length > 3
    : step === 2 ? selectedMatchIdx !== null
    : true;

  const handleSave = () => {
    if (!effectiveName) return;
    const saved = saveCustomTransformation({
      title: lie.trim().replace(/\.$/, ''),
      formula,
      checkQuestion,
      arabic: effectiveName.arabic,
      translit: effectiveName.translit,
      meaning: effectiveName.meaning,
    });
    triggerStrongHaptic();
    setSavedList(getCustomTransformations());
    if (onStartRitual) {
      onStartRitual(saved);
      onClose();
    }
  };

  /**
   * AI-режим: свободное описание → распознавание лжи → подбор Имени →
   * автозаполнение шагов 1–3 визарда. Пользователь всё может поправить.
   */
  const handleAIGenerate = async () => {
    if (aiDescription.trim().length < 10) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const result = await generateAITransformation(aiDescription.trim(), language);

      // Автозаполнение полей визарда из ответа ИИ
      setLie(result.lie);
      setSource(result.source || '');
      setSituation(aiDescription.trim().split(/[.!?]/)[0].trim());

      // Ищем Имя ИИ в нашей таблице — если есть, связываем
      const matchIdx = LIE_TO_NAME.findIndex(
        m => m.translit.toLowerCase().includes(result.nameTranslit.toLowerCase().split(' ')[0])
          || result.nameTranslit.toLowerCase().includes(m.translit.toLowerCase().split(' ')[0])
      );
      if (matchIdx >= 0) {
        setSelectedMatchIdx(matchIdx);
        setAiCustomName(null);
        setStep(3); // сразу к готовой формуле
      } else {
        // ИИ выбрал Имя вне таблицы — используем его данные напрямую
        setSelectedMatchIdx(null);
        setAiCustomName({
          arabic: result.nameArabic,
          translit: result.nameTranslit,
          meaning: result.nameMeaning,
        });
        setStep(3);
      }
      triggerStrongHaptic();
    } catch (e: any) {
      console.warn('[AI-Transformation] failed:', e);
      setAiError(
        language === 'ru'
          ? 'ИИ недоступен. Продолжи вручную — шаги ниже работают без сети.'
          : 'AI unavailable. Continue manually — the steps below work offline.'
      );
      setStep(1);
    } finally {
      setAiLoading(false);
    }
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
        <div className="p-5 pb-3 border-b border-borderSubtle shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-violet-500/15 flex items-center justify-center shrink-0" style={{ border: '1px solid rgba(139,92,246,0.3)' }}>
                <Wand2 size={17} className="text-violet-400" />
              </div>
              <div>
                <h3 className="text-sm font-black text-textPrimary leading-tight">
                  {R('Генератор Трансформаций', 'Transformation Generator')}
                </h3>
                <span className="text-[10px] text-textSecondary">
                  {R('Свой страх → формула с Именем Аллаха', 'Your fear → formula with a Divine Name')}
                </span>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors shrink-0">
              <X size={16} />
            </button>
          </div>

          {/* Прогресс шагов */}
          <div className="flex gap-1.5">
            {[0, 1, 2, 3, 4].map(s => (
              <div key={s} className="flex-1">
                <div
                  className="h-1 rounded-full transition-all duration-300"
                  style={{
                    background: s < step ? '#8b5cf6' : s === step ? '#a78bfa' : 'var(--surface-highlight)',
                  }}
                />
                <div className={`text-[8px] font-bold text-center mt-1 ${s === step ? 'text-violet-400' : 'text-textSecondary opacity-50'}`}>
                  {s === 0 ? R('ИИ', 'AI') : s === 1 ? R('Ситуация', 'Situation') : s === 2 ? R('Имя', 'Name') : s === 3 ? R('Формула', 'Formula') : R('Печать', 'Seal')}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Контент */}
        <div className="flex-1 overflow-y-auto p-5 pt-4">
          <AnimatePresence mode="wait">
            {/* ── ШАГ 0: AI — опиши свободно ── */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-violet-500/8 border border-violet-500/25">
                  <div className="flex items-start gap-2">
                    <Sparkles size={14} className="text-violet-400 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-textSecondary leading-relaxed">
                      {R(
                        'Опиши свою ситуацию свободными словами — что происходит, что чувствуешь, чего избегаешь. ИИ распознает ложную установку, подберёт Имя Аллаха и соберёт формулу. Всё можно будет поправить.',
                        'Describe your situation freely. AI will detect the false belief, pick a Divine Name and build the formula.'
                      )}
                    </p>
                  </div>
                </div>

                <textarea
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  placeholder={R(
                    'Например: «Я хочу открыть своё дело, но каждый раз, когда почти готов начать, нахожу причины отложить. Внутри чувство, что если я выйду из тени — меня обсуждали и осудят...»',
                    'e.g. "I want to start my business, but every time I\'m almost ready I find reasons to delay..."'
                  )}
                  className="w-full h-36 p-3.5 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs leading-relaxed focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  dir="auto"
                />

                {aiError && (
                  <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-600 leading-relaxed">
                    {aiError}
                  </div>
                )}

                <button
                  onClick={handleAIGenerate}
                  disabled={aiLoading || aiDescription.trim().length < 10}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {aiLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      {R('ИИ всматривается в ситуацию...', 'AI is analyzing...')}
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      {R('Собрать трансформацию через ИИ', 'Build via AI')}
                    </>
                  )}
                </button>

                <div className="text-center">
                  <span className="text-textSecondary text-[11px]">{R('или', 'or')}</span>
                </div>

                <button
                  onClick={() => { setStep(1); triggerHaptic(); }}
                  className="w-full py-3 rounded-2xl bg-surfaceHighlight hover:bg-surface text-textPrimary font-bold text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <Wand2 size={13} />
                  {R('Соберу вручную по шагам', 'I\'ll build it manually')}
                </button>
              </motion.div>
            )}

            {/* ── ШАГ 1: Ситуация + Ложная установка ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-[11px] text-textSecondary italic leading-relaxed">
                  {R('«Подсознание не различает большие и маленькие проблемы — алгоритм один». Опиши ситуацию и найди ложь:', 'Describe the situation and find the lie:')}
                </p>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-textSecondary block mb-1.5">
                    {R('1. Ситуация — что происходит?', '1. Situation — what happens?')}
                  </label>
                  <textarea
                    value={situation}
                    onChange={(e) => setSituation(e.target.value)}
                    placeholder={R('Например: хочу купить дом, есть деньги, но не покупаю и теряю их', 'e.g. I want to buy a house, I have the money, but I don\'t')}
                    className="w-full h-20 p-3 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-black uppercase tracking-wider text-textSecondary block mb-1.5">
                    {R('2. Ложная установка — «Почему я НЕ делаю?»', '2. False belief — "Why don\'t I act?"')}
                  </label>
                  <textarea
                    value={lie}
                    onChange={(e) => setLie(e.target.value)}
                    placeholder={R('Ответ начинается с «Потому что...», «А вдруг...», «Я не...»', 'Starts with "Because...", "What if...", "I can\'t..."')}
                    className="w-full h-20 p-3 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-xs focus:outline-none focus:border-violet-500/50 transition-colors resize-none"
                  />
                  <div className="flex items-start gap-1.5 mt-1.5">
                    <Lightbulb size={11} className="text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] text-textSecondary leading-relaxed">
                      {R('Необязательно: откуда эта программа — кто и когда тебе это внушил?', 'Optional: where does this program come from?')}
                    </p>
                  </div>
                  <input
                    type="text"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    placeholder={R('Источник (необязательно): «мама забирала деньги…»', 'Source (optional)')}
                    className="w-full mt-1 p-2.5 rounded-xl bg-surface border border-borderSubtle text-textPrimary text-[11px] focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                </div>
              </motion.div>
            )}

            {/* ── ШАГ 2: Подбор Имени ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-3">
                <p className="text-[11px] text-textSecondary italic leading-relaxed">
                  {R('Найди Имя Аллаха, ПРЯМО ПРОТИВОПОЛОЖНОЕ твоей установке:', 'Pick the Name of Allah DIRECTLY OPPOSITE to your lie:')}
                </p>

                {/* Автоподсказки */}
                {suggestions.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-violet-500/8 border border-violet-500/25">
                    <span className="text-[9px] font-black uppercase tracking-wider text-violet-400 block mb-1.5">
                      {R('Похоже, твоё сердце сомневается в:', 'Your heart seems to doubt:')}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestions.map(idx => (
                        <button
                          key={idx}
                          onClick={() => { setSelectedMatchIdx(idx); triggerHaptic(); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-black transition-all"
                          style={{
                            background: selectedMatchIdx === idx ? '#8b5cf6' : 'rgba(139,92,246,0.12)',
                            color: selectedMatchIdx === idx ? '#fff' : '#a78bfa',
                          }}
                        >
                          {LIE_TO_NAME[idx].translit}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Полная таблица */}
                <div className="space-y-1.5 max-h-[45vh] overflow-y-auto pr-1">
                  {LIE_TO_NAME.map((m, idx) => (
                    <button
                      key={m.translit}
                      onClick={() => { setSelectedMatchIdx(idx); triggerHaptic(); }}
                      className="w-full p-3 rounded-xl flex items-center justify-between gap-3 transition-all text-left"
                      style={{
                        background: selectedMatchIdx === idx ? 'rgba(139,92,246,0.15)' : 'var(--surface-highlight)',
                        border: selectedMatchIdx === idx ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border-subtle)',
                      }}
                    >
                      <div className="min-w-0">
                        <div className="text-[10px] text-textSecondary italic">«{m.lie}»</div>
                        <div className="text-xs font-black text-textPrimary">{m.translit}</div>
                        <div className="text-[9px] text-textSecondary leading-snug">{m.meaning}</div>
                      </div>
                      <span className="text-xl leading-none shrink-0" style={{ fontFamily: "'Amiri', serif", color: '#a78bfa' }} dir="rtl">
                        {m.arabic}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── ШАГ 3: Готовая формула ── */}
            {step === 3 && effectiveName && (
              <motion.div key="s3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="text-[11px] text-textSecondary italic">
                  {R('Твоя трансформация собрана по формуле методологии:', 'Your transformation is assembled:')}
                </p>

                <div className="text-center">
                  <span className="text-3xl leading-none block mb-2" style={{ fontFamily: "'Amiri', serif", color: '#a78bfa', textShadow: '0 0 20px rgba(167,139,250,0.3)' }} dir="rtl">
                    {effectiveName.arabic}
                  </span>
                  <span className="text-xs font-black text-textPrimary">{effectiveName.translit}</span>
                </div>

                <div className="p-4 rounded-2xl bg-violet-500/8 border border-violet-500/25">
                  <p className="text-xs text-textPrimary leading-relaxed font-medium">{formula}</p>
                </div>

                {source.trim() && (
                  <div className="text-[10px] text-textSecondary italic px-1">
                    {R('Источник программы:', 'Program source:')} {source}
                  </div>
                )}
              </motion.div>
            )}

            {/* ── ШАГ 4: Проверочный вопрос + сохранение ── */}
            {step === 4 && effectiveName && (
              <motion.div key="s4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30">
                  <span className="text-xs font-black text-amber-500">{checkQuestion}</span>
                </div>

                <button
                  onClick={handleSave}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-black shadow-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Check size={18} strokeWidth={3} />
                  {onStartRitual
                    ? R('Сохранить и пройти 5 стадий сейчас', 'Save & run the 5 stages now')
                    : R('Сохранить в мою библиотеку', 'Save to my library')}
                </button>

                {/* Сохранённые */}
                {savedList.length > 0 && (
                  <div className="pt-2 border-t border-borderSubtle">
                    <div className="flex items-center gap-1.5 mb-2">
                      <BookOpen size={11} className="text-textSecondary" />
                      <span className="text-[9px] font-black uppercase tracking-wider text-textSecondary">
                        {R(`Мои трансформации (${savedList.length})`, `My transformations (${savedList.length})`)}
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {savedList.slice(0, 5).map(t => (
                        <div key={t.id} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-surfaceHighlight/50 border border-borderSubtle">
                          <div className="min-w-0">
                            <div className="text-[11px] font-black text-textPrimary truncate">{t.title}</div>
                            <div className="text-[9px] text-textSecondary">{t.translit}</div>
                          </div>
                          <button
                            onClick={() => { deleteCustomTransformation(t.id); setSavedList(getCustomTransformations()); triggerHaptic(); }}
                            className="w-7 h-7 rounded-lg bg-surface flex items-center justify-center text-textSecondary hover:text-red-500 transition-colors shrink-0"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Навигация */}
        <div className="p-4 border-t border-borderSubtle shrink-0">
          <div className="flex gap-2">
            {step > 0 && (
              <button
                onClick={() => { setStep(s => (s - 1) as Step); triggerHaptic(); }}
                className="px-4 py-3 rounded-2xl bg-surfaceHighlight text-textPrimary font-bold flex items-center gap-1.5 transition-all"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            {step >= 1 && step < 4 && (
              <button
                onClick={() => { if (canNext) { setStep(s => (s + 1) as Step); triggerHaptic(); } }}
                disabled={!canNext}
                className="flex-1 py-3 rounded-2xl bg-violet-500 hover:bg-violet-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
              >
                {step === 1 ? R('Далее: подобрать Имя', 'Next: pick the Name')
                  : step === 2 ? R('Далее: собрать формулу', 'Next: build the formula')
                  : R('Далее: проверка и печать', 'Next: check & seal')}
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TransformationGeneratorModal;
