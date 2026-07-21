import { useState, useRef } from "react";
import { ConnectionHeader } from "./components/ConnectionHeader";
import { JsonPasteDialog } from "./components/JsonPasteDialog";
import { DocumentListPanel } from "./components/DocumentListPanel";
import { FieldInspector } from "./components/FieldInspector";
import { StatusBar } from "./components/StatusBar";
import { useStatusMessage } from "./hooks/useStatusMessage";
import { useFirestoreOperations } from "./hooks/useFirestore";
import { useTheme } from "./hooks/useTheme";
import { selectCredentialsFile, connectWithCredentialsJson } from "./services/api";
import type { ConnectionMode, DocData, SimulatedDb } from "./services/types";

const MOCK_PROJECT_ID = "demo-project";
const MOCK_COLLECTION = "demo-collection";
const INITIAL_MOCK_DOCUMENTS: DocData[] = [
  {
    id: "doc_sensor_01",
    data: {
      active: true,
      interval_seconds: 15,
      location: "Planta Industrial Norte - Silo A",
      status_code: 200,
      "1": "988",
    },
  },
  {
    id: "doc_config_global",
    data: {
      maintenance_mode: false,
      support_phone: "+541155554321",
      api_endpoint: "https://api.movilform.com/v1",
      max_retries: 5,
    },
  },
  {
    id: "doc_user_test",
    data: {
      name: "Juan Pérez",
      email: "juan.perez@test.com",
      role: "contributor_tier2",
      verified: true,
      quota_bytes: 1048576,
    },
  },
];

