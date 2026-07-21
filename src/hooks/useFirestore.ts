import { useCallback } from "react";
import type { DocData, ConnectionMode, SimulatedDb } from "../services/types";
import { parseFieldValue } from "../utils/parseValue";
import * as api from "../services/api";

export function useFirestoreOperations(
  connectionMode: ConnectionMode,
  projectId: string,
  collectionPath: string,
  simulatedDb: SimulatedDb,
  setSimulatedDb: (db: SimulatedDb | ((prev: SimulatedDb) => SimulatedDb)) => void,
  showStatus: (text: string, type: "info" | "success" | "error") => void
) {
  const loadDocuments = useCallback(
    async (
      path: string,
      mode: ConnectionMode,
      targetProjId: string
    ): Promise<{
      documents: DocData[];
      selectedDocId: string | null;
    }> => {
      if (mode === "demo") {
        const docs = simulatedDb[path] || [];
        return {
          documents: docs,
          selectedDocId: docs.length > 0 ? docs[0].id : null,
        };
      }

      const res = await api.listDocuments(path, targetProjId);
      if (res.success && res.documents) {
        return {
          documents: res.documents,
          selectedDocId: res.documents.length > 0 ? res.documents[0].id : null,
        };
      }
      throw new Error(res.error || "Fallo al listar documentos");
    },
    [simulatedDb]
  );

  const updateField = useCallback(
    async (
      fieldKey: string,
      value: string,
      fieldType: "string" | "number" | "boolean",
      docId: string
    ): Promise<DocData | null> => {
      const parsedVal = parseFieldValue(value, fieldType);

      if (connectionMode === "demo") {
        const currentList = [...(simulatedDb[collectionPath] || [])];
        const idx = currentList.findIndex((d) => d.id === docId);
        if (idx === -1) return null;

        const updatedDoc = {
          ...currentList[idx],
          data: { ...currentList[idx].data, [fieldKey]: parsedVal },
        };
        currentList[idx] = updatedDoc;
        setSimulatedDb((prev) => ({ ...prev, [collectionPath]: currentList }));
        return updatedDoc;
      }

      const res = await api.updateField({
        collectionPath,
        docId,
        fieldKey,
        fieldValue: parsedVal,
        fieldType,
        projectId,
      });

      if (res.success && res.updatedFields) {
        return { id: docId, data: res.updatedFields };
      }
      if (res.error?.includes("NOT_FOUND")) {
        throw new Error(`El documento "${docId}" no existe en Firestore. Puede que haya sido eliminado. Refresque la vista.`);
      }
      throw new Error(res.error || "Fallo en update");
    },
    [connectionMode, collectionPath, projectId, simulatedDb, setSimulatedDb]
  );

  const addField = useCallback(
    async (
      newFieldKey: string,
      newFieldValue: string,
      newFieldType: "string" | "number" | "boolean",
      docId: string
    ): Promise<DocData | null> => {
      const parsedVal = parseFieldValue(newFieldValue, newFieldType);

      if (connectionMode === "demo") {
        const currentList = [...(simulatedDb[collectionPath] || [])];
        const idx = currentList.findIndex((d) => d.id === docId);
        if (idx === -1) return null;

        const updatedDoc = {
          ...currentList[idx],
          data: { ...currentList[idx].data, [newFieldKey]: parsedVal },
        };
        currentList[idx] = updatedDoc;
        setSimulatedDb((prev) => ({ ...prev, [collectionPath]: currentList }));
        return updatedDoc;
      }

      const res = await api.updateField({
        collectionPath,
        docId,
        fieldKey: newFieldKey,
        fieldValue: parsedVal,
        fieldType: newFieldType,
        projectId,
      });

      if (res.success && res.updatedFields) {
        return { id: docId, data: res.updatedFields };
      }
      if (res.error?.includes("NOT_FOUND")) {
        throw new Error(`El documento "${docId}" no existe en Firestore. Puede que haya sido eliminado. Refresque la vista.`);
      }
      throw new Error(res.error || "Fallo al agregar campo");
    },
    [connectionMode, collectionPath, projectId, simulatedDb, setSimulatedDb]
  );

  const createEmptyDocument = useCallback(
    async (newId: string): Promise<void> => {
      if (connectionMode === "demo") {
        const currentList = [...(simulatedDb[collectionPath] || [])];
        currentList.push({ id: newId, data: { nuevo_campo: "valor_inicial" } });
        setSimulatedDb((prev) => ({ ...prev, [collectionPath]: currentList }));
        return;
      }

      const res = await api.updateField({
        collectionPath,
        docId: newId,
        fieldKey: "_creado",
        fieldValue: true,
        fieldType: "boolean",
        projectId,
      });

      if (res.error?.includes("NOT_FOUND")) {
        throw new Error(`La colección o ruta no existe. Refresque la vista.`);
      }
      if (!res.success) {
        throw new Error(res.error || "Fallo al crear documento");
      }
    },
    [connectionMode, collectionPath, projectId, simulatedDb, setSimulatedDb]
  );

  return { loadDocuments, updateField, addField, createEmptyDocument };
}
