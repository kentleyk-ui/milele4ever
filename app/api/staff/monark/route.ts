import { NextRequest, NextResponse } from "next/server"
import { writeFile } from "node:fs/promises"
import { createClient } from "@supabase/supabase-js"

import { POST as malaikaPOST } from "../malaika/route"
import { buildRequestDebug, buildResponseDebug, withMonarkDebug } from "@/lib/server/monarkDebug"
import { monarkLogger, type MonarkLogType } from "@/lib/server/monarkLogger"

const KENT_EMAIL = "kentleyk@gmail.com"

function serviceClient() {
	return createClient(
		process.env.NEXT_PUBLIC_SUPABASE_URL!,
		process.env.SUPABASE_SERVICE_ROLE_KEY!
	)
}

async function verifyCaller(token: string): Promise<boolean> {
	try {
		const db = serviceClient()
		const { data } = await db.auth.getUser(token)
		return data.user?.email === KENT_EMAIL
	} catch {
		return false
	}
}

function getMonarkSecret(req: NextRequest) {
	return req.headers.get("x-monark-secret") ?? req.nextUrl.searchParams.get("secret")
}

async function isAuthorizedToReadLogs(req: NextRequest) {
	const configuredSecret = process.env.MONARK_LOG_SECRET
	const providedSecret = getMonarkSecret(req)
	if (configuredSecret && providedSecret === configuredSecret) return true

	const token = getBearerToken(req)
	if (!token) return false
	return verifyCaller(token)
}

function toPositiveInt(value: string | null, fallback: number, min: number, max: number) {
	const parsed = Number.parseInt(value ?? "", 10)
	if (!Number.isFinite(parsed)) return fallback
	return Math.max(min, Math.min(parsed, max))
}

function parseLogType(raw: string | null): MonarkLogType | undefined {
	if (!raw) return undefined
	if (raw === "error" || raw === "info" || raw === "debug" || raw === "request" || raw === "response" || raw === "auth") {
		return raw
	}
	return undefined
}

type ExportFormat = "json" | "jsonl" | "csv"

function parseExportFormat(raw: string | null): ExportFormat {
	if (raw === "jsonl" || raw === "csv" || raw === "json") return raw
	return "json"
}

function asDownload(raw: string | null): boolean {
	if (!raw) return false
	const normalized = raw.toLowerCase()
	return normalized === "1" || normalized === "true" || normalized === "yes"
}

