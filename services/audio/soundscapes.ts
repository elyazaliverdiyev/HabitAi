/**
 * soundscapes.ts — Синтезатор звуковых ландшафтов для режима фокуса.
 * 
 * Генерирует в реальном времени через Web Audio API без скачивания MP3 файлов:
 * 1. Deep Brown Noise (Коричневый шум для блокировки отвлечений и стимуляции дофамина)
 * 2. Theta Waves 432 Hz / 528 Hz (Бинауральные тета-волны для глубокой концентрации и памяти)
 * 3. Gentle Stream / Flow (Успокаивающий шум водного потока)
 */

export type SoundscapeType = 'none' | 'brown' | 'theta432' | 'stream';

class SoundscapeEngine {
  private ctx: AudioContext | null = null;
  private currentType: SoundscapeType = 'none';
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private isPlaying = false;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.setValueAtTime(0.18, this.ctx.currentTime);
        this.masterGain.connect(this.ctx.destination);
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(volume: number) {
    if (this.masterGain && this.ctx) {
      const clamped = Math.max(0, Math.min(1, volume));
      this.masterGain.gain.linearRampToValueAtTime(clamped * 0.25, this.ctx.currentTime + 0.1);
    }
  }

  public play(type: SoundscapeType) {
    this.stop();
    if (type === 'none') return;

    this.initContext();
    if (!this.ctx || !this.masterGain) return;

    this.currentType = type;
    this.isPlaying = true;

    if (type === 'brown') {
      this.playBrownNoise();
    } else if (type === 'theta432') {
      this.playTheta432();
    } else if (type === 'stream') {
      this.playStreamFlow();
    }
  }

  public stop() {
    this.activeNodes.forEach(node => {
      try {
        if ('stop' in node && typeof (node as any).stop === 'function') {
          (node as any).stop();
        }
        node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
    this.currentType = 'none';
    this.isPlaying = false;
  }

  public getCurrentType(): SoundscapeType {
    return this.currentType;
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }

  // 1. Deep Brown Noise Generator (1/f^2 spectrum)
  private playBrownNoise() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      lastOut = (lastOut + 0.02 * white) / 1.02;
      data[i] = lastOut * 3.5; // Gain compensation
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Lowpass filter for warm soothing tone
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    noise.connect(filter);
    filter.connect(this.masterGain);

    noise.start();
    this.activeNodes.push(noise, filter);
  }

  // 2. Theta 432 Hz Binaural Carrier Generator
  private playTheta432() {
    if (!this.ctx || !this.masterGain) return;

    // Carrier 432 Hz (Left) and 438 Hz (Right -> 6 Hz Theta beat)
    const baseFreq = 432;
    const beatFreq = 6; // 6 Hz Theta wave for deep focus & subconscious retention

    const merger = this.ctx.createChannelMerger(2);

    const oscLeft = this.ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(baseFreq, this.ctx.currentTime);

    const oscRight = this.ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(baseFreq + beatFreq, this.ctx.currentTime);

    const gainL = this.ctx.createGain();
    gainL.gain.setValueAtTime(0.5, this.ctx.currentTime);
    const gainR = this.ctx.createGain();
    gainR.gain.setValueAtTime(0.5, this.ctx.currentTime);

    oscLeft.connect(gainL);
    oscRight.connect(gainR);

    gainL.connect(merger, 0, 0);
    gainR.connect(merger, 0, 1);

    merger.connect(this.masterGain);

    oscLeft.start();
    oscRight.start();

    this.activeNodes.push(oscLeft, oscRight, gainL, gainR, merger);
  }

  // 3. Gentle Flowing Stream Generator
  private playStreamFlow() {
    if (!this.ctx || !this.masterGain) return;

    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1; // Pink-ish white
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    // Modulated bandpass filter for water resonance
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);

    // LFO for wave modulation
    const lfo = this.ctx.createOscillator();
    lfo.frequency.setValueAtTime(0.2, this.ctx.currentTime); // slow wave cycle
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(150, this.ctx.currentTime);

    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    noise.connect(filter);
    filter.connect(this.masterGain);

    noise.start();
    lfo.start();

    this.activeNodes.push(noise, filter, lfo, lfoGain);
  }
}

export const soundscapes = new SoundscapeEngine();
