import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert";

const KENT_EMAIL = "kentleyk@gmail.com";
const MONARK_PRIVATE_PREFIX = "[MONARK_PRIVATE]";

function parseBool(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}

function parseIntWithBounds(value: string | undefined, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

type ActorProfile = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  role_id: string | null;
  role_name: string | null;
  role_category: string | null;
  status: string | null;
};

type StaffDispatchAction =
  | { kind: "none" }
  | { kind: "staff"; message: string }
  | { kind: "user"; message: string; targetQuery: string };

function isKentTarget(target: ActorProfile) {
  const email = (target.email ?? "").trim().toLowerCase();
  return email === KENT_EMAIL || target.role_id === "admin-supreme";
}

function extractContextSection(context: string, sectionTitle: string) {
  const marker = `${sectionTitle}:`;
  const start = context.indexOf(marker);
  if (start === -1) return null;

  const after = context.slice(start + marker.length).trim();
  const nextBlockIndex = after.indexOf("\n\n");
  return (nextBlockIndex === -1 ? after : after.slice(0, nextBlockIndex)).trim();
}

function buildStaffFallbackReply(lastUserMessage: string, context: string) {
  const lower = lastUserMessage.toLowerCase();
  const feedbackSection = extractContextSection(context, "FEEDBACKS");
  const ticketSection = extractContextSection(context, "TICKETS");
  const membersSection = extractContextSection(context, "MEMBRES ACTIFS (extrait)");

  if (lower.includes("feedback")) {
    return feedbackSection
      ? `Mode secours Monark actif. Voici l'essentiel des feedbacks actuels:\n${feedbackSection}`
      : "Mode secours Monark actif. Je n'ai pas pu charger le detail des feedbacks pour l'instant, mais tu peux reessayer dans quelques secondes.";
  }

  if (lower.includes("ticket")) {
    return ticketSection
      ? `Mode secours Monark actif. Voici l'etat actuel des tickets:\n${ticketSection}`
      : "Mode secours Monark actif. Les donnees tickets sont temporairement indisponibles.";
  }

  if (lower.includes("membre") || lower.includes("equipe") || lower.includes("staff")) {
    return membersSection
      ? `Mode secours Monark actif. Voici l'extrait equipe disponible:\n${membersSection}`
      : "Mode secours Monark actif. Je ne vois pas encore l'extrait equipe, mais je peux t'aider a formuler une action ou un message staff.";
  }

  return "Mode secours Monark actif. Le moteur IA principal est indisponible pour l'instant, mais je reste operationnel pour resumer les feedbacks, les tickets et t'aider a preparer une action staff concrete.";
}

async function sendTelegramToKent(actor: ActorProfile, message: string) {
  const botToken = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;

  if (!botToken || !chatId) {
    return { ok: false, details: "Telegram non configure (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID manquants)." };
  }

  const actorName = actor.full_name ?? actor.email ?? "Staff";
  const text =
    `📨 Message via Monark pour Kent\n\n` +
    `👤 Expediteur: ${actorName}\n` +
    `📧 Email: ${actor.email ?? "inconnu"}\n\n` +
    `📝 Contenu:\n${message}`;

  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
    }),
  });

  if (!res.ok) {
    return { ok: false, details: "Echec de l'envoi Telegram vers Kent." };
  }

  const payload = (await res.json().catch(() => ({}))) as { ok?: boolean; description?: string };
  if (!payload.ok) {
    return { ok: false, details: payload.description ?? "Telegram a rejete la requete." };
  }

  return { ok: true, details: "Message Telegram envoye a Kent." };
}

async function requireStaffSession(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return null;
  const { data } = await serviceClient().auth.getUser(token);
  return data.user ?? null;
}

function withMonarkPrefix(content: string) {
  return `${MONARK_PRIVATE_PREFIX} ${content}`;
}

function stripMonarkPrefix(content: string) {
  const prefix = `${MONARK_PRIVATE_PREFIX} `;
  return content.startsWith(prefix) ? content.slice(prefix.length) : content;
}

