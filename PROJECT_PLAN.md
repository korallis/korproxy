# KorProxy - Desktop Application Project Plan

> **Project**: Electron GUI for CLIProxyAPI  
> **Date**: December 1, 2025  
> **Stack**: Electron + React + TypeScript + Framer Motion + Tailwind + shadcn/ui

---

## 🎯 Executive Summary

KorProxy is a desktop application that wraps the CLIProxyAPI Go backend, providing everyday users with a beautiful, intuitive interface to manage their AI proxy connections. The app embeds the Go binary as a sidecar process and offers seamless OAuth authentication for:

- **Gemini** (Google AI Studio / CLI)
- **Claude** (Anthropic Code)  
- **OpenAI Codex** (GPT models)
- **Qwen Code**
- **iFlow**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     KorProxy Desktop App                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                 Electron Main Process                     │  │
│  │  • Window management                                      │  │
│  │  • IPC bridge to renderer                                 │  │
│  │  • Go binary lifecycle (spawn/monitor/restart)            │  │
│  │  • System tray integration                                │  │
│  │  • Auto-updater                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▲                                  │
│                              │ IPC                              │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Electron Renderer (React App)                │  │
│  │  • Dashboard & Analytics UI                               │  │
│  │  • Provider Authentication Flows                          │  │
│  │  • Account Management                                     │  │
│  │  • Settings & Configuration                               │  │
│  │  • Real-time Status Monitoring                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              ▲                                  │
│                              │ REST/WebSocket                   │
│                              ▼                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              CLIProxyAPI (Go Sidecar Binary)              │  │
│  │  • OpenAI/Gemini/Claude compatible endpoints              │  │
│  │  • OAuth token management                                 │  │
│  │  • Multi-account load balancing                           │  │
│  │  • Request routing & translation                          │  │
│  │  • Hot-reload configuration                               │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
korproxy/
├── electron/
│   ├── main/
│   │   ├── index.ts              # Main process entry
│   │   ├── window.ts             # Window management
│   │   ├── sidecar.ts            # Go binary lifecycle manager
│   │   ├── tray.ts               # System tray
│   │   ├── updater.ts            # Auto-update logic
│   │   └── ipc/
│   │       ├── handlers.ts       # IPC message handlers
│   │       └── channels.ts       # Type-safe channel definitions
│   └── preload/
│       └── index.ts              # Secure context bridge
│
├── src/                          # React renderer
│   ├── app/
│   │   ├── App.tsx
│   │   ├── Router.tsx
│   │   └── providers/
│   │       ├── ThemeProvider.tsx
│   │       ├── ProxyProvider.tsx # Proxy state context
│   │       └── ToastProvider.tsx
│   │
│   ├── components/
│   │   ├── ui/                   # shadcn/ui components
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Header.tsx
│   │   │   └── AppShell.tsx
│   │   ├── dashboard/
│   │   │   ├── StatusCard.tsx
│   │   │   ├── UsageChart.tsx
│   │   │   ├── ProviderGrid.tsx
│   │   │   └── QuickActions.tsx
│   │   ├── auth/
│   │   │   ├── OAuthFlow.tsx
│   │   │   ├── ProviderCard.tsx
│   │   │   └── AccountList.tsx
│   │   ├── settings/
│   │   │   ├── GeneralSettings.tsx
│   │   │   ├── ProxySettings.tsx
│   │   │   └── ApiKeyManager.tsx
│   │   └── shared/
│   │       ├── AnimatedCard.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── StatusBadge.tsx
│   │       └── GlowButton.tsx
│   │
│   ├── pages/
│   │   ├── Dashboard.tsx
│   │   ├── Providers.tsx
│   │   ├── Accounts.tsx
│   │   ├── Logs.tsx
│   │   └── Settings.tsx
│   │
│   ├── hooks/
│   │   ├── useProxy.ts           # Proxy status & control
│   │   ├── useAuth.ts            # Provider auth state
│   │   ├── useWebSocket.ts       # Real-time updates
│   │   └── useAnimatedValue.ts   # Animation helpers
│   │
│   ├── lib/
│   │   ├── api.ts                # Proxy API client
│   │   ├── ipc.ts                # Type-safe IPC wrapper
│   │   └── utils.ts
│   │
│   ├── styles/
│   │   ├── globals.css
│   │   ├── animations.css
│   │   └── themes/
│   │       ├── dark.css
│   │       └── light.css
│   │
│   └── types/
│       ├── proxy.ts
│       ├── provider.ts
│       └── electron.d.ts
│
├── resources/
│   ├── binaries/                 # Pre-built Go binaries
│   │   ├── darwin-arm64/
│   │   ├── darwin-x64/
│   │   ├── win32-x64/
│   │   └── linux-x64/
│   ├── icons/
│   └── assets/
│
├── CLIProxyAPI/                  # Embedded backend (submodule or copy)
│
├── scripts/
│   ├── build-go.sh               # Cross-compile Go binary
│   └── package.ts                # Electron packaging
│
├── package.json
├── electron-builder.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── README.md
```

---

## 🎨 UI/UX Design Concept

### Design Philosophy
- **Consumer-friendly**: Not enterprise-like, approachable and delightful
- **Glassmorphism + Subtle gradients**: Modern, clean aesthetic
- **Micro-interactions**: Every action has satisfying feedback
- **Dark-mode first**: With elegant light mode option

### Color Palette (Dark Theme)
```css
:root {
  --bg-primary: oklch(0.13 0.02 280);      /* Deep space blue */
  --bg-secondary: oklch(0.18 0.025 280);   /* Card backgrounds */
  --accent-primary: oklch(0.75 0.18 250);  /* Electric purple */
  --accent-secondary: oklch(0.70 0.20 180);/* Teal glow */
  --success: oklch(0.72 0.19 145);         /* Mint green */
  --warning: oklch(0.80 0.16 85);          /* Warm amber */
  --error: oklch(0.65 0.24 25);            /* Soft coral */
  --text-primary: oklch(0.95 0.01 280);
  --text-muted: oklch(0.65 0.02 280);
}
```

### Key UI Components

#### 1. **Animated Sidebar**
```
┌──────────────────┐
│ 🌐 KorProxy      │
│                  │
│ ◉ Dashboard      │  ← Active state with glow
│ ○ Providers      │
│ ○ Accounts       │
│ ○ Logs           │
│ ○ Settings       │
│                  │
│ ─────────────────│
│ ● Proxy: Running │  ← Status indicator
│ ⚡ 142 req/min   │
└──────────────────┘
```

#### 2. **Dashboard Cards**
```
┌─────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   GEMINI    │  │   CLAUDE    │  │   CODEX     │         │
│  │    ●        │  │    ●        │  │    ○        │         │
│  │  3 accounts │  │  2 accounts │  │  Inactive   │         │
│  │  ▓▓▓▓▓░░ 71%│  │  ▓▓▓░░░ 45% │  │  Click to   │         │
│  │             │  │             │  │  Connect    │         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              REQUEST ACTIVITY (24h)                  │   │
│  │   ▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█▇▆▅▄▃▂▁▂▃▄▅▆▇█            │   │
│  │                                             1,247    │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

