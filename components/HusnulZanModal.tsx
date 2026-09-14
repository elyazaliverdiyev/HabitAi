/**
 * HusnulZanModal — Высшая Трансформация: Хуснуль-Зан (Видение Аллаха).
 *
 * Фундамент (хадис-кудси, Бухари/Муслим):
 *   «أنا عند ظنِّ عبدي بي» — «Я таков, каким Мой раб думает обо Мне»
 *
 * Два режима из методологии:
 *  1. Сдвиг Парадигмы — управляемое чтение настройки компаса на Истину
 *     (не аффирмация: пользователь отмечает каждую строку, когда она
 *     отзывается в сердце; прогресс сохраняется).
 *  2. Маппер Страха — алгоритм «В каком Имени Аллаха я сейчас сомневаюсь?»:
 *     выбираешь страх → приложение показывает Имя, в котором сомневается
 *     сердце → кнопка зикра ×33 этого Имени.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Compass, ShieldQuestion, ChevronRight, Check, Repeat } from 'lucide-react';
import { motionContainer, motionControl } from '../utils/motionPresets';
import { triggerHaptic, triggerStrongHaptic } from '../utils/helpers';

// ── Сдвиг Парадигмы: строки практики (Хуснуль-Зан, Obsidian) ──

const PARADIGM_LINES: { text: string; isName?: boolean; emphasis?: boolean }[] = [
  { text: 'Я осознаю, что все мои страхи и блоки — лишь следствие того, что я забыл, Кто мой Господь.' },
  { text: 'Я отказываюсь видеть Аллаха через призму моих травм.', emphasis: true },
  { text: 'Я выбираю видеть Аллаха таким, каким Он Сам Себя назвал.', emphasis: true },
  { text: 'Мой Господь — Ар-Рахман. Он желает мне блага больше, чем я сам себе.', isName: true },
  { text: 'Мой Господь — Аль-Фаттах. Нет двери, которую Он не открыл бы одним словом «Будь».', isName: true },
  { text: 'Мой Господь — Аль-Мугни. Его сокровищницы не истощаются, сколько бы Он ни давал.', isName: true },
  { text: 'Мой Господь — Аль-Кариб. Мне не нужно кричать, чтобы Он услышал мой шёпот.', isName: true },
  { text: 'Если Он — со мной, то кто может быть против меня?' },
  { text: 'Если Он — мой Попечитель (Аль-Вакиль), то о чём мне тревожиться?' },
  { text: 'Я передаю Ему управление. Я снимаю с себя тяжесть контроля.' },
  { text: 'Я доверяю Ему свою жизнь, семью, проекты и будущее.' },
  { text: 'Я ожидаю от Него только наилучшего — потому что Он сказал: «Я таков, каким Мой раб думает обо Мне».', emphasis: true },
];

// ── Маппер: страх → Имя, в котором сомневается сердце ──

interface FearMapping {
  fearRu: string;
  fearEn: string;
  nameArabic: string;
  nameTranslit: string;
  nameMeaning: string;
  /** Что напомнить сердцу */
  reminderRu: string;
  color: string;
}

