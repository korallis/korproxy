# KorProxy

A beautiful desktop GUI for [CLIProxyAPI](https://github.com/router-for-me/CLIProxyAPI) - manage your AI proxy connections with ease.

![KorProxy Screenshot](docs/screenshot.png)

## Features

- 🎨 **Modern UI** - Glassmorphism design with smooth Framer Motion animations
- 🔐 **OAuth Authentication** - Connect to Gemini, Claude, OpenAI Codex, Qwen, and iFlow
- 📊 **Dashboard** - Real-time proxy status and usage statistics
- 👥 **Account Management** - Manage multiple accounts across providers
- 📝 **Live Logs** - Real-time log viewer with filtering
- ⚙️ **Settings** - Customize theme, port, and behavior
- 🖥️ **Cross-Platform** - Works on macOS (Apple Silicon) and Windows

## Quick Start

```bash
# Install dependencies
npm install

# Build Go binaries (requires Go 1.21+)
./scripts/build-binaries.sh

# Start development server
npm run dev
```

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Type check
npm run typecheck

# Lint
npm run lint

# Build for production
npm run build:vite
```

## Building for Distribution

```bash
# Build for macOS
npm run package:mac

# Build for Windows
npm run package:win

# Build for all platforms
npm run package:all
```

## Project Structure

```
korproxy-app/
├── electron/
│   ├── main/           # Electron main process
│   │   ├── index.ts    # Window management
│   │   ├── sidecar.ts  # Go binary lifecycle
│   │   ├── ipc.ts      # IPC handlers
│   │   ├── auth.ts     # OAuth handlers
│   │   ├── tray.ts     # System tray
│   │   └── store.ts    # Settings persistence
│   └── preload/
│       └── index.ts    # Context bridge
├── src/
│   ├── components/
│   │   ├── ui/         # shadcn-style components
│   │   ├── layout/     # AppShell, Sidebar, TitleBar
│   │   ├── auth/       # OAuth components
│   │   ├── icons/      # Provider icons
│   │   └── shared/     # Reusable components
│   ├── pages/          # Dashboard, Providers, Accounts, Logs, Settings
│   ├── hooks/          # React hooks
│   ├── stores/         # Zustand stores
│   ├── lib/            # Utilities and API client
│   └── styles/         # Global CSS
├── resources/
│   └── binaries/       # Pre-built Go binaries
└── scripts/
    └── build-binaries.sh
```

## Tech Stack

- **Electron** - Desktop app framework
- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Framer Motion** - Animations
- **Radix UI** - Accessible primitives
- **Zustand** - State management
- **React Query** - Server state

## Supported Providers

| Provider | Status |
|----------|--------|
| Gemini (Google AI Studio) | ✅ |
| Claude (Anthropic) | ✅ |
| OpenAI Codex | ✅ |
| Qwen Code | ✅ |
| iFlow | ✅ |

## License

MIT License - see [LICENSE](LICENSE) for details.
