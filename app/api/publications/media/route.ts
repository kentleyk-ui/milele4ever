import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const BUCKET_NAME = "publications"
const MAX_FILE_SIZE = 30 * 1024 * 1024
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/pjpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "image/heic",
  "image/heic-sequence",
  "image/heif",
  "image/heif-sequence",
  "video/mp4",
  "video/x-m4v",
  "video/webm",
  "video/ogg",
  "video/3gpp",
  "video/quicktime",
] as const

const EXTENSION_TO_MIME: Record<string, (typeof ALLOWED_TYPES)[number]> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  heic: "image/heic",
  heif: "image/heif",
  mp4: "video/mp4",
  m4v: "video/x-m4v",
  webm: "video/webm",
  ogg: "video/ogg",
  mov: "video/quicktime",
  qt: "video/quicktime",
  "3gp": "video/3gpp",
}

function sanitizeFileName(fileName: string) {
  const trimmed = fileName.trim().toLowerCase()
  return trimmed.replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-")
}

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )
}

async function ensureBucket(client: ReturnType<typeof adminClient>) {
  const { data: bucket, error: bucketError } = await client.storage.getBucket(BUCKET_NAME)

  if (bucketError) {
    const { error: createError } = await client.storage.createBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    })

    if (createError && !/already exists/i.test(createError.message)) {
      return createError
    }

    return null
  }

  if (!bucket.public || bucket.file_size_limit !== MAX_FILE_SIZE) {
    const { error: updateError } = await client.storage.updateBucket(BUCKET_NAME, {
      public: true,
      fileSizeLimit: MAX_FILE_SIZE,
    })

    if (updateError) {
      return updateError
    }
  }

  return null
}

function resolveMimeType(file: File) {
  const providedType = file.type.trim().toLowerCase()
  if (ALLOWED_TYPES.includes(providedType as (typeof ALLOWED_TYPES)[number])) {
    return providedType
  }

  if (providedType.startsWith("image/") || providedType.startsWith("video/")) {
    return providedType
  }

  const ext = file.name.split(".").pop()?.trim().toLowerCase() ?? ""
  return EXTENSION_TO_MIME[ext] ?? ""
}

export async function POST(req: NextRequest) {
  const supabaseAdmin = adminClient()

  const authHeader = req.headers.get("authorization")
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Non autorise" }, { status: 401 })
  }

  const token = authHeader.slice(7)
  const { data: authData, error: authError } = await supabaseAdmin.auth.getUser(token)
  const user = authData.user

  if (authError || !user) {
    return NextResponse.json({ error: "Session invalide" }, { status: 401 })
  }

  const bucketError = await ensureBucket(supabaseAdmin)
  if (bucketError) {
    return NextResponse.json({ error: `Erreur bucket: ${bucketError.message}` }, { status: 500 })
  }

  const formData = await req.formData()
  const file = formData.get("file")

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Fichier manquant" }, { status: 400 })
  }

  const effectiveType = resolveMimeType(file)
  if (!effectiveType) {
    return NextResponse.json({ error: "Format non supporte", code: "UNSUPPORTED_MEDIA_TYPE" }, { status: 400 })
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ error: "Fichier trop volumineux (30 Mo max)" }, { status: 400 })
  }

  const ext = file.name.split(".").pop() || (file.type.startsWith("video") ? "mp4" : "jpg")
  const safeName = sanitizeFileName(file.name || `media.${ext}`)
  const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
  const buffer = await file.arrayBuffer()

  const { error: uploadError } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: effectiveType,
      upsert: false,
    })

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message, code: "UPLOAD_FAILED" }, { status: 500 })
  }

  const { data: urlData } = supabaseAdmin.storage.from(BUCKET_NAME).getPublicUrl(storagePath)

  return NextResponse.json({
    success: true,
    publicUrl: urlData.publicUrl,
    mediaType: effectiveType.startsWith("video") ? "video" : "image",
    path: storagePath,
  })
}
