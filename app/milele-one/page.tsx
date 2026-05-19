import type { Metadata } from "next"
import styles from "./page.module.css"
import { HeroCTA, BottomCTA } from "./MileleOneCTA"

export const metadata: Metadata = {
  title: "Milele One — Urnes intelligentes sur mesure",
  description:
    "Milele One est une gamme sur demande d'urnes intelligentes, imprimées en 3D haut de gamme, conçues par Monark et en partenariat avec Daniel Lannot.",
}

const steps = [
  {
    num: "01",
    title: "Vous guidez",
    text: "Vous décrivez vos souhaits, vos préférences esthétiques et les particularités qui rendent cet hommage unique.",
  },
  {
    num: "02",
    title: "Monark conçoit",
    text: "Notre IA de seconde génération calcule et génère votre modèle 3D sur mesure, en collaboration avec Daniel Lannot.",
  },
  {
    num: "03",
    title: "Impression haut de gamme",
    text: "Votre urne est imprimée avec des équipements 3D haute précision pour un rendu noble, précis et durable.",
  },
  {
    num: "04",
    title: "Livraison activée",
    text: "Votre Milele One est livrée déjà activée et prête, dans les délais convenus.",
  },
]

const cardPillars = [
  "Impression 3D haut de gamme sur mesure",
  "Design personnalisé selon vos indications",
  "Livraison déjà activée dans les délais",
]

const aiFeatures = [
  "Analyse de vos indications esthétiques",
  "Génération de modèles 3D personnalisés",
  "Optimisation structurelle et ornementale",
  "Validation collaborative avec Daniel Lannot",
]



