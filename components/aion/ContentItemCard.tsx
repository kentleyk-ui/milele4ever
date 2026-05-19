"use client"

import { useState } from "react"
import Image from "next/image"
import { Trash2, Edit2, MoreVertical, X } from "lucide-react"
import VisibilityBadge from "@/components/aion/VisibilityBadge"
import { formatDate } from "@/lib/aion-dates"
import type { ContentItem } from "@/types/aion"

interface ContentItemCardProps {
  item: ContentItem
  onEdit?: (item: ContentItem) => void
  onDelete?: (id: string) => void
}

export default function ContentItemCard({ item, onEdit, onDelete }: ContentItemCardProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleDelete = () => {
    if (confirmDelete) {
      onDelete?.(item.id)
      setConfirmDelete(false)
      setMenuOpen(false)
    } else {
      setConfirmDelete(true)
    }
  }

  return (
    <div
      className="relative p-4 sm:p-5 rounded-2xl transition-all"
      style={{
        background: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <h4
            className="text-sm font-semibold leading-snug truncate"
            style={{ color: "var(--foreground)" }}
          >
            {item.title || "Sans titre"}
          </h4>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--muted-foreground)" }}>
            {formatDate(item.updated_at ?? item.created_at)}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <VisibilityBadge level={item.visibility} />
          {(onEdit || onDelete) && (
            <div className="relative">
              <button
                onClick={() => { setMenuOpen(!menuOpen); setConfirmDelete(false) }}
                className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors touch-manipulation"
                style={{
                  background: menuOpen ? "var(--secondary)" : "transparent",
                  color: "var(--muted-foreground)",
                  minWidth: 32,
                  minHeight: 32,
                }}
                aria-label="Options"
              >
                {menuOpen ? <X size={14} /> : <MoreVertical size={14} />}
              </button>

              {menuOpen && (
                <div
                  className="absolute right-0 top-10 z-20 w-40 rounded-xl shadow-lg overflow-hidden"
                  style={{ background: "var(--card)", border: "1px solid var(--border)" }}
                >
                  {onEdit && (
                    <button
                      onClick={() => { onEdit(item); setMenuOpen(false) }}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm transition-colors touch-manipulation"
                      style={{ color: "var(--foreground)", minHeight: 44 }}
                    >
                      <Edit2 size={14} style={{ color: "var(--primary)" }} />
                      Modifier
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={handleDelete}
                      className="flex items-center gap-2 w-full px-4 py-3 text-sm transition-colors touch-manipulation"
                      style={{ color: confirmDelete ? "#EF4444" : "var(--foreground)", minHeight: 44 }}
                    >
                      <Trash2 size={14} style={{ color: "#EF4444" }} />
                      {confirmDelete ? "Confirmer ?" : "Supprimer"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      {item.body && (
        <p
          className="text-sm leading-relaxed line-clamp-3 mt-2"
          style={{ color: "var(--muted-foreground)" }}
        >
          {item.body}
        </p>
      )}

      {/* Media gallery */}
      {item.media_urls?.length > 0 && (
        <div className="grid grid-cols-2 gap-1.5 mt-3 rounded-xl overflow-hidden">
          {item.media_urls.slice(0, 4).map((url, i) => {
            const isVideo = /\.(mp4|webm|ogg|mov)(\?|$)/i.test(url)
            const isLast = i === 3 && item.media_urls.length > 4
            return (
              <div key={url} className="relative rounded-xl overflow-hidden" style={{ aspectRatio: "4/3" }}>
                {isVideo ? (
                  <video src={url} muted playsInline className="w-full h-full object-cover" />
                ) : (
                  <Image src={url} alt="Image du souvenir" width={800} height={600} loading="lazy" unoptimized className="w-full h-full object-cover" />
                )}
                {isLast && (
                  <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-white"
                    style={{ background: "rgba(0,0,0,0.55)" }}>+{item.media_urls.length - 3}</div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Tags */}
      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {item.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="text-[11px] px-2 py-0.5 rounded-full"
              style={{
                background: "color-mix(in srgb, var(--primary) 12%, transparent)",
                color: "var(--primary)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
