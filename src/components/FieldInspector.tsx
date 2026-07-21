import { useState } from "react";
import { FileText, RefreshCw, Info, Database, Plus, Save, Check, X, Pencil, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
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
      <section className="flex-1 bg-slate-50 dark:bg-slate-800 flex flex-col overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-500 space-y-4">
          <div className="bg-white dark:bg-slate-700 p-5 rounded-full border border-slate-200 dark:border-slate-600 shadow-sm">
            <Database className="w-10 h-10 text-indigo-600" />
          </div>
          <div className="max-w-md">
            <h3 className="text-md font-bold text-slate-800 dark:text-white mb-1">
              Ningún Documento Cargado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
              Ingrese una colección válida en el panel izquierdo (Ej:{" "}
              <strong className="text-indigo-600 font-mono text-[11px]">
                movilform-39511.firebaseio.com
              </strong>
              ) y presione consultar. O inicie el{" "}
              <strong className="text-amber-600">Modo Demo</strong> para
              interactuar de inmediato con datos de prueba.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="flex-1 bg-slate-50 dark:bg-slate-800 flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">
              Current Document
            </h2>
            <div className="flex items-center gap-2 mt-0.5">
              <FileText className="w-4 h-4 text-indigo-600" />
              <code className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-bold">
                {activeDocument.id}
              </code>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600 dark:text-slate-400 hidden md:inline-flex items-center gap-1 font-medium max-w-[300px]">
              <span className="shrink-0">Ruta:</span>
              <span className="font-mono bg-slate-100 dark:bg-slate-700 py-0.5 px-2 text-xs text-slate-600 dark:text-slate-300 rounded border border-slate-200 dark:border-slate-600 overflow-x-auto whitespace-nowrap max-w-[220px]">
                {collectionPath}
              </span>
            </span>
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-indigo-700 active:scale-95 transition-all text-center flex items-center gap-1.5 cursor-pointer"
              title="Recargar documento"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
          <div className="p-4 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl flex items-start gap-3 shadow-xs shrink-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-white mb-0.5">
                Instrucciones de edición
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                Para editar un campo, haga{" "}
                <strong className="text-slate-900 dark:text-white font-semibold">
                  Doble Clic
                </strong>{" "}
                sobre el valor. Modifique su contenido y use el botón azul de{" "}
                <strong className="text-indigo-600 dark:text-indigo-400 font-bold inline-flex items-center gap-0.5">
                  Commit
                </strong>{" "}
                o presione{" "}
                <kbd className="bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 px-1 py-0.5 text-[9px] rounded text-slate-700 dark:text-slate-200 font-mono">
                  Enter
                </kbd>{" "}
                para actualizar Firestore. Las claves pueden ser numéricas.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
            <div className="grid grid-cols-12 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-600 px-0 py-0 text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 tracking-wider shrink-0">
              <button
                onClick={() => toggleSort("key")}
                className="col-span-4 flex items-center gap-1 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-left"
              >
                Field Key
                {sortKey === "key" ? (
                  sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-40" />
                )}
              </button>
              <button
                onClick={() => toggleSort("value")}
                className="col-span-6 flex items-center gap-1 px-4 py-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer text-left"
              >
                Value (Double click to edit)
                {sortKey === "value" ? (
                  sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                ) : (
                  <ArrowUpDown className="w-3 h-3 opacity-40" />
                )}
              </button>
              <div className="col-span-2 text-right px-4 py-2.5">Type</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-600">
              {sortedKeys.map((key) => {
                const originalValue = activeDocument.data[key];
                const isNumericKey = !isNaN(Number(key));
                const isUnderEditing = editingFieldKey === key;
                const valueType =
                  originalValue === null ? "null" : typeof originalValue;

                return (
                  <div
                    key={key}
                    className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 dark:hover:bg-slate-600/50 transition-colors group ${
                      isUnderEditing
                        ? "bg-indigo-50/20 dark:bg-indigo-900/20"
                        : isNumericKey
                          ? "bg-amber-50/15 dark:bg-amber-900/15"
                          : ""
                    }`}
                  >
                    <div className="col-span-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      {isNumericKey ? `"${key}"` : key}
                      {isNumericKey && (
                        <span className="text-[9px] font-bold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200/60 dark:border-amber-700 px-1.5 py-0.2 rounded">
                          Numeric
                        </span>
                      )}
                    </div>

                    <div className="col-span-6">
                      {isUnderEditing ? (
                        <div className="flex items-center gap-1.5">
                          {editingType === "boolean" ? (
                            <select
                              className="bg-white dark:bg-slate-600 border border-indigo-400 rounded-md px-2 py-1 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
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
                              className="flex-1 bg-white dark:bg-slate-600 border border-indigo-400 rounded-md px-2.5 py-1 text-xs text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                              autoFocus
                            />
                          )}

                          <select
                            value={editingType}
                            onChange={(e) =>
                              onEditingTypeChange(e.target.value as any)
                            }
                            className="bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-md px-1.5 py-1 text-[10px] text-slate-600 dark:text-slate-300 focus:outline-none"
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
                            <Check className="w-3.5 h-3.5" />
                            {hasPendingChanges && (
                              <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                            )}
                          </button>
                          <button
                            onClick={onCancelEdit}
                            className="p-1 rounded bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 text-slate-500 dark:text-slate-300 hover:text-slate-700 cursor-pointer"
                            title="Cancelar"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div
                          onDoubleClick={() =>
                            onStartEdit(key, originalValue)
                          }
                          className="py-1 cursor-default select-all flex items-center justify-between"
                          title="Doble clic para editar campo"
                        >
                          <span className="font-mono text-slate-600 dark:text-slate-300 text-xs overflow-x-auto whitespace-pre-wrap flex-1 leading-relaxed">
                            {originalValue === null
                              ? "null"
                              : String(originalValue)}
                          </span>
                          <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer pl-2 select-none hover:underline">
                            Doble clic para editar
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="col-span-2 text-right">
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                          valueType === "number"
                            ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-700"
                            : valueType === "boolean"
                              ? "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200 dark:border-purple-700"
                              : valueType === "object"
                                ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-700"
                                : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-700"
                        }`}
                      >
                        {valueType}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-slate-200 dark:border-slate-600 p-4 bg-slate-50 dark:bg-slate-800 flex items-center justify-between rounded-b-lg shrink-0">
              {isAddingField ? (
                <div className="w-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-3.5 space-y-3.5 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-indigo-600" />
                      Inyectar Nuevo Campo
                    </span>
                    <button
                      onClick={onToggleAddField}
                      className="text-slate-400 dark:text-slate-300 hover:text-slate-600 text-xs cursor-pointer flex items-center gap-0.5 font-medium"
                    >
                      <X className="w-3.5 h-3.5" /> Cancelar
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                        Nombre / Clave
                      </label>
                      <input
                        type="text"
                        placeholder="Ej: 1 o id_sensor"
                        className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded p-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                        value={newFieldKey}
                        onChange={(e) => onNewFieldKeyChange(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                        Tipo de Dato
                      </label>
                      <select
                        className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded p-2 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
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
                      <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mb-1">
                        Valor Inicial
                      </label>
                      {newFieldType === "boolean" ? (
                        <select
                          className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded p-2 text-xs text-slate-700 dark:text-white focus:outline-none focus:border-indigo-500 font-semibold"
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
                          className="w-full bg-slate-50 dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded p-2 text-xs text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
                          value={newFieldValue}
                          onChange={(e) => onNewFieldValueChange(e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <button
                    onClick={onAddNewField}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Agregar Campo a Firestore
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={onToggleAddField}
                    className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add New Field
                  </button>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium italic">
                    Editing {activeDocument.id} —{" "}
                    {Object.keys(activeDocument.data || {}).length} fields total
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
