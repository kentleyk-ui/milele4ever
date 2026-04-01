"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Upload, Loader2, Image as ImageIcon, Video, X } from "lucide-react"

interface UploadMediaButtonProps {
  memorialId: string
  postId?: string
}

export function UploadMediaButton({ memorialId, postId }: UploadMediaButtonProps) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [caption, setCaption] = useState("")
  const [takenAt, setTakenAt] = useState("")

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      // Create preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader()
        reader.onloadend = () => {
          setPreview(reader.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setPreview(null)
      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("file", selectedFile)
      formData.append("memorialId", memorialId)
      if (postId) formData.append("postId", postId)
      if (caption) formData.append("caption", caption)
      if (takenAt) formData.append("takenAt", takenAt)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Upload failed")
      }

      // Reset form
      setSelectedFile(null)
      setPreview(null)
      setCaption("")
      setTakenAt("")
      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Upload error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const clearSelection = () => {
    setSelectedFile(null)
    setPreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>
        <Button size="icon" variant="ghost">
          <Plus className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Ajouter un media</DialogTitle>
          <DialogDescription>
            Partagez une photo ou une video
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* File Selection */}
          {!selectedFile ? (
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-1">
                Cliquez pour selectionner un fichier
              </p>
              <p className="text-xs text-muted-foreground">
                Images et videos acceptees
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : (
            <div className="relative">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full rounded-lg object-cover aspect-video"
                />
              ) : (
                <div className="w-full rounded-lg bg-muted aspect-video flex items-center justify-center">
                  <Video className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <Button
                variant="secondary"
                size="icon"
                className="absolute top-2 right-2"
                onClick={clearSelection}
              >
                <X className="h-4 w-4" />
              </Button>
              <p className="text-sm text-muted-foreground mt-2 truncate">
                {selectedFile.name}
              </p>
            </div>
          )}

          {/* Caption */}
          <div>
            <Label htmlFor="caption">Legende (optionnel)</Label>
            <Textarea
              id="caption"
              placeholder="Decrivez ce souvenir..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Date taken */}
          <div>
            <Label htmlFor="takenAt">Date de prise (optionnel)</Label>
            <Input
              id="takenAt"
              type="date"
              value={takenAt}
              onChange={(e) => setTakenAt(e.target.value)}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Annuler
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Telecharger
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
