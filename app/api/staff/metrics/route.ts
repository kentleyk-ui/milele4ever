import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type StaffProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role_name: string | null;
  status: string | null;
  accent_color: Record<string, unknown> | null;
};

type FeedbackRow = {
  id: string;
  type: string;
  status: string;
  created_at: string;
};

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
    .select("user_id, status")
    .eq("user_id", user.id)
    .single();

  const staff = profile as { user_id: string; status: string | null } | null;
  if (!staff || staff.status !== "approved") return null;

  return user;
}

export async function GET(req: NextRequest) {
  const user = await requireApprovedStaff(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const db = serviceClient();

  const [
    teamPreviewRes,
    approvedCountRes,
    pendingCountRes,
    feedbackRes,
    meRes,
  ] = await Promise.all([
    db
      .from("staff_profiles")
      .select("user_id, full_name, email, role_name, status, accent_color")
      .eq("status", "approved")
      .order("created_at", { ascending: true })
      .limit(6),
    db
      .from("staff_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "approved"),
    db
      .from("staff_profiles")
      .select("user_id", { count: "exact", head: true })
      .eq("status", "pending_approval"),
    db
      .from("feedbacks")
      .select("id, type, status, created_at")
      .order("created_at", { ascending: false })
      .limit(1000),
    db
      .from("staff_profiles")
      .select("user_id, full_name, email, role_name, status, accent_color")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const feedbackRows = (feedbackRes.data ?? []) as FeedbackRow[];
  const feedbackTotal = feedbackRows.length;
  const feedbackNew = feedbackRows.filter((row) => row.status === "new").length;

  return NextResponse.json({
    ok: true,
    me: (meRes.data ?? null) as StaffProfile | null,
    teamPreview: (teamPreviewRes.data ?? []) as StaffProfile[],
    counts: {
      approvedMembers: approvedCountRes.count ?? 0,
      pendingApprovals: pendingCountRes.count ?? 0,
      feedbackTotal,
      feedbackNew,
    },
    feedbackRows,
  });
}
