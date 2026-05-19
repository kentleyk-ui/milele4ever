"use client"

import Image from "next/image"
import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import {
  ImageIcon, Heart, MessageCircle, Trash2,
  Edit, X, Check, Settings, Send, Search, BookOpen, Clock,
  Baby, Camera, Rocket, CalendarDays, LogOut,
  Plus, House, BriefcaseBusiness, SlidersHorizontal, Link2, GalleryHorizontal,
} from "lucide-react"
import Link from "next/link"

type PublicationAudience = "public" | "circle" | "private"
type CommentPolicy = "everyone" | "circle" | "nobody"

type PublicationMedia = {
  type: "image" | "video"
  url: string
}

type SubAccountType = "child" | "pet"

type SubAccount = {
  id: string
  owner_user_id: string
  account_type: SubAccountType
  display_name: string
  visibility: "public" | "private"
  allow_minor_publish: boolean
  allow_minor_comment: boolean
  created_at: string
}

type PublicationSettings = {
  audience: PublicationAudience
  commentPolicy: CommentPolicy
  media?: PublicationMedia[]
  albumTitle?: string
  targetSubAccountId?: string
  targetSubAccountName?: string
  targetSubAccountType?: SubAccountType
}

const DEFAULT_PUBLICATION_SETTINGS: PublicationSettings = {
  audience: "public",
  commentPolicy: "everyone",
}

const META_MARKER = "[[MILELE_META]]"

function serializePublicationContent(content: string, settings: PublicationSettings) {
  return `${META_MARKER}${JSON.stringify(settings)}\n${content.trim()}`
}

