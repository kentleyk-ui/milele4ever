"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import {
  ArrowUpRight,
  BookHeart,
  Camera,
  Clock3,
  FileText,
  Flame,
  Heart,
  Music2,
  Plus,
  Settings,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
  Users,
} from "lucide-react"
import ThemeSwitcher from "@/components/ThemeSwitcher"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"

type TabKey = "chronologie" | "souvenirs" | "famille" | "livre-or" | "heritage"

const TABS: Array<{ key: TabKey; label: string }> = [
  { key: "chronologie", label: "Chronologie" },
  { key: "souvenirs", label: "Souvenirs" },
  { key: "famille", label: "Famille" },
  { key: "livre-or", label: "Hommages" },
  { key: "heritage", label: "Heritage Milele" },
]

type TimelineEntry = {
  id: string
  year: string
  title: string
  summary: string
  side: "left" | "right"
}

type FlameParticle = {
  id: string
  left: number
  size: number
  delayMs: number
  durationMs: number
}

const TIMELINE: TimelineEntry[] = [
  {
    id: "entry-1952",
    year: "1952",
    title: "Naissance a Kinshasa",
    summary: "Elie Matipa Nkasa nait au coeur de Kinshasa, dans une famille de transmission et d'entraide.",
    side: "left",
  },
  {
    id: "entry-1975",
    year: "1975",
    title: "Mariage et fondation du foyer",
    summary: "Il construit un foyer stable, guide ses proches et devient un pilier reconnu de sa communaute.",
    side: "right",
  },
  {
    id: "entry-1984",
    year: "1984",
    title: "Engagement communautaire",
    summary: "Il organise des actions de quartier autour de l'education, de la mediation et du soutien aux familles.",
    side: "left",
  },
  {
    id: "entry-1998",
    year: "1998",
    title: "Transmission aux jeunes",
    summary: "Il lance des rencontres mensuelles de mentorat pour la jeunesse et les jeunes couples.",
    side: "right",
  },
  {
    id: "entry-2019",
    year: "2019",
    title: "Passage et memoire vivante",
    summary: "Son depart marque la naissance d'une memoire familiale active, continuee par ses proches.",
    side: "left",
  },
]

const SOUVENIRS = [
  {
    title: "La voix du dimanche",
    detail: "Enregistrement familial restaure et conserve dans l'espace AION.",
    type: "Audio",
    icon: Music2,
  },
  {
    title: "Album de Kinshasa",
    detail: "Serie de photos numerisees et classees dans le coffre souvenir.",
    type: "Photo",
    icon: Camera,
  },
  {
    title: "Lettre aux enfants",
    detail: "Texte manuscrit transcrit puis archive dans l'espace Documents.",
    type: "Texte",
    icon: FileText,
  },
] as const

const FAMILLE = [
  { role: "Epouse", name: "Marie Keita", note: "Gardienne des rituels familiaux" },
  { role: "Fille", name: "Amina Nkasa", note: "Responsable du livre d'or" },
  { role: "Fils", name: "Jonathan Nkasa", note: "Coordination souvenirs numeriques" },
  { role: "Petit-fils", name: "Elie Junior", note: "Volet memoire intergenerationnelle" },
] as const

const LIVRE_OR = [
  {
    author: "Famille Mbuyi",
    text: "Il etait un repere de paix. Chaque parole de lui etait une direction juste.",
    date: "12 Jan 2026",
  },
  {
    author: "Paroisse Saint Michel",
    text: "Nous gardons son sourire, sa patience et sa force tranquille dans nos coeurs.",
    date: "03 Fev 2026",
  },
  {
    author: "Equipe Milele",
    text: "Son histoire inspire la mission de transmettre, proteger et relier les familles.",
    date: "21 Mar 2026",
  },
] as const