function formatAttachmentSize(bytes: number) {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

function isTextAttachment(file: File) {
  const type = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  return type.startsWith("text/")
    || type.includes("json")
    || type.includes("csv")
    || /(\.txt|\.log|\.csv|\.json|\.md|\.yaml|\.yml|\.xml)$/i.test(name);
}

async function buildAttachmentSummary(files: File[]) {
  if (files.length === 0) return null;

  const summaries = await Promise.all(files.slice(0, 6).map(async (file) => {
    const header = `- ${file.name} (${file.type || "type inconnu"}, ${formatAttachmentSize(file.size)})`;

    if (isTextAttachment(file)) {
      const content = (await file.text()).replace(/\u0000/g, "").trim();
      const preview = content.slice(0, 2200);
      return `${header}\nExtrait:\n${preview || "[fichier vide]"}`;
    }

    if (file.type.startsWith("image/")) {
      return `${header}\nImage transmise à Claude Vision pour analyse directe.`;
    }

    if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
      return `${header}\nPDF joint. L'extraction de texte détaillée sera ajoutée dans une phase suivante.`;
    }

    return `${header}\nFichier joint disponible pour le contexte de la conversation.`;
  }));

  return `FICHIERS JOINTS:\n${summaries.join("\n\n")}`;
}

type AnthropicImageBlock = {
  type: "image";
  source: {
    type: "base64";
    media_type: "image/jpeg" | "image/png" | "image/gif" | "image/webp";
    data: string;
  };
};

const SUPPORTED_IMAGE_TYPES: AnthropicImageBlock["source"]["media_type"][] = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
];

async function buildImageBlocks(files: File[]): Promise<AnthropicImageBlock[]> {
  const imageFiles = files
    .filter((f) => SUPPORTED_IMAGE_TYPES.includes(f.type as AnthropicImageBlock["source"]["media_type"]) && f.size < 4 * 1024 * 1024)
    .slice(0, 4);
  return Promise.all(
    imageFiles.map(async (file) => {
      const buf = await file.arrayBuffer();
      return {
        type: "image" as const,
        source: {
          type: "base64" as const,
          media_type: file.type as AnthropicImageBlock["source"]["media_type"],
          data: Buffer.from(buf).toString("base64"),
        },
      };
    })
  );
}

async function parseIncomingPayload(req: NextRequest) {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const rawMessages = formData.get("messages");
    let messages: Array<{ role: string; content: string }> = [];

    if (typeof rawMessages === "string") {
      try {
        const parsed = JSON.parse(rawMessages) as Array<{ role: string; content: string }>;
        if (Array.isArray(parsed)) {
          messages = parsed;
        }
      } catch {
        messages = [];
      }
    }

    const files = formData
      .getAll("files")
      .filter((entry): entry is File => entry instanceof File && entry.size > 0);

    const [attachmentSummary, imageBlocks] = await Promise.all([
      buildAttachmentSummary(files),
      buildImageBlocks(files),
    ]);

    return {
      messages,
      memoryMode: formData.get("memoryMode") === "incognito" ? "incognito" as const : "memory" as const,
      attachmentSummary,
      imageBlocks,
    };
  }

  const body = await req.json().catch(() => ({}));
  return {
    messages: Array.isArray(body.messages) ? body.messages as Array<{ role: string; content: string }> : [],
    memoryMode: body.memoryMode === "incognito" ? "incognito" as const : "memory" as const,
    attachmentSummary: null,
    imageBlocks: [] as AnthropicImageBlock[],
  };
}

function injectAttachmentSummary(messages: Array<{ role: string; content: string }>, attachmentSummary: string | null, maxLen: number) {
  if (!attachmentSummary) return messages;

  const nextMessages = [...messages];
  for (let index = nextMessages.length - 1; index >= 0; index -= 1) {
    if (nextMessages[index]?.role === "user") {
      nextMessages[index] = {
        ...nextMessages[index],
        content: `${nextMessages[index].content}\n\n${attachmentSummary}`.slice(0, maxLen),
      };
      return nextMessages;
    }
  }

  return nextMessages;
}

function injectImageBlocks(
  messages: Array<{ role: string; content: string }>,
  imageBlocks: AnthropicImageBlock[]
): Array<{ role: string; content: string | Array<unknown> }> {
  if (!imageBlocks.length) return messages;
  const result: Array<{ role: string; content: string | Array<unknown> }> = [...messages];
  for (let i = result.length - 1; i >= 0; i--) {
    if (result[i].role === "user") {
      result[i] = {
        role: "user",
        content: [...imageBlocks, { type: "text", text: result[i].content as string }],
      };
      return result;
    }
  }
  return result;
}

