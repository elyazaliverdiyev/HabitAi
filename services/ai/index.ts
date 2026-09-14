// Barrel re-exports for all AI modules
// Import from '../services/ai' instead of '../services/geminiService'

// Habits domain
export { generateHabitSuggestions, analyzeHabits, getSmartFocusRecommendation, suggestHabitConnections, analyzeHabitCorrelations } from './ai-habits';

// Voice domain
export { parseVoiceCommand } from './ai-voice';
export type { VoiceCommand } from './ai-voice';

// Reflection & Motivation domain
export { generateAffirmations, generateReflectionFollowUp, generateReflectionInsight, generateEveningReview, generateStreakRiskAlert, generateDailyMotivation } from './ai-reflection';
export type { EveningReviewData, StreakRiskData } from './ai-reflection';

// Search domain
export { searchBooks, searchSupplements, searchSkincareProducts } from './ai-search';

// Vault domain
export { analyzeVaultPortfolio } from './ai-vault';

// Goals domain
export { generateGoalChain } from './ai-goals';
export type { AIGoalStep, AIGoalChainResponse } from './ai-goals';

// Coach domain (streaming)
export { COACH_PERSONALITIES, getCoachById, streamCoachMessage } from './ai-coach';
export type { CoachPersonality, ChatMessage } from './ai-coach';

// Core (streaming helper)
export { streamContent } from './ai-core';
export type { StreamOptions } from './ai-core';