const MILELE_PILLARS = [
  {
    title: "Espace Famille",
    description: "Checklist, documents, contacts et notifications pour coordonner les proches sans friction.",
    href: "/espace",
  },
  {
    title: "AION",
    description: "Journal, capsules, coffre-fort et souvenirs pour transmettre l'histoire familiale dans le temps.",
    href: "/aion",
  },
  {
    title: "Services",
    description: "Annuaire local de prestataires funeraires, fleuristes et accompagnement juridique.",
    href: "/services",
  },
  {
    title: "Profil & Cercle",
    description: "Gestion des membres, roles et acces pour proteger les contenus sensibles.",
    href: "/espace/profil",
  },
] as const

export default function HommagesClient() {
  const [activeTab, setActiveTab] = useState<TabKey>("chronologie")
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [memorialName, setMemorialName] = useState("Elie Matipa Nkasa")
  const [memorialYears, setMemorialYears] = useState("1952 - 2019")
  const [memorialQuote, setMemorialQuote] = useState("Un homme de parole, de paix et de transmission. Sa lumiere continue d'eclairer notre famille.")
  const [memorialCreator, setMemorialCreator] = useState("Marie Keita")
  const [memorialBadgesInput, setMemorialBadgesInput] = useState("Pere, Mentor, Batisseur de liens")
  const [photoUrl, setPhotoUrl] = useState("")
  const [candleCount, setCandleCount] = useState(248)
  const [isCandleGlowActive, setIsCandleGlowActive] = useState(false)
  const [isCandleLoading, setIsCandleLoading] = useState(false)
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")
  const [timelineEntries, setTimelineEntries] = useState<TimelineEntry[]>(TIMELINE)
  const [flameParticles, setFlameParticles] = useState<FlameParticle[]>([])
  const [isAddingTimelineEvent, setIsAddingTimelineEvent] = useState(false)
  const [newTimelineYear, setNewTimelineYear] = useState(new Date().getFullYear().toString())
  const [newTimelineTitle, setNewTimelineTitle] = useState("")
  const [newTimelineSummary, setNewTimelineSummary] = useState("")
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const videoGalleryInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const saved = localStorage.getItem("milele-hommages-editor")
    if (!saved) return
    try {
      const parsed = JSON.parse(saved) as {
        memorialName?: string
        memorialYears?: string
        memorialQuote?: string
        memorialCreator?: string
        memorialBadgesInput?: string
        photoUrl?: string
        candleCount?: number
        timelineEntries?: TimelineEntry[]
      }
      if (parsed.memorialName) setMemorialName(parsed.memorialName)
      if (parsed.memorialYears) setMemorialYears(parsed.memorialYears)
      if (parsed.memorialQuote) setMemorialQuote(parsed.memorialQuote)
      if (parsed.memorialCreator) setMemorialCreator(parsed.memorialCreator)
      if (parsed.memorialBadgesInput) setMemorialBadgesInput(parsed.memorialBadgesInput)
      if (parsed.photoUrl) setPhotoUrl(parsed.photoUrl)
      if (typeof parsed.candleCount === "number") setCandleCount(parsed.candleCount)
      if (Array.isArray(parsed.timelineEntries) && parsed.timelineEntries.length > 0) {
        setTimelineEntries(parsed.timelineEntries)
      }
    } catch {
      localStorage.removeItem("milele-hommages-editor")
    }
  }, [])

  useEffect(() => {
    const [birthYear = "", deathYear = ""] = memorialYears
      .split("-")
      .map((item) => item.trim())

    setTimelineEntries((prev) => {
      if (!prev.length) return prev

      const next = [...prev]
      const first = next[0]
      const last = next[next.length - 1]

      next[0] = {
        ...first,
        year: birthYear || first.year,
        title: `Naissance de ${memorialName}`,
        summary: `${memorialName} nait dans une famille de transmission. ${memorialQuote}`,
      }

      next[next.length - 1] = {
        ...last,
        year: deathYear || last.year,
        title: `Hommages continus de la famille`,
        summary: `Depuis ${deathYear || last.year}, ${memorialCreator} et les proches perpetuent la memoire autour de: ${memorialBadgesInput}.`,
      }

      return next
    })
  }, [memorialName, memorialYears, memorialQuote, memorialCreator, memorialBadgesInput])

  useEffect(() => {
    localStorage.setItem(
      "milele-hommages-editor",
      JSON.stringify({
        memorialName,
        memorialYears,
        memorialQuote,
        memorialCreator,
        memorialBadgesInput,
        photoUrl,
        candleCount,
        timelineEntries,
      }),
    )
  }, [memorialName, memorialYears, memorialQuote, memorialCreator, memorialBadgesInput, photoUrl, candleCount, timelineEntries])

  const memorialBadges = useMemo(
    () => memorialBadgesInput.split(",").map((item) => item.trim()).filter(Boolean),
    [memorialBadgesInput],
  )

  const memorialInitial = useMemo(() => memorialName.trim().charAt(0).toUpperCase() || "M", [memorialName])

  const handlePhotoSelection = async (file: File | undefined) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (result) setPhotoUrl(result)
    }
    reader.readAsDataURL(file)
  }

  const isVideoMedia = (value: string) => {
    const normalized = value.trim().toLowerCase()
    return normalized.startsWith("data:video/") || normalized.includes(".mp4") || normalized.includes("video/mp4")
  }

  const handleSave = () => {
    setSaveStatus("saving")
    setTimeout(() => setSaveStatus("saved"), 300)
    setTimeout(() => setSaveStatus("idle"), 2000)
  }

  const handleLightCandle = async () => {
    if (isCandleLoading) return
    setIsCandleGlowActive(true)
    setIsCandleLoading(true)
    setCandleCount((prev) => prev + 1)

    const burst = Array.from({ length: 16 }, (_, index) => ({
      id: `${Date.now()}-${index}`,
      left: Math.random() * 100,
      size: 12 + Math.random() * 16,
      delayMs: Math.floor(Math.random() * 240),
      durationMs: 900 + Math.floor(Math.random() * 700),
    }))
    setFlameParticles(burst)

    window.setTimeout(() => setIsCandleGlowActive(false), 1200)
    window.setTimeout(() => setIsCandleLoading(false), 700)
    window.setTimeout(() => setFlameParticles([]), 1700)
  }

  const handleAddTimelineEvent = () => {
    const year = newTimelineYear.trim()
    const title = newTimelineTitle.trim()
    const summary = newTimelineSummary.trim()
    if (!year || !title || !summary) return

    setTimelineEntries((prev) => [
      ...prev,
      {
        id: `entry-${Date.now()}`,
        year,
        title,
        summary,
        side: prev.length % 2 === 0 ? "left" : "right",
      },
    ])

    setNewTimelineYear(new Date().getFullYear().toString())
    setNewTimelineTitle("")
    setNewTimelineSummary("")
    setIsAddingTimelineEvent(false)
  }

  const stats = useMemo(
    () => [
      { label: "Bougies allumees", value: `${candleCount}` },
      { label: "Messages de soutien", value: "94" },
      { label: "Souvenirs archives", value: "37" },
    ],
    [candleCount],
  )

  return (
    <main className="min-h-screen bg-[#020617] text-[#e2e8f0]">
      <div className="min-h-screen bg-[radial-gradient(circle_at_15%_15%,#0f766e_0%,rgba(15,118,110,0.18)_18%,transparent_36%),radial-gradient(circle_at_90%_12%,rgba(251,191,36,0.2)_0%,transparent_35%),linear-gradient(160deg,#030712_0%,#020617_55%,#00171a_100%)]">
        <header className="sticky top-0 z-40 border-b border-emerald-900/25 bg-[#020617]/70 backdrop-blur-xl">
          <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center justify-between px-4 py-2 sm:px-6 lg:px-8">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-300" />
              <span className="text-sm font-semibold tracking-[0.18em] text-emerald-300">MILELE HOMMAGES</span>
            </div>

            <nav className="hidden items-center gap-7 text-sm text-slate-300 md:flex">
              <Link href="/" className="transition hover:text-emerald-300">Accueil</Link>
              <Link href="/espace" className="transition hover:text-emerald-300">Espace famille</Link>
              <Link href="/aion" className="transition hover:text-emerald-300">AION</Link>
              <Link href="/services" className="transition hover:text-emerald-300">Services</Link>
              <Link href="/a-propos" className="transition hover:text-emerald-300">A propos</Link>
            </nav>

            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-500/20 text-sm font-semibold text-emerald-100">
                MK
              </div>
            </div>
          </div>
        </header>

        <section className="mx-auto w-full max-w-6xl px-4 pb-10 pt-12 sm:px-6 lg:px-8">
          <div className="relative rounded-[2rem] border border-emerald-500/20 bg-slate-950/50 p-6 shadow-[0_24px_80px_rgba(2,6,23,0.55)] backdrop-blur md:p-10">
            <div
              className={`pointer-events-none absolute inset-0 rounded-[2rem] bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.24)_0%,rgba(16,185,129,0.18)_25%,transparent_62%)] transition-opacity duration-700 ${
                isCandleGlowActive ? "opacity-100" : "opacity-0"
              }`}
            />
            {flameParticles.map((particle) => (
              <span
                key={particle.id}
                className="pointer-events-none absolute bottom-8 text-amber-300/90"
                style={{
                  left: `${particle.left}%`,
                  animationName: "flameRise",
                  animationDuration: `${particle.durationMs}ms`,
                  animationDelay: `${particle.delayMs}ms`,
                  animationTimingFunction: "ease-out",
                  animationFillMode: "forwards",
                }}
              >
                <Flame style={{ width: particle.size, height: particle.size }} />
              </span>
            ))}
            <button
              type="button"
              onClick={() => setIsEditorOpen((prev) => !prev)}
              aria-label="Modifier le memorial"
              className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/40 bg-slate-900/80 text-emerald-200 transition hover:border-emerald-300 hover:text-emerald-100"
            >
              <Settings className="h-5 w-5" />
            </button>

            {isEditorOpen && (
              <div className="absolute right-4 top-16 z-30 flex max-h-[75vh] w-[min(92vw,420px)] flex-col rounded-2xl border border-emerald-500/35 bg-[#021019]/95 p-4 shadow-[0_20px_70px_rgba(0,0,0,0.6)] backdrop-blur-xl">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-emerald-200">Edition du memorial</p>
                  <button
                    type="button"
                    onClick={() => setIsEditorOpen(false)}
                    className="rounded-full border border-slate-700 p-1.5 text-slate-300 transition hover:border-emerald-500/50 hover:text-emerald-200"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto pr-1">
                  <div className="rounded-xl border border-slate-700 bg-slate-900/55 p-3">
                    <p className="mb-2 text-xs font-medium text-slate-300">Photo / Video du memorial</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="rounded-lg border border-emerald-600/45 bg-emerald-900/35 px-3 py-2 text-xs font-medium text-emerald-200 transition hover:border-emerald-400"
                      >
                        Appareil photo
                      </button>
                      <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-xs font-medium text-slate-200 transition hover:border-emerald-400"
                      >
                        Dossier / Galerie
                      </button>
                      <button
                        type="button"
                        onClick={() => videoGalleryInputRef.current?.click()}
                        className="rounded-lg border border-amber-600/45 bg-amber-900/35 px-3 py-2 text-xs font-medium text-amber-200 transition hover:border-amber-400"
                      >
                        Video MP4
                      </button>
                    </div>
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*,video/mp4,.mp4"
                      capture="environment"
                      onChange={(e) => void handlePhotoSelection(e.target.files?.[0])}
                      className="hidden"
                    />
                    <input
                      ref={galleryInputRef}
                      type="file"
                      accept="image/*,video/mp4,.mp4"
                      onChange={(e) => void handlePhotoSelection(e.target.files?.[0])}
                      className="hidden"
                    />
                    <input
                      ref={videoGalleryInputRef}
                      type="file"
                      accept="video/mp4,.mp4"
                      onChange={(e) => void handlePhotoSelection(e.target.files?.[0])}
                      className="hidden"
                    />
                  </div>

                  <label className="block text-xs font-medium text-slate-300">
                    URL image (optionnel)
                    <input
                      type="url"
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                      placeholder="https://..."
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Nom complet
                    <input
                      type="text"
                      value={memorialName}
                      onChange={(e) => setMemorialName(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Dates
                    <input
                      type="text"
                      value={memorialYears}
                      onChange={(e) => setMemorialYears(e.target.value)}
                      placeholder="1952 - 2019"
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Citation
                    <textarea
                      value={memorialQuote}
                      onChange={(e) => setMemorialQuote(e.target.value)}
                      rows={3}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Badges (separes par virgules)
                    <input
                      type="text"
                      value={memorialBadgesInput}
                      onChange={(e) => setMemorialBadgesInput(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                    />
                  </label>

                  <label className="block text-xs font-medium text-slate-300">
                    Auteur du memorial
                    <input
                      type="text"
                      value={memorialCreator}
                      onChange={(e) => setMemorialCreator(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                    />
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleSave}
                  className={`mt-4 w-full shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                    saveStatus === "saved"
                      ? "border border-emerald-400 bg-emerald-500/25 text-emerald-200"
                      : "border border-emerald-500/40 bg-emerald-900/45 text-emerald-200 hover:border-emerald-300"
                  }`}
                >
                  {saveStatus === "idle" ? "Enregistrer" : saveStatus === "saving" ? "Enregistrement..." : "Enregistre"}
                </button>
              </div>
            )}

            <div className="mx-auto max-w-4xl text-center">
              <div className="mx-auto mb-6 flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-amber-300 bg-emerald-950/70 text-5xl font-bold text-amber-50 shadow-[0_0_0_10px_rgba(16,185,129,0.1),0_18px_45px_rgba(0,0,0,0.45)]">
                {photoUrl ? (
                  isVideoMedia(photoUrl) ? (
                    <video
                      src={photoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      preload="auto"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <img src={photoUrl} alt={memorialName} className="h-full w-full object-cover" />
                  )
                ) : (
                  memorialInitial
                )}
              </div>
              <h1 className="text-4xl font-semibold tracking-tight text-slate-100 sm:text-6xl">{memorialName}</h1>
              <p className="mt-3 text-xl text-slate-300">{memorialYears}</p>
              <p className="mx-auto mt-6 max-w-3xl text-xl italic text-emerald-300 sm:text-2xl">
                "{memorialQuote}"
              </p>

              <div className="mt-7 flex flex-wrap items-center justify-center gap-3 text-sm">
                {memorialBadges.map((badge) => (
                  <span key={badge} className="rounded-full border border-emerald-600/50 bg-emerald-900/45 px-3 py-1 text-emerald-200">{badge}</span>
                ))}
                <span className="text-slate-400">
                  Memorial cree par <strong className="text-slate-200">{memorialCreator}</strong>
                </span>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-3 md:gap-4">
                <LiquidMetalButton
                  label={`Allumer une bougie (${candleCount})`}
                  width={220}
                  height={46}
                  tinted
                  leftIcon={<Flame className="h-4 w-4" />}
                  onClick={() => void handleLightCandle()}
                />
                <LiquidMetalButton
                  label="Partager"
                  width={180}
                  height={46}
                  tinted
                  leftIcon={<Share2 className="h-4 w-4" />}
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: `Hommage - ${memorialName}`,
                        text: "Decouvrez cet hommage sur Milele",
                        url: "https://www.milele4ever.com/hommages",
                      }).catch(() => undefined)
                      return
                    }
                    navigator.clipboard.writeText("https://www.milele4ever.com/hommages").catch(() => undefined)
                  }}
                />
                <LiquidMetalButton
                  label="Ouvrir Espace Famille"
                  width={260}
                  height={46}
                  tinted
                  leftIcon={<Users className="h-4 w-4" />}
                  onClick={() => {
                    window.location.href = "/espace"
                  }}
                />
              </div>

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {stats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-700/70 bg-slate-900/50 px-4 py-3">
                    <p className="text-2xl font-semibold text-slate-100">{item.value}</p>
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-slate-800/80 bg-[#020617]/70 p-4 sm:p-6">
              <div className="flex flex-wrap gap-2 border-b border-slate-800/90 pb-4">
                {TABS.map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      activeTab === tab.key
                        ? "bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/50"
                        : "text-slate-400 hover:bg-slate-800/70 hover:text-slate-200"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "chronologie" && (
                <div className="relative mt-8 grid gap-8 md:grid-cols-[1fr_auto_1fr] md:gap-0">
                  <div className="pointer-events-none absolute left-3 top-2 hidden h-[calc(100%-1rem)] w-[2px] bg-gradient-to-b from-emerald-300/80 via-emerald-500/60 to-transparent md:left-1/2 md:block md:-translate-x-1/2" />
                  {timelineEntries.map((entry) => (
                    <div key={entry.id} className="contents">
                      <article
                        className={`${entry.side === "left" ? "md:pr-12" : "md:invisible"} rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 ${entry.side === "left" ? "md:text-right" : ""}`}
                      >
                        {entry.side === "left" && (
                          <>
                            <span className="inline-flex rounded-full border border-emerald-600/40 bg-emerald-900/30 px-3 py-1 text-xs font-semibold text-emerald-300">
                              {entry.year}
                            </span>
                            <h3 className="mt-3 text-xl font-semibold text-slate-100">{entry.title}</h3>
                            <p className="mt-2 text-sm text-slate-400">{entry.summary}</p>
                          </>
                        )}
                      </article>

                      <div className="relative hidden w-12 items-start justify-center pt-8 md:flex">
                        <div className="h-3.5 w-3.5 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />
                      </div>

                      <article
                        className={`${entry.side === "right" ? "md:pl-12" : "md:invisible"} rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5`}
                      >
                        {entry.side === "right" && (
                          <>
                            <span className="inline-flex rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 text-xs font-semibold text-amber-200">
                              {entry.year}
                            </span>
                            <h3 className="mt-3 text-xl font-semibold text-slate-100">{entry.title}</h3>
                            <p className="mt-2 text-sm text-slate-400">{entry.summary}</p>
                          </>
                        )}
                      </article>
                    </div>
                  ))}

                  <div className="mt-2 rounded-2xl border border-slate-800/80 bg-slate-900/40 p-5 md:col-span-3">
                    <p className="text-sm text-slate-300">
                      Une chronologie vivante pour {memorialName}, enrichie avec les mises a jour de la famille et de {memorialCreator}.
                    </p>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => setIsAddingTimelineEvent((prev) => !prev)}
                        className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-900/35 px-4 py-2 text-sm font-medium text-emerald-200 transition hover:border-emerald-300"
                      >
                        <Plus className="h-4 w-4" />
                        Ajouter un evenement
                      </button>

                      {isAddingTimelineEvent && (
                        <div className="mt-4 grid gap-3 rounded-2xl border border-emerald-500/30 bg-slate-900/65 p-4 md:grid-cols-2">
                          <label className="text-xs font-medium text-slate-300">
                            Annee
                            <input
                              type="text"
                              value={newTimelineYear}
                              onChange={(e) => setNewTimelineYear(e.target.value)}
                              placeholder="2026"
                              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <label className="text-xs font-medium text-slate-300">
                            Titre
                            <input
                              type="text"
                              value={newTimelineTitle}
                              onChange={(e) => setNewTimelineTitle(e.target.value)}
                              placeholder="Nouvel evenement"
                              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <label className="text-xs font-medium text-slate-300 md:col-span-2">
                            Description
                            <textarea
                              rows={3}
                              value={newTimelineSummary}
                              onChange={(e) => setNewTimelineSummary(e.target.value)}
                              placeholder={`Souvenir ajoute pour ${memorialName}.`}
                              className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-900/75 px-3 py-2 text-sm text-slate-100 outline-none focus:border-emerald-400"
                            />
                          </label>

                          <div className="flex items-center gap-2 md:col-span-2">
                            <button
                              type="button"
                              onClick={handleAddTimelineEvent}
                              className="rounded-xl border border-emerald-500/60 bg-emerald-900/40 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:border-emerald-300"
                            >
                              Ajouter
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsAddingTimelineEvent(false)}
                              className="rounded-xl border border-slate-600 bg-slate-800/75 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
                            >
                              Annuler
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "souvenirs" && (
                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {SOUVENIRS.map((item) => {
                    const Icon = item.icon
                    return (
                      <article key={item.title} className="rounded-2xl border border-slate-800/80 bg-slate-900/45 p-5">
                        <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="text-xs uppercase tracking-[0.15em] text-emerald-300/80">{item.type}</p>
                        <h3 className="mt-2 text-lg font-semibold text-slate-100">{item.title}</h3>
                        <p className="mt-2 text-sm text-slate-400">{item.detail}</p>
                      </article>
                    )
                  })}
                  <div className="rounded-2xl border border-emerald-600/35 bg-gradient-to-br from-emerald-500/12 to-amber-400/10 p-5 md:col-span-3">
                    <div className="flex items-start gap-3">
                      <BookHeart className="mt-0.5 h-5 w-5 text-emerald-300" />
                      <p className="text-sm text-slate-300">
                        Tous les souvenirs sont synchronises avec les espaces Journal, Capsules et Coffre-fort pour eviter la perte de memoire familiale.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "famille" && (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {FAMILLE.map((member) => (
                    <article key={member.name} className="rounded-2xl border border-slate-800/80 bg-slate-900/45 p-5">
                      <p className="text-xs uppercase tracking-[0.16em] text-emerald-300/90">{member.role}</p>
                      <h3 className="mt-2 text-xl font-semibold text-slate-100">{member.name}</h3>
                      <p className="mt-2 text-sm text-slate-400">{member.note}</p>
                    </article>
                  ))}
                  <article className="rounded-2xl border border-emerald-500/35 bg-emerald-900/20 p-5 md:col-span-2">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-300" />
                      <p className="text-sm text-slate-300">
                        Les acces famille sont geres par roles pour proteger les contenus sensibles et garantir une memoire digne.
                      </p>
                    </div>
                  </article>
                </div>
              )}

              {activeTab === "livre-or" && (
                <div className="mt-8 space-y-4">
                  {LIVRE_OR.map((entry) => (
                    <article key={entry.author + entry.date} className="rounded-2xl border border-slate-800/80 bg-slate-900/45 p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="font-medium text-slate-100">{entry.author}</p>
                        <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                          <Clock3 className="h-3.5 w-3.5" /> {entry.date}
                        </p>
                      </div>
                      <p className="mt-3 text-sm leading-relaxed text-slate-300">"{entry.text}"</p>
                    </article>
                  ))}
                  <div className="rounded-2xl border border-slate-800/80 bg-slate-900/30 p-5 text-sm text-slate-400">
                    Bientot: connexion directe avec le suivi de suggestions et moderation staff pour valider chaque message.
                  </div>
                </div>
              )}

              {activeTab === "heritage" && (
                <div className="mt-8 grid gap-4 md:grid-cols-2">
                  {MILELE_PILLARS.map((item) => (
                    <Link
                      key={item.title}
                      href={item.href}
                      className="group rounded-2xl border border-slate-800/80 bg-slate-900/45 p-5 transition hover:border-emerald-500/60 hover:bg-slate-900/70"
                    >
                      <p className="text-xs uppercase tracking-[0.15em] text-emerald-300/90">Module</p>
                      <h3 className="mt-2 flex items-center gap-2 text-xl font-semibold text-slate-100">
                        {item.title}
                        <ArrowUpRight className="h-4 w-4 text-emerald-300 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                      </h3>
                      <p className="mt-2 text-sm text-slate-400">{item.description}</p>
                    </Link>
                  ))}
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-5 md:col-span-2">
                    <p className="flex items-start gap-2 text-sm text-amber-100">
                      <Heart className="mt-0.5 h-4 w-4" />
                      Ce memorial est designe comme porte d'entree emotionnelle: chaque section redirige vers les outils concrets de Milele.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <style jsx>{`
        @keyframes flameRise {
          0% {
            opacity: 0;
            transform: translateY(8px) scale(0.85);
          }
          20% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-220px) scale(1.2);
          }
        }
      `}</style>
    </main>
  )
}
