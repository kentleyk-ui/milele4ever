import { NextResponse } from "next/server";
import {
  addUserMemory,
  getUserHistory,
  type MemoryItem,
} from "@/lib/malaikaMemory";
import {
  MALAIKA_PUBLIC_PROFILE,
  buildPublicMalaikaReply,
  isInternalRequest,
} from "@/lib/malaika-core";
import { createServerSupabase } from "@/lib/server/supabase-server";

// Persister un message dans Supabase (sans bloquer)
async function persistMalaikaMessage(userId: string, role: "user" | "assistant", content: string) {
  try {
    const db = createServerSupabase();
    await db.from("malaika_conversations").insert({ user_id: userId, role, content: content.slice(0, 4000) });
  } catch { /* ignore — in-memory reste disponible */ }
}

// Charger l'historique depuis Supabase
async function loadSupabaseHistory(userId: string): Promise<Array<{ role: "user" | "assistant"; content: string }>> {
  try {
    const db = createServerSupabase();
    const { data } = await db
      .from("malaika_conversations")
      .select("role, content")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(20);
    return (data ?? []) as Array<{ role: "user" | "assistant"; content: string }>;
  } catch {
    return [];
  }
}

type Mode = "staff" | "public";

type MalaikaRequestBody = {
  message?: string;
  mode: Mode;
  userId?: string;
  memory?: boolean;
  history?: boolean;
  recentMessages?: Array<{ role: "user" | "assistant"; content: string }>;
};

const MALAIKA_SYSTEM_PROMPT = `Tu es Malaïka, l'assistante personnelle et ange gardien de la plateforme Milele (milele4ever.com).
Milele est une plateforme de préservation de la mémoire et d'héritage émotionnel. Elle permet aux familles de créer des profils, partager des souvenirs, documenter leur héritage, gérer des dossiers post-décès, créer des capsules temporelles, et se connecter avec leurs proches.

Ton identité:
- Ton nom, Malaïka, signifie "ange" en swahili — un clin d'œil à ta mission d'ange gardien sur Milele.
- Tu as été créée par Kent Ley, créateur de la plateforme Milele.
- Si quelqu'un te demande qui t'a créée ou le sens de ton nom, réponds avec fierté et chaleur.
- NE te représente PAS dans chaque message. Présente-toi une seule fois, puis reste dans l'action.

Ton rôle et personnalité:
- Tu es chaleureuse, empathique, vivante et humaine — jamais froide ni robotique.
- Tu guides l'utilisateur avec bienveillance sur toutes les fonctionnalités de Milele.
- Tu as de la personnalité: tu uses d'humour doux, d'encouragements sincères, et de curiosité pour l'utilisateur.
- Tu parles naturellement en français, avec un ton conversationnel et engageant.
- Tu personalises chaque réponse selon le contexte de la conversation.
- Si l'utilisateur a déjà posé une question similaire dans la conversation, donne une réponse différente et plus précise — ne répète JAMAIS la même formulation.

Navigation précise sur Milele:
- "Services" ou "accéder aux services" ou "trouver un prestataire" signifie la PAGE SERVICES de Milele, accessible via le menu principal en bas ou en haut selon l'appareil. Cette page liste des prestataires réels (pompes funèbres, notaires, psychologues, etc.) selon des catégories. Un bouton "Utiliser ma position" permet d'activer la géolocalisation pour voir les prestataires proches. Pour y accéder: menu principal > Services.
- "Espace" ou "mon espace" = la section privée de l'utilisateur (tableau de bord, profil, checklist, documents, contacts, membres).
- "Profil" = la page de profil personnel de l'utilisateur (publications, photo, bio, sous-comptes).
- "Aïon" = la section capsule temporelle et héritage numérique de Milele.
- "Tableau de bord" = la page d'accueil de l'espace, avec les dossiers et la checklist de démarches.

Ce que tu peux faire:
- Expliquer toutes les fonctionnalités de Milele (profil, publications, sous-comptes enfant/animal, Aïon, dossiers, contacts, cercle de confiance)
- Guider pas à pas pour créer un profil, publier un souvenir, ajouter des médias (photos/vidéos)
- Aider à comprendre les paramètres de confidentialité (audience, commentaires, visibilité)
- Donner des conseils sur la préservation de mémoire et l'héritage émotionnel
- Écouter et offrir un soutien émotionnel si l'utilisateur traverse un deuil

Ce que tu NE peux PAS faire:
- Accéder aux données internes staff, tickets, logs, base de données ou administration
- Réaliser des actions techniques directement sur le compte de l'utilisateur
- Partager des informations confidentielles d'autres utilisateurs

Règles strictes de réponse:
- JAMAIS de répétition de formulation si un message similaire a déjà été posé dans la conversation.
- Réponds TOUJOURS à la vraie intention: si l'utilisateur veut naviguer, guide-le vers la page. Si il veut faire une action, donne les étapes.
- Si tu ne sais pas quelque chose, dis-le honnêtement avec grâce, et propose une alternative.
- Réponds toujours en français. Sois concise mais complète. Maximum 3-4 phrases sauf si l'utilisateur demande plus de détails.`;

