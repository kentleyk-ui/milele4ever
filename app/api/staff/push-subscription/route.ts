import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

type PushSubscriptionBody = {
  endpoint?: string;
  keys?: {
    auth?: string;
    p256dh?: string;
  };
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
    .select("status, accent_color")
    .eq("user_id", user.id)
    .single();

  const staff = profile as { status?: string | null; accent_color?: unknown } | null;
  if (!staff || staff.status !== "approved") return null;

  return { user, profile: staff };
}

export async function POST(req: NextRequest) {
  const auth = await requireApprovedStaff(req);
  if (!auth) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as PushSubscriptionBody;
  if (!body.endpoint || !body.keys?.auth || !body.keys?.p256dh) {
    return NextResponse.json({ error: "Abonnement invalide" }, { status: 400 });
  }

  const accent = (auth.profile.accent_color && typeof auth.profile.accent_color === "object")
    ? { ...(auth.profile.accent_color as Record<string, unknown>) }
    : {};

  const adminState = (accent.admin_state && typeof accent.admin_state === "object")
    ? { ...(accent.admin_state as Record<string, unknown>) }
    : {};

  adminState.push_subscription = {
    endpoint: body.endpoint,
    keys: body.keys,
    updated_at: new Date().toISOString(),
  };

  accent.admin_state = adminState;

  const { error } = await serviceClient()
    .from("staff_profiles")
    .update({ accent_color: accent, updated_at: new Date().toISOString() })
    .eq("user_id", auth.user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