#### 3. **Provider Authentication Flow**
```
┌────────────────────────────────────────────┐
│                                            │
│        ┌────────────────────┐              │
│        │                    │              │
│        │    Google Logo     │ ← Animated   │
│        │                    │              │
│        └────────────────────┘              │
│                                            │
│    Connect your Gemini account             │
│    to use AI models through KorProxy       │
│                                            │
│    ┌────────────────────────────────┐      │
│    │  🔐  Sign in with Google       │      │
│    └────────────────────────────────┘      │
│                                            │
│    ✓ Secure OAuth 2.0 authentication       │
│    ✓ Your credentials never stored         │
│                                            │
└────────────────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### 1. Go Binary Embedding Strategy

```typescript
// electron/main/sidecar.ts
import { spawn, ChildProcess } from 'child_process';
import { app } from 'electron';
import path from 'path';

class ProxySidecar {
  private process: ChildProcess | null = null;
  private port = 1337;

  getBinaryPath(): string {
    const platform = process.platform; // 'darwin' | 'win32' | 'linux'
    const arch = process.arch;         // 'arm64' | 'x64'
    
    const binName = platform === 'win32' ? 'cliproxy.exe' : 'cliproxy';
    
    // In production: binary is in app resources
    // In development: use local build
    const basePath = app.isPackaged 
      ? path.join(process.resourcesPath, 'binaries')
      : path.join(__dirname, '../../resources/binaries');
      
    return path.join(basePath, `${platform}-${arch}`, binName);
  }

  async start(): Promise<void> {
    const binary = this.getBinaryPath();
    const configPath = this.getConfigPath();
    
    this.process = spawn(binary, ['--config', configPath, '--port', String(this.port)], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, HOME: app.getPath('userData') }
    });

    this.process.stdout?.on('data', (data) => {
      this.emit('log', data.toString());
    });

    // Health check loop
    await this.waitForReady();
  }

  async stop(): Promise<void> {
    if (this.process) {
      this.process.kill('SIGTERM');
      await this.waitForExit();
    }
  }
}
```

### 2. IPC Communication

```typescript
// electron/main/ipc/channels.ts
export const IPC_CHANNELS = {
  // Proxy control
  PROXY_START: 'proxy:start',
  PROXY_STOP: 'proxy:stop',
  PROXY_STATUS: 'proxy:status',
  PROXY_LOGS: 'proxy:logs',
  
  // Auth
  AUTH_OAUTH_START: 'auth:oauth:start',
  AUTH_OAUTH_CALLBACK: 'auth:oauth:callback',
  AUTH_LIST_ACCOUNTS: 'auth:list-accounts',
  AUTH_REMOVE_ACCOUNT: 'auth:remove-account',
  
  // Config
  CONFIG_GET: 'config:get',
  CONFIG_SET: 'config:set',
  CONFIG_RELOAD: 'config:reload',
} as const;

