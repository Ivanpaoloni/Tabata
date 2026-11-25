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
import {
  applyAudioSessionMode,
  playWorkStart,
  unlockAudio,
} from '../utils/soundEngine';

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
    unlockAudio(settings.audioMode);
    playWorkStart(true);
  };

  const handleToggleAudioMode = () => {
    const nextMode = settings.audioMode === 'playback' ? 'ambient' : 'playback';
    applyAudioSessionMode(nextMode);
    onUpdateSettings({
      ...settings,
      audioMode: nextMode,
    });
  };

  const handleExport = () => {
    const json = exportAppDataToJson(appData);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateTag = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `tabata-backup-${dateTag}.json`;
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes"
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-md flex-col rounded-t-3xl border border-white/[0.08] bg-[#121215] sm:rounded-3xl"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-5 py-4">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA]">
            Ajustes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-[#18181B] text-zinc-400 transition hover:text-white active:scale-95"
            aria-label="Cerrar ajustes"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <section>
            <div className="mb-2.5 text-xs font-medium text-zinc-400">
              Sonido y respuesta táctil
            </div>
            <div className="divide-y divide-white/[0.06] overflow-hidden rounded-2xl border border-white/[0.08] bg-[#18181B]">
              <ToggleRow
                icon={
                  settings.soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-[#34D399]" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-zinc-500" />
                  )
                }
                title="Sonidos de fase"
                subtitle="Tonos sintetizados locales (funciona offline)"
                checked={settings.soundEnabled}
                onChange={() => toggle('soundEnabled')}
              />
              <ToggleRow
                title="Sonar aunque el iPhone esté en silencio"
                subtitle="Activado: ignora el modo silencio pero puede pausar Spotify. Desactivado: se mezcla con tu música."
                checked={settings.audioMode === 'playback'}
                onChange={handleToggleAudioMode}
              />
              <ToggleRow
                title="Cuenta regresiva 3-2-1"
                subtitle="Aviso sutil en los últimos 3 segundos"
                checked={settings.countdownBeeps}
                onChange={() => toggle('countdownBeeps')}
              />
              <ToggleRow
                title="Anuncios por voz"
                subtitle="Lee el nombre de cada fase al comenzar"
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
                        className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                          settings.voiceLang === lang
                            ? 'bg-[#FAFAFA] text-[#09090B]'
                            : 'bg-white/[0.06] text-zinc-300'
                        }`}
                      >
                        {lang === 'es-ES' ? 'Español' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ToggleRow
                icon={<Vibrate className="h-4 w-4 text-zinc-400" />}
                title="Vibración"
                subtitle="Pulso al cambiar de intervalo"
                checked={settings.vibrationEnabled}
                onChange={() => toggle('vibrationEnabled')}
              />
            </div>

            <button
              type="button"
              onClick={handleTestSound}
              className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181B] text-xs font-medium text-zinc-200 transition hover:bg-white/[0.06] active:scale-[0.98]"
            >
              <Volume2 className="h-4 w-4 text-zinc-400" />
              Probar sonido
            </button>
          </section>

          <section>
            <div className="mb-2.5 text-xs font-medium text-zinc-400">
              Copia de seguridad
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={handleExport}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181B] text-xs font-medium text-[#FAFAFA] transition hover:bg-white/[0.06] active:scale-95"
              >
                <Download className="h-4 w-4 text-zinc-400" />
                Exportar JSON
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-11 items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-[#18181B] text-xs font-medium text-[#FAFAFA] transition hover:bg-white/[0.06] active:scale-95"
              >
                <Upload className="h-4 w-4 text-zinc-400" />
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
                  text: 'Se restauraron las rutinas predefinidas.',
                });
              }}
              className="mt-2.5 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-transparent text-xs font-medium text-zinc-400 transition hover:bg-white/[0.04] hover:text-zinc-200 active:scale-[0.98]"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Restaurar rutinas predefinidas
            </button>

            {feedback && (
              <div
                className={`mt-3 rounded-xl border px-3.5 py-2.5 text-xs font-medium ${
                  feedback.type === 'ok'
                    ? 'border-[#34D399]/25 bg-[#34D399]/10 text-[#34D399]'
                    : 'border-red-500/25 bg-red-500/10 text-red-400'
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
      className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition active:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-sm font-medium text-[#FAFAFA]">{title}</div>
          <div className="text-xs text-zinc-500">{subtitle}</div>
        </div>
      </div>
      <div
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#34D399]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full transition-transform ${
            checked ? 'translate-x-5 bg-[#09090B]' : 'translate-x-0.5 bg-white'
          }`}
        />
      </div>
    </button>
  );
}
