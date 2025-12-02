/**
 * macOS Notarization Script for Electron Builder
 *
 * This script is called by electron-builder after signing the app.
 * It submits the app to Apple for notarization using notarytool.
 *
 * Required environment variables:
 * - APPLE_ID: Apple Developer account email (leebarry84@icloud.com)
 * - APPLE_APP_SPECIFIC_PASSWORD: App-specific password from appleid.apple.com
 * - APPLE_TEAM_ID: Apple Developer Team ID (PJATAD3RS8)
 */

const { notarize } = require('@electron/notarize')
const path = require('node:path')

exports.default = async function notarizing(context) {
  const { electronPlatformName, appOutDir } = context

  // Only notarize macOS builds
  if (electronPlatformName !== 'darwin') {
    console.log('Skipping notarization - not macOS')
    return
  }

  // Skip in development/local builds without credentials
  const applePassword = process.env.APPLE_APP_SPECIFIC_PASSWORD || process.env.APPLE_ID_PASSWORD
  if (!process.env.APPLE_ID || !applePassword) {
    console.log('Skipping notarization - missing Apple credentials')
    console.log('Set APPLE_ID and APPLE_APP_SPECIFIC_PASSWORD env vars for notarization')
    return
  }

  const appName = context.packager.appInfo.productFilename
  const appPath = path.join(appOutDir, `${appName}.app`)

  console.log(`Notarizing ${appPath}...`)

  try {
    await notarize({
      tool: 'notarytool',
      appPath,
      appleId: process.env.APPLE_ID,
      appleIdPassword: applePassword,
      teamId: process.env.APPLE_TEAM_ID || 'PJATAD3RS8',
    })
    console.log('Notarization complete!')
  } catch (error) {
    console.error('Notarization failed:', error)
    throw error
  }
}
