import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert";
import { sendPushToAdminSupreme } from "@/lib/server/web-push";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KENT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      void sendTelegramErrorAlert({
        route: "/api/staff/notify-telegram:POST",
        message: "Non autorise",
        statusCode: 401,
      });
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      void sendTelegramErrorAlert({
        route: "/api/staff/notify-telegram:POST",
        message: "Token invalide",
        statusCode: 401,
      });
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    if (!BOT_TOKEN || !KENT_CHAT_ID) {
      void sendTelegramErrorAlert({
        route: "/api/staff/notify-telegram:POST",
        message: "Telegram non configure",
        statusCode: 503,
      });
      return NextResponse.json({ error: "Telegram non configuré" }, { status: 503 });
    }

    const { userId, userEmail, roleName, roleId, fullName } = await req.json() as {
      userId: string;
      userEmail: string;
      roleName: string;
      roleId?: string;
      fullName?: string;
    };

    if (!userId || !userEmail || !roleName) {
      void sendTelegramErrorAlert({
        route: "/api/staff/notify-telegram:POST",
        message: "Parametres manquants",
        statusCode: 400,
        actorId: authData.user.id,
        actorEmail: authData.user.email ?? null,
      });
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    // Le demandeur ne peut notifier que pour lui-même.
    if (authData.user.id !== userId) {
      void sendTelegramErrorAlert({
        route: "/api/staff/notify-telegram:POST",
        message: "Action interdite",
        statusCode: 403,
        actorId: authData.user.id,
        actorEmail: authData.user.email ?? null,
      });
      return NextResponse.json({ error: "Action interdite" }, { status: 403 });
    }

    const displayName = fullName || userEmail;

    const text =
      `🔔 Nouvelle demande d'accès Staff\n\n` +
      `👤 Nom : ${displayName}\n` +
      `📧 Email : ${userEmail}\n` +
      `🏷️ Rôle demandé : ${roleName}\n\n` +
      `Appuie sur un bouton pour approuver ou refuser l'accès.`;

    const inlineKeyboard = {
      inline_keyboard: [
        [
          { text: "✅ Approuver", callback_data: `approve:${userId}:${roleId ?? "na"}` },
          { text: "❌ Refuser", callback_data: `reject:${userId}:${roleId ?? "na"}` },
        ],
      ],
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);

    try {
      const res = await fetch(
        `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: KENT_CHAT_ID,
            text,
            reply_markup: inlineKeyboard,
          }),
          signal: controller.signal,
        }
      );

      const result = await res.json() as { ok: boolean; description?: string };
      if (!result.ok) {
        console.error("notify-telegram: telegram rejected message", result.description);
      }
    } catch (telegramError) {
      console.error("notify-telegram: telegram request failed", telegramError);
    } finally {
      clearTimeout(timeout);
    }

    const pushResult = await sendPushToAdminSupreme({
      title: "Nouvelle demande Staff",
      body: `${displayName} demande le rôle ${roleName}`,
      url: "/admin",
    });

    return NextResponse.json({ ok: true, queued: true, push: pushResult });
  } catch (err) {
    void sendTelegramErrorAlert({
      route: "/api/staff/notify-telegram:POST",
      message: "Exception notify-telegram",
      details: String(err),
      statusCode: 500,
    });
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
