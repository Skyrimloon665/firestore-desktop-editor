import { useState } from "react";
import { FileText, RefreshCw, Info, Database, Plus, Save, Check, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, ChevronRight } from "lucide-react";
import type { DocData, ConnectionMode } from "../services/types";

interface FieldInspectorProps {
  activeDocument: DocData | undefined;
  documents: DocData[];
  collectionPath: string;
  connectionMode: ConnectionMode;
  projectId: string;
  isLoading: boolean;
  editingFieldKey: string | null;
  editingValue: string;
  editingType: "string" | "number" | "boolean";
  hasPendingChanges: boolean;
  isAddingField: boolean;
  newFieldKey: string;
  newFieldValue: string;
  newFieldType: "string" | "number" | "boolean";
  onRefresh: () => void;
  onStartEdit: (key: string, value: any) => void;
  onEditingValueChange: (value: string) => void;
  onEditingTypeChange: (type: "string" | "number" | "boolean") => void;
  onCommitEdit: (fieldKey: string) => void;
  onCancelEdit: () => void;
  onToggleAddField: () => void;
  onNewFieldKeyChange: (key: string) => void;
  onNewFieldValueChange: (value: string) => void;
  onNewFieldTypeChange: (type: "string" | "number" | "boolean") => void;
  onAddNewField: () => void;
}

const typeBadge: Record<string, string> = {
  number: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200/50 dark:border-amber-700/30",
  boolean: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200/50 dark:border-violet-700/30",
  object: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200/50 dark:border-sky-700/30",
  string: "bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-600/50",
  null: "bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-500 border-slate-200 dark:border-slate-600/50",
};

