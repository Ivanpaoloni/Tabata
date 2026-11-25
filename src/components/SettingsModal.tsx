import {
  Download,
  RotateCcw,
  Upload,
  Vibrate,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useRef, useState } from 'react';
import type { AppSettings, PersistedAppData } from '../types/workout';
import { exportAppDataToJson, parseImportedBackup } from '../storage/workoutStorage';
import { playWorkStart, unlockAudio } from '../utils/soundEngine';

interface SettingsModalProps {
  isOpen: boolean;
  appData: PersistedAppData;
  onUpdateSettings: (next: AppSettings) => void;
  onImportBackup: (imported: ReturnType<typeof parseImportedBackup>) => void;
  onRestorePresets: () => void;
  onClose: () => void;
}

export function SettingsModal({
  isOpen,
  appData,
  onUpdateSettings,
  onImportBackup,
  onRestorePresets,
  onClose,
}: SettingsModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  if (!isOpen) return null;

  const { settings } = appData;

  const toggle = (key: keyof AppSettings) => {
    onUpdateSettings({
      ...settings,
      [key]: !settings[key],
    });
  };

  const handleTestSound = () => {
    unlockAudio();
    playWorkStart(true);
  };

  const handleExport = () => {
    const json = exportAppDataToJson(appData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `tabata-pro-backup-${dateTag}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setFeedback({ type: 'ok', text: 'Backup exportado correctamente.' });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = parseImportedBackup(text);
      onImportBackup(parsed);
      setFeedback({
        type: 'ok',
        text: `Se importaron ${parsed.workouts.length} rutina(s).`,
      });
    } catch (err) {
      setFeedback({
        type: 'err',
        text: err instanceof Error ? err.message : 'Error al importar JSON.',
      });
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes"
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-[#141414] sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/8 px-5 py-4">
          <h2 className="font-display text-2xl font-extrabold tracking-wide uppercase text-white">
            AJUSTES
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/8 text-zinc-300 active:scale-95"
            aria-label="Cerrar ajustes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {/* Audio & Feedback */}
          <section>
            <div className="mb-2.5 text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Sonido y Háptica
            </div>
            <div className="divide-y divide-white/8 overflow-hidden rounded-2xl border border-white/8 bg-[#1C1C1E]">
              <ToggleRow
                icon={
                  settings.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-[#9EFF00]" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-zinc-500" />
                  )
                }
                title="Sonidos de fases"
                subtitle="Beeps sintetizados Web Audio (offline)"
                checked={settings.soundEnabled}
                onChange={() => toggle('soundEnabled')}
              />
              <ToggleRow
                title="Cuenta regresiva 3-2-1"
                subtitle="Beep corto en los últimos 3 segundos"
                checked={settings.countdownBeeps}
                onChange={() => toggle('countdownBeeps')}
              />
              <ToggleRow
                title="Anuncios por voz"
                subtitle="Lee el nombre de cada fase al iniciar"
                checked={settings.voiceEnabled}
                onChange={() => toggle('voiceEnabled')}
              />
              {settings.voiceEnabled && (
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-zinc-300">Idioma de voz</span>
                  <div className="flex gap-1.5">
                    {(['es-ES', 'en-US'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, voiceLang: lang })
                        }
                        className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                          settings.voiceLang === lang
                            ? 'bg-[#9EFF00] text-black'
                            : 'bg-white/8 text-zinc-300'
                        }`}
                      >
                        {lang === 'es-ES' ? 'Español' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ToggleRow
                icon={<Vibrate className="h-5 w-5 text-[#0EA5E9]" />}
                title="Vibración"
                subtitle="Pulso táctil al cambiar de intervalo"
                checked={settings.vibrationEnabled}
                onChange={() => toggle('vibrationEnabled')}
              />
            </div>

            <button
              type="button"
              onClick={handleTestSound}
              className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1C1C1E] text-sm font-semibold text-zinc-200 active:scale-[0.98]"
            >
              <Volume2 className="h-4 w-4 text-[#9EFF00]" />
              Probar sonido
            </button>
          </section>

          {/* Backup & Presets */}
          <section>
            <div className="mb-2.5 text-[11px] font-semibold tracking-widest uppercase text-zinc-500">
              Backup y Datos Locales
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1C1C1E] text-sm font-semibold text-white active:scale-95"
              >
                <Download className="h-4 w-4 text-[#9EFF00]" />
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-[#1C1C1E] text-sm font-semibold text-white active:scale-95"
              >
                <Upload className="h-4 w-4 text-[#3B82F6]" />
                Importar JSON
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                onRestorePresets();
                setFeedback({
                  type: 'ok',
                  text: 'Presets originales agregados a tus rutinas.',
                });
              }}
              className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 text-sm font-medium text-zinc-300 active:scale-[0.98]"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar presets de fábrica
            </button>

            {feedback && (
              <div
                className={`mt-3 rounded-xl px-3.5 py-2.5 text-xs font-medium ${
                  feedback.type === 'ok'
                    ? 'border border-[#9EFF00]/30 bg-[#9EFF00]/10 text-[#9EFF00]'
                    : 'border border-red-500/30 bg-red-500/10 text-red-400'
                }`}
              >
                {feedback.text}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

interface ToggleRowProps {
  icon?: React.ReactNode;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: () => void;
}

function ToggleRow({ icon, title, subtitle, checked, onChange }: ToggleRowProps) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left active:bg-white/5"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-sm font-semibold text-white">{title}</div>
          <div className="text-xs text-zinc-400">{subtitle}</div>
        </div>
      </div>
      <div
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#9EFF00]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition-transform ${
            checked ? 'translate-x-6 bg-black' : 'translate-x-1 bg-white'
          }`}
        />
      </div>
    </button>
  );
}
