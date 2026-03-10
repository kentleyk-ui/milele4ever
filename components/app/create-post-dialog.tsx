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
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { MessageSquare, Heart, Image as ImageIcon, Loader2 } from "lucide-react"

interface CreatePostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memorialId: string
  userId: string
}

export function CreatePostDialog({ open, onOpenChange, memorialId, userId }: CreatePostDialogProps) {
  const router = useRouter()
  const supabase = createClient()
  const [content, setContent] = useState("")
  const [postType, setPostType] = useState("memory")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!content.trim()) return
    
    setIsLoading(true)
    try {
      await supabase.from("posts").insert({
        memorial_id: memorialId,
        author_id: userId,
        content: content.trim(),
        post_type: postType,
      })
      
      setContent("")
      setPostType("memory")
      onOpenChange(false)
      router.refresh()
    } catch (error) {
      console.error("Error creating post:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Partager un souvenir</DialogTitle>
          <DialogDescription>
            Partagez un souvenir, une histoire ou un hommage
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div>
            <Label className="mb-3 block">Type de publication</Label>
            <RadioGroup
              value={postType}
              onValueChange={setPostType}
              className="flex gap-2"
            >
              <label className="flex-1 cursor-pointer">
                <div className={`p-3 rounded-lg border-2 transition-colors text-center ${postType === 'memory' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="memory" className="sr-only" />
                  <MessageSquare className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Souvenir</p>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <div className={`p-3 rounded-lg border-2 transition-colors text-center ${postType === 'tribute' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="tribute" className="sr-only" />
                  <Heart className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Hommage</p>
                </div>
              </label>
              <label className="flex-1 cursor-pointer">
                <div className={`p-3 rounded-lg border-2 transition-colors text-center ${postType === 'photo' ? 'border-primary bg-primary/5' : 'border-muted'}`}>
                  <RadioGroupItem value="photo" className="sr-only" />
                  <ImageIcon className="h-5 w-5 mx-auto mb-1" />
                  <p className="text-xs font-medium">Photo</p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div>
            <Label htmlFor="content">Votre message</Label>
            <Textarea
              id="content"
              placeholder="Partagez votre souvenir..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              className="mt-2"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={isLoading || !content.trim()}>
            {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Publier
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
