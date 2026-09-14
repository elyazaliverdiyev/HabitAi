// Простой синтезатор звуков, чтобы не скачивать mp3
export const audioCtx = typeof window !== 'undefined' && (window.AudioContext || (window as any).webkitAudioContext)
  ? new (window.AudioContext || (window as any).webkitAudioContext)()
  : null;

// ===== HAPTIC FEEDBACK =====
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  const durations = { light: 10, medium: 25, heavy: 50 };
  try {
    if (navigator.vibrate) {
      navigator.vibrate(durations[type]);
    }
  } catch (e) {
    // Vibration not supported — silent fallback
  }
};

// Initialize audio context (Unlock on first interaction for iOS)
export const initAudio = () => {
  if (!audioCtx) return;
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  // Play silent buffer to unlock iOS audio
  const buffer = audioCtx.createBuffer(1, 1, 22050);
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start(0);
};

export const playSound = (type: 'success' | 'click' | 'celebration' | 'wake' | 'morning' | 'streak_milestone' | 'combo') => {
  if (!audioCtx) return;

  // OPTIMIZATION: Wrap actual audio work in a function
  const doPlay = () => {
    const gain = audioCtx.createGain();
    gain.connect(audioCtx.destination);

    const now = audioCtx.currentTime;

    if (type === 'wake') {
      // Siri-like gentle double chime for assistant activation
      const freqs = [880, 1175.67]; // A5, D6 - pleasant rising interval

      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.connect(noteGain);
        noteGain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (i * 0.12));

        noteGain.gain.setValueAtTime(0, now + (i * 0.12));
        noteGain.gain.linearRampToValueAtTime(0.08, now + (i * 0.12) + 0.03);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.12) + 0.25);

        osc.start(now + (i * 0.12));
        osc.stop(now + (i * 0.12) + 0.3);
      });

    } else if (type === 'success') {
      // Приятный "дзынь" (одиночный)
      const osc = audioCtx.createOscillator();
      osc.connect(gain);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, now); // D5
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.1); // A5

      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.start(now);
      osc.stop(now + 0.3);

    } else if (type === 'click') {
      // Тихий клик
      const osc = audioCtx.createOscillator();
      osc.connect(gain);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(300, now);

      gain.gain.setValueAtTime(0.05, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

      osc.start(now);
      osc.stop(now + 0.05);

    } else if (type === 'celebration') {
      // Мажорный аккорд (C Major: C5, E5, G5) + высокий "блинг"
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6

      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.connect(noteGain);
        noteGain.connect(audioCtx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (i * 0.05)); // Арпеджио

        noteGain.gain.setValueAtTime(0, now);
        noteGain.gain.linearRampToValueAtTime(0.05, now + (i * 0.05) + 0.1);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.05) + 0.8);

        osc.start(now);
        osc.stop(now + 1.5);
      });

    } else if (type === 'morning') {
      // Gentle ascending D-major chime for Morning Ritual
      const freqs = [293.66, 369.99, 440.00]; // D4, F#4, A4
      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (i * 0.2));
        noteGain.gain.setValueAtTime(0, now + (i * 0.2));
        noteGain.gain.linearRampToValueAtTime(0.06, now + (i * 0.2) + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.2) + 0.8);
        osc.start(now + (i * 0.2));
        osc.stop(now + (i * 0.2) + 1.0);
      });

    } else if (type === 'streak_milestone') {
      // Triumphant ascending C-major fanfare for streak milestones
      const freqs = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5→E6
      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + (i * 0.08));
        noteGain.gain.setValueAtTime(0, now + (i * 0.08));
        noteGain.gain.linearRampToValueAtTime(0.07, now + (i * 0.08) + 0.05);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.08) + 1.2);
        osc.start(now + (i * 0.08));
        osc.stop(now + 2.0);
      });

    } else if (type === 'combo') {
      // Quick ascending triple-ping for combo activation
      const freqs = [587.33, 783.99, 1046.50]; // D5, G5, C6
      freqs.forEach((f, i) => {
        const osc = audioCtx.createOscillator();
        const noteGain = audioCtx.createGain();
        osc.connect(noteGain);
        noteGain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(f, now + (i * 0.06));
        noteGain.gain.setValueAtTime(0, now + (i * 0.06));
        noteGain.gain.linearRampToValueAtTime(0.08, now + (i * 0.06) + 0.02);
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + (i * 0.06) + 0.25);
        osc.start(now + (i * 0.06));
        osc.stop(now + (i * 0.06) + 0.3);
      });
    }
  };

  // OPTIMIZATION: If AudioContext is suspended (iOS does this after ~1sec of inactivity),
  // resume it asynchronously to not block the main thread. This can take 300-500ms on iOS!
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(doPlay).catch(() => { });
  } else {
    doPlay();
  }
};

