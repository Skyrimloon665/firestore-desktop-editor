import type { DocData, ElectronAPI } from "./types";

declare global {
  interface Window {
    electron?: ElectronAPI;
  }
}

const isElectron = !!window.electron;

async function electronOrFetch<T>(
  electronAction: () => Promise<T>,
  fetchUrl: string,
  fetchBody?: Record<string, any>
): Promise<T> {
  if (isElectron && window.electron) {
    return electronAction();
  }
  const res = await fetch(fetchUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: fetchBody ? JSON.stringify(fetchBody) : undefined,
  });
  return res.json();
}

export async function selectCredentialsFile() {
  if (isElectron && window.electron) {
    return window.electron.selectCredentialsFile();
  }
  return { success: false, error: "Acceso a sistema local no disponible." };
}

export async function connectWithCredentialsJson(serviceAccount: Record<string, any>) {
  return electronOrFetch(
    () =>
      window.electron!.connectWithCredentialsJson(JSON.stringify(serviceAccount)),
    "/api/connect",
    { serviceAccount }
  );
}

export async function listDocuments(
  collectionPath: string,
  projectId: string
): Promise<{ success: boolean; documents?: DocData[]; error?: string }> {
  return electronOrFetch(
    () => window.electron!.listDocuments(collectionPath),
    "/api/list-documents",
    { collectionPath, projectId }
  );
}

export async function listRootCollections(
  projectId: string
): Promise<{ success: boolean; documents?: DocData[]; error?: string }> {
  return electronOrFetch(
    () => window.electron!.listRootCollections(),
    "/api/list-root-collections",
    { projectId }
  );
}

export async function updateField(data: {
  collectionPath: string;
  docId: string;
  fieldKey: string;
  fieldValue: any;
  fieldType: string;
  projectId?: string;
}): Promise<{ success: boolean; updatedFields?: Record<string, any>; error?: string }> {
  const { projectId, ...rest } = data;
  return electronOrFetch(
    () => window.electron!.updateField(rest),
    "/api/update-field",
    data
  );
}
