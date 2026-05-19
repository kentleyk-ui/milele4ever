import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

const KENT_EMAIL = "kentleyk@gmail.com"

type AdminState = {
  restricted?: boolean
  restricted_reason?: string | null
  restricted_at?: string | null
  restricted_by?: string | null
}

type AdminAuditLog = {
  id: string
  action: string
  target_user_id: string
  target_email: string | null
  target_role_name?: string | null
  reason?: string | null
  actor_user_id: string
  created_at: string
}

type AccentPayload = {
  admin_state?: AdminState
  admin_audit_logs?: AdminAuditLog[]
  [key: string]: unknown
} | null

type StaffProfileRow = {
  user_id: string
  email: string | null
  role: string | null
  role_id: string | null
  role_name: string | null
  role_category: string | null
  status: string | null
  accent_color: AccentPayload
}

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function requireSupremeAdmin(req: NextRequest) {
  const supabaseAdmin = createAdminClient()
  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const requester = authData.user
  if (authError || !requester) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }

  const { data: profile } = await supabaseAdmin
    .from("staff_profiles")
    .select("role_id, status")
    .eq("user_id", requester.id)
    .single()

  const staffProfile = profile as { role_id: string | null; status: string | null } | null
  // Accès autorisé si role_id = admin-supreme ET approuvé, OU si c'est le compte Kent
  const isSupremeAdmin =
    (staffProfile?.role_id === "admin-supreme" && staffProfile?.status === "approved") ||
    requester.email === KENT_EMAIL

  if (!isSupremeAdmin) {
    return { error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) }
  }

  return { supabaseAdmin, requester }
}

function getAdminState(accentColor: unknown): AdminState {
  if (!accentColor || typeof accentColor !== "object" || !("admin_state" in accentColor)) {
    return {}
  }

  const adminState = (accentColor as { admin_state?: AdminState }).admin_state
  return adminState && typeof adminState === "object" ? adminState : {}
}

function mergeAdminState(accentColor: AccentPayload, adminState: AdminState) {
  return {
    ...(accentColor && typeof accentColor === "object" ? accentColor : {}),
    admin_state: {
      ...getAdminState(accentColor),
      ...adminState,
    },
  }
}

function getAdminAuditLogs(accentColor: unknown) {
  if (!accentColor || typeof accentColor !== "object" || !("admin_audit_logs" in accentColor)) {
    return [] as AdminAuditLog[]
  }

  const logs = (accentColor as { admin_audit_logs?: AdminAuditLog[] }).admin_audit_logs
  return Array.isArray(logs) ? logs : []
}

function buildAuditPayload(accentColor: AccentPayload, entry: AdminAuditLog) {
  const previous = getAdminAuditLogs(accentColor)
  return {
    ...(accentColor && typeof accentColor === "object" ? accentColor : {}),
    admin_audit_logs: [entry, ...previous].slice(0, 120),
  }
}

function generateTemporaryPassword() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%*"
  let value = "Tmp-"
  for (let idx = 0; idx < 12; idx += 1) {
    const rand = Math.floor(Math.random() * alphabet.length)
    value += alphabet[rand]
  }
  return value
}

