# Build Resources

This directory contains resources for building KorProxy installers.

## Icons

- `icon.icns` - macOS app icon
- `icon.ico` - Windows app icon  
- `icon.png` - Linux app icon
- `entitlements.mac.plist` - macOS entitlements for hardened runtime

## Code Signing

### macOS

macOS builds require code signing and notarization for distribution outside the App Store.

**Required GitHub Secrets:**

| Secret | Description |
|--------|-------------|
| `APPLE_ID` | Apple Developer account email (leebarry84@icloud.com) |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password from appleid.apple.com |
| `APPLE_TEAM_ID` | Apple Developer Team ID (PJATAD3RS8) |
| `CSC_LINK` | Base64-encoded Developer ID Application certificate (.p12) |
| `CSC_KEY_PASSWORD` | Password for the certificate |

**Local Build with Signing:**

```bash
export APPLE_ID="leebarry84@icloud.com"
export APPLE_APP_SPECIFIC_PASSWORD="your-app-specific-password"
export APPLE_TEAM_ID="PJATAD3RS8"
export CSC_LINK="/path/to/certificate.p12"  # Or base64 string
export CSC_KEY_PASSWORD="certificate-password"

npm run package:mac
```

**Local Build without Signing (development):**

```bash
npm run package:mac
# Will skip notarization due to missing credentials
```

### Windows

Windows builds require code signing to avoid "Unknown Publisher" warnings.

**Option 1: Standard Code Signing Certificate (.pfx)**

| Secret | Description |
|--------|-------------|
| `WIN_CSC_LINK` | Path to .pfx file or base64-encoded certificate |
| `WIN_CSC_KEY_PASSWORD` | Certificate password |

**Option 2: SSL.com eSigner (EV Certificate)**

For EV certificates, use SSL.com's CodeSignTool. Set up a custom sign hook in electron-builder.

| Secret | Description |
|--------|-------------|
| `SSL_COM_USERNAME` | SSL.com account username |
| `SSL_COM_PASSWORD` | SSL.com account password |
| `SSL_COM_TOTP_SECRET` | TOTP secret for 2FA |
| `SSL_COM_CREDENTIAL_ID` | Credential ID for signing |

### Linux

Linux builds do not require code signing.

## Building

```bash
# Build for current platform
npm run package:mac    # macOS
npm run package:win    # Windows (from Windows or WSL)

# Build all platforms (from macOS)
npm run package:all
```

## Entitlements

The `entitlements.mac.plist` file grants the following capabilities:

- **JIT compilation** - Required for Electron
- **Unsigned executable memory** - Required for Electron/V8
- **Library validation disabled** - Required for native modules
- **Network client/server** - Required for proxy functionality
- **Keychain access** - For storing user credentials securely
