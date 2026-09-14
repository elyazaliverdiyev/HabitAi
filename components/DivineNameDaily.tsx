/**
 * DivineNameDaily — Имя Аллаха дня.
 *
 * Философия приложения: за каждым невыполненным действием стоит страх,
 * а страх — от Шайтана (2:268). Против страха — упование на Аллаха
 * через Его Прекрасные Имена: изучать, действовать, развиваться.
 *
 * Имя дня — детерминированный цикл по всем 99 Имён (asmaulHusna.ts):
 * каждый день новое, полный круг — за 99 дней. Практика дня и аят
 * подбираются по духовной группе Имени.
 */
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, BookOpen } from 'lucide-react';
import { motionContainer } from '../utils/motionPresets';
import { triggerHaptic } from '../utils/helpers';
import { getNameOfDay, GROUP_META, GROUP_ICONS } from '../services/asmaulHusnaHelpers';

/** Аяты упования по духовным группам Имён */
const GROUP_AYAT: Record<string, { ru: string; en: string }> = {
  mercy: { ru: '«Моя милость объемлет всякую вещь» (7:156)', en: '"My mercy encompasses all things" (7:156)' },
  power: { ru: '«Если Аллах помогает вам — никто вас не одолеет» (3:160)', en: '"If Allah helps you, none can overcome you" (3:160)' },
  oneness: { ru: '«Разве Аллах не достаточен для Своего раба?» (39:36)', en: '"Is Allah not sufficient for His servant?" (39:36)' },
  creator: { ru: '«Мы сотворили человека в наилучшем образе» (95:4)', en: '"We created man in the best of forms" (95:4)' },
  sustainer: { ru: '«Нет на земле существа, которого Аллах не кормил бы» (11:6)', en: '"There is no creature on earth but that upon Allah is its provision" (11:6)' },
  knowledge: { ru: '«Аллах знает, а вы не знаете» (2:216)', en: '"Allah knows, and you know not" (2:216)' },
  justice: { ru: '«Воистину, Аллах не поступает несправедливо» (3:182)', en: '"Indeed, Allah does not wrong" (3:182)' },
  protection: { ru: '«Разве Он — не Хранитель каждой вещи?» (34:21 — тафсир 11:57)', en: '"Is He not the Guardian of all things?"' },
};

/** Практика дня по группам */
const GROUP_PRACTICE: Record<string, { ru: string; en: string }> = {
  mercy: { ru: 'Сегодня: прими Его милость — она уже объяла тебя. Сделай шаг, который «не заслужил».', en: 'Today: receive His mercy — it already surrounds you. Take the step you felt you didn\'t deserve.' },
  power: { ru: 'Сегодня: назови вслух свою беспомощность — и Его силу над ней. Действуй из Его мощи.', en: 'Today: name your helplessness — and His power over it. Act from His might.' },
  oneness: { ru: 'Сегодня: отпусти мнение одного человека, чьё одобрение тебя держит. Владыка — один.', en: 'Today: release one person\'s approval that holds you. The King is One.' },
  creator: { ru: 'Сегодня: посмотри в зеркало и скажи «ма ша Аллах» — без единой критики к дизайну Творца.', en: 'Today: look in the mirror and say "ma sha Allah" — zero criticism of the Designer\'s work.' },
  sustainer: { ru: 'Сегодня: сделай шаг к доходу, который «страшно начать». Ризк уже записан.', en: 'Today: take the income step you feared. Rizq is already written.' },
  knowledge: { ru: 'Сегодня: там где не знаешь — скажи «Аллах знает» и действуй без суеты ума.', en: 'Today: where you don\'t know — say "Allah knows" and act without mental noise.' },
  justice: { ru: 'Сегодня: отпусти одну обиду. Судья справедлив — тебе останется твоё.', en: 'Today: release one grudge. The Judge is just — what\'s yours will reach you.' },
  protection: { ru: 'Сегодня: назови вслух то, что боишься потерять — и вверь это Хранителю.', en: 'Today: name what you fear losing — entrust it to the Guardian.' },
};

interface DivineNameDailyProps {
  language: 'ru' | 'en';
  /** Открыть полную библиотеку 99 Имён */
  onOpenLibrary?: () => void;
  /** Открыть зикр-счётчик (тасбих) */
  onOpenDhikr?: () => void;
  /** Открыть Хуснуль-Зан (Сдвиг Парадигмы / Маппер Страха) */
  onOpenHusnulZan?: () => void;
  /** Открыть полную библиотеку трансформаций */
  onOpenTransformation?: () => void;
}

