import electron from "electron";
const { app, BrowserWindow, ipcMain, dialog } = electron;
type BrowserWindowType = electron.BrowserWindow;
import * as path from "path";
import * as fs from "fs";
import admin from "firebase-admin";

let mainWindow: BrowserWindowType | null = null;
let fbAppInstance: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;

async function cleanupFirebase() {
  if (fbAppInstance) {
    try {
      await fbAppInstance.delete();
    } catch {
      // ignore cleanup errors
    }
    fbAppInstance = null;
    db = null;
  }
}

const configPath = path.join(app.getPath("userData"), "app-config.json");

function readConfig(): Record<string, any> {
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf-8"));
  } catch { return {}; }
}

function writeConfig(data: Record<string, any>) {
  const dir = path.dirname(configPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(configPath, JSON.stringify(data, null, 2));
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Firestore Desktop Editor",
    autoHideMenuBar: true,
  });

  const isDev = !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL("http://localhost:3000");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("before-quit", async () => {
  await cleanupFirebase();
});

process.on("unhandledRejection", (reason) => {
  console.error("Unhandled rejection in Electron main:", reason);
});

// ==========================================
// IPC HANDDELERS FOR SECURE FIREBASE ADMIN OPERATION
// ==========================================

// 1. SELECT SERVICE ACCOUNT FILE VIA NATIVE FILE DIALOG
function normalizePrivateKey(key: string): string {
  let normalized = key;
  if (normalized.includes("\\n")) {
    normalized = normalized.replace(/\\n/g, "\n");
  }
  const beginMarker = "-----BEGIN PRIVATE KEY-----";
  const endMarker = "-----END PRIVATE KEY-----";
  if (!normalized.includes("\n")) {
    const start = normalized.indexOf(beginMarker);
    const end = normalized.indexOf(endMarker);
    if (start !== -1 && end !== -1) {
      const header = normalized.slice(0, start + beginMarker.length);
      const body = normalized.slice(start + beginMarker.length, end);
      const footer = normalized.slice(end);
      const bodyLines: string[] = [];
      for (let i = 0; i < body.length; i += 64) {
        bodyLines.push(body.slice(i, i + 64));
      }
      normalized = header + "\n" + bodyLines.join("\n") + "\n" + footer;
    }
  }
  return normalized;
}

function toCert(serviceAccount: Record<string, any>) {
  return {
    projectId: serviceAccount.project_id,
    clientEmail: serviceAccount.client_email,
    privateKey: normalizePrivateKey(serviceAccount.private_key),
  };
}

async function initFirebaseFromAccount(serviceAccount: Record<string, any>) {
  if (fbAppInstance) {
    await fbAppInstance.delete();
  }
  fbAppInstance = admin.initializeApp(
    { credential: admin.credential.cert(toCert(serviceAccount)) },
    `app-${serviceAccount.project_id}-${Date.now()}`
  );
  db = fbAppInstance.firestore();
}

function validateServiceAccount(sa: Record<string, any>): string | null {
  if (!sa.project_id || !sa.private_key || !sa.client_email) {
    return "El JSON no contiene los campos requeridos (project_id, private_key, client_email).";
  }
  try {
    JSON.stringify(sa);
  } catch {
    return "El JSON no es válido.";
  }
  return null;
}

ipcMain.handle("firebase:select-credentials-file", async () => {
  if (!mainWindow) return { success: false, error: "Ventana principal no disponible" };

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Seleccionar Credenciales de Cuenta de Servicio (.json)",
      filters: [{ name: "JSON Files", extensions: ["json"] }],
      properties: ["openFile"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true };
    }

    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const serviceAccount = JSON.parse(fileContent);

    const validationError = validateServiceAccount(serviceAccount);
    if (validationError) return { success: false, error: validationError };

    await initFirebaseFromAccount(serviceAccount);

    writeConfig({
      type: "file",
      path: filePath,
      projectId: serviceAccount.project_id,
      fileName: path.basename(filePath),
    });

    return {
      success: true,
      projectId: serviceAccount.project_id,
      fileName: path.basename(filePath),
    };
  } catch (err: any) {
    console.error("Error al cargar credenciales:", err);
    return { success: false, error: err.message || "Error al procesar el archivo de credenciales." };
  }
});

