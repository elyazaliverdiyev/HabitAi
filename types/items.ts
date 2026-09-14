// ===== SUB-ITEMS, KANBAN, PHOTO JOURNAL =====

export interface PhotoEntry {
  id: string;
  date: string;
  note?: string;
  imageData: string;
  createdAt: string;
}

export interface SubItemNote {
  id: string;
  content: string;
  emoji?: string;
  createdAt: string;
  imageUrl?: string;
  imageCaption?: string;
}

export interface ChecklistItem {
  id: string;
  text: string;
  done: boolean;
  order?: number;
}

export interface SubItem {
  id: string;
  name: string;
  status: 'queued' | 'active' | 'done';
  progress?: number;
  notes: SubItemNote[];
  createdAt: string;
  checklist?: ChecklistItem[];
  children?: SubItem[];
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  linkUrl?: string;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  order: number;
}

// ===== HABIT NETWORK GRAPH =====

export interface HabitConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: 'triggers' | 'enables' | 'blocks' | 'related';
  strength: number;
}

export const CONNECTION_TYPES = {
  triggers: { label: { ru: 'Запускает', en: 'Triggers' }, color: '#22c55e' },
  enables: { label: { ru: 'Помогает', en: 'Enables' }, color: '#3b82f6' },
  blocks: { label: { ru: 'Мешает', en: 'Blocks' }, color: '#ef4444' },
  related: { label: { ru: 'Связано', en: 'Related' }, color: '#a855f7' },
} as const;
