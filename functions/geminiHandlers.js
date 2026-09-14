const { GoogleGenAI, Type } = require("@google/genai");

// Models
const FLASH_MODEL = "gemini-3-flash-preview";
const PRO_MODEL = "gemini-3-pro-preview";

// Get AI client with server-side key
const getAiClient = (apiKey) => {
  return new GoogleGenAI({ apiKey });
};

// Extract JSON from possibly markdown-wrapped response
const extractJson = (text) => {
  if (!text) return "";
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) return codeBlockMatch[1].trim();

  const firstOpenBrace = text.indexOf("{");
  const firstOpenBracket = text.indexOf("[");
  let firstOpen = -1;
  let isArray = false;

  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
    if (firstOpenBrace < firstOpenBracket) { firstOpen = firstOpenBrace; }
    else { firstOpen = firstOpenBracket; isArray = true; }
  } else if (firstOpenBrace !== -1) { firstOpen = firstOpenBrace; }
  else if (firstOpenBracket !== -1) { firstOpen = firstOpenBracket; isArray = true; }

  if (firstOpen !== -1) {
    const lastClose = text.lastIndexOf(isArray ? "]" : "}");
    if (lastClose !== -1 && lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
    }
  }
  return text.trim();
};

// ===== HANDLERS =====

async function generateSuggestions(ai, payload) {
  const { goal, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "Respond strictly in Russian language." : "Respond strictly in English language.";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `User goal: "${goal}". ${langInstruction}
      Suggest 3 distinct, actionable habits to achieve this. 
      Also determine the best category, frequency, and target count per frequency.
      Ensure 'name', 'description', and 'category' are in ${language === "ru" ? "Russian" : "English"}.
      Return valid JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            description: { type: Type.STRING },
            icon: { type: Type.STRING },
            category: { type: Type.STRING },
            frequency: { type: Type.STRING, enum: ["daily", "weekly", "monthly"] },
            targetCount: { type: Type.NUMBER },
          },
          required: ["name", "description", "icon", "category", "frequency", "targetCount"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(extractJson(text));
}

async function analyzeHabits(ai, payload) {
  const { habitsData, chainSummary = "", suggestionCount = 3, language = "ru" } = payload;
  const langInstruction = language === "ru"
    ? "Respond strictly in Russian language. All output fields must be in Russian."
    : "Respond strictly in English language. All output fields must be in English.";

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `You are a Wise and Philosophical Habit Coach (inspired by Stoicism, Marcus Aurelius, and modern psychology).
      Your tone should be profound, encouraging, empathetic, but firm on discipline. Avoid slang. Use metaphors.
      ${langInstruction}
      
      Analyze these habits and their recent 14-day history (⬜=miss, ✅=done). 
      Data: ${JSON.stringify(habitsData)}.${chainSummary}
      
      Instructions:
      1. Analyze their consistency, paying attention to tags and habit chains.
      2. Provide a deep, motivational message that speaks to their character and potential.
      3. Provide a list of exactly ${suggestionCount} distinct, wise, actionable suggestions to improve.

      Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          overallScore: { type: Type.NUMBER },
          streakAnalysis: { type: Type.STRING },
          motivationalMessage: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(extractJson(text));
}

async function getSmartFocus(ai, payload) {
  const { habitsList, context, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "Response must be in Russian." : "Response must be in English.";

  let energyDesc = "Neutral";
  if (context.energy < 40) energyDesc = "Low / Tired / Zombie Mode";
  else if (context.energy > 70) energyDesc = "High / Energetic / God Mode";

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: `Act as an Advanced Executive Function Assistant. The user is overwhelmed.
        USER CONTEXT:
        - Energy Level: ${energyDesc} (${context.energy}%)
        - Time Available: ${context.timeAvailable} minutes
        - Time of Day: ${context.timeOfDay}
        
        PENDING TASKS/HABITS:
        ${JSON.stringify(habitsList)}
        
        Select the SINGLE best task/habit to do RIGHT NOW.
        ${langInstruction}
        Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          habitId: { type: Type.STRING },
          reasoning: { type: Type.STRING },
          estimatedDuration: { type: Type.NUMBER },
          matchScore: { type: Type.NUMBER },
          actionType: { type: Type.STRING, enum: ["do", "rest", "plan"] },
          customTitle: { type: Type.STRING },
        },
        required: ["habitId", "reasoning", "actionType"],
      },
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(extractJson(text));
}

async function searchBooks(ai, payload) {
  const { query, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "in Russian" : "in English";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Search for popular books matching query: "${query}". Return top 3 results.
          Provide title ${langInstruction}, author, and estimated page count.
          Return JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            author: { type: Type.STRING },
            totalPages: { type: Type.NUMBER },
          },
          required: ["title", "author", "totalPages"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(extractJson(text));
}

async function searchSupplements(ai, payload) {
  const { query, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "in Russian" : "in English";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Search for popular supplements/vitamins matching query: "${query}". Return top 3 results.
          Provide name ${langInstruction}, recommended dosage, best timing, frequency, and short description.
          Return JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            dosage: { type: Type.STRING },
            timing: { type: Type.STRING, enum: ["morning", "afternoon", "evening", "with_food", "anytime"] },
            frequency: { type: Type.STRING, enum: ["daily", "twice_daily", "every_other_day", "weekly", "monthly"] },
            description: { type: Type.STRING },
          },
          required: ["name", "dosage", "timing", "frequency", "description"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(extractJson(text));
}

async function searchSkincare(ai, payload) {
  const { query, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "in Russian" : "in English";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Search for popular skincare products matching query: "${query}". Return top 3 results.
          Provide product name ${langInstruction}, type, best routine, and short description.
          Return JSON only.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["cleanser", "toner", "serum", "moisturizer", "sunscreen", "mask", "exfoliant", "eye_cream", "other"] },
            routine: { type: Type.STRING, enum: ["morning", "evening", "both"] },
            description: { type: Type.STRING },
          },
          required: ["name", "type", "routine", "description"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(extractJson(text));
}

async function suggestConnections(ai, payload) {
  const { habitList, existingPairs, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "Respond in Russian." : "Respond in English.";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `You are analyzing habits to find logical connections.
HABITS: ${JSON.stringify(habitList, null, 2)}
EXISTING CONNECTIONS: ${existingPairs.join(", ")}
Find up to 5 NEW logical connections between these habits.
${langInstruction} Return JSON array.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sourceId: { type: Type.STRING },
            targetId: { type: Type.STRING },
            type: { type: Type.STRING, enum: ["triggers", "enables", "blocks", "related"] },
            reasoning: { type: Type.STRING },
          },
          required: ["sourceId", "targetId", "type", "reasoning"],
        },
      },
    },
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(extractJson(text));
}

