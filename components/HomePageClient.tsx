"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { StaffThemeProvider } from "@/components/StaffThemeProvider";
import { Hero } from "@/components/Hero";
import { Features } from "@/components/Features";
import { Services } from "@/components/Services";
import { Footer } from "@/components/Footer";
import { supabase } from "@/lib/supabaseClient";

const ShaderLiquidMetalButton = dynamic(
  () => import("@/components/liquid-metal-button").then((m) => m.LiquidMetalButton),
  { ssr: false },
);

const AudioPlayerWrapper = dynamic(() => import("@/components/AudioPlayerWrapper"), { ssr: false });
const ScrollToTop = dynamic(() => import("@/components/ScrollToTop").then((mod) => mod.ScrollToTop), { ssr: false });
const AdminAnnouncement = dynamic(() => import("@/components/AdminAnnouncement").then((mod) => mod.AdminAnnouncement), { ssr: false });

export default function Home() {
  return (
    <StaffThemeProvider>
      <HomeContent />
    </StaffThemeProvider>
  );
}

function HomeContent() {
  const router = useRouter()
  const [deferredSectionsReady, setDeferredSectionsReady] = useState(false)

  // Bouton "Créer un compte" dupliqué en haut à gauche
  // Utilise le même composant LiquidMetalButton que le bouton principal
  useEffect(() => {
    let mounted = true
    void (async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session?.user) {
        router.replace("/espace/profil")
      }
    })()
    return () => { mounted = false }
  }, [router])

  useEffect(() => {
    let cancelled = false
    const trigger = () => {
      if (!cancelled) setDeferredSectionsReady(true)
    }

    // Laisse le navigateur peindre le hero avant de monter les sections secondaires.
    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const id = window.requestIdleCallback(trigger, { timeout: 700 })
      return () => {
        cancelled = true
        window.cancelIdleCallback(id)
      }
    }

    const timeoutId = globalThis.setTimeout(trigger, 120)
    return () => {
      cancelled = true
      globalThis.clearTimeout(timeoutId)
    }
  }, [])

  return (
    <div className="page-surface min-h-screen relative" style={{ background: 'var(--background)' }}>
      {/* Bouton "Créer un compte" en haut à gauche */}

      {/* Contenu principal */}
      <Hero />
      <Features />
      <StatsSection />
      {deferredSectionsReady ? (
        <>
          <HowItWorksSection />
          <TestimonialsSection />
          <FAQSection />
          <InternalLinksSection />
          <Services />
          <MileleOneSignatureSection />
          <Footer />
        </>
      ) : null}
      <AudioPlayerWrapper autoPlayOnLoad autoPlayDelayMs={10000} />
      <ScrollToTop />
      <AdminAnnouncement />
    </div>
  );
}

function StatsSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)
  const [members, setMembers] = useState<number | null>(null)
  const [publications, setPublications] = useState<number | null>(null)
  const [animated, setAnimated] = useState({ members: 0, publications: 0 })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect() } },
      { threshold: 0.15 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    supabase.from("profiles").select("id", { count: "exact", head: true }).then(({ count }) => setMembers(count ?? 0))
    supabase.from("publications").select("id", { count: "exact", head: true }).then(({ count }) => setPublications(count ?? 0))
  }, [])

  // Compteur animé
  useEffect(() => {
    if (!visible || members === null || publications === null) return
    const duration = 1200
    const start = performance.now()
    const targetM = members
    const targetP = publications
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setAnimated({ members: Math.round(ease * targetM), publications: Math.round(ease * targetP) })
      if (progress < 1) requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  }, [visible, members, publications])

  const stats = [
    { value: animated.members, label: "Familles inscrites", suffix: "+" },
    { value: animated.publications, label: "Souvenirs partagés", suffix: "+" },
    { value: 4, label: "Continents couverts", suffix: "" },
    { value: 100, label: "Sécurisé & privé", suffix: "%" },
  ]

  return (
    <section
      ref={ref}
      className="relative px-4 sm:px-6 md:px-8 py-16 sm:py-24 overflow-hidden"
      style={{ background: "var(--background)" }}
    >
      <div className="orb orb-primary animate-float-slow" style={{ width: 300, height: 300, top: "-10%", right: "5%", opacity: 0.25 }} />

      <div className="max-w-4xl mx-auto">
        <div
          className="text-center mb-12"
          style={{
            transition: "opacity 0.8s, transform 0.8s",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: "var(--primary)" }}>
              Milele en chiffres
            </span>
            <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Une communauté qui grandit chaque jour
          </h2>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 text-center"
              style={{
                background: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                boxShadow: "0 4px 24px color-mix(in srgb, var(--primary) 6%, transparent)",
                transition: `opacity 0.7s ${i * 0.1 + 0.2}s, transform 0.7s ${i * 0.1 + 0.2}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)",
              }}
            >
              <p
                className="text-3xl sm:text-4xl font-bold mb-1 gradient-text"
                style={{ fontVariantNumeric: "tabular-nums" }}
              >
                {stat.value}{stat.suffix}
              </p>
              <p className="text-xs leading-tight" style={{ color: "var(--muted-foreground)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorksSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const steps = [
    { num: "01", title: "Créez votre profil", desc: "Inscrivez-vous en quelques secondes. Votre espace privé, sécurisé, prêt à l'emploi.", icon: "🌱" },
    { num: "02", title: "Partagez vos souvenirs", desc: "Photos, vidéos, lettres, directives… Tout ce qui compte, organisé en un seul endroit.", icon: "💚" },
    { num: "03", title: "Protégez votre héritage", desc: "Désignez vos proches de confiance. Vos transmissions se feront au bon moment.", icon: "🔐" },
  ]

  return (
    <section ref={ref} className="relative px-4 sm:px-6 md:px-8 py-16 sm:py-24 overflow-hidden"
      style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12"
          style={{ transition: "opacity 0.8s, transform 0.8s", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: "var(--primary)" }}>Simple & intuitif</span>
            <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>Comment ça marche ?</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <div key={i} className="relative p-6 rounded-2xl text-center"
              style={{
                background: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--primary) 15%, var(--border))",
                transition: `opacity 0.7s ${i * 0.15 + 0.2}s, transform 0.7s ${i * 0.15 + 0.2}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
              }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 text-[11px] font-black px-3 py-0.5 rounded-full"
                style={{ background: "var(--primary)", color: "var(--primary-foreground)" }}>
                {step.num}
              </div>
              <div className="text-4xl mb-4 mt-3">{step.icon}</div>
              <h3 className="text-sm font-bold mb-2" style={{ color: "var(--foreground)" }}>{step.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function TestimonialsSection() {
  const ref = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.1 })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const testimonials = [
    {
      name: "Amina K.",
      role: "Membre depuis 2024",
      avatar: "A",
      stars: 5,
      text: "Milele m'a permis d'organiser les souvenirs de mon père décédé. Toute la famille peut maintenant accéder à ses photos et ses lettres. Un trésor inestimable.",
    },
    {
      name: "Jean-Pierre M.",
      role: "Membre depuis 2023",
      avatar: "J",
      stars: 5,
      text: "J'avais peur que mes directives médicales ne soient pas respectées. Avec Milele, tout est écrit, signé, et mes enfants savent exactement quoi faire.",
    },
    {
      name: "Fatou D.",
      role: "Membre depuis 2024",
      avatar: "F",
      stars: 5,
      text: "Les capsules temporelles sont magnifiques. J'ai écrit un message pour le mariage de ma fille, qui sera livré le jour J. Elle ne le sait pas encore.",
    },
  ]

  return (
    <section ref={ref} className="relative px-4 sm:px-6 md:px-8 py-16 sm:py-24 overflow-hidden"
      style={{ background: "color-mix(in srgb, var(--card) 60%, var(--background))", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12"
          style={{ transition: "opacity 0.8s, transform 0.8s", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)" }}>
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
            <span className="text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: "var(--primary)" }}>Témoignages</span>
            <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>Ce qu&apos;ils en disent</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div key={i} className="p-5 rounded-2xl flex flex-col gap-4"
              style={{
                background: "var(--card)",
                border: "1px solid color-mix(in srgb, var(--primary) 12%, var(--border))",
                boxShadow: "0 4px 20px color-mix(in srgb, var(--primary) 5%, transparent)",
                transition: `opacity 0.7s ${i * 0.15 + 0.2}s, transform 0.7s ${i * 0.15 + 0.2}s`,
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(28px)",
              }}>
              <p className="text-sm leading-relaxed flex-1" style={{ color: "var(--foreground)", fontStyle: "italic" }}>
                &ldquo;{t.text}&rdquo;
              </p>
              <div className="flex items-center gap-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ background: "color-mix(in srgb, var(--primary) 20%, var(--secondary))", color: "var(--primary)" }}>
                  {t.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "var(--foreground)" }}>{t.name}</p>
                  <p className="text-[11px] truncate" style={{ color: "var(--muted-foreground)" }}>{t.role}</p>
                </div>
                <div className="flex gap-0.5 flex-shrink-0">
                  {Array.from({ length: t.stars }).map((_, j) => (
                    <span key={j} className="text-xs" style={{ color: "#F59E0B" }}>★</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FAQSection() {
  const [open, setOpen] = useState<number | null>(null)
  const faqs = [
    { q: "Qu'est-ce que Milele ?", a: "Milele est une plateforme d'héritage numérique qui vous permet de préserver vos souvenirs, volontés et messages pour les générations futures. Tout est sécurisé, privé et accessible par vos proches au moment choisi." },
    { q: "Mes données sont-elles en sécurité ?", a: "Oui. Toutes vos données sont chiffrées et hébergées en Europe (conformité RGPD). Vous contrôlez à tout moment qui peut accéder à quoi et quand." },
    { q: "Comment fonctionne le Cercle de confiance ?", a: "Vous invitez des proches dans votre Cercle. Chaque membre peut avoir un rôle (Gardien, Exécuteur, Proche) et accéder aux contenus que vous leur destinez selon vos paramètres de visibilité." },
    { q: "Qu'est-ce qu'une capsule temporelle ?", a: "Une capsule est un message, une vidéo ou un document que vous rédigez aujourd'hui mais qui ne sera délivré à votre proche qu'à une date précise — anniversaire, mariage, diplôme — ou après votre décès." },
    { q: "Peut-on utiliser Milele en famille ?", a: "Absolument. Chaque membre de la famille peut créer son propre espace Aïon et partager des souvenirs communs. Le fil Cercle permet d'échanger des publications privées entre proches." },
    { q: "L'application fonctionne-t-elle hors connexion ?", a: "Milele est une Progressive Web App (PWA). Vous pouvez l'installer sur votre téléphone et consulter vos contenus même sans internet. Les modifications se synchronisent dès que la connexion est rétablie." },
    { q: "Que se passe-t-il après mon décès ?", a: "Votre Gardien désigné reçoit une notification et peut accéder à votre dossier de succession, vos volontés et les messages que vous avez préparés. Tout se déroule selon vos instructions." },
    { q: "Puis-je supprimer mon compte et mes données ?", a: "Oui, à tout moment. Vous pouvez exporter ou supprimer définitivement l'ensemble de vos données depuis les paramètres de votre profil." },
  ]
  return (
    <section className="py-16 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <span className="text-xs font-semibold uppercase tracking-widest px-3 py-1 rounded-full mb-4 inline-block"
            style={{ background: "color-mix(in srgb, var(--primary) 12%, var(--secondary))", color: "var(--primary)" }}>
            FAQ
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--foreground)" }}>
            Questions fréquentes
          </h2>
          <p className="text-sm mt-2" style={{ color: "var(--muted-foreground)" }}>
            Tout ce que vous devez savoir sur Milele
          </p>
        </div>
        <div className="flex flex-col gap-2">
          {faqs.map((faq, i) => (
            <div key={i} className="rounded-2xl overflow-hidden"
              style={{ background: "var(--card)", border: `1px solid ${open === i ? "color-mix(in srgb, var(--primary) 35%, var(--border))" : "var(--border)"}` }}>
              <button className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
                onClick={() => setOpen(open === i ? null : i)}>
                <span className="text-sm font-semibold" style={{ color: "var(--foreground)" }}>{faq.q}</span>
                <span className="flex-shrink-0 text-lg leading-none transition-transform duration-200"
                  style={{ color: "var(--primary)", transform: open === i ? "rotate(45deg)" : "rotate(0deg)" }}>+</span>
              </button>
              {open === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm leading-relaxed" style={{ color: "var(--muted-foreground)" }}>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function InternalLinksSection() {
  const links = [
    { href: "/hommages", label: "Hommages" },
    { href: "/accompagnement", label: "Accompagnement" },
    { href: "/souvenirs", label: "Souvenirs" },
    { href: "/mon-arbre", label: "Mon Arbre" },
    { href: "/contact", label: "Contact" },
  ]

  return (
    <section className="py-14 px-4 sm:px-6" style={{ background: "var(--background)" }}>
      <div className="max-w-4xl mx-auto rounded-3xl p-6 sm:p-8" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
        <h2 className="text-2xl sm:text-3xl font-bold mb-3" style={{ color: "var(--foreground)" }}>
          Explorer Milele
        </h2>
        <h3 className="text-sm font-semibold mb-5" style={{ color: "var(--muted-foreground)" }}>
          Accès rapide aux rubriques principales
        </h3>
        <nav aria-label="Liens internes principaux" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex items-center justify-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all hover:scale-[1.02]"
              style={{
                background: "color-mix(in srgb, var(--primary) 8%, var(--card))",
                color: "var(--primary)",
                border: "1px solid color-mix(in srgb, var(--primary) 20%, var(--border))",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </section>
  )
}

function MileleOneSignatureSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = sectionRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect() } },
      { threshold: 0.12 }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={sectionRef}
      className="relative px-4 sm:px-6 md:px-8 py-20 sm:py-32 border-t overflow-hidden"
      style={{
        borderColor: "color-mix(in srgb, var(--primary) 12%, var(--border))",
        background: "var(--background)",
      }}
    >
      {/* Orbes décoratifs */}
      <div className="orb orb-primary animate-float-slow" style={{ width: 480, height: 480, top: "-20%", left: "-10%", opacity: 0.5 }} />
      <div className="orb orb-accent animate-float-medium" style={{ width: 320, height: 320, bottom: "-10%", right: "-5%", opacity: 0.4 }} />

      {/* Étoiles scintillantes */}
      {[
        { top: "15%", left: "8%",  delay: "delay-100" },
        { top: "25%", right: "12%", delay: "delay-400" },
        { top: "65%", left: "15%", delay: "delay-200" },
        { top: "80%", right: "20%", delay: "delay-600" },
        { top: "45%", left: "3%",  delay: "delay-300" },
      ].map((s, i) => (
        <div key={i} className={`absolute w-1 h-1 rounded-full animate-twinkle ${s.delay}`}
          style={{ ...s, background: "var(--primary)", boxShadow: "0 0 6px var(--primary)" }} />
      ))}

      <div
        className="relative mx-auto max-w-5xl rounded-3xl p-8 sm:p-14 text-center border noise-overlay"
        style={{
          borderColor: "color-mix(in srgb, var(--primary) 25%, transparent)",
          background: "color-mix(in srgb, var(--card) 88%, transparent)",
          boxShadow: "0 24px 80px color-mix(in srgb, var(--primary) 12%, transparent), 0 0 0 1px color-mix(in srgb, var(--primary) 8%, transparent), inset 0 1px 0 oklch(1 0 0 / 0.08)",
          backdropFilter: "blur(24px)",
          transition: "opacity 0.9s cubic-bezier(0.22,1,0.36,1), transform 0.9s cubic-bezier(0.22,1,0.36,1)",
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(48px)",
        }}
      >
        {/* Label */}
        <div className="inline-flex items-center gap-3 mb-8"
          style={{ transition: "opacity 0.7s 0.1s", opacity: visible ? 1 : 0 }}>
          <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
          <span className="text-[10px] sm:text-xs tracking-[0.3em] uppercase font-bold"
            style={{ color: "var(--primary)" }}>Notre signature</span>
          <div className="h-px w-8 rounded-full" style={{ background: "var(--primary)", opacity: 0.4 }} />
        </div>

        {/* Phrase calligraphique avec gradient */}
        <div style={{ transition: "opacity 0.9s 0.25s, transform 0.9s 0.25s", opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(28px)" }}>
          <p className="text-4xl sm:text-6xl md:text-7xl leading-[1.05] tracking-wide gradient-text"
            style={{
              fontFamily: '"Palatino Linotype", Palatino, "Book Antiqua", Georgia, serif',
              fontStyle: "italic", fontWeight: 400,
              filter: "drop-shadow(0 0 40px color-mix(in srgb, var(--primary) 25%, transparent))",
            }}>
            <em>Kwa sababu ime stahili</em>
          </p>
        </div>

        {/* Traduction */}
        <p className="mt-3 text-sm sm:text-base tracking-[0.06em]"
          style={{
            color: "var(--primary)", opacity: visible ? 0.75 : 0, fontStyle: "italic",
            fontFamily: '"Palatino Linotype", Palatino, Georgia, serif',
            transition: "opacity 0.8s 0.4s",
          }}>
          — Parce qu&apos;il le mérite.
        </p>

        {/* Séparateur ornemental */}
        <div className="flex items-center justify-center gap-4 my-8"
          style={{ transition: "opacity 0.7s 0.5s", opacity: visible ? 0.6 : 0 }}>
          <div className="h-px flex-1 max-w-[80px] rounded-full" style={{ background: "linear-gradient(90deg, transparent, var(--primary))" }} />
          <div className="flex items-center gap-1.5">
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--primary)" }} />
            <div className="w-1.5 h-1.5 rounded-full animate-halo-pulse" style={{ background: "var(--primary)" }} />
            <div className="w-1 h-1 rounded-full" style={{ background: "var(--primary)" }} />
          </div>
          <div className="h-px flex-1 max-w-[80px] rounded-full" style={{ background: "linear-gradient(90deg, var(--primary), transparent)" }} />
        </div>

        {/* Description */}
        <p className="text-sm sm:text-lg max-w-2xl mx-auto leading-relaxed"
          style={{
            color: "var(--muted-foreground)",
            transition: "opacity 0.8s 0.55s, transform 0.8s 0.55s",
            opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(16px)",
          }}>
          Nos produits signature{" "}
          <span className="gradient-text font-bold">Milele One</span>{" "}
          ont été pensés pour les familles qui désirent garder à leurs côtés
          une présence de l&apos;être cher, digne, unique et éternelle.
        </p>

        {/* Badges caractéristiques */}
        <div className="flex flex-wrap justify-center gap-2 mt-6"
          style={{ transition: "opacity 0.8s 0.65s", opacity: visible ? 1 : 0 }}>
          {["Dignité", "Beauté", "Humanité", "Pour toujours"].map((tag, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide"
              style={{
                background: "color-mix(in srgb, var(--primary) 10%, var(--card))",
                border: "1px solid color-mix(in srgb, var(--primary) 25%, transparent)",
                color: "var(--primary)",
              }}>
              {tag}
            </span>
          ))}
        </div>

        {/* Bouton */}
        <div className="mt-10 flex justify-center"
          style={{ transition: "opacity 0.8s 0.75s, transform 0.8s 0.75s", opacity: visible ? 1 : 0, transform: visible ? "translateY(0) scale(1)" : "translateY(20px) scale(0.95)" }}>
          <Link href="/milele-one" className="inline-flex btn-glow">
            <ShaderLiquidMetalButton
              label="Découvrir Milele One"
              width={320} height={62} fontSize={16} tinted
              leftIcon={
                <svg viewBox="0 0 20 20" width={18} height={18} fill="none">
                  <path d="M10 2l1.9 5.8H18l-4.9 3.6 1.9 5.8L10 13.6l-5 3.6 1.9-5.8L2 8h6.1z" fill="currentColor" opacity="0.9" />
                </svg>
              }
            />
          </Link>
        </div>
      </div>
    </section>
  )
}
