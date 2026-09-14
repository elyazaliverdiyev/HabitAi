
import { generateId } from '../utils/helpers';

// =============================================
// Habit Template System
// =============================================

export interface HabitTemplate {
    name: string;
    nameRu: string;
    icon: string;
    color: string;
    category: string;
    frequency: 'daily' | 'weekly' | 'specific_days';
    frequencyDays?: number[];
    time?: string;
    duration?: number;
    tags?: string[];
    difficulty?: 1 | 2 | 3 | 4 | 5;
    isKeystone?: boolean;
}

export interface TemplatePack {
    id: string;
    name: string;
    nameRu: string;
    emoji: string;
    description: string;
    descriptionRu: string;
    color: string;
    habits: HabitTemplate[];
}

// =============================================
// Template Packs
// =============================================

export const TEMPLATE_PACKS: TemplatePack[] = [
    {
        id: 'morning-routine',
        name: 'Morning Routine',
        nameRu: 'Утренний ритуал',
        emoji: '🌅',
        description: '5 habits to start your day right',
        descriptionRu: '5 привычек для идеального начала дня',
        color: '#f59e0b',
        habits: [
            { name: 'Wake up early', nameRu: 'Ранний подъём', icon: 'sunrise', color: '#f59e0b', category: 'health', frequency: 'daily', time: '06:00', difficulty: 2, isKeystone: true, tags: ['утро'] },
            { name: 'Meditate', nameRu: 'Медитация', icon: 'brain', color: '#8b5cf6', category: 'mindfulness', frequency: 'daily', time: '06:15', duration: 10, difficulty: 1, tags: ['утро', 'осознанность'] },
            { name: 'Exercise', nameRu: 'Зарядка', icon: 'dumbbell', color: '#ef4444', category: 'fitness', frequency: 'daily', time: '06:30', duration: 20, difficulty: 2, tags: ['утро', 'здоровье'] },
            { name: 'Cold shower', nameRu: 'Холодный душ', icon: 'droplets', color: '#06b6d4', category: 'health', frequency: 'daily', time: '07:00', difficulty: 3, tags: ['утро'] },
            { name: 'Journal', nameRu: 'Дневник', icon: 'book-open', color: '#10b981', category: 'mindfulness', frequency: 'daily', time: '07:15', duration: 10, difficulty: 1, tags: ['утро', 'рефлексия'] },
        ],
    },
    {
        id: 'fitness',
        name: 'Fitness & Health',
        nameRu: 'Фитнес и здоровье',
        emoji: '💪',
        description: 'Build a strong, healthy body',
        descriptionRu: 'Построй сильное, здоровое тело',
        color: '#ef4444',
        habits: [
            { name: 'Workout', nameRu: 'Тренировка', icon: 'dumbbell', color: '#ef4444', category: 'fitness', frequency: 'specific_days', frequencyDays: [1, 3, 5], duration: 45, difficulty: 3, isKeystone: true, tags: ['спорт'] },
            { name: 'Drink 2L water', nameRu: 'Пить 2л воды', icon: 'glass-water', color: '#3b82f6', category: 'health', frequency: 'daily', difficulty: 1, tags: ['здоровье'] },
            { name: '10k steps', nameRu: '10к шагов', icon: 'footprints', color: '#10b981', category: 'fitness', frequency: 'daily', difficulty: 2, tags: ['здоровье'] },
            { name: 'Stretch', nameRu: 'Растяжка', icon: 'accessibility', color: '#f59e0b', category: 'fitness', frequency: 'daily', time: '21:00', duration: 15, difficulty: 1, tags: ['спорт'] },
            { name: 'No junk food', nameRu: 'Без фастфуда', icon: 'apple', color: '#22c55e', category: 'nutrition', frequency: 'daily', difficulty: 2, tags: ['здоровье', 'питание'] },
        ],
    },
    {
        id: 'productivity',
        name: 'Productivity',
        nameRu: 'Продуктивность',
        emoji: '🚀',
        description: 'Work smarter, achieve more',
        descriptionRu: 'Работай умнее, достигай больше',
        color: '#6366f1',
        habits: [
            { name: 'Deep work block', nameRu: 'Блок глубокой работы', icon: 'target', color: '#6366f1', category: 'work', frequency: 'daily', time: '09:00', duration: 90, difficulty: 3, isKeystone: true, tags: ['работа'] },
            { name: 'Plan tomorrow', nameRu: 'Планирование на завтра', icon: 'calendar', color: '#8b5cf6', category: 'work', frequency: 'daily', time: '21:00', duration: 10, difficulty: 1, tags: ['работа'] },
            { name: 'Read 20 pages', nameRu: 'Читать 20 страниц', icon: 'book-open', color: '#f59e0b', category: 'learning', frequency: 'daily', time: '20:00', duration: 30, difficulty: 2, tags: ['обучение'] },
            { name: 'No social media until noon', nameRu: 'Без соцсетей до обеда', icon: 'shield', color: '#ef4444', category: 'digital', frequency: 'daily', difficulty: 2, tags: ['цифровой детокс'] },
            { name: 'Weekly review', nameRu: 'Еженедельный обзор', icon: 'clipboard', color: '#10b981', category: 'work', frequency: 'weekly', difficulty: 2, tags: ['работа', 'рефлексия'] },
        ],
    },
    {
        id: 'mindfulness',
        name: 'Mindfulness & Mental',
        nameRu: 'Осознанность и ментальное',
        emoji: '🧘',
        description: 'Inner peace and clarity',
        descriptionRu: 'Внутренний покой и ясность ума',
        color: '#8b5cf6',
        habits: [
            { name: 'Meditate', nameRu: 'Медитация', icon: 'brain', color: '#8b5cf6', category: 'mindfulness', frequency: 'daily', time: '07:00', duration: 15, difficulty: 2, isKeystone: true, tags: ['осознанность'] },
            { name: 'Gratitude journal', nameRu: 'Дневник благодарности', icon: 'heart', color: '#ec4899', category: 'mindfulness', frequency: 'daily', time: '21:30', duration: 5, difficulty: 1, tags: ['рефлексия'] },
            { name: 'Digital detox hour', nameRu: 'Час без экранов', icon: 'wifi-off', color: '#6366f1', category: 'digital', frequency: 'daily', time: '20:00', duration: 60, difficulty: 2, tags: ['цифровой детокс'] },
            { name: 'Walk in nature', nameRu: 'Прогулка на природе', icon: 'trees', color: '#22c55e', category: 'health', frequency: 'specific_days', frequencyDays: [0, 6], duration: 30, difficulty: 1, tags: ['осознанность'] },
            { name: 'Breathwork', nameRu: 'Дыхательные практики', icon: 'wind', color: '#06b6d4', category: 'mindfulness', frequency: 'daily', duration: 5, difficulty: 1, tags: ['осознанность'] },
        ],
    },
    {
        id: 'student',
        name: 'Student Life',
        nameRu: 'Студенческая жизнь',
        emoji: '📚',
        description: 'Ace your studies and more',
        descriptionRu: 'Отличная учёба и не только',
        color: '#3b82f6',
        habits: [
            { name: 'Study session', nameRu: 'Учебная сессия', icon: 'graduation-cap', color: '#3b82f6', category: 'learning', frequency: 'daily', time: '09:00', duration: 60, difficulty: 3, isKeystone: true, tags: ['учёба'] },
            { name: 'Review notes', nameRu: 'Повторить конспекты', icon: 'notebook-pen', color: '#8b5cf6', category: 'learning', frequency: 'daily', time: '19:00', duration: 20, difficulty: 1, tags: ['учёба'] },
            { name: 'Sleep 8 hours', nameRu: 'Спать 8 часов', icon: 'moon', color: '#6366f1', category: 'health', frequency: 'daily', time: '23:00', difficulty: 2, tags: ['здоровье'] },
            { name: 'Language practice', nameRu: 'Практика языка', icon: 'languages', color: '#f59e0b', category: 'learning', frequency: 'daily', duration: 15, difficulty: 2, tags: ['обучение'] },
            { name: 'No procrastination', nameRu: 'Без прокрастинации', icon: 'zap', color: '#ef4444', category: 'work', frequency: 'daily', difficulty: 3, tags: ['дисциплина'] },
        ],
    },
    {
        id: 'minimalist',
        name: 'Minimal Start',
        nameRu: 'Минимальный старт',
        emoji: '✨',
        description: 'Just 3 habits. Start small.',
        descriptionRu: 'Всего 3 привычки. Начни с малого.',
        color: '#10b981',
        habits: [
            { name: 'Drink water', nameRu: 'Пить воду', icon: 'glass-water', color: '#3b82f6', category: 'health', frequency: 'daily', difficulty: 1, tags: ['здоровье'] },
            { name: 'Walk 15 min', nameRu: 'Прогулка 15 мин', icon: 'footprints', color: '#10b981', category: 'fitness', frequency: 'daily', duration: 15, difficulty: 1, isKeystone: true, tags: ['здоровье'] },
            { name: 'Read before bed', nameRu: 'Чтение перед сном', icon: 'book-open', color: '#f59e0b', category: 'learning', frequency: 'daily', time: '22:00', duration: 15, difficulty: 1, tags: ['обучение'] },
        ],
    },
];

// =============================================
// Utility: Convert template to Habit
// =============================================

export const templateToHabit = (template: HabitTemplate, language: 'ru' | 'en'): any => ({
    id: generateId(),
    type: 'habit' as const,
    name: language === 'ru' ? template.nameRu : template.name,
    color: template.color,
    icon: template.icon,
    completedDates: [],
    createdAt: new Date().toISOString().split('T')[0],
    category: template.category,
    frequency: template.frequency,
    frequencyDays: template.frequencyDays,
    time: template.time,
    duration: template.duration,
    tags: template.tags,
    difficulty: template.difficulty,
    isKeystone: template.isKeystone,
});

export const packToHabits = (pack: TemplatePack, language: 'ru' | 'en') =>
    pack.habits.map(t => templateToHabit(t, language));
