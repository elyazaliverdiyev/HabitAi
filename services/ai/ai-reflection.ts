
import { Type, FLASH_MODEL, getAiClient, extractJson } from './ai-core';
import { Habit } from '../../types';

// --- AFFIRMATION GENERATOR ---
export const generateAffirmations = async (
  identityId: string,
  identityLabel: string,
  qualities: string[],
  language: 'ru' | 'en' = 'ru'
): Promise<string[]> => {
  try {
    const ai = getAiClient();
    const langInstruction = language === 'ru'
      ? "Respond strictly in Russian language. All affirmations must be in Russian."
      : "Respond strictly in English language. All affirmations must be in English.";

    const qualitiesStr = qualities.join(', ');

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `You are creating powerful, personalized affirmations for someone who wants to become: "${identityLabel}".
      
Their chosen qualities: ${qualitiesStr}

${langInstruction}

Generate 8 unique, inspiring affirmations that:
1. Start with "Я" (I am / I...) to be personal
2. Are positive and present-tense (as if already achieved)
3. Relate to the identity and qualities
4. Are 5-15 words each
5. Feel authentic and motivating, not generic
6. Vary in style: some action-oriented, some belief-oriented, some gratitude-oriented

Return JSON array of strings only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const affirmations = JSON.parse(extractJson(text));
    return Array.isArray(affirmations) ? affirmations : [];
  } catch (error) {
    console.error("AI Affirmation Generation Error:", error);
    return [];
  }
};

/**
 * Generate a follow-up question for deep reflection session
 * Uses PRO model for deeper psychological insight
 */
export const generateReflectionFollowUp = async (
  conversation: Array<{ role: 'ai' | 'user'; content: string }>,
  isLastQuestion: boolean,
  language: 'ru' | 'en' = 'ru'
): Promise<string> => {
  try {
    const ai = getAiClient();

    const conversationText = conversation.map(m =>
      m.role === 'ai' ? `Коуч: "${m.content}"` : `Человек: "${m.content}"`
    ).join('\n');

    const prompt = language === 'ru'
      ? `Ты — опытный психолог-коуч, ведущий глубокую сессию рефлексии.
 
 КОНТЕКСТ ДИАЛОГА:
 ${conversationText}
 
 ТВОЯ ЗАДАЧА:
 ${isLastQuestion
        ? 'Это ПОСЛЕДНИЙ вопрос сессии. Задай мощный завершающий вопрос, который:\n- Объединит все темы разговора\n- Поможет осознать главный инсайт\n- Подведёт к конкретному действию или решению'
        : 'Задай ОДИН глубокий follow-up вопрос:\n- Копай глубже в то, что человек сказал\n- Ищи скрытые эмоции, страхи, желания\n- Помоги увидеть паттерны в его мышлении\n- Используй конкретные слова из его ответа'}
 
 ВАЖНО:
 - Отвечай ТОЛЬКО вопросом.
 - НИКОГДА не обрывай вопрос на середине или на знаке тире.
 - Твой ответ ДОЛЖЕН быть полным грамматически законченным предложением, заканчивающимся на знаке вопроса (?).
 - Будь проницательным но тёплым.
 - Минимум 15 слов в вопросе, чтобы он был глубоким.`
      : `You are an experienced psychology coach leading a deep reflection session.
 
 DIALOGUE CONTEXT:
 ${conversationText}
 
 YOUR TASK:
 ${isLastQuestion
        ? 'This is the LAST question. Ask a powerful closing question that:\n- Unifies all conversation themes\n- Helps realize the main insight\n- Leads to a concrete action or decision'
        : 'Ask ONE deep follow-up question:\n- Dig deeper into what the person said\n- Look for hidden emotions, fears, desires\n- Help see patterns in their thinking\n- Use specific words from their answer'}
 
 IMPORTANT:
 - Respond with ONLY the question.
 - NEVER truncate your response or end with a dash.
 - Your response MUST be a complete, grammatically finished sentence ending with a question mark (?).
 - Be insightful but warm.
 - At least 15 words to ensure depth.`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        temperature: 0.85
        // No maxOutputTokens limit - let the model respond fully
      }
    });

    console.log('Reflection API response:', JSON.stringify(response).slice(0, 200));

    const text = response.text?.trim();
    if (!text) {
      console.error('Empty text from response:', response);
      throw new Error('Empty response');
    }

    // Clean up any quotes or formatting
    return text.replace(/^["']|["']$/g, '').replace(/^\*\*|\*\*$/g, '');
  } catch (error) {
    console.error("AI Reflection Follow-up Error:", error);
    throw error;
  }
};

/**
 * Generate final insight/analysis for a reflection session
 * Uses PRO model for comprehensive psychological analysis
 */
export const generateReflectionInsight = async (
  conversation: Array<{ role: 'ai' | 'user'; content: string }>,
  language: 'ru' | 'en' = 'ru'
): Promise<string> => {
  try {
    const ai = getAiClient();

    const conversationText = conversation.map((m, i) => {
      if (m.role === 'ai') {
        return `ВОПРОС ${Math.floor(i / 2) + 1}: ${m.content}`;
      } else {
        return `ОТВЕТ: ${m.content}`;
      }
    }).join('\n\n');

    const prompt = language === 'ru'
      ? `Ты — мудрый психолог-коуч. Проанализируй эту сессию глубокой рефлексии и дай персональный инсайт.

ПОЛНАЯ СЕССИЯ:
${conversationText}

НАПИШИ ГЛУБОКИЙ АНАЛИЗ (от 5 до 10 предложений):

1. **СКРЫТЫЙ ПАТТЕРН**: Выяви паттерн или тему, которую человек может не осознавать. Что связывает все его ответы?

2. **ЭМОЦИОНАЛЬНАЯ СУТЬ**: Какие глубинные эмоции или потребности стоят за его словами?

3. **КЛЮЧЕВОЙ ИНСАЙТ**: Дай один мощный инсайт, который может изменить его восприятие ситуации.

4. **КОНКРЕТНАЯ РЕКОМЕНДАЦИЯ**: Предложи одно конкретное действие или эксперимент на ближайшие дни.

5. **ВДОХНОВЛЯЮЩАЯ МЫСЛЬ**: Заверши чем-то ободряющим, что даст силы.

 ВАЖНО:
 - Отвечай СТРОГО полным и законченным текстом.
 - НИКОГДА не обрывай предложение на середине.
 - Убедись, что последний пункт (Вдохновляющая мысль) написан и завершен точкой.


СТИЛЬ:
- Пиши тепло, как заботливый наставник
- Обращайся на "ты"  
- Начни сразу с анализа, без вступлений
- Будь конкретным, используй слова из ответов человека`
      : `You are a wise psychology coach. Analyze this deep reflection session and provide a personal insight.

FULL SESSION:
${conversationText}

WRITE A DEEP ANALYSIS (up to 10 sentences):

1. **HIDDEN PATTERN**: Reveal a pattern or theme the person might not be aware of. What connects all their answers?

2. **EMOTIONAL CORE**: What deep emotions or needs are behind their words?

3. **KEY INSIGHT**: Give one powerful insight that could shift their perception.

4. **CONCRETE RECOMMENDATION**: Suggest one specific action or experiment for the coming days.

5. **INSPIRING THOUGHT**: End with something encouraging that gives strength.

 IMPORTANT:
 - Respond with a STRICTLY complete and finished text.
 - NEVER truncate a sentence in the middle.
 - Ensure the final point (Inspiring thought) is written and ends with a period.


STYLE:
- Write warmly, like a caring mentor
- Start directly with analysis, no preambles
- Be specific, use words from the person's answers`;

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: prompt,
      config: {
        temperature: 0.8
        // No maxOutputTokens limit - let the model respond fully
      }
    });

    console.log('Reflection Insight API response:', JSON.stringify(response).slice(0, 300));

    const text = response.text?.trim();
    if (!text) throw new Error('Empty response');

    // Double check for abrupt endings
    if (text.endsWith('...') || text.endsWith('-') || text.endsWith('паттер')) {
      console.warn('Possible truncation detected in insight:', text);
    }

    return text;
  } catch (error) {
    console.error("AI Reflection Insight Error:", error);
    throw error;
  }
};

