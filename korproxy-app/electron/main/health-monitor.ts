import { EventEmitter } from 'events'
import http from 'http'
import type { HealthState, HealthStatus } from '../common/ipc-types'
import type { ProxySidecar } from './sidecar'
import { logManager } from './log-manager'

const HEALTH_CHECK_INTERVAL = 10_000 // 10 seconds
const GRACE_PERIOD = 5_000 // 5 seconds after start
const HEALTH_CHECK_TIMEOUT = 2_000 // 2 second timeout
const LATENCY_THRESHOLD = 500 // 500ms
const MAX_RESTART_ATTEMPTS = 3
const FAILURE_THRESHOLD = 3 // consecutive failures before unreachable

export interface HealthMonitorEvents {
  stateChange: (status: HealthStatus) => void
}

export class HealthMonitor extends EventEmitter {
  private sidecar: ProxySidecar
  private port: number
  private state: HealthState = 'stopped'
  private lastCheck: string | null = null
  private consecutiveFailures = 0
  private restartAttempts = 0
  private pollTimer: NodeJS.Timeout | null = null
  private graceTimer: NodeJS.Timeout | null = null
  private isStarting = false

  constructor(sidecar: ProxySidecar, port: number) {
    super()
    this.sidecar = sidecar
    this.port = port
  }

  setPort(port: number): void {
    this.port = port
  }

  getStatus(): HealthStatus {
    return {
      state: this.state,
      lastCheck: this.lastCheck,
      consecutiveFailures: this.consecutiveFailures,
      restartAttempts: this.restartAttempts,
    }
  }

  private setState(newState: HealthState): void {
    if (this.state === newState) return
    
    const oldState = this.state
    this.state = newState

    logManager.info(`Health state transition: ${oldState} → ${newState}`, {
      consecutiveFailures: this.consecutiveFailures,
      restartAttempts: this.restartAttempts,
    }, 'health-monitor')

    this.emit('stateChange', this.getStatus())
  }

  async start(): Promise<void> {
    if (this.isStarting) return
    this.isStarting = true

    this.stop()
    this.setState('starting')
    this.consecutiveFailures = 0

    try {
      await this.sidecar.start()
    } catch (error) {
      this.isStarting = false
      this.setState('failed')
      logManager.error('Failed to start sidecar', { 
        error: error instanceof Error ? error.message : String(error) 
      }, 'health-monitor')
      return
    }

    this.graceTimer = setTimeout(() => {
      this.graceTimer = null
      this.isStarting = false
      this.startPolling()
    }, GRACE_PERIOD)
  }

  stop(): void {
    this.isStarting = false
    
    if (this.graceTimer) {
      clearTimeout(this.graceTimer)
      this.graceTimer = null
    }
    
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    if (this.sidecar.isRunning()) {
      this.sidecar.stop()
    }

    this.setState('stopped')
    this.consecutiveFailures = 0
    this.restartAttempts = 0
  }

  resetRestartAttempts(): void {
    this.restartAttempts = 0
  }

  private startPolling(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer)
    }

    this.performHealthCheck()
    this.pollTimer = setInterval(() => this.performHealthCheck(), HEALTH_CHECK_INTERVAL)
  }

  private async performHealthCheck(): Promise<void> {
    if (this.state === 'stopped' || this.state === 'failed') return

    const startTime = Date.now()
    
    try {
      const result = await this.checkHealth()
      const latency = Date.now() - startTime
      this.lastCheck = new Date().toISOString()

      if (result.success) {
        if (latency > LATENCY_THRESHOLD) {
          this.setState('degraded')
          logManager.warn(`Health check slow: ${latency}ms`, { latency }, 'health-monitor')
        } else {
          this.consecutiveFailures = 0
          this.restartAttempts = 0
          this.setState('healthy')
        }
      } else {
        this.handleHealthCheckFailure(result.error)
      }
    } catch (error) {
      this.lastCheck = new Date().toISOString()
      this.handleHealthCheckFailure(error instanceof Error ? error.message : 'Unknown error')
    }
  }

  private handleHealthCheckFailure(error: string | undefined): void {
    this.consecutiveFailures++
    
    logManager.warn(`Health check failed (${this.consecutiveFailures}/${FAILURE_THRESHOLD})`, {
      error,
      consecutiveFailures: this.consecutiveFailures,
    }, 'health-monitor')

    if (this.consecutiveFailures < FAILURE_THRESHOLD) {
      this.setState('degraded')
    } else {
      this.setState('unreachable')
      this.attemptRestart()
    }
  }

  private async attemptRestart(): Promise<void> {
    if (this.restartAttempts >= MAX_RESTART_ATTEMPTS) {
      this.setState('failed')
      logManager.error('Max restart attempts reached, proxy failed', {
        restartAttempts: this.restartAttempts,
      }, 'health-monitor')
      
      if (this.pollTimer) {
        clearInterval(this.pollTimer)
        this.pollTimer = null
      }
      return
    }

    this.restartAttempts++
    logManager.info(`Attempting restart (${this.restartAttempts}/${MAX_RESTART_ATTEMPTS})`, {}, 'health-monitor')

    this.setState('starting')
    this.consecutiveFailures = 0

    if (this.pollTimer) {
      clearInterval(this.pollTimer)
      this.pollTimer = null
    }

    try {
      await this.sidecar.restart()
      
      this.graceTimer = setTimeout(() => {
        this.graceTimer = null
        this.startPolling()
      }, GRACE_PERIOD)
    } catch (error) {
      logManager.error('Restart failed', {
        error: error instanceof Error ? error.message : String(error),
      }, 'health-monitor')
      this.attemptRestart()
    }
  }

  private checkHealth(): Promise<{ success: boolean; error?: string }> {
    return new Promise((resolve) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: this.port,
          path: '/v1/diagnostics/health',
          method: 'GET',
          timeout: HEALTH_CHECK_TIMEOUT,
        },
        (res) => {
          let data = ''
          res.on('data', (chunk) => (data += chunk))
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              resolve({ success: true })
            } else {
              resolve({ success: false, error: `HTTP ${res.statusCode}` })
            }
          })
        }
      )

      req.on('error', (error) => {
        resolve({ success: false, error: error.message })
      })

      req.on('timeout', () => {
        req.destroy()
        resolve({ success: false, error: 'Timeout' })
      })

      req.end()
    })
  }
}
