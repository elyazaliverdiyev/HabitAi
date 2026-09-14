
import React, { useState } from 'react';
import { Check, Crown, Key, Loader2, ShieldCheck, X, ExternalLink } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { TELEGRAM_BOT_URL } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRedeem: (code: string) => Promise<boolean>;
  language?: 'ru' | 'en';
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({ isOpen, onClose, onRedeem, language = 'ru' }) => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const isNative = Capacitor.isNativePlatform();

  const t = {
    ru: {
      title: "Активация HabitAi PRO",
      subtitle: "Введите лицензионный ключ для активации PRO.",
      featuresTitle: "Возможности:",
      features: [
        "Безлимитное количество привычек",
        "Умный AI-коуч и детальный анализ",
        "Доступ ко всем премиум темам",
        "Резервное копирование и экспорт",
        "Приоритетная поддержка",
        "Значок PRO в профиле"
      ],
      inputPlaceholder: "Лицензионный ключ",
      activateBtn: "Активировать",
      success: "Ключ принят",
      secure: "Безопасная активация",
      errorEmpty: "Введите ключ",
      errorInvalid: "Неверный ключ",
      noCode: "У меня есть промокод",
    },
    en: {
      title: "Activate HabitAi PRO",
      subtitle: "Enter license key to activate PRO.",
      featuresTitle: "Features:",
      features: [
        "Unlimited habits",
        "Smart AI Coach & Analysis",
        "All premium themes unlocked",
        "Cloud Backup & Export",
        "Priority Support",
        "PRO Badge on profile"
      ],
      inputPlaceholder: "License Key",
      activateBtn: "Activate",
      success: "Key accepted",
      secure: "Secure Activation",
      errorEmpty: "Enter key",
      errorInvalid: "Invalid key",
      noCode: "I have a promo code",
    }
  }[language];

  const handleActivate = async () => {
    if (!code.trim()) {
        setError(t.errorEmpty);
        return;
    }
    setLoading(true);
    setError(null);
    
    try {
        const result = await onRedeem(code.trim().toUpperCase());
        if (result) {
            setSuccess(true);
            setTimeout(() => {
                onClose();
                setSuccess(false);
                setCode('');
            }, 2000);
        } else {
            setError(t.errorInvalid);
        }
    } catch (e) {
        setError(t.errorInvalid);
    } finally {
        setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            transition={motionContainer}
            className="bg-surface w-full max-w-lg rounded-3xl overflow-hidden relative shadow-2xl flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Header Image / Gradient */}
            <div className="h-32 bg-gradient-to-br from-brand via-purple-600 to-indigo-900 relative shrink-0">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                <div className="absolute -bottom-10 left-0 right-0 flex justify-center">
                    <div className="w-20 h-20 bg-surface rounded-full p-1.5 shadow-xl">
                        <div className="w-full h-full bg-gradient-to-tr from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white">
                            <Crown size={32} fill="currentColor" />
                        </div>
                    </div>
                </div>
                <button onClick={onClose} className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white p-2 rounded-full transition-colors">
                    <X size={20} />
                </button>
            </div>

            <div className="p-6 pt-12 overflow-y-auto custom-scrollbar">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-black text-textPrimary leading-tight mb-2">{t.title}</h2>
                    <p className="text-sm text-textSecondary">{t.subtitle}</p>
                </div>

                {/* Input Section - The "Silent" Payment Method */}
                <div className="mb-8">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Key className="h-5 w-5 text-textSecondary" />
                        </div>
                        <input
                            type="text"
                            value={code}
                            onChange={(e) => { setCode(e.target.value.toUpperCase()); setError(null); }}
                            placeholder={t.inputPlaceholder}
                            className={`
                                block w-full pl-10 pr-3 py-4 border rounded-xl leading-5 bg-surfaceHighlight/50 text-textPrimary placeholder-textSecondary/50 focus:outline-none focus:ring-2 transition-all font-mono font-bold tracking-wider uppercase
                                ${error ? 'border-red-500 focus:ring-red-500' : success ? 'border-green-500 focus:ring-green-500' : 'border-borderSubtle focus:border-brand focus:ring-brand'}
                            `}
                        />
                    </div>
                    {error && <p className="mt-2 text-xs text-red-500 font-bold text-center animate-slideUp">{error}</p>}
                    
                    <button
                        onClick={handleActivate}
                        disabled={loading || success}
                        className={`w-full mt-4 flex items-center justify-center py-4 border border-transparent text-base font-bold rounded-xl text-white transition-all shadow-lg
                            ${success ? 'bg-green-500 hover:bg-green-600' : 'bg-brand hover:bg-brand/90 hover:scale-[1.02] active:scale-[0.98]'}
                            ${loading ? 'opacity-70 cursor-not-allowed' : ''}
                        `}
                    >
                        {loading ? <Loader2 className="animate-spin" /> : success ? t.success : t.activateBtn}
                    </button>

                    {/* WEB ONLY: Helper Link to Buy */}
                    {!isNative && (
                        <div className="text-center mt-3">
                            <a 
                                href={TELEGRAM_BOT_URL} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-brand font-bold hover:underline inline-flex items-center gap-1"
                            >
                                {t.noCode} <ExternalLink size={10} />
                            </a>
                        </div>
                    )}
                </div>

                {/* Features List */}
                <div>
                    <h3 className="text-xs font-bold text-textSecondary uppercase tracking-wider mb-3 text-center">{t.featuresTitle}</h3>
                    <div className="space-y-3 bg-surfaceHighlight/30 p-4 rounded-2xl border border-borderSubtle">
                        {t.features.map((feature, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <div className="bg-brand/10 text-brand p-1 rounded-full shrink-0">
                                    <Check size={12} strokeWidth={4} />
                                </div>
                                <span className="text-sm font-medium text-textPrimary">{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-6 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1 text-[10px] text-textSecondary opacity-70">
                        <ShieldCheck size={12} /> {t.secure}
                    </div>
                </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubscriptionModal;
