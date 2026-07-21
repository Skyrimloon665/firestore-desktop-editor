import express from "express";
import path from "path";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "1mb" }));

const firestoreInstances: Map<string, admin.firestore.Firestore> = new Map();

function getDb(projectId?: string): { db: admin.firestore.Firestore; pid: string } | null {
  if (projectId && firestoreInstances.has(projectId)) {
    return { db: firestoreInstances.get(projectId)!, pid: projectId };
  }
  return null;
}

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

function initDb(serviceAccount: Record<string, any>): admin.firestore.Firestore {
  const projectId = serviceAccount.project_id;
  const existing = firestoreInstances.get(projectId);
  if (existing) return existing;

  const appName = `app-${projectId}-${Date.now()}`;
  const fbApp = admin.initializeApp(
    { credential: admin.credential.cert(toCert(serviceAccount)) },
    appName
  );
  const db = fbApp.firestore();
  firestoreInstances.set(projectId, db);
  return db;
}

app.post("/api/connect", (req, res) => {
  try {
    const { serviceAccount } = req.body;
    if (!serviceAccount?.project_id) {
      return res.status(400).json({ error: "Credenciales de Cuenta de Servicio inválidas o faltantes." });
    }

    initDb(serviceAccount);
    res.json({ success: true, projectId: serviceAccount.project_id });
  } catch (err: any) {
    console.error("Error al conectar Firebase Admin:", err);
    res.status(500).json({ error: err.message || "Error al inicializar Firebase Admin." });
  }
});

function parseFieldValue(fieldValue: any, fieldType: string): any {
  if (fieldType === "number") {
    const n = Number(fieldValue);
    if (isNaN(n)) throw new Error("El valor ingresado no es un número válido.");
    return n;
  }
  if (fieldType === "boolean") return String(fieldValue).toLowerCase() === "true" || fieldValue === true;
  if (fieldType === "null") return null;
  if (fieldType === "object" || fieldType === "array") {
    try {
      return typeof fieldValue === "string" ? JSON.parse(fieldValue) : fieldValue;
    } catch {
      throw new Error("Formato JSON de objeto/arreglo inválido.");
    }
  }
  return fieldValue;
}

app.post("/api/list-root-collections", async (req, res) => {
  const { projectId } = req.body;
  try {
    const instance = getDb(projectId);
    if (!instance) {
      return res.status(400).json({ error: "No hay una base de datos activa. Cargue sus credenciales primero." });
    }
    const collections = await (instance.db as any).listCollections();
    const documents = collections.map((col: any) => ({
      id: col.id + "/",
      data: { __subcollection: true },
    }));
    res.json({ success: true, documents });
  } catch (err: any) {
    console.error("Error en list-root-collections:", err);
    res.status(500).json({ error: err.message || "Error al listar colecciones raíz." });
  }
});

app.post("/api/list-documents", async (req, res) => {
  const { collectionPath, projectId } = req.body;
  try {
    const instance = getDb(projectId);

    if (!instance) {
      return res.status(400).json({ error: "No hay una base de datos activa. Cargue sus credenciales primero." });
    }
    if (!collectionPath) {
      return res.status(400).json({ error: "Ruta de colección vacía." });
    }

    const segments = collectionPath.split("/").filter(Boolean);
    const isCollection = segments.length % 2 === 1;

    if (!isCollection) {
      const collections = await instance.db.doc(collectionPath).listCollections();
      const documents = collections.map((col) => ({
        id: col.id + "/",
        data: { __subcollection: true },
      }));
      return res.json({ success: true, documents });
    }

    const snapshot = await instance.db.collection(collectionPath).get();
    const documents = snapshot.docs.map((doc) => ({
      id: doc.id,
      data: doc.data(),
    }));

    res.json({ success: true, documents });
  } catch (err: any) {
    console.error("Error en list-documents:", err);
    const msg = err.message?.includes("odd number")
      ? `La ruta "${collectionPath}" tiene ${collectionPath.split("/").filter(Boolean).length} segmentos (par). Las rutas de colección deben tener un número impar de segmentos. Ej: "movilform-39511.firebaseio.com" (1) o "movilform-39511.firebaseio.com/docId/subcol" (3)`
      : err.message || "Error al listar documentos.";
    res.status(500).json({ error: msg });
  }
});

app.post("/api/update-field", async (req, res) => {
  try {
    const { collectionPath, docId, fieldKey, fieldValue, fieldType, projectId } = req.body;
    const instance = getDb(projectId);

    if (!instance) {
      return res.status(400).json({ error: "Base de datos inactiva o no inicializada." });
    }
    if (!collectionPath || !docId || fieldKey === undefined) {
      return res.status(400).json({ error: "Parámetros insuficientes para la actualización." });
    }

    const parsedValue = parseFieldValue(fieldValue, fieldType);
    const segments = collectionPath.split("/").filter(Boolean);
    const docRef = segments.length % 2 === 0
      ? instance.db.doc(collectionPath)
      : instance.db.collection(collectionPath).doc(docId);

    await docRef.update({ [fieldKey]: parsedValue });

    const updatedSnap = await docRef.get();
    const updatedFields = updatedSnap.exists ? updatedSnap.data() : null;

    res.json({ success: true, updatedFields });
  } catch (err: any) {
    console.error("Error al actualizar campo:", err);
    res.status(500).json({ error: err.message || "Error al actualizar el campo." });
  }
});

// Configure Vite middleware in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Firestore Editor Server] corriendo en el puerto ${PORT}`);
  });
}

startServer();
