import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { formatTime } from '../utils/timeline';

export interface TimePickerModalProps {
  isOpen: boolean;
  mode: 'time' | 'count';
  title: string;
  subtitle?: string;
  accentColor?: string;
  value: number;
  min?: number;
  max?: number;
  onConfirm: (newValue: number) => void;
  onClose: () => void;
}

const TIME_PRESETS = [5, 10, 15, 20, 30, 45, 60];
const COUNT_PRESETS = [1, 2, 3, 4, 5, 6, 8, 10, 12];

export function TimePickerModal(props: TimePickerModalProps) {
  if (!props.isOpen) return null;
  return <TimePickerContent {...props} />;
}

function TimePickerContent({
  mode,
  title,
  subtitle,
  accentColor = '#34D399',
  value,
  min = mode === 'count' ? 1 : 0,
  max = mode === 'count' ? 99 : 3600,
  onConfirm,
  onClose,
}: TimePickerModalProps) {
  const [draft, setDraft] = useState(value);
  const [minText, setMinText] = useState(() =>
    String(Math.floor(value / 60)).padStart(2, '0')
  );
  const [secText, setSecText] = useState(() =>
    String(value % 60).padStart(2, '0')
  );

  const clamp = (n: number) => Math.min(max, Math.max(min, Math.round(n)));

  const updateDraft = (next: number) => {
    const clamped = clamp(next);
    setDraft(clamped);
    if (mode === 'time') {
      setMinText(String(Math.floor(clamped / 60)).padStart(2, '0'));
      setSecText(String(clamped % 60).padStart(2, '0'));
    }
  };

  const handleMinChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 2);
    setMinText(cleaned);
    const m = parseInt(cleaned || '0', 10);
    const s = parseInt(secText || '0', 10);
    setDraft(clamp(m * 60 + s));
  };

  const handleSecChange = (raw: string) => {
    const cleaned = raw.replace(/\D/g, '').slice(0, 2);
    setSecText(cleaned);
    const m = parseInt(minText || '0', 10);
    const s = Math.min(59, parseInt(cleaned || '0', 10));
    setDraft(clamp(m * 60 + s));
  };

  const handleConfirm = () => {
    onConfirm(clamp(draft));
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/[0.08] bg-[#121215] px-5 pt-3.5 pb-6 sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/15 sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: accentColor }}
              />
              <h3 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA]">
                {title}
              </h3>
            </div>
            {subtitle && (
              <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#18181B] text-zinc-400 transition hover:text-white active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Display / Direct Input */}
        {mode === 'time' ? (
          <div className="mb-5 flex flex-col items-center rounded-2xl border border-white/[0.08] bg-[#09090B] py-5">
            <div className="flex items-center justify-center gap-1.5">
              <input
                type="text"
                inputMode="numeric"
                value={minText}
                onChange={(e) => handleMinChange(e.target.value)}
                onBlur={() =>
                  setMinText(String(Math.floor(draft / 60)).padStart(2, '0'))
                }
                aria-label="Minutos"
                className="font-display tabular-nums w-24 rounded-xl bg-white/[0.04] py-1.5 text-center text-5xl font-semibold tracking-tight text-[#FAFAFA] outline-none focus:ring-1 focus:ring-white/25"
              />
              <span className="font-display text-4xl font-semibold text-zinc-500">
                :
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={secText}
                onChange={(e) => handleSecChange(e.target.value)}
                onBlur={() =>
                  setSecText(String(draft % 60).padStart(2, '0'))
                }
                aria-label="Segundos"
                className="font-display tabular-nums w-24 rounded-xl bg-white/[0.04] py-1.5 text-center text-5xl font-semibold tracking-tight text-[#FAFAFA] outline-none focus:ring-1 focus:ring-white/25"
              />
            </div>
            <span className="mt-2 text-[11px] font-medium tracking-wide text-zinc-500">
              mm : ss · {formatTime(draft)}
            </span>
          </div>
        ) : (
          <div className="mb-5 flex flex-col items-center rounded-2xl border border-white/[0.08] bg-[#09090B] py-6">
            <span className="font-display tabular-nums text-6xl font-semibold leading-none tracking-tight text-[#FAFAFA]">
              {draft}
            </span>
          </div>
        )}

        {/* Quick Delta Buttons */}
        {mode === 'time' ? (
          <div className="mb-4 grid grid-cols-6 gap-1.5">
            {[-10, -5, -1, 1, 5, 10].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => updateDraft(draft + delta)}
                className="tabular-nums flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#18181B] text-xs font-medium text-zinc-200 transition hover:bg-white/[0.08] active:scale-95"
              >
                {delta > 0 ? `+${delta}s` : `${delta}s`}
              </button>
            ))}
          </div>
        ) : (
          <div className="mb-4 grid grid-cols-4 gap-2">
            {[-5, -1, 1, 5].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => updateDraft(draft + delta)}
                className="tabular-nums flex h-11 items-center justify-center rounded-xl border border-white/[0.08] bg-[#18181B] text-sm font-medium text-zinc-200 transition hover:bg-white/[0.08] active:scale-95"
              >
                {delta > 0 ? `+${delta}` : `${delta}`}
              </button>
            ))}
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="mb-2 text-xs font-medium text-zinc-500">
            Valores rápidos
          </div>
          <div className="flex flex-wrap gap-1.5">
            {mode === 'time' && min === 0 && (
              <button
                type="button"
                onClick={() => updateDraft(0)}
                className={`tabular-nums rounded-xl border px-3 py-2 text-xs font-medium transition active:scale-95 ${
                  draft === 0
                    ? 'border-white/25 bg-[#FAFAFA] text-[#09090B]'
                    : 'border-white/[0.08] bg-[#18181B] text-zinc-300'
                }`}
              >
                Desactivado
              </button>
            )}
            {(mode === 'time' ? TIME_PRESETS : COUNT_PRESETS).map((preset) => {
              const active = draft === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateDraft(preset)}
                  className={`tabular-nums rounded-xl border px-3 py-2 text-xs font-medium transition active:scale-95 ${
                    active
                      ? 'border-white/25 bg-[#FAFAFA] text-[#09090B]'
                      : 'border-white/[0.08] bg-[#18181B] text-zinc-300'
                  }`}
                >
                  {mode === 'time' ? `${preset}s` : preset}
                </button>
              );
            })}
          </div>
        </div>

        {/* Confirm Action */}
        <button
          type="button"
          onClick={handleConfirm}
          className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#FAFAFA] text-sm font-semibold text-[#09090B] transition hover:bg-zinc-200 active:scale-[0.98]"
        >
          <Check className="h-4 w-4 stroke-[2.25]" />
          Confirmar
        </button>
      </div>
    </div>
  );
}
