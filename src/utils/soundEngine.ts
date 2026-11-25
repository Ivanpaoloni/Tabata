import type { AppSettings, AudioMode, PhaseType } from '../types/workout';

let sharedAudioCtx: AudioContext | null = null;

type NavigatorWithAudioSession = Navigator & {
  audioSession?: {
    type: string;
  };
};

export function applyAudioSessionMode(audioMode: AudioMode): void {
  if (typeof navigator === 'undefined') return;
  try {
    const nav = navigator as NavigatorWithAudioSession;
    if (nav.audioSession) {
      nav.audioSession.type = audioMode;
    }
  } catch {
    // Ignore unsupported audioSession errors
  }
}

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  return sharedAudioCtx;
}

/**
 * Must be called synchronously inside a user gesture (click/tap) to unlock audio on iOS Safari.
 */
export function unlockAudio(audioMode: AudioMode = 'playback'): void {
  applyAudioSessionMode(audioMode);

  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {
      // Ignore resume failures
    });
  }
  try {
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // Ignore silent buffer errors
  }
}

interface ToneOptions {
  frequency: number;
  endFrequency?: number;
  durationSec: number;
  delaySec?: number;
  gain?: number;
  type?: OscillatorType;
}

function playTone(options: ToneOptions): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (ctx.state === 'suspended') {
    void ctx.resume().catch(() => {});
  }

  const now = ctx.currentTime + (options.delaySec ?? 0);
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();

  osc.type = options.type ?? 'sine';
  osc.frequency.setValueAtTime(options.frequency, now);
  if (options.endFrequency) {
    osc.frequency.exponentialRampToValueAtTime(
      options.endFrequency,
      now + options.durationSec
    );
  }

  const peakGain = options.gain ?? 0.35;
  gainNode.gain.setValueAtTime(0.0001, now);
  gainNode.gain.linearRampToValueAtTime(peakGain, now + 0.012);
  gainNode.gain.exponentialRampToValueAtTime(
    0.0001,
    now + Math.max(0.03, options.durationSec)
  );

  osc.connect(gainNode);
  gainNode.connect(ctx.destination);

  osc.start(now);
  osc.stop(now + options.durationSec + 0.02);
}

export function playCountdownBeep(enabled: boolean): void {
  if (!enabled) return;
  playTone({
    frequency: 880,
    durationSec: 0.11,
    gain: 0.3,
    type: 'triangle',
  });
}

export function playWorkStart(enabled: boolean): void {
  if (!enabled) return;
  playTone({
    frequency: 1175,
    endFrequency: 1396,
    durationSec: 0.34,
    gain: 0.42,
    type: 'triangle',
  });
}

export function playRestStart(enabled: boolean): void {
  if (!enabled) return;
  playTone({
    frequency: 660,
    durationSec: 0.13,
    delaySec: 0,
    gain: 0.35,
    type: 'sine',
  });
  playTone({
    frequency: 440,
    durationSec: 0.2,
    delaySec: 0.15,
    gain: 0.35,
    type: 'sine',
  });
}

export function playPrepareStart(enabled: boolean): void {
  if (!enabled) return;
  playTone({
    frequency: 587,
    durationSec: 0.15,
    gain: 0.28,
    type: 'sine',
  });
}

export function playCooldownStart(enabled: boolean): void {
  if (!enabled) return;
  playTone({
    frequency: 523.25,
    endFrequency: 440,
    durationSec: 0.32,
    gain: 0.3,
    type: 'sine',
  });
}

export function playFinishFanfare(enabled: boolean): void {
  if (!enabled) return;
  playTone({ frequency: 523.25, durationSec: 0.16, delaySec: 0, gain: 0.36, type: 'triangle' });
  playTone({ frequency: 659.25, durationSec: 0.16, delaySec: 0.17, gain: 0.38, type: 'triangle' });
  playTone({ frequency: 1046.5, durationSec: 0.42, delaySec: 0.34, gain: 0.44, type: 'triangle' });
}

export function vibratePattern(pattern: number | number[], enabled: boolean): void {
  if (!enabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) {
    return;
  }
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore vibration errors
  }
}

export function speakPhase(text: string, settings: AppSettings): void {
  if (!settings.voiceEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.voiceLang;
    utterance.rate = 1.08;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    window.speechSynthesis.speak(utterance);
  } catch {
    // Ignore speech synthesis failures
  }
}

export function triggerPhaseFeedback(
  phase: PhaseType,
  label: string,
  settings: AppSettings
): void {
  switch (phase) {
    case 'work':
    case 'custom':
      playWorkStart(settings.soundEnabled);
      vibratePattern([120, 40, 120], settings.vibrationEnabled);
      break;
    case 'rest':
    case 'rest_between_cycles':
      playRestStart(settings.soundEnabled);
      vibratePattern([80, 60, 80], settings.vibrationEnabled);
      break;
    case 'prepare':
      playPrepareStart(settings.soundEnabled);
      vibratePattern(60, settings.vibrationEnabled);
      break;
    case 'cooldown':
      playCooldownStart(settings.soundEnabled);
      vibratePattern(100, settings.vibrationEnabled);
      break;
  }

  speakPhase(label, settings);
}

export function triggerFinishFeedback(settings: AppSettings): void {
  playFinishFanfare(settings.soundEnabled);
  vibratePattern([150, 70, 150, 70, 300], settings.vibrationEnabled);
  speakPhase(
    settings.voiceLang === 'es-ES' ? 'Entrenamiento completado' : 'Workout complete',
    settings
  );
}
