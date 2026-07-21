import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import admin from "firebase-admin";

let mainWindow: BrowserWindow | null = null;
let fbAppInstance: admin.app.App | null = null;
let db: admin.firestore.Firestore | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: "Firestore Desktop Editor",
    autoHideMenuBar: true,
  });

  // In development, load from Vite local server. In production, load the built index.html.
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

// ==========================================
// IPC HANDDELERS FOR SECURE FIREBASE ADMIN OPERATION
// ==========================================

// 1. SELECT SERVICE ACCOUNT FILE VIA NATIVE FILE DIALOG
ipcMain.handle("firebase:select-credentials-file", async () => {
  if (!mainWindow) return { success: false, error: "Ventana principal no disponible" };

  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      title: "Seleccionar Credenciales de Cuenta de Servicio (.json)",
      filters: [
        { name: "JSON Files", extensions: ["json"] }
      ],
      properties: ["openFile"]
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { success: false, cancelled: true };
    }

    const filePath = result.filePaths[0];
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const serviceAccount = JSON.parse(fileContent);

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      return { success: false, error: "El archivo JSON no contiene las claves de cuenta de servicio requeridas (project_id, private_key, client_email)." };
    }

    // Initialize Firebase Admin dynamically
    if (fbAppInstance) {
      await fbAppInstance.delete();
    }

    fbAppInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    }, `app-${serviceAccount.project_id}-${Date.now()}`);

    db = fbAppInstance.firestore();

    return { 
      success: true, 
      projectId: serviceAccount.project_id,
      fileName: path.basename(filePath)
    };
  } catch (err: any) {
    console.error("Error al cargar credenciales electrónicas:", err);
    return { success: false, error: err.message || "Error al procesar el archivo de credenciales." };
  }
});

// 2. CONNECT DIRECTLY WITH RAW CREDENTIALS OBJECT
ipcMain.handle("firebase:connect-with-credentials-json", async (_event, serviceAccountJsonString: string) => {
  try {
    const serviceAccount = JSON.parse(serviceAccountJsonString);
    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      return { success: false, error: "El JSON ingresado no contiene los campos requeridos." };
    }

    if (fbAppInstance) {
      await fbAppInstance.delete();
    }

    fbAppInstance = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    }, `app-${serviceAccount.project_id}-${Date.now()}`);

    db = fbAppInstance.firestore();

    return { 
      success: true, 
      projectId: serviceAccount.project_id 
    };
  } catch (err: any) {
    console.error("Error en conexión por JSON crudo:", err);
    return { success: false, error: err.message || "Error al deserializar o inicializar Firebase Admin." };
  }
});

// 3. GET LIST OF DOCUMENTS WITHIN EXACT COLLECTION PATH (No front-end regex parsing, exact string transfer)
ipcMain.handle("firebase:list-documents", async (_event, collectionPath: string) => {
  if (!db) {
    return { success: false, error: "No hay una base de datos activa. Conecte sus credenciales primero." };
  }
  if (!collectionPath) {
    return { success: false, error: "La ruta de la colección no puede estar vacía." };
  }

  try {
    // Access collection directly utilizing original unmodified string paths (eg: 'movilform-39511.firebaseio.com')
    const snapshot = await db.collection(collectionPath).get();
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));

    return { success: true, documents };
  } catch (err: any) {
    console.error("Error al listar documentos de Firestore:", err);
    return { success: false, error: err.message || "Fallo al consultar la colección en Firestore." };
  }
});

// 4. UPDATE INDIVIDUAL RECORD FIELD (Using documentRef.update and native dot/bracket representation)
ipcMain.handle("firebase:update-field", async (_event, { collectionPath, docId, fieldKey, fieldValue, fieldType }) => {
  if (!db) {
    return { success: false, error: "Base de datos inactiva." };
  }
  if (!collectionPath || !docId || fieldKey === undefined) {
    return { success: false, error: "Parámetros insuficientes para la actualización." };
  }

  try {
    // Direct casting of target JavaScript primitives
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

    const docRef = db.collection(collectionPath).doc(docId);
    
    // Commit the field update directly using bracket notation
    await docRef.update({
      [fieldKey]: parsedValue
    });

    // Retrieve fresh documentation values
    const updatedSnap = await docRef.get();
    const updatedFields = updatedSnap.exists ? updatedSnap.data() : null;

    return { success: true, updatedFields };
  } catch (err: any) {
    console.error("Error al actualizar campo en Firestore:", err);
    return { success: false, error: err.message || "Error al realizar el commit de actualización en Firestore." };
  }
});