export default function App() {
  const isElectron = !!window.electron;
  const { statusMessage, showStatus } = useStatusMessage();
  const { theme, setTheme } = useTheme();

  const [projectId, setProjectId] = useState("");
  const [connectionMode, setConnectionMode] = useState<ConnectionMode>("none");
  const [credentialsName, setCredentialsName] = useState("");
  const [jsonPasteOpen, setJsonPasteOpen] = useState(false);
  const [rawJsonText, setRawJsonText] = useState("");

  const [collectionPath, setCollectionPath] = useState("");
  const [rootCollections, setRootCollections] = useState<DocData[]>([]);
  const [documents, setDocuments] = useState<DocData[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [searchFilter, setSearchFilter] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [editingFieldKey, setEditingFieldKey] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");
  const [editingType, setEditingType] = useState<"string" | "number" | "boolean">("string");
  const originalValueRef = useRef<string>("");

  const [newFieldKey, setNewFieldKey] = useState("");
  const [newFieldValue, setNewFieldValue] = useState("");
  const [newFieldType, setNewFieldType] = useState<"string" | "number" | "boolean">("string");
  const [isAddingField, setIsAddingField] = useState(false);

  const [simulatedDb, setSimulatedDb] = useState<SimulatedDb>({
    [MOCK_COLLECTION]: INITIAL_MOCK_DOCUMENTS,
  });

  const firestoreOps = useFirestoreOperations(
    connectionMode,
    projectId,
    collectionPath,
    simulatedDb,
    setSimulatedDb,
    showStatus
  );

  const loadDocumentsIntoState = async (path: string, mode: ConnectionMode, targetProjId: string) => {
    setIsLoading(true);
    try {
      const result = await firestoreOps.loadDocuments(path, mode, targetProjId);
      setDocuments(result.documents);
      const prevId = selectedDocId;
      const stillExists = result.documents.some((d) => d.id === prevId);
      setSelectedDocId(stillExists ? prevId : result.selectedDocId);
      const count = result.documents.length;
      const msg =
        mode === "demo"
          ? count > 0
            ? "Búsqueda exitosa en base de datos de simulación."
            : `Colección demo ${path} cargada vacía. Puede agregar campos.`
          : `Cargados ${count} documentos desde Firestore`;
      showStatus(msg, "success");
    } catch (err: any) {
      showStatus(`Error al cargar documentos: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCredentialsFile = async () => {
    setIsLoading(true);
    try {
      const res = await selectCredentialsFile();
      if (res.success && res.projectId) {
        setProjectId(res.projectId);
        setCredentialsName(res.fileName || "credentials.json");
        setConnectionMode("cloud");
        setCollectionPath("");
        const rootResult = await firestoreOps.loadRootCollections(res.projectId);
        setRootCollections(rootResult.documents || []);
        setDocuments([]);
        setSelectedDocId(null);
        showStatus(`Conectado a ${res.projectId} — ${rootResult.documents?.length || 0} colecciones`, "success");
      } else if (res.error) {
        showStatus(res.error, "error");
      }
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
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
      const res = await connectWithCredentialsJson(parsed);
      if (res.success && res.projectId) {
        setProjectId(res.projectId);
        setCredentialsName(isElectron ? "JSON Pegado" : "Cuenta de Servicio");
        setConnectionMode("cloud");
        setJsonPasteOpen(false);
        setCollectionPath("");
        const rootResult = await firestoreOps.loadRootCollections(res.projectId);
        setRootCollections(rootResult.documents || []);
        setDocuments([]);
        setSelectedDocId(null);
        showStatus(`Conectado a ${res.projectId} — ${rootResult.documents?.length || 0} colecciones`, "success");
      } else {
        showStatus(res.error || "Fallo en conexión", "error");
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
    setCollectionPath(MOCK_COLLECTION);
    setRootCollections([]);
    showStatus("Modo Demo local activado. Base de datos precargada.", "success");
    const mockDocs = simulatedDb[MOCK_COLLECTION] || INITIAL_MOCK_DOCUMENTS;
    setDocuments(mockDocs);
    setSelectedDocId(mockDocs.length > 0 ? mockDocs[0].id : null);
  };

  const handleFetchDocuments = async (path?: string) => {
    if (connectionMode === "none") {
      showStatus("Por favor conéctese a una base de datos o use el Modo Demo primero.", "error");
      return;
    }
    const targetPath = typeof path === "string" ? path : collectionPath;
    if (!targetPath) return;
    loadDocumentsIntoState(targetPath, connectionMode, projectId);
  };

  const handleStartEditField = (key: string, value: any) => {
    const str = typeof value === "object" ? JSON.stringify(value) : String(value);
    originalValueRef.current = str;
    setEditingFieldKey(key);
    setEditingValue(str);
    setEditingType(
      typeof value === "number" ? "number" : typeof value === "boolean" ? "boolean" : "string"
    );
  };

  const handleCommitEdit = async (fieldKey: string) => {
    if (!selectedDocId) return;
    setIsLoading(true);
    try {
      const updatedDoc = await firestoreOps.updateField(fieldKey, editingValue, editingType, selectedDocId);
      if (updatedDoc) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === selectedDocId ? updatedDoc : d))
        );
        showStatus(`Campo "${fieldKey}" actualizado exitosamente`, "success");
      }
      setEditingFieldKey(null);
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

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
    try {
      const updatedDoc = await firestoreOps.addField(newFieldKey, newFieldValue, newFieldType, selectedDocId);
      if (updatedDoc) {
        setDocuments((prev) =>
          prev.map((d) => (d.id === selectedDocId ? updatedDoc : d))
        );
        showStatus(`Campo "${newFieldKey}" agregado correctamente`, "success");
      }
      setNewFieldKey("");
      setNewFieldValue("");
      setIsAddingField(false);
    } catch (err: any) {
      showStatus(`Error: ${err.message}`, "error");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateEmptyDocument = () => {
    if (connectionMode === "none") {
      showStatus("Conecte el entorno primero.", "error");
      return;
    }
    if (!collectionPath) {
      showStatus("Seleccione una colección primero.", "error");
      return;
    }
    const newId = prompt("Ingrese ID del nuevo documento:");
    if (!newId) return;

    if (documents.some((d) => d.id === newId)) {
      showStatus("Ese ID ya existe en esta colección.", "error");
      return;
    }

    const doCreate = async () => {
      setIsLoading(true);
      try {
        await firestoreOps.createEmptyDocument(newId);
        await loadDocumentsIntoState(collectionPath, connectionMode, projectId);
        setSelectedDocId(newId);
        showStatus(`Documento '${newId}' creado`, "success");
      } catch (err: any) {
        showStatus(err.message, "error");
      } finally {
        setIsLoading(false);
      }
    };
    doCreate();
  };

  const handleDisconnect = () => {
    setConnectionMode("none");
    setProjectId("");
    setRootCollections([]);
    setDocuments([]);
    setSelectedDocId(null);
    showStatus("Desconectado de la base de datos", "info");
  };

  const activeDocument = documents.find((d) => d.id === selectedDocId);
  const filteredDocs = documents.filter((d) =>
    d.id.toLowerCase().includes(searchFilter.toLowerCase())
  );

  return (
    <div className="h-screen w-screen bg-[#F8FAFC] dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans flex flex-col overflow-hidden antialiased selection:bg-indigo-600 selection:text-white relative">
      <ConnectionHeader
        connectionMode={connectionMode}
        projectId={projectId}
        credentialsName={credentialsName}
        collectionPath={collectionPath}
        isLoading={isLoading}
        isElectron={isElectron}
        theme={theme}
        onThemeChange={setTheme}
        onSelectFile={handleSelectCredentialsFile}
        onOpenJsonPaste={() => setJsonPasteOpen(true)}
        onActivateDemo={handleActivateDemoMode}
        onDisconnect={handleDisconnect}
        onCollectionPathChange={setCollectionPath}
      />

      <JsonPasteDialog
        isOpen={jsonPasteOpen}
        isLoading={isLoading}
        rawJsonText={rawJsonText}
        onClose={() => setJsonPasteOpen(false)}
        onChange={setRawJsonText}
        onSubmit={handleConnectWithJsonText}
      />

      <main className="flex-1 flex overflow-hidden">
        <DocumentListPanel
          connectionMode={connectionMode}
          collectionPath={collectionPath}
          rootCollections={rootCollections}
          searchFilter={searchFilter}
          documents={documents}
          filteredDocs={filteredDocs}
          selectedDocId={selectedDocId}
          isLoading={isLoading}
          onCollectionPathChange={setCollectionPath}
          onFetchDocuments={handleFetchDocuments}
          onSearchFilterChange={setSearchFilter}
          onSelectDocument={setSelectedDocId}
          onCreateDocument={handleCreateEmptyDocument}
          onRefreshRootCollections={async () => {
            if (connectionMode === "cloud" && projectId) {
              const rootResult = await firestoreOps.loadRootCollections(projectId);
              setRootCollections(rootResult.documents || []);
            }
          }}
        />

        <FieldInspector
          activeDocument={activeDocument}
          documents={documents}
          collectionPath={collectionPath}
          connectionMode={connectionMode}
          projectId={projectId}
          isLoading={isLoading}
          editingFieldKey={editingFieldKey}
          editingValue={editingValue}
          editingType={editingType}
          hasPendingChanges={editingValue !== originalValueRef.current}
          isAddingField={isAddingField}
          newFieldKey={newFieldKey}
          newFieldValue={newFieldValue}
          newFieldType={newFieldType}
          onRefresh={() =>
            loadDocumentsIntoState(collectionPath, connectionMode, projectId)
          }
          onStartEdit={handleStartEditField}
          onEditingValueChange={setEditingValue}
          onEditingTypeChange={setEditingType}
          onCommitEdit={handleCommitEdit}
          onCancelEdit={() => setEditingFieldKey(null)}
          onToggleAddField={() => setIsAddingField((v) => !v)}
          onNewFieldKeyChange={setNewFieldKey}
          onNewFieldValueChange={setNewFieldValue}
          onNewFieldTypeChange={setNewFieldType}
          onAddNewField={handleAddNewField}
        />
      </main>

      {isLoading && (
        <div className="absolute inset-0 bg-black/20 dark:bg-black/40 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 flex flex-col items-center gap-3 border border-slate-200 dark:border-slate-700">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
              Cargando...
            </p>
          </div>
        </div>
      )}

      <StatusBar
        projectId={projectId}
        statusMessage={statusMessage}
        isElectron={isElectron}
      />
    </div>
  );
}
