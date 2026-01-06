# KorProxy - Task Tracking

> Detailed task breakdown for KorProxy development

---

## 📊 Progress Overview

| Phase | Tasks | Completed | Progress |
|-------|-------|-----------|----------|
| Phase 1: Foundation | 8 | 0 | 0% |
| Phase 2: Core Services | 10 | 0 | 0% |
| Phase 3: Main Views | 12 | 0 | 0% |
| Phase 4: Config Views | 8 | 0 | 0% |
| Phase 5: Monitoring | 8 | 0 | 0% |
| Phase 6: Packaging | 8 | 0 | 0% |
| **Total** | **54** | **0** | **0%** |

---

## 🔷 Phase 1: Foundation

### 1.1 Environment Setup
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 1.1.1 | Install .NET 8 SDK via Homebrew | ⬜ Todo | 🔴 High | `brew install dotnet@8` |
| 1.1.2 | Install Avalonia project templates | ⬜ Todo | 🔴 High | `dotnet new install Avalonia.Templates` |
| 1.1.3 | Verify tooling installation | ⬜ Todo | 🔴 High | `dotnet --version`, `dotnet new list` |

### 1.2 Project Creation
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 1.2.1 | Create solution file | ⬜ Todo | 🔴 High | `dotnet new sln -n KorProxy` |
| 1.2.2 | Create main Avalonia project | ⬜ Todo | 🔴 High | `dotnet new avalonia.app -n KorProxy` |
| 1.2.3 | Create Core class library (optional) | ⬜ Todo | 🟡 Medium | Shared models/interfaces |
| 1.2.4 | Create test project | ⬜ Todo | 🟡 Medium | xUnit test project |
| 1.2.5 | Add projects to solution | ⬜ Todo | 🔴 High | `dotnet sln add` |

### 1.3 Dependencies & Theme
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 1.3.1 | Add SukiUI NuGet package | ⬜ Todo | 🔴 High | `dotnet add package SukiUI` |
| 1.3.2 | Add CommunityToolkit.Mvvm | ⬜ Todo | 🔴 High | MVVM infrastructure |
| 1.3.3 | Add YamlDotNet | ⬜ Todo | 🟡 Medium | Config file parsing |
| 1.3.4 | Add DI packages | ⬜ Todo | 🟡 Medium | Microsoft.Extensions.DI |
| 1.3.5 | Configure SukiUI in App.axaml | ⬜ Todo | 🔴 High | Theme, colors, dark mode |
| 1.3.6 | Create SukiWindow main window | ⬜ Todo | 🔴 High | Replace default Window |

### 1.4 Base Architecture
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 1.4.1 | Set up DI container in Program.cs | ⬜ Todo | 🔴 High | Service registration |
| 1.4.2 | Create ViewLocator | ⬜ Todo | 🔴 High | MVVM view resolution |
| 1.4.3 | Create ViewModelBase class | ⬜ Todo | 🔴 High | Common VM functionality |
| 1.4.4 | Set up navigation service | ⬜ Todo | 🔴 High | Page switching logic |
| 1.4.5 | Create folder structure | ⬜ Todo | 🔴 High | Views, ViewModels, Services, Models |

---

## 🔷 Phase 2: Core Services

### 2.1 API Client
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 2.1.1 | Create ICLIProxyApiClient interface | ⬜ Todo | 🔴 High | All method signatures |
| 2.1.2 | Implement CLIProxyApiClient base | ⬜ Todo | 🔴 High | HttpClient setup, auth |
| 2.1.3 | Implement config endpoints | ⬜ Todo | 🔴 High | GET/PUT config |
| 2.1.4 | Implement auth file endpoints | ⬜ Todo | 🔴 High | List, upload, download, delete |
| 2.1.5 | Implement API key endpoints | ⬜ Todo | 🔴 High | Gemini, Claude, Codex |
| 2.1.6 | Implement OAuth endpoints | ⬜ Todo | 🔴 High | Auth URLs, status polling |
| 2.1.7 | Implement OpenAI compat endpoints | ⬜ Todo | 🟡 Medium | Provider management |
| 2.1.8 | Implement usage/logs endpoints | ⬜ Todo | 🟡 Medium | Statistics, logs |
| 2.1.9 | Add error handling/retry logic | ⬜ Todo | 🟡 Medium | Resilience |

### 2.2 Process Manager
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 2.2.1 | Create IProcessManager interface | ⬜ Todo | 🔴 High | Start, Stop, IsRunning |
| 2.2.2 | Implement ProcessManager base | ⬜ Todo | 🔴 High | Process lifecycle |
| 2.2.3 | Handle stdout/stderr capture | ⬜ Todo | 🟡 Medium | Log forwarding |
| 2.2.4 | Implement graceful shutdown | ⬜ Todo | 🟡 Medium | Signal handling |
| 2.2.5 | Add process health monitoring | ⬜ Todo | 🟡 Medium | Restart on crash |

