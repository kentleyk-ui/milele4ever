import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const KENT_CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const KENT_EMAIL = "kentleyk@gmail.com";

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const token = authHeader.slice(7).trim();
    const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authData.user) {
      return NextResponse.json({ error: "Token invalide" }, { status: 401 });
    }

    // Vérifier que l'expéditeur est admin suprême
    const isKent = authData.user.email === KENT_EMAIL;
    if (!isKent) {
      const { data: profile } = await supabaseAdmin
        .from("staff_profiles")
        .select("role_id, status")
        .eq("user_id", authData.user.id)
        .single();

      if (!(profile?.role_id === "admin-supreme" && profile?.status === "approved")) {
        void sendTelegramErrorAlert({
          route: "/api/staff/broadcast:POST",
          message: "Accès interdit — rôle insuffisant",
          statusCode: 403,
          actorId: authData.user.id,
          actorEmail: authData.user.email ?? null,
        });
        return NextResponse.json({ error: "Réservé à l'administrateur suprême" }, { status: 403 });
      }
    }

    const body = await req.json() as { title?: string; message?: string };
    const title = (body.title ?? "").trim();
    const message = (body.message ?? "").trim();

    if (!title || !message) {
      return NextResponse.json({ error: "Titre et message requis" }, { status: 400 });
    }

    // Récupérer le nom de l'expéditeur
    const { data: senderProfile } = await supabaseAdmin
      .from("staff_profiles")
      .select("full_name")
      .eq("user_id", authData.user.id)
      .single();
    const senderName = senderProfile?.full_name ?? authData.user.email?.split("@")[0] ?? "Administrateur";

    // Insérer dans chat_messages comme message broadcast
    const broadcastContent = `📢 ${title}\n\n${message}`;
    const { error: insertError } = await supabaseAdmin
      .from("chat_messages")
      .insert({
        content: broadcastContent,
        sender_id: authData.user.id,
        sender_name: senderName,
        message_type: "broadcast",
      });

    if (insertError) {
      // Essai sans message_type si la colonne n'existe pas encore
      const { error: fallbackError } = await supabaseAdmin
        .from("chat_messages")
        .insert({
          content: broadcastContent,
          sender_id: authData.user.id,
          sender_name: senderName,
        });

      if (fallbackError) {
        void sendTelegramErrorAlert({
          route: "/api/staff/broadcast:POST",
          message: fallbackError.message,
          statusCode: 500,
          actorId: authData.user.id,
          actorEmail: authData.user.email ?? null,
        });
        // On continue quand même pour envoyer Telegram
      }
    }

    // Notification Telegram à Kent
    if (BOT_TOKEN && KENT_CHAT_ID) {
      const telegramText = `📢 *Annonce diffusée par ${senderName}*\n\n*${title}*\n\n${message}`;
      await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: KENT_CHAT_ID,
          text: telegramText,
          parse_mode: "Markdown",
        }),
      }).catch(() => null);
    }

    return NextResponse.json({ ok: true, sent: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
