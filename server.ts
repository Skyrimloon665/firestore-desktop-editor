import express from "express";
import path from "path";
import admin from "firebase-admin";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// Track dynamic Firebase Admin App connections
let firestoreInstances: Record<string, admin.firestore.Firestore> = {};
let activeProjectId: string | null = null;

// API routes to perform real Firestore queries using firebase-admin
app.post("/api/connect", (req, res) => {
  try {
    const { serviceAccount } = req.body;
    if (!serviceAccount || !serviceAccount.project_id) {
      return res.status(400).json({ error: "Credenciales de Cuenta de Servicio inválidas o faltantes." });
    }

    const projectId = serviceAccount.project_id;
    
    // Check if app is already initialized, or initialize a unique instance
    if (!firestoreInstances[projectId]) {
      const appName = `app-${projectId}-${Date.now()}`;
      const fbApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
      }, appName);
      
      firestoreInstances[projectId] = fbApp.firestore();
    }

    activeProjectId = projectId;
    res.json({ success: true, projectId });
  } catch (err: any) {
    console.error("Error al conectar Firebase Admin:", err);
    res.status(500).json({ error: err.message || "Error al inicializar Firebase Admin." });
  }
});

app.post("/api/list-documents", async (req, res) => {
  try {
    const { collectionPath, projectId } = req.body;
    const targetProjectId = projectId || activeProjectId;

    if (!targetProjectId || !firestoreInstances[targetProjectId]) {
      return res.status(400).json({ error: "No hay una base de datos activa. Cargue sus credenciales primero." });
    }

    const db = firestoreInstances[targetProjectId];
    if (!collectionPath) {
      return res.status(400).json({ error: "Ruta de colección vacía." });
    }

    // Pass the collection string exactly as specified without regex modifications
    const snapshot = await db.collection(collectionPath).get();
    
    const documents = snapshot.docs.map(doc => {
      return {
        id: doc.id,
        data: doc.data()
      };
    });

    res.json({ success: true, documents });
  } catch (err: any) {
    console.error("Error en list-documents:", err);
    res.status(500).json({ error: err.message || "Error al listar documentos." });
  }
});

app.post("/api/update-field", async (req, res) => {
  try {
    const { collectionPath, docId, fieldKey, fieldValue, fieldType, projectId } = req.body;
    const targetProjectId = projectId || activeProjectId;

    if (!targetProjectId || !firestoreInstances[targetProjectId]) {
      return res.status(400).json({ error: "Base de datos inactiva o no inicializada." });
    }

    const db = firestoreInstances[targetProjectId];
    if (!collectionPath || !docId || fieldKey === undefined) {
      return res.status(400).json({ error: "Parámetros insuficientes para la actualización." });
    }

    // Convert value according to selected target type
    let parsedValue: any = fieldValue;
    if (fieldType === "number") {
      parsedValue = Number(fieldValue);
      if (isNaN(parsedValue)) {
        return res.status(400).json({ error: "El valor ingresado no es un número válido." });
      }
    } else if (fieldType === "boolean") {
      parsedValue = String(fieldValue).toLowerCase() === "true" || fieldValue === true;
    } else if (fieldType === "null") {
      parsedValue = null;
    } else if (fieldType === "object" || fieldType === "array") {
      try {
        parsedValue = typeof fieldValue === "string" ? JSON.parse(fieldValue) : fieldValue;
      } catch (e) {
        return res.status(400).json({ error: "Formato JSON de objeto/arreglo inválido." });
      }
    }

    const docRef = db.collection(collectionPath).doc(docId);
    
    // Commit the field update directly using dot/bracket notation
    await docRef.update({
      [fieldKey]: parsedValue
    });

    // Retrieve fresh documentation payload
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
