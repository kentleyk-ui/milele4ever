"use client"

import { useState, useEffect } from "react"
import { LiquidMetalButton } from "./DynamicLiquidMetalButton"
import { useLocale } from "@/lib/locale-context"

function ArrowUpIcon() {
  return (
    <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5" />
      <path d="M5 12l7-7 7 7" />
    </svg>
  )
}

export function ScrollToTop() {
  const { t } = useLocale()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 400)
    }
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div
      className="fixed z-50 transition-all duration-300"
      style={{
        bottom: 120,
        right: 20,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0) scale(1)" : "translateY(8px) scale(0.85)",
        filter: "drop-shadow(0 1px 3px oklch(0.10 0.03 150 / 0.15))",
      }}
    >
      <LiquidMetalButton
        viewMode="icon"
        width={48}
        height={48}
        tinted
        iconNode={<ArrowUpIcon />}
        label={t('scroll.top')}
        aria-label={t('scroll.top')}
        tabIndex={0}
        onClick={scrollToTop}
        className="focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
    </div>
  )
}
