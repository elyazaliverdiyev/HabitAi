import { PRO_MODEL, FLASH_MODEL, getAiClient, extractJson } from './ai-core';
import { Habit } from '../../types';
import { VaultAsset } from '../../types/vault';

export interface AIGoalStep {
  id: string;
  order: number;
  title: string;
  description: string;
  difficulty: number; // 1 to 5
  estimatedDays: number;
  category: 'research' | 'financial' | 'habit' | 'action' | 'milestone';
  requiredCapital?: number;
  suggestedHabit?: string;
  isCompleted?: boolean;
  completedAt?: string;
  aiAdvice?: string;
}

export interface AIGoalChainResponse {
  goalTitle: string;
  summary: string;
  totalEstimatedDays: number;
  estimatedCost?: number;
  steps: AIGoalStep[];
  strategicAdvice: string;
}

export const generateGoalChain = async (
  goalText: string,
  context?: {
    habits?: Habit[];
    totalCapital?: number;
    assets?: VaultAsset[];
  },
  language: 'ru' | 'en' = 'ru'
): Promise<AIGoalChainResponse> => {
  const ai = getAiClient();

  const habitsSummary = context?.habits?.map(h => `- ${h.name} (${h.category})`).join('\n') || 'Нет привычек';
  const capitalSummary = context?.totalCapital !== undefined 
    ? `$${context.totalCapital.toLocaleString()}`
    : 'Не указан';

  const prompt = language === 'ru'
    ? `Ты — стратегический ИИ-ассистент и мастер по достижениям сложных целей.
Пользователь хочет достичь цели: "${goalText}".

Контекст пользователя:
- Доступный капитал: ${capitalSummary}
- Текущие привычки пользователя:
${habitsSummary}

Твоя задача — составить ПОШАГОВУЮ ЦЕПОЧКУ СОБЫТИЙ И ДЕЙСТВИЙ (от 5 до 8 шагов) от первого шага до финального результата.

Верни ответ СТРОГО в формате JSON без какого-либо лишнего текста.

Формат JSON:
{
  "goalTitle": "${goalText}",
  "summary": "Краткое вдохновляющее резюме стратегии",
  "totalEstimatedDays": 90,
  "estimatedCost": 5000,
  "steps": [
    {
      "id": "step_1",
      "order": 1,
      "title": "Название шага",
      "description": "Подробное понятное объяснение что конкретно нужно сделать",
      "difficulty": 2,
      "estimatedDays": 7,
      "category": "research", // "research" | "financial" | "habit" | "action" | "milestone"
      "requiredCapital": 0,
      "suggestedHabit": "Рекомендуемая привычка для поддержки шага",
      "aiAdvice": "Совет ИИ по выполнению этого шага"
    }
  ],
  "strategicAdvice": "Главный секрет и ключевой совет для гарантии успеха этой цели"
}`
    : `You are a strategic AI coach for achieving complex goals.
The user wants to achieve: "${goalText}".

User context:
- Available capital: ${capitalSummary}
- Current habits:
${habitsSummary}

Generate a STEP-BY-STEP CHAIN OF EVENTS (5 to 8 steps) from day 1 to final goal achievement.
Return ONLY JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7,
        responseMimeType: "application/json",
      }
    });

    const jsonText = extractJson(response.text || '');
    const data: AIGoalChainResponse = JSON.parse(jsonText);
    
    // Ensure ids and default flags
    data.steps = data.steps.map((step, idx) => ({
      ...step,
      id: step.id || `step_${idx + 1}`,
      order: step.order || idx + 1,
      isCompleted: false
    }));

    return data;
  } catch (error) {
    console.error("AI Goal Chain generation error:", error);
    throw error;
  }
};
