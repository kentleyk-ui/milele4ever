import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { enforceRateLimit, requireUser, userScopedClient } from "@/lib/server/api-security";

const historyQuerySchema = z.object({
  userId: z.string().uuid().optional(),
  days: z.coerce.number().int().min(1).max(3650).optional().default(30),
})

export async function GET(req: NextRequest) {
  try {
    const limited = enforceRateLimit(req, { key: "chat-history", limit: 30, windowMs: 60_000 })
    if (limited) return limited

    const auth = await requireUser(req);
    if (!auth) {
      return NextResponse.json({ success: false, error: "Non autorisé" }, { status: 401 });
    }

    const parsed = historyQuerySchema.safeParse({
      userId: req.nextUrl.searchParams.get("userId") ?? undefined,
      days: req.nextUrl.searchParams.get("days") ?? undefined,
    })
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: "Paramètres invalides" }, { status: 400 })
    }

    const { userId: userIdFromQuery, days } = parsed.data
    if (userIdFromQuery && userIdFromQuery !== auth.user.id) {
      return NextResponse.json({ success: false, error: "userId invalide" }, { status: 403 });
    }

    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await userScopedClient(auth.token)
      .from("conversations")
      .select("*")
      .eq("user_id", auth.user.id)
      .eq("is_archived", false)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error) throw error;

    return Response.json({ success: true, conversations: data });
  } catch (error) {
    console.error("Erreur récupération:", error);
    return Response.json({ success: false, error }, { status: 500 });
  }
}
