import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { clearStaffMemory, clearUserMemory } from "@/lib/malaikaMemory";

const MONARK_PRIVATE_PREFIX = "[MONARK_PRIVATE]";

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireAdminSession(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const { data } = await serviceClient().auth.getUser(token);
  return data.user ?? null;
}

export async function POST(req: NextRequest) {
  const user = await requireAdminSession(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = serviceClient();

  // Vérifier que l'utilisateur est bien admin
  const { data: profile } = await db
    .from("staff_profiles")
    .select("role_id, status")
    .eq("user_id", user.id)
    .single();

  if (!profile || profile.status !== "approved" || profile.role_id !== "admin-supreme") {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    scope?: "all" | "malaika" | "monark" | "connections" | "circle" | "private" | "staff";
    userId?: string;
  };

  const scope = body.scope ?? "all";
  const results: string[] = [];

  // 1. Mémoire in-process Malaïka (public)
  if (scope === "all" || scope === "malaika") {
    if (body.userId) {
      clearUserMemory(body.userId);
      results.push(`Mémoire Malaïka publique effacée pour userId=${body.userId}`);

      const { error: convoErr, count: convoCount } = await db
        .from("malaika_conversations")
        .delete({ count: "exact" })
        .eq("user_id", body.userId);

      if (convoErr && convoErr.code !== "42P01") {
        results.push(`Erreur suppression historique Malaïka (DB): ${convoErr.message}`);
      } else {
        results.push(`${convoCount ?? 0} conversation(s) Malaïka supprimée(s) en base pour userId=${body.userId}`);
      }
    } else {
      clearUserMemory();
      results.push("Mémoire Malaïka publique (tous les utilisateurs) effacée");

      const { error: convoErr, count: convoCount } = await db
        .from("malaika_conversations")
        .delete({ count: "exact" })
        .neq("user_id", "");

      if (convoErr && convoErr.code !== "42P01") {
        results.push(`Erreur suppression historique Malaïka global (DB): ${convoErr.message}`);
      } else {
        results.push(`${convoCount ?? 0} conversation(s) Malaïka supprimée(s) en base`);
      }
    }
  }

  // 2. Mémoire in-process Malaïka staff
  if (scope === "all" || scope === "malaika") {
    clearStaffMemory();
    results.push("Mémoire Malaïka staff (in-process) effacée");
  }

  // 3. Messages Monark privés dans staff_messages (Supabase)
  if (scope === "all" || scope === "monark") {
    const { error: monarkErr, count } = await db
      .from("staff_messages")
      .delete({ count: "exact" })
      .like("content", `${MONARK_PRIVATE_PREFIX}%`);

    if (monarkErr) {
      results.push(`Erreur suppression messages Monark: ${monarkErr.message}`);
    } else {
      results.push(`${count ?? 0} message(s) Monark privé(s) supprimé(s)`);
    }
  }

  // 4. Connexions de test / privées
  if (scope === "all" || scope === "connections") {
    const { error: connErr, count } = await db
      .from("connections")
      .delete({ count: "exact" });

    if (connErr && connErr.code !== "42P01") {
      results.push(`Erreur suppression connexions test: ${connErr.message}`);
    } else if (!connErr) {
      results.push(`${count ?? 0} connexion(s) supprimée(s)`);
    }
  }

  // 5. Membres de cercle
  if (scope === "all" || scope === "circle") {
    const { error: circleErr, count } = await db
      .from("circle_members")
      .delete({ count: "exact" });

    if (circleErr) {
      results.push(`Erreur suppression membres de cercle test: ${circleErr.message}`);
    } else {
      results.push(`${count ?? 0} membre(s) de cercle supprimé(s)`);
    }
  }

  // 6. Données privées globales
  if (scope === "all" || scope === "private") {
    const privateOps = await Promise.all([
      db.from("dossiers").delete({ count: "exact" }),
      db.from("content_items").delete({ count: "exact" }),
      db.from("capsules_temporelles").delete({ count: "exact" }),
      db.from("volontes").delete({ count: "exact" }),
      db.from("memorials").delete({ count: "exact" }),
      db.from("tributes").delete({ count: "exact" }),
      db.from("aion_activity_log").delete({ count: "exact" }),
      db.from("feedbacks").delete({ count: "exact" }),
    ]);

    const labels = [
      "dossiers",
      "content_items",
      "capsules_temporelles",
      "volontes",
      "memorials",
      "tributes",
      "aion_activity_log",
      "feedbacks",
    ];

    privateOps.forEach((op, idx) => {
      const err = op.error as { message?: string; code?: string } | null
      if (err && err.code !== "42P01") {
        results.push(`Erreur ${labels[idx]}: ${err.message ?? "inconnue"}`)
      } else {
        results.push(`${op.count ?? 0} ligne(s) supprimée(s) dans ${labels[idx]}`)
      }
    })
  }

  // 7. Données staff globales
  if (scope === "all" || scope === "staff") {
    const staffOps = await Promise.all([
      db.from("staff_messages").delete({ count: "exact" }),
      db.from("staff_tickets").delete({ count: "exact" }),
      db.from("staff_profiles").update({ accent_color: null, updated_at: new Date().toISOString() }).neq("role_id", "admin-supreme"),
    ])

    const staffMessagesErr = staffOps[0].error as { message?: string; code?: string } | null
    if (staffMessagesErr && staffMessagesErr.code !== "42P01") results.push(`Erreur staff_messages: ${staffMessagesErr.message ?? "inconnue"}`)
    else results.push(`${staffOps[0].count ?? 0} message(s) staff supprimé(s)`)

    const staffTicketsErr = staffOps[1].error as { message?: string; code?: string } | null
    if (staffTicketsErr && staffTicketsErr.code !== "42P01") results.push(`Erreur staff_tickets: ${staffTicketsErr.message ?? "inconnue"}`)
    else results.push(`${staffOps[1].count ?? 0} ticket(s) staff supprimé(s)`)

    const staffProfileErr = staffOps[2].error as { message?: string; code?: string } | null
    if (staffProfileErr && staffProfileErr.code !== "42P01") results.push(`Erreur staff_profiles: ${staffProfileErr.message ?? "inconnue"}`)
    else results.push("Profils staff (hors admin suprême) remis à zéro")
  }

  return NextResponse.json({
    ok: true,
    scope,
    results,
    timestamp: new Date().toISOString(),
  });
}
