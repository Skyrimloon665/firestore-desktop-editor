import { useState, useEffect } from "react";
import { 
  FolderOpen, 
  Database, 
  Save, 
  Check, 
  X, 
  FileText, 
  AlertCircle, 
  Terminal, 
  Plus, 
  Lock, 
  RefreshCw, 
  Info, 
  Cpu, 
  ArrowRight,
  CheckCircle,
  HelpCircle
} from "lucide-react";

declare global {
  interface Window {
    electron?: {
      isElectron: boolean;
      selectCredentialsFile: () => Promise<{ success: boolean; cancelled?: boolean; projectId?: string; fileName?: string; error?: string }>;
      connectWithCredentialsJson: (json: string) => Promise<{ success: boolean; projectId?: string; error?: string }>;
      listDocuments: (path: string) => Promise<{ success: boolean; documents?: Array<{ id: string; data: any }>; error?: string }>;
      updateField: (data: { collectionPath: string; docId: string; fieldKey: string; fieldValue: any; fieldType: string }) => Promise<{ success: boolean; updatedFields?: any; error?: string }>;
    };
  }
}

// Simulated Demo Data for instant test drives in browser previews
const MOCK_PROJECT_ID = "movilform-39511";
const MOCK_COLLECTION = "movilform-39511.firebaseio.com";
const INITIAL_MOCK_DOCUMENTS = [
  {
    id: "doc_sensor_01",
    data: {
      "active": true,
      "interval_seconds": 15,
      "location": "Planta Industrial Norte - Silo A",
      "status_code": 200,
      "1": "988" // Pure numeric key requested in prompt!
    }
  },
  {
    id: "doc_config_global",
    data: {
      "maintenance_mode": false,
      "support_phone": "+541155554321",
      "api_endpoint": "https://api.movilform.com/v1",
      "max_retries": 5
    }
  },
  {
    id: "doc_user_test",
    data: {
      "name": "Juan Pérez",
      "email": "juan.perez@test.com",
      "role": "contributor_tier2",
      "verified": true,
      "quota_bytes": 1048576
    }
  }
];

