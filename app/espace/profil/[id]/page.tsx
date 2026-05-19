"use client"

import Image from "next/image"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { supabase } from "@/lib/supabaseClient"
import { Heart, MessageCircle, ArrowLeft, UserCircle, Send, UserPlus, UserCheck, Clock, LayoutGrid, List } from "lucide-react"

type ProfileData = {
  id: string
  display_name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

type PublicPost = {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  likes_count: number
  comments_count: number
}

type Comment = {
  id: string
  user_id: string
  content: string
  created_at: string
  author_name?: string
  author_avatar_url?: string | null
}

const META_MARKER = "[[MILELE_META]]"

function parseContent(raw: string): { text: string; media?: Array<{ type: "image" | "video"; url: string }> } {
  if (!raw.startsWith(META_MARKER)) return { text: raw }
  const nl = raw.indexOf("\n")
  const text = nl >= 0 ? raw.slice(nl + 1) : ""
  try {
    const meta = JSON.parse(raw.slice(META_MARKER.length, nl)) as { media?: Array<{ type: "image" | "video"; url: string }> }
    return { text, media: meta.media }
  } catch {
    return { text }
  }
}

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const profileId = params?.id as string

  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [posts, setPosts] = useState<PublicPost[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [likedPostIds, setLikedPostIds] = useState<Set<string>>(new Set())
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({})
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [loadingComments, setLoadingComments] = useState<Set<string>>(new Set())
  const [postingComment, setPostingComment] = useState<Set<string>>(new Set())

  // État connexion
  const [connectionStatus, setConnectionStatus] = useState<"none" | "pending" | "accepted">("none")
  const [connecting, setConnecting] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "grid">("list")

  useEffect(() => {
    if (!currentUserId || !profileId || currentUserId === profileId) return
    void (async () => {
      const { data } = await supabase
        .from("connections")
        .select("status")
        .or(`and(requester_id.eq.${currentUserId},addressee_id.eq.${profileId}),and(requester_id.eq.${profileId},addressee_id.eq.${currentUserId})`)
        .maybeSingle()
      if (data) setConnectionStatus((data as { status: string }).status === "accepted" ? "accepted" : "pending")
    })()
  }, [currentUserId, profileId])

  const sendConnectionRequest = async () => {
    if (!currentUserId) { router.push("/espace/membres"); return }
    setConnecting(true)
    await supabase.from("connections").insert({ requester_id: currentUserId, addressee_id: profileId, status: "pending" })
    setConnectionStatus("pending")
    setConnecting(false)
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null
      setCurrentUserId(uid)
      if (uid) {
        const stored = localStorage.getItem(`milele_liked_${uid}`)
        if (stored) {
          try { setLikedPostIds(new Set(JSON.parse(stored) as string[])) } catch { /* ignore */ }
        }
      }
    })
  }, [])

  useEffect(() => {
    if (!profileId) return

    const load = async () => {
      setLoading(true)
      const { data: profileData } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url, bio, created_at")
        .eq("id", profileId)
        .maybeSingle()

      if (!profileData) { setNotFound(true); setLoading(false); return }
      setProfile(profileData as ProfileData)

      const { data: postsData } = await supabase
        .from("publications")
        .select("id, user_id, content, image_url, created_at, likes_count, comments_count")
        .eq("user_id", profileId)
        .order("created_at", { ascending: false })
        .limit(30)

      // Filtrer les publications publiques
      const publicPosts = ((postsData ?? []) as PublicPost[]).filter((p) => {
        if (!p.content.startsWith(META_MARKER)) return true
        try {
          const nl = p.content.indexOf("\n")
          const meta = JSON.parse(p.content.slice(META_MARKER.length, nl)) as { audience?: string }
          return meta.audience === "public" || !meta.audience
        } catch { return true }
      })
      setPosts(publicPosts)
      setLoading(false)
    }

    void load()
  }, [profileId])

  const toggleLike = async (postId: string) => {
    if (!currentUserId) { router.push("/espace/membres"); return }
    const alreadyLiked = likedPostIds.has(postId)
    const delta = alreadyLiked ? -1 : 1

    setLikedPostIds((prev) => {
      const next = new Set(prev)
      alreadyLiked ? next.delete(postId) : next.add(postId)
      localStorage.setItem(`milele_liked_${currentUserId}`, JSON.stringify([...next]))
      return next
    })
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, likes_count: Math.max(0, p.likes_count + delta) } : p))

    const post = posts.find((p) => p.id === postId)
    if (post) {
      await supabase.from("publications").update({ likes_count: Math.max(0, post.likes_count + delta) }).eq("id", postId)
      if (!alreadyLiked && post.user_id !== currentUserId) {
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
      .select("id, user_id, content, created_at")
      .eq("publication_id", postId)
      .order("created_at", { ascending: true })
      .limit(50)

    if (!error && data) {
      const rows = data as Array<{ id: string; user_id: string; content: string; created_at: string }>
      const authorIds = [...new Set(rows.map((r) => r.user_id))]
      let profilesMap: Record<string, { display_name: string | null; avatar_url: string | null }> = {}
      if (authorIds.length > 0) {
        const { data: pdata } = await supabase.from("profiles").select("id, display_name, avatar_url").in("id", authorIds)
        for (const p of (pdata ?? []) as Array<{ id: string; display_name: string | null; avatar_url: string | null }>) {
          profilesMap[p.id] = p
        }
      }
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: rows.map((r) => ({
          ...r,
          author_name: profilesMap[r.user_id]?.display_name ?? "Membre Milele",
          author_avatar_url: profilesMap[r.user_id]?.avatar_url ?? null,
        })),
      }))
    }
    setLoadingComments((prev) => { const n = new Set(prev); n.delete(postId); return n })
  }

  const toggleComments = (postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) { next.delete(postId) }
      else { next.add(postId); void loadComments(postId) }
      return next
    })
  }

  const addComment = async (postId: string) => {
    if (!currentUserId) { router.push("/espace/membres"); return }
    const content = (commentInputs[postId] ?? "").trim()
    if (!content) return

    setPostingComment((prev) => new Set(prev).add(postId))
    const { data, error } = await supabase
      .from("publication_comments")
      .insert({ publication_id: postId, user_id: currentUserId, content: content.slice(0, 1000) })
      .select()

    if (!error && data?.length) {
      const me = (await supabase.from("profiles").select("display_name, avatar_url").eq("id", currentUserId).maybeSingle()).data as { display_name: string | null; avatar_url: string | null } | null
      setCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), {
          ...(data[0] as { id: string; user_id: string; content: string; created_at: string }),
          author_name: me?.display_name ?? "Moi",
          author_avatar_url: me?.avatar_url ?? null,
        }],
      }))
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }))
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments_count: p.comments_count + 1 } : p))
      await supabase.from("publications").update({ comments_count: (posts.find((p) => p.id === postId)?.comments_count ?? 0) + 1 }).eq("id", postId)

      // Notification
      const postAuthor = posts.find((p) => p.id === postId)
      if (postAuthor?.user_id && postAuthor.user_id !== currentUserId) {
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--background)" }}>
        <div className="w-8 h-8 rounded-full border-2 animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
      </div>
    )
  }

  if (notFound || !profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background: "var(--background)" }}>
        <UserCircle size={48} style={{ color: "var(--muted-foreground)" }} />
        <p className="text-sm" style={{ color: "var(--muted-foreground)" }}>Profil introuvable ou non public.</p>
        <Link href="/espace/profil" className="text-xs px-4 py-2 rounded-xl" style={{ background: "var(--secondary)", color: "var(--foreground)" }}>
          Retour
        </Link>
      </div>
    )
  }

  const memberSince = new Date(profile.created_at).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })
  const totalLikes = posts.reduce((sum, post) => sum + post.likes_count, 0)
  const totalComments = posts.reduce((sum, post) => sum + post.comments_count, 0)

  return (
    <div className="relative min-h-screen pb-20 overflow-hidden" style={{ background: "var(--background)" }}>
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-72 h-72 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, var(--primary) 22%, transparent)", opacity: 0.6 }}
      />
      <div
        className="pointer-events-none absolute top-40 -right-24 w-80 h-80 rounded-full blur-3xl"
        style={{ background: "color-mix(in srgb, #22c55e 16%, transparent)", opacity: 0.5 }}
      />
      {/* Header */}
      <div className="sticky top-0 z-10 px-4 h-14 flex items-center gap-3"
        style={{
          background: "color-mix(in srgb, var(--background) 72%, transparent)",
          backdropFilter: "blur(24px) saturate(1.2)",
          borderBottom: "1px solid color-mix(in srgb, var(--primary) 16%, var(--border))",
        }}>
        <button onClick={() => router.back()} className="p-2 rounded-xl" style={{ color: "var(--foreground)" }}>
          <ArrowLeft size={18} />
        </button>
        <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>
          {profile.display_name ?? "Profil"}
        </span>
      </div>

      <div className="relative z-10 max-w-xl mx-auto px-4 pt-6">
        <div className="mb-3 flex justify-center">
          <span
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{
              color: "var(--primary)",
              background: "color-mix(in srgb, var(--primary) 10%, var(--card))",
              border: "1px solid color-mix(in srgb, var(--primary) 24%, var(--border))",
              boxShadow: "0 8px 22px color-mix(in srgb, var(--primary) 20%, transparent)",
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: "var(--primary)" }} />
            Profil Public Liquid
          </span>
        </div>

        {/* Carte profil */}
        <div className="rounded-3xl p-6 mb-6 flex flex-col items-center gap-4"
          style={{
            background: "color-mix(in srgb, var(--card) 82%, transparent)",
            border: "1px solid color-mix(in srgb, var(--primary) 22%, var(--border))",
            backdropFilter: "blur(18px) saturate(1.1)",
            boxShadow: "0 14px 42px color-mix(in srgb, var(--primary) 14%, transparent)",
          }}>
          <div
            className="w-24 h-24 rounded-full flex items-center justify-center overflow-hidden"
            style={{
              background: "var(--secondary)",
              border: "3px solid color-mix(in srgb, var(--primary) 45%, transparent)",
              boxShadow: "0 0 0 6px color-mix(in srgb, var(--primary) 12%, transparent), 0 18px 30px color-mix(in srgb, var(--primary) 20%, transparent)",
            }}
          >
            {profile.avatar_url ? (
              <Image src={profile.avatar_url} alt={profile.display_name ?? "Avatar"} width={96} height={96} className="w-full h-full object-cover" unoptimized />
            ) : (
              <span className="text-3xl font-bold" style={{ color: "var(--primary)" }}>
                {(profile.display_name?.[0] ?? "M").toUpperCase()}
              </span>
            )}
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-black tracking-tight" style={{
              color: "var(--foreground)",
              textShadow: "0 8px 20px color-mix(in srgb, var(--primary) 20%, transparent)",
            }}>
              {profile.display_name ?? "Membre Milele"}
            </h1>
            <p className="text-xs mt-1" style={{ color: "var(--muted-foreground)" }}>Membre depuis {memberSince}</p>
            {profile.bio && (
              <p className="text-sm mt-3 leading-relaxed" style={{ color: "var(--foreground)" }}>{profile.bio}</p>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 mt-2 w-full">
            <div className="text-center flex-1 rounded-2xl py-2.5" style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))" }}>
              <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>{posts.length}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>publications</p>
            </div>
            <div className="text-center flex-1 rounded-2xl py-2.5" style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))" }}>
              <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>{totalLikes}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>j'aime reçus</p>
            </div>
            <div className="text-center flex-1 rounded-2xl py-2.5" style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))", border: "1px solid color-mix(in srgb, var(--primary) 18%, var(--border))" }}>
              <p className="text-lg font-bold" style={{ color: "var(--primary)" }}>{totalComments}</p>
              <p className="text-[11px]" style={{ color: "var(--muted-foreground)" }}>commentaires</p>
            </div>
          </div>

          {/* Bouton Connecter (si autre profil) */}
          {currentUserId && currentUserId !== profileId && (
            <div className="mt-4 w-full flex justify-center">
              {connectionStatus === "accepted" ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "color-mix(in srgb, var(--primary) 12%, var(--card))", color: "var(--primary)", border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)" }}>
                  <UserCheck size={15} />
                  Connectés
                </div>
              ) : connectionStatus === "pending" ? (
                <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium"
                  style={{ background: "var(--secondary)", color: "var(--muted-foreground)", border: "1px solid var(--border)" }}>
                  <Clock size={15} />
                  Demande envoyée
                </div>
              ) : (
                <button onClick={() => void sendConnectionRequest()} disabled={connecting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:scale-105 active:scale-95 disabled:opacity-60"
                  style={{
                    background: "linear-gradient(135deg, color-mix(in srgb, var(--primary) 92%, white), color-mix(in srgb, var(--primary) 70%, black))",
                    color: "var(--primary-foreground)",
                    border: "1px solid color-mix(in srgb, var(--primary) 34%, transparent)",
                    boxShadow: "0 10px 26px color-mix(in srgb, var(--primary) 35%, transparent)",
                  }}>
                  <UserPlus size={15} />
                  {connecting ? "Envoi..." : "Se connecter"}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Publications */}
        {posts.length === 0 ? (
          <div className="text-center py-12" style={{ color: "var(--muted-foreground)" }}>
            <p className="text-sm">Aucune publication publique pour l'instant.</p>
          </div>
        ) : (
          <>
            {/* Toggle vue */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>{posts.length} publication{posts.length > 1 ? "s" : ""}</span>
              <div className="flex gap-1 p-1 rounded-xl" style={{ background: "color-mix(in srgb, var(--card) 88%, transparent)", border: "1px solid color-mix(in srgb, var(--primary) 16%, var(--border))" }}>
                <button onClick={() => setViewMode("list")}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: viewMode === "list" ? "var(--card)" : "transparent", color: viewMode === "list" ? "var(--primary)" : "var(--muted-foreground)" }}>
                  <List size={14} />
                </button>
                <button onClick={() => setViewMode("grid")}
                  className="p-1.5 rounded-lg transition-all"
                  style={{ background: viewMode === "grid" ? "var(--card)" : "transparent", color: viewMode === "grid" ? "var(--primary)" : "var(--muted-foreground)" }}>
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>

            {/* Vue grille */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-2 mb-6">
                {posts.map((post) => {
                  const { text, media } = parseContent(post.content)
                  const firstImageUrl = media?.find((item) => item.type === "image")?.url ?? post.image_url
                  return (
                    <div key={post.id} className="rounded-2xl overflow-hidden cursor-pointer"
                      style={{
                        background: "color-mix(in srgb, var(--card) 86%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--primary) 14%, var(--border))",
                        boxShadow: "0 10px 28px color-mix(in srgb, var(--primary) 9%, transparent)",
                      }}
                      onClick={() => setViewMode("list")}>
                      {media && media[0] ? (
                        media[0].type === "video" ? (
                          <div className="aspect-square bg-black flex items-center justify-center">
                            <span className="text-2xl">▶️</span>
                          </div>
                        ) : (
                          <Image src={media[0].url} alt="Media de la publication" width={200} height={200}
                            className="w-full aspect-square object-cover" unoptimized />
                        )
                      ) : firstImageUrl ? (
                        <Image src={firstImageUrl} alt="Image de la publication" width={200} height={200}
                          className="w-full aspect-square object-cover" unoptimized />
                      ) : (
                        <div className="aspect-square flex items-center justify-center p-3"
                          style={{ background: "color-mix(in srgb, var(--primary) 8%, var(--card))" }}>
                          <p className="text-xs text-center line-clamp-5" style={{ color: "var(--foreground)" }}>{text}</p>
                        </div>
                      )}
                      <div className="px-2.5 py-2 flex items-center gap-2">
                        <Heart size={10} style={{ color: "#ef4444" }} />
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{post.likes_count}</span>
                        <MessageCircle size={10} style={{ color: "var(--muted-foreground)" }} />
                        <span className="text-[10px]" style={{ color: "var(--muted-foreground)" }}>{post.comments_count}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
          <div className="space-y-4">
            {posts.map((post) => {
              const { text, media } = parseContent(post.content)
              const firstMedia = media?.[0]
              const firstImageUrl = media?.find((item) => item.type === "image")?.url ?? post.image_url
              return (
                <div key={post.id} className="rounded-2xl p-4" style={{
                  background: "color-mix(in srgb, var(--card) 86%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--primary) 14%, var(--border))",
                  boxShadow: "0 12px 28px color-mix(in srgb, var(--primary) 10%, transparent)",
                  backdropFilter: "blur(14px) saturate(1.06)",
                }}>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: "var(--foreground)" }}>{text}</p>

                  {/* Médias */}
                  {(firstMedia || firstImageUrl) && (
                    <div className="mb-3 rounded-xl overflow-hidden">
                      {firstMedia?.type === "video" ? (
                        <video src={firstMedia.url} controls className="w-full rounded-xl max-h-72 object-cover" />
                      ) : (
                        <Image src={firstImageUrl ?? ""} alt="Image principale de la publication" width={600} height={300} className="w-full rounded-xl max-h-72 object-cover" unoptimized />
                      )}
                    </div>
                  )}

                  <p className="text-[11px] mb-3" style={{ color: "var(--muted-foreground)" }}>
                    {new Date(post.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-3 border-t" style={{ borderColor: "color-mix(in srgb, var(--primary) 12%, var(--border))" }}>
                    <button
                      onClick={() => void toggleLike(post.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: likedPostIds.has(post.id)
                          ? "linear-gradient(135deg, color-mix(in srgb, #ef4444 18%, var(--card)), color-mix(in srgb, #ef4444 8%, var(--card)))"
                          : "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)), color-mix(in srgb, var(--card) 96%, transparent))",
                        color: likedPostIds.has(post.id) ? "#ef4444" : "var(--foreground)",
                        border: `1px solid ${likedPostIds.has(post.id) ? "color-mix(in srgb, #ef4444 34%, transparent)" : "color-mix(in srgb, var(--primary) 22%, var(--border))"}`,
                        boxShadow: likedPostIds.has(post.id)
                          ? "0 8px 20px color-mix(in srgb, #ef4444 26%, transparent)"
                          : "0 8px 20px color-mix(in srgb, var(--primary) 16%, transparent)",
                      }}
                    >
                      <Heart size={12} fill={likedPostIds.has(post.id) ? "#ef4444" : "none"} />
                      {post.likes_count} J'aime
                    </button>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: expandedComments.has(post.id)
                          ? "linear-gradient(135deg, color-mix(in srgb, var(--primary) 20%, var(--card)), color-mix(in srgb, var(--primary) 8%, var(--card)))"
                          : "linear-gradient(135deg, color-mix(in srgb, var(--primary) 8%, var(--card)), color-mix(in srgb, var(--card) 96%, transparent))",
                        color: expandedComments.has(post.id) ? "var(--primary)" : "var(--foreground)",
                        border: `1px solid ${expandedComments.has(post.id) ? "color-mix(in srgb, var(--primary) 34%, transparent)" : "color-mix(in srgb, var(--primary) 22%, var(--border))"}`,
                        boxShadow: expandedComments.has(post.id)
                          ? "0 8px 20px color-mix(in srgb, var(--primary) 24%, transparent)"
                          : "0 8px 20px color-mix(in srgb, var(--primary) 14%, transparent)",
                      }}
                    >
                      <MessageCircle size={12} />
                      {post.comments_count} Commenter
                    </button>
                  </div>

                  {/* Section commentaires */}
                  {expandedComments.has(post.id) && (
                    <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                      {loadingComments.has(post.id) ? (
                        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Chargement...</p>
                      ) : (commentsMap[post.id] ?? []).length === 0 ? (
                        <p className="text-xs mb-2" style={{ color: "var(--muted-foreground)" }}>Aucun commentaire encore.</p>
                      ) : (
                        <div className="space-y-2 mb-3">
                          {(commentsMap[post.id] ?? []).map((comment) => (
                            <div key={comment.id} className="flex gap-2">
                              <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center overflow-hidden"
                                style={{ background: "var(--secondary)", border: "1px solid var(--border)" }}>
                                {comment.author_avatar_url ? (
                                  <Image src={comment.author_avatar_url} alt={comment.author_name ? `Avatar de ${comment.author_name}` : "Avatar du membre"} width={28} height={28} className="w-full h-full object-cover" unoptimized />
                                ) : (
                                  <span className="text-[10px] font-bold" style={{ color: "var(--primary)" }}>
                                    {(comment.author_name?.[0] ?? "M").toUpperCase()}
                                  </span>
                                )}
                              </div>
                              <div className="min-w-0">
                                <span className="text-xs font-semibold" style={{ color: "var(--foreground)" }}>{comment.author_name ?? "Membre"} </span>
                                <span className="text-xs" style={{ color: "var(--foreground)" }}>{comment.content}</span>
                                <p className="text-[10px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
                                  {new Date(comment.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      {currentUserId ? (
                        <div className="flex gap-2">
                          <input
                            value={commentInputs[post.id] ?? ""}
                            onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void addComment(post.id) } }}
                            placeholder="Répondre..."
                            className="flex-1 px-3 py-2 rounded-xl text-xs outline-none"
                            style={{ background: "var(--background)", border: "1px solid var(--border)", color: "var(--foreground)" }}
                          />
                          <button
                            onClick={() => void addComment(post.id)}
                            disabled={postingComment.has(post.id) || !(commentInputs[post.id] ?? "").trim()}
                            className="px-3 py-2 rounded-xl disabled:opacity-40"
                            style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}
                          >
                            <Send size={14} />
                          </button>
                        </div>
                      ) : (
                        <Link href="/espace/membres" className="text-xs" style={{ color: "var(--primary)" }}>
                          Connecte-toi pour commenter →
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
