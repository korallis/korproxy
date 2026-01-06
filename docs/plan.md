# KorProxy - Project Plan

> A native cross-platform desktop application for CLIProxyAPI management built with .NET Avalonia and SukiUI

## 📋 Project Overview

**Project Name:** KorProxy  
**Framework:** .NET 8 LTS + Avalonia UI 11.3  
**Theme:** SukiUI (modern glassmorphism)  
**Target Platforms:** macOS (arm64, x64), Windows (x64, arm64)  
**CLIProxyAPI Bundling:** Included in installer (standalone)

---

## 🎯 Project Goals

1. Build a native, high-performance GUI for CLIProxyAPI
2. Provide seamless cross-platform experience on macOS and Windows
3. Modern, stylish UI with dark mode default using SukiUI
4. Full feature parity with CLIProxyAPI Management API
5. System tray integration for background operation
6. Bundle CLIProxyAPI binary for standalone installation

---

## 🔧 Technology Stack

### Core Framework
| Component | Technology | Version |
|-----------|------------|---------|
| Runtime | .NET | 8.0 LTS |
| UI Framework | Avalonia UI | 11.3.0 |
| Theme | SukiUI | 6.x |
| MVVM Toolkit | CommunityToolkit.Mvvm | 8.4.0 |

### Additional Libraries
| Purpose | Package |
|---------|---------|
| HTTP Client | System.Net.Http.Json |
| YAML Parsing | YamlDotNet |
| JSON | System.Text.Json (built-in) |
| Dependency Injection | Microsoft.Extensions.DependencyInjection |

### Development Tools
| Tool | Purpose |
|------|---------|
| .NET 8 SDK | Build and compile |
| Avalonia Templates | Project scaffolding |
| VS Code / Rider | IDE |

---

## 🏗️ Architecture

### Solution Structure
```
KorProxy/
├── KorProxy.sln
├── docs/
│   ├── PLAN.md                         # This file
│   ├── TASKS.md                        # Task tracking
│   └── API.md                          # CLIProxyAPI endpoints reference
├── src/
│   ├── KorProxy/                       # Main Avalonia Desktop App
│   │   ├── KorProxy.csproj
│   │   ├── App.axaml                   # Application + SukiUI theme
│   │   ├── App.axaml.cs
│   │   ├── Program.cs                  # Entry point
│   │   ├── ViewLocator.cs              # MVVM view resolution
│   │   ├── Assets/                     # Icons, images, bundled CLI
│   │   │   ├── Icons/
│   │   │   ├── cli-proxy-api           # macOS binary
│   │   │   ├── cli-proxy-api.exe       # Windows binary
│   │   │   └── config.example.yaml
│   │   ├── Views/                      # AXAML UI definitions
│   │   │   ├── MainWindow.axaml
│   │   │   ├── LoginView.axaml
│   │   │   ├── DashboardView.axaml
│   │   │   ├── ProvidersView.axaml
│   │   │   ├── ApiKeysView.axaml
│   │   │   ├── AuthFilesView.axaml
│   │   │   ├── SettingsView.axaml
│   │   │   ├── LogsView.axaml
│   │   │   └── UsageView.axaml
│   │   ├── ViewModels/                 # MVVM ViewModels
│   │   │   ├── MainWindowViewModel.cs
│   │   │   ├── LoginViewModel.cs
│   │   │   ├── DashboardViewModel.cs
│   │   │   ├── ProvidersViewModel.cs
│   │   │   ├── ApiKeysViewModel.cs
│   │   │   ├── AuthFilesViewModel.cs
│   │   │   ├── SettingsViewModel.cs
│   │   │   ├── LogsViewModel.cs
│   │   │   └── UsageViewModel.cs
│   │   ├── Models/                     # Data models
│   │   │   ├── AppConfig.cs
│   │   │   ├── ConnectionMode.cs
│   │   │   ├── ServerStatus.cs
│   │   │   └── Dto/                    # API DTOs
│   │   ├── Services/                   # Business logic
│   │   │   ├── ICLIProxyApiClient.cs
│   │   │   ├── CLIProxyApiClient.cs
│   │   │   ├── IProcessManager.cs
│   │   │   ├── ProcessManager.cs
│   │   │   ├── IConfigurationService.cs
│   │   │   ├── ConfigurationService.cs
│   │   │   └── TrayService.cs
│   │   └── Controls/                   # Custom Avalonia controls
│   │       ├── StatusIndicator.axaml
│   │       └── ProviderCard.axaml
│   │
│   └── KorProxy.Core/                  # Shared library (optional)
│       ├── KorProxy.Core.csproj
│       └── ...
│
├── tests/
│   └── KorProxy.Tests/
│       └── KorProxy.Tests.csproj
│
└── build/
    ├── macos/
    │   └── Info.plist
    └── windows/
        └── installer.wxs
```

