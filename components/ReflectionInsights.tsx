import React, { useState } from 'react';
import { Sparkles, Brain, TrendingUp, Heart, Target, Loader2, RefreshCw } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

export interface ReflectionEntry {
    id: string;
    date: string;
    question: string;
    answer: string;
    category?: string;
}

interface ReflectionInsightsProps {
    entries: ReflectionEntry[];
    language: 'ru' | 'en';
}

interface InsightData {
    summary: string;
    themes: string[];
    growthAreas: string[];
    strengths: string[];
    recommendation: string;
}

const t = {
    ru: {
        title: 'AI Анализ рефлексий',
        analyze: 'Проанализировать',
        analyzing: 'Анализирую...',
        themes: 'Ключевые темы',
        growth: 'Зоны роста',
        strengths: 'Сильные стороны',
        recommendation: 'Рекомендация',
        noData: 'Недостаточно данных для анализа',
        noDataHint: 'Ответьте минимум на 3 вопроса рефлексии',
        retry: 'Повторить'
    },
    en: {
        title: 'AI Reflection Analysis',
        analyze: 'Analyze',
        analyzing: 'Analyzing...',
        themes: 'Key Themes',
        growth: 'Growth Areas',
        strengths: 'Strengths',
        recommendation: 'Recommendation',
        noData: 'Not enough data for analysis',
        noDataHint: 'Answer at least 3 reflection questions',
        retry: 'Retry'
    }
};

export const ReflectionInsights: React.FC<ReflectionInsightsProps> = ({
    entries,
    language
}) => {
    const [insights, setInsights] = useState<InsightData | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const labels = t[language];

    const analyzeReflections = async () => {
        if (entries.length < 3) return;

        setIsAnalyzing(true);
        setError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY });

            // Prepare reflections context
            const reflectionsText = entries.slice(0, 15).map(r => {
                const date = new Date(r.date).toLocaleDateString();
                return `[${date}] Q: "${r.question}" → A: "${r.answer}"`;
            }).join('\n');

            const prompt = language === 'ru' ? `
Ты психолог-коуч. Проанализируй рефлексии пользователя и дай insights.

РЕФЛЕКСИИ:
${reflectionsText}

Ответь СТРОГО в JSON формате:
{
  "summary": "Краткое резюме паттернов (2-3 предложения)",
  "themes": ["тема1", "тема2", "тема3"],
  "growthAreas": ["область роста 1", "область роста 2"],
  "strengths": ["сила 1", "сила 2"],
  "recommendation": "Конкретная рекомендация на следующую неделю (1-2 предложения)"
}
` : `
You are a psychology coach. Analyze the user's reflections and provide insights.

REFLECTIONS:
${reflectionsText}

Respond STRICTLY in JSON format:
{
  "summary": "Brief summary of patterns (2-3 sentences)",
  "themes": ["theme1", "theme2", "theme3"],
  "growthAreas": ["growth area 1", "growth area 2"],
  "strengths": ["strength 1", "strength 2"],
  "recommendation": "Specific recommendation for next week (1-2 sentences)"
}
`;

            const result = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt
            });
            const text = result.text || '';

            // Parse JSON from response
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]) as InsightData;
                setInsights(parsed);
            } else {
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Analysis error:', err);
            setError(language === 'ru' ? 'Ошибка анализа' : 'Analysis error');
        } finally {
            setIsAnalyzing(false);
        }
    };

    if (entries.length < 3) {
        return (
            <div className="p-4 rounded-xl bg-surfaceHighlight border border-borderSubtle text-center">
                <Brain className="w-8 h-8 mx-auto mb-2 text-textSecondary" />
                <p className="text-sm font-medium text-textPrimary">{labels.noData}</p>
                <p className="text-xs text-textSecondary mt-1">{labels.noDataHint}</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Analyze Button */}
            {!insights && !isAnalyzing && (
                <button
                    onClick={analyzeReflections}
                    className="gemini-glow w-full p-4 rounded-xl shadow-lg transition-all group flex items-center justify-center gap-3 active:scale-[0.98]"
                    style={{ backgroundColor: '#10b981', color: 'black' }}
                >
                    <Sparkles className="w-5 h-5 text-black group-hover:animate-pulse" />
                    <span className="font-bold text-black">{labels.analyze}</span>
                </button>
            )}

            {/* Loading */}
            {isAnalyzing && (
                <div className="p-6 rounded-xl bg-surfaceHighlight border border-borderSubtle text-center">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 text-brand animate-spin" />
                    <p className="text-sm font-medium text-textPrimary">{labels.analyzing}</p>
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-center">
                    <p className="text-sm text-red-500 mb-2">{error}</p>
                    <button
                        onClick={analyzeReflections}
                        className="text-xs text-brand font-medium flex items-center gap-1 mx-auto"
                    >
                        <RefreshCw className="w-3 h-3" /> {labels.retry}
                    </button>
                </div>
            )}

            {/* Insights Display */}
            {insights && (
                <div className="space-y-4 animate-fadeIn">
                    {/* Summary */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-brand/10 to-purple-500/10 border border-brand/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Brain className="w-4 h-4 text-brand" />
                            <span className="text-xs font-bold text-brand uppercase">AI Summary</span>
                        </div>
                        <p className="text-sm text-textPrimary leading-relaxed">{insights.summary}</p>
                    </div>

                    {/* Themes */}
                    <div className="p-4 rounded-xl bg-surfaceHighlight border border-borderSubtle">
                        <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-blue-500" />
                            <span className="text-xs font-bold text-blue-500 uppercase">{labels.themes}</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {insights.themes.map((theme, i) => (
                                <span key={i} className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-500 text-xs font-medium">
                                    {theme}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Strengths & Growth */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* Strengths */}
                        <div className="p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                            <div className="flex items-center gap-1.5 mb-2">
                                <Heart className="w-3.5 h-3.5 text-green-500" />
                                <span className="text-[10px] font-bold text-green-500 uppercase">{labels.strengths}</span>
                            </div>
                            <ul className="space-y-1">
                                {insights.strengths.map((s, i) => (
                                    <li key={i} className="text-xs text-textPrimary">• {s}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Growth */}
                        <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20">
                            <div className="flex items-center gap-1.5 mb-2">
                                <TrendingUp className="w-3.5 h-3.5 text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-500 uppercase">{labels.growth}</span>
                            </div>
                            <ul className="space-y-1">
                                {insights.growthAreas.map((g, i) => (
                                    <li key={i} className="text-xs text-textPrimary">• {g}</li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Recommendation */}
                    <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20">
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-bold text-purple-500 uppercase">{labels.recommendation}</span>
                        </div>
                        <p className="text-sm text-textPrimary leading-relaxed">{insights.recommendation}</p>
                    </div>

                    {/* Re-analyze */}
                    <button
                        onClick={analyzeReflections}
                        className="w-full p-2 rounded-lg bg-surfaceHighlight border border-borderSubtle hover:border-brand/30 transition-all flex items-center justify-center gap-2 text-xs text-textSecondary"
                    >
                        <RefreshCw className="w-3 h-3" /> {labels.retry}
                    </button>
                </div>
            )}
        </div>
    );
};

export default ReflectionInsights;
