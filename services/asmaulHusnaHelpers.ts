/**
 * asmaulHusnaHelpers.ts — Переэкспорт данных + Lucide-иконки путей.
 *
 * Иконки живут отдельно от asmaulHusna.ts (чистые данные без React),
 * чтобы любой компонент мог импортировать их без циклических зависимостей.
 * Правило дизайн-системы: эмодзи ≠ иконки — только SVG (Lucide).
 */
import { Heart, Zap, Crown, Palette, Wheat, BookOpen, Scale, Shield } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { DivineNameGroup } from './asmaulHusna';

export { getNameOfDay, GROUP_META, ASMA_UL_HUSNA } from './asmaulHusna';
export type { DivineNameGroup, DivineNameEntry } from './asmaulHusna';

/** SVG-иконки духовных путей 99 Имён */
export const GROUP_ICONS: Record<DivineNameGroup, LucideIcon> = {
  mercy: Heart,
  power: Zap,
  oneness: Crown,
  creator: Palette,
  sustainer: Wheat,
  knowledge: BookOpen,
  justice: Scale,
  protection: Shield,
};
