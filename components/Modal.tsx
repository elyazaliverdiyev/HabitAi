
import React, { useEffect, useState, useCallback, useContext, createContext, useRef } from 'react';
import { X, ChevronLeft } from 'lucide-react';
import { springModal } from '../utils/motionPresets';

// =============================================
// Modal Navigation Context — "Menu inside Menu"
// =============================================

interface ModalPage {
  key: string;
  title: string;
  content: React.ReactNode;
}

interface ModalNavContextType {
  push: (page: ModalPage) => void;
  pop: () => void;
  canGoBack: boolean;
}

const ModalNavContext = createContext<ModalNavContextType>({
  push: () => { },
  pop: () => { },
  canGoBack: false,
});

/** Hook for child components to navigate within a modal */
export const useModalNav = () => useContext(ModalNavContext);

// =============================================
// Size Configuration
// =============================================

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  full: 'max-w-full sm:max-w-4xl',
} as const;

const HEIGHT_LIMITS = {
  sm: 'max-h-[60vh] sm:max-h-[50vh]',
  md: 'max-h-[90vh] sm:max-h-[85vh]',
  lg: 'max-h-[92vh] sm:max-h-[88vh]',
  xl: 'max-h-[94vh] sm:max-h-[90vh]',
  full: 'max-h-[100vh] sm:max-h-[95vh]',
} as const;