### MVVM Pattern
- **Models**: Pure data classes, DTOs for API responses
- **ViewModels**: CommunityToolkit.Mvvm with [ObservableProperty], [RelayCommand]
- **Views**: AXAML with data binding to ViewModels
- **Services**: Injectable services for API calls, process management

### Dependency Injection
```csharp
services.AddSingleton<ICLIProxyApiClient, CLIProxyApiClient>();
services.AddSingleton<IProcessManager, ProcessManager>();
services.AddSingleton<IConfigurationService, ConfigurationService>();
services.AddSingleton<MainWindowViewModel>();
// ... more registrations
```

---

## 🎨 UI Design

### Theme Configuration
- **Base Theme**: SukiUI Dark mode
- **Background Style**: Gradient or Bubble (glassmorphism)
- **Accent Color**: Blue (customizable)
- **Window Style**: SukiWindow with native title bar

### Navigation Structure
```
┌─────────────────────────────────────────────────┐
│  KorProxy                              ─ □ ✕    │
├───────────┬─────────────────────────────────────┤
│           │                                     │
│  🏠 Home  │     [Content Area]                  │
│           │                                     │
│  🔐 Auth  │     Dashboard / Providers /         │
│           │     API Keys / Settings / etc.      │
│  🔑 Keys  │                                     │
│           │                                     │
│  ⚙️ Setup │                                     │
│           │                                     │
│  📊 Stats │                                     │
│           │                                     │
│  📜 Logs  │                                     │
│           │                                     │
├───────────┴─────────────────────────────────────┤
│  [Status Bar: Server Status | Connection Mode]  │
└─────────────────────────────────────────────────┘
```

### Key Screens

#### 1. Login View
- Mode toggle: Local / Remote
- Remote fields: Base URL, Management Key
- Local: Auto-start option, bundled CLI path display
- Connect button with loading state

#### 2. Dashboard
- Server status card (running/stopped)
- Start/Stop/Restart buttons
- Quick stats: requests, tokens, errors
- Provider status grid (small cards)

#### 3. Providers View
- List/Grid of providers
- Each provider: name, status, login button, auth expiry
- Supported: Gemini CLI, Claude Code, Codex, Qwen, iFlow, Antigravity

#### 4. API Keys View
- Tabbed: Gemini | Claude | Codex | OpenAI Compat
- DataGrid with: Key (masked), Base URL, Proxy, Actions
- Add/Edit/Delete dialogs

#### 5. Auth Files View
- DataGrid: Name, Provider, Email, Status, Actions
- Upload button (file picker)
- Download/Delete per row

#### 6. Settings View
- Form-based settings
- Sections: Server, Logging, Proxy, Remote Management

#### 7. Usage View
- Charts: Requests/day, Tokens/day
- Tables: By API, By Model
- Time range selector

#### 8. Logs View
- Real-time log streaming
- Filter by level (debug, info, warn, error)
- Search functionality

---

## 🔌 CLIProxyAPI Integration

### Management API Base
```
http://localhost:8317/v0/management/
```

