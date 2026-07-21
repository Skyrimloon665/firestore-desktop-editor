import { PanelRightClose, PanelRightOpen, Plus, RefreshCw, FileText, ArrowRight, Terminal, FolderOpen, ChevronDown, ChevronRight, Search, Database, Check } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import type { DocData, ConnectionMode } from "../services/types";

interface DocumentListPanelProps {
  connectionMode: ConnectionMode;
  collectionPath: string;
  rootCollections: DocData[];
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
  onRefreshRootCollections: () => void;
}

const activeRootId = (path: string): string => {
  return path.split("/").filter(Boolean)[0] || "";
};

export function DocumentListPanel({
  connectionMode,
  collectionPath,
  rootCollections,
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
  onRefreshRootCollections,
}: DocumentListPanelProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showPathInput, setShowPathInput] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [rootSearch, setRootSearch] = useState("");
  const [pathInputValue, setPathInputValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentRoot = activeRootId(collectionPath);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredRoots = rootCollections.filter((rc) =>
    rc.id.replace(/\/$/, "").toLowerCase().includes(rootSearch.toLowerCase())
  );

  const handleItemClick = (doc: DocData) => {
    if (doc.data?.__subcollection) {
      const base = collectionPath.replace(/\/+$/, "");
      const id = doc.id.replace(/\/$/, "");
      const subPath = base ? base + "/" + id : id;
      setPathInputValue(currentRoot ? subPath.slice(currentRoot.length).replace(/^\//, "") : subPath);
      onCollectionPathChange(subPath);
      onFetchDocuments(subPath);
    } else {
      onSelectDocument(doc.id);
    }
  };

  const handleRootClick = (rootId: string) => {
    setDropdownOpen(false);
    setRootSearch("");
    setPathInputValue("");
    onCollectionPathChange(rootId);
    onFetchDocuments(rootId);
  };

  const handleSubmitPath = () => {
    const trimmed = pathInputValue.replace(/^\/+|\/+$/g, "");
    const fullPath = currentRoot ? (trimmed ? `${currentRoot}/${trimmed}` : currentRoot) : trimmed;
    onCollectionPathChange(fullPath);
    onFetchDocuments(fullPath);
  };

  if (!sidebarOpen) {
    return (
      <section className="w-7 border-r border-slate-800 bg-slate-900 flex flex-col items-center pt-2 shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
          title="Abrir panel"
        >
          <PanelRightOpen className="w-4 h-4" />
        </button>
      </section>
    );
  }

  return (
    <section className="w-72 border-r border-slate-800 bg-slate-900 text-slate-300 flex flex-col shrink-0">
      {connectionMode === "cloud" && rootCollections.length > 0 && (
        <div className="border-b border-slate-800 px-3 py-2" ref={dropdownRef}>
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-[9px] uppercase font-bold tracking-widest text-slate-500">Colección</span>
            <button
              onClick={onRefreshRootCollections}
              className="p-0.5 rounded text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
              title="Refrescar colecciones raíz"
            >
              <RefreshCw className="w-2.5 h-2.5" />
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="ml-auto p-0.5 rounded text-slate-500 hover:text-indigo-400 transition-colors cursor-pointer"
              title="Cerrar panel"
            >
              <PanelRightClose className="w-3 h-3" />
            </button>
          </div>
          <div className="relative">
            <button
              onClick={() => setDropdownOpen((v) => !v)}
              className="w-full flex items-center gap-2 bg-slate-800/80 border border-slate-700/60 hover:border-slate-600 px-2.5 py-1.5 rounded text-[11px] font-mono transition-colors cursor-pointer"
            >
              <Database className="w-3 h-3 shrink-0 text-cyan-500/70" />
              <span className={`flex-1 text-left truncate ${currentRoot ? "text-indigo-200" : "text-slate-500"}`}>
                {currentRoot || "Seleccionar colección..."}
              </span>
              <ChevronDown className={`w-3 h-3 shrink-0 text-slate-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
            </button>
            {dropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                <div className="p-1.5 border-b border-slate-700">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-500" />
                    <input
                      type="text"
                      placeholder="Buscar colección..."
                      className="w-full bg-slate-900 border border-slate-700 rounded pl-6 pr-2 py-1.5 text-[11px] text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                      value={rootSearch}
                      onChange={(e) => setRootSearch(e.target.value)}
                      autoFocus
                      spellCheck={false}
                    />
                  </div>
                </div>
                <div className="max-h-48 overflow-y-auto py-0.5">                    
                  {filteredRoots.length === 0 ? (
                    <div className="px-3 py-4 text-center text-[10px] text-slate-500">
                      Sin resultados
                    </div>
                  ) : (
                    filteredRoots.map((rc) => {
                      const id = rc.id.replace(/\/$/, "");
                      const isActive = id === currentRoot;
                      return (
                        <button
                          key={rc.id}
                          onClick={() => handleRootClick(id)}
                          className={`w-full text-left flex items-center gap-2 px-3 py-1.5 text-[11px] font-mono transition-colors cursor-pointer ${
                            isActive
                              ? "bg-indigo-500/15 text-indigo-300"
                              : "text-slate-400 hover:bg-slate-700/60 hover:text-slate-200"
                          }`}
                        >
                          {isActive ? <Check className="w-3 h-3 shrink-0 text-indigo-400" /> : <span className="w-3 h-3 shrink-0" />}
                          <span className="truncate">{id}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="px-3 py-2 border-b border-slate-800">
        <button
          onClick={() => setShowPathInput((v) => !v)}
          className="w-full flex items-center gap-1.5 text-[9px] uppercase font-bold tracking-widest text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
        >
          {showPathInput ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          Ruta
          {connectionMode !== "cloud" && !showPathInput && collectionPath && (
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
                placeholder={currentRoot ? "ej: doc-id/subcol" : "ej: nombre-coleccion"}
                className="w-full bg-slate-800/80 border border-slate-700/60 text-white px-2.5 py-1.5 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono text-indigo-200 overflow-x-auto whitespace-nowrap"
                value={pathInputValue}
                onChange={(e) => setPathInputValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmitPath(); }}
                spellCheck={false}
              />
              <button
                onClick={handleSubmitPath}
                disabled={isLoading}
                className="bg-slate-700/80 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-600 p-1.5 rounded transition-all cursor-pointer text-white"
                title="Listar Documentos"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
              </button>
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
        {connectionMode !== "none" && collectionPath && (
          <button
            onClick={onCreateDocument}
            className="bg-slate-800/60 hover:bg-slate-700 border border-slate-700/60 text-slate-300 p-1.5 rounded shrink-0 flex items-center justify-center cursor-pointer transition-colors"
            title="Nuevo Documento"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto py-1 space-y-0.5 bg-slate-900 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:bg-slate-700 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {connectionMode === "none" ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <FileText className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">
              Conéctese a una base de datos o active el Modo Demo.
            </p>
          </div>
        ) : !collectionPath ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center">
            <Database className="w-8 h-8 text-slate-700 mb-2" />
            <p className="text-xs text-slate-500">
              Seleccione una colección de la lista superior.
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
                <div className="px-3 py-2">
                  <div className="flex items-center justify-between w-full">
                    <span className="font-mono truncate flex-1 pr-2 text-[12px] font-medium">
                      {doc.id}
                    </span>
                    {isSubcollection ? (
                      <FolderOpen className="w-4 h-4 shrink-0 text-cyan-500" />
                    ) : (
                      <ArrowRight
                        className={`w-4 h-4 shrink-0 ${
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
