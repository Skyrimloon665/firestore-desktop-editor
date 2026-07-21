# Firestore Desktop Editor

Aplicación de escritorio para navegar y editar documentos de Google Cloud Firestore en tiempo real, usando credenciales de cuenta de servicio.

## Prerrequisitos

- Node.js >= 18
- [pnpm](https://pnpm.io/installation) (`npm install -g pnpm`)

## Primeros pasos

```bash
pnpm install
pnpm electron:dev      # App de escritorio (Electron)
```

Esto compila el código de Electron, inicia el servidor de desarrollo y abre la ventana de la aplicación automáticamente.

## Modos de ejecución

| Comando | Descripción |
|---|---|
| `pnpm electron:dev` | App de escritorio (compila + servidor + Electron, todo en uno) |
| `pnpm dev` | Solo servidor web, abre http://localhost:3000 |
| `pnpm build` | Build de producción (frontend + servidor) |
| `pnpm start` | Servidor de producción (`node dist/server.cjs`) |
| `pnpm lint` | TypeScript type-check |
| `pnpm electron:build` | Build + empaquetar para Windows y Mac |
| `pnpm dist:win` | Build + .exe portable |
| `pnpm dist:mac` | Build + .dmg |
| `pnpm clean` | Limpiar artefactos de build |

## Estructura del proyecto

```
├── src/
│   ├── App.tsx              # Componente principal (orquestador)
│   ├── components/          # UI (Header, FieldInspector, etc.)
│   ├── hooks/               # Custom hooks (useFirestore, useStatusMessage)
│   ├── services/            # API layer (IPC/HTTP unificado), tipos
│   └── utils/               # parseFieldValue
├── electron/
│   ├── main.ts              # Proceso principal de Electron + IPC handlers
│   └── preload.ts           # contextBridge API
├── scripts/
│   └── electron-dev.mjs     # Script que arranca servidor + Electron
├── server.ts                # Express + API REST + Vite middleware
└── package.json
```

## Tecnologías

React 19, TypeScript, Vite 6, Tailwind CSS v4, Express, Firebase Admin SDK, Electron 31, lucide-react, pnpm.