export const DivineNameDaily: React.FC<DivineNameDailyProps> = ({
  language,
  onOpenLibrary,
  onOpenDhikr,
  onOpenHusnulZan,
  onOpenTransformation,
}) => {
  const nameOfDay = getNameOfDay(new Date());
  const group = GROUP_META[nameOfDay.group];
  const [expanded, setExpanded] = useState(false);

  const L = (field: { ru: string; en: string }) => field[language];
  const ayat = GROUP_AYAT[nameOfDay.group] || GROUP_AYAT.oneness;
  const practice = GROUP_PRACTICE[nameOfDay.group] || GROUP_PRACTICE.oneness;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={motionContainer}
      className="rounded-3xl mb-3 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, rgba(245,158,11,0.10) 0%, rgba(180,120,20,0.05) 100%)',
        border: '1px solid rgba(245,158,11,0.25)',
      }}
    >
      {/* Тонкое золотое свечение */}
      <div
        className="breathe-glow absolute top-0 left-1/3 right-1/3 h-20 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center top, #f59e0b 0%, transparent 70%)' }}
      />

      <div className="p-4 relative">
        {/* Заголовок */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/80">
            {language === 'ru' ? 'Имя Аллаха дня' : 'Divine Name of the Day'} · {nameOfDay.n}/99
          </span>
          <div className="flex items-center gap-0.5">
            {onOpenHusnulZan && (
              <button
                onClick={() => { onOpenHusnulZan(); triggerHaptic(); }}
                className="flex items-center gap-1 px-2.5 min-h-[36px] rounded-lg text-[9px] font-black text-amber-600 hover:bg-amber-500/10 active:bg-amber-500/20 transition-colors"
                title={language === 'ru' ? 'Хуснуль-Зан: «Я таков, каким Мой раб думает обо Мне»' : 'Husnul-Zan: paradigm shift & fear mapper'}
              >
                ✨ {language === 'ru' ? 'Хуснуль-Зан' : 'Husnul-Zan'}
              </button>
            )}
            {onOpenDhikr && (
              <button
                onClick={() => { onOpenDhikr(); triggerHaptic(); }}
                className="flex items-center gap-1 px-2.5 min-h-[36px] rounded-lg text-[9px] font-black text-emerald-600 hover:bg-emerald-500/10 active:bg-emerald-500/20 transition-colors"
                title={language === 'ru' ? 'Зикр-счётчик (тасбих 33/33/34)' : 'Dhikr counter (tasbih)'}
              >
                <span style={{ fontFamily: "'Amiri', serif" }}>ﷲ</span>
                {language === 'ru' ? 'Тасбих' : 'Tasbih'}
              </button>
            )}
            {onOpenLibrary && (
              <button
                onClick={() => { onOpenLibrary(); triggerHaptic(); }}
                className="flex items-center gap-1 px-2.5 min-h-[36px] rounded-lg text-[9px] font-black text-amber-600 hover:bg-amber-500/10 active:bg-amber-500/20 transition-colors"
                title={language === 'ru' ? 'Библиотека 99 Имён' : 'Library of 99 Names'}
              >
                <BookOpen size={10} />
                {language === 'ru' ? '99 Имён' : '99 Names'}
              </button>
            )}
            <Sparkles size={12} className="text-amber-500/60 ml-1" />
          </div>
        </div>

        {/* Арабская каллиграфия + имя */}
        <div className="flex items-center gap-3 mb-2">
          <span
            className="text-3xl leading-none"
            style={{
              fontFamily: "'Amiri', 'Scheherazade New', serif",
              color: '#fbbf24',
              textShadow: '0 0 20px rgba(251,191,36,0.3)',
            }}
            dir="rtl"
          >
            {nameOfDay.arabic}
          </span>
          <div className="min-w-0">
            <div className="text-sm font-black text-amber-600">{nameOfDay.translit}</div>
            <div className="text-[11px] text-textSecondary leading-snug">{nameOfDay.meaning}</div>
          </div>
        </div>

        {/* Группа-путь */}
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold mb-2" style={{ background: `${group.color}18`, color: group.color }}>
          {(() => { const GI = GROUP_ICONS[nameOfDay.group]; return <GI size={10} strokeWidth={2.5} />; })()}
          {language === 'ru' ? group.titleRu : group.titleEn}
        </div>

        {/* Раскрытие: аят + практика */}
        {expanded ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="overflow-hidden"
          >
            <div className="mt-2 pt-2 border-t border-amber-500/15 space-y-2">
              <p className="text-[11px] text-textSecondary italic leading-relaxed">{L(ayat)}</p>
              <div
                className="p-2.5 rounded-xl"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)' }}
              >
                <div className="text-[9px] font-black uppercase tracking-wider text-amber-500 mb-1">
                  {language === 'ru' ? 'Практика дня' : 'Today\'s practice'}
                </div>
                <p className="text-xs text-textPrimary leading-relaxed font-medium">{L(practice)}</p>
              </div>
            </div>
          </motion.div>
        ) : null}

        {/* Действия */}
        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => { setExpanded(!expanded); triggerHaptic(); }}
            className="text-[10px] font-bold text-amber-600 hover:text-amber-500 transition-colors"
          >
            {expanded
              ? (language === 'ru' ? 'Свернуть' : 'Collapse')
              : (language === 'ru' ? 'Аят и практика дня →' : 'Ayah & practice →')}
          </button>
          {onOpenTransformation && (
            <button
              onClick={onOpenTransformation}
              className="ml-auto text-[10px] font-bold text-textSecondary hover:text-amber-600 transition-colors"
            >
              {language === 'ru' ? 'Трансформация намерения →' : 'Transform intention →'}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default DivineNameDaily;