### 2.3 Configuration Service
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 2.3.1 | Create app settings model | ⬜ Todo | 🔴 High | Local app config |
| 2.3.2 | Implement settings persistence | ⬜ Todo | 🔴 High | JSON file storage |
| 2.3.3 | Handle first-run setup | ⬜ Todo | 🟡 Medium | Copy bundled CLI |
| 2.3.4 | Implement CLI path resolution | ⬜ Todo | 🔴 High | Platform-specific paths |

---

## 🔷 Phase 3: Main Views

### 3.1 Login View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 3.1.1 | Create LoginView.axaml | ⬜ Todo | 🔴 High | Mode selection UI |
| 3.1.2 | Create LoginViewModel | ⬜ Todo | 🔴 High | Connection logic |
| 3.1.3 | Implement Local mode connection | ⬜ Todo | 🔴 High | Start bundled CLI |
| 3.1.4 | Implement Remote mode connection | ⬜ Todo | 🔴 High | URL + key validation |
| 3.1.5 | Add connection state handling | ⬜ Todo | 🔴 High | Loading, error states |
| 3.1.6 | Remember last connection settings | ⬜ Todo | 🟡 Medium | Persist to config |

### 3.2 Dashboard View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 3.2.1 | Create DashboardView.axaml | ⬜ Todo | 🔴 High | Main dashboard layout |
| 3.2.2 | Create DashboardViewModel | ⬜ Todo | 🔴 High | Data binding |
| 3.2.3 | Create ServerStatusCard control | ⬜ Todo | 🔴 High | Status + controls |
| 3.2.4 | Create QuickStatsPanel | ⬜ Todo | 🟡 Medium | Requests, tokens, etc |
| 3.2.5 | Create ProviderStatusGrid | ⬜ Todo | 🟡 Medium | Mini provider cards |
| 3.2.6 | Implement auto-refresh | ⬜ Todo | 🟡 Medium | Polling for updates |

### 3.3 Providers View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 3.3.1 | Create ProvidersView.axaml | ⬜ Todo | 🔴 High | Provider list layout |
| 3.3.2 | Create ProvidersViewModel | ⬜ Todo | 🔴 High | Provider data |
| 3.3.3 | Create ProviderCard control | ⬜ Todo | 🔴 High | Individual provider UI |
| 3.3.4 | Implement Gemini OAuth flow | ⬜ Todo | 🔴 High | Open browser, poll |
| 3.3.5 | Implement Claude OAuth flow | ⬜ Todo | 🔴 High | Same pattern |
| 3.3.6 | Implement Codex OAuth flow | ⬜ Todo | 🔴 High | Same pattern |
| 3.3.7 | Implement Qwen OAuth flow | ⬜ Todo | 🟡 Medium | Device flow |
| 3.3.8 | Implement iFlow OAuth flow | ⬜ Todo | 🟡 Medium | Same pattern |
| 3.3.9 | Show provider status/expiry | ⬜ Todo | 🔴 High | From auth files |

### 3.4 Auth Files View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 3.4.1 | Create AuthFilesView.axaml | ⬜ Todo | 🔴 High | File list + actions |
| 3.4.2 | Create AuthFilesViewModel | ⬜ Todo | 🔴 High | File operations |
| 3.4.3 | Implement file list display | ⬜ Todo | 🔴 High | DataGrid/ListView |
| 3.4.4 | Implement file upload | ⬜ Todo | 🔴 High | File picker dialog |
| 3.4.5 | Implement file download | ⬜ Todo | 🟡 Medium | Save file dialog |
| 3.4.6 | Implement file delete | ⬜ Todo | 🔴 High | Confirmation dialog |

---

## 🔷 Phase 4: Configuration Views

### 4.1 API Keys View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 4.1.1 | Create ApiKeysView.axaml | ⬜ Todo | 🔴 High | Tabbed layout |
| 4.1.2 | Create ApiKeysViewModel | ⬜ Todo | 🔴 High | All key types |
| 4.1.3 | Create GeminiKeysTab | ⬜ Todo | 🔴 High | Gemini key management |
| 4.1.4 | Create ClaudeKeysTab | ⬜ Todo | 🔴 High | Claude key management |
| 4.1.5 | Create CodexKeysTab | ⬜ Todo | 🔴 High | Codex key management |
| 4.1.6 | Create OpenAICompatTab | ⬜ Todo | 🔴 High | Provider management |
| 4.1.7 | Create AddEditKeyDialog | ⬜ Todo | 🔴 High | Reusable dialog |
| 4.1.8 | Implement CRUD operations | ⬜ Todo | 🔴 High | Add, edit, delete |

