import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert";

export const dynamic = "force-dynamic";

type TelegramUpdate = {
  callback_query?: {
    id: string;
    from: { id: number; username?: string };
    message?: { chat: { id: number }; message_id: number; text?: string };
    data?: string;
  };
};

export async function POST(req: NextRequest) {
  const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN ?? "";
  const KENT_CHAT_ID = process.env.TELEGRAM_CHAT_ID ?? "";
  const APPROVER_USER_ID = process.env.TELEGRAM_APPROVER_USER_ID ?? "";
  const WEBHOOK_SECRET = process.env.TELEGRAM_WEBHOOK_SECRET ?? "";

  // Client admin (service_role) pour bypasser RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  if (!BOT_TOKEN || !KENT_CHAT_ID) {
    void sendTelegramErrorAlert({
      route: "/api/staff/telegram-webhook:POST",
      message: "Telegram non configure",
      statusCode: 503,
    });
    return NextResponse.json({ error: "Telegram non configuré" }, { status: 503 });
  }

  // Vérifier le secret optionnel passé dans le header X-Telegram-Bot-Api-Secret-Token
  if (WEBHOOK_SECRET) {
    const secret = req.headers.get("x-telegram-bot-api-secret-token");
    if (secret !== WEBHOOK_SECRET) {
      void sendTelegramErrorAlert({
        route: "/api/staff/telegram-webhook:POST",
        message: "Webhook secret invalide",
        statusCode: 401,
      });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const update = await req.json() as TelegramUpdate;

  // On ne traite que les callback_query (boutons inline)
  if (!update.callback_query) {
    return NextResponse.json({ ok: true });
  }

  const cq = update.callback_query;
  const chatId = cq.message?.chat.id;
  const fromId = String(cq.from.id);

  // Seul l'admin Telegram configuré peut approuver/refuser
  const byUserId = APPROVER_USER_ID ? fromId === APPROVER_USER_ID : true;
  const byChat = chatId ? String(chatId) === String(KENT_CHAT_ID) : false;
  if (!(byUserId && byChat)) {
    await answerCallback(BOT_TOKEN, cq.id, "⛔ Tu n'es pas autorisé à faire cette action.");
    return NextResponse.json({ ok: true });
  }

  const data = cq.data ?? "";
  const [action, userId, roleIdRaw] = data.split(":");
  const requestedRoleId = roleIdRaw && roleIdRaw !== "na" ? roleIdRaw : null;

  if (!action || !userId || !["approve", "reject"].includes(action)) {
    await answerCallback(BOT_TOKEN, cq.id, "Action inconnue.");
    return NextResponse.json({ ok: true });
  }

  const newStatus = action === "approve" ? "approved" : "rejected";

  // Récupérer les infos du membre pour le message de confirmation
  const { data: profile } = await supabaseAdmin
    .from("staff_profiles")
    .select("full_name, email, role, role_id, role_name, role_category, status")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    await answerCallback(BOT_TOKEN, cq.id, "Profil introuvable.");
    return NextResponse.json({ ok: true });
  }

  if (profile.status === "approved" || profile.status === "rejected") {
    await answerCallback(BOT_TOKEN, cq.id, `Ce profil est déjà ${profile.status === "approved" ? "approuvé ✅" : "refusé ❌"}.`);
    return NextResponse.json({ ok: true });
  }

  // Récupérer l'user_id de Kent pour approved_by
  const { data: kentUser } = await supabaseAdmin.auth.admin.listUsers();
  const kent = kentUser?.users?.find(u => u.email === "kentleyk@gmail.com");

  const updateData: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };

  // Compat colonne legacy `role` + fallback role_id depuis le callback Telegram
  if (newStatus === "approved") {
    if (!profile.role_id && requestedRoleId) {
      const rolesModule = await import("@/lib/roles");
      const requestedRole = rolesModule.ALL_ROLES.find((item: { id: string }) => item.id === requestedRoleId);
      if (requestedRole) {
        updateData.role = requestedRole.id;
        updateData.role_id = requestedRole.id;
        updateData.role_name = requestedRole.name;
        updateData.role_category = requestedRole.categoryId;
      }
    } else {
      updateData.role = profile.role ?? profile.role_id ?? "member";
    }
  }

  if (newStatus === "approved" && kent) {
    updateData.approved_by = kent.id;
    updateData.approved_at = new Date().toISOString();
  }

  const { error } = await supabaseAdmin
    .from("staff_profiles")
    .update(updateData)
    .eq("user_id", userId);

  if (error) {
    void sendTelegramErrorAlert({
      route: "/api/staff/telegram-webhook:POST",
      message: "Erreur update staff profile",
      details: error.message,
      statusCode: 500,
    });
    await answerCallback(BOT_TOKEN, cq.id, `❌ Erreur : ${error.message}`);
    return NextResponse.json({ ok: true });
  }

  // Si approuvé, lever un éventuel ban précédent pour autoriser la connexion immédiate.
  if (newStatus === "approved") {
    const adminAuth = supabaseAdmin.auth.admin as unknown as {
      updateUserById: (id: string, attrs: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    await adminAuth.updateUserById(userId, { ban_duration: "none" });
  }

  // Répondre au callback (fait disparaître le spinner)
  const emoji = newStatus === "approved" ? "✅" : "❌";
  const actionText = newStatus === "approved" ? "approuvé" : "refusé";
  const displayName = profile.full_name ?? profile.email ?? userId;
  await answerCallback(BOT_TOKEN, cq.id, `${emoji} ${displayName} a été ${actionText}.`);

  // Éditer le message original pour montrer la décision
  if (cq.message && chatId) {
    const originalText = cq.message.text ?? "";
    const updatedText =
      originalText +
      `\n\n${emoji} Décision : ${actionText.toUpperCase()} par Kent`;

    await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/editMessageText`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: cq.message.message_id,
        text: updatedText,
        reply_markup: { inline_keyboard: [] }, // Supprimer les boutons
      }),
    });
  }

  return NextResponse.json({ ok: true });
}

async function answerCallback(botToken: string, callbackQueryId: string, text: string) {
  await fetch(`https://api.telegram.org/bot${botToken}/answerCallbackQuery`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      callback_query_id: callbackQueryId,
      text,
      show_alert: true,
    }),
  });
}
