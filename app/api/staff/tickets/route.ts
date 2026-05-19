/*
  ═══════════════════════════════════════════════════════════
  API Staff Tickets — GET (liste) | POST (créer)
  ═══════════════════════════════════════════════════════════
  Table Supabase requise — créer dans SQL Editor :

  create table if not exists public.staff_tickets (
    id uuid default gen_random_uuid() primary key,
    ticket_number bigint generated always as identity,
    title text not null,
    description text,
    status text not null default 'Ouvert',
    priority text not null default 'Moyenne',
    category text not null default 'Autre',
    assignee_id uuid,
    assignee_name text,
    reporter_id uuid,
    reporter_name text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
  );
  alter table public.staff_tickets enable row level security;
  create policy "staff can view tickets" on public.staff_tickets
    for select using (auth.uid() is not null);
  create policy "staff can insert tickets" on public.staff_tickets
    for insert with check (auth.uid() is not null);
  create policy "staff can update tickets" on public.staff_tickets
    for update using (auth.uid() is not null);
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { put } from "@vercel/blob";
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert";
import { withMonarkDebug } from "@/lib/server/monarkDebug";

function shouldDebugTickets(req: NextRequest) {
  const debugHeader = req.headers.get("x-debug-tickets")
  const debugQuery = req.nextUrl.searchParams.get("debug")
  return process.env.DEBUG_STAFF_TICKETS === "1" || debugHeader === "1" || debugQuery === "1"
}

function tokenPreview(token: string | null) {
  if (!token) return "absent"
  return `${token.slice(0, 20)}...`
}

function logTicketRequestDebug(req: NextRequest, user: { id: string; email?: string | null } | null) {
  if (!shouldDebugTickets(req)) return

  const authHeader = req.headers.get("authorization")
  const token = (authHeader ?? "").replace("Bearer ", "").trim() || null
  const cookies = req.cookies.getAll().map((cookie) => cookie.name)

  console.log("========== DEBUG TICKETS ==========")
  console.log("Route:", req.nextUrl.pathname)
  console.log("Method:", req.method)
  console.log("Headers reçus:", Object.fromEntries(req.headers.entries()))
  console.log("Authorization:", authHeader ?? "(none)")
  console.log("Token présent:", token ? "OUI ✅" : "NON ❌")
  console.log("Token preview:", tokenPreview(token))
  console.log("Cookies:", cookies)
  console.log("Session:", "N/A (NextRequest - session via JWT Bearer)")
  console.log("User:", user ? { id: user.id, email: user.email ?? null } : null)
  console.log("===================================")
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireStaffSession(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const { data } = await serviceClient().auth.getUser(token);
  return data.user ?? null;
}

const VALID_STATUSES = ["Ouvert", "En cours", "Résolu", "Fermé"];
const VALID_PRIORITIES = ["Critique", "Haute", "Moyenne", "Faible"];
const VALID_CATEGORIES = ["Mémorial", "Compte", "Paiement", "Technique", "Communication", "Autre"];
const TICKET_FALLBACK_PREFIX = "[TICKET_FALLBACK]";

type DbLikeError = { code?: string; message?: string; details?: string } | null;

type FallbackTicketPayload = {
  ticket_number: number;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  category: string;
  assignee_name: string | null;
  reporter_name: string | null;
  created_at: string;
  updated_at: string;
};

function isMissingTableError(error: DbLikeError) {
  if (!error) return false;
  const text = `${error.message ?? ""} ${error.details ?? ""}`.toLowerCase();
  return error.code === "42P01" || error.code === "PGRST205" || text.includes("could not find the table 'public.staff_tickets'");
}

function encodeFallbackTicket(payload: FallbackTicketPayload) {
  return `${TICKET_FALLBACK_PREFIX}${JSON.stringify(payload)}`;
}

function decodeFallbackTicket(content: string) {
  if (!content.startsWith(TICKET_FALLBACK_PREFIX)) return null;
  try {
    return JSON.parse(content.slice(TICKET_FALLBACK_PREFIX.length)) as FallbackTicketPayload;
  } catch {
    return null;
  }
}

function toFallbackTicketRow(id: string | number, payload: FallbackTicketPayload) {
  return {
    id: `fallback-${String(id)}`,
    ticket_number: payload.ticket_number,
    title: payload.title,
    description: payload.description,
    status: payload.status,
    priority: payload.priority,
    category: payload.category,
    assignee_name: payload.assignee_name,
    reporter_name: payload.reporter_name,
    created_at: payload.created_at,
    updated_at: payload.updated_at,
  };
}

async function loadFallbackTickets() {
  const { data } = await serviceClient()
    .from("staff_messages")
    .select("id, content, created_at")
    .eq("sender_name", "TicketBot")
    .like("content", `${TICKET_FALLBACK_PREFIX}%`)
    .order("created_at", { ascending: false })
    .limit(200);

  return ((data ?? []) as Array<{ id: number; content: string; created_at: string }>)
    .map((row) => {
      const parsed = decodeFallbackTicket(row.content ?? "");
      if (!parsed) return null;
      return toFallbackTicketRow(row.id, parsed);
    })
    .filter((row): row is ReturnType<typeof toFallbackTicketRow> => !!row);
}

function toDbErrorMessage(error: { code?: string; message?: string } | null) {
  if (!error) return "Erreur inconnue";
  if (error.code === "42P01") return "La table staff_tickets est introuvable.";
  if (error.code === "PGRST205") return "La table staff_tickets est introuvable (schema cache Supabase).";
  if (error.code === "42703") return "Le schéma staff_tickets est incomplet (colonne manquante).";
  return error.message ?? "Erreur base de données";
}

async function getHandler(req: NextRequest) {
  const user = await requireStaffSession(req);
  logTicketRequestDebug(req, user)
  if (!user) {
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:GET",
      message: "Non autorise",
      statusCode: 401,
    });
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const client = serviceClient();

  const { data, error } = await client
    .from("staff_tickets")
    .select("id, ticket_number, title, description, status, priority, category, assignee_name, reporter_name, created_at, updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) {
    if (error.code === "42703") {
      const { data: fallbackData, error: fallbackError } = await client
        .from("staff_tickets")
        .select("id, ticket_number, title, status, priority, category, assignee_name, reporter_name, created_at, updated_at")
        .order("created_at", { ascending: false })
        .limit(200);

      if (!fallbackError) {
        const normalized = (fallbackData ?? []).map((ticket) => ({ ...ticket, description: null }));
        return NextResponse.json({ tickets: normalized });
      }
    }

    // Table inexistante: fallback sur staff_messages pour garder la création fonctionnelle.
    if (isMissingTableError(error)) {
      const fallbackTickets = await loadFallbackTickets();
      return NextResponse.json({ tickets: fallbackTickets, tableExists: false, storage: "fallback_staff_messages" });
    }
    console.error("Tickets GET error:", error);
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:GET",
      message: "Erreur chargement tickets",
      details: error.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ tickets: [], tableExists: true }, { status: 500 });
  }

  return NextResponse.json({ tickets: data ?? [], tableExists: true, storage: "staff_tickets" });
}

export const GET = withMonarkDebug(getHandler, { routeName: "/api/staff/tickets:GET" })

async function postHandler(req: NextRequest) {
  const user = await requireStaffSession(req);
  logTicketRequestDebug(req, user)
  if (!user) {
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:POST",
      message: "Non autorise",
      statusCode: 401,
    });
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";

  let title: unknown;
  let description: unknown;
  let status: unknown;
  let priority: unknown;
  let category: unknown;
  let assignee_id: unknown;
  let assignee_name: unknown;
  let files: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    title = formData.get("title");
    description = formData.get("description");
    status = formData.get("status");
    priority = formData.get("priority");
    category = formData.get("category");
    assignee_id = formData.get("assignee_id");
    assignee_name = formData.get("assignee_name");
    files = formData.getAll("attachments").filter((entry): entry is File => entry instanceof File);
  } else {
    const body = await req.json();
    title = body.title;
    description = body.description;
    status = body.status;
    priority = body.priority;
    category = body.category;
    assignee_id = body.assignee_id;
    assignee_name = body.assignee_name;
  }

  if (!title || typeof title !== "string" || title.trim().length < 3) {
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:POST",
      message: "Titre invalide",
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ error: "Titre invalide (min 3 caractères)" }, { status: 400 });
  }

  const validStatus = VALID_STATUSES.includes(status as string) ? (status as string) : "Ouvert";
  const validPriority = VALID_PRIORITIES.includes(priority as string) ? (priority as string) : "Moyenne";
  const validCategory = VALID_CATEGORIES.includes(category as string) ? (category as string) : "Autre";

  let normalizedDescription = description ? String(description).trim() : "";
  const uploadedLinks: Array<{ name: string; url: string }> = [];
  const failedUploads: string[] = [];

  for (const file of files) {
    if (!file || file.size === 0) continue;
    try {
      const cleanedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "-");
      const path = `staff-tickets/${user.id}/${Date.now()}-${cleanedName}`;
      const uploaded = await put(path, file, {
        access: "public",
        addRandomSuffix: true,
      });
      uploadedLinks.push({ name: file.name, url: uploaded.url });
    } catch {
      failedUploads.push(file.name);
    }
  }

  if (uploadedLinks.length > 0) {
    const linksBlock = uploadedLinks.map((item) => `- ${item.name}: ${item.url}`).join("\n");
    normalizedDescription = `${normalizedDescription}${normalizedDescription ? "\n\n" : ""}Pièces jointes:\n${linksBlock}`;
  }

  if (failedUploads.length > 0) {
    const warningBlock = `Fichiers non joints: ${failedUploads.join(", ")}`;
    normalizedDescription = `${normalizedDescription}${normalizedDescription ? "\n\n" : ""}${warningBlock}`;
  }

  // Récupérer le nom du reporter depuis staff_profiles
  const { data: profile } = await serviceClient()
    .from("staff_profiles")
    .select("full_name, email")
    .eq("user_id", user.id)
    .single();
  const reporterName =
    (profile as { full_name: string | null; email: string } | null)?.full_name ??
    (profile as { full_name: string | null; email: string } | null)?.email ??
    user.email ??
    "Inconnu";

  const client = serviceClient();
  const basePayload = {
    title: title.trim().slice(0, 200),
    status: validStatus,
    priority: validPriority,
    category: validCategory,
    assignee_id: assignee_id ?? null,
    assignee_name: assignee_name ? String(assignee_name).slice(0, 100) : null,
    reporter_id: user.id,
    reporter_name: reporterName,
  };

  let { data, error } = await client
    .from("staff_tickets")
    .insert({
      ...basePayload,
      description: normalizedDescription ? normalizedDescription.slice(0, 20000) : null,
    })
    .select()
    .single();

  if (error?.code === "42703") {
    const retry = await client
      .from("staff_tickets")
      .insert(basePayload)
      .select()
      .single();
    data = retry.data;
    error = retry.error;
  }

  if (error && isMissingTableError(error as DbLikeError)) {
    const nowIso = new Date().toISOString();
    const fallbackPayload: FallbackTicketPayload = {
      ticket_number: Number(String(Date.now()).slice(-9)),
      title: String(basePayload.title),
      description: normalizedDescription ? normalizedDescription.slice(0, 20000) : null,
      status: String(basePayload.status),
      priority: String(basePayload.priority),
      category: String(basePayload.category),
      assignee_name: basePayload.assignee_name ? String(basePayload.assignee_name) : null,
      reporter_name: basePayload.reporter_name ? String(basePayload.reporter_name) : null,
      created_at: nowIso,
      updated_at: nowIso,
    };

    const { data: fallbackRow, error: fallbackInsertError } = await client
      .from("staff_messages")
      .insert({
        user_id: user.id,
        sender_name: "TicketBot",
        content: encodeFallbackTicket(fallbackPayload),
      })
      .select("id")
      .single();

    if (fallbackInsertError) {
      console.error("Tickets fallback POST error:", fallbackInsertError);
      return NextResponse.json({ error: "Création impossible: ni table staff_tickets ni fallback staff_messages disponible." }, { status: 500 });
    }

    const ticket = toFallbackTicketRow((fallbackRow as { id: number }).id, fallbackPayload);
    return NextResponse.json({ ticket, failedUploads, fallback: true }, { status: 201 });
  }

  if (error) {
    console.error("Tickets POST error:", error);
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:POST",
      message: "Erreur creation ticket",
      details: toDbErrorMessage(error),
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ error: `Erreur lors de la création: ${toDbErrorMessage(error)}` }, { status: 500 });
  }

  return NextResponse.json({ ticket: data, failedUploads }, { status: 201 });
}

export const POST = withMonarkDebug(postHandler, { routeName: "/api/staff/tickets:POST" })

async function patchHandler(req: NextRequest) {
  const user = await requireStaffSession(req);
  logTicketRequestDebug(req, user)
  if (!user) {
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:PATCH",
      message: "Non autorise",
      statusCode: 401,
    });
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id, ...updates } = await req.json();
  if (!id) {
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:PATCH",
      message: "ID ticket manquant",
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ error: "ID manquant" }, { status: 400 });
  }

  const allowed: Record<string, unknown> = {};
  if (updates.status && VALID_STATUSES.includes(updates.status)) allowed.status = updates.status;
  if (updates.priority && VALID_PRIORITIES.includes(updates.priority)) allowed.priority = updates.priority;
  if (updates.category && VALID_CATEGORIES.includes(updates.category)) allowed.category = updates.category;
  if (typeof updates.assignee_name === "string") allowed.assignee_name = updates.assignee_name.slice(0, 100);
  if (typeof updates.title === "string" && updates.title.trim().length >= 3) allowed.title = updates.title.trim().slice(0, 200);
  if (typeof updates.description === "string") allowed.description = updates.description.slice(0, 20000);
  allowed.updated_at = new Date().toISOString();

  const idString = String(id);
  if (idString.startsWith("fallback-")) {
    const fallbackId = idString.replace("fallback-", "");
    const { data: fallbackRow, error: fallbackReadError } = await serviceClient()
      .from("staff_messages")
      .select("id, content")
      .eq("id", fallbackId)
      .eq("sender_name", "TicketBot")
      .single();

    if (fallbackReadError || !fallbackRow) {
      return NextResponse.json({ error: "Ticket fallback introuvable" }, { status: 404 });
    }

    const current = decodeFallbackTicket((fallbackRow as { content: string }).content);
    if (!current) {
      return NextResponse.json({ error: "Ticket fallback corrompu" }, { status: 500 });
    }

    const merged: FallbackTicketPayload = {
      ...current,
      title: (allowed.title as string | undefined) ?? current.title,
      description: (allowed.description as string | undefined) ?? current.description,
      status: (allowed.status as string | undefined) ?? current.status,
      priority: (allowed.priority as string | undefined) ?? current.priority,
      category: (allowed.category as string | undefined) ?? current.category,
      assignee_name: (allowed.assignee_name as string | undefined) ?? current.assignee_name,
      updated_at: String(allowed.updated_at),
    };

    const { error: fallbackUpdateError } = await serviceClient()
      .from("staff_messages")
      .update({ content: encodeFallbackTicket(merged) })
      .eq("id", fallbackId)
      .eq("sender_name", "TicketBot");

    if (fallbackUpdateError) {
      return NextResponse.json({ error: "Mise à jour fallback échouée" }, { status: 500 });
    }

    return NextResponse.json({ ticket: toFallbackTicketRow(fallbackId, merged), fallback: true });
  }

  const { data, error } = await serviceClient()
    .from("staff_tickets")
    .update(allowed)
    .eq("id", id)
    .select()
    .single();

  if (error && isMissingTableError(error as DbLikeError)) {
    return NextResponse.json({ error: "Table staff_tickets absente. Utilisez un ticket fallback créé depuis l'interface actuelle." }, { status: 400 });
  }

  if (error) {
    console.error("Tickets PATCH error:", error);
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets:PATCH",
      message: "Erreur mise a jour ticket",
      details: error.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ error: "Mise à jour échouée" }, { status: 500 });
  }

  return NextResponse.json({ ticket: data });
}

export const PATCH = withMonarkDebug(patchHandler, { routeName: "/api/staff/tickets:PATCH" })