async function parseVoiceCommand(ai, payload) {
  const { transcript, habitList, language = "ru" } = payload;

  const prompt = language === "ru"
    ? `Ты голосовой ассистент приложения для привычек HabitAI.
Пользователь сказал: "${transcript}"
Существующие привычки:
${habitList || "(пусто)"}
Распарси команду и верни JSON. Верни ТОЛЬКО JSON, без markdown.`
    : `You are a voice assistant for HabitAI habit tracking app.
User said: "${transcript}"
Existing habits:
${habitList || "(empty)"}
Parse the command and return JSON. Return ONLY JSON, no markdown.`;

  const result = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          target: { type: Type.STRING },
          params: { type: Type.OBJECT },
          response: { type: Type.STRING },
          confidence: { type: Type.NUMBER },
        },
      },
    },
  });

  const text = result.text || "";
  return JSON.parse(extractJson(text));
}

async function generateAffirmations(ai, payload) {
  const { identityLabel, qualities, language = "ru" } = payload;
  const langInstruction = language === "ru"
    ? "Respond strictly in Russian language."
    : "Respond strictly in English language.";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Create powerful affirmations for someone becoming "${identityLabel}".
Qualities: ${qualities.join(", ")}
${langInstruction}
Generate 8 unique affirmations. Return JSON array of strings.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: { type: Type.ARRAY, items: { type: Type.STRING } },
    },
  });

  const text = response.text;
  if (!text) return [];
  const result = JSON.parse(extractJson(text));
  return Array.isArray(result) ? result : [];
}

