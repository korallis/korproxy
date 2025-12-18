import { ipcMain } from 'electron'

export interface UTMParams {
  source?: string
  medium?: string
  campaign?: string
}

class DeepLinkStore {
  private utm: UTMParams | null = null

  constructor() {
    ipcMain.handle('deeplink:get-utm', () => this.getUtm())
    ipcMain.handle('deeplink:clear-utm', () => this.clearUtm())
  }

  setUtm(utm: UTMParams): void {
    this.utm = utm
  }

  getUtm(): UTMParams | null {
    return this.utm
  }

  clearUtm(): void {
    this.utm = null
  }
}

export const deepLinkStore = new DeepLinkStore()
