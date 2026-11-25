import {
  Check,
  Home as HomeIcon,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useTabataTimer } from '../hooks/useTabataTimer';
import { PHASE_THEMES, type AppSettings, type Workout } from '../types/workout';
import { formatCompactTime, formatTime } from '../utils/timeline';

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
        className="flex h-dvh flex-col items-center justify-between bg-[#09090B] px-6 text-center text-[#FAFAFA]"
        style={{
          paddingTop: 'max(2rem, env(safe-area-inset-top))',
          paddingBottom: 'max(2rem, env(safe-area-inset-bottom))',
        }}
      >
        <div className="text-xs font-medium tracking-wide text-zinc-500">
          Sesión completada
        </div>

        <div className="flex w-full max-w-xs flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#34D399]/25 bg-[#34D399]/10 text-[#34D399]">
            <Check className="h-7 w-7 stroke-2" />
          </div>

          <h1 className="font-display text-2xl font-semibold tracking-tight text-[#FAFAFA]">
            {workout.name}
          </h1>

          <p className="mt-1.5 text-xs text-zinc-400">
            Guardado automáticamente en tu historial
          </p>

          <div className="mt-8 grid w-full grid-cols-2 gap-2.5">
            <div className="rounded-2xl border border-white/8 bg-[#121215] p-4">
              <div className="text-[11px] font-medium text-zinc-500">
                Tiempo real
              </div>
              <div className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
                {formatTime(timer.actualElapsedSeconds || timer.totalDurationSeconds)}
              </div>
            </div>
            <div className="rounded-2xl border border-white/8 bg-[#121215] p-4">
              <div className="text-[11px] font-medium text-zinc-500">
                Planificado
              </div>
              <div className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-zinc-300">
                {formatTime(timer.totalDurationSeconds)}
              </div>
            </div>
          </div>
        </div>

        <div className="grid w-full max-w-xs grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => {
              timer.restart();
              timer.start();
            }}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#121215] text-sm font-medium text-[#FAFAFA] transition hover:bg-[#18181B] active:scale-95"
          >
            <RotateCcw className="h-4 w-4 text-zinc-400" />
            Repetir
          </button>
          <button
            type="button"
            onClick={onExit}
            className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#FAFAFA] text-sm font-semibold text-[#09090B] transition hover:bg-zinc-200 active:scale-95"
          >
            <HomeIcon className="h-4 w-4" />
            Inicio
          </button>
        </div>
      </div>
    );
  }

  const step = timer.currentStep;
  const theme = PHASE_THEMES[step?.phase ?? 'work'];
  const upNextTheme = step?.upNext ? PHASE_THEMES[step.upNext.phase] : null;
  const displayTime = formatTime(timer.remainingMs / 1000);
  const progressPct = Math.round(timer.stepProgress * 100);

  return (
    <div
      className="flex h-dvh flex-col overflow-hidden text-[#FAFAFA] transition-colors duration-500 select-none"
      style={{ backgroundColor: theme.bg }}
    >
      {/* Top Status Bar */}
      <header
        className="flex shrink-0 items-center justify-between gap-2 px-5 pb-3"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))' }}
      >
        <button
          type="button"
          onClick={handleCloseClick}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/4 text-zinc-300 transition hover:text-white active:scale-95"
          aria-label="Cerrar entrenamiento"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <div className="truncate text-xs font-medium text-zinc-400">
            {workout.name}
          </div>
          <div className="tabular-nums mt-0.5 flex items-center justify-center gap-1.5 text-xs font-medium text-zinc-300">
            <span>
              Ciclo {step?.cycleIndex ?? 1}/{step?.totalCycles ?? 1}
            </span>
            {step && step.totalRounds > 1 && (
              <>
                <span className="text-zinc-600">·</span>
                <span>
                  Ronda {step.roundIndex}/{step.totalRounds}
                </span>
              </>
            )}
            <span className="text-zinc-600">·</span>
            <span className="text-zinc-400">
              Restan {formatTime(timer.totalRemainingSeconds)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleMute}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/8 bg-white/4 text-zinc-300 transition hover:text-white active:scale-95"
          aria-label={settings.soundEnabled ? 'Silenciar sonido' : 'Activar sonido'}
        >
          {settings.soundEnabled ? (
            <Volume2 className="h-4 w-4" />
          ) : (
            <VolumeX className="h-4 w-4 text-zinc-500" />
          )}
        </button>
      </header>

      {/* Main Timer Focal Area */}
      <main className="flex flex-1 flex-col items-center justify-center px-6">
        {/* Phase Pill */}
        <div
          className="mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5"
          style={{
            backgroundColor: theme.surface,
            borderColor: theme.border,
          }}
        >
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: theme.accent }}
          />
          <span
            className="font-display text-xs font-semibold tracking-wider uppercase"
            style={{ color: theme.accent }}
          >
            {step?.label ?? 'Listo'}
          </span>
          {timer.status === 'paused' && (
            <span className="ml-1 text-[11px] font-medium text-zinc-400">
              · En pausa
            </span>
          )}
        </div>

        {/* Giant Pure-White Clock */}
        <div
          className="font-display tabular-nums text-center font-semibold leading-none tracking-tight text-[#FAFAFA]"
          style={{ fontSize: 'clamp(5.25rem, 25vw, 8.75rem)' }}
        >
          {displayTime}
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-10 w-full max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <div
              className="h-full rounded-full transition-[width] duration-75"
              style={{
                width: `${progressPct}%`,
                backgroundColor: theme.accent,
              }}
            />
          </div>
          <div className="mt-2.5 flex items-center justify-between text-[11px] font-medium text-zinc-500">
            <span className="tabular-nums">
              Intervalo {timer.currentStepIndex + 1} de {timer.totalSteps}
            </span>
            <span className="tabular-nums">{progressPct}%</span>
          </div>
        </div>

        {/* Discreet Next-Step Pill */}
        <div className="mt-8">
          {step?.upNext && upNextTheme ? (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-2 text-xs font-medium text-zinc-300">
              <span className="text-zinc-500">Siguiente</span>
              <span className="text-zinc-600">·</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: upNextTheme.accent }}
              />
              <span className="text-[#FAFAFA]">{step.upNext.label}</span>
              <span className="tabular-nums text-zinc-400">
                {formatCompactTime(step.upNext.durationSeconds)}
              </span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/3 px-4 py-2 text-xs font-medium text-zinc-400">
              Último intervalo · Finalizar
            </div>
          )}
        </div>
      </main>

      {/* Bottom Stats + Controls */}
      <footer
        className="shrink-0 space-y-5 px-5 pt-2"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
      >
        {/* Clean Neutral Counters */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/3 py-3">
            <span className="font-display tabular-nums text-2xl font-semibold tracking-tight text-[#FAFAFA]">
              {step?.repeatsLeft ?? 0}
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-zinc-400">
              Repeticiones
            </span>
          </div>

          <div className="flex flex-col items-center rounded-2xl border border-white/8 bg-white/3 py-3">
            <span className="font-display tabular-nums text-2xl font-semibold tracking-tight text-[#FAFAFA]">
              {step?.cyclesLeft ?? 0}
            </span>
            <span className="mt-0.5 text-[11px] font-medium text-zinc-400">
              Ciclos
            </span>
          </div>
        </div>

        {/* Transport Controls */}
        <div className="flex items-center justify-center gap-5">
          <button
            type="button"
            onClick={timer.prevStep}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/4 text-zinc-300 transition hover:bg-white/8 hover:text-white active:scale-95"
            aria-label="Intervalo anterior"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={timer.togglePlay}
            className="flex h-18 w-18 items-center justify-center rounded-full bg-[#FAFAFA] text-[#09090B] transition hover:bg-zinc-200 active:scale-95"
            aria-label={timer.status === 'running' ? 'Pausar' : 'Reanudar'}
          >
            {timer.status === 'running' ? (
              <Pause className="h-7 w-7 fill-[#09090B]" />
            ) : (
              <Play className="h-7 w-7 translate-x-0.5 fill-[#09090B]" />
            )}
          </button>

          <button
            type="button"
            onClick={timer.nextStep}
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/8 bg-white/4 text-zinc-300 transition hover:bg-white/8 hover:text-white active:scale-95"
            aria-label="Siguiente intervalo"
          >
            <SkipForward className="h-5 w-5" />
          </button>
        </div>

        {timer.status === 'paused' && (
          <div className="flex justify-center">
            <button
              type="button"
              onClick={timer.restart}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/8 bg-white/4 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:text-white active:scale-95"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reiniciar sesión
            </button>
          </div>
        )}
      </footer>

      {/* Confirm Exit Modal */}
      {confirmExit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-5 backdrop-blur-sm"
          onClick={() => setConfirmExit(false)}
        >
          <div
            className="w-full max-w-xs rounded-3xl border border-white/8 bg-[#121215] p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA]">
              ¿Salir de la sesión?
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-zinc-400">
              El temporizador está en curso y se perderá el progreso actual.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setConfirmExit(false);
                  timer.start();
                }}
                className="h-11 rounded-2xl border border-white/8 bg-[#18181B] text-xs font-medium text-[#FAFAFA] active:scale-95"
              >
                Continuar
              </button>
              <button
                type="button"
                onClick={onExit}
                className="h-11 rounded-2xl bg-[#F87171] text-xs font-semibold text-[#09090B] active:scale-95"
              >
                Salir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
