/**
 * AsmaulHusnaModal — Модуль 99 Прекрасных Имён Аллаха.
 *
 * «У Аллаха прекрасные Имена — зовите Его по ним» (7:180)
 * «Сердца находят покой только в упоминании Аллаха» (13:28)
 *
 * Три режима (сегментированный Apple-контрол):
 *  1. Обзор — все 99 Имён с поиском и 8 духовными путями
 *  2. Курс — интервальное повторение: карточка Имени → «Знаю»/«Повторить»
 *  3. Прогресс — статистика запоминания
 */
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, BookOpen, GraduationCap, BarChart3, Check, RotateCcw, ChevronRight } from 'lucide-react';
import { motionContainer, motionControl, motionCelebrate } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';
import { ASMA_UL_HUSNA, GROUP_META, DivineNameEntry, DivineNameGroup, GROUP_ICONS } from '../services/asmaulHusnaHelpers';
import { getTodayQueue, markKnown, markAgain, getStats } from '../services/asmaMemorization';
import { loadSrs, scheduleSrsPush } from '../services/spiritualSync';

interface AsmaulHusnaModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
  /** Имя, которое открыть сразу (из виджета дня) */
  initialName?: number | null;
  /** Supabase-пользователь для облачной синхронизации прогресса */
  user?: import('@supabase/supabase-js').User | null;
}

type Mode = 'browse' | 'course' | 'progress';

