"use client"

import React, { useRef, useState, useEffect, useCallback } from "react"
import { LiquidMetalButton } from "./DynamicLiquidMetalButton"

/* ═══ Icônes futuristes SVG ═══ */
function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
      <path d="M8 5.14v13.72a1 1 0 001.5.86l11.04-6.86a1 1 0 000-1.72L9.5 4.28a1 1 0 00-1.5.86z" />
    </svg>
  )
}
function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" stroke="none">
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}
function PrevIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none">
      <rect x="4" y="5" width="2.5" height="14" rx="0.5" />
      <path d="M19 5.27v13.46a1 1 0 01-1.5.86L8 12.86a1 1 0 010-1.72l9.5-6.73A1 1 0 0119 5.27z" />
    </svg>
  )
}
function NextIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" stroke="none">
      <rect x="17.5" y="5" width="2.5" height="14" rx="0.5" />
      <path d="M5 5.27v13.46a1 1 0 001.5.86l9.5-6.73a1 1 0 000-1.72L6.5 4.41A1 1 0 005 5.27z" />
    </svg>
  )
}
function MuteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" opacity="0.3" />
      <line x1="23" y1="9" x2="17" y2="15" />
      <line x1="17" y1="9" x2="23" y2="15" />
    </svg>
  )
}
function VolumeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 5L6 9H2v6h4l5 4V5z" fill="currentColor" opacity="0.3" />
      <path d="M15.54 8.46a5 5 0 010 7.07" />
      <path d="M19.07 4.93a10 10 0 010 14.14" opacity="0.4" />
    </svg>
  )
}
function PowerIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity={active ? 1 : 0.4}>
      <path d="M18.36 6.64a9 9 0 11-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
    </svg>
  )
}

const PLAYER_KEY = "milele-player-enabled"
const RETRACT_DELAY = 4000

export interface Track {
  src: string
  title: string
}

interface AudioPlayerProps {
  autoPlayOnLoad?: boolean
  autoPlayDelayMs?: number
}

const DEFAULT_PLAYLIST: Track[] = [
  { src: "/Moyo%20Milele.mp3", title: "Moyo Milele" },
  { src: "/Malaika.mp3", title: "Malaika" },
]

