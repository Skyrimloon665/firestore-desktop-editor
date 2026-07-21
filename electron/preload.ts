import { contextBridge, ipcRenderer } from "electron";

// Safely expose Electron APIs to our React application
contextBridge.exposeInMainWorld("electron", {
  isElectron: true,
  
  selectCredentialsFile: () => 
    ipcRenderer.invoke("firebase:select-credentials-file"),

  connectWithCredentialsJson: (jsonString: string) => 
    ipcRenderer.invoke("firebase:connect-with-credentials-json", jsonString),

  listDocuments: (collectionPath: string) => 
    ipcRenderer.invoke("firebase:list-documents", collectionPath),

  listRootCollections: () =>
    ipcRenderer.invoke("firebase:list-root-collections"),
  updateField: (data: { 
    collectionPath: string; 
    docId: string; 
    fieldKey: string; 
    fieldValue: any; 
    fieldType: string; 
  }) => ipcRenderer.invoke("firebase:update-field", data)
});
