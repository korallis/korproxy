## Tech stack

### Framework & Runtime
- **Application Framework:** Avalonia UI (desktop)
- **Language/Runtime:** C# on .NET 8
- **Package Manager:** NuGet (dotnet)

### Frontend
- **JavaScript Framework:** N/A (desktop XAML UI)
- **CSS Framework:** Avalonia styling/XAML themes
- **UI Components:** FluentAvaloniaUI, Avalonia.Themes.Fluent

### Database & Storage
- **Database:** Convex (existing KorProxy backend)
- **ORM/Query Builder:** Convex query API
- **Caching:** N/A

### Testing & Quality
- **Test Framework:** TBD (follow existing .NET test tooling)
- **Linting/Formatting:** dotnet format (if enabled)

### Deployment & Infrastructure
- **Hosting:** Convex for backend services
- **CI/CD:** GitHub Actions
- **Local Proxy Runtime:** CLIProxyAPI (Go binaries bundled per platform)

### Third-Party Services
- **Authentication:** Convex Auth (email/password)
- **Email:** N/A
- **Monitoring:** N/A
