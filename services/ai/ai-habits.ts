
import { Type, FLASH_MODEL, PRO_MODEL, getAiClient, extractJson, callCloudFunction } from './ai-core';
import { Habit, HabitAnalysis, FocusRecommendation } from '../../types';

export const generateHabitSuggestions = async (goal: string, language: 'ru' | 'en' = 'ru'): Promise<Array<{
  name: string,
  description: string,
  icon: string,
  category: string,
  frequency: 'daily' | 'weekly' | 'monthly',
  targetCount: number
}>> => {
  try {
    // Try Cloud Functions first
    const cfResult = await callCloudFunction<any[]>('generateSuggestions', { goal, language });
    if (cfResult) return cfResult;

    const ai = getAiClient();
    const langInstruction = language === 'ru' ? "Respond strictly in Russian language." : "Respond strictly in English language.";

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `User goal: "${goal}". ${langInstruction}
      Suggest 3 distinct, actionable habits to achieve this. 
      Also determine the best category, frequency, and target count per frequency.
      Ensure 'name', 'description', and 'category' are in ${language === 'ru' ? 'Russian' : 'English'}.
      Return valid JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Short, punchy habit name (max 20 chars)" },
              description: { type: Type.STRING, description: "Brief motivation why (max 50 chars)" },
              icon: { type: Type.STRING, description: "Best icon match from Lucide library or similar" },
              category: { type: Type.STRING, description: "Category name" },
              frequency: { type: Type.STRING, enum: ["daily", "weekly", "monthly"] },
              targetCount: { type: Type.NUMBER, description: "Numeric target (e.g. 1 for once a day, 2 liters, 10 pages)" }
            },
            required: ["name", "description", "icon", "category", "frequency", "targetCount"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    try {
      return JSON.parse(extractJson(text));
    } catch (e) {
      console.warn("Failed to parse AI JSON for suggestions", e);
      const errTitle = language === 'ru' ? "Ошибка AI" : "AI Error";
      const errDesc = language === 'ru' ? "Попробуйте еще раз" : "Try again";
      const catDefault = language === 'ru' ? "Другое" : "Other";
      return [{ name: errTitle, description: errDesc, icon: "Zap", category: catDefault, frequency: "daily", targetCount: 1 }];
    }
  } catch (error) {
    console.error("AI Suggestion Error:", error);
    return [];
  }
};

export const analyzeHabits = async (habits: Habit[], suggestionCount: number = 3, language: 'ru' | 'en' = 'ru'): Promise<HabitAnalysis | null> => {
  // Defensive check: ensure habits is a valid array
  if (!habits || !Array.isArray(habits) || habits.length === 0) return null;

  // Helper to generate visual history string for the last 14 days
  const today = new Date();
  const getHistoryString = (completedDates: string[]) => {
    let str = "";
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      str += completedDates.includes(dateStr) ? "✅" : "⬜";
    }
    return str;
  }

  // Prepare detailed data for AI
  const habitsData = habits.map(h => ({
    name: h.name,
    historyLast14Days: getHistoryString(h.completedDates),
    totalCompletions: h.completedDates.length,
    tags: h.tags || [],
    category: h.category
  }));

  // Build chain summary (habits grouped by shared tags)
  const tagGroups: Record<string, string[]> = {};
  habits.filter(h => !h.archived && h.type !== 'task' && h.tags && h.tags.length > 0).forEach(h => {
    h.tags!.forEach(tag => {
      if (!tagGroups[tag]) tagGroups[tag] = [];
      tagGroups[tag].push(h.name);
    });
  });
  const chains = Object.entries(tagGroups).filter(([, names]) => names.length >= 2);
  const chainSummary = chains.length > 0
    ? `\n\nHABIT CHAINS (tag-based routines):\n${chains.map(([tag, names]) => `- "${tag}": ${names.join(' → ')}`).join('\n')}`
    : '';

  try {
    // Try Cloud Functions first
    const cfResult = await callCloudFunction<HabitAnalysis>('analyzeHabits', { habitsData, chainSummary, suggestionCount, language });
    if (cfResult) return cfResult;

    const ai = getAiClient();
    const langInstruction = language === 'ru'
      ? "Respond strictly in Russian language. All output fields must be in Russian."
      : "Respond strictly in English language. All output fields must be in English.";

    const response = await ai.models.generateContent({
      model: PRO_MODEL, // Upgraded to Pro for better reasoning
      contents: `You are a Wise and Philosophical Habit Coach (inspired by Stoicism, Marcus Aurelius, and modern psychology).
      Your tone should be profound, encouraging, empathetic, but firm on discipline. Avoid slang. Use metaphors.
      ${langInstruction}
      
      Analyze these habits and their recent 14-day history (⬜=miss, ✅=done). 
      Data: ${JSON.stringify(habitsData)}.${chainSummary}
      
      Instructions:
      1. Analyze their consistency, paying attention to tags and habit chains.
      2. Provide a deep, motivational message that speaks to their character and potential.
      3. Provide a list of exactly ${suggestionCount} distinct, wise, actionable suggestions to improve. Consider chain synergy and tag patterns. Ensure the array has exactly ${suggestionCount} items.

      Return JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            overallScore: { type: Type.NUMBER, description: "Score from 0 to 100 based on consistency" },
            streakAnalysis: { type: Type.STRING, description: "Analysis of their streaks and gaps." },
            motivationalMessage: { type: Type.STRING, description: "A wise, philosophical quote or message tailored to them." },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: `${suggestionCount} specific, wise tips.`
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return null;

    try {
      return JSON.parse(extractJson(text));
    } catch (e) {
      console.warn("Failed to parse AI JSON for analysis", e);
      return null;
    }
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return null;
  }
};

