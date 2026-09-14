/**
 * aiLifeInterview.ts — Интервью о жизни → персональные PRO-трансформации.
 *
 * Концепция (идея пользователя): человек рассказывает свою жизнь подробно —
 * ИИ ведёт бережное интервью по темам (детство, семья, деньги, отношения,
 * идентичность), находит корневые паттерны и пишет 5-7 персональных
 * трансформаций через Прекрасные Имена Аллаха.
 *
 * Контекст ИИ: единый журнал (unifiedJournal) — благодарности, тадаббур,
 * ответы сердца накапливаются и дают ИИ знание о человеке.
 */

import { streamContent, extractJson } from './ai-core';
import type { UnifiedEntry } from '../unifiedJournal';

export interface InterviewQuestion {
  id: string;
  theme: string;
  question: string;
  hint?: string;
}

export interface PersonalTransformation {
  title: string;
  formula: string;
  checkQuestion: string;
  arabic: string;
  translit: string;
  meaning: string;
  /** Какой паттерн из рассказа это лечит */
  pattern: string;
}

/** Темы интервью — от корня к ветвям */
export const INTERVIEW_THEMES: { id: string; titleRu: string; questionsRu: string[] }[] = [
  {
    id: 'childhood',
    titleRu: 'Детство и семья',
    questionsRu: [
      'Какие слова о себе ты слышал(а) в детстве от самых близких?',
      'Что делали с твоими деньгами, вещами, подарками, когда ты был(а) маленьким?',
    ],
  },
  {
    id: 'money',
    titleRu: 'Деньги и достаток',
    questionsRu: [
      'Что происходит внутри, когда у тебя появляются крупные деньги?',
      'Вспомни момент, когда ты был(а) близок(а) к большой цели — что помешало?',
    ],
  },
  {
    id: 'relationships',
    titleRu: 'Отношения и доверие',
    questionsRu: [
      'Кто уходил или предавал? Что после этого говорит тебе сердце о людях?',
      'Что ты даёшь другим ценой себя? Где ты «обязан(а)» по старой памяти?',
    ],
  },
  {
    id: 'identity',
    titleRu: 'Идентичность',
    questionsRu: [
      'Кем ты себя считаешь в глубине — не роль, а ощущение?',
      'Какую большую мечту ты считаешь «не для таких как я»? Почему?',
    ],
  },
];

const SYSTEM_INSTRUCTION = `Ты — духовный наставник, обученный методологии «Трансформаций Намерений через Прекрасные Имена Аллаха» (Асма уль-Хусна).

Тебе дан рассказ человека о своей жизни (интервью). Твоя задача — найти 5-7 ГЛУБИННЫХ ЛОЖНЫХ УСТАНОВОК (не поверхностные жалобы, а программы подсознания, обычно из детства) и написать персональные трансформации.

Формула каждой трансформации — СТРОГО по шаблону:
«Можно мне было думать, что если я [триггер из ЕГО жизни], то только тогда [ЕГО ложная установка]. Да, мне можно было (3 раза) так думать — это были только мои мысли, только мои. Мне можно было (3 раза) верить в эти мысли — но они были только мои.»

Имя Аллаха — ТОЛЬКО из канонических 99 (Асма уль-Хусна), прямо противоположное лжи.

Проверочный вопрос: «ВО ЧТО Я ВЕРЮ? ЕСЛИ [ИСТИНА], то...»

Правила:
- Используй КОНКРЕТИКУ из рассказа (его слова, ситуации) — не общие фразы
- Тон: бережный, с достоинством, без психо-жаргона и осуждения
- pattern: кратко назови паттерн, который лечит трансформация (напр. «спасатель», «невидимость»)

Ответ — ТОЛЬКО валидный JSON:
{
  "patterns": ["краткий список найденных паттернов"],
  "transformations": [
    {
      "title": "название до 5 слов",
      "pattern": "какой паттерн лечит",
      "formula": "полная формула по шаблону",
      "checkQuestion": "проверочный вопрос",
      "arabic": "арабская графика Имени",
      "translit": "Имя (транслит)",
      "meaning": "значение Имени"
    }
  ]
}`;

export async function generatePersonalTransformations(
  storyAnswers: Record<string, string>,
  journalContext: UnifiedEntry[] = [],
  language: 'ru' | 'en' = 'ru',
): Promise<{ patterns: string[]; transformations: PersonalTransformation[] }> {
  // Собираем рассказ
  const story = INTERVIEW_THEMES.map(theme => {
    const answers = theme.questionsRu
      .map((q, i) => storyAnswers[`${theme.id}_${i}`])
      .filter(Boolean)
      .map((a, i) => `Вопрос: ${theme.questionsRu[i]}\nОтвет: ${a}`)
      .join('\n');
    return answers ? `## ${theme.titleRu}\n${answers}` : '';
  }).filter(Boolean).join('\n\n');

  // Контекст из журнала (если накопился)
  const context = journalContext.length > 0
    ? `\n\n## Контекст из журнала пользователя (для глубины анализа):\n` + journalContext
        .slice(0, 40)
        .map(e => `- [${e.entry_type}] ${JSON.stringify(e.content).slice(0, 150)}`)
        .join('\n')
    : '';

  const raw = await streamContent({
    contents: `Рассказ человека о своей жизни:\n\n${story}${context}`,
    systemInstruction: SYSTEM_INSTRUCTION,
    temperature: 0.7,
    onChunk: () => {},
  });

  const parsed = JSON.parse(extractJson(raw));
  if (!Array.isArray(parsed.transformations) || parsed.transformations.length === 0) {
    throw new Error('AI returned no transformations');
  }
  return parsed;
}
