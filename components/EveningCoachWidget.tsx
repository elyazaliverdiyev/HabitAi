import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Moon, TrendingUp, Target, ChevronDown, ChevronUp, Flame } from 'lucide-react';
import { Habit, getCurrentStreak } from '../types';
import { getLocalDateString } from '../utils/helpers';

interface EveningCoachWidgetProps {
  habits: Habit[];
  language: 'ru' | 'en';
  accentColor: string;
  apiKey?: string;
  isPro: boolean;
  onUpgrade?: () => void;
}

interface DayReport {
  score: number;
  headline: string;
  bestHabit: string;
  needsWork: string;
  insight: string;
  tomorrowFocus: string;
}

// ---------------------------------------------------------------
// Generate day report using Gemini
// ---------------------------------------------------------------
const generateReport = async (
  habits: Habit[],
  language: 'ru' | 'en',
  apiKey: string
): Promise<DayReport> => {
  const todayStr = getLocalDateString();
  const done = habits.filter(h => h.completedDates.includes(todayStr));
  const missed = habits.filter(h => !h.completedDates.includes(todayStr));
  const score = habits.length > 0 ? Math.round((done.length / habits.length) * 100) : 0;

  const prompt = language === 'ru'
    ? `Ты AI коуч по привычкам. Проанализируй день пользователя и дай честную, мотивирующую оценку.
    
Выполнено (${done.length}): ${done.map(h => h.name).join(', ') || 'ничего'}
Не выполнено (${missed.length}): ${missed.map(h => h.name).join(', ') || 'ничего'}
Лучший стрик: ${Math.max(0, ...habits.map(h => getCurrentStreak(h)))} дней

Ответь строго в JSON формате:
{
  "headline": "одна фраза-оценка дня (макс 8 слов, без знаков препинания кроме !)",
  "bestHabit": "${done.length > 0 ? 'название лучшей привычки дня' : 'мотивирующая фраза для завтра'}",
  "needsWork": "${missed.length > 0 ? 'название привычки требующей внимания' : 'все отлично'}",
  "insight": "глубокое наблюдение об их прогрессе (1-2 предложения, без банальностей)",
  "tomorrowFocus": "одна конкретная рекомендация на завтра (1 предложение)"
}`
    : `You are an AI habit coach. Analyze the user's day and give an honest, motivating assessment.

Completed (${done.length}): ${done.map(h => h.name).join(', ') || 'nothing'}
Missed (${missed.length}): ${missed.map(h => h.name).join(', ') || 'nothing'}
Best streak: ${Math.max(0, ...habits.map(h => getCurrentStreak(h)))} days

Reply strictly in JSON format:
{
  "headline": "one-phrase day assessment (max 8 words, no punctuation except !)",
  "bestHabit": "${done.length > 0 ? 'best habit name of the day' : 'motivating phrase for tomorrow'}",
  "needsWork": "${missed.length > 0 ? 'habit needing attention' : 'all great'}",
  "insight": "deep observation about their progress (1-2 sentences, no clichés)",
  "tomorrowFocus": "one specific recommendation for tomorrow (1 sentence)"
}`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
      })
    }
  );

  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in response');

  const parsed = JSON.parse(jsonMatch[0]);
  return {
    score,
    headline: parsed.headline || (language === 'ru' ? 'Хороший день!' : 'Good day!'),
    bestHabit: parsed.bestHabit || '',
    needsWork: parsed.needsWork || '',
    insight: parsed.insight || '',
    tomorrowFocus: parsed.tomorrowFocus || '',
  };
};

