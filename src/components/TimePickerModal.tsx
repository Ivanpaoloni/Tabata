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
  accentColor = '#9EFF00',
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full max-w-md rounded-t-3xl border border-white/10 bg-[#141414] px-5 pt-4 pb-6 shadow-2xl sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/15 sm:hidden" />

        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl font-bold tracking-wide uppercase text-white">
              {title}
            </h3>
            {subtitle && (
              <p className="mt-0.5 text-xs text-zinc-400">{subtitle}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-zinc-300 active:scale-95"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Display / Direct Input */}
        {mode === 'time' ? (
          <div className="mb-5 flex flex-col items-center rounded-2xl border border-white/8 bg-[#0A0A0A] py-4">
            <div className="flex items-center justify-center gap-1">
              <input
                type="text"
                inputMode="numeric"
                value={minText}
                onChange={(e) => handleMinChange(e.target.value)}
                onBlur={() => setMinText(String(Math.floor(draft / 60)).padStart(2, '0'))}
                aria-label="Minutos"
                className="font-display tabular-nums w-24 rounded-xl bg-white/5 py-1 text-center text-6xl font-extrabold tracking-tight text-white outline-none focus:ring-2 focus:ring-white/30"
              />
              <span
                className="font-display text-6xl font-extrabold"
                style={{ color: accentColor }}
              >
                :
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={secText}
                onChange={(e) => handleSecChange(e.target.value)}
                onBlur={() => setSecText(String(draft % 60).padStart(2, '0'))}
                aria-label="Segundos"
                className="font-display tabular-nums w-24 rounded-xl bg-white/5 py-1 text-center text-6xl font-extrabold tracking-tight text-white outline-none focus:ring-2 focus:ring-white/30"
              />
            </div>
            <span className="mt-1.5 text-[11px] font-medium tracking-widest uppercase text-zinc-500">
              MM : SS · {formatTime(draft)}
            </span>
          </div>
        ) : (
          <div className="mb-5 flex flex-col items-center rounded-2xl border border-white/8 bg-[#0A0A0A] py-5">
            <span
              className="font-display tabular-nums text-7xl font-extrabold leading-none"
              style={{ color: accentColor }}
            >
              {draft}
            </span>
          </div>
        )}

        {/* Quick Delta Buttons */}
        {mode === 'time' ? (
          <div className="mb-4 grid grid-cols-6 gap-2">
            {[-10, -5, -1, 1, 5, 10].map((delta) => (
              <button
                key={delta}
                type="button"
                onClick={() => updateDraft(draft + delta)}
                className="tabular-nums flex h-12 items-center justify-center rounded-xl border border-white/10 bg-[#1C1C1E] text-sm font-bold text-white transition active:scale-95 active:bg-white/15"
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
                className="tabular-nums flex h-12 items-center justify-center rounded-xl border border-white/10 bg-[#1C1C1E] text-base font-bold text-white transition active:scale-95 active:bg-white/15"
              >
                {delta > 0 ? `+${delta}` : `${delta}`}
              </button>
            ))}
          </div>
        )}

        {/* Quick Presets */}
        <div className="mb-6">
          <div className="mb-2 text-[11px] font-semibold tracking-wider uppercase text-zinc-500">
            Presets rápidos
          </div>
          <div className="flex flex-wrap gap-2">
            {mode === 'time' && min === 0 && (
              <button
                type="button"
                onClick={() => updateDraft(0)}
                className={`tabular-nums rounded-xl px-3.5 py-2 text-sm font-bold transition active:scale-95 ${
                  draft === 0
                    ? 'bg-white text-black'
                    : 'border border-white/10 bg-[#1C1C1E] text-zinc-300'
                }`}
              >
                OFF
              </button>
            )}
            {(mode === 'time' ? TIME_PRESETS : COUNT_PRESETS).map((preset) => {
              const active = draft === preset;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => updateDraft(preset)}
                  className={`tabular-nums rounded-xl px-3.5 py-2 text-sm font-bold transition active:scale-95 ${
                    active
                      ? 'text-black'
                      : 'border border-white/10 bg-[#1C1C1E] text-zinc-200'
                  }`}
                  style={active ? { backgroundColor: accentColor } : undefined}
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
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl font-display text-xl font-extrabold tracking-wider uppercase text-black transition active:scale-[0.98]"
          style={{ backgroundColor: accentColor }}
        >
          <Check className="h-6 w-6 stroke-[2.5]" />
          Confirmar
        </button>
      </div>
    </div>
  );
}
