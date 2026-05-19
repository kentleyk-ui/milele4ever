import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { promises as fs } from "node:fs"
import path from "node:path"

export const runtime = "nodejs"

const KENT_EMAIL = "kentleyk@gmail.com"

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireAdminSession(req: NextRequest) {
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const token = authHeader.slice(7)
  const supabaseAdmin = createAdminClient()
  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const requester = data.user
  const { data: profile } = await supabaseAdmin
    .from("staff_profiles")
    .select("role_id, status")
    .eq("user_id", requester.id)
    .single()

  const staffProfile = profile as { role_id: string | null; status: string | null } | null
  const isSupremeAdmin =
    (staffProfile?.role_id === "admin-supreme" && staffProfile?.status === "approved") ||
    requester.email === KENT_EMAIL

  if (!isSupremeAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { requester }
}

async function safeReadText(filePath: string) {
  try {
    return await fs.readFile(filePath, "utf8")
  } catch {
    return null
  }
}

async function safeReadJson(filePath: string) {
  const content = await safeReadText(filePath)
  if (!content) return null
  try {
    return JSON.parse(content)
  } catch {
    return null
  }
}

async function safeReadJsonl(filePath: string) {
  const content = await safeReadText(filePath)
  if (!content) return [] as Array<Record<string, unknown>>

  const parsed = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => {
      try {
        return JSON.parse(line) as Record<string, unknown>
      } catch {
        return null
      }
    })
    .filter((entry): entry is Record<string, unknown> => entry !== null)

  return parsed
}

export async function GET(req: NextRequest) {
  const auth = await requireAdminSession(req)
  if ("error" in auth) return auth.error

  const projectRoot = process.cwd()
  const historyDir = path.join(projectRoot, "monitoring", "history")
  const scriptsDir = path.join(projectRoot, "scripts")

  const [
    monitorLast,
    monitorHistory,
    monitorExcelCsv,
    excelPushState,
    smartsheetPushState,
    feedbackDeployments,
    tasksText,
    processesText,
    scriptsList,
  ] = await Promise.all([
    safeReadJson(path.join(historyDir, "monitor-last.json")),
    safeReadJsonl(path.join(historyDir, "monitor-history.jsonl")),
    safeReadText(path.join(historyDir, "monitor-excel.csv")),
    safeReadJson(path.join(historyDir, "excel-push-state.json")),
    safeReadJson(path.join(historyDir, "smartsheet-push-state.json")),
    safeReadJson(path.join(projectRoot, "feedback_deployments.json")),
    safeReadText(path.join(projectRoot, "tasks.txt")),
    safeReadText(path.join(projectRoot, "processes.txt")),
    fs.readdir(scriptsDir).catch(() => [] as string[]),
  ])

  return NextResponse.json({
    ok: true,
    refreshedAt: new Date().toISOString(),
    data: {
      monitorLast,
      monitorHistory,
      monitorExcelCsv,
      excelPushState,
      smartsheetPushState,
      feedbackDeployments,
      tasksText,
      processesText,
      scriptsList,
    },
  })
}
