// ===== MIND MOVIE - FUTURE SELF VISUALIZATION =====

export interface UserIdentity {
  id: string;
  targetIdentity: string;
  futureImageUrl?: string;
  qualities: string[];
  affirmation?: string;
  createdAt: string;
  lastViewedAt?: string;
}

export const IDENTITY_PRESETS: {
  id: string;
  emoji: string;
  label: { ru: string; en: string };
  qualities: { ru: string[]; en: string[] };
  affirmation: { ru: string; en: string };
}[] = [
    {
      id: 'athlete', emoji: '🏃',
      label: { ru: 'Атлет', en: 'Athlete' },
      qualities: { ru: ['Дисциплина', 'Выносливость', 'Сила'], en: ['Discipline', 'Endurance', 'Strength'] },
      affirmation: { ru: 'Я становлюсь сильнее каждый день', en: 'I become stronger every day' }
    },
    {
      id: 'reader', emoji: '📚',
      label: { ru: 'Читатель', en: 'Reader' },
      qualities: { ru: ['Мудрость', 'Любопытство', 'Фокус'], en: ['Wisdom', 'Curiosity', 'Focus'] },
      affirmation: { ru: 'Знания — моя суперсила', en: 'Knowledge is my superpower' }
    },
    {
      id: 'entrepreneur', emoji: '🚀',
      label: { ru: 'Предприниматель', en: 'Entrepreneur' },
      qualities: { ru: ['Решительность', 'Креативность', 'Упорство'], en: ['Decisiveness', 'Creativity', 'Persistence'] },
      affirmation: { ru: 'Я создаю свою реальность', en: 'I create my own reality' }
    },
    {
      id: 'mindful', emoji: '🧘',
      label: { ru: 'Осознанный', en: 'Mindful' },
      qualities: { ru: ['Спокойствие', 'Присутствие', 'Благодарность'], en: ['Calm', 'Presence', 'Gratitude'] },
      affirmation: { ru: 'Я выбираю покой в каждый момент', en: 'I choose peace in every moment' }
    },
    {
      id: 'creator', emoji: '🎨',
      label: { ru: 'Творец', en: 'Creator' },
      qualities: { ru: ['Креативность', 'Смелость', 'Аутентичность'], en: ['Creativity', 'Courage', 'Authenticity'] },
      affirmation: { ru: 'Мои идеи ценны и уникальны', en: 'My ideas are valuable and unique' }
    },
    {
      id: 'leader', emoji: '👑',
      label: { ru: 'Лидер', en: 'Leader' },
      qualities: { ru: ['Ответственность', 'Эмпатия', 'Видение'], en: ['Responsibility', 'Empathy', 'Vision'] },
      affirmation: { ru: 'Я вдохновляю других своим примером', en: 'I inspire others by my example' }
    }
  ];