// =============================================
// Modal Component
// =============================================

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  closeOnBackdropClick?: boolean;
  /** Enable nested page navigation */
  enableNavigation?: boolean;
  /** Modal size: sm, md (default), lg, xl, full */
  size?: keyof typeof SIZES;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  closeOnBackdropClick = true,
  enableNavigation = false,
  size = 'md',
}) => {
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [contentReady, setContentReady] = useState(false);

  // === Navigation Stack ===
  const [pageStack, setPageStack] = useState<ModalPage[]>([]);
  const [direction, setDirection] = useState(1);
  const currentPage = pageStack.length > 0 ? pageStack[pageStack.length - 1] : null;
  const displayTitle = currentPage?.title || title;

  // === Swipe-to-dismiss ===
  const touchStartY = useRef(0);
  const touchDeltaY = useRef(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Light/dark theme detection
  const LIGHT_THEMES = ['daylight', 'ios-light', 'frosted-glass'];
  const currentTheme = typeof document !== 'undefined'
    ? document.documentElement.getAttribute('data-theme') || ''
    : '';
  const isDarkMode = !LIGHT_THEMES.includes(currentTheme);

  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setContentReady(false);
      setPageStack([]);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimating(true);
          setTimeout(() => setContentReady(true), 50);
        });
      });
    } else {
      setAnimating(false);
      setContentReady(false);
      const timer = setTimeout(() => setVisible(false), 280);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdropClick) {
      onClose();
    }
  }, [closeOnBackdropClick, onClose]);

  // === Swipe-to-dismiss handlers ===
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow swipe when scroll is at top
    const scrollEl = scrollRef.current;
    if (scrollEl && scrollEl.scrollTop > 5) return;

    touchStartY.current = e.touches[0].clientY;
    touchDeltaY.current = 0;
    isDragging.current = true;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current) return;

    const delta = e.touches[0].clientY - touchStartY.current;
    touchDeltaY.current = delta;

    // Only allow downward drag
    if (delta > 0 && modalRef.current) {
      // Rubber-band effect: diminishing returns after 100px
      const dampened = delta > 100 ? 100 + (delta - 100) * 0.3 : delta;
      modalRef.current.style.transform = `translateY(${dampened}px) scale(${1 - dampened * 0.001})`;
      modalRef.current.style.transition = 'none';
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const threshold = 120; // px to dismiss

    if (touchDeltaY.current > threshold) {
      // Dismiss
      if (modalRef.current) {
        modalRef.current.style.transform = 'translateY(100vh)';
        modalRef.current.style.transition = 'transform 300ms cubic-bezier(0.32, 0.72, 0, 1)';
      }
      setTimeout(onClose, 200);
    } else {
      // Snap back
      if (modalRef.current) {
        modalRef.current.style.transform = '';
        modalRef.current.style.transition = 'transform 350ms cubic-bezier(0.32, 0.72, 0, 1)';
      }
    }
    touchDeltaY.current = 0;
  }, [onClose]);

  // Navigation handlers
  const push = useCallback((page: ModalPage) => {
    setDirection(1);
    setPageStack(prev => [...prev, page]);
  }, []);

  const pop = useCallback(() => {
    setDirection(-1);
    setPageStack(prev => prev.slice(0, -1));
  }, []);

  const handleBack = useCallback(() => {
    if (pageStack.length > 0) {
      pop();
    }
  }, [pageStack.length, pop]);

  const navContext: ModalNavContextType = {
    push,
    pop,
    canGoBack: pageStack.length > 0,
  };

  if (!visible) return null;

  // Glass styles
  const glassModalStyles: React.CSSProperties = isDarkMode ? {
    background: 'rgb(28, 28, 30)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
  } : {
    background: 'rgb(255, 255, 255)',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.12), inset 0 1px 0 rgba(255, 255, 255, 0.9)',
  };

  const glassHeaderStyles: React.CSSProperties = isDarkMode ? {
    background: 'rgba(255, 255, 255, 0.03)',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  } : {
    background: '#f8fafc',
    borderBottom: '1px solid rgba(0, 0, 0, 0.06)',
  };

  return (
    <ModalNavContext.Provider value={navContext}>
      <div
        className="fixed inset-0 z-[10000] flex items-end sm:items-center justify-center modal-overlay"
        onClick={handleBackdropClick}
        style={{
          backgroundColor: animating
            ? (isDarkMode ? 'rgba(0, 0, 0, 0.6)' : 'rgba(0, 0, 0, 0.35)')
            : 'rgba(0, 0, 0, 0)',
          backdropFilter: animating ? 'blur(4px)' : 'none',
          WebkitBackdropFilter: animating ? 'blur(4px)' : 'none',
          transition: 'background-color 250ms ease',
        }}
      >
        <div
          ref={modalRef}
          className={`w-full ${SIZES[size]} rounded-t-[28px] sm:rounded-[28px] overflow-hidden flex flex-col ${HEIGHT_LIMITS[size]}`}
          style={{
            ...glassModalStyles,
            transform: animating
              ? 'translateY(0) scale(1)'
              : 'translateY(24px) scale(0.98)',
            opacity: animating ? 1 : 0,
            transition: animating
              ? 'transform 380ms cubic-bezier(0.32, 0.72, 0, 1), opacity 250ms ease'
              : 'transform 240ms cubic-bezier(0.32, 0.72, 0, 1), opacity 200ms ease',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Pill handle on mobile — enlarged for better swipe target */}
          <div className="sm:hidden flex justify-center pt-2.5 pb-1.5 cursor-grab active:cursor-grabbing">
            <div
              className="w-10 h-[5px] rounded-full transition-colors"
              style={{ background: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)' }}
            />
          </div>

          {/* Header with back button */}
          <div
            className={`flex items-center justify-between px-5 py-3.5 shrink-0 ${!isDarkMode ? 'border-b border-borderSubtle' : ''}`}
            style={glassHeaderStyles}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1">
              {enableNavigation && pageStack.length > 0 && (
                <button
                  onClick={handleBack}
                  className={`p-1.5 -ml-1.5 rounded-lg transition-colors shrink-0 ${isDarkMode ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-surfaceHighlight text-textSecondary hover:text-textPrimary'}`}
                >
                  <ChevronLeft size={20} />
                </button>
              )}
              <h2 className="text-lg font-bold text-textPrimary truncate">{displayTitle}</h2>
            </div>
            <button
              onClick={onClose}
              className={`p-2 rounded-full btn-press shrink-0 ${isDarkMode ? 'hover:bg-white/10 text-white/60 hover:text-white' : 'hover:bg-surfaceHighlight text-textSecondary hover:text-textPrimary'}`}
            >
              <X size={20} />
            </button>
          </div>

          {/* Content — scrollable area */}
          {(!enableNavigation || !currentPage) && (
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5 pt-1"
              style={{
                opacity: contentReady && animating ? 1 : 0,
                transition: 'opacity 200ms ease',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                minHeight: 0,
              }}
            >
              {contentReady ? children : <div className="flex items-center justify-center py-12"><div className="w-6 h-6 border-2 border-current border-t-transparent rounded-full animate-spin opacity-30" /></div>}
            </div>
          )}

          {/* Nested page — replaces root when active */}
          {enableNavigation && currentPage && (
            <div
              className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5 pt-1"
              style={{
                opacity: animating ? 1 : 0,
                transition: 'opacity 200ms ease 100ms',
                WebkitOverflowScrolling: 'touch',
                overscrollBehavior: 'contain',
                minHeight: 0,
              }}
            >
              {currentPage.content}
            </div>
          )}
        </div>
      </div>
    </ModalNavContext.Provider >
  );
};

export default Modal;