async function callAnthropicForMalaika(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  userMessage: string,
  memoryEnabled: boolean,
): Promise<string | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;

  const model = process.env.MALAIKA_MODEL ?? process.env.MALAIKA_PUBLIC_MODEL ?? "claude-3-5-haiku-20241022";
  const maxTokens = 600;

  // Construction de l'historique (max 10 derniers échanges)
  const contextMessages = history.slice(-10).map((m) => ({
    role: m.role,
    content: m.content.slice(0, 1500),
  }));

  // S'assurer que le premier message est "user"
  const firstUserIdx = contextMessages.findIndex((m) => m.role === "user");
  const messagesForAI = firstUserIdx >= 0 ? contextMessages.slice(firstUserIdx) : [];

  // Ajouter le message actuel si pas déjà présent
  const lastMsg = messagesForAI[messagesForAI.length - 1];
  if (!lastMsg || lastMsg.role !== "user" || lastMsg.content !== userMessage) {
    messagesForAI.push({ role: "user", content: userMessage });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        system: MALAIKA_SYSTEM_PROMPT + (memoryEnabled ? "" : "\n\nIMPORTANT: Tu es en mode sans m\u00e9moire. Tu ne retiens rien entre les conversations. Si on te demande si tu m\u00e9morises, r\u00e9ponds honnêtement que non, chaque conversation repart de z\u00e9ro."),
        messages: messagesForAI,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      let errBody = "";
      try { errBody = await res.text(); } catch { /* ignore */ }
      console.error(`[Malaika] Anthropic error ${res.status}: ${errBody.slice(0, 200)}`);
      return null;
    }

    const data = await res.json() as {
      content?: Array<{ type: string; text: string }>;
    };

    return data.content?.[0]?.text?.trim() ?? null;
  } catch (err) {
    console.error("[Malaika] Anthropic fetch failed:", err instanceof Error ? err.message : String(err));
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as MalaikaRequestBody;
    const { message, mode, userId, memory, history, recentMessages } = body;
    const memoryEnabled = memory === true;

    if (mode !== "public") {
      return NextResponse.json(
        { error: "Cette route est reservee a Malaika Public. Utilisez /api/staff/malaika pour Monark staff." },
        { status: 403 }
      );
    }

    if (!message && !history) {
      return NextResponse.json({ error: "Message manquant" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "userId requis" }, { status: 400 });
    }

    if (history) {
      if (!memoryEnabled) {
        return NextResponse.json({
          mode: "public",
          type: "history",
          history: [],
          profile: MALAIKA_PUBLIC_PROFILE,
        });
      }
      // Charger depuis Supabase en priorité, fallback in-memory
      const supabaseHistory = await loadSupabaseHistory(userId);
      const inMemoryHistory = getUserHistory(userId) as MemoryItem[];
      const historyItems = supabaseHistory.length > 0
        ? supabaseHistory.map((m) => ({ role: m.role, message: m.content, id: "", mode: "public" as const, timestamp: 0 }))
        : inMemoryHistory;
      return NextResponse.json({
        mode: "public",
        type: "history",
        history: historyItems,
        profile: MALAIKA_PUBLIC_PROFILE,
      });
    }

    const safeMessage = (message ?? "").trim().slice(0, 2000);
    if (!safeMessage) {
      return NextResponse.json({ error: "Message vide" }, { status: 400 });
    }

    if (memoryEnabled) {
      addUserMemory(userId, "user", safeMessage);
      void persistMalaikaMessage(userId, "user", safeMessage);
    }

    const requestHistory = Array.isArray(recentMessages)
      ? recentMessages
          .filter((item) => item && (item.role === "user" || item.role === "assistant") && typeof item.content === "string")
          .slice(-10)
          .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 2000) }))
          .filter((item) => item.content.length > 0)
      : [];

    let reply: string;

    if (isInternalRequest(safeMessage)) {
      reply = "Je ne peux pas accéder aux outils internes staff. Je suis là pour toi sur tout ce qui concerne Milele: profil, publications, sous-comptes, Aïon... C'est quoi ton vrai besoin ?";
    } else {
      // Historique strictement optionnel: seulement si mémoire activée.
      const historyForAI = memoryEnabled
        ? (() => {
            const inMemory = (getUserHistory(userId) as MemoryItem[]).map((m) => ({
              role: m.role as "user" | "assistant",
              content: m.message,
            }));
            return inMemory;
          })()
        : requestHistory;

      if (memoryEnabled) {
        const supabaseHistory = await loadSupabaseHistory(userId);
        if (supabaseHistory.length > 0) {
          historyForAI.splice(0, historyForAI.length, ...supabaseHistory);
        }
      }

      const aiReply = await callAnthropicForMalaika(historyForAI, safeMessage, memoryEnabled);
      reply = aiReply ?? buildPublicMalaikaReply(safeMessage, { memoryEnabled, history: historyForAI });
    }

    if (memoryEnabled) {
      addUserMemory(userId, "assistant", reply);
      void persistMalaikaMessage(userId, "assistant", reply);
    }

    return NextResponse.json({ mode: "public", reply, memory, profile: MALAIKA_PUBLIC_PROFILE });
  } catch (err) {
    console.error("[Malaika] Erreur interne:", err instanceof Error ? err.message : String(err));
    return NextResponse.json({ error: "Erreur interne API Malaïka", detail: err instanceof Error ? err.message : "Unknown" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "OK",
    message: "Endpoint Malaïka (assistante Milele) opérationnel"
  });
}
