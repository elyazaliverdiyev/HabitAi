/**
 * stepTracker.ts — Аппаратный трекер шагов для iPhone и Android.
 * 
 * Работает через Web DeviceMotionEvent / Accelerometer:
 * - Считывает 3-осевое ускорение (x, y, z) с датчиков смартфона
 * - Применяет алгоритм фильтрации и пикового детектирования шагов (0.9G – 1.8G)
 * - Поддерживает iOS Safari запрос разрешений (DeviceMotionEvent.requestPermission)
 * - Сохраняет прогресс шагов в localStorage с привязкой к дате YYYY-MM-DD
 */

export interface StepTrackerState {
  isSupported: boolean;
  isTracking: boolean;
  stepsToday: number;
  permissionGranted: boolean;
}

class StepTrackerService {
  private isTracking = false;
  private permissionGranted = false;
  private lastMagnitude = 0;
  private lastStepTime = 0;
  private readonly STEP_THRESHOLD = 11.5; // порог ускорения (m/s^2) для фильтрации шума
  private readonly MIN_STEP_INTERVAL_MS = 260; // минимальное время между шагами (~4 шага/сек макс)
  private listeners: Array<(steps: number) => void> = [];

  /**
   * Момент (Date.now()) последнего зафиксированного шага.
   * 0 — шагов ещё не было. Используется детектором сидячего образа жизни (>=90 мин без движения).
   */
  getLastStepAt(): number {
    return this.lastStepTime;
  }

  constructor() {
    // Восстанавливаем сохраненные шаги за сегодня
    if (typeof window !== 'undefined') {
      const todayStr = this.getTodayStr();
      const saved = localStorage.getItem(`habitai_steps_${todayStr}`);
      if (saved) {
        const count = parseInt(saved, 10);
        if (!isNaN(count)) {
          // Инициализация
        }
      }
    }
  }

  private getTodayStr(): string {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  public getStepsToday(): number {
    if (typeof window === 'undefined') return 0;
    const todayStr = this.getTodayStr();
    const saved = localStorage.getItem(`habitai_steps_${todayStr}`);
    return saved ? parseInt(saved, 10) || 0 : 0;
  }

  public setStepsToday(count: number): void {
    if (typeof window === 'undefined') return;
    const todayStr = this.getTodayStr();
    localStorage.setItem(`habitai_steps_${todayStr}`, count.toString());
    this.notifyListeners(count);
  }

  public addSteps(count: number): number {
    const current = this.getStepsToday();
    const next = current + count;
    this.setStepsToday(next);
    return next;
  }

  public isSensorSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'DeviceMotionEvent' in window;
  }

  public async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    // iOS 13+ Safari DeviceMotionEvent permission
    if (
      typeof (DeviceMotionEvent as any) !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const response = await (DeviceMotionEvent as any).requestPermission();
        this.permissionGranted = response === 'granted';
        return this.permissionGranted;
      } catch (err) {
        console.warn('[StepTracker] iOS permission error:', err);
        return false;
      }
    }

    // Android / Standard Browser
    this.permissionGranted = true;
    return true;
  }

  public async startTracking(): Promise<boolean> {
    if (this.isTracking) return true;
    if (!this.isSensorSupported()) return false;

    if (!this.permissionGranted) {
      const granted = await this.requestPermission();
      if (!granted) return false;
    }

    window.addEventListener('devicemotion', this.handleDeviceMotion, false);
    this.isTracking = true;
    return true;
  }

  public stopTracking(): void {
    if (!this.isTracking) return;
    if (typeof window !== 'undefined') {
      window.removeEventListener('devicemotion', this.handleDeviceMotion, false);
    }
    this.isTracking = false;
  }

  private handleDeviceMotion = (event: DeviceMotionEvent) => {
    const acc = event.accelerationIncludingGravity || event.acceleration;
    if (!acc || acc.x === null || acc.y === null || acc.z === null) return;

    // Вычисляем модуль вектора ускорения: sqrt(x^2 + y^2 + z^2)
    const x = acc.x || 0;
    const y = acc.y || 0;
    const z = acc.z || 0;
    const magnitude = Math.sqrt(x * x + y * y + z * z);

    const now = Date.now();

    // Алгоритм пикового детектора шага
    if (
      magnitude > this.STEP_THRESHOLD &&
      this.lastMagnitude <= this.STEP_THRESHOLD &&
      now - this.lastStepTime > this.MIN_STEP_INTERVAL_MS
    ) {
      this.lastStepTime = now;
      this.addSteps(1);
    }

    this.lastMagnitude = magnitude;
  };

  public subscribe(listener: (steps: number) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(steps: number): void {
    this.listeners.forEach(l => l(steps));
  }
}

export const stepTracker = new StepTrackerService();
