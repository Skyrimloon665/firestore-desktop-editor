import type { StatusMessage as StatusMessageType } from "../services/types";
import { Wifi, Hash, Circle } from "lucide-react";

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
    <footer className="h-7 bg-slate-800 dark:bg-slate-900 text-slate-400 text-[10px] flex items-center px-4 justify-between select-none shrink-0 z-10 border-t border-slate-700/50 dark:border-slate-800">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium uppercase tracking-wider text-[9px]">
            PID:
          </span>
          <span className="font-mono bg-slate-700/50 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
            {projectId || "—"}
          </span>
        </div>
        <span className="text-slate-700 dark:text-slate-700">|</span>
        <div className="flex items-center gap-1">
          <Hash className="w-2.5 h-2.5 text-slate-500" />
          <span className="text-slate-500">us-central1</span>
        </div>
        <span className="text-slate-700 dark:text-slate-700">|</span>
        <div className="flex items-center gap-1">
          {statusMessage ? (
            <span className="font-medium text-slate-300 inline-flex items-center gap-1">
              <Circle className="w-1.5 h-1.5 fill-amber-400 text-amber-400 animate-pulse" />
              {statusMessage.text}
            </span>
          ) : (
            <span className="text-slate-500">Listo</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {isElectron && (
          <div className="flex items-center gap-1">
            <Wifi className="w-2.5 h-2.5 text-emerald-500" />
            <span className="text-slate-500">IPC</span>
          </div>
        )}
        <span className="text-slate-600">UTF-8</span>
      </div>
    </footer>
  );
}
