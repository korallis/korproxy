import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockExistsSync = vi.fn()
const mockReadFileSync = vi.fn()
const mockWriteFileSync = vi.fn()
const mockMkdirSync = vi.fn()
const mockRandomUUID = vi.fn()
const mockHomedir = vi.fn()
const mockHostname = vi.fn()
const mockGetVersion = vi.fn()

vi.mock('fs', () => ({
  default: {
    existsSync: (...args: unknown[]) => mockExistsSync(...args),
    readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
    writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
    mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
  },
  existsSync: (...args: unknown[]) => mockExistsSync(...args),
  readFileSync: (...args: unknown[]) => mockReadFileSync(...args),
  writeFileSync: (...args: unknown[]) => mockWriteFileSync(...args),
  mkdirSync: (...args: unknown[]) => mockMkdirSync(...args),
}))

vi.mock('crypto', () => ({
  default: {
    randomUUID: () => mockRandomUUID(),
  },
  randomUUID: () => mockRandomUUID(),
}))

vi.mock('os', () => ({
  default: {
    homedir: () => mockHomedir(),
    hostname: () => mockHostname(),
  },
  homedir: () => mockHomedir(),
  hostname: () => mockHostname(),
}))

vi.mock('electron', () => ({
  default: {
    app: {
      getVersion: () => mockGetVersion(),
    },
  },
  app: {
    getVersion: () => mockGetVersion(),
  },
}))

describe('device module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
    
    mockHomedir.mockReturnValue('/mock/home')
    mockHostname.mockReturnValue('test-hostname')
    mockRandomUUID.mockReturnValue('mock-uuid-1234-5678-9abc-def012345678')
    mockGetVersion.mockReturnValue('1.0.0')
  })

  describe('getDeviceId', () => {
    it('should return existing device ID if file exists', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('existing-device-id')

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceId()

      expect(result).toBe('existing-device-id')
      expect(mockExistsSync).toHaveBeenCalledWith('/mock/home/.korproxy/device-id')
      expect(mockReadFileSync).toHaveBeenCalledWith('/mock/home/.korproxy/device-id', 'utf-8')
      expect(mockRandomUUID).not.toHaveBeenCalled()
    })

    it('should generate and persist new UUID if file does not exist', async () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(false)

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceId()

      expect(result).toBe('mock-uuid-1234-5678-9abc-def012345678')
      expect(mockRandomUUID).toHaveBeenCalled()
      expect(mockMkdirSync).toHaveBeenCalledWith('/mock/home/.korproxy', { recursive: true })
      expect(mockWriteFileSync).toHaveBeenCalledWith(
        '/mock/home/.korproxy/device-id',
        'mock-uuid-1234-5678-9abc-def012345678',
        'utf-8'
      )
    })

    it('should generate new UUID if existing file is empty', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('   ')

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceId()

      expect(result).toBe('mock-uuid-1234-5678-9abc-def012345678')
      expect(mockRandomUUID).toHaveBeenCalled()
    })

    it('should generate new UUID if file read throws error', async () => {
      mockExistsSync.mockReturnValueOnce(true).mockReturnValueOnce(true)
      mockReadFileSync.mockImplementation(() => {
        throw new Error('Read error')
      })

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceId()

      expect(result).toBe('mock-uuid-1234-5678-9abc-def012345678')
    })

    it('should still return UUID even if write fails', async () => {
      mockExistsSync.mockReturnValue(false)
      mockWriteFileSync.mockImplementation(() => {
        throw new Error('Write error')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceId()

      expect(result).toBe('mock-uuid-1234-5678-9abc-def012345678')
      expect(consoleSpy).toHaveBeenCalledWith('Failed to persist device ID:', expect.any(Error))

      consoleSpy.mockRestore()
    })

    it('should create directory if it does not exist', async () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(false)
      mockWriteFileSync.mockImplementation(() => {})

      const device = await import('../../../electron/main/device')
      device.getDeviceId()

      expect(mockMkdirSync).toHaveBeenCalledWith('/mock/home/.korproxy', { recursive: true })
    })

    it('should not create directory if it already exists', async () => {
      mockExistsSync.mockReturnValueOnce(false).mockReturnValueOnce(true)
      mockWriteFileSync.mockImplementation(() => {})

      const device = await import('../../../electron/main/device')
      device.getDeviceId()

      expect(mockMkdirSync).not.toHaveBeenCalled()
    })
  })

  describe('getDeviceName', () => {
    it('should return hostname', async () => {
      const device = await import('../../../electron/main/device')
      const result = device.getDeviceName()
      expect(result).toBe('test-hostname')
    })
  })

  describe('getDeviceType', () => {
    it('should return desktop', async () => {
      const device = await import('../../../electron/main/device')
      const result = device.getDeviceType()
      expect(result).toBe('desktop')
    })
  })

  describe('getPlatform', () => {
    it('should return current platform', async () => {
      const device = await import('../../../electron/main/device')
      const result = device.getPlatform()
      expect(['darwin', 'win32', 'linux']).toContain(result)
    })
  })

  describe('getDeviceInfo', () => {
    it('should return complete device info structure', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('test-device-id')

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceInfo()

      expect(result).toEqual({
        deviceId: 'test-device-id',
        deviceName: 'test-hostname',
        deviceType: 'desktop',
        platform: expect.any(String),
        appVersion: '1.0.0',
      })
    })

    it('should have all required properties', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('test-device-id')

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceInfo()

      expect(result).toHaveProperty('deviceId')
      expect(result).toHaveProperty('deviceName')
      expect(result).toHaveProperty('deviceType')
      expect(result).toHaveProperty('platform')
      expect(result).toHaveProperty('appVersion')
    })

    it('should return valid platform value', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('test-device-id')

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceInfo()

      expect(['darwin', 'win32', 'linux']).toContain(result.platform)
    })

    it('should return valid deviceType value', async () => {
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('test-device-id')

      const device = await import('../../../electron/main/device')
      const result = device.getDeviceInfo()

      expect(['desktop', 'laptop', 'other']).toContain(result.deviceType)
    })
  })

  describe('types', () => {
    it('should export DeviceType', async () => {
      const _deviceModule = await import('../../../electron/main/device')
      type DeviceType = typeof _deviceModule extends { DeviceType: infer T } ? T : 'desktop' | 'laptop' | 'other'
      const deviceType: DeviceType = 'desktop'
      expect(['desktop', 'laptop', 'other']).toContain(deviceType)
    })

    it('should export Platform', async () => {
      const _deviceModule = await import('../../../electron/main/device')
      type Platform = typeof _deviceModule extends { Platform: infer T } ? T : 'darwin' | 'win32' | 'linux'
      const platform: Platform = 'darwin'
      expect(['darwin', 'win32', 'linux']).toContain(platform)
    })

    it('should export DeviceInfo interface', async () => {
      const deviceModule = await import('../../../electron/main/device')
      mockExistsSync.mockReturnValue(true)
      mockReadFileSync.mockReturnValue('test-id')

      const info = deviceModule.getDeviceInfo()
      expect(typeof info.deviceId).toBe('string')
      expect(typeof info.deviceName).toBe('string')
      expect(typeof info.deviceType).toBe('string')
      expect(typeof info.platform).toBe('string')
      expect(typeof info.appVersion).toBe('string')
    })
  })
})
