import { NextRequest } from "next/server";
import { z } from "zod";
import { enforceRateLimit, requireUser, userScopedClient } from "@/lib/server/api-security";

const saveBodySchema = z.object({
  message: z.string().trim().min(1).max(12000),
  role: z.enum(["user", "assistant"]),
  files: z.array(z.union([z.string(), z.object({}).passthrough()])).max(10).optional().default([]),
  userId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  try {
    const limited = enforceRateLimit(req as NextRequest, { key: "chat-save", limit: 60, windowMs: 60_000 })
    if (limited) return limited

    const auth = await requireUser(req as NextRequest);
    if (!auth) {
      return Response.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const parsed = saveBodySchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return Response.json({ success: false, error: "Payload invalide" }, { status: 400 })
    }

    const body = parsed.data
    const message = body.message
    const role = body.role

    // Empêche l'injection d'un autre user_id depuis le client
    if (body.userId && body.userId !== auth.user.id) {
      return Response.json({ success: false, error: "userId invalide" }, { status: 403 });
    }

    const files = Array.isArray(body.files) ? body.files : [];

    const { data, error } = await userScopedClient(auth.token)
      .from("conversations")
      .insert({
        user_id: auth.user.id,
        message,
        role,
        files,
      })
      .select("id, user_id, message, role, files, created_at, archived_at, is_archived")
      .single();

    if (error) {
      throw error;
    }

    return Response.json({ success: true, data });
  } catch (error) {
    console.error("Erreur sauvegarde:", error);
    return Response.json({ success: false, error }, { status: 500 });
  }
}