// --- CONTEXTUAL ENGINE ---
export const getSmartFocusRecommendation = async (
  pendingHabits: Habit[],
  context: { energy: number; timeAvailable: number; timeOfDay: string },
  language: 'ru' | 'en'
): Promise<FocusRecommendation | null> => {
  try {
    // Try Cloud Functions first
    const cfResult = await callCloudFunction<FocusRecommendation>('getSmartFocus', { habitsList: pendingHabits.map(h => ({ id: h.id, name: h.name, category: h.category, duration: h.duration || 30, priority: h.type === 'task' ? 'High' : 'Normal' })), context, language });
    if (cfResult) return cfResult;

    const ai = getAiClient();
    const langInstruction = language === 'ru' ? "Response must be in Russian." : "Response must be in English.";

    // Convert energy number to semantic description
    let energyDesc = "Neutral";
    if (context.energy < 40) energyDesc = "Low / Tired / Zombie Mode";
    else if (context.energy > 70) energyDesc = "High / Energetic / God Mode";

    const habitsList = pendingHabits.map(h => ({
      id: h.id,
      name: h.name,
      category: h.category,
      duration: h.duration || 30, // Default to 30 if undefined
      priority: h.type === 'task' ? 'High' : 'Normal'
    }));

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: `
        Act as an Advanced Executive Function Assistant. The user is overwhelmed.
        
        USER CONTEXT:
        - Energy Level: ${energyDesc} (${context.energy}%)
        - Time Available: ${context.timeAvailable} minutes
        - Time of Day: ${context.timeOfDay}
        
        PENDING TASKS/HABITS:
        ${JSON.stringify(habitsList)}
        
        INSTRUCTIONS:
        1. Select the SINGLE best task/habit to do RIGHT NOW.
        2. Logic:
           - If Energy is Low, pick something easy, quick, or restorative (Health/Mindfulness).
           - If Energy is High, pick the hardest/most complex task (Career/Learning).
           - If Time is short, pick a short task.
           - If NO tasks fit, suggest a restorative break (actionType: 'rest').
        
        ${langInstruction}
        
        Return JSON.
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            habitId: { type: Type.STRING, description: "The ID of the selected habit. Null if suggesting a generic break." },
            reasoning: { type: Type.STRING, description: "Short, punchy reason why this is the best choice now. (Max 15 words)" },
            estimatedDuration: { type: Type.NUMBER, description: "Duration in minutes." },
            matchScore: { type: Type.NUMBER, description: "0-100 how well this fits the context." },
            actionType: { type: Type.STRING, enum: ['do', 'rest', 'plan'] },
            customTitle: { type: Type.STRING, description: "Title to display if suggesting a break or generic action (e.g. 'Power Nap')." }
          },
          required: ['habitId', 'reasoning', 'actionType']
        }
      }
    });

    const text = response.text;
    if (!text) return null;
    return JSON.parse(extractJson(text));

  } catch (error) {
    console.error("AI Focus Error:", error);
    return null;
  }
};

// --- HABIT CONNECTION SUGGESTIONS ---
export const suggestHabitConnections = async (
  habits: Habit[],
  existingConnections: Array<{ sourceId: string; targetId: string }>,
  language: 'ru' | 'en' = 'ru'
): Promise<Array<{
  sourceId: string;
  targetId: string;
  type: 'triggers' | 'enables' | 'blocks' | 'related';
  reasoning: string;
}>> => {
  // Defensive check: ensure habits is a valid array
  if (!habits || !Array.isArray(habits) || habits.length < 2) return [];

  try {
    const ai = getAiClient();
    const langInstruction = language === 'ru'
      ? "Respond in Russian."
      : "Respond in English.";

    const habitList = habits.map(h => ({
      id: h.id,
      name: h.name,
      category: h.category,
      type: h.type,
      frequency: h.frequency
    }));

    const existingPairs = existingConnections.map(c => `${c.sourceId}->${c.targetId}`);

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `You are analyzing habits to find logical connections.
            
HABITS:
${JSON.stringify(habitList, null, 2)}

EXISTING CONNECTIONS (avoid duplicates):
${existingPairs.join(', ')}

Find up to 5 NEW logical connections between these habits.
Connection types:
- triggers: Doing A naturally leads to doing B (e.g., "Morning Run" triggers "Cold Shower")
- enables: A helps succeed at B (e.g., "Good Sleep" enables "Focus Work")
- blocks: A interferes with B (e.g., "Late Night Gaming" blocks "Early Wake")
- related: General correlation (same category, complementary)

${langInstruction}
Return JSON array.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              sourceId: { type: Type.STRING, description: "ID of source habit" },
              targetId: { type: Type.STRING, description: "ID of target habit" },
              type: { type: Type.STRING, enum: ['triggers', 'enables', 'blocks', 'related'] },
              reasoning: { type: Type.STRING, description: "Short explanation (10 words max)" }
            },
            required: ['sourceId', 'targetId', 'type', 'reasoning']
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];

    const suggestions = JSON.parse(extractJson(text));

    // Filter out any that reference non-existent habits
    const habitIds = new Set(habits.map(h => h.id));
    return suggestions.filter((s: any) =>
      habitIds.has(s.sourceId) &&
      habitIds.has(s.targetId) &&
      s.sourceId !== s.targetId
    );

  } catch (e) {
    console.error("AI Connection Suggestion Error", e);
    return [];
  }
}

