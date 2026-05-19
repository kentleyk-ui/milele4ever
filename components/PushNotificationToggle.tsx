"use client"

import { useEffect, useState } from "react"
import { Bell, BellOff } from "lucide-react"
import { supabase } from "@/lib/supabaseClient"

export function PushNotificationToggle() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  async function checkSubscription() {
    const reg = await navigator.serviceWorker.ready
    const sub = await reg.pushManager.getSubscription()
    setSubscribed(!!sub)
  }

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && "serviceWorker" in navigator && "PushManager" in window) {
      setSupported(true)
      setPermission(Notification.permission)
      void checkSubscription()
    }
  }, [])

  const subscribe = async () => {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== "granted") { setLoading(false); return }

      const reg = await navigator.serviceWorker.ready
      // Utilise une VAPID key publique (doit être configurée en env var en prod)
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) { setLoading(false); return }

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      })

      const session = (await supabase.auth.getSession()).data.session
      if (session) {
        await fetch("/api/push-subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
          body: JSON.stringify({ subscription: sub.toJSON() }),
        })
      }
      setSubscribed(true)
    } catch (e) {
      console.error("Erreur push subscribe", e)
    }
    setLoading(false)
  }

  const unsubscribe = async () => {
    setLoading(true)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const session = (await supabase.auth.getSession()).data.session
        if (session) {
          await fetch("/api/push-subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          })
        }
        await sub.unsubscribe()
      }
      setSubscribed(false)
    } catch (e) {
      console.error("Erreur push unsubscribe", e)
    }
    setLoading(false)
  }

  if (!supported) return null

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl"
      style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center gap-3">
        {subscribed
          ? <Bell size={16} style={{ color: "var(--primary)" }} />
          : <BellOff size={16} style={{ color: "var(--muted-foreground)" }} />}
        <div>
          <p className="text-sm font-medium" style={{ color: "var(--foreground)" }}>
            Notifications push
          </p>
          <p className="text-xs" style={{ color: "var(--muted-foreground)" }}>
            {subscribed ? "Activées sur cet appareil" : permission === "denied" ? "Bloquées par le navigateur" : "Recevez les alertes en temps réel"}
          </p>
        </div>
      </div>
      {permission !== "denied" && (
        <button
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          style={{
            background: subscribed ? "var(--secondary)" : "var(--primary)",
            color: subscribed ? "var(--muted-foreground)" : "var(--primary-foreground)",
          }}
        >
          {loading ? "..." : subscribed ? "Désactiver" : "Activer"}
        </button>
      )}
    </div>
  )
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i)
  return buffer
}
