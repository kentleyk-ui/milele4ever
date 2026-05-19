import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { sendTelegramErrorAlert } from "@/lib/server/telegram-alert"

const BUCKET_NAME = "staff-profile-photos"
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
  "image/heic-sequence",
  "image/heif-sequence",
  "image/avif",
]
const MAX_FILE_SIZE = 5 * 1024 * 1024

const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
}

function resolveMimeType(file: File): string {
  if (file.type && ALLOWED_TYPES.includes(file.type)) return file.type
  const ext = (file.name ?? "").split(".").pop()?.toLowerCase() ?? ""
  return EXTENSION_TO_MIME[ext] ?? file.type
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase()
  return trimmed.replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-")
}

async function ensureBucket() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  const { data: bucket, error: bucketError } = await supabaseAdmin.storage.getBucket(BUCKET_NAME)

  if (bucketError) {
    const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })

    if (createError && !/already exists/i.test(createError.message)) {
      return { supabaseAdmin, error: createError }
    }

    return { supabaseAdmin, error: null }
  }

  if (!bucket.public) {
    const { error: updateError } = await supabaseAdmin.storage.updateBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
      allowedMimeTypes: ALLOWED_TYPES,
    })

    if (updateError) {
      return { supabaseAdmin, error: updateError }
    }
  }

  return { supabaseAdmin, error: null }
}

export async function POST(req: NextRequest) {
  const { supabaseAdmin, error: bucketError } = await ensureBucket()
  if (bucketError) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Erreur initialisation bucket photo",
      details: bucketError.message,
      statusCode: 500,
    })
    return NextResponse.json({ error: bucketError.message }, { status: 500 })
  }

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Authorization manquante",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = authData.user

  if (authError || !user) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Token invalide",
      statusCode: 401,
    })
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Image manquante",
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Image manquante" }, { status: 400 })
  }

  const resolvedMime = resolveMimeType(file)
  if (!ALLOWED_TYPES.includes(resolvedMime)) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Type image non supporte",
      details: `${file.type} / name: ${file.name}`,
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Format d'image non supporté" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Image trop volumineuse",
      details: String(file.size),
      statusCode: 400,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: "Image trop volumineuse (5 Mo max)" }, { status: 400 })
  }

  const safeName = sanitizeFileName(file.name || "photo.jpg")
  const storagePath = `${user.id}/${Date.now()}-${safeName}`
  const fileBuffer = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, fileBuffer, {
      contentType: resolvedMime,
      upsert: true,
    })

  if (uploadError) {
    void sendTelegramErrorAlert({
      route: "/api/staff/profile-photo:POST",
      message: "Erreur upload photo",
      details: uploadError.message,
      statusCode: 500,
      actorId: user.id,
      actorEmail: user.email ?? null,
    })
    return NextResponse.json({ error: uploadError.message }, { status: 500 })
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

  return NextResponse.json({
    success: true,
    publicUrl: publicUrlData.publicUrl,
    path: storagePath,
  })
}