### 4.2 Settings View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 4.2.1 | Create SettingsView.axaml | ⬜ Todo | 🔴 High | Form layout |
| 4.2.2 | Create SettingsViewModel | ⬜ Todo | 🔴 High | All settings |
| 4.2.3 | Server settings section | ⬜ Todo | 🔴 High | Port, debug |
| 4.2.4 | Logging settings section | ⬜ Todo | 🟡 Medium | Log options |
| 4.2.5 | Proxy settings section | ⬜ Todo | 🟡 Medium | Proxy URL |
| 4.2.6 | Remote mgmt settings | ⬜ Todo | 🟡 Medium | Key, allow remote |
| 4.2.7 | Implement save/cancel | ⬜ Todo | 🔴 High | Persist changes |

---

## 🔷 Phase 5: Monitoring

### 5.1 Usage View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 5.1.1 | Create UsageView.axaml | ⬜ Todo | 🟡 Medium | Statistics layout |
| 5.1.2 | Create UsageViewModel | ⬜ Todo | 🟡 Medium | Data processing |
| 5.1.3 | Display request counts | ⬜ Todo | 🟡 Medium | By day/hour |
| 5.1.4 | Display token usage | ⬜ Todo | 🟡 Medium | By day/hour |
| 5.1.5 | Display by API/model | ⬜ Todo | 🟡 Medium | Breakdown tables |
| 5.1.6 | Add refresh button | ⬜ Todo | 🟡 Medium | Manual refresh |

### 5.2 Logs View
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 5.2.1 | Create LogsView.axaml | ⬜ Todo | 🟡 Medium | Log display |
| 5.2.2 | Create LogsViewModel | ⬜ Todo | 🟡 Medium | Log fetching |
| 5.2.3 | Implement log streaming | ⬜ Todo | 🟡 Medium | Polling with after param |
| 5.2.4 | Add log level filtering | ⬜ Todo | 🟡 Medium | Filter controls |
| 5.2.5 | Add search functionality | ⬜ Todo | 🟢 Low | Text search |
| 5.2.6 | Add clear logs button | ⬜ Todo | 🟢 Low | DELETE /logs |

### 5.3 System Tray
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 5.3.1 | Create TrayService | ⬜ Todo | 🟡 Medium | Tray management |
| 5.3.2 | Implement tray icon | ⬜ Todo | 🟡 Medium | Platform-specific |
| 5.3.3 | Create tray menu | ⬜ Todo | 🟡 Medium | Show, Start/Stop, Quit |
| 5.3.4 | Handle window minimize to tray | ⬜ Todo | 🟡 Medium | Close -> hide |
| 5.3.5 | Show status in tray tooltip | ⬜ Todo | 🟢 Low | Running/Stopped |

---

## 🔷 Phase 6: Packaging

### 6.1 CLI Bundling
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 6.1.1 | Download macOS CLI binary | ⬜ Todo | 🟡 Medium | arm64 + x64 |
| 6.1.2 | Download Windows CLI binary | ⬜ Todo | 🟡 Medium | x64 + arm64 |
| 6.1.3 | Add binaries to Assets | ⬜ Todo | 🟡 Medium | Copy to output |
| 6.1.4 | First-run binary extraction | ⬜ Todo | 🟡 Medium | Copy to app data |

### 6.2 macOS Packaging
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 6.2.1 | Create Info.plist | ⬜ Todo | 🟡 Medium | App metadata |
| 6.2.2 | Create app icon (.icns) | ⬜ Todo | 🟢 Low | Icon design |
| 6.2.3 | Configure app bundle | ⬜ Todo | 🟡 Medium | .app structure |
| 6.2.4 | Create DMG installer | ⬜ Todo | 🟢 Low | Distribution |

### 6.3 Windows Packaging
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 6.3.1 | Create app icon (.ico) | ⬜ Todo | 🟢 Low | Icon design |
| 6.3.2 | Configure MSIX/MSI | ⬜ Todo | 🟢 Low | Installer |
| 6.3.3 | Test on Windows | ⬜ Todo | 🟢 Low | Validation |

### 6.4 CI/CD
| ID | Task | Status | Priority | Notes |
|----|------|--------|----------|-------|
| 6.4.1 | Create build workflow | ⬜ Todo | 🟢 Low | GitHub Actions |
| 6.4.2 | Create release workflow | ⬜ Todo | 🟢 Low | Auto-release |
| 6.4.3 | Add version bumping | ⬜ Todo | 🟢 Low | Semantic versioning |

---

## 📝 Legend

### Status
- ⬜ Todo - Not started
- 🔄 In Progress - Currently working on
- ✅ Done - Completed
- ⏸️ Blocked - Waiting on dependency
- ❌ Cancelled - No longer needed

### Priority
- 🔴 High - Critical path, do first
- 🟡 Medium - Important, do soon
- 🟢 Low - Nice to have, do later

---

## 📅 Daily Log

### Day 1 - December 19, 2025
- [ ] Created project documentation (PLAN.md, TASKS.md)
- [ ] Install .NET 8 SDK
- [ ] Create initial project structure
- [ ] Configure SukiUI theme

---

*Last Updated: December 19, 2025*
