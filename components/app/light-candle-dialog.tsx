"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Flame, Loader2 } from "lucide-react"

interface LightCandleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memorialId: string
  userId: string
}

export function LightCandleDialog({ open, onOpenChange, memorialId, userId }: LightCandleDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const [message, setMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    setIsLoading(true)
    try {
      await supabase.from("candles").insert({
        memorial_id: memorialId,
        lit_by: userId,
        message: message || null,
      })
      
      setMessage("")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error lighting candle:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-amber-500" />
            Allumer une bougie
          </DialogTitle>
          <DialogDescription>
            Allumez une bougie virtuelle en memoire de cette personne
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="w-16 h-24 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-full" />
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-4 h-8 bg-gradient-to-t from-amber-500 via-orange-400 to-yellow-300 rounded-full animate-pulse" />
            </div>
          </div>

          <Textarea
            placeholder="Ajoutez un message (optionnel)..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Allumer la bougie
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