function parsePublicationContent(rawContent: string) {
  if (!rawContent.startsWith(META_MARKER)) {
    return {
      plainContent: rawContent,
      settings: DEFAULT_PUBLICATION_SETTINGS,
    }
  }

  const contentWithoutMarker = rawContent.slice(META_MARKER.length)
  const firstLineBreak = contentWithoutMarker.indexOf("\n")
  if (firstLineBreak === -1) {
    return {
      plainContent: rawContent,
      settings: DEFAULT_PUBLICATION_SETTINGS,
    }
  }

  try {
    const settings = JSON.parse(contentWithoutMarker.slice(0, firstLineBreak)) as Partial<PublicationSettings>
    const targetSubAccountId = typeof settings.targetSubAccountId === "string" && settings.targetSubAccountId.trim().length > 0
      ? settings.targetSubAccountId.trim()
      : undefined
    const targetSubAccountName = typeof settings.targetSubAccountName === "string" && settings.targetSubAccountName.trim().length > 0
      ? settings.targetSubAccountName.trim().slice(0, 80)
      : undefined
    const targetSubAccountType = settings.targetSubAccountType === "child" || settings.targetSubAccountType === "pet"
      ? settings.targetSubAccountType
      : undefined

    return {
      plainContent: contentWithoutMarker.slice(firstLineBreak + 1),
      settings: {
        audience: settings.audience === "circle" || settings.audience === "private" ? settings.audience : "public",
        commentPolicy: settings.commentPolicy === "circle" || settings.commentPolicy === "nobody" ? settings.commentPolicy : "everyone",
        albumTitle: typeof settings.albumTitle === "string" && settings.albumTitle.trim().length > 0
          ? settings.albumTitle.trim().slice(0, 80)
          : undefined,
        media: Array.isArray(settings.media)
          ? settings.media
              .map((item) => {
                if (!item || typeof item !== "object") return null
                const maybeUrl = (item as { url?: unknown }).url
                if (typeof maybeUrl !== "string" || !/^https?:\/\//i.test(maybeUrl)) return null
                return {
                  type: inferMediaType(maybeUrl),
                  url: maybeUrl,
                } as PublicationMedia
              })
              .filter(Boolean) as PublicationMedia[]
          : [],
        targetSubAccountId,
        targetSubAccountName,
        targetSubAccountType,
      } satisfies PublicationSettings,
    }
  } catch {
    return {
      plainContent: rawContent,
      settings: DEFAULT_PUBLICATION_SETTINGS,
    }
  }
}

function audienceLabel(audience: PublicationAudience) {
  if (audience === "circle") return "Cercle"
  if (audience === "private") return "Moi uniquement"
  return "Public"
}

function commentPolicyLabel(policy: CommentPolicy) {
  if (policy === "circle") return "Commentaires: cercle"
  if (policy === "nobody") return "Commentaires: fermés"
  return "Commentaires: ouverts"
}

function subAccountTypeLabel(value: SubAccountType) {
  return value === "child" ? "Enfant" : "Animal"
}

function publicationActorName(settings: PublicationSettings | undefined, fallbackAuthorName: string) {
  const subAccountName = settings?.targetSubAccountName?.trim()
  return subAccountName && subAccountName.length > 0 ? subAccountName : fallbackAuthorName
}

function inferMediaType(url: string): "image" | "video" {
  const normalized = url.toLowerCase()
  if (normalized.match(/\.(mp4|webm|ogg|mov)(\?|$)/)) return "video"
  return "image"
}

function parseMediaUrls(value: string) {
  const entries = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => /^https?:\/\//i.test(line))
    .slice(0, 6)

  const unique = Array.from(new Set(entries))
  return unique.map((url) => ({ type: inferMediaType(url), url }))
}

type MediaProtectionOptions = {
  lockInteractions?: boolean
  onBlockedInteraction?: (event: { preventDefault: () => void; stopPropagation: () => void }) => void
}

function renderPublicationMedia(
  media: PublicationMedia[] | undefined,
  fallbackImageUrl: string | null,
  albumTitle?: string,
  protection?: MediaProtectionOptions,
) {
  const normalizedMedia = (media ?? []).filter((item) => item.url.trim().length > 0)
  const hasStructuredMedia = normalizedMedia.length > 0

  if (!hasStructuredMedia && !fallbackImageUrl) return null

  if (!hasStructuredMedia && fallbackImageUrl) {
    return (
      <Image
        src={fallbackImageUrl}
        alt="Publication"
        width={1200}
        height={800}
        loading="lazy"
        unoptimized
        draggable={false}
        onContextMenu={protection?.lockInteractions ? protection.onBlockedInteraction : undefined}
        className="w-full rounded-xl mb-3 max-h-64 object-cover"
      />
    )
  }

  const isAlbum = normalizedMedia.length > 1
  const visibleMedia = normalizedMedia.slice(0, 4)
  const remainingCount = Math.max(0, normalizedMedia.length - visibleMedia.length)

  return (
    <div className="mb-3">
      {isAlbum && (
        <div
          className="mb-2 px-3 py-2 rounded-xl flex items-center justify-between"
          style={{
            background: "color-mix(in srgb, var(--primary) 8%, var(--secondary))",
            border: "1px solid color-mix(in srgb, var(--primary) 16%, var(--border))",
          }}
        >
          <div className="flex items-center gap-2 min-w-0">
            <GalleryHorizontal size={13} style={{ color: "var(--primary)" }} />
            <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>
              {albumTitle?.trim() || "Album"}
            </p>
          </div>
          <span className="text-[11px] font-medium" style={{ color: "var(--muted-foreground)" }}>
            {normalizedMedia.length} média{normalizedMedia.length > 1 ? "s" : ""}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {visibleMedia.map((item, index) => (
          <div
            key={`${item.url}-${index}`}
            className={`rounded-xl overflow-hidden relative ${
              (visibleMedia.length === 1)
                ? "col-span-2"
                : (visibleMedia.length === 3 && index === 0)
                ? "col-span-2"
                : "col-span-1"
            }`}
            style={{ border: "1px solid var(--border)" }}
          >
            {item.type === "video" ? (
              <video
                src={item.url}
                controls
                playsInline
                controlsList={protection?.lockInteractions ? "nodownload noplaybackrate" : undefined}
                disablePictureInPicture={protection?.lockInteractions}
                onContextMenu={protection?.lockInteractions ? protection.onBlockedInteraction : undefined}
                className="w-full max-h-80 bg-black"
              />
            ) : (
              <Image
                src={item.url}
                alt="Publication"
                width={1200}
                height={800}
                loading="lazy"
                unoptimized
                draggable={false}
                onContextMenu={protection?.lockInteractions ? protection.onBlockedInteraction : undefined}
                className="w-full max-h-80 object-cover"
              />
            )}
            {remainingCount > 0 && index === visibleMedia.length - 1 && (
              <div
                className="absolute inset-0 flex items-center justify-center text-lg font-extrabold"
                style={{
                  color: "#fff",
                  background: "rgba(2, 6, 23, 0.55)",
                  textShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              >
                +{remainingCount}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

interface Publication {
  id: string
  user_id?: string
  content: string
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
  settings?: PublicationSettings
}

interface FeedItem extends Publication {
  user_id: string
  author_name: string
  author_avatar_url: string | null
}

interface PublicationComment {
  id: string
  publication_id: string
  user_id: string
  content: string
  created_at: string
  author_name?: string
  author_avatar_url?: string | null
}

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

export default function ProfilPage() {
  const router = useRouter()
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  // Refs pour upload fichiers
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const editCameraInputRef = useRef<HTMLInputElement>(null)
  const editGalleryInputRef = useRef<HTMLInputElement>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<Array<{ url: string; type: "image" | "video"; file?: File }>>([])
  const [editMediaPreview, setEditMediaPreview] = useState<Array<{ url: string; type: "image" | "video"; file?: File }>>([])
  const [showEnfantForm, setShowEnfantForm] = useState(false)
  const [deployingEnfantId, setDeployingEnfantId] = useState<string | null>(null)

  // États profil (lecture seule)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [subAccounts, setSubAccounts] = useState<SubAccount[]>([])
  const [subAccountsEnabled, setSubAccountsEnabled] = useState(true)
  const [subAccountNotice, setSubAccountNotice] = useState<string | null>(null)
  const [newSubAccountName, setNewSubAccountName] = useState("")
  const [newSubAccountType, setNewSubAccountType] = useState<SubAccountType>("child")
  const [creatingSubAccount, setCreatingSubAccount] = useState(false)

  // États publications
  const [publications, setPublications] = useState<Publication[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [feedPage, setFeedPage] = useState(0)
  const [feedHasMore, setFeedHasMore] = useState(true)
  const [feedLoadingMore, setFeedLoadingMore] = useState(false)
  const [publicationContent, setPublicationContent] = useState("")
  const [publicationImage, setPublicationImage] = useState<string | null>(null)
  const [publicationMediaUrls, setPublicationMediaUrls] = useState("")
  const [publicationAlbumTitle, setPublicationAlbumTitle] = useState("")
  const [publicationIsAlbum, setPublicationIsAlbum] = useState(false)
  const [publicationAudience, setPublicationAudience] = useState<PublicationAudience>("public")
  const [publicationCommentPolicy, setPublicationCommentPolicy] = useState<CommentPolicy>("everyone")
  const [publicationTargetSubAccountId, setPublicationTargetSubAccountId] = useState<string>("self")
  const [publishingPost, setPublishingPost] = useState(false)
  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editingContent, setEditingContent] = useState("")
  const [editingAudience, setEditingAudience] = useState<PublicationAudience>("public")
  const [editingCommentPolicy, setEditingCommentPolicy] = useState<CommentPolicy>("everyone")
  const [editingMediaUrls, setEditingMediaUrls] = useState("")
  const [postNotice, setPostNotice] = useState<string | null>(null)
  const [uploadIssues, setUploadIssues] = useState<string[]>([])
  const [wallStyle, setWallStyle] = useState<"aurora" | "glass" | "neon">("aurora")

  // Likes / commentaires
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentsMap, setCommentsMap] = useState<Record<string, PublicationComment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set())
  const [commentsEnabled, setCommentsEnabled] = useState(true)

  // Feed search + filter
  const [feedSearch, setFeedSearch] = useState("")
  const [feedFilter, setFeedFilter] = useState<"all" | "public" | "circle" | "mine">("all")
  
  // Global search
  const [globalSearch, setGlobalSearch] = useState("")
  const [globalSearchResults, setGlobalSearchResults] = useState<Array<{ type: "publication"; id: string; name: string; preview: string }>>([])
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false)
  const [globalSearchLoading, setGlobalSearchLoading] = useState(false)
  const globalSearchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const [showComposer, setShowComposer] = useState(false)
  const [showComposerAdvanced, setShowComposerAdvanced] = useState(false)
  const [showManualMediaInput, setShowManualMediaInput] = useState(false)
  const protectionAlertCooldownRef = useRef<Record<string, number>>({})

  useEffect(() => {
    const storedWallStyle = localStorage.getItem("milele_wall_style")
    if (storedWallStyle === "aurora" || storedWallStyle === "glass" || storedWallStyle === "neon") {
      setWallStyle(storedWallStyle)
    }
  }, [])

  useEffect(() => {
    if (mediaPreview.length > 1 && !publicationIsAlbum) {
      setPublicationIsAlbum(true)
    }
  }, [mediaPreview.length, publicationIsAlbum])

  const cardSurfaceStyle = useCallback((highlighted = false) => {
    if (wallStyle === "neon") {
      return {
        background: "linear-gradient(145deg, color-mix(in srgb, var(--card) 86%, transparent), color-mix(in srgb, #00ffa3 8%, var(--card)))",
        border: `1px solid ${highlighted ? "color-mix(in srgb, #00ffa3 45%, var(--border))" : "color-mix(in srgb, #00ffa3 28%, var(--border))"}`,
        boxShadow: highlighted
          ? "0 10px 30px rgba(0, 255, 163, 0.16), 0 0 0 1px color-mix(in srgb, #00ffa3 18%, transparent)"
          : "0 6px 22px rgba(0, 255, 163, 0.08)",
        backdropFilter: "blur(18px)",
      }
    }
    if (wallStyle === "glass") {
      return {
        background: "color-mix(in srgb, var(--card) 80%, transparent)",
        border: `1px solid ${highlighted ? "color-mix(in srgb, var(--primary) 30%, var(--border))" : "var(--border)"}`,
        boxShadow: highlighted ? "0 8px 28px rgba(2, 8, 23, 0.16)" : "0 4px 16px rgba(2, 8, 23, 0.1)",
        backdropFilter: "blur(20px)",
      }
    }
    return {
      background: "linear-gradient(145deg, color-mix(in srgb, var(--card) 90%, transparent), color-mix(in srgb, var(--card) 75%, transparent))",
      border: `1px solid ${highlighted ? "color-mix(in srgb, var(--primary) 30%, var(--border))" : "color-mix(in srgb, var(--primary) 24%, var(--border))"}`,
      boxShadow: highlighted
        ? "0 8px 28px rgba(2, 8, 23, 0.16), 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent)"
        : "0 8px 28px rgba(2, 8, 23, 0.14), 0 0 0 1px color-mix(in srgb, var(--primary) 6%, transparent)",
      backdropFilter: "blur(20px)",
    }
  }, [wallStyle])

  const notifyPublicationProtectionAlert = useCallback(async (publicationId: string, ownerId: string | undefined) => {
    if (!user || !ownerId || ownerId === user.id) return

    const cooldownKey = `${publicationId}:${ownerId}`
    const now = Date.now()
    const lastSent = protectionAlertCooldownRef.current[cooldownKey] ?? 0
    if (now - lastSent < 60_000) return
    protectionAlertCooldownRef.current[cooldownKey] = now

    const session = (await supabase.auth.getSession()).data.session
    if (!session) return

    void fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ type: "comment", publication_id: publicationId }),
    })
  }, [user])

  const handleProtectedInteraction = useCallback((
    event: { preventDefault: () => void; stopPropagation: () => void },
    publicationId: string,
    ownerId?: string,
  ) => {
    event.preventDefault()
    event.stopPropagation()
    setPostNotice("Copie et téléchargement désactivés sur cette publication.")
    void notifyPublicationProtectionAlert(publicationId, ownerId)
  }, [notifyPublicationProtectionAlert])

  const startEditingPublication = useCallback((post: Publication) => {
    setEditingPostId(post.id)
    setEditingContent(post.content)
    setEditingAudience(post.settings?.audience ?? "public")
    setEditingCommentPolicy(post.settings?.commentPolicy ?? "everyone")
    setEditingMediaUrls((post.settings?.media ?? []).map((mediaItem) => mediaItem.url).join("\n"))
  }, [])

  const recomposePublication = useCallback((post: Publication) => {
    const postMediaUrls = (post.settings?.media ?? []).map((mediaItem) => mediaItem.url).join("\n")
    const hasAlbum = (post.settings?.media?.length ?? 0) > 1 || Boolean(post.settings?.albumTitle)

    setShowComposer(true)
    setPublicationContent(post.content)
    setPublicationMediaUrls(postMediaUrls)
    setPublicationAlbumTitle(post.settings?.albumTitle ?? "")
    setPublicationIsAlbum(hasAlbum)
    setPublicationAudience(post.settings?.audience ?? "public")
    setPublicationCommentPolicy(post.settings?.commentPolicy ?? "everyone")
    setPublicationTargetSubAccountId(post.settings?.targetSubAccountId ?? "self")
    setShowManualMediaInput(postMediaUrls.length > 0)
    setShowComposerAdvanced(true)
    setMediaPreview([])
    setPostNotice("Publication chargée dans l'éditeur. Vous pouvez la refaire ou modifier puis publier.")
    window.scrollTo({ top: 0, behavior: "smooth" })
  }, [])

  // Auth
  useEffect(() => {
    void (async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email ?? "" })
      } else {
        router.push("/espace")
      }
      setLoading(false)
    })()
  }, [router])

  // Charger le profil
  useEffect(() => {
    if (!user) return

    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("id, email, display_name, avatar_url, bio, created_at")
        .eq("id", user.id)
        .maybeSingle()

      const p = data as UserProfile | null
      if (p) {
        setProfile(p)
      } else {
        setProfile({
          id: user.id,
          email: user.email,
          display_name: user.email.split("@")[0] ?? "",
          avatar_url: null,
          bio: null,
          created_at: new Date().toISOString(),
        })
      }
    })()
  }, [user])

  // Charger les sous-comptes enfant / animal
  useEffect(() => {
    if (!user) return

    void (async () => {
      const { data, error } = await supabase
        .from("sub_accounts")
        .select("id, owner_user_id, account_type, display_name, visibility, allow_minor_publish, allow_minor_comment, created_at")
        .eq("owner_user_id", user.id)
        .order("created_at", { ascending: false })

      if (error) {
        // Table pas encore créée: on désactive la section pour éviter de bloquer le profil.
        if ((error as { code?: string }).code === "42P01") {
          setSubAccountsEnabled(false)
          setSubAccountNotice("Activez le module sous-comptes (SQL) pour utiliser Enfant/Animal.")
          return
        }
        setSubAccountNotice("Impossible de charger les sous-comptes pour le moment.")
        return
      }

      setSubAccountsEnabled(true)
      setSubAccounts((data as SubAccount[]) ?? [])
    })()
  }, [user])

  // Restaurer l'acteur de publication choisi (sticky entre publications)
  useEffect(() => {
    if (typeof window === "undefined") return
    const savedActor = window.localStorage.getItem("milele_publication_actor")
    if (!savedActor) return
    if (savedActor === "self") {
      setPublicationTargetSubAccountId("self")
      return
    }
    if (subAccounts.some((account) => account.id === savedActor)) {
      setPublicationTargetSubAccountId(savedActor)
    }
  }, [subAccounts])

  // Charger les publications
  useEffect(() => {
    if (!user) return

    void (async () => {
      const { data } = await supabase
        .from("publications")
        .select("id, content, image_url, created_at, likes_count, comments_count")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })

      setPublications(
        (((data as Publication[]) ?? []).map((post) => {
          const parsed = parsePublicationContent(post.content)
          return {
            ...post,
            content: parsed.plainContent,
            settings: parsed.settings,
          }
        }))
      )
    })()
  }, [user])

  const FEED_PAGE_SIZE = 20

  async function loadFeedPage(page: number, userId: string, replace = false) {
    if (page > 0) setFeedLoadingMore(true)
    const { data: posts } = await supabase
      .from("publications")
      .select("id, user_id, content, image_url, created_at, likes_count, comments_count")
      .order("created_at", { ascending: false })
      .range(page * FEED_PAGE_SIZE, (page + 1) * FEED_PAGE_SIZE - 1)

    const postRows = (posts as Publication[] | null) ?? []
    if (postRows.length < FEED_PAGE_SIZE) setFeedHasMore(false)
    else setFeedHasMore(true)

    if (postRows.length === 0) {
      if (replace) setFeed([])
      setFeedLoadingMore(false)
      return
    }

    const authorIds = Array.from(new Set(postRows.map((post) => post.user_id).filter(Boolean))) as string[]
    const { data: authorProfiles } = await supabase
      .from("profiles")
      .select("id, display_name, avatar_url")
      .in("id", authorIds)

    const profileMap = new Map(
      ((authorProfiles as Array<{ id: string; display_name: string | null; avatar_url: string | null }> | null) ?? [])
        .map((author) => [author.id, author])
    )

    const nextFeed = postRows
      .map((post) => {
        const author = post.user_id ? profileMap.get(post.user_id) : null
        if (!post.user_id || !author) return null
        const parsed = parsePublicationContent(post.content)
        if (post.user_id !== userId && parsed.settings.audience !== "public") return null
        return {
          ...post,
          content: parsed.plainContent,
          settings: parsed.settings,
          user_id: post.user_id,
          author_name: author.display_name?.trim() || "Membre Milele",
          author_avatar_url: author.avatar_url,
        } satisfies FeedItem
      })
      .filter(Boolean) as FeedItem[]

    setFeed(prev => replace ? nextFeed : [...prev, ...nextFeed])
    setFeedPage(page)
    setFeedLoadingMore(false)
  }

  useEffect(() => {
    if (!user) return
    void (async () => {
      await loadFeedPage(0, user.id, true)
    })()
  }, [user, publications])

  const handleMediaFiles = (files: FileList | null, isEdit = false) => {
    if (!files) return
    const newPreviews = Array.from(files).slice(0, 6).map((file) => ({
      url: URL.createObjectURL(file),
      type: file.type.startsWith("video") ? "video" as const : "image" as const,
      file,
    }))
    if (isEdit) {
      setEditMediaPreview((prev) => [...prev, ...newPreviews].slice(0, 6))
    } else {
      setMediaPreview((prev) => [...prev, ...newPreviews].slice(0, 6))
    }
  }

  const sanitizeStorageFileName = (fileName: string) => {
    const normalized = fileName.trim().toLowerCase()
    return normalized.replace(/[^a-z0-9.-]+/g, "-").replace(/-+/g, "-")
  }

  const maybeCompressImageFile = async (file: File): Promise<File> => {
    if (!file.type.startsWith("image/") || file.size <= 2.5 * 1024 * 1024) {
      return file
    }

    try {
      const bitmap = await createImageBitmap(file)
      const maxDimension = 1920
      const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height))
      const targetWidth = Math.max(1, Math.round(bitmap.width * scale))
      const targetHeight = Math.max(1, Math.round(bitmap.height * scale))

      const canvas = document.createElement("canvas")
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext("2d")
      if (!ctx) return file

      ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight)

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, "image/jpeg", 0.84)
      })

      if (!blob) return file
      const baseName = file.name.replace(/\.[^.]+$/, "") || "photo"
      const compressed = new File([blob], `${baseName}-compressed.jpg`, { type: "image/jpeg" })
      return compressed.size < file.size ? compressed : file
    } catch {
      return file
    }
  }

  const uploadMediaDirectToSupabase = async (
    file: File,
    mediaType: "image" | "video"
  ): Promise<{ success: true; publicUrl: string; mediaType: "image" | "video" } | { success: false; reason: string }> => {
    if (!user) {
      return { success: false, reason: "session utilisateur absente" }
    }

    const ext = file.name.split(".").pop() || (mediaType === "video" ? "mp4" : "jpg")
    const safeName = sanitizeStorageFileName(file.name || `media.${ext}`)
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`

    const { error: uploadError } = await supabase.storage
      .from("publications")
      .upload(storagePath, file, {
        contentType: file.type || (mediaType === "video" ? "video/mp4" : "image/jpeg"),
        upsert: false,
      })

    if (uploadError) {
      return { success: false, reason: uploadError.message }
    }

    const { data } = supabase.storage.from("publications").getPublicUrl(storagePath)
    if (!data.publicUrl) {
      return { success: false, reason: "URL publique introuvable" }
    }

    return {
      success: true,
      publicUrl: data.publicUrl,
      mediaType,
    }
  }

  const uploadMediaToStorage = async (
    previews: Array<{ url: string; type: "image" | "video"; file?: File }>
  ): Promise<{ media: PublicationMedia[]; failed: number; issues: string[] }> => {
    if (previews.length === 0) return { media: [], failed: 0, issues: [] }

    const { data: sessionData } = await supabase.auth.getSession()
    const accessToken = sessionData.session?.access_token ?? ""

    const results: PublicationMedia[] = []
    let failed = 0
    const issues: string[] = []

    for (const preview of previews) {
      if (!preview.file) {
        if (preview.url.startsWith("http")) {
          results.push({ type: preview.type, url: preview.url })
        }
        continue
      }

      if (!accessToken) {
        failed += 1
        issues.push(`${preview.file.name || "fichier"}: session invalide, reconnectez-vous.`)
        continue
      }

      const formData = new FormData()
      const preparedFile = preview.type === "image"
        ? await maybeCompressImageFile(preview.file)
        : preview.file
      formData.append("file", preparedFile)

      try {
        const response = await fetch("/api/publications/media", {
          method: "POST",
          headers: { Authorization: `Bearer ${accessToken}` },
          body: formData,
        })

        const json = await response.json() as { publicUrl?: string; mediaType?: "image" | "video"; error?: string }
        if (!response.ok || !json.publicUrl) {
          const directFallback = await uploadMediaDirectToSupabase(preparedFile, preview.type)
          if (directFallback.success) {
            results.push({ type: directFallback.mediaType, url: directFallback.publicUrl })
            continue
          }

          failed += 1
          const message = json.error || `Erreur HTTP ${response.status}`
          issues.push(`${preview.file.name || "fichier"}: ${message} | fallback: ${directFallback.reason}`)
          continue
        }

        results.push({
          type: json.mediaType === "video" ? "video" : preview.type,
          url: json.publicUrl,
        })
      } catch {
        const directFallback = await uploadMediaDirectToSupabase(preparedFile, preview.type)
        if (directFallback.success) {
          results.push({ type: directFallback.mediaType, url: directFallback.publicUrl })
          continue
        }

        failed += 1
        issues.push(`${preview.file.name || "fichier"}: échec réseau upload API | fallback: ${directFallback.reason}`)
      }
    }

    return { media: results, failed, issues }
  }

  const publishPost = async () => {
    const hasTextContent = publicationContent.trim().length > 0
    const manualMedia = parseMediaUrls(publicationMediaUrls)
    const hasAnyMedia = mediaPreview.length > 0 || manualMedia.length > 0

    if (!user || (!hasTextContent && !hasAnyMedia)) {
      setPostNotice("Ajoutez du texte ou au moins un média.")
      return
    }

    setPublishingPost(true)
    setPostNotice(null)
    setUploadIssues([])

    try {
      setUploadingMedia(true)
      const { media: uploadedMedia, failed: failedUploads, issues } = await uploadMediaToStorage(mediaPreview)
      setUploadIssues(issues)
      const finalMedia = [...uploadedMedia, ...manualMedia].slice(0, 6)

      if (mediaPreview.length > 0 && uploadedMedia.length === 0 && manualMedia.length === 0) {
        setPostNotice("Erreur upload média. Vérifiez votre connexion et réessayez.")
        return
      }

      const targetSubAccount = publicationTargetSubAccountId === "self"
        ? null
        : subAccounts.find((item) => item.id === publicationTargetSubAccountId) ?? null

      const { data, error } = await supabase
        .from("publications")
        .insert({
          user_id: user.id,
          content: serializePublicationContent(publicationContent, {
            audience: publicationAudience,
            commentPolicy: publicationCommentPolicy,
            media: finalMedia,
            albumTitle: publicationIsAlbum && finalMedia.length > 1 ? publicationAlbumTitle.trim().slice(0, 80) : undefined,
            targetSubAccountId: targetSubAccount?.id,
            targetSubAccountName: targetSubAccount?.display_name,
            targetSubAccountType: targetSubAccount?.account_type,
          }),
          image_url: publicationImage,
          created_at: new Date().toISOString(),
          likes_count: 0,
          comments_count: 0,
        })
        .select()

      if (error) {
        setPostNotice("Erreur lors de la publication.")
        return
      }

      setPostNotice(
        failedUploads > 0
          ? `Publication créée. ${failedUploads} média(s) n'ont pas pu être envoyés.`
          : "Publication créée avec succès."
      )
      setPublicationContent("")
      setPublicationImage(null)
      setPublicationMediaUrls("")
      setPublicationAlbumTitle("")
      setPublicationIsAlbum(false)
      setMediaPreview([])
      setPublicationAudience("public")
      setPublicationCommentPolicy("everyone")
      setShowManualMediaInput(false)
      setShowComposerAdvanced(false)
      if (data && data.length > 0) {
        const createdPost = data[0] as Publication
        const parsed = parsePublicationContent(createdPost.content)
        setPublications([{ ...createdPost, content: parsed.plainContent, settings: parsed.settings }, ...publications])
      }
    } catch {
      setPostNotice("Erreur inattendue pendant la publication. Réessayez.")
    } finally {
      setUploadingMedia(false)
      setPublishingPost(false)
    }
  }

  const updatePost = async (postId: string) => {
    if (!editingContent.trim()) {
      setPostNotice("Le contenu ne peut pas être vide.")
      return
    }

    const { error } = await supabase
      .from("publications")
      .update({
        content: serializePublicationContent(editingContent, {
          audience: editingAudience,
          commentPolicy: editingCommentPolicy,
          media: parseMediaUrls(editingMediaUrls),
        }),
      })
      .eq("id", postId)

    if (error) {
      setPostNotice("Erreur lors de la mise à jour.")
    } else {
      setPostNotice("Publication mise à jour.")
      setPublications(publications.map(p =>
        p.id === postId ? {
          ...p,
          content: editingContent,
          settings: {
            audience: editingAudience,
            commentPolicy: editingCommentPolicy,
            media: parseMediaUrls(editingMediaUrls),
          },
        } : p
      ))
      setEditingPostId(null)
    }
  }

  // Initialiser les likes depuis localStorage au chargement
  useEffect(() => {
    if (!user) return
    const stored = localStorage.getItem(`milele_liked_${user.id}`)
    if (stored) {
      try { setLikedPostIds(new Set(JSON.parse(stored) as string[])) } catch { /* ignore */ }
    }
  }, [user])

  const toggleLike = async (postId: string) => {
    if (!user) return
    const alreadyLiked = likedPostIds.has(postId)
    const delta = alreadyLiked ? -1 : 1

    // Mise à jour optimiste UI
    setLikedPostIds((prev) => {
      const next = new Set(prev)
      alreadyLiked ? next.delete(postId) : next.add(postId)
      localStorage.setItem(`milele_liked_${user.id}`, JSON.stringify([...next]))
      return next
    })
    setFeed((prev) => prev.map((item) =>
      item.id === postId ? { ...item, likes_count: Math.max(0, item.likes_count + delta) } : item
    ))
    setPublications((prev) => prev.map((item) =>
      item.id === postId ? { ...item, likes_count: Math.max(0, item.likes_count + delta) } : item
    ))

    // Persistance Supabase
    const post = feed.find((f) => f.id === postId) ?? publications.find((p) => p.id === postId)
    if (post) {
      await supabase
        .from("publications")
        .update({ likes_count: Math.max(0, post.likes_count + delta) })
        .eq("id", postId)

      // Notification si like (pas un unlike) et publication d'un autre
      if (!alreadyLiked && (post as FeedItem).user_id && (post as FeedItem).user_id !== user.id) {
        const session = (await supabase.auth.getSession()).data.session
        if (session) {
          void fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ type: "like", publication_id: postId }),
          })
        }
      }
    }
  }

  const loadComments = async (postId: string) => {
    if (loadingComments.has(postId) || commentsMap[postId]) return
    setLoadingComments((prev) => new Set(prev).add(postId))

    const { data, error } = await supabase
      .from("publication_comments")
      .select("id, publication_id, user_id, content, created_at")
      .eq("publication_id", postId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (error) {
      if ((error as { code?: string }).code === "42P01") setCommentsEnabled(false)
      setLoadingComments((prev) => { const n = new Set(prev); n.delete(postId); return n })
      return
    }

    // Enrichir avec les noms d'auteurs
    const rows = (data ?? []) as Array<{ id: string; publication_id: string; user_id: string; content: string; created_at: string }>
    const authorIds = [...new Set(rows.map((r) => r.user_id))]
    let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
    if (authorIds.length > 0) {
      const { data: pdata } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", authorIds)
      for (const p of (pdata ?? []) as Array<{ id: string; display_name: string | null; avatar_url: string | null }>) {
        profilesMap[p.id] = p
      }
    }

    const comments: PublicationComment[] = rows.map((r) => ({
      ...r,
      author_name: profilesMap[r.user_id]?.display_name ?? "Membre Milele",
      author_avatar_url: profilesMap[r.user_id]?.avatar_url ?? null,
    }))

    setCommentsMap((prev) => ({ ...prev, [postId]: comments }))
    setLoadingComments((prev) => { const n = new Set(prev); n.delete(postId); return n })
  }

  const toggleComments = async (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) {
        next.delete(postId)
      } else {
        next.add(postId)
        void loadComments(postId)
      }
      return next
    })
  }

  const addComment = async (postId: string) => {
    if (!user || !commentsEnabled) return
    const content = (commentInputs[postId] ?? "").trim()
    if (!content) return

    setPostingComment((prev) => new Set(prev).add(postId))

    const { data, error } = await supabase
      .from("publication_comments")
      .insert({ publication_id: postId, user_id: user.id, content: content.slice(0, 1000) })
      .select()

    if (!error && data && data.length > 0) {
      const newComment: PublicationComment = {
        ...(data[0] as { id: string; publication_id: string; user_id: string; content: string; created_at: string }),
        author_name: profile?.display_name ?? user.email.split("@")[0],
        author_avatar_url: profile?.avatar_url ?? null,
      }
      setCommentsMap((prev) => ({ ...prev, [postId]: [...(prev[postId] ?? []), newComment] }))
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
      // Incrémenter le compteur
      setFeed((prev) => prev.map((item) =>
        item.id === postId ? { ...item, comments_count: item.comments_count + 1 } : item
      ))
      await supabase.from("publications").update({ comments_count: (feed.find((f) => f.id === postId)?.comments_count ?? 0) + 1 }).eq("id", postId)

      // Notification si publication d'un autre
      const feedPost = feed.find((f) => f.id === postId)
      if (feedPost?.user_id && feedPost.user_id !== user.id) {
        const session = (await supabase.auth.getSession()).data.session
        if (session) {
          void fetch("/api/notifications", {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ type: "comment", publication_id: postId }),
          })
        }
      }
    }

    setPostingComment((prev) => { const n = new Set(prev); n.delete(postId); return n })
  }

  const deletePost = async (postId: string) => {
    if (!window.confirm("Supprimer cette publication ?")) return

    const { error } = await supabase
      .from("publications")
      .delete()
      .eq("id", postId)

    if (error) {
      setPostNotice("Erreur lors de la suppression.")
    } else {
      setPostNotice("Publication supprimée.")
      setPublications((prev) => prev.filter((post) => post.id !== postId))
      setFeed((prev) => prev.filter((post) => post.id !== postId))
    }
  }

  const createSubAccount = async () => {
    if (!user) return
    if (!newSubAccountName.trim()) {
      setSubAccountNotice("Le nom du sous-compte est requis.")
      return
    }

    setCreatingSubAccount(true)
    setSubAccountNotice(null)

    const payload = {
      owner_user_id: user.id,
      account_type: newSubAccountType,
      display_name: newSubAccountName.trim(),
      visibility: "public",
      allow_minor_publish: false,
      allow_minor_comment: true,
    }

    const { data, error } = await supabase
      .from("sub_accounts")
      .insert(payload)
      .select()
      .single()

    if (error) {
      setSubAccountNotice("Erreur lors de la création du sous-compte.")
    } else {
      setSubAccounts((prev) => [data as SubAccount, ...prev])
      setNewSubAccountName("")
      setNewSubAccountType("child")
      setSubAccountNotice("Sous-compte créé.")
    }

    setCreatingSubAccount(false)
  }

  const updateSubAccountRights = async (subAccountId: string, patch: Partial<Pick<SubAccount, "allow_minor_publish" | "allow_minor_comment" | "visibility">>) => {
    const { error } = await supabase
      .from("sub_accounts")
      .update(patch)
      .eq("id", subAccountId)

    if (error) {
      setSubAccountNotice("Erreur lors de la mise à jour des droits.")
      return
    }

    setSubAccounts((prev) => prev.map((item) => (item.id === subAccountId ? { ...item, ...patch } : item)))
  }

  const toggleDeployEnfant = async (subAccountId: string, currentVisibility: "public" | "private") => {
    setDeployingEnfantId(subAccountId)
    const newVisibility = currentVisibility === "public" ? "private" : "public"
    await updateSubAccountRights(subAccountId, { visibility: newVisibility })
    setDeployingEnfantId(null)
  }

  // Global search avec debounce
  useEffect(() => {
    if (globalSearchTimeoutRef.current) clearTimeout(globalSearchTimeoutRef.current)
    
    if (!globalSearch.trim()) {
      setGlobalSearchResults([])
      return
    }

    setGlobalSearchLoading(true)
    
    globalSearchTimeoutRef.current = setTimeout(async () => {
      const q = globalSearch.toLowerCase().trim()
      const results: Array<{ type: "publication"; id: string; name: string; preview: string }> = []

      // Chercher dans le feed public
      const pubMatches = feed
        .filter(f => {
          const parsed = parsePublicationContent(f.content)
          return parsed.settings.audience === "public"
        })
        .filter(f => {
          const parsed = parsePublicationContent(f.content)
          const text = parsed.plainContent.toLowerCase()
          const name = publicationActorName(f.settings, f.author_name).toLowerCase()
          return text.includes(q) || name.includes(q)
        })
        .slice(0, 10)
        .map(f => ({
          type: "publication" as const,
          id: f.id,
          name: publicationActorName(f.settings, f.author_name),
          preview: parsePublicationContent(f.content).plainContent.slice(0, 60).replace(/\n/g, " "),
        }))

      results.push(...pubMatches)
      setGlobalSearchResults(results)
      setGlobalSearchLoading(false)
    }, 300)

    return () => {
      if (globalSearchTimeoutRef.current) clearTimeout(globalSearchTimeoutRef.current)
    }
  }, [globalSearch, feed, user?.id])

  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-10 h-10 rounded-full border-2 animate-spin"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
          <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Chargement du profil…</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const filteredFeed = feed.filter((item) => {
    if (feedFilter === "mine" && item.user_id !== user.id) return false
    if (feedFilter === "public" || feedFilter === "circle") {
      const parsed = parsePublicationContent(item.content)
      if (parsed.settings.audience !== feedFilter) return false
    }
    if (feedSearch.trim()) {
      const q = feedSearch.toLowerCase()
      const text = parsePublicationContent(item.content).plainContent.toLowerCase()
      const actorName = publicationActorName(item.settings, item.author_name).toLowerCase()
      if (!text.includes(q) && !item.author_name.toLowerCase().includes(q) && !actorName.includes(q)) return false
    }
    return true
  })

  const displayName = profile?.display_name ?? user.email.split("@")[0] ?? "Membre"
  const initials = displayName.trim().split(" ").map((w: string) => w[0] ?? "").join("").slice(0, 2).toUpperCase() || "M"
  const memberSince = profile?.created_at
    ? new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
    : null

  return (
    <div className="pb-28 max-w-2xl mx-auto">
      {/* ── Hero profil ───────────────────────────────────────────── */}
      <div className="relative mb-0">
        {/* Cover gradient animé */}
        <div
          className="h-36 sm:h-44 w-full rounded-b-3xl overflow-hidden"
          style={{
            background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 70%, #6366f1) 0%, color-mix(in srgb, var(--primary) 30%, #0ea5e9) 50%, color-mix(in srgb, #a78bfa 55%, transparent) 100%)",
            boxShadow: "inset 0 -1px 0 color-mix(in srgb, var(--primary) 30%, transparent)",
          }}
        >
          {/* Orbes décoratifs dans le cover */}
          <div className="absolute top-2 right-8 w-32 h-32 rounded-full opacity-20 blur-2xl"
            style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
          <div className="absolute top-6 left-12 w-20 h-20 rounded-full opacity-15 blur-xl"
            style={{ background: "radial-gradient(circle, #fff 0%, transparent 70%)" }} />
        </div>

        {/* Carte identité flottante */}
        <div
          className="mx-4 -mt-10 rounded-2xl p-4 sm:p-5 backdrop-blur-2xl relative z-10"
          style={{
            background: "color-mix(in srgb, var(--card) 88%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))",
            boxShadow: "0 20px 60px rgba(2, 8, 23, 0.28), 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent)",
          }}
        >
          <div className="flex items-start gap-4">
            {/* Avatar avec double ring glow */}
            <div className="relative flex-shrink-0">
              <div
                className="absolute inset-0 rounded-full blur-md opacity-50"
                style={{ background: "var(--primary)", transform: "scale(1.15)" }}
              />
              <div
                className="relative w-20 h-20 rounded-full overflow-hidden flex items-center justify-center ring-2"
                style={{
                    background: "var(--secondary)",
                    border: "2px solid color-mix(in srgb, var(--primary) 60%, transparent)",
                    boxShadow: "0 0 0 4px color-mix(in srgb, var(--primary) 18%, transparent)",
                  }}
              >
                {profile?.avatar_url ? (
                  <Image src={profile.avatar_url} alt={displayName} width={80} height={80} className="w-full h-full object-cover" unoptimized />
                ) : (
                  <span
                    className="text-2xl font-black"
                    style={{
                      color: "var(--primary)",
                      textShadow: "0 0 20px color-mix(in srgb, var(--primary) 50%, transparent)",
                    }}
                  >
                    {initials}
                  </span>
                )}
              </div>
            </div>

            {/* Infos identité */}
            <div className="min-w-0 flex-1 pt-1">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h1
                    className="text-xl sm:text-2xl font-black tracking-tight leading-tight truncate"
                    style={{
                      color: "var(--foreground)",
                      textShadow: "0 1px 12px color-mix(in srgb, var(--primary) 20%, transparent)",
                    }}
                  >
                    {displayName}
                  </h1>
                  {memberSince && (
                    <p className="text-xs mt-0.5 flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                      <CalendarDays size={11} />
                      Membre depuis {memberSince}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => router.push("/espace/profil/parametres")}
                  className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 12%, var(--secondary))",
                    border: "1px solid color-mix(in srgb, var(--primary) 25%, var(--border))",
                  }}
                  title="Paramètres"
                >
                  <Settings size={15} style={{ color: "var(--primary)" }} />
                </button>
              </div>

              {profile?.bio && (
                <p className="text-sm mt-2 line-clamp-2 leading-relaxed" style={{ color: "var(--muted-foreground)" }}>
                  {profile.bio}
                </p>
              )}

              <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LiquidMetalButton
                    viewMode="icon"
                    tinted
                    width={48}
                    height={48}
                    iconNode={<BriefcaseBusiness size={18} />}
                    onClick={() => router.push("/staff")}
                    aria-label="Retourner au compte staff"
                    title="Retour staff"
                  />
                  <LiquidMetalButton
                    viewMode="icon"
                    tinted
                    width={48}
                    height={48}
                    iconNode={<House size={18} />}
                    onClick={() => router.push("/")}
                    aria-label="Retourner à l'accueil"
                    title="Accueil"
                  />
                </div>
                <button
                  onClick={() => router.push("/aion")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 12%, var(--secondary))",
                    color: "var(--primary)",
                    border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))",
                  }}
                  title="Retour à Aion"
                >
                  <LogOut size={12} />
                  Retour à Aion
                </button>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div
            className="grid grid-cols-3 gap-1 mt-4 rounded-xl overflow-hidden"
            style={{
              background: "color-mix(in srgb, var(--background) 60%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))",
            }}
          >
            {[
              { label: "Publications", value: publications.length },
              { label: "Dans le feed", value: feed.filter(f => f.user_id === user.id).length },
              { label: "Sous-comptes", value: subAccounts.length },
            ].map((stat, i) => (
              <div
                key={stat.label}
                className="py-2.5 text-center"
                style={{
                  borderRight: i < 2 ? "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" : undefined,
                }}
              >
                <p
                  className="text-lg font-black leading-none"
                  style={{ color: "var(--primary)", textShadow: "0 0 14px color-mix(in srgb, var(--primary) 40%, transparent)" }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Espace de contenu ─────────────────────────────────────── */}
      <div className="px-4 mt-5 space-y-6">

        {/* ── Global Search Bar ─────────────────────────────────────── */}
        <div className="relative">
          <div
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all border"
            style={{
              background: globalSearchOpen 
                ? "color-mix(in srgb, var(--primary) 5%, var(--background))"
                : "var(--secondary)",
              borderColor: globalSearchOpen
                ? "var(--primary)"
                : "color-mix(in srgb, var(--primary) 15%, var(--border))",
              boxShadow: globalSearchOpen
                ? "0 0 0 4px color-mix(in srgb, var(--primary) 12%, transparent)"
                : undefined,
            }}
          >
            <Search size={15} style={{ color: "var(--muted-foreground)", flexShrink: 0 }} />
            <input
              type="text"
              placeholder="Chercher publications, personnes…"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              onFocus={() => setGlobalSearchOpen(true)}
              onBlur={() => setTimeout(() => setGlobalSearchOpen(false), 150)}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-xs"
              style={{ color: "var(--foreground)" }}
            />
            {globalSearch && (
              <button
                onClick={() => {
                  setGlobalSearch("")
                  setGlobalSearchResults([])
                }}
                className="text-xs font-bold px-2 py-1 rounded hover:opacity-70"
                style={{ color: "var(--muted-foreground)" }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Dropdown des résultats */}
          {globalSearchOpen && globalSearch.trim() && (
            <div
              className="absolute top-full left-0 right-0 mt-2 rounded-xl border z-50 shadow-lg max-h-80 overflow-y-auto"
              style={{
                background: "var(--card)",
                borderColor: "color-mix(in srgb, var(--primary) 20%, var(--border))",
              }}
            >
              {globalSearchLoading ? (
                <div className="p-3 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Recherche…
                </div>
              ) : globalSearchResults.length === 0 ? (
                <div className="p-3 text-center text-xs" style={{ color: "var(--muted-foreground)" }}>
                  Aucun résultat trouvé
                </div>
              ) : (
                <div className="divide-y" style={{ borderColor: "color-mix(in srgb, var(--primary) 10%, var(--border))" }}>
                  {globalSearchResults.map((result, idx) => (
                    <button
                      key={`${result.type}-${result.id}-${idx}`}
                      onClick={() => {
                        if (result.type === "publication") {
                          const item = feed.find(f => f.id === result.id)
                          if (item) {
                            setEditingPostId(item.id)
                            setGlobalSearch("")
                            setGlobalSearchOpen(false)
                          }
                        }
                      }}
                      className="w-full text-left p-3 hover:opacity-80 transition-opacity text-xs"
                      style={{
                        background: "transparent",
                      }}
                    >
                      <div className="font-bold" style={{ color: "var(--foreground)" }}>
                        📰 {result.name}
                      </div>
                      <div className="text-[11px] mt-0.5 line-clamp-1" style={{ color: "var(--muted-foreground)" }}>
                        {result.preview}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Feed section ──────────────────────────────────────── */}
        <section>
          {/* Header section avec bouton composer */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Communauté</h2>
              <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
                {filteredFeed.length} publication{filteredFeed.length !== 1 ? "s" : ""}
              </p>
            </div>
            <button
              onClick={() => {
                setShowComposer((prev) => !prev)
                setShowComposerAdvanced(false)
              }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
              style={{
                background: showComposer
                  ? "var(--primary)"
                  : "linear-gradient(135deg, color-mix(in srgb, var(--primary) 15%, var(--card)), color-mix(in srgb, var(--primary) 8%, var(--card)))",
                color: showComposer ? "var(--primary-foreground)" : "var(--primary)",
                border: `1px solid ${showComposer ? "var(--primary)" : "color-mix(in srgb, var(--primary) 30%, var(--border))"}`,
                boxShadow: showComposer ? "0 4px 14px color-mix(in srgb, var(--primary) 35%, transparent)" : undefined,
              }}
            >
              <Plus size={13} />
              {showComposer ? "Fermer" : "Publier"}
            </button>
          </div>

          {/* Composer card */}
          {showComposer && (
            <div
              className="rounded-2xl p-4 mb-4"
              style={{
                background: "linear-gradient(145deg, color-mix(in srgb, var(--card) 90%, transparent), color-mix(in srgb, var(--card) 75%, transparent))",
                border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))",
                boxShadow: "0 12px 40px rgba(2, 8, 23, 0.22), 0 0 0 1px color-mix(in srgb, var(--primary) 6%, transparent)",
                backdropFilter: "blur(24px)",
              }}
            >
              {/* Avatar + textarea inline */}
              <div className="flex gap-3 mb-3">
                <div
                  className="w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 15%, var(--secondary))",
                    border: "1.5px solid color-mix(in srgb, var(--primary) 40%, transparent)",
                  }}
                >
                  {profile?.avatar_url ? (
                    <Image src={profile.avatar_url} alt={displayName ? `Avatar de ${displayName}` : "Avatar du profil"} width={36} height={36} className="w-full h-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xs font-black" style={{ color: "var(--primary)" }}>{initials}</span>
                  )}
                </div>
                <textarea
                  value={publicationContent}
                  onChange={(e) => setPublicationContent(e.target.value)}
                  placeholder={`Quoi de nouveau, ${displayName.split(" ")[0]} ?`}
                  rows={3}
                  maxLength={500}
                  className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none resize-none"
                  style={{
                    background: "color-mix(in srgb, var(--background) 80%, transparent)",
                    border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                    color: "var(--foreground)",
                  }}
                />
              </div>

              {/* Inputs fichiers cachés */}
              <input id="composer-camera-input" ref={cameraInputRef} type="file" accept="image/jpeg,image/jpg,image/pjpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif,video/mp4,video/x-m4v,video/webm,video/ogg,video/3gpp,video/quicktime" capture="environment" className="hidden" onChange={(e) => { handleMediaFiles(e.target.files); e.target.value = "" }} />
              <input id="composer-gallery-input" ref={galleryInputRef} type="file" accept="image/jpeg,image/jpg,image/pjpeg,image/png,image/gif,image/webp,image/avif,image/heic,image/heif,video/mp4,video/x-m4v,video/webm,video/ogg,video/3gpp,video/quicktime" multiple className="hidden" onChange={(e) => { handleMediaFiles(e.target.files); e.target.value = "" }} />

              {/* Boutons média */}
              <div className="flex flex-wrap gap-2 mb-3">
                <label htmlFor="composer-camera-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
                  style={{ background: "color-mix(in srgb, var(--primary) 10%, var(--secondary))", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))" }}>
                  <Camera size={12} /> Caméra
                </label>
                <label htmlFor="composer-gallery-input"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80 cursor-pointer"
                  style={{ background: "color-mix(in srgb, var(--primary) 10%, var(--secondary))", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))" }}>
                  <ImageIcon size={12} /> Photos / Vidéos
                </label>
                <button type="button" onClick={() => setShowManualMediaInput((prev) => !prev)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
                  style={{ background: "color-mix(in srgb, var(--primary) 9%, var(--secondary))", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))" }}>
                  <Link2 size={12} /> {showManualMediaInput ? "Masquer liens" : "Ajouter liens"}
                </button>
              </div>

              {showManualMediaInput && (
                <textarea
                  value={publicationMediaUrls}
                  onChange={(e) => setPublicationMediaUrls(e.target.value)}
                  placeholder="Optionnel: coller une URL photo/vidéo (1 par ligne)"
                  rows={2}
                  className="w-full px-3 py-2 rounded-xl text-xs outline-none mb-3 resize-none"
                  style={{ background: "color-mix(in srgb, var(--background) 70%, transparent)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                />
              )}

              {/* Préview médias */}
              {mediaPreview.length > 0 && (
                <div className="grid grid-cols-3 gap-1.5 mb-3">
                  {mediaPreview.map((m, idx) => (
                    <div key={`${m.url}-${idx}`} className="relative rounded-xl overflow-hidden aspect-square" style={{ border: "1px solid var(--border)" }}>
                      {m.type === "video" ? (
                        <video src={m.url} className="w-full h-full object-cover bg-black" />
                      ) : (
                        <Image src={m.url} alt="Aperçu" width={800} height={800} loading="lazy" unoptimized className="w-full h-full object-cover" />
                      )}
                      <button type="button" onClick={() => setMediaPreview(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                        style={{ background: "rgba(0,0,0,0.7)", color: "#fff" }}>
                        <X size={10} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {(mediaPreview.length > 1 || publicationMediaUrls.trim()) && (
                <div className="mb-3 rounded-xl p-3" style={{ background: "color-mix(in srgb, var(--background) 76%, transparent)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>Mode album</p>
                    <button
                      type="button"
                      onClick={() => setPublicationIsAlbum((prev) => !prev)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                      style={{
                        background: publicationIsAlbum ? "var(--primary)" : "var(--secondary)",
                        color: publicationIsAlbum ? "var(--primary-foreground)" : "var(--muted-foreground)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {publicationIsAlbum ? "Album activé" : "Activer album"}
                    </button>
                  </div>
                  {publicationIsAlbum && (
                    <input
                      value={publicationAlbumTitle}
                      onChange={(e) => setPublicationAlbumTitle(e.target.value.slice(0, 80))}
                      placeholder="Titre de l'album (ex: Fête des mères 2026)"
                      className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                      style={{ background: "color-mix(in srgb, var(--background) 70%, transparent)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                    />
                  )}
                </div>
              )}

              <div className="mb-3">
                <button
                  type="button"
                  onClick={() => setShowComposerAdvanced((prev) => !prev)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={{
                    background: "color-mix(in srgb, var(--primary) 8%, var(--secondary))",
                    color: "var(--primary)",
                    border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                  }}
                >
                  <SlidersHorizontal size={12} />
                  {showComposerAdvanced ? "Masquer options" : "Options de confidentialité"}
                </button>
              </div>

              {showComposerAdvanced && (
                <div className="mb-3 rounded-xl p-3" style={{ background: "color-mix(in srgb, var(--background) 76%, transparent)", border: "1px solid var(--border)" }}>
                  {/* Sous-compte cible */}
                  {subAccounts.length > 0 && (
                    <div className="mb-3">
                      <select
                        value={publicationTargetSubAccountId}
                        onChange={(e) => {
                          const nextValue = e.target.value
                          setPublicationTargetSubAccountId(nextValue)
                          if (typeof window !== "undefined") {
                            window.localStorage.setItem("milele_publication_actor", nextValue)
                          }
                        }}
                        className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                        style={{ background: "color-mix(in srgb, var(--background) 75%, transparent)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                      >
                        <option value="self">Publier en tant que: moi</option>
                        {subAccounts.map((account) => (
                          <option key={account.id} value={account.id}>{account.display_name} ({subAccountTypeLabel(account.account_type)})</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Audience + commentaires */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-[10px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Visibilité</p>

                  <p className="text-[11px] mb-2" style={{ color: "var(--muted-foreground)" }}>
                    Publication en tant que: {publicationTargetSubAccountId === "self"
                      ? "Compte principal"
                      : (subAccounts.find((account) => account.id === publicationTargetSubAccountId)?.display_name ?? "Sous-profil")}
                  </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(["public", "circle", "private"] as PublicationAudience[]).map((option) => (
                          <button key={option} onClick={() => setPublicationAudience(option)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              background: publicationAudience === option ? "var(--primary)" : "var(--secondary)",
                              color: publicationAudience === option ? "var(--primary-foreground)" : "var(--muted-foreground)",
                              border: "1px solid var(--border)",
                            }}>
                            {audienceLabel(option)}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold mb-1.5 uppercase tracking-wide" style={{ color: "var(--muted-foreground)" }}>Commentaires</p>
                      <div className="flex flex-wrap gap-1.5">
                        {(["everyone", "circle", "nobody"] as CommentPolicy[]).map((option) => (
                          <button key={option} onClick={() => setPublicationCommentPolicy(option)}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold transition-all"
                            style={{
                              background: publicationCommentPolicy === option ? "var(--primary)" : "var(--secondary)",
                              color: publicationCommentPolicy === option ? "var(--primary-foreground)" : "var(--muted-foreground)",
                              border: "1px solid var(--border)",
                            }}>
                            {commentPolicyLabel(option).replace("Commentaires: ", "")}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Footer composer */}
              <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))" }}>
                <span className="text-[11px]" style={{ color: publicationContent.length > 480 ? "#f97316" : "var(--muted-foreground)" }}>
                  {publicationContent.length}/500{uploadingMedia ? " · Upload…" : ""}
                </span>
                <button
                  onClick={publishPost}
                  disabled={publishingPost || (!publicationContent.trim() && mediaPreview.length === 0 && !publicationMediaUrls.trim())}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                  style={{
                    background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #6366f1))",
                    color: "var(--primary-foreground)",
                    boxShadow: "0 4px 14px color-mix(in srgb, var(--primary) 40%, transparent)",
                  }}
                >
                  <Rocket size={12} />
                  {publishingPost ? "Publication…" : "Publier"}
                </button>
              </div>

              {postNotice && (
                <p className="text-xs mt-2 font-medium" style={{ color: postNotice.includes("Erreur") ? "#ef4444" : "var(--primary)" }}>
                  {postNotice}
                </p>
              )}
              {uploadIssues.length > 0 && (
                <div className="mt-2 rounded-xl p-2" style={{ background: "color-mix(in srgb, #ef4444 10%, transparent)", border: "1px solid color-mix(in srgb, #ef4444 30%, transparent)" }}>
                  {uploadIssues.slice(0, 4).map((issue, idx) => (
                    <p key={`upload-issue-${idx}`} className="text-[11px]" style={{ color: "#ef4444" }}>
                      {issue}
                    </p>
                  ))}
                  {uploadIssues.length > 4 && (
                    <p className="text-[11px]" style={{ color: "#ef4444" }}>
                      +{uploadIssues.length - 4} erreur(s) supplémentaire(s)
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Barre recherche + filtres */}
          <div className="space-y-2 mb-4">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--muted-foreground)" }} />
              <input
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
                placeholder="Rechercher dans le feed…"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
                style={{
                  background: "color-mix(in srgb, var(--card) 85%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))",
                  color: "var(--foreground)",
                  backdropFilter: "blur(16px)",
                }}
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {(["all", "public", "circle", "mine"] as const).map((f) => (
                <button key={f} onClick={() => setFeedFilter(f)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                  style={{
                    background: feedFilter === f
                      ? "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #6366f1))"
                      : "color-mix(in srgb, var(--card) 80%, transparent)",
                    color: feedFilter === f ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    border: `1px solid ${feedFilter === f ? "transparent" : "var(--border)"}`,
                    boxShadow: feedFilter === f ? "0 2px 8px color-mix(in srgb, var(--primary) 35%, transparent)" : undefined,
                  }}>
                  {f === "all" ? "Tous" : f === "public" ? "Publics" : f === "circle" ? "Cercle" : "Mes publications"}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {([
                { key: "aurora", label: "Aurora" },
                { key: "glass", label: "Glass" },
                { key: "neon", label: "Neon" },
              ] as const).map((entry) => (
                <button
                  key={entry.key}
                  onClick={() => {
                    setWallStyle(entry.key)
                    localStorage.setItem("milele_wall_style", entry.key)
                  }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all"
                  style={{
                    background: wallStyle === entry.key
                      ? "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 65%, #22c55e))"
                      : "color-mix(in srgb, var(--card) 80%, transparent)",
                    color: wallStyle === entry.key ? "var(--primary-foreground)" : "var(--muted-foreground)",
                    border: `1px solid ${wallStyle === entry.key ? "transparent" : "var(--border)"}`,
                  }}
                >
                  {entry.label}
                </button>
              ))}
            </div>
          </div>

          {/* Feed cards */}
          {feed.length === 0 ? (
            <div
              className="rounded-2xl p-8 text-center"
              style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", border: "1px solid var(--border)", backdropFilter: "blur(16px)" }}
            >
              <BookOpen size={28} className="mx-auto mb-3 opacity-30" style={{ color: "var(--primary)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--muted-foreground)" }}>
                Aucune publication dans le feed.
              </p>
              <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Soyez le premier à partager quelque chose !</p>
            </div>
          ) : filteredFeed.length === 0 ? (
            <div className="rounded-2xl p-6 text-center" style={{ background: "color-mix(in srgb, var(--card) 80%, transparent)", border: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Aucun résultat pour cette recherche.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredFeed.map((item) => {
                const isMine = item.user_id === user.id
                const isLiked = likedPostIds.has(item.id)
                const actorName = publicationActorName(item.settings, item.author_name)
                const hasSubAccountActor = actorName !== item.author_name
                return (
                  <div
                    key={`feed-${item.id}`}
                    className="rounded-2xl overflow-hidden"
                    style={cardSurfaceStyle(isMine)}
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 px-4 pt-4 pb-3">
                      <div className="relative w-10 h-10 flex-shrink-0">
                        <div
                          className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center"
                          style={{
                            background: "color-mix(in srgb, var(--primary) 12%, var(--secondary))",
                            border: "1.5px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                          }}
                        >
                          {item.author_avatar_url ? (
                            <Image src={item.author_avatar_url} alt={actorName} width={40} height={40} className="w-full h-full object-cover" unoptimized />
                          ) : (
                            <span className="text-sm font-black" style={{ color: "var(--primary)" }}>
                              {(actorName.trim()[0] || "M").toUpperCase()}
                            </span>
                          )}
                        </div>
                        {hasSubAccountActor && item.settings?.targetSubAccountType && (
                          <div
                            className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                            style={{
                              background: "color-mix(in srgb, var(--primary) 90%, transparent)",
                              border: "2px solid var(--card)",
                              color: "var(--primary)",
                            }}
                            title={subAccountTypeLabel(item.settings.targetSubAccountType)}
                          >
                            {item.settings.targetSubAccountType === "pet" ? "🐾" : "👶"}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold truncate" style={{ color: "var(--foreground)" }}>
                            {actorName}
                          </p>
                          {hasSubAccountActor && item.settings?.targetSubAccountType && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                              style={{
                                background: "color-mix(in srgb, var(--primary) 18%, transparent)",
                                color: "var(--primary)",
                                border: "1px solid color-mix(in srgb, var(--primary) 32%, transparent)",
                              }}
                            >
                              {subAccountTypeLabel(item.settings.targetSubAccountType)}
                            </span>
                          )}
                          {isMine && (
                            <span
                              className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                              style={{
                                background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, transparent), color-mix(in srgb, var(--primary) 10%, transparent))",
                                color: "var(--primary)",
                                border: "1px solid color-mix(in srgb, var(--primary) 30%, transparent)",
                              }}
                            >
                              Vous
                            </span>
                          )}
                        </div>
                        {hasSubAccountActor && (
                          <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                            Compte principal: {item.author_name}
                          </p>
                        )}
                        <p className="text-[11px] flex items-center gap-1 mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                          <Clock size={10} />
                          {new Date(item.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="flex-shrink-0 text-[10px] px-2 py-1 rounded-full font-semibold"
                          style={{
                            background: item.settings?.audience === "public"
                              ? "color-mix(in srgb, #22c55e 15%, transparent)"
                              : item.settings?.audience === "circle"
                              ? "color-mix(in srgb, var(--primary) 15%, transparent)"
                              : "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
                            color: item.settings?.audience === "public" ? "#16a34a"
                              : item.settings?.audience === "circle" ? "var(--primary)"
                              : "var(--muted-foreground)",
                          }}
                        >
                          {audienceLabel(item.settings?.audience ?? "public")}
                        </span>
                        {isMine && (
                          <>
                            <button
                              type="button"
                              onClick={() => startEditingPublication(item)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-75"
                              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                              title="Modifier"
                            >
                              <Edit size={11} style={{ color: "var(--muted-foreground)" }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => recomposePublication(item)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-75"
                              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                              title="Refaire"
                            >
                              <Rocket size={11} style={{ color: "var(--muted-foreground)" }} />
                            </button>
                            <button
                              type="button"
                              onClick={() => deletePost(item.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-75"
                              style={{ background: "color-mix(in srgb, #ef4444 10%, var(--secondary))", border: "1px solid var(--border)" }}
                              title="Supprimer"
                            >
                              <Trash2 size={11} style={{ color: "#ef4444" }} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Contenu */}
                    <div className="px-4 pb-3">
                      <p
                        className="text-sm leading-relaxed"
                        style={{ color: "var(--foreground)", userSelect: "none", WebkitUserSelect: "none" }}
                        onCopy={(event) => handleProtectedInteraction(event, item.id, item.user_id)}
                        onCut={(event) => handleProtectedInteraction(event, item.id, item.user_id)}
                        onContextMenu={(event) => handleProtectedInteraction(event, item.id, item.user_id)}
                      >
                        {item.content}
                      </p>
                      {item.settings?.targetSubAccountName && (
                        <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--primary)" }}>
                          <Baby size={11} /> Publié en tant que {item.settings.targetSubAccountName}
                        </p>
                      )}
                    </div>

                    {/* Médias */}
                    {(item.settings?.media?.length ?? 0) > 0 || item.image_url ? (
                      <div className="px-4 pb-3">
                        {renderPublicationMedia(item.settings?.media, item.image_url, item.settings?.albumTitle, {
                          lockInteractions: true,
                          onBlockedInteraction: (event) => handleProtectedInteraction(event, item.id, item.user_id),
                        })}
                      </div>
                    ) : null}

                    {/* Actions */}
                    <div
                      className="flex items-center gap-1 px-4 py-3"
                      style={{ borderTop: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))" }}
                    >
                      <button
                        onClick={() => void toggleLike(item.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                        style={{
                          background: isLiked ? "color-mix(in srgb, #ef4444 16%, var(--card))" : "var(--secondary)",
                          color: isLiked ? "#ef4444" : "var(--muted-foreground)",
                          border: `1px solid ${isLiked ? "color-mix(in srgb, #ef4444 35%, transparent)" : "var(--border)"}`,
                          boxShadow: isLiked ? "0 2px 8px color-mix(in srgb, #ef4444 30%, transparent)" : undefined,
                        }}
                      >
                        <Heart size={13} fill={isLiked ? "#ef4444" : "none"} strokeWidth={isLiked ? 0 : 2} />
                        {item.likes_count}
                      </button>

                      {item.settings?.commentPolicy !== "nobody" && commentsEnabled && (
                        <button
                          onClick={() => void toggleComments(item.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                          style={{
                            background: expandedComments.has(item.id) ? "color-mix(in srgb, var(--primary) 16%, var(--card))" : "var(--secondary)",
                            color: expandedComments.has(item.id) ? "var(--primary)" : "var(--muted-foreground)",
                            border: `1px solid ${expandedComments.has(item.id) ? "color-mix(in srgb, var(--primary) 35%, transparent)" : "var(--border)"}`,
                            boxShadow: expandedComments.has(item.id) ? "0 2px 8px color-mix(in srgb, var(--primary) 25%, transparent)" : undefined,
                          }}
                        >
                          <MessageCircle size={13} />
                          {item.comments_count}
                        </button>
                      )}
                    </div>

                    {/* Commentaires dépliables */}
                    {expandedComments.has(item.id) && commentsEnabled && (
                      <div
                        className="px-4 pb-4"
                        style={{ borderTop: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))" }}
                      >
                        <div className="pt-3 space-y-2.5 mb-3">
                          {loadingComments.has(item.id) ? (
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Chargement…</p>
                          ) : (commentsMap[item.id] ?? []).length === 0 ? (
                            <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Aucun commentaire. Sois le premier !</p>
                          ) : (commentsMap[item.id] ?? []).map((comment) => (
                            <div key={comment.id} className="flex gap-2.5">
                              <div
                                className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                                style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                              >
                                {comment.author_avatar_url ? (
                                  <Image src={comment.author_avatar_url} alt={comment.author_name ? `Avatar de ${comment.author_name}` : "Avatar du membre"} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                ) : (
                                  <span className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>
                                    {(comment.author_name?.[0] ?? "M").toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div
                                className="flex-1 min-w-0 px-3 py-2 rounded-xl"
                                style={{ background: "color-mix(in srgb, var(--background) 80%, transparent)", border: "1px solid var(--border)" }}
                              >
                                <div className="flex items-center gap-2 mb-0.5">
                                  <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{comment.author_name ?? "Membre"}</span>
                                  <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>
                                    {new Date(comment.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                  </span>
                                </div>
                                <p className="text-xs leading-relaxed" style={{ color: "var(--foreground)" }}>{comment.content}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            value={commentInputs[item.id] ?? ""}
                            onChange={(e) => setCommentInputs(prev => ({ ...prev, [item.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void addComment(item.id) } }}
                            placeholder="Écrire un commentaire…"
                            className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                            style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))", color: "var(--foreground)" }}
                          />
                          <button
                            onClick={() => void addComment(item.id)}
                            disabled={postingComment.has(item.id) || !(commentInputs[item.id] ?? "").trim()}
                            className="px-3 py-2 rounded-xl disabled:opacity-40 transition-all hover:scale-105"
                            style={{
                              background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #6366f1))",
                              color: "var(--primary-foreground)",
                              boxShadow: "0 2px 8px color-mix(in srgb, var(--primary) 35%, transparent)",
                            }}
                          >
                            <Send size={13} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Charger plus */}
          {feedHasMore && !feedLoadingMore && filteredFeed.length > 0 && (
            <div className="flex justify-center mt-4">
              <button
                onClick={() => { if (user) void loadFeedPage(feedPage + 1, user.id) }}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  background: "color-mix(in srgb, var(--card) 85%, transparent)",
                  color: "var(--primary)",
                  border: "1px solid color-mix(in srgb, var(--primary) 25%, var(--border))",
                  backdropFilter: "blur(12px)",
                }}
              >
                Charger plus
              </button>
            </div>
          )}
          {feedLoadingMore && (
            <div className="flex justify-center mt-4">
              <div className="w-5 h-5 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
            </div>
          )}
        </section>

        {/* ── Mes publications ──────────────────────────────────── */}
        {publications.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>Mes publications</h2>
                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>{publications.length} publication{publications.length !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="space-y-3">
              {publications.map(post => {
                const isLiked = likedPostIds.has(post.id)
                return (
                  <div
                    key={post.id}
                    className="rounded-2xl overflow-hidden"
                    style={cardSurfaceStyle(true)}
                  >
                    {editingPostId === post.id ? (
                      <div className="p-4">
                        <textarea
                          value={editingContent}
                          onChange={(e) => setEditingContent(e.target.value)}
                          rows={3}
                          maxLength={500}
                          className="w-full px-3 py-2.5 rounded-xl text-sm outline-none mb-2 resize-none"
                          style={{ background: "color-mix(in srgb, var(--background) 80%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))", color: "var(--foreground)" }}
                        />
                        <textarea
                          value={editingMediaUrls}
                          onChange={(e) => setEditingMediaUrls(e.target.value)}
                          rows={2}
                          placeholder="URLs multimédia (1 lien par ligne)"
                          className="w-full px-3 py-2 rounded-xl text-xs outline-none mb-3 resize-none"
                          style={{ background: "color-mix(in srgb, var(--background) 75%, transparent)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                        />
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="flex flex-wrap gap-1.5">
                            {(["public", "circle", "private"] as PublicationAudience[]).map((option) => (
                              <button key={`edit-audience-${option}`} onClick={() => setEditingAudience(option)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                                style={{ background: editingAudience === option ? "var(--primary)" : "var(--secondary)", color: editingAudience === option ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                                {audienceLabel(option)}
                              </button>
                            ))}
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {(["everyone", "circle", "nobody"] as CommentPolicy[]).map((option) => (
                              <button key={`edit-comment-${option}`} onClick={() => setEditingCommentPolicy(option)}
                                className="px-2 py-1 rounded-lg text-[11px] font-semibold"
                                style={{ background: editingCommentPolicy === option ? "var(--primary)" : "var(--secondary)", color: editingCommentPolicy === option ? "var(--primary-foreground)" : "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                                {commentPolicyLabel(option).replace("Commentaires: ", "")}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => updatePost(post.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #6366f1))", color: "var(--primary-foreground)" }}>
                            <Check size={12} /> Valider
                          </button>
                          <button onClick={() => setEditingPostId(null)}
                            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold"
                            style={{ background: "var(--secondary)", color: "var(--foreground)", border: "1px solid var(--border)" }}>
                            <X size={12} /> Annuler
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Header publication */}
                        <div className="flex items-center justify-between px-4 pt-4 pb-2">
                          <div className="flex items-center gap-2">
                            <span
                              className="text-[10px] px-2 py-1 rounded-full font-semibold"
                              style={{
                                background: post.settings?.audience === "public"
                                  ? "color-mix(in srgb, #22c55e 15%, transparent)"
                                  : post.settings?.audience === "circle"
                                  ? "color-mix(in srgb, var(--primary) 15%, transparent)"
                                  : "color-mix(in srgb, var(--muted-foreground) 15%, transparent)",
                                color: post.settings?.audience === "public" ? "#16a34a"
                                  : post.settings?.audience === "circle" ? "var(--primary)"
                                  : "var(--muted-foreground)",
                              }}
                            >
                              {audienceLabel(post.settings?.audience ?? "public")}
                            </span>
                            <span className="text-[11px] flex items-center gap-1" style={{ color: "var(--muted-foreground)" }}>
                              <Clock size={10} />
                              {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEditingPublication(post)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                            >
                              <Edit size={11} style={{ color: "var(--muted-foreground)" }} />
                            </button>
                            <button
                              onClick={() => recomposePublication(post)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                              style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}
                            >
                              <Rocket size={11} style={{ color: "var(--muted-foreground)" }} />
                            </button>
                            <button
                              onClick={() => deletePost(post.id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center transition-all hover:opacity-70"
                              style={{ background: "color-mix(in srgb, #ef4444 10%, var(--secondary))", border: "1px solid var(--border)" }}
                            >
                              <Trash2 size={11} style={{ color: "#ef4444" }} />
                            </button>
                          </div>
                        </div>

                        {/* Contenu */}
                        <div className="px-4 pb-3">
                          <p
                            className="text-sm leading-relaxed"
                            style={{ color: "var(--foreground)", userSelect: "none", WebkitUserSelect: "none" }}
                            onCopy={(event) => handleProtectedInteraction(event, post.id, user?.id)}
                            onCut={(event) => handleProtectedInteraction(event, post.id, user?.id)}
                            onContextMenu={(event) => handleProtectedInteraction(event, post.id, user?.id)}
                          >
                            {post.content}
                          </p>
                          {post.settings?.targetSubAccountName && (
                            <p className="text-xs mt-2 flex items-center gap-1" style={{ color: "var(--primary)" }}>
                              <Baby size={11} /> Publié en tant que {post.settings.targetSubAccountName}
                            </p>
                          )}
                        </div>

                        {(post.settings?.media?.length ?? 0) > 0 || post.image_url ? (
                          <div className="px-4 pb-3">
                            {renderPublicationMedia(post.settings?.media, post.image_url, post.settings?.albumTitle, {
                              lockInteractions: true,
                              onBlockedInteraction: (event) => handleProtectedInteraction(event, post.id, user?.id),
                            })}
                          </div>
                        ) : null}

                        {/* Actions */}
                        <div
                          className="flex items-center gap-1.5 px-4 py-3"
                          style={{ borderTop: "1px solid color-mix(in srgb, var(--primary) 10%, var(--border))" }}
                        >
                          <button
                            onClick={() => void toggleLike(post.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95"
                            style={{
                              background: isLiked ? "color-mix(in srgb, #ef4444 16%, var(--card))" : "var(--secondary)",
                              color: isLiked ? "#ef4444" : "var(--muted-foreground)",
                              border: `1px solid ${isLiked ? "color-mix(in srgb, #ef4444 35%, transparent)" : "var(--border)"}`,
                              boxShadow: isLiked ? "0 2px 8px color-mix(in srgb, #ef4444 25%, transparent)" : undefined,
                            }}
                          >
                            <Heart size={12} fill={isLiked ? "#ef4444" : "none"} strokeWidth={isLiked ? 0 : 2} />
                            {post.likes_count}
                          </button>
                          <button
                            onClick={() => { if (post.settings?.commentPolicy !== "nobody" && commentsEnabled) void toggleComments(post.id) }}
                            disabled={post.settings?.commentPolicy === "nobody" || !commentsEnabled}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-40"
                            style={{
                              background: expandedComments.has(post.id) ? "color-mix(in srgb, var(--primary) 16%, var(--card))" : "var(--secondary)",
                              color: expandedComments.has(post.id) ? "var(--primary)" : "var(--muted-foreground)",
                              border: `1px solid ${expandedComments.has(post.id) ? "color-mix(in srgb, var(--primary) 35%, transparent)" : "var(--border)"}`,
                            }}
                          >
                            <MessageCircle size={12} />
                            {post.comments_count}
                          </button>
                        </div>

                        {/* Commentaires dépliables — mes publications */}
                        {expandedComments.has(post.id) && commentsEnabled && (
                          <div
                            className="px-4 pb-4"
                            style={{ borderTop: "1px solid color-mix(in srgb, var(--primary) 8%, var(--border))" }}
                          >
                            <div className="pt-3 space-y-2.5 mb-3">
                              {loadingComments.has(post.id) ? (
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Chargement…</p>
                              ) : (commentsMap[post.id] ?? []).length === 0 ? (
                                <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>Aucun commentaire encore.</p>
                              ) : (commentsMap[post.id] ?? []).map((comment) => (
                                <div key={comment.id} className="flex gap-2">
                                  <div className="w-7 h-7 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center"
                                    style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                                    {comment.author_avatar_url ? (
                                      <Image src={comment.author_avatar_url} alt={comment.author_name ? `Avatar de ${comment.author_name}` : "Avatar du membre"} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                    ) : (
                                      <span className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>{(comment.author_name?.[0] ?? "M").toUpperCase()}</span>
                                    )}
                                  </div>
                                  <div className="flex-1 px-3 py-2 rounded-xl"
                                    style={{ background: "color-mix(in srgb, var(--background) 80%, transparent)", border: "1px solid var(--border)" }}>
                                    <span className="text-xs font-bold" style={{ color: "var(--foreground)" }}>{comment.author_name ?? "Membre"}</span>
                                    <span className="text-[10px] ml-2" style={{ color: "var(--muted-foreground)" }}>
                                      {new Date(comment.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                    <p className="text-xs mt-0.5" style={{ color: "var(--foreground)" }}>{comment.content}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                            <div className="flex gap-2">
                              <input
                                value={commentInputs[post.id] ?? ""}
                                onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void addComment(post.id) } }}
                                placeholder="Répondre…"
                                className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                                style={{ background: "color-mix(in srgb, var(--background) 85%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))", color: "var(--foreground)" }}
                              />
                              <button
                                onClick={() => void addComment(post.id)}
                                disabled={postingComment.has(post.id) || !(commentInputs[post.id] ?? "").trim()}
                                className="px-3 py-2 rounded-xl disabled:opacity-40 transition-all hover:scale-105"
                                style={{
                                  background: "linear-gradient(135deg, var(--primary), color-mix(in srgb, var(--primary) 70%, #6366f1))",
                                  color: "var(--primary-foreground)",
                                  boxShadow: "0 2px 8px color-mix(in srgb, var(--primary) 35%, transparent)",
                                }}
                              >
                                <Send size={13} />
                              </button>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
