/**
 * CollapsibleCard — компактная сворачиваемая секция в Apple-стиле.
 *
 * Решает проблему: главный экран занимают крупные виджеты (Mindmap,
 * Dot Matrix, слайдер состояния), которые нужны эпизодически.
 * В свёрнутом виде — одна строка с заголовком и краткой сводкой.
 *
 * - Состояние запоминается в localStorage (по ключу секции).
 * - Анимация раскрытия — токен motionSheet из единой системы.
 * - Шеврон поворачивается, контент плавно разворачивается.
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { motionSheet } from '../utils/motionPresets';
import { triggerHaptic } from '../utils/helpers';

interface CollapsibleCardProps {
  /** Уникальный ключ для запоминания состояния (напр. 'mindmap') */
  storageKey: string;
  /** Заголовок секции */
  title: string;
  /** Краткая сводка в свёрнутом виде (напр. «3 из 7 выполнено») */
  collapsedSummary?: string;
  /** Иконка слева (ReactNode) */
  icon?: React.ReactNode;
  /** По умолчанию: свёрнута или развёрнута */
  defaultCollapsed?: boolean;
  children: React.ReactNode;
  language?: 'ru' | 'en';
}

export const CollapsibleCard: React.FC<CollapsibleCardProps> = ({
  storageKey,
  title,
  collapsedSummary,
  icon,
  defaultCollapsed = false,
  children,
  language = 'ru',
}) => {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultCollapsed;
    const saved = localStorage.getItem(`habitai_collapsed_${storageKey}`);
    return saved === null ? defaultCollapsed : saved === 'true';
  });

  const toggle = () => {
    triggerHaptic();
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(`habitai_collapsed_${storageKey}`, String(next));
  };

  return (
    <div
      className="rounded-3xl mb-3 relative overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Шапка — всегда видна, кликабельна */}
      <button
        onClick={toggle}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
        aria-expanded={!collapsed}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {icon}
          <div className="min-w-0">
            <span className="text-sm font-black text-textPrimary block leading-tight truncate">
              {title}
            </span>
            {collapsed && collapsedSummary && (
              <span className="text-[10px] text-textSecondary block truncate">
                {collapsedSummary}
              </span>
            )}
          </div>
        </div>
        <motion.div
          animate={{ rotate: collapsed ? 0 : 180 }}
          transition={motionSheet}
          className="shrink-0 w-6 h-6 rounded-full bg-surfaceHighlight flex items-center justify-center text-textSecondary"
        >
          <ChevronDown size={13} />
        </motion.div>
      </button>

      {/* Контент */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={motionSheet}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CollapsibleCard;