// ---------------------------------------------------------------
// Score ring component
// ---------------------------------------------------------------
const ScoreRing: React.FC<{ score: number; accent: string }> = ({ score, accent }) => {
  const size = 64;
  const stroke = 8;
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  const uid = React.useRef(`sr-${Math.random().toString(36).slice(2)}`).current;

  const colorA = score >= 80 ? '#34D399' : score >= 50 ? accent : '#F87171';
  const colorB = score >= 80 ? '#6EE7B7' : score >= 50 ? accent + 'bb' : '#FCA5A5';

  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${uid}-g`} gradientUnits="userSpaceOnUse"
            x1={size / 2} y1={0} x2={0} y2={size}>
            <stop offset="0%"   stopColor={colorA} />
            <stop offset="100%" stopColor={colorB} />
          </linearGradient>
        </defs>
        {/* Track */}
        <circle cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`${colorA}18`} strokeWidth={stroke} strokeLinecap="round" />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#${uid}-g)`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: circ - filled }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 8px ${colorA}80)` }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexDirection: 'column',
      }}>
        <span style={{ fontSize: 15, fontWeight: 900, color: '#fff', lineHeight: 1 }}>
          {score}
        </span>
        <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>
          pts
        </span>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------
// Main widget
// ---------------------------------------------------------------
const EveningCoachWidget: React.FC<EveningCoachWidgetProps> = ({
  habits,
  language,
  accentColor,
  apiKey,
  isPro,
  onUpgrade,
}) => {
  const [report, setReport] = useState<DayReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(true);

  const hour = new Date().getHours();
  const isEvening = hour >= 17; // Show from 5pm

  const handleGenerate = useCallback(async () => {
    if (!apiKey) {
      setError(language === 'ru' ? 'API ключ не настроен' : 'API key not set');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await generateReport(habits, language, apiKey);
      setReport(result);
    } catch (e) {
      setError(language === 'ru' ? 'Ошибка генерации. Попробуй ещё раз' : 'Generation error. Try again');
    } finally {
      setLoading(false);
    }
  }, [habits, language, apiKey]);

  const todayStr = getLocalDateString();
  const done = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const total = habits.length;
  const score = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{
        borderRadius: 20,
        overflow: 'hidden',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(40px) saturate(1.8)',
        WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%',
          padding: '14px 16px',
          display: 'flex', alignItems: 'center', gap: 10,
          background: 'none', border: 'none', cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        <div style={{
          width: 32, height: 32, borderRadius: 10,
          background: `linear-gradient(135deg, ${accentColor}40, ${accentColor}20)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}>
          <Moon size={16} color={accentColor} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-primary)' }}>
            {language === 'ru' ? 'AI Разбор дня' : 'AI Day Review'}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginTop: 1 }}>
            {isEvening
              ? (language === 'ru' ? 'Подведём итоги вечера' : 'Let\'s wrap up the evening')
              : (language === 'ru' ? 'Доступно с 17:00' : 'Available from 5pm')}
          </div>
        </div>
        <div style={{ color: 'var(--text-secondary)' }}>
          {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </div>
      </button>

      {/* Content */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 16px 16px' }}>
              {/* Quick score row */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px',
                borderRadius: 12,
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                marginBottom: 12,
              }}>
                <ScoreRing score={score} accent={accentColor} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                    {done}/{total} {language === 'ru' ? 'привычек выполнено' : 'habits done'}
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {habits.slice(0, 4).map(h => {
                      const isDone = h.completedDates.includes(todayStr);
                      const streak = getCurrentStreak(h);
                      return (
                        <div key={h.id} style={{
                          display: 'flex', alignItems: 'center', gap: 3,
                          padding: '2px 7px', borderRadius: 6,
                          background: isDone ? `${accentColor}22` : 'rgba(255,255,255,0.04)',
                          border: `1px solid ${isDone ? accentColor + '40' : 'rgba(255,255,255,0.06)'}`,
                          fontSize: 10, fontWeight: 600,
                          color: isDone ? accentColor : 'var(--text-secondary)',
                        }}>
                          {isDone ? '✓' : '○'} {h.name.slice(0, 10)}
                          {streak >= 3 && <span style={{ color: '#f97316' }}>🔥{streak}</span>}
                        </div>
                      );
                    })}
                    {habits.length > 4 && (
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', padding: '2px 7px' }}>
                        +{habits.length - 4}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Report content */}
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      gap: 10, padding: '20px 0',
                    }}
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                    >
                      <Sparkles size={18} color={accentColor} />
                    </motion.div>
                    <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                      {language === 'ru' ? 'AI анализирует день...' : 'AI is analyzing your day...'}
                    </span>
                  </motion.div>
                ) : report ? (
                  <motion.div
                    key="report"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ display: 'flex', flexDirection: 'column', gap: 10 }}
                  >
                    {/* Headline */}
                    <div style={{
                      padding: '12px 14px',
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${accentColor}15, ${accentColor}08)`,
                      border: `1px solid ${accentColor}25`,
                    }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
                        {report.headline}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {report.insight}
                      </div>
                    </div>

                    {/* Best / Needs work */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {report.bestHabit && (
                        <div style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: 'rgba(74,222,128,0.08)',
                          border: '1px solid rgba(74,222,128,0.2)',
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#4ade80', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {language === 'ru' ? '🏆 Лучшее' : '🏆 Best'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {report.bestHabit}
                          </div>
                        </div>
                      )}
                      {report.needsWork && report.needsWork !== 'все отлично' && report.needsWork !== 'all great' && (
                        <div style={{
                          padding: '10px 12px', borderRadius: 10,
                          background: 'rgba(248,113,113,0.08)',
                          border: '1px solid rgba(248,113,113,0.2)',
                        }}>
                          <div style={{ fontSize: 9, fontWeight: 700, color: '#f87171', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {language === 'ru' ? '💪 Работаем' : '💪 Work on'}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)' }}>
                            {report.needsWork}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Tomorrow focus */}
                    {report.tomorrowFocus && (
                      <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: 10,
                        padding: '10px 12px', borderRadius: 10,
                        background: 'rgba(255,255,255,0.03)',
                        border: '1px solid rgba(255,255,255,0.06)',
                      }}>
                        <Target size={14} color={accentColor} style={{ flexShrink: 0, marginTop: 2 }} />
                        <div>
                          <div style={{ fontSize: 9, fontWeight: 700, color: accentColor, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                            {language === 'ru' ? 'Фокус на завтра' : 'Tomorrow\'s Focus'}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-primary)', lineHeight: 1.4 }}>
                            {report.tomorrowFocus}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Regenerate */}
                    <button
                      onClick={handleGenerate}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        padding: '8px',
                        borderRadius: 10,
                        background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        color: 'var(--text-secondary)',
                        fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      }}
                    >
                      <Sparkles size={12} />
                      {language === 'ru' ? 'Обновить анализ' : 'Refresh analysis'}
                    </button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="cta"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error && (
                      <div style={{
                        padding: '8px 12px', borderRadius: 8, marginBottom: 10,
                        background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)',
                        fontSize: 11, color: '#f87171',
                      }}>
                        {error}
                      </div>
                    )}

                    {!isPro ? (
                      <div style={{ textAlign: 'center', padding: '12px 0' }}>
                        <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 10 }}>
                          {language === 'ru' ? 'AI разбор дня доступен в Pro' : 'AI day review available in Pro'}
                        </div>
                        <button
                          onClick={onUpgrade}
                          style={{
                            padding: '10px 20px', borderRadius: 12,
                            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
                            color: '#fff', fontWeight: 700, fontSize: 12,
                            border: 'none', cursor: 'pointer',
                            boxShadow: `0 4px 16px ${accentColor}44`,
                          }}
                        >
                          ✨ {language === 'ru' ? 'Получить Pro' : 'Get Pro'}
                        </button>
                      </div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={handleGenerate}
                        disabled={!isEvening}
                        style={{
                          width: '100%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          padding: '13px',
                          borderRadius: 12,
                          background: isEvening
                            ? `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`
                            : 'rgba(255,255,255,0.04)',
                          color: isEvening ? '#fff' : 'var(--text-secondary)',
                          fontWeight: 700, fontSize: 13,
                          border: isEvening ? 'none' : '1px solid rgba(255,255,255,0.08)',
                          cursor: isEvening ? 'pointer' : 'not-allowed',
                          boxShadow: isEvening ? `0 4px 20px ${accentColor}44` : 'none',
                          opacity: isEvening ? 1 : 0.6,
                        }}
                      >
                        <Sparkles size={15} />
                        {language === 'ru' ? 'Разобрать день с AI' : 'Analyze day with AI'}
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default EveningCoachWidget;
