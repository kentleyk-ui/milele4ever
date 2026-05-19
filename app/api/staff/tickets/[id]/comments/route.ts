/*
  ═══════════════════════════════════════════════════════════
  API Staff Tickets — Comments  GET (liste) | POST (créer)
  ═══════════════════════════════════════════════════════════
  Table Supabase requise — créer dans SQL Editor :

  create table if not exists public.ticket_comments (
    id uuid default gen_random_uuid() primary key,
    ticket_id uuid not null,
    author_id uuid not null,
    author_name text not null,
    content text not null,
    created_at timestamptz default now() not null
  );
  alter table public.ticket_comments enable row level security;
  create policy "staff can view comments" on public.ticket_comments
    for select using (auth.uid() is not null);
  create policy "staff can insert comments" on public.ticket_comments
    for insert with check (auth.uid() is not null);
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert";

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

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffSession(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const { data, error } = await serviceClient()
    .from("ticket_comments")
    .select("id, ticket_id, author_id, author_name, content, created_at")
    .eq("ticket_id", id)
    .order("created_at", { ascending: true })
    .limit(500);

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return NextResponse.json({ comments: [], tableExists: false });
    }
    console.error("Comments GET error:", error);
    return NextResponse.json({ comments: [], error: error.message }, { status: 500 });
  }

  return NextResponse.json({ comments: data ?? [], tableExists: true });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await requireStaffSession(req);
  if (!user) {
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets/[id]/comments:POST",
      message: "Non autorisé",
      statusCode: 401,
    });
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) return NextResponse.json({ error: "ID manquant" }, { status: 400 });

  const body = await req.json();
  const content = body?.content;

  if (!content || typeof content !== "string" || content.trim().length < 1) {
    return NextResponse.json({ error: "Commentaire vide" }, { status: 400 });
  }

  const client = serviceClient();

  // Récupérer le nom de l'auteur depuis staff_profiles
  const { data: profile } = await client
    .from("staff_profiles")
    .select("full_name, email")
    .eq("user_id", user.id)
    .single();

  const authorName =
    (profile as { full_name: string | null; email: string } | null)?.full_name ??
    (profile as { full_name: string | null; email: string } | null)?.email ??
    user.email ??
    "Staff";

  const { data, error } = await client
    .from("ticket_comments")
    .insert({
      ticket_id: id,
      author_id: user.id,
      author_name: authorName,
      content: content.trim().slice(0, 5000),
    })
    .select()
    .single();

  if (error) {
    if (error.code === "42P01" || error.code === "PGRST205") {
      return NextResponse.json(
        { error: "Table ticket_comments introuvable. Veuillez créer la table via le SQL Editor Supabase." },
        { status: 503 }
      );
    }
    console.error("Comment POST error:", error);
    void sendTelegramErrorAlert({
      route: "/api/staff/tickets/[id]/comments:POST",
      message: "Erreur création commentaire",
      details: error.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ error: "Erreur lors de l'ajout du commentaire" }, { status: 500 });
  }

  return NextResponse.json({ comment: data }, { status: 201 });
}
