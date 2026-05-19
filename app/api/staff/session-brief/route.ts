import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StaffProfile = {
  user_id: string;
  email: string | null;
  status: string | null;
};

const JOKES = [
  "Promis, aujourd'hui aucun bug ne passe... sauf s'il a un badge staff.",
  "J'ai classé les priorités: café, tickets, puis encore café.",
  "Bonne nouvelle: le serveur respire. Mauvaise nouvelle: il attend ton prochain déploiement.",
  "Objectif du jour: moins d'urgences, plus d'impact.",
  "J'ai vérifié les logs: tout va bien, donc c'est suspect.",
];

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

async function requireApprovedStaff(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;

  const db = serviceClient();
  const { data } = await db.auth.getUser(token);
  const user = data.user;
  if (!user) return null;

  const { data: profile } = await db
    .from("staff_profiles")
    .select("user_id, email, status")
    .eq("user_id", user.id)
    .single();

  const staff = profile as StaffProfile | null;
  if (!staff || staff.status !== "approved") return null;

  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireApprovedStaff(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = serviceClient();
  const sinceIso = new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();

  const [pendingRes, criticalRes, feedbackRes, messagesRes] = await Promise.all([
    db.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("status", "pending_approval"),
    db.from("staff_tickets").select("id", { count: "exact", head: true }).eq("priority", "Critique"),
    db.from("feedbacks").select("id", { count: "exact", head: true }).gte("created_at", sinceIso),
    db
      .from("staff_messages")
      .select("id", { count: "exact", head: true })
      .gte("created_at", sinceIso),
  ]);

  const pendingApprovals = pendingRes.count ?? 0;
  const criticalTickets = criticalRes.count ?? 0;
  const recentFeedbacks = feedbackRes.count ?? 0;
  const recentMessages = messagesRes.count ?? 0;

  const summary =
    `Depuis ton départ: ${pendingApprovals} approbation(s), ` +
    `${criticalTickets} ticket(s) critique(s), ` +
    `${recentFeedbacks} feedback(s), ${recentMessages} message(s) staff.`;

  const showJoke = Math.random() < 0.35;
  const joke = showJoke ? JOKES[Math.floor(Math.random() * JOKES.length)] : null;

  return NextResponse.json({
    ok: true,
    summary,
    joke,
    stats: {
      pendingApprovals,
      criticalTickets,
      recentFeedbacks,
      recentMessages,
    },
  });
}
