/**
 * UpdateBanner — красивый баннер внизу экрана когда доступно обновление.
 *
 * Появляется снизу, не блокирует контент.
 * Пользователь может обновить или отложить.
 */
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Sparkles } from 'lucide-react';
import { motionPress, motionControl, motionContainer, motionSheet, motionPage, motionCelebrate } from '../utils/motionPresets';

interface UpdateBannerProps {
  show: boolean;
  isUpdating: boolean;
  version?: string;
  language: 'ru' | 'en';
  onUpdate: () => void;
  onDismiss: () => void;
}

const UpdateBanner: React.FC<UpdateBannerProps> = ({
  show,
  isUpdating,
  language,
  onUpdate,
  onDismiss,
}) => {
  const t = {
    title: language === 'ru' ? 'Доступно обновление' : 'Update Available',
    subtitle: language === 'ru'
      ? 'Новая версия готова к установке'
      : 'A new version is ready to install',
    update: language === 'ru' ? 'Обновить' : 'Update',
    updating: language === 'ru' ? 'Обновляем...' : 'Updating...',
    later: language === 'ru' ? 'Позже' : 'Later',
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={motionControl}
          className="fixed bottom-24 left-4 right-4 z-[9999] mx-auto max-w-sm"
        >
          <div
            className="rounded-2xl p-4 flex items-center gap-3 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(30,30,50,0.98), rgba(20,20,40,0.98))',
              border: '1px solid rgba(167,139,250,0.3)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 1px rgba(167,139,250,0.1)',
            }}
          >
            {/* Иконка */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: 'linear-gradient(135deg, rgba(167,139,250,0.2), rgba(139,92,246,0.15))',
                border: '1px solid rgba(167,139,250,0.3)',
              }}
            >
              <Sparkles size={18} style={{ color: '#a78bfa' }} />
            </div>

            {/* Текст */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white leading-tight">
                {t.title}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {t.subtitle}
              </p>
            </div>

            {/* Кнопки */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Кнопка «Позже» */}
              <button
                onClick={onDismiss}
                className="p-1.5 rounded-lg transition-all active:scale-95"
                style={{ color: 'rgba(255,255,255,0.4)' }}
              >
                <X size={16} />
              </button>

              {/* Кнопка «Обновить» */}
              <button
                onClick={onUpdate}
                disabled={isUpdating}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 disabled:opacity-60"
                style={{
                  background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(139,92,246,0.4)',
                }}
              >
                {isUpdating ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.updating}
                  </>
                ) : (
                  <>
                    <Download size={13} />
                    {t.update}
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default UpdateBanner;
