import { Calendar, Clock, Trash2, X } from 'lucide-react';
import type { WorkoutHistoryEntry } from '../types/workout';
import { formatTime } from '../utils/timeline';

interface HistoryModalProps {
  isOpen: boolean;
  history: WorkoutHistoryEntry[];
  onDeleteEntry: (id: string) => void;
  onClearAll: () => void;
  onClose: () => void;
}

function formatDateLabel(iso: string): string {
  try {
    const d = new Date(iso);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return iso;
  }
}

export function HistoryModal({
  isOpen,
  history,
  onDeleteEntry,
  onClearAll,
  onClose,
}: HistoryModalProps) {
  if (!isOpen) return null;

  const totalSeconds = history.reduce((acc, h) => acc + h.durationSeconds, 0);
  const totalMinutes = Math.round(totalSeconds / 60);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Historial de entrenamientos"
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-[#121215] pt-3"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

        <div className="flex items-center justify-between border-b border-white/8 px-5 pb-3.5">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA]">
            Historial
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
            aria-label="Cerrar historial"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 px-5 py-4">
          <div className="rounded-2xl border border-white/8 bg-[#18181B] p-4">
            <span className="text-xs font-medium text-zinc-400">Sesiones</span>
            <div className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
              {history.length}
            </div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-[#18181B] p-4">
            <span className="text-xs font-medium text-zinc-400">
              Minutos totales
            </span>
            <div className="font-display tabular-nums mt-1 text-2xl font-semibold tracking-tight text-[#FAFAFA]">
              {totalMinutes}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-4">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/8 bg-[#09090B] py-12 text-center">
              <Clock className="mb-3 h-8 w-8 text-zinc-600" />
              <p className="text-sm font-medium text-zinc-300">
                Sin entrenamientos registrados
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                Al completar una sesión se guardará automáticamente.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex min-h-18 items-center justify-between gap-3 rounded-2xl border border-white/8 bg-[#18181B] px-4 py-3"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: entry.workoutColor }}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-[#FAFAFA]">
                        {entry.workoutName}
                      </div>
                      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-400">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDateLabel(entry.completedAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <div className="font-display tabular-nums text-base font-semibold text-[#FAFAFA]">
                        {formatTime(entry.durationSeconds)}
                      </div>
                      <div className="text-[11px] text-zinc-500">duración</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onDeleteEntry(entry.id)}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#121215] text-zinc-400 transition-all duration-100 active:scale-97 active:bg-red-500/15 active:text-[#F87171]"
                      aria-label="Eliminar registro"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="border-t border-white/8 px-5 pt-3.5">
            <button
              type="button"
              onClick={onClearAll}
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-red-500/20 bg-red-500/10 text-sm font-semibold text-[#F87171] transition-all duration-100 active:scale-97 active:bg-red-500/20"
            >
              <Trash2 className="h-5 w-5" />
              Limpiar historial
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
