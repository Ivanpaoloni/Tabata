import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { AppSettings, TimelineStep, Workout } from '../types/workout';
import {
  playCountdownBeep,
  triggerFinishFeedback,
  triggerPhaseFeedback,
  unlockAudio,
} from '../utils/soundEngine';
import { flattenWorkoutToTimeline } from '../utils/timeline';
import { useWakeLock } from './useWakeLock';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'finished';

export interface UseTabataTimerResult {
  status: TimerStatus;
  steps: TimelineStep[];
  currentStep: TimelineStep | null;
  currentStepIndex: number;
  totalSteps: number;
  remainingMs: number;
  stepProgress: number;
  totalDurationSeconds: number;
  totalElapsedSeconds: number;
  totalRemainingSeconds: number;
  actualElapsedSeconds: number;
  start: () => void;
  pause: () => void;
  togglePlay: () => void;
  nextStep: () => void;
  prevStep: () => void;
  restart: () => void;
}

export function useTabataTimer(
  workout: Workout,
  settings: AppSettings,
  onComplete?: (actualElapsedSeconds: number, plannedDurationSeconds: number) => void
): UseTabataTimerResult {
  const steps = useMemo(() => flattenWorkoutToTimeline(workout), [workout]);
  const totalDurationSeconds = useMemo(
    () => steps.reduce((sum, s) => sum + s.durationSeconds, 0),
    [steps]
  );

  const [status, setStatus] = useState<TimerStatus>('idle');
  const [stepIndex, setStepIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(() =>
    steps[0] ? steps[0].durationSeconds * 1000 : 0
  );
  const [actualElapsedSeconds, setActualElapsedSeconds] = useState(0);

  const settingsRef = useRef(settings);
  const onCompleteRef = useRef(onComplete);
  const statusRef = useRef<TimerStatus>('idle');
  const stepIndexRef = useRef(0);
  const stepEndTimestampRef = useRef<number>(0);
  const remainingMsRef = useRef<number>(steps[0] ? steps[0].durationSeconds * 1000 : 0);
  const lastBeepSecondRef = useRef<number | null>(null);
  const activeRunStartMsRef = useRef<number | null>(null);
  const accumulatedActiveMsRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useWakeLock(status === 'running');

  const stopLoop = useCallback(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const commitActiveElapsed = useCallback(() => {
    if (activeRunStartMsRef.current !== null) {
      accumulatedActiveMsRef.current += performance.now() - activeRunStartMsRef.current;
      activeRunStartMsRef.current = null;
      setActualElapsedSeconds(Math.round(accumulatedActiveMsRef.current / 1000));
    }
  }, []);

  const finishWorkout = useCallback(() => {
    stopLoop();
    commitActiveElapsed();
    const finalElapsed = Math.round(accumulatedActiveMsRef.current / 1000);
    setRemainingMs(0);
    remainingMsRef.current = 0;
    setStatus('finished');
    statusRef.current = 'finished';
    triggerFinishFeedback(settingsRef.current);
    onCompleteRef.current?.(finalElapsed, totalDurationSeconds);
  }, [commitActiveElapsed, stopLoop, totalDurationSeconds]);

  const startLoop = useCallback(() => {
    stopLoop();

    const frame = () => {
      if (statusRef.current !== 'running') return;

      const now = performance.now();
      let rem = stepEndTimestampRef.current - now;

      if (rem <= 0) {
        let nextIdx = stepIndexRef.current + 1;
        let overflow = -rem;

        while (nextIdx < steps.length) {
          const nextStepDurationMs = steps[nextIdx].durationSeconds * 1000;
          if (overflow < nextStepDurationMs) {
            stepIndexRef.current = nextIdx;
            setStepIndex(nextIdx);
            lastBeepSecondRef.current = null;
            rem = nextStepDurationMs - overflow;
            stepEndTimestampRef.current = now + rem;
            remainingMsRef.current = rem;
            setRemainingMs(rem);
            triggerPhaseFeedback(
              steps[nextIdx].phase,
              steps[nextIdx].label,
              settingsRef.current
            );
            break;
          }
          overflow -= nextStepDurationMs;
          nextIdx += 1;
        }

        if (nextIdx >= steps.length) {
          finishWorkout();
          return;
        }
      } else {
        remainingMsRef.current = rem;
        setRemainingMs(rem);

        const secondsLeft = Math.ceil(rem / 1000);
        if (
          secondsLeft <= 3 &&
          secondsLeft >= 1 &&
          lastBeepSecondRef.current !== secondsLeft
        ) {
          const currentStepDur = steps[stepIndexRef.current]?.durationSeconds ?? 0;
          if (rem < currentStepDur * 1000 - 150 || currentStepDur > 3) {
            lastBeepSecondRef.current = secondsLeft;
            if (settingsRef.current.countdownBeeps) {
              playCountdownBeep(settingsRef.current.soundEnabled);
            }
          }
        }
      }

      if (activeRunStartMsRef.current !== null) {
        const totalActiveSec = Math.floor(
          (accumulatedActiveMsRef.current + (now - activeRunStartMsRef.current)) / 1000
        );
        setActualElapsedSeconds((prev) =>
          prev === totalActiveSec ? prev : totalActiveSec
        );
      }

      rafIdRef.current = requestAnimationFrame(frame);
    };

    rafIdRef.current = requestAnimationFrame(frame);
  }, [finishWorkout, steps, stopLoop]);

  const start = useCallback(() => {
    if (steps.length === 0) return;
    unlockAudio(settingsRef.current.audioMode);

    const now = performance.now();
    if (statusRef.current === 'idle' || statusRef.current === 'finished') {
      const firstDurationMs = steps[0].durationSeconds * 1000;
      stepIndexRef.current = 0;
      setStepIndex(0);
      remainingMsRef.current = firstDurationMs;
      setRemainingMs(firstDurationMs);
      stepEndTimestampRef.current = now + firstDurationMs;
      lastBeepSecondRef.current = null;
      accumulatedActiveMsRef.current = 0;
      setActualElapsedSeconds(0);
      activeRunStartMsRef.current = now;
      statusRef.current = 'running';
      setStatus('running');
      triggerPhaseFeedback(steps[0].phase, steps[0].label, settingsRef.current);
      startLoop();
    } else if (statusRef.current === 'paused') {
      stepEndTimestampRef.current = now + remainingMsRef.current;
      activeRunStartMsRef.current = now;
      statusRef.current = 'running';
      setStatus('running');
      startLoop();
    }
  }, [startLoop, steps]);

  const pause = useCallback(() => {
    if (statusRef.current !== 'running') return;
    stopLoop();
    const rem = Math.max(0, stepEndTimestampRef.current - performance.now());
    remainingMsRef.current = rem;
    setRemainingMs(rem);
    commitActiveElapsed();
    statusRef.current = 'paused';
    setStatus('paused');
  }, [commitActiveElapsed, stopLoop]);

  const togglePlay = useCallback(() => {
    if (statusRef.current === 'running') {
      pause();
    } else {
      start();
    }
  }, [pause, start]);

  const jumpToStep = useCallback(
    (targetIdx: number) => {
      if (steps.length === 0) return;
      unlockAudio(settingsRef.current.audioMode);
      const clamped = Math.max(0, Math.min(steps.length - 1, targetIdx));
      const targetStep = steps[clamped];
      const durMs = targetStep.durationSeconds * 1000;

      stepIndexRef.current = clamped;
      setStepIndex(clamped);
      remainingMsRef.current = durMs;
      setRemainingMs(durMs);
      lastBeepSecondRef.current = null;

      if (statusRef.current === 'running') {
        stepEndTimestampRef.current = performance.now() + durMs;
        triggerPhaseFeedback(targetStep.phase, targetStep.label, settingsRef.current);
      } else if (statusRef.current === 'finished') {
        statusRef.current = 'paused';
        setStatus('paused');
      }
    },
    [steps]
  );

  const nextStep = useCallback(() => {
    if (stepIndexRef.current >= steps.length - 1) {
      finishWorkout();
      return;
    }
    jumpToStep(stepIndexRef.current + 1);
  }, [finishWorkout, jumpToStep, steps.length]);

  const prevStep = useCallback(() => {
    const currentStep = steps[stepIndexRef.current];
    if (!currentStep) return;
    const elapsedInStepMs = currentStep.durationSeconds * 1000 - remainingMsRef.current;
    if (elapsedInStepMs > 2500 || stepIndexRef.current === 0) {
      jumpToStep(stepIndexRef.current);
    } else {
      jumpToStep(stepIndexRef.current - 1);
    }
  }, [jumpToStep, steps]);

  const restart = useCallback(() => {
    stopLoop();
    accumulatedActiveMsRef.current = 0;
    activeRunStartMsRef.current = null;
    setActualElapsedSeconds(0);
    const firstMs = steps[0] ? steps[0].durationSeconds * 1000 : 0;
    stepIndexRef.current = 0;
    setStepIndex(0);
    remainingMsRef.current = firstMs;
    setRemainingMs(firstMs);
    lastBeepSecondRef.current = null;
    statusRef.current = 'idle';
    setStatus('idle');
  }, [steps, stopLoop]);

  useEffect(() => {
    return () => {
      stopLoop();
    };
  }, [stopLoop]);

  const currentStep = steps[stepIndex] ?? null;
  const currentStepDurationMs = currentStep ? currentStep.durationSeconds * 1000 : 1;
  const stepProgress = currentStep
    ? Math.min(1, Math.max(0, 1 - remainingMs / currentStepDurationMs))
    : 1;

  const elapsedInCurrentStep = currentStep
    ? Math.max(0, currentStep.durationSeconds - remainingMs / 1000)
    : 0;
  const totalElapsedSeconds =
    status === 'finished'
      ? totalDurationSeconds
      : currentStep
        ? Math.min(totalDurationSeconds, currentStep.startOffsetSeconds + elapsedInCurrentStep)
        : 0;
  const totalRemainingSeconds = Math.max(0, totalDurationSeconds - totalElapsedSeconds);

  return {
    status,
    steps,
    currentStep,
    currentStepIndex: stepIndex,
    totalSteps: steps.length,
    remainingMs,
    stepProgress,
    totalDurationSeconds,
    totalElapsedSeconds,
    totalRemainingSeconds,
    actualElapsedSeconds,
    start,
    pause,
    togglePlay,
    nextStep,
    prevStep,
    restart,
  };
}
