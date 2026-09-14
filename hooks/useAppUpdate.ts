/**
 * useAppUpdate — хук для отслеживания обновлений PWA.
 *
 * Как работает:
 * 1. Service Worker проверяет наличие новой версии при каждом запуске
 * 2. Если найдена новая версия → showUpdate = true
 * 3. Пользователь видит баннер → нажимает «Обновить» → страница перезагружается
 *
 * Совместим с vite-plugin-pwa (registerSW) и ручной регистрацией SW.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export interface AppUpdateState {
  showUpdate: boolean;          // показывать баннер обновления?
  updateAvailable: boolean;     // доступна новая версия?
  isUpdating: boolean;          // идёт процесс обновления?
  currentVersion: string;       // текущая версия из package.json
}

export interface AppUpdateActions {
  applyUpdate: () => void;      // применить обновление (перезагрузить)
  dismissUpdate: () => void;    // скрыть баннер (до следующей сессии)
}

// Версия из vite define или package.json
const CURRENT_VERSION = (import.meta as any).env?.VITE_APP_VERSION || '1.0.0';

export function useAppUpdate(): AppUpdateState & AppUpdateActions {
  const [showUpdate, setShowUpdate] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const waitingWorkerRef = useRef<ServiceWorker | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let checkInterval: ReturnType<typeof setInterval>;

    const registerAndWatch = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;

        // Сразу проверяем при загрузке
        registration.update().catch(() => {});

        // Если уже есть ожидающий SW (например после refresh)
        if (registration.waiting) {
          waitingWorkerRef.current = registration.waiting;
          setUpdateAvailable(true);
          setShowUpdate(true);
        }

        // Слушаем новый SW в состоянии installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'installed' &&
              navigator.serviceWorker.controller
            ) {
              // Новый SW установлен и ожидает активации
              waitingWorkerRef.current = newWorker;
              setUpdateAvailable(true);
              setShowUpdate(true);
            }
          });
        });

        // Периодическая проверка каждые 10 минут
        checkInterval = setInterval(() => {
          registration.update().catch(() => {});
        }, 10 * 60 * 1000);

      } catch (err) {
        console.debug('[useAppUpdate] SW not ready:', err);
      }
    };

    // Слушаем сообщение от SW о том что страница должна перезагрузиться
    const handleControllerChange = () => {
      if (isUpdating) {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);
    registerAndWatch();

    return () => {
      clearInterval(checkInterval);
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
    };
  }, []);

  // Ref для isUpdating — чтобы handleControllerChange не захватывал устаревшее значение
  const isUpdatingRef = useRef(false);

  const applyUpdate = useCallback(() => {
    setIsUpdating(true);
    isUpdatingRef.current = true;

    if (waitingWorkerRef.current) {
      // Сообщаем ожидающему SW взять управление
      waitingWorkerRef.current.postMessage({ type: 'SKIP_WAITING' });
    }

    // Fallback — перезагружаем через 600ms в любом случае
    // (controllerchange может не сработать в некоторых браузерах)
    setTimeout(() => {
      window.location.reload();
    }, 600);
  }, []);

  const dismissUpdate = useCallback(() => {
    setShowUpdate(false);
    // Снова показываем через 30 минут если пользователь закрыл баннер
    setTimeout(() => {
      if (updateAvailable) setShowUpdate(true);
    }, 30 * 60 * 1000);
  }, [updateAvailable]);

  return {
    showUpdate,
    updateAvailable,
    isUpdating,
    currentVersion: CURRENT_VERSION,
    applyUpdate,
    dismissUpdate,
  };
}
