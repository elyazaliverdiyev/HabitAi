import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { motionContainer } from '../utils/motionPresets';
import { 
  Sparkles, X, CheckCircle2, Circle, ArrowRight, Brain, Flame, 
  Calendar, DollarSign, Target, ChevronRight, RefreshCcw, ShieldAlert, Layers
} from 'lucide-react';
import { Habit } from '../types';
import { generateGoalChain, AIGoalStep, AIGoalChainResponse } from '../services/ai/ai-goals';
import CountUp from './CountUp';

interface AIGoalChainModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGoalTitle?: string;
  habits?: Habit[];
  totalCapital?: number;
  onApplyStepsToGoal?: (steps: AIGoalStep[]) => void;
  language?: 'ru' | 'en';
}

export const AIGoalChainModal: React.FC<AIGoalChainModalProps> = ({
  isOpen,
  onClose,
  initialGoalTitle = '',
  habits = [],
  totalCapital = 0,
  onApplyStepsToGoal,
  language = 'ru'
}) => {
  const [goalInput, setGoalInput] = useState(initialGoalTitle);
  const [isLoading, setIsLoading] = useState(false);
  const [chainData, setChainData] = useState<AIGoalChainResponse | null>(null);
  const [completedStepIds, setCompletedStepIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (initialGoalTitle) {
      setGoalInput(initialGoalTitle);
    }
  }, [initialGoalTitle]);

  const handleGenerate = async () => {
    if (!goalInput.trim()) return;
    setIsLoading(true);

    try {
      const res = await generateGoalChain(
        goalInput.trim(),
        { habits, totalCapital },
        language
      );
      setChainData(res);
      setCompletedStepIds(new Set());
    } catch (err) {
      console.error("Error generating goal chain:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStepCompletion = (id: string) => {
    setCompletedStepIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const completedCount = completedStepIds.size;
  const totalSteps = chainData?.steps.length || 0;
  const progressPercent = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-black/70 backdrop-blur-[12px]"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={motionContainer}
          className="relative w-full max-w-3xl bg-zinc-900/95 border border-purple-500/30 rounded-3xl shadow-2xl overflow-hidden text-zinc-100 my-8"
        >
          {/* Header Glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-gradient-to-b from-purple-600/20 via-indigo-600/10 to-transparent blur-3xl pointer-events-none" />

          {/* Top Bar */}
          <div className="flex items-center justify-between p-6 border-b border-zinc-800/80 relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-indigo-500/20 border border-purple-500/30 rounded-2xl">
                <Brain className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold bg-gradient-to-r from-purple-300 via-indigo-200 to-amber-200 bg-clip-text text-transparent flex items-center gap-2">
                  <span>AI Цепочка Событий & Шагов</span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase tracking-widest">PRO</span>
                </h2>
                <p className="text-xs text-zinc-400">
                  {language === 'ru' ? 'ИИ сам построит последовательность действий для вашей цели' : 'AI automatically breaks your goal into an actionable roadmap'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-700 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto custom-scrollbar relative z-10 modal-content-fade">
            {/* Input Section */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-purple-300 block">
                {language === 'ru' ? 'Какую сложную цель вы хотите реализовать?' : 'What goal do you want to achieve?'}
              </label>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={goalInput}
                  onChange={e => setGoalInput(e.target.value)}
                  placeholder={language === 'ru' ? 'Например: "Купить квартиру в Баку за 12 месяцев"...' : 'e.g., "Buy an apartment in 12 months"...'}
                  className="flex-1 bg-zinc-800/80 border border-zinc-700/80 focus:border-purple-500 rounded-2xl px-4 py-3.5 text-sm text-white placeholder-zinc-500 outline-none transition shadow-inner"
                />

                <button
                  onClick={handleGenerate}
                  disabled={isLoading || !goalInput.trim()}
                  className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50 text-white font-semibold shadow-lg shadow-purple-600/30 flex items-center gap-2 transition active:scale-95 whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <RefreshCcw className="w-4 h-4 animate-spin text-purple-200" />
                      <span>{language === 'ru' ? 'ИИ думает...' : 'Generating...'}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{language === 'ru' ? 'Создать цепочку' : 'Build Roadmap'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Chain Content */}
            {chainData && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-2"
              >
                {/* Overview Header */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-950/40 via-zinc-900 to-indigo-950/40 border border-purple-500/20 space-y-4">
                  <div>
                    <h3 className="text-base font-bold text-white mb-1">{chainData.goalTitle}</h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">{chainData.summary}</p>
                  </div>

                  {/* Stat Badges */}
                  <div className="flex flex-wrap gap-3 pt-2 border-t border-purple-500/20">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/60 text-xs text-purple-300">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Срок: ~{chainData.totalEstimatedDays} дней</span>
                    </div>

                    {chainData.estimatedCost !== undefined && (
                      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/60 text-xs text-amber-300">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>Оценка бюджета: ${chainData.estimatedCost.toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800/60 text-xs text-emerald-300">
                      <Target className="w-3.5 h-3.5" />
                      <span>Прогресс: {progressPercent}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-emerald-400 h-full transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                {/* Steps List Timeline */}
                <div className="space-y-3">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-purple-400" />
                    <span>Пошаговая цепочка событий</span>
                  </h4>

                  <div className="space-y-3 relative before:absolute before:left-4 before:top-4 before:bottom-4 before:w-0.5 before:bg-zinc-800">
                    {chainData.steps.map((step, index) => {
                      const isDone = completedStepIds.has(step.id);

                      return (
                        <motion.div
                          key={step.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          onClick={() => toggleStepCompletion(step.id)}
                          className={`relative ml-9 p-4 rounded-2xl border transition cursor-pointer group ${
                            isDone
                              ? 'bg-emerald-950/20 border-emerald-500/40 text-zinc-300'
                              : 'bg-zinc-800/40 border-zinc-800 hover:border-purple-500/40 text-white'
                          }`}
                        >
                          {/* Timeline Dot */}
                          <div className={`absolute -left-9 top-4 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition border ${
                            isDone
                              ? 'bg-emerald-500 border-emerald-400 text-zinc-950'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400 group-hover:border-purple-500 group-hover:text-purple-300'
                          }`}>
                            {isDone ? <CheckCircle2 className="w-4 h-4" /> : step.order}
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <h5 className={`text-sm font-semibold ${isDone ? 'line-through text-zinc-400' : 'text-white'}`}>
                                {step.title}
                              </h5>
                              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-zinc-800 text-zinc-400 border border-zinc-700">
                                ~{step.estimatedDays} дн.
                              </span>
                            </div>

                            <p className="text-xs text-zinc-400 leading-relaxed">
                              {step.description}
                            </p>

                            {step.aiAdvice && (
                              <div className="mt-2 p-2.5 rounded-xl bg-purple-950/30 border border-purple-500/20 text-[11px] text-purple-200 flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 text-purple-400 shrink-0 mt-0.5" />
                                <span><strong>Совет ИИ:</strong> {step.aiAdvice}</span>
                              </div>
                            )}

                            {step.suggestedHabit && (
                              <div className="text-[11px] text-amber-300/90 flex items-center gap-1.5">
                                <Flame className="w-3.5 h-3.5 text-amber-400" />
                                <span>Рекомендуемая привычка: {step.suggestedHabit}</span>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {/* Strategic AI Advice Banner */}
                {chainData.strategicAdvice && (
                  <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 space-y-1">
                    <span className="font-bold flex items-center gap-1.5 text-amber-300">
                      <Sparkles className="w-4 h-4" />
                      Главный секрет успеха этой цели:
                    </span>
                    <p className="leading-relaxed">{chainData.strategicAdvice}</p>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