// electron/preload/index.ts
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('korproxy', {
  proxy: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_START),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_STOP),
    status: () => ipcRenderer.invoke(IPC_CHANNELS.PROXY_STATUS),
    onLog: (callback: (log: string) => void) => {
      ipcRenderer.on(IPC_CHANNELS.PROXY_LOGS, (_, log) => callback(log));
    },
  },
  auth: {
    startOAuth: (provider: string) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_OAUTH_START, provider),
    listAccounts: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH_LIST_ACCOUNTS),
    removeAccount: (id: string) => ipcRenderer.invoke(IPC_CHANNELS.AUTH_REMOVE_ACCOUNT, id),
  },
  config: {
    get: () => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_GET),
    set: (config: Partial<Config>) => ipcRenderer.invoke(IPC_CHANNELS.CONFIG_SET, config),
  },
});
```

### 3. Animation Patterns (Framer Motion)

```typescript
// src/components/shared/AnimatedCard.tsx
import { motion } from 'framer-motion';

const cardVariants = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }
  },
  hover: { 
    scale: 1.02,
    boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
    transition: { duration: 0.2 }
  },
  tap: { scale: 0.98 }
};

export const AnimatedCard = ({ children, delay = 0 }) => (
  <motion.div
    variants={cardVariants}
    initial="initial"
    animate="animate"
    whileHover="hover"
    whileTap="tap"
    transition={{ delay }}
    className="rounded-2xl bg-card/80 backdrop-blur-xl border border-border/50 p-6"
  >
    {children}
  </motion.div>
);

// Page transitions
const pageVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 }
};

// Staggered list animation
const containerVariants = {
  animate: {
    transition: { staggerChildren: 0.08, delayChildren: 0.1 }
  }
};

const itemVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 }
};
```

### 4. Provider Authentication Component

```typescript
// src/components/auth/ProviderCard.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

const providers = {
  gemini: { name: 'Gemini', color: '#4285F4', icon: GeminiIcon },
  claude: { name: 'Claude', color: '#CC785C', icon: ClaudeIcon },
  codex: { name: 'OpenAI Codex', color: '#10A37F', icon: OpenAIIcon },
  qwen: { name: 'Qwen', color: '#6366F1', icon: QwenIcon },
};