async function reflectionFollowUp(ai, payload) {
  const { conversationText, isLastQuestion, language = "ru" } = payload;

  const prompt = language === "ru"
    ? `Ты — опытный психолог-коуч, ведущий глубокую сессию рефлексии.
КОНТЕКСТ ДИАЛОГА:
${conversationText}

${isLastQuestion
      ? "Это ПОСЛЕДНИЙ вопрос сессии. Задай мощный завершающий вопрос."
      : "Задай ОДИН глубокий follow-up вопрос."}

Отвечай ТОЛЬКО вопросом. Минимум 15 слов.`
    : `You are an experienced psychology coach leading a deep reflection session.
DIALOGUE CONTEXT:
${conversationText}

${isLastQuestion
      ? "This is the LAST question. Ask a powerful closing question."
      : "Ask ONE deep follow-up question."}

Respond with ONLY the question. At least 15 words.`;

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt,
    config: { temperature: 0.85 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Empty response");
  return text.replace(/^["']|["']$/g, "").replace(/^\*\*|\*\*$/g, "");
}

async function reflectionInsight(ai, payload) {
  const { conversationText, language = "ru" } = payload;

  const prompt = language === "ru"
    ? `Ты — мудрый психолог-коуч. Проанализируй сессию рефлексии.
ПОЛНАЯ СЕССИЯ:
${conversationText}
НАПИШИ ГЛУБОКИЙ АНАЛИЗ (5-10 предложений). Пиши на русском, обращайся на "ты".`
    : `You are a wise psychology coach. Analyze this reflection session.
FULL SESSION:
${conversationText}
WRITE A DEEP ANALYSIS (5-10 sentences). Write in English.`;

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: prompt,
    config: { temperature: 0.8 },
  });

  const text = response.text?.trim();
  if (!text) throw new Error("Empty response");
  return text;
}

async function analyzeCorrelations(ai, payload) {
  const { habitsData, language = "ru" } = payload;

  const prompt = language === "ru"
    ? `Ты — ведущий аналитик данных и поведенческий психолог. 
Проанализируй данные о привычках и найди СКРЫТЫЕ КОРРЕЛЯЦИИ.
ДАННЫЕ: ${JSON.stringify(habitsData, null, 2)}
НАПИШИ АНАЛИЗ (4-5 абзацев). Пиши на русском, обращайся на "ты".`
    : `You are a lead data analyst and behavioral psychologist.
Analyze habit data and find HIDDEN CORRELATIONS.
DATA: ${JSON.stringify(habitsData, null, 2)}
WRITE AN ANALYSIS (4-5 paragraphs). Write in English.`;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: prompt,
    config: { temperature: 0.7 },
  });

  return response.text?.trim() || (language === "ru" ? "Не удалось провести анализ." : "Could not perform analysis.");
}

