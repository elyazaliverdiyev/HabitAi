/**
 * nativeSteps.ts — Нативные шаги с датчика (Android PWA / Capacitor).
 *
 * Три источника (по приоритету):
 *  1. Capacitor Pedometer (нативное приложение Android/iOS) — если установлено
 *  2. Generic Sensor API (Android Chrome: Accelerometer + фильтр) —
 *     честные шаги с аппаратного датчика, без Math.random
 *  3. Наш DeviceMotion-шагомер (iOS Safari и fallback) — только при открытом экране
 *
 * Хранилище: та же схема habitai_steps_YYYY-MM-DD, что у stepTracker,
 * поэтому все существующие компоненты работают без изменений.
 */

type StepsCallback = (steps: number) => void;

interface PedometerLike {
  start(): void;
  stop(): void;
  addEventListener(type: string, cb: (e: any) => void): void;
}

class NativeStepsService {
  private accelerometer: any = null;
  private listeners: StepsCallback[] = [];
  private lastPeak = 0;
  private lastMagnitude = 0;
  private running = false;

  private todayKey(): string {
    const d = new Date();
    return `habitai_steps_${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }

  getStepsToday(): number {
    if (typeof window === 'undefined') return 0;
    const saved = localStorage.getItem(this.todayKey());
    return saved ? parseInt(saved, 10) || 0 : 0;
  }

  private setSteps(count: number) {
    localStorage.setItem(this.todayKey(), String(count));
    this.listeners.forEach(l => l(count));
  }

  private addSteps(delta: number) {
    this.setSteps(this.getStepsToday() + delta);
  }

  /**
   * Источник 1: Generic Sensor API (Android Chrome).
   * Аппаратный акселерометр с частотой ОС — работает в PWA-вкладке.
   */
  isSensorApiAvailable(): boolean {
    return typeof window !== 'undefined' && 'Accelerometer' in window;
  }

  /**
   * Источник 2: Capacitor (нативное Android-приложение).
   * @capacitor/pedometer-step-counter или HealthKit — при наличии.
   */
  private async tryCapacitorPedometer(): Promise<PedometerLike | null> {
    try {
      const cap = (window as any).Capacitor;
      if (!cap?.Plugins?.Pedometer) return null;
      return cap.Plugins.Pedometer;
    } catch {
      return null;
    }
  }

  async start(): Promise<boolean> {
    if (this.running) return true;
    this.running = true;

    // 1. Capacitor-пейдометр (нативный бридж)
    const pedo = await this.tryCapacitorPedometer();
    if (pedo) {
      try {
        pedo.addEventListener?.('step', () => this.addSteps(1));
        pedo.start();
        console.log('[NativeSteps] Capacitor pedometer активен');
        return true;
      } catch (e) {
        console.warn('[NativeSteps] capacitor pedometer failed:', e);
      }
    }

    // 2. Generic Sensor API (Android Chrome)
    if (this.isSensorApiAvailable()) {
      try {
        const freq = { frequency: 20 }; // 20 Hz — стандарт шагомеров
        this.accelerometer = new (window as any).Accelerometer(freq);
        this.accelerometer.addEventListener('reading', () => {
          const { x, y, z } = this.accelerometer;
          const magnitude = Math.sqrt(x * x + y * y + z * z);
          const now = Date.now();

          // Пиковый детектор шага (порог 12.2 m/s², интервал ≥260мс)
          if (
            magnitude > 12.2 &&
            this.lastMagnitude <= 12.2 &&
            now - this.lastPeak > 260
          ) {
            this.lastPeak = now;
            this.addSteps(1);
          }
          this.lastMagnitude = magnitude;
        });
        this.accelerometer.start();
        console.log('[NativeSteps] Generic Sensor API активен (Android)');
        return true;
      } catch (e) {
        console.warn('[NativeSteps] sensor api failed (нужен permission):', e);
        // Permission API — запросим явно
        try {
          const perm = await (navigator as any).permissions.query({ name: 'accelerometer' });
          if (perm.state === 'denied') return false;
        } catch { /* ignore */ }
      }
    }

    // 3. Fallback — DeviceMotion (наш stepTracker уже это делает)
    this.running = false;
    return false;
  }

  stop() {
    if (this.accelerometer) {
      try { this.accelerometer.stop(); } catch { /* ignore */ }
      this.accelerometer = null;
    }
    this.running = false;
  }

  subscribe(cb: StepsCallback): () => void {
    this.listeners.push(cb);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }
}

export const nativeSteps = new NativeStepsService();