async function sendTemporaryPasswordEmail(params: {
  to: string
  temporaryPassword: string
  appOrigin: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.RESEND_FROM_EMAIL

  if (!apiKey || !from) {
    return { ok: false, reason: "EMAIL_PROVIDER_NOT_CONFIGURED" }
  }

  const loginUrl = `${params.appOrigin}/staff`
  const subject = "Mot de passe temporaire Milele"
  const text = [
    "Bonjour,",
    "",
    "Un administrateur a reinitialise votre compte.",
    `Mot de passe temporaire: ${params.temporaryPassword}`,
    "",
    `Connectez-vous ici: ${loginUrl}`,
    "Des la connexion, vous devrez changer votre mot de passe.",
    "",
    "Equipe Milele",
  ].join("\n")

  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#0f172a">
      <h2 style="margin-bottom:12px">Mot de passe temporaire Milele</h2>
      <p>Un administrateur a reinitialise votre compte.</p>
      <p><strong>Mot de passe temporaire:</strong> ${params.temporaryPassword}</p>
      <p>
        Connectez-vous ici: <a href="${loginUrl}">${loginUrl}</a><br/>
        Des la connexion, vous devrez changer votre mot de passe.
      </p>
      <p>Equipe Milele</p>
    </div>
  `

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [params.to],
      subject,
      html,
      text,
    }),
  })

  if (!response.ok) {
    return { ok: false, reason: "EMAIL_SEND_FAILED" }
  }

  return { ok: true }
}

async function runSafeResetOperation(label: string, work: () => Promise<{ error: { code?: string; message?: string } | null }>) {
  const result = await work()
  const error = result.error
  if (!error) return { label, ok: true }
  if (error.code === "42P01" || error.code === "42703") {
    return { label, ok: true }
  }
  return { label, ok: false, message: error.message ?? "Erreur inconnue" }
}

async function appendAuditLog(
  supabaseAdmin: ReturnType<typeof createAdminClient>,
  requesterId: string,
  entry: Omit<AdminAuditLog, "id" | "actor_user_id" | "created_at">
) {
  const { data: kentProfile } = await supabaseAdmin
    .from("staff_profiles")
    .select("user_id, email, role, role_id, role_name, role_category, status, accent_color")
    .eq("user_id", requesterId)
    .maybeSingle()

  const profile = kentProfile as StaffProfileRow | null
  const auditEntry: AdminAuditLog = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    actor_user_id: requesterId,
    created_at: new Date().toISOString(),
    ...entry,
  }

  await supabaseAdmin
    .from("staff_profiles")
    .upsert({
      user_id: requesterId,
      email: profile?.email ?? KENT_EMAIL,
      role: profile?.role ?? profile?.role_id ?? "member",
      role_id: profile?.role_id ?? null,
      role_name: profile?.role_name ?? null,
      role_category: profile?.role_category ?? null,
      status: profile?.status ?? "approved",
      accent_color: buildAuditPayload(profile?.accent_color ?? null, auditEntry),
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" })
}

export async function GET(req: NextRequest) {
  const adminCheck = await requireSupremeAdmin(req)
  if (adminCheck.error) {
    void sendTelegramErrorAlert({
      route: "/api/admin/users:GET",
      message: "Acces admin refuse",
      statusCode: 401,
    })
    return adminCheck.error
  }

  const { supabaseAdmin } = adminCheck
  const adminAuth = supabaseAdmin.auth.admin as unknown as {
    listUsers: () => Promise<{ data: { users: Array<Record<string, unknown>> } | null; error: { message: string } | null }>
  }

  const [{ data: authUsersData, error: usersError }, { data: profilesData, error: profilesError }, { data: requesterProfile }] = await Promise.all([
    adminAuth.listUsers(),
    supabaseAdmin
      .from("staff_profiles")
      .select("user_id, email, full_name, role_id, role_name, role_category, status, accent_color, created_at, updated_at"),
    supabaseAdmin
      .from("staff_profiles")
      .select("accent_color")
      .eq("email", KENT_EMAIL)
      .maybeSingle(),
  ])

  if (usersError || profilesError) {
    void sendTelegramErrorAlert({
      route: "/api/admin/users:GET",
      message: "Erreur chargement utilisateurs admin",
      details: usersError?.message ?? profilesError?.message ?? "Erreur de chargement",
      statusCode: 500,
    })
    return NextResponse.json({ error: usersError?.message ?? profilesError?.message ?? "Erreur de chargement" }, { status: 500 })
  }

  const profileMap = new Map(
    ((profilesData as Array<Record<string, unknown>> | null) ?? []).map((profile) => [profile.user_id, profile])
  )

  const users = ((authUsersData?.users ?? []) as Array<Record<string, unknown>>)
    .map((user) => {
      const profile = profileMap.get(user.id) as Record<string, unknown> | undefined
      const accentColor = (profile?.accent_color as AccentPayload | undefined) ?? null
      const adminState = getAdminState(accentColor)
      const bannedUntil = typeof user.banned_until === "string" ? user.banned_until : null
      const isDisabled = bannedUntil ? new Date(bannedUntil).getTime() > Date.now() : false
      const hasStaffProfile = !!profile

      return {
        id: user.id,
        email: user.email ?? profile?.email ?? null,
        full_name: profile?.full_name ?? null,
        role_id: profile?.role_id ?? null,
        role_name: profile?.role_name ?? null,
        role_category: profile?.role_category ?? null,
        status: profile?.status ?? null,
        created_at: profile?.created_at ?? user.created_at ?? null,
        updated_at: profile?.updated_at ?? null,
        email_confirmed_at: user.email_confirmed_at ?? null,
        last_sign_in_at: user.last_sign_in_at ?? null,
        provider: typeof user.app_metadata === "object" && user.app_metadata && "provider" in user.app_metadata
          ? (user.app_metadata as { provider?: string }).provider ?? "email"
          : "email",
        is_disabled: isDisabled,
        banned_until: bannedUntil,
        is_restricted: !!adminState.restricted,
        restricted_reason: adminState.restricted_reason ?? null,
        is_kent: (user.email ?? "") === KENT_EMAIL,
        account_section: hasStaffProfile ? "staff" : "public",
      }
    })
    .sort((left, right) => {
      if (left.is_kent) return -1
      if (right.is_kent) return 1
      const rightCreated = typeof right.created_at === "string" ? right.created_at : ""
      const leftCreated = typeof left.created_at === "string" ? left.created_at : ""
      return new Date(rightCreated || 0).getTime() - new Date(leftCreated || 0).getTime()
    })

  const requesterAccent = (requesterProfile as { accent_color?: AccentPayload } | null)?.accent_color ?? null
  const emailProviderConfigured = Boolean(process.env.RESEND_API_KEY && process.env.RESEND_FROM_EMAIL)
  return NextResponse.json({
    users,
    auditLogs: getAdminAuditLogs(requesterAccent),
    emailProviderConfigured,
  })
}

export async function PATCH(req: NextRequest) {
  const adminCheck = await requireSupremeAdmin(req)
  if (adminCheck.error) {
    void sendTelegramErrorAlert({
      route: "/api/admin/users:PATCH",
      message: "Acces admin refuse",
      statusCode: 401,
    })
    return adminCheck.error
  }

  const { supabaseAdmin, requester } = adminCheck
  const body = await req.json().catch(() => ({})) as { userId?: string; action?: string; reason?: string; roleId?: string }
  const userId = body.userId
  const action = body.action
  const reason = body.reason?.trim() || null
  const roleId = body.roleId?.trim() || null

  if (!userId || !action) {
    void sendTelegramErrorAlert({
      route: "/api/admin/users:PATCH",
      message: "Parametres admin manquants",
      statusCode: 400,
      actorId: requester.id,
      actorEmail: requester.email ?? null,
    })
    return NextResponse.json({ error: "Parametres manquants" }, { status: 400 })
  }

  const adminAuth = supabaseAdmin.auth.admin as unknown as {
    listUsers: () => Promise<{ data: { users: Array<Record<string, unknown>> } | null; error: { message: string } | null }>
    updateUserById: (userId: string, attributes: Record<string, unknown>) => Promise<{ error: { message: string } | null }>
    deleteUser: (userId: string) => Promise<{ error: { message: string } | null }>
  }

  const { data: authUsersData, error: usersError } = await adminAuth.listUsers()
  if (usersError) {
    void sendTelegramErrorAlert({
      route: "/api/admin/users:PATCH",
      message: "Erreur listUsers",
      details: usersError.message,
      statusCode: 500,
      actorId: requester.id,
      actorEmail: requester.email ?? null,
    })
    return NextResponse.json({ error: usersError.message }, { status: 500 })
  }

  const authUser = (authUsersData?.users ?? []).find((user) => user.id === userId)
  if (!authUser) {
    void sendTelegramErrorAlert({
      route: "/api/admin/users:PATCH",
      message: "Utilisateur cible introuvable",
      statusCode: 404,
      actorId: requester.id,
      actorEmail: requester.email ?? null,
    })
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  if (authUser.email === KENT_EMAIL || userId === requester.id) {
    return NextResponse.json({ error: "Action interdite sur l'administrateur supreme" }, { status: 403 })
  }

  const { data: profileData } = await supabaseAdmin
    .from("staff_profiles")
    .select("user_id, email, role, role_id, role_name, role_category, status, accent_color")
    .eq("user_id", userId)
    .maybeSingle()

  const profile = profileData as StaffProfileRow | null

  if (action === "disable" || action === "enable") {
    const { error } = await adminAuth.updateUserById(userId, {
      ban_duration: action === "disable" ? "876000h" : "none",
    })

    if (error) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur disable/enable",
        details: error.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile?.email ?? null,
      reason,
    })

    return NextResponse.json({ success: true })
  }

  if (action === "suspend_staff" || action === "reactivate_staff") {
    if (!profile) {
      return NextResponse.json({ error: "Action reservee aux comptes staff" }, { status: 400 })
    }

    const nextStatus = action === "suspend_staff" ? "suspended" : "approved"

    const { error: statusError } = await supabaseAdmin
      .from("staff_profiles")
      .upsert({
        user_id: userId,
        email: (authUser.email as string | undefined) ?? profile.email ?? null,
        role: profile.role ?? profile.role_id ?? "member",
        role_id: profile.role_id ?? null,
        role_name: profile.role_name ?? null,
        role_category: profile.role_category ?? null,
        status: nextStatus,
        accent_color: profile.accent_color ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (statusError) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur suspend/reactivate staff",
        details: statusError.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: statusError.message }, { status: 500 })
    }

    const { error: authError } = await adminAuth.updateUserById(userId, {
      ban_duration: action === "suspend_staff" ? "876000h" : "none",
    })

    if (authError) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur ban/unban staff",
        details: authError.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: authError.message }, { status: 500 })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile.email ?? null,
      reason,
    })

    return NextResponse.json({ success: true })
  }

  if (action === "reset_password") {
    const email = (authUser.email as string | undefined) ?? profile?.email ?? null
    if (!email) {
      return NextResponse.json({ error: "Aucun email disponible pour ce compte" }, { status: 400 })
    }

    const temporaryPassword = generateTemporaryPassword()
    const previousUserMetadata = (authUser.user_metadata && typeof authUser.user_metadata === "object"
      ? authUser.user_metadata
      : {}) as Record<string, unknown>

    const { error: updatePasswordError } = await adminAuth.updateUserById(userId, {
      password: temporaryPassword,
      user_metadata: {
        ...previousUserMetadata,
        must_change_password: true,
        temporary_password_issued_at: new Date().toISOString(),
      },
    })

    if (updatePasswordError) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur reset_password",
        details: updatePasswordError.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: updatePasswordError.message }, { status: 500 })
    }

    const emailResult = await sendTemporaryPasswordEmail({
      to: email,
      temporaryPassword,
      appOrigin: req.nextUrl.origin,
    })

    if (!emailResult.ok) {
      await supabaseAdmin.auth.resetPasswordForEmail(email, {
        redirectTo: `${req.nextUrl.origin}/staff?reset=1`,
      })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: email,
      reason: reason ?? "Mot de passe temporaire genere",
    })

    return NextResponse.json({
      success: true,
      temporaryPassword,
      mustChangeOnNextLogin: true,
      emailDelivery: emailResult.ok ? "sent" : "fallback",
    })
  }

  if (action === "wipe_content") {
    const operations = await Promise.all([
      runSafeResetOperation("dossiers", async () => supabaseAdmin.from("dossiers").delete().eq("user_id", userId)),
      runSafeResetOperation("connections", async () => supabaseAdmin.from("connections").delete().or(`requester_id.eq.${userId},target_id.eq.${userId}`)),
      runSafeResetOperation("staff_tickets_reporter", async () => supabaseAdmin.from("staff_tickets").delete().eq("reporter_id", userId)),
      runSafeResetOperation("staff_tickets_assignee", async () => supabaseAdmin.from("staff_tickets").update({ assignee_id: null, assignee_name: null, updated_at: new Date().toISOString() }).eq("assignee_id", userId)),
      runSafeResetOperation("staff_messages", async () => supabaseAdmin.from("staff_messages").delete().eq("sender_id", userId)),
      runSafeResetOperation("profiles", async () => supabaseAdmin.from("profiles").update({ display_name: null, avatar_url: null, updated_at: new Date().toISOString() }).eq("id", userId)),
      runSafeResetOperation("staff_profiles", async () => supabaseAdmin.from("staff_profiles").update({ accent_color: null, updated_at: new Date().toISOString() }).eq("user_id", userId)),
    ])

    const failed = operations.filter((item) => !item.ok)
    if (failed.length > 0) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur wipe_content",
        details: failed.map((item) => `${item.label}: ${item.message}`).join(" | "),
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: `Reset partiel echoue: ${failed.map((item) => `${item.label}: ${item.message}`).join(" | ")}` }, { status: 500 })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile?.email ?? null,
      reason: reason ?? "Remise a zero des donnees compte",
    })

    return NextResponse.json({ success: true })
  }

  if (action === "restrict" || action === "unrestrict") {
    const accentColor = mergeAdminState(profile?.accent_color ?? null, {
      restricted: action === "restrict",
      restricted_reason: action === "restrict" ? reason : null,
      restricted_at: action === "restrict" ? new Date().toISOString() : null,
      restricted_by: action === "restrict" ? requester.id : null,
    })

    const { error } = await supabaseAdmin
      .from("staff_profiles")
      .upsert({
        user_id: userId,
        email: (authUser.email as string | undefined) ?? profile?.email ?? null,
        role: profile?.role ?? profile?.role_id ?? "member",
        role_id: profile?.role_id ?? null,
        role_name: profile?.role_name ?? null,
        role_category: profile?.role_category ?? null,
        status: profile?.status ?? "pending_role",
        accent_color: accentColor,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (error) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur restrict/unrestrict",
        details: error.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile?.email ?? null,
      reason,
    })

    return NextResponse.json({ success: true })
  }

  if (action === "approve" || action === "reject") {
    const nextStatus = action === "approve" ? "approved" : "rejected"
    const payload: Record<string, unknown> = {
      user_id: userId,
      email: (authUser.email as string | undefined) ?? profile?.email ?? null,
      role: profile?.role ?? profile?.role_id ?? "member",
      role_id: profile?.role_id ?? null,
      role_name: profile?.role_name ?? null,
      role_category: profile?.role_category ?? null,
      status: nextStatus,
      accent_color: profile?.accent_color ?? null,
      updated_at: new Date().toISOString(),
    }

    if (action === "approve") {
      payload.approved_by = requester.id
      payload.approved_at = new Date().toISOString()
    }

    const { error } = await supabaseAdmin
      .from("staff_profiles")
      .upsert(payload, { onConflict: "user_id" })

    if (error) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur approve/reject",
        details: error.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile?.email ?? null,
      reason,
    })

    return NextResponse.json({ success: true })
  }

  if (action === "change_role") {
    if (!roleId) {
      return NextResponse.json({ error: "roleId manquant" }, { status: 400 })
    }

    const rolesModule = await import("@/lib/roles")
    const role = rolesModule.ALL_ROLES.find((item) => item.id === roleId)
    if (!role) {
      return NextResponse.json({ error: "Role inconnu" }, { status: 400 })
    }

    if (roleId === "admin-supreme") {
      return NextResponse.json({ error: "Le role admin-supreme est reserve a Kent" }, { status: 403 })
    }

    const { error } = await supabaseAdmin
      .from("staff_profiles")
      .upsert({
        user_id: userId,
        email: (authUser.email as string | undefined) ?? profile?.email ?? null,
        role: role.id,
        role_id: role.id,
        role_name: role.name,
        role_category: role.categoryId,
        status: profile?.status ?? "pending_approval",
        accent_color: profile?.accent_color ?? null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (error) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur change_role",
        details: error.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile?.email ?? null,
      target_role_name: role.name,
      reason,
    })

    return NextResponse.json({ success: true })
  }

  if (action === "delete") {
    const { error } = await adminAuth.deleteUser(userId)
    if (error) {
      void sendTelegramErrorAlert({
        route: "/api/admin/users:PATCH",
        message: "Erreur delete user",
        details: error.message,
        statusCode: 500,
        actorId: requester.id,
        actorEmail: requester.email ?? null,
      })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    await supabaseAdmin.from("staff_profiles").delete().eq("user_id", userId)
    await appendAuditLog(supabaseAdmin, requester.id, {
      action,
      target_user_id: userId,
      target_email: (authUser.email as string | null) ?? profile?.email ?? null,
      reason,
    })
    return NextResponse.json({ success: true })
  }

  void sendTelegramErrorAlert({
    route: "/api/admin/users:PATCH",
    message: "Action non supportee",
    details: action,
    statusCode: 400,
    actorId: requester.id,
    actorEmail: requester.email ?? null,
  })
  return NextResponse.json({ error: "Action non supportee" }, { status: 400 })
}