async function eveningReview(ai, payload) {
  const { habitsData, completed, total, chainLine = "", language = "ru" } = payload;
  const langInstruction = language === "ru" ? "Respond strictly in Russian." : "Respond strictly in English.";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `You are a warm, insightful evening coach. Review the user's day.
${langInstruction}
TODAY'S DATA:
- Completed: ${completed}/${total} habits${chainLine}
- Details: ${JSON.stringify(habitsData)}
Generate an evening review. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          emoji: { type: Type.STRING },
          headline: { type: Type.STRING },
          wins: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          tomorrowTip: { type: Type.STRING },
          streakHighlight: { type: Type.STRING },
        },
        required: ["score", "emoji", "headline", "wins", "improvements", "tomorrowTip"],
      },
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(extractJson(text));
}

async function streakRiskAlert(ai, payload) {
  const { riskData, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "Respond strictly in Russian." : "Respond strictly in English.";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `These habits have active streaks but haven't been completed today. Generate a motivational alert.
${langInstruction}
AT-RISK HABITS: ${JSON.stringify(riskData)}
Be urgent but supportive. Return JSON.`,
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
                riskLevel: { type: Type.STRING, enum: ["high", "medium"] },
                message: { type: Type.STRING },
              },
              required: ["name", "currentStreak", "riskLevel", "message"],
            },
          },
          urgentMessage: { type: Type.STRING },
        },
        required: ["atRiskHabits", "urgentMessage"],
      },
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(extractJson(text));
}

async function dailyMotivation(ai, payload) {
  const { completionRate, topStreak, language = "ru" } = payload;
  const langInstruction = language === "ru" ? "Respond strictly in Russian." : "Respond strictly in English.";

  const response = await ai.models.generateContent({
    model: FLASH_MODEL,
    contents: `Generate a personalized motivational quote for someone tracking habits.
${langInstruction}
Context: Completion rate ${completionRate}%, top streak ${topStreak} days.
${completionRate < 30 ? "They're struggling. Be extra encouraging." : ""}
${completionRate > 80 ? "They're doing amazing. Challenge them." : ""}
Make it personal, not generic. Return JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          quote: { type: Type.STRING },
          author: { type: Type.STRING },
          emoji: { type: Type.STRING },
        },
        required: ["quote", "author", "emoji"],
      },
    },
  });

  const text = response.text;
  if (!text) return null;
  return JSON.parse(extractJson(text));
}

async function analyzeVaultPortfolio(ai, payload) {
  const { portfolioData, language = "ru" } = payload;

  const totalPortfolioValue = portfolioData.assets.reduce((s, a) => s + a.amount * a.currentPrice, 0);
  const totalInvested = portfolioData.assets.reduce((s, a) => s + a.amount * a.buyPrice, 0);
  const pnl = totalPortfolioValue - totalInvested;
  const pnlPercent = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(1) : "0";

  const prompt = language === "ru"
    ? `Ты — личный финансовый аналитик. Проанализируй портфель.
Стоимость: $${totalPortfolioValue.toFixed(2)}, Вложено: $${totalInvested.toFixed(2)}, P&L: ${pnlPercent}%
АКТИВЫ: ${JSON.stringify(portfolioData.assets, null, 2)}
Пиши на русском. Текст должен быть логически завершён.`
    : `You are a personal financial analyst. Analyze the portfolio.
Value: $${totalPortfolioValue.toFixed(2)}, Invested: $${totalInvested.toFixed(2)}, P&L: ${pnlPercent}%
ASSETS: ${JSON.stringify(portfolioData.assets, null, 2)}
Write in English. Text must be logically complete.`;

  const response = await ai.models.generateContent({
    model: PRO_MODEL,
    contents: prompt,
    config: { temperature: 0.7 },
  });

  return response.text?.trim() || (language === "ru" ? "Не удалось провести анализ." : "Could not perform analysis.");
}

// ===== ROUTER =====
const ACTION_MAP = {
  generateSuggestions,
  analyzeHabits,
  getSmartFocus,
  searchBooks,
  searchSupplements,
  searchSkincare,
  suggestConnections,
  parseVoiceCommand,
  generateAffirmations,
  reflectionFollowUp,
  reflectionInsight,
  analyzeCorrelations,
  eveningReview,
  streakRiskAlert,
  dailyMotivation,
  analyzeVaultPortfolio,
};

async function handleGeminiRequest(apiKey, action, payload) {
  const handler = ACTION_MAP[action];
  if (!handler) {
    throw new Error(`Unknown action: ${action}`);
  }
  const ai = getAiClient(apiKey);
  return await handler(ai, payload);
}

module.exports = { handleGeminiRequest, ACTION_MAP };