export const AsmaulHusnaModal: React.FC<AsmaulHusnaModalProps> = ({
  isOpen,
  onClose,
  language = 'ru',
  initialName = null,
  user = null,
}) => {
  const [mode, setMode] = useState<Mode>('browse');
  const [search, setSearch] = useState('');
  const [activeGroup, setActiveGroup] = useState<DivineNameGroup | 'all'>('all');
  const [selectedName, setSelectedName] = useState<DivineNameEntry | null>(null);

  // Курс
  const [courseQueue, setCourseQueue] = useState<number[]>([]);
  const [courseIdx, setCourseIdx] = useState(0);
  const [courseAnswer, setCourseAnswer] = useState<'known' | 'again' | null>(null);
  const [sessionDone, setSessionDone] = useState(0);

  // Прогресс (перечитываем при каждом открытии вкладки)
  const [statsKey, setStatsKey] = useState(0);

  React.useEffect(() => {
    if (!isOpen) return;
    if (initialName !== null && initialName !== undefined) {
      const found = ASMA_UL_HUSNA.find(x => x.n === initialName);
      if (found) setSelectedName(found);
    }
    // Облачный pull при открытии: merge локального и облачного SRS
    loadSrs(user).then(() => setStatsKey(k => k + 1));
  }, [isOpen, initialName, user]);

  React.useEffect(() => {
    if (!isOpen) {
      setSelectedName(null);
      setMode('browse');
      setSearch('');
      setCourseQueue([]);
      setCourseIdx(0);
      setCourseAnswer(null);
      setSessionDone(0);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ASMA_UL_HUSNA.filter(x => {
      if (activeGroup !== 'all' && x.group !== activeGroup) return false;
      if (!q) return true;
      return (
        x.translit.toLowerCase().includes(q) ||
        x.meaning.toLowerCase().includes(q) ||
        x.arabic.includes(search.trim())
      );
    });
  }, [search, activeGroup]);

  const startCourse = () => {
    const queue = getTodayQueue(ASMA_UL_HUSNA.map(x => x.n));
    setCourseQueue(queue.slice(0, 10)); // сессия по 10 Имён — без перегруза
    setCourseIdx(0);
    setCourseAnswer(null);
    setSessionDone(0);
    setMode('course');
  };

  const currentCourseName = courseQueue.length > 0
    ? ASMA_UL_HUSNA.find(x => x.n === courseQueue[courseIdx]) || null
    : null;

  const handleCourseAnswer = (answer: 'known' | 'again') => {
    if (!currentCourseName) return;
    if (answer === 'known') {
      markKnown(currentCourseName.n, () => scheduleSrsPush(user));
      triggerStrongHaptic();
    } else {
      markAgain(currentCourseName.n, () => scheduleSrsPush(user));
      triggerHaptic();
    }
    setCourseAnswer(answer);
    setTimeout(() => {
      setCourseAnswer(null);
      if (courseIdx + 1 >= courseQueue.length) {
        setSessionDone(courseIdx + 1);
        setStatsKey(k => k + 1);
      } else {
        setCourseIdx(i => i + 1);
      }
    }, 600);
  };

  if (!isOpen) return null;

  const stats = getStats(ASMA_UL_HUSNA.map(x => x.n));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={motionContainer}
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-borderSubtle shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                <span className="text-lg leading-none" style={{ fontFamily: "'Amiri', serif", color: '#fbbf24' }}>ﷲ</span>
              </div>
              <div>
                <h2 className="text-base font-black text-textPrimary leading-tight">
                  {language === 'ru' ? 'Асма уль-Хусна' : 'Asma ul-Husna'}
                </h2>
                <span className="text-[11px] text-textSecondary">
                  {language === 'ru' ? '99 Прекрасных Имён — «зовите Его по ним» (7:180)' : '99 Beautiful Names — "call upon Him by them" (7:180)'}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary hover:text-textPrimary transition-colors shrink-0"
            >
              <X size={16} />
            </button>
          </div>

          {/* Сегментированный переключатель режимов */}
          <div className="flex bg-surfaceHighlight rounded-xl p-1 gap-1">
            {([
              { id: 'browse', icon: BookOpen, label: language === 'ru' ? 'Обзор' : 'Browse' },
              { id: 'course', icon: GraduationCap, label: language === 'ru' ? 'Курс' : 'Course' },
              { id: 'progress', icon: BarChart3, label: language === 'ru' ? 'Прогресс' : 'Progress' },
            ] as const).map(m => (
              <button
                key={m.id}
                onClick={() => { setMode(m.id as Mode); if (m.id === 'course' && courseQueue.length === 0) startCourse(); triggerHaptic(); }}
                className={`flex-1 py-2 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                  mode === m.id ? 'bg-amber-500 text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
                }`}
              >
                <m.icon size={13} />
                {m.label}
                {m.id === 'course' && stats.dueToday > 0 && mode !== 'course' && (
                  <span className="ml-0.5 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                    {stats.dueToday > 99 ? '99+' : stats.dueToday}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── РЕЖИМ: ОБЗОР ── */}
        {mode === 'browse' && (
          <div className="flex-1 overflow-y-auto p-5 pt-3">
            {/* Поиск */}
            <div className="relative mb-3">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-textSecondary" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={language === 'ru' ? 'Поиск: Карим, Хафиз, الرحمن…' : 'Search: Karim, Hafiz…'}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-surfaceHighlight/60 border border-borderSubtle text-sm text-textPrimary focus:outline-none focus:border-amber-500/50"
              />
            </div>

            {/* 8 духовных путей */}
            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 no-scrollbar">
              <button
                onClick={() => setActiveGroup('all')}
                className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all ${
                  activeGroup === 'all' ? 'bg-amber-500 text-white' : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'
                }`}
              >
                {language === 'ru' ? `Все 99` : `All 99`}
              </button>
              {(Object.keys(GROUP_META) as DivineNameGroup[]).map(g => {
                const GIcon = GROUP_ICONS[g];
                return (
                  <button
                    key={g}
                    onClick={() => setActiveGroup(g)}
                    className="px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all flex items-center gap-1.5"
                    style={activeGroup === g ? { background: GROUP_META[g].color, color: '#fff' } : { background: 'var(--surface-highlight)', color: 'var(--text-secondary)' }}
                  >
                    <GIcon size={12} strokeWidth={2.5} />
                    {language === 'ru' ? GROUP_META[g].titleRu : GROUP_META[g].titleEn}
                  </button>
                );
              })}
            </div>

            {/* Смысл выбранного пути */}
            {activeGroup !== 'all' && (
              <div className="mb-3 p-2.5 rounded-xl text-[11px] italic" style={{ background: `${GROUP_META[activeGroup].color}12`, color: 'var(--text-secondary)' }}>
                {GROUP_META[activeGroup].purposeRu}
              </div>
            )}

            {/* Сетка Имён */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {filtered.map(name => (
                <button
                  key={name.n}
                  onClick={() => { setSelectedName(name); triggerHaptic(); }}
                  className="p-3 rounded-2xl text-left transition-all active:scale-95 hover:shadow-md"
                  style={{
                    background: 'var(--surface-highlight)',
                    border: `1px solid ${activeGroup !== 'all' && name.group === activeGroup ? GROUP_META[name.group].color + '40' : 'var(--border-subtle)'}`,
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-black tabular-nums opacity-40">{name.n}</span>
                    <span
                      className="text-lg leading-none"
                      style={{ fontFamily: "'Amiri', serif", color: GROUP_META[name.group].color }}
                      dir="rtl"
                    >
                      {name.arabic}
                    </span>
                  </div>
                  <div className="text-xs font-black text-textPrimary truncate">{name.translit}</div>
                  <div className="text-[9px] text-textSecondary leading-snug line-clamp-2">{name.meaning}</div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div className="text-center py-10 text-sm text-textSecondary">
                {language === 'ru' ? 'Ничего не найдено' : 'Nothing found'}
              </div>
            )}
          </div>
        )}

        {/* ── РЕЖИМ: КУРС ── */}
        {mode === 'course' && (
          <div className="flex-1 overflow-y-auto p-5 pt-3">
            {sessionDone > 0 && courseIdx + 1 >= courseQueue.length ? (
              /* Сессия завершена */
              <div className="text-center py-8 animate-fadeIn">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={motionCelebrate}
                  className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center mx-auto mb-4 text-white shadow-xl"
                >
                  <Check size={30} strokeWidth={3} />
                </motion.div>
                <h3 className="text-lg font-black text-textPrimary mb-1">
                  {language === 'ru' ? 'Сессия завершена!' : 'Session complete!'}
                </h3>
                <p className="text-sm text-textSecondary mb-5">
                  {language === 'ru'
                    ? `${sessionDone} Имён повторено. Сердце помнит — «в упоминании Аллаха сердца успокаиваются» (13:28).`
                    : `${sessionDone} names reviewed. Hearts find rest in the remembrance of Allah (13:28).`}
                </p>
                <button
                  onClick={startCourse}
                  className="px-6 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-lg"
                >
                  {language === 'ru' ? 'Ещё сессия (10 Имён)' : 'Another session (10 names)'}
                </button>
              </div>
            ) : currentCourseName ? (
              <div className="flex flex-col items-center py-4">
                {/* Прогресс сессии */}
                <div className="w-full flex items-center gap-2 mb-6">
                  <div className="flex-1 h-1.5 rounded-full bg-surfaceHighlight overflow-hidden">
                    <div
                      className="h-full rounded-full bg-amber-500 transition-all duration-500"
                      style={{ width: `${((courseIdx) / courseQueue.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-black tabular-nums text-textSecondary">
                    {courseIdx + 1}/{courseQueue.length}
                  </span>
                </div>

                {/* Карточка Имени */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCourseName.n}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={motionContainer}
                    className="w-full text-center"
                  >
                    <div
                      className="text-6xl mb-3 leading-none"
                      style={{ fontFamily: "'Amiri', serif", color: GROUP_META[currentCourseName.group].color, textShadow: '0 0 30px rgba(251,191,36,0.2)' }}
                      dir="rtl"
                    >
                      {currentCourseName.arabic}
                    </div>
                    <div className="text-2xl font-black text-textPrimary mb-2">{currentCourseName.translit}</div>
                    <p className="text-sm text-textSecondary leading-relaxed max-w-sm mx-auto">
                      {currentCourseName.meaning}
                    </p>
                    <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: `${GROUP_META[currentCourseName.group].color}18`, color: GROUP_META[currentCourseName.group].color }}>
                      {(() => { const GI = GROUP_ICONS[currentCourseName.group]; return <GI size={11} strokeWidth={2.5} />; })()}
                      {language === 'ru' ? GROUP_META[currentCourseName.group].titleRu : GROUP_META[currentCourseName.group].titleEn}
                    </div>
                  </motion.div>
                </AnimatePresence>

                {/* Кнопки SRS */}
                <div className="flex gap-3 mt-8 w-full">
                  <button
                    onClick={() => handleCourseAnswer('again')}
                    disabled={courseAnswer !== null}
                    className={`flex-1 py-4 rounded-2xl font-black transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      courseAnswer === 'again'
                        ? 'bg-red-500 text-white'
                        : 'bg-surfaceHighlight text-textSecondary hover:text-red-500'
                    } disabled:opacity-50`}
                  >
                    <RotateCcw size={16} />
                    {language === 'ru' ? 'Повторить завтра' : 'Again tomorrow'}
                  </button>
                  <button
                    onClick={() => handleCourseAnswer('known')}
                    disabled={courseAnswer !== null}
                    className={`flex-1 py-4 rounded-2xl font-black text-white transition-all active:scale-95 flex items-center justify-center gap-2 ${
                      courseAnswer === 'known' ? 'bg-emerald-600' : 'bg-emerald-500 hover:bg-emerald-600'
                    } disabled:opacity-50`}
                  >
                    <Check size={16} strokeWidth={3} />
                    {language === 'ru' ? 'Знаю' : 'I know it'}
                  </button>
                </div>

                <p className="text-[10px] text-textSecondary opacity-60 mt-4 text-center max-w-xs leading-relaxed">
                  {language === 'ru'
                    ? 'Интервальное повторение: «Знаю» — встретимся реже, «Повторить» — завтра снова'
                    : 'Spaced repetition: "I know" — see it less, "Again" — back tomorrow'}
                </p>
              </div>
            ) : (
              <div className="text-center py-10">
                <p className="text-sm text-textSecondary mb-4">
                  {language === 'ru' ? 'Все Имён на сегодня повторены!' : 'All names reviewed for today!'}
                </p>
                <button onClick={startCourse} className="px-6 py-3 rounded-2xl bg-amber-500 text-white font-black">
                  {language === 'ru' ? 'Начать сессию' : 'Start session'}
                </button>
              </div>
            )}
          </div>
          )}

        {/* ── РЕЖИМ: ПРОГРЕСС ── */}
        {mode === 'progress' && (
          <div className="flex-1 overflow-y-auto p-5 pt-3" key={statsKey}>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="p-4 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle">
                <div className="text-3xl font-black tabular-nums text-amber-500">{stats.learned}</div>
                <div className="text-[11px] font-bold text-textSecondary">
                  {language === 'ru' ? 'изучено (закреплено)' : 'learned (locked in)'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle">
                <div className="text-3xl font-black tabular-nums text-emerald-500">{stats.mastered}</div>
                <div className="text-[11px] font-bold text-textSecondary">
                  {language === 'ru' ? 'освоено (32 дня)' : 'mastered (32 days)'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle">
                <div className="text-3xl font-black tabular-nums text-blue-500">{stats.reviews}</div>
                <div className="text-[11px] font-bold text-textSecondary">
                  {language === 'ru' ? 'повторений всего' : 'total reviews'}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-surfaceHighlight/50 border border-borderSubtle">
                <div className="text-3xl font-black tabular-nums text-red-500">{stats.dueToday}</div>
                <div className="text-[11px] font-bold text-textSecondary">
                  {language === 'ru' ? 'к повторению сегодня' : 'due today'}
                </div>
              </div>
            </div>

            {/* Общий прогресс к 99 */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-yellow-500/5 border border-amber-500/25 mb-4">
              <div className="flex justify-between text-xs font-black mb-2">
                <span className="text-textPrimary">{language === 'ru' ? 'Путь к 99 Имён' : 'Path to 99 Names'}</span>
                <span className="text-amber-500 tabular-nums">{stats.learned}/{stats.total}</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden bg-surfaceHighlight">
                <div
                  className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${(stats.learned / stats.total) * 100}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                />
              </div>
              <p className="text-[10px] text-textSecondary mt-2 italic">
                {language === 'ru'
                  ? '«Кто запомнит 99 Имён и будет жить по ним — войдёт в Рай» (хадис, Тирмизи)'
                  : '"Whoever memorizes the 99 Names and lives by them will enter Paradise" (Tirmidhi)'}
              </p>
            </div>

            {/* Прогресс по путям */}
            <div className="space-y-2">
              {(Object.keys(GROUP_META) as DivineNameGroup[]).map(g => {
                const namesInGroup = ASMA_UL_HUSNA.filter(x => x.group === g);
                const map = getStats(namesInGroup.map(x => x.n));
                const GIcon = GROUP_ICONS[g];
                return (
                  <div key={g} className="flex items-center gap-3 p-3 rounded-xl bg-surfaceHighlight/40 border border-borderSubtle">
                    <GIcon size={16} strokeWidth={2.5} className="shrink-0" style={{ color: GROUP_META[g].color }} />
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between text-[11px] font-bold mb-1">
                        <span className="text-textPrimary truncate">{language === 'ru' ? GROUP_META[g].titleRu : GROUP_META[g].titleEn}</span>
                        <span className="tabular-nums text-textSecondary">{map.learned}/{namesInGroup.length}</span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden bg-surface">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${(map.learned / namesInGroup.length) * 100}%`, background: GROUP_META[g].color }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── КАРТОЧКА ИМЕНИ (детально) ── */}
        <AnimatePresence>
          {selectedName && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center p-6"
              style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
              onClick={() => setSelectedName(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 16 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 16 }}
                transition={motionControl}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm rounded-3xl p-6 text-center"
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${GROUP_META[selectedName.group].color}44`,
                  boxShadow: `0 10px 60px ${GROUP_META[selectedName.group].color}22`,
                }}
              >
                <span className="text-[10px] font-black tabular-nums text-textSecondary">{selectedName.n} / 99</span>
                <div
                  className="text-5xl my-4 leading-none"
                  style={{ fontFamily: "'Amiri', serif", color: GROUP_META[selectedName.group].color, textShadow: `0 0 30px ${GROUP_META[selectedName.group].color}44` }}
                  dir="rtl"
                >
                  {selectedName.arabic}
                </div>
                <h3 className="text-xl font-black text-textPrimary mb-1">{selectedName.translit}</h3>
                <p className="text-sm text-textSecondary leading-relaxed mb-4">{selectedName.meaning}</p>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold mb-5" style={{ background: `${GROUP_META[selectedName.group].color}18`, color: GROUP_META[selectedName.group].color }}>
                  {(() => { const GI = GROUP_ICONS[selectedName.group]; return <GI size={12} strokeWidth={2.5} />; })()}
                  {language === 'ru' ? GROUP_META[selectedName.group].titleRu : GROUP_META[selectedName.group].titleEn}
                  <ChevronRight size={11} />
                </div>
                <p className="text-[10px] text-textSecondary opacity-70 italic leading-relaxed">
                  {language === 'ru' ? GROUP_META[selectedName.group].purposeRu : ''}
                </p>
                <button
                  onClick={() => setSelectedName(null)}
                  className="mt-4 w-full py-3 rounded-2xl bg-surfaceHighlight text-textPrimary font-bold text-sm hover:bg-surface transition-colors"
                >
                  {language === 'ru' ? 'Закрыть' : 'Close'}
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default AsmaulHusnaModal;
