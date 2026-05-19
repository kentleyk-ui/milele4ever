import { setTimeout as delay } from "node:timers/promises"
import { appendFile, mkdir, readFile, stat } from "node:fs/promises"
import path from "node:path"

export type MonarkLogType = "error" | "info" | "debug" | "request" | "response" | "auth"

export type MonarkLogEntry = {
  id: string
  timestamp: string
  type: MonarkLogType
  data: Record<string, unknown>
  env: string
}

class MonarkLogger {
  private readonly logEndpoint: string | null
  private readonly maxBufferSize: number
  private readonly logFilePath: string
  private readonly logDirPath: string
  private readonly buffer: MonarkLogEntry[] = []
  private ensureDirPromise: Promise<void> | null = null

  constructor() {
    this.logEndpoint = process.env.MONARK_LOG_ENDPOINT ?? null
    const parsed = Number.parseInt(process.env.MONARK_LOG_BUFFER_SIZE ?? "200", 10)
    this.maxBufferSize = Number.isFinite(parsed) ? Math.max(10, Math.min(parsed, 1000)) : 200
    this.logDirPath = process.env.MONARK_LOG_DIR
      ? path.resolve(process.env.MONARK_LOG_DIR)
      : path.resolve(process.cwd(), "monitoring", "logs")
    this.logFilePath = process.env.MONARK_LOG_FILE
      ? path.resolve(process.env.MONARK_LOG_FILE)
      : path.join(this.logDirPath, "monark.log")
  }

  private async ensureLogDir() {
    if (!this.ensureDirPromise) {
      this.ensureDirPromise = mkdir(this.logDirPath, { recursive: true }).then(() => undefined)
    }
    try {
      await this.ensureDirPromise
    } catch (error) {
      this.ensureDirPromise = null
      throw error
    }
  }

  private async saveToFile(logEntry: MonarkLogEntry) {
    try {
      await this.ensureLogDir()
      await appendFile(this.logFilePath, `${JSON.stringify(logEntry)}\n`, "utf8")
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erreur inconnue"
      console.error("Erreur écriture log Monark:", message)
    }
  }

  async log(type: MonarkLogType, data: Record<string, unknown>) {
    const logEntry: MonarkLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      type,
      data,
      env: process.env.NODE_ENV ?? "development",
    }

    this.buffer.push(logEntry)
    if (this.buffer.length > this.maxBufferSize) {
      this.buffer.shift()
    }

    await this.saveToFile(logEntry)

    if (this.logEndpoint) {
      const controller = new AbortController()
      const timeout = delay(2000).then(() => controller.abort())
      try {
        await fetch(this.logEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(logEntry),
          signal: controller.signal,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erreur inconnue"
        console.error("Erreur envoi log Monark:", message)
      } finally {
        controller.abort()
        void timeout.catch(() => {})
      }
    }

    console.log(`[MONARK ${type.toUpperCase()}]`, JSON.stringify(logEntry))
  }

  getLogs(options?: { limit?: number; type?: MonarkLogType; since?: string | null }) {
    const safeLimit = Math.max(1, Math.min(options?.limit ?? 50, this.maxBufferSize))
    const type = options?.type
    const since = options?.since ? new Date(options.since) : null

    let source = [...this.buffer]
    if (type) {
      source = source.filter((entry) => entry.type === type)
    }
    if (since && !Number.isNaN(since.getTime())) {
      source = source.filter((entry) => new Date(entry.timestamp) >= since)
    }

    return source.slice(-safeLimit).reverse()
  }

  async getPersistedLogs(options?: { limit?: number; type?: MonarkLogType; since?: string | null }) {
    const safeLimit = Math.max(1, Math.min(options?.limit ?? 50, 1000))
    const type = options?.type
    const since = options?.since ? new Date(options.since) : null

    try {
      const content = await readFile(this.logFilePath, "utf8")
      const parsed = content
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .map((line) => {
          try {
            return JSON.parse(line) as MonarkLogEntry
          } catch {
            return null
          }
        })
        .filter((entry): entry is MonarkLogEntry => Boolean(entry))

      let source = parsed
      if (type) {
        source = source.filter((entry) => entry.type === type)
      }
      if (since && !Number.isNaN(since.getTime())) {
        source = source.filter((entry) => new Date(entry.timestamp) >= since)
      }

      return source.slice(-safeLimit).reverse()
    } catch {
      return [] as MonarkLogEntry[]
    }
  }

  async getStats() {
    const counts: Record<MonarkLogType, number> = {
      error: 0,
      info: 0,
      debug: 0,
      request: 0,
      response: 0,
      auth: 0,
    }

    for (const entry of this.buffer) {
      counts[entry.type] += 1
    }

    let fileSizeBytes = 0
    let persistedLines = 0
    try {
      const [fileStats, fileContent] = await Promise.all([
        stat(this.logFilePath),
        readFile(this.logFilePath, "utf8"),
      ])
      fileSizeBytes = fileStats.size
      persistedLines = fileContent.split("\n").filter((line) => line.trim().length > 0).length
    } catch {
      // Le fichier peut ne pas exister encore (premier démarrage / environnement serverless).
    }

    return {
      total: this.buffer.length,
      byType: counts,
      hasWebhook: Boolean(this.logEndpoint),
      maxBufferSize: this.maxBufferSize,
      logFilePath: this.logFilePath,
      fileSizeBytes,
      persistedLines,
    }
  }

  clearBuffer() {
    const cleared = this.buffer.length
    this.buffer.length = 0
    return { cleared }
  }
}

type GlobalWithMonarkLogger = typeof globalThis & {
  __monarkLogger?: MonarkLogger
}

const globalRef = globalThis as GlobalWithMonarkLogger

export const monarkLogger = globalRef.__monarkLogger ?? new MonarkLogger()
if (!globalRef.__monarkLogger) {
  globalRef.__monarkLogger = monarkLogger
}
