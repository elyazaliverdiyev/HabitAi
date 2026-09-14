
import { Type, FLASH_MODEL, getAiClient, extractJson } from './ai-core';

// --- VOICE COMMAND PARSER (AI Assistant) ---

export interface VoiceCommand {
  action: 'create' | 'edit' | 'delete' | 'complete' | 'uncomplete' | 'connect' | 'analyze' | 'unknown';
  target?: string;       // habit name to act on
  params?: {
    name?: string;       // for create/edit
    description?: string;
    time?: string;       // e.g. "07:00"
    place?: string;      // e.g. "в спальне"
    connectTo?: string;  // habit name to connect to
    category?: string;
  };
  response: string;      // What assistant should say back
  confidence: number;    // 0-1 how confident AI is
}

export const parseVoiceCommand = async (
  transcript: string,
  existingHabits: Array<{ id: string; name: string }>,
  language: 'ru' | 'en' = 'ru'
): Promise<VoiceCommand> => {
  try {
    const ai = getAiClient();

    const habitList = existingHabits.map(h => `- "${h.name}" (id: ${h.id})`).join('\n');

    const prompt = language === 'ru'
      ? `Ты голосовой ассистент приложения для привычек HabitAI.
Пользователь сказал: "${transcript}"

Существующие привычки:
${habitList || '(пусто)'}

Распарси команду и верни JSON:
{
  "action": "create" | "edit" | "delete" | "complete" | "uncomplete" | "connect" | "analyze" | "unknown",
  "target": "название привычки если есть",
  "params": {
    "name": "название для создания/редактирования",
    "description": "описание если упомянуто",
    "time": "время в формате HH:MM если упомянуто",
    "place": "место если упомянуто",
    "connectTo": "название второй привычки для связи",
    "category": "категория если упомянута"
  },
  "response": "Ответ для пользователя (кратко, дружелюбно)",
  "confidence": 0.0-1.0
}

Примеры:
- "Создай привычку бегать в 7 утра в парке" → action: create, params: {name: "Бегать", time: "07:00", place: "в парке"}
- "Выполни мьюинг" → action: complete, target: "Мьюинг"
- "Свяжи медитацию с чтением" → action: connect, target: "медитацию", params: {connectTo: "чтением"}
- "Удали привычку X" → action: delete, target: "X"
- "Анализ" или "Как дела?" → action: analyze

Верни ТОЛЬКО JSON, без markdown.`
      : `You are a voice assistant for HabitAI habit tracking app.
User said: "${transcript}"

Existing habits:
${habitList || '(empty)'}

Parse the command and return JSON:
{
  "action": "create" | "edit" | "delete" | "complete" | "uncomplete" | "connect" | "analyze" | "unknown",
  "target": "habit name if specified",
  "params": {
    "name": "name for create/edit",
    "description": "description if mentioned",
    "time": "time in HH:MM format if mentioned",
    "place": "place if mentioned",
    "connectTo": "second habit name for connection",
    "category": "category if mentioned"
  },
  "response": "Response for user (brief, friendly)",
  "confidence": 0.0-1.0
}

Return ONLY JSON, no markdown.`;

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

    const text = result.text || '';
    const json = extractJson(text);
    const parsed = JSON.parse(json) as VoiceCommand;

    // Ensure valid action
    const validActions = ['create', 'edit', 'delete', 'complete', 'uncomplete', 'connect', 'analyze', 'unknown'];
    if (!validActions.includes(parsed.action)) {
      parsed.action = 'unknown';
    }

    return parsed;

  } catch (e) {
    console.error("Voice command parse error", e);
    return {
      action: 'unknown',
      response: language === 'ru' ? 'Не понял команду. Попробуй ещё раз.' : "Didn't understand. Try again.",
      confidence: 0,
    };
  }
};
