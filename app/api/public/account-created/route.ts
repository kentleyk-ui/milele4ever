import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendPushToAdminSupreme } from "@/lib/server/web-push";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KENT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

type AccountCreatedBody = {
  userId?: string;
  email?: string;
  kind?: "public" | "staff";
  displayName?: string;
};

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function POST(req: NextRequest) {
  try {
    if (!BOT_TOKEN || !KENT_CHAT_ID) {
      return NextResponse.json({ ok: true, queued: false, reason: "telegram-not-configured" });
    }

    const body = (await req.json().catch(() => ({}))) as AccountCreatedBody;
    const userId = body.userId?.trim();
    const email = body.email?.trim().toLowerCase();
    const kind = body.kind === "staff" ? "staff" : "public";

    if (!userId || !email) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const supabaseAdmin = serviceClient();
    const { data: userRes, error: userErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (userErr || !userRes.user) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });
    }

    const authEmail = (userRes.user.email ?? "").trim().toLowerCase();
    if (!authEmail || authEmail !== email) {
      return NextResponse.json({ error: "Incohérence identité" }, { status: 403 });
    }

    const createdAt = new Date(userRes.user.created_at ?? 0).getTime();
    const now = Date.now();
    // Protection simple: ne notifier que les comptes créés récemment.
    if (!createdAt || now - createdAt > 1000 * 60 * 15) {
      return NextResponse.json({ ok: false, reason: "creation-too-old" }, { status: 409 });
    }

    const display = (body.displayName ?? "").trim() || authEmail;
    const text =
      `🆕 Nouveau compte ${kind === "staff" ? "Staff" : "Public"}\n\n` +
      `👤 ${display}\n` +
      `📧 ${authEmail}\n` +
      `🕒 ${new Date().toLocaleString("fr-FR")}`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: KENT_CHAT_ID,
        text,
      }),
    });

    const pushResult = await sendPushToAdminSupreme({
      title: "Nouveau compte Milele",
      body: `${kind === "staff" ? "Staff" : "Public"}: ${display}`,
      url: kind === "staff" ? "/staff" : "/admin",
    });

    return NextResponse.json({ ok: true, queued: true, push: pushResult });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