export function FieldInspector({
  activeDocument,
  documents,
  collectionPath,
  connectionMode,
  isLoading,
  editingFieldKey,
  editingValue,
  editingType,
  hasPendingChanges,
  isAddingField,
  newFieldKey,
  newFieldValue,
  newFieldType,
  onRefresh,
  onStartEdit,
  onEditingValueChange,
  onEditingTypeChange,
  onCommitEdit,
  onCancelEdit,
  onToggleAddField,
  onNewFieldKeyChange,
  onNewFieldValueChange,
  onNewFieldTypeChange,
  onAddNewField,
}: FieldInspectorProps) {
  const [sortKey, setSortKey] = useState<"key" | "value" | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [showInstructions, setShowInstructions] = useState(false);

  const toggleSort = (col: "key" | "value") => {
    if (sortKey !== col) {
      setSortKey(col);
      setSortDir("asc");
    } else {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    }
  };

  const sortedKeys = activeDocument
    ? Object.keys(activeDocument.data || {}).slice().sort((a, b) => {
        if (!sortKey) return 0;
        const va = activeDocument.data[a];
        const vb = activeDocument.data[b];
        const aStr = a;
        const bStr = b;
        const bVal = sortKey === "key"
          ? aStr.localeCompare(bStr)
          : String(va ?? "").localeCompare(String(vb ?? ""));
        return sortDir === "asc" ? bVal : -bVal;
      })
    : [];

  if (!activeDocument) {
    return (
      <section className="flex-1 bg-slate-50 dark:bg-slate-800/50 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-full border border-slate-200 dark:border-slate-700 shadow-xs">
            <Database className="w-10 h-10 text-indigo-500" />
          </div>
          <div className="max-w-md">
            <h3 className="text-md font-bold text-slate-800 dark:text-slate-200 mb-1">
              Ningún Documento Cargado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
               Ingrese una colección en el panel izquierdo y presione{" "}
              <strong className="text-indigo-600">Consultar</strong>. O inicie el{" "}
              <strong className="text-amber-600">Modo Demo</strong>.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 bg-slate-50 dark:bg-slate-800/50 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700/50 px-5 py-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
              <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold truncate">
                {activeDocument.id}
              </code>
            </div>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-mono bg-slate-100 dark:bg-slate-700/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50 overflow-x-auto whitespace-nowrap max-w-[320px]">
              <span className="shrink-0 text-slate-400">Ruta:</span>
              {collectionPath}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium text-[11px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
              title="Recargar documento"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 px-5 py-4 overflow-hidden flex flex-col gap-4">
          <button
            onClick={() => setShowInstructions((v) => !v)}
            className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer shrink-0"
          >
            {showInstructions ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            Instrucciones de edición
          </button>

          {showInstructions && (
            <div className="px-3 py-2 bg-white dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700/50 rounded-lg flex items-start gap-2.5 shadow-xs shrink-0">
              <div className="w-6 h-6 rounded-md bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-500 dark:text-indigo-400 shrink-0">
                <Info className="w-3.5 h-3.5" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Doble clic sobre un valor para editarlo. Use <kbd className="bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 px-1 py-0.5 text-[8px] rounded text-slate-700 dark:text-slate-200 font-mono">Enter</kbd> para confirmar o <kbd className="bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 px-1 py-0.5 text-[8px] rounded text-slate-700 dark:text-slate-200 font-mono">Esc</kbd> para cancelar.
              </p>
            </div>
          )}

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 rounded-lg shadow-xs flex flex-col overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-700/50 text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider shrink-0">
              <button
                onClick={() => toggleSort("key")}
                className="col-span-4 flex items-center gap-1 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-left"
              >
                Field Key
                {sortKey === "key" ? (
                  sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />
                ) : (
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                )}
              </button>
              <button
                onClick={() => toggleSort("value")}
                className="col-span-6 flex items-center gap-1 px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-700/30 transition-colors cursor-pointer text-left"
              >
                Value
                {sortKey === "value" ? (
                  sortDir === "asc" ? <ArrowUp className="w-2.5 h-2.5" /> : <ArrowDown className="w-2.5 h-2.5" />
                ) : (
                  <ArrowUpDown className="w-2.5 h-2.5 opacity-30" />
                )}
              </button>
              <div className="col-span-2 text-right px-4 py-2">Type</div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {sortedKeys.map((key, idx) => {
                const originalValue = activeDocument.data[key];
                const isNumericKey = !isNaN(Number(key));
                const isUnderEditing = editingFieldKey === key;
                const valueType =
                  originalValue === null ? "null" : typeof originalValue;

                return (
                  <div
                    key={key}
                    className={`grid grid-cols-12 items-center transition-colors ${
                      idx % 2 === 0
                        ? "bg-white dark:bg-slate-800/40"
                        : "bg-slate-50/50 dark:bg-slate-800/20"
                    } ${
                      isUnderEditing
                        ? "bg-indigo-50/60 dark:bg-indigo-900/15"
                        : "hover:bg-slate-50 dark:hover:bg-slate-700/20"
                    }`}
                  >
                    <div className="col-span-4 font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1.5 px-4 py-1.5 border-b border-slate-100 dark:border-slate-700/30">
                      {isNumericKey ? `"${key}"` : key}
                      {isNumericKey && (
                        <span className="text-[8px] font-medium text-amber-500/70 bg-amber-500/10 px-1 rounded border border-amber-500/20">
                          #key
                        </span>
                      )}
                    </div>

                    <div className="col-span-6 px-4 py-1.5 border-b border-slate-100 dark:border-slate-700/30">
                      {isUnderEditing ? (
                        <div className="flex items-center gap-1">
                          {editingType === "boolean" ? (
                            <select
                              className="border border-indigo-300 dark:border-indigo-600 rounded px-2 py-1 text-[11px] text-slate-800 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-medium"
                              value={editingValue}
                              onChange={(e) => onEditingValueChange(e.target.value)}
                              autoFocus
                            >
                              <option value="true">true</option>
                              <option value="false">false</option>
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editingValue}
                              onChange={(e) => onEditingValueChange(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") onCommitEdit(key);
                                if (e.key === "Escape") onCancelEdit();
                              }}
                              className="flex-1 border border-indigo-300 dark:border-indigo-600 rounded px-2 py-1 text-[11px] text-slate-800 dark:text-white bg-white dark:bg-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-400 font-mono"
                              autoFocus
                            />
                          )}

                          <select
                            value={editingType}
                            onChange={(e) =>
                              onEditingTypeChange(e.target.value as any)
                            }
                            className="border border-slate-200 dark:border-slate-600 rounded px-1 py-1 text-[9px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-700 focus:outline-none"
                          >
                            <option value="string">string</option>
                            <option value="number">number</option>
                            <option value="boolean">boolean</option>
                          </select>

                          <button
                            onClick={() => onCommitEdit(key)}
                            className="p-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer relative"
                            title="Guardar cambios"
                          >
                            <Check className="w-3 h-3" />
                            {hasPendingChanges && (
                              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                            )}
                          </button>
                          <button
                            onClick={onCancelEdit}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-400 dark:text-slate-500 hover:text-slate-600 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={() =>
                            onStartEdit(key, originalValue)
                          }
                          className="py-0.5 cursor-default select-all flex items-center justify-between group"
                          title="Doble clic para editar campo"
                        >
                          <span className="font-mono text-slate-600 dark:text-slate-400 text-[11px] overflow-x-auto whitespace-pre-wrap flex-1 leading-relaxed">
                            {originalValue === null
                              ? "null"
                              : String(originalValue)}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-[8px] text-indigo-500 dark:text-indigo-400 font-medium pl-2 select-none shrink-0">
                            Editar
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 text-right px-4 py-1.5 border-b border-slate-100 dark:border-slate-700/30">
                      <span
                        className={`text-[9px] font-medium uppercase px-1.5 py-0.5 rounded border ${
                          typeBadge[valueType] || typeBadge.string
                        }`}
                      >
                        {valueType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700/50 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between rounded-b-lg shrink-0">
              {isAddingField ? (
                <div className="w-full bg-white dark:bg-slate-700/80 border border-slate-200 dark:border-slate-600/50 rounded-lg p-3 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Plus className="w-3.5 h-3.5 text-indigo-500" />
                      Nuevo Campo
                    </span>
                    <button
                      onClick={onToggleAddField}
                      className="text-slate-400 dark:text-slate-500 hover:text-slate-600 text-[10px] cursor-pointer flex items-center gap-0.5 font-medium"
                    >
                      <X className="w-3 h-3" /> Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                        Clave
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: id_sensor"
                        className="w-full bg-slate-50 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500/50 rounded px-2 py-1.5 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        value={newFieldKey}
                        onChange={(e) => onNewFieldKeyChange(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                        Tipo
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500/50 rounded px-2 py-1.5 text-[11px] text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                        value={newFieldType}
                        onChange={(e) =>
                          onNewFieldTypeChange(e.target.value as any)
                        }
                      >
                        <option value="string">string</option>
                        <option value="number">number</option>
                        <option value="boolean">boolean</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                        Valor Inicial
                      </label>
                      {newFieldType === "boolean" ? (
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500/50 rounded px-2 py-1.5 text-[11px] text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500 font-medium"
                          value={newFieldValue}
                          onChange={(e) => onNewFieldValueChange(e.target.value)}
                        >
                          <option value="">Seleccione...</option>
                          <option value="true">true</option>
                          <option value="false">false</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          placeholder="Valor inicial"
                          className="w-full bg-slate-50 dark:bg-slate-600/50 border border-slate-200 dark:border-slate-500/50 rounded px-2 py-1.5 text-[11px] text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                          value={newFieldValue}
                          onChange={(e) => onNewFieldValueChange(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onAddNewField}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] px-4 py-1.5 rounded-md flex items-center gap-1.5 shadow-xs transition-all cursor-pointer active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Agregar Campo
                  </button>
                </div>
              ) : (
                <div className="w-full flex items-center justify-between">
                  <button
                    onClick={onToggleAddField}
                    className="text-indigo-600 dark:text-indigo-400 text-[11px] font-bold flex items-center gap-1 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 px-2.5 py-1.5 rounded-md transition-colors cursor-pointer border border-transparent hover:border-indigo-200 dark:hover:border-indigo-700/50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add New Field
                  </button>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 font-medium">
                    {Object.keys(activeDocument.data || {}).length} fields
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
