/**
 * SmartGreeting — умное приветствие на главном экране.
 * Меняется в зависимости от временно́го окна (Тахаджжуд / Фаджр / Духа и т.д.)
 */
import React from 'react';
import { motion } from 'framer-motion';
import { Sun } from 'lucide-react';
import type { SmartGreeting as SmartGreetingType } from '../services/engines';
import { useSolarCountdown } from '../hooks/useSolarCountdown';

interface SmartGreetingProps {
  greeting: SmartGreetingType;
  language: 'ru' | 'en';
  avatarElement?: React.ReactNode;
}

const SmartGreetingComponent: React.FC<SmartGreetingProps> = ({
  greeting,
  language,
  avatarElement,
}) => {
  const text = language === 'ru'
    ? (greeting?.greeting?.ru ?? greeting?.greeting?.en ?? '')
    : (greeting?.greeting?.en ?? greeting?.greeting?.ru ?? '');
  const sub  = language === 'ru'
    ? (greeting?.subtext?.ru  ?? greeting?.subtext?.en  ?? '')
    : (greeting?.subtext?.en  ?? greeting?.subtext?.ru  ?? '');

  // Реальный астрономический обратный отсчёт до следующего окна (Фаджр/Восход/Зухр/Аср/Закат)
  const solar = useSolarCountdown(language);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="flex items-center justify-between px-1 mb-4"
    >
      {/* Текст */}
      <div className="flex-1 min-w-0">
        {/* Баракатный бейдж */}
        {greeting.isBarakah && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full mb-1.5 text-[9px] font-black uppercase tracking-wider"
            style={{
              background: 'linear-gradient(90deg, rgba(251,191,36,0.15), rgba(245,158,11,0.1))',
              border: '1px solid rgba(251,191,36,0.3)',
              color: '#f59e0b',
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>{language === 'ru' ? 'Баракатное время' : 'Blessed Time'}</span>
          </motion.div>
        )}

        <h1
          className="text-xl font-black tracking-tight leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {text}
        </h1>

        <p
          className="text-xs mt-0.5 leading-relaxed"
          style={{ color: 'var(--text-secondary)' }}
        >
          {sub}
        </p>

        {/* Солнечный таймер: реальный отсчёт до следующего циркадного окна */}
        {solar.window && (
          <div
            className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: 'rgba(251, 191, 36, 0.08)',
              border: '1px solid rgba(251, 191, 36, 0.22)',
              color: '#d97706',
            }}
          >
            <Sun size={11} className="animate-pulse" style={{ animationDuration: '3s' }} />
            <span>
              {language === 'ru' ? 'До' : 'Until'} {solar.window.label[language]} ({solar.window.hint[language]}){' '}
              {language === 'ru' ? 'осталось' : 'in'} <span className="tabular-nums">{solar.countdown}</span>
            </span>
            <span className="opacity-60">· {solar.atTime}</span>
          </div>
        )}
      </div>

      {/* Аватар (передаётся снаружи) */}
      {avatarElement && (
        <div className="shrink-0 ml-3">
          {avatarElement}
        </div>
      )}
    </motion.div>
  );
};

export default SmartGreetingComponent;
