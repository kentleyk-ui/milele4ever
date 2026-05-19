"use client"

import { useEffect } from "react"
import { useLocale } from "@/lib/locale-context"

export function LangSetter() {
  const { lang } = useLocale()

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return null
}
