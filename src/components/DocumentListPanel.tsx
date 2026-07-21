import { Plus, RefreshCw, FileText, ArrowRight, Terminal, FolderOpen, ChevronDown, ChevronRight, Search } from "lucide-react";
import { useState } from "react";
import type { DocData, ConnectionMode } from "../services/types";

interface DocumentListPanelProps {
  connectionMode: ConnectionMode;
  collectionPath: string;
  searchFilter: string;
  documents: DocData[];
  filteredDocs: DocData[];
  selectedDocId: string | null;
  isLoading: boolean;
  onCollectionPathChange: (path: string) => void;
  onFetchDocuments: (path?: string) => void;
  onSearchFilterChange: (filter: string) => void;
  onSelectDocument: (id: string) => void;
  onCreateDocument: () => void;
}

export function DocumentListPanel({
  connectionMode,
  collectionPath,
  searchFilter,
  documents,
  filteredDocs,
  selectedDocId,
  isLoading,
  onCollectionPathChange,
  onFetchDocuments,
  onSearchFilterChange,
  onSelectDocument,
  onCreateDocument,
}: DocumentListPanelProps) {
  const [showPathInput, setShowPathInput] = useState(false);

  const handleItemClick = (doc: DocData) => {
    if (doc.data?.__subcollection) {
      const base = collectionPath.replace(/\/+$/, "");
      const subPath = base + "/" + doc.id.replace(/\/$/, "");
      onCollectionPathChange(subPath);
      onFetchDocuments(subPath);
    } else {
      onSelectDocument(doc.id);
    }
  };
  return (
    <section className="w-72 border-r border-slate-800 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      <div className="px-3 py-2 border-b border-slate-800">
        <button
          onClick={() => setShowPathInput((v) => !v)}
          className="w-full flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          {showPathInput ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Ruta
          {!showPathInput && collectionPath && (
            <span className="ml-auto font-mono normal-case tracking-normal text-[9px] text-slate-600 truncate max-w-[140px]">
              {collectionPath}
            </span>
          )}
        </button>

        {showPathInput && (
          <div className="flex flex-col gap-2 mt-2">
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Ej: nombre-coleccion"
                className="w-full bg-slate-800/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono text-indigo-200 overflow-x-auto whitespace-nowrap"
                value={collectionPath}
                onChange={(e) => onCollectionPathChange(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") onFetchDocuments(); }}
                spellCheck={false}
              />
              <button
                onClick={onFetchDocuments}
                disabled={isLoading}
                className="bg-slate-700/80 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 p-1.5 rounded transition-all cursor-pointer text-white"
                title="Listar Documentos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="text-[9px] text-slate-500 bg-slate-800/40 px-2.5 py-1.5 rounded border border-slate-700/40 leading-relaxed">
              Segmentos impares listan documentos; pares listan subcolecciones.
            </div>
          </div>
        )}
      </div>

      <div className="px-3 py-2 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
          <input
            type="text"
            placeholder="Filtrar documentos..."
            className="w-full bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded pl-6 pr-2 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            value={searchFilter}
            onChange={(e) => onSearchFilterChange(e.target.value)}
          />
        </div>
        {connectionMode !== "none" && (
          <button
            onClick={onCreateDocument}
            className="bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-slate-300 p-1.5 rounded shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            title="Nuevo Documento"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 bg-slate-900">
        {connectionMode === "none" ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <FileText className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">
              Conéctese a una base de datos o active el Modo Demo.
            </p>
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <p className="text-xs text-slate-500 font-medium">
              No se encontraron documentos.
            </p>
            {collectionPath.includes(".") && (
              <p className="text-[10px] text-slate-600 mt-1">
                Verifique la ruta exacta de la colección raíz en Firestore.
              </p>
            )}
          </div>
        ) : (
          filteredDocs.map((doc) => {
            const isSubcollection = doc.data?.__subcollection;
            const isActive = !isSubcollection && doc.id === selectedDocId;
            const fieldCount = isSubcollection ? 0 : Object.keys(doc.data || {}).length;
            return (
              <button
                key={doc.id}
                onClick={() => handleItemClick(doc)}
                className={`w-full text-left text-xs transition-all duration-150 flex flex-col cursor-pointer ${
                  isActive
                    ? "bg-indigo-500/10 text-white border-l-2 border-indigo-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border-l-2 border-transparent hover:border-l-2 hover:border-slate-600"
                }`}
              >
                <div className="px-3 py-1.5">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono truncate flex-1 pr-2 text-[11px]">
                      {doc.id}
                    </span>
                    {isSubcollection ? (
                      <FolderOpen className="w-3 h-3 shrink-0 text-cyan-500" />
                    ) : (
                      <ArrowRight
                        className={`w-3 h-3 shrink-0 ${
                          isActive ? "text-indigo-400" : "text-slate-600"
                        }`}
                      />
                    )}
                  </div>
                  {isSubcollection ? (
                    <div className="text-[9px] text-cyan-500/70 font-medium mt-0.5">
                      Subcolección
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-[9px] ${isActive ? "text-slate-400" : "text-slate-600"}`}>
                        {fieldCount} {fieldCount === 1 ? "campo" : "campos"}
                      </span>
                      {doc.data["1"] !== undefined && (
                        <span className="text-[8px] font-medium text-amber-500/70 bg-amber-500/10 px-1 rounded border border-amber-500/20">
                          #key
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      <div className="mt-auto px-3 py-2 border-t border-slate-800 bg-slate-950/30 shrink-0">
        <div className="flex items-center justify-between text-[9px] text-slate-600">
          <span className="flex items-center gap-1">
            <Terminal className="w-3 h-3 text-slate-600" />
            {navigator.platform}
          </span>
          <span className="text-emerald-500/70 font-mono text-[9px]">Ready</span>
        </div>
      </div>
    </section>
  );
}
