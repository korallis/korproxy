import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { app } from 'electron'
import { join } from 'path'
import { existsSync } from 'fs'

export interface SidecarEvents {
  log: (data: { type: 'stdout' | 'stderr'; message: string }) => void
  started: () => void
  stopped: (code: number | null) => void
  error: (error: Error) => void
}

export class ProxySidecar extends EventEmitter {
  private process: ChildProcess | null = null
  private autoRestart: boolean = true
  private restartAttempts: number = 0
  private maxRestartAttempts: number = 3
  private port: number = 1337

  getBinaryPath(): string {
    const platform = process.platform
    const arch = process.arch

    let binaryName = 'korproxy'
    if (platform === 'win32') {
      binaryName = 'korproxy.exe'
    }

    let platformArch: string
    if (platform === 'darwin') {
      platformArch = arch === 'arm64' ? 'darwin-arm64' : 'darwin-x64'
    } else if (platform === 'win32') {
      platformArch = 'win32-x64'
    } else {
      platformArch = `${platform}-${arch}`
    }

    if (app.isPackaged) {
      return join(process.resourcesPath, 'binaries', binaryName)
    }

    return join(app.getAppPath(), 'resources', 'binaries', platformArch, binaryName)
  }

  getConfigPath(): string {
    return join(app.getPath('userData'), 'config.yaml')
  }

  isRunning(): boolean {
    return this.process !== null && this.process.exitCode === null
  }

  getPort(): number {
    return this.port
  }

  async start(): Promise<void> {
    if (this.isRunning()) {
      return
    }

    const binaryPath = this.getBinaryPath()

    if (!existsSync(binaryPath)) {
      const error = new Error(`Binary not found at: ${binaryPath}`)
      this.emit('error', error)
      throw error
    }

    const configPath = this.getConfigPath()
    const args = ['--config', configPath, '--port', String(this.port)]

    try {
      this.process = spawn(binaryPath, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      })

      this.process.stdout?.on('data', (data: Buffer) => {
        const message = data.toString().trim()
        if (message) {
          this.emit('log', { type: 'stdout', message })
        }
      })

      this.process.stderr?.on('data', (data: Buffer) => {
        const message = data.toString().trim()
        if (message) {
          this.emit('log', { type: 'stderr', message })
        }
      })

      this.process.on('error', (error: Error) => {
        this.emit('error', error)
        this.handleProcessExit(null)
      })

      this.process.on('exit', (code: number | null) => {
        this.emit('stopped', code)
        this.handleProcessExit(code)
      })

      this.restartAttempts = 0
      this.emit('started')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.emit('error', err)
      throw err
    }
  }

  private handleProcessExit(code: number | null): void {
    this.process = null

    if (this.autoRestart && code !== 0 && this.restartAttempts < this.maxRestartAttempts) {
      this.restartAttempts++
      const delay = Math.min(1000 * Math.pow(2, this.restartAttempts - 1), 10000)
      
      setTimeout(() => {
        this.start().catch((error) => {
          this.emit('error', error)
        })
      }, delay)
    }
  }

  stop(): void {
    this.autoRestart = false

    if (this.process) {
      if (process.platform === 'win32') {
        spawn('taskkill', ['/pid', String(this.process.pid), '/f', '/t'])
      } else {
        this.process.kill('SIGTERM')

        setTimeout(() => {
          if (this.process && this.process.exitCode === null) {
            this.process.kill('SIGKILL')
          }
        }, 5000)
      }
    }
  }

  async restart(): Promise<void> {
    this.autoRestart = false
    this.stop()

    await new Promise<void>((resolve) => {
      const checkStopped = (): void => {
        if (!this.isRunning()) {
          resolve()
        } else {
          setTimeout(checkStopped, 100)
        }
      }
      checkStopped()
    })

    this.autoRestart = true
    this.restartAttempts = 0
    await this.start()
  }

  setAutoRestart(enabled: boolean): void {
    this.autoRestart = enabled
  }
}

export const proxySidecar = new ProxySidecar()
