
import { Type, FLASH_MODEL, getAiClient, extractJson } from './ai-core';

// --- BOOK SEARCH ---
export const searchBooks = async (query: string, language: 'ru' | 'en' = 'ru'): Promise<Array<{
  title: string, author: string, totalPages: number
}>> => {
  try {
    const ai = getAiClient();
    const langInstruction = language === 'ru' ? "in Russian" : "in English";

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
              totalPages: { type: Type.NUMBER }
            },
            required: ["title", "author", "totalPages"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(extractJson(text));
  } catch (e) {
    console.error("Book Search Error", e);
    return [];
  }
}

// --- SUPPLEMENT SEARCH ---
export const searchSupplements = async (query: string, language: 'ru' | 'en' = 'ru'): Promise<Array<{
  name: string, dosage: string, timing: 'morning' | 'afternoon' | 'evening' | 'with_food' | 'anytime', frequency: 'daily' | 'twice_daily' | 'every_other_day' | 'weekly' | 'monthly', description: string
}>> => {
  try {
    const ai = getAiClient();
    const langInstruction = language === 'ru' ? "in Russian" : "in English";

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Search for popular supplements/vitamins matching query: "${query}". Return top 3 results.
            Provide name ${langInstruction}, recommended dosage, best timing to take, frequency, and short description of benefits.
            Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Supplement name" },
              dosage: { type: Type.STRING, description: "Recommended dosage (e.g., '5000 IU', '500mg')" },
              timing: { type: Type.STRING, enum: ['morning', 'afternoon', 'evening', 'with_food', 'anytime'] },
              frequency: { type: Type.STRING, enum: ['daily', 'twice_daily', 'every_other_day', 'weekly', 'monthly'] },
              description: { type: Type.STRING, description: "Brief description of benefits (max 50 chars)" }
            },
            required: ["name", "dosage", "timing", "frequency", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(extractJson(text));
  } catch (e) {
    console.error("Supplement Search Error", e);
    return [];
  }
}

// --- SKINCARE SEARCH ---
export const searchSkincareProducts = async (query: string, language: 'ru' | 'en' = 'ru'): Promise<Array<{
  name: string, type: 'cleanser' | 'toner' | 'serum' | 'moisturizer' | 'sunscreen' | 'mask' | 'exfoliant' | 'eye_cream' | 'other', routine: 'morning' | 'evening' | 'both', description: string
}>> => {
  try {
    const ai = getAiClient();
    const langInstruction = language === 'ru' ? "in Russian" : "in English";

    const response = await ai.models.generateContent({
      model: FLASH_MODEL,
      contents: `Search for popular skincare products matching query: "${query}". Return top 3 results.
            Provide product name ${langInstruction}, type (cleanser/toner/serum/moisturizer/sunscreen/mask/exfoliant/eye_cream/other), best routine (morning/evening/both), and short description of benefits.
            Return JSON only.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING, description: "Product name" },
              type: { type: Type.STRING, enum: ['cleanser', 'toner', 'serum', 'moisturizer', 'sunscreen', 'mask', 'exfoliant', 'eye_cream', 'other'] },
              routine: { type: Type.STRING, enum: ['morning', 'evening', 'both'] },
              description: { type: Type.STRING, description: "Brief description of benefits (max 50 chars)" }
            },
            required: ["name", "type", "routine", "description"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(extractJson(text));
  } catch (e) {
    console.error("Skincare Search Error", e);
    return [];
  }
}