export default function App() {
  const isElectron = !!window.electron;
  
  // App Connection State
  const [projectId, setProjectId] = useState<string>("");
  const [connectionMode, setConnectionMode] = useState<"none" | "demo" | "cloud">("none");
  const [credentialsName, setCredentialsName] = useState<string>("");
  const [jsonPasteOpen, setJsonPasteOpen] = useState<boolean>(false);
  const [rawJsonText, setRawJsonText] = useState<string>("");
  
  // Firestore Inspector State
  const [collectionPath, setCollectionPath] = useState<string>("movilform-39511.firebaseio.com");
  const [documents, setDocuments] = useState<Array<{ id: string; data: any }>>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "info" | "success" | "error" } | null>(null);

  // Field Edit/Add State
  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");
  const [editingType, setEditingType] = useState<"string" | "number" | "boolean">("string");
  
  const [newFieldKey, setNewFieldKey] = useState<string>("");
  const [newFieldValue, setNewFieldValue] = useState<string>("");
  const [newFieldType, setNewFieldType] = useState<"string" | "number" | "boolean">("string");
  const [isAddingField, setIsAddingField] = useState<boolean>(false);

  // Simulated Database representation for Demo Mode
  const [simulatedDb, setSimulatedDb] = useState<Record<string, Array<{ id: string; data: any }>>>({
    ["movilform-39511.firebaseio.com"]: INITIAL_MOCK_DOCUMENTS
  });

  // Display status triggers
  const showStatus = (text: string, type: "info" | "success" | "error" = "info") => {
    setStatusMessage({ text, type });
    setTimeout(() => {
      setStatusMessage(prev => prev?.text === text ? null : prev);
    }, 4500);
  };

  // 1. CONNECTION ACTIONS
  const handleSelectCredentialsFile = async () => {
    setIsLoading(true);
    if (isElectron && window.electron) {
      try {
        const res = await window.electron.selectCredentialsFile();
        if (res.success && res.projectId) {
          setProjectId(res.projectId);
          setCredentialsName(res.fileName || "credentials.json");
          setConnectionMode("cloud");
          showStatus(`Conectado exitosamente al proyecto ${res.projectId}`, "success");
          // Attempt to load documents from active collection path
          await loadDocuments(collectionPath, "cloud", res.projectId);
        } else if (res.error) {
          showStatus(res.error, "error");
        }
      } catch (err: any) {
        showStatus(`Error en Electron Dialog: ${err.message}`, "error");
      }
    } else {
      showStatus("Acceso a sistema local no disponible. Cargue credenciales usando el formulario web o active el Modo Demo.", "info");
    }
    setIsLoading(false);
  };

  const handleConnectWithJsonText = async () => {
    if (!rawJsonText.trim()) {
      showStatus("La cadena JSON no puede estar vacía.", "error");
      return;
    }
    setIsLoading(true);
    try {
      const parsed = JSON.parse(rawJsonText);
      if (!parsed.project_id) {
        throw new Error("Falta el campo 'project_id' en el JSON.");
      }

      if (isElectron && window.electron) {
        const res = await window.electron.connectWithCredentialsJson(rawJsonText);
        if (res.success && res.projectId) {
          setProjectId(res.projectId);
          setCredentialsName("JSON Pegado");
          setConnectionMode("cloud");
          setJsonPasteOpen(false);
          showStatus(`Conectado a ${res.projectId} (Modo Electron)`, "success");
          await loadDocuments(collectionPath, "cloud", res.projectId);
        } else {
          showStatus(res.error || "Fallo en conexión", "error");
        }
      } else {
        // Fullstack web helper fallback in AI Studio Web Environment
        const res = await fetch("/api/connect", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serviceAccount: parsed })
        });
        const data = await res.json();
        if (data.success) {
          setProjectId(data.projectId);
          setCredentialsName("Cuenta de Servicio");
          setConnectionMode("cloud");
          setJsonPasteOpen(false);
          showStatus(`Conectado al proyecto Real ${data.projectId} (Vía Servidor)`, "success");
          await loadDocuments(collectionPath, "cloud", data.projectId);
        } else {
          showStatus(data.error || "Fallo al conectar con el servidor", "error");
        }
      }
    } catch (err: any) {
      showStatus(`JSON inválido: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleActivateDemoMode = () => {
    setProjectId(MOCK_PROJECT_ID);
    setCredentialsName("Simulada (Modo de Prueba)");
    setConnectionMode("demo");
    showStatus("Modo Demo local activado. Base de datos precargada.", "success");
    // Load local mock documents
    const mockDocs = simulatedDb[collectionPath] || INITIAL_MOCK_DOCUMENTS;
    setDocuments(mockDocs);
    if (mockDocs.length > 0) {
      setSelectedDocId(mockDocs[0].id);
    }
  };

  // 2. RETRIEVE DOCUMENTS (Requirement 1: clean exact route passing)
  const handleFetchDocuments = async () => {
    if (!connectionMode || connectionMode === "none") {
      showStatus("Por favor conéctese a una base de datos o use el Modo Demo primero.", "error");
      return;
    }
    await loadDocuments(collectionPath, connectionMode, projectId);
  };

  const loadDocuments = async (path: string, mode: "demo" | "cloud", targetProjId: string) => {
    setIsLoading(true);
    try {
      if (mode === "demo") {
        // Pull simulated data or create blank lists for new paths
        if (!simulatedDb[path]) {
          // If custom path, provide realistic empty array
          setSimulatedDb(prev => ({ ...prev, [path]: [] }));
          setDocuments([]);
          setSelectedDocId(null);
          showStatus(`Colección demo ${path} cargada vacía. Puede agregar campos.`, "info");
        } else {
          setDocuments(simulatedDb[path]);
          if (simulatedDb[path].length > 0) {
            setSelectedDocId(simulatedDb[path][0].id);
          } else {
            setSelectedDocId(null);
          }
          showStatus("Búsqueda exitosa en base de datos de simulación.", "success");
        }
      } else {
        // Cloud environment (Electron IPC or Node REST API proxy)
        if (isElectron && window.electron) {
          const res = await window.electron.listDocuments(path);
          if (res.success && res.documents) {
            setDocuments(res.documents);
            if (res.documents.length > 0) {
              setSelectedDocId(res.documents[0].id);
            } else {
              setSelectedDocId(null);
            }
            showStatus(`Cargados ${res.documents.length} documentos desde Firestore`, "success");
          } else {
            showStatus(res.error || "Fallo al listar documentos", "error");
          }
        } else {
          // AI Studio Web Fullstack Route
          const res = await fetch("/api/list-documents", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ collectionPath: path, projectId: targetProjId })
          });
          const data = await res.json();
          if (data.success && data.documents) {
            setDocuments(data.documents);
            if (data.documents.length > 0) {
              setSelectedDocId(data.documents[0].id);
            } else {
              setSelectedDocId(null);
            }
            showStatus(`Cargados ${data.documents.length} documentos reales.`, "success");
          } else {
            showStatus(data.error || "Error al solicitar datos", "error");
          }
        }
      }
    } catch (err: any) {
      showStatus(`Error al cargar documentos: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 3. EDIT/COMMIT VALUE ACTION (Requirement 2: double click and direct update channel)
  const handleStartEditField = (key: string, value: any) => {
    setEditingFieldKey(key);
    setEditingValue(typeof value === "object" ? JSON.stringify(value) : String(value));
    setEditingType(typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string");
  };

  const handleCommitEdit = async (fieldKey: string) => {
    if (!selectedDocId) return;
    setIsLoading(true);

    // Cast the value explicitly
    let parsedVal: any = editingValue;
    if (editingType === "number") {
      parsedVal = Number(editingValue);
      if (isNaN(parsedVal)) {
        showStatus("Por favor ingrese un número válido.", "error");
        setIsLoading(false);
        return;
      }
    } else if (editingType === "boolean") {
      parsedVal = editingValue.toLowerCase() === "true" || editingValue === "1";
    }

    try {
      if (connectionMode === "demo") {
        // Update browser local state
        const currentDataList = [...(simulatedDb[collectionPath] || [])];
        const targetDocIndex = currentDataList.findIndex(d => d.id === selectedDocId);
        
        if (targetDocIndex !== -1) {
          const updatedDoc = { ...currentDataList[targetDocIndex] };
          updatedDoc.data = {
            ...updatedDoc.data,
            [fieldKey]: parsedVal
          };
          currentDataList[targetDocIndex] = updatedDoc;
          
          setSimulatedDb(prev => ({ ...prev, [collectionPath]: currentDataList }));
          setDocuments(currentDataList);
          showStatus(`Campo "${fieldKey}" actualizado exitosamente (Simulador Lógico)`, "success");
        }
        setEditingFieldKey(null);
      } else {
        // Cloud update
        if (isElectron && window.electron) {
          const res = await window.electron.updateField({
            collectionPath,
            docId: selectedDocId,
            fieldKey,
            fieldValue: parsedVal,
            fieldType: editingType
          });

          if (res.success && res.updatedFields) {
            // Apply updated state to UI
            setDocuments(prevDocs => 
              prevDocs.map(d => d.id === selectedDocId ? { ...d, data: res.updatedFields } : d)
            );
            showStatus(`Campo "${fieldKey}" modificado en Firestore`, "success");
            setEditingFieldKey(null);
          } else {
            showStatus(res.error || "Fallo en update", "error");
          }
        } else {
          // AI Studio Web Server Router
          const res = await fetch("/api/update-field", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collectionPath,
              docId: selectedDocId,
              fieldKey,
              fieldValue: parsedVal,
              fieldType: editingType,
              projectId
            })
          });
          const data = await res.json();
          if (data.success && data.updatedFields) {
            setDocuments(prevDocs => 
              prevDocs.map(d => d.id === selectedDocId ? { ...d, data: data.updatedFields } : d)
            );
            showStatus(`Campo "${fieldKey}" actualizado con éxito en Firestore`, "success");
            setEditingFieldKey(null);
          } else {
            showStatus(data.error || "Fallo al enviar actualización", "error");
          }
        }
      }
    } catch (err: any) {
      showStatus(`Error en commit: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 4. ADD NEW FIELD TO CURRENT DOCUMENT
  const handleAddNewField = async () => {
    if (!selectedDocId) {
      showStatus("Primero debe seleccionar un documento.", "error");
      return;
    }
    if (!newFieldKey.trim()) {
      showStatus("El nombre del campo (Clave) es obligatorio.", "error");
      return;
    }

    setIsLoading(true);

    // Cast the value
    let parsedVal: any = newFieldValue;
    if (newFieldType === "number") {
      parsedVal = Number(newFieldValue);
      if (isNaN(parsedVal)) {
        showStatus("El valor ingresado no es un número válido.", "error");
        setIsLoading(false);
        return;
      }
    } else if (newFieldType === "boolean") {
      parsedVal = newFieldValue.toLowerCase() === "true" || newFieldValue === "1";
    }

    try {
      if (connectionMode === "demo") {
        // Local simulation insert
        const currentDataList = [...(simulatedDb[collectionPath] || [])];
        const targetDocIndex = currentDataList.findIndex(d => d.id === selectedDocId);
        
        if (targetDocIndex !== -1) {
          const updatedDoc = { ...currentDataList[targetDocIndex] };
          updatedDoc.data = {
            ...updatedDoc.data,
            [newFieldKey]: parsedVal
          };
          currentDataList[targetDocIndex] = updatedDoc;
          
          setSimulatedDb(prev => ({ ...prev, [collectionPath]: currentDataList }));
          setDocuments(currentDataList);
          showStatus(`Campo "${newFieldKey}" agregado correctamente`, "success");
        }
        
        // Reset states
        setNewFieldKey("");
        setNewFieldValue("");
        setIsAddingField(false);
      } else {
        // Production Firestore Insert via IPC or HTTP
        if (isElectron && window.electron) {
          const res = await window.electron.updateField({
            collectionPath,
            docId: selectedDocId,
            fieldKey: newFieldKey,
            fieldValue: parsedVal,
            fieldType: newFieldType
          });

          if (res.success && res.updatedFields) {
            setDocuments(prevDocs => 
              prevDocs.map(d => d.id === selectedDocId ? { ...d, data: res.updatedFields } : d)
            );
            showStatus(`Nuevo campo "${newFieldKey}" inyectado en Firestore`, "success");
            setNewFieldKey("");
            setNewFieldValue("");
            setIsAddingField(false);
          } else {
            showStatus(res.error || "Fallo al crear campo", "error");
          }
        } else {
          // Web API proxy
          const res = await fetch("/api/update-field", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              collectionPath,
              docId: selectedDocId,
              fieldKey: newFieldKey,
              fieldValue: parsedVal,
              fieldType: newFieldType,
              projectId
            })
          });
          const data = await res.json();
          if (data.success && data.updatedFields) {
            setDocuments(prevDocs => 
              prevDocs.map(d => d.id === selectedDocId ? { ...d, data: data.updatedFields } : d)
            );
            showStatus(`Nuevo campo "${newFieldKey}" guardado en Firestore`, "success");
            setNewFieldKey("");
            setNewFieldValue("");
            setIsAddingField(false);
          } else {
            showStatus(data.error || "Fallo en el servidor web", "error");
          }
        }
      }
    } catch (err: any) {
      showStatus(`Error en addField: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // 5. HELPER ACTION: CREATE EMPTY DOCUMENT
  const handleCreateEmptyDocument = () => {
    if (!connectionMode || connectionMode === "none") {
      showStatus("Conecte el entorno primero.", "error");
      return;
    }
    const newId = prompt("Ingrese ID del nuevo documento:");
    if (!newId) return;

    if (documents.some(d => d.id === newId)) {
      showStatus("Ese ID ya existe en esta colección.", "error");
      return;
    }

    if (connectionMode === "demo") {
      const currentList = [...(simulatedDb[collectionPath] || [])];
      const newDoc = { id: newId, data: { "nuevo_campo": "valor_inicial" } };
      currentList.push(newDoc);
      setSimulatedDb(prev => ({ ...prev, [collectionPath]: currentList }));
      setDocuments(currentList);
      setSelectedDocId(newId);
      showStatus(`Documento '${newId}' creado localmente`, "success");
    } else {
      // Create empty record by initializing one field via our general updater
      setIsLoading(true);
      const initialCall = async () => {
        try {
          if (isElectron && window.electron) {
            const res = await window.electron.updateField({
              collectionPath,
              docId: newId,
              fieldKey: "_creado",
              fieldValue: true,
              fieldType: "boolean"
            });
            if (res.success) {
              await loadDocuments(collectionPath, "cloud", projectId);
              setSelectedDocId(newId);
              showStatus(`Documento '${newId}' creado en Firestore (Electron)`, "success");
            }
          } else {
            const res = await fetch("/api/update-field", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                collectionPath,
                docId: newId,
                fieldKey: "_creado",
                fieldValue: true,
                fieldType: "boolean",
                projectId
              })
            });
            const data = await res.json();
            if (data.success) {
              await loadDocuments(collectionPath, "cloud", projectId);
              setSelectedDocId(newId);
              showStatus(`Documento '${newId}' creado en Firestore`, "success");
            }
          }
        } catch (e: any) {
          showStatus(e.message, "error");
        } finally {
          setIsLoading(false);
        }
      };
      initialCall();
    }
  };

  // Find selected document data
  const activeDocument = documents.find(d => d.id === selectedDocId);
  const filteredDocs = documents.filter(d => 
    d.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col overflow-hidden antialiased selection:bg-indigo-600 selection:text-white">
      
      {/* 1. TOP PANEL: CONEXIONES */}
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded flex items-center justify-center text-white">
            <Database className="w-5 h-5 text-white" id="db-header-icon" />
          </div>
          <div>
            <h1 className="text-sm md:text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Firestore Desktop Editor
              <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2 py-0.5 rounded-full border border-indigo-200">
                {isElectron ? "Electron Host Node" : "Web Preview Gateway"}
              </span>
            </h1>
            <p className="text-[10px] text-slate-500 font-medium -mt-0.5">Inspección de Esquemas y Edición en Tiempo Real para Cuentas de Servicio</p>
          </div>
        </div>

        {/* Dynamic status/credentials display */}
        <div className="flex items-center gap-3">
          {connectionMode !== "none" ? (
            <div className="flex items-center gap-3 text-xs bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg select-all">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-slate-500">Proyecto:</span>
                <span className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[11px] font-bold">{projectId}</span>
              </div>
              <div className="h-4 w-px bg-slate-200"></div>
              <div className="hidden sm:block">
                <span className="text-slate-605 font-medium">{credentialsName}</span>
              </div>
              <button 
                onClick={() => {
                  setConnectionMode("none");
                  setProjectId("");
                  setDocuments([]);
                  setSelectedDocId(null);
                  showStatus("Desconectado de la base de datos", "info");
                }}
                className="text-xs font-bold text-red-600 hover:text-red-700 transition-colors ml-2 hover:underline cursor-pointer"
              >
                Desconectar
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
              <span className="text-xs text-slate-500 flex items-center gap-1.5 font-semibold">
                <Lock className="w-3.5 h-3.5 text-slate-400" />
                Sin Conectar
              </span>
            </div>
          )}

          {/* Load Actions */}
          {connectionMode === "none" && (
            <div className="flex items-center gap-2">
              {isElectron ? (
                <button
                  onClick={handleSelectCredentialsFile}
                  disabled={isLoading}
                  className="bg-indigo-600 hover:bg-indigo-750 disabled:bg-slate-300 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                  id="btn-select-file"
                >
                  <FolderOpen className="w-4 h-4" />
                  Abrir credentials.json
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setJsonPasteOpen(true)}
                    disabled={isLoading}
                    className="bg-white text-slate-755 hover:bg-slate-50 border border-slate-200 font-bold text-xs px-3.5 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    id="btn-paste-json"
                  >
                    <FolderOpen className="w-4 h-4 text-slate-500" />
                    Cargar Credentials JSON
                  </button>
                </div>
              )}

              <button
                onClick={handleActivateDemoMode}
                disabled={isLoading}
                className="bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                id="btn-demo-mode"
              >
                <Cpu className="w-4 h-4 text-amber-605 animate-spin-slow" />
                Iniciar Modo Demo
              </button>
            </div>
          )}
        </div>
      </header>

      {/* JSON Loading Dialog Fallback for Web Applet */}
      {jsonPasteOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-lg w-full p-6 relative">
            <button 
              onClick={() => setJsonPasteOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-655 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center">
                <FolderOpen className="w-5 h-5 text-indigo-600" />
              </div>
              <h2 className="text-md font-bold text-slate-800">Importar Cuenta de Servicio Firebase</h2>
            </div>
            
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Pegue el contenido JSON de su <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded font-mono">credentials.json</code> generado en Firebase Console para conectarse directamente.
            </p>

            <textarea
              className="w-full h-44 bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-[11px] text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-505 focus:ring-1 focus:ring-indigo-505 resize-none mb-4"
              placeholder='{ "type": "service_account", "project_id": "mi-proyecto", "private_key": "-----BEGIN PRIVATE KEY-----...", ... }'
              value={rawJsonText}
              onChange={(e) => setRawJsonText(e.target.value)}
            ></textarea>

            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setJsonPasteOpen(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConnectWithJsonText}
                disabled={isLoading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-355 px-5 py-2 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-4 h-4" />}
                Cargar e Inicializar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. THREE PANEL WORKSPACE CONSTRAINED ON ONE SCREEN */}
      <main className="flex-1 flex overflow-hidden">
        
        {/* A. LEFT COLUMN (LISTADO DE COLECCIONES Y DOCUMENTOS) */}
        <section className="w-80 border-r border-slate-805 bg-slate-900 text-slate-300 flex flex-col shrink-0">
          
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex flex-col gap-3">
            <div>
              <label className="text-[10px] uppercase font-bold tracking-widest text-slate-500 block mb-2">
                Root Collection Path
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ej: movilform-39511"
                  className="w-full bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-indigo-200"
                  value={collectionPath}
                  onChange={(e) => setCollectionPath(e.target.value)}
                />
                <button
                  onClick={handleFetchDocuments}
                  disabled={isLoading || connectionMode === "none"}
                  className="bg-slate-700 hover:bg-slate-600 disabled:bg-slate-850 disabled:text-slate-600 p-2 rounded transition-all cursor-pointer text-white"
                  title="Listar Documentos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
                </button>
              </div>
            </div>

            {/* Warning node matching requirement 1 */}
            <div className="text-[10px] text-slate-400 bg-slate-850 p-2.5 rounded border border-slate-800/80 leading-snug flex items-start gap-1.5">
              <Info className="w-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>
                Compatible con nombres exactos de colección como <code className="text-indigo-300 font-mono">.firebaseio.com</code>. Traspasado directo al SDK de Node.
              </span>
            </div>
          </div>

          {/* Search document IDs */}
          <div className="p-3 border-b border-slate-800/80 bg-slate-900 flex items-center justify-between gap-2">
            <input
              type="text"
              placeholder="Filtrar ID de documento..."
              className="flex-1 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
            />
            {connectionMode !== "none" && (
              <button
                onClick={handleCreateEmptyDocument}
                className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 p-1.5 rounded text-xs shrink-0 flex items-center justify-center cursor-pointer transition-colors"
                title="Nuevo Documento"
              >
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* List panel */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1 bg-slate-900">
            {connectionMode === "none" ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <FileText className="w-8 h-8 text-slate-700 mb-2" />
                <p className="text-xs text-slate-500">Conéctese a una base de datos para listar documentos o active el Modo Demo.</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center">
                <p className="text-xs text-slate-500 font-medium">No se encontraron documentos.</p>
                {collectionPath.includes(".") && (
                  <p className="text-[10px] text-slate-600 mt-1">Verifique la ruta exacta de la colección raíz en Firestore.</p>
                )}
              </div>
            ) : (
              filteredDocs.map((doc) => {
                const isActive = doc.id === selectedDocId;
                const fieldCount = Object.keys(doc.data || {}).length;
                return (
                  <button
                    key={doc.id}
                    onClick={() => setSelectedDocId(doc.id)}
                    className={`w-full text-left px-3 py-2.5 rounded text-xs transition-all duration-150 flex flex-col gap-1 cursor-pointer ${
                      isActive 
                        ? "bg-indigo-600 text-white shadow-sm font-semibold border-l-4 border-indigo-300" 
                        : "bg-transparent text-slate-300 hover:bg-slate-800/80 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="font-mono truncate flex-1 pr-2">{doc.id}</span>
                      <ArrowRight className={`w-3.5 h-3.5 shrink-0 ${isActive ? "text-white" : "text-slate-600"}`} />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-slate-500">
                      <span className={isActive ? "text-indigo-100" : "text-slate-500"}>
                        {fieldCount} {fieldCount === 1 ? "campo" : "campos"}
                      </span>
                      {doc.data["1"] !== undefined && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                          isActive 
                            ? "bg-indigo-900/40 text-indigo-200 border-indigo-500/50" 
                            : "bg-amber-950/20 text-amber-500 border-amber-900/30"
                        }`}>
                          Numeric Key
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="mt-auto p-3 border-t border-slate-850 bg-slate-950/30 shrink-0">
            <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-600" />
                WSL (Ubuntu Linux)
              </span>
              <span className="text-emerald-500 font-mono">Ready Node-SDK</span>
            </div>
          </div>
        </section>

        {/* B. RIGHT PANEL (INSPECTOR DE CAMPOS DE UN DOCUMENTO) */}
        <section className="flex-1 bg-slate-50 flex flex-col overflow-hidden">
          {activeDocument ? (
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* Document Sub-header */}
              <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
                <div>
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Current Document</h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <code className="text-sm font-mono text-indigo-600 font-bold">{activeDocument.id}</code>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-605 hidden md:inline-block font-medium">
                    Ruta: <span className="font-mono bg-slate-100 py-0.5 px-2 text-xs text-slate-655 rounded border border-slate-200">{collectionPath}/{activeDocument.id}</span>
                  </span>
                  <button 
                    onClick={() => {
                      // refresh selected document
                      loadDocuments(collectionPath, connectionMode, projectId);
                    }}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-semibold text-xs shadow-sm hover:bg-indigo-700 active:scale-95 transition-all text-center flex items-center gap-1.5 cursor-pointer"
                    title="Recargar documento"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Commit Changes / Refresh
                  </button>
                </div>
              </div>

              {/* Grid / List of Fields in Document */}
              <div className="flex-1 p-6 overflow-hidden flex flex-col gap-6">
                
                {/* Visual guideline box for users */}
                <div className="p-4 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-xs shrink-0">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0 mt-0.5">
                    <Info className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 mb-0.5">Instrucciones de edición</h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                      Para editar un campo, haga <strong className="text-slate-900 font-semibold">Doble Clic</strong> sobre el valor. Modifique su contenido y use el botón azul de <strong className="text-indigo-600 font-bold inline-flex items-center gap-0.5">Commit</strong> o presione <kbd className="bg-slate-100 border border-slate-200 px-1 py-0.5 text-[9px] rounded text-slate-700 font-mono">Enter</kbd> para actualizar Firestore. Las claves pueden ser numéricas.
                    </p>
                  </div>
                </div>

                {/* Table of current details */}
                <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-full overflow-hidden">
                  
                  <div className="grid grid-cols-12 bg-slate-50 border-b border-slate-200 px-4 py-2.5 text-[10px] uppercase font-bold text-slate-500 tracking-wider shrink-0">
                    <div className="col-span-4">Field Key</div>
                    <div className="col-span-6">Value (Double click to edit)</div>
                    <div className="col-span-2 text-right">Type</div>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {Object.keys(activeDocument.data || {}).map((key) => {
                      const originalValue = activeDocument.data[key];
                      const isNumericKey = !isNaN(Number(key));
                      const isUnderEditing = editingFieldKey === key;
                      const valueType = originalValue === null ? "null" : typeof originalValue;

                      return (
                        <div 
                          key={key} 
                          className={`grid grid-cols-12 px-4 py-3 items-center hover:bg-slate-50 transition-colors group ${
                            isUnderEditing ? "bg-indigo-50/20" : isNumericKey ? "bg-amber-50/15" : ""
                          }`}
                        >
                          {/* FIELD KEY */}
                          <div className="col-span-4 font-mono text-xs font-bold text-slate-700 flex items-center gap-1.5">
                            {isNumericKey ? `"${key}"` : key}
                            {isNumericKey && (
                              <span className="text-[9px] font-bold text-amber-70s bg-amber-50 border border-amber-200/60 px-1.5 py-0.2 rounded">
                                Numeric
                              </span>
                            )}
                          </div>

                          {/* VALUE EDITING */}
                          <div className="col-span-6">
                            {isUnderEditing ? (
                              <div className="flex items-center gap-2">
                                {editingType === "boolean" ? (
                                  <select
                                    className="bg-white border border-indigo-400 rounded-md px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-medium"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    autoFocus
                                  >
                                    <option value="true">true</option>
                                    <option value="false">false</option>
                                  </select>
                                ) : (
                                  <input
                                    type="text"
                                    value={editingValue}
                                    onChange={(e) => setEditingValue(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") handleCommitEdit(key);
                                      if (e.key === "Escape") setEditingFieldKey(null);
                                    }}
                                    className="flex-1 bg-white border border-indigo-400 rounded-md px-2.5 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-100 font-mono"
                                    autoFocus
                                  />
                                )}
                                
                                <select
                                  value={editingType}
                                  onChange={(e) => setEditingType(e.target.value as any)}
                                  className="bg-slate-100 border border-slate-205 rounded-md px-1.5 py-1 text-[10px] text-slate-622 focus:outline-none"
                                >
                                  <option value="string">string</option>
                                  <option value="number">number</option>
                                  <option value="boolean">boolean</option>
                                </select>

                                <button
                                  onClick={() => handleCommitEdit(key)}
                                  className="p-1 rounded bg-indigo-655 hover:bg-indigo-700 text-white cursor-pointer"
                                  title="Guardar cambios"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingFieldKey(null)}
                                  className="p-1 rounded bg-slate-100 border border-slate-200 text-slate-500 hover:text-slate-700 cursor-pointer"
                                  title="Cancelar"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div 
                                onDoubleClick={() => handleStartEditField(key, originalValue)}
                                className="py-1 cursor-default select-all flex items-center justify-between"
                                title="Doble clic para editar campo"
                              >
                                <span className="font-mono text-slate-655 text-xs overflow-x-auto whitespace-pre-wrap flex-1 leading-relaxed">
                                  {originalValue === null ? "null" : String(originalValue)}
                                </span>
                                <span className="opacity-0 group-hover:opacity-100 text-[10px] text-indigo-600 font-semibold cursor-pointer pl-2 select-none hover:underline">
                                  Doble clic para editar
                                </span>
                              </div>
                            )}
                          </div>

                          {/* TYPE BADGE */}
                          <div className="col-span-2 text-right">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              valueType === "number" ? "bg-amber-100 text-amber-705 border-amber-200" :
                              valueType === "boolean" ? "bg-purple-100 text-purple-705 border-purple-200" :
                              valueType === "object" ? "bg-indigo-100 text-indigo-705 border-indigo-200" :
                              "bg-blue-105 text-blue-700 border-blue-200"
                            }`}>
                              {valueType}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Footer of client container */}
                  <div className="border-t border-slate-200 p-4 bg-slate-50 flex items-center justify-between rounded-b-lg shrink-0">
                    {isAddingField ? (
                      <div className="w-full bg-white border border-slate-200 rounded-lg p-3.5 space-y-3.5 shadow-xs">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Plus className="w-4 h-4 text-indigo-600" />
                            Inyectar Nuevo Campo
                          </span>
                          <button 
                            onClick={() => setIsAddingField(false)}
                            className="text-slate-400 hover:text-slate-600 text-xs cursor-pointer flex items-center gap-0.5 font-medium"
                          >
                            <X className="w-3.5 h-3.5" /> Cancelar
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Nombre / Clave</label>
                            <input
                              type="text"
                              placeholder="Ej: 1 o id_sensor"
                              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                              value={newFieldKey}
                              onChange={(e) => setNewFieldKey(e.target.value)}
                            />
                          </div>
                          
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Tipo de Dato</label>
                            <select
                              className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-semibold"
                              value={newFieldType}
                              onChange={(e) => setNewFieldType(e.target.value as any)}
                            >
                              <option value="string">string</option>
                              <option value="number">number</option>
                              <option value="boolean">boolean</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold uppercase mb-1">Valor Inicial</label>
                            {newFieldType === "boolean" ? (
                              <select
                                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-semibold"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                              >
                                <option value="">Seleccione...</option>
                                <option value="true">true</option>
                                <option value="false">false</option>
                              </select>
                            ) : (
                              <input
                                type="text"
                                placeholder="Valor inicial"
                                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-mono"
                                value={newFieldValue}
                                onChange={(e) => setNewFieldValue(e.target.value)}
                              />
                            )}
                          </div>
                        </div>

                        <button
                          onClick={handleAddNewField}
                          className="bg-indigo-600 hover:bg-indigo-750 text-white font-bold text-xs px-4 py-2 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                        >
                          <Save className="w-3.5 h-3.5" />
                          Agregar Campo a Firestore
                        </button>
                      </div>
                    ) : (
                      <>
                        <button 
                          onClick={() => setIsAddingField(true)}
                          className="text-indigo-650 text-xs font-bold flex items-center gap-1 hover:underline cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          Add New Field
                        </button>
                        <span className="text-[10px] text-slate-400 font-medium italic">
                          Editing {activeDocument.id} — {Object.keys(activeDocument.data || {}).length} fields total
                        </span>
                      </>
                    )}
                  </div>

                </div>

              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-550 space-y-4 bg-slate-50">
              <div className="bg-white p-5 rounded-full border border-slate-204 shadow-sm">
                <Database className="w-10 h-10 text-indigo-600" />
              </div>
              <div className="max-w-md">
                <h3 className="text-md font-bold text-slate-800 mb-1">Ningún Documento Cargado</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">
                  Ingrese una colección válida en el panel izquierdo (Ej: <strong className="text-indigo-600 font-mono text-[11px]">movilform-39511.firebaseio.com</strong>) y presione consultar. O inicie el <strong className="text-amber-600">Modo Demo</strong> para interactuar de inmediato con datos de prueba.
                </p>
              </div>
            </div>
          )}
        </section>

      </main>

      {/* 3. FOOTER - BARRA DE NOTIFICACIONES */}
      <footer className="h-8 bg-indigo-700 text-white text-[10px] flex items-center px-4 justify-between select-none shrink-0 z-10 shadow-md">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="opacity-70 font-semibold uppercase tracking-wider text-[9px]">Project ID:</span>
            <span className="font-mono bg-indigo-800/40 px-1.5 py-0.5 rounded text-[11px] font-bold text-white">
              {projectId || "Not Connected"}
            </span>
          </div>
          <div className="h-3.5 w-px bg-indigo-500 opacity-30"></div>
          <div className="flex items-center gap-1.5">
            <span className="opacity-70">Region:</span>
            <span className="font-semibold text-indigo-100">us-central1</span>
          </div>
          <div className="h-3.5 w-px bg-indigo-500 opacity-30"></div>
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
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
            <span>Electron IPC Active</span>
          </div>
          <div className="opacity-70 hidden sm:block">
            UTF-8
          </div>
        </div>
      </footer>

    </div>
  );
}