export const ProviderCard = ({ provider, accounts, onConnect }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const config = providers[provider];
  const isActive = accounts.length > 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={cn(
        "relative overflow-hidden rounded-2xl p-6",
        "bg-gradient-to-br from-card to-card/50",
        "border border-border/50 backdrop-blur-xl",
        isActive && "ring-2 ring-accent/50"
      )}
    >
      {/* Glow effect */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(circle at 30% 30%, ${config.color}, transparent 70%)` }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <motion.div
            animate={{ rotate: isConnecting ? 360 : 0 }}
            transition={{ duration: 2, repeat: isConnecting ? Infinity : 0, ease: 'linear' }}
          >
            <config.icon className="w-10 h-10" />
          </motion.div>
          <div>
            <h3 className="font-semibold text-lg">{config.name}</h3>
            <p className="text-sm text-muted-foreground">
              {accounts.length} account{accounts.length !== 1 ? 's' : ''} connected
            </p>
          </div>
          <StatusIndicator active={isActive} className="ml-auto" />
        </div>

        <AnimatePresence mode="wait">
          {isActive ? (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {accounts.map((account) => (
                <AccountBadge key={account.id} account={account} />
              ))}
            </motion.div>
          ) : (
            <motion.button
              key="connect"
              onClick={() => onConnect(provider)}
              className="w-full py-3 rounded-xl bg-accent text-accent-foreground font-medium"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Connect Account
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
```

---

## 📦 Build & Distribution

### Electron Builder Configuration

```json
// electron-builder.json
{
  "appId": "com.korproxy.app",
  "productName": "KorProxy",
  "directories": {
    "output": "release"
  },
  "files": [
    "dist/**/*",
    "electron/**/*"
  ],
  "extraResources": [
    {
      "from": "resources/binaries/${platform}-${arch}/",
      "to": "binaries/",
      "filter": ["**/*"]
    }
  ],
  "mac": {
    "target": [
      { "target": "dmg", "arch": ["arm64", "x64"] },
      { "target": "zip", "arch": ["arm64", "x64"] }
    ],
    "category": "public.app-category.developer-tools",
    "hardenedRuntime": true,
    "gatekeeperAssess": false,
    "entitlements": "build/entitlements.mac.plist",
    "entitlementsInherit": "build/entitlements.mac.plist",
    "icon": "resources/icons/icon.icns"
  },
  "win": {
    "target": [
      { "target": "nsis", "arch": ["x64"] },
      { "target": "portable", "arch": ["x64"] }
    ],
    "icon": "resources/icons/icon.ico"
  },
  "nsis": {
    "oneClick": false,
    "allowToChangeInstallationDirectory": true
  }
}
```

### Go Binary Cross-Compilation

```bash
#!/bin/bash
# scripts/build-go.sh

GOOS=darwin GOARCH=arm64 go build -o resources/binaries/darwin-arm64/cliproxy ./cmd/server
GOOS=darwin GOARCH=amd64 go build -o resources/binaries/darwin-x64/cliproxy ./cmd/server
GOOS=windows GOARCH=amd64 go build -o resources/binaries/win32-x64/cliproxy.exe ./cmd/server
GOOS=linux GOARCH=amd64 go build -o resources/binaries/linux-x64/cliproxy ./cmd/server
```

---

## 🚀 Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Set up Electron + Vite + React + TypeScript project
- [ ] Configure Tailwind + shadcn/ui
- [ ] Implement Go binary sidecar manager
- [ ] Basic IPC communication layer
- [ ] App shell with sidebar navigation

### Phase 2: Core Features (Week 3-4)
- [ ] Dashboard with proxy status
- [ ] Provider authentication flows (OAuth)
- [ ] Account management UI
- [ ] Configuration editor
- [ ] Real-time log viewer

### Phase 3: Polish & Animations (Week 5)
- [ ] Framer Motion page transitions
- [ ] Micro-interactions on all interactive elements
- [ ] Loading states and skeletons
- [ ] Error states and toast notifications
- [ ] Dark/light theme toggle

### Phase 4: Production Readiness (Week 6)
- [ ] Auto-updater implementation
- [ ] System tray with quick actions
- [ ] Cross-platform testing
- [ ] Performance optimization
- [ ] Packaging for Windows + macOS

### Phase 5: Code Signing & Release (Week 7)
- [ ] macOS code signing & notarization
- [ ] Windows code signing
- [ ] Release pipeline (GitHub Actions)
- [ ] Documentation & user guide

---

## 🧪 Testing Strategy

```typescript
// Vitest for unit tests
// Playwright for E2E tests

// Example component test
describe('ProviderCard', () => {
  it('shows connect button when no accounts', () => {
    render(<ProviderCard provider="gemini" accounts={[]} />);
    expect(screen.getByText('Connect Account')).toBeInTheDocument();
  });

  it('shows account list when connected', () => {
    render(<ProviderCard provider="gemini" accounts={[mockAccount]} />);
    expect(screen.getByText(mockAccount.email)).toBeInTheDocument();
  });
});
```

---

## 📋 Dependencies

```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0",
    "framer-motion": "^11.12.0",
    "@tanstack/react-query": "^5.60.0",
    "zustand": "^5.0.0",
    "lucide-react": "^0.460.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.5.0"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.1.0",
    "vite": "^6.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "typescript": "^5.6.0",
    "tailwindcss": "^3.4.0",
    "@types/react": "^19.0.0",
    "vitest": "^2.1.0",
    "playwright": "^1.49.0"
  }
}
```

---

## 🔐 Security Considerations

1. **Context Isolation**: Renderer process has no direct Node.js access
2. **IPC Validation**: All IPC messages validated before processing
3. **Secure Storage**: OAuth tokens stored in OS keychain (via `keytar`)
4. **No Hardcoded Secrets**: All credentials from user input or OAuth
5. **CSP Headers**: Strict Content Security Policy in production

---

## 📝 Notes

- **Why not use the Go SDK directly in Electron?** Electron runs JavaScript; the Go binary must run as a separate process. This sidecar pattern is proven (VS Code, Figma, etc.)
- **Why React over SolidJS?** Better ecosystem for Electron (electron-vite-react), more animation libraries, larger community
- **Why Vite?** Fastest HMR, excellent Electron integration via `electron-vite`

---

## Next Steps

1. Initialize the project structure
2. Set up the development environment
3. Build the Go binaries for target platforms
4. Implement the first feature: proxy status dashboard

---

*This plan is a living document and will be updated as the project progresses.*