### Key Endpoints to Implement

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /config | GET | Get full configuration |
| /config.yaml | GET/PUT | Download/upload YAML |
| /debug | GET/PUT | Toggle debug mode |
| /usage | GET | Get usage statistics |
| /api-keys | GET/PUT/DELETE | Manage API keys |
| /auth-files | GET/POST/DELETE | Manage auth files |
| /gemini-api-key | GET/PUT/PATCH/DELETE | Gemini keys |
| /claude-api-key | GET/PUT/PATCH/DELETE | Claude keys |
| /codex-api-key | GET/PUT/PATCH/DELETE | Codex keys |
| /openai-compatibility | GET/PUT/PATCH/DELETE | OpenAI providers |
| /anthropic-auth-url | GET | Start Claude OAuth |
| /codex-auth-url | GET | Start Codex OAuth |
| /gemini-cli-auth-url | GET | Start Gemini OAuth |
| /qwen-auth-url | GET | Start Qwen OAuth |
| /iflow-auth-url | GET | Start iFlow OAuth |
| /get-auth-status | GET | Poll OAuth status |
| /logs | GET/DELETE | Log management |
| /latest-version | GET | Check for updates |

### Authentication
All requests require:
```
Authorization: Bearer <management-key>
```
or
```
X-Management-Key: <management-key>
```

---

## 📦 Bundling Strategy

### CLIProxyAPI Binaries
1. Download latest release from GitHub during build
2. Include platform-specific binaries in Assets:
   - `cli-proxy-api` (macOS universal or arch-specific)
   - `cli-proxy-api.exe` (Windows)
3. Mark as Content, Copy to output

### Runtime Location
- **macOS**: `~/Library/Application Support/KorProxy/`
- **Windows**: `%LOCALAPPDATA%\KorProxy\`

Contains:
- `cli-proxy-api[.exe]` (copied from bundle on first run)
- `config.yaml`
- `auths/` directory

---

## 🚀 Development Phases

### Phase 1: Foundation (Priority: HIGH)
- [ ] Install .NET 8 SDK
- [ ] Install Avalonia templates
- [ ] Create solution structure
- [ ] Configure SukiUI theme
- [ ] Set up DI container
- [ ] Implement navigation shell

### Phase 2: Core Services (Priority: HIGH)
- [ ] CLIProxyApiClient - full API coverage
- [ ] ProcessManager - start/stop/monitor CLI
- [ ] ConfigurationService - app settings
- [ ] Connection management (Local/Remote)

### Phase 3: Main Views (Priority: HIGH)
- [ ] LoginView - mode selection
- [ ] DashboardView - status overview
- [ ] ProvidersView - OAuth management
- [ ] AuthFilesView - file management

### Phase 4: Configuration Views (Priority: MEDIUM)
- [ ] ApiKeysView - all key types
- [ ] SettingsView - configuration
- [ ] Implement all CRUD operations

### Phase 5: Monitoring (Priority: MEDIUM)
- [ ] UsageView - statistics display
- [ ] LogsView - real-time logs
- [ ] System tray integration

### Phase 6: Packaging (Priority: LOW)
- [ ] Bundle CLI binaries
- [ ] macOS app bundle + DMG
- [ ] Windows installer
- [ ] GitHub Actions CI/CD

---

## 🧪 Testing Strategy

### Unit Tests
- ViewModel logic
- Service methods
- API client (with mocked HTTP)

### Integration Tests
- End-to-end with real CLIProxyAPI instance

### Manual Testing
- macOS: Apple Silicon + Intel
- Windows: x64 + ARM64

---

## 📅 Timeline Estimate

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Foundation | 3-4 days | 🔜 Next |
| Phase 2: Core Services | 4-5 days | Pending |
| Phase 3: Main Views | 5-6 days | Pending |
| Phase 4: Config Views | 3-4 days | Pending |
| Phase 5: Monitoring | 3-4 days | Pending |
| Phase 6: Packaging | 2-3 days | Pending |

**Total Estimated Time**: ~3-4 weeks

---

## 📝 Notes

### Known Considerations
1. OAuth flows require external browser - open URL, poll for completion
2. Process management needs platform-specific handling
3. System tray APIs differ between macOS and Windows
4. File paths need platform abstraction

### Future Enhancements
- Auto-update functionality
- Multiple server profiles
- Import/export settings
- Keyboard shortcuts
- Localization

---

*Document Created: December 19, 2025*  
*Last Updated: December 19, 2025*
