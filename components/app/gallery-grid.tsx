"use client"

import { useState } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Play } from "lucide-react"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Media {
  id: string
  url: string
  media_type: string
  caption: string | null
  taken_at: string | null
  created_at: string
  profiles: { full_name: string; avatar_url: string | null } | null
}

interface GalleryGridProps {
  media: Media[]
  memorialId: string
}

export function GalleryGrid({ media, memorialId }: GalleryGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  if (media.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
          <Play className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">Aucune photo ou video</h3>
        <p className="text-muted-foreground text-sm">
          Ajoutez des souvenirs visuels a ce memorial
        </p>
      </div>
    )
  }

  const selectedMedia = selectedIndex !== null ? media[selectedIndex] : null

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < media.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1">
        {media.map((item, index) => (
          <button
            key={item.id}
            onClick={() => setSelectedIndex(index)}
            className="aspect-square relative overflow-hidden rounded-sm group"
          >
            {item.media_type === "video" ? (
              <div className="w-full h-full bg-muted flex items-center justify-center">
                <Play className="h-8 w-8 text-muted-foreground" />
              </div>
            ) : (
              <img
                src={`/api/file?pathname=${encodeURIComponent(item.url)}`}
                alt={item.caption || "Photo"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
            )}
          </button>
        ))}
      </div>

      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Navigation */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            {selectedIndex !== null && selectedIndex < media.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Media display */}
            {selectedMedia && (
              <div className="flex flex-col">
                <div className="flex items-center justify-center min-h-[60vh]">
                  {selectedMedia.media_type === "video" ? (
                    <video
                      src={`/api/file?pathname=${encodeURIComponent(selectedMedia.url)}`}
                      controls
                      className="max-h-[70vh] max-w-full"
                    />
                  ) : (
                    <img
                      src={`/api/file?pathname=${encodeURIComponent(selectedMedia.url)}`}
                      alt={selectedMedia.caption || "Photo"}
                      className="max-h-[70vh] max-w-full object-contain"
                    />
                  )}
                </div>

                {/* Caption and info */}
                <div className="p-4 text-white">
                  {selectedMedia.caption && (
                    <p className="mb-2">{selectedMedia.caption}</p>
                  )}
                  <p className="text-sm text-white/60">
                    {selectedMedia.profiles?.full_name && `Par ${selectedMedia.profiles.full_name} • `}
                    {selectedMedia.taken_at 
                      ? format(new Date(selectedMedia.taken_at), "d MMMM yyyy", { locale: fr })
                      : format(new Date(selectedMedia.created_at), "d MMMM yyyy", { locale: fr })
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
