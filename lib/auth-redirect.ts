const DEFAULT_APP_URL = "https://www.milele4ever.com";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getPublicAppUrl() {
  if (typeof window !== "undefined" && window.location.origin) {
    return trimTrailingSlash(window.location.origin);
  }

  const envUrl = process.env.NEXT_PUBLIC_APP_URL
    ?? process.env.NEXT_PUBLIC_SITE_URL
    ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : undefined)
    ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
    ?? DEFAULT_APP_URL;

  return trimTrailingSlash(envUrl);
}

export function buildAuthRedirect(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${getPublicAppUrl()}${normalizedPath}`;
}