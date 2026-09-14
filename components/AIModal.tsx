
import React from 'react';
import Modal from './Modal';
import { HabitAnalysis } from '../types';
import { Sparkles, TrendingUp, Zap, Lightbulb } from 'lucide-react';
import { translations } from '../translations';

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: HabitAnalysis | null;
  loading: boolean;
  language?: 'ru' | 'en';
}

const AIModal: React.FC<AIModalProps> = ({ isOpen, onClose, analysis, loading, language = 'ru' }) => {
  const t = translations[language].ai;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t.coachTitle}>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <Sparkles className="text-brand animate-spin" size={48} />
          <p className="text-textSecondary">{t.analyzing}</p>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Score Card */}
          <div className="bg-gradient-to-br from-brand/20 to-purple-500/10 border border-brand/20 rounded-xl p-6 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>
            <span className="text-textSecondary text-sm font-medium uppercase tracking-wider">{t.score}</span>
            <div className="text-6xl font-black text-textPrimary mt-2 mb-1">{analysis.overallScore}</div>
            <div className="text-sm text-brand font-medium">{t.consistency}</div>
          </div>

          {/* Motivational Message */}
          <div className="bg-surfaceHighlight/30 border border-borderSubtle rounded-xl p-4">
            <div className="flex items-start gap-3">
              <Zap className="text-yellow-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-semibold text-textPrimary mb-1">{t.verdict}</h3>
                <p className="text-textSecondary text-sm leading-relaxed italic">
                  "{analysis.motivationalMessage}"
                </p>
              </div>
            </div>
          </div>

          {/* Streak Analysis */}
          <div className="flex items-start gap-3 p-2">
            <TrendingUp className="text-green-500 shrink-0 mt-1" size={20} />
            <div>
              <h3 className="font-semibold text-textPrimary mb-1">{t.streakAnalysis}</h3>
              <p className="text-textSecondary text-sm">{analysis.streakAnalysis}</p>
            </div>
          </div>

          {/* Suggestions */}
          <div className="space-y-3">
            <h3 className="font-semibold text-textPrimary flex items-center gap-2">
              <Lightbulb size={18} className="text-brand" /> {t.tips}
            </h3>
            <ul className="space-y-2">
              {analysis.suggestions.map((suggestion, idx) => (
                <li key={idx} className="text-sm text-textSecondary bg-surfaceHighlight/30 p-3 rounded-lg border border-borderSubtle flex gap-2">
                  <span className="text-brand mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        <div className="text-center py-8 text-textSecondary">
          {t.noData}
        </div>
      )}
    </Modal>
  );
};

export default AIModal;
