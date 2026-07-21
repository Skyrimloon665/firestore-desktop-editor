import { X, FolderOpen, Check, RefreshCw } from "lucide-react";

interface JsonPasteDialogProps {
  isOpen: boolean;
  isLoading: boolean;
  rawJsonText: string;
  onClose: () => void;
  onChange: (text: string) => void;
  onSubmit: () => void;
}

export function JsonPasteDialog({
  isOpen,
  isLoading,
  rawJsonText,
  onClose,
  onChange,
  onSubmit,
}: JsonPasteDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
          </div>
          <h2 className="text-md font-bold text-slate-800">
            Importar Cuenta de Servicio Firebase
          </h2>
        </div>

        <p className="text-xs text-slate-500 mb-4 leading-relaxed">
          Pegue el contenido JSON de su{" "}
          <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">
            credentials.json
          </code>{" "}
          generado en Firebase Console para conectarse directamente.
        </p>

        <textarea
          className="w-full h-44 bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 resize-none mb-4"
          placeholder='{ "type": "service_account", "project_id": "mi-proyecto", "private_key": "-----BEGIN PRIVATE KEY-----...", ... }'
          value={rawJsonText}
          onChange={(e) => onChange(e.target.value)}
        />

        <div className="flex justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={onSubmit}
            disabled={isLoading}
            className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            {isLoading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Cargar e Inicializar
          </button>
        </div>
      </div>
    </div>
  );
}
