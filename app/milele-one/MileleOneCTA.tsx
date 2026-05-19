"use client"

import Link from "next/link"
import { LiquidMetalButton } from "@/components/DynamicLiquidMetalButton"
import styles from "./page.module.css"

function StarIcon() {
  return (
    <svg viewBox="0 0 20 20" width={18} height={18} fill="none">
      <path d="M10 2l1.9 5.8H18l-4.9 3.6 1.9 5.8L10 13.6l-5 3.6 1.9-5.8L2 8h6.1z" fill="currentColor" opacity="0.92" />
    </svg>
  )
}

export function HeroCTA() {
  return (
    <div className={styles.actions}>
      <Link href="/inscription" className="inline-flex btn-glow">
        <LiquidMetalButton
          label="Commander Milele One"
          width={310} height={62} fontSize={16} tinted
          leftIcon={<StarIcon />}
        />
      </Link>
      <Link href="/" className={styles.ghostLink}>Retour à l&apos;accueil</Link>
    </div>
  )
}

export function BottomCTA() {
  return (
    <div className={styles.ctaActions}>
      <Link href="/inscription" className="inline-flex btn-glow">
        <LiquidMetalButton
          label="Commander Milele One"
          width={310} height={62} fontSize={16} tinted
          leftIcon={<StarIcon />}
        />
      </Link>
      <Link href="/" className={styles.ghostLink}>Retour à l&apos;accueil</Link>
    </div>
  )
}