const FEAR_MAP: FearMapping[] = [
  {
    fearRu: 'Страх бедности и нехватки', fearEn: 'Fear of poverty',
    nameArabic: 'الرَّزَّاق', nameTranslit: 'Ар-Раззак', nameMeaning: 'Дающий всякий удел',
    reminderRu: '«Нет на земле существа, которого Аллах не кормил бы» (11:6). Сомнение в Раззаке — единственный источник страха дефицита.',
    color: '#84cc16',
  },
  {
    fearRu: 'Страх осуждения и мнения людей', fearEn: 'Fear of judgement',
    nameArabic: 'العَزِيز', nameTranslit: 'Аль-Азиз', nameMeaning: 'Дающий достоинство и величие',
    reminderRu: 'Достоинство даёт не толпа — его даёт Аль-Азиз. Когда Он возвышает, никто не принизит.',
    color: '#ef4444',
  },
  {
    fearRu: 'Страх будущего и неизвестности', fearEn: 'Fear of the future',
    nameArabic: 'الوَكِيل', nameTranslit: 'Аль-Вакиль', nameMeaning: 'Попечитель всех дел',
    reminderRu: '«Кто уповает на Аллаха — для того Он достаточен» (65:3). Будущее — в руках Попечителя, а не в твоих прогнозах.',
    color: '#06b6d4',
  },
  {
    fearRu: 'Страх потерять близких', fearEn: 'Fear of losing loved ones',
    nameArabic: 'الحَفِيظ', nameTranslit: 'Аль-Хафиз', nameMeaning: 'Хранитель всякой вещи',
    reminderRu: 'Он хранит тех, кого ты любишь, лучше чем ты. Якуб ﷺ отпустил — и Аллах вернул обоих.',
    color: '#3b82f6',
  },
  {
    fearRu: 'Страх одиночества и нелюбленности', fearEn: 'Fear of loneliness',
    nameArabic: 'الوَدُود', nameTranslit: 'Аль-Вадуд', nameMeaning: 'Любящий безусловно',
    reminderRu: 'Аль-Вадуд любит тебя сейчас — не после того, как ты станешь «достаточно хорошим».',
    color: '#ec4899',
  },
  {
    fearRu: 'Страх провала и собственного бессилия', fearEn: 'Fear of failure',
    nameArabic: 'القَادِر', nameTranslit: 'Аль-Кадир', nameMeaning: 'Всемогущий, Исполняющий волю',
    reminderRu: '«Если Аллах помогает вам — никто вас не одолеет» (3:160). Сила не в тебе — она с тобой.',
    color: '#8b5cf6',
  },
  {
    fearRu: 'Страх за здоровье и тело', fearEn: 'Fear about health',
    nameArabic: 'السَّلَام', nameTranslit: 'Ас-Салям', nameMeaning: 'Источник мира и благополучия',
    reminderRu: '«...исцеление от Господа моего» (3:38 — та же милость в 26:80: «а когда заболеваю — Он исцеляет меня»).',
    color: '#10b981',
  },
  {
    fearRu: 'Страх, что блага отберут / не заслужил', fearEn: 'Fear of losing blessings',
    nameArabic: 'الوَهَّاب', nameTranslit: 'Аль-Вахаб', nameMeaning: 'Дарующий без меры и условий',
    reminderRu: '«Что бы Аллах ни даровал из милости — никто не удержит этого» (35:2). Дар не отбирают люди — его даёт Вахаб.',
    color: '#f59e0b',
  },
];

interface HusnulZanModalProps {
  isOpen: boolean;
  onClose: () => void;
  language?: 'ru' | 'en';
}

type Mode = 'paradigm' | 'fearmap';