ipcMain.handle("firebase:connect-with-credentials-json", async (_event, serviceAccountJsonString: string) => {
  try {
    const serviceAccount = JSON.parse(serviceAccountJsonString);
    const validationError = validateServiceAccount(serviceAccount);
    if (validationError) return { success: false, error: validationError };

    await initFirebaseFromAccount(serviceAccount);

    const jsonPath = path.join(app.getPath("userData"), "credentials.json");
    const dir = path.dirname(jsonPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(jsonPath, JSON.stringify(serviceAccount, null, 2));

    writeConfig({
      type: "json",
      path: jsonPath,
      projectId: serviceAccount.project_id,
      fileName: "credentials.json",
    });

    return { success: true, projectId: serviceAccount.project_id };
  } catch (err: any) {
    console.error("Error en conexión por JSON crudo:", err);
    return { success: false, error: err.message || "Error al deserializar o inicializar Firebase Admin." };
  }
});

// 2.5. STORED CREDENTIALS
ipcMain.handle("firebase:get-stored-credentials", async () => {
  const cfg = readConfig();
  if (!cfg.path) return { hasStored: false };

  try {
    if (!fs.existsSync(cfg.path)) {
      writeConfig({});
      return { hasStored: false };
    }
    const fileContent = fs.readFileSync(cfg.path, "utf-8");
    const serviceAccount = JSON.parse(fileContent);
    await initFirebaseFromAccount(serviceAccount);
    return {
      hasStored: true,
      projectId: cfg.projectId,
      fileName: cfg.fileName,
      type: cfg.type,
    };
  } catch {
    writeConfig({});
    return { hasStored: false };
  }
});

ipcMain.handle("firebase:clear-stored-credentials", async () => {
  writeConfig({});
  return { success: true };
});

// 2.6. LIST ROOT-LEVEL COLLECTIONS
ipcMain.handle("firebase:list-root-collections", async () => {
  if (!db) {
    return { success: false, error: "No hay una base de datos activa. Conecte sus credenciales primero." };
  }
  try {
    const collections = await (db as any).listCollections();
    const documents = collections.map((col: any) => ({
      id: col.id + "/",
      data: { __subcollection: true },
    }));
    return { success: true, documents };
  } catch (err: any) {
    console.error("Error al listar colecciones raíz:", err);
    return { success: false, error: err.message || "Error al listar colecciones raíz." };
  }
});

// 3. LIST DOCUMENTS / SUBCOLLECTIONS
function parsePath(path: string): { segments: string[]; isCollection: boolean } {
  const segments = path.split("/").filter(Boolean);
  return { segments, isCollection: segments.length % 2 === 1 };
}

ipcMain.handle("firebase:list-documents", async (_event, collectionPath: string) => {
  if (!db) {
    return { success: false, error: "No hay una base de datos activa. Conecte sus credenciales primero." };
  }
  if (!collectionPath) {
    return { success: false, error: "La ruta de la colección no puede estar vacía." };
  }

  try {
    const { segments, isCollection } = parsePath(collectionPath);

    if (!isCollection) {
      const collections = await db.doc(collectionPath).listCollections();
      const documents = collections.map((col) => ({
        id: col.id + "/",
        data: { __subcollection: true },
      }));
      return { success: true, documents };
    }

    const snapshot = await db.collection(collectionPath).get();
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    return { success: true, documents };
  } catch (err: any) {
    console.error("Error al listar documentos de Firestore:", err);
    const msg = err.message?.includes("odd number")
      ? `La ruta "${collectionPath}" tiene ${collectionPath.split("/").filter(Boolean).length} segmentos (par). Las rutas de colección deben tener un número impar de segmentos. Ej: "movilform-39511.firebaseio.com" (1) o "movilform-39511.firebaseio.com/docId/subcol" (3)`
      : err.message || "Fallo al consultar la colección en Firestore.";
    return { success: false, error: msg };
  }
});

// 4. UPDATE FIELD
function docRefFromPath(collectionPath: string, docId: string) {
  const segments = collectionPath.split("/").filter(Boolean);
  if (segments.length % 2 === 0) {
    return db!.doc(collectionPath);
  }
  return db!.collection(collectionPath).doc(docId);
}

ipcMain.handle("firebase:update-field", async (_event, { collectionPath, docId, fieldKey, fieldValue, fieldType }) => {
  if (!db) {
    return { success: false, error: "Base de datos inactiva." };
  }
  if (!collectionPath || !docId || fieldKey === undefined) {
    return { success: false, error: "Parámetros insuficientes para la actualización." };
  }

  try {
    let parsedValue: any = fieldValue;
    if (fieldType === "number") {
      parsedValue = Number(fieldValue);
      if (isNaN(parsedValue)) {
        return { success: false, error: "El valor no es un número válido." };
      }
    } else if (fieldType === "boolean") {
      parsedValue = String(fieldValue).toLowerCase() === "true" || fieldValue === true;
    } else if (fieldType === "null") {
      parsedValue = null;
    } else if (fieldType === "object" || fieldType === "array") {
      try {
        parsedValue = typeof fieldValue === "string" ? JSON.parse(fieldValue) : fieldValue;
      } catch (e) {
        return { success: false, error: "Formato de objeto/arreglo JSON inválido." };
      }
    }

    const docRef = docRefFromPath(collectionPath, docId);
    await docRef.update({ [fieldKey]: parsedValue });

    const updatedSnap = await docRef.get();
    const updatedFields = updatedSnap.exists ? updatedSnap.data() : null;

    return { success: true, updatedFields };
  } catch (err: any) {
    console.error("Error al actualizar campo en Firestore:", err);
    return { success: false, error: err.message || "Error al realizar el commit de actualización en Firestore." };
  }
});
