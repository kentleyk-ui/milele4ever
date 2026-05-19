"use client"

import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabaseClient"
import type { ContentItem, ContentItemUpdate, ContentType } from "@/types/aion"

type UseAionContentArg = ContentType | { type?: ContentType; limit?: number }

export function useAionContent(arg?: UseAionContentArg) {
  const type = typeof arg === "string" ? arg : arg?.type
  const limit = typeof arg === "object" && arg !== null ? arg.limit : undefined

  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setItems([]); setLoading(false); return }

      let query = supabase
        .from("content_items")
        .select("*")
        .eq("owner_id", user.id)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false })

      if (type) query = query.eq("content_type", type)
      if (limit) query = query.limit(limit)

      const { data, error: err } = await query
      if (err) { setError(err.message); setItems([]) }
      else setItems((data as ContentItem[]) ?? [])
    } catch (e) {
      setError("Erreur de connexion")
    } finally {
      setLoading(false)
    }
  }, [type, limit])

  useEffect(() => { fetchContent() }, [fetchContent])

  const createItem = useCallback(async (
    item: Omit<ContentItem, "id" | "owner_id" | "created_at" | "updated_at">
  ) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: "Non authentifié" }

    const { data, error: err } = await supabase
      .from("content_items")
      .insert({ ...item, owner_id: user.id })
      .select()
      .single()

    if (!err) await fetchContent()
    return { data: data as ContentItem | null, error: err?.message ?? null }
  }, [fetchContent])

  const updateItem = useCallback(async (id: string, updates: ContentItemUpdate) => {
    const { error: err } = await supabase
      .from("content_items")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (!err) await fetchContent()
    return { error: err?.message ?? null }
  }, [fetchContent])

  const deleteItem = useCallback(async (id: string) => {
    const { error: err } = await supabase
      .from("content_items")
      .delete()
      .eq("id", id)

    if (!err) await fetchContent()
    return { error: err?.message ?? null }
  }, [fetchContent])

  return { items, loading, error, createItem, updateItem, deleteItem, refresh: fetchContent }
}
