import type { Dispatch, SetStateAction } from "react";

export interface DocData {
  id: string;
  data: Record<string, any>;
}

export interface StatusMessage {
  text: string;
  type: "info" | "success" | "error";
}

export type ConnectionMode = "none" | "demo" | "cloud";
export type ThemeMode = "light" | "dark";

export interface FieldEditState {
  editingFieldKey: string | null;
  editingValue: string;
  editingType: "string" | "number" | "boolean";
}

export interface NewFieldState {
  newFieldKey: string;
  newFieldValue: string;
  newFieldType: "string" | "number" | "boolean";
  isAddingField: boolean;
}

export interface ElectronAPI {
  isElectron: boolean;
  selectCredentialsFile: () => Promise<{
    success: boolean;
    cancelled?: boolean;
    projectId?: string;
    fileName?: string;
    error?: string;
  }>;
  connectWithCredentialsJson: (json: string) => Promise<{
    success: boolean;
    projectId?: string;
    error?: string;
  }>;
  listDocuments: (
    path: string
  ) => Promise<{
    success: boolean;
    documents?: DocData[];
    error?: string;
  }>;
  updateField: (data: {
    collectionPath: string;
    docId: string;
    fieldKey: string;
    fieldValue: any;
    fieldType: string;
  }) => Promise<{
    success: boolean;
    updatedFields?: Record<string, any>;
    error?: string;
  }>;
}

export type SimulatedDb = Record<string, DocData[]>;
