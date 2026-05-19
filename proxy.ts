import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function proxy(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } })

  const path = request.nextUrl.pathname

  // Routes API — laisser passer
  if (path.startsWith("/api")) return response

  // Force no-cache pour /hommages
  if (path === "/hommages") {
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate, max-age=0, s-maxage=0')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
  }

  return response
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
