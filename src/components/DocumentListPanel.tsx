import { Plus, RefreshCw, Info, FileText, ArrowRight, Terminal, FolderOpen } from "lucide-react";
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
    <section className="w-80 border-r border-slate-800 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-3">
        <div>
          <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-2">
            Root Collection Path
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Ej: movilform-39511"
              className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-indigo-200 overflow-x-auto whitespace-nowrap"
              value={collectionPath}
              onChange={(e) => onCollectionPathChange(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") onFetchDocuments(); }}
              spellCheck={false}
            />
            <button
              onClick={onFetchDocuments}
              disabled={isLoading || connectionMode === "none"}
              className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 p-2 rounded transition-all cursor-pointer text-white"
              title="Listar Documentos"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>

        <div className="text-[10px] text-slate-400 bg-slate-800 p-2.5 rounded border border-slate-800/80 leading-snug flex items-start gap-1.5">
          <Info className="w-3.5 text-indigo-400 shrink-0 mt-0.5" />
          <span>
            Compatible con nombres exactos de colección como{" "}
            <code className="text-indigo-300 font-mono">.firebaseio.com</code>.
            Traspasado directo al SDK de Node.
          </span>
        </div>
      </div>

      <div className="p-3 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Filtrar ID de documento..."
          className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          value={searchFilter}
          onChange={(e) => onSearchFilterChange(e.target.value)}
        />
        {connectionMode !== "none" && (
          <button
            onClick={onCreateDocument}
            className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-1.5 rounded text-xs shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            title="Nuevo Documento"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-slate-900">
        {connectionMode === "none" ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <FileText className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">
              Conéctese a una base de datos para listar documentos o active el
              Modo Demo.
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
                className={`w-full text-left px-3 py-2.5 rounded text-xs transition-all duration-150 flex flex-col gap-1 cursor-pointer ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-md font-bold border-l-4 border-indigo-300 ring-1 ring-indigo-500/50"
                    : "bg-transparent text-slate-300 hover:bg-indigo-900/30 hover:text-white hover:border-l-4 hover:border-indigo-500/40 hover:pl-2.5"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-mono truncate flex-1 pr-2">
                    {doc.id}
                  </span>
                  {isSubcollection ? (
                    <FolderOpen className="w-3.5 h-3.5 shrink-0 text-cyan-400" />
                  ) : (
                    <ArrowRight
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isActive ? "text-white" : "text-slate-600"
                      }`}
                    />
                  )}
                </div>
                {isSubcollection ? (
                  <div className="text-[10px] text-cyan-500 font-medium">
                    Subcolección
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span className={isActive ? "text-indigo-100" : "text-slate-500"}>
                      {fieldCount} {fieldCount === 1 ? "campo" : "campos"}
                    </span>
                    {doc.data["1"] !== undefined && (
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          isActive
                            ? "bg-indigo-900/40 text-indigo-200 border-indigo-500/50"
                            : "bg-amber-950/20 text-amber-500 border-amber-900/30"
                        }`}
                      >
                        Numeric Key
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

          <div className="mt-auto p-3 border-t border-slate-800 bg-slate-950/30 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-600" />
                {navigator.platform}
              </span>
              <span className="text-emerald-500 font-mono">Ready</span>
            </div>
          </div>
    </section>
  );
}
