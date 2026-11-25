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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ajustes"
    >
      <div
        className="flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-3xl border-t border-white/10 bg-[#121215] pt-3"
        style={{ paddingBottom: 'max(1.25rem, env(safe-area-inset-bottom))' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" />

        <div className="flex items-center justify-between border-b border-white/8 px-5 pb-3.5">
          <h2 className="font-display text-lg font-semibold tracking-tight text-[#FAFAFA]">
            Ajustes
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#18181B] text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
            aria-label="Cerrar ajustes"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-4">
          <section>
            <div className="mb-2.5 text-xs font-medium text-zinc-400">
              Sonido y respuesta táctil
            </div>
            <div className="divide-y divide-white/6 overflow-hidden rounded-2xl border border-white/8 bg-[#18181B]">
              <ToggleRow
                icon={
                  settings.soundEnabled ? (
                    <Volume2 className="h-5 w-5 text-[#34D399]" />
                  ) : (
                    <VolumeX className="h-5 w-5 text-zinc-500" />
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
                <div className="flex min-h-15 items-center justify-between gap-3 px-4 py-3">
                  <span className="text-sm font-medium text-zinc-300">
                    Idioma de voz
                  </span>
                  <div className="flex gap-2.5">
                    {(['es-ES', 'en-US'] as const).map((lang) => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() =>
                          onUpdateSettings({ ...settings, voiceLang: lang })
                        }
                        className={`flex h-12 min-w-20 items-center justify-center rounded-xl px-3 text-xs font-semibold transition-all duration-100 active:scale-97 ${
                          settings.voiceLang === lang
                            ? 'bg-[#FAFAFA] text-[#09090B]'
                            : 'bg-white/6 text-zinc-300 active:bg-white/10'
                        }`}
                      >
                        {lang === 'es-ES' ? 'Español' : 'English'}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              <ToggleRow
                icon={<Vibrate className="h-5 w-5 text-zinc-400" />}
                title="Vibración"
                subtitle="Pulso al cambiar de intervalo"
                checked={settings.vibrationEnabled}
                onChange={() => toggle('vibrationEnabled')}
              />
            </div>

            <button
              type="button"
              onClick={handleTestSound}
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#18181B] text-sm font-medium text-zinc-200 transition-all duration-100 active:scale-97 active:bg-white/10"
            >
              <Volume2 className="h-5 w-5 text-zinc-400" />
              Probar sonido
            </button>
          </section>

          <section>
            <div className="mb-2.5 text-xs font-medium text-zinc-400">
              Copia de seguridad
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleExport}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#18181B] text-sm font-medium text-[#FAFAFA] transition-all duration-100 active:scale-97 active:bg-white/10"
              >
                <Download className="h-5 w-5 text-zinc-400" />
                Exportar
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-white/8 bg-[#18181B] text-sm font-medium text-[#FAFAFA] transition-all duration-100 active:scale-97 active:bg-white/10"
              >
                <Upload className="h-5 w-5 text-zinc-400" />
                Importar
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
              className="mt-3 flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-transparent text-sm font-medium text-zinc-300 transition-all duration-100 active:scale-97 active:bg-white/10"
            >
              <RotateCcw className="h-4 w-4" />
              Restaurar rutinas predefinidas
            </button>

            {feedback && (
              <div
                className={`mt-3 rounded-2xl border px-4 py-3 text-xs font-medium ${
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
      className="flex min-h-15 w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-all duration-100 active:scale-97 active:bg-white/10"
    >
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <div className="text-sm font-medium text-[#FAFAFA]">{title}</div>
          <div className="mt-0.5 text-xs leading-snug text-zinc-400">
            {subtitle}
          </div>
        </div>
      </div>
      <div
        className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
          checked ? 'bg-[#34D399]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full transition-transform ${
            checked ? 'translate-x-6 bg-[#09090B]' : 'translate-x-1 bg-white'
          }`}
        />
      </div>
    </button>
  );
}
