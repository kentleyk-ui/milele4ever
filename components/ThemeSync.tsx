"use client"

import { useEffect } from "react"

const THEME_KEY = "theme-preference"

function applyTheme(mode: string) {
  const root = document.documentElement
  const isDark = mode === "dark" || (mode === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)

  root.classList.toggle("dark", isDark)
}

export default function ThemeSync() {
  useEffect(() => {
    const savedTheme = localStorage.getItem(THEME_KEY) || "system"
    applyTheme(savedTheme)

    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const handleSystemChange = () => {
      const current = localStorage.getItem(THEME_KEY) || "system"
      if (current === "system") {
        applyTheme("system")
      }
    }

    const handleStorage = (event: StorageEvent) => {
      if (event.key === THEME_KEY) {
        applyTheme(event.newValue || "system")
      }
    }

    media.addEventListener("change", handleSystemChange)
    window.addEventListener("storage", handleStorage)

    return () => {
      media.removeEventListener("change", handleSystemChange)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  return null
}