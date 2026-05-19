import { NextRequest, NextResponse } from "next/server";
import { enforceRateLimit, requireApprovedAdmin, serviceClient } from "@/lib/server/api-security";

export async function POST(req: NextRequest) {
  const limited = enforceRateLimit(req, { key: "chat-archive", limit: 5, windowMs: 60_000 })
  if (limited) return limited

  const admin = await requireApprovedAdmin(req);
  if (!admin) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { error } = await serviceClient().rpc("archive_old_conversations");
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