export const HusnulZanModal: React.FC<HusnulZanModalProps> = ({
  isOpen,
  onClose,
  language = 'ru',
}) => {
  const [mode, setMode] = useState<Mode>('paradigm');

  // Сдвиг парадигмы: сколько строк отозвалось
  const [acceptedLines, setAcceptedLines] = useState<Set<number>>(new Set());

  // Маппер страха
  const [selectedFear, setSelectedFear] = useState<FearMapping | null>(null);
  const [dhikrCount, setDhikrCount] = useState(0);
  const [dhikrDone, setDhikrDone] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setAcceptedLines(new Set());
      setSelectedFear(null);
      setDhikrCount(0);
      setDhikrDone(false);
      setMode('paradigm');
    }
  }, [isOpen]);

  const toggleLine = (idx: number) => {
    triggerHaptic();
    setAcceptedLines(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const tapDhikr = () => {
    if (!selectedFear) return;
    triggerHaptic();
    const next = dhikrCount + 1;
    setDhikrCount(next);
    if (next >= 33 && !dhikrDone) {
      setDhikrDone(true);
      triggerStrongHaptic();
    }
  };

  if (!isOpen) return null;

  const paradigmProgress = Math.round((acceptedLines.size / PARADIGM_LINES.length) * 100);

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
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: 'var(--surface)', border: '1px solid var(--border-subtle)' }}
      >
        {/* Header */}
        <div className="p-5 pb-3 border-b border-borderSubtle shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/15 flex items-center justify-center shrink-0" style={{ border: '1px solid rgba(245,158,11,0.3)' }}>
                <Compass size={17} className="text-amber-500" />
              </div>
              <div>
                <h3 className="text-sm font-black text-textPrimary leading-tight">
                  {language === 'ru' ? 'Хуснуль-Зан' : 'Husnul-Zan'}
                </h3>
                <span className="text-[10px] text-textSecondary">
                  {language === 'ru' ? '«Я таков, каким Мой раб думает обо Мне» (Бухари)' : '"I am as My servant thinks of Me" (Bukhari)'}
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

          {/* Сегменты режимов */}
          <div className="flex bg-surfaceHighlight rounded-xl p-1 gap-1">
            <button
              onClick={() => { setMode('paradigm'); triggerHaptic(); }}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'paradigm' ? 'bg-amber-500 text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <Compass size={12} />
              {language === 'ru' ? 'Сдвиг Парадигмы' : 'Paradigm Shift'}
            </button>
            <button
              onClick={() => { setMode('fearmap'); triggerHaptic(); }}
              className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1.5 transition-all ${
                mode === 'fearmap' ? 'bg-amber-500 text-white shadow-sm' : 'text-textSecondary hover:text-textPrimary'
              }`}
            >
              <ShieldQuestion size={12} />
              {language === 'ru' ? 'Маппер Страха' : 'Fear Mapper'}
            </button>
          </div>
        </div>

        {/* ── РЕЖИМ: СДВИГ ПАРАДИГМЫ ── */}
        {mode === 'paradigm' && (
          <div className="flex-1 overflow-y-auto p-5 pt-3">
            <p className="text-[11px] text-textSecondary italic leading-relaxed mb-4">
              {language === 'ru'
                ? 'Читай медленно, впуская смысл в сердце. Это не аффирмация — это настройка компаса на Истину. Отмечай строку, когда она отзывается.'
                : 'Read slowly, letting the meaning enter the heart. Mark each line when it resonates.'}
            </p>

            <div className="space-y-2">
              {PARADIGM_LINES.map((line, idx) => {
                const accepted = acceptedLines.has(idx);
                return (
                  <button
                    key={idx}
                    onClick={() => toggleLine(idx)}
                    className={`w-full p-3.5 rounded-2xl text-left transition-all flex items-start gap-2.5 ${
                      accepted ? '' : 'hover:shadow-sm'
                    }`}
                    style={{
                      background: accepted ? 'rgba(245,158,11,0.10)' : 'var(--surface-highlight)',
                      border: accepted ? '1px solid rgba(245,158,11,0.35)' : '1px solid var(--border-subtle)',
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full shrink-0 mt-0.5 flex items-center justify-center transition-all"
                      style={{
                        background: accepted ? '#f59e0b' : 'var(--surface)',
                        border: accepted ? 'none' : '1.5px solid var(--border-subtle)',
                      }}
                    >
                      {accepted && <Check size={11} strokeWidth={4} className="text-white" />}
                    </div>
                    <span
                      className={`text-xs leading-relaxed ${
                        line.isName ? 'font-black' : 'font-medium'
                      }`}
                      style={{
                        color: line.isName ? '#f59e0b' : 'var(--text-primary)',
                      }}
                    >
                      {line.text}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Прогресс сонастройки */}
            <div className="mt-4 p-3.5 rounded-2xl" style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}>
              <div className="flex justify-between text-[11px] font-black mb-2">
                <span className="text-textPrimary">
                  {language === 'ru' ? 'Сонастройка сердца' : 'Heart alignment'}
                </span>
                <span className="text-amber-500 tabular-nums">{paradigmProgress}%</span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden bg-surfaceHighlight">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${paradigmProgress}%`, background: 'linear-gradient(90deg, #f59e0b, #fbbf24)' }}
                />
              </div>
              {paradigmProgress === 100 && (
                <p className="text-[10px] text-amber-600 font-bold mt-2">
                  {language === 'ru' ? 'Компас установлен. Альхамдулиллях. 🤲' : 'Compass set. Alhamdulillah. 🤲'}
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── РЕЖИМ: МАППЕР СТРАХА ── */}
        {mode === 'fearmap' && !selectedFear && (
          <div className="flex-1 overflow-y-auto p-5 pt-3">
            <p className="text-[11px] text-textSecondary italic leading-relaxed mb-4">
              {language === 'ru'
                ? 'Когда приходит страх — не анализируй его. Спроси: «В каком Имени Аллаха я сейчас сомневаюсь?» Выбери страх:'
                : 'When fear comes, ask: "In which of Allah\'s Names do I doubt right now?" Pick the fear:'}
            </p>
            <div className="space-y-2">
              {FEAR_MAP.map(fear => (
                <button
                  key={fear.nameTranslit}
                  onClick={() => { setSelectedFear(fear); setDhikrCount(0); setDhikrDone(false); triggerHaptic(); }}
                  className="w-full p-3.5 rounded-2xl flex items-center justify-between gap-3 transition-all hover:shadow-sm"
                  style={{ background: 'var(--surface-highlight)', border: '1px solid var(--border-subtle)' }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className="text-xl leading-none shrink-0"
                      style={{ fontFamily: "'Amiri', serif", color: fear.color }}
                      dir="rtl"
                    >
                      {fear.nameArabic}
                    </span>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-textPrimary truncate">
                        {language === 'ru' ? fear.fearRu : fear.fearEn}
                      </div>
                      <div className="text-[10px] text-textSecondary">
                        {language === 'ru' ? `→ сомнение в ${fear.nameTranslit}` : `→ doubt in ${fear.nameTranslit}`}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-textSecondary opacity-40 shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── МАППЕР: выбран страх → Имя + зикр ×33 ── */}
        {mode === 'fearmap' && selectedFear && (
          <div className="flex-1 overflow-y-auto p-5 pt-3">
            <button
              onClick={() => setSelectedFear(null)}
              className="text-[11px] font-bold text-textSecondary hover:text-textPrimary transition-colors mb-4"
            >
              ← {language === 'ru' ? 'другой страх' : 'other fear'}
            </button>

            <div className="text-center">
              <div
                className="text-5xl mb-3 leading-none"
                style={{ fontFamily: "'Amiri', serif", color: selectedFear.color, textShadow: `0 0 30px ${selectedFear.color}44` }}
                dir="rtl"
              >
                {selectedFear.nameArabic}
              </div>
              <div className="text-xl font-black text-textPrimary">{selectedFear.nameTranslit}</div>
              <div className="text-xs text-textSecondary mb-4">{selectedFear.nameMeaning}</div>

              <div className="p-3.5 rounded-2xl text-left mb-5" style={{ background: `${selectedFear.color}12`, border: `1px solid ${selectedFear.color}33` }}>
                <p className="text-[11px] text-textSecondary leading-relaxed italic">{selectedFear.reminderRu}</p>
              </div>

              {/* Зикр-тап ×33 */}
              {!dhikrDone ? (
                <>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    transition={motionControl}
                    onClick={tapDhikr}
                    className="relative w-52 h-52 mx-auto rounded-full flex flex-col items-center justify-center select-none touch-none"
                    style={{
                      background: `radial-gradient(circle at 50% 35%, ${selectedFear.color}22 0%, ${selectedFear.color}08 60%, transparent 100%)`,
                      border: `2px solid ${selectedFear.color}55`,
                      boxShadow: `0 0 40px ${selectedFear.color}18`,
                    }}
                  >
                    <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                      <circle
                        cx="50" cy="50" r="47" fill="none"
                        stroke={selectedFear.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeDasharray={`${(dhikrCount / 33) * 295.3} 295.3`}
                        style={{ transition: 'stroke-dasharray 0.15s ease-out' }}
                        opacity="0.85"
                      />
                    </svg>
                    <span className="text-4xl font-black tabular-nums" style={{ color: selectedFear.color }}>{dhikrCount}</span>
                    <span className="text-xs font-bold text-textSecondary mt-1">/ 33</span>
                    <span className="text-[9px] text-textSecondary opacity-60 mt-2 px-6 text-center leading-snug">
                      {language === 'ru' ? 'повторяй Имя вслух, тап — счёт' : 'repeat the Name aloud, tap to count'}
                    </span>
                  </motion.button>
                </>
              ) : (
                <motion.div
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  className="p-5 rounded-3xl text-center"
                  style={{ background: `${selectedFear.color}12`, border: `1px solid ${selectedFear.color}44` }}
                >
                  <Check size={28} strokeWidth={3} className="mx-auto mb-2" style={{ color: selectedFear.color }} />
                  <p className="text-sm font-black text-textPrimary mb-1">
                    {language === 'ru' ? '33× — Порог сердца пройден' : '33× — Heart threshold passed'}
                  </p>
                  <p className="text-[11px] text-textSecondary leading-relaxed">
                    {language === 'ru'
                      ? 'Сомнение заменено знанием. «Свет вытесняет тьму» — теперь прими решение ожидать от Аллаха наилучшего.'
                      : 'Doubt replaced with knowledge. Now choose to expect only the best from Allah.'}
                  </p>
                  <div className="flex items-center justify-center gap-1.5 mt-3 text-[10px] font-black" style={{ color: selectedFear.color }}>
                    <Repeat size={11} />
                    {language === 'ru' ? 'Имя повторено 33 раза' : 'Name repeated 33 times'}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default HusnulZanModal;