// ===== RARITY SOUNDS =====
import { Rarity, SoundPack } from '../types';

// Sound file mapping - add files to public/sounds/ folder
// Naming: common.mp3, uncommon.mp3, rare.mp3/wav, epic.mp3, legendary.mp3
const RARITY_SOUND_FILES: Record<Rarity, string | null> = {
  common: null,     // Uses synth fallback (simple ping)
  uncommon: null,   // Uses synth fallback (double note)
  rare: '/sounds/Rare.wav',
  epic: null,       // Uses synth fallback (shimmer) - add Epic.mp3 to enable
  legendary: '/sounds/Legendary.wav',
};

// Volume levels per rarity (0.0 - 1.0)
const RARITY_VOLUMES: Record<Rarity, number> = {
  common: 0.3,
  uncommon: 0.4,
  rare: 0.5,
  epic: 0.6,
  legendary: 0.7,
};

// Track currently playing audio to prevent overlap
let currentSource: AudioBufferSourceNode | null = null;
let currentOscillators: OscillatorNode[] = [];
const audioBuffers: Record<string, AudioBuffer> = {};

// Load audio buffer helper
const loadAudioBuffer = async (src: string): Promise<AudioBuffer | null> => {
  if (audioBuffers[src]) return audioBuffers[src];
  if (!audioCtx) return null;
  try {
    const res = await fetch(src);
    const arrayBuffer = await res.arrayBuffer();
    const decoded = await audioCtx.decodeAudioData(arrayBuffer);
    audioBuffers[src] = decoded;
    return decoded;
  } catch (e) { console.error('Audio load failed:', e); return null; }
};

// Preload sounds
export const preloadSounds = () => {
  Object.values(RARITY_SOUND_FILES).forEach(src => {
    if (src) loadAudioBuffer(src);
  });
};

// Stop currently playing sound (audio file or synth)
export const stopCurrentSound = () => {
  // Stop buffer source
  if (currentSource) {
    try { currentSource.stop(); currentSource.disconnect(); } catch (e) { }
    currentSource = null;
  }

  // Stop synth oscillators
  if (currentOscillators.length > 0) {
    currentOscillators.forEach(osc => {
      try {
        osc.stop();
        osc.disconnect();
      } catch (e) { /* ignore if already stopped */ }
    });
    currentOscillators = [];
  }
};

// Play audio file (converted to buffer playback)
const playAudioFile = async (src: string, volume: number = 0.5) => {
  stopCurrentSound(); // Stop previous first!

  if (!audioCtx) return;

  // OPTIMIZATION: Resume asynchronously
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }

  try {
    const buffer = await loadAudioBuffer(src);
    if (!buffer) return;

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;

    // Create gain node for volume
    const gainNode = audioCtx.createGain();
    gainNode.gain.value = volume;

    source.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    source.start(0);
    currentSource = source; // Track it

    source.onended = () => {
      if (currentSource === source) currentSource = null;
    };
  } catch (e) {
    console.warn('Audio playback failed:', e);
  }
};

// Soft synth fallback for missing files
const playSynthFallback = (rarity: Rarity): void => {
  if (!audioCtx) return;

  // OPTIMIZATION: Wrap in doPlay for async resume
  const doPlay = () => {
    stopCurrentSound(); // Stop previous first!

    const now = audioCtx.currentTime;
    const volume = RARITY_VOLUMES[rarity] * 0.15; // Keep synth quiet

    // Simple pleasant ping - much softer than before
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.type = 'sine';

    // Different pitches per rarity
    const pitches: Record<Rarity, number> = {
      common: 523.25,    // C5
      uncommon: 659.25,  // E5
      rare: 783.99,      // G5
      epic: 1046.50,     // C6
      legendary: 1318.51 // E6
    };

    osc.frequency.setValueAtTime(pitches[rarity], now);
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.start(now);
    osc.stop(now + 0.3);

    // Track osc to stop later if needed
    currentOscillators.push(osc);
  };

  // OPTIMIZATION: Async resume for iOS
  if (audioCtx.state === 'suspended') {
    audioCtx.resume().then(doPlay).catch(() => { });
  } else {
    doPlay();
  }
};

export const playRaritySound = (rarity: Rarity, soundPack: SoundPack = 'premium'): void => {
  // If sounds are off, don't play anything
  if (soundPack === 'off') return;

  const soundFile = RARITY_SOUND_FILES[rarity];

  // If synth mode OR no premium file available, use synth
  if (soundPack === 'synth' || !soundFile) {
    playSynthFallback(rarity);
  } else {
    // Premium mode with available file
    playAudioFile(soundFile, RARITY_VOLUMES[rarity]);
  }
};