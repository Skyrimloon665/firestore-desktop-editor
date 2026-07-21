import type { ConnectionMode, ThemeMode } from "../services/types";
import { Database, FolderOpen, Cpu, Lock, Sun, Moon, Monitor, FileText } from "lucide-react";
import type { ComponentType, SVGProps } from "react";

interface ConnectionHeaderProps {
  connectionMode: ConnectionMode;
  projectId: string;
  credentialsName: string;
  isLoading: boolean;
  isElectron: boolean;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  onSelectFile: () => void;
  onOpenJsonPaste: () => void;
  onActivateDemo: () => void;
  onDisconnect: () => void;
}

const themeIcon: Record<ThemeMode, ComponentType<SVGProps<SVGSVGElement>>> = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const themeNext: Record<ThemeMode, ThemeMode> = {
  light: "dark",
  dark: "system",
  system: "light",
};

export function ConnectionHeader({
  connectionMode,
  projectId,
  credentialsName,
  isLoading,
  isElectron,
  theme,
  onThemeChange,
  onSelectFile,
  onOpenJsonPaste,
  onActivateDemo,
  onDisconnect,
}: ConnectionHeaderProps) {
  const ThemeIcon = themeIcon[theme];

  return (
    <header className="h-16 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 flex items-center justify-between shadow-sm shrink-0 z-10">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
          <Database className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
            Firestore Desktop Editor
            <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 font-bold px-2 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-700">
              {isElectron ? "Electron Host Node" : "Web Preview Gateway"}
            </span>
          </h1>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium -mt-0.5">
            Inspección de Esquemas y Edición en Tiempo Real para Cuentas de
            Servicio
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onThemeChange(themeNext[theme])}
          className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          title={`Tema: ${theme} → ${themeNext[theme]}`}
        >
          <ThemeIcon className="w-4 h-4" />
        </button>

        {connectionMode !== "none" ? (
          <div className="flex items-center gap-3 text-xs bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 px-3 py-1.5 rounded-lg select-all">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-semibold text-slate-500 dark:text-slate-300">Proyecto:</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-700 px-1.5 py-0.5 rounded text-[11px] font-bold">
                {projectId}
              </span>
            </div>
            <div className="h-4 w-px bg-slate-200 dark:bg-slate-600" />
            <div className="hidden sm:block">
              <span className="text-slate-600 dark:text-slate-300 font-medium">
                {credentialsName}
              </span>
            </div>
            <button
              onClick={onDisconnect}
              className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors ml-2 hover:underline cursor-pointer"
            >
              Desconectar
            </button>
          </div>
        ) : (
          <>
            <button
              onClick={onSelectFile}
              disabled={isLoading || !isElectron}
              className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
              title={isElectron ? "Seleccionar archivo credentials.json" : "No disponible en modo web"}
            >
              <FolderOpen className="w-4 h-4" />
              Abrir credentials.json
            </button>

            <button
              onClick={onOpenJsonPaste}
              disabled={isLoading}
              className="bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FileText className="w-4 h-4 text-slate-500 dark:text-slate-300" />
              Pegar JSON
            </button>

            <button
              onClick={onActivateDemo}
              disabled={isLoading}
              className="bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-700 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              <Cpu className="w-4 h-4" />
              Modo Demo
            </button>
          </>
        )}
      </div>
    </header>
  );
}