function csvEscape(value: string): string {
	const escaped = value.replace(/"/g, '""')
	return `"${escaped}"`
}

function logsToCsv(logs: Array<{ id: string; timestamp: string; type: string; env: string; data: Record<string, unknown> }>): string {
	const header = ["id", "timestamp", "type", "env", "data"]
	const lines = logs.map((log) => [
		csvEscape(log.id),
		csvEscape(log.timestamp),
		csvEscape(log.type),
		csvEscape(log.env),
		csvEscape(JSON.stringify(log.data)),
	].join(","))
	return [header.join(","), ...lines].join("\n")
}

function logsToJsonl(logs: Array<Record<string, unknown>>): string {
	return logs.map((log) => JSON.stringify(log)).join("\n")
}

function getBearerToken(req: NextRequest) {
	const auth = req.headers.get("authorization")
	if (!auth?.startsWith("Bearer ")) return null
	return auth.slice(7).trim()
}

// GET /api/staff/monark?limit=50&type=request&since=ISO&source=memory|file
async function getHandler(req: NextRequest): Promise<NextResponse> {
	const authorized = await isAuthorizedToReadLogs(req)
	if (!authorized) {
		await monarkLogger.log("auth", {
			event: "forbidden_logs_access",
			method: req.method,
			url: req.nextUrl.pathname,
		})
		return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
	}

	const limit = toPositiveInt(req.nextUrl.searchParams.get("limit"), 50, 1, 1000)
	const type = parseLogType(req.nextUrl.searchParams.get("type"))
	const since = req.nextUrl.searchParams.get("since")
	const source = req.nextUrl.searchParams.get("source") === "file" ? "file" : "memory"
	const format = parseExportFormat(req.nextUrl.searchParams.get("format"))
	const download = asDownload(req.nextUrl.searchParams.get("download"))

	const logs = source === "file"
		? await monarkLogger.getPersistedLogs({ limit, type, since })
		: monarkLogger.getLogs({ limit, type, since })
	const stats = await monarkLogger.getStats()

	if (format !== "json" || download) {
		const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
		const baseName = `monark-logs-${source}-${timestamp}`

		if (format === "jsonl") {
			const body = logsToJsonl(logs)
			return new NextResponse(body, {
				status: 200,
				headers: {
					"Content-Type": "application/x-ndjson; charset=utf-8",
					"Content-Disposition": `attachment; filename="${baseName}.jsonl"`,
				},
			})
		}

		if (format === "csv") {
			const body = logsToCsv(logs)
			return new NextResponse(body, {
				status: 200,
				headers: {
					"Content-Type": "text/csv; charset=utf-8",
					"Content-Disposition": `attachment; filename="${baseName}.csv"`,
				},
			})
		}

		const body = JSON.stringify({
			ok: true,
			source,
			count: logs.length,
			filters: { limit, type: type ?? null, since: since ?? null, format, download },
			stats,
			logs,
		}, null, 2)

		return new NextResponse(body, {
			status: 200,
			headers: {
				"Content-Type": "application/json; charset=utf-8",
				"Content-Disposition": `attachment; filename="${baseName}.json"`,
			},
		})
	}

	return NextResponse.json({
		ok: true,
		source,
		count: logs.length,
		filters: { limit, type: type ?? null, since: since ?? null, format, download },
		stats,
		logs,
	})
}

// POST /api/staff/monark
// Conserve le comportement existant (proxy vers /api/staff/malaika) + trace requête/réponse.
async function postHandler(req: NextRequest): Promise<NextResponse> {
	const startedAt = Date.now()
	await monarkLogger.log("request", buildRequestDebug(req))

	try {
		const response = await malaikaPOST(req)
		await monarkLogger.log("response", buildResponseDebug(req, response, startedAt))
		return response
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erreur inconnue"
		await monarkLogger.log("error", {
			...buildRequestDebug(req),
			message,
			phase: "malaikaPOST",
		})
		return NextResponse.json({ error: "Erreur Monark" }, { status: 500 })
	}
}

async function deleteHandler(req: NextRequest): Promise<NextResponse> {
	const authorized = await isAuthorizedToReadLogs(req)
	if (!authorized) {
		await monarkLogger.log("auth", {
			event: "forbidden_delete_logs_access",
			method: req.method,
			url: req.nextUrl.pathname,
		})
		return NextResponse.json({ error: "Non autorisé" }, { status: 401 })
	}

	try {
		const target = req.nextUrl.searchParams.get("target") ?? "file"
		const result: Record<string, unknown> = { ok: true, target }

		if (target === "memory" || target === "all") {
			Object.assign(result, monarkLogger.clearBuffer())
		}

		if (target === "file" || target === "all") {
			const stats = await monarkLogger.getStats()
			const logFilePath = (stats as { logFilePath?: string; logFile?: string }).logFilePath ?? (stats as { logFilePath?: string; logFile?: string }).logFile
			if (!logFilePath) {
				return NextResponse.json({ error: "Fichier de logs introuvable" }, { status: 500 })
			}

			await writeFile(logFilePath, "", "utf8")
			result.fileCleared = true
		}

		await monarkLogger.log("info", { message: "Logs Monark purges via API Next", target })
		return NextResponse.json(result)
	} catch (error) {
		const message = error instanceof Error ? error.message : "Erreur purge"
		return NextResponse.json({ error: message }, { status: 500 })
	}
}

export const GET = withMonarkDebug(getHandler, { routeName: "/api/staff/monark:GET" })
export const POST = withMonarkDebug(postHandler, { routeName: "/api/staff/monark:POST" })
export const DELETE = withMonarkDebug(deleteHandler, { routeName: "/api/staff/monark:DELETE" })
