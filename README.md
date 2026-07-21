# Firestore Desktop Editor

Aplicación de escritorio para navegar y editar documentos de Google Cloud Firestore en tiempo real, usando credenciales de cuenta de servicio.

## Prerrequisitos

- Node.js >= 18
- npm (incluido con Node.js)

## Primeros pasos

```bash
npm install
npm run electron:dev      # App de escritorio (Electron)
```

Esto compila el código de Electron, inicia el servidor de desarrollo y abre la ventana de la aplicación automáticamente.

## Modos de ejecución

| Comando | Descripción |
|---|---|
| `npm run electron:dev` | App de escritorio (compila + servidor + Electron, todo en uno) |
| `npm run dev` | Solo servidor web, abre http://localhost:3000 |
| `npm run build` | Build de producción (frontend + servidor) |
| `npm start` | Servidor de producción (`node dist/server.cjs`) |
| `npm run lint` | TypeScript type-check |
| `npm run dist:mac` | Build + empaquetar .dmg para macOS |
| `npm run dist:win` | Build + empaquetar .exe portable para Windows |
| `npm run electron:build` | Build + empaquetar para Windows y Mac |
| `npm run clean` | Limpiar artefactos de build |

## Empaquetado

Los builds empaquetados se generan en `dist-packaged/`.

### macOS

```bash
npm run dist:mac
```

Genera un `.dmg` en `dist-packaged/`. El icono de la app se configura desde `assets/icon.png`.

### Windows

```bash
npm run dist:win
```

Genera un `.exe` portable en `dist-packaged/`.

## Estructura del proyecto

```
├── src/
│   ├── App.tsx              # Componente principal (orquestador)
│   ├── components/          # UI (ConnectionHeader, FieldInspector, etc.)
│   ├── hooks/               # Custom hooks (useFirestore, useTheme, etc.)
│   ├── services/            # API layer (IPC/HTTP unificado), tipos
│   └── utils/               # parseFieldValue
├── electron/
│   ├── main.ts              # Proceso principal de Electron + IPC handlers
│   └── preload.ts           # contextBridge API
├── scripts/
│   └── electron-dev.mjs     # Script que arranca servidor + Electron
├── assets/
│   └── icon.png             # Icono de la aplicación
├── server.ts                # Express + API REST + Vite middleware
└── package.json
```

## Tecnologías

React 19, TypeScript, Vite 6, Tailwind CSS v4, Express, Firebase Admin SDK, Electron 31, lucide-react, npm.
