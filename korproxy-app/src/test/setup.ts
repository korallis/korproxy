import '@testing-library/jest-dom/vitest'
import { vi, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

afterEach(() => {
  cleanup()
})

const mockKorproxyAPI = {
  proxy: {
    start: vi.fn().mockResolvedValue({ success: true }),
    stop: vi.fn().mockResolvedValue({ success: true }),
    status: vi.fn().mockResolvedValue({ running: false, port: 1337 }),
    getStatus: vi.fn().mockResolvedValue({ running: false, port: 1337 }),
    restart: vi.fn().mockResolvedValue({ success: true }),
    onLog: vi.fn().mockReturnValue(() => {}),
    onStatusChange: vi.fn().mockReturnValue(() => {}),
  },
  config: {
    get: vi.fn().mockResolvedValue({ success: true, content: '' }),
    set: vi.fn().mockResolvedValue({ success: true }),
  },
  app: {
    minimize: vi.fn().mockResolvedValue(undefined),
    maximize: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    isMaximized: vi.fn().mockResolvedValue(false),
    platform: 'darwin' as NodeJS.Platform,
    getSettings: vi.fn().mockResolvedValue({
      port: 1337,
      autoStart: false,
      minimizeToTray: false,
      theme: 'dark',
    }),
    setSetting: vi.fn().mockResolvedValue({ success: true }),
  },
  auth: {
    startOAuth: vi.fn().mockResolvedValue({ success: true }),
    listAccounts: vi.fn().mockResolvedValue([]),
    removeAccount: vi.fn().mockResolvedValue({ success: true }),
    getToken: vi.fn().mockResolvedValue({ success: false, error: 'No token' }),
    refreshToken: vi.fn().mockResolvedValue({ success: false, error: 'No token' }),
  },
  updater: {
    check: vi.fn().mockResolvedValue({ status: 'not-available' }),
    download: vi.fn().mockResolvedValue({ status: 'not-available' }),
    install: vi.fn().mockResolvedValue(undefined),
    getStatus: vi.fn().mockResolvedValue({ status: 'not-available' }),
    onStatus: vi.fn().mockReturnValue(() => {}),
  },
}

Object.defineProperty(globalThis, 'korproxy', {
  value: mockKorproxyAPI,
  writable: true,
})

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'korproxy', {
    value: mockKorproxyAPI,
    writable: true,
  })
}

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class ResizeObserverMock {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)

export { mockKorproxyAPI }