/**
 * Analyze correlations between habits using AI
 * Now includes SubItems, Notes, and Extensions (books, supplements, skincare)
 */
export const analyzeHabitCorrelations = async (
  habits: any[],
  language: 'ru' | 'en' = 'ru'
): Promise<string> => {
  try {
    const ai = getAiClient();

    // Prepare comprehensive data representation for the AI
    const habitsData = habits.map(h => ({
      name: h.name,
      category: h.category,
      completionsCount: h.completedDates?.length || 0,
      recentDates: h.completedDates?.slice(-15) || [], // Last 15 completions
      difficulty: h.difficulty,
      isKeystone: h.isKeystone,
      cost: h.cost,
      tags: h.tags || [],

      // === SubItems data (tasks, notes, checklists) ===
      subItems: h.items?.map((item: any) => ({
        name: item.name,
        status: item.status, // 'queued' | 'active' | 'done'
        progress: item.progress || 0,
        notesCount: item.notes?.length || 0,
        recentNotes: item.notes?.slice(-3).map((n: any) => n.content?.slice(0, 100)) || [],
        checklistProgress: item.checklist
          ? `${item.checklist.filter((c: any) => c.done).length}/${item.checklist.length}`
          : null
      })) || [],

      // === Extensions data (books, supplements, skincare) ===
      extensions: h.extension ? {
        type: h.extension.type,
        books: h.extension.data?.books?.map((b: any) => ({
          title: b.title,
          author: b.author,
          progress: `${b.currentPage}/${b.totalPages} (${Math.round((b.currentPage / Math.max(b.totalPages, 1)) * 100)}%)`,
          status: b.status,
          notes: b.notes?.slice(0, 100) || null
        })) || [],
        supplements: h.extension.data?.supplements?.map((s: any) => ({
          name: s.name,
          dosage: s.dosage,
          frequency: s.frequency
        })) || [],
        skincare: h.extension.data?.skincare?.map((sk: any) => ({
          name: sk.name,
          type: sk.type,
          routine: sk.routine
        })) || []
      } : null
    }));

    const prompt = language === 'ru'
      ? `Ты — ведущий аналитик данных и поведенческий психолог. 
Проанализируй данные о привычках пользователя и найди СКРЫТЫЕ КОРРЕЛЯЦИИ и ВЗАИМОСВЯЗИ.

ДАННЫЕ (в формате JSON):
${JSON.stringify(habitsData, null, 2)}

НАПИШИ АНАЛИЗ (4-5 абзацев):
1. **СИНЕРГИЯ**: Какие привычки усиливают друг друга? (например, после Спорта чаще выполняется Обучение).
2. **УЗКОЕ МЕСТО**: Какая категория или привычка "проседает" и тянет остальные вниз?
3. **ЦЕПОЧКИ И ТЕГИ**: Проанализируй тег-группы (привычки с одинаковыми тегами образуют "цепочки"). Насколько эффективны эти рутины? Есть ли привычки, которым нужен тег для лучшего структурирования?
4. **ЭКОНОМИЧЕСКИЙ ИНСАЙТ**: Если есть данные о затратах, как они влияют на стабильность?
5. **АНАЛИЗ ПОДЗАДАЧ И ЗАМЕТОК**: Проанализируй прогресс по subItems. Какие паттерны видны в заметках пользователя?
6. **АНАЛИЗ РАСШИРЕНИЙ**: Если есть данные о книгах — какой прогресс чтения? Если есть добавки или уходовые процедуры — насколько последователен пользователь?
7. **СОВЕТ МАСТЕРА**: Одно не очевидное действие по Принципу Парето.

ВАЖНО: Пиши на русском языке, будь конкретным, обращайся на "ты". 
ОБЯЗАТЕЛЬНО: Текст должен быть логически завершенным. Никогда не обрывай предложение на середине. Каждое начатое предложение должно закончиться точкой.
СТИЛЬ: Профессиональный, но вдохновляющий. Начни сразу с инсайтов (без слов "Вот твой анализ").`
      : `You are a lead data analyst and behavioral psychologist. 
Analyze the user's habit data and find HIDDEN CORRELATIONS and INSIGHTS.

DATA:
${JSON.stringify(habitsData, null, 2)}

WRITE AN ANALYSIS (4-5 paragraphs):
1. **SYNERGY**: Which habits reinforce each other?
2. **BOTTLENECK**: Which category or habit is dragging the others down?
3. **CHAINS & TAGS**: Analyze tag-groups (habits sharing tags form "chains"/routines). How effective are these routines? Are there habits that need tags for better structure?
4. **ECONOMIC INSIGHT**: If cost data is present, how does it affect consistency?
5. **SUBTASKS & NOTES ANALYSIS**: Analyze the subItems progress and note patterns.
6. **EXTENSIONS ANALYSIS**: If there's book data — what does the reading progress suggest? If there are supplements or skincare routines — how consistent is the user?
7. **MASTER TIP**: One non-obvious Pareto Principle action.

IMPORTANT: Write in English. Text MUST be logically complete. Do not stop mid-sentence.
STYLE: Professional yet inspiring. Start directly with the insights.`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL, // Upgrade to Pro for better reasoning and fewer truncations
      contents: prompt,
      config: {
        temperature: 0.7
        // No maxOutputTokens limit - let the model respond fully
      }
    });

    const text = response.text?.trim() || (language === 'ru' ? 'Не удалось провести анализ.' : 'Could not perform analysis.');

    // Comprehensive safety check for incomplete responses
    const endsWithTerminal = /[.!?]$|["']$|\.?\n$/.test(text);
    if (text.length > 300 && !endsWithTerminal) {
      console.warn('AI analysis might be truncated:', text.slice(-50));
    }

    return text;
  } catch (error) {
    console.error("AI Correlation Error:", error);
    throw error;
  }
};