export default function MileleOnePage() {
  return (
    <main className={styles.page}>
      <svg className={styles.svg} aria-hidden="true" focusable="false">
        <defs>
          <filter id="milele-one-electric-displace" colorInterpolationFilters="sRGB" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise1" seed="1" />
            <feOffset in="noise1" dx="0" dy="0" result="offsetNoise1">
              <animate attributeName="dy" values="700;0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise2" seed="1" />
            <feOffset in="noise2" dx="0" dy="0" result="offsetNoise2">
              <animate attributeName="dy" values="0;-700" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise3" seed="2" />
            <feOffset in="noise3" dx="0" dy="0" result="offsetNoise3">
              <animate attributeName="dx" values="490;0" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves="10" result="noise4" seed="2" />
            <feOffset in="noise4" dx="0" dy="0" result="offsetNoise4">
              <animate attributeName="dx" values="0;-490" dur="6s" repeatCount="indefinite" calcMode="linear" />
            </feOffset>
            <feComposite in="offsetNoise1" in2="offsetNoise2" result="part1" />
            <feComposite in="offsetNoise3" in2="offsetNoise4" result="part2" />
            <feBlend in="part1" in2="part2" mode="color-dodge" result="combinedNoise" />
            <feDisplacementMap in="SourceGraphic" in2="combinedNoise" scale="26" xChannelSelector="R" yChannelSelector="B" />
          </filter>
        </defs>
      </svg>

      <div className={styles.backdrop} />

      <div className={styles.shell}>

        {/* ── SECTION 1 : Hero ── */}
        <section className={styles.hero}>
          <div>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Milele One
            </span>
            <h1 className={styles.title}>
              Garder le meilleur
              <br />des souvenirs
              <span className={styles.script}>Parce qu&apos;il le mérite.</span>
            </h1>
            <p className={styles.lead}>
              <strong>Milele One</strong> est une gamme sur demande d&apos;urnes intelligentes,
              imprimées sur mesure avec des imprimantes 3D haut de gamme et personnalisées —
              pour garder auprès de vous une présence digne, unique et éternelle.
            </p>
            <div className={styles.badges}>
              {["Impression 3D", "Sur mesure", "IA Monark", "Daniel Lannot", "Livré activé"].map((b) => (
                <span key={b} className={styles.badge}>{b}</span>
              ))}
            </div>
            <HeroCTA />
          </div>

          <div className={styles.frame}>
            <div className={styles.frameGlow} />
            <div className={styles.electricCard}>
              <div className={styles.electricInner}>
                <div className={styles.cardContent}>
                  <div className={styles.cardTop}>
                    <span className={styles.cardLabel}>Signature</span>
                    <h2 className={styles.cardTitle}>Milele One</h2>
                    <p className={styles.cardIntro}>
                      En partenariat avec Daniel Lannot. Design calculé et généré par Monark,
                      notre IA de seconde génération.
                    </p>
                    <div className={styles.orbit}>
                      <div className={styles.orbitCard}>
                        <div className={styles.orbitValue}>3D</div>
                        <div className={styles.orbitLabel}>Impression haut de gamme sur mesure.</div>
                      </div>
                      <div className={styles.orbitCard}>
                        <div className={styles.orbitValue}>∞</div>
                        <div className={styles.orbitLabel}>Livré activé, dans les délais.</div>
                      </div>
                    </div>
                  </div>
                  <div>
                    <hr className={styles.cardDivider} />
                    <div className={styles.cardBottom}>
                      {cardPillars.map((item) => (
                        <div key={item} className={styles.detailItem}>
                          <span className={styles.detailDot} />
                          <p className={styles.detailText}>{item}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 2 : Processus ── */}
        <section className={styles.process}>
          <div className={styles.sectionHead}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Processus
            </span>
            <h2 className={styles.sectionTitle}>De votre vision à votre Milele One</h2>
            <p className={styles.sectionSub}>
              Un parcours guidé, de vos premières indications jusqu&apos;à la livraison activée.
            </p>
          </div>
          <div className={styles.processGrid}>
            {steps.map((step, i) => (
              <div key={step.num} className={styles.processStep}>
                <div className={styles.stepNumWrap}>
                  <span className={styles.stepNum}>{step.num}</span>
                </div>
                <div className={styles.stepBody}>
                  <h3 className={styles.stepTitle}>{step.title}</h3>
                  <p className={styles.stepText}>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── SECTION 3 : Monark IA ── */}
        <section className={styles.aiSection}>
          <div className={styles.aiLeft}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Intelligence artificielle
            </span>
            <h2 className={styles.sectionTitle}>
              Conçu par Monark,
              <br />notre IA de seconde génération
            </h2>
            <p className={styles.aiText}>
              Monark ne se contente pas de générer un modèle — il comprend vos indications,
              les traduit en formes, proportions et ornements, puis valide chaque détail avec
              le designer Daniel Lannot pour un résultat unique.
            </p>
            <ul className={styles.aiList}>
              {aiFeatures.map((f) => (
                <li key={f} className={styles.aiListItem}>
                  <span className={styles.aiDot} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
          <div className={styles.aiRight}>
            <div className={styles.monarkCard}>
              <div className={styles.monarkGlow} />
              <div className={styles.monarkOrb}>
                <svg viewBox="0 0 80 80" width="80" height="80" fill="none" aria-hidden="true">
                  <circle cx="40" cy="40" r="36" stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
                  <circle cx="40" cy="40" r="26" stroke="rgba(255,255,255,0.18)" strokeWidth="1" />
                  <circle cx="40" cy="40" r="12" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.35)" strokeWidth="1.2" />
                  <path d="M40 14 L40 28" stroke="white" strokeWidth="1.5" opacity="0.6" />
                  <path d="M40 52 L40 66" stroke="white" strokeWidth="1.5" opacity="0.6" />
                  <path d="M14 40 L28 40" stroke="white" strokeWidth="1.5" opacity="0.6" />
                  <path d="M52 40 L66 40" stroke="white" strokeWidth="1.5" opacity="0.6" />
                  <path d="M23.5 23.5 L33 33" stroke="white" strokeWidth="1" opacity="0.4" />
                  <path d="M47 47 L56.5 56.5" stroke="white" strokeWidth="1" opacity="0.4" />
                  <path d="M56.5 23.5 L47 33" stroke="white" strokeWidth="1" opacity="0.4" />
                  <path d="M33 47 L23.5 56.5" stroke="white" strokeWidth="1" opacity="0.4" />
                </svg>
              </div>
              <div className={styles.monarkLabel}>Monark</div>
              <div className={styles.monarkSub}>IA de Seconde Génération</div>
              <div className={styles.monarkSpecs}>
                <div className={styles.monarkSpec}>
                  <span className={styles.monarkSpecVal}>Gen 2</span>
                  <span className={styles.monarkSpecLabel}>Version</span>
                </div>
                <div className={styles.monarkSpecDiv} />
                <div className={styles.monarkSpec}>
                  <span className={styles.monarkSpecVal}>3D</span>
                  <span className={styles.monarkSpecLabel}>Modélisation</span>
                </div>
                <div className={styles.monarkSpecDiv} />
                <div className={styles.monarkSpec}>
                  <span className={styles.monarkSpecVal}>100%</span>
                  <span className={styles.monarkSpecLabel}>Personnalisé</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── SECTION 4 : Partenaire Daniel Lannot ── */}
        <section className={styles.partner}>
          <div className={styles.partnerInner}>
            <span className={styles.eyebrow}>
              <span className={styles.eyebrowDot} />
              Partenariat design
            </span>
            <h2 className={styles.sectionTitle}>
              En partenariat avec
              <br />Daniel Lannot
            </h2>
            <p className={styles.partnerText}>
              Chaque modèle Milele One est façonné en étroite collaboration avec Daniel Lannot —
              un designer dont le regard sensible et l&apos;exigence formelle garantissent que
              chaque pièce est à la hauteur de ce qu&apos;elle représente.
            </p>
            <div className={`${styles.badges} ${styles.centeredBadges}`}>
              {["Design haut de gamme", "Collaboration IA + humain", "Validation pièce par pièce"].map((t) => (
                <span key={t} className={styles.badge}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── SECTION 5 : CTA finale ── */}
        <section className={styles.ctaSection}>
          <div className={styles.ctaGlow} />
          <span className={styles.ctaOverline}>Milele One</span>
          <h2 className={styles.ctaTitle}>
            Prêt à créer
            <br />une présence éternelle&nbsp;?
          </h2>
          <p className={styles.ctaText}>
            Commencez votre demande. Nous vous accompagnons de votre première indication
            jusqu&apos;à la livraison.
          </p>
          <BottomCTA />
        </section>

      </div>
    </main>
  )
}