async function loadMonarkMemory(userId: string, maxItems: number) {
  const sixMonthsAgoIso = new Date(Date.now() - 1000 * 60 * 60 * 24 * 30 * 6).toISOString();
  const { data, error } = await serviceClient()
    .from("staff_messages")
    .select("sender_name, content, created_at")
    .eq("user_id", userId)
    .gte("created_at", sixMonthsAgoIso)
    .like("content", `${MONARK_PRIVATE_PREFIX}%`)
    .order("created_at", { ascending: true })
    .limit(maxItems);

  if (error) return [] as Array<{ role: "user" | "assistant"; content: string }>;

  return ((data ?? []) as Array<{ sender_name: string | null; content: string; created_at: string }>)
    .map((row) => ({
      role: row.sender_name === "Monark" ? "assistant" as const : "user" as const,
      content: stripMonarkPrefix(row.content ?? ""),
    }))
    .filter((row) => row.content.trim().length > 0);
}

async function saveMonarkTurn(userId: string, role: "user" | "assistant", content: string) {
  const sender = role === "assistant" ? "Monark" : "Monark User";
  try {
    await serviceClient().from("staff_messages").insert({
      user_id: userId,
      sender_name: sender,
      content: withMonarkPrefix(content.slice(0, 8000)),
    });
  } catch {
    // Mémoire non bloquante: on continue même si l'écriture échoue.
  }
}

