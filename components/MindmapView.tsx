/**
 * MindmapView.tsx — Интерактивная карта связей привычек, идентичности и механизмов HabitAI.
 * 
 * Наглядно визуализирует:
 * - Центральное ядро человека (Фитра)
 * - 4 столпа трансформации (Дух, Тело, Разум, Капитал)
 * - Подключенные привычки с живыми индикаторами выполнения
 * - Активные механизмы и сенсоры
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Heart, Activity, Brain, Coins, Shield, CheckCircle2, ChevronRight, Compass, Droplets, BookOpen, Footprints, Zap, Lock, Eye } from 'lucide-react';
import { Habit, UserIdentity } from '../types';
import { triggerHaptic } from '../utils/helpers';

interface MindmapViewProps {
  habits: Habit[];
  activeIdentity?: UserIdentity;
  language?: 'ru' | 'en';
  onOpenHabit?: (habit: Habit) => void;
  onOpenTransformation?: () => void;
}

export const MindmapView: React.FC<MindmapViewProps> = ({
  habits,
  activeIdentity,
  language = 'ru',
  onOpenHabit,
  onOpenTransformation
}) => {
  const [activeBranch, setActiveBranch] = useState<'all' | 'spirit' | 'body' | 'mind' | 'wealth'>('all');
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // ── ENERGY FLOW: Canvas-граф частиц энергии ─────────────────────────────
  // Частицы летят от привычек, выполненных СЕГОДНЯ, к центральному ядру (Фитре).
  // Источники и цель привязаны к реальным DOM-координатам узлов карты.
  const containerRef = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const habitNodeRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Array<{
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number; color: string; sourceId: string;
  }>>([]);
  const rafRef = useRef<number>(0);

  const todayCompletedCount = habits.filter(h => h.completedDates.includes(todayStr)).length;
  const energyLevel = habits.length > 0 ? Math.round((todayCompletedCount / habits.length) * 100) : 0;

  const registerHabitNode = useCallback((habitId: string, el: HTMLDivElement | null) => {
    if (el) habitNodeRefs.current.set(habitId, el);
    else habitNodeRefs.current.delete(habitId);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    const core = coreRef.current;
    if (!canvas || !container || !core) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const prefersReducedMotion = typeof window !== 'undefined'
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resizeCanvas();

    const BRANCH_COLORS: Record<string, string> = {
      spirit: '#F59E0B', body: '#10B981', mind: '#8B5CF6', wealth: '#3B82F6'
    };

    const branchOfHabit = (habit: Habit): string => {
      for (const b of branches) {
        const lower = (habit.name + ' ' + (habit.category || '')).toLowerCase();
        if (b.keywords.some(kw => lower.includes(kw))) return b.id;
      }
      return 'mind';
    };

    // Квадратичная кривая Безье от источника к ядру — траектория потока энергии
    const bezierPoint = (t: number, p0: {x:number;y:number}, p1: {x:number;y:number}, p2: {x:number;y:number}) => {
      const mt = 1 - t;
      return {
        x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
        y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
      };
    };

    let lastSpawn = 0;
    const SPAWN_INTERVAL = prefersReducedMotion ? 6000 : 900; // мс между появлениями частиц

    const tick = (now: number) => {
      const rect = container.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const coreRect = core.getBoundingClientRect();
      const target = {
        x: coreRect.left + coreRect.width / 2 - rect.left,
        y: coreRect.top + coreRect.height / 2 - rect.top,
      };

      // 1. Сбор активных (выполненных сегодня) источников с реальными координатами
      const sources: Array<{ id: string; x: number; y: number; color: string }> = [];
      habitNodeRefs.current.forEach((el, habitId) => {
        const habit = habits.find(h => h.id === habitId);
        if (!habit || !habit.completedDates.includes(todayStr)) return;
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return; // узел скрыт фильтром
        sources.push({
          id: habitId,
          x: r.left + r.width / 2 - rect.left,
          y: r.top + r.height / 2 - rect.top,
          color: BRANCH_COLORS[branchOfHabit(habit)] || '#8B5CF6',
        });
      });

      // 2. Спавн новой частицы из случайного источника
      if (sources.length > 0 && now - lastSpawn > SPAWN_INTERVAL) {
        lastSpawn = now;
        const src = sources[Math.floor(Math.random() * sources.length)];
        const maxLife = prefersReducedMotion ? 60 : 2400 + Math.random() * 800; // мс полёта
        particlesRef.current.push({
          x: src.x, y: src.y, vx: 0, vy: 0,
          life: 0, maxLife, color: src.color, sourceId: src.id,
        });
        // Держим максимум ~60 частиц, чтобы не грузить слабые устройства
        if (particlesRef.current.length > 60) particlesRef.current.shift();
      }

      const alive: typeof particlesRef.current = [];

      // 3. Движение частиц по кривой к ядру + отрисовка
      for (const p of particlesRef.current) {
        p.life += 16; // ~60 fps
        const srcEl = habitNodeRefs.current.get(p.sourceId);
        let srcPos = { x: p.x, y: p.y };
        if (srcEl) {
          const r = srcEl.getBoundingClientRect();
          if (r.width || r.height) srcPos = { x: r.left + r.width / 2 - rect.left, y: r.top + r.height / 2 - rect.top };
        }

        const t = Math.min(1, p.life / p.maxLife);
        const ease = t * t * (3 - 2 * t); // smoothstep — плавное ускорение/торможение
        // Контрольная точка изгиба — вбок от прямой, чтобы поток выглядел живым
        const ctrl = {
          x: (srcPos.x + target.x) / 2 + (target.y - srcPos.y) * 0.18,
          y: (srcPos.y + target.y) / 2 - (target.x - srcPos.x) * 0.18,
        };
        const pos = bezierPoint(ease, srcPos, ctrl, target);

        const alpha = t < 0.15 ? t / 0.15 : (1 - t) * 0.9 + 0.1;
        const size = 1.8 + Math.sin(t * Math.PI) * 1.4;

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fillStyle = withAlpha(p.color, Math.max(0, alpha * 0.85));
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.fill();
        ctx.shadowBlur = 0;

        if (t < 1) alive.push(p);
        else {
          // Частица достигла ядра — короткая вспышка на ядре
          ctx.beginPath();
          ctx.arc(target.x, target.y, 6, 0, Math.PI * 2);
          ctx.fillStyle = withAlpha(p.color, 0.25);
          ctx.fill();
        }
      }
      particlesRef.current = alive;

      rafRef.current = requestAnimationFrame(tick);
    };

    // hex (#RRGGBB) → rgba(...) строка
    function withAlpha(hex: string, alpha: number): string {
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!m) return `rgba(139, 92, 246, ${alpha})`;
      return `rgba(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)}, ${alpha})`;
    }

    rafRef.current = requestAnimationFrame(tick);
    window.addEventListener('resize', resizeCanvas);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [habits, todayStr, activeBranch]);

  const branches = [
    {
      id: 'spirit',
      title: language === 'ru' ? 'Дух & Намерение' : 'Spirit & Intention',
      icon: Compass,
      color: '#F59E0B',
      desc: language === 'ru' ? 'Ниятъ, 5 Стадий Трансформации, Шукр, Мухасаба' : 'Intention, 5 Stages, Gratitude, Muhasaba',
      keywords: ['намаз', 'молитв', 'ният', 'дуа', 'коран', 'quran', 'prayer', 'духов', 'шукр', 'мухасаба']
    },
    {
      id: 'body',
      title: language === 'ru' ? 'Тело & Биология' : 'Body & Biology',
      icon: Activity,
      color: '#10B981',
      desc: language === 'ru' ? 'Циркадный ритм, Вода, Шаги с датчика, Сон' : 'Circadian phases, Water, Steps, Sleep',
      keywords: ['вод', 'water', 'шаг', 'walk', 'step', 'спорт', 'gym', 'бег', 'сон', 'sleep', 'фитнес']
    },
    {
      id: 'mind',
      title: language === 'ru' ? 'Разум & Знания' : 'Mind & Knowledge',
      icon: Brain,
      color: '#8B5CF6',
      desc: language === 'ru' ? 'Чтение книг, Фокус, AI-анализ привычек' : 'Deep Reading, Focus, AI Analysis',
      keywords: ['книг', 'чита', 'read', 'book', 'фокус', 'focus', 'язык', 'learn', 'курс', 'обучен']
    },
    {
      id: 'wealth',
      title: language === 'ru' ? 'Капитал & Созидание' : 'Wealth & Impact',
      icon: Coins,
      color: '#3B82F6',
      desc: language === 'ru' ? 'Финансовая дисциплина, Vault, Активы' : 'Financial Discipline, Vault, Assets',
      keywords: ['деньг', 'money', 'доход', 'инвест', 'капитал', 'бизнес', 'бюджет', 'wealth']
    }
  ];

  return (
    <div
      ref={containerRef}
      className="p-5 rounded-3xl mb-4 relative overflow-hidden transition-all duration-300"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border-subtle)',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Слой потока энергии: частицы от выполненных привычек к ядру (Фитре) */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
      />

      {/* Header */}
      <div className="relative flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center shadow-sm">
            <Brain size={16} />
          </div>
          <div>
            <h3 className="text-sm font-black text-textPrimary leading-tight">
              {language === 'ru' ? 'Mindmap Трансформации' : 'Transformation Mindmap'}
            </h3>
            <span className="text-[10px] text-textSecondary font-medium">
              {language === 'ru' ? 'Нейронные связи личности и привычек' : 'Neural identity & habit graph'}
            </span>
          </div>
        </div>

        {/* Energy Level Indicator */}
        <div className="flex flex-col items-end gap-1 shrink-0">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full" style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
            <Zap size={10} className="text-emerald-500" />
            <span className="text-[10px] font-black text-emerald-500 tabular-nums">
              {language === 'ru' ? 'Энергия' : 'Energy'} {energyLevel}%
            </span>
          </div>
          <div className="w-20 h-1 rounded-full overflow-hidden bg-surfaceHighlight">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${energyLevel}%`,
                background: 'linear-gradient(90deg, #10B981, #34D399, #6EE7B7)',
              }}
            />
          </div>
        </div>
      </div>

      {/* Branch Filter Pills */}
      <div className="relative flex items-center gap-1 overflow-x-auto max-w-full mb-4 no-scrollbar">
        <button
          onClick={() => setActiveBranch('all')}
          className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all ${
            activeBranch === 'all'
              ? 'bg-brand text-white shadow-sm'
              : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'
          }`}
        >
          {language === 'ru' ? 'Все' : 'All'}
        </button>
        {branches.map(b => (
          <button
            key={b.id}
            onClick={() => setActiveBranch(b.id as any)}
            className={`px-2 py-0.5 rounded-lg text-[9px] font-bold transition-all whitespace-nowrap ${
              activeBranch === b.id
                ? 'text-white shadow-sm'
                : 'bg-surfaceHighlight text-textSecondary hover:text-textPrimary'
            }`}
            style={{
              backgroundColor: activeBranch === b.id ? b.color : undefined
            }}
          >
            {b.title.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Central Core: Fitrah / Identity */}
      <div
        ref={coreRef}
        className="relative p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 via-amber-500/5 to-emerald-500/10 border border-purple-500/20 mb-4 flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-amber-500 flex items-center justify-center text-white shadow-lg">
            <Sparkles size={20} />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase tracking-wider text-purple-400 block">
              {language === 'ru' ? 'Центральное Ядро' : 'Core Identity'}
            </span>
            <h4 className="text-sm font-black text-textPrimary leading-tight">
              {activeIdentity?.targetIdentity || (language === 'ru' ? 'Человек Созидающий (Фитра)' : 'Thriving Creator')}
            </h4>
            <span className="text-[10px] text-textSecondary">
              {habits.length} {language === 'ru' ? 'привычек формируют идентичность' : 'habits shaping your identity'}
              {todayCompletedCount > 0 && (
                <span className="text-emerald-500 font-bold"> · {todayCompletedCount} {language === 'ru' ? 'сегодня питают ядро' : 'feeding the core today'}</span>
              )}
            </span>
          </div>
        </div>

        {onOpenTransformation && (
          <button
            onClick={onOpenTransformation}
            className="px-3 py-1.5 rounded-xl bg-amber-500/20 text-amber-500 hover:bg-amber-500/30 border border-amber-500/30 text-[11px] font-black transition-all flex items-center gap-1 shrink-0"
          >
            <Compass size={13} />
            <span>{language === 'ru' ? '5 Стадий' : '5 Stages'}</span>
          </button>
        )}
      </div>

      {/* 4 Main Identity Branches & Attached Habits */}
      <div className="relative space-y-3">
        {branches
          .filter(b => activeBranch === 'all' || activeBranch === b.id)
          .map((branch) => {
            const attachedHabits = habits.filter(h => {
              const lower = (h.name + ' ' + (h.category || '')).toLowerCase();
              return branch.keywords.some(kw => lower.includes(kw));
            });

            return (
              <div
                key={branch.id}
                className="p-3.5 rounded-2xl bg-surfaceHighlight/40 border border-borderSubtle transition-all"
              >
                {/* Branch Header */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-white shadow-sm"
                      style={{ background: branch.color }}
                    >
                      <branch.icon size={13} />
                    </div>
                    <div>
                      <span className="text-xs font-black text-textPrimary">
                        {branch.title}
                      </span>
                      <span className="text-[9px] text-textSecondary block opacity-75">
                        {branch.desc}
                      </span>
                    </div>
                  </div>

                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: `${branch.color}15`,
                      color: branch.color
                    }}
                  >
                    {attachedHabits.length} {language === 'ru' ? 'привычек' : 'habits'}
                  </span>
                </div>

                {/* Attached Habit Nodes */}
                {attachedHabits.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-borderSubtle/50">
                    {attachedHabits.map((habit) => {
                      const isCompleted = habit.completedDates.includes(todayStr);
                      return (
                        <div
                          key={habit.id}
                          ref={(el) => registerHabitNode(habit.id, el)}
                          onClick={() => onOpenHabit && onOpenHabit(habit)}
                          className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all active:scale-98 ${
                            isCompleted
                              ? 'bg-emerald-500/10 border-emerald-500/30'
                              : 'bg-surface border-borderSubtle hover:border-brand/30'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ background: isCompleted ? '#10B981' : branch.color }}
                            />
                            <span className={`text-xs font-bold truncate ${isCompleted ? 'text-emerald-500' : 'text-textPrimary'}`}>
                              {habit.name}
                            </span>
                          </div>
                          {isCompleted ? (
                            <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                          ) : (
                            <ChevronRight size={12} className="text-textSecondary opacity-40 shrink-0" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-[10px] text-textSecondary italic py-1 pl-1">
                    {language === 'ru' ? 'Нет привычек в этой ветви' : 'No habits connected to this pillar yet'}
                  </div>
                )}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default MindmapView;