export default function AudioPlayer({ autoPlayOnLoad = false, autoPlayDelayMs = 0 }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [progress, setProgress] = useState(0)
  const [currentTrack, setCurrentTrack] = useState(0)
  const [playerEnabled, setPlayerEnabled] = useState(true)
  const [showConsentPrompt, setShowConsentPrompt] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const retractTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const playlist = DEFAULT_PLAYLIST

  // Auto-rétraction après 2s sans interaction
  const resetRetractTimer = useCallback(() => {
    if (retractTimer.current) clearTimeout(retractTimer.current)
    retractTimer.current = setTimeout(() => {
      setExpanded(false)
    }, RETRACT_DELAY)
  }, [])

  // Charger l'état du toggle
  useEffect(() => {
    const saved = localStorage.getItem(PLAYER_KEY)
    if (saved === "false") {
      setPlayerEnabled(false)
    }
  }, [])

  useEffect(() => {
    if (!autoPlayOnLoad || !playerEnabled) return

    const timer = setTimeout(() => {
      setShowConsentPrompt(true)
    }, Math.max(0, autoPlayDelayMs))

    return () => clearTimeout(timer)
  }, [autoPlayOnLoad, autoPlayDelayMs, playerEnabled])

  const handleConsentChoice = useCallback((accepted: boolean) => {
    setShowConsentPrompt(false)

    if (!accepted) return

    const audio = audioRef.current
    if (!audio) return
    audio.play().then(() => {
      setIsPlaying(true)
      setExpanded(true)
      resetRetractTimer()
    }).catch(() => {})
  }, [resetRetractTimer])

  // Quand on ouvre le lecteur, démarrer le timer
  useEffect(() => {
    if (expanded) {
      resetRetractTimer()
    }
    return () => {
      if (retractTimer.current) clearTimeout(retractTimer.current)
    }
  }, [expanded, resetRetractTimer])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const update = () => {
      if (audio.duration) setProgress((audio.currentTime / audio.duration) * 100)
    }
    const onEnd = () => {
      if (currentTrack < playlist.length - 1) {
        setCurrentTrack((t) => t + 1)
      } else {
        setIsPlaying(false)
        setProgress(0)
      }
    }
    audio.addEventListener("timeupdate", update)
    audio.addEventListener("ended", onEnd)
    return () => {
      audio.removeEventListener("timeupdate", update)
      audio.removeEventListener("ended", onEnd)
    }
  }, [currentTrack, playlist.length])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = playlist[currentTrack].src
    audio.load()
    if (isPlaying) {
      audio.play().catch(() => {})
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack])

  const handlePlayPause = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      audio.play().catch(() => {})
      setIsPlaying(true)
    }
    resetRetractTimer()
  }, [isPlaying, resetRetractTimer])

  const handlePrev = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.currentTime > 3 || currentTrack === 0) {
      audio.currentTime = 0
    } else {
      setCurrentTrack((t) => t - 1)
    }
    resetRetractTimer()
  }, [currentTrack, resetRetractTimer])

  const handleNext = useCallback(() => {
    if (currentTrack < playlist.length - 1) {
      setCurrentTrack((t) => t + 1)
    }
    resetRetractTimer()
  }, [currentTrack, playlist.length, resetRetractTimer])

  const handleMuteToggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = !isMuted
    setIsMuted(!isMuted)
    resetRetractTimer()
  }, [isMuted, resetRetractTimer])

  const handleTogglePlayer = useCallback(() => {
    const next = !playerEnabled
    setPlayerEnabled(next)
    localStorage.setItem(PLAYER_KEY, String(next))
    if (!next && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
    }
    resetRetractTimer()
  }, [playerEnabled, isPlaying, resetRetractTimer])

  const handleBubbleClick = useCallback(() => {
    setExpanded(true)
    resetRetractTimer()
  }, [resetRetractTimer])

  // Garder le lecteur ouvert tant que la souris est dessus
  const handleMouseEnter = useCallback(() => {
    if (retractTimer.current) clearTimeout(retractTimer.current)
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (expanded) resetRetractTimer()
  }, [expanded, resetRetractTimer])

  // ═══ Lecteur désactivé → petit bouton Power grisé ═══
  if (!playerEnabled) {
    return (
      <div style={{ position: "fixed", bottom: 12, left: 12, zIndex: 50 }}>
        <audio ref={audioRef} src={playlist[currentTrack].src} preload="metadata" />
        <LiquidMetalButton
          viewMode="icon"
          width={44}
          height={44}
          tinted
          iconNode={<PowerIcon active={false} />}
          label="Activer le lecteur"
          onClick={handleTogglePlayer}
          className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          tabIndex={0}
          aria-label="Activer le lecteur audio"
        />
      </div>
    )
  }

  const track = playlist[currentTrack]

  // ═══ Rétracté → boule compacte avec tooltip titre ═══
  if (!expanded) {
    return (
      <div
        style={{ position: "fixed", bottom: 12, left: 12, zIndex: 50 }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onTouchStart={() => setHovered(h => !h)}
      >
        <audio ref={audioRef} src={track.src} preload="metadata" />

        {/* Anneau de progression autour de la boule quand ça joue */}
        {isPlaying && (
          <svg
            width="34" height="34"
            viewBox="0 0 34 34"
            style={{ position: "absolute", top: -6, left: -6, pointerEvents: "none", zIndex: 0 }}
            className="-rotate-90"
          >
            <circle cx="17" cy="17" r="15.5" fill="none" stroke="rgba(59,130,246,0.18)" strokeWidth="1.5" />
            <circle
              cx="17" cy="17" r="15.5" fill="none"
              stroke="rgba(96,165,250,0.55)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 15.5}`}
              strokeDashoffset={`${2 * Math.PI * 15.5 * (1 - progress / 100)}`}
              style={{ transition: "stroke-dashoffset 0.3s ease" }}
            />
          </svg>
        )}

        {/* Bulle tooltip avec le titre défilant */}
        {hovered && (
          <div
            className="animate-in fade-in slide-in-from-left-1 duration-200"
            style={{
              position: "absolute",
              left: "calc(100% + 10px)",
              top: "50%",
              transform: "translateY(-50%)",
              overflow: "hidden",
              maxWidth: "160px",
              padding: "6px 12px",
              borderRadius: "10px",
              fontSize: "11px",
              fontWeight: 500,
              letterSpacing: "0.03em",
              color: "#60a5fa",
              background: "color-mix(in srgb, var(--card) 90%, transparent)",
              backdropFilter: "blur(12px)",
              border: "1px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
              boxShadow: "0 4px 16px oklch(0.10 0.03 150 / 0.12)",
              pointerEvents: "none",
            }}
          >
            <div
              style={{
                display: "inline-block",
                whiteSpace: "nowrap",
                animation: "marquee-tooltip 8s linear infinite",
              }}
            >
              <span>{isPlaying ? `♪ ${track.title}` : "Ouvrir le lecteur"}</span>
              <span style={{ paddingLeft: "3em" }}>{isPlaying ? `♪ ${track.title}` : "Ouvrir le lecteur"}</span>
            </div>
          </div>
        )}

        <LiquidMetalButton
          viewMode="icon"
          width={44}
          height={44}
          tinted
          iconNode={isPlaying ? undefined : <PowerIcon active={true} />}
          label={isPlaying ? "Lecteur" : "Ouvrir le lecteur"}
          onClick={handleBubbleClick}
          className="min-h-[44px] min-w-[44px] focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
          tabIndex={0}
          aria-label="Ouvrir le lecteur audio"
        />

        {showConsentPrompt && (
          <div
            className="animate-in fade-in slide-in-from-left-1 duration-200"
            style={{
              position: "absolute",
              left: "calc(100% + 10px)",
              bottom: 0,
              minWidth: "190px",
              maxWidth: "240px",
              padding: "8px 10px",
              borderRadius: "12px",
              color: "var(--foreground)",
              background: "color-mix(in srgb, var(--card) 92%, transparent)",
              border: "1px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
              boxShadow: "0 6px 18px oklch(0.10 0.03 150 / 0.18)",
            }}
          >
            <p style={{ fontSize: "11px", lineHeight: 1.4, marginBottom: "8px", opacity: 0.92 }}>
              🎵 Une mélodie vous attend —{" "}<br />souhaitez-vous l'écouter ?
            </p>
            <div style={{ display: "flex", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleConsentChoice(true)}
                className="min-h-[28px] rounded-md px-2.5 text-xs"
                style={{
                  background: "color-mix(in srgb, var(--primary) 22%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--primary) 28%, var(--border))",
                  color: "var(--foreground)",
                }}
              >
                Oui
              </button>
              <button
                type="button"
                onClick={() => handleConsentChoice(false)}
                className="min-h-[28px] rounded-md px-2.5 text-xs"
                style={{
                  background: "transparent",
                  border: "1px solid color-mix(in srgb, var(--muted-foreground) 25%, var(--border))",
                  color: "var(--muted-foreground)",
                }}
              >
                Non
              </button>
            </div>
          </div>
        )}

        <style>{`
          @keyframes marquee-tooltip {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    )
  }

  // ═══ Expandé → lecteur complet ═══
  return (
    <div
      style={{ position: "fixed", bottom: 12, left: 12, zIndex: 50, maxWidth: 'calc(100vw - 24px)' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <audio ref={audioRef} src={track.src} preload="metadata" />

      <div
        className="flex flex-col items-start gap-0 rounded-2xl backdrop-blur-xl border animate-in fade-in slide-in-from-bottom-2 duration-300"
        style={{
          background: 'color-mix(in srgb, var(--card) 85%, transparent)',
          borderColor: 'color-mix(in srgb, var(--primary) 15%, var(--border))',
          boxShadow: '0 16px 42px rgba(15,23,42,0.35), 0 6px 22px rgba(37,99,235,0.28), 0 0 0 1px rgba(96,165,250,0.2), inset 0 1px 0 rgba(255,255,255,0.22)',
          padding: '6px',
          minWidth: '160px',
          willChange: 'transform, opacity',
        }}
      >
        {/* Barre de progression fine en haut */}
        <div
          className="w-full rounded-full overflow-hidden mb-1.5"
          style={{ height: '2px', background: 'color-mix(in srgb, var(--primary) 12%, var(--border))' }}
        >
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, #3b82f6, #60a5fa)',
              willChange: 'width',
            }}
          />
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-1">
          {/* Précédent */}
          <LiquidMetalButton
            viewMode="icon"
            width={28}
            height={28}
            tinted
            iconNode={<PrevIcon />}
            label="Précédent"
            onClick={handlePrev}
          />

          {/* Play / Pause */}
          <LiquidMetalButton
            viewMode="icon"
            width={36}
            height={36}
            tinted
            iconNode={isPlaying ? <PauseIcon /> : <PlayIcon />}
            label={isPlaying ? "Pause" : "Play"}
            onClick={handlePlayPause}
          />

          {/* Suivant */}
          <LiquidMetalButton
            viewMode="icon"
            width={28}
            height={28}
            tinted
            iconNode={<NextIcon />}
            label="Suivant"
            onClick={handleNext}
          />

          {/* Volume */}
          <LiquidMetalButton
            viewMode="icon"
            width={26}
            height={26}
            tinted
            iconNode={isMuted ? <MuteIcon /> : <VolumeIcon />}
            label={isMuted ? "Unmute" : "Mute"}
            onClick={handleMuteToggle}
          />

          {/* Toggle on/off */}
          <LiquidMetalButton
            viewMode="icon"
            width={24}
            height={24}
            tinted
            iconNode={<PowerIcon active={playerEnabled} />}
            label="Désactiver le lecteur"
            onClick={handleTogglePlayer}
          />
        </div>

        {/* Titre défilant */}
        <div
          className="w-full overflow-hidden mt-1"
          style={{ maxWidth: '150px' }}
        >
          <div
            className="whitespace-nowrap text-[10px] font-medium tracking-wider"
            style={{
              color: 'var(--primary)',
              opacity: 0.7,
              animation: track.title.length > 20 ? 'marquee 12s linear infinite' : 'none',
            }}
          >
            <span>{track.title}</span>
            {track.title.length > 20 && (
              <span style={{ paddingLeft: '3em' }}>{track.title}</span>
            )}
          </div>
        </div>
      </div>

      {/* Keyframes pour le marquee */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes marquee-tooltip {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
