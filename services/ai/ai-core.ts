
import { GoogleGenAI, Type } from "@google/genai";
import { GEMINI_API_KEY } from "../../constants";
import { supabase } from "../../supabaseClient";

// Re-export Type for use by domain modules
export { Type };

export const FLASH_MODEL = "gemini-3-flash-preview";
export const PRO_MODEL = "gemini-3-pro-preview"; // Best for complex reasoning and coaching

// ===== EDGE FUNCTIONS PROXY =====
// Tries server-side Edge Function first (secure), falls back to direct client call

let _useEdgeFunctions = true; // Will be set to false if EF is not deployed

export const callCloudFunction = async <T>(action: string, payload: any): Promise<T | null> => {
  // If user has a custom API key, always use direct client call
  const customKey = localStorage.getItem('custom_gemini_api_key');
  if (customKey && customKey.trim()) return null;

  // If we already know EF is not available, skip
  if (!_useEdgeFunctions) return null;

  try {
    const { data, error } = await supabase.functions.invoke('gemini-proxy', {
      body: { action, payload }
    });
    
    if (error) throw error;
    return data?.data as T;
  } catch (error: any) {
    console.warn('Edge Functions not available, falling back to direct API calls');
    _useEdgeFunctions = false;
    return null;
  }
};

// Helper to safely get the client (fallback for direct calls)
export const getAiClient = () => {
  // Use custom key from settings if available, otherwise default
  const customKey = localStorage.getItem('custom_gemini_api_key');
  const key = customKey && customKey.trim() ? customKey.trim() : GEMINI_API_KEY;
  return new GoogleGenAI({ apiKey: key });
};

// Helper to extract JSON from text that might contain markdown or preamble
export const extractJson = (text: string): string => {
  if (!text) return "";

  // 1. Try to find JSON inside code blocks ```json ... ```
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }

  // 2. If no code blocks, try to find the structure between first { and last } or [ and ]
  const firstOpenBrace = text.indexOf('{');
  const firstOpenBracket = text.indexOf('[');
  let firstOpen = -1;
  let isArray = false;

  if (firstOpenBrace !== -1 && firstOpenBracket !== -1) {
    if (firstOpenBrace < firstOpenBracket) {
      firstOpen = firstOpenBrace;
    } else {
      firstOpen = firstOpenBracket;
      isArray = true;
    }
  } else if (firstOpenBrace !== -1) {
    firstOpen = firstOpenBrace;
  } else if (firstOpenBracket !== -1) {
    firstOpen = firstOpenBracket;
    isArray = true;
  }

  if (firstOpen !== -1) {
    const lastClose = text.lastIndexOf(isArray ? ']' : '}');
    if (lastClose !== -1 && lastClose > firstOpen) {
      return text.substring(firstOpen, lastClose + 1);
    }
  }

  // 3. Fallback: assume the whole text is the attempt
  return text.trim();
};

// ===== STREAMING HELPER =====
// Uses generateContentStream for real-time text output

export interface StreamOptions {
  model?: string;
  contents: string;
  systemInstruction?: string;
  temperature?: number;
  onChunk: (text: string) => void;
  onComplete?: (fullText: string) => void;
  onError?: (error: Error) => void;
  signal?: AbortSignal;
}

export const streamContent = async (options: StreamOptions): Promise<string> => {
  const {
    model = FLASH_MODEL,
    contents,
    systemInstruction,
    temperature = 0.8,
    onChunk,
    onComplete,
    onError,
    signal,
  } = options;

  try {
    const ai = getAiClient();
    let fullText = '';

    const response = await ai.models.generateContentStream({
      model,
      contents,
      config: {
        temperature,
        ...(systemInstruction ? { systemInstruction } : {}),
      },
    });

    for await (const chunk of response) {
      if (signal?.aborted) break;
      const text = chunk.text || '';
      if (text) {
        fullText += text;
        onChunk(text);
      }
    }

    onComplete?.(fullText);
    return fullText;
  } catch (error: any) {
    if (error?.name !== 'AbortError') {
      console.error('Stream error:', error);
      onError?.(error);
    }
    throw error;
  }
};
