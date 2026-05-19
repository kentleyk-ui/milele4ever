"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

function getScope(pathname: string): "public" | "staff" {
  if (pathname.startsWith("/staff") || pathname.startsWith("/admin")) {
    return "staff"
  }
  return "public"
}

export default function RouteScope() {
  const pathname = usePathname()

  useEffect(() => {
    const scope = getScope(pathname)
    document.body.dataset.scope = scope
  }, [pathname])

  return null
}
