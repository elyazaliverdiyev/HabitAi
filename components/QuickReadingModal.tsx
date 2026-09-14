import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, X, Plus, Minus, Check, Play, Pause, RotateCcw, Library, CheckCircle2, Sparkles, Clock, FileText, Settings } from 'lucide-react';
import { Habit, Book } from '../types';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface QuickReadingModalProps {
  habit: Habit;
  isOpen: boolean;
  onClose: () => void;
  onUpdateHabit: (habitId: string, updates: Partial<Habit>) => void;
  onOpenFullLibrary: () => void;
  onEditHabit?: (habit: Habit) => void;
  language?: 'ru' | 'en';
  todayStr: string;
}

export const QuickReadingModal: React.FC<QuickReadingModalProps> = ({
  habit,
  isOpen,
  onClose,
  onUpdateHabit,
  onOpenFullLibrary,
  onEditHabit,
  language = 'ru',
  todayStr
}) => {
  const books: Book[] = habit.extension?.data?.books || [];
  const activeBook = books.find(b => b.status === 'reading') || books[0];

  const targetPages = habit.targetCount || habit.ultimateTarget || 20;
  
  // Page log state
  const [currentPage, setCurrentPage] = useState<number>(activeBook ? activeBook.currentPage : 0);
  const [pagesReadSession, setPagesReadSession] = useState<number>(0);

  // Reading Timer state
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (activeBook) {
      setCurrentPage(activeBook.currentPage);
    }
  }, [activeBook]);

  // Timer interval
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTimerRunning]);

  if (!isOpen) return null;

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleAddPages = (delta: number) => {
    if (!activeBook) return;
    const next = Math.min(activeBook.totalPages, Math.max(0, currentPage + delta));
    const sessionDelta = next - activeBook.currentPage;
    setCurrentPage(next);
    setPagesReadSession(prev => prev + sessionDelta);
  };

  const handleSave = () => {
    if (!activeBook) {
      onClose();
      return;
    }

    const updatedBooks = books.map(b => 
      b.id === activeBook.id 
        ? { ...b, currentPage, status: currentPage >= b.totalPages ? 'finished' as const : b.status, updatedAt: new Date().toISOString() }
        : b
    );

    const delta = Math.max(0, currentPage - (activeBook.currentPage || 0));
    const prevDaily = habit.dailyProgress?.[todayStr] || 0;
    const newDaily = prevDaily + delta;

    const completed = newDaily >= targetPages || currentPage >= activeBook.totalPages;
    let completedDates = [...habit.completedDates];
    if (completed && !completedDates.includes(todayStr)) {
      completedDates.push(todayStr);
    }

    onUpdateHabit(habit.id, {
      extension: {
        type: 'reading',
        data: { ...habit.extension?.data, books: updatedBooks }
      },
      dailyProgress: {
        ...(habit.dailyProgress || {}),
        [todayStr]: newDaily
      },
      completedDates
    });

    onClose();
  };

  const handleStatusChange = (newStatus: 'reading' | 'inbox' | 'finished') => {
    if (!activeBook) return;
    const updatedBooks = books.map(b => 
      b.id === activeBook.id 
        ? { ...b, status: newStatus, updatedAt: new Date().toISOString() }
        : b
    );

    onUpdateHabit(habit.id, {
      extension: {
        type: 'reading',
        data: { ...habit.extension?.data, books: updatedBooks }
      }
    });
  };

  const bookProgress = activeBook && activeBook.totalPages > 0 
    ? Math.min(100, Math.round((currentPage / activeBook.totalPages) * 100))
    : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={motionControl}
          className="relative w-full max-w-sm rounded-3xl p-6 overflow-hidden z-10"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center">
                <BookOpen size={18} />
              </div>
              <div>
                <h3 className="text-base font-black text-textPrimary leading-tight">
                  {language === 'ru' ? 'Трекер чтения' : 'Reading Tracker'}
                </h3>
                <span className="text-[11px] font-semibold text-textSecondary">
                  {language === 'ru' ? `Норма: ${targetPages} стр/день` : `Goal: ${targetPages} p/day`}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {onEditHabit && (
                <button
                  onClick={() => {
                    onClose();
                    onEditHabit(habit);
                  }}
                  className="p-1.5 rounded-full text-textSecondary hover:bg-surfaceHighlight hover:text-textPrimary transition-colors"
                  title={language === 'ru' ? 'Редактировать привычку' : 'Edit habit'}
                >
                  <Settings size={17} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 rounded-full text-textSecondary hover:bg-surfaceHighlight hover:text-textPrimary transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Active Book Card */}
          {activeBook ? (
            <div className="p-4 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle mb-5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-sm text-textPrimary truncate">{activeBook.title}</h4>
                  <p className="text-[11px] text-textSecondary truncate">{activeBook.author || (language === 'ru' ? 'Автор' : 'Author')}</p>
                </div>
                <span className="text-xs font-black text-brand tabular-nums">{bookProgress}%</span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-2 bg-surface rounded-full overflow-hidden mb-3 border border-borderSubtle">
                <motion.div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${bookProgress}%` }}
                />
              </div>

              {/* Current Page Counter */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-textSecondary">
                  {language === 'ru' ? 'Текущая страница:' : 'Current page:'}
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={activeBook.totalPages}
                    value={currentPage || ''}
                    onChange={(e) => setCurrentPage(Math.min(activeBook.totalPages, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="w-16 px-2 py-1 bg-surface border border-borderSubtle rounded-lg text-sm font-black text-center text-textPrimary outline-none focus:border-brand"
                  />
                  <span className="text-xs font-bold text-textSecondary">/ {activeBook.totalPages}</span>
                </div>
              </div>

              {/* Quick Add / Subtract Pages Buttons */}
              <div className="mt-3 pt-3 border-t border-borderSubtle/50 space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-textSecondary uppercase w-14 shrink-0">{language === 'ru' ? '+ Стр:' : '+ Pgs:'}</span>
                  {[5, 10, 20, 30].map((delta) => (
                    <button
                      key={`add-${delta}`}
                      onClick={() => handleAddPages(delta)}
                      className="flex-1 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/20 font-black text-xs transition-colors"
                    >
                      +{delta}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-textSecondary uppercase w-14 shrink-0">{language === 'ru' ? '- Стр:' : '- Pgs:'}</span>
                  {[-5, -10, -20, -30].map((delta) => (
                    <button
                      key={`sub-${delta}`}
                      onClick={() => handleAddPages(delta)}
                      disabled={currentPage <= 0}
                      className="flex-1 py-1 rounded-lg bg-surface hover:bg-red-500/10 hover:text-red-500 border border-borderSubtle disabled:opacity-30 text-textSecondary font-bold text-xs transition-colors"
                    >
                      {delta}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-2xl bg-surfaceHighlight/30 border border-dashed border-borderSubtle text-center mb-5">
              <p className="text-xs text-textSecondary mb-3">
                {language === 'ru' ? 'В библиотеке пока нет активных книг' : 'No active books in your library'}
              </p>
              <button
                onClick={() => { onClose(); onOpenFullLibrary(); }}
                className="px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl"
              >
                {language === 'ru' ? 'Добавить книгу' : 'Add Book'}
              </button>
            </div>
          )}

          {/* Reading Timer */}
          <div className="p-3.5 rounded-2xl bg-surfaceHighlight/30 border border-borderSubtle mb-5 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-surface border border-borderSubtle flex items-center justify-center text-textPrimary">
                <Clock size={16} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-textSecondary uppercase block">
                  {language === 'ru' ? 'Таймер сессии' : 'Session Timer'}
                </span>
                <span className="text-base font-black text-textPrimary font-mono">
                  {formatTimer(timerSeconds)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`p-2.5 rounded-xl transition-all font-bold text-xs flex items-center gap-1 ${
                  isTimerRunning ? 'bg-amber-500/15 text-amber-500' : 'bg-brand text-white shadow-sm'
                }`}
              >
                {isTimerRunning ? <Pause size={14} /> : <Play size={14} />}
                {isTimerRunning ? (language === 'ru' ? 'Пауза' : 'Pause') : (language === 'ru' ? 'Старт' : 'Start')}
              </button>
              {timerSeconds > 0 && !isTimerRunning && (
                <button
                  onClick={() => setTimerSeconds(0)}
                  className="p-2.5 rounded-xl bg-surface border border-borderSubtle text-textSecondary hover:text-textPrimary"
                >
                  <RotateCcw size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { onClose(); onOpenFullLibrary(); }}
              className="px-3.5 py-3 rounded-2xl bg-surfaceHighlight hover:bg-surface border border-borderSubtle text-textSecondary hover:text-textPrimary text-xs font-bold flex items-center gap-1.5 transition-colors"
              title={language === 'ru' ? 'Открыть всю библиотеку' : 'Open library'}
            >
              <Library size={15} />
              {language === 'ru' ? 'Полки' : 'Shelves'}
            </button>
            {onEditHabit && (
              <button
                onClick={() => {
                  onClose();
                  onEditHabit(habit);
                }}
                className="px-3.5 py-3 rounded-2xl bg-surfaceHighlight hover:bg-surface border border-borderSubtle text-textSecondary hover:text-textPrimary text-xs font-bold flex items-center gap-1.5 transition-colors"
                title={language === 'ru' ? 'Редактировать привычку' : 'Edit habit'}
              >
                <Settings size={15} />
                {language === 'ru' ? 'Настройки' : 'Edit'}
              </button>
            )}
            <button
              onClick={handleSave}
              className="flex-1 py-3 rounded-2xl bg-brand text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg hover:opacity-95 transition-all active:scale-[0.98]"
            >
              <Check size={15} strokeWidth={3} />
              {language === 'ru' ? 'Сохранить чтение' : 'Save Session'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default QuickReadingModal;
