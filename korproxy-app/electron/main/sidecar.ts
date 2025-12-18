import { spawn, ChildProcess } from 'child_process'
import { EventEmitter } from 'events'
import { existsSync } from 'fs'
import { getBinaryPath, getConfigPath, ensureConfigExists } from './config'

export interface SidecarEvents {
  log: (data: { type: 'stdout' | 'stderr'; message: string }) => void
  started: () => void
  stopped: (code: number | null) => void
  error: (error: Error) => void
}

export class ProxySidecar extends EventEmitter {
  private process: ChildProcess | null = null
  private port: number = 1337

  setPort(port: number): void {
    this.port = port
  }

  getBinaryPath(): string {
    return getBinaryPath()
  }

  getConfigPath(): string {
    return getConfigPath()
  }

  ensureConfigExists(): void {
    ensureConfigExists(this.port)
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

    this.ensureConfigExists()
    const configPath = this.getConfigPath()
    const args = ['-config', configPath]

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
        this.process = null
      })

      this.process.on('exit', (code: number | null) => {
        this.emit('stopped', code)
        this.process = null
      })

      this.emit('started')
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      this.emit('error', err)
      throw err
    }
  }

  stop(): void {

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

    await this.start()
  }
}

export const proxySidecar = new ProxySidecar()
