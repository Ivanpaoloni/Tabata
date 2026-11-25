import {
  CheckCircle2,
  ChevronsLeft,
  ChevronsRight,
  Home as HomeIcon,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTabataTimer } from '../hooks/useTabataTimer';
import type { AppSettings, Workout } from '../types/workout';
import {
  formatCompactTime,
  formatTime,
  getContrastTextColor,
} from '../utils/timeline';

interface ActivePlayerProps {
  workout: Workout;
  settings: AppSettings;
  onToggleMute: () => void;
  onComplete: (actualElapsedSeconds: number, plannedDurationSeconds: number) => void;
  onExit: () => void;
}

export function ActivePlayer({
  workout,
  settings,
  onToggleMute,
  onComplete,
  onExit,
}: ActivePlayerProps) {
  const [confirmExit, setConfirmExit] = useState(false);
  const autoStartedRef = useRef(false);

  const timer = useTabataTimer(workout, settings, onComplete);

  useEffect(() => {
    if (!autoStartedRef.current && timer.steps.length > 0) {
      autoStartedRef.current = true;
      timer.start();
    }
  }, [timer]);

  const handleCloseClick = () => {
    if (timer.status === 'running' || timer.status === 'paused') {
      timer.pause();
      setConfirmExit(true);
    } else {
      onExit();
    }
  };

  if (timer.status === 'finished') {
    return (
      <div
        className="flex h-[100dvh] flex-col items-center justify-between bg-[#0A0A0A] px-6 text-center text-white"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="text-xs font-bold tracking-[0.25em] uppercase text-zinc-500">
          WORKOUT COMPLETADO
        </div>

        <div className="flex flex-col items-center">
          <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-[#9EFF00]/15 text-[#9EFF00] ring-2 ring-[#9EFF00]/40">
            <Trophy className="h-12 w-12" />
          </div>

          <h1 className="font-display text-5xl font-extrabold tracking-wide uppercase text-white">
            {workout.name}
          </h1>

          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-[#9EFF00]">
            <CheckCircle2 className="h-4 w-4" />
            Guardado en tu historial
          </div>

          <div className="mt-8 grid w-full max-w-xs grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-4">
              <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">
                TIEMPO REAL
              </div>
              <div className="font-display tabular-nums mt-1 text-4xl font-extrabold text-[#9EFF00]">
                {formatTime(timer.actualElapsedSeconds || timer.totalDurationSeconds)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#1C1C1E] p-4">
              <div className="text-[11px] font-bold tracking-widest uppercase text-zinc-400">
                PLANIFICADO
              </div>
              <div className="font-display tabular-nums mt-1 text-4xl font-extrabold text-white">
                {formatTime(timer.totalDurationSeconds)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid w-full max-w-sm grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              timer.restart();
              timer.start();
            }}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl border border-white/12 bg-[#1C1C1E] font-display text-xl font-extrabold tracking-wider uppercase text-white active:scale-95"
          >
            <RotateCcw className="h-5 w-5" />
            REPETIR
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex h-14 items-center justify-center gap-2 rounded-2xl bg-[#9EFF00] font-display text-xl font-extrabold tracking-wider uppercase text-black active:scale-95"
          >
            <HomeIcon className="h-5 w-5" />
            INICIO
          </button>
        </div>
      </div>
    );
  }

  const step = timer.currentStep;
  const bgColor = step?.color ?? '#9EFF00';
  const fgColor = getContrastTextColor(bgColor);
  const isDarkText = fgColor === '#0A0A0A';
  const displayTime = formatTime(timer.remainingMs / 1000);
  const isCountdownUrgent =
    timer.status === 'running' &&
    timer.remainingMs > 0 &&
    timer.remainingMs <= 3000;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#0A0A0A] text-white select-none">
      {/* Top Status Bar */}
      <header
        className="flex shrink-0 items-center justify-between gap-2 bg-[#0A0A0A] px-4 pb-2.5"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={handleCloseClick}
          className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#141414] text-zinc-200 active:scale-95"
          aria-label="Cerrar entrenamiento"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <div className="truncate font-display text-sm font-bold tracking-widest uppercase text-zinc-400">
            {workout.name}
          </div>
          <div className="tabular-nums flex items-center justify-center gap-2 text-xs font-semibold text-zinc-200">
            <span>
              Ciclo {step?.cycleIndex ?? 1}/{step?.totalCycles ?? 1}
            </span>
            {step && step.totalRounds > 1 && (
              <>
                <span className="text-zinc-600">·</span>
                <span>
                  Round {step.roundIndex}/{step.totalRounds}
                </span>
              </>
            )}
            <span className="text-zinc-600">·</span>
            <span className="text-[#9EFF00]">
              -{formatTime(timer.totalRemainingSeconds)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className={`flex h-11 w-11 items-center justify-center rounded-2xl border active:scale-95 ${
            settings.soundEnabled
              ? 'border-white/10 bg-[#141414] text-[#9EFF00]'
              : 'border-red-500/30 bg-red-500/15 text-red-400'
          }`}
          aria-label={settings.soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </button>
      </header>

      {/* Dominant Central Phase Block (60-65% height) */}
      <main
        className="relative mx-2.5 flex flex-[62] flex-col items-center justify-between overflow-hidden rounded-3xl px-4 py-5 transition-colors duration-200"
        style={{ backgroundColor: bgColor, color: fgColor }}
      >
        {/* Phase Label */}
        <div className="flex flex-col items-center text-center">
          <span
            className="font-display text-4xl font-extrabold leading-none tracking-wider uppercase sm:text-5xl"
            style={{ color: fgColor }}
          >
            {step?.label ?? 'READY'}
          </span>
          {timer.status === 'paused' && (
            <span
              className={`mt-2 rounded-full px-3 py-0.5 text-xs font-extrabold tracking-widest uppercase ${
                isDarkText ? 'bg-black/15 text-black' : 'bg-white/20 text-white'
              }`}
            >
              PAUSADO
            </span>
          )}
        </div>

        {/* Giant High-Contrast Clock */}
        <div
          className={`font-display tabular-nums flex items-center justify-center font-extrabold leading-[0.88] tracking-tight transition-transform duration-150 ${
            isCountdownUrgent ? 'scale-105' : 'scale-100'
          }`}
          style={{
            fontSize: 'clamp(5.75rem, 27vw, 10.5rem)',
            color: fgColor,
          }}
        >
          {displayTime}
        </div>

        {/* Discreet Corner Prev / Next Interval Controls */}
        <div className="flex w-full items-center justify-between">
          <button
            type="button"
            onClick={timer.prevStep}
            className={`flex h-12 w-14 items-center justify-center rounded-2xl transition active:scale-90 ${
              isDarkText
                ? 'bg-black/12 text-black hover:bg-black/20'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label="Intervalo anterior"
          >
            <ChevronsLeft className="h-7 w-7 stroke-[2.5]" />
          </button>

          <span
            className={`tabular-nums text-xs font-bold tracking-widest uppercase ${
              isDarkText ? 'text-black/60' : 'text-white/75'
            }`}
          >
            {timer.currentStepIndex + 1} / {timer.totalSteps}
          </span>

          <button
            type="button"
            onClick={timer.nextStep}
            className={`flex h-12 w-14 items-center justify-center rounded-2xl transition active:scale-90 ${
              isDarkText
                ? 'bg-black/12 text-black hover:bg-black/20'
                : 'bg-white/15 text-white hover:bg-white/25'
            }`}
            aria-label="Siguiente intervalo"
          >
            <ChevronsRight className="h-7 w-7 stroke-[2.5]" />
          </button>
        </div>

        {/* Subtle Phase Progress Bar */}
        <div
          className={`absolute right-0 bottom-0 left-0 h-2 ${
            isDarkText ? 'bg-black/15' : 'bg-white/20'
          }`}
        >
          <div
            className={`h-full transition-[width] duration-75 ${
              isDarkText ? 'bg-black/65' : 'bg-white/85'
            }`}
            style={{ width: `${Math.round(timer.stepProgress * 100)}%` }}
          />
        </div>
      </main>

      {/* UP NEXT Banner */}
      <div className="mx-2.5 mt-2.5 shrink-0">
        {step?.upNext ? (
          <div
            className="flex h-12 items-center justify-between rounded-2xl border px-4"
            style={{
              backgroundColor: `${step.upNext.color}1F`,
              borderColor: `${step.upNext.color}55`,
            }}
          >
            <span
              className="font-display text-sm font-extrabold tracking-widest"
              style={{ color: step.upNext.color }}
            >
              {'<<<'}
            </span>
            <div className="flex items-center gap-2 truncate font-display text-lg font-extrabold tracking-wider uppercase text-white">
              <span className="text-zinc-400">UP NEXT:</span>
              <span style={{ color: step.upNext.color }}>{step.upNext.label}</span>
              <span className="text-zinc-500">·</span>
              <span className="tabular-nums text-white">
                {formatCompactTime(step.upNext.durationSeconds)}
              </span>
            </div>
            <span
              className="font-display text-sm font-extrabold tracking-widest"
              style={{ color: step.upNext.color }}
            >
              {'>>>'}
            </span>
          </div>
        ) : (
          <div className="flex h-12 items-center justify-between rounded-2xl border border-[#9EFF00]/35 bg-[#9EFF00]/10 px-4">
            <span className="font-display text-sm font-extrabold tracking-widest text-[#9EFF00]">
              {'<<<'}
            </span>
            <span className="font-display text-lg font-extrabold tracking-widest uppercase text-[#9EFF00]">
              FINISH
            </span>
            <span className="font-display text-sm font-extrabold tracking-widest text-[#9EFF00]">
              {'>>>'}
            </span>
          </div>
        )}
      </div>

      {/* 3-Column Control Footer */}
      <footer
        className="grid shrink-0 grid-cols-3 items-center gap-2 px-4 pt-3"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
      >
        {/* Left: REPEATS LEFT */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#141414] py-3">
          <span className="font-display tabular-nums text-4xl font-extrabold leading-none text-[#3B82F6]">
            {step?.repeatsLeft ?? 0}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
            REPEATS LEFT
          </span>
        </div>

        {/* Center: Giant Play / Pause + Reset when paused */}
        <div className="flex flex-col items-center justify-center gap-1.5">
          <button
            type="button"
            onClick={timer.togglePlay}
            className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-black shadow-[0_0_28px_rgba(255,255,255,0.2)] transition active:scale-90"
            aria-label={timer.status === 'running' ? 'Pausar' : 'Reanudar'}
          >
            {timer.status === 'running' ? (
              <Pause className="h-9 w-9 fill-black" />
            ) : (
              <Play className="h-9 w-9 translate-x-0.5 fill-black" />
            )}
          </button>
          {timer.status === 'paused' && (
            <button
              type="button"
              onClick={timer.restart}
              className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase text-zinc-300 active:scale-95"
            >
              <RotateCcw className="h-3 w-3" />
              Reiniciar
            </button>
          )}
        </div>

        {/* Right: CYCLES LEFT */}
        <div className="flex flex-col items-center justify-center rounded-2xl border border-white/8 bg-[#141414] py-3">
          <span className="font-display tabular-nums text-4xl font-extrabold leading-none text-[#F97316]">
            {step?.cyclesLeft ?? 0}
          </span>
          <span className="mt-1 text-[10px] font-bold tracking-widest uppercase text-zinc-400">
            CYCLES LEFT
          </span>
        </div>
      </footer>

      {/* Confirm Exit Modal */}
      {confirmExit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-5 backdrop-blur-sm"
          onClick={() => setConfirmExit(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl border border-white/12 bg-[#141414] p-6 text-center shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-2xl font-extrabold tracking-wide uppercase text-white">
              ¿SALIR DEL WORKOUT?
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              El temporizador está en curso y se perderá el progreso actual.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setConfirmExit(false);
                  timer.start();
                }}
                className="h-12 rounded-2xl border border-white/12 bg-[#1C1C1E] font-display text-lg font-bold uppercase text-white active:scale-95"
              >
                SEGUIR
              </button>
              <button
                type="button"
                onClick={onExit}
                className="h-12 rounded-2xl bg-[#FF453A] font-display text-lg font-extrabold uppercase text-white active:scale-95"
              >
                SALIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
