
import { PRO_MODEL, getAiClient } from './ai-core';

// ===== VAULT — AI PORTFOLIO ANALYSIS =====
export const analyzeVaultPortfolio = async (
  portfolioData: {
    assets: Array<{ name: string; category: string; amount: number; buyPrice: number; currentPrice: number; currency: string }>;
    yields: Array<{ protocol: string; pool: string; invested: number; apy: number; accumulated: number; currency: string; isActive: boolean }>;
    transactions: Array<{ type: string; amount: number; currency: string; description: string; date: string }>;
  },
  language: 'ru' | 'en' = 'ru'
): Promise<string> => {
  try {
    const ai = getAiClient();

    const totalPortfolioValue = portfolioData.assets.reduce((s, a) => s + a.amount * a.currentPrice, 0);
    const totalInvested = portfolioData.assets.reduce((s, a) => s + a.amount * a.buyPrice, 0);
    const totalYieldInvested = portfolioData.yields.reduce((s, y) => s + y.invested, 0);
    const totalYieldEarned = portfolioData.yields.reduce((s, y) => s + y.accumulated, 0);
    const pnl = totalPortfolioValue - totalInvested;
    const pnlPercent = totalInvested > 0 ? ((pnl / totalInvested) * 100).toFixed(1) : '0';

    const prompt = language === 'ru'
      ? `Ты — личный финансовый аналитик уровня Goldman Sachs. 
Проанализируй портфель пользователя и дай КОНКРЕТНЫЕ рекомендации.

ПОРТФЕЛЬ:
- Общая стоимость: $${totalPortfolioValue.toFixed(2)}
- Вложено: $${totalInvested.toFixed(2)}
- P&L: $${pnl.toFixed(2)} (${pnlPercent}%)

АКТИВЫ:
${JSON.stringify(portfolioData.assets, null, 2)}

YIELD FARMING:
- Вложено в yield: $${totalYieldInvested.toFixed(2)}
- Заработано: $${totalYieldEarned.toFixed(2)}
${JSON.stringify(portfolioData.yields, null, 2)}

ПОСЛЕДНИЕ ТРАНЗАКЦИИ:
${JSON.stringify(portfolioData.transactions.slice(-15), null, 2)}

НАПИШИ АНАЛИЗ (4-6 абзацев):
1. **ЗДОРОВЬЕ ПОРТФЕЛЯ**: Оценка диверсификации, рисков, концентрации.
2. **YIELD СТРАТЕГИЯ**: Анализ APY, рисков фарминга, оптимизация.
3. **ПАТТЕРНЫ ТРАНЗАКЦИЙ**: Что видно из истории операций? Частота, размеры.
4. **РЕКОМЕНДАЦИЯ**: Одно конкретное действие для улучшения.
5. **ПРОГНОЗ**: Потенциал роста при текущей стратегии.

Пиши строго на русском. Обращайся на "ты". Будь конкретным. 
Текст должен быть логически завершён. Не обрывай предложения.`
      : `You are a Goldman Sachs-level personal financial analyst.
Analyze the user's portfolio and give SPECIFIC recommendations.

PORTFOLIO:
- Total value: $${totalPortfolioValue.toFixed(2)}
- Invested: $${totalInvested.toFixed(2)}
- P&L: $${pnl.toFixed(2)} (${pnlPercent}%)

ASSETS:
${JSON.stringify(portfolioData.assets, null, 2)}

YIELD FARMING:
- Invested in yield: $${totalYieldInvested.toFixed(2)}
- Earned: $${totalYieldEarned.toFixed(2)}
${JSON.stringify(portfolioData.yields, null, 2)}

RECENT TRANSACTIONS:
${JSON.stringify(portfolioData.transactions.slice(-15), null, 2)}

WRITE AN ANALYSIS (4-6 paragraphs):
1. **PORTFOLIO HEALTH**: Diversification, risks, concentration assessment.
2. **YIELD STRATEGY**: APY analysis, farming risks, optimization.
3. **TRANSACTION PATTERNS**: What's visible from history? Frequency, sizes.
4. **RECOMMENDATION**: One specific action to improve.
5. **FORECAST**: Growth potential with current strategy.

Write in English. Be specific. Text must be logically complete.`;

    const response = await ai.models.generateContent({
      model: PRO_MODEL,
      contents: prompt,
      config: {
        temperature: 0.7
      }
    });

    return response.text?.trim() || (language === 'ru' ? 'Не удалось провести анализ.' : 'Could not perform analysis.');
  } catch (error) {
    console.error("Vault AI Analysis Error:", error);
    throw error;
  }
};