function extractDispatchAction(input: string): StaffDispatchAction {
  const text = input.trim();
  const lower = text.toLowerCase();
  const hasSendVerb = /(transmet|transmettre|envoie|envoyer|diffuse|publie|communique|annonce)/i.test(text);
  if (!hasSendVerb) return { kind: "none" };

  const quoted = text.match(/["“](.+?)["”]/)?.[1] ?? text.match(/'(.+?)'/)?.[1];
  const afterColon = text.includes(":") ? text.split(":").slice(1).join(":").trim() : "";
  const message = (quoted ?? afterColon).trim();
  if (!message) return { kind: "none" };

  const isGroup = /(groupe du staff|tout le staff|au staff|canal general|canal general|#general|#general)/i.test(lower);
  if (isGroup) return { kind: "staff", message: message.slice(0, 1500) };

  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0];
  if (email) return { kind: "user", message: message.slice(0, 1500), targetQuery: email };

  const targetByName = text.match(/(?:a|à)\s+([A-Za-zÀ-ÿ' -]{2,60})/i)?.[1]?.trim();
  if (targetByName && !/(staff|groupe|canal|message|utilisateur)/i.test(targetByName)) {
    return { kind: "user", message: message.slice(0, 1500), targetQuery: targetByName };
  }

  return { kind: "none" };
}

async function resolveTargetUser(query: string): Promise<ActorProfile | null> {
  const db = serviceClient();
  const q = query.trim();

  const byEmail = await db
    .from("staff_profiles")
    .select("user_id, email, full_name, role_id, role_name, role_category, status")
    .ilike("email", q)
    .eq("status", "approved")
    .maybeSingle();
  if (byEmail.data) return byEmail.data as ActorProfile;

  const byName = await db
    .from("staff_profiles")
    .select("user_id, email, full_name, role_id, role_name, role_category, status")
    .ilike("full_name", `%${q}%`)
    .eq("status", "approved")
    .limit(1)
    .maybeSingle();

  return (byName.data as ActorProfile | null) ?? null;
}

async function dispatchStaffMessage(
  actor: ActorProfile,
  action: Exclude<StaffDispatchAction, { kind: "none" }>
): Promise<{ ok: boolean; details: string }> {
  const db = serviceClient();

  if (action.kind === "staff") {
    const { error } = await db.from("staff_messages").insert({
      user_id: actor.user_id,
      sender_name: "Monark",
      content: `[Annonce admin via Monark]\n${action.message}`,
    });
    if (error) return { ok: false, details: "Impossible de publier le message dans le canal staff." };
    return { ok: true, details: "Message transmis au groupe staff dans le canal general." };
  }

  const target = await resolveTargetUser(action.targetQuery);
  if (!target) return { ok: false, details: `Utilisateur introuvable: ${action.targetQuery}` };

  const targetDisplay = target.full_name ?? target.email ?? "utilisateur";
  if (isKentTarget(target)) {
    const telegram = await sendTelegramToKent(actor, action.message);
    if (!telegram.ok) return telegram;
    return { ok: true, details: "Message transmis a Kent via Telegram." };
  }

  const { error } = await db.from("staff_messages").insert({
    user_id: actor.user_id,
    sender_name: "Monark",
    content: `[Message cible pour ${targetDisplay}]\n${action.message}`,
  });
  if (error) return { ok: false, details: "Impossible de transmettre le message a l'utilisateur cible." };
  return { ok: true, details: `Message transmis avec mention pour ${targetDisplay} dans le canal staff.` };
}

async function getStaffContext(): Promise<string> {
  const db = serviceClient();

  const [
    { count: approvedCount },
    { count: pendingCount },
    { data: members },
    { data: feedbacks },
    { data: recentChat },
  ] = await Promise.all([
    db.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("status", "approved"),
    db.from("staff_profiles").select("user_id", { count: "exact", head: true }).eq("status", "pending_approval"),
    db.from("staff_profiles").select("full_name, role_name, role_category").eq("status", "approved").order("updated_at", { ascending: false }).limit(10),
    db.from("feedbacks").select("status, type, message, created_at").order("created_at", { ascending: false }).limit(500),
    db.from("staff_messages").select("sender_name, content, created_at").order("created_at", { ascending: false }).limit(5),
  ]);

  const ticketsRes = await db
    .from("staff_tickets")
    .select("status, priority, title, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const ticketsMissing = !!ticketsRes.error && ticketsRes.error.code === "42P01";
  const ticketRows = ticketsMissing
    ? []
    : ((ticketsRes.data ?? []) as Array<{ status: string; priority: string; title: string; created_at: string }>);

  const memberList = (members ?? [])
    .map((m: { full_name: string | null; role_name: string | null; role_category: string | null }) =>
      `- ${m.full_name ?? "Inconnu"} (${m.role_name ?? m.role_category ?? "Membre"})`
    )
    .join("\n");

  const feedbackRows = (feedbacks ?? []) as Array<{ status: string; type: string; message: string; created_at: string }>;
  const totalFeedbacks = feedbackRows.length;
  const newFeedbacks = feedbackRows.filter((f) => f.status === "new").length;
  const inProgressFeedbacks = feedbackRows.filter((f) => f.status === "in-progress").length;
  const doneFeedbacks = feedbackRows.filter((f) => f.status === "done").length;

  const feedbackByType = Object.entries(
    feedbackRows.reduce<Record<string, number>>((acc, row) => {
      const k = row.type ?? "other";
      acc[k] = (acc[k] ?? 0) + 1;
      return acc;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([type, count]) => `- ${type}: ${count}`)
    .join("\n");

  const recentFeedback = feedbackRows
    .slice(0, 5)
    .map((f) => `- [${f.status}] ${(f.message ?? "Sans message").slice(0, 90)}`)
    .join("\n");

  const ticketStats = {
    total: ticketRows.length,
    open: ticketRows.filter((t) => t.status === "Ouvert").length,
    inProgress: ticketRows.filter((t) => t.status === "En cours").length,
    resolved: ticketRows.filter((t) => t.status === "Résolu").length,
    critical: ticketRows.filter((t) => t.priority === "Critique").length,
  };

  const recentTickets = ticketRows
    .slice(0, 5)
    .map((t) => `- [${t.status}/${t.priority}] ${t.title}`)
    .join("\n");

  const recentChatSummary = ((recentChat ?? []) as Array<{ sender_name: string | null; content: string; created_at: string }>)
    .filter((m) => !(m.content ?? "").startsWith(MONARK_PRIVATE_PREFIX))
    .map((m) => `- ${m.sender_name ?? "Staff"}: ${(m.content ?? "").slice(0, 70)}`)
    .join("\n");

  return `
CONTEXTE TEMPS REEL AETERNUM:
- Membres approuves: ${approvedCount ?? 0}
- Membres en attente d'approbation: ${pendingCount ?? 0}

MEMBRES ACTIFS (extrait):
${memberList || "- Aucun membre approuve pour le moment."}

FEEDBACKS:
- Total: ${totalFeedbacks}
- Nouveaux: ${newFeedbacks}
- En cours: ${inProgressFeedbacks}
- Resolus: ${doneFeedbacks}
- Taux de resolution: ${totalFeedbacks > 0 ? Math.round((doneFeedbacks / totalFeedbacks) * 100) : 0}%
- Top categories:
${feedbackByType || "- Aucune categorie"}
- Derniers feedbacks:
${recentFeedback || "- Aucun"}

TICKETS:
${ticketsMissing
  ? "- Table staff_tickets absente actuellement."
  : `- Total: ${ticketStats.total}\n- Ouverts: ${ticketStats.open}\n- En cours: ${ticketStats.inProgress}\n- Resolus: ${ticketStats.resolved}\n- Critiques: ${ticketStats.critical}\n- Derniers tickets:\n${recentTickets || "- Aucun ticket"}`}

DERNIERS MESSAGES STAFF:
${recentChatSummary || "- Aucun message recent"}
`.trim();
}

export async function POST(req: NextRequest) {
  const freeTestMode = parseBool(process.env.MALAIKA_TEST_FREE_MODE, false);
  const allowNonAdminDispatch = parseBool(process.env.MALAIKA_STAFF_ALLOW_NON_ADMIN_DISPATCH, freeTestMode);
  const model = process.env.MALAIKA_MODEL || "claude-3-5-sonnet-20241022";
  const maxTokens = parseIntWithBounds(process.env.MALAIKA_STAFF_MAX_TOKENS, freeTestMode ? 2200 : 1000, 256, 4096);
  const historyLimit = parseIntWithBounds(process.env.MALAIKA_STAFF_HISTORY_LIMIT, freeTestMode ? 60 : 36, 8, 120);
  const contentMaxLen = parseIntWithBounds(process.env.MALAIKA_STAFF_MAX_MESSAGE_CHARS, freeTestMode ? 6000 : 2500, 500, 12000);

  const user = await requireStaffSession(req);
  if (!user) {
    void sendTelegramErrorAlert({
      route: "/api/staff/malaika:POST",
      message: "Non autorise",
      statusCode: 401,
    });
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { data: actorData } = await serviceClient()
    .from("staff_profiles")
    .select("user_id, email, full_name, role_id, role_name, role_category, status")
    .eq("user_id", user.id)
    .single();

  const actor = actorData as ActorProfile | null;
  if (!actor || actor.status !== "approved") {
    void sendTelegramErrorAlert({
      route: "/api/staff/malaika:POST",
      message: "Acces staff non approuve",
      statusCode: 403,
      actorId: user.id,
      actorEmail: user.email ?? null,
    });
    return NextResponse.json({ error: "Acces staff non approuve" }, { status: 403 });
  }

  const isAdmin = actor.role_id === "admin-supreme";

  const { messages, memoryMode, attachmentSummary, imageBlocks } = await parseIncomingPayload(req);
  const isIncognito = memoryMode === "incognito";

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ reply: "Je suis pret. Dis-moi ce que tu veux faire." });
  }

  const ALLOWED_ROLES = ["user", "assistant"];
  const incoming = messages
    .filter((m: { role: string; content: string }) => m && ALLOWED_ROLES.includes(m.role) && typeof m.content === "string")
    .map((m: { role: string; content: string }) => ({
      role: m.role,
      content: String(m.content).slice(0, contentMaxLen),
    }));

  const incomingWithAttachments = injectAttachmentSummary(incoming, attachmentSummary, contentMaxLen);

  const lastUserMessage = [...incoming].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  const lastUserMessageWithAttachments = [...incomingWithAttachments].reverse().find((m) => m.role === "user")?.content?.trim() ?? "";
  if (!lastUserMessage) {
    return NextResponse.json({ reply: "Je n'ai pas compris ta demande." });
  }

  if (!isIncognito) {
    await saveMonarkTurn(actor.user_id, "user", lastUserMessageWithAttachments || lastUserMessage);
  }

  const sanitized = isIncognito
    ? incomingWithAttachments.slice(-historyLimit)
    : (await loadMonarkMemory(actor.user_id, Math.max(historyLimit * 3, 90)))
        .slice(-historyLimit)
        .filter((m) => m && ALLOWED_ROLES.includes(m.role) && typeof m.content === "string")
        .map((m) => ({
          role: m.role,
          content: String(m.content).slice(0, contentMaxLen),
        }));

  // Anthropic requires messages to start with role "user"
  const firstUserIdx = sanitized.findIndex((m) => m.role === "user");
  const sanitizedForAI = firstUserIdx >= 0 ? sanitized.slice(firstUserIdx) : [];

  // Inject image blocks into last user message for Claude Vision
  const sanitizedWithImages = injectImageBlocks(sanitizedForAI, imageBlocks);

  if (sanitized.length === 0) {
    return NextResponse.json({ reply: "Je n'ai pas compris ta demande." });
  }

  const action = extractDispatchAction(lastUserMessage);
  if (action.kind !== "none") {
    if (!isAdmin && !allowNonAdminDispatch) {
      return NextResponse.json({
        reply: "Je peux transmettre des messages uniquement sur demande d'un administrateur. Je peux quand meme t'aider a preparer le texte.",
      });
    }

    const result = await dispatchStaffMessage(actor, action);
    if (!result.ok) {
      void sendTelegramErrorAlert({
        route: "/api/staff/malaika:POST",
        message: "Echec dispatch message",
        details: result.details,
        statusCode: 400,
        actorId: actor.user_id,
        actorEmail: actor.email ?? null,
      });
      return NextResponse.json({ reply: `Je n'ai pas pu executer l'envoi: ${result.details}` }, { status: 400 });
    }

    return NextResponse.json({
      reply: `${result.details} Si tu veux, je peux aussi proposer une version reformulee du message.`,
      action: { type: action.kind === "staff" ? "send_staff" : "send_user", success: true },
    });
  }

  let context = "";
  try {
    context = await getStaffContext();
  } catch {
    context = "Contexte equipe indisponible temporairement.";
  }

  const systemPrompt = `${freeTestMode ? "MODE TEST LIBRE ACTIVE. " : ""}Tu es Monark, l'assistant de travail de l'équipe Milele/Aeternum.
Ton style: chaleureux, humain, naturel, conversationnel. Tu parles comme une vraie personne de l'équipe, pas comme un robot.
Tu peux parler librement de tous les sujets demandés par l'utilisateur, en restant respectueuse et bienveillante.
Ta mission principale: guider l'équipe, clarifier, résumer, proposer des plans d'action concrets, et accélérer le travail quotidien.
Tu t'adaptes au niveau de ton interlocuteur — simple et direct si besoin, plus technique si demandé.
Quand une information n'existe pas ou est indisponible, dis-le clairement sans inventer.
Quand l'utilisateur demande une transmission de message, l'action est gérée par le backend; ne promets pas l'envoi sans confirmation.
${isIncognito ? "Mode incognito actif: n'utilise pas de mémoire persistante et ne stocke aucune donnée de cette session." : "Tu gardes une continuité de mémoire conversationnelle jusqu'à 6 mois pour aider l'équipe dans la durée."}

${context}

Reponds toujours en francais avec des phrases naturelles et correctes.`;

  const fallbackReply = buildStaffFallbackReply(lastUserMessage, context);

  if (!process.env.ANTHROPIC_API_KEY) {
    if (!isIncognito) {
      await saveMonarkTurn(actor.user_id, "assistant", fallbackReply);
    }
    return NextResponse.json({ reply: fallbackReply, mode: "fallback", test_free_mode: freeTestMode });
  }

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: sanitizedWithImages,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Anthropic error:", err);
      void sendTelegramErrorAlert({
        route: "/api/staff/malaika:POST",
        message: "Erreur API Anthropic",
        details: err,
        statusCode: 500,
        actorId: actor.user_id,
        actorEmail: actor.email ?? null,
      });
      if (!isIncognito) {
        await saveMonarkTurn(actor.user_id, "assistant", fallbackReply);
      }
      return NextResponse.json({ reply: fallbackReply, mode: "fallback", test_free_mode: freeTestMode }, { status: 200 });
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text ?? "Je n'ai pas pu generer une reponse.";
    if (!isIncognito) {
      await saveMonarkTurn(actor.user_id, "assistant", reply);
    }
    return NextResponse.json({ reply, mode: "llm", test_free_mode: freeTestMode, model });
  } catch (err) {
    console.error("Staff Malaika error:", err);
    void sendTelegramErrorAlert({
      route: "/api/staff/malaika:POST",
      message: "Exception malaika",
      details: String(err),
      statusCode: 500,
      actorId: actor.user_id,
      actorEmail: actor.email ?? null,
    });
    if (!isIncognito) {
      await saveMonarkTurn(actor.user_id, "assistant", fallbackReply);
    }
    return NextResponse.json({ reply: fallbackReply, mode: "fallback", test_free_mode: freeTestMode }, { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await requireStaffSession(req);
  if (!user) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 });
  }

  const { error } = await serviceClient()
    .from("staff_messages")
    .delete()
    .eq("user_id", user.id)
    .like("content", `${MONARK_PRIVATE_PREFIX}%`);

  if (error) {
    return NextResponse.json({ error: "Impossible de réinitialiser la mémoire", details: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: "Mémoire Monark réinitialisée" });
}
