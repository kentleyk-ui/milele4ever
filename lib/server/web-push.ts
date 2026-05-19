import { createClient } from "@supabase/supabase-js";
import webpush, { PushSubscription } from "web-push";

export type PushMessage = {
  title: string;
  body: string;
  url?: string;
};

type StaffProfileRow = {
  user_id: string;
  accent_color?: unknown;
};

type StoredPushSubscription = {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
};

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

function normalizeSubscription(value: unknown): StoredPushSubscription | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as { endpoint?: unknown; keys?: { auth?: unknown; p256dh?: unknown } };
  if (typeof raw.endpoint !== "string") return null;
  if (typeof raw.keys?.auth !== "string" || typeof raw.keys?.p256dh !== "string") return null;
  return {
    endpoint: raw.endpoint,
    keys: {
      auth: raw.keys.auth,
      p256dh: raw.keys.p256dh,
    },
  };
}

function extractSubscriptionsFromAccent(accentColor: unknown): StoredPushSubscription[] {
  if (!accentColor || typeof accentColor !== "object") return [];
  const accent = accentColor as { admin_state?: unknown };
  if (!accent.admin_state || typeof accent.admin_state !== "object") return [];

  const adminState = accent.admin_state as {
    push_subscription?: unknown;
    push_subscriptions?: unknown;
  };

  const single = normalizeSubscription(adminState.push_subscription);
  const multi = Array.isArray(adminState.push_subscriptions)
    ? adminState.push_subscriptions.map(normalizeSubscription).filter(Boolean) as StoredPushSubscription[]
    : [];

  const list = [single, ...multi].filter(Boolean) as StoredPushSubscription[];
  const unique = new Map<string, StoredPushSubscription>();
  list.forEach((item) => unique.set(item.endpoint, item));
  return Array.from(unique.values());
}

function ensureVapidConfigured() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT || "mailto:admin@milele4ever.com";

  if (!publicKey || !privateKey) return false;

  webpush.setVapidDetails(subject, publicKey, privateKey);
  return true;
}

export async function sendPushToAdminSupreme(message: PushMessage) {
  if (!ensureVapidConfigured()) {
    return { ok: false as const, reason: "missing-vapid" as const, sent: 0, failed: 0 };
  }

  const db = serviceClient();
  const { data, error } = await db
    .from("staff_profiles")
    .select("user_id, accent_color")
    .eq("role_id", "admin-supreme")
    .eq("status", "approved");

  if (error) {
    return { ok: false as const, reason: "query-error" as const, sent: 0, failed: 0 };
  }

  const rows = (data ?? []) as StaffProfileRow[];
  const subscriptions = rows.flatMap((row) => extractSubscriptionsFromAccent(row.accent_color));
  if (subscriptions.length === 0) {
    return { ok: false as const, reason: "no-subscription" as const, sent: 0, failed: 0 };
  }

  const payload = JSON.stringify({
    title: message.title,
    body: message.body,
    url: message.url ?? "/staff",
  });

  let sent = 0;
  let failed = 0;

  for (const subscription of subscriptions) {
    try {
      await webpush.sendNotification(subscription as PushSubscription, payload);
      sent += 1;
    } catch {
      failed += 1;
    }
  }

  return { ok: sent > 0, reason: sent > 0 ? "sent" : "send-failed", sent, failed };
}