// ===== EVENING REVIEW =====
export interface EveningReviewData {
  score: number;           // 0-100 day score
  emoji: string;           // Day mood emoji
  headline: string;        // One-line summary
  wins: string[];          // What went well (2-3)
  improvements: string[];  // What to improve (1-2)
  tomorrowTip: string;     // Actionable tip for tomorrow
  streakHighlight?: string; // Notable streak achievement
}

export const generateEveningReview = async (
  habits: Habit[],
  language: 'ru' | 'en' = 'ru'
): Promise<EveningReviewData | null> => {
  try {
    const ai = getAiClient();
    const todayStr = new Date().toISOString().split('T')[0];
    const langInstruction = language === 'ru'
      ? "Respond strictly in Russian."
      : "Respond strictly in English.";

    const habitsData = habits.filter(h => !h.archived).map(h => ({
      name: h.name,
      completedToday: h.completedDates.includes(todayStr),
      streak: h.completedDates.length,
      category: h.category,
      tags: h.tags || [],
    }));

    const completed = habitsData.filter(h => h.completedToday).length;
    const total = habitsData.length;

    // Build chain info
    const tagGroups: Record<string, { total: number; done: number }> = {};
    habitsData.forEach(h => {
      h.tags.forEach((tag: string) => {
        if (!tagGroups[tag]) tagGroups[tag] = { total: 0, done: 0 };
        tagGroups[tag].total++;
        if (h.completedToday) tagGroups[tag].done++;
      });
    });
    const chainInfo = Object.entries(tagGroups).filter(([, v]) => v.total >= 2)
      .map(([tag, v]) => `"${tag}": ${v.done}/${v.total} done`).join(', ');
    const chainLine = chainInfo ? `\n- Chains today: ${chainInfo}` : '';

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `You are a warm, insightful evening coach. Review the user's day.
      
${langInstruction}

TODAY'S DATA:
- Completed: ${completed}/${total} habits${chainLine}
- Details: ${JSON.stringify(habitsData)}

Generate an evening review. Be warm, specific, and encouraging.
Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Day score 0-100" },
            emoji: { type: Type.STRING, description: "Single emoji representing the day mood" },
            headline: { type: Type.STRING, description: "One catchy line summarizing the day (max 10 words)" },
            wins: { type: Type.ARRAY, items: { type: Type.STRING }, description: "2-3 things that went well" },
            improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "1-2 gentle suggestions" },
            tomorrowTip: { type: Type.STRING, description: "One actionable tip for tomorrow (max 15 words)" },
            streakHighlight: { type: Type.STRING, description: "Notable streak if any (max 10 words)" },
          },
          required: ['score', 'emoji', 'headline', 'wins', 'improvements', 'tomorrowTip']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(extractJson(text));
  } catch (error) {
    console.error("Evening Review Error:", error);
    return null;
  }
};

// ===== STREAK RISK ALERT =====
export interface StreakRiskData {
  atRiskHabits: Array<{
    name: string;
    currentStreak: number;
    riskLevel: 'high' | 'medium';
    message: string;
  }>;
  urgentMessage: string;
}

export const generateStreakRiskAlert = async (
  habits: Habit[],
  language: 'ru' | 'en' = 'ru'
): Promise<StreakRiskData | null> => {
  try {
    const todayStr = new Date().toISOString().split('T')[0];
    // Find habits with streaks that haven't been completed today
    const atRisk = habits.filter(h => {
      if (h.archived || h.type === 'task') return false;
      if (h.completedDates.includes(todayStr)) return false;
      // Has a streak of 3+ days
      const sorted = [...h.completedDates].sort().reverse();
      if (sorted.length < 3) return false;
      // Check yesterday was completed
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      return sorted.includes(yesterdayStr);
    });

    if (atRisk.length === 0) return null;

    const ai = getAiClient();
    const langInstruction = language === 'ru'
      ? "Respond strictly in Russian."
      : "Respond strictly in English.";

    const riskData = atRisk.map(h => ({
      name: h.name,
      streakDays: h.completedDates.length,
      category: h.category,
      tags: h.tags || [],
    }));

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `These habits have active streaks but haven't been completed today. Generate a motivational alert.
      
${langInstruction}

AT-RISK HABITS: ${JSON.stringify(riskData)}

Be urgent but supportive. Make the user feel the stakes without being negative.
Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            atRiskHabits: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  currentStreak: { type: Type.NUMBER },
                  riskLevel: { type: Type.STRING, enum: ['high', 'medium'] },
                  message: { type: Type.STRING, description: "Short motivational message (max 10 words)" },
                },
                required: ['name', 'currentStreak', 'riskLevel', 'message']
              }
            },
            urgentMessage: { type: Type.STRING, description: "Overall urgent message (max 20 words)" },
          },
          required: ['atRiskHabits', 'urgentMessage']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(extractJson(text));
  } catch (error) {
    console.error("Streak Risk Error:", error);
    return null;
  }
};

