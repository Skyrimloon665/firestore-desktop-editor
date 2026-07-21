import type { StatusMessage as StatusMessageType } from "../services/types";

interface StatusBarProps {
  projectId: string;
  statusMessage: StatusMessageType | null;
  isElectron: boolean;
}

export function StatusBar({
  projectId,
  statusMessage,
  isElectron,
}: StatusBarProps) {
  return (
    <footer className="h-8 bg-indigo-700 dark:bg-indigo-900 text-white text-[10px] flex items-center px-4 justify-between select-none shrink-0 z-10 shadow-md">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5">
          <span className="opacity-70 font-semibold uppercase tracking-wider text-[9px]">
            Project ID:
          </span>
          <span className="font-mono bg-indigo-800/40 px-1.5 py-0.5 rounded text-[11px] font-bold text-white">
            {projectId || "Not Connected"}
          </span>
        </div>
        <div className="h-3.5 w-px bg-indigo-500 opacity-30" />
        <div className="flex items-center gap-1.5">
          <span className="opacity-70">Region:</span>
          <span className="font-semibold text-indigo-100">us-central1</span>
        </div>
        <div className="h-3.5 w-px bg-indigo-500 opacity-30" />
        <div className="flex items-center gap-1 text-white">
          <span className="opacity-70">Estado:</span>
          {statusMessage ? (
            <span className="font-bold inline-flex items-center gap-1 animate-pulse">
              {statusMessage.text}
            </span>
          ) : (
            <span className="opacity-90">Listo</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {isElectron && (
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span>Electron IPC Active</span>
          </div>
        )}
        <div className="opacity-70 hidden sm:block">UTF-8</div>
      </div>
    </footer>
  );
}