// ===== AI DAILY MOTIVATIONAL CARD =====
export const generateDailyMotivation = async (
  completionRate: number,
  topStreak: number,
  language: 'ru' | 'en' = 'ru'
): Promise<{ quote: string; author: string; emoji: string } | null> => {
  try {
    const ai = getAiClient();
    const langInstruction = language === 'ru'
      ? "Respond strictly in Russian."
      : "Respond strictly in English.";

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Generate a personalized motivational quote for someone tracking habits.
      
${langInstruction}

Context: Their completion rate is ${completionRate}% and top streak is ${topStreak} days.
${completionRate < 30 ? "They're struggling. Be extra encouraging." : ""}
${completionRate > 80 ? "They're doing amazing. Challenge them to go further." : ""}
${topStreak > 30 ? "Their consistency is legendary. Acknowledge it." : ""}

Make the quote feel personal, not generic. Can be from a real figure or original.
Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            quote: { type: Type.STRING, description: "The motivational quote (max 20 words)" },
            author: { type: Type.STRING, description: "Attribution (real person or 'HabitAI')" },
            emoji: { type: Type.STRING, description: "Single emoji matching the mood" },
          },
          required: ['quote', 'author', 'emoji']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(extractJson(text));
  } catch (error) {
    console.error("Daily Motivation Error:", error);
    return null;
  }